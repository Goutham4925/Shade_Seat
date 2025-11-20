// sunCalculator.ts
import * as SunCalc from 'suncalc';

export interface SunPosition {
  azimuth: number; // degrees 0-360
  altitude: number; // degrees -90..+90
}

export interface SeatRecommendation {
  sunAzimuth: number;
  heading: number;
  sunPosition: 'LEFT' | 'RIGHT' | 'NIGHT';
  recommendedSide: 'LEFT' | 'RIGHT' | 'ANY';
  angleDifference: number;
  isDaytime: boolean;
  message: string;
  isNight: boolean;
}

/**
 * Check if it's nighttime (after sunset or before sunrise)
 */
export function isNighttime(lat: number, lon: number, date: Date = new Date()): boolean {
  const times = SunCalc.getTimes(date, lat, lon);
  const currentTime = date.getTime();

  const sunrise = times.sunrise.getTime();
  const sunset = times.sunset.getTime();

  // If current time is before sunrise or after sunset, it's nighttime
  return currentTime < sunrise || currentTime > sunset;
}

/**
 * Check if it's daytime (between sunrise and sunset)
 */
export function isDaytime(lat: number, lon: number, date: Date = new Date()): boolean {
  return !isNighttime(lat, lon, date);
}

/**
 * Convert radians to degrees normalized to 0..360 (for azimuth)
 */
function radiansTo360Degrees(rad: number): number {
  const deg = (rad * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Convert radians to signed degrees (for altitude — keep negative possible)
 */
function radiansToSignedDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Get current sun position for given coordinates
 */
export function getSunPosition(lat: number, lon: number, date: Date = new Date()): SunPosition {
  const position = SunCalc.getPosition(date, lat, lon);

  return {
    azimuth: radiansTo360Degrees(position.azimuth),
    altitude: radiansToSignedDegrees(position.altitude),
  };
}

/**
 * Calculate which side of the vehicle the sun is on and recommend a seat
 * Now handles nighttime scenarios
 */
export function calculateSeatRecommendation(
  lat: number,
  lon: number,
  heading: number,
  date: Date = new Date()
): SeatRecommendation {
  const isNight = isNighttime(lat, lon, date);

  if (isNight) {
    return {
      sunAzimuth: 0,
      heading,
      sunPosition: 'NIGHT',
      recommendedSide: 'ANY',
      angleDifference: 0,
      isDaytime: false,
      isNight: true,
      message: "It's currently nighttime - sun position doesn't matter. You can choose any seat comfortably."
    };
  }

  const sunPos = getSunPosition(lat, lon, date);

  // Calculate the difference between sun azimuth and vehicle heading
  // Normalize to -180 to +180
  const diff = ((sunPos.azimuth - heading + 540) % 360) - 180;

  // If diff > 0, sun is on the left side of the vehicle
  // If diff < 0, sun is on the right side of the vehicle
  const sunPosition: 'LEFT' | 'RIGHT' = diff > 0 ? 'LEFT' : 'RIGHT';

  // Recommend the opposite side to avoid sun
  const recommendedSide: 'LEFT' | 'RIGHT' = sunPosition === 'LEFT' ? 'RIGHT' : 'LEFT';

  return {
    sunAzimuth: sunPos.azimuth,
    heading,
    sunPosition,
    recommendedSide,
    angleDifference: Math.abs(diff),
    isDaytime: true,
    isNight: false,
    message: `Sun is on the ${sunPosition.toLowerCase()} side. Recommended seat: ${recommendedSide.toLowerCase()} side to avoid direct sunlight.`
  };
}

/**
 * Convert cardinal direction to degrees
 */
export function cardinalToDegrees(direction: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST'): number {
  const map = {
    NORTH: 0,
    EAST: 90,
    SOUTH: 180,
    WEST: 270,
  };
  return map[direction];
}

/**
 * Convert degrees to cardinal direction
 */
export function degreesToCardinal(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

/**
 * Calculate initial bearing between two geographic points (degrees 0..360)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (radiansTo360Degrees(θ));
}

/**
 * Geocode an address using Nominatim (free OpenStreetMap service)
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'ShadeSafe-Seat-Advisor',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Route-mode sunlight analysis (FREE, using OSRM)
 * Returns which side has MORE SHADE for the full route.
 *
 * origin/destination: { lat, lon }
 * travelDate: Date (the time you plan to travel; used to compute sun position while traveling)
 *
 * Model details:
 * - We ask OSRM for a route polyline
 * - For each segment we:
 *    - compute segment bearing
 *    - compute sun position at the segment midpoint at the time vehicle will be on that segment
 *    - compute a simple exposure weight (segment length * sideFactor * elevationFactor)
 * - Sum exposures for left/right and return the side with more shade (lower exposure)
 */
export async function getShadeSideForRoute(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  travelDate: Date = new Date()
): Promise<{
  shadeSide: "LEFT" | "RIGHT" | "ANY";
  leftSunExposure: number;
  rightSunExposure: number;
  totalDistanceMeters: number;
  totalDurationSeconds?: number;
}> {
  // free OSRM public server (suitable for dev / low-volume). For production host your own or use a paid provider.
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&annotations=duration,distance`;

  const res = await fetch(osrmUrl);
  if (!res.ok) throw new Error(`Route fetch failed: ${res.status} ${res.statusText}`);

  const data = await res.json();
  if (!data.routes?.length) throw new Error('No route found');

  const route = data.routes[0];
  const coords: number[][] = route.geometry.coordinates; // [lon, lat] pairs
  const totalDistance: number = route.distance ?? coords.length; // meters
  const totalDuration: number = route.duration ?? 0; // seconds

  // Build segments (lon,lat) pairs -> convert to lat,lon variables for existing functions
  const segments: {
    lat1: number, lon1: number, lat2: number, lon2: number, segLen: number
  }[] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const segLen = haversineDistance(lat1, lon1, lat2, lon2);
    // ignore negligible segments
    if (segLen < 0.5) continue;
    segments.push({ lat1, lon1, lat2, lon2, segLen });
  }

  // If nothing useful, fallback to single bearing approach
  if (segments.length === 0) {
    const fallbackBearing = calculateBearing(origin.lat, origin.lon, destination.lat, destination.lon);
    const rec = calculateSeatRecommendation(origin.lat, origin.lon, fallbackBearing, travelDate);
    const shadeSide = rec.recommendedSide === 'LEFT' ? 'RIGHT' : (rec.recommendedSide === 'RIGHT' ? 'LEFT' : 'ANY');
    // shadeSide logic: rec.recommendedSide is "avoid sunlight", to return "most shade" we invert
    return { shadeSide, leftSunExposure: 0, rightSunExposure: 0, totalDistanceMeters: totalDistance, totalDurationSeconds: totalDuration };
  }

  // We'll distribute route duration proportionally to segment length to know approximate time on each segment.
  let leftExposure = 0;
  let rightExposure = 0;
  let elapsedSec = 0;

  // For better accuracy on long segments, we can sample by subdividing a long segment into smaller chunks.
  const maxSampleLength = 50; // meters - sample every ~50m (tune for performance vs accuracy)

  for (const s of segments) {
    // Number of samples in this segment
    const nSamples = Math.max(1, Math.ceil(s.segLen / maxSampleLength));
    for (let k = 0; k < nSamples; k++) {
      // Linear interpolate point along segment
      const t = (k + 0.5) / nSamples; // midpoint of the sample slice
      const sampleLat = s.lat1 + (s.lat2 - s.lat1) * t;
      const sampleLon = s.lon1 + (s.lon2 - s.lon1) * t;

      // time spent on this sample slice
      const sliceLen = s.segLen / nSamples;
      const sliceTimeSec = totalDistance > 0 ? (sliceLen / totalDistance) * totalDuration : 0;
      const timestamp = new Date(travelDate.getTime() + elapsedSec * 1000);

      // advance elapsed for next slice
      elapsedSec += sliceTimeSec;

      // sun at the sample location/time
      const sun = getSunPosition(sampleLat, sampleLon, timestamp);
      if (sun.altitude <= 0) {
        // sun below horizon -> no exposure
        continue;
      }

      // segment bearing for this sample (approx same as whole segment)
      const bearing = calculateBearing(s.lat1, s.lon1, s.lat2, s.lon2);

      // angular diff normalized to -180..+180 (sun azimuth - heading)
      const diff = ((sun.azimuth - bearing + 540) % 360) - 180;
      const absDiff = Math.abs(diff); // 0 = front, 90 = side, 180 = rear

      // We want lateral (side) exposure: max when sun is at ~90° relative to heading.
      // sideFactor: 1 when absDiff == 90, 0 when absDiff == 0 or 180
      const sideFactor = Math.max(0, Math.cos(((Math.abs(absDiff - 90) * Math.PI) / 180)));

      // elevationFactor: sun higher = more direct (but vertical sun hits less side), we still want to weight by sin(altitude)
      const elevationFactor = Math.max(0.05, Math.sin((sun.altitude * Math.PI) / 180)); // keep tiny floor

      // weight = meters * sideFactor * elevationFactor
      const weight = sliceLen * sideFactor * elevationFactor;

      if (diff > 0) {
        // sun on LEFT side
        leftExposure += weight;
      } else {
        rightExposure += weight;
      }
    }
  }

  // Decide shade side: side with LOWER sun exposure has MORE shade
  let shadeSide: "LEFT" | "RIGHT" | "ANY";
  if (Math.abs(leftExposure - rightExposure) / Math.max(1, (leftExposure + rightExposure)) < 0.05) {
    // nearly equal (within 5% relative)
    shadeSide = 'ANY';
  } else {
    shadeSide = leftExposure > rightExposure ? 'RIGHT' : 'LEFT';
  }

  return {
    shadeSide,
    leftSunExposure: leftExposure,
    rightSunExposure: rightExposure,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
  };
}

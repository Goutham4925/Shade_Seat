import * as SunCalc from 'suncalc';

export interface SunPosition {
  azimuth: number; // degrees 0-360
  altitude: number; // degrees
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
 * Convert radians to degrees and normalize to 0-360
 */
function toDegrees(radians: number): number {
  const degrees = (radians * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/**
 * Get current sun position for given coordinates
 */
export function getSunPosition(lat: number, lon: number, date: Date = new Date()): SunPosition {
  const position = SunCalc.getPosition(date, lat, lon);
  
  return {
    azimuth: toDegrees(position.azimuth),
    altitude: toDegrees(position.altitude),
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
 * Calculate initial bearing between two geographic points
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  
  return (toDegrees(θ) + 360) % 360;
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
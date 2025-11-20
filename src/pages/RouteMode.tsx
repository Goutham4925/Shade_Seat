// RouteMode.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Navigation, MapPin, Loader2, Route, Target, Clock, Shield, Compass, Sun, Calendar, Moon } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { useEventTracker } from "@/hooks/useGoogleAnalytics";
import { AppEvents } from "@/lib/analytics";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface SeatRecommendation {
  side: 'left' | 'right' | 'any';
  reason: string;
  bearing: number;
  sunPosition: string;
  isNighttime: boolean;
  [key: string]: any;
}

const RouteMode = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const originTimeoutRef = useRef<NodeJS.Timeout>();
  const destTimeoutRef = useRef<NodeJS.Timeout>();
  const originDropdownRef = useRef<HTMLDivElement>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);
  const trackEvent = useEventTracker();

  // Set default datetime to current time when component mounts
  useEffect(() => {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const formattedDateTime = now.toISOString().slice(0, 16);
    setSelectedDateTime(formattedDateTime);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();

    trackEvent(AppEvents.ROUTE_CALCULATION_STARTED, {
      origin,
      destination,
      selected_datetime: selectedDateTime,
      high_accuracy: settings.highAccuracy,
    });

    try {
      // dynamic import to keep parity with your previous pattern
      const { geocodeAddress, calculateBearing, calculateSeatRecommendation, degreesToCardinal, getShadeSideForRoute } = await import("@/lib/sunCalculator");

      // Parse or geocode origin
      let originCoords: { lat: number; lon: number } | null = null;
      const originMatch = origin.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (originMatch) {
        originCoords = { lat: parseFloat(originMatch[1]), lon: parseFloat(originMatch[2]) };
      } else {
        toast.info("Geocoding origin address...");
        trackEvent(AppEvents.GEOCODING_REQUESTED, { address: origin, type: 'origin' });
        originCoords = await geocodeAddress(origin);
      }

      if (!originCoords) {
        trackEvent(AppEvents.GEOCODING_ERROR, { address: origin, type: 'origin' });
        toast.error("Could not find origin location");
        setIsLoading(false);
        return;
      }

      trackEvent(AppEvents.GEOCODING_SUCCESS, {
        address: origin,
        type: 'origin',
        latitude: originCoords.lat,
        longitude: originCoords.lon,
      });

      // Parse or geocode destination
      let destCoords: { lat: number; lon: number } | null = null;
      const destMatch = destination.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (destMatch) {
        destCoords = { lat: parseFloat(destMatch[1]), lon: parseFloat(destMatch[2]) };
      } else {
        toast.info("Geocoding destination address...");
        trackEvent(AppEvents.GEOCODING_REQUESTED, { address: destination, type: 'destination' });
        destCoords = await geocodeAddress(destination);
      }

      if (!destCoords) {
        trackEvent(AppEvents.GEOCODING_ERROR, { address: destination, type: 'destination' });
        toast.error("Could not find destination location");
        setIsLoading(false);
        return;
      }

      trackEvent(AppEvents.GEOCODING_SUCCESS, {
        address: destination,
        type: 'destination',
        latitude: destCoords.lat,
        longitude: destCoords.lon,
      });

      // Calculate initial bearing from origin to destination (kept for UI reason)
      const bearing = calculateBearing(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);

      // Use selected datetime or current time
      let travelDate: Date;
      if (selectedDateTime) {
        // Add seconds to make it valid for parsing in all browsers
        travelDate = new Date(selectedDateTime + ':00');
        if (isNaN(travelDate.getTime())) {
          toast.error("Invalid date/time selected");
          setIsLoading(false);
          return;
        }
      } else {
        travelDate = new Date();
      }

      trackEvent(AppEvents.TRAVEL_TIME_SELECTED, {
        selected_datetime: selectedDateTime,
        actual_datetime: travelDate.toISOString(),
        is_current_time: !selectedDateTime,
      });

      // Use route-aware shade calculation (OSRM + sun sampling)
      let recommendedSide: 'left' | 'right' | 'any' = 'any';
      let reason: string = '';
      let sunPosition: string = '';
      let isNighttimeResult: boolean = false;

      try {
        const shadeResult = await getShadeSideForRoute(
          { lat: originCoords.lat, lon: originCoords.lon },
          { lat: destCoords.lat, lon: destCoords.lon },
          travelDate
        );

        if (shadeResult.shadeSide === 'ANY') {
          recommendedSide = 'any';
          reason = 'Both sides have similar shade across your route — choose any seat.';
          toast.success("Both sides similar shade — choose any seat.");
        } else {
          recommendedSide = shadeResult.shadeSide.toLowerCase() as 'left' | 'right';
          reason = `Based on your full route, the ${shadeResult.shadeSide.toLowerCase()} side receives more shade (less sun exposure).`;
          toast.success(`More shade on the ${recommendedSide} side for your route.`);
        }

        sunPosition = `Aggregated across route: leftExposure=${Math.round(shadeResult.leftSunExposure)}, rightExposure=${Math.round(shadeResult.rightSunExposure)}`;
        isNighttimeResult = false;
      } catch (routeErr) {
        // Fallback: use single-point calculation at origin
        console.warn('Route shade calc failed, falling back to single-point:', routeErr);
        const rec = calculateSeatRecommendation(originCoords.lat, originCoords.lon, bearing, travelDate);

        if (rec.isNight) {
          recommendedSide = 'any';
          reason = rec.message;
          isNighttimeResult = true;
          toast.success("Nighttime travel detected - any seat is comfortable!");
        } else {
          recommendedSide = rec.recommendedSide.toLowerCase() as 'left' | 'right';
          reason = rec.message;
          sunPosition = `Sun at origin: ${rec.sunAzimuth.toFixed(1)}° (${rec.sunPosition.toLowerCase()})`;
          isNighttimeResult = false;
        }
      }

      // Create consistent recommendation object
      const fullRecommendation: SeatRecommendation = {
        side: recommendedSide,
        reason: reason,
        bearing: bearing,
        sunPosition: sunPosition,
        isNighttime: isNighttimeResult
      };

      const endTime = performance.now();
      const calculationDuration = endTime - startTime;

      // Track successful calculation
      trackEvent(AppEvents.ROUTE_CALCULATION_COMPLETED, {
        origin_lat: originCoords.lat,
        origin_lon: originCoords.lon,
        dest_lat: destCoords.lat,
        dest_lon: destCoords.lon,
        bearing,
        recommended_side: recommendedSide,
        is_nighttime: isNighttimeResult,
        calculation_duration_ms: Math.round(calculationDuration),
        travel_datetime: travelDate.toISOString(),
      });

      // Navigate back to home page with the full recommendation data
      navigate('/', {
        state: {
          recommendation: fullRecommendation,
          location: originCoords,
          bearing: bearing,
          mode: 'route',
          origin: origin,
          destination: destination,
          travelTime: travelDate.toLocaleString(),
          isNighttime: isNighttimeResult
        }
      });
    } catch (error: any) {
      console.error('Route calculation error:', error);
      const endTime = performance.now();
      const calculationDuration = endTime - startTime;

      trackEvent(AppEvents.ROUTE_CALCULATION_ERROR, {
        error: error?.message || String(error),
        calculation_duration_ms: Math.round(calculationDuration),
        origin,
        destination,
      });
      toast.error("Could not calculate route");
      setIsLoading(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originDropdownRef.current && !originDropdownRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destDropdownRef.current && !destDropdownRef.current.contains(event.target as Node)) {
        setShowDestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (query: string, isOrigin: boolean) => {
    if (query.length < 3) {
      if (isOrigin) setOriginSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    setIsSearching(true);
    trackEvent('location_search_triggered', {
      query,
      is_origin: isOrigin,
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            'User-Agent': 'SunSafe-Seat-Advisor',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (isOrigin) {
          setOriginSuggestions(data);
          setShowOriginDropdown(true);
        } else {
          setDestSuggestions(data);
          setShowDestDropdown(true);
        }

        trackEvent('location_search_success', {
          query,
          is_origin: isOrigin,
          result_count: data.length,
        });
      }
    } catch (error: any) {
      console.error('Location search error:', error);
      trackEvent('location_search_error', {
        query,
        is_origin: isOrigin,
        error: error?.message || String(error),
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);

    if (originTimeoutRef.current) {
      clearTimeout(originTimeoutRef.current);
    }

    originTimeoutRef.current = setTimeout(() => {
      searchLocations(value, true);
    }, 300);
  };

  const handleDestChange = (value: string) => {
    setDestination(value);

    if (destTimeoutRef.current) {
      clearTimeout(destTimeoutRef.current);
    }

    destTimeoutRef.current = setTimeout(() => {
      searchLocations(value, false);
    }, 300);
  };

  const selectOriginSuggestion = (suggestion: LocationSuggestion) => {
    setOrigin(suggestion.display_name);
    setShowOriginDropdown(false);
    setOriginSuggestions([]);

    trackEvent('location_suggestion_selected', {
      type: 'origin',
      display_name: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    });
  };

  const selectDestSuggestion = (suggestion: LocationSuggestion) => {
    setDestination(suggestion.display_name);
    setShowDestDropdown(false);
    setDestSuggestions([]);

    trackEvent('location_suggestion_selected', {
      type: 'destination',
      display_name: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    trackEvent('current_location_requested', { context: 'route_mode_origin' });

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        trackEvent('current_location_success', {
          latitude,
          longitude,
          accuracy: position.coords.accuracy,
          context: 'route_mode_origin',
        });
        toast.success("Current location set as origin");
        setIsLoading(false);
      },
      (error) => {
        trackEvent('current_location_error', {
          error_code: error.code,
          error_message: error.message,
          context: 'route_mode_origin',
        });
        toast.error("Could not get current location");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: settings.highAccuracy,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Fixed function to set current date and time
  const handleSetCurrentDateTime = () => {
    const now = new Date();
    // Convert to local datetime string in the correct format for datetime-local input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setSelectedDateTime(localDateTime);

    trackEvent(AppEvents.CURRENT_TIME_USED, {
      hours,
      minutes,
      is_nighttime: now.getHours() >= 18 || now.getHours() < 6,
    });

    // Show current time info
    const timeInfo = now.getHours() >= 18 || now.getHours() < 6 ? 'night' : 'day';
    toast.success(`Current ${timeInfo}time set (${hours}:${minutes})`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 dark:from-blue-950/30 dark:via-gray-900 dark:to-amber-950/20 py-8 px-4 relative">
      <div className="max-w-md mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-4 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
            Route Mode
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
            Plan Your Journey
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
            Get seat recommendations based on your entire route direction and travel time
          </p>
        </div>

        {/* Enhanced Form Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-8 mb-8 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-cyan-100 dark:from-cyan-900/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 dark:from-blue-900/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin Input */}
              <div className="space-y-4">
                <Label htmlFor="origin" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Target className="w-4 h-4" />
                  </div>
                  Starting Point
                </Label>
                <div className="relative" ref={originDropdownRef}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <Input
                    id="origin"
                    type="text"
                    placeholder="Enter address, city, or coordinates..."
                    value={origin}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    onFocus={() => origin.length >= 3 && originSuggestions.length > 0 && setShowOriginDropdown(true)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/30 transition-all shadow-inner"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-spin" />
                    </div>
                  )}
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {originSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectOriginSuggestion(suggestion)}
                          className="w-full px-4 py-4 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all flex items-start gap-3 border-b border-gray-100 dark:border-gray-600 last:border-0 group"
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                          <span className="break-words text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group"
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      📍
                    </div>
                    <span>Use Current Location</span>
                  </div>
                </Button>
              </div>

              {/* Destination Input */}
              <div className="space-y-4">
                <Label htmlFor="destination" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                  Destination
                </Label>
                <div className="relative" ref={destDropdownRef}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <Input
                    id="destination"
                    type="text"
                    placeholder="Enter address, city, or coordinates..."
                    value={destination}
                    onChange={(e) => handleDestChange(e.target.value)}
                    onFocus={() => destination.length >= 3 && destSuggestions.length > 0 && setShowDestDropdown(true)}
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-green-400 dark:focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:focus:ring-green-900/30 transition-all shadow-inner"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-green-500 dark:text-green-400 animate-spin" />
                    </div>
                  )}
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {destSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectDestSuggestion(suggestion)}
                          className="w-full px-4 py-4 text-left text-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-all flex items-start gap-3 border-b border-gray-100 dark:border-gray-600 last:border-0 group"
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" />
                          <span className="break-words text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-300">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                {/* Label */}
                <Label
                  htmlFor="travel-time"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Travel Date & Time
                </Label>

                {/* Input wrapper */}
                <div className="relative flex items-center gap-2">
                  {/* Clock icon */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Clock className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                  </div>

                  {/* DateTime Input */}
                  <Input
                    id="travel-time"
                    type="datetime-local"
                    value={selectedDateTime}
                    onChange={(e) => setSelectedDateTime(e.target.value)}
                    className="pl-12 pr-4 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all shadow-inner w-full"
                  />

                  {/* Current time button */}
                  <Button
                    type="button"
                    onClick={handleSetCurrentDateTime}
                    variant="outline"
                    className="ml-2 px-4 py-2 h-10 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm transition-colors shadow-md border-0"
                  >
                    Now
                  </Button>
                </div>

                {/* Helper text */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select when you plan to travel for accurate sun position calculations.
                  For nighttime travel, any seat is comfortable as the sun won't be a factor.
                </p>
              </div>

              {/* Enhanced Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !origin || !destination}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group mt-6 border-0"
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ${
                  isHovered ? 'scale-105 brightness-110' : 'scale-100'
                } ${isLoading || !origin || !destination ? 'opacity-50' : ''}`}></div>

                {isLoading ? (
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-white font-medium">Calculating Optimal Route...</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-3 text-white transition-transform group-hover:scale-110" />
                    <span className="text-white font-bold">Get Route Recommendation</span>
                    <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Route className="w-5 h-5 text-white animate-pulse" />
                    </div>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </Card>

        {/* Enhanced Info Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-amber-100 dark:from-amber-900/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <span>How It Works</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 font-bold text-lg group-hover:scale-110 transition-transform">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Enter Your Route</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Provide starting point and destination</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 transition-all hover:bg-purple-100 dark:hover:bg-purple-900/30 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 font-bold text-lg group-hover:scale-110 transition-transform">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Select Travel Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose when you'll be traveling</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-800 transition-all hover:bg-green-100 dark:hover:bg-green-900/30 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400 font-bold text-lg group-hover:scale-110 transition-transform">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Smart Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    We check if it's daytime or nighttime at your travel time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 font-bold text-lg group-hover:scale-110 transition-transform">
                  4
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Personalized Recommendation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Daytime: optimal seat to avoid sun • Nighttime: any seat is fine
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Note Section */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-start gap-4 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-800 max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Moon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Night Travel</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                When traveling at night, the sun won't be a factor. You can comfortably choose any seat without worrying about sunlight.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Status Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100 dark:border-gray-700">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Ready to Calculate</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Enter your route and travel time to get started</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMode;

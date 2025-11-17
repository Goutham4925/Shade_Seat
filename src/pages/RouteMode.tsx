import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Navigation, MapPin, Loader2, Route, Target, Clock, Shield } from "lucide-react";
import { toast } from "sonner";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface SeatRecommendation {
  side: 'left' | 'right';
  reason: string;
  bearing: number;
  sunPosition: string;
  [key: string]: any;
}

// Define possible recommendation types
type RecommendationResult = 
  | string 
  | { recommendedSide: string; reason?: string; sunAzimuth?: number }
  | { side: string; reason?: string; sunPosition?: string }
  | { recommendedSeat: string; description?: string }
  | any;

const RouteMode = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !destination) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setIsLoading(true);

    try {
      const { geocodeAddress, calculateBearing, calculateSeatRecommendation, degreesToCardinal } = await import("@/lib/sunCalculator");
      
      // Parse or geocode origin
      let originCoords: { lat: number; lon: number } | null = null;
      const originMatch = origin.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (originMatch) {
        originCoords = { lat: parseFloat(originMatch[1]), lon: parseFloat(originMatch[2]) };
      } else {
        toast.info("Geocoding origin address...");
        originCoords = await geocodeAddress(origin);
      }

      if (!originCoords) {
        toast.error("Could not find origin location");
        setIsLoading(false);
        return;
      }

      // Parse or geocode destination
      let destCoords: { lat: number; lon: number } | null = null;
      const destMatch = destination.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (destMatch) {
        destCoords = { lat: parseFloat(destMatch[1]), lon: parseFloat(destMatch[2]) };
      } else {
        toast.info("Geocoding destination address...");
        destCoords = await geocodeAddress(destination);
      }

      if (!destCoords) {
        toast.error("Could not find destination location");
        setIsLoading(false);
        return;
      }

      // Calculate initial bearing from origin to destination
      const bearing = calculateBearing(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);

      // Calculate seat recommendation
      const recommendation: RecommendationResult = calculateSeatRecommendation(originCoords.lat, originCoords.lon, bearing);

      // ✅ FIXED: Properly handle the recommendation data structure with type safety
      let recommendedSide: 'left' | 'right';
      let reason: string;
      let sunPosition: string;

      // Debug log to see what calculateSeatRecommendation actually returns
      console.log('Raw recommendation from calculator:', recommendation);
      console.log('Type of recommendation:', typeof recommendation);

      // Handle different possible return structures from calculateSeatRecommendation
      if (typeof recommendation === 'string') {
        // If it returns a simple string like "left" or "right"
        const sideStr = recommendation.toLowerCase();
        recommendedSide = sideStr.includes('left') ? 'left' : 'right';
        reason = `Based on your travel direction of ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`;
        sunPosition = `Travel direction: ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`;
      } else if (recommendation && typeof recommendation === 'object') {
        // If it returns an object - safely check each possible property
        
        // Check for recommendedSide property
        if (recommendation.recommendedSide && typeof recommendation.recommendedSide === 'string') {
          const sideStr = recommendation.recommendedSide.toLowerCase();
          recommendedSide = sideStr.includes('left') ? 'left' : 'right';
        } 
        // Check for side property
        else if (recommendation.side && typeof recommendation.side === 'string') {
          const sideStr = recommendation.side.toLowerCase();
          recommendedSide = sideStr.includes('left') ? 'left' : 'right';
        }
        // Check for recommendedSeat property
        else if (recommendation.recommendedSeat && typeof recommendation.recommendedSeat === 'string') {
          const sideStr = recommendation.recommendedSeat.toLowerCase();
          recommendedSide = sideStr.includes('left') ? 'left' : 'right';
        } else {
          // Fallback if no recognizable side property found
          console.warn('No recognizable side property found in recommendation, using bearing-based fallback');
          recommendedSide = bearing >= 0 && bearing < 180 ? 'left' : 'right';
        }

        // Set reason and sunPosition with proper type checking
        reason = (typeof recommendation.reason === 'string' ? recommendation.reason : 
                 typeof recommendation.description === 'string' ? recommendation.description :
                 `Based on your travel direction of ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`);

        sunPosition = (typeof recommendation.sunPosition === 'string' ? recommendation.sunPosition :
                      typeof recommendation.sunAzimuth === 'number' ? `Sun is at ${recommendation.sunAzimuth.toFixed(1)}°` :
                      `Travel direction: ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`);
      } else {
        // Final fallback - use bearing to determine side
        console.warn('Unexpected recommendation type, using bearing-based calculation');
        recommendedSide = bearing >= 0 && bearing < 180 ? 'left' : 'right';
        reason = `Based on your travel direction of ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`;
        sunPosition = `Direction: ${bearing.toFixed(1)}° (${degreesToCardinal(bearing)})`;
      }

      // Create consistent recommendation object
      const fullRecommendation: SeatRecommendation = {
        side: recommendedSide,
        reason: reason,
        bearing: bearing,
        sunPosition: sunPosition
      };

      console.log('Final recommendation object:', fullRecommendation);

      // Navigate back to home page with the full recommendation data
      navigate('/', {
        state: {
          recommendation: fullRecommendation,
          location: originCoords,
          bearing: bearing,
          mode: 'route',
          origin: origin,
          destination: destination
        }
      });
    } catch (error) {
      console.error('Route calculation error:', error);
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
      }
    } catch (error) {
      console.error('Location search error:', error);
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
  };

  const selectDestSuggestion = (suggestion: LocationSuggestion) => {
    setDestination(suggestion.display_name);
    setShowDestDropdown(false);
    setDestSuggestions([]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOrigin(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        toast.success("Current location set as origin");
        setIsLoading(false);
      },
      (error) => {
        toast.error("Could not get current location");
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-4 hover:bg-white/50 backdrop-blur-sm transition-all rounded-2xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-3xl blur-lg opacity-30 animate-pulse-slow"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg">
              <Route className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Route Mode
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Plan Your Journey
          </p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Get seat recommendations based on your entire route direction
          </p>
        </div>

        {/* Enhanced Form Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-cyan-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin Input */}
              <div className="space-y-3">
                <Label htmlFor="origin" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4" />
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
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-gray-200/80 bg-white/50 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all shadow-inner"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                  {showOriginDropdown && originSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {originSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectOriginSuggestion(suggestion)}
                          className="w-full px-4 py-4 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-all flex items-start gap-3 border-b border-gray-100 last:border-0 group"
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="break-words text-gray-700 group-hover:text-blue-700">{suggestion.display_name}</span>
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
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                  disabled={isLoading}
                >
                  📍 Use Current Location
                </Button>
              </div>

              {/* Destination Input */}
              <div className="space-y-3">
                <Label htmlFor="destination" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
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
                    className="pl-12 pr-12 h-14 rounded-2xl border-2 border-gray-200/80 bg-white/50 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all shadow-inner"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                  {showDestDropdown && destSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
                      {destSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectDestSuggestion(suggestion)}
                          className="w-full px-4 py-4 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-all flex items-start gap-3 border-b border-gray-100 last:border-0 group"
                        >
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="break-words text-gray-700 group-hover:text-blue-700">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !origin || !destination}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group mt-6"
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ${
                  isHovered ? 'scale-105' : 'scale-100'
                } ${isLoading || !origin || !destination ? 'opacity-50' : ''}`}></div>
                
                {isLoading ? (
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Calculating Optimal Route...</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center justify-center">
                    <Shield className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                    <span>Get Route Recommendation</span>
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                      <Route className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </Card>

        {/* Enhanced Info Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-gray-50 to-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-amber-100 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Enter Your Route</p>
                  <p className="text-sm text-gray-600 mt-1">Provide starting point and destination</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-600 font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Direction Analysis</p>
                  <p className="text-sm text-gray-600 mt-1">We calculate your initial travel bearing</p>
                </div>
              </div>
              
              <div className="flex gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 text-amber-600 font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Smart Recommendations</p>
                  <p className="text-sm text-gray-600 mt-1">Get seat advice based on sun position</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Note Section */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200/50 max-w-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
              💡
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-amber-900">Pro Tip</p>
              <p className="text-xs text-amber-700">
                For real-time recommendations, use the quick check mode with live location
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMode;
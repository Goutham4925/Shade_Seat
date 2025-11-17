import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { Navigation, MapPin, Compass, Settings, Sun, Shield, Clock, Route, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { HeadingDetector } from "@/lib/headingDetector";

interface SeatRecommendation {
  side: 'left' | 'right';
  reason: string;
  bearing: number;
  sunPosition: string;
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [routeRecommendation, setRouteRecommendation] = useState<any>(null);

  // Handle route recommendation when coming from RouteMode
  useEffect(() => {
    if (location.state?.recommendation) {
      setRouteRecommendation(location.state);
      toast.success("Route analysis complete!");
      
      // Clear the navigation state to prevent showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCheckSafeSide = async () => {
    setIsLoading(true);

    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your device");
        setIsLoading(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      if (!HeadingDetector.isSupported()) {
        navigate('/heading-select', { 
          state: { latitude, longitude }
        });
        return;
      }

      const permissionGranted = await HeadingDetector.requestPermission();
      
      if (!permissionGranted) {
        toast.error("Compass permission denied");
        navigate('/heading-select', { 
          state: { latitude, longitude }
        });
        return;
      }

      const detector = new HeadingDetector();
      let headingObtained = false;

      const timeout = setTimeout(() => {
        if (!headingObtained) {
          detector.stopListening();
          toast.error("Could not get compass reading");
          navigate('/heading-select', { 
            state: { latitude, longitude }
          });
        }
      }, 5000);

      detector.startListening((headingData) => {
        if (!headingObtained) {
          headingObtained = true;
          clearTimeout(timeout);
          detector.stopListening();

          navigate('/result', {
            state: {
              latitude,
              longitude,
              heading: headingData.heading,
            },
          });
        }
      });

    } catch (error: any) {
      console.error('Error:', error);
      
      if (error.code === 1) {
        toast.error("Location permission denied. Please enable location access in your browser settings.");
      } else if (error.code === 3) {
        toast.error("Location request timed out. Please check your connection and try again.");
      } else {
        toast.error("Could not get your location. Please try again.");
      }
      
      setIsLoading(false);
    }
  };

  const clearRouteRecommendation = () => {
    setRouteRecommendation(null);
  };

  const getRecommendationDisplay = () => {
    if (!routeRecommendation?.recommendation) return null;
    
    const rec = routeRecommendation.recommendation;
    
    if (typeof rec === 'string') {
      return rec;
    } else if (rec.side) {
      return rec.side === 'left' ? '🫲 Left Side' : '🫱 Right Side';
    } else if (rec.recommendedSeat) {
      return rec.recommendedSeat === 'left' ? '🫲 Left Side' : '🫱 Right Side';
    }
    
    return 'Unknown recommendation';
  };

  const getRecommendationSide = () => {
    if (!routeRecommendation?.recommendation) return null;
    
    const rec = routeRecommendation.recommendation;
    
    if (typeof rec === 'string') {
      return rec.toLowerCase().includes('left') ? 'left' : 'right';
    } else if (rec.side) {
      return rec.side;
    } else if (rec.recommendedSeat) {
      return rec.recommendedSeat;
    }
    
    return 'right';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Enhanced Header with Better Visual Hierarchy */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-lg opacity-30 animate-pulse-slow"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Sun className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            SunSafe
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Smart Seat Advisor
          </p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Find the perfect seat to stay cool and comfortable in direct sunlight
          </p>
        </div>

        {/* Enhanced Route Recommendation Display */}
        {routeRecommendation && (
          <Card className="relative overflow-hidden shadow-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/80 backdrop-blur-sm rounded-3xl p-6 mb-6 animate-fade-in-up">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-green-100 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRouteRecommendation}
              className="absolute top-3 right-3 z-10 w-8 h-8 p-0 rounded-full bg-white/80 hover:bg-white shadow-sm"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="relative z-10">
              <h3 className="font-bold text-xl text-green-900 mb-4 flex items-center gap-2">
                <Route className="w-6 h-6 text-green-600" />
                Route Recommendation Ready!
              </h3>
              
              <div className="space-y-4">
                {/* Main Recommendation with Visual Highlight */}
                <div className={`p-5 rounded-2xl border-2 ${
                  getRecommendationSide() === 'left' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-amber-50 border-amber-200'
                } transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-700 text-lg">Recommended Seat:</span>
                    <span className={`text-2xl font-bold ${
                      getRecommendationSide() === 'left' ? 'text-blue-700' : 'text-amber-700'
                    }`}>
                      {getRecommendationSide() === 'left' ? '🫲 LEFT SIDE' : '🫱 RIGHT SIDE'}
                    </span>
                  </div>
                  
                  {/* Visual Seat Indicator */}
                  <div className="relative bg-white rounded-xl p-4 border border-gray-200 shadow-inner">
                    <div className="flex justify-between items-center">
                      <div className={`text-center transition-all duration-300 ${
                        getRecommendationSide() === 'left' 
                          ? 'scale-110 text-blue-600 font-bold' 
                          : 'scale-100 text-gray-400'
                      }`}>
                        <div className="text-3xl mb-1">🫲</div>
                        <div className="text-sm font-medium">Left Side</div>
                        {getRecommendationSide() === 'left' && (
                          <div className="text-xs text-green-600 font-bold mt-1">RECOMMENDED</div>
                        )}
                      </div>
                      
                      <div className="text-gray-400 text-sm">Vehicle</div>
                      
                      <div className={`text-center transition-all duration-300 ${
                        getRecommendationSide() === 'right' 
                          ? 'scale-110 text-amber-600 font-bold' 
                          : 'scale-100 text-gray-400'
                      }`}>
                        <div className="text-3xl mb-1">🫱</div>
                        <div className="text-sm font-medium">Right Side</div>
                        {getRecommendationSide() === 'right' && (
                          <div className="text-xs text-green-600 font-bold mt-1">RECOMMENDED</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason and Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/70 rounded-xl border border-green-200">
                    <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">Why this seat?</p>
                      <p className="text-sm text-green-700 mt-1">
                        {routeRecommendation.recommendation.reason || 
                         `The ${getRecommendationSide()} side provides better shade based on your travel direction of ${routeRecommendation.bearing?.toFixed(1)}°`}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-green-700 bg-white/50 p-3 rounded-lg border border-green-200">
                    <p className="font-medium text-green-900">Route Analysis</p>
                    <div className="text-xs mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-green-600">From:</span>
                        <span className="text-green-800 font-medium">{routeRecommendation.origin || 'Starting point'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">To:</span>
                        <span className="text-green-800 font-medium">{routeRecommendation.destination || 'Destination'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Direction:</span>
                        <span className="text-green-800 font-medium">{routeRecommendation.bearing?.toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={clearRouteRecommendation}
                  variant="outline" 
                  className="w-full border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800 font-medium"
                >
                  Clear Recommendation
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Main Card with Better Visual Depth */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-3xl p-8 mb-8 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-amber-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* Vehicle Diagram with Enhanced Container */}
            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner border border-gray-100">
              <VehicleDiagram className="w-full" />
            </div>
            
            {/* Enhanced Primary CTA Button */}
            <Button 
              onClick={handleCheckSafeSide}
              disabled={isLoading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              size="lg"
            >
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}></div>
              
              {/* Loading State */}
              {isLoading ? (
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span>Detecting Your Position...</span>
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-center">
                  <Shield className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                  <span>Find My Safe Seat</span>
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <Compass className="w-5 h-5 animate-pulse" />
                  </div>
                </div>
              )}
            </Button>

            {/* Enhanced Feature List */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Precise GPS Location</p>
                  <p className="text-sm text-gray-600">Uses your exact position for accurate results</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 text-green-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Smart Direction Detection</p>
                  <p className="text-sm text-gray-600">Automatically detects your travel direction</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Real-time Sun Position</p>
                  <p className="text-sm text-gray-600">Calculates based on current time and location</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Grid */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          <Card 
            className="p-5 cursor-pointer group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl overflow-hidden relative"
            onClick={() => navigate('/route')}
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
            <div className="relative z-10">
              <Navigation className="w-7 h-7 mb-3 transform group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm mb-1">Route Mode</h3>
              <p className="text-xs text-blue-100 opacity-90">
                Plan your entire journey
              </p>
            </div>
          </Card>

          <Card 
            className="p-5 cursor-pointer group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-gray-600 to-gray-700 text-white rounded-2xl overflow-hidden relative"
            onClick={() => navigate('/settings')}
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
            <div className="relative z-10">
              <Settings className="w-7 h-7 mb-3 transform group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-sm mb-1">Settings</h3>
              <p className="text-xs text-gray-300 opacity-90">
                Customize preferences
              </p>
            </div>
          </Card>
        </div>

        {/* Enhanced Info Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-600 font-medium">
              Ready to find your perfect seat • 100% private & secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
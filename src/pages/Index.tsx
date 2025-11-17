import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Navigation, MapPin, Compass, Settings, Shield, Clock, Route, X, Lightbulb, Car } from "lucide-react";
import { toast } from "sonner";
import { HeadingDetector } from "@/lib/headingDetector";
import Lottie from "lottie-react";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [safeSeatLoading, setSafeSeatLoading] = useState(false);
  const [routeModeLoading, setRouteModeLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [routeRecommendation, setRouteRecommendation] = useState<any>(null);
  const [animationData, setAnimationData] = useState<any>(null);

  // Load Lottie animation data
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/animations/little sun.json');
        const data = await response.json();
        setAnimationData(data);
      } catch (error) {
        console.warn('Could not load Lottie animation');
      }
    };

    loadAnimation();
  }, []);

  // Handle route recommendation when coming from RouteMode
  useEffect(() => {
    if (location.state?.recommendation) {
      setRouteRecommendation(location.state);
      toast.success("Route analysis complete!");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCheckSafeSide = async () => {
    setSafeSeatLoading(true);

    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your device");
        setSafeSeatLoading(false);
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
      
      setSafeSeatLoading(false);
    }
  };

  const handleRouteMode = async () => {
    setRouteModeLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/route');
    } catch (error) {
      console.error('Error:', error);
      toast.error("Could not load route mode");
    } finally {
      setRouteModeLoading(false);
    }
  };

  const handleSettings = async () => {
    setSettingsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/settings');
    } catch (error) {
      console.error('Error:', error);
      toast.error("Could not load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const clearRouteRecommendation = () => {
    setRouteRecommendation(null);
  };

  const getRecommendationSide = (): 'left' | 'right' | null => {
    if (!routeRecommendation?.recommendation) return null;
    
    const rec = routeRecommendation.recommendation;
    
    try {
      if (typeof rec === 'string') {
        const side = rec.toLowerCase().trim();
        return side.includes('left') ? 'left' : 'right';
      }
      
      if (rec && typeof rec === 'object') {
        if (rec.side && typeof rec.side === 'string') {
          const side = rec.side.toLowerCase().trim();
          return side.includes('left') ? 'left' : 'right';
        }
        
        if (rec.recommendedSide && typeof rec.recommendedSide === 'string') {
          const side = rec.recommendedSide.toLowerCase().trim();
          return side.includes('left') ? 'left' : 'right';
        }
        
        if (rec.recommendedSeat && typeof rec.recommendedSeat === 'string') {
          const side = rec.recommendedSeat.toLowerCase().trim();
          return side.includes('left') ? 'left' : 'right';
        }
      }
      
      if (routeRecommendation.bearing !== undefined && typeof routeRecommendation.bearing === 'number') {
        return routeRecommendation.bearing >= 0 && routeRecommendation.bearing < 180 ? 'left' : 'right';
      }
      
      return 'right';
      
    } catch (error) {
      console.error('Error determining recommendation side:', error);
      return 'right';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 py-6 px-4 relative">
      <LoadingOverlay isLoading={safeSeatLoading || routeModeLoading || settingsLoading} animationData={animationData} />

      <div className="max-w-md mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
            SunSafe
          </h1>
          <p className="text-lg text-gray-700 mb-2 font-medium">
            Smart Seat Selection
          </p>
          <p className="text-sm text-gray-600 max-w-xs mx-auto leading-relaxed">
            Choose the perfect seat to avoid direct sunlight
          </p>
        </div>

        {/* Main Vehicle Card with Integrated Recommendation */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white rounded-3xl p-6 mb-6 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-amber-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* Route Recommendation Badge */}
            {routeRecommendation && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Route className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-emerald-900">Route Analysis Complete</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRouteRecommendation}
                    className="w-7 h-7 p-0 rounded-full bg-white hover:bg-emerald-50 border border-emerald-200"
                  >
                    <X className="w-3 h-3 text-emerald-600" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl ${
                    getRecommendationSide() === 'left' 
                      ? 'bg-blue-100 border border-blue-200' 
                      : 'bg-amber-100 border border-amber-200'
                  }`}>
                    <div className="text-2xl">
                      {getRecommendationSide() === 'left' ? '🫲' : '🫱'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        RECOMMENDED SEAT
                      </div>
                      <div className="text-xs text-gray-700">
                        {getRecommendationSide() === 'left' ? 'Left Side' : 'Right Side'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Vehicle Visualization */}
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner border-2 border-gray-100">
              <div className="relative w-full h-32">
                {/* Vehicle Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-gray-300 shadow-lg">
                  {/* Windows */}
                  <div className="absolute top-2 left-3 right-3 h-3 bg-blue-200/60 rounded-t-lg border border-blue-300/50"></div>
                  
                  {/* Seats with Recommendation Highlight */}
                  <div className={`absolute top-8 left-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    getRecommendationSide() === 'left' 
                      ? 'bg-blue-500 text-white shadow-md scale-110' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    <span className="text-xs font-bold">L</span>
                  </div>
                  <div className={`absolute top-8 right-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    getRecommendationSide() === 'right' 
                      ? 'bg-amber-500 text-white shadow-md scale-110' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    <span className="text-xs font-bold">R</span>
                  </div>
                  
                  {/* Back Seats */}
                  <div className="absolute top-16 left-6 w-5 h-6 bg-gray-400 rounded-md"></div>
                  <div className="absolute top-16 right-6 w-5 h-6 bg-gray-400 rounded-md"></div>
                  
                  {/* Wheels */}
                  <div className="absolute bottom-1 left-2 w-5 h-2 bg-gray-600 rounded-full"></div>
                  <div className="absolute bottom-1 right-2 w-5 h-2 bg-gray-600 rounded-full"></div>
                  
                  {/* Direction Arrow */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Compass className="w-3 h-3" />
                      <span className="text-xs font-medium">Travel Direction</span>
                      <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-600"></div>
                    </div>
                  </div>
                </div>

                {/* Facing Direction Indicator */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span>Facing</span>
                    <div className="w-0 h-0 border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-gray-600"></div>
                    <span>Forward</span>
                  </div>
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${
                    getRecommendationSide() === 'left' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">Recommended</span>
                </div>
              </div>
            </div>
            
            {/* Primary CTA Button */}
            <Button 
              onClick={handleCheckSafeSide}
              disabled={safeSeatLoading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full h-16 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-0 mb-6"
              size="lg"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ${
                isHovered ? 'scale-105 brightness-110' : 'scale-100'
              }`}></div>
              
              <div className="relative z-10 flex items-center justify-center">
                <Shield className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" />
                <span className="text-white font-bold">
                  {routeRecommendation ? 'Check Current Location' : 'Find My Best Seat'}
                </span>
                <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Compass className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
            </Button>

            {/* Vehicle-focused Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Smart Positioning</p>
                  <p className="text-xs text-gray-600">Optimal seat based on sun direction</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100 transition-all hover:bg-amber-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Direction Aware</p>
                  <p className="text-xs text-gray-600">Real-time travel direction detection</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border border-green-100 transition-all hover:bg-green-100">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">Time Analysis</p>
                  <p className="text-xs text-gray-600">Considers current sun position</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          {/* Route Mode Button */}
          <Card 
            className="p-4 cursor-pointer group hover:shadow-lg transition-all duration-300 border border-blue-200 bg-white rounded-2xl overflow-hidden relative"
            onClick={handleRouteMode}
          >
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 mb-2 group-hover:scale-110 transition-transform mx-auto">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Route Mode</h3>
              <p className="text-xs text-gray-600">
                Plan journey
              </p>
            </div>
          </Card>

          {/* Settings Button */}
          <Card 
            className="p-4 cursor-pointer group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white rounded-2xl overflow-hidden relative"
            onClick={handleSettings}
          >
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 mb-2 group-hover:scale-110 transition-transform mx-auto">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Settings</h3>
              <p className="text-xs text-gray-600">
                Preferences
              </p>
            </div>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-6 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-700 font-medium">
              Ready to find your perfect seat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
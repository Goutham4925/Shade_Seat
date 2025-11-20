import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { ArrowLeft, MapPin, Compass, Sun, Navigation, Shield, Clock, Route, Target, Moon, Stars } from "lucide-react";
import { calculateSeatRecommendation, degreesToCardinal } from "@/lib/sunCalculator";
import type { SeatRecommendation } from "@/lib/sunCalculator";
import { useEventTracker } from "@/hooks/useGoogleAnalytics";
import { AppEvents } from "@/lib/analytics";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<SeatRecommendation | null>(null);
  const [calculationTime, setCalculationTime] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const trackEvent = useEventTracker();

  const { latitude, longitude, heading } = location.state || {};

  useEffect(() => {
    if (!latitude || !longitude || heading === undefined) {
      navigate('/');
      return;
    }

    // Calculate recommendation
    const startTime = performance.now();
    const result = calculateSeatRecommendation(latitude, longitude, heading);
    const endTime = performance.now();
    const calculationDuration = endTime - startTime;

    setRecommendation(result);
    setCalculationTime(new Date().toLocaleTimeString());

    // Track calculation completion
    trackEvent(AppEvents.SEAT_RECOMMENDATION_CALCULATED, {
      latitude,
      longitude,
      heading,
      recommended_side: result.recommendedSide,
      is_night: result.isNight,
      sun_azimuth: result.sunAzimuth,
      calculation_duration_ms: Math.round(calculationDuration),
      timestamp: new Date().toISOString(),
    });

  }, [latitude, longitude, heading, navigate, trackEvent]);

  // Helper function to get display configuration based on recommendation
  const getDisplayConfig = (rec: SeatRecommendation) => {
    if (rec.isNight) {
      return {
        title: "Nighttime Travel",
        subtitle: "Sun position doesn't matter",
        mainColor: "from-purple-600 to-indigo-600",
        badgeColor: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        icon: "🌙",
        seatColor: "bg-purple-500",
        gradientColor: "from-purple-100 dark:from-purple-900/20",
        timeIcon: Moon,
        message: "It's currently nighttime - you can choose any seat comfortably"
      };
    }

    return {
      title: "Analysis Complete",
      subtitle: "Your Optimal Seat Found",
      mainColor: "from-emerald-600 to-green-600",
      badgeColor: "from-orange-50 to-green-50 dark:from-orange-900/20 dark:to-green-900/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      icon: rec.recommendedSide === 'LEFT' ? '🫲' : '🫱',
      seatColor: "bg-orange-500",
      gradientColor: "from-orange-100 dark:from-orange-900/20",
      timeIcon: Sun,
      message: `Sun is on the ${rec.sunPosition.toLowerCase()} side - sit on ${rec.recommendedSide.toLowerCase()} to avoid direct sunlight`
    };
  };

  const handleCheckAnotherLocation = () => {
    trackEvent('check_another_location_clicked', {
      current_recommendation: recommendation?.recommendedSide,
      is_night: recommendation?.isNight,
    });
    navigate('/');
  };

  const handleTryRouteMode = () => {
    trackEvent('try_route_mode_from_result', {
      current_recommendation: recommendation?.recommendedSide,
      is_night: recommendation?.isNight,
    });
    navigate('/route');
  };

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 dark:from-blue-950/30 dark:via-gray-900 dark:to-amber-950/20 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl blur-lg opacity-30 animate-pulse-slow"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg">
              <Compass className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Calculating your perfect seat...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Analyzing sun position and direction</p>
        </div>
      </div>
    );
  }

  const displayConfig = getDisplayConfig(recommendation);

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

          <h1 className={`text-4xl font-bold bg-gradient-to-r ${displayConfig.mainColor} bg-clip-text text-transparent mb-3`}>
            {displayConfig.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">
            {displayConfig.subtitle}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
            {recommendation.isNight 
              ? "Enjoy comfortable seating without sun concerns" 
              : "Based on real-time sun position and travel direction"
            }
          </p>
        </div>

        {/* Enhanced Recommendation Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-8 mb-6 animate-slide-up">
          {/* Background Decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-l ${displayConfig.gradientColor} to-transparent rounded-full -translate-y-16 translate-x-16`}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 dark:from-blue-900/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 text-center">
            {/* Recommendation Badge */}
            <div className={`inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r ${displayConfig.badgeColor} rounded-2xl border-2 ${displayConfig.borderColor} shadow-sm mb-6`}>
              <div className="text-3xl">
                {recommendation.isNight ? '🌙' : displayConfig.icon}
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                  {recommendation.isNight ? "Nighttime Mode" : "Recommended Seat"}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {recommendation.isNight 
                    ? "Any Seat" 
                    : recommendation.recommendedSide === 'LEFT' ? 'Left Side' : 'Right Side'
                  }
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {recommendation.isNight ? (
                <>Choose <span className="text-purple-600 dark:text-purple-400">any seat</span> comfortably</>
              ) : (
                <>Sit on the <span className="text-orange-600 dark:text-orange-400">{recommendation.recommendedSide.toLowerCase()}</span> side</>
              )}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {recommendation.isNight 
                ? "No direct sunlight concerns during nighttime travel" 
                : "To avoid direct sunlight during your journey"
              }
            </p>

            {/* Enhanced Vehicle Visualization */}
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-inner border-2 border-gray-100 dark:border-gray-700">
              <div className="relative w-full h-32">
                {/* Vehicle Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-lg">
                  {/* Windows with nighttime style */}
                  <div className={`absolute top-2 left-3 right-3 h-3 rounded-t-lg border ${
                    recommendation.isNight 
                      ? 'bg-purple-200/40 dark:bg-purple-400/10 border-purple-300/30 dark:border-purple-400/20' 
                      : 'bg-blue-200/60 dark:bg-blue-400/20 border-blue-300/50 dark:border-blue-400/30'
                  }`}></div>
                  
                  {/* Seats with Recommendation Highlight */}
                  <div className={`absolute top-8 left-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    recommendation.isNight 
                      ? 'bg-purple-500 text-white shadow-md scale-105' 
                      : recommendation.recommendedSide === 'LEFT' 
                        ? `${displayConfig.seatColor} text-white shadow-md scale-110` 
                        : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-300'
                  }`}>
                    <span className="text-xs font-bold">L</span>
                  </div>
                  <div className={`absolute top-8 right-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    recommendation.isNight 
                      ? 'bg-purple-500 text-white shadow-md scale-105' 
                      : recommendation.recommendedSide === 'RIGHT' 
                        ? `${displayConfig.seatColor} text-white shadow-md scale-110` 
                        : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-300'
                  }`}>
                    <span className="text-xs font-bold">R</span>
                  </div>
                  
                  {/* Back Seats */}
                  <div className="absolute top-16 left-6 w-5 h-6 bg-gray-400 dark:bg-gray-600 rounded-md"></div>
                  <div className="absolute top-16 right-6 w-5 h-6 bg-gray-400 dark:bg-gray-600 rounded-md"></div>
                  
                  {/* Wheels */}
                  <div className="absolute bottom-1 left-2 w-5 h-2 bg-gray-600 dark:bg-gray-800 rounded-full"></div>
                  <div className="absolute bottom-1 right-2 w-5 h-2 bg-gray-600 dark:bg-gray-800 rounded-full"></div>
                  
                  {/* Direction Arrow */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Compass className="w-3 h-3" />
                      <span className="text-xs font-medium">Travel Direction</span>
                      <div className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-600 dark:border-t-gray-400"></div>
                    </div>
                  </div>
                </div>

                {/* Facing Direction Indicator */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>Facing</span>
                    <div className="w-0 h-0 border-l-2 border-r-2 border-b-2 border-l-transparent border-r-transparent border-b-gray-600 dark:border-b-gray-400"></div>
                    <span>Forward</span>
                  </div>
                </div>

                {/* Nighttime Stars */}
                {recommendation.isNight && (
                  <>
                    <div className="absolute top-4 left-8 w-1 h-1 bg-yellow-200 rounded-full animate-pulse"></div>
                    <div className="absolute top-6 right-10 w-1 h-1 bg-yellow-200 rounded-full animate-pulse delay-300"></div>
                    <div className="absolute top-10 left-12 w-1 h-1 bg-yellow-200 rounded-full animate-pulse delay-700"></div>
                  </>
                )}
              </div>

              {/* Seat Legend */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${
                    recommendation.isNight ? 'bg-purple-500' : displayConfig.seatColor
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {recommendation.isNight ? "Recommended" : "Recommended"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Details Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 mb-6 animate-fade-in-up">
          {/* Background Decoration */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-l ${
            recommendation.isNight 
              ? 'from-purple-100 dark:from-purple-900/20' 
              : 'from-blue-100 dark:from-blue-900/20'
          } to-transparent rounded-full -translate-y-10 translate-x-10`}></div>
          
          <div className="relative z-10">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                recommendation.isNight 
                  ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400' 
                  : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
              }`}>
                {recommendation.isNight ? <Stars className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
              </div>
              <span>{recommendation.isNight ? "Nighttime Analysis" : "Calculation Details"}</span>
            </h3>
            
            <div className="space-y-4">
              {/* Vehicle Direction */}
              <div className={`flex items-center gap-4 p-4 bg-gradient-to-r rounded-2xl border transition-all hover:scale-[1.02] group ${
                recommendation.isNight
                  ? 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                  : 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl group-hover:scale-110 transition-transform ${
                  recommendation.isNight
                    ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                }`}>
                  <Compass className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Direction</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round(recommendation.heading)}° {degreesToCardinal(recommendation.heading)}
                  </p>
                </div>
              </div>

              {/* Sun Direction - Only show for daytime */}
              {!recommendation.isNight && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 transition-all hover:scale-[1.02] hover:bg-amber-100 dark:hover:bg-amber-900/30 group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sun Direction</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.round(recommendation.sunAzimuth)}° {degreesToCardinal(recommendation.sunAzimuth)}
                    </p>
                  </div>
                </div>
              )}

              {/* Nighttime Info - Show for nighttime */}
              {recommendation.isNight && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 transition-all hover:scale-[1.02] hover:bg-purple-100 dark:hover:bg-purple-900/30 group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Time</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      Nighttime
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      No direct sunlight concerns
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-700/80 group">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Location</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>

            {/* Calculation Time */}
            <div className="mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-600/60 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Calculated at {calculationTime}</span>
                {recommendation.isNight && <Moon className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="space-y-4 animate-fade-in-up">
          <Button 
            onClick={handleCheckAnotherLocation}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${
              recommendation.isNight 
                ? 'from-purple-500 to-indigo-500' 
                : 'from-blue-500 to-cyan-500'
            } transition-all duration-500 ${
              isHovered ? 'scale-105 brightness-110' : 'scale-100'
            }`}></div>
            
            <div className="relative z-10 flex items-center justify-center">
              <Target className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
              <span className="text-white font-bold">Check Another Location</span>
              <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Compass className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>
          </Button>

          <Button 
            onClick={handleTryRouteMode}
            variant="outline"
            className="w-full h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all group"
          >
            <Route className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
            Try Route Mode
          </Button>
        </div>

        {/* Enhanced Status Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100 dark:border-gray-700">
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              recommendation.isNight ? 'bg-purple-500' : 'bg-orange-500'
            }`}></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {recommendation.isNight ? "Nighttime Mode Active" : "Optimal Seat Found"}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {recommendation.isNight ? "No sun concerns - enjoy your journey!" : "Enjoy your sun-free journey!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
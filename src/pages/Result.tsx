import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { ArrowLeft, MapPin, Compass, Sun, Navigation, Shield, Clock, Route, Target } from "lucide-react";
import { calculateSeatRecommendation, degreesToCardinal } from "@/lib/sunCalculator";
import type { SeatRecommendation } from "@/lib/sunCalculator";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<SeatRecommendation | null>(null);
  const [calculationTime, setCalculationTime] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);

  const { latitude, longitude, heading } = location.state || {};

  useEffect(() => {
    if (!latitude || !longitude || heading === undefined) {
      navigate('/');
      return;
    }

    // Calculate recommendation
    const result = calculateSeatRecommendation(latitude, longitude, heading);
    setRecommendation(result);
    setCalculationTime(new Date().toLocaleTimeString());
  }, [latitude, longitude, heading, navigate]);

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl blur-lg opacity-30 animate-pulse-slow"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg">
              <Compass className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Calculating your perfect seat...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing sun position and direction</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 py-8 px-4 relative">
      <div className="max-w-md mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-4 hover:bg-gray-100 hover:text-black 
                      rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Button>


          
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">
            Analysis Complete
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Your Optimal Seat Found
          </p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Based on real-time sun position and travel direction
          </p>
        </div>

        {/* Enhanced Recommendation Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white rounded-3xl p-8 mb-6 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-emerald-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 text-center">
            {/* Recommendation Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 shadow-sm mb-6">
              <div className="text-3xl">
                {recommendation.recommendedSide === 'LEFT' ? '🫲' : '🫱'}
              </div>
              <div>
                <div className="font-bold text-emerald-900 text-sm uppercase tracking-wide">
                  Recommended Seat
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {recommendation.recommendedSide === 'LEFT' ? 'Left Side' : 'Right Side'}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Sit on the <span className="text-emerald-600">{recommendation.recommendedSide.toLowerCase()}</span> side
            </h2>
            <p className="text-gray-600 mb-6">
              To avoid direct sunlight during your journey
            </p>

            {/* Enhanced Vehicle Visualization */}
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner border-2 border-gray-100">
              <div className="relative w-full h-32">
                {/* Vehicle Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl border-2 border-gray-300 shadow-lg">
                  {/* Windows */}
                  <div className="absolute top-2 left-3 right-3 h-3 bg-blue-200/60 rounded-t-lg border border-blue-300/50"></div>
                  
                  {/* Seats with Recommendation Highlight */}
                  <div className={`absolute top-8 left-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    recommendation.recommendedSide === 'LEFT' 
                      ? 'bg-emerald-500 text-white shadow-md scale-110' 
                      : 'bg-gray-300 text-gray-700'
                  }`}>
                    <span className="text-xs font-bold">L</span>
                  </div>
                  <div className={`absolute top-8 right-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    recommendation.recommendedSide === 'RIGHT' 
                      ? 'bg-emerald-500 text-white shadow-md scale-110' 
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
                  <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                  <span className="text-xs text-gray-600">Recommended</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Details Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 animate-fade-in-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-blue-100 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="relative z-10">
            <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600">
                <Navigation className="w-5 h-5" />
              </div>
              <span>Calculation Details</span>
            </h3>
            
            <div className="space-y-4">
              {/* Vehicle Direction */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 transition-all hover:bg-blue-100 group">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Vehicle Direction</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(recommendation.heading)}° {degreesToCardinal(recommendation.heading)}
                  </p>
                </div>
              </div>

              {/* Sun Direction */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 transition-all hover:bg-amber-100 group">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                  <Sun className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Sun Direction</p>
                  <p className="text-lg font-bold text-gray-900">
                    {Math.round(recommendation.sunAzimuth)}° {degreesToCardinal(recommendation.sunAzimuth)}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100 group">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 text-gray-600 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Current Location</p>
                  <p className="text-sm text-gray-900 font-mono">
                    {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                  </p>
                </div>
              </div>
            </div>

            {/* Calculation Time */}
            <div className="mt-6 pt-4 border-t border-gray-200/60 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Calculated at {calculationTime}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="space-y-4 animate-fade-in-up">
          <Button 
            onClick={() => navigate('/')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-0"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ${
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
            onClick={() => navigate('/route')}
            variant="outline"
            className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm transition-all group"
          >
            <Route className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
            Try Route Mode
          </Button>
        </div>

        {/* Enhanced Status Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Optimal Seat Found</p>
              <p className="text-xs text-gray-600">Enjoy your sun-free journey!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings as SettingsIcon, Info, Compass, Navigation, Sun, Shield, MapPin, Route } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [autoHeading, setAutoHeading] = useState(true);
  const [showDegrees, setShowDegrees] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            Settings
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Customize Your Experience
          </p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            Tailor the app to your preferences and needs
          </p>
        </div>

        {/* Enhanced Settings Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white rounded-3xl p-8 mb-8 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-gray-100 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="space-y-6">
              {/* Auto Heading Setting */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 group">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="auto-heading" className="text-base font-semibold text-gray-900 block mb-1">
                      Auto-detect Heading
                    </Label>
                    <p className="text-sm text-gray-600">
                      Use device compass for automatic direction detection
                    </p>
                  </div>
                </div>
                <Switch
                  id="auto-heading"
                  checked={autoHeading}
                  onCheckedChange={setAutoHeading}
                  className="data-[state=checked]:bg-blue-500 scale-110"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200/60" />

              {/* Show Degrees Setting */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 group">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="show-degrees" className="text-base font-semibold text-gray-900 block mb-1">
                      Show Degree Measurements
                    </Label>
                    <p className="text-sm text-gray-600">
                      Display precise degree measurements and bearings
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-degrees"
                  checked={showDegrees}
                  onCheckedChange={setShowDegrees}
                  className="data-[state=checked]:bg-green-500 scale-110"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200/60" />

              {/* High Accuracy Setting */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 group">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="high-accuracy" className="text-base font-semibold text-gray-900 block mb-1">
                      High Accuracy Mode
                    </Label>
                    <p className="text-sm text-gray-600">
                      Use more precise location services (may use more battery)
                    </p>
                  </div>
                </div>
                <Switch
                  id="high-accuracy"
                  checked={highAccuracy}
                  onCheckedChange={setHighAccuracy}
                  className="data-[state=checked]:bg-amber-500 scale-110"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200/60" />

              {/* Dark Mode Setting */}
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 group">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="dark-mode" className="text-base font-semibold text-gray-900 block mb-1">
                      Dark Mode
                    </Label>
                    <p className="text-sm text-gray-600">
                      Switch to dark theme for better visibility
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  className="data-[state=checked]:bg-purple-500 scale-110"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced App Info Card */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white rounded-3xl p-6 mb-6 animate-fade-in-up">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-l from-blue-100 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-1">About SunSafe</h3>
                <p className="text-sm text-gray-600">
                  Version 1.0.0 • Built with ❤️ for commuters
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                SunSafe helps commuters find the optimal seat to avoid direct sunlight using real-time sun position calculations and smart direction detection.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 transition-all hover:bg-blue-100 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">GPS Location</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 transition-all hover:bg-green-100 group">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Compass</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 transition-all hover:bg-amber-100 group">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Sun Position</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 transition-all hover:bg-purple-100 group">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Privacy First</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Permissions Info */}
        <div className="text-center animate-fade-in-up mb-6">
          <div className="inline-flex items-start gap-4 px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 max-w-sm">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex-shrink-0">
              🔒
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-blue-900 mb-1">Privacy & Permissions</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                This app requires location and compass access for accurate recommendations. All data is processed locally on your device - nothing is stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          <Button 
            variant="outline" 
            className="rounded-2xl h-12 border-2 border-gray-200 hover:border-gray-300 bg-white transition-all group"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                🏠
              </div>
              <span>Home</span>
            </div>
          </Button>
          <Button 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="rounded-2xl h-12 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-0"
            onClick={() => window.location.reload()}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 transition-all duration-500 ${
              isHovered ? 'scale-105 brightness-110' : 'scale-100'
            }`}></div>
            
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-5 h-5 mr-2 transition-transform group-hover:scale-110 group-hover:rotate-180">
                🔄
              </div>
              <span className="text-white font-medium">Apply Changes</span>
            </div>
          </Button>
        </div>

        {/* Enhanced Status Footer */}
        <div className="mt-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow border border-gray-100">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Settings Ready</p>
              <p className="text-xs text-gray-600">Your preferences are saved automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
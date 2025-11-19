import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Navigation, MapPin, Compass, Settings, Shield, Clock, Route, X, Lightbulb, Car, Moon, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { HeadingDetector } from "@/lib/headingDetector";
import Lottie from "lottie-react";
import littleSunAnimation from "@/animations/little sun.json";
import { useSettings } from "@/contexts/SettingsContext";

// PWA Install Overlay Component - Mobile Optimized
const PWAInstallOverlay = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pwaSupported, setPwaSupported] = useState(false);

  useEffect(() => {
    // Check device type
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Check PWA support
    const checkPwaSupport = () => {
      const checks = {
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        isHTTPS: window.location.protocol === 'https:',
        isLocalhost: window.location.hostname === 'localhost',
        beforeInstallPrompt: 'BeforeInstallPromptEvent' in window
      };
      
      console.log('🔍 PWA Support Check:', checks);
      return Object.values(checks).some(Boolean);
    };

    setPwaSupported(checkPwaSupport());

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🎉 BEFOREINSTALLPROMPT FIRED - PWA install available!');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // On mobile, wait for user interaction before showing prompt
      if (mobileCheck) {
        console.log('📱 Mobile detected - storing prompt for later');
        // Don't auto-show on mobile, wait for user action
      } else {
        // On desktop, show immediately
        showOverlay();
      }
    };

    const showOverlay = () => {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const hasInstalled = localStorage.getItem('pwa-install-accepted');
      
      if (!hasSeenPrompt && !hasInstalled) {
        console.log('🎯 Showing install overlay');
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For mobile Chrome, we need to trigger after user interaction
    const handleUserInteraction = () => {
      if (deferredPrompt && mobileCheck && !isVisible) {
        console.log('👆 User interaction detected - showing install prompt');
        showOverlay();
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    // Development: auto-show after delay for testing
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if (!isVisible && !localStorage.getItem('pwa-prompt-dismissed')) {
          console.log('🧪 Development mode - showing overlay');
          setIsVisible(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [deferredPrompt, isVisible]);

  const handleInstall = async () => {
    console.log('🚀 Install button clicked');
    
    if (deferredPrompt) {
      try {
        console.log('📲 Prompting installation...');
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log('✅ User choice:', outcome);
        
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-install-accepted', 'true');
          console.log('🎉 PWA install accepted');
        }
        
        setDeferredPrompt(null);
        setIsVisible(false);
        
      } catch (error) {
        console.error('❌ Error during install prompt:', error);
        showManualInstructions();
      }
    } else {
      console.log('📋 No deferred prompt, showing manual instructions');
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/i.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `To install Shade Seat on iOS:
1. Tap the Share button (📤) at the bottom
2. Scroll down and tap "Add to Home Screen" 
3. Tap "Add" in the top right

This will add the app to your home screen!`;
    } else if (isAndroid && isChrome) {
      instructions = `To install Shade Seat on Android Chrome:
1. Tap the menu (⋮) in the top right  
2. Tap "Add to Home screen" or "Install app"
3. Tap "Install" to confirm

The app will be added to your home screen!`;
    } else {
      instructions = `To install Shade Seat:
Look for the install option in your browser menu, usually under:
- "Add to Home Screen"
- "Install app" 
- Or check the address bar for an install icon`;
    }
    
    alert(instructions);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    console.log('❌ User dismissed install prompt');
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    // Show again after 14 days
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
    }, 14 * 24 * 60 * 60 * 1000);
  };

  // Don't show if app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 App already installed in standalone mode');
    return null;
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="relative max-w-md w-full mx-auto overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-blue-50 to-amber-50/50 dark:from-gray-800 dark:to-gray-900 rounded-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 p-0 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Shade Seat Logo" 
                className="w-16 h-16 object-contain rounded-2xl shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Download className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
            Install Shade Seat
          </h2>
          
          <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Get the full app experience
          </p>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {isMobile 
              ? "Add to home screen for one-tap access and faster loading"
              : "Install for quick access and offline functionality"
            }
          </p>

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                {isMobile ? '📱 Mobile' : '💻 Desktop'} | 
                {deferredPrompt ? ' ✅ Install Ready' : ' ❌ No Prompt'} |
                {pwaSupported ? ' ✅ PWA Supported' : ' ❌ PWA Issues'}
              </p>
            </div>
          )}

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
              <Smartphone className="w-5 h-5 text-blue-500" />
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">App-like Experience</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Full-screen, no browser UI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
              <Download className="w-5 h-5 text-green-500" />
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Quick Access</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Launch from home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-600">
              <Clock className="w-5 h-5 text-purple-500" />
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Faster Loading</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Works offline when possible</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleInstall}
              className="w-full h-12 text-lg font-semibold rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden border-none"
              size="lg"
            >
              <div className="absolute inset-0 z-0 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"></div>
              <div className="relative z-10 flex items-center justify-center w-full h-full gap-2">
                <Download className="w-5 h-5 text-white" />
                <span className="text-white font-bold">
                  {isMobile ? 'Add to Home Screen' : 'Install App'}
                </span>
              </div>
            </Button>

            <Button
              onClick={showManualInstructions}
              variant="outline"
              className="w-full border-blue-300 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Show Instructions
            </Button>

            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
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
        setAnimationData(littleSunAnimation);
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
      const isNight = location.state.recommendation?.isNighttime || location.state.isNighttime;
      if (isNight) {
        toast.success("🌙 Nighttime travel detected - any seat is comfortable!");
      } else {
        toast.success("Route analysis complete!");
      }
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
          enableHighAccuracy: settings.highAccuracy,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      if (!settings.autoHeading || !HeadingDetector.isSupported()) {
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

  const getRecommendationSide = (): 'left' | 'right' | 'any' | null => {
    if (!routeRecommendation?.recommendation) return null;
    
    const rec = routeRecommendation.recommendation;
    
    try {
      // Check if it's nighttime first
      const isNighttime = rec.isNighttime || routeRecommendation.isNighttime;
      if (isNighttime) {
        return 'any';
      }
      
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

  const isNighttimeRecommendation = (): boolean => {
    if (!routeRecommendation?.recommendation) return false;
    const rec = routeRecommendation.recommendation;
    return rec.isNighttime || routeRecommendation.isNighttime;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50/30 dark:from-blue-950/30 dark:via-gray-900 dark:to-amber-950/20 py-6 px-4 relative">
      <LoadingOverlay isLoading={safeSeatLoading || routeModeLoading || settingsLoading} animationData={animationData} />
      
      {/* PWA Install Overlay */}
      <PWAInstallOverlay />

      <div className="max-w-md mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          {/* Logo Image */}
          <div className="flex justify-center mb-3">
            <img 
              src="/logo.png" 
              alt="Shade Seat Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
            Shade Seat
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Smart Seat Selection
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
            Choose the perfect seat to avoid direct sunlight
          </p>
        </div>

        {/* Main Vehicle Card with Integrated Recommendation */}
        <Card className="relative overflow-hidden shadow-2xl border-0 bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 animate-slide-up">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-l from-amber-100 dark:from-amber-900/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-blue-100 dark:from-blue-900/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            {/* Route Recommendation Badge */}
            {routeRecommendation && (
              <div className={`mb-6 p-4 rounded-2xl border-2 shadow-sm ${
                isNighttimeRecommendation() 
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800'
                  : 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isNighttimeRecommendation() ? (
                      <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Route className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className={`font-bold ${
                      isNighttimeRecommendation() 
                        ? 'text-purple-900 dark:text-purple-100' 
                        : 'text-emerald-900 dark:text-emerald-100'
                    }`}>
                      {isNighttimeRecommendation() ? 'Nighttime Travel' : 'Route Analysis Complete'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRouteRecommendation}
                    className={`w-7 h-7 p-0 rounded-full bg-white dark:bg-gray-700 border ${
                      isNighttimeRecommendation()
                        ? 'hover:bg-purple-50 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800'
                        : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    <X className={`w-3 h-3 ${
                      isNighttimeRecommendation() 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </Button>
                </div>
                
                <div className="text-center">
                  {isNighttimeRecommendation() ? (
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                      <div className="text-2xl">🌙</div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                          ANY SEAT IS FINE
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          It's nighttime - no sun issues
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl ${
                      getRecommendationSide() === 'left' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                        : 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                    }`}>
                      <div className="text-2xl">
                        {getRecommendationSide() === 'left' ? '🫲' : '🫱'}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                          RECOMMENDED SEAT
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">
                          {getRecommendationSide() === 'left' ? 'Left Side' : 'Right Side'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Vehicle Visualization */}
            <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-inner border-2 border-gray-100 dark:border-gray-700">
              <div className="relative w-full h-32">
                {/* Vehicle Body */}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-lg">
                  {/* Windows */}
                  <div className="absolute top-2 left-3 right-3 h-3 bg-blue-200/60 dark:bg-blue-400/20 rounded-t-lg border border-blue-300/50 dark:border-blue-400/30"></div>
                  
                  {/* Seats with Recommendation Highlight */}
                  {isNighttimeRecommendation() ? (
                    // Nighttime - both seats highlighted
                    <>
                      <div className="absolute top-8 left-4 w-7 h-9 rounded-lg flex items-center justify-center bg-purple-500 text-white shadow-md scale-110 transition-all duration-300">
                        <span className="text-xs font-bold">L</span>
                      </div>
                      <div className="absolute top-8 right-4 w-7 h-9 rounded-lg flex items-center justify-center bg-purple-500 text-white shadow-md scale-110 transition-all duration-300">
                        <span className="text-xs font-bold">R</span>
                      </div>
                    </>
                  ) : (
                    // Daytime - only recommended seat highlighted
                    <>
                      <div className={`absolute top-8 left-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        getRecommendationSide() === 'left' 
                          ? 'bg-blue-500 text-white shadow-md scale-110' 
                          : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-300'
                      }`}>
                        <span className="text-xs font-bold">L</span>
                      </div>
                      <div className={`absolute top-8 right-4 w-7 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        getRecommendationSide() === 'right' 
                          ? 'bg-amber-500 text-white shadow-md scale-110' 
                          : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-300'
                      }`}>
                        <span className="text-xs font-bold">R</span>
                      </div>
                    </>
                  )}
                  
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
              </div>

              {/* Seat Legend */}
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${
                    isNighttimeRecommendation() 
                      ? 'bg-purple-500' 
                      : getRecommendationSide() === 'left' 
                        ? 'bg-blue-500' 
                        : 'bg-amber-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {isNighttimeRecommendation() ? 'Any Seat' : 'Recommended'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Primary CTA Button */}
            <Button
              onClick={handleCheckSafeSide}
              disabled={safeSeatLoading}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full h-16 text-lg font-semibold rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden mb-6 border-none"
              size="lg"
            >
              {/* Animated gradient background */}
              <div
                className="absolute inset-0 z-0 rounded-2xl transition-all duration-1000"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #fb923c, #f97316)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: isHovered ? '100% 0' : '0 0',
                  transition: 'background-position 1s ease-in-out',
                  filter: 'brightness(1.1)',
                }}
              ></div>

              {/* Overlay for subtle hover glow */}
              <div
                className={`absolute inset-0 z-0 rounded-2xl bg-black opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-10' : ''}`}
              ></div>

              {/* Button content */}
              <div className="relative z-10 flex items-center justify-center w-full h-full gap-3">
                <Shield className="w-6 h-6 text-white" />
                <span className="text-white font-bold tracking-wide">
                  {routeRecommendation ? 'Check Current Location' : 'Find My Best Seat'}
                </span>
              </div>
            </Button>

            {/* Vehicle-focused Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Smart Positioning</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Optimal seat based on sun direction</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Direction Aware</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Real-time travel direction detection</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 transition-all hover:bg-green-100 dark:hover:bg-green-900/30">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Time Analysis</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Considers current sun position</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          {/* Route Mode Button */}
          <Card 
            className="p-4 cursor-pointer group hover:shadow-lg transition-all duration-300 border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden relative"
            onClick={handleRouteMode}
          >
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-2 group-hover:scale-110 transition-transform mx-auto">
                <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Route Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Plan journey
              </p>
            </div>
          </Card>

          {/* Settings Button */}
          <Card 
            className="p-4 cursor-pointer group hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden relative"
            onClick={handleSettings}
          >
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mb-2 group-hover:scale-110 transition-transform mx-auto">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">Settings</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Preferences
              </p>
            </div>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-6 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow border border-gray-100 dark:border-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
              Ready to find your perfect seat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
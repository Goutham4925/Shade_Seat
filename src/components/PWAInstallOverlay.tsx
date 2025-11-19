import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Clock } from 'lucide-react';

export const PWAInstallOverlay = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pwaSupported, setPwaSupported] = useState(false);

  useEffect(() => {
    console.log('🔍 PWAInstallOverlay: Setting up event listeners');

    // Check device type
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    console.log('📱 Device is mobile:', mobileCheck);

    // Check PWA support
    const checkPwaSupport = () => {
      const manifest = document.querySelector('link[rel="manifest"]');
      const checks = {
        hasManifest: !!manifest,
        hasServiceWorker: 'serviceWorker' in navigator,
        isHTTPS: window.location.protocol === 'https:',
        isLocalhost: window.location.hostname === 'localhost',
        beforeInstallPrompt: 'BeforeInstallPromptEvent' in window
      };
      
      console.log('🔍 PWA Support Check:', checks);
      const supported = Object.values(checks).some(Boolean);
      setPwaSupported(supported);
      return supported;
    };

    checkPwaSupport();

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🎉 BEFOREINSTALLPROMPT FIRED! Event:', e);
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const hasInstalled = localStorage.getItem('pwa-install-accepted');
      
      console.log('📊 User state - Seen prompt:', hasSeenPrompt, 'Installed:', hasInstalled);
      
      if (!hasSeenPrompt && !hasInstalled) {
        console.log('🎯 Showing install overlay');
        setIsVisible(true);
      } else {
        console.log('🚫 Not showing overlay - user has dismissed or installed');
      }
    };

    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    console.log('👂 Added beforeinstallprompt listener');

    // Check if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone;
      
      console.log('📱 Install check - Standalone:', isStandalone, 'iOS Standalone:', isIOSStandalone);
      
      if (isStandalone || isIOSStandalone) {
        console.log('✅ App is already installed');
        setIsVisible(false);
        return true;
      }
      return false;
    };

    checkIfInstalled();

    // Development: Always show after delay for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode - will show overlay after delay');
      const timer = setTimeout(() => {
        if (!checkIfInstalled() && !localStorage.getItem('pwa-prompt-dismissed')) {
          console.log('⏰ Development timer - showing overlay');
          setIsVisible(true);
        }
      }, 3000);
      
      return () => {
        console.log('🧹 Cleaning up PWAInstallOverlay');
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        clearTimeout(timer);
      };
    }

    return () => {
      console.log('🧹 Cleaning up PWAInstallOverlay');
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
      console.log('❌ No deferred prompt available');
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
3. Tap "Add" in the top right`;
    } else if (isAndroid && isChrome) {
      instructions = `To install Shade Seat on Android Chrome:
1. Tap the menu (⋮) in the top right  
2. Tap "Add to Home screen" or "Install app"
3. Tap "Install" to confirm`;
    } else {
      instructions = `To install Shade Seat:
- Look for the install icon in your browser's address bar
- Or check browser menu for "Install" option
- On desktop: Chrome shows a install icon (📥) in address bar`;
    }
    
    alert(instructions);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    console.log('❌ User dismissed install prompt');
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
      console.log('🔄 Install prompt reset');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Don't show if already installed
  if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
    return null;
  }

  if (!isVisible) return null;

  console.log('🎪 Rendering PWA install overlay');

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
              <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center font-mono">
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
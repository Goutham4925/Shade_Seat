import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

export const PWAInstallOverlay = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('🔔 BeforeInstallPrompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if we should show the overlay
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log('📱 Is mobile:', isMobile);
      console.log('👀 Has seen prompt:', hasSeenPrompt);
      
      // Show on mobile or if we're testing
      if (!hasSeenPrompt && (isMobile || process.env.NODE_ENV === 'development')) {
        console.log('🎯 Showing install overlay');
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 App is already installed');
      setIsVisible(false);
    }

    // For testing: show after 5 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        console.log('⏰ Development timer - showing overlay');
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    console.log('🚀 Install button clicked');
    if (!deferredPrompt) {
      console.log('❌ No deferred prompt available');
      return;
    }

    try {
      console.log('📲 Prompting installation...');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('✅ User choice:', outcome);
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-install-accepted', 'true');
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('❌ Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    console.log('❌ User dismissed install prompt');
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    // Show again after 7 days instead of 30 for testing
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

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
            Install Shade Seat for quick access, offline functionality, and an optimized mobile experience.
          </p>

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
                <span className="text-white font-bold">Install App</span>
              </div>
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
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Clock } from 'lucide-react';

export const PWAInstallOverlay = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check device type
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('✅ PWA Install Available!');
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const hasInstalled = localStorage.getItem('pwa-install-accepted');
      
      if (!hasSeenPrompt && !hasInstalled) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show overlay after delay - this ensures users see it even if beforeinstallprompt doesn't fire
    const showTimer = setTimeout(() => {
      const hasSeenPrompt = localStorage.getItem('pwa-prompt-dismissed');
      const hasInstalled = localStorage.getItem('pwa-install-accepted');
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      
      if (!hasSeenPrompt && !hasInstalled && !isInstalled && !isVisible) {
        console.log('🕒 Showing overlay via timer');
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(showTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Direct PWA installation
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-install-accepted', 'true');
        }
        
        setDeferredPrompt(null);
        setIsVisible(false);
        
      } catch (error) {
        console.error('Install error:', error);
        setIsVisible(false);
      }
    } else {
      // No deferred prompt - just close and let user use browser's native install
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
    
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-dismissed');
    }, 30 * 24 * 60 * 60 * 1000);
  };

  // Don't show if already installed
  if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
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
            <img 
              src="/logo.png" 
              alt="Shade Seat Logo" 
              className="w-16 h-16 object-contain"
            />
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
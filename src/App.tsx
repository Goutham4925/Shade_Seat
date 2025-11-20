import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import SplashScreen from "@/components/ui/SplashScreen";
import { PWAInstallOverlay } from "@/components/PWAInstallOverlay";
import Index from "./pages/Index";
import Result from "./pages/Result";
import HeadingSelect from "./pages/HeadingSelect";
import RouteMode from "./pages/RouteMode";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Analytics, AppEvents } from "./lib/analytics";

const queryClient = new QueryClient();

// Create a separate component that uses the router
const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
    Analytics.trackEvent(AppEvents.SPLASH_SCREEN_COMPLETE);
  };

  // Track app launch and errors
  useEffect(() => {
    // Track app launch
    Analytics.trackEvent(AppEvents.APP_LAUNCH, {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    });

    // Track errors
    const handleError = (event: ErrorEvent) => {
      Analytics.trackError(event.error?.message || event.message, false);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      Analytics.trackError(event.reason?.message || 'Unhandled promise rejection', false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Listen for new version notifications from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        console.log('New version available:', event.data.commit);
        Analytics.trackEvent('new_version_available', {
          commit: event.data.commit,
          timestamp: new Date().toISOString(),
        });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  if (showSplash) {
    return (
      <SplashScreen 
        message="Welcome to Shade Seat"
        onFinish={handleSplashFinish} 
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/result" element={<Result />} />
      <Route path="/heading-select" element={<HeadingSelect />} />
      <Route path="/route" element={<RouteMode />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PWAInstallOverlay />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
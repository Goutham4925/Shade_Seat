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

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Listen for new version notifications from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        console.log('New version available:', event.data.commit);
        // Service worker will automatically handle cache clearing
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
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PWAInstallOverlay />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/result" element={<Result />} />
              <Route path="/heading-select" element={<HeadingSelect />} />
              <Route path="/route" element={<RouteMode />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

export default App;
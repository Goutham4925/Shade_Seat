import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SettingsProvider } from "@/contexts/SettingsContext"; // Add this import
import SplashScreen from "@/components/ui/SplashScreen";
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

  // Show splash on initial mount
  if (showSplash) {
    return (
      <SplashScreen 
        message="Welcome to Shade Seat"
        onFinish={handleSplashFinish} 
      />
    );
  }

  // Main app renders after splash - WRAP with SettingsProvider
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider> {/* Add this wrapper */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/result" element={<Result />} />
              <Route path="/heading-select" element={<HeadingSelect />} />
              <Route path="/route" element={<RouteMode />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SettingsProvider> {/* Close SettingsProvider */}
    </QueryClientProvider>
  );
};

export default App;
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: Record<string, any>[];
  }
}

export const useGoogleAnalytics = () => {
  // Use useLocation only if we're inside a Router context
  let location;
  try {
    // This will throw an error if we're not inside a Router
    location = useLocation();
  } catch (error) {
    // If we're not in a Router context, return early
    console.warn('useGoogleAnalytics: Not inside Router context, skipping page tracking');
    return;
  }

  useEffect(() => {
    // Track page views
    if (typeof window.gtag === 'function' && location) {
      window.gtag('config', 'G-3G3K2CGYJ2', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname,
      });
    }
  }, [location]);
};

// Custom event tracking hook - this doesn't need router context
export const useEventTracker = () => {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }
  };

  return trackEvent;
};
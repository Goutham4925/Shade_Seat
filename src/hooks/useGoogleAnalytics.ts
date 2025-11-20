// src/hooks/useGoogleAnalytics.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

/**
 * useGoogleAnalytics
 * Pushes SPA route changes as page_view events into dataLayer for GTM to pick up.
 */
export const useGoogleAnalytics = () => {
  let location;
  try {
    location = useLocation();
  } catch {
    // Not inside a Router - nothing to do
    console.warn('useGoogleAnalytics: Not inside Router context, skipping page tracking');
    return;
  }

  useEffect(() => {
    if (!location) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      event_parameters: {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname,
      },
    });
  }, [location]);
};

/**
 * useEventTracker
 * Returns a trackEvent function that pushes custom events to dataLayer.
 */
export const useEventTracker = () => {
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      event_parameters: parameters || {},
    });
  };

  return trackEvent;
};

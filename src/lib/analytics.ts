// Analytics utility functions
export const Analytics = {
  // Track page views
  trackPageView: (pageTitle: string, pageLocation: string, pagePath: string) => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-3G3K2CGYJ2', {
        page_title: pageTitle,
        page_location: pageLocation,
        page_path: pagePath,
      });
    }
  },

  // Track custom events
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }
  },

  // Track exceptions/errors
  trackError: (description: string, fatal: boolean = false) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'exception', {
        description,
        fatal
      });
    }
  },

  // Track user timing
  trackTiming: (category: string, variable: string, value: number, label?: string) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'timing_complete', {
        name: variable,
        value: value,
        event_category: category,
        event_label: label,
      });
    }
  }
};

// Predefined events for your app
export const AppEvents = {
  // App usage events
  APP_LAUNCH: 'app_launch',
  SPLASH_SCREEN_COMPLETE: 'splash_screen_complete',
  PWA_INSTALL_PROMPT: 'pwa_install_prompt',
  PWA_INSTALL_ACCEPTED: 'pwa_install_accepted',
  PWA_INSTALL_DISMISSED: 'pwa_install_dismissed',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  NAVIGATION_ERROR: 'navigation_error',   // ✅ Added
  
  // Location & Permissions events
  LOCATION_PERMISSION_REQUESTED: 'location_permission_requested',
  LOCATION_PERMISSION_GRANTED: 'location_permission_granted',
  LOCATION_PERMISSION_DENIED: 'location_permission_denied',
  LOCATION_DETECTED: 'location_detected',
  LOCATION_ERROR: 'location_error',
  
  // Compass events
  COMPASS_PERMISSION_REQUESTED: 'compass_permission_requested',
  COMPASS_PERMISSION_GRANTED: 'compass_permission_granted',
  COMPASS_PERMISSION_DENIED: 'compass_permission_denied',
  COMPASS_DETECTED: 'compass_detected',
  COMPASS_ERROR: 'compass_error',
  
  // Feature usage events
  SEAT_RECOMMENDATION_REQUESTED: 'seat_recommendation_requested',
  SEAT_RECOMMENDATION_CALCULATED: 'seat_recommendation_calculated',
  ROUTE_MODE_SELECTED: 'route_mode_selected',
  MANUAL_MODE_SELECTED: 'manual_mode_selected',
  HEADING_SELECTED: 'heading_selected',
  SETTINGS_OPENED: 'settings_opened',
  SETTINGS_CHANGED: 'settings_changed',
  
  // Route Mode events
  ROUTE_CALCULATION_STARTED: 'route_calculation_started',
  ROUTE_CALCULATION_COMPLETED: 'route_calculation_completed',
  ROUTE_CALCULATION_ERROR: 'route_calculation_error',
  GEOCODING_REQUESTED: 'geocoding_requested',
  GEOCODING_SUCCESS: 'geocoding_success',
  GEOCODING_ERROR: 'geocoding_error',
  
  // Time selection events
  TRAVEL_TIME_SELECTED: 'travel_time_selected',
  CURRENT_TIME_USED: 'current_time_used',
  
  // Error events
  CALCULATION_ERROR: 'calculation_error',
  PERMISSION_ERROR: 'permission_error',
  NETWORK_ERROR: 'network_error'
};

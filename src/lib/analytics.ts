// src/lib/analytics.ts
// Analytics utility functions (GTM-only)
declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

export const Analytics = {
  // Track page views (SPA-friendly)
  trackPageView: (pageTitle: string, pageLocation: string, pagePath: string) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      event_parameters: {
        page_title: pageTitle,
        page_location: pageLocation,
        page_path: pagePath,
      },
    });
  },

  // Generic event tracking
  trackEvent: (eventName: string, parameters?: Record<string, any>) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      event_parameters: parameters || {},
    });
  },

  // Track exceptions/errors
  trackError: (description: string, fatal: boolean = false) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'exception',
      event_parameters: {
        description,
        fatal,
      },
    });
  },

  // Timing / performance events
  trackTiming: (category: string, variable: string, value: number, label?: string) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'timing_complete',
      event_parameters: {
        category,
        variable,
        value,
        label,
      },
    });
  },
};

// Canonical event names (keeps your current imports working)
export const AppEvents = {
  APP_LAUNCH: 'app_launch',
  SPLASH_SCREEN_COMPLETE: 'splash_screen_complete',
  PWA_INSTALL_PROMPT: 'pwa_install_prompt',
  PWA_INSTALL_ACCEPTED: 'pwa_install_accepted',
  PWA_INSTALL_DISMISSED: 'pwa_install_dismissed',

  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  NAVIGATION_ERROR: 'navigation_error',

  LOCATION_PERMISSION_REQUESTED: 'location_permission_requested',
  LOCATION_PERMISSION_GRANTED: 'location_permission_granted',
  LOCATION_PERMISSION_DENIED: 'location_permission_denied',
  LOCATION_DETECTED: 'location_detected',
  LOCATION_ERROR: 'location_error',

  COMPASS_PERMISSION_REQUESTED: 'compass_permission_requested',
  COMPASS_PERMISSION_GRANTED: 'compass_permission_granted',
  COMPASS_PERMISSION_DENIED: 'compass_permission_denied',
  COMPASS_DETECTED: 'compass_detected',
  COMPASS_ERROR: 'compass_error',

  SEAT_RECOMMENDATION_REQUESTED: 'seat_recommendation_requested',
  SEAT_RECOMMENDATION_CALCULATED: 'seat_recommendation_calculated',
  ROUTE_MODE_SELECTED: 'route_mode_selected',
  MANUAL_MODE_SELECTED: 'manual_mode_selected',
  HEADING_SELECTED: 'heading_selected',
  SETTINGS_OPENED: 'settings_opened',
  SETTINGS_CHANGED: 'settings_changed',

  ROUTE_CALCULATION_STARTED: 'route_calculation_started',
  ROUTE_CALCULATION_COMPLETED: 'route_calculation_completed',
  ROUTE_CALCULATION_ERROR: 'route_calculation_error',
  GEOCODING_REQUESTED: 'geocoding_requested',
  GEOCODING_SUCCESS: 'geocoding_success',
  GEOCODING_ERROR: 'geocoding_error',

  TRAVEL_TIME_SELECTED: 'travel_time_selected',
  CURRENT_TIME_USED: 'current_time_used',

  CALCULATION_ERROR: 'calculation_error',
  PERMISSION_ERROR: 'permission_error',
  NETWORK_ERROR: 'network_error',
};

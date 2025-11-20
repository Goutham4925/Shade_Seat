import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import animationData from '../animations/404-animation.json';
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useEventTracker } from "@/hooks/useGoogleAnalytics";
import { AppEvents } from "@/lib/analytics";

const NotFound = () => {
  const location = useLocation();
  const trackEvent = useEventTracker();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    
    // Track 404 error
    trackEvent(AppEvents.PAGE_VIEW, {
      page_title: '404 Not Found',
      page_location: window.location.href,
      page_path: location.pathname,
      error_type: '404_not_found',
      referrer: document.referrer || 'direct',
    });

    // Track the 404 event specifically
    trackEvent('404_error', {
      attempted_path: location.pathname,
      full_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, trackEvent]);

  const handleReturnHome = () => {
    // Track when user clicks to return home from 404 page
    trackEvent('404_return_home_clicked', {
      attempted_path: location.pathname,
      return_method: 'link_click',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <Player
          autoplay
          loop
          src={animationData}
          style={{ height: '300px', width: '300px' }}
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Oops! The page you're looking for doesn't exist. 
          You may have mistyped the address or the page has been moved.
        </p>
        <Link
          to="/"
          onClick={handleReturnHome}
          className="
            inline-flex items-center
            mb-6
            px-4 py-2
            rounded-2xl
            text-gray-700 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            hover:text-black dark:hover:text-white
            transition-all duration-300
            group
            border border-gray-200 dark:border-gray-700
            hover:shadow-md
          "
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Return to Home
        </Link>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md mx-auto">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Debug Info:</strong><br />
              Attempted path: {location.pathname}<br />
              Full URL: {window.location.href}<br />
              Referrer: {document.referrer || 'None'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
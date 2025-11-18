import Lottie from "lottie-react";

interface LoadingOverlayProps {
  isLoading: boolean;
  animationData?: any;
  title?: string;
  subtitle?: string;
}

export const LoadingOverlay = ({ 
  isLoading, 
  animationData, 
  title = "Finding Your Safe Seat", 
  subtitle = "Analyzing your position, direction, and sun location..." 
}: LoadingOverlayProps) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center animate-fade-in">
      {/* Lottie Animation */}
      {animationData ? (
        <div className="w-64 h-64 mb-8">
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
          />
        </div>
      ) : (
        // Fallback loading animation
        <div className="w-64 h-64 mb-8 flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-amber-200 dark:border-amber-800 border-t-amber-500 dark:border-t-amber-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-orange-500 dark:border-t-orange-400 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
        </div>
      )}
      
      {/* Loading Text */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          {subtitle}
        </p>
        <div className="flex justify-center space-x-2 pt-4">
          <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};
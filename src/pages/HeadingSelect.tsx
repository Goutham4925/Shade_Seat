import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Navigation, ArrowUp, ArrowRight, ArrowDown, ArrowLeftIcon } from "lucide-react";
import { cardinalToDegrees } from "@/lib/sunCalculator";

const HeadingSelect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDirection, setSelectedDirection] = useState<'NORTH' | 'EAST' | 'SOUTH' | 'WEST' | null>(null);

  const { latitude, longitude } = location.state || {};

  if (!latitude || !longitude) {
    navigate('/');
    return null;
  }

  const handleSubmit = () => {
    if (!selectedDirection) return;
    
    const heading = cardinalToDegrees(selectedDirection);
    
    navigate('/result', {
      state: {
        latitude,
        longitude,
        heading,
      },
    });
  };

  const directions = [
    { value: 'NORTH' as const, label: 'North', icon: ArrowUp, color: 'bg-blue-500' },
    { value: 'EAST' as const, label: 'East', icon: ArrowRight, color: 'bg-orange-500' },
    { value: 'SOUTH' as const, label: 'South', icon: ArrowDown, color: 'bg-red-500' },
    { value: 'WEST' as const, label: 'West', icon: ArrowLeftIcon, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 -ml-4 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 dark:hover:text-white rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Select Your Direction
          </h1>
          <p className="text-muted-foreground">
            Which direction is your vehicle mostly traveling?
          </p>
        </div>

        {/* Direction Selection */}
        <Card className="shadow-soft-lg p-6 mb-6 animate-scale-in">
          <div className="grid grid-cols-2 gap-4">
            {directions.map((direction) => {
              const Icon = direction.icon;
              const isSelected = selectedDirection === direction.value;
              
              return (
                <button
                  key={direction.value}
                  onClick={() => setSelectedDirection(direction.value)}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-300
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-lg scale-105' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`
                      w-14 h-14 rounded-xl flex items-center justify-center
                      ${isSelected ? direction.color : 'bg-muted'}
                      transition-colors
                    `}>
                      <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`
                      font-semibold text-lg
                      ${isSelected ? 'text-primary' : 'text-foreground'}
                    `}>
                      {direction.label}
                    </span>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="shadow-soft p-4 mb-6 animate-fade-in">
          <p className="text-sm text-muted-foreground text-center">
            📍 Location detected: {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
          </p>
        </Card>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!selectedDirection}
          className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
          size="lg"
        >
          Calculate Safe Side
        </Button>

        {/* Help Text */}
        <p className="mt-4 text-xs text-center text-muted-foreground">
          Select the general direction your vehicle will be traveling. This helps us determine where the sun will be relative to your seat.
        </p>
      </div>
    </div>
  );
};

export default HeadingSelect;

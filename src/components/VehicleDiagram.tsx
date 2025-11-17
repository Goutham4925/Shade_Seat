import { cn } from "@/lib/utils";
import { Sun, ArrowUp } from "lucide-react";

interface VehicleDiagramProps {
  recommendedSide?: 'LEFT' | 'RIGHT';
  sunPosition?: 'LEFT' | 'RIGHT';
  heading?: number;
  sunAzimuth?: number;
  className?: string;
}

export const VehicleDiagram = ({ 
  recommendedSide, 
  sunPosition,
  heading,
  sunAzimuth,
  className 
}: VehicleDiagramProps) => {
  const leftIsSafe = recommendedSide === 'LEFT';
  const rightIsSafe = recommendedSide === 'RIGHT';

  return (
    <div className={cn("relative w-full max-w-sm mx-auto", className)}>
      {/* Heading indicator */}
      {heading !== undefined && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <ArrowUp className="w-6 h-6 text-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(heading)}° {getCardinalDirection(heading)}
          </span>
        </div>
      )}

      {/* Sun position indicator */}
      {sunAzimuth !== undefined && sunPosition && (
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 flex items-center gap-2",
          sunPosition === 'LEFT' ? '-left-16' : '-right-16'
        )}>
          <Sun className="w-8 h-8 text-sun animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(sunAzimuth)}°
            </span>
          </div>
        </div>
      )}

      {/* Vehicle */}
      <div className="relative bg-card rounded-3xl shadow-soft-lg p-6 overflow-hidden">
        <div className="flex gap-3">
          {/* Left Side */}
          <div className={cn(
            "flex-1 rounded-2xl p-6 transition-all duration-500 relative overflow-hidden",
            "border-2",
            leftIsSafe 
              ? "bg-accent/10 border-accent shadow-lg" 
              : "bg-muted/50 border-border"
          )}>
            <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[160px]">
              {leftIsSafe && (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent animate-fade-in" />
              )}
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all",
                  leftIsSafe 
                    ? "bg-accent text-accent-foreground scale-110" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <span className="text-2xl font-bold">L</span>
                </div>
                <p className={cn(
                  "text-center font-medium transition-all",
                  leftIsSafe ? "text-accent" : "text-muted-foreground"
                )}>
                  {leftIsSafe ? "✓ Safe" : "Left"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className={cn(
            "flex-1 rounded-2xl p-6 transition-all duration-500 relative overflow-hidden",
            "border-2",
            rightIsSafe 
              ? "bg-accent/10 border-accent shadow-lg" 
              : "bg-muted/50 border-border"
          )}>
            <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[160px]">
              {rightIsSafe && (
                <div className="absolute inset-0 bg-gradient-to-bl from-accent/20 to-transparent animate-fade-in" />
              )}
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all",
                  rightIsSafe 
                    ? "bg-accent text-accent-foreground scale-110" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <span className="text-2xl font-bold">R</span>
                </div>
                <p className={cn(
                  "text-center font-medium transition-all",
                  rightIsSafe ? "text-accent" : "text-muted-foreground"
                )}>
                  {rightIsSafe ? "✓ Safe" : "Right"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Front indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-1 w-12 bg-primary rounded-full" />
          <span className="text-xs font-medium text-muted-foreground">FRONT</span>
          <div className="h-1 w-12 bg-primary rounded-full" />
        </div>
      </div>
    </div>
  );
};

function getCardinalDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
}

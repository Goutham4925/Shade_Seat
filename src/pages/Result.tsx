import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VehicleDiagram } from "@/components/VehicleDiagram";
import { ArrowLeft, MapPin, Compass, Sun, Navigation } from "lucide-react";
import { calculateSeatRecommendation, degreesToCardinal } from "@/lib/sunCalculator";
import type { SeatRecommendation } from "@/lib/sunCalculator";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<SeatRecommendation | null>(null);
  const [calculationTime, setCalculationTime] = useState<string>("");

  const { latitude, longitude, heading } = location.state || {};

  useEffect(() => {
    if (!latitude || !longitude || heading === undefined) {
      navigate('/');
      return;
    }

    // Calculate recommendation
    const result = calculateSeatRecommendation(latitude, longitude, heading);
    setRecommendation(result);
    setCalculationTime(new Date().toLocaleTimeString());
  }, [latitude, longitude, heading, navigate]);

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Compass className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Calculating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your Safe Side
          </h1>
          <p className="text-muted-foreground">
            Based on your current location and direction
          </p>
        </div>

        {/* Recommendation Card */}
        <Card className="shadow-soft-lg p-6 mb-6 animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-3">
              <span className="text-3xl font-bold text-accent">
                {recommendation.recommendedSide === 'LEFT' ? 'L' : 'R'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Sit on the {recommendation.recommendedSide} side
            </h2>
            <p className="text-muted-foreground">
              To avoid direct sunlight
            </p>
          </div>

          <VehicleDiagram 
            recommendedSide={recommendation.recommendedSide}
            sunPosition={recommendation.sunPosition}
            heading={recommendation.heading}
            sunAzimuth={recommendation.sunAzimuth}
          />
        </Card>

        {/* Details Card */}
        <Card className="shadow-soft p-6 mb-6 animate-fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            Calculation Details
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Compass className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Vehicle Direction</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(recommendation.heading)}° {degreesToCardinal(recommendation.heading)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Sun className="w-5 h-5 text-sun mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Sun Direction</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(recommendation.sunAzimuth)}° {degreesToCardinal(recommendation.sunAzimuth)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Calculated at {calculationTime}
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 animate-fade-in">
          <Button 
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-xl"
            variant="outline"
          >
            Check Another Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Result;

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calculator, Utensils } from 'lucide-react';
import type { SelectedFood } from '@/pages/IndoorEventsPlanner';

interface GuestCountStepProps {
  guestCount: number;
  selectedFoods?: SelectedFood[];
  onChange: (count: number) => void;
  onNext: () => void;
  onBack: () => void;
}

interface FoodItemWithServes {
  id: string;
  name: string;
  serves_persons: number | null;
}

const presetCounts = [1, 10, 25, 50, 100, 150, 200, 300];

const GuestCountStep: React.FC<GuestCountStepProps> = ({
  guestCount,
  selectedFoods = [],
  onChange,
  onNext,
  onBack,
}) => {
  // Fetch food items with serves_persons data
  const { data: foodItemsWithServes } = useQuery({
    queryKey: ['food-items-serves', selectedFoods.map(f => f.id)],
    queryFn: async () => {
      if (selectedFoods.length === 0) return [];
      
      const { data, error } = await supabase
        .from('food_items')
        .select('id, name, serves_persons')
        .in('id', selectedFoods.map(f => f.id));
      
      if (error) throw error;
      return data as FoodItemWithServes[];
    },
    enabled: selectedFoods.length > 0,
  });

  // Calculate required quantities for selected foods
  const quantitySuggestions = React.useMemo(() => {
    if (!foodItemsWithServes || foodItemsWithServes.length === 0) return [];
    
    return foodItemsWithServes
      .filter(item => item.serves_persons && item.serves_persons > 0)
      .map(item => {
        const requiredQty = Math.ceil(guestCount / item.serves_persons!);
        return {
          id: item.id,
          name: item.name,
          servesPersons: item.serves_persons!,
          requiredQuantity: requiredQty,
        };
      });
  }, [foodItemsWithServes, guestCount]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold">How Many Guests?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This helps us calculate portion sizes and pricing
        </p>
      </div>

      <Card className="border-indoor-events/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Users className="h-8 w-8 text-indoor-events" />
            <Input
              type="number"
              min={1}
              max={1000}
              value={guestCount}
              onChange={(e) => onChange(parseInt(e.target.value) || 1)}
              className="w-24 text-center text-2xl font-bold h-12"
            />
            <span className="text-muted-foreground">guests</span>
          </div>

          <Slider
            value={[guestCount]}
            onValueChange={([value]) => onChange(value)}
            min={1}
            max={500}
            step={1}
            className="my-4"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>500+</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">Quick select</p>
        <div className="flex flex-wrap justify-center gap-2">
          {presetCounts.map((count) => (
            <Button
              key={count}
              variant={guestCount === count ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(count)}
              className={guestCount === count ? "bg-indoor-events hover:bg-indoor-events/90" : ""}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      {/* Quantity Suggestions based on selected foods */}
      {quantitySuggestions.length > 0 && (
        <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-green-600" />
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
                Suggested Quantities
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Based on {guestCount} guests and serving capacity:
            </p>
            <div className="space-y-2">
              {quantitySuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="flex items-center justify-between p-2 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{suggestion.name}</p>
                      <p className="text-xs text-muted-foreground">
                        1 unit serves {suggestion.servesPersons} persons
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-indoor-events text-white">
                    {suggestion.requiredQuantity} units needed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tip when no foods selected yet */}
      {selectedFoods.length === 0 && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Select food items in the next step to see quantity suggestions
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          className="flex-1 bg-indoor-events hover:bg-indoor-events/90"
          onClick={onNext}
          disabled={guestCount < 1}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default GuestCountStep;

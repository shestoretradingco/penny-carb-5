import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlannerStepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  isActive: boolean;
  summary?: string;
  onClick: () => void;
}

const PlannerStepCard: React.FC<PlannerStepCardProps> = ({
  stepNumber,
  title,
  description,
  icon,
  isCompleted,
  isActive,
  summary,
  onClick,
}) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "border-indoor-events ring-2 ring-indoor-events/20",
        isCompleted && "border-indoor-events/50 bg-indoor-events/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Step Number / Check */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
              isCompleted
                ? "bg-indoor-events text-white"
                : isActive
                ? "bg-indoor-events/20 text-indoor-events"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
          </div>

          {/* Icon */}
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
              isCompleted || isActive
                ? "bg-indoor-events/10 text-indoor-events"
                : "bg-muted text-muted-foreground"
            )}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{title}</h3>
            {isCompleted && summary ? (
              <p className="text-xs text-indoor-events font-medium truncate">
                {summary}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isCompleted || isActive
                ? "text-indoor-events"
                : "text-muted-foreground"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PlannerStepCard;

"use client"

import { cn } from "@/lib/utils";
import React from "react";

interface StepperProps {
    currentStep: number;
    steps: string[];
    icons: React.ElementType[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps, icons }) => {
    return (
        <div className="flex items-center">
            {steps.map((label, index) => {
                const Icon = icons[index];
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                    <React.Fragment key={label}>
                        <div className={cn("flex flex-col items-center")}>
                             <div className={cn("flex items-center justify-center h-10 w-full px-4 py-2 rounded-md transition-colors",
                                isActive ? "bg-primary text-primary-foreground" : isCompleted ? "bg-muted-foreground/30 text-muted-foreground" : "bg-muted text-muted-foreground"
                             )}>
                                <Icon className="h-5 w-5 mr-2" />
                                <span className="font-medium">{label}</span>
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={cn("flex-1 h-0.5", isCompleted ? 'bg-primary' : 'bg-border')} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export const Step: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

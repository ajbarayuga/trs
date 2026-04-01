"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "START" },
  { id: 2, name: "SERVICES" },
  { id: 3, name: "VIDEO" },
  { id: 4, name: "AUDIO-VISUAL" }, // was "AUDIO & AV"
  { id: 5, name: "DETAILS" },
  { id: 6, name: "SEND" },
];

interface ProgressBarProps {
  currentStep: number;
  isFinished?: boolean;
  maxVisitedStep?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({
  currentStep,
  isFinished = false,
  maxVisitedStep,
  onStepClick,
}: ProgressBarProps) {
  const highWater = maxVisitedStep ?? currentStep;

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 mb-8">
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="relative flex justify-between items-center">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-secondary -z-10" />
          <motion.div
            className="absolute top-4 left-0 h-0.5 bg-blue-900 -z-10"
            initial={{ width: "0%" }}
            animate={{
              width: isFinished
                ? "100%"
                : `${Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100)}%`,
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          {STEPS.map((step) => {
            const isCompleted =
              currentStep > step.id ||
              (isFinished && step.id === STEPS[STEPS.length - 1].id);
            const isActive = !isCompleted && currentStep === step.id;
            const isClickable =
              onStepClick &&
              step.id <= highWater &&
              step.id !== currentStep &&
              !isFinished;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center group",
                  isClickable && "cursor-pointer",
                )}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center bg-background transition-all duration-300",
                    isCompleted
                      ? "bg-blue-900 border-blue-900 text-primary-foreground"
                      : isActive
                        ? "border-blue-900 text-blue-900 ring-4 ring-primary/10 shadow-sm"
                        : "border-muted text-muted-foreground",
                    isClickable &&
                      "hover:ring-4 hover:ring-primary/20 hover:scale-110",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-7 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap",
                    isActive || isCompleted
                      ? "text-primary"
                      : "text-muted-foreground/60",
                  )}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

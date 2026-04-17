"use client";

import React from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DispatchButtonProps {
  currentMilestone: string;
  nextMilestone: string | null;
  onTransition: () => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * DispatchButton: High-impact, mobile-first transition trigger.
 * Designed for drivers with "large touch" requirements.
 */
export function DispatchButton({
  currentMilestone,
  nextMilestone,
  onTransition,
  isLoading = false,
  disabled = false,
}: DispatchButtonProps) {
  if (!nextMilestone) {
    return (
      <div className="flex w-full flex-col items-center justify-center p-8 text-center bg-green-50 rounded-2xl border-2 border-green-200">
        <CheckCircle2 className="h-12 w-12 text-green-600 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-green-900">Dispatch Completed</h3>
        <p className="text-green-700 mt-2">All milestones have been successfully logged.</p>
      </div>
    );
  }

  return (
    <button
      onClick={onTransition}
      disabled={disabled || isLoading}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl p-6 transition-all active:scale-95",
        "flex flex-col items-center justify-center gap-2",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
        "hover:bg-primary/90 disabled:opacity-50 disabled:active:scale-100",
        "min-h-[120px]" // Large touch target
      )}
    >
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin" />
      ) : (
        <>
          <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
            Next Action
          </span>
          <span className="text-xl font-bold text-center">
            {nextMilestone.replace(/_/g, " ")}
          </span>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:translate-x-2 group-hover:opacity-100 transition-all">
            <ArrowRight className="h-8 w-8" />
          </div>
        </>
      )}
    </button>
  );
}

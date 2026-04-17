"use client";

import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SLABadgeProps {
  targetHours: number;
  remainingHours: number;
  sourceType: "global" | "port";
  sourceLabel?: string;
  className?: string;
}

/**
 * SLABadge: Displays active SLA window near milestones.
 */
export function SLABadge({ 
  targetHours, 
  remainingHours, 
  sourceType, 
  sourceLabel,
  className 
}: SLABadgeProps) {
  const isAtRisk = remainingHours < (targetHours * 0.2);
  const isBreached = remainingHours <= 0;

  return (
    <div className={cn(
      "inline-flex flex-col gap-1 p-3 rounded-2xl border bg-card shadow-sm group hover:scale-[1.02] transition-transform",
      isBreached ? "border-red-200 bg-red-50/30" : isAtRisk ? "border-amber-200 bg-amber-50/30" : "border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-lg",
          isBreached ? "bg-red-100 text-red-600 animate-pulse" : isAtRisk ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
        )}>
          {isBreached || isAtRisk ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
            {isBreached ? "SLA Breached" : isAtRisk ? "Risk of Breach" : "Target window"}
          </span>
          <span className="text-xs font-bold text-foreground">
             {Math.abs(remainingHours)}h {isBreached ? "Overdue" : "Remaining"}
          </span>
        </div>
      </div>
      
      <div className="pt-2 border-t mt-1 flex items-center justify-between gap-4">
        <span className="text-[8px] font-bold text-muted-foreground uppercase">Target: {targetHours}h</span>
        <span className={cn(
          "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none",
          sourceType === "port" ? "bg-amber-100 border-amber-200 text-amber-800" : "bg-slate-100 border-slate-200 text-slate-500"
        )}>
          {sourceLabel || (sourceType === "port" ? "Port Override" : "Global")}
        </span>
      </div>
    </div>
  );
}

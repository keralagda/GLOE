"use client";

import React from "react";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthSparklineProps {
  label: string;
  value: string;
  status: "optimal" | "warning" | "error";
  data: number[]; // 0 to 100
}

/**
 * HealthSparkline: Small dashboard widget for real-time system metrics.
 */
export function HealthSparkline({ label, value, status, data }: HealthSparklineProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
      <div className={cn(
        "p-2 rounded-xl border transition-colors",
        status === "optimal" ? "bg-green-50 text-green-600 border-green-100 group-hover:bg-green-100" :
        status === "warning" ? "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100" :
        "bg-red-50 text-red-600 border-red-100 group-hover:bg-red-100"
      )}>
        {status === "optimal" ? <ShieldCheck className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
      </div>

      <div className="flex-1">
         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{label}</p>
         <h4 className="text-sm font-black tracking-tight leading-none">{value}</h4>
      </div>

      <div className="flex items-end gap-0.5 h-6 w-16">
        {data.map((val, idx) => (
          <div 
            key={idx}
            className={cn(
              "w-full rounded-full transition-all duration-700",
              status === "optimal" ? "bg-green-400/30" : status === "warning" ? "bg-amber-400/30" : "bg-red-400/30"
            )}
            style={{ height: `${val}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SystemHealthWidgets() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
       <HealthSparkline 
         label="API Response" 
         value="240ms" 
         status="optimal" 
         data={[40, 35, 45, 30, 25, 40, 35, 30]} 
       />
       <HealthSparkline 
         label="EDI Throughput" 
         value="1.2k/s" 
         status="optimal" 
         data={[60, 70, 65, 80, 75, 85, 90, 85]} 
       />
       <HealthSparkline 
         label="State Buffer" 
         value="85%" 
         status="warning" 
         data={[80, 82, 85, 84, 88, 85, 86, 85]} 
       />
    </div>
  );
}

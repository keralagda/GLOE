"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Package, Truck, Anchor, CheckCircle, Activity } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  className?: string;
  isPulse?: boolean;
}

function KPICard({ title, value, change, trend, icon, className, isPulse }: KPICardProps) {
  return (
    <div className={cn(
      "p-5 rounded-3xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-500",
      isPulse && "border-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2 rounded-xl bg-primary/10 text-primary",
          isPulse && "animate-pulse"
        )}>
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
            trend === "up" ? "bg-green-500/10 text-green-600" : 
            trend === "down" ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
        <h3 className={cn(
          "text-3xl font-black mt-1 tracking-tighter",
          isPulse && "text-primary"
        )}>{value}</h3>
      </div>
    </div>
  );
}

/**
 * KPIBentoGrid: A responsive bento-style grid for high-level logistics metrics.
 * Optimized for Tailwind v4. Supports realtime pulse highlights.
 */
export function KPIBentoGrid() {
  const [pulseMetric, setPulseMetric] = React.useState<string | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const metrics = ["active", "transit", "port", "completed"];
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
      setPulseMetric(randomMetric);
      setTimeout(() => setPulseMetric(null), 2000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      <KPICard 
        title="Active Shipments" 
        value="1,284" 
        change="+12%" 
        trend="up" 
        icon={<Package className="h-5 w-5" />} 
        className="col-span-2 md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent border-primary/20"
        isPulse={pulseMetric === "active"}
      />
      <KPICard 
        title="In Transit" 
        value="842" 
        change="+5%" 
        trend="up" 
        icon={<Truck className="h-5 w-5" />} 
        isPulse={pulseMetric === "transit"}
      />
      <KPICard 
        title="At Port" 
        value="156" 
        change="-2%" 
        trend="down" 
        icon={<Anchor className="h-5 w-5" />} 
        isPulse={pulseMetric === "port"}
      />
      <KPICard 
        title="Avg. Delay" 
        value="1.4d" 
        change="+0.2d" 
        trend="down" 
        icon={<TrendingDown className="h-5 w-5 text-destructive" />} 
        className="md:col-span-1"
      />
      <KPICard 
        title="Completed" 
        value="12.4k" 
        change="+245" 
        trend="up" 
        icon={<CheckCircle className="h-5 w-5 text-green-500" />} 
        className="md:col-span-1"
        isPulse={pulseMetric === "completed"}
      />
      <div className="col-span-2 md:col-span-2 p-5 rounded-3xl bg-slate-900 text-white flex flex-col justify-center border border-slate-800 group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Activity className="h-20 w-20" />
        </div>
        <h4 className="text-sm font-bold opacity-70 uppercase tracking-widest mb-4 z-10">System Health</h4>
        <div className="space-y-3 z-10">
          <div className="flex justify-between items-center text-xs">
            <span>Carrier APIs</span>
            <span className="text-green-400 font-bold">OPTIMAL</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-green-400 h-full w-[98%]" />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Automation Engine</span>
            <span className="text-blue-400 font-bold">ACTIVE</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-400 h-full w-[85%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

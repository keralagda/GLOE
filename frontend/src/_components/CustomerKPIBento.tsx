"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Clock, 
  DollarSign, 
  CheckCircle,
  Activity,
  BarChart3
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  className?: string;
}

function KPICard({ title, value, subtitle, change, trend, icon, className }: KPICardProps) {
  return (
    <div className={cn(
      "p-6 rounded-3xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full border",
            trend === "up" ? "bg-green-50 text-green-600 border-green-200" : 
            trend === "down" ? "bg-red-50 text-red-600 border-red-200" : "bg-muted text-muted-foreground border-border"
          )}>
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black mt-1 tracking-tighter">{value}</h3>
          {subtitle && <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * CustomerKPIBento: Metrics specifically for Shippers.
 */
export function CustomerKPIBento() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {/* Shipment Volume */}
      <KPICard 
        title="Ongoing Orders" 
        value="42" 
        change="+4" 
        trend="up" 
        icon={<Package className="h-5 w-5" />} 
        className="col-span-2 md:col-span-2 bg-slate-900 text-white border-slate-800"
      />
      
      {/* Lead Time Efficiency Score */}
      <KPICard 
        title="L_e Efficiency Score" 
        value="94%" 
        subtitle="Avg"
        change="+2.4%" 
        trend="up" 
        icon={<Activity className="h-5 w-5 text-blue-500" />} 
      />
      
      {/* Cost Metric */}
      <KPICard 
        title="Sell-Side Cost (MTD)" 
        value="$128.4k" 
        change="-5.2%" 
        trend="down" 
        icon={<DollarSign className="h-5 w-5 text-green-500" />} 
      />

      {/* Phase Distribution Chart (Visual Simulation) */}
      <div className="col-span-2 p-6 rounded-3xl border bg-card shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order Distribution</h4>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-2 flex-1 min-h-[100px]">
          <PhaseBar label="Pre" height="h-[40%]" color="bg-slate-200" />
          <PhaseBar label="First" height="h-[60%]" color="bg-primary/40" />
          <PhaseBar label="Port" height="h-[30%]" color="bg-primary/60" />
          <PhaseBar label="Sea" height="h-[80%]" color="bg-primary" />
          <PhaseBar label="Dest" height="h-[20%]" color="bg-primary/60" />
          <PhaseBar label="Final" height="h-[10%]" color="bg-primary/20" />
        </div>
      </div>

      {/* On-Time Delivery */}
      <KPICard 
        title="On-Time Delivery" 
        value="98.2%" 
        change="Stable" 
        trend="neutral" 
        icon={<CheckCircle className="h-5 w-5 text-green-500" />} 
      />

      {/* Carbon Offset Simulation */}
      <div className="col-span-2 md:col-span-1 p-6 rounded-3xl border bg-green-50 border-green-100 flex flex-col justify-between">
        <div className="p-2 w-fit rounded-xl bg-green-100 text-green-700">
           <TrendingDown className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest">CO2 Reduced</p>
          <h3 className="text-2xl font-black text-green-900 tracking-tighter">1.2 Tons</h3>
        </div>
      </div>
    </div>
  );
}

function PhaseBar({ label, height, color }: { label: string; height: string; color: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 group">
      <div className={cn("w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80", color, height)} />
      <span className="text-[8px] font-black uppercase text-muted-foreground">{label}</span>
    </div>
  );
}

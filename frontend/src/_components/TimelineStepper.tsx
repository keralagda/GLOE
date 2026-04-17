"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Truck,
  Anchor,
  ShieldCheck,
  Package,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "Pre-Loading" | "First Mile" | "Origin Port" | "Sea Transit" | "Dest Port" | "Final Mile";

type Milestone = {
  id: number;
  name: string;
  phase: Phase;
  status: "pending" | "completed" | "active" | "error";
  timestamp?: string;
};

const MILESTONES: Milestone[] = [
  // Pre-Loading
  { id: 1, name: "Booking Init", phase: "Pre-Loading", status: "completed", timestamp: "08:00 AM" },
  { id: 2, name: "Confirmation", phase: "Pre-Loading", status: "completed", timestamp: "08:15 AM" },
  { id: 3, name: "Instruction", phase: "Pre-Loading", status: "completed", timestamp: "09:00 AM" },
  { id: 4, name: "Carrier Placement", phase: "Pre-Loading", status: "completed", timestamp: "10:30 AM" },
  { id: 5, name: "Carrier Confirmed", phase: "Pre-Loading", status: "completed", timestamp: "11:00 AM" },
  
  // First Mile
  { id: 6, name: "Empty Pickup", phase: "First Mile", status: "completed", timestamp: "01:20 PM" },
  { id: 7, name: "Factory Arrival", phase: "First Mile", status: "completed", timestamp: "02:45 PM" },
  { id: 8, name: "Stuffing Start", phase: "First Mile", status: "completed", timestamp: "03:00 PM" },
  { id: 9, name: "Stuffing End", phase: "First Mile", status: "completed", timestamp: "05:30 PM" },
  { id: 10, name: "Sealing", phase: "First Mile", status: "completed", timestamp: "05:45 PM" },
  { id: 11, name: "Factory Departure", phase: "First Mile", status: "active" },
  
  // Origin Port
  { id: 12, name: "Gate-in", phase: "Origin Port", status: "pending" },
  { id: 13, name: "Export Customs", phase: "Origin Port", status: "pending" },
  { id: 14, name: "Customs Done", phase: "Origin Port", status: "pending" },
  { id: 15, name: "VGM", phase: "Origin Port", status: "pending" },
  { id: 16, name: "Loaded", phase: "Origin Port", status: "pending" },
  
  // Sea Transit
  { id: 17, name: "Sailed", phase: "Sea Transit", status: "pending" },
  { id: 18, name: "Transshipment", phase: "Sea Transit", status: "pending" },
  { id: 19, name: "Vessel Arrival", phase: "Sea Transit", status: "pending" },
  
  // Dest Port
  { id: 20, name: "Unloaded", phase: "Dest Port", status: "pending" },
  { id: 21, name: "Import Customs", phase: "Dest Port", status: "pending" },
  { id: 22, name: "Customs Done", phase: "Dest Port", status: "pending" },
  { id: 23, name: "D/O Issued", phase: "Dest Port", status: "pending" },
  { id: 24, name: "Gate-out", phase: "Dest Port", status: "pending" },
  
  // Final Mile
  { id: 25, name: "Consignee Arrival", phase: "Final Mile", status: "pending" },
  { id: 26, name: "De-stuffing", phase: "Final Mile", status: "pending" },
  { id: 27, name: "Empty Return", phase: "Final Mile", status: "pending" },
  { id: 28, name: "Closed", phase: "Final Mile", status: "pending" },
];

const PHASE_CONFIG: Record<Phase, { icon: any, color: string }> = {
  "Pre-Loading": { icon: ShieldCheck, color: "bg-slate-400" },
  "First Mile": { icon: Truck, color: "bg-blue-500" },
  "Origin Port": { icon: Anchor, color: "bg-indigo-500" },
  "Sea Transit": { icon: Zap, color: "bg-primary" },
  "Dest Port": { icon: Anchor, color: "bg-indigo-500" },
  "Final Mile": { icon: Package, color: "bg-green-500" },
};

/**
 * TimelineStepper: High-density 28-step operational flow.
 * Refined with modern gradients, noise textures, and mobile-first Tap UX.
 */
export function TimelineStepper() {
  const [expandedPhases, setExpandedPhases] = useState<Set<Phase>>(new Set(["First Mile", "Origin Port"]));

  const togglePhase = (phase: Phase) => {
    const next = new Set(expandedPhases);
    if (next.has(phase)) next.delete(phase);
    else next.add(phase);
    setExpandedPhases(next);
  };

  const phases = Object.keys(PHASE_CONFIG) as Phase[];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border rounded-[2.5rem] overflow-hidden shadow-2xl relative">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="p-8 border-b bg-muted/20 flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Shipment Lifecycle</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">28 Control Checkpoints • Live State</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase">Realtime Sync</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[700px] p-6 space-y-4 relative z-10 scrollbar-thin">
        {phases.map((phase) => {
          const phaseMilestones = MILESTONES.filter(m => m.phase === phase);
          const isExpanded = expandedPhases.has(phase);
          const Config = PHASE_CONFIG[phase];
          const Icon = Config.icon;

          return (
            <div key={phase} className="space-y-2">
              <button 
                onClick={() => togglePhase(phase)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md group",
                  isExpanded ? "bg-slate-50 border-slate-200 shadow-sm" : "bg-white border-transparent"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn("p-2.5 rounded-xl text-white shadow-lg", Config.color)}>
                      <Icon className="h-4 w-4" />
                   </div>
                   <div className="text-left">
                      <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{phase}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{phaseMilestones.length} Steps</p>
                   </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />}
              </button>

              {isExpanded && (
                <div className="pl-12 pr-4 py-2 space-y-4 relative before:absolute before:left-[27px] before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
                   {phaseMilestones.map((m) => (
                     <div key={m.id} className="relative group cursor-pointer active:scale-[0.98] transition-all">
                        <div className={cn(
                          "absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white transition-all duration-500 z-10",
                          m.status === "completed" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" :
                          m.status === "active" ? "bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]" :
                          "bg-slate-200 group-hover:bg-slate-300"
                        )} />
                        
                        <div className={cn(
                          "p-3 rounded-xl border transition-all",
                          m.status === "active" ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-transparent group-hover:bg-slate-50"
                        )}>
                           <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-[11px] font-bold uppercase tracking-tight",
                                m.status === "active" ? "text-primary" : m.status === "completed" ? "text-slate-900" : "text-slate-400"
                              )}>{m.name}</span>
                              {m.timestamp && <span className="text-[9px] font-mono font-bold text-muted-foreground">{m.timestamp}</span>}
                              {m.status === "active" && (
                                <button className="text-[9px] font-black text-primary border border-primary/20 px-2 py-0.5 rounded uppercase hover:bg-primary hover:text-white transition-all">Tap to Verify</button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Progress</span>
               <span className="text-xl font-black text-white italic tracking-tighter">11 / 28</span>
            </div>
            <div className="h-10 w-px bg-slate-800" />
            <div className="flex-1 min-w-[120px]">
               <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[39%] transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
               </div>
            </div>
         </div>
         <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
         </button>
      </div>
    </div>
  );
}

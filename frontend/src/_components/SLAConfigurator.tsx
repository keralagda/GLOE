"use client";

import React, { useState } from "react";
import { 
  Globe, 
  MapPin, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  Save,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type SLARule = {
  id: string;
  milestone: string;
  thresholdHours: number;
  type: "global" | "port";
  portCode?: string;
};

/**
 * SLAConfigurator: Manage hierarchical service level agreements.
 * Supports Global Defaults and granular Port-level overrides.
 */
export function SLAConfigurator() {
  const [activeTab, setActiveTab] = useState<"global" | "ports">("global");
  const [globalRules, setGlobalRules] = useState<SLARule[]>([
    { id: "1", milestone: "EN_ROUTE_TO_PICKUP", thresholdHours: 24, type: "global" },
    { id: "2", milestone: "LOADING_FINISHED", thresholdHours: 12, type: "global" },
  ]);
  const [portOverrides, setPortOverrides] = useState<SLARule[]>([
    { id: "3", milestone: "GATE_IN", thresholdHours: 48, type: "port", portCode: "SIN" },
  ]);

  return (
    <div className="flex flex-col bg-background border rounded-3xl overflow-hidden shadow-sm max-w-4xl mx-auto">
      <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">SLA Configuration</h3>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Manage threshold & breaches</p>
          </div>
        </div>
        <div className="flex p-1 bg-muted rounded-xl">
           <TabButton active={activeTab === "global"} onClick={() => setActiveTab("global")} icon={<Globe className="h-3.5 w-3.5" />} label="Global Defaults" />
           <TabButton active={activeTab === "ports"} onClick={() => setActiveTab("ports")} icon={<MapPin className="h-3.5 w-3.5" />} label="Port Overrides" />
        </div>
      </div>

      <div className="p-6">
        {activeTab === "global" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between">
               <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Standard Milestone Thresholds</h4>
               <button className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">
                 <Plus className="h-3 w-3" /> Add Milestone
               </button>
             </div>
             <div className="grid gap-3">
                {globalRules.map(rule => (
                  <RuleItem key={rule.id} rule={rule} onRemove={() => {}} />
                ))}
             </div>
          </div>
        )}

        {activeTab === "ports" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="relative group flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search Port Code (e.g. SIN, RTM, SHA)..." 
                   className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                 />
               </div>
               <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                 <Plus className="h-4 w-4" /> Create Override
               </button>
             </div>
             
             <div className="grid gap-3">
                {portOverrides.map(rule => (
                  <RuleItem key={rule.id} rule={rule} onRemove={() => {}} />
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t bg-muted/10 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground italic max-w-xs">
          Overrides at the port level will always take precedence over global default thresholds.
        </p>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          <Save className="h-4 w-4" /> Apply Policies
        </button>
      </div>
    </div>
  );
}

function RuleItem({ rule, onRemove }: { rule: SLARule, onRemove: () => void }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border rounded-2xl shadow-sm hover:border-primary/30 transition-colors group">
      {rule.type === "port" && (
        <div className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700">
          {rule.portCode}
        </div>
      )}
      <div className="flex-1">
        <p className="font-bold text-xs uppercase tracking-tight">{rule.milestone.replace(/_/g, " ")}</p>
        <div className="flex items-center gap-2 mt-0.5">
           <Clock className="h-3 w-3 text-muted-foreground" />
           <span className="text-[10px] text-muted-foreground font-medium">Target Completion: <span className="text-foreground font-bold">{rule.thresholdHours} Hours</span></span>
        </div>
      </div>
      <div className="flex items-center gap-2">
         <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
           <Plus className="h-4 w-4" />
         </button>
         <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive">
           <Trash2 className="h-4 w-4" />
         </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

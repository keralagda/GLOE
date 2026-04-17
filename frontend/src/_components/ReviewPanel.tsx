"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertCircle, CheckCircle2, History, Filter, Search } from "lucide-react";

interface ComparisonTripleProps {
  label: string;
  source: string;
  planned: string;
  actual: string;
  status?: "pending" | "resolved" | "conflict";
}

/**
 * ComparisonTriple: Three-way comparison view for logistics data auditing.
 */
export function ComparisonTriple({
  label,
  source,
  planned,
  actual,
  status = "pending",
}: ComparisonTripleProps) {
  const isDiff = planned !== actual;

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden bg-card shadow-sm group hover:border-primary/50 transition-colors">
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
        <div className="flex items-center gap-2">
          {status === "conflict" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-destructive uppercase">
              <AlertCircle className="h-3 w-3" /> Conflict
            </span>
          )}
          {status === "resolved" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
              <CheckCircle2 className="h-3 w-3" /> Resolved
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 divide-x divide-border h-full">
        {/* Source/Reference */}
        <div className="p-3 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">Source</span>
          <p className="text-sm font-mono truncate">{source}</p>
        </div>
        
        {/* Planned */}
        <div className="p-3 flex flex-col gap-1 bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">Planned</span>
          <p className="text-sm font-mono truncate">{planned}</p>
        </div>
        
        {/* Actual/System */}
        <div className={cn(
          "p-3 flex flex-col gap-1",
          isDiff ? "bg-destructive/10 text-destructive font-bold" : "bg-green-500/10 text-green-600 dark:text-green-400"
        )}>
          <span className="text-[10px] uppercase font-medium opacity-70">Actual</span>
          <p className="text-sm font-mono truncate">{actual}</p>
        </div>
      </div>

      <div className="px-4 py-2 bg-muted/10 border-t flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-[10px] font-bold uppercase text-primary hover:underline">Approve</button>
        <button className="text-[10px] font-bold uppercase text-destructive hover:underline">Reject</button>
      </div>
    </div>
  );
}

export function ReviewPanel() {
  const [filter, setFilter] = useState<"all" | "requests" | "resolved">("requests");

  const items = [
    { label: "Vessel Name", source: "MAERSK_01", planned: "Maersk Chennai", actual: "Maersk Chenai", status: "conflict" },
    { label: "ETA Dest", source: "API_TRANSIT", planned: "2026-05-12", actual: "2026-05-14", status: "conflict" },
    { label: "Seal No", source: "DOC_SCAN", planned: "SL-12345", actual: "SL-12345", status: "resolved" },
    { label: "Gross Weight", source: "VGM_PORT", planned: "24,500 KG", actual: "24,502 KG", status: "conflict" },
  ];

  const filteredItems = items.filter(item => {
    if (filter === "requests") return item.status === "conflict";
    if (filter === "resolved") return item.status === "resolved";
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-background min-w-[320px]">
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Review Panel
          </h2>
          <span className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
            {items.filter(i => i.status === "conflict").length} Conflicts
          </span>
        </div>

        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          <FilterButton 
            active={filter === "all"} 
            onClick={() => setFilter("all")} 
            label="All" 
          />
          <FilterButton 
            active={filter === "requests"} 
            onClick={() => setFilter("requests")} 
            label="Resolution Requests" 
          />
          <FilterButton 
            active={filter === "resolved"} 
            onClick={() => setFilter("resolved")} 
            label="Resolved" 
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <ComparisonTriple key={idx} {...(item as any)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 opacity-20 mb-2" />
            <p className="text-sm font-medium">No items to review</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t bg-card shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
          Sign-off All Resolutions
        </button>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
      )}
    >
      {label}
    </button>
  );
}

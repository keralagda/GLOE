"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { User, Server, Clock, GitCommit, FileText, ChevronRight, Activity } from "lucide-react";

type HistoryEntry = {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    type: "user" | "system";
  };
  action: string;
  details?: string;
  severity?: "info" | "warning" | "error";
};

/**
 * HistoryPanel: Comprehensive audit trail for shipment lifecycle.
 */
export function HistoryPanel() {
  const entries: HistoryEntry[] = [
    {
      id: "1",
      timestamp: "2026-04-14 09:22:45",
      actor: { name: "System (Webhook)", type: "system" },
      action: "Updated ETD Origin",
      details: "Changed from 2026-04-15 to 2026-04-16 based on Carrier API.",
      severity: "warning",
    },
    {
      id: "2",
      timestamp: "2026-04-14 08:15:00",
      actor: { name: "John Driver", type: "user" },
      action: "Milestone: EN_ROUTE_TO_PICKUP",
      severity: "info",
    },
    {
      id: "3",
      timestamp: "2026-04-14 08:00:12",
      actor: { name: "Admin_Sarah", type: "user" },
      action: "Overrode Sequential Lock",
      details: "Driver reported portal error. Manually verified location.",
      severity: "error",
    },
    {
      id: "4",
      timestamp: "2026-04-14 07:30:45",
      actor: { name: "System", type: "system" },
      action: "Validation Passed",
      details: "Milestone 1 check successful.",
      severity: "info",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-background min-w-[320px]">
      <div className="px-6 py-5 border-b bg-card flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Shipment Ledger
        </h3>
        <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md">Export CSV</button>
      </div>
      
      <div className="divide-y overflow-y-auto">
        {entries.map((entry) => (
          <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors group cursor-default">
            <div className="flex items-start gap-4">
              <div className={cn(
                "mt-1 p-2 rounded-xl shrink-0 border shadow-sm transition-transform group-hover:scale-110",
                entry.actor.type === "system" 
                  ? "bg-blue-500/10 text-blue-600 border-blue-200" 
                  : "bg-purple-500/10 text-purple-600 border-purple-200"
              )}>
                {entry.actor.type === "system" ? <Server className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    entry.severity === "error" ? "text-destructive" : "text-foreground"
                  )}>{entry.action}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp.split(" ")[1]}</span>
                </div>
                
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  by <span className="font-bold text-foreground/80 underline decoration-primary/30">{entry.actor.name}</span>
                </p>
                
                {entry.details && (
                  <div className={cn(
                    "mt-2 p-3 rounded-lg text-[11px] border leading-relaxed",
                    entry.severity === "error" ? "bg-destructive/5 border-destructive/10 text-destructive/80" : "bg-muted/50 border-border/50 text-muted-foreground italic"
                  )}>
                    {entry.details}
                  </div>
                )}
              </div>
              
              <div className="mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto p-4 border-t bg-muted/20">
        <button className="w-full py-2 bg-background border rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors shadow-sm">
          Load Previous 50 Entries
        </button>
      </div>
    </div>
  );
}

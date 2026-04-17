"use client";

import React, { useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  Server,
  FileSearch,
  Scale,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

type ForensicEntry = {
  id: string;
  milestone: string;
  timestamp: string;
  actor: { name: string; type: "user" | "system" };
  status: "success" | "warning" | "error";
  plannedValue: string;
  actualValue: string;
  discrepancy: string | null;
  notes: string;
};

const MOCK_ENTRIES: ForensicEntry[] = [
  {
    id: "F-001",
    milestone: "GATE_IN",
    timestamp: "2026-04-14 09:30:12",
    actor: { name: "Port System", type: "system" },
    status: "success",
    plannedValue: "2026-04-14 09:15:00",
    actualValue: "2026-04-14 09:30:12",
    discrepancy: "+15m",
    notes: "Automated scan at Gate 4. No issues reported."
  },
  {
    id: "F-002",
    milestone: "VGM_VERIFIED",
    timestamp: "2026-04-14 10:45:00",
    actor: { name: "Sarah Admin", type: "user" },
    status: "warning",
    plannedValue: "24,500 KG",
    actualValue: "24,502 KG",
    discrepancy: "+2 KG",
    notes: "Minor weight variance detected. Manual override performed after verifying scale calibration."
  },
  {
    id: "F-003",
    milestone: "LOADED_ON_VESSEL",
    timestamp: "2026-04-14 14:20:00",
    actor: { name: "Maersk EDI", type: "system" },
    status: "error",
    plannedValue: "Vessel A",
    actualValue: "Vessel B",
    discrepancy: "Route Change",
    notes: "Vessel change detected in carrier update. Manual review required for contract compliance."
  }
];

/**
 * ForensicLedger: A high-density component for operational investigation.
 * Allows deep-diving into milestone-level data drift.
 */
export function ForensicLedger() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col bg-background border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Forensic Audit Ledger</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-muted rounded-md border shadow-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search Ledger..." 
              className="pl-8 pr-3 py-1.5 bg-muted/50 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary/30 w-48"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-3 border-b">Milestone</th>
              <th className="px-6 py-3 border-b">Actor</th>
              <th className="px-6 py-3 border-b">Drift</th>
              <th className="px-6 py-3 border-b">Status</th>
              <th className="px-6 py-3 border-b text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MOCK_ENTRIES.map((entry) => (
              <React.Fragment key={entry.id}>
                <tr 
                  className={cn(
                    "hover:bg-muted/10 transition-colors cursor-pointer group",
                    expandedId === entry.id && "bg-primary/5"
                  )}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{entry.milestone.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{entry.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      {entry.actor.type === "system" ? <Server className="h-3 w-3 text-blue-500" /> : <User className="h-3 w-3 text-purple-500" />}
                      {entry.actor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {entry.discrepancy ? (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        entry.status === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"
                      )}>
                        {entry.discrepancy}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-medium italic">No Drift</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {entry.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {entry.status === "warning" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                      {entry.status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                      <span className="text-[10px] font-black uppercase">{entry.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {expandedId === entry.id ? <ChevronUp className="h-4 w-4 inline text-muted-foreground" /> : <ChevronDown className="h-4 w-4 inline text-muted-foreground" />}
                  </td>
                </tr>
                
                {expandedId === entry.id && (
                  <tr className="bg-muted/5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <td colSpan={5} className="px-8 py-6 border-b">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter flex items-center gap-2">
                            <Scale className="h-3 w-3 text-primary" />
                            Value Comparison
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white border rounded-xl shadow-sm">
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">Target</p>
                              <p className="text-sm font-mono font-bold mt-1">{entry.plannedValue}</p>
                            </div>
                            <div className={cn(
                              "p-3 border rounded-xl shadow-sm",
                              entry.discrepancy ? "bg-red-50 border-red-100" : "bg-white"
                            )}>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase">Captured</p>
                              <p className="text-sm font-mono font-bold mt-1">{entry.actualValue}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter flex items-center gap-2">
                            <History className="h-3 w-3 text-primary" />
                            Operator Investigation
                          </h4>
                          <div className="p-4 bg-white border rounded-xl shadow-sm">
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              "{entry.notes}"
                            </p>
                            <div className="mt-3 pt-3 border-t flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Log ID: <span className="font-mono">{entry.id}</span></span>
                              <button className="text-[10px] font-bold text-primary uppercase hover:underline flex items-center gap-1">
                                Flag for Review <ArrowRightLeft className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-muted/20 border-t flex items-center justify-center">
        <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
          View Raw State JSON
        </button>
      </div>
    </div>
  );
}

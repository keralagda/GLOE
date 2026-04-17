"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  FileSearch, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileSpreadsheet,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ForensicWorkbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
}

/**
 * ForensicWorkbookModal: Implements the 'Dual-Track' progress bar for forensic audits.
 * Track 1: Data Retrieval (Carrier APIs)
 * Track 2: Forensic Analysis (Integrity Matching)
 */
export function ForensicWorkbookModal({ isOpen, onClose, shipmentId }: ForensicWorkbookModalProps) {
  const [status, setStatus] = useState<"idle" | "running" | "completed">("idle");
  const [retrievalProgress, setRetrievalProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    if (status === "running") {
      const interval = setInterval(() => {
        setRetrievalProgress(prev => {
          if (prev >= 100) return 100;
          return prev + Math.random() * 8;
        });
        
        setAnalysisProgress(prev => {
          if (prev >= 100) return 100;
          // Analysis lags behind retrieval
          if (retrievalProgress < 30) return 0;
          return prev + Math.random() * 5;
        });

        if (retrievalProgress >= 100 && analysisProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => setStatus("completed"), 1000);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status, retrievalProgress, analysisProgress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-12 text-white">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        {status === "idle" && (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-3xl bg-destructive/20 border border-destructive/30 text-destructive shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">Generate Forensic Workbook</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Start a deep-dive audit for shipment <span className="font-mono text-white font-bold">{shipmentId}</span>. This will reconstruct the state machine history and flag every data discrepancy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <AuditMetric icon={<History className="h-4 w-4" />} label="Timeline Scope" value="Full Lifecycle" />
               <AuditMetric icon={<Cpu className="h-4 w-4" />} label="Analysis Depth" value="Bit-Level Audit" />
            </div>

            <button 
              onClick={() => setStatus("running")}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Execute Audit Engine
            </button>
          </div>
        )}

        {status === "running" && (
          <div className="space-y-12 py-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <h3 className="text-2xl font-black tracking-tight uppercase italic">Auditing in Progress</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Do not close this window</p>
            </div>

            <div className="space-y-10">
               {/* Track 1: Data Retrieval */}
               <div className="space-y-3">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Track 1: Data Retrieval (EDIs/APIs)</span>
                   <span className="text-sm font-mono font-bold text-primary">{Math.floor(retrievalProgress)}%</span>
                 </div>
                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-[2px]">
                   <div 
                     className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                     style={{ width: `${retrievalProgress}%` }} 
                   />
                 </div>
               </div>

               {/* Track 2: Forensic Analysis */}
               <div className="space-y-3">
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Track 2: Forensic Integrity Analysis</span>
                   <span className="text-sm font-mono font-bold text-blue-500">{Math.floor(analysisProgress)}%</span>
                 </div>
                 <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-[2px]">
                   <div 
                     className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                     style={{ width: `${analysisProgress}%` }} 
                   />
                 </div>
               </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center gap-4 animate-pulse">
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               <p className="text-[10px] font-medium text-slate-300 italic">
                 "Identifying coordinate drift in EN_ROUTE_TO_PICKUP milestone..."
               </p>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="py-8 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
            <div className="p-6 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight uppercase italic">Audit Generated</h3>
              <p className="text-slate-400 text-sm">Forensic Workbook <span className="text-white font-bold">FW-7721.xlsx</span> is ready for review.</p>
            </div>
            <div className="w-full flex flex-col gap-3">
               <button className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs">
                 <FileSpreadsheet className="h-4 w-4" />
                 Download Forensic Workbook
               </button>
               <button onClick={onClose} className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs hover:bg-slate-700 transition-colors">
                 Close Investigation
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
      <div className="p-2 bg-slate-700 rounded-xl text-slate-300">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  );
}

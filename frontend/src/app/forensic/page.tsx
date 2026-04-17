"use client";

import React, { useState } from "react";
import { ForensicLedger } from "@/_components/ForensicLedger";
import { ForensicWorkbookModal } from "@/_components/ForensicWorkbookModal";
import { 
  FileSearch, 
  Search, 
  Download, 
  Filter, 
  ArrowLeft,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ForensicPage: The dedicated view for operational investigation and data auditing.
 */
export default function ForensicPage() {
  const [isWorkbookModalOpen, setIsWorkbookModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <ForensicWorkbookModal 
        isOpen={isWorkbookModalOpen} 
        onClose={() => setIsWorkbookModalOpen(false)} 
        shipmentId="MSK-7721-ROT" 
      />

      {/* Investigation Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter">Forensic Investigation</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operation Audit Mode</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-destructive/5 border border-destructive/10 px-3 py-1.5 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-[10px] font-black text-destructive uppercase">High Priority Drift Detected</span>
            </div>
            <button 
              onClick={() => setIsWorkbookModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Export Forensic Log
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Context Bar */}
        <section className="bg-card border rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Investigation Target</span>
               <span className="text-lg font-black font-mono">MSK-7721-ROT</span>
             </div>
             <div className="h-8 w-px bg-border hidden md:block" />
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Carrier</span>
               <span className="text-sm font-bold">MAERSK LINE</span>
             </div>
             <div className="h-8 w-px bg-border hidden md:block" />
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Route</span>
               <span className="text-sm font-bold uppercase italic">Chennai → Rotterdam</span>
             </div>
           </div>
           
           <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full border-4 border-card bg-slate-200 flex items-center justify-center text-[10px] font-bold">SA</div>
             <div className="w-10 h-10 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">JD</div>
             <div className="w-10 h-10 rounded-full border-4 border-card bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">+2</div>
           </div>
        </section>

        {/* The Ledger */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h2 className="font-bold text-lg tracking-tight">Milestone Integrity Check</h2>
             <span className="text-xs text-muted-foreground">Showing last 48 hours of state changes</span>
           </div>
           <ForensicLedger />
        </section>

        {/* Action Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard 
            title="Rollback Milestone" 
            desc="Revert to previous valid state if corruption is confirmed." 
            color="destructive"
          />
          <ActionCard 
            title="Request Driver Log" 
            desc="Force driver app to upload full diagnostic and GPS buffer." 
            color="primary"
          />
          <ActionCard 
            title="Mark as Resolved" 
            desc="Close investigation and log human-verified position." 
            color="success"
          />
        </section>
      </main>
    </div>
  );
}

function ActionCard({ title, desc, color }: { title: string; desc: string; color: "primary" | "destructive" | "success" }) {
  return (
    <button className={cn(
      "p-6 rounded-[2rem] border text-left transition-all hover:shadow-lg group",
      color === "primary" ? "bg-primary/5 border-primary/20 hover:border-primary" : 
      color === "destructive" ? "bg-destructive/5 border-destructive/20 hover:border-destructive" :
      "bg-green-50 border-green-200 hover:border-green-500"
    )}>
      <h3 className={cn(
        "font-black text-sm uppercase tracking-widest mb-2",
        color === "primary" ? "text-primary" : color === "destructive" ? "text-destructive" : "text-green-700"
      )}>{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}

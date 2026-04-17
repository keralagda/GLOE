"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Send, 
  Eye, 
  Settings2, 
  DollarSign, 
  Loader2, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FinanceInvoicingCard: Internal tool for generating and dispatching invoices.
 */
export function FinanceInvoicingCard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setIsGenerating(true);
    setLastAction(null);
    setTimeout(() => {
      setIsGenerating(false);
      setLastAction(action);
      setTimeout(() => setLastAction(null), 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col bg-slate-950 text-white border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl group relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 scale-[4] rotate-12 pointer-events-none group-hover:scale-[4.5] transition-transform duration-1000">
         <DollarSign className="h-32 w-32" />
      </div>

      <div className="p-8 md:p-10 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-white backdrop-blur-md">
                 <FileText className="h-6 w-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">Financial Desk</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Billing Operations</p>
              </div>
           </div>
           <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
              <Settings2 className="h-5 w-5 text-slate-400" />
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Approvals</span>
              <p className="text-2xl font-black text-white tracking-tighter">$14,200.00</p>
           </div>
           <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Drafts Ready</span>
              <p className="text-2xl font-black text-primary tracking-tighter">08</p>
           </div>
        </div>

        <div className="flex flex-col gap-3">
           <button 
             onClick={() => handleAction("draft")}
             disabled={isGenerating}
             className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
           >
              {isGenerating && lastAction === null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
              Generate Draft Batch
           </button>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleAction("preview")}
                className="flex items-center justify-center gap-2 py-3 bg-white text-slate-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                 <Eye className="h-4 w-4" />
                 Preview PDF
              </button>
              <button 
                onClick={() => handleAction("dispatch")}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all"
              >
                 <Send className="h-4 w-4" />
                 Dispatch
              </button>
           </div>
        </div>

        {lastAction && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-green-500 text-white text-[10px] font-black uppercase text-center animate-in slide-in-from-bottom-full">
            Successfully {lastAction === "dispatch" ? "Dispatched to Customers" : "Processed Action"}
          </div>
        )}
      </div>

      <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center gap-4">
         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Revenue engine synchronized with forensic ledger</p>
      </div>
    </div>
  );
}

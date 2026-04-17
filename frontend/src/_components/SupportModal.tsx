"use client";

import React, { useState } from "react";
import { 
  X, 
  LifeBuoy, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  CheckCircle2,
  Loader2,
  Paperclip
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextId?: string; // Shipment or Milestone ID
}

/**
 * SupportModal: A clean form for reporting operational issues.
 */
export function SupportModal({ isOpen, onClose, contextId }: SupportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 md:p-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-2">
              <LifeBuoy className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Operational Support</h2>
            <p className="text-sm text-muted-foreground">Report a discrepancy or request immediate intervention.</p>
          </div>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95">
               <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                 <CheckCircle2 className="h-12 w-12" />
               </div>
               <div className="space-y-1">
                 <h3 className="text-lg font-bold">Ticket Dispatched</h3>
                 <p className="text-sm text-muted-foreground">Ops Director Sarah has been notified with high priority.</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {contextId && (
                <div className="px-4 py-2 bg-muted/50 rounded-xl border border-dashed flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attached Context</span>
                   <span className="text-[10px] font-mono font-bold text-primary">{contextId}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Issue Category</label>
                  <select className="w-full px-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                     <option>Data Mismatch / Forensic Drift</option>
                     <option>SLA Breach Override</option>
                     <option>Driver App / GPS Failure</option>
                     <option>Carrier API Timeout</option>
                     <option>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Describe the Problem</label>
                  <textarea 
                    required
                    placeholder="Provide details for the forensic log..."
                    className="w-full px-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                 <button type="button" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase transition-colors">
                    <Paperclip className="h-4 w-4" />
                    Attach Screenshot
                 </button>
                 <span className="text-[10px] text-slate-400 italic">Est. response: 15 mins</span>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Open Support Ticket
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

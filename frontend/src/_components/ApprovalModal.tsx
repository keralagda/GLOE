"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  X, 
  Loader2,
  ShieldCheck,
  MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  milestoneName: string;
  posIsManual?: boolean; // Flag to show manual position choice
}

/**
 * ApprovalModal: Handles milestone sign-off with conditional manual position logic.
 */
export function ApprovalModal({ 
  isOpen, 
  onClose, 
  shipmentId, 
  milestoneName, 
  posIsManual = false 
}: ApprovalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [positionChoice, setPositionChoice] = useState<"auto" | "manual" | null>(null);

  const handleApprove = async () => {
    if (posIsManual && !positionChoice) return;
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden scale-in-95 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-green-500/10 text-green-600 mb-2">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Approve Milestone</h2>
            <p className="text-sm text-muted-foreground">
              Confirming <span className="font-bold text-foreground">{milestoneName.replace(/_/g, " ")}</span> for shipment <span className="font-mono text-primary">{shipmentId}</span>.
            </p>
          </div>

          {posIsManual && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Manual Position Detected</h3>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                The driver's GPS reported a manual override. Please choose how to log the final position for this milestone.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPositionChoice("auto")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    positionChoice === "auto" 
                      ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20" 
                      : "bg-white/50 border-amber-100 grayscale hover:grayscale-0"
                  )}
                >
                  <Navigation className="h-5 w-5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase">Auto-Snap</span>
                </button>

                <button 
                  onClick={() => setPositionChoice("manual")}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    positionChoice === "manual" 
                      ? "bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20" 
                      : "bg-white/50 border-amber-100 grayscale hover:grayscale-0"
                  )}
                >
                  <MousePointer2 className="h-5 w-5 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase">Keep Manual</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleApprove}
              disabled={isSubmitting || (posIsManual && !positionChoice)}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all shadow-lg",
                isSubmitting ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02] active:scale-95"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Finalize Sign-off
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-8 py-4 bg-muted/30 border-t flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">
            Audit Trail will be recorded: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

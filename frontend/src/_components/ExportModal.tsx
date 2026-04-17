"use client";

import React, { useState, useEffect } from "react";
import { 
  Download, 
  Mail, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRecords: number;
}

/**
 * ExportModal: Handles selection of export method and shows background job progress.
 * Logic: < 500 records = Instant, > 500 records = Background/Email.
 */
export function ExportModal({ isOpen, onClose, totalRecords }: ExportModalProps) {
  const [step, setStep] = useState<"select" | "processing" | "completed">("select");
  const [jobProgress, setJobProgress] = useState(0);
  const isLargeExport = totalRecords > 500;

  useEffect(() => {
    if (step === "processing") {
      const interval = setInterval(() => {
        setJobProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep("completed");
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step]);

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

        {step === "select" && (
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Export Data</h2>
              <p className="text-sm text-muted-foreground">
                You are about to export <span className="font-bold text-foreground">{totalRecords.toLocaleString()}</span> shipments.
              </p>
            </div>

            <div className="grid gap-4">
              <button 
                onClick={() => setStep("processing")}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all hover:border-primary group",
                  !isLargeExport ? "bg-primary/5 border-primary/20" : "bg-card"
                )}
              >
                <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Instant Download (CSV)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Optimized for small datasets. Starts immediately.</p>
                  {!isLargeExport && (
                    <span className="inline-block mt-2 text-[10px] font-black text-primary uppercase tracking-widest">Recommended</span>
                  )}
                </div>
              </button>

              <button 
                onClick={() => setStep("processing")}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-2xl border text-left transition-all hover:border-primary group",
                  isLargeExport ? "bg-primary/5 border-primary/20" : "bg-card"
                )}
              >
                <div className="mt-1 p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Background Export (XLSX)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">For large datasets. We will email you a secure link.</p>
                  {isLargeExport && (
                    <span className="inline-block mt-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">Required for {totalRecords} rows</span>
                  )}
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-dashed">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                Exports are retained for 24 hours in the Download Center.
              </p>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <svg className="absolute inset-0 h-20 w-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={226.19}
                  strokeDashoffset={226.19 * (1 - jobProgress / 100)}
                  className="text-primary transition-all duration-300"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Generating Report...</h3>
              <p className="text-sm text-muted-foreground">Assembling data from carrier APIs. This may take a moment.</p>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full transition-all duration-300" style={{ width: `${jobProgress}%` }} />
            </div>
          </div>
        )}

        {step === "completed" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Export Ready!</h3>
              <p className="text-sm text-muted-foreground">
                {isLargeExport 
                  ? "The background job finished. Check your email for the secure download link." 
                  : "Your shipment report has been generated and the download should start shortly."}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
            >
              Back to Shipments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type ExportJob = {
  id: string;
  fileName: string;
  fileType: "CSV" | "XLSX";
  timestamp: string;
  status: "completed" | "processing" | "expired";
  recordCount: number;
  size?: string;
};

/**
 * DownloadCenter: Shows past 24h of exports for the current user.
 */
export function DownloadCenter() {
  const exports: ExportJob[] = [
    { id: "EXP-101", fileName: "shipments_2026_04_14.csv", fileType: "CSV", timestamp: "2 hours ago", status: "completed", recordCount: 124, size: "45 KB" },
    { id: "EXP-102", fileName: "global_transit_report.xlsx", fileType: "XLSX", timestamp: "5 hours ago", status: "completed", recordCount: 4500, size: "1.2 MB" },
    { id: "EXP-103", fileName: "port_congestion_analysis.csv", fileType: "CSV", timestamp: "12 hours ago", status: "expired", recordCount: 89, size: "12 KB" },
    { id: "EXP-104", fileName: "daily_dispatch_log.csv", fileType: "CSV", timestamp: "Just now", status: "processing", recordCount: 15 },
  ];

  return (
    <div className="flex flex-col bg-card border rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Download Center
        </h3>
        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest bg-muted px-2 py-1 rounded-md">Past 24 Hours</span>
      </div>

      <div className="divide-y">
        {exports.map((exp) => (
          <div key={exp.id} className="p-4 md:p-6 hover:bg-muted/20 transition-colors group">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl shrink-0 border shadow-sm",
                exp.status === "completed" ? "bg-primary/5 text-primary border-primary/10" : 
                exp.status === "processing" ? "bg-blue-500/5 text-blue-500 border-blue-100" :
                "bg-slate-100 text-slate-400 border-slate-200 grayscale"
              )}>
                {exp.fileType === "CSV" ? <FileText className="h-6 w-6" /> : <FileSpreadsheet className="h-6 w-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm truncate">{exp.fileName}</h4>
                  <span className={cn(
                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border",
                    exp.status === "completed" ? "text-green-600 border-green-200 bg-green-50" :
                    exp.status === "processing" ? "text-blue-600 border-blue-200 bg-blue-50" :
                    "text-slate-400 border-slate-200 bg-slate-50"
                  )}>
                    {exp.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exp.timestamp}</span>
                  <span className="border-l pl-3">{exp.recordCount.toLocaleString()} Rows</span>
                  {exp.size && <span className="border-l pl-3">{exp.size}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {exp.status === "completed" && (
                  <button className="p-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all">
                    <Download className="h-4 w-4" />
                  </button>
                )}
                {exp.status === "processing" && (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                )}
                <button className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-muted/30 border-t">
        <p className="text-[10px] text-muted-foreground text-center italic">
          Automatic cleanup runs every hour. Please save important reports locally.
        </p>
      </div>
    </div>
  );
}

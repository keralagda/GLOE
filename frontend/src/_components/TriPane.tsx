"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, List, FileText, CheckCircle } from "lucide-react";

interface TriPaneProps {
  master: React.ReactNode;
  detail: React.ReactNode;
  review: React.ReactNode;
}

/**
 * TriPane: A high-density 3-pane layout for logistics auditing.
 * Mobile: Pivots between Master, Detail, and Review.
 * Desktop: Shows all three panes side-by-side.
 */
export function TriPane({ master, detail, review }: TriPaneProps) {
  const [activePane, setActivePane] = useState<"master" | "detail" | "review">("master");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full overflow-hidden bg-background border rounded-2xl shadow-xl">
      {/* Mobile Pivot Header */}
      <div className="flex lg:hidden items-center justify-around border-b bg-muted/30 p-2">
        <PaneTab 
          active={activePane === "master"} 
          onClick={() => setActivePane("master")} 
          icon={<List className="h-4 w-4" />} 
          label="List" 
        />
        <PaneTab 
          active={activePane === "detail"} 
          onClick={() => setActivePane("detail")} 
          icon={<FileText className="h-4 w-4" />} 
          label="Detail" 
        />
        <PaneTab 
          active={activePane === "review"} 
          onClick={() => setActivePane("review")} 
          icon={<CheckCircle className="h-4 w-4" />} 
          label="Review" 
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Master Pane */}
        <div className={cn(
          "flex-1 lg:flex-[1] border-r overflow-y-auto transition-all duration-300",
          activePane === "master" ? "block" : "hidden lg:block"
        )}>
          {master}
        </div>

        {/* Detail Pane */}
        <div className={cn(
          "flex-1 lg:flex-[2] border-r overflow-y-auto transition-all duration-300 bg-slate-50 dark:bg-slate-900/20",
          activePane === "detail" ? "block" : "hidden lg:block"
        )}>
          {detail}
        </div>

        {/* Review Pane */}
        <div className={cn(
          "flex-1 lg:flex-[1] overflow-y-auto transition-all duration-300",
          activePane === "review" ? "block" : "hidden lg:block"
        )}>
          {review}
        </div>
      </div>
    </div>
  );
}

function PaneTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
        active ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

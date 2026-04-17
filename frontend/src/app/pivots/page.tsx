"use client";

import React, { useState } from "react";
import { AutomationSettings } from "@/_components/AutomationSettings";
import { ReviewPanel } from "@/_components/ReviewPanel";
import { HistoryPanel } from "@/_components/HistoryPanel";
import { TransshipmentStepper } from "@/_components/TransshipmentStepper";
import { LayoutDashboard, History, Settings, ClipboardCheck, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StackedPivotsPage: Demonstrates the integration of all requested leaf components.
 * Adheres to high-density, mobile-first design.
 */
export default function StackedPivotsPage() {
  const [activeTab, setActiveTab] = useState<"review" | "history" | "automation" | "step18">("review");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-black tracking-tighter text-lg uppercase">Logistics Command</h1>
        </div>
      </header>

      {/* Main Content Area with Bottom Tabs */}
      <main className="flex-1 pb-24 overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {activeTab === "review" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReviewPanel />
            </div>
          )}
          
          {activeTab === "history" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HistoryPanel />
            </div>
          )}
          
          {activeTab === "automation" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AutomationSettings />
            </div>
          )}
          
          {activeTab === "step18" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-card border rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                  <Anchor className="h-5 w-5 text-primary" />
                  Step 18: Sea Transit Loop
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Manage transshipment checkpoints for the active sea transit phase.
                </p>
                <TransshipmentStepper />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Pivot Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-xl border-t px-2 py-2 flex items-center justify-around z-30">
        <PivotButton 
          active={activeTab === "review"} 
          onClick={() => setActiveTab("review")} 
          icon={<ClipboardCheck className="h-5 w-5" />} 
          label="Review"
        />
        <PivotButton 
          active={activeTab === "step18"} 
          onClick={() => setActiveTab("step18")} 
          icon={<Anchor className="h-5 w-5" />} 
          label="Transit"
        />
        <PivotButton 
          active={activeTab === "history"} 
          onClick={() => setActiveTab("history")} 
          icon={<History className="h-5 w-5" />} 
          label="History"
        />
        <PivotButton 
          active={activeTab === "automation"} 
          onClick={() => setActiveTab("automation")} 
          icon={<Settings className="h-5 w-5" />} 
          label="Settings"
        />
      </nav>
    </div>
  );
}

function PivotButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
        active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

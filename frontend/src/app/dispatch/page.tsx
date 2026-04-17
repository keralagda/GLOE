"use client";

import React, { useState, useEffect } from "react";
import { DispatchButton } from "@/_components/DispatchButton";
import { Clock, MapPin, Truck, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types based on backend schema
type Milestone = {
  id: string;
  name: string;
  order_index: number;
};

type Dispatch = {
  id: string;
  identifier: string;
  current_milestone_id: string | null;
  completed_at: string | null;
};

const MILESTONES: Milestone[] = [
  { id: "1", name: "DISPATCH_ASSIGNED", order_index: 1 },
  { id: "2", name: "EN_ROUTE_TO_PICKUP", order_index: 2 },
  { id: "3", name: "ARRIVED_AT_PICKUP", order_index: 3 },
  { id: "4", name: "LOADING_STARTED", order_index: 4 },
  { id: "5", name: "LOADING_FINISHED", order_index: 5 },
  { id: "6", name: "DISPATCHED", order_index: 6 },
  { id: "7", name: "EN_ROUTE_TO_DESTINATION", order_index: 7 },
  { id: "8", name: "ARRIVED_AT_DESTINATION", order_index: 8 },
  { id: "9", name: "UNLOADING_STARTED", order_index: 9 },
  { id: "10", name: "UNLOADING_FINISHED", order_index: 10 },
  { id: "11", name: "COMPLETED", order_index: 11 },
];

export default function DispatchPage() {
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, this would fetch from the API
  useEffect(() => {
    // Initializing with empty state per Zero-State readiness
    // setDispatch({ id: "...", identifier: "DISP-123", current_milestone_id: "1", completed_at: null });
  }, []);

  const currentMilestoneIndex = MILESTONES.findIndex(
    (m) => m.id === dispatch?.current_milestone_id
  );
  
  const currentMilestone = dispatch?.current_milestone_id 
    ? MILESTONES[currentMilestoneIndex] 
    : null;
    
  const nextMilestone = currentMilestoneIndex < MILESTONES.length - 1 
    ? MILESTONES[currentMilestoneIndex + 1] 
    : null;

  const handleTransition = async () => {
    if (!nextMilestone) return;
    
    setIsLoading(true);
    try {
      // API Call would go here
      // await updateDispatchMilestone(dispatch.id, nextMilestone.id);
      
      setDispatch(prev => prev ? {
        ...prev,
        current_milestone_id: nextMilestone.id,
        completed_at: nextMilestone.name === "COMPLETED" ? new Array().toString() : null
      } : null);
    } catch (error) {
      console.error("Transition failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!dispatch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <Truck className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">No Active Dispatch</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">
          Wait for a new assignment to begin your route tracking.
        </p>
        <button 
          onClick={() => setDispatch({ id: "1", identifier: "DS-7700", current_milestone_id: "1", completed_at: null })}
          className="mt-8 btn btn-primary px-8"
        >
          Assign Me (Dev Mode)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">{dispatch.identifier}</h1>
            <p className="text-xs text-muted-foreground mt-1">First Mile Dispatch</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-8 max-w-md mx-auto w-full">
        {/* Current Status Card */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Milestone</h2>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {currentMilestone?.name.replace(/_/g, " ") || "INITIALIZING"}
              </p>
            </div>
            <div className="bg-slate-100 p-3 rounded-2xl">
              <Clock className="h-6 w-6 text-slate-500" />
            </div>
          </div>

          <DispatchButton 
            currentMilestone={currentMilestone?.name || ""}
            nextMilestone={nextMilestone?.name || null}
            onTransition={handleTransition}
            isLoading={isLoading}
          />
        </section>

        {/* Timeline */}
        <section className="space-y-4">
          <h3 className="font-bold text-slate-900 px-2">Progress</h3>
          <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
            {MILESTONES.map((m, idx) => {
              const isCompleted = idx < currentMilestoneIndex;
              const isCurrent = idx === currentMilestoneIndex;
              const isFuture = idx > currentMilestoneIndex;

              return (
                <div key={m.id} className="relative flex items-center gap-6 pl-10">
                  <div className={cn(
                    "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors border-4 border-slate-50",
                    isCompleted ? "bg-green-500 text-white" : 
                    isCurrent ? "bg-primary text-primary-foreground scale-110 shadow-lg" : 
                    "bg-white border-slate-200"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : 
                     isCurrent ? <Truck className="h-5 w-5" /> : 
                     <Circle className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className={cn(
                    "flex-1",
                    isFuture && "opacity-40"
                  )}>
                    <p className={cn(
                      "font-bold text-sm",
                      isCurrent ? "text-primary" : "text-slate-700"
                    )}>
                      {m.name.replace(/_/g, " ")}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary/70 font-medium">In Progress</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      
      {/* Footer Navigation (Optional placeholder) */}
      <footer className="fixed bottom-0 inset-x-0 h-16 bg-white border-t flex items-center justify-around px-8">
        <MapPin className="h-6 w-6 text-primary" />
        <Clock className="h-6 w-6 text-slate-400" />
        <div className="h-10 w-10 bg-slate-100 rounded-full" />
      </footer>
    </div>
  );
}

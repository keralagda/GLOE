"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  Package, 
  MapPin, 
  Truck, 
  Anchor, 
  ShieldCheck, 
  ExternalLink, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  Globe
} from "lucide-react";

interface PublicTrackingPageProps {
  companyName?: string;
  logoUrl?: string;
  shipmentId?: string;
  currentPhase?: number; // 1 to 6
}

const PHASES = [
  { id: 1, name: "Booking", icon: ShieldCheck },
  { id: 2, name: "Pickup", icon: Truck },
  { id: 3, name: "Origin", icon: Anchor },
  { id: 4, name: "Transit", icon: Globe },
  { id: 5, name: "Dest Port", icon: Anchor },
  { id: 6, name: "Delivery", icon: Package },
];

/**
 * PublicTrackingPage: Ultra-clean, premium customer-facing shipment status.
 * Optimized for mobile "screenshot-ready" aesthetics.
 */
export default function PublicTrackingPage({
  companyName = "Tazy Logistics",
  logoUrl,
  shipmentId = "MSK-7721-ROT",
  currentPhase = 4,
}: PublicTrackingPageProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center selection:bg-primary selection:text-white">
      {/* Premium Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md px-6 md:px-12 py-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-400/20">
            <Globe className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-base uppercase tracking-tighter leading-none">{companyName}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Tracking</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest">
           <a href="#" className="text-slate-400 hover:text-primary transition-colors">Documentation</a>
           <a href="#" className="text-slate-400 hover:text-primary transition-colors">Help Center</a>
           <button className="bg-slate-950 text-white px-5 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all">
             Contact Support
           </button>
        </div>
      </nav>

      <main className="w-full max-w-5xl px-6 py-12 md:py-20 space-y-24">
        {/* Visual Identity Section */}
        <section className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="space-y-4">
             <span className="inline-flex items-center gap-2 px-5 py-2 bg-slate-50 border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               Current Location: Red Sea
             </span>
             <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none text-slate-950">
               {shipmentId}
             </h1>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 pt-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Origin</span>
              <span className="text-xl font-bold tracking-tight">Chennai (IN)</span>
            </div>
            <div className="h-px w-12 bg-slate-200 hidden md:block" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination</span>
              <span className="text-xl font-bold tracking-tight">Rotterdam (NL)</span>
            </div>
          </div>
        </section>

        {/* The Clean Stepper */}
        <section className="relative px-4">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-100 -z-10 hidden md:block" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-4">
            {PHASES.map((phase, idx) => {
              const Icon = phase.icon;
              const isCompleted = phase.id < currentPhase;
              const isCurrent = phase.id === currentPhase;
              
              return (
                <div key={phase.id} className="flex flex-col items-center gap-6 group">
                  <div className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2",
                    isCompleted ? "bg-slate-950 text-white border-slate-950 scale-90 opacity-40" : 
                    isCurrent ? "bg-white text-slate-950 border-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-110" : 
                    "bg-white border-slate-100 text-slate-300"
                  )}>
                    <Icon className={cn("h-6 w-6", isCurrent && "animate-spin-slow")} />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-[11px] font-black uppercase tracking-widest leading-none mb-1",
                      isCurrent ? "text-slate-950" : "text-slate-400"
                    )}>
                      {phase.name}
                    </p>
                    {isCurrent && <span className="text-[8px] font-bold text-primary">IN PROGRESS</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Content Grid: Map + Ledger */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-12 pt-12">
          {/* Map Preview */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-widest">Real-time Position</h3>
              <span className="text-[10px] font-bold text-slate-400">SYNCED 1M AGO</span>
            </div>
            <div className="h-[500px] bg-slate-50 rounded-[3rem] border border-slate-100 relative overflow-hidden group shadow-2xl shadow-slate-200/50 transition-transform hover:scale-[1.01]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 grayscale" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
              
              {/* Animated Route Line Simulation */}
              <svg className="absolute inset-0 w-full h-full opacity-10">
                <path d="M 0 400 Q 250 100 500 250 T 1000 50" fill="transparent" stroke="black" strokeWidth="4" strokeDasharray="20" />
              </svg>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute -inset-16 bg-slate-900/5 rounded-full animate-ping duration-[3000ms]" />
                  <div className="relative w-12 h-12 bg-slate-950 rounded-full border-[6px] border-white shadow-2xl flex items-center justify-center">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-slate-950 rounded-2xl">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vessel Details</p>
                    <p className="text-base font-black italic">MSC OSCAR / 16.4 Knots</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-widest">Latest Events</h3>
              <button className="text-[10px] font-bold text-primary hover:underline uppercase">View All</button>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-[3rem] p-8 space-y-10">
               <EventItem 
                 time="Apr 14, 09:30" 
                 title="Arrived at Port" 
                 desc="Chennai Terminal, India"
                 completed 
               />
               <EventItem 
                 time="Apr 15, 14:20" 
                 title="Loaded on Vessel" 
                 desc="MSC OSCAR V.221"
                 completed 
               />
               <EventItem 
                 time="Apr 16, 11:00" 
                 title="Vessel Departed" 
                 desc="En-route to Rotterdam"
                 active 
               />
               <EventItem 
                 time="Est. May 14" 
                 title="Vessel Arrival" 
                 desc="Rotterdam World Gateway"
                 future 
               />
            </div>
          </div>
        </section>

        <footer className="text-center pt-12 pb-24 space-y-6 border-t border-slate-50">
           <div className="flex items-center justify-center gap-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Maersk_Line_Logo.svg" className="h-4 opacity-20 grayscale" alt="Maersk" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/ad/MSC_Logo.svg" className="h-4 opacity-20 grayscale" alt="MSC" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/Hapag-Lloyd_logo.svg" className="h-4 opacity-20 grayscale" alt="Hapag" />
           </div>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
             Security Verified by <span className="text-slate-400">Tazy Systems</span>
           </p>
        </footer>
      </main>
    </div>
  );
}

function EventItem({ time, title, desc, completed, active, future }: any) {
  return (
    <div className="flex gap-6 relative group">
      {!future && (
        <div className="absolute left-[11px] top-8 bottom-[-40px] w-px bg-slate-200 hidden last:hidden group-last:hidden" />
      )}
      <div className={cn(
        "w-[22px] h-[22px] rounded-full shrink-0 border-4 mt-1 transition-all",
        completed ? "bg-slate-900 border-white shadow-sm" : 
        active ? "bg-white border-slate-950 scale-125 shadow-lg animate-pulse" : 
        "bg-white border-slate-100"
      )} />
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">{time}</p>
        <h4 className={cn(
          "text-sm font-black tracking-tight leading-none",
          future ? "text-slate-300" : "text-slate-950"
        )}>{title}</h4>
        <p className="text-[11px] text-slate-500 font-medium">{desc}</p>
      </div>
    </div>
  );
}

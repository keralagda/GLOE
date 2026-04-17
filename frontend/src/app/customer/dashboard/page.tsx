"use client";

import React, { useState } from "react";
import { CustomerKPIBento } from "@/_components/CustomerKPIBento";
import { ShipmentListTable } from "@/_components/ShipmentListTable";
import { InvoiceList } from "@/_components/InvoiceList";
import { 
  Globe, 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  ExternalLink,
  ChevronRight,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CustomerDashboard: The primary portal for Shippers/Customers.
 * Focuses on transparency, L_e scores, and cost efficiency.
 */
export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "shipments" | "invoices">("overview");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Side Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 border-r bg-card h-screen sticky top-0 px-6 py-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-400/20">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg uppercase tracking-tighter leading-none">Shipper Portal</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acme Global Corp</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard className="h-5 w-5" />} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <NavItem icon={<Package className="h-5 w-5" />} label="Shipments" active={activeTab === "shipments"} onClick={() => setActiveTab("shipments")} />
          <NavItem icon={<FileText className="h-5 w-5" />} label="Invoices" active={activeTab === "invoices"} onClick={() => setActiveTab("invoices")} />
          <NavItem icon={<Settings className="h-5 w-5" />} label="Settings" />
        </nav>

        <div className="mt-auto border-t pt-6 space-y-6">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Next Milestone</p>
             <p className="text-xs font-bold text-slate-900 leading-snug">Vessel MSC OSCAR arriving at Rotterdam in 2 days.</p>
             <button className="mt-3 text-[10px] font-bold text-primary flex items-center gap-1 hover:underline uppercase">
               View Details <ChevronRight className="h-3 w-3" />
             </button>
           </div>
           <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold text-destructive hover:bg-destructive/5">
             <LogOut className="h-5 w-5" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b bg-background/50 backdrop-blur-md sticky top-0 z-20 px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 hidden md:block">Supply Chain Intelligence</h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-8">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search shipments..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-xs w-64 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full relative transition-colors">
              <Bell className="h-5 w-5 text-slate-600" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            </button>
            
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-[2px] shadow-lg shadow-primary/20">
               <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Acme+Corp&background=random" alt="Avatar" className="w-full h-full object-cover" />
               </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 md:p-12 space-y-12 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === "overview" && (
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Executive Overview</h1>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Performance and cost analysis for Q2 2026.</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:bg-slate-50 transition-all">Download Q2 CSV</button>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">New Shipment</button>
                </div>
              </div>
              <CustomerKPIBento />
            </section>
          )}

          {(activeTab === "overview" || activeTab === "shipments") && (
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 uppercase italic">
                  {activeTab === "overview" ? "Active Order Pipeline" : "My Full Shipment History"}
                </h3>
                {activeTab === "overview" && (
                  <button className="text-xs font-bold text-primary hover:underline uppercase tracking-tight">View All Archive</button>
                )}
              </div>
              <div className="bg-white rounded-[2.5rem] border shadow-2xl shadow-slate-200/50 overflow-hidden">
                <ShipmentListTable />
              </div>
            </section>
          )}

          {activeTab === "invoices" && (
            <section className="space-y-6 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Billing & Settlement</h1>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Verified invoices for completed milestones.</p>
                </div>
              </div>
              <InvoiceList />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-sm font-black uppercase tracking-widest",
        active 
          ? "bg-slate-950 text-white shadow-2xl shadow-slate-400/30" 
          : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
      )}
    >
      <div className={cn("p-1", active && "scale-110")}>{icon}</div>
      {label}
    </button>
  );
}

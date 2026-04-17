"use client";

import React from "react";
import { KPIBentoGrid } from "@/_components/KPIBentoGrid";
import { ShipmentListTable } from "@/_components/ShipmentListTable";
import { 
  Bell, 
  Search, 
  Menu, 
  User, 
  LayoutDashboard, 
  Package, 
  Truck, 
  Anchor, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LogisticsDashboard: The main "Command Center" for the SaaS platform.
 * Integrates Bento grids and high-density tables.
 */
export default function LogisticsDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Side Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">Tazy Logistics</span>
          </div>

          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard className="h-5 w-5" />} label="Command Center" active />
            <NavItem icon={<Package className="h-5 w-5" />} label="Shipments" />
            <NavItem icon={<Truck className="h-5 w-5" />} label="Fleet" />
            <NavItem icon={<Anchor className="h-5 w-5" />} label="Port Ops" />
            <div className="pt-4 mt-4 border-t border-border/50">
              <NavItem icon={<Settings className="h-5 w-5" />} label="Settings" />
              <NavItem icon={<LogOut className="h-5 w-5" />} label="Sign Out" />
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <p className="text-xs font-bold text-primary uppercase mb-1">Support Plan</p>
            <p className="text-[10px] text-muted-foreground mb-3">Enterprise Gold Tier active until June 2026.</p>
            <button className="w-full py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-muted rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-widest hidden md:block">Global Fleet Overview</h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 border rounded-full px-3 py-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-muted-foreground">Systems Operational</span>
            </div>
            
            <button className="p-2 hover:bg-muted rounded-full relative">
              <Bell className="h-5 w-5" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </button>
            
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold">Sarah Admin</p>
                <p className="text-[10px] text-muted-foreground">Ops Director</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border-2 border-background overflow-hidden">
                <User className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Executive Dashboard</h3>
              <p className="text-xs text-muted-foreground">Real-time metrics synced 12s ago.</p>
            </div>
            <KPIBentoGrid />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Critical Shipments</h3>
              <button className="text-xs text-primary font-bold hover:underline">View All Active</button>
            </div>
            <ShipmentListTable />
          </section>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
      active 
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}>
      {icon}
      {label}
    </button>
  );
}

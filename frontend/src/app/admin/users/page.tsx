"use client";

import React, { useState } from "react";
import { UserManagementTable } from "@/_components/UserManagementTable";
import { AddUserModal } from "@/_components/AddUserModal";
import { 
  ShieldCheck, 
  UserPlus, 
  ArrowLeft, 
  LayoutDashboard, 
  History,
  Activity,
  Zap,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AdminUserManagementPage: Command center for provisioning and security.
 */
export default function AdminUserManagementPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button className="p-3 bg-white border rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-950 text-white rounded-2xl shadow-2xl shadow-slate-400/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter">System Governance</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Command Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end mr-4">
               <span className="text-[10px] font-bold text-green-600 uppercase">Auth Server: Optimal</span>
               <span className="text-[9px] text-muted-foreground font-mono">Uptime: 99.998%</span>
             </div>
             <button 
               onClick={() => setIsAddModalOpen(true)}
               className="flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
             >
               <UserPlus className="h-4 w-4" />
               Provision User
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Security Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <SecurityCard icon={<Activity className="h-4 w-4" />} label="Active Sessions" value="24" trend="+2" />
           <SecurityCard icon={<Zap className="h-4 w-4" />} label="Provisioned" value="12" subtitle="/ 50" />
           <SecurityCard icon={<Lock className="h-4 w-4" />} label="Policy Violations" value="0" status="safe" />
           <SecurityCard icon={<History className="h-4 w-4" />} label="Audit Events" value="1.2k" subtitle="MTD" />
        </section>

        {/* User Management Section */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h2 className="font-black text-sm uppercase tracking-[0.2em] text-slate-900">User Acquisition & Policy</h2>
             <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Export Security Log</button>
           </div>
           <UserManagementTable />
        </section>

        {/* Policy Notice */}
        <section className="p-8 rounded-[2.5rem] bg-slate-950 text-white border border-slate-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-[0.05] scale-[3] rotate-12 -z-0">
             <ShieldCheck className="h-32 w-32" />
           </div>
           <div className="max-w-xl relative z-10 space-y-4">
             <h3 className="text-xl font-bold tracking-tight">Enterprise Compliance Guard</h3>
             <p className="text-sm text-slate-400 leading-relaxed">
               All user provisioning and role changes are recorded in the immutable Forensic Ledger. Ensure temporary passwords comply with your tenant security policy before distribution.
             </p>
             <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
               Review Governance Policy →
             </button>
           </div>
        </section>
      </main>
    </div>
  );
}

function SecurityCard({ icon, label, value, subtitle, trend, status }: any) {
  return (
    <div className="p-6 rounded-[2rem] bg-white border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
       <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">{icon}</div>
          {trend && <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">{trend}</span>}
          {status === "safe" && <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">Secure</span>}
       </div>
       <div>
         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
         <div className="flex items-baseline gap-1.5">
           <h4 className="text-2xl font-black text-slate-950 tracking-tighter">{value}</h4>
           {subtitle && <span className="text-xs font-bold text-slate-400">{subtitle}</span>}
         </div>
       </div>
    </div>
  );
}

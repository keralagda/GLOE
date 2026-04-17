"use client";

import React, { useState } from "react";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  User, 
  Mail, 
  Lock, 
  Unlock, 
  Trash2,
  Filter,
  ArrowUpDown,
  History,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Ops" | "Driver";
  status: "Active" | "Invited" | "Disabled";
  lastActive: string;
};

const MOCK_USERS: SystemUser[] = [
  { id: "U-001", name: "Sarah Admin", email: "sarah@tazy.com", role: "Admin", status: "Active", lastActive: "2 mins ago" },
  { id: "U-002", name: "John Driver", email: "john@tazy.com", role: "Driver", status: "Active", lastActive: "1 hour ago" },
  { id: "U-003", name: "Mike Ops", email: "mike@tazy.com", role: "Ops", status: "Invited", lastActive: "Never" },
  { id: "U-004", name: "Disabled User", email: "disabled@tazy.com", role: "Driver", status: "Disabled", lastActive: "2 days ago" },
];

/**
 * UserManagementTable: High-density admin view for team provisioning.
 */
export function UserManagementTable() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col bg-background border rounded-3xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="w-full pl-10 pr-4 py-2 bg-background border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-xl border shadow-sm transition-colors">
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
             <History className="h-3.5 w-3.5 text-primary" />
             Access Logs
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 border-b">User Entity</th>
              <th className="px-6 py-4 border-b">System Role</th>
              <th className="px-6 py-4 border-b">Access Status</th>
              <th className="px-6 py-4 border-b">Last Heartbeat</th>
              <th className="px-6 py-4 border-b text-right">Policy Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-muted/10 transition-colors group cursor-default">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-lg border",
                      user.role === "Admin" ? "bg-red-50 border-red-100 text-red-600" :
                      user.role === "Ops" ? "bg-blue-50 border-blue-100 text-blue-600" :
                      "bg-slate-50 border-slate-200 text-slate-600"
                    )}>
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                    user.status === "Active" ? "bg-green-50 text-green-700 border-green-200" :
                    user.status === "Invited" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                    "bg-slate-50 text-slate-400 border-slate-200 grayscale"
                  )}>
                    {user.status === "Active" && <CheckCircle2 className="h-3 w-3" />}
                    {user.status === "Invited" && <Clock className="h-3 w-3" />}
                    {user.status === "Disabled" && <XCircle className="h-3 w-3" />}
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[10px] font-mono font-bold text-muted-foreground">{user.lastActive}</span>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors" title="Change Role">
                        <Unlock className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors" title="Lock Account">
                        <Lock className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors" title="Revoke Access">
                        <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-muted/20 border-t flex items-center justify-center">
         <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
           Total active licenses: 12 / 50
         </p>
      </div>
    </div>
  );
}

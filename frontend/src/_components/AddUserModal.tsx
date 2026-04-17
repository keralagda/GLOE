"use client";

import React, { useState } from "react";
import { 
  X, 
  Mail, 
  UserPlus, 
  Shield, 
  Key, 
  RefreshCcw, 
  Send, 
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AddUserModal: Manages user acquisition via Invite or Manual Creation.
 */
export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [activeTab, setActiveTab] = useState<"invite" | "manual">("invite");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 md:p-12 space-y-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-2">
              <UserPlus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Scale Your Team</h2>
            <p className="text-sm text-muted-foreground">Provision new access for operations and drivers.</p>
          </div>

          <div className="flex p-1 bg-muted rounded-2xl">
             <button 
               onClick={() => setActiveTab("invite")}
               className={cn(
                 "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === "invite" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
               )}
             >
               Send Invitation
             </button>
             <button 
               onClick={() => setActiveTab("manual")}
               className={cn(
                 "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                 activeTab === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
               )}
             >
               Manual Create
             </button>
          </div>

          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95">
               <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-500">
                 <CheckCircle2 className="h-12 w-12" />
               </div>
               <div className="space-y-1">
                 <h3 className="text-lg font-bold">Action Confirmed</h3>
                 <p className="text-sm text-muted-foreground">Audit log entry created in Security Watchtower.</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === "invite" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input 
                        type="email" 
                        required
                        placeholder="operations@tazy.com"
                        className="w-full pl-12 pr-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Sarah Admin"
                       className="w-full px-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                     <input 
                       type="email" 
                       required
                       placeholder="sarah@tazy.com"
                       className="w-full px-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                     />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Temp Password</label>
                     <div className="relative group">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <input 
                         type="password" 
                         required
                         placeholder="••••••••"
                         className="w-full pl-12 pr-4 py-3 bg-muted/50 border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                       />
                     </div>
                   </div>
                   <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 border rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border shadow-sm"><RefreshCcw className="h-4 w-4 text-primary" /></div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">Force Password Reset</span>
                          <span className="text-[10px] text-muted-foreground">User must change password on login</span>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Role</label>
                <div className="grid grid-cols-3 gap-3">
                  <RoleOption label="Admin" icon={<Shield className="h-4 w-4" />} />
                  <RoleOption label="Ops" icon={<RefreshCcw className="h-4 w-4" />} />
                  <RoleOption label="Driver" icon={<Key className="h-4 w-4" />} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {activeTab === "invite" ? <Send className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {activeTab === "invite" ? "Send Secure Invite" : "Create User Profile"}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleOption({ label, icon }: { label: string; icon: React.ReactNode }) {
  const [selected, setSelected] = useState(false);
  return (
    <button 
      type="button"
      onClick={() => setSelected(!selected)}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
        selected ? "bg-primary/5 border-primary ring-2 ring-primary/20" : "bg-card border-border hover:border-primary/30"
      )}
    >
      <div className={cn("p-1.5 rounded-lg", selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{icon}</div>
      <span className={cn("text-[10px] font-black uppercase tracking-tighter", selected ? "text-primary" : "text-muted-foreground")}>{label}</span>
    </button>
  );
}

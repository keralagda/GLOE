"use client";

import React from "react";
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  X,
  MapPin,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: "sla_breach" | "milestone_complete" | "system_alert";
  title: string;
  message: string;
  source: {
    type: "global" | "port";
    label: string;
  };
  timestamp: string;
  unread: boolean;
};

/**
 * NotificationPanel: Displays real-time operational alerts with SLA source context.
 */
export function NotificationPanel() {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "sla_breach",
      title: "SLA Breach Detected",
      message: "Shipment MSK-7721 exceeded the pickup window by 4.2 hours.",
      source: { type: "global", label: "Global Threshold" },
      timestamp: "5 mins ago",
      unread: true,
    },
    {
      id: "2",
      type: "sla_breach",
      title: "Regional Delay Alert",
      message: "Gateway processing at SIN Port is trending 12% slower than target.",
      source: { type: "port", label: "Singapore Port Override" },
      timestamp: "20 mins ago",
      unread: true,
    },
    {
      id: "3",
      type: "milestone_complete",
      title: "Milestone Verified",
      message: "Stuffing finished for MSC-8832. Releasing documents.",
      source: { type: "global", label: "Standard Flow" },
      timestamp: "1 hour ago",
      unread: false,
    },
  ];

  return (
    <div className="flex flex-col bg-card border rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-sm animate-in slide-in-from-top-4 duration-500">
      <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-black text-xs uppercase tracking-widest">Notifications</h3>
        </div>
        <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter">Mark all as read</button>
      </div>

      <div className="divide-y overflow-y-auto max-h-[450px] scrollbar-thin">
        {notifications.map((notif) => (
          <div key={notif.id} className={cn(
            "p-5 hover:bg-muted/30 transition-colors group cursor-pointer relative",
            notif.unread && "bg-primary/[0.02]"
          )}>
            {notif.unread && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
            )}
            
            <div className="flex items-start gap-4">
              <div className={cn(
                "mt-1 p-2 rounded-xl shrink-0 border shadow-sm",
                notif.type === "sla_breach" ? "bg-red-50 text-red-500 border-red-100" :
                notif.type === "milestone_complete" ? "bg-green-50 text-green-500 border-green-100" :
                "bg-blue-50 text-blue-500 border-blue-100"
              )}>
                {notif.type === "sla_breach" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>

              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-xs truncate leading-none">{notif.title}</h4>
                  <span className="text-[9px] text-muted-foreground font-mono shrink-0 uppercase">{notif.timestamp}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                
                {/* SLA Source Badge */}
                <div className="pt-2">
                   <div className={cn(
                     "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tight",
                     notif.source.type === "port" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"
                   )}>
                     {notif.source.type === "port" ? <MapPin className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                     {notif.source.label}
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-muted/20 border-t">
        <button className="w-full py-2.5 bg-background border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all shadow-sm">
          View All History
        </button>
      </div>
    </div>
  );
}

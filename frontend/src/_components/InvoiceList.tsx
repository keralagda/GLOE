"use client";

import React from "react";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  DollarSign,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

type Invoice = {
  id: string;
  shipmentId: string;
  amount: string;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
};

const MOCK_INVOICES: Invoice[] = [
  { id: "INV-2024-001", shipmentId: "MSK-7721", amount: "$4,250.00", date: "2026-04-10", status: "Paid" },
  { id: "INV-2024-002", shipmentId: "MSC-8832", amount: "$1,890.00", date: "2026-04-12", status: "Pending" },
  { id: "INV-2024-003", shipmentId: "CMA-9943", amount: "$3,400.00", date: "2026-04-14", status: "Pending" },
];

/**
 * InvoiceList: Customer-facing invoice management view.
 */
export function InvoiceList() {
  return (
    <div className="flex flex-col bg-background border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">Billing & Invoices</h3>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Manage your payment history</p>
          </div>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Invoice ID..." 
            className="pl-10 pr-4 py-2 bg-background border rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 text-[10px] uppercase font-black tracking-widest text-muted-foreground">
            <tr>
              <th className="px-6 py-4 border-b">Invoice ID</th>
              <th className="px-6 py-4 border-b">Shipment Ref</th>
              <th className="px-6 py-4 border-b">Amount</th>
              <th className="px-6 py-4 border-b">Issued Date</th>
              <th className="px-6 py-4 border-b">Status</th>
              <th className="px-6 py-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {MOCK_INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/10 transition-colors group cursor-default">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-sm">{inv.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border">{inv.shipmentId}</span>
                </td>
                <td className="px-6 py-4">
                   <span className="text-sm font-black text-slate-900 tracking-tight">{inv.amount}</span>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{inv.date}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    inv.status === "Paid" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {inv.status === "Paid" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <button className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all group-hover:bg-blue-600">
                      <Download className="h-4 w-4" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-muted/20 border-t flex items-center justify-between px-6">
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
           MTD Billing Total: $9,540.00
         </p>
         <button className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">
            Go to Billing Center <ExternalLink className="h-3 w-3" />
         </button>
      </div>
    </div>
  );
}

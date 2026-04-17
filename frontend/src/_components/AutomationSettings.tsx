"use client";

import React from "react";
import { Settings2, Zap, Shield, Bell, Save, RotateCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DownloadCenter } from "@/_components/DownloadCenter";

/**
 * AutomationSettings: High-density logistics automation configuration.
 * Adheres to Dark Mode First and mobile-first principles.
 */
export function AutomationSettings() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-background text-foreground max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Automation Settings</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-md hover:bg-muted transition-colors" title="Reset to defaults">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Automation Cards... */}
        <div className="grid gap-4">
          {/* Smart Dispatch Card */}
          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <div>
                <h3 className="font-bold">Smart Dispatching</h3>
                <p className="text-xs text-muted-foreground">Automate carrier assignment and route optimization.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-assign Carrier</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Load Balancing (Cost-optimized)</label>
                <input type="checkbox" className="toggle toggle-primary" />
              </div>
            </div>
          </div>

          {/* Milestone Verification Card */}
          <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-bold">Milestone Guard</h3>
                <p className="text-xs text-muted-foreground">Sequential locking and data integrity rules.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enforce Sequential Locking</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Auto-close on Geofence Entry</label>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>
        </div>

        {/* Download Center */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 px-1">
            <Download className="h-5 w-5 text-primary" />
            Exports & Downloads
          </h3>
          <DownloadCenter />
        </div>
      </div>
      
      <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-dashed text-center">
        <p className="text-xs text-muted-foreground">
          Note: Automation rules are applied globally unless overridden at the tenant level.
        </p>
      </div>
    </div>
  );
}

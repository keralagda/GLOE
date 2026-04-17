"use client";

import React, { useState } from "react";
import { Plus, X, MapPin, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type TransshipmentPort = {
  id: string;
  portName: string;
  arrived: boolean;
  sailed: boolean;
};

/**
 * TransshipmentStepper: Dynamic sub-stepper for Step 18.
 * Allows adding multiple transshipment ports with arrival/sailing status.
 */
export function TransshipmentStepper() {
  const [ports, setPorts] = useState<TransshipmentPort[]>([]);

  const addPort = () => {
    const newPort: TransshipmentPort = {
      id: Math.random().toString(36).substr(2, 9),
      portName: "",
      arrived: false,
      sailed: false,
    };
    setPorts([...ports, newPort]);
  };

  const removePort = (id: string) => {
    setPorts(ports.filter((p) => p.id !== id));
  };

  const updatePort = (id: string, updates: Partial<TransshipmentPort>) => {
    setPorts(ports.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Transshipment Ports
        </h4>
        <button
          onClick={addPort}
          className="btn btn-ghost btn-sm text-primary flex items-center gap-1 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Add Port
        </button>
      </div>

      {ports.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-2">
          No transshipment ports added yet.
        </p>
      ) : (
        <div className="space-y-3">
          {ports.map((port, index) => (
            <div
              key={port.id}
              className="relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2"
            >
              <button
                onClick={() => removePort(port.id)}
                className="absolute -right-2 -top-2 bg-white border shadow-sm rounded-full p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter Port Name (e.g. Singapore)"
                  value={port.portName}
                  onChange={(e) => updatePort(port.id, { portName: e.target.value })}
                  className="w-full text-sm font-medium border-none p-0 focus:ring-0 placeholder:text-slate-300"
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => updatePort(port.id, { arrived: !port.arrived })}
                    className="flex items-center gap-2 text-xs font-semibold transition-colors"
                  >
                    {port.arrived ? (
                      <CheckSquare className="h-4 w-4 text-green-500" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300" />
                    )}
                    <span className={cn(port.arrived ? "text-green-600" : "text-slate-500")}>
                      Arrived
                    </span>
                  </button>

                  <button
                    onClick={() => updatePort(port.id, { sailed: !port.sailed })}
                    className="flex items-center gap-2 text-xs font-semibold transition-colors"
                  >
                    {port.sailed ? (
                      <CheckSquare className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300" />
                    )}
                    <span className={cn(port.sailed ? "text-blue-600" : "text-slate-500")}>
                      Sailed
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

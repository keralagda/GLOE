"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit3, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { ExportModal } from "@/_components/ExportModal";

// Types for shipment
type Shipment = {
  id: string;
  identifier: string;
  carrier: string;
  origin: string;
  destination: string;
  status: "In Transit" | "Completed" | "Delayed" | "At Port";
  phase: string;
  progress: number;
};

const MOCK_SHIPMENTS: Shipment[] = [
  { id: "S-001", identifier: "MSK-7721", carrier: "Maersk", origin: "Chennai, IN", destination: "Rotterdam, NL", status: "In Transit", phase: "Sea Transit", progress: 65 },
  { id: "S-002", identifier: "MSC-8832", carrier: "MSC", origin: "Shanghai, CN", destination: "Hamburg, DE", status: "At Port", phase: "Origin Port", progress: 15 },
  { id: "S-003", identifier: "CMA-9943", carrier: "CMA CGM", origin: "Ho Chi Minh, VN", destination: "Los Angeles, US", status: "Delayed", phase: "Sea Transit", progress: 45 },
  { id: "S-004", identifier: "HAP-1154", carrier: "Hapag-Lloyd", origin: "Busan, KR", destination: "Dubai, AE", status: "Completed", phase: "Final Mile", progress: 100 },
  { id: "S-005", identifier: "ONE-2265", carrier: "ONE", origin: "Tokyo, JP", destination: "London, UK", status: "In Transit", phase: "Sea Transit", progress: 30 },
  { id: "S-006", identifier: "COS-3376", carrier: "COSCO", origin: "Ningbo, CN", destination: "New York, US", status: "At Port", phase: "Origin Port", progress: 10 },
  { id: "S-007", identifier: "EVG-4487", carrier: "Evergreen", origin: "Kaohsiung, TW", destination: "Antwerp, BE", status: "In Transit", phase: "Sea Transit", progress: 85 },
  { id: "S-008", identifier: "YML-5598", carrier: "Yang Ming", origin: "Keelung, TW", destination: "Genoa, IT", status: "Delayed", phase: "Sea Transit", progress: 55 },
];

/**
 * ShipmentListTable: High-density table for shipment management.
 * Simulates TanStack Table v8 logic (Sorting, Filtering, Pagination).
 */
export function ShipmentListTable() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Shipment, direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  // Sorting Logic
  const sortedData = React.useMemo(() => {
    let sortableItems = [...MOCK_SHIPMENTS];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [sortConfig]);

  // Filtering Logic
  const filteredData = React.useMemo(() => {
    return sortedData.filter(item => 
      item.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.carrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedData, searchQuery]);

  // Pagination Logic
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const requestSort = (key: keyof Shipment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="flex flex-col gap-4 bg-card border rounded-3xl shadow-sm overflow-hidden">
      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        totalRecords={1284} 
      />

      {/* Table Toolbar */}
      <div className="p-4 md:p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search shipments, carriers, or ports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-muted border rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-muted border rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            Add Shipment
          </button>
        </div>
      </div>

      {/* Actual Table */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/30 text-[10px] uppercase font-bold tracking-widest text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 border-b">
                <button 
                  onClick={() => requestSort('identifier')}
                  className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors group"
                >
                  Shipment 
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {sortConfig?.key === 'identifier' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </button>
              </th>
              <th className="px-6 py-4 border-b">
                <button 
                  onClick={() => requestSort('carrier')}
                  className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors group"
                >
                  Carrier
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {sortConfig?.key === 'carrier' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </button>
              </th>
              <th className="px-6 py-4 border-b">Route</th>
              <th className="px-6 py-4 border-b">Phase</th>
              <th className="px-6 py-4 border-b">
                <button 
                  onClick={() => requestSort('status')}
                  className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors group"
                >
                  Status
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </button>
              </th>
              <th className="px-6 py-4 border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y relative">
            {paginatedData.length > 0 ? (
              paginatedData.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-muted/20 transition-colors group cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">{shipment.identifier}</span>
                      <span className="text-[10px] text-muted-foreground">{shipment.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{shipment.carrier}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-[11px]">
                      <span className="text-muted-foreground truncate max-w-[150px]">From: <span className="text-foreground font-medium">{shipment.origin}</span></span>
                      <span className="text-muted-foreground truncate max-w-[150px]">To: <span className="text-foreground font-medium">{shipment.destination}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 w-32">
                      <span className="text-[10px] font-bold text-primary uppercase">{shipment.phase}</span>
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all duration-700" style={{ width: `${shipment.progress}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase px-2 py-1 rounded-md border",
                      shipment.status === "In Transit" ? "bg-blue-500/5 text-blue-600 border-blue-200" :
                      shipment.status === "Completed" ? "bg-green-500/5 text-green-600 border-green-200" :
                      shipment.status === "Delayed" ? "bg-destructive/5 text-destructive border-destructive-200 animate-pulse" :
                      "bg-slate-500/5 text-slate-600 border-slate-200"
                    )}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors" title="View Details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Edit">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center opacity-20">
                    <Search className="h-12 w-12 mb-2" />
                    <p className="text-lg font-bold">No results found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between text-xs font-medium text-muted-foreground bg-muted/10">
        <span className="hidden sm:inline">Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredData.length)} of {filteredData.length} results</span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button 
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 rounded-lg font-bold transition-all",
                  p === page ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-background border border-transparent hover:border-border"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border rounded-lg hover:bg-background transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

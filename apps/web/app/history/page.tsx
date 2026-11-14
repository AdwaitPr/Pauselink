'use client';

import React from 'react';
import { LiveHistoryTable } from '../../components/LiveHistoryTable';
import { useRealtimeScans } from '../../hooks/useRealtimeScans';
import { History, RefreshCw } from 'lucide-react';

export default function HistoryPage() {
  const { scans, loading, deleteScan, refreshScans } = useRealtimeScans();

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 mb-2">
            <History className="w-3.5 h-3.5" /> Synchronized Audit Trail
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Full Threat Scan History</h1>
          <p className="text-xs text-slate-400 mt-1">
            All scans initiated from your connected Android smartphone and Web consoles in real time.
          </p>
        </div>

        <button
          onClick={refreshScans}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Realtime
        </button>
      </div>

      <LiveHistoryTable
        scans={scans}
        loading={loading}
        onDelete={deleteScan}
        title="All Threat Scans"
      />
    </div>
  );
}

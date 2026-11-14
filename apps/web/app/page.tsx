'use client';

import React from 'react';
import { ScanTerminal } from '../components/ScanTerminal';
import { LiveHistoryTable } from '../components/LiveHistoryTable';
import { useRealtimeScans } from '../hooks/useRealtimeScans';
import { Zap, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { scans, loading, saveScan, deleteScan, refreshScans } = useRealtimeScans();

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-slate-800/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/80 mb-3">
            <Zap className="w-3.5 h-3.5" /> Full-Stack Cross-Platform Realtime Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
            PauseLink Threat Analysis Console
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Deterministic, explainable link and suspicious-message analyzer powered by pure offline-first
            heuristics. Shared real-time state synchronizes immediately between this Web Console and Android devices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={refreshScans}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Realtime
          </button>
        </div>
      </div>

      {/* Main Interactive Scan Terminal */}
      <ScanTerminal onSaveScan={saveScan} />

      {/* Real-time Live History Feed (Top 5 preview) */}
      <LiveHistoryTable
        scans={scans}
        loading={loading}
        onDelete={deleteScan}
        title="Recent Real-Time Scans"
        limit={5}
      />
    </div>
  );
}

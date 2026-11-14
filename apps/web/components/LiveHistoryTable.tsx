'use client';

import React, { useState } from 'react';
import { ScanRecord, RiskBand } from '@pauselink/types';
import { FindingDetailDialog } from './FindingDetailDialog';
import { Smartphone, Globe, ShieldAlert, ShieldCheck, AlertTriangle, Info, Trash2, Eye, Search, Filter } from 'lucide-react';

interface LiveHistoryTableProps {
  scans: ScanRecord[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  title?: string;
  limit?: number;
}

export function LiveHistoryTable({ scans, loading, onDelete, title = 'Live Scan History', limit }: LiveHistoryTableProps) {
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'ANDROID' | 'WEB'>('ALL');
  const [bandFilter, setBandFilter] = useState<'ALL' | RiskBand>('ALL');

  const filteredScans = scans
    .filter((s) => {
      if (originFilter !== 'ALL' && s.device_origin !== originFilter) return false;
      if (bandFilter !== 'ALL' && s.risk_band !== bandFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return s.input_text.toLowerCase().includes(q) || s.risk_band.toLowerCase().includes(q);
      }
      return true;
    })
    .slice(0, limit || scans.length);

  const getBandBadge = (band: RiskBand) => {
    switch (band) {
      case 'STRONG_WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
            <ShieldAlert className="w-3 h-3" />
            Warning
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <AlertTriangle className="w-3 h-3" />
            Caution
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/80">
            <Info className="w-3 h-3" />
            Notice
          </span>
        );
      case 'NO_WARNING_SIGNS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <ShieldCheck className="w-3 h-3" />
            No Warning
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time synchronization across Android devices and Web consoles
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-36 sm:w-48"
            />
          </div>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Origins</option>
            <option value="ANDROID">Android</option>
            <option value="WEB">Web</option>
          </select>

          <select
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Bands</option>
            <option value="STRONG_WARNING">Strong Warning</option>
            <option value="CAUTION">Caution</option>
            <option value="NOTICE">Notice</option>
            <option value="NO_WARNING_SIGNS">No Warning</option>
          </select>
        </div>
      </div>

      {/* Scans List / Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
          Connecting to Realtime stream and syncing scan records...
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No scan records found. Run a scan from the console or from your Android device!
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Origin</th>
                <th className="pb-3 font-semibold">Input / URL Excerpt</th>
                <th className="pb-3 font-semibold">Score</th>
                <th className="pb-3 font-semibold">Risk Band</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pr-3">
                    {scan.device_origin === 'ANDROID' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                        <Smartphone className="w-3 h-3" />
                        Android
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/60">
                        <Globe className="w-3 h-3" />
                        Web
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-300 max-w-[240px] truncate" title={scan.input_text}>
                    {scan.input_text}
                  </td>
                  <td className="py-3 pr-3 font-mono font-bold text-slate-200">{scan.overall_score}</td>
                  <td className="py-3 pr-3">{getBandBadge(scan.risk_band)}</td>
                  <td className="py-3 pr-3 text-slate-400 whitespace-nowrap">
                    {new Date(scan.created_at).toLocaleDateString()} {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedScan(scan)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                        title="Inspect scan report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(scan.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedScan && (
        <FindingDetailDialog scan={selectedScan} onClose={() => setSelectedScan(null)} />
      )}
    </div>
  );
}

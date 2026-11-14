'use client';

import React, { useState } from 'react';
import { analyzeContent } from '../lib/analyzer';
import { AnalysisReportDto, RiskBand } from '@pauselink/types';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Play, CloudUpload, RotateCcw, Link2, Sparkles } from 'lucide-react';

interface ScanTerminalProps {
  onSaveScan: (inputText: string, report: AnalysisReportDto) => Promise<any>;
}

export function ScanTerminal({ onSaveScan }: ScanTerminalProps) {
  const [inputText, setInputText] = useState('');
  const [report, setReport] = useState<AnalysisReportDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAnalyze = (textToAnalyze?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    if (!text || text.trim().length === 0) {
      setReport(null);
      return;
    }
    const result = analyzeContent(text, 'WEB_PASTE');
    setReport(result);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!report || !inputText) return;
    setIsSaving(true);
    try {
      await onSaveScan(inputText, report);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSample = (sample: string) => {
    setInputText(sample);
    handleAnalyze(sample);
  };

  const handleClear = () => {
    setInputText('');
    setReport(null);
    setSavedSuccess(false);
  };

  const getBandBadge = (band: RiskBand) => {
    switch (band) {
      case 'STRONG_WARNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-800">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">Strong Warning</div>
              <div className="text-[10px] text-rose-400">Heuristic indicators detected</div>
            </div>
          </div>
        );
      case 'CAUTION':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">Caution</div>
              <div className="text-[10px] text-amber-400">Moderate risk signals</div>
            </div>
          </div>
        );
      case 'NOTICE':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-800">
            <Info className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">Notice</div>
              <div className="text-[10px] text-sky-400">Low-level indicators</div>
            </div>
          </div>
        );
      case 'NO_WARNING_SIGNS':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-xs font-bold leading-tight">No Warning Signs</div>
              <div className="text-[10px] text-emerald-400">No known suspicious patterns</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Threat Analysis Console</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic, offline-first analysis for links and suspicious messages
          </p>
        </div>

        {/* Sample Payload Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Samples:
          </span>
          <button
            onClick={() => loadSample('Visit https://example.com for documentation.')}
            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 transition-colors"
          >
            Safe Link
          </button>
          <button
            onClick={() => loadSample('URGENT: Your account suspended! Verify now at http://192.0.2.1/login')}
            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-md text-amber-300 transition-colors"
          >
            IP Host
          </button>
          <button
            onClick={() =>
              loadSample(
                'SECURITY ALERT: Immediate action required within 24 hours. Login at https://examplebank.phishing-auth.top/account'
              )
            }
            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 rounded-md text-rose-300 transition-colors"
          >
            Typosquatting
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="mt-4">
        <textarea
          rows={4}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (e.target.value.length === 0) setReport(null);
          }}
          placeholder="Paste full SMS message, email excerpt, or URL to analyze (e.g. Check out https://example.com/docs)..."
          className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 font-mono text-xs leading-relaxed focus:outline-none focus:border-sky-500 transition-colors resize-none"
        />

        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <div>
            Characters: <span className="font-mono text-slate-300">{inputText.length}</span> / 10,000
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              disabled={!inputText}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
            <button
              onClick={() => handleAnalyze()}
              disabled={!inputText.trim()}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5 text-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Analyze
            </button>
          </div>
        </div>
      </div>

      {/* Instant Report Display */}
      {report && (
        <div className="mt-6 pt-6 border-t border-slate-800 animate-in fade-in">
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-extrabold font-mono text-slate-100">{report.overall.score}</div>
              <div>
                <div className="text-xs font-semibold text-slate-300">Composite Risk Score</div>
                <div className="text-[11px] text-slate-400">
                  {report.links.length} link{report.links.length === 1 ? '' : 's'} identified •{' '}
                  {report.messageFindings.length} message indicator{report.messageFindings.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getBandBadge(report.overall.band)}
              <button
                onClick={handleSave}
                disabled={isSaving || savedSuccess}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                {savedSuccess ? 'Saved & Synced!' : isSaving ? 'Syncing...' : 'Sync to Cloud'}
              </button>
            </div>
          </div>

          {/* Extracted Links Summary */}
          {report.links.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Extracted Links ({report.links.length})
              </div>
              <div className="grid gap-2">
                {report.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Link2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="font-mono text-slate-200 truncate">{link.displayUrl}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] text-slate-400">Score: {link.assessment.score}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {link.findings.length} findings
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Disclaimer */}
          <div className="mt-4 text-[11px] text-slate-400 italic">
            PauseLink never connects to the internet or visits analyzed links. Scores reflect deterministic heuristics.
          </div>
        </div>
      )}
    </div>
  );
}

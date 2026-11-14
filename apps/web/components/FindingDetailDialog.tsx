'use client';

import React from 'react';
import { ScanRecord, RiskBand, FindingDto } from '@pauselink/types';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Info, Smartphone, Globe, ExternalLink } from 'lucide-react';

interface FindingDetailDialogProps {
  scan: ScanRecord | null;
  onClose: () => void;
}

export function FindingDetailDialog({ scan, onClose }: FindingDetailDialogProps) {
  if (!scan) return null;

  const report = scan.report_json;

  const getBandBadge = (band: RiskBand) => {
    switch (band) {
      case 'STRONG_WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/80">
            <ShieldAlert className="w-3.5 h-3.5" />
            Strong Warning
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caution
          </span>
        );
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-800/80">
            <Info className="w-3.5 h-3.5" />
            Notice
          </span>
        );
      case 'NO_WARNING_SIGNS':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            No Warning Signs
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-sky-400">
              {scan.device_origin === 'ANDROID' ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">Threat Inspection Details</h2>
              <p className="text-xs text-slate-400">
                Origin: <span className="font-semibold text-slate-300">{scan.device_origin}</span> • Scanned on{' '}
                {new Date(scan.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assessment Card */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-extrabold font-mono text-slate-100">{scan.overall_score}</div>
            <div className="text-xs text-slate-400">
              Overall Threat Score
              <div className="text-[11px] text-slate-500">Heuristic deterministic model</div>
            </div>
          </div>
          <div>{getBandBadge(scan.risk_band)}</div>
        </div>

        {/* Input Text Section */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
            Analyzed Input Text
          </label>
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/60 font-mono text-xs text-slate-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
            {scan.input_text}
          </div>
        </div>

        {/* Notes (if any) */}
        {report.notes && report.notes.length > 0 && (
          <div className="mb-6 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Analysis Notes
            </label>
            <div className="space-y-1.5">
              {report.notes.map((note, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-700/50 flex items-center gap-2"
                >
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  {note.type === 'NoLinksFound' && 'No web links detected in the analyzed message.'}
                  {note.type === 'InputTruncated' && 'Input exceeded 10,000 characters and was safely truncated.'}
                  {note.type === 'LinksLimitReached' &&
                    `Limit of 12 links reached. Analysed ${note.analysed} of ${note.found} extracted links.`}
                  {note.type === 'QrNotALink' && `QR Code payload type: ${note.payloadType}.`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Findings (if any) */}
        {report.messageFindings && report.messageFindings.length > 0 && (
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
              Message Context Findings ({report.messageFindings.length})
            </label>
            <div className="space-y-2">
              {report.messageFindings.map((finding: FindingDto, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col gap-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-amber-400">Rule {finding.ruleId}</span>
                    <span className="text-[11px] text-slate-400 font-mono">+{finding.score} pts</span>
                  </div>
                  <div className="text-slate-300">
                    {finding.ruleId === 'M001' && 'Contains invisible or directional override characters (Unicode formatting spoofing).'}
                    {finding.ruleId === 'M002' && 'Urgent action or coercion pressure language detected.'}
                    {finding.ruleId === 'M003' && 'Excessive number of links embedded in message body.'}
                  </div>
                  {finding.evidence.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {finding.evidence.map((ev, evIdx) => (
                        <span
                          key={evIdx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-400"
                        >
                          {ev.key}: <span className="text-slate-200">{ev.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links Breakdown */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
            Extracted Links ({report.links.length})
          </label>
          {report.links.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No links extracted from text.</p>
          ) : (
            <div className="space-y-3">
              {report.links.map((link, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-sky-400 truncate max-w-[400px]">{link.displayUrl}</span>
                    {getBandBadge(link.assessment.band)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-2">
                    <div>Host: <span className="font-mono text-slate-200">{link.host || 'N/A'}</span></div>
                    <div>Score: <span className="font-mono text-slate-200">{link.assessment.score}</span></div>
                  </div>

                  {link.findings.length > 0 ? (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800/80">
                      {link.findings.map((f, fIdx) => (
                        <div key={fIdx} className="p-2 rounded bg-slate-900/80 text-[11px]">
                          <div className="flex justify-between font-mono font-semibold text-amber-300">
                            <span>{f.ruleId}</span>
                            <span>+{f.score} pts</span>
                          </div>
                          <div className="text-slate-300 mt-0.5">
                            {f.ruleId === 'U001' && 'Raw IP address host (bypasses domain name reputation)'}
                            {f.ruleId === 'U002' && 'Non-standard port number'}
                            {f.ruleId === 'U003' && 'Excessive subdomain labels (deep hierarchy)'}
                            {f.ruleId === 'U004' && 'High-risk or suspicious Top-Level Domain'}
                            {f.ruleId === 'U005' && 'Userinfo or embedded credentials in URL'}
                            {f.ruleId === 'U006' && 'Known URL shortener or redirection service'}
                            {f.ruleId === 'U007' && 'Homograph or non-ASCII characters in host'}
                            {f.ruleId === 'U008' && 'Brand impersonation / typosquatting detected'}
                            {f.ruleId === 'U009' && 'Misleading double extension in file path'}
                            {f.ruleId === 'U011' && 'Excessive path or query string length'}
                            {f.ruleId === 'U012' && 'Sensitive authentication/banking keywords on non-official domain'}
                          </div>
                          {f.evidence.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {f.evidence.map((ev, evIdx) => (
                                <span key={evIdx} className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-400">
                                  {ev.key}: {ev.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic mt-1">No risk indicators identified for this link.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Blueprint Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Notice:</span> PauseLink provides deterministic heuristic indicators and cannot confirm a link is safe or unsafe. Links are never visited, resolved, or expanded.
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Shield, Smartphone, History, Terminal, ExternalLink } from 'lucide-react';

export function Navbar() {
  return (
    <header className="border-b border-surface-elevated bg-surface/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <span>PauseLink<span className="text-blue-500">.web</span></span>
          </Link>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            CDC Live Sync
          </span>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-elevated transition"
          >
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Scanner</span>
          </Link>
          <Link
            href="/history"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-elevated transition"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">History</span>
          </Link>
          <Link
            href="/pair"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span>Pair Phone</span>
          </Link>
          <a
            href="https://github.com/AdwaitPr/Pauselink"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-400 hover:text-white transition"
            title="GitHub Repository"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Activity, Database, Sparkles, Play, Layers } from 'lucide-react';

interface SystemStatus {
  appName: string;
  jevAvailable: boolean;
  jevModel: string;
  jevStatusText: string;
  dbConnected: boolean;
}

export function Header() {
  const [status, setStatus] = useState<SystemStatus>({
    appName: 'ShadePilot',
    jevAvailable: false,
    jevModel: 'jev-latest',
    jevStatusText: 'Jev unavailable — operating in rule-based review mode.',
    dbConnected: true,
  });

  useEffect(() => {
    fetch('/api/system/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => console.error('Failed to load system status:', err));
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner group-hover:bg-blue-500 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base">{status.appName}</span>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                Ceramic QC
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Intelligent Shade Correction System</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Jev Decision Layer Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            status.jevAvailable
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-amber-950/80 text-amber-300 border-amber-800'
          }`}
          title={status.jevStatusText}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>{status.jevStatusText}</span>
        </div>

        {/* Database Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>PostgreSQL Live</span>
        </div>

        {/* Quick Launch Demo */}
        <Link
          href="/batches/new?mode=demo"
          className="btn-primary bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1.5 flex items-center gap-1.5 shadow"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Launch Demo</span>
        </Link>
      </div>
    </header>
  );
}

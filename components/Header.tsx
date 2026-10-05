'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, Activity, Database, Play, Sparkles, Loader2 } from 'lucide-react';

interface SystemStatus {
  appName: string;
  jevAvailable: boolean;
  jevModel: string;
  jevStatusText: string;
  dbConnected: boolean;
}

export function Header() {
  const router = useRouter();
  const [isLaunching, setIsLaunching] = useState(false);
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

  const handleLaunchDemo = async () => {
    if (isLaunching) return;
    setIsLaunching(true);
    try {
      const res = await fetch('/api/demo/quick-start', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || 'Failed to initialize demo scenario.');
        setIsLaunching(false);
      }
    } catch (err: any) {
      console.error('Demo launch failed:', err);
      alert('Failed to launch demo scenario. Please check console.');
      setIsLaunching(false);
    }
  };

  return (
    <header className="bg-white border-b border-[#E8E4DF] text-[#1A1A1A] px-6 lg:px-10 py-3.5 flex items-center justify-between shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-[#B8860B] text-white flex items-center justify-center shadow-sm group-hover:bg-[#D4A84B] transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-[#1A1A1A] group-hover:text-[#B8860B] transition-colors">
                {status.appName}
              </span>
              <span className="small-caps text-[9px] text-[#B8860B] bg-[#FAFAF8] border border-[#E8E4DF] px-1.5 py-0.5 rounded">
                Atelier QC
              </span>
            </div>
            <p className="text-[11px] text-[#6B6B6B] font-sans -mt-0.5">
              Intelligent Shade Correction System
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Jev Decision Layer Status Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            status.jevAvailable
              ? 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]'
              : 'bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]'
          }`}
          title={status.jevStatusText}
        >
          <Activity className="w-3.5 h-3.5 shrink-0 text-[#B8860B]" />
          <span className="text-[11px]">{status.jevStatusText}</span>
        </div>

        {/* Database Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-[#6B6B6B] bg-[#F5F3F0] border border-[#E8E4DF]">
          <Database className="w-3 h-3 text-[#B8860B]" />
          <span className="small-caps text-[10px]">PostgreSQL Live</span>
        </div>

        {/* Quick Launch Demo */}
        <button
          type="button"
          onClick={handleLaunchDemo}
          disabled={isLaunching}
          className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5 transition-all disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
          title="Instantly generate a demo batch with realistic production shade drift and candidate corrections"
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#B8860B]" />
              <span>Launching...</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Launch Demo</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

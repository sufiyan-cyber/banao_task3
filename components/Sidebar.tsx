'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Plant overview & active batches',
    },
    {
      label: 'New Batch',
      href: '/batches/new',
      icon: PlusCircle,
      desc: 'Measure or import tile sample',
    },
    {
      label: 'Batch History',
      href: '/history',
      icon: History,
      desc: 'Traceability & audit logs',
    },
  ];

  return (
    <aside className="w-64 bg-[#FAFAF8] border-r border-[#E8E4DF] text-[#1A1A1A] flex flex-col justify-between shrink-0 min-h-[calc(100vh-61px)]">
      <div className="p-5 space-y-6">
        <div className="space-y-2">
          <p className="small-caps text-[10px] text-[#A39B8E] px-3">
            Atelier Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-white border border-[#E8E4DF] border-l-4 border-l-[#B8860B] shadow-sm text-[#1A1A1A]'
                      : 'text-[#6B6B6B] hover:bg-[#F5F3F0] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#B8860B]' : 'text-[#A39B8E]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-serif text-sm font-semibold tracking-tight">
                      {item.label}
                    </div>
                    <div className="text-[11px] font-sans text-[#6B6B6B] truncate">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#B8860B]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Process Velocity Card */}
        <div className="bg-white border border-[#E8E4DF] rounded-lg p-4 space-y-3 shadow-sm border-t-2 border-t-[#B8860B]">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#B8860B]" />
            <span className="small-caps text-[10px] text-[#1A1A1A]">
              Velocity Benchmark
            </span>
          </div>
          <div className="text-xs space-y-2 font-sans">
            <div className="flex justify-between items-center text-[#6B6B6B]">
              <span>Manual Photoshop cycle:</span>
              <span className="font-serif font-bold text-[#9B2226]">~6–7 hrs</span>
            </div>
            <div className="flex justify-between items-center text-[#6B6B6B]">
              <span>ShadePilot closed-loop:</span>
              <span className="font-serif font-bold text-[#2D6A4F]">&lt; 5 mins</span>
            </div>
          </div>
          <div className="h-px bg-[#E8E4DF] my-2" />
          <div className="text-[10px] text-[#A39B8E] italic">
            *Prototype simulation; factory calibration required.
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="p-5 border-t border-[#E8E4DF] space-y-2 text-[#6B6B6B]">
        <div className="flex items-center justify-between">
          <span className="small-caps text-[10px] text-[#1A1A1A]">Architecture</span>
          <span className="small-caps text-[9px] bg-[#F5F3F0] px-1.5 py-0.5 rounded border border-[#E8E4DF]">
            v0.1.0
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#6B6B6B] font-sans">
          Measurement → Color Science → Calibration Optimizer → Jev Decision → QC Verification.
        </p>
      </div>
    </aside>
  );
}

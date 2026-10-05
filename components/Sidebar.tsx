'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileCheck,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight,
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)]">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workflows
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div>{item.label}</div>
                    <div className={`text-[11px] font-normal truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Manufacturing Shift / Time Comparison Info */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-md p-3.5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Process Velocity</span>
          </div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span>Manual Photoshop cycle:</span>
              <span className="font-semibold text-rose-400">~6–7 hrs</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>ShadePilot workflow:</span>
              <span className="font-semibold text-emerald-400">&lt; 5 mins</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2">
            *Prototype simulation; plant validation required.
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Architecture</span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">v0.1.0</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Measurement → Color Science → Calibration Optimizer → Jev Decision → QC Approval → Verification.
        </p>
      </div>
    </aside>
  );
}

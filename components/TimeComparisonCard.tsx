'use client';

import React from 'react';
import { Clock, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function TimeComparisonCard() {
  const chartData = [
    {
      name: 'Current Process',
      timeMinutes: 390, // ~6.5 hours
      label: '~6.5 Hours',
      color: '#f43f5e',
    },
    {
      name: 'ShadePilot Workflow',
      timeMinutes: 4, // ~4 minutes
      label: '~4 Minutes',
      color: '#10b981',
    },
  ];

  return (
    <div className="industrial-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" />
          <span>Before vs. After Workflow Comparison</span>
        </div>
        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
          Prototype simulation
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Left: Key Metrics */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded p-3 text-rose-950">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">
                Current Plant Workflow
              </span>
              <div className="text-2xl font-bold font-mono mt-0.5">~6–7 Hours</div>
              <ul className="text-[11px] text-rose-800 mt-2 space-y-1 list-disc list-inside">
                <li>6–7 printed test variants</li>
                <li>Trial-and-error Photoshop tweaks</li>
                <li>Repeated 70-min kiln firings</li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-950">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                ShadePilot Closed-Loop
              </span>
              <div className="text-2xl font-bold font-mono mt-0.5 text-emerald-700">
                &lt; 5 Minutes
              </div>
              <ul className="text-[11px] text-emerald-800 mt-2 space-y-1 list-disc list-inside">
                <li>Deterministic color math (ΔE00)</li>
                <li>1 targeted printer correction</li>
                <li>Jev structured risk assessment</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                Estimated changeover turnaround savings: <strong className="text-slate-900">~6.4 hours / batch</strong>
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">98% cycle reduction</span>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            *Notice: Demonstrator metrics assume synthetic calibration data and immediate simulated verification. Plant production metrics subject to spectrophotometer and kiln cycle validation.
          </p>
        </div>

        {/* Right: Chart */}
        <div className="h-44 w-full bg-slate-50 border border-slate-200 rounded p-2 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1 text-center">
            Correction Turnaround Time (Minutes)
          </span>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 420]} unit="m" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} minutes`, 'Cycle Time']}
                  contentStyle={{ fontSize: 12, backgroundColor: '#0f172a', color: '#fff', borderRadius: 4 }}
                />
                <Bar dataKey="timeMinutes" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

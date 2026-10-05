'use client';

import React from 'react';
import { Clock, TrendingUp } from 'lucide-react';
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
      color: '#C85A32', // Terracotta
    },
    {
      name: 'ShadePilot Atelier',
      timeMinutes: 4, // ~4 minutes
      label: '~4 Minutes',
      color: '#B8860B', // Burnished gold
    },
  ];

  return (
    <div className="serif-card overflow-hidden">
      <div className="industrial-header">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#B8860B]" />
          <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
            Workflow Turnaround Comparison (Manual vs. ShadePilot)
          </span>
        </div>
        <span className="small-caps text-[9px] bg-[#FAF8F5] text-[#B8860B] border border-[#B8860B]/30 px-2 py-0.5 rounded font-semibold">
          Prototype Simulation
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Left: Key Metrics with Editorial Typography */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-4 text-[#1A1A1A]">
              <span className="small-caps text-[9px] text-[#A39B8E] block">
                Current Plant Method
              </span>
              <div className="text-2xl font-serif font-bold text-[#C85A32] mt-1">~6–7 Hours</div>
              <ul className="text-xs text-[#6B6B6B] mt-2.5 space-y-1 list-disc list-inside font-sans">
                <li>6–7 trial print variants</li>
                <li>Manual Photoshop guesswork</li>
                <li>Repeated 70-min kiln firings</li>
              </ul>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-4 text-[#1A1A1A] border-t-2 border-t-[#B8860B]">
              <span className="small-caps text-[9px] text-[#B8860B] block font-semibold">
                ShadePilot Closed-Loop
              </span>
              <div className="text-2xl font-serif font-bold text-[#2D6A4F] mt-1">
                &lt; 5 Minutes
              </div>
              <ul className="text-xs text-[#6B6B6B] mt-2.5 space-y-1 list-disc list-inside font-sans">
                <li>Objective CIEDE2000 math</li>
                <li>1 calibrated printer adjustment</li>
                <li>Jev structured risk review</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E4DF] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-[#1A1A1A]">
              <TrendingUp className="w-4 h-4 text-[#B8860B]" />
              <span>
                Estimated changeover turnaround savings: <strong className="font-serif font-bold text-sm">~6.4 hours / batch</strong>
              </span>
            </div>
            <span className="small-caps text-[9px] text-[#6B6B6B]">98% cycle reduction</span>
          </div>

          <p className="text-[10px] text-[#A39B8E] leading-relaxed italic">
            *Notice: Demonstrator metrics assume synthetic calibration data and immediate simulated verification. Plant production metrics subject to spectrophotometer and kiln cycle validation.
          </p>
        </div>

        {/* Right: Recharts Bar Chart */}
        <div className="h-48 w-full bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3 flex flex-col justify-between">
          <span className="small-caps text-[9px] text-[#6B6B6B] block mb-1 text-center">
            Correction Turnaround Time (Minutes)
          </span>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 420]} unit="m" tick={{ fontSize: 10, fill: '#6B6B6B' }} stroke="#E8E4DF" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#1A1A1A', fontFamily: 'serif' }} stroke="#E8E4DF" />
                <Tooltip
                  formatter={(val: any) => [`${val} minutes`, 'Cycle Time']}
                  contentStyle={{
                    fontSize: 12,
                    backgroundColor: '#FAFAF8',
                    border: '1px solid #E8E4DF',
                    color: '#1A1A1A',
                    borderRadius: 6,
                    boxShadow: '0 4px 12px rgba(26,26,26,0.06)',
                  }}
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

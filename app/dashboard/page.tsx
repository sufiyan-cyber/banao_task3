import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CONFIG } from '@/lib/config';
import { TimeComparisonCard } from '@/components/TimeComparisonCard';
import {
  Layers,
  ArrowRight,
  PlusCircle,
  Play,
  CheckCircle2,
  ShieldCheck,
  History,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Fetch recent batches
  const batches = await prisma.batch.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      master: true,
      measurements: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      corrections: {
        where: { isRecommended: true },
        take: 1,
      },
    },
  });

  const activeBatch = batches.find(
    (b) => !['RELEASED', 'ESCALATED', 'QC_REJECTED'].includes(b.status)
  ) || batches[0];

  const totalBatches = await prisma.batch.count();
  const releasedBatches = await prisma.batch.count({ where: { status: 'RELEASED' } });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RELEASED':
        return 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]';
      case 'QC_REVIEW':
        return 'bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]';
      case 'QC_APPROVED':
        return 'bg-[#EBF3FA] text-[#1D3557] border-[#A8DADC]';
      case 'VERIFYING':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]';
      case 'ESCALATED':
        return 'bg-[#FCECEE] text-[#9B2226] border-[#F5C2C7]';
      default:
        return 'bg-[#F5F3F0] text-[#6B6B6B] border-[#E8E4DF]';
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="serif-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t-2 border-t-[#B8860B]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="small-caps text-[10px] text-[#B8860B]">
              Manufacturing Intelligence
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Ceramic Atelier Control Center
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 font-sans leading-relaxed max-w-xl">
            Closed-loop batch changeover shade correction, deterministic printer calibration, and QC approval monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/batches/new?mode=demo"
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>1-Click Demo Scenario</span>
          </Link>
          <Link
            href="/batches/new"
            className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>New Production Batch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row with Display Serif Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Batch Card */}
        <div className="serif-card p-5 border-t-2 border-t-[#B8860B]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Active Batch</span>
          <div className="text-xl font-serif font-bold text-[#1A1A1A] mt-1 truncate">
            {activeBatch ? activeBatch.batchNumber : 'No active batch'}
          </div>
          <div className="text-xs text-[#6B6B6B] mt-2 flex items-center justify-between font-sans">
            <span>SKU: {activeBatch?.sku || 'N/A'}</span>
            <span
              className={`small-caps text-[9px] px-2 py-0.5 rounded border ${getStatusBadge(
                activeBatch?.status || 'IDLE'
              )}`}
            >
              {activeBatch?.status || 'IDLE'}
            </span>
          </div>
        </div>

        {/* Current Delta E */}
        <div className="serif-card p-5 border-t-2 border-t-[#B8860B]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Target ΔE00 Limit</span>
          <div className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1 flex items-baseline gap-1.5">
            <span>
              {activeBatch?.measurements?.[0]?.deltaE00 != null
                ? Number(activeBatch.measurements[0].deltaE00).toFixed(2)
                : '—'}
            </span>
            <span className="text-xs font-sans font-normal text-[#6B6B6B]">
              / &lt;{CONFIG.colorToleranceDeltaE.toFixed(1)}
            </span>
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1 font-sans">
            Gloss Tol: ±{CONFIG.glossTolerance.toFixed(1)} GU
          </div>
        </div>

        {/* Total Batches Released */}
        <div className="serif-card p-5 border-t-2 border-t-[#2D6A4F]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Released Batches</span>
          <div className="text-2xl font-serif font-bold text-[#2D6A4F] mt-1">
            {releasedBatches} / {totalBatches}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1 flex items-center gap-1 font-sans">
            <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
            <span>Verified pass</span>
          </div>
        </div>

        {/* Safety & Loop Limit */}
        <div className="serif-card p-5 border-t-2 border-t-[#B8860B]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Correction Loops</span>
          <div className="text-2xl font-serif font-bold text-[#1A1A1A] mt-1">
            Max {CONFIG.maxCorrectionLoops} Loops
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1 flex items-center gap-1 font-sans">
            <ShieldCheck className="w-3 h-3 text-[#B8860B]" />
            <span>Escalates on loop 3</span>
          </div>
        </div>
      </div>

      {/* Before vs After Workflow Turnaround Comparison */}
      <TimeComparisonCard />

      {/* Recent Production Batches Table */}
      <div className="serif-card overflow-hidden">
        <div className="industrial-header">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#B8860B]" />
            <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
              Recent Production Changeovers
            </span>
          </div>
          <Link
            href="/history"
            className="small-caps text-[10px] text-[#B8860B] hover:text-[#D4A84B] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View Full Archive</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8E4DF] text-xs text-[#6B6B6B]">
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Batch Number</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">SKU Model</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Master</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Printer</th>
                <th className="py-3 px-4 text-center font-mono small-caps text-[10px]">Initial ΔE00</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Status</th>
                <th className="py-3 px-4 text-right font-mono small-caps text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF] text-[#1A1A1A]">
              {batches.map((batch) => {
                const latestMeas = batch.measurements[0];
                return (
                  <tr key={batch.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-serif font-bold text-[#1A1A1A]">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#1A1A1A] font-medium font-sans">
                      {batch.sku}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B] text-xs font-mono">
                      {batch.master?.version || 'V3'}
                    </td>
                    <td className="py-3.5 px-4 text-[#6B6B6B] text-xs font-mono">
                      {batch.printerId}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {latestMeas?.deltaE00 != null ? (
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            Number(latestMeas.deltaE00) <= CONFIG.colorToleranceDeltaE
                              ? 'bg-[#EBF5EE] text-[#2D6A4F]'
                              : 'bg-[#FCECEE] text-[#9B2226]'
                          }`}
                        >
                          {Number(latestMeas.deltaE00).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`small-caps text-[9px] px-2 py-0.5 rounded border ${getStatusBadge(
                          batch.status
                        )}`}
                      >
                        {batch.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {batch.status === 'RELEASED' || batch.status === 'ESCALATED' ? (
                        <Link
                          href={`/qc/${batch.id}`}
                          className="text-xs text-[#B8860B] hover:text-[#D4A84B] font-medium hover:underline inline-flex items-center gap-1 font-sans"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/analysis/${batch.id}`}
                          className="btn-primary text-xs px-3 py-1 inline-flex items-center gap-1"
                        >
                          <span>Process</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
  AlertTriangle,
  Clock,
  ShieldCheck,
  Activity,
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
  const escalatedBatches = await prisma.batch.count({ where: { status: 'ESCALATED' } });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RELEASED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'QC_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'QC_APPROVED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'VERIFYING':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ESCALATED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Ceramic Shade Control Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plant-wide batch changeover shade optimization and verification monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/batches/new?mode=demo"
            className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-blue-600 fill-current" />
            <span>1-Click Demo Scenario</span>
          </Link>
          <Link
            href="/batches/new"
            className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Production Batch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Batch Card */}
        <div className="industrial-card p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Batch</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 truncate">
            {activeBatch ? activeBatch.batchNumber : 'No active batch'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>SKU: {activeBatch?.sku || 'N/A'}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadge(
                activeBatch?.status || 'IDLE'
              )}`}
            >
              {activeBatch?.status || 'IDLE'}
            </span>
          </div>
        </div>

        {/* Current Delta E */}
        <div className="industrial-card p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Target ΔE00</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 flex items-baseline gap-1.5">
            <span>
              {activeBatch?.measurements?.[0]?.deltaE00 != null
                ? Number(activeBatch.measurements[0].deltaE00).toFixed(2)
                : '—'}
            </span>
            <span className="text-xs font-normal text-slate-500">
              / &lt;{CONFIG.colorToleranceDeltaE.toFixed(1)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Gloss Tol: ±{CONFIG.glossTolerance.toFixed(1)} GU
          </div>
        </div>

        {/* Total Batches Released */}
        <div className="industrial-card p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Released Batches</span>
          <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
            {releasedBatches} / {totalBatches}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Passed strict verification</span>
          </div>
        </div>

        {/* Safety & Loop Limit */}
        <div className="industrial-card p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Correction Limit</span>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            Max {CONFIG.maxCorrectionLoops} Loops
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            <span>Auto-escalates on loop 3</span>
          </div>
        </div>
      </div>

      {/* Before vs After Workflow Velocity Comparison Card */}
      <TimeComparisonCard />

      {/* Recent Production Batches Table */}
      <div className="industrial-card overflow-hidden">
        <div className="industrial-header">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <span>Recent Production Batches</span>
          </div>
          <Link href="/history" className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            <span>View All History</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
                <th className="py-2.5 px-4">Batch Number</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Master</th>
                <th className="py-2.5 px-4">Printer</th>
                <th className="py-2.5 px-4">Initial ΔE00</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {batches.map((batch) => {
                const latestMeas = batch.measurements[0];
                return (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{batch.sku}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {batch.master?.version || 'V3'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs font-mono">{batch.printerId}</td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {latestMeas?.deltaE00 != null ? (
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            Number(latestMeas.deltaE00) <= CONFIG.colorToleranceDeltaE
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {Number(latestMeas.deltaE00).toFixed(2)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(
                          batch.status
                        )}`}
                      >
                        {batch.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {batch.status === 'RELEASED' || batch.status === 'ESCALATED' ? (
                        <Link
                          href={`/qc/${batch.id}`}
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/analysis/${batch.id}`}
                          className="btn-primary text-xs px-2.5 py-1 inline-flex items-center gap-1"
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

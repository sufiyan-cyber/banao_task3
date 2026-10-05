'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AuditTrailModal, AuditLogItem } from '@/components/AuditTrailDrawer';
import { TimeComparisonCard } from '@/components/TimeComparisonCard';
import { CONFIG } from '@/lib/config';

export default function BatchHistoryPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Audit modal state
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [activeAuditBatch, setActiveAuditBatch] = useState<{
    batchNumber: string;
    sku: string;
    logs: AuditLogItem[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/batches')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batches) {
          setBatches(data.batches);
        }
      })
      .catch((err) => console.error('Failed to load batch history:', err))
      .finally(() => setLoading(false));
  }, []);

  const openAuditTrail = async (batch: any) => {
    try {
      const res = await fetch(`/api/batches/${batch.id}`);
      const data = await res.json();
      if (data.success && data.batch) {
        setActiveAuditBatch({
          batchNumber: data.batch.batchNumber,
          sku: data.batch.sku,
          logs: data.batch.auditLogs || [],
        });
        setAuditModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.printerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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

  const calculateDuration = (b: any) => {
    if (!b.completedAt) return 'In Progress';
    const durSec = Math.round(
      (new Date(b.completedAt).getTime() - new Date(b.createdAt).getTime()) / 1000
    );
    return `${Math.floor(durSec / 60)}m ${durSec % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Manufacturing Batch History & Traceability</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete plant audit trail: initial measurements, calibration adjustments, Jev structured decisions, and verification records.
          </p>
        </div>

        <Link href="/batches/new" className="btn-primary text-xs px-3.5 py-2">
          New Production Batch
        </Link>
      </div>

      {/* Time Velocity Comparison Chart Card */}
      <TimeComparisonCard />

      {/* Filter & Search Bar */}
      <div className="industrial-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by batch number, SKU, or printer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-blue-600"
          >
            <option value="ALL">All Batches</option>
            <option value="RELEASED">Released (Pass)</option>
            <option value="QC_REVIEW">QC Review</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Historical Batches Table */}
      <div className="industrial-card overflow-hidden">
        <div className="industrial-header">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>Production Changeover Records ({filteredBatches.length})</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Plant-wide ISO 9001 Compliance Traceability
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium">
                <th className="py-2.5 px-4">Batch ID</th>
                <th className="py-2.5 px-4">SKU Model</th>
                <th className="py-2.5 px-4">Master</th>
                <th className="py-2.5 px-4">Printer</th>
                <th className="py-2.5 px-4 text-center">Initial ΔE00</th>
                <th className="py-2.5 px-4 text-center">Final ΔE00</th>
                <th className="py-2.5 px-4 text-center">Loops</th>
                <th className="py-2.5 px-4 text-center">Correction Time</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    No production batches matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const initialMeas = b.measurements?.find((m: any) => m.type === 'PRODUCTION_INITIAL');
                  const finalMeas = b.measurements?.find((m: any) => m.type === 'VERIFICATION_SAMPLE');

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{b.sku}</td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">
                        {b.master?.version || 'V3'}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-600">{b.printerId}</td>

                      {/* Initial ΔE00 */}
                      <td className="py-3 px-4 text-center font-mono text-xs font-bold text-slate-800">
                        {initialMeas?.deltaE00 ? initialMeas.deltaE00.toFixed(2) : '—'}
                      </td>

                      {/* Final ΔE00 */}
                      <td className="py-3 px-4 text-center font-mono text-xs font-bold">
                        {finalMeas?.deltaE00 !== undefined ? (
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              finalMeas.deltaE00 <= CONFIG.colorToleranceDeltaE
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {finalMeas.deltaE00.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Loops */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-700">
                        {b.currentLoop} / {b.maxLoops}
                      </td>

                      {/* Turnaround Time */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">
                        {calculateDuration(b)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openAuditTrail(b)}
                          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 shadow-none"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>Audit Trail</span>
                        </button>
                        <Link
                          href={`/qc/${b.id}`}
                          className="text-slate-500 hover:text-slate-800 inline-block p-1"
                          title="Open Batch Portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      {activeAuditBatch && (
        <AuditTrailModal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          batchNumber={activeAuditBatch.batchNumber}
          sku={activeAuditBatch.sku}
          logs={activeAuditBatch.logs}
        />
      )}
    </div>
  );
}

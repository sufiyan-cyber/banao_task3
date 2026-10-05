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
        return 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]';
      case 'QC_REVIEW':
        return 'bg-[#FEF9E7] text-[#946C00] border-[#F7E1A0]';
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

  const calculateDuration = (b: any) => {
    if (!b.completedAt) return 'In Progress';
    const durSec = Math.round(
      (new Date(b.completedAt).getTime() - new Date(b.createdAt).getTime()) / 1000
    );
    return `${Math.floor(durSec / 60)}m ${durSec % 60}s`;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header Bar */}
      <div className="serif-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t-2 border-t-[#B8860B]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="small-caps text-[10px] text-[#B8860B]">
              Manufacturing Intelligence &amp; Traceability
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Production Batch Archive
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 font-sans leading-relaxed max-w-xl">
            Complete plant audit trail: initial spectrophotometer measurements, calibration adjustments, Jev structured decisions, and verification records.
          </p>
        </div>

        <Link href="/batches/new" className="btn-primary text-xs px-4 py-2.5 shrink-0 shadow-sm">
          New Production Batch
        </Link>
      </div>

      {/* Time Velocity Comparison Chart Card */}
      <TimeComparisonCard />

      {/* Filter & Search Bar */}
      <div className="serif-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A39B8E] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by batch number, SKU, or printer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-[#E8E4DF] rounded bg-[#FAFAF8] text-[#1A1A1A] placeholder:text-[#A39B8E] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-sans"
          />
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#B8860B]" />
          <span className="small-caps text-[10px] text-[#6B6B6B]">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-[#E8E4DF] rounded px-3 py-1.5 bg-[#FAFAF8] text-[#1A1A1A] focus:outline-none focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] font-sans"
          >
            <option value="ALL">All Batches</option>
            <option value="RELEASED">Released (Pass)</option>
            <option value="QC_REVIEW">QC Review</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>
      </div>

      {/* Historical Batches Table */}
      <div className="serif-card overflow-hidden">
        <div className="industrial-header">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#B8860B]" />
            <span className="font-serif font-semibold text-sm text-[#1A1A1A]">
              Production Changeover Records ({filteredBatches.length})
            </span>
          </div>
          <span className="small-caps text-[10px] text-[#A39B8E]">
            Plant-wide ISO 9001 Compliance Traceability
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E8E4DF] text-xs text-[#6B6B6B]">
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Batch ID</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">SKU Model</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Master</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Printer</th>
                <th className="py-3 px-4 text-center font-mono small-caps text-[10px]">Initial ΔE00</th>
                <th className="py-3 px-4 text-center font-mono small-caps text-[10px]">Final ΔE00</th>
                <th className="py-3 px-4 text-center font-mono small-caps text-[10px]">Loops</th>
                <th className="py-3 px-4 text-center font-mono small-caps text-[10px]">Cycle Time</th>
                <th className="py-3 px-4 font-mono small-caps text-[10px]">Status</th>
                <th className="py-3 px-4 text-right font-mono small-caps text-[10px]">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DF] text-[#1A1A1A]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#6B6B6B] text-xs font-sans">
                    Loading production records...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#6B6B6B] text-xs font-sans">
                    No production batches matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const initialMeas = b.measurements?.find((m: any) => m.type === 'PRODUCTION_INITIAL');
                  const finalMeas = b.measurements?.find((m: any) => m.type === 'VERIFICATION_SAMPLE');

                  return (
                    <tr key={b.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 font-serif font-bold text-[#1A1A1A]">
                        {b.batchNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium font-sans text-[#1A1A1A]">{b.sku}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#6B6B6B]">
                        {b.master?.version || 'V3'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-[#6B6B6B]">{b.printerId}</td>

                      {/* Initial ΔE00 */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-[#1A1A1A]">
                        {initialMeas?.deltaE00 ? Number(initialMeas.deltaE00).toFixed(2) : '—'}
                      </td>

                      {/* Final ΔE00 */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {finalMeas?.deltaE00 !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              finalMeas.deltaE00 <= CONFIG.colorToleranceDeltaE
                                ? 'bg-[#EBF5EE] text-[#2D6A4F]'
                                : 'bg-[#FCECEE] text-[#9B2226]'
                            }`}
                          >
                            {Number(finalMeas.deltaE00).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[#A39B8E]">—</span>
                        )}
                      </td>

                      {/* Loops */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-[#6B6B6B]">
                        {b.currentLoop} / {b.maxLoops}
                      </td>

                      {/* Turnaround Time */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-[#6B6B6B]">
                        {calculateDuration(b)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`small-caps text-[9px] px-2 py-0.5 rounded border ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openAuditTrail(b)}
                          className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5 shadow-none hover:border-[#B8860B]"
                        >
                          <FileText className="w-3 h-3 text-[#B8860B]" />
                          <span>Audit Trail</span>
                        </button>
                        <Link
                          href={`/qc/${b.id}`}
                          className="text-[#A39B8E] hover:text-[#1A1A1A] inline-block p-1 transition-colors"
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

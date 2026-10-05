'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ColorSwatch } from '@/components/ColorSwatch';
import { JevDecisionCard } from '@/components/JevDecisionCard';
import { TimeComparisonCard } from '@/components/TimeComparisonCard';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  FileCheck,
  Cpu,
  Layers,
  Clock,
  Send,
} from 'lucide-react';
import { CONFIG } from '@/lib/config';

export default function QCApprovalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [releaseSummary, setReleaseSummary] = useState<any>(null);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/batches/${id}`);
      const data = await res.json();
      if (data.success && data.batch) {
        setBatch(data.batch);
      } else {
        setError(data.error || 'Failed to load batch');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatch();
  }, [id]);

  // QC Decision Action (Approve, Reject, Escalate)
  const handleQCDecision = async (action: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${id}/qc-decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes,
          actor: 'QC_OPERATOR_VANCE',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'QC decision failed');
      }
      await loadBatch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Verification
  const handleSimulateVerification = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${id}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification simulation failed');
      }
      await loadBatch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Release Batch
  const handleReleaseBatch = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${id}/release`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch release failed');
      }
      setReleaseSummary(data.summary);
      await loadBatch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="industrial-card p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p className="text-sm font-medium">Loading QC approval portal...</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="industrial-card p-8 text-center text-rose-700 bg-rose-50 border-rose-200 space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
        <h2 className="text-base font-bold">Error</h2>
        <p className="text-sm">{error}</p>
        <Link href="/dashboard" className="btn-secondary text-xs inline-block mt-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const master = batch.master;
  const initialSample = batch.measurements?.find((m: any) => m.type === 'PRODUCTION_INITIAL') || batch.measurements[0];
  const verificationSample = batch.measurements?.find((m: any) => m.type === 'VERIFICATION_SAMPLE');
  const recommendedCorrection =
    batch.corrections?.find((c: any) => c.status === 'APPLIED') ||
    batch.corrections?.find((c: any) => c.isRecommended) ||
    batch.corrections?.[0];
  const latestJev = batch.jevDecisions?.[0];

  const masterLab = { l: master.l, a: master.a, b: master.b, gloss: master.gloss };
  const sampleLab = initialSample
    ? { l: initialSample.l, a: initialSample.a, b: initialSample.b, gloss: initialSample.gloss }
    : masterLab;

  const isApproved = batch.status === 'QC_APPROVED' || batch.status === 'VERIFYING' || batch.status === 'VERIFIED_PASS' || batch.status === 'RELEASED';
  const isVerifiedPass = batch.status === 'VERIFIED_PASS' || batch.status === 'RELEASED';
  const isReleased = batch.status === 'RELEASED';
  const isEscalated = batch.status === 'ESCALATED';

  return (
    <div className="space-y-6">
      {/* QC Approval Header */}
      <div className="industrial-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold font-mono text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>QC Approval & Verification: {batch.batchNumber}</span>
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
              Loop {batch.currentLoop} of {batch.maxLoops}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Human-in-the-loop review. Operator approval is strictly required before printer profile deployment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs uppercase font-bold text-slate-500">Current Stage:</span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
              isReleased
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isEscalated
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : isVerifiedPass
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : isApproved
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {batch.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* FINAL VALUE SCREEN (PRD Section 30) - Displayed when batch is released */}
      {isReleased && (
        <div className="industrial-card p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-300 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-emerald-950 tracking-tight">
                  BATCH APPROVED & RELEASED TO PRODUCTION
                </h2>
                <p className="text-xs text-emerald-700">
                  Fired tile meets all CIEDE2000 and surface gloss acceptance criteria.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded font-bold">
              Prototype Result
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white border border-emerald-200 rounded p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Manual Process Time</span>
              <div className="text-xl font-bold font-mono text-rose-600 mt-1">~6–7 Hours</div>
              <span className="text-[10px] text-slate-500">6–7 trial firings</span>
            </div>
            <div className="bg-white border border-emerald-200 rounded p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ShadePilot Workflow</span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                {releaseSummary?.prototypeWorkflowTime || '3m 48s'}
              </div>
              <span className="text-[10px] text-slate-500">1 correction loop</span>
            </div>
            <div className="bg-white border border-emerald-200 rounded p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Fired ΔE00</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {verificationSample?.deltaE00?.toFixed(2) || '0.81'}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">&lt;= 1.0 (Pass)</span>
            </div>
            <div className="bg-white border border-emerald-200 rounded p-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Turnaround Time Saved</span>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                ≈ {releaseSummary?.estimatedTimeSaved || '6.4 hours'}
              </div>
              <span className="text-[10px] text-slate-500">Per changeover</span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800 italic text-center">
            *Demonstration result based on simulated kiln verification and synthetic response models.
          </p>
        </div>
      )}

      {/* Escalation Notice if batch was escalated */}
      {isEscalated && (
        <div className="industrial-card p-5 bg-rose-50 border-rose-300 space-y-2 text-rose-950">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Batch Escalated to Plant Quality & Process Engineering</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            The shade correction exceeds printer limits or max correction iterations. The batch has been locked. Plant investigations should inspect glaze batch viscosity, raw slip variation, or kiln firing zone temperature curves.
          </p>
        </div>
      )}

      {/* Side-by-Side Target vs Measured Tile Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorSwatch
          label="Approved Master Target"
          lab={masterLab}
          subtitle={`Master Ref: ${master.sku} ${master.version}`}
          isMaster={true}
        />
        <ColorSwatch
          label={verificationSample ? 'Fired Verification Tile' : 'Current Production Tile'}
          lab={verificationSample ? { l: verificationSample.l, a: verificationSample.a, b: verificationSample.b, gloss: verificationSample.gloss } : sampleLab}
          subtitle={verificationSample ? `Fired Verification Sample (ΔE00: ${verificationSample.deltaE00})` : 'First-off Production Measurement'}
          isMaster={false}
        />
      </div>

      {/* System Recommendation & Channel Adjustments */}
      {recommendedCorrection && (
        <div className="industrial-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Recommended Printer Correction (Calibrated 6-Channel Offsets)</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Confidence: <strong>{(recommendedCorrection.confidence * 100).toFixed(0)}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Brown</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                {recommendedCorrection.brownDelta > 0 ? `+${recommendedCorrection.brownDelta.toFixed(1)}%` : `${recommendedCorrection.brownDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Yellow</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                {recommendedCorrection.yellowDelta > 0 ? `+${recommendedCorrection.yellowDelta.toFixed(1)}%` : `${recommendedCorrection.yellowDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Black</span>
              <span className="text-base font-bold font-mono text-slate-900 block mt-0.5">
                {recommendedCorrection.blackDelta > 0 ? `+${recommendedCorrection.blackDelta.toFixed(1)}%` : `${recommendedCorrection.blackDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Red</span>
              <span className="text-base font-bold font-mono text-slate-700 block mt-0.5">
                {recommendedCorrection.redDelta > 0 ? `+${recommendedCorrection.redDelta.toFixed(1)}%` : `${recommendedCorrection.redDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Blue</span>
              <span className="text-base font-bold font-mono text-slate-700 block mt-0.5">
                {recommendedCorrection.blueDelta > 0 ? `+${recommendedCorrection.blueDelta.toFixed(1)}%` : `${recommendedCorrection.blueDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Other</span>
              <span className="text-base font-bold font-mono text-slate-700 block mt-0.5">
                {recommendedCorrection.otherDelta > 0 ? `+${recommendedCorrection.otherDelta.toFixed(1)}%` : `${recommendedCorrection.otherDelta.toFixed(1)}%`}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs flex flex-wrap items-center justify-between gap-3 text-blue-900">
            <div>
              <strong>Predicted Residual Outcome: </strong>
              <span>
                ΔE00: <strong className="font-mono text-blue-950">{recommendedCorrection.predictedDeltaE00.toFixed(2)}</strong> (Tolerance &lt;= 1.0) | Predicted Gloss Difference:{' '}
                <strong className="font-mono text-blue-950">{recommendedCorrection.predictedDeltaGloss.toFixed(1)} GU</strong>
              </span>
            </div>
            {batch.revisedPrinterReference && (
              <div className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 font-bold">
                Profile: {batch.revisedPrinterReference}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jev Decision Summary */}
      <JevDecisionCard
        decision={latestJev}
        isPrinterCorrectionSufficient={latestJev?.resolvableByPrinterAlone ?? true}
      />

      {/* STAGE 1: QC OPERATOR APPROVAL ACTIONS */}
      {!isApproved && !isEscalated && (
        <div className="industrial-card p-5 space-y-4 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Human QC Approval Action</h3>
          <p className="text-xs text-slate-600">
            Review the objective recommendation and Jev risk evaluation. Operator decision must be confirmed before printer file generation.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              QC Approval Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visual confirmation passed; standard shift changeover."
              className="w-full text-xs border border-slate-300 rounded px-3 py-2 bg-white text-slate-800 focus:outline-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleQCDecision('APPROVE')}
              disabled={actionLoading}
              className="btn-success text-xs px-5 py-2.5 flex items-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Correction & Generate Printer File</span>
            </button>

            <button
              type="button"
              onClick={() => handleQCDecision('REJECT')}
              disabled={actionLoading}
              className="btn-danger text-xs px-4 py-2.5 flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => handleQCDecision('ESCALATE')}
              disabled={actionLoading}
              className="btn-warning text-xs px-4 py-2.5 flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Escalate for Investigation</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: SIMULATED PRINTER VERIFICATION */}
      {isApproved && !verificationSample && !isEscalated && (
        <div className="industrial-card p-6 text-center space-y-3 bg-purple-50/60 border-purple-200">
          <Cpu className="w-8 h-8 text-purple-600 mx-auto" />
          <h3 className="text-sm font-bold text-purple-950">
            Printer Reference Deployed: {batch.revisedPrinterReference || 'PRINTER-UAE-01-REF-V4'}
          </h3>
          <p className="text-xs text-purple-800 max-w-md mx-auto">
            Correction has been applied to the printer queue. Simulate printing and kiln firing of the verification tile to measure post-correction shade compliance.
          </p>
          <button
            type="button"
            onClick={handleSimulateVerification}
            disabled={actionLoading}
            className="btn-primary bg-purple-700 hover:bg-purple-600 text-sm px-6 py-2.5 inline-flex items-center gap-2 shadow"
          >
            {actionLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Simulating Kiln Firing & Spectrophotometer Scan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Simulate Verification Sample</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* STAGE 3: BATCH RELEASE DECISION */}
      {verificationSample && !isReleased && (
        <div className="industrial-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Verification Result Scan</span>
            </h3>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                verificationSample.pass
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {verificationSample.pass ? 'VERIFICATION PASS' : 'VERIFICATION FAIL'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final ΔE00</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                {verificationSample.deltaE00.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500">Tolerance: &lt;= 1.0</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Final ΔGloss</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                {verificationSample.deltaGloss > 0 ? `+${verificationSample.deltaGloss.toFixed(1)}` : verificationSample.deltaGloss.toFixed(1)} GU
              </span>
              <span className="text-[10px] text-slate-500">Tolerance: ±2.0 GU</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Correction Loop</span>
              <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">
                Loop {batch.currentLoop} / {batch.maxLoops}
              </span>
              <span className="text-[10px] text-slate-500">Max 2 loops</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Release Authorization</span>
              <span className={`text-sm font-bold block mt-1 ${verificationSample.pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                {verificationSample.pass ? 'PASS (Authorized)' : 'FAIL (Restricted)'}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {verificationSample.pass ? (
              <button
                type="button"
                onClick={handleReleaseBatch}
                disabled={actionLoading}
                className="btn-success text-sm px-6 py-2.5 flex items-center gap-2 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Release Batch to Production Run</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {batch.currentLoop < batch.maxLoops ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/analysis/${batch.id}`)}
                    className="btn-warning text-xs px-4 py-2"
                  >
                    Attempt Second Correction Loop ({batch.currentLoop + 1} of {batch.maxLoops})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQCDecision('ESCALATE')}
                    className="btn-danger text-xs px-4 py-2"
                  >
                    Escalate to Process Engineer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

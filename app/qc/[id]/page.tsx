'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ColorSwatch } from '@/components/ColorSwatch';
import { JevDecisionCard } from '@/components/JevDecisionCard';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  RefreshCw,
  Sliders,
  Sparkles,
  FileCheck,
  Cpu,
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
      <div className="serif-card p-12 text-center text-[#6B6B6B] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#B8860B]" />
        <p className="font-serif italic text-sm">Loading atelier QC approval portal...</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="serif-card p-8 text-center text-[#9B2226] bg-[#FCECEE] border-[#F5C2C7] space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-[#9B2226]" />
        <h2 className="font-serif font-bold text-base">Error</h2>
        <p className="text-sm font-sans">{error}</p>
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
    <div className="space-y-8">
      {/* QC Approval Header */}
      <div className="serif-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-t-[#B8860B]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#B8860B]" />
              <span>QC Approval & Verification: {batch.batchNumber}</span>
            </h1>
            <span className="small-caps text-[10px] bg-[#FAF8F5] text-[#6B6B6B] px-2 py-0.5 rounded border border-[#E8E4DF]">
              Loop {batch.currentLoop} of {batch.maxLoops}
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1 font-sans">
            Human-in-the-loop review. Operator approval is strictly required before printer profile deployment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="small-caps text-[10px] text-[#A39B8E]">Current Stage:</span>
          <span
            className={`small-caps text-[10px] px-2.5 py-1 rounded border ${
              isReleased
                ? 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]'
                : isEscalated
                ? 'bg-[#FCECEE] text-[#9B2226] border-[#F5C2C7]'
                : isVerifiedPass
                ? 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]'
                : isApproved
                ? 'bg-[#EBF3FA] text-[#1D3557] border-[#A8DADC]'
                : 'bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]'
            }`}
          >
            {batch.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#FCECEE] border border-[#F5C2C7] rounded-md text-xs text-[#9B2226] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#9B2226]" />
          <span>{error}</span>
        </div>
      )}

      {/* FINAL VALUE SCREEN (PRD Section 30) - Displayed when batch is released */}
      {isReleased && (
        <div className="serif-card p-8 bg-[#FAF8F5] border-2 border-[#B8860B] space-y-6 shadow-md relative overflow-hidden">
          {/* Subtle decorative gold line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B8860B] via-[#D4A84B] to-[#B8860B]" />

          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2D6A4F]" />
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1A1A1A] tracking-tight">
                  BATCH APPROVED & RELEASED TO PRODUCTION
                </h2>
                <p className="text-xs text-[#6B6B6B] font-sans mt-0.5">
                  Fired ceramic tile conforms to all CIEDE2000 and specular gloss master tolerances.
                </p>
              </div>
            </div>
            <span className="small-caps text-[10px] bg-white text-[#B8860B] border border-[#B8860B]/40 px-3 py-1 rounded font-bold shadow-sm">
              Prototype Verification Complete
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white border border-[#E8E4DF] rounded-md p-4 shadow-sm">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Manual Process Time</span>
              <div className="text-2xl font-serif font-bold text-[#C85A32] mt-1">~6–7 Hours</div>
              <span className="text-[10px] text-[#6B6B6B] font-sans">6–7 trial firings</span>
            </div>
            <div className="bg-white border border-[#E8E4DF] rounded-md p-4 shadow-sm border-t-2 border-t-[#B8860B]">
              <span className="small-caps text-[9px] text-[#B8860B] block font-semibold">ShadePilot Workflow</span>
              <div className="text-2xl font-serif font-bold text-[#2D6A4F] mt-1">
                {releaseSummary?.prototypeWorkflowTime || '3m 48s'}
              </div>
              <span className="text-[10px] text-[#6B6B6B] font-sans">1 correction loop</span>
            </div>
            <div className="bg-white border border-[#E8E4DF] rounded-md p-4 shadow-sm">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Final Fired ΔE00</span>
              <div className="text-2xl font-serif font-bold text-[#2D6A4F] mt-1">
                {verificationSample?.deltaE00?.toFixed(2) || '0.81'}
              </div>
              <span className="text-[10px] text-[#2D6A4F] font-sans font-medium">&lt;= 1.0 (Pass)</span>
            </div>
            <div className="bg-white border border-[#E8E4DF] rounded-md p-4 shadow-sm">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Turnaround Time Saved</span>
              <div className="text-2xl font-serif font-bold text-[#B8860B] mt-1">
                ≈ {releaseSummary?.estimatedTimeSaved || '6.4 hours'}
              </div>
              <span className="text-[10px] text-[#6B6B6B] font-sans">Per changeover</span>
            </div>
          </div>

          <p className="text-xs text-[#6B6B6B] italic text-center font-serif">
            *Demonstration result based on simulated kiln verification and synthetic response models.
          </p>
        </div>
      )}

      {/* Escalation Notice */}
      {isEscalated && (
        <div className="serif-card p-6 bg-[#FCECEE] border-[#F5C2C7] space-y-2 text-[#9B2226]">
          <div className="flex items-center gap-2.5 font-serif font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-[#9B2226]" />
            <span>Batch Escalated to Plant Quality & Process Engineering</span>
          </div>
          <p className="text-xs text-[#9B2226] leading-relaxed font-sans">
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
        <div className="serif-card p-6 space-y-5 border-t-2 border-t-[#B8860B]">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[#B8860B]" />
              <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                Recommended Printer Correction (Calibrated 6-Channel Offsets)
              </h2>
            </div>
            <span className="small-caps text-[10px] text-[#6B6B6B]">
              Confidence: <strong className="text-[#1A1A1A]">{(recommendedCorrection.confidence * 100).toFixed(0)}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Brown</span>
              <span className="text-lg font-serif font-bold text-[#1A1A1A] block mt-1">
                {recommendedCorrection.brownDelta > 0 ? `+${recommendedCorrection.brownDelta.toFixed(1)}%` : `${recommendedCorrection.brownDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Yellow</span>
              <span className="text-lg font-serif font-bold text-[#1A1A1A] block mt-1">
                {recommendedCorrection.yellowDelta > 0 ? `+${recommendedCorrection.yellowDelta.toFixed(1)}%` : `${recommendedCorrection.yellowDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Black</span>
              <span className="text-lg font-serif font-bold text-[#1A1A1A] block mt-1">
                {recommendedCorrection.blackDelta > 0 ? `+${recommendedCorrection.blackDelta.toFixed(1)}%` : `${recommendedCorrection.blackDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Red</span>
              <span className="text-lg font-serif font-bold text-[#6B6B6B] block mt-1">
                {recommendedCorrection.redDelta > 0 ? `+${recommendedCorrection.redDelta.toFixed(1)}%` : `${recommendedCorrection.redDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Blue</span>
              <span className="text-lg font-serif font-bold text-[#6B6B6B] block mt-1">
                {recommendedCorrection.blueDelta > 0 ? `+${recommendedCorrection.blueDelta.toFixed(1)}%` : `${recommendedCorrection.blueDelta.toFixed(1)}%`}
              </span>
            </div>
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Other</span>
              <span className="text-lg font-serif font-bold text-[#6B6B6B] block mt-1">
                {recommendedCorrection.otherDelta > 0 ? `+${recommendedCorrection.otherDelta.toFixed(1)}%` : `${recommendedCorrection.otherDelta.toFixed(1)}%`}
              </span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3.5 text-xs flex flex-wrap items-center justify-between gap-3 text-[#1A1A1A] font-sans">
            <div>
              <strong className="font-serif">Predicted Outcome: </strong>
              <span>
                ΔE00: <strong className="font-serif font-bold">{recommendedCorrection.predictedDeltaE00.toFixed(2)}</strong> (Tolerance &lt;= 1.0) | Gloss Difference:{' '}
                <strong className="font-serif font-bold">{recommendedCorrection.predictedDeltaGloss.toFixed(1)} GU</strong>
              </span>
            </div>
            {batch.revisedPrinterReference && (
              <div className="font-mono bg-white px-2.5 py-1 rounded border border-[#E8E4DF] text-[#B8860B] font-bold text-xs">
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
        <div className="serif-card p-6 space-y-4 bg-[#FAF8F5]">
          <h3 className="font-serif font-bold text-base text-[#1A1A1A]">Human QC Approval Action</h3>
          <p className="text-xs text-[#6B6B6B] font-sans">
            Review the objective recommendation and Jev risk evaluation. Operator decision must be confirmed before printer file generation.
          </p>

          <div>
            <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1.5">
              QC Approval Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Visual confirmation passed; standard shift changeover."
              className="w-full text-xs border border-[#E8E4DF] rounded-md px-3.5 py-2.5 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleQCDecision('APPROVE')}
              disabled={actionLoading}
              className="btn-success text-xs px-5 py-2.5 flex items-center gap-2 shadow-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Correction & Generate Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleQCDecision('REJECT')}
              disabled={actionLoading}
              className="btn-danger text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              type="button"
              onClick={() => handleQCDecision('ESCALATE')}
              disabled={actionLoading}
              className="btn-warning text-xs px-4 py-2.5 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Escalate for Investigation</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: SIMULATED PRINTER VERIFICATION */}
      {isApproved && !verificationSample && !isEscalated && (
        <div className="serif-card p-8 text-center space-y-3 bg-[#FAF8F5] border-t-2 border-t-[#B8860B]">
          <Cpu className="w-8 h-8 text-[#B8860B] mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
            Printer Reference Deployed: {batch.revisedPrinterReference || 'PRINTER-UAE-01-REF-V4'}
          </h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto font-sans leading-relaxed">
            Correction applied to printer profile queue. Simulate printing and kiln firing of the verification tile to measure post-correction shade compliance.
          </p>
          <button
            type="button"
            onClick={handleSimulateVerification}
            disabled={actionLoading}
            className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 shadow-sm font-semibold mt-2"
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
        <div className="serif-card p-6 space-y-5 border-t-2 border-t-[#2D6A4F]">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
            <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#2D6A4F]" />
              <span>Verification Result Scan</span>
            </h3>
            <span
              className={`small-caps text-[10px] px-2.5 py-0.5 rounded border ${
                verificationSample.pass
                  ? 'bg-[#EBF5EE] text-[#2D6A4F] border-[#B7E4C7]'
                  : 'bg-[#FCECEE] text-[#9B2226] border-[#F5C2C7]'
              }`}
            >
              {verificationSample.pass ? 'VERIFICATION PASS' : 'VERIFICATION FAIL'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-center">
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Final ΔE00</span>
              <span className="text-xl font-serif font-bold text-[#1A1A1A] block mt-0.5">
                {verificationSample.deltaE00.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-sans">Tolerance: &lt;= 1.0</span>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Final ΔGloss</span>
              <span className="text-xl font-serif font-bold text-[#1A1A1A] block mt-0.5">
                {verificationSample.deltaGloss > 0 ? `+${verificationSample.deltaGloss.toFixed(1)}` : verificationSample.deltaGloss.toFixed(1)} GU
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-sans">Tolerance: ±2.0 GU</span>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Correction Loop</span>
              <span className="text-xl font-serif font-bold text-[#1A1A1A] block mt-0.5">
                Loop {batch.currentLoop} / {batch.maxLoops}
              </span>
              <span className="text-[10px] text-[#6B6B6B] font-sans">Max 2 loops</span>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-3">
              <span className="small-caps text-[9px] text-[#A39B8E] block">Release Authorization</span>
              <span className={`text-sm font-serif font-bold block mt-1 ${verificationSample.pass ? 'text-[#2D6A4F]' : 'text-[#9B2226]'}`}>
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
                className="btn-success text-xs px-6 py-2.5 flex items-center gap-2 shadow-sm font-semibold"
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

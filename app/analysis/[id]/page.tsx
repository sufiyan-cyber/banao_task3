'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ColorSwatch } from '@/components/ColorSwatch';
import { DirectionalDiagnosisCard } from '@/components/DirectionalDiagnosisCard';
import { CandidateCorrectionsTable, DisplayCorrection } from '@/components/CandidateCorrectionsTable';
import { JevDecisionCard } from '@/components/JevDecisionCard';
import { calculateColorDifference, getDirectionalDiagnosis } from '@/lib/color/deltaE';
import {
  Layers,
  ArrowRight,
  Sliders,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  History,
} from 'lucide-react';
import { CONFIG } from '@/lib/config';

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DisplayCorrection | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load batch data
  const loadBatch = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/batches/${id}`);
      const data = await res.json();
      if (data.success && data.batch) {
        setBatch(data.batch);
        // If corrections already generated, select recommended
        if (data.batch.corrections?.length > 0) {
          const rec =
            data.batch.corrections.find((c: any) => c.isRecommended) || data.batch.corrections[0];
          setSelectedCandidate(rec);
        }
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

  // Trigger Optimization Engine & Jev Decision
  const handleGenerateCorrection = async () => {
    setOptimizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/batches/${id}/optimize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Correction optimization failed');
      }
      await loadBatch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="industrial-card p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p className="text-sm font-medium">Loading batch analysis data from database...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="industrial-card p-8 text-center text-rose-700 bg-rose-50 border-rose-200 space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-rose-600" />
        <h2 className="text-base font-bold">Analysis Error</h2>
        <p className="text-sm">{error || 'Batch not found'}</p>
        <Link href="/dashboard" className="btn-secondary text-xs inline-block mt-2">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const master = batch.master;
  const sample = batch.measurements?.find((m: any) => m.type === 'PRODUCTION_INITIAL') || batch.measurements[0];

  const masterLab = { l: master.l, a: master.a, b: master.b, gloss: master.gloss };
  const sampleLab = sample ? { l: sample.l, a: sample.a, b: sample.b, gloss: sample.gloss } : masterLab;

  const metrics = calculateColorDifference(masterLab, sampleLab, master.deltaETolerance, master.glossTolerance);
  const diagnosis = getDirectionalDiagnosis(metrics);

  const hasCorrections = batch.corrections && batch.corrections.length > 0;
  const latestJev = batch.jevDecisions && batch.jevDecisions.length > 0 ? batch.jevDecisions[0] : null;

  return (
    <div className="space-y-6">
      {/* Batch Header Bar */}
      <div className="industrial-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold font-mono text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>{batch.batchNumber}</span>
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
              SKU: {batch.sku}
            </span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
              {batch.printerId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master Reference Version: <strong className="text-slate-800">{master.version}</strong> (Approved by {master.approvedBy || 'Lead QC'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold text-slate-500">Status:</span>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-blue-50 text-blue-800 border-blue-200">
            {batch.status.replace(/_/g, ' ')}
          </span>
          {hasCorrections && (
            <Link
              href={`/qc/${batch.id}`}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow"
            >
              <span>Proceed to QC Approval</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Visual Color Swatches Comparison (Master vs Sample) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorSwatch
          label="Approved Master Target"
          lab={masterLab}
          subtitle={`Master Ref: ${master.sku} ${master.version} (ΔE00 Tolerance: <= ${master.deltaETolerance.toFixed(1)})`}
          isMaster={true}
        />
        <ColorSwatch
          label="Current Production Tile Sample"
          lab={sampleLab}
          subtitle={`Spectrophotometer Lab Measurement (Iteration ${batch.currentLoop})`}
          isMaster={false}
        />
      </div>

      {/* Objective Difference Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="industrial-card p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">ΔE00 (CIEDE2000)</span>
          <div className="text-xl font-bold font-mono mt-0.5 text-slate-900">
            <span
              className={`px-2 py-0.5 rounded ${
                metrics.isColorInTolerance
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {metrics.deltaE00.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Limit: &lt;= {master.deltaETolerance.toFixed(1)}
          </span>
        </div>

        <div className="industrial-card p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">ΔGloss</span>
          <div className="text-xl font-bold font-mono mt-0.5 text-slate-900">
            <span
              className={`px-2 py-0.5 rounded ${
                metrics.isGlossInTolerance
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {metrics.deltaGloss > 0 ? `+${metrics.deltaGloss.toFixed(1)}` : metrics.deltaGloss.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Limit: ±{master.glossTolerance.toFixed(1)} GU
          </span>
        </div>

        <div className="industrial-card p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">ΔL* (Lightness)</span>
          <div className="text-base font-bold font-mono mt-1 text-slate-800">
            {metrics.deltaL > 0 ? `+${metrics.deltaL.toFixed(1)}` : metrics.deltaL.toFixed(1)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{diagnosis.lightnessSummary}</span>
        </div>

        <div className="industrial-card p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Δa* (Red/Green)</span>
          <div className="text-base font-bold font-mono mt-1 text-slate-800">
            {metrics.deltaA > 0 ? `+${metrics.deltaA.toFixed(1)}` : metrics.deltaA.toFixed(1)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{diagnosis.aSummary}</span>
        </div>

        <div className="industrial-card p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Δb* (Yellow/Blue)</span>
          <div className="text-base font-bold font-mono mt-1 text-slate-800">
            {metrics.deltaB > 0 ? `+${metrics.deltaB.toFixed(1)}` : metrics.deltaB.toFixed(1)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">{diagnosis.bSummary}</span>
        </div>
      </div>

      {/* Directional Diagnosis Card */}
      <DirectionalDiagnosisCard diagnosis={diagnosis} metrics={metrics} />

      {/* Correction Generation Action Trigger */}
      {!hasCorrections ? (
        <div className="industrial-card p-6 text-center space-y-3 bg-slate-50 border-dashed border-2 border-slate-300">
          <Sliders className="w-8 h-8 text-blue-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">
            Ready to Generate Bounded Printer Corrections
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The calibration response model will calculate 6-channel adjustments (Brown, Yellow, Black, Red, Blue, Other) to converge the tile shade toward master reference within ±5% bounds.
          </p>
          <button
            type="button"
            onClick={handleGenerateCorrection}
            disabled={optimizing}
            className="btn-primary text-sm px-6 py-2.5 inline-flex items-center gap-2 shadow"
          >
            {optimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Calibration & Jev Evaluation...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Correction Candidates</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Candidates Table & Jev Decision Card */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Optimized Correction Candidates</span>
            </h2>
            <button
              type="button"
              onClick={handleGenerateCorrection}
              disabled={optimizing}
              className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${optimizing ? 'animate-spin' : ''}`} />
              <span>Re-optimize</span>
            </button>
          </div>

          <CandidateCorrectionsTable
            candidates={batch.corrections}
            selectedId={selectedCandidate?.id}
            onSelect={(c) => setSelectedCandidate(c)}
            colorTolerance={master.deltaETolerance}
            glossTolerance={master.glossTolerance}
          />

          {/* Jev Decision Layer Card */}
          <JevDecisionCard
            decision={latestJev}
            isPrinterCorrectionSufficient={latestJev?.resolvableByPrinterAlone ?? true}
          />

          {/* Bottom Action */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={`/qc/${batch.id}`}
              className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow"
            >
              <span>Proceed to QC Approval</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

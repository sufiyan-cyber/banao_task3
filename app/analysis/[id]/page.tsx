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
  AlertTriangle,
} from 'lucide-react';

export default function AnalysisPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DisplayCorrection | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <div className="serif-card p-12 text-center text-[#6B6B6B] space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#B8860B]" />
        <p className="font-serif italic text-sm">Loading batch analysis data from atelier database...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="serif-card p-8 text-center text-[#9B2226] bg-[#FCECEE] border-[#F5C2C7] space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-[#9B2226]" />
        <h2 className="font-serif font-bold text-base">Analysis Error</h2>
        <p className="text-sm font-sans">{error || 'Batch not found'}</p>
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
    <div className="space-y-8">
      {/* Batch Header Bar */}
      <div className="serif-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-t-[#B8860B]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#B8860B]" />
              <span>{batch.batchNumber}</span>
            </h1>
            <span className="small-caps text-[10px] bg-[#FAF8F5] text-[#1A1A1A] px-2 py-0.5 rounded border border-[#E8E4DF]">
              SKU: {batch.sku}
            </span>
            <span className="small-caps text-[10px] bg-[#FAF8F5] text-[#6B6B6B] px-2 py-0.5 rounded border border-[#E8E4DF]">
              {batch.printerId}
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1 font-sans">
            Master Reference Version: <strong className="text-[#1A1A1A] font-serif">{master.version}</strong> (Approved by {master.approvedBy || 'Lead QC'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="small-caps text-[10px] text-[#A39B8E]">Status:</span>
          <span className="small-caps text-[10px] px-2.5 py-1 rounded border bg-[#FFF8E7] text-[#9D4E00] border-[#F2D0A4]">
            {batch.status.replace(/_/g, ' ')}
          </span>
          {hasCorrections && (
            <Link
              href={`/qc/${batch.id}`}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shadow-sm font-semibold"
            >
              <span>Proceed to QC Review</span>
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
          subtitle={`Optical Spectrophotometer Scan (Iteration ${batch.currentLoop})`}
          isMaster={false}
        />
      </div>

      {/* Objective Difference Metrics Row with Serif Display Numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="serif-card p-4 text-center border-t-2 border-t-[#B8860B]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">ΔE00 (CIEDE2000)</span>
          <div className="text-2xl font-serif font-bold mt-1 text-[#1A1A1A]">
            <span
              className={`px-2 py-0.5 rounded ${
                metrics.isColorInTolerance
                  ? 'text-[#2D6A4F]'
                  : 'text-[#9B2226]'
              }`}
            >
              {metrics.deltaE00.toFixed(2)}
            </span>
          </div>
          <span className="small-caps text-[9px] text-[#A39B8E] block mt-1">
            Limit: &lt;= {master.deltaETolerance.toFixed(1)}
          </span>
        </div>

        <div className="serif-card p-4 text-center border-t-2 border-t-[#B8860B]">
          <span className="small-caps text-[9px] text-[#A39B8E] block">ΔGloss</span>
          <div className="text-2xl font-serif font-bold mt-1 text-[#1A1A1A]">
            <span
              className={`px-2 py-0.5 rounded ${
                metrics.isGlossInTolerance
                  ? 'text-[#2D6A4F]'
                  : 'text-[#9D4E00]'
              }`}
            >
              {metrics.deltaGloss > 0 ? `+${metrics.deltaGloss.toFixed(1)}` : metrics.deltaGloss.toFixed(1)}
            </span>
          </div>
          <span className="small-caps text-[9px] text-[#A39B8E] block mt-1">
            Limit: ±{master.glossTolerance.toFixed(1)} GU
          </span>
        </div>

        <div className="serif-card p-4 text-center">
          <span className="small-caps text-[9px] text-[#A39B8E] block">ΔL* (Lightness)</span>
          <div className="text-lg font-serif font-bold mt-1 text-[#1A1A1A]">
            {metrics.deltaL > 0 ? `+${metrics.deltaL.toFixed(1)}` : metrics.deltaL.toFixed(1)}
          </div>
          <span className="text-[10px] text-[#6B6B6B] block mt-1 font-sans">{diagnosis.lightnessSummary}</span>
        </div>

        <div className="serif-card p-4 text-center">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Δa* (Red/Green)</span>
          <div className="text-lg font-serif font-bold mt-1 text-[#1A1A1A]">
            {metrics.deltaA > 0 ? `+${metrics.deltaA.toFixed(1)}` : metrics.deltaA.toFixed(1)}
          </div>
          <span className="text-[10px] text-[#6B6B6B] block mt-1 font-sans">{diagnosis.aSummary}</span>
        </div>

        <div className="serif-card p-4 text-center">
          <span className="small-caps text-[9px] text-[#A39B8E] block">Δb* (Yellow/Blue)</span>
          <div className="text-lg font-serif font-bold mt-1 text-[#1A1A1A]">
            {metrics.deltaB > 0 ? `+${metrics.deltaB.toFixed(1)}` : metrics.deltaB.toFixed(1)}
          </div>
          <span className="text-[10px] text-[#6B6B6B] block mt-1 font-sans">{diagnosis.bSummary}</span>
        </div>
      </div>

      {/* Directional Diagnosis Card */}
      <DirectionalDiagnosisCard diagnosis={diagnosis} metrics={metrics} />

      {/* Correction Generation Action Trigger */}
      {!hasCorrections ? (
        <div className="serif-card p-8 text-center space-y-3 bg-[#FAF8F5] border-dashed border-2 border-[#E8E4DF]">
          <Sliders className="w-8 h-8 text-[#B8860B] mx-auto" />
          <h3 className="font-serif font-bold text-base text-[#1A1A1A]">
            Ready to Generate Bounded Printer Corrections
          </h3>
          <p className="text-xs text-[#6B6B6B] max-w-md mx-auto font-sans leading-relaxed">
            The calibration response model will calculate 6-channel adjustments (Brown, Yellow, Black, Red, Blue, Other) to converge the tile shade toward master reference within ±5% bounds.
          </p>
          <button
            type="button"
            onClick={handleGenerateCorrection}
            disabled={optimizing}
            className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2 shadow-sm font-semibold mt-2"
          >
            {optimizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Calibration Model & Jev Evaluation...</span>
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
            <h2 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B8860B]" />
              <span>Optimized Correction Candidates</span>
            </h2>
            <button
              type="button"
              onClick={handleGenerateCorrection}
              disabled={optimizing}
              className="btn-secondary text-xs px-3 py-1 flex items-center gap-1.5"
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
              className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-sm font-semibold"
            >
              <span>Proceed to QC Review</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusCircle,
  Play,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CONFIG } from '@/lib/config';

interface MasterRecord {
  id: string;
  sku: string;
  version: string;
  l: number;
  a: number;
  b: number;
  gloss: number;
  approved: boolean;
  approvedBy?: string | null;
  associatedPrinterProfile?: string | null;
}

function NewBatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemoParam = searchParams.get('mode') === 'demo';

  const [masters, setMasters] = useState<MasterRecord[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>('CER-1001');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [selectedPrinter, setSelectedPrinter] = useState<string>('PRINTER-UAE-01');
  const [inputMode, setInputMode] = useState<'MANUAL' | 'CSV'>('MANUAL');

  // Manual inputs
  const [lVal, setLVal] = useState<string>('67.0');
  const [aVal, setAVal] = useState<string>('6.0');
  const [bVal, setBVal] = useState<string>('17.0');
  const [glossVal, setGlossVal] = useState<string>('77.0');

  // CSV inputs
  const [csvContent, setCsvContent] = useState<string>(
    'batch_id,sku,printer_id,L,a,b,gloss\nB2026-105,CER-1001,PRINTER-UAE-01,67.0,6.0,17.0,77.0'
  );
  const [csvError, setCsvError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch masters on mount
  useEffect(() => {
    fetch('/api/masters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.masters) {
          setMasters(data.masters);
          // Default to approved Master V3
          const defaultMaster =
            data.masters.find((m: MasterRecord) => m.sku === 'CER-1001' && m.approved) ||
            data.masters[0];
          if (defaultMaster) {
            setSelectedMasterId(defaultMaster.id);
          }
        }
      })
      .catch((err) => console.error('Failed to load masters:', err));
  }, []);

  // Filter masters for current SKU
  const availableVersions = masters.filter((m) => m.sku === selectedSku);
  const currentMaster = masters.find((m) => m.id === selectedMasterId);

  // One-click demo loader
  const handleLoadDemoSample = () => {
    setSelectedSku(CONFIG.demo.sku);
    setSelectedPrinter(CONFIG.demo.printerId);
    const demoMaster = masters.find(
      (m) => m.sku === CONFIG.demo.sku && m.version === CONFIG.demo.masterVersion && m.approved
    );
    if (demoMaster) setSelectedMasterId(demoMaster.id);

    setLVal(CONFIG.demo.sampleLab.l.toString());
    setAVal(CONFIG.demo.sampleLab.a.toString());
    setBVal(CONFIG.demo.sampleLab.b.toString());
    setGlossVal(CONFIG.demo.sampleLab.gloss.toString());
    setErrorMessage(null);
  };

  // One-click full demo run
  const handle1ClickDemoWalkthrough = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/demo/quick-start', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        setErrorMessage(data.error || 'Failed to start demo scenario');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Parse CSV
  const handleParseCsv = () => {
    setCsvError(null);
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must contain a header and at least one data row.');
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const lIdx = headers.indexOf('l');
      const aIdx = headers.indexOf('a');
      const bIdx = headers.indexOf('b');
      const glossIdx = headers.indexOf('gloss');
      const skuIdx = headers.indexOf('sku');
      const printerIdx = headers.indexOf('printer_id');

      if (lIdx === -1 || aIdx === -1 || bIdx === -1 || glossIdx === -1) {
        throw new Error('CSV header missing mandatory columns: L, a, b, gloss');
      }

      const values = lines[1].split(',').map((v) => v.trim());
      const parsedL = parseFloat(values[lIdx]);
      const parsedA = parseFloat(values[aIdx]);
      const parsedB = parseFloat(values[bIdx]);
      const parsedGloss = parseFloat(values[glossIdx]);

      if (isNaN(parsedL) || isNaN(parsedA) || isNaN(parsedB) || isNaN(parsedGloss)) {
        throw new Error('Non-numeric color values found in CSV row.');
      }

      setLVal(parsedL.toString());
      setAVal(parsedA.toString());
      setBVal(parsedB.toString());
      setGlossVal(parsedGloss.toString());

      if (skuIdx !== -1 && values[skuIdx]) {
        setSelectedSku(values[skuIdx]);
      }
      if (printerIdx !== -1 && values[printerIdx]) {
        setSelectedPrinter(values[printerIdx]);
      }

      setInputMode('MANUAL');
    } catch (err: any) {
      setCsvError(err.message);
    }
  };

  // Submit Batch Creation
  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const l = parseFloat(lVal);
    const a = parseFloat(aVal);
    const b = parseFloat(bVal);
    const gloss = parseFloat(glossVal);

    if (isNaN(l) || isNaN(a) || isNaN(b) || isNaN(gloss)) {
      setErrorMessage('Please enter valid numeric values for L*, a*, b*, and Gloss.');
      return;
    }

    if (!currentMaster) {
      setErrorMessage('Please select a master reference tile.');
      return;
    }

    if (!currentMaster.approved) {
      setErrorMessage(
        'Safety Rule Violation: Unapproved master reference cannot be used for production batching.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedSku,
          masterId: currentMaster.id,
          printerId: selectedPrinter,
          sample: { l, a, b, gloss },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize batch');
      }

      // Navigate to Analysis page
      router.push(`/analysis/${data.batchId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & Fast Demo Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <span>Create Production Batch</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Initiate shade changeover by selecting master reference and entering spectrophotometer sample.
          </p>
        </div>

        {/* 1-Click Demo Evaluation Shortcut */}
        <button
          type="button"
          onClick={handle1ClickDemoWalkthrough}
          disabled={submitting}
          className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs px-3.5 py-2 flex items-center gap-2 shadow"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Instant Demo (PRD Scenario)</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitBatch} className="space-y-6">
        {/* Section 1: Tile & Equipment Configuration */}
        <div className="industrial-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <span>1. Tile SKU & Master Reference Version</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SKU Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tile SKU Model
              </label>
              <select
                value={selectedSku}
                onChange={(e) => {
                  const newSku = e.target.value;
                  setSelectedSku(newSku);
                  const firstApproved = masters.find((m) => m.sku === newSku && m.approved);
                  if (firstApproved) setSelectedMasterId(firstApproved.id);
                }}
                className="w-full text-xs font-medium border border-slate-300 rounded px-2.5 py-2 bg-white text-slate-800 focus:outline-blue-600"
              >
                <option value="CER-1001">CER-1001 (Sandstone Beige 60x60)</option>
                <option value="CER-2004">CER-2004 (Calacatta White Glazed 80x80)</option>
                <option value="CER-3008">CER-3008 (Basalt Slate Grey 60x120)</option>
              </select>
            </div>

            {/* Master Version Selection (PRD Section 18 Master Versioning) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Master Reference Version
              </label>
              <select
                value={selectedMasterId}
                onChange={(e) => setSelectedMasterId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded px-2.5 py-2 bg-white text-slate-800 focus:outline-blue-600"
              >
                {availableVersions.map((v) => (
                  <option
                    key={v.id}
                    value={v.id}
                    disabled={!v.approved}
                    className={!v.approved ? 'text-slate-400 bg-slate-100' : 'text-slate-900 font-bold'}
                  >
                    {v.version} {v.approved ? '— [CURRENT APPROVED]' : '— [UNAPPROVED / ARCHIVED]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Inkjet Printer
              </label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded px-2.5 py-2 bg-white text-slate-800 focus:outline-blue-600 font-mono"
              >
                <option value="PRINTER-UAE-01">PRINTER-UAE-01 (Line 1 - 6-Color System)</option>
                <option value="PRINTER-UAE-02">PRINTER-UAE-02 (Line 2 - 6-Color System)</option>
              </select>
            </div>
          </div>

          {/* Master Details Readout */}
          {currentMaster && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">
                  Target Coordinates ({currentMaster.version}):
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  L*: <strong>{currentMaster.l.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  a*: <strong>{currentMaster.a.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  b*: <strong>{currentMaster.b.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Gloss: <strong>{currentMaster.gloss.toFixed(1)} GU</strong>
                </span>
              </div>

              <div>
                {currentMaster.approved ? (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Approved by {currentMaster.approvedBy || 'QC Lead'}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Unapproved Reference (Blocked by Safety Rule 8)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Production Sample Measurement */}
        <div className="industrial-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span>2. Current Production Tile Measurement</span>
            </h2>

            {/* Input Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                type="button"
                onClick={() => setInputMode('MANUAL')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  inputMode === 'MANUAL'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setInputMode('CSV')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  inputMode === 'CSV'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CSV Import
              </button>
            </div>
          </div>

          {inputMode === 'MANUAL' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Enter optical lab spectrophotometer readings from the first-off production tile:
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoSample}
                  className="btn-secondary text-xs px-2.5 py-1 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Load Demo Values (L=67, a=6, b=17, Gloss=77)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lightness (L*) [0–100]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={lVal}
                    onChange={(e) => setLVal(e.target.value)}
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Red-Green (a*) [-128–127]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-128"
                    max="127"
                    value={aVal}
                    onChange={(e) => setAVal(e.target.value)}
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yellow-Blue (b*) [-128–127]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-128"
                    max="127"
                    value={bVal}
                    onChange={(e) => setBVal(e.target.value)}
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Surface Gloss (GU) [0–100]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={glossVal}
                    onChange={(e) => setGlossVal(e.target.value)}
                    required
                    className="w-full text-sm font-mono font-bold border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 focus:outline-blue-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* CSV Import Mode (PRD Section 4-B) */
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Paste or import spectrophotometer export data in CSV format:
              </p>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono border border-slate-300 rounded p-2.5 bg-slate-50 text-slate-900 focus:outline-blue-600"
                placeholder="batch_id,sku,printer_id,L,a,b,gloss"
              />

              {csvError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{csvError}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Format: batch_id, sku, printer_id, L, a, b, gloss
                </span>
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Parse & Populate Fields</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || (currentMaster && !currentMaster.approved)}
            className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow"
          >
            <span>Analyze Sample</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewBatchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="industrial-card p-12 text-center text-slate-500 font-medium">
          Loading batch creation parameters...
        </div>
      }
    >
      <NewBatchForm />
    </React.Suspense>
  );
}

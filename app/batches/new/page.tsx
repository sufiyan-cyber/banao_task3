'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusCircle,
  Play,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
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

  // Automatically trigger demo walkthrough if mode=demo query param is present
  useEffect(() => {
    if (searchParams.get('mode') === 'demo') {
      handle1ClickDemoWalkthrough();
    }
  }, [searchParams]);

  const availableVersions = masters.filter((m) => m.sku === selectedSku);
  const currentMaster = masters.find((m) => m.id === selectedMasterId);

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

      router.push(`/analysis/${data.batchId}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Title & Fast Demo Button */}
      <div className="serif-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t-2 border-t-[#B8860B]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="small-caps text-[10px] text-[#B8860B]">
              New Production Entry
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Create Production Batch
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-1.5 font-sans leading-relaxed">
            Initiate shade changeover by selecting master reference and entering spectrophotometer reading.
          </p>
        </div>

        <button
          type="button"
          onClick={handle1ClickDemoWalkthrough}
          disabled={submitting}
          className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2 shrink-0 shadow-sm disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B8860B]" />
              <span>Launching Demo...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Instant Demo Scenario</span>
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#FCECEE] border border-[#F5C2C7] rounded-md text-xs text-[#9B2226] flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#9B2226]" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitBatch} className="space-y-6">
        {/* Section 1: Tile & Equipment Configuration */}
        <div className="serif-card p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8E4DF] pb-3">
            <Layers className="w-4 h-4 text-[#B8860B]" />
            <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
              1. Tile SKU & Master Reference
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* SKU Selection */}
            <div>
              <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1.5">
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
                className="w-full text-xs font-medium border border-[#E8E4DF] rounded-md px-3 py-2.5 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
              >
                <option value="CER-1001">CER-1001 (Sandstone Beige 60x60)</option>
                <option value="CER-2004">CER-2004 (Calacatta White Glazed 80x80)</option>
                <option value="CER-3008">CER-3008 (Basalt Slate Grey 60x120)</option>
              </select>
            </div>

            {/* Master Version Selection */}
            <div>
              <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1.5">
                Master Reference Version
              </label>
              <select
                value={selectedMasterId}
                onChange={(e) => setSelectedMasterId(e.target.value)}
                className="w-full text-xs font-medium border border-[#E8E4DF] rounded-md px-3 py-2.5 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
              >
                {availableVersions.map((v) => (
                  <option
                    key={v.id}
                    value={v.id}
                    disabled={!v.approved}
                    className={!v.approved ? 'text-[#A39B8E] bg-[#FAF8F5]' : 'text-[#1A1A1A] font-bold'}
                  >
                    {v.version} {v.approved ? '— [CURRENT APPROVED]' : '— [UNAPPROVED ARCHIVE]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Printer Selection */}
            <div>
              <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1.5">
                Target Inkjet Engine
              </label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full text-xs font-mono border border-[#E8E4DF] rounded-md px-3 py-2.5 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
              >
                <option value="PRINTER-UAE-01">PRINTER-UAE-01 (Line 1 - 6-Color)</option>
                <option value="PRINTER-UAE-02">PRINTER-UAE-02 (Line 2 - 6-Color)</option>
              </select>
            </div>
          </div>

          {/* Master Details Readout */}
          {currentMaster && (
            <div className="bg-[#FAF8F5] border border-[#E8E4DF] rounded-md p-4 text-xs flex flex-wrap items-center justify-between gap-3 font-sans">
              <div className="flex items-center gap-3">
                <span className="small-caps text-[10px] text-[#6B6B6B]">
                  Target ({currentMaster.version}):
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
                  L*: <strong className="font-serif">{currentMaster.l.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
                  a*: <strong className="font-serif">{currentMaster.a.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
                  b*: <strong className="font-serif">{currentMaster.b.toFixed(1)}</strong>
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E8E4DF]">
                  Gloss: <strong className="font-serif">{currentMaster.gloss.toFixed(1)} GU</strong>
                </span>
              </div>

              <div>
                {currentMaster.approved ? (
                  <span className="small-caps text-[9px] text-[#2D6A4F] bg-[#EBF5EE] border border-[#B7E4C7] px-2 py-1 rounded font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#2D6A4F]" />
                    Approved by {currentMaster.approvedBy || 'Lead QC'}
                  </span>
                ) : (
                  <span className="small-caps text-[9px] text-[#9B2226] bg-[#FCECEE] border border-[#F5C2C7] px-2 py-1 rounded font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#9B2226]" />
                    Unapproved Reference (Blocked by Safety Rule 8)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Production Tile Measurement */}
        <div className="serif-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#B8860B]" />
              <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                2. Current Production Tile Measurement
              </h2>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex items-center bg-[#FAF8F5] p-0.5 rounded border border-[#E8E4DF]">
              <button
                type="button"
                onClick={() => setInputMode('MANUAL')}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  inputMode === 'MANUAL'
                    ? 'bg-white text-[#1A1A1A] shadow-sm font-semibold'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setInputMode('CSV')}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  inputMode === 'CSV'
                    ? 'bg-white text-[#1A1A1A] shadow-sm font-semibold'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                CSV Import
              </button>
            </div>
          </div>

          {inputMode === 'MANUAL' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#6B6B6B] font-sans">
                  Enter optical lab spectrophotometer readings from the first-off production tile:
                </p>
                <button
                  type="button"
                  onClick={handleLoadDemoSample}
                  className="btn-secondary text-xs px-3 py-1 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#B8860B]" />
                  <span>Load Demo Values (L=67, a=6, b=17, Gloss=77)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1">
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
                    className="w-full text-base font-serif font-bold border border-[#E8E4DF] rounded-md px-3 py-2 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1">
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
                    className="w-full text-base font-serif font-bold border border-[#E8E4DF] rounded-md px-3 py-2 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1">
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
                    className="w-full text-base font-serif font-bold border border-[#E8E4DF] rounded-md px-3 py-2 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
                  />
                </div>

                <div>
                  <label className="block small-caps text-[10px] text-[#6B6B6B] mb-1">
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
                    className="w-full text-base font-serif font-bold border border-[#E8E4DF] rounded-md px-3 py-2 bg-white text-[#1A1A1A] focus:outline-[#B8860B]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#6B6B6B]">
                Paste or import spectrophotometer export data in CSV format:
              </p>

              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={4}
                className="w-full text-xs font-mono border border-[#E8E4DF] rounded-md p-3 bg-[#FAF8F5] text-[#1A1A1A] focus:outline-[#B8860B]"
                placeholder="batch_id,sku,printer_id,L,a,b,gloss"
              />

              {csvError && (
                <div className="text-xs text-[#9B2226] bg-[#FCECEE] border border-[#F5C2C7] rounded-md p-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{csvError}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="small-caps text-[9px] text-[#A39B8E]">
                  Format: batch_id, sku, printer_id, L, a, b, gloss
                </span>
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Parse & Populate</span>
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
            className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-sm font-semibold"
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
        <div className="serif-card p-12 text-center text-[#6B6B6B] font-serif italic">
          Loading batch creation parameters...
        </div>
      }
    >
      <NewBatchForm />
    </React.Suspense>
  );
}

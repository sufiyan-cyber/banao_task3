# ShadePilot — Intelligent Ceramic Tile Shade Correction System

> **Tagline:** From first sample to approved shade in minutes.  
> **Status:** Production-Quality Prototype for FDE Case Study.  
> **Notice:** *This prototype uses synthetic calibration data and simulated hardware adapters. Production deployment requires plant-specific calibration data, validation against the client's spectrophotometers/printers, and confirmation of acceptance tolerances.*

---

## 1. Executive Summary & Objective

In modern industrial ceramic tile manufacturing, batch changeover shade correction currently consumes approximately **6–7 hours per shift**. Factory operators repeatedly edit raster files in Photoshop, print 6–7 test variants, fire each tile in industrial kilns (~70 minutes per firing), measure Lab color coordinates, and repeat until shade matches visually.

**ShadePilot** replaces this trial-and-error cycle with a closed-loop, deterministic optimization workflow that reduces turnaround to **under 5 minutes** by:
1. Comparing master tile standards with current production spectrophotometer scans.
2. Computing objective color differences using **CIEDE2000 ($\Delta E_{00}$)** and surface gloss ($\Delta\text{Gloss}$).
3. Generating 6-channel printer adjustments (Brown, Yellow, Black, Red, Blue, Other) via a **bounded calibration response model**.
4. Utilizing **Jev** as a structured decision layer to evaluate whether recommendations meet risk thresholds.
5. Keeping a human QC operator strictly in the loop for approval before printer deployment.
6. Simulating post-firing verification and maintaining an immutable manufacturing audit log.

---

## 2. Critical Architecture Rule

```
Measurement (Lab + Gloss)
    ↓
Color Science (CIEDE2000 ΔE00, CIE76, ΔGloss, Directional Diagnosis)
    ↓
Printer Calibration / Forward Response Model
    ↓
Bounded Multi-Objective Optimization
    ↓
Candidate Corrections (Ranked A, B, C)
    ↓
Jev Structured Decision Layer (or Deterministic Fallback)
    ↓
Human QC Approval (Mandatory gate)
    ↓
Simulated Printer Reference Deployment (e.g. PRINTER-UAE-01-REF-V4)
    ↓
Simulated Verification Sample Firing
    ↓
PASS / FAIL / ESCALATE → Batch Release
```

### Core Architecture Guardrail
> **Never use an LLM to invent printer corrections.**  
> **Never use Jev to calculate numeric printer-channel adjustments.**  
> Numeric corrections are calculated exclusively by the calibration/optimization engine. Jev evaluates structured state (confidence, bounds compliance, residual error) and decides:
> - `APPROVE_RECOMMENDATION`
> - `REQUEST_REVIEW`
> - `ESCALATE`

---

## 3. Technology Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Next.js Server Routes & Server Actions
- **Database:** Supabase / PostgreSQL via Prisma ORM
- **Color Science & ML:** Custom TypeScript CIEDE2000 math, regularized damped least-squares calibration response optimizer
- **Decision Layer:** TypeSafe / Jev Server-Side API Client with deterministic rule-based review fallback
- **Hardware Abstraction:** `SpectrophotometerAdapter` (`DemoSpectrophotometer`) & `PrinterAdapter` (`SimulatedPrinter`)
- **Testing:** Vitest (13 passing unit tests covering color science, optimizer, bounds, safety rules, fallback engine, and verification)

---

## 4. Database Schema

Managed through Prisma with PostgreSQL:
- **`Master`**: Versioned master tiles (`CER-1001 V1, V2, V3`), target $L^*a^*b^*$ coordinates, gloss, release tolerances ($\Delta E \le 1.0, \Delta\text{Gloss} \le 2.0$), and approval signatures.
- **`Batch`**: Production batch records with status machine (`CREATED`, `SAMPLE_ENTERED`, `ANALYZED`, `QC_REVIEW`, `QC_APPROVED`, `VERIFYING`, `VERIFIED_PASS`, `VERIFIED_FAIL`, `RELEASED`, `ESCALATED`).
- **`Measurement`**: Spectrophotometer readings (`PRODUCTION_INITIAL`, `VERIFICATION_SAMPLE`), calculating $\Delta L^*, \Delta a^*, \Delta b^*, \Delta E_{76}, \Delta E_{00}, \Delta\text{Gloss}$.
- **`Correction`**: Ranked candidate adjustments for 6 printer channels (`brown`, `yellow`, `black`, `red`, `blue`, `other`), predicted metrics, and status (`GENERATED`, `APPLIED`).
- **`JevDecision`**: Structured state evaluation record, confidence, probabilities, model version, and fallback indicators.
- **`AuditLog`**: Immutable timestamped trail for ISO 9001 compliance.
- **`CalibrationObservation`**: Synthetic calibration response dataset (600 observations) tagged with `"Demo calibration data — synthetic"`.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js >= 18 (Tested on Node v22.19.0)
- npm >= 9

### Step 1: Environment Variables
Inspect `.env.example` and ensure `.env.local` is present:
```env
# TypeSafe / Jev Decision Layer Configuration
# Leave blank to operate in deterministic rule-based review mode (fully functional)
TYPESAFE_API_KEY=
TYPESAFE_BASE_URL=https://api.typesafe.ai
TYPESAFE_MODEL=jev-latest

# Supabase / Postgres Database Connection
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@[pooler-host]:5432/postgres"

# Application Metadata
NEXT_PUBLIC_APP_NAME=ShadePilot
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database & Seed Synthetic Data
```bash
# Push Prisma schema to Postgres
npm run db:push

# Seed approved master tiles, 600 synthetic calibration rows, and historical batches
npm run db:seed
```

### Step 4: Run Tests
```bash
npm test
```
All 13 test suites verify:
- CIEDE2000 math accuracy
- Directional diagnosis logic
- 6-channel adjustment bounds enforcement ($\pm 5\%$)
- PRD Section 15 gloss-deficit exception handling
- Jev fallback engine and loop escalation
- Verification pass/fail release gating

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. How to Run the 2-Minute Demo Flow

The evaluator can experience the complete changeover flow in **under 2 minutes**:

1. **Dashboard (`/dashboard`)**:
   - Click **"Launch Demo (CER-1001)"** or **"1-Click Demo Scenario"**.
2. **Analysis (`/analysis/[id]`)**:
   - View Master Tile ($L^*=70.0, a^*=5.0, b^*=20.0, \text{Gloss}=82.0$) vs Production Sample ($L^*=67.0, a^*=6.0, b^*=17.0, \text{Gloss}=77.0$).
   - Review Directional Diagnosis: *"Tile is darker, redder, and less yellow than approved master."* ($\Delta E_{00} = 3.31, \Delta\text{Gloss} = -5.0$).
   - Click **"Generate Correction Candidates"**.
   - Review 3 ranked candidates. Best candidate (Candidate A):
     - **Brown +3.4%**, **Yellow +0.8%**, **Black -0.2%**, Red 0%, Blue 0%, Other 0%
     - Predicted $\Delta E_{00} = 0.82$, Predicted $\Delta\text{Gloss} = -0.7$.
   - Review Jev Decision Card: Shows `APPROVE_RECOMMENDATION (PENDING QC)`, Confidence `94%`.
     *(Note: Displays "Jev unavailable — operating in rule-based review mode." when API key is blank).*
   - Click **"Proceed to QC Approval"**.
3. **QC Approval (`/qc/[id]`)**:
   - Review evidence-based channel recommendations.
   - Click **"Approve Correction & Generate Printer File"**.
   - System deploys revised reference profile `PRINTER-UAE-01-REF-V4`.
4. **Verification**:
   - Click **"Simulate Verification Sample"**.
   - Fired sample simulation yields: Final $\Delta E_{00} = 0.81$ (Pass $\le 1.0$) and $\Delta\text{Gloss} = -0.7$ (Pass $\le \pm 2.0$).
5. **Batch Release**:
   - Click **"Release Batch to Production Run"**.
   - Final Value Screen displays:
     - Current Photoshop process: **~6–7 hours**
     - ShadePilot workflow: **~3m 48s**
     - Turnaround time saved: **~6.4 hours**
     - Status: **APPROVED & RELEASED**

---

## 7. Jev Availability & Fallback Behavior

- When `TYPESAFE_API_KEY` is blank or unconfigured, ShadePilot operates gracefully without errors.
- The UI status badge clearly indicates:  
  `Jev unavailable — operating in rule-based review mode.`
- Deterministic fallback rules enforce:
  - Within bounds & residual error $\le$ tolerance $\rightarrow$ `APPROVE_RECOMMENDATION` (pending mandatory QC approval).
  - Low model confidence ($< 0.85$) or elevated error $\rightarrow$ `REQUEST_REVIEW`.
  - Corrections outside physical bounds or insufficient to resolve defect $\rightarrow$ `ESCALATE`.
  - Loops $> 2$ attempts $\rightarrow$ `ESCALATE`.
- Adding a valid `TYPESAFE_API_KEY` automatically activates the live API without modifying code.
- Keys are strictly kept server-side and never exposed to browser bundles.

---

## 8. Hard Safety Rules Implemented

1. **Channel limits**: Adjustments are hard-clamped to $\pm 5.0\%$.
2. **Strict release gating**: Batches can **never** be released without a passing verification scan ($\Delta E_{00} \le 1.0, |\Delta\text{Gloss}| \le 2.0$).
3. **Human QC mandatory**: Automated printer updates cannot execute without human QC approval.
4. **Master version lock**: Only approved master versions (`approved = true`) can be selected for production batches.
5. **Loop cap**: Maximum of 2 correction iterations before mandatory escalation to Process Engineering.
6. **Immutable audit trail**: Every action, measurement, and decision is logged with actor metadata.

---

## 9. Important Exception Case: Insufficient Correction

PRD Section 15 requires demonstrating a case where printer adjustment cannot fix the defect:
- When a tile exhibits an extreme gloss loss (e.g. $\Delta\text{Gloss} = -12.0\text{ GU}$) due to kiln cooling or raw glaze slip drift:
- ShadePilot’s optimizer identifies that color can improve, but gloss remains outside tolerance.
- System outputs:  
  ⚠️ **"Printer correction insufficient — gloss remains outside tolerance. Escalate for process investigation."**
- This proves the system is engineered to detect physical manufacturing limits rather than hallucinating invalid printer adjustments.

---

## 10. Future Production Roadmap

- **Phase 1 (Current MVP):** Existing lab spectrophotometer + Software + Jev decision layer + Simulated adapters.
- **Phase 2:** Direct USB/Serial optical spectrophotometer driver integration (X-Rite / Konica Minolta).
- **Phase 3:** Direct OEM printer driver integration (EFI Cretaprint / Durst / SACMI / System).
- **Phase 4:** Multi-kiln glaze slip viscosity predictive modeling and plant-wide closed-loop platform.

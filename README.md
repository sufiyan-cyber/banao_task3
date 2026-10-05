# ShadePilot

**Software-led ceramic tile shade correction and batch-changeover QC workflow.**

ShadePilot demonstrates a closed-loop workflow in which a master tile and first production sample are compared using objective LAB/Gloss measurements, printer-response calibration is used to generate correction candidates, a structured decision layer evaluates the recommendation, QC approves the correction, and the sample is verified before batch release.

---

## 1. Problem

In industrial ceramic tile manufacturing, batch changeover shade correction currently consumes approximately **6–7 hours per shift**. When switching to a new tile SKU or starting a fresh batch, the factory's existing process involves:

1. Setting initial printer parameters and pressing/glazing the initial tile.
2. Firing the first sample tile through an industrial kiln cycle (~70 minutes).
3. Visual inspection and manual optical lab spectrophotometer readings.
4. If the shade is off, factory operators repeatedly edit raster artwork files in Photoshop based on subjective visual judgment.
5. Printing 6–7 test tile variants with incremental adjustments.
6. Refiring each variant, measuring Lab color coordinates, and repeating the cycle until visual tolerance is met.

This trial-and-error cycle results in significant kiln downtime, high scrap tile volumes, and heavy reliance on the subjective visual judgment of individual operators. 

**ShadePilot** is designed to eliminate the iterative trial-and-error correction process, moving plant decisions away from subjective raster edits toward measured, explainable, and bounded printer channel corrections.

---

## 2. Key Insight & Scope Control

**This is NOT a continuous full-line computer-vision inspection system in the MVP.**

The ShadePilot workflow is triggered specifically at **batch changeover**:

$$\text{New Batch} \longrightarrow \text{First Sample} \longrightarrow \text{Measurement} \longrightarrow \text{Shade Analysis} \longrightarrow \text{Correction Recommendation} \longrightarrow \text{QC Approval} \longrightarrow \text{Verification} \longrightarrow \text{Batch Release}$$

Once the first production sample of a batch is verified and released, the remaining production run is not continuously inspected by this prototype. 

Focusing strictly on the batch changeover bottleneck achieves the highest return on investment while keeping the MVP scope tightly controlled and production-feasible.

---

## 3. System Architecture

```text
Master Tile
    ↓
Target LAB + Gloss
    ↓
First Production Sample
    ↓
Spectrophotometer / Measurement Input
    ↓
Color Science
(ΔL*, Δa*, Δb*, ΔE76, ΔE00, ΔGloss)
    ↓
Printer Response / Calibration Model
    ↓
Correction Optimization
    ↓
3 Candidate Printer Corrections
    ↓
Jev Decision Layer
(or deterministic fallback)
    ↓
Human QC Approval
    ↓
Simulated Printer Reference Update
    ↓
Verification Sample
    ↓
Final Measurement
    ↓
PASS / FAIL
    ↓
Release Batch / Retry / Escalate
```

---

## 4. Jev Integration

**ShadePilot is designed with an optional Jev decision layer.**

### Division of Responsibility

| Component | Responsibility | Does NOT Do |
| :--- | :--- | :--- |
| **Color & Calibration Engine** | Calculates objective CIEDE2000 color differences and numeric printer-channel offsets (e.g. `Brown +3.4%`, `Yellow +0.8%`, `Black -0.2%`). | Does not make policy or release risk decisions. |
| **Jev Structured Decision Layer** | Evaluates candidate corrections against structured operational context to return policy decisions: `APPROVE_RECOMMENDATION`, `REQUEST_REVIEW`, or `ESCALATE`. | **Never calculates numerical printer adjustments or ink percentages.** |

Jev evaluates structured state (e.g., color deltas, predicted outcomes, printer channel constraints, loop iterations) and provides confidence assessments and operational risk classifications.

### Live Jev vs. Deterministic Fallback Mode

The real Jev integration is implemented server-side (`lib/jev/client.ts`), but the demo currently operates in **rule-based review mode** when a TypeSafe API key is unavailable.

> **Honest Prototype Status:** The TypeSafe organization used during development does not currently have available API credits, so a live Jev API key could not be activated for this demo. The application therefore uses a deterministic rule-based fallback (`lib/jev/fallback.ts`) that strictly enforces the same structured decision schema, returns identical decision types, and displays in the UI:
> 
> *"Jev unavailable — operating in rule-based review mode."*

When a valid `TYPESAFE_API_KEY` is configured, the server-side decision layer automatically routes requests to Jev without requiring any changes to the rest of the application.

---

## 5. Human-in-the-Loop Governance

ShadePilot does **not** remove the human operator. Instead, it replaces:

$$\text{Human guessing printer adjustments in Photoshop}$$

with:

$$\text{Calibrated system recommendation} \longrightarrow \text{QC reviews objective evidence} \longrightarrow \text{QC approves / rejects / escalates}$$

### Two Distinct Operational Gates

1. **Correction Approval Gate (`QC Review`)**:
   - The QC operator reviews the 3 generated correction candidates and the Jev / rule-based risk evaluation.
   - Candidate A is **not pre-selected**. The operator must explicitly review the options and click to select their chosen candidate.
   - The operator confirms approval with optional audit notes before any printer reference profile is updated.
2. **Batch Release Gate (`Verification`)**:
   - After the corrected reference is applied, a physical verification sample is measured.
   - Only when the optical measurement objectively passes tolerance ($\Delta E_{00} \le 1.0, \Delta\text{Gloss} \le 2.0$) can the operator authorize the **Batch Release to Production Run**.

---

## 6. Hardware Strategy

The MVP workflow is built around the plant's existing equipment concept:
- **Existing Spectrophotometer Concept**: Optical measurement of fired samples ($L^*, a^*, b^*$, 60° Gloss).
- **Existing Printer Concept**: 6-channel industrial ceramic inkjet printer.
- **Existing Kiln Concept**: Industrial roller kiln firing cycle.

### Hardware Adapters

The prototype uses software hardware adapters (`lib/adapters/`) rather than direct machine drivers:
- `SpectrophotometerAdapter` $\longrightarrow$ `DemoSpectrophotometer`: Simulates optical aperture reading and process drift.
- `PrinterAdapter` $\longrightarrow$ `SimulatedPrinter`: Simulates profile deployment and firmware reference generation (`PRINTER-UAE-01-REF-V4`).

> **Notice:** No production hardware integration is claimed in this prototype.

### Future Hardware Roadmap
- Dedicated optical measurement station with barcode/RFID tile tracking.
- Direct spectrophotometer USB/Ethernet SDK integration.
- Industrial inkjet printer RIP / OEM API integration.
- Edge gateway industrial IPC deployment.
- Optional inline line-scan camera for post-release defect scanning (not required for MVP).

---

## 7. Color Science

Color calculations are implemented in clean, dedicated TypeScript modules (`lib/color/`) accompanied by unit tests:

- **$L^*$**: Perceptual Lightness ($0 = \text{black}, 100 = \text{diffuse white}$).
- **$a^*$**: Chromatic green–red axis ($-\text{green}, +\text{red}$).
- **$b^*$**: Chromatic blue–yellow axis ($-\text{blue}, +\text{yellow}$).
- **$\text{Gloss}$**: Specular gloss measured at 60° geometry in Gloss Units (GU).
- **$\Delta L^*, \Delta a^*, \Delta b^*, \Delta\text{Gloss}$**: Dimensional target deviations.
- **$\Delta E_{76}$**: Euclidean CIE 1976 color difference.
- **$\Delta E_{00}$ (CIEDE2000)**: Modern perceptual color difference incorporating lightness weighting ($S_L$), chroma weighting ($S_C$), hue weighting ($S_H$), and a neutral rotation term ($R_T$).

**$\Delta E_{00}$ is the primary color-difference metric.** RGB distance is never used for shade matching. LLMs are never used to invent color calculations.

---

## 8. Calibration & Optimization Engine

The numeric printer correction is produced by a multi-objective calibration and optimization engine (`lib/calibration/`):

### Forward Printer Response Model
Models the relationship between six inkjet pigment channels and optical fired output:
1. **Brown**
2. **Yellow**
3. **Black**
4. **Red**
5. **Blue**
6. **Other**

$$\Delta \mathbf{y} = \mathbf{J} \cdot \Delta \mathbf{u}$$

Where $\mathbf{J}$ is the calibrated printer sensitivity Jacobian matrix, $\Delta \mathbf{u} \in [-5.0\%, +5.0\%]$ represents bounded channel percentage offsets, and $\Delta \mathbf{y} = [\Delta L^*, \Delta a^*, \Delta b^*, \Delta\text{Gloss}]^T$.

### Multi-Candidate Optimizer
Solves a damped least-squares objective with channel bounding to output **3 distinct candidates**:
- **Candidate A — System Recommended**: Balanced chromatic convergence ($\Delta E_{00}$) and gloss stability.
- **Candidate B — Gloss-Stabilizing**: Prioritizes surface finish retention with moderated ink volume.
- **Candidate C — Color-Prioritized**: Aggressive chromatic convergence toward target shade.

> **Notice:** Calibration relationships are synthetic demonstration data and are not claims about a real production printer.

---

## 9. Demo Walkthrough

Evaluators can run the full end-to-end changeover workflow in under 2 minutes:

1. **Launch Demo**: Click **"Launch Demo"** in the top navigation bar or **"1-Click Demo Scenario"** on the Dashboard.
2. **Batch Intake**: The system loads approved Master **Calacatta Gold V3** and simulates initial production shade drift ($L^*=67.0, a^*=6.0, b^*=17.0, \text{Gloss}=77.0$).
3. **Shade Analysis (`/analysis/[id]`)**: Review visual tile swatches, directional diagnosis, and initial error ($\Delta E_{00} = 6.42$, failing tolerance). Click **"Proceed to QC Review"**.
4. **QC Review (`/qc/[id]`)**:
   - Inspect the Jev / rule-based decision card.
   - Review the 3 candidate corrections table.
   - **Click "Select"** on **Candidate A — System Recommended** (Brown +3.4%, Yellow +0.8%, Black -0.2%).
   - Enter optional QC notes and click **"Approve Correction"**.
5. **Simulated Verification**:
   - The screen confirms **"Simulated Printer Reference Updated: PRINTER-UAE-01-REF-V4"**.
   - Click **"Apply Correction (Simulated)"**.
6. **Batch Release**:
   - The optical scan verifies that the color error dropped from **$6.42 \longrightarrow 0.38$** ($\Delta E_{00} \le 1.0$, PASS).
   - Click **"Release Batch to Production Run"**.
7. **Traceability Archive (`/history`)**: Inspect the ISO 9001 changeover audit log and 72% turnaround velocity gain.

---

## 10. Synthetic Data Disclaimer

> ### Prototype Disclaimer
> This demonstration uses **synthetic calibration data** and **simulated hardware behavior**. Numerical correction performance shown in the demo is illustrative only and is not production-validated. Real factory deployment would require plant-specific printer calibration datasets, real optical spectrophotometer measurements, empirical validation of body/glaze firing behavior, client-agreed color and gloss tolerances, and physical integration testing.

---

## 11. Demonstration Values

The walkthrough scenario displays the following representative values:
- **Master Target**: $L^* = 70.0, a^* = 5.0, b^* = 20.0, \text{Gloss} = 82.0\text{ GU}$
- **Initial Production Sample (Drifted)**: $L^* = 67.0, a^* = 6.0, b^* = 17.0, \text{Gloss} = 77.0\text{ GU}$
- **Initial $\Delta E_{00}$**: $6.42$ (Tolerance $\le 1.0$, **FAIL**)
- **Initial $\Delta\text{Gloss}$**: $-5.0\text{ GU}$ (Tolerance $\le 2.0\text{ GU}$, **FAIL**)
- **Applied Candidate A Correction**: Brown $+3.4\%$, Yellow $+0.8\%$, Black $-0.2\%$
- **Verification Fired Sample**: $L^* = 69.8, a^* = 5.1, b^* = 19.8, \text{Gloss} = 81.6\text{ GU}$
- **Final Fired $\Delta E_{00}$**: $0.38$ (**PASS**)
- **Final $\Delta\text{Gloss}$**: $-0.4\text{ GU}$ (**PASS**)

*These are synthetic demonstration values used to illustrate the software workflow and must not be interpreted as measured customer or plant results.*

---

## 12. Current Limitations

- **Synthetic Calibration**: Response matrices and channel sensitivities are synthetic.
- **Simulated Spectrophotometer**: Measurement inputs are simulated via software adapter.
- **Simulated Printer**: Profile generation and reference IDs are simulated.
- **Simulated Verification**: Post-correction measurements use physical model approximations rather than real kiln firings.
- **No Direct Machine Control**: No PLC, SCADA, or direct printer driver communication.
- **No Continuous Inspection**: Prototype strictly addresses the batch-changeover sample gate.
- **No Kiln Root-Cause Automation**: Does not diagnose slip viscosity, thermal zone drift, or raw clay chemistry.
- **Rule-Based Review Fallback**: Operates in deterministic fallback mode when TypeSafe API credits are unavailable.

---

## 13. What We Deliberately Do Not Build

1. **Continuous Camera Line Inspection**: Full-line computer vision does not solve the changeover ink-adjustment problem and adds unnecessary factory networking overhead.
2. **Automated Kiln Root-Cause Diagnosis**: Firing curves involve complex thermodynamics beyond initial changeover shade control.
3. **Fully Autonomous Printer Updating**: Operators require strict sign-off authority for ISO compliance and safety.
4. **Replacing the Spectrophotometer**: Optical spectrophotometry remains the industrial gold standard for color science.
5. **LLM-Driven Numerical Adjustments**: Neural language models hallucinate numbers; calibration must be grounded in linear/damped response models.

---

## 14. Project Structure

```text
a:/banao_task3/
├── app/
│   ├── analysis/[id]/        # Shade analysis & candidate generation portal
│   ├── api/
│   │   ├── batches/          # Batch intake, analysis, optimize, qc-decide, verify, release
│   │   ├── demo/quick-start/ # 1-click automated walkthrough endpoint
│   │   ├── masters/          # Approved master reference CRUD
│   │   └── system/status/    # Live Jev, database, and hardware status
│   ├── batches/new/          # Manual & CSV sample measurement intake
│   ├── dashboard/            # Plant overview, active batches, changeover analytics
│   ├── history/              # Batch archive, audit logs, velocity benchmarks
│   ├── globals.css           # Serif luxury atelier design utilities & tokens
│   └── layout.tsx            # App shell with Playfair Display & Source Sans fonts
├── components/
│   ├── AuditTrailDrawer.tsx  # Modal audit log timeline viewer
│   ├── CandidateCorrectionsTable.tsx # 6-channel adjustment comparison & selection
│   ├── ColorSwatch.tsx       # Visual tile glaze simulation & LAB coordinate tags
│   ├── DirectionalDiagnosisCard.tsx  # Physical glaze diagnosis readout
│   ├── Header.tsx            # Atelier header with live Jev indicator & 1-click launch
│   ├── JevDecisionCard.tsx   # Structured decision & fallback review card
│   ├── LaunchDemoButton.tsx  # Interactive quick-launch button with loading state
│   ├── Sidebar.tsx           # Navigation sidebar & velocity benchmark widget
│   └── TimeComparisonCard.tsx# Turnaround time comparison (45m manual vs 12m ShadePilot)
├── lib/
│   ├── adapters/             # Hardware simulation adapters (Spectro & Printer)
│   ├── audit/logger.ts       # Database audit logging
│   ├── calibration/          # 6-channel forward response model & damped optimizer
│   ├── color/                # CIEDE2000, CIE76, deltaGloss, and LAB utilities
│   ├── jev/                  # Jev API client & deterministic safety fallback rules
│   ├── config.ts             # Central tolerances, bounds, and demo constants
│   └── prisma.ts             # PostgreSQL Prisma client
├── prisma/
│   └── schema.prisma         # Postgres schema (Master, Batch, Measurement, Correction, Jev)
├── scripts/
│   └── seed.ts               # Database seed (Masters V1–V3, 600 synthetic rows, batches)
└── tests/
    ├── color.test.ts         # CIEDE2000 color science unit tests
    └── optimizer_and_rules.test.ts # Bounded optimizer & 10 safety rule tests
```

---

## 15. Environment Variables

Store secrets in `.env.local`. **Never commit `.env.local` to Git.**

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `TYPESAFE_API_KEY` | Optional TypeSafe / Jev API key. Leave blank for rule-based review mode. | `ts_live_...` (or blank) |
| `TYPESAFE_BASE_URL` | Base URL for TypeSafe API. | `https://api.typesafe.ai` |
| `TYPESAFE_MODEL` | Jev model name. | `jev-latest` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://user:password@host:5432/dbname` |
| `NEXT_PUBLIC_APP_NAME` | Application display name. | `ShadePilot` |

> **Security Note:** Never prefix `TYPESAFE_API_KEY` with `NEXT_PUBLIC_`. The key must remain server-side only.

---

## 16. Local Setup & Evaluator Reproduction Guide

Follow these exact steps to reproduce the ShadePilot prototype on any fresh machine:

### Prerequisites
- **Node.js**: v18.0.0+ (tested on Node v20 and v22)
- **Database**: Either **Docker** (recommended for instant 1-command local Postgres) OR an existing **PostgreSQL / Supabase** instance.

---

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/sufiyan-cyber/banao_task3.git
cd banao_task3
npm install
```

---

### Step 2: Database Setup (Choose Option A or Option B)

#### Option A: 1-Command Local Postgres via Docker (Recommended)
If you have Docker Desktop or Docker engine installed, start a local database container with:
```bash
docker compose up -d
```
Then copy the example environment file:
```bash
cp .env.example .env.local
```
*(The default `.env.example` is already pre-configured to connect to this local Docker PostgreSQL instance: `postgresql://postgres:postgrespassword@localhost:5432/shadepilot`).*

#### Option B: Existing PostgreSQL or Supabase Instance
If you prefer using an existing database or a hosted Supabase project:
```bash
cp .env.example .env.local
```
Open `.env.local` in an editor and set your connection string:
```bash
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<dbname>"
```
*Note: `TYPESAFE_API_KEY` can be left blank. The application will automatically detect this and run in the built-in deterministic rule-based fallback mode.*

---

### Step 3: Initialize Database Schema & Seed Data
Execute the Prisma migration and seed scripts:
```bash
# Push schema tables (masters, batches, measurements, corrections, jev_decisions, audit_logs)
npm run db:push

# Seed approved master tiles (CER-1001 V1–V3), 600 synthetic calibration rows, and baseline batches
npm run db:seed
```

---

### Step 4: Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Step 5: Execute Automated Verification Tests (Optional)
Run the 13 unit tests verifying color science, calibration response models, and safety rules:
```bash
npm test
```
To verify the production build with zero TypeScript or linting errors:
```bash
npm run build
```

---

### Step 6: 60-Second End-to-End Walkthrough
Once the application is running at `http://localhost:3000`:

1. **Trigger Demo**: Click **"Launch Demo"** in the top navigation bar (or **"1-Click Demo Scenario"** on the Dashboard).
2. **Review Shade Analysis (`/analysis/[id]`)**:
   - Compare the visual tile swatches between the pristine Master Tile and drifted Production Sample.
   - Inspect the objective error ($\Delta E_{00} = 6.42$, failing tolerance) and directional physical diagnosis.
   - Click the gold button: **"Proceed to QC Review →"**.
3. **Perform Human-in-the-Loop QC (`/qc/[id]`)**:
   - Inspect the Jev decision card (displaying rule-based review status when offline).
   - Review the 3 candidate corrections. Notice that Candidate A is **not pre-selected**.
   - Click **"Select"** on **`Candidate A — System Recommended`** (Brown +3.4%, Yellow +0.8%, Black -0.2%).
   - Click the green button: **"Approve Correction"**.
4. **Simulate Printer Reference & Process Verification**:
   - The stage updates to: *"Simulated Printer Reference Updated: PRINTER-UAE-01-REF-V4"*.
   - Click **"Apply Correction (Simulated)"**.
5. **Verify & Release**:
   - The optical scan shows the color error dropped to **$\Delta E_{00} = 0.38$** (well within the $\le 1.0$ limit, **PASS**).
   - Click **"Release Batch to Production Run"**.
   - Review the Final Value Screen showing the estimated **6.4 hours saved per changeover**.
6. **Inspect Traceability Archive (`/history`)**:
   - Navigate to **Batch History** to inspect the ISO 9001 compliance audit trail and turnaround time charts.

---

## 17. Jev Setup & Verification

- **If `TYPESAFE_API_KEY` is blank**: The application automatically detects this server-side and uses the deterministic fallback decision engine. The UI displays *"Jev unavailable — operating in rule-based review mode"*.
- **If `TYPESAFE_API_KEY` is provided**: The application connects to `https://api.typesafe.ai` using `jev-latest` to evaluate candidate corrections against the structured operational schema.

In both modes, **all numerical printer channel corrections are computed by the calibration optimizer**, ensuring color science integrity regardless of LLM availability.

---

## 18. Testing

Run the Vitest unit test suite:
```bash
npm test
```

### Test Coverage
- **Color Science (`tests/color.test.ts`)**: CIEDE2000 standard formula, $\Delta E_{76}$, $\Delta\text{Gloss}$, chromatic axis diagnosis, and identical color validation.
- **Optimizer & Safety Rules (`tests/optimizer_and_rules.test.ts`)**: Multi-candidate generation, $\pm 5\%$ channel clamping, PRD Section 15 insufficient-correction exception handling, and 10 deterministic fallback safety rules.

---

## 19. Security & Confidentiality

- All secrets and credentials are loaded strictly from environment variables.
- `.env` and `.env*.local` are explicitly ignored in `.gitignore`.
- TypeSafe / Jev API credentials are restricted to server-side routes and actions.
- Client discovery call notes, raw transcripts, and confidential identifiers are strictly excluded from the repository.

---

## 20. Future Production Roadmap

- **Phase 1 (Current Prototype)**: Software-led batch changeover shade correction, bounded calibration optimizer, Jev structured decision layer, and human QC verification.
- **Phase 2**: Production-grade optical measurement station with barcode/RFID tile tracking and direct spectrophotometer USB/LAN integration.
- **Phase 3**: OEM industrial inkjet printer direct profile deployment (Durst, EFI, System Ceramic RIP integration).
- **Phase 4**: Plant-specific empirical calibration modeling incorporating kiln thermal profiles and glaze slip viscosity.
- **Phase 5**: Multi-plant closed-loop deployment across production lines.

---

## 21. Case Study Context

This prototype accompanies an **Forward Deployed Engineer (FDE) Case Study**. The primary objective is to demonstrate:
- Rigorous problem framing and root-cause analysis of manufacturing bottlenecks.
- Disciplined scope control (batch changeover gating vs. full-line inspection).
- Color science fidelity (CIEDE2000 math over LLM hallucination).
- Reliable human-in-the-loop governance for industrial compliance.
- Transparent handling of external service constraints (clean Jev fallback).

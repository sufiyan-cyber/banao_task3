# PRD — Ceramic Tile Intelligent Shade Correction System

## 1. Product Name

**ShadePilot**

### Tagline

**From first sample to approved shade in minutes.**

---

# 2. Product Objective

Build a web-based prototype that demonstrates how a ceramic tile manufacturer can reduce the current manual shade-correction cycle from approximately **6–7 hours toward a few minutes** by:

1. Measuring the difference between a master tile and a current production sample.
2. Converting that difference into objective color metrics.
3. Using a printer-response calibration model to generate candidate printer corrections.
4. Using **Jev as a structured decision layer** to determine whether the recommendation is sufficiently reliable, requires QC review, or should be escalated.
5. Presenting the recommendation to a QC operator for approval.
6. Generating a revised printer-reference configuration/file.
7. Running a simulated verification step.
8. Recording the entire batch correction history.

The client currently performs multiple Photoshop edits, prints 6–7 variants, fires samples, measures them in the lab, and repeats. A single cycle is approximately 6–7 hours.

The client specifically wants the system to determine **how to change the printer input**, not merely tell them that the colors differ.

---

# 3. Core Product Principle

### Do not build:

```text
Image → LLM → "Brown +4%"
```

### Build:

```text
Measurement
    ↓
Color science
    ↓
Printer calibration
    ↓
Correction optimization
    ↓
Candidate corrections
    ↓
Jev decision layer
    ↓
Human QC approval
    ↓
Verification
    ↓
Batch release
```

This architecture is designed to separate deterministic / calibrated color correction from structured decision-making.

---

# 4. MVP Scope

## In Scope

### A. Master Tile Management

Create a master tile record containing:

- SKU
- Master ID
- Master version
- L*
- a*
- b*
- Gloss
- tolerance values
- approved date
- approved by
- associated printer profile

The client has specifically raised the problem of old reference files becoming inaccurate, so master/version management is important.

---

## B. Production Sample Entry

QC should be able to enter or import:

- Batch ID
- SKU
- Printer
- Current printer reference version
- Production sample L*
- Production sample a*
- Production sample b*
- Production sample Gloss

### Input modes

Provide two modes.

### Mode 1 — Manual/demo

Fields:

```text
L*
a*
b*
Gloss
```

### Mode 2 — CSV import

Example:

```csv
batch_id,sku,printer_id,L,a,b,gloss
B001,SKU-101,P01,69.8,5.1,17.0,77
```

This is important because the prototype does not have real spectrophotometer integration from the client.

The discovery notes establish that the client already has lab spectrophotometers and obtains color-difference measurements from them.

---

# 5. Color Difference Engine

Given:

### Master

```text
L1
a1
b1
Gloss1
```

### Production

```text
L2
a2
b2
Gloss2
```

Calculate:

```text
ΔL*
Δa*
Δb*
ΔE76
ΔE00
ΔGloss
```

Use **CIEDE2000 (ΔE00)** as the primary perceptual color-difference metric.

Do not use RGB difference as the primary metric.

---

# 6. Directional Diagnosis

The system should explain the deviation.

Example:

```text
Current tile is:

Darker        ↓
More red      →
Less yellow   ↓
Lower gloss   ↓
```

Example calculation:

```text
ΔL = -2.7
Δa = +0.8
Δb = -2.4
ΔE00 = 2.9
ΔGloss = -4.1
```

Display:

> **Shade deviation detected**

> Tile is darker, slightly redder and less yellow than the approved master.

This gives QC something immediately understandable.

---

# 7. Printer Calibration Engine

This is the most important technical component.

The system must contain a **Printer Response Model**.

For the prototype, assume six channels:

```text
Brown
Yellow
Black
Red
Blue
Primary/Other
```

The client says the current process uses six primary colors.

---

## Calibration Dataset

Create a calibration table:

```text
printer_id
sku_family
brown_delta
yellow_delta
black_delta
red_delta
blue_delta
other_delta
result_L
result_a
result_b
result_gloss
```

Example:

```text
Brown +1%
→ ΔL -0.42
→ Δa +0.11
→ Δb +0.23
→ ΔGloss -0.10
```

The prototype should ship with **synthetic calibration data**.

Clearly label this in the UI:

> **Demo calibration data — synthetic**

Do **not** imply this represents real client measurements.

---

# 8. Correction Algorithm

Given:

```text
Current LAB
Target LAB
```

calculate:

```text
Desired movement
```

Then use the calibration matrix/model to estimate what printer-channel changes can produce that movement.

Conceptually:

```text
desired ΔLAB
       ↓
printer-response model
       ↓
optimization
       ↓
candidate correction
```

### Objective

Minimize:

```text
weighted_color_error
+
gloss_error
+
correction_magnitude
```

Subject to constraints:

```text
-5% <= channel adjustment <= +5%
```

for demo purposes.

Make these limits configurable.

---

# 9. Correction Candidates

Do not generate just one answer internally.

Generate 3 candidate corrections.

Example:

### Candidate A

```text
Brown  +3.4%
Yellow +0.8%
Black  -0.2%

Predicted ΔE00 = 0.82
Predicted ΔGloss = -0.7
```

### Candidate B

```text
Brown  +2.9%
Yellow +1.3%
Black  +0.1%

Predicted ΔE00 = 0.91
Predicted ΔGloss = -0.6
```

### Candidate C

```text
Brown  +4.1%
Yellow +0.2%
Black  -0.4%

Predicted ΔE00 = 0.76
Predicted ΔGloss = -1.3
```

The optimizer ranks them.

---

# 10. Jev Decision Layer

This is where Jev comes in.

Jev receives the **structured state**, not raw images.

Example state:

```json
{
  "sku": "SKU-101",
  "printer": "P01",
  "delta_e00": 2.9,
  "delta_l": -2.7,
  "delta_a": 0.8,
  "delta_b": -2.4,
  "delta_gloss": -4.1,
  "candidate_corrections": [
    {
      "brown": 3.4,
      "yellow": 0.8,
      "black": -0.2,
      "predicted_delta_e00": 0.82,
      "predicted_delta_gloss": -0.7
    }
  ],
  "model_confidence": 0.91,
  "within_printer_constraints": true
}
```

Ask Jev several **typed questions in one request**.

---

## Jev Question 1

### Is the recommended correction acceptable?

Choices:

```text
APPROVE_RECOMMENDATION
REQUEST_REVIEW
ESCALATE
```

---

## Jev Question 2

### Is the correction likely to resolve the observed shade difference through printer adjustment alone?

```text
YES
NO
```

---

## Jev Question 3

### Does this case require human review?

```text
YES
NO
```

---

## Jev Question 4

### Confidence

Use a score/rating.

---

# 11. Critical Jev Rule

### Never let Jev directly modify printer parameters.

Jev can say:

```text
APPROVE
REVIEW
ESCALATE
```

but the numerical recommendation remains the responsibility of:

**Calibration + optimization engine.**

This prevents the system architecture from becoming:

> “AI hallucinated a printer setting.”

---

# 12. Human-in-the-loop

The QC operator receives:

```text
MASTER
L* 70
a* 5
b* 20
Gloss 82
```

versus:

```text
CURRENT
L* 67
a* 6
b* 17
Gloss 77
```

Then:

### Diagnosis

```text
ΔE00: 2.9
ΔGloss: -5
Status: OUT OF TOLERANCE
```

### Recommendation

```text
Brown   +3.4%
Yellow  +0.8%
Black   -0.2%
```

### Prediction

```text
Predicted ΔE00: 0.82
Predicted ΔGloss: -0.7
```

### Jev

```text
Recommendation confidence: 0.94
Action: QC REVIEW
```

Then:

**[ Approve Correction ]**

**[ Reject ]**

**[ Escalate ]**

The QC person is no longer guessing the correction; they are reviewing an evidence-based recommendation.

---

# 13. Verification Loop

After QC approval:

```text
Generate revised printer reference
        ↓
Print verification sample
        ↓
Fire sample
        ↓
Measure
        ↓
Calculate final ΔE00/Gloss
```

Then:

```text
PASS
```

or:

```text
FAIL
```

---

# 14. Batch Release Logic

### PASS

If:

```text
ΔE00 <= configured threshold
AND
|ΔGloss| <= configured threshold
```

then:

```text
BATCH APPROVED
```

### FAIL

Return to:

```text
Correction Engine
```

but cap iterations.

For MVP:

```text
Maximum correction loops = 2
```

After two failed attempts:

> **Escalate to QC/Process Engineer**

This is important because not every shade problem necessarily originates in the printer; raw materials and kiln conditions can contribute.

---

# 15. Important Exception Case

Build a clear example where printer correction **cannot** solve the problem.

Example:

```text
ΔE00 = 2.7
ΔGloss = -9
```

Optimizer discovers:

```text
Best possible printer correction:

ΔE00 = 1.1
ΔGloss = -7.5
```

Still outside tolerance.

System says:

> ⚠️ **Printer correction insufficient**

> Color can be brought closer through printer adjustment, but gloss remains outside tolerance. Escalate for process investigation.

This demonstrates that the system is allowed to say **“printer correction is insufficient”** rather than always fabricating an answer.

---

# 16. Dashboard

Create a professional plant QC dashboard.

### KPI cards

```text
Active Batch
SKU
Current ΔE00
Correction Time
Iterations
Status
```

Example:

```text
─────────────────────────────────────────
BATCH B2026-104

ΔE00             2.9
Target            <1.0

Correction time   00:03:42
Previous process  ~6–7 hours

Iterations        1

STATUS            QC REVIEW
─────────────────────────────────────────
```

---

# 17. Before vs After View

This should be visually prominent.

### Current workflow

```text
6–7 hours
6–7 variants
Repeated firing
Visual judgment
Production exposure
```

### Proposed workflow

```text
Measurement
     ↓
Correction
     ↓
QC approval
     ↓
Verification

Target: minutes
```

Treat the customer's 5–6 minute target as an aspiration to validate, not a guaranteed production result.

---

# 18. Master Versioning

Implement:

```text
SKU-101
 ├── Master v1 — 2021
 ├── Master v2 — 2024
 └── Master v3 — 2026 CURRENT
```

Each master has:

```text
LAB
Gloss
Tolerance
Approval status
Created date
```

A production run cannot use an unapproved master.

This addresses the client's concern about old references drifting over time.

---

# 19. Audit Log

Every correction should generate:

```text
Timestamp
User
SKU
Batch
Master Version
Previous Printer File
Measured Values
Recommended Correction
Jev Decision
QC Decision
Final Measurement
Final Status
```

Example:

```text
B2026-104

Master: v3
Initial ΔE00: 2.9

System:
Brown +3.4%
Yellow +0.8%
Black -0.2%

Jev:
APPROVE_RECOMMENDATION
Confidence: 0.94

QC:
APPROVED

Final ΔE00:
0.81

Result:
PASS
```

This is valuable for manufacturing traceability.

---

# 20. Prototype Page Structure

Build **5 primary pages**.

## Page 1 — Dashboard

Overview of current production/batch status.

---

## Page 2 — New Batch

```text
Select SKU
Select Master Version
Select Printer
Enter/import production measurement
```

Button:

**Analyze Sample**

---

## Page 3 — Analysis

Show:

- Master vs Current
- LAB values
- ΔE
- Gloss
- Deviation diagnosis
- Candidate corrections
- Jev decision

---

## Page 4 — QC Approval

Show:

> Recommended change

Then:

**Approve**

**Reject**

**Escalate**

---

## Page 5 — Batch History

Historical:

```text
SKU
Batch
Correction time
Iterations
Initial ΔE
Final ΔE
Status
```

Add a simple chart:

**Manual correction time vs ShadePilot correction time**

---

# 21. Demo Mode

This is mandatory.

Because we don't have real client measurements, the application must include:

## **Demo Scenario**

Preset:

```text
SKU: CER-1001
Printer: PRINTER-UAE-01
Master: MASTER-V3

Current:
L = 67
a = 6
b = 17
Gloss = 77
```

Click:

**Analyze**

and the entire workflow executes.

---

# 22. Synthetic Calibration Dataset

Create a seed dataset of perhaps:

**500–2,000 synthetic observations**

with realistic relationships.

Store:

```text
printer_id
sku_family
channel values
LAB output
gloss output
```

Use it to train a simple model.

### MVP model

Use:

**Random Forest / Gradient Boosting regression**

for each output:

```text
L
a
b
Gloss
```

Then optimize input channels.

Clearly label it:

> **Prototype model trained on synthetic calibration data. Real deployment requires plant-specific calibration data.**

---

# 23. Production Architecture

```text
                    WEB APP
                       │
                       ▼
                API / Backend
                       │
        ┌──────────────┼─────────────┐
        │              │             │
        ▼              ▼             ▼
  Color Engine    Calibration      Batch DB
                 / ML Model
                       │
                       ▼
                Optimization
                       │
                       ▼
                    JEV API
                       │
                       ▼
               Decision Layer
                       │
                       ▼
                   QC Review
                       │
                       ▼
              Revised Printer Config
```

---

# 24. Hardware Strategy

### MVP

Use existing:

**Spectrophotometer**

+

**Existing printer**

+

**Existing kiln**

No mandatory new hardware.

The client already has lab spectrophotometers.

### Future

Optional:

```text
Production optical measurement station
```

Potentially using:

- spectrophotometric sensor
- controlled illumination
- camera/optical system
- edge computer

But only introduce this after proving the software/correction model.

This should explicitly appear under:

### Future Phase / Not MVP

---

# 25. What We Deliberately Do NOT Build

### Not building in MVP:

**Continuous camera inspection**

Because the client says the relevant trigger is batch change, not every tile.

**Automated kiln root-cause diagnosis**

Outside current scope.

**Fully autonomous printer control**

QC approval remains mandatory.

**Replacing the spectrophotometer**

Existing equipment is used for the pilot.

**LLM-driven color correction**

Not appropriate for deterministic physical calibration.

---

# 26. Technical Safety Rules

### Rule 1

Never recommend corrections outside configured channel limits.

### Rule 2

Never approve a correction if predicted error is outside tolerance.

### Rule 3

Never allow Jev to change numerical printer values.

### Rule 4

Low-confidence Jev decision → human review.

### Rule 5

Failed verification → no batch release.

### Rule 6

Two unsuccessful correction loops → escalation.

### Rule 7

Every correction must be logged.

---

# 27. Jev Integration

TypeSafe's current API supports structured state and typed decision questions.

### Recommended server-side implementation

Never expose the Jev API key to the browser.

```text
Browser
  ↓
Our Backend
  ↓
TypeSafe API
```

Use a server-side Jev client.

---

# 28. UI Design Direction

This should look like **industrial QC software**, not a generic AI startup dashboard.

Use:

```text
Light background
Dense but clean information hierarchy
Technical tables
Status badges
Measurement cards
Charts
Minimal animations
```

Avoid:

- giant "AI" graphics
- chatbot UI
- unnecessary futuristic visuals
- excessive gradients
- random AI jargon

The evaluator should immediately understand:

> **This is manufacturing quality-control software.**

---

# 29. Killer Demo Flow

Your evaluator should be able to click this in under 2 minutes:

### Step 1

Select:

```text
SKU-1001
Master V3
Printer P01
```

### Step 2

Click:

**Load Demo Sample**

### Step 3

System shows:

```text
ΔE00 = 2.9
OUT OF TOLERANCE
```

### Step 4

Click:

**Generate Correction**

### Step 5

Show:

```text
Brown +3.4%
Yellow +0.8%
Black -0.2%
```

### Step 6

Show:

```text
Predicted ΔE00 = 0.82
Jev confidence = 94%

Decision:
QC REVIEW
```

### Step 7

Click:

**Approve**

### Step 8

System creates:

```text
Printer Reference V4
```

### Step 9

Click:

**Simulate Verification**

### Step 10

Show:

```text
Final ΔE00 = 0.81
Gloss within tolerance

✓ BATCH APPROVED
```

---

# 30. Final Value Screen

At the end:

```text
────────────────────────────────

SHADEPILOT RESULT

Manual process       ~6–7 hours
Prototype workflow   3m 48s

Iterations            1
Final ΔE00            0.81
Batch status          APPROVED

Estimated time saved
≈ 6.4 hours

────────────────────────────────
```

Important: call this a **prototype/demo result**, not a real production claim.

---

# 31. Future Hardware Roadmap

Show a small roadmap:

### Phase 1

```text
Existing lab spectrophotometer
+
Software
+
Jev
```

### Phase 2

```text
Production measurement station
```

### Phase 3

```text
Direct printer integration
```

### Phase 4

```text
Multi-plant calibration platform
```

---

# 32. What the Vibe Coder Must NOT Fake

Do not claim actual spectrophotometer integration, printer integration, or production accuracy unless implemented with real hardware/data.

Use clearly labeled synthetic/demo adapters.

For example:

```text
SpectrophotometerAdapter
    ├── DemoSpectrophotometer
    └── FutureRealSpectrophotometer
```

and:

```text
PrinterAdapter
    ├── SimulatedPrinter
    └── FutureOEMPrinter
```

This makes the architecture production-minded without pretending that the prototype is connected to a factory.

---

# 33. Recommended Repository Structure

```text
shadepilot/
│
├── app/
│   ├── dashboard/
│   ├── batches/
│   ├── analysis/
│   ├── qc/
│   └── history/
│
├── components/
│   ├── ColorComparison.tsx
│   ├── CorrectionRecommendation.tsx
│   ├── JevDecisionCard.tsx
│   ├── QCApproval.tsx
│   └── BatchStatus.tsx
│
├── lib/
│   ├── color/
│   │   ├── lab.ts
│   │   ├── deltaE.ts
│   │   └── gloss.ts
│   │
│   ├── calibration/
│   │   ├── model.ts
│   │   └── optimizer.ts
│   │
│   ├── jev/
│   │   └── client.ts
│   │
│   └── simulation/
│       └── demoData.ts
│
├── prisma/
│   └── schema.prisma
│
├── scripts/
│   └── seedCalibrationData.ts
│
├── .env.example
├── README.md
└── package.json
```

---

# 34. Database Tables

Minimum:

### `masters`

```text
id
sku
version
L
a
b
gloss
delta_e_tolerance
gloss_tolerance
approved
created_at
```

### `batches`

```text
id
batch_number
sku
master_id
printer_id
status
created_at
completed_at
```

### `measurements`

```text
id
batch_id
type
L
a
b
gloss
delta_e00
created_at
```

### `corrections`

```text
id
batch_id
brown_delta
yellow_delta
black_delta
red_delta
blue_delta
other_delta
predicted_delta_e00
predicted_gloss
confidence
status
created_at
```

### `jev_decisions`

```text
id
batch_id
decision
confidence
probabilities
model
created_at
```

### `audit_logs`

```text
id
batch_id
event
actor
metadata
created_at
```

---

# 35. Acceptance Criteria

The prototype is complete when:

### Functional

- User can create/select a master.
- User can create a batch.
- User can input production LAB/Gloss.
- System calculates ΔL/Δa/Δb/ΔE00/ΔGloss.
- System generates correction candidates.
- System predicts post-correction error.
- Jev provides a structured decision.
- QC can approve/reject/escalate.
- System generates a simulated revised printer reference.
- Verification can be simulated.
- Batch can reach PASS/FAIL.
- History is recorded.

### Safety

- Jev key is server-side.
- No correction exceeds limits.
- Low confidence causes review.
- Failed verification prevents release.
- Demo data is clearly labelled synthetic.

### Presentation

- Full workflow can be demonstrated in under 2 minutes.
- No manual code manipulation required.
- No fake external hardware integrations.

---

# 36. Environment Variables

### Required for Jev

```env
TYPESAFE_API_KEY=your_api_key_here
TYPESAFE_BASE_URL=https://api.typesafe.ai
TYPESAFE_MODEL=jev-latest
```

### Database

```env
DATABASE_URL=your_postgres_connection_string
```

### Optional

```env
NEXT_PUBLIC_APP_NAME=ShadePilot
```

### Do NOT put:

```env
NEXT_PUBLIC_TYPESAFE_API_KEY=...
```

The Jev key must remain server-side.

---

# 37. Build Without Jev Failure

If Jev isn't configured, the application must still work.

### Fallback

```text
Jev unavailable
      ↓
Deterministic safety rules
      ↓
Require QC approval
```

UI should show:

> **Jev unavailable — operating in rule-based review mode.**

This makes the demo robust.

---

# 38. One-Line Architecture Rule for the Vibe Coder

> **Never use Jev to calculate numeric printer corrections. Numeric corrections must come from the calibration/optimization engine; Jev only makes structured confidence/approval/escalation decisions over those candidates.**

This is the core architecture constraint.

---

# 39. Final System Architecture

```text
                    MASTER TILE
                         │
                         ▼
                TARGET LAB + GLOSS
                         │
                         │
                 PRODUCTION SAMPLE
                         │
                         ▼
                 SPECTROPHOTOMETER
                         │
                         ▼
              ┌─────────────────────┐
              │  COLOR SCIENCE      │
              │ ΔL Δa Δb ΔE00 Gloss │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ PRINTER RESPONSE    │
              │ CALIBRATION MODEL   │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ OPTIMIZATION ENGINE │
              │ Candidate fixes     │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │        JEV          │
              │ ACT / REVIEW /      │
              │ ESCALATE + CONF.    │
              └──────────┬──────────┘
                         ▼
                    HUMAN QC
                   /    │     \
              APPROVE REJECT ESCALATE
                  │
                  ▼
           REVISED PRINTER FILE
                  │
                  ▼
            VERIFICATION SAMPLE
                  │
                  ▼
              MEASUREMENT
                  │
                  ▼
            PASS / FAIL
             │       │
             ▼       └──► CORRECTION
       RELEASE BATCH
```

---

# 40. Product Summary

**ShadePilot is a software-led, hardware-compatible closed-loop shade correction system.**

### Input

**Master tile + measured production sample + printer reference**

### Intelligence

**Color science + printer calibration + regression/optimization + Jev decision layer**

### Human

**QC reviews and approves the correction**

### Output

**Actionable printer-input correction + verification result + batch release decision**

### MVP hardware

**Existing spectrophotometer, printer and kiln**

### Future

**Production-grade optical measurement station + direct printer integration + plant-specific ML calibration**

The system should be presented as a **prototype that proves the workflow and decision architecture**, not as a production-certified industrial control system.

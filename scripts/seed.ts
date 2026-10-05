import { PrismaClient } from '@prisma/client';
import { generateSyntheticCalibrationObservations } from '../lib/calibration/syntheticData';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding ShadePilot Database ---');

  // 1. Clear existing seed data if needed
  await prisma.auditLog.deleteMany({});
  await prisma.jevDecision.deleteMany({});
  await prisma.correction.deleteMany({});
  await prisma.measurement.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.master.deleteMany({});
  await prisma.calibrationObservation.deleteMany({});

  console.log('Cleared previous database entries.');

  // 2. Seed Master Tiles (with Versioning)
  const masterV1 = await prisma.master.create({
    data: {
      sku: 'CER-1001',
      version: 'V1',
      l: 69.0,
      a: 5.2,
      b: 19.5,
      gloss: 80.0,
      deltaETolerance: 1.0,
      glossTolerance: 2.0,
      approved: false, // Old reference - deprecated
      approvedBy: 'Archived Reference',
      associatedPrinterProfile: 'PRINTER-UAE-01-LEGACY-V1',
    },
  });

  const masterV2 = await prisma.master.create({
    data: {
      sku: 'CER-1001',
      version: 'V2',
      l: 69.5,
      a: 5.1,
      b: 19.8,
      gloss: 81.0,
      deltaETolerance: 1.0,
      glossTolerance: 2.0,
      approved: false, // Draft reference
      approvedBy: 'Pending Laboratory Review',
      associatedPrinterProfile: 'PRINTER-UAE-01-DRAFT-V2',
    },
  });

  // Approved Master V3 (PRD Section 21 Demo Scenario Target)
  const masterV3 = await prisma.master.create({
    data: {
      sku: 'CER-1001',
      version: 'V3',
      l: 70.0,
      a: 5.0,
      b: 20.0,
      gloss: 82.0,
      deltaETolerance: 1.0,
      glossTolerance: 2.0,
      approved: true, // CURRENT APPROVED MASTER
      approvedBy: 'QC-Lead-S.Vance',
      approvedDate: new Date('2026-01-15T08:30:00Z'),
      associatedPrinterProfile: 'PRINTER-UAE-01-ICC-V3',
    },
  });

  const masterWhite = await prisma.master.create({
    data: {
      sku: 'CER-2004',
      version: 'V1',
      l: 88.5,
      a: -0.8,
      b: 2.4,
      gloss: 90.0,
      deltaETolerance: 0.8,
      glossTolerance: 2.0,
      approved: true,
      approvedBy: 'QC-Lead-M.Chen',
      approvedDate: new Date('2026-02-01T10:00:00Z'),
      associatedPrinterProfile: 'PRINTER-UAE-02-ICC-V1',
    },
  });

  const masterGrey = await prisma.master.create({
    data: {
      sku: 'CER-3008',
      version: 'V1',
      l: 52.0,
      a: 0.2,
      b: -1.5,
      gloss: 45.0,
      deltaETolerance: 1.2,
      glossTolerance: 3.0,
      approved: true,
      approvedBy: 'QC-Lead-S.Vance',
      approvedDate: new Date('2026-02-10T09:15:00Z'),
      associatedPrinterProfile: 'PRINTER-UAE-01-ICC-V1',
    },
  });

  console.log('Seeded Master Tiles: CER-1001 (V1, V2, V3 approved), CER-2004, CER-3008');

  // 3. Seed Synthetic Calibration Dataset (PRD Section 7 & 22)
  const observations = generateSyntheticCalibrationObservations(600);
  await prisma.calibrationObservation.createMany({
    data: observations,
  });
  console.log(`Seeded ${observations.length} synthetic calibration observations (Demo calibration data — synthetic)`);

  // 4. Seed Historical Batches for Realistic Production Dashboard
  // Batch 1: Completed & Released
  const b1 = await prisma.batch.create({
    data: {
      batchNumber: 'B2026-098',
      sku: 'CER-1001',
      masterId: masterV3.id,
      printerId: 'PRINTER-UAE-01',
      status: 'RELEASED',
      currentLoop: 1,
      maxLoops: 2,
      revisedPrinterReference: 'PRINTER-UAE-01-REF-V4',
      createdAt: new Date('2026-10-04T09:00:00Z'),
      completedAt: new Date('2026-10-04T09:03:15Z'),
    },
  });

  await prisma.measurement.create({
    data: {
      batchId: b1.id,
      type: 'PRODUCTION_INITIAL',
      l: 67.2,
      a: 5.9,
      b: 17.2,
      gloss: 77.2,
      deltaL: -2.8,
      deltaA: 0.9,
      deltaB: -2.8,
      deltaE76: 4.06,
      deltaE00: 2.85,
      deltaGloss: -4.8,
      pass: false,
    },
  });

  await prisma.correction.create({
    data: {
      batchId: b1.id,
      iteration: 1,
      rank: 1,
      isRecommended: true,
      brownDelta: 3.4,
      yellowDelta: 0.8,
      blackDelta: -0.2,
      redDelta: 0.0,
      blueDelta: 0.0,
      otherDelta: 0.0,
      predictedDeltaE00: 0.82,
      predictedDeltaGloss: -0.7,
      predictedGloss: 81.3,
      confidence: 0.94,
      status: 'APPLIED',
    },
  });

  await prisma.jevDecision.create({
    data: {
      batchId: b1.id,
      iteration: 1,
      decision: 'APPROVE_RECOMMENDATION',
      confidence: 0.94,
      model: 'deterministic-rules-v1.0 (Fallback)',
      requiresHumanReview: true,
      resolvableByPrinterAlone: true,
      explanation: 'Candidate correction is within safe printer channel bounds (±5%), predicted ΔE00 is 0.82 (<= 1.0). Ready for QC approval.',
      isFallback: true,
    },
  });

  await prisma.measurement.create({
    data: {
      batchId: b1.id,
      type: 'VERIFICATION_SAMPLE',
      iteration: 1,
      l: 69.8,
      a: 5.1,
      b: 19.6,
      gloss: 81.5,
      deltaL: -0.2,
      deltaA: 0.1,
      deltaB: -0.4,
      deltaE76: 0.46,
      deltaE00: 0.72,
      deltaGloss: -0.5,
      pass: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      batchId: b1.id,
      event: 'BATCH_RELEASED',
      actor: 'QC_OPERATOR_VANCE',
      metadata: JSON.stringify({
        batchNumber: 'B2026-098',
        finalDeltaE00: 0.72,
        finalDeltaGloss: -0.5,
        revisedReference: 'PRINTER-UAE-01-REF-V4',
        durationSeconds: 195,
      }),
    },
  });

  // Batch 2: White Porcelain Completed & Released
  const b2 = await prisma.batch.create({
    data: {
      batchNumber: 'B2026-099',
      sku: 'CER-2004',
      masterId: masterWhite.id,
      printerId: 'PRINTER-UAE-02',
      status: 'RELEASED',
      currentLoop: 1,
      maxLoops: 2,
      revisedPrinterReference: 'PRINTER-UAE-02-REF-V2',
      createdAt: new Date('2026-10-04T13:20:00Z'),
      completedAt: new Date('2026-10-04T13:22:45Z'),
    },
  });

  await prisma.measurement.create({
    data: {
      batchId: b2.id,
      type: 'PRODUCTION_INITIAL',
      l: 87.0,
      a: -0.5,
      b: 3.5,
      gloss: 88.5,
      deltaL: -1.5,
      deltaA: 0.3,
      deltaB: 1.1,
      deltaE76: 1.88,
      deltaE00: 1.85,
      deltaGloss: -1.5,
      pass: false,
    },
  });

  await prisma.measurement.create({
    data: {
      batchId: b2.id,
      type: 'VERIFICATION_SAMPLE',
      iteration: 1,
      l: 88.4,
      a: -0.7,
      b: 2.5,
      gloss: 89.8,
      deltaL: -0.1,
      deltaA: 0.1,
      deltaB: 0.1,
      deltaE76: 0.17,
      deltaE00: 0.65,
      deltaGloss: -0.2,
      pass: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      batchId: b2.id,
      event: 'BATCH_RELEASED',
      actor: 'QC_OPERATOR_CHEN',
      metadata: JSON.stringify({
        batchNumber: 'B2026-099',
        finalDeltaE00: 0.65,
        finalDeltaGloss: -0.2,
        durationSeconds: 165,
      }),
    },
  });

  // Batch 3: Escalated Exception Case (PRD Section 15)
  const b3 = await prisma.batch.create({
    data: {
      batchNumber: 'B2026-102',
      sku: 'CER-3008',
      masterId: masterGrey.id,
      printerId: 'PRINTER-UAE-01',
      status: 'ESCALATED',
      currentLoop: 2,
      maxLoops: 2,
      createdAt: new Date('2026-10-05T07:15:00Z'),
      completedAt: new Date('2026-10-05T07:21:10Z'),
    },
  });

  await prisma.measurement.create({
    data: {
      batchId: b3.id,
      type: 'PRODUCTION_INITIAL',
      l: 54.8,
      a: 1.8,
      b: -3.8,
      gloss: 36.0,
      deltaL: 2.8,
      deltaA: 1.6,
      deltaB: -2.3,
      deltaE76: 3.96,
      deltaE00: 3.82,
      deltaGloss: -9.0, // Gloss anomaly outside printer correction reach
      pass: false,
    },
  });

  await prisma.jevDecision.create({
    data: {
      batchId: b3.id,
      iteration: 2,
      decision: 'ESCALATE',
      confidence: 0.96,
      model: 'deterministic-rules-v1.0 (Fallback)',
      requiresHumanReview: true,
      resolvableByPrinterAlone: false,
      explanation: 'Printer correction insufficient — gloss remains outside tolerance (-9.0 GU). Escalate for process/kiln investigation.',
      isFallback: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      batchId: b3.id,
      event: 'BATCH_ESCALATED',
      actor: 'QC_LEAD_VANCE',
      metadata: JSON.stringify({
        batchNumber: 'B2026-102',
        reason: 'Printer correction insufficient — gloss deviation (-9.0 GU) cannot be recovered by inkjet channels alone. Glaze slip density check ordered.',
      }),
    },
  });

  console.log('Seeded historical batches B2026-098 (RELEASED), B2026-099 (RELEASED), and B2026-102 (ESCALATED)');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

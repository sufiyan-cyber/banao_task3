import { prisma } from '../prisma';

export interface AuditEventData {
  batchId?: string;
  event: string;
  actor: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(data: AuditEventData) {
  try {
    return await prisma.auditLog.create({
      data: {
        batchId: data.batchId,
        event: data.event,
        actor: data.actor || 'QC_OPERATOR',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (err: any) {
    console.error('Failed to write audit log:', err.message);
    return null;
  }
}

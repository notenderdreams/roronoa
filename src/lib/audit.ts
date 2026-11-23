import type { Prisma } from "@/generated/prisma/client";

export interface LogAuditParams {
  actorId: string;
  action: string;
  entityId: string;
}

/**
 * Creates an AuditEvent record inside an active Prisma transaction.
 */
export async function logAuditEvent(tx: Prisma.TransactionClient, params: LogAuditParams) {
  return tx.auditEvent.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityId: params.entityId,
    },
  });
}

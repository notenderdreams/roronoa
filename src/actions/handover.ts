"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { confirmHandoverSchema, type ConfirmHandoverInput } from "@/lib/schemas";
import { logAuditEvent } from "@/lib/audit";

export async function confirmHandover(input: ConfirmHandoverInput) {
  // 1. Authorization guard
  const admin = await requireAdmin();

  // 2. Validate input schema
  const parsed = confirmHandoverSchema.parse(input);

  // 3. Perform database mutation and audit log inside single transaction
  const updatedReport = await db.$transaction(async (tx) => {
    const report = await tx.foundReport.findUnique({
      where: { reportId: parsed.reportId },
    });

    if (!report) {
      throw new Error(`Report "${parsed.reportId}" was not found.`);
    }

    if (report.status !== "PENDING_HANDOVER") {
      throw new Error(
        `Report "${parsed.reportId}" is already ${report.status.replace("_", " ").toLowerCase()}.`,
      );
    }

    const now = new Date();
    const updated = await tx.foundReport.update({
      where: { id: report.id },
      data: {
        status: "IN_CUSTODY",
        handedOverAt: now,
        confirmedById: admin.id,
      },
    });

    await logAuditEvent(tx, {
      actorId: admin.id,
      action: "HANDOVER_CONFIRMED",
      entityId: report.id,
    });

    return updated;
  });

  // 4. Revalidate pages
  revalidatePath("/admin/handovers");
  revalidatePath("/admin/inventory");
  revalidatePath("/");

  // 5. Return compact result
  return {
    success: true,
    reportId: updatedReport.reportId,
    status: updatedReport.status,
    handedOverAt: updatedReport.handedOverAt?.toISOString(),
  };
}

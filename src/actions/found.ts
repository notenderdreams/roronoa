"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { foundReportInputSchema } from "@/lib/found-schema";
import { assertFoundImageExists } from "@/lib/storage";

export type CreateFoundReportResult =
  { success: true; reportId: string } | { success: false; error: string };

export async function createFoundReport(input: unknown): Promise<CreateFoundReportResult> {
  const user = await requireUser();
  const parsed = foundReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid report details" };
  }

  const data = parsed.data;
  if (data.imageKey) {
    const expectedPrefix = `found/${user.id}/`;
    if (!data.imageKey.startsWith(expectedPrefix)) {
      return { success: false, error: "Invalid image reference" };
    }
    try {
      await assertFoundImageExists(data.imageKey);
    } catch {
      return {
        success: false,
        error: "The uploaded image could not be verified. Please upload it again.",
      };
    }
  }

  try {
    const reportId = await db.$transaction(async (tx) => {
      const [counter] = await tx.$queryRaw<Array<{ value: bigint; year: number }>>`
        SELECT
          nextval('found_report_number_seq') AS value,
          EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::int AS year
      `;

      const publicId = `LF-${counter.year}-${counter.value.toString().padStart(6, "0")}`;
      const report = await tx.foundReport.create({
        data: {
          reportId: publicId,
          itemName: data.itemName,
          itemCategory: data.itemCategory,
          itemDescription: data.itemDescription || null,
          latitude: data.latitude,
          longitude: data.longitude,
          locationLabel: data.locationLabel || null,
          foundAt: new Date(data.foundAt),
          imageKey: data.imageKey || null,
          founderId: user.id,
          status: "PENDING_HANDOVER",
        },
        select: { id: true, reportId: true },
      });

      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "FOUND_REPORT_SUBMITTED",
          entityId: report.id,
        },
      });

      return report.reportId;
    });

    revalidatePath("/my-reports");
    return { success: true, reportId };
  } catch (error) {
    console.error("Found report submission failed", error);
    return { success: false, error: "Could not submit the report. Please try again." };
  }
}

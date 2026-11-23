import { db } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { getFoundImageUrl } from "@/lib/storage";

export async function getMyFoundReports() {
  const user = await requireUser();
  const reports = await db.foundReport.findMany({
    where: { founderId: user.id },
    orderBy: { submissionAt: "desc" },
    select: {
      id: true,
      reportId: true,
      itemName: true,
      itemCategory: true,
      itemDescription: true,
      latitude: true,
      longitude: true,
      locationLabel: true,
      foundAt: true,
      imageKey: true,
      status: true,
      submissionAt: true,
    },
  });

  return Promise.all(reports.map(async (report) => ({
    ...report,
    imageUrl: report.imageKey ? await getFoundImageUrl(report.imageKey) : null,
  })));
}

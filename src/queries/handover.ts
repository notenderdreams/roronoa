import { db } from "@/lib/db";
import { getPresignedViewUrl } from "@/lib/storage";

export async function getPendingHandovers(params?: { search?: string; category?: string }) {
  const where: Record<string, unknown> = {
    status: "PENDING_HANDOVER",
  };

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { reportId: { contains: s, mode: "insensitive" } },
      { name: { contains: s, mode: "insensitive" } },
      { location: { contains: s, mode: "insensitive" } },
      { finder: { studentId: { contains: s, mode: "insensitive" } } },
      { finder: { name: { contains: s, mode: "insensitive" } } },
    ];
  }

  const items = await db.foundReport.findMany({
    where,
    include: {
      finder: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      imageUrl: await getPresignedViewUrl(item.imageKey),
    })),
  );
}

export async function getFoundInventory(params?: { search?: string; category?: string }) {
  const where: Record<string, unknown> = {
    status: "IN_CUSTODY",
  };

  if (params?.category && params.category !== "ALL") {
    where.category = params.category;
  }

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { reportId: { contains: s, mode: "insensitive" } },
      { name: { contains: s, mode: "insensitive" } },
      { location: { contains: s, mode: "insensitive" } },
      { finder: { studentId: { contains: s, mode: "insensitive" } } },
    ];
  }

  const items = await db.foundReport.findMany({
    where,
    include: {
      finder: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
        },
      },
      confirmedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { handedOverAt: "desc" },
  });

  return Promise.all(
    items.map(async (item) => ({
      ...item,
      imageUrl: await getPresignedViewUrl(item.imageKey),
    })),
  );
}

export async function getFoundReportByReportId(reportId: string) {
  const item = await db.foundReport.findUnique({
    where: { reportId },
    include: {
      finder: {
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
        },
      },
      confirmedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!item) return null;

  return {
    ...item,
    imageUrl: await getPresignedViewUrl(item.imageKey),
  };
}

import { db } from "@/lib/db";

/**
 * Generates a human-readable unique report ID in the format LF-YYYY-000001
 * backed by a PostgreSQL sequence.
 */
export async function generateReportId(prefix = "LF"): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const result = await db.$queryRaw<{ nextval: bigint | number | string }[]>`
      SELECT nextval('found_report_seq') AS nextval
    `;
    const num = String(result[0].nextval).padStart(6, "0");
    return `${prefix}-${year}-${num}`;
  } catch {
    // If sequence does not exist, initialize it
    await db.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS found_report_seq START WITH 1;`);
    const result = await db.$queryRaw<{ nextval: bigint | number | string }[]>`
      SELECT nextval('found_report_seq') AS nextval
    `;
    const num = String(result[0].nextval).padStart(6, "0");
    return `${prefix}-${year}-${num}`;
  }
}

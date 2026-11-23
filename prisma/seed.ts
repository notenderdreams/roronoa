import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");

// Written straight to the DB so it bypasses the campus-domain sign-up hook.
let adminUser = await db.user.findUnique({ where: { email } });
if (adminUser) {
  console.log(`admin exists: ${email}`);
} else {
  const id = crypto.randomUUID();
  adminUser = await db.user.create({
    data: {
      id,
      name: "Admin",
      email,
      emailVerified: true,
      role: "admin",
      studentId: "ADMIN",
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  console.log(`admin created: ${email}`);
}

// Ensure sequence exists
await db.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS found_report_seq START WITH 10;`);

// Create a sample finder user
const finderEmail = "student@iut-dhaka.edu";
let finder = await db.user.findUnique({ where: { email: finderEmail } });
if (!finder) {
  const finderId = crypto.randomUUID();
  finder = await db.user.create({
    data: {
      id: finderId,
      name: "Tanzim Ahmed",
      email: finderEmail,
      emailVerified: true,
      role: "user",
      studentId: "210041234",
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: finderId,
          providerId: "credential",
          password: await hashPassword("password123"),
        },
      },
    },
  });
  console.log(`sample student created: ${finderEmail}`);
}

// Seed sample found reports for testing US-02
const samplePending1 = await db.foundReport.findUnique({ where: { reportId: "LF-2026-000001" } });
if (!samplePending1) {
  await db.foundReport.create({
    data: {
      reportId: "LF-2026-000001",
      name: "Black HP 65W Laptop Charger",
      category: "ELECTRONICS",
      description: "Original HP blue-pin laptop charger left on study table 4 near the window.",
      location: "Library 2nd Floor Study Room",
      foundAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      status: "PENDING_HANDOVER",
      finderId: finder.id,
    },
  });
  console.log("seeded pending handover: LF-2026-000001");
}

const samplePending2 = await db.foundReport.findUnique({ where: { reportId: "LF-2026-000002" } });
if (!samplePending2) {
  await db.foundReport.create({
    data: {
      reportId: "LF-2026-000002",
      name: "Set of 3 Keys with Red IUT Lanyard",
      category: "KEYS",
      description: "Room key and two smaller padlock keys attached to an official IUT lanyard.",
      location: "Cafeteria Main Counter",
      foundAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      status: "PENDING_HANDOVER",
      finderId: finder.id,
    },
  });
  console.log("seeded pending handover: LF-2026-000002");
}

const sampleInCustody = await db.foundReport.findUnique({ where: { reportId: "LF-2026-000003" } });
if (!sampleInCustody) {
  await db.foundReport.create({
    data: {
      reportId: "LF-2026-000003",
      name: "Casio Scientific Calculator fx-991EX",
      category: "ELECTRONICS",
      description:
        "ClassWiz scientific calculator with a small astronaut sticker on the back cover.",
      location: "Academic Building 2, Room 304",
      foundAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
      status: "IN_CUSTODY",
      finderId: finder.id,
      handedOverAt: new Date(Date.now() - 86400000 * 1 + 3600000),
      confirmedById: adminUser.id,
    },
  });
  console.log("seeded in-custody item: LF-2026-000003");
}
await db.$disconnect();

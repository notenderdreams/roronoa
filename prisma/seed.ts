import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");

// Written straight to the DB so it bypasses the campus-domain sign-up hook.
const existing = await db.user.findUnique({ where: { email } });
if (existing) {
  console.log(`admin exists: ${email}`);
} else {
  const id = crypto.randomUUID();
  await db.user.create({
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
await db.$disconnect();

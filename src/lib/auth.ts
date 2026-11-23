import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { CAMPUS_DOMAIN, isCampusEmail, studentIdSchema } from "@/lib/schemas";

// Dev shortcut: SKIP_EMAIL_VERIFICATION=true skips verification. Ignored in production.
const verifyEmail = !(process.env.SKIP_EMAIL_VERIFICATION === "true" && process.env.NODE_ENV !== "production");
if (!verifyEmail) console.warn("[auth] SKIP_EMAIL_VERIFICATION is on: emails are NOT verified");

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: verifyEmail,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: verifyEmail,
    sendOnSignIn: verifyEmail,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      sendMail(user.email, "Verify your Roronoa account", `Verify: ${url}`).catch((e) => console.error("mail failed:", e));
    },
  },
  user: {
    additionalFields: {
      studentId: { type: "string", required: true, unique: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Server-side enforcement; the form check is only for UX.
        before: async (user) => {
          if (!isCampusEmail(user.email))
            throw new APIError("BAD_REQUEST", {
              message: `Use your @${CAMPUS_DOMAIN} email`,
            });
          const id = studentIdSchema.safeParse((user as { studentId?: string }).studentId);
          if (!id.success)
            throw new APIError("BAD_REQUEST", { message: "Invalid student ID" });
          return { data: { ...user, studentId: id.data } };
        },
      },
    },
  },
  // defaults: roles "user" | "admin"; `role` cannot be set from sign-up input
  plugins: [admin(), nextCookies()],
});

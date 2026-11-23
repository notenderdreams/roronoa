import { z } from "zod";

export const CAMPUS_DOMAIN = "iut-dhaka.edu";

/** Exact-domain match: "x@iut-dhaka.edu.evil.com" and "iut-dhaka.edu@evil.com" fail. */
export function isCampusEmail(email: string) {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  return at > 0 && e.slice(at + 1) === CAMPUS_DOMAIN;
}

// TODO: confirm the real IUT student ID format and tighten this.
export const studentIdSchema = z
  .string()
  .trim()
  .regex(/^\d{6,12}$/, "Enter your student ID (digits only)");

const campusEmail = z
  .email("Enter a valid email")
  .refine(isCampusEmail, `Use your @${CAMPUS_DOMAIN} email`);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  studentId: studentIdSchema,
  email: campusEmail,
  password: z.string().min(8, "At least 8 characters").max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

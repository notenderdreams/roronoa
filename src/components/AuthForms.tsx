"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import {
  CAMPUS_DOMAIN,
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/schemas";

const input =
  "w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const button =
  "w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      {children}
      {error && <span className="block text-red-600">{error}</span>}
    </label>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });
  const e = formState.errors;

  async function onSubmit(data: RegisterInput) {
    setError(undefined);
    const { data: res, error } = await authClient.signUp.email(data);
    if (error) return setError(error.message ?? "Could not register");
    if (res?.token) {
      // verification skipped (dev): already signed in
      router.push("/");
      return router.refresh();
    }
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <Field label="Name" error={e.name?.message}>
        <input className={input} {...register("name")} />
      </Field>
      <Field label="Student ID" error={e.studentId?.message}>
        <input className={input} inputMode="numeric" {...register("studentId")} />
      </Field>
      <Field label="University email" error={e.email?.message}>
        <input
          className={input}
          type="email"
          placeholder={`you@${CAMPUS_DOMAIN}`}
          {...register("email")}
        />
      </Field>
      <Field label="Password" error={e.password?.message}>
        <input className={input} type="password" {...register("password")} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={button} disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating…" : "Register"}
      </button>
      <p className="text-sm">
        Have an account?{" "}
        <Link className="underline" href="/login">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  const e = formState.errors;

  async function onSubmit(data: LoginInput) {
    setError(undefined);
    const { error } = await authClient.signIn.email(data);
    if (error) {
      // 403 = email not verified; a fresh link was sent (sendOnSignIn)
      if (error.status === 403)
        return router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return setError(error.message ?? "Could not log in");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <Field label="Email" error={e.email?.message}>
        <input className={input} type="email" {...register("email")} />
      </Field>
      <Field label="Password" error={e.password?.message}>
        <input className={input} type="password" {...register("password")} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className={button} disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Logging in…" : "Log in"}
      </button>
      <p className="text-sm">
        New here?{" "}
        <Link className="underline" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="underline"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

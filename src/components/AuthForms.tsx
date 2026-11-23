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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Use your @{CAMPUS_DOMAIN} email.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!e.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" aria-invalid={!!e.name} {...register("name")} />
              <FieldError>{e.name?.message}</FieldError>
            </Field>
            <Field data-invalid={!!e.studentId}>
              <FieldLabel htmlFor="studentId">Student ID</FieldLabel>
              <Input
                id="studentId"
                inputMode="numeric"
                aria-invalid={!!e.studentId}
                {...register("studentId")}
              />
              <FieldError>{e.studentId?.message}</FieldError>
            </Field>
            <Field data-invalid={!!e.email}>
              <FieldLabel htmlFor="email">University email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={`you@${CAMPUS_DOMAIN}`}
                aria-invalid={!!e.email}
                {...register("email")}
              />
              <FieldError>{e.email?.message}</FieldError>
            </Field>
            <Field data-invalid={!!e.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                aria-invalid={!!e.password}
                {...register("password")}
              />
              <FieldError>{e.password?.message}</FieldError>
            </Field>
            <FieldError>{error}</FieldError>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-4 flex-col gap-3">
          <Button className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Creating…" : "Register"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Have an account?{" "}
            <Link className="underline" href="/login">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
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
    const { error } = await authClient.signIn.email({
      email: data.identifier,
      password: data.password,
    });
    if (error) {
      // 403 = email not verified; a fresh link was sent (sendOnSignIn)
      if (error.status === 403)
        return router.push(
          data.identifier.includes("@")
            ? `/verify-email?email=${encodeURIComponent(data.identifier)}`
            : "/verify-email",
        );
      return setError(error.message ?? "Could not log in");
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Welcome back to Roronoa.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!!e.identifier}>
              <FieldLabel htmlFor="identifier">Email, username or student ID</FieldLabel>
              <Input
                id="identifier"
                autoComplete="username"
                autoCapitalize="none"
                aria-invalid={!!e.identifier}
                {...register("identifier")}
              />
              <FieldError>{e.identifier?.message}</FieldError>
            </Field>
            <Field data-invalid={!!e.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                aria-invalid={!!e.password}
                {...register("password")}
              />
              <FieldError>{e.password?.message}</FieldError>
            </Field>
            <FieldError>{error}</FieldError>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-4 flex-col gap-3">
          <Button className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Logging in…" : "Log in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link className="underline" href="/register">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}

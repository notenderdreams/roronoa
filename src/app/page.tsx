import { Suspense } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/AuthForms";
import { getSession } from "@/lib/guards";

async function Who() {
  const session = await getSession();
  if (!session)
    return (
      <p className="space-x-4">
        <Link className="underline" href="/login">Log in</Link>
        <Link className="underline" href="/register">Register</Link>
      </p>
    );
  return (
    <>
      <p>
        Signed in as {session.user.name} ({session.user.email}), role: {session.user.role}
      </p>
      <SignOutButton />
    </>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">Roronoa</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <Who />
      </Suspense>
    </main>
  );
}

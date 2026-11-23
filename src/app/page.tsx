import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/AuthForms";
import { getSession } from "@/lib/guards";

async function Who() {
  const session = await getSession();
  if (!session)
    return (
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Register</Link>
        </Button>
      </div>
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

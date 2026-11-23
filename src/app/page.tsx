import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/AuthForms";
import { getSession } from "@/lib/guards";
import { db } from "@/lib/db";

async function AdminStats() {
  const [pending, inCustody, returned] = await Promise.all([
    db.foundReport.count({ where: { status: "PENDING_HANDOVER" } }),
    db.foundReport.count({ where: { status: "IN_CUSTODY" } }),
    db.foundReport.count({ where: { status: "RETURNED" } }),
  ]);

  return (
    <div className="grid grid-cols-3 gap-3 w-full text-center mt-2">
      <Link
        href="/admin/handovers"
        className="rounded-lg border bg-muted/40 p-3 hover:bg-muted/70 transition-colors"
      >
        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Pending</p>
      </Link>
      <Link
        href="/admin/inventory"
        className="rounded-lg border bg-muted/40 p-3 hover:bg-muted/70 transition-colors"
      >
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{inCustody}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">In Custody</p>
      </Link>
      <div className="rounded-lg border bg-muted/40 p-3">
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{returned}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Returned</p>
      </div>
    </div>
  );
}

async function Who() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">
          Please log in or create an account with your campus email to get started.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <p className="text-sm">
          Signed in as <strong>{session.user.name}</strong> ({session.user.email})
        </p>
        <Badge variant={isAdmin ? "default" : "secondary"}>{session.user.role || "user"}</Badge>
      </div>

      {isAdmin && (
        <Suspense fallback={<div className="h-16 w-full rounded-lg bg-muted/40 animate-pulse" />}>
          <AdminStats />
        </Suspense>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {isAdmin ? (
          <>
            <Button asChild>
              <Link href="/admin/handovers">Pending Handovers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/inventory">Found Inventory Feed</Link>
            </Button>
          </>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Student account active. Administrative custody features require an admin account.
          </p>
        )}

        <SignOutButton />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Roronoa</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Campus Lost &amp; Found Management System
        </p>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xs">
        <Suspense fallback={<p className="text-center text-sm">Loading session…</p>}>
          <Who />
        </Suspense>
      </div>
    </main>
  );
}

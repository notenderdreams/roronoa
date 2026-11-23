import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/AuthForms";
import { getSession } from "@/lib/guards";

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

import { Suspense } from "react";
import Link from "next/link";

async function Sent({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <p>
      We sent a verification link
      {email ? (
        <>
          {" "}
          to <b>{email}</b>
        </>
      ) : null}
      . Click it to activate your account, then log in.
    </p>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold">Check your inbox</h1>
        <Suspense fallback={<p>Loading…</p>}>
          <Sent searchParams={searchParams} />
        </Suspense>
        <Link className="underline" href="/login">
          Back to log in
        </Link>
      </div>
    </main>
  );
}

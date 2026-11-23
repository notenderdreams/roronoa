import { Suspense } from "react";
import { requireAdmin } from "@/lib/guards";
import { AdminNav } from "@/components/AdminNav";

async function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-muted/20">
      <AdminNav user={admin} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-sm text-muted-foreground">Checking authorization…</p>
      }
    >
      <ProtectedAdmin>{children}</ProtectedAdmin>
    </Suspense>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { getMyFoundReports } from "@/queries/found";

async function MyReportsContent() {
  const reports = await getMyFoundReports();
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Roronoa / Your activity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My found reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">Reports you have submitted and their handover status.</p>
        </div>
        <Link href="/found" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Report an item</Link>
      </div>

      {reports.length === 0 ? (
        <section className="mt-8 rounded-2xl border border-dashed p-10 text-center">
          <h2 className="font-medium">No reports yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Found something on campus? Submit your first report.</p>
          <Link href="/found" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Create a report</Link>
        </section>
      ) : (
        <div className="mt-8 space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{report.reportId}</p>
                  <h2 className="mt-1 text-lg font-semibold">{report.itemName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{report.itemCategory}</p>
                </div>
                <span className="rounded-full border px-3 py-1 text-xs font-medium">{report.status.replaceAll("_", " ")}</span>
              </div>
              {report.itemDescription && <p className="mt-3 text-sm leading-6">{report.itemDescription}</p>}
              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Found: {report.foundAt.toLocaleString()}</p>
                <p>Submitted: {report.submissionAt.toLocaleString()}</p>
                <p>Coordinates: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
                {report.locationLabel && <p>Location: {report.locationLabel}</p>}
              </div>
              {report.imageUrl && <a href={report.imageUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline underline-offset-4">View uploaded photo (private link)</a>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default function MyReportsPage() {
  return <Suspense fallback={<main className="mx-auto max-w-4xl p-8 text-sm text-muted-foreground">Loading your reports…</main>}><MyReportsContent /></Suspense>;
}

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Suspense } from "react";
import { getPendingHandovers } from "@/queries/handover";
import { requireAdmin } from "@/lib/guards";
import { ConfirmHandoverButton, QuickConfirmBar } from "@/components/HandoverActions";
import { HandoverFilters } from "@/components/HandoverFilters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

async function PendingHandoversContent({ searchParams }: PageProps) {
  await requireAdmin();
  const { search, category } = await searchParams;
  const items = await getPendingHandovers({ search, category });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Pending Physical Handovers</h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Items reported by campus finders awaiting physical receipt and verification at the
            administration office.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/inventory">View Confirmed Inventory →</Link>
        </Button>
      </div>

      {/* Quick confirm action bar */}
      <QuickConfirmBar />

      {/* Search and category filters */}
      <Suspense fallback={null}>
        <HandoverFilters basePath="/admin/handovers" />
      </Suspense>

      {/* Item List / Cards */}
      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-lg">No pending handovers</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search || (category && category !== "ALL")
              ? "No items match your active search filter. Try clearing your filters."
              : "All reported found items have either been confirmed into custody or no new items have been reported yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden">
              <div>
                {item.imageUrl ? (
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-muted/50 text-muted-foreground text-xs">
                    No image uploaded
                  </div>
                )}

                <CardHeader className="space-y-1.5 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-xs tracking-wide text-primary">
                      {item.reportId}
                    </span>
                    <Badge variant="outline" className="text-[11px] uppercase">
                      {item.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <h2 className="line-clamp-1 font-semibold text-base">{item.name}</h2>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <p className="line-clamp-2 text-muted-foreground">{item.description}</p>

                  <div className="space-y-1 rounded-md bg-muted/40 p-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Found at:</span>
                      <span className="font-medium text-foreground">{item.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Found date:</span>
                      <span className="font-medium text-foreground">
                        {new Date(item.foundAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Finder:</span>
                      <span className="font-medium text-foreground">
                        {item.finder.name} ({item.finder.studentId})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="border-t bg-muted/10 pt-3">
                <div className="flex w-full items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[11px]">
                    Pending Handover
                  </Badge>
                  <ConfirmHandoverButton reportId={item.reportId} itemName={item.name} />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PendingHandoversPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-muted-foreground">Loading pending handovers…</p>
      }
    >
      <PendingHandoversContent {...props} />
    </Suspense>
  );
}

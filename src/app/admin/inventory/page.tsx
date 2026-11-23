/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Suspense } from "react";
import { getFoundInventory } from "@/queries/handover";
import { requireAdmin } from "@/lib/guards";
import { HandoverFilters } from "@/components/HandoverFilters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

async function FoundInventoryContent({ searchParams }: PageProps) {
  await requireAdmin();
  const { search, category } = await searchParams;
  const items = await getFoundInventory({ search, category });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Found Items Inventory</h1>
            <Badge variant="default" className="font-mono text-xs">
              {items.length} in custody
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Official admin-only feed of found items in physical custody, verified and eligible for
            owner matching.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/handovers">← View Pending Handovers</Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={null}>
        <HandoverFilters basePath="/admin/inventory" />
      </Suspense>

      {/* Inventory table / cards */}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-lg">No confirmed items in inventory</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search || (category && category !== "ALL")
              ? "No items match your active search filters."
              : "When you confirm receipt of pending items, they will automatically appear here."}
          </p>
          <div className="mt-6">
            <Button asChild size="sm">
              <Link href="/admin/handovers">Go to Pending Handovers</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between overflow-hidden border-emerald-500/20"
            >
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
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-600 text-[11px] uppercase dark:text-emerald-400"
                    >
                      In Custody
                    </Badge>
                  </div>
                  <h2 className="line-clamp-1 font-semibold text-base">{item.name}</h2>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <p className="line-clamp-2 text-muted-foreground">{item.description}</p>

                  <div className="space-y-1 rounded-md bg-muted/40 p-2.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-foreground">
                        {item.category.replace(/_/g, " ")}
                      </span>
                    </div>
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
                    {item.handedOverAt && (
                      <div className="flex justify-between border-t border-muted pt-1">
                        <span className="text-muted-foreground">Handover confirmed:</span>
                        <span className="font-medium text-foreground">
                          {new Date(item.handedOverAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {item.confirmedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confirmed by:</span>
                        <span className="font-medium text-foreground">{item.confirmedBy.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoundInventoryPage(props: PageProps) {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-muted-foreground">Loading inventory…</p>}
    >
      <FoundInventoryContent {...props} />
    </Suspense>
  );
}

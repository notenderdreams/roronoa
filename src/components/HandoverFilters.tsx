"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ITEM_CATEGORIES } from "@/lib/schemas";

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Categories",
  ELECTRONICS: "Electronics",
  CARDS_AND_IDS: "Cards & IDs",
  KEYS: "Keys",
  BOOKS_AND_STATIONERY: "Books & Stationery",
  BAGS_AND_WALLETS: "Bags & Wallets",
  CLOTHING_AND_ACCESSORIES: "Clothing & Accessories",
  DOCUMENTS: "Documents",
  OTHER: "Other",
};

export function HandoverFilters({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "ALL";

  const [search, setSearch] = useState(currentSearch);

  function applyFilters(newSearch: string, newCategory: string) {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newCategory && newCategory !== "ALL") params.set("category", newCategory);

    startTransition(() => {
      const query = params.toString();
      router.push(query ? `${basePath}?${query}` : basePath);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters(search, currentCategory);
  }

  function handleCategoryChange(cat: string) {
    applyFilters(search, cat);
  }

  function handleReset() {
    setSearch("");
    startTransition(() => {
      router.push(basePath);
    });
  }

  const hasActiveFilters = Boolean(currentSearch || (currentCategory && currentCategory !== "ALL"));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
        <Input
          placeholder="Search by name, report ID, student ID, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-md text-sm"
          disabled={isPending}
        />
        <Button size="sm" type="submit" variant="secondary" disabled={isPending}>
          Search
        </Button>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={handleReset} type="button">
            Reset
          </Button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleCategoryChange("ALL")}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            currentCategory === "ALL"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {ITEM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              currentCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { confirmHandover, returnItem } from "@/actions/handover";

interface ConfirmHandoverButtonProps {
  reportId: string;
  itemName: string;
}

export function ConfirmHandoverButton({ reportId, itemName }: ConfirmHandoverButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (
      !confirm(
        `Confirm that you have physically received "${itemName}" (${reportId}) into administrative custody?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await confirmHandover({ reportId });
        if (res.success) {
          toast.success(`Handover confirmed! Report ${res.reportId} is now in custody.`);
        }
      } catch (err) {
        toast.error((err as Error).message || "Failed to confirm handover");
      }
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleConfirm}
      disabled={isPending}
      className="whitespace-nowrap font-medium"
    >
      {isPending ? "Confirming…" : "Confirm Receipt"}
    </Button>
  );
}

interface ReturnItemButtonProps {
  reportId: string;
  itemName: string;
}

export function ReturnItemButton({ reportId, itemName }: ReturnItemButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleReturn = () => {
    if (
      !confirm(`Mark "${itemName}" (${reportId}) as returned to its owner? This cannot be undone.`)
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await returnItem({ reportId });
        if (res.success) {
          toast.success(`Item ${res.reportId} marked as returned to owner.`);
        }
      } catch (err) {
        toast.error((err as Error).message || "Failed to mark item as returned.");
      }
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleReturn}
      disabled={isPending}
      className="whitespace-nowrap font-medium border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
    >
      {isPending ? "Marking…" : "Mark as Returned"}
    </Button>
  );
}

export function QuickConfirmBar() {
  const [reportIdInput, setReportIdInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = reportIdInput.trim().toUpperCase();
    if (!id) return;

    startTransition(async () => {
      try {
        const res = await confirmHandover({ reportId: id });
        if (res.success) {
          toast.success(`Handover confirmed! Report ${res.reportId} is now in custody.`);
          setReportIdInput("");
        }
      } catch (err) {
        toast.error((err as Error).message || "Could not confirm handover for this ID.");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex-1">
        <h3 className="font-semibold text-sm">Quick Confirm by Report ID</h3>
        <p className="text-muted-foreground text-xs">
          Directly confirm handover when a finder brings in an item with their report reference
          code.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          placeholder="e.g. LF-2026-000001"
          value={reportIdInput}
          onChange={(e) => setReportIdInput(e.target.value)}
          disabled={isPending}
          className="h-9 w-48 font-mono text-sm uppercase"
        />
        <Button size="sm" type="submit" disabled={isPending || !reportIdInput.trim()}>
          {isPending ? "Confirming…" : "Confirm"}
        </Button>
      </div>
    </form>
  );
}

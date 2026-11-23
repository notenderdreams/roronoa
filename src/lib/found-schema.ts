import { z } from "zod";
import { FOUND_ITEM_CATEGORIES } from "@/lib/found-categories";

/** Browser-submitted fields only. Identity, status and submission time are server-owned. */
export const foundReportInputSchema = z.object({
  itemName: z.string().trim().min(2, "Enter the item's name").max(120),
  itemCategory: z.enum(FOUND_ITEM_CATEGORIES, {
    error: "Choose a category from the list",
  }),
  itemDescription: z.string().trim().max(1000).optional().default(""),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  locationLabel: z.string().trim().max(200).optional().default(""),
  foundAt: z.iso.datetime({ message: "Choose when the item was found" }),
  imageKey: z.string().trim().max(500).optional(),
});

export type FoundReportInput = z.input<typeof foundReportInputSchema>;

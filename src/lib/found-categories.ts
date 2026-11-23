export const FOUND_ITEM_CATEGORIES = [
  "Electronics",
  "ID card / Student ID",
  "Books & Stationery",
  "Bags & Wallets",
  "Clothing & Accessories",
  "Keys",
  "Documents",
  "Other",
] as const;

export type FoundItemCategory = (typeof FOUND_ITEM_CATEGORIES)[number];

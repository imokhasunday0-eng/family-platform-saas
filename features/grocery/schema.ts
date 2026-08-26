import { z } from "zod";

export const groceryItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.string().optional(),
  category: z.string().optional(),
  store: z.string().optional(),
});

export type GroceryItemInput = z.infer<typeof groceryItemSchema>;

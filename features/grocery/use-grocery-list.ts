"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GroceryItemInput } from "./schema";

export function useGroceryList(listId: string) {
  const queryClient = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ["grocery", listId],
    queryFn: async () => {
      const res = await fetch(`/api/grocery/${listId}`);
      if (!res.ok) throw new Error("Failed to load grocery list");
      return res.json();
    },
  });

  const addItem = useMutation({
    mutationFn: async (input: GroceryItemInput) => {
      const res = await fetch(`/api/grocery/${listId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grocery", listId] });
    },
  });

  return { itemsQuery, addItem };
}

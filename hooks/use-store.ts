"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  StoreAPI,
  type StoreItem,
  type CreateItemData,
  type UpdateItemData,
  type PurchaseItemData,
} from "@/lib/store-api"
import { toast } from "@/hooks/use-toast"

// Hook to fetch all store items
export function useStoreItems() {
  return useQuery({
    queryKey: ["store-items"],
    queryFn: StoreAPI.fetchStoreItems,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new store item
export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemData) => StoreAPI.createItem(data),
    onSuccess: (newItem) => {
      // Invalidate and refetch store items list
      queryClient.invalidateQueries({ queryKey: ["store-items"] })

      toast({
        title: "Item Created",
        description: `${newItem.name} has been added to the store successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create store item.",
        variant: "destructive",
      })
    },
  })
}

// Hook to update an existing store item
export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemData }) => StoreAPI.updateItem(id, data),
    onSuccess: (updatedItem) => {
      // Invalidate and refetch store items list
      queryClient.invalidateQueries({ queryKey: ["store-items"] })

      // Also invalidate individual item if it exists
      queryClient.invalidateQueries({ queryKey: ["store-items", updatedItem.id] })

      toast({
        title: "Item Updated",
        description: `${updatedItem.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update store item.",
        variant: "destructive",
      })
    },
  })
}

// Hook to purchase an item
export function usePurchaseItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PurchaseItemData) => StoreAPI.purchaseItem(data),
    onSuccess: (purchase) => {
      // Invalidate store items to update availability/stock
      queryClient.invalidateQueries({ queryKey: ["store-items"] })

      // Invalidate purchase history
      queryClient.invalidateQueries({ queryKey: ["purchases"] })

      // Invalidate user's profile to update points balance
      queryClient.invalidateQueries({ queryKey: ["profile"] })

      // Invalidate students list to update points
      queryClient.invalidateQueries({ queryKey: ["students"] })

      toast({
        title: "Purchase Successful",
        description: `You've successfully purchased ${purchase.item.name} for ${purchase.points_spent} points!`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase item. Please check your points balance.",
        variant: "destructive",
      })
    },
  })
}

// Hook to fetch a single store item by ID
export function useStoreItem(id: string) {
  return useQuery({
    queryKey: ["store-items", id],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/items/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch store item: ${response.statusText}`)
      }
      return response.json() as Promise<StoreItem>
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch purchase history
export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: StoreAPI.fetchPurchases,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

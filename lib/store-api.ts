// Store API utilities for managing store items and purchases

export interface StoreItem {
  id: string
  name: string
  description: string
  points_cost: number
  available: boolean
  created_at: string
  updated_at: string
}

export interface CreateItemData {
  name: string
  description: string
  points_cost: number
  available?: boolean
}

export interface UpdateItemData {
  name?: string
  description?: string
  points_cost?: number
  available?: boolean
}

export interface PurchaseItemData {
  item_id: string
  student_id?: string // Optional if using current user context
}

export interface Purchase {
  id: string
  item_id: string
  student_id: string
  points_spent: number
  created_at: string
  item: StoreItem
  student: {
    id: string
    name: string
  }
}

export const StoreAPI = {
  // Fetch all store items
  async fetchStoreItems(): Promise<StoreItem[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/items`)
    if (!response.ok) {
      throw new Error(`Failed to fetch store items: ${response.statusText}`)
    }
    return response.json()
  },

  // Create a new store item
  async createItem(data: CreateItemData): Promise<StoreItem> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create item" }))
      throw new Error(error.message || "Failed to create item")
    }

    return response.json()
  },

  // Update an existing store item
  async updateItem(id: string, data: UpdateItemData): Promise<StoreItem> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to update item" }))
      throw new Error(error.message || "Failed to update item")
    }

    return response.json()
  },

  // Purchase an item
  async purchaseItem(data: PurchaseItemData): Promise<Purchase> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to purchase item" }))
      throw new Error(error.message || "Failed to purchase item")
    }

    return response.json()
  },

  // Fetch purchase history
  async fetchPurchases(): Promise<Purchase[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/store/purchases`)
    if (!response.ok) {
      throw new Error(`Failed to fetch purchases: ${response.statusText}`)
    }
    return response.json()
  },
}

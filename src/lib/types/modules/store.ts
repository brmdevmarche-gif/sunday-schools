// =====================================================
// STORE TYPES
// =====================================================
// Store items and orders management
// =====================================================

import type { StockType, PriceTier, UserRole } from './base';

// =====================================================
// STORE ITEMS
// =====================================================

export interface StoreItemSpecialOffer {
  id: string;
  store_item_id: string;
  special_price_normal: number | null;
  special_price_mastor: number | null;
  special_price_botl: number | null;
  start_at: string;
  end_at: string;
  created_at: string;
  updated_at: string;
}

export interface StoreItem {
  id: string;
  church_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_type: StockType;
  stock_quantity: number;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  is_active: boolean;
  is_available_to_all_classes: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  // Special offers array (loaded via join)
  special_offers?: StoreItemSpecialOffer[];
}

// =====================================================
// STORE ITEM ASSOCIATIONS
// =====================================================

export interface StoreItemChurch {
  id: string;
  store_item_id: string;
  church_id: string;
  created_at: string;
}

export interface StoreItemDiocese {
  id: string;
  store_item_id: string;
  diocese_id: string;
  created_at: string;
}

export interface StoreItemClass {
  id: string;
  store_item_id: string;
  class_id: string;
  created_at: string;
}

// =====================================================
// STORE ITEM INPUT TYPES
// =====================================================

export interface CreateSpecialOfferInput {
  special_price_normal?: number | null;
  special_price_mastor?: number | null;
  special_price_botl?: number | null;
  start_at: string;
  end_at: string;
}

export interface CreateStoreItemInput {
  name: string;
  description?: string;
  image_url?: string;
  stock_type: StockType;
  stock_quantity: number;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  special_offers?: CreateSpecialOfferInput[]; // Array of special offers
  church_ids?: string[]; // Multiple churches
  diocese_ids?: string[]; // Multiple dioceses (item available to all churches in these dioceses)
  class_ids?: string[]; // Specific classes (if not available to all)
  is_available_to_all_classes?: boolean;
}

export interface UpdateSpecialOfferInput {
  id?: string; // If provided, update existing; if not, create new
  special_price_normal?: number | null;
  special_price_mastor?: number | null;
  special_price_botl?: number | null;
  start_at?: string;
  end_at?: string;
}

export interface UpdateStoreItemInput {
  name?: string;
  description?: string;
  image_url?: string;
  stock_type?: StockType;
  stock_quantity?: number;
  price_normal?: number;
  price_mastor?: number;
  price_botl?: number;
  special_offers?: UpdateSpecialOfferInput[]; // Array of special offers (full replacement)
  is_active?: boolean;
  church_ids?: string[];
  diocese_ids?: string[];
  class_ids?: string[];
  is_available_to_all_classes?: boolean;
}

// =====================================================
// ORDERS
// =====================================================

export type OrderStatus = "pending" | "approved" | "fulfilled" | "cancelled" | "rejected";

export interface Order {
  id: string;
  user_id: string;
  class_id: string | null;
  status: OrderStatus;
  total_points: number;
  notes: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  store_item_id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  quantity: number;
  price_tier: PriceTier;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// =====================================================
// ORDER INPUT TYPES
// =====================================================

export interface CreateOrderItemInput {
  store_item_id: string;
  quantity: number;
  price_tier: PriceTier;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  notes?: string;
  class_id?: string;
}

export interface UpdateOrderStatusInput {
  order_id: string;
  status: OrderStatus;
  admin_notes?: string;
}

// =====================================================
// EXTENDED ORDER TYPES
// =====================================================

export interface OrderWithDetails extends Order {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    role: UserRole;
  };
  class: {
    id: string;
    name: string;
  } | null;
  items: OrderItem[];
  processed_by_user: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface CartItem {
  store_item: StoreItem;
  quantity: number;
  price_tier: PriceTier;
}

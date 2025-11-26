import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Store } from "@/lib/types";

export interface UseOrderManagementReturn {
  // State
  orders: any[];
  stores: Store[];
  selectedStore: Store | null;
  loading: boolean;
  error: string | null;
  actionDialogOpen: boolean;
  selectedOrder: any | null;
  actionType: "approve" | "reject" | "mark_purchased" | "mark_ready";
  actionNotes: string;

  // Actions
  setSelectedStore: (store: Store | null) => void;
  setActionDialogOpen: (open: boolean) => void;
  setSelectedOrder: (order: any | null) => void;
  setActionType: (
    type: "approve" | "reject" | "mark_purchased" | "mark_ready"
  ) => void;
  setActionNotes: (notes: string) => void;
  handleOrderAction: () => Promise<void>;
  filterOrdersByStatus: (status: string) => any[];
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  getAvailableActions: (status: string) => Array<{
    type: "approve" | "reject" | "mark_purchased" | "mark_ready";
    label: string;
    variant: "default" | "destructive";
  }>;
}

export function useOrderManagement(
  managerId: number
): UseOrderManagementReturn {
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "mark_purchased" | "mark_ready"
  >("approve");
  const [actionNotes, setActionNotes] = useState("");

  const supabase = createClient();

  // Load stores managed by this user
  useEffect(() => {
    async function loadStores() {
      try {
        setLoading(true);

        const { data: managedStores, error: storesError } = await supabase
          .from("stores")
          .select("*")
          .eq("manager_id", managerId)
          .eq("is_active", true);

        if (storesError) throw storesError;
        setStores(managedStores || []);

        if (managedStores && managedStores.length > 0) {
          setSelectedStore(managedStores[0]);
        }
      } catch (err) {
        console.error("Error loading stores:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadStores();
  }, [managerId]);

  // Load orders for selected store
  useEffect(() => {
    async function loadOrders() {
      if (!selectedStore) return;

      try {
        const { data: storeOrders, error: ordersError } = await supabase
          .from("student_orders")
          .select(
            `
            id,
            student_id,
            store_item_id,
            quantity,
            total_points,
            total_cash,
            status,
            payment_method,
            notes,
            created_at,
            updated_at,
            students (
              first_name,
              last_name,
              phone_number
            ),
            store_items (
              id,
              name,
              description,
              image_url,
              store_id,
              stock_quantity
            )
          `
          )
          .eq("store_items.store_id", selectedStore.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(storeOrders || []);
      } catch (err) {
        console.error("Error loading orders:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred loading orders"
        );
      }
    }

    loadOrders();
  }, [selectedStore]);

  const handleOrderAction = async () => {
    if (!selectedOrder) return;

    try {
      let newStatus = selectedOrder.status;

      switch (actionType) {
        case "approve":
          newStatus = "approved";
          break;
        case "reject":
          newStatus = "cancelled";
          break;
        case "mark_purchased":
          newStatus = "purchased";
          break;
        case "mark_ready":
          newStatus = "ready";
          break;
      }

      const { error } = await supabase
        .from("student_orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // If marking as purchased, update student wallet and stock
      if (actionType === "mark_purchased") {
        const paymentAmount =
          selectedOrder.payment_method === "points"
            ? selectedOrder.total_points
            : selectedOrder.total_cash;
        const paymentType = selectedOrder.payment_method;

        // Deduct from student wallet
        const { error: walletError } = await supabase.rpc(
          "update_student_wallet",
          {
            student_id: selectedOrder.student_id,
            points_change: paymentType === "points" ? -paymentAmount : 0,
            cash_change: paymentType === "cash" ? -paymentAmount : 0,
            description: `Purchase: ${selectedOrder.store_items?.name}`,
            order_id: selectedOrder.id,
          }
        );

        if (walletError) {
          console.error("Wallet update error:", walletError);
        }

        // Update item stock
        const { error: stockError } = await supabase
          .from("store_items")
          .update({
            stock_quantity:
              selectedOrder.store_items.stock_quantity - selectedOrder.quantity,
          })
          .eq("id", selectedOrder.store_item_id);

        if (stockError) {
          console.error("Stock update error:", stockError);
        }
      }

      // Reload orders
      if (selectedStore) {
        const { data: storeOrders, error: ordersError } = await supabase
          .from("student_orders")
          .select(
            `
            id,
            student_id,
            store_item_id,
            quantity,
            total_points,
            total_cash,
            status,
            payment_method,
            notes,
            created_at,
            updated_at,
            students (
              first_name,
              last_name,
              phone_number
            ),
            store_items (
              id,
              name,
              description,
              image_url,
              store_id,
              stock_quantity
            )
          `
          )
          .eq("store_items.store_id", selectedStore.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(storeOrders || []);
      }

      // Reset form
      setActionDialogOpen(false);
      setSelectedOrder(null);
      setActionNotes("");
      setError(null);
    } catch (err) {
      console.error("Error updating order:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const filterOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  const getStatusIcon = (status: string) => {
    // This would return the appropriate icon component
    // We'll need to import the icons in the component that uses this hook
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "purchased":
        return "bg-green-100 text-green-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "collected":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case "pending":
        return [
          {
            type: "approve" as const,
            label: "Approve Order",
            variant: "default" as const,
          },
          {
            type: "reject" as const,
            label: "Reject Order",
            variant: "destructive" as const,
          },
        ];
      case "approved":
        return [
          {
            type: "mark_purchased" as const,
            label: "Mark as Purchased",
            variant: "default" as const,
          },
          {
            type: "reject" as const,
            label: "Cancel Order",
            variant: "destructive" as const,
          },
        ];
      case "purchased":
        return [
          {
            type: "mark_ready" as const,
            label: "Mark as Ready",
            variant: "default" as const,
          },
        ];
      default:
        return [];
    }
  };

  return {
    // State
    orders,
    stores,
    selectedStore,
    loading,
    error,
    actionDialogOpen,
    selectedOrder,
    actionType,
    actionNotes,

    // Actions
    setSelectedStore,
    setActionDialogOpen,
    setSelectedOrder,
    setActionType,
    setActionNotes,
    handleOrderAction,
    filterOrdersByStatus,
    getStatusIcon,
    getStatusColor,
    getAvailableActions,
  };
}

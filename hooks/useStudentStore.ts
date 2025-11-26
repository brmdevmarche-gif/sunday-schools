import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Store, StoreItem } from "@/lib/types";

export interface UseStudentStoreReturn {
  // State
  stores: Store[];
  storeItems: StoreItem[];
  studentOrders: any[];
  selectedStore: Store | null;
  searchTerm: string;
  categoryFilter: string;
  loading: boolean;
  error: string | null;
  orderDialogOpen: boolean;
  selectedItem: StoreItem | null;
  orderQuantity: number;
  orderNotes: string;
  paymentMethod: "points" | "cash";
  studentWallet: { points: number; cash: number };

  // Computed
  filteredItems: StoreItem[];
  categories: string[];

  // Actions
  setSelectedStore: (store: Store | null) => void;
  setSearchTerm: (term: string) => void;
  setCategoryFilter: (category: string) => void;
  setOrderDialogOpen: (open: boolean) => void;
  setSelectedItem: (item: StoreItem | null) => void;
  setOrderQuantity: (quantity: number) => void;
  setOrderNotes: (notes: string) => void;
  setPaymentMethod: (method: "points" | "cash") => void;
  handleOrderSubmit: () => Promise<void>;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
}

export function useStudentStore(
  studentId: number,
  classId: number
): UseStudentStoreReturn {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [studentOrders, setStudentOrders] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"points" | "cash">(
    "points"
  );
  const [studentWallet, setStudentWallet] = useState({ points: 0, cash: 0 });

  const supabase = createClient();

  // Load available stores for student's class
  useEffect(() => {
    async function loadStores() {
      try {
        setLoading(true);

        // Get stores assigned to student's class
        const { data: assignments, error: assignmentError } = await supabase
          .from("store_assignments")
          .select(
            `
            store_id,
            stores (
              id,
              name,
              description,
              is_active,
              church_id,
              manager_id,
              created_at,
              updated_at
            )
          `
          )
          .eq("class_id", classId)
          .eq("is_active", true);

        if (assignmentError) throw assignmentError;

        const availableStores =
          (assignments
            ?.map((a) => a.stores as any)
            .filter((store) => store && store.is_active) as Store[]) || [];

        setStores(availableStores);

        if (availableStores.length > 0) {
          setSelectedStore(availableStores[0]);
        }

        // Load student wallet
        const { data: wallet, error: walletError } = await supabase
          .from("student_wallets")
          .select("points, cash")
          .eq("student_id", studentId)
          .single();

        if (walletError && walletError.code !== "PGRST116") {
          console.error("Wallet error:", walletError);
        } else if (wallet) {
          setStudentWallet({
            points: wallet.points || 0,
            cash: wallet.cash || 0,
          });
        }

        // Load student orders
        await loadStudentOrders();
      } catch (err) {
        console.error("Error loading stores:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadStores();
  }, [studentId, classId]);

  // Load items for selected store
  useEffect(() => {
    async function loadStoreItems() {
      if (!selectedStore) return;

      try {
        const { data, error } = await supabase
          .from("store_items")
          .select("*")
          .eq("store_id", selectedStore.id)
          .eq("is_active", true)
          .order("name");

        if (error) throw error;
        setStoreItems(data || []);
      } catch (err) {
        console.error("Error loading store items:", err);
        setError(
          err instanceof Error ? err.message : "An error occurred loading items"
        );
      }
    }

    loadStoreItems();
  }, [selectedStore]);

  const loadStudentOrders = async () => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("student_orders")
        .select(
          `
          id,
          store_item_id,
          quantity,
          total_points,
          total_cash,
          status,
          payment_method,
          notes,
          created_at,
          store_items (
            name,
            description,
            image_url
          )
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setStudentOrders((orders as any) || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred loading orders"
      );
    }
  };

  // Filter items based on search and category
  const filteredItems = storeItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    const inStock = item.stock_quantity > 0;
    return matchesSearch && matchesCategory && inStock;
  });

  // Get unique categories
  const categories = [
    "all",
    ...new Set(storeItems.map((item) => item.category).filter(Boolean)),
  ] as string[];

  // Handle order submission
  const handleOrderSubmit = async () => {
    if (!selectedItem || !selectedStore) return;

    try {
      const totalPoints =
        paymentMethod === "points"
          ? (selectedItem.price_points || 0) * orderQuantity
          : 0;
      const totalCash =
        paymentMethod === "cash"
          ? (selectedItem.price_cash || 0) * orderQuantity
          : 0;

      // Check if student has enough balance
      if (paymentMethod === "points" && totalPoints > studentWallet.points) {
        setError("Insufficient points balance");
        return;
      }
      if (paymentMethod === "cash" && totalCash > studentWallet.cash) {
        setError("Insufficient cash balance");
        return;
      }

      // Check stock availability
      if (orderQuantity > selectedItem.stock_quantity) {
        setError("Insufficient stock");
        return;
      }

      const { error } = await supabase.from("student_orders").insert({
        student_id: studentId,
        store_item_id: selectedItem.id,
        quantity: orderQuantity,
        total_points: totalPoints,
        total_cash: totalCash,
        status: selectedItem.requires_approval ? "pending" : "approved",
        payment_method: paymentMethod,
        notes: orderNotes || null,
      });

      if (error) throw error;

      // Refresh orders
      await loadStudentOrders();

      // Reset form
      setOrderDialogOpen(false);
      setSelectedItem(null);
      setOrderQuantity(1);
      setOrderNotes("");
      setPaymentMethod("points");
      setError(null);
    } catch (err) {
      console.error("Error submitting order:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
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

  return {
    // State
    stores,
    storeItems,
    studentOrders,
    selectedStore,
    searchTerm,
    categoryFilter,
    loading,
    error,
    orderDialogOpen,
    selectedItem,
    orderQuantity,
    orderNotes,
    paymentMethod,
    studentWallet,

    // Computed
    filteredItems,
    categories,

    // Actions
    setSelectedStore,
    setSearchTerm,
    setCategoryFilter,
    setOrderDialogOpen,
    setSelectedItem,
    setOrderQuantity,
    setOrderNotes,
    setPaymentMethod,
    handleOrderSubmit,
    getStatusIcon,
    getStatusColor,
  };
}

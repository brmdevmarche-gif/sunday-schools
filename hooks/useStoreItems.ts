import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { StoreItem, Store } from "@/lib/types";

export interface UseStoreItemsReturn {
  // State
  items: StoreItem[];
  store: Store | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  dialogOpen: boolean;
  editingItem: StoreItem | null;

  // Form state
  formData: {
    name: string;
    description: string;
    price_points: string;
    price_cash: string;
    stock_quantity: string;
    category: string;
    image_url: string;
    is_active: boolean;
    requires_approval: boolean;
  };

  // Actions
  setDialogOpen: (open: boolean) => void;
  setEditingItem: (item: StoreItem | null) => void;
  updateFormData: (field: string, value: any) => void;
  resetForm: () => void;
  handleSubmit: () => Promise<void>;
  handleEdit: (item: StoreItem) => void;
  handleDelete: (itemId: number) => Promise<void>;
  refreshItems: () => Promise<void>;
}

export function useStoreItems(storeId: number): UseStoreItemsReturn {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_points: "",
    price_cash: "",
    stock_quantity: "",
    category: "",
    image_url: "",
    is_active: true,
    requires_approval: false,
  });

  const supabase = createClient();

  // Load store and items
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load store info
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", storeId)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        // Load store items
        await loadItems();
      } catch (err) {
        console.error("Error loading store items:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (storeId) {
      loadData();
    }
  }, [storeId]);

  const loadItems = async () => {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("store_items")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (err) {
      console.error("Error loading items:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred loading items"
      );
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_points: "",
      price_cash: "",
      stock_quantity: "",
      category: "",
      image_url: "",
      is_active: true,
      requires_approval: false,
    });
    setEditingItem(null);
    setError(null);
  };

  const refreshItems = async () => {
    await loadItems();
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors and start submitting
      setError(null);
      setSubmitting(true);

      // Validation
      if (!formData.name.trim()) {
        setError("Item name is required");
        return;
      }

      if (!formData.price_points && !formData.price_cash) {
        setError("At least one price (points or cash) must be set");
        return;
      }

      if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
        setError("Valid stock quantity is required");
        return;
      }

      // Validate price values
      if (formData.price_points && parseInt(formData.price_points) < 0) {
        setError("Points price cannot be negative");
        return;
      }

      if (formData.price_cash && parseFloat(formData.price_cash) < 0) {
        setError("Cash price cannot be negative");
        return;
      }

      const itemData = {
        store_id: storeId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price_points: formData.price_points
          ? parseInt(formData.price_points)
          : 0,
        price_cash: formData.price_cash ? parseFloat(formData.price_cash) : 0,
        stock_quantity: parseInt(formData.stock_quantity),
        category: formData.category.trim() || null,
        image_url: formData.image_url.trim() || null,
        is_active: formData.is_active,
        requires_approval: formData.requires_approval,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("store_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase.from("store_items").insert(itemData);

        if (error) throw error;
      }

      await refreshItems();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: StoreItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price_points: item.price_points?.toString() || "",
      price_cash: item.price_cash?.toString() || "",
      stock_quantity: item.stock_quantity.toString(),
      category: item.category || "",
      image_url: item.image_url || "",
      is_active: item.is_active,
      requires_approval: item.requires_approval,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from("store_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await refreshItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return {
    // State
    items,
    store,
    loading,
    error,
    submitting,
    dialogOpen,
    editingItem,
    formData,

    // Actions
    setDialogOpen,
    setEditingItem,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
    refreshItems,
  };
}

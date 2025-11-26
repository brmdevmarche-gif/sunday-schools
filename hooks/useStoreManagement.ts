import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Store, Church, Servant } from "@/lib/types";

export interface UseStoreManagementReturn {
  // State
  stores: Store[];
  churches: Church[];
  servants: Servant[];
  loading: boolean;
  error: string | null;
  dialogOpen: boolean;
  editingStore: Store | null;

  // Form state
  formData: {
    name: string;
    church_id: string;
    manager_id: string;
    is_active: boolean;
  };

  // Actions
  setDialogOpen: (open: boolean) => void;
  setEditingStore: (store: Store | null) => void;
  updateFormData: (field: string, value: any) => void;
  resetForm: () => void;
  handleSubmit: () => Promise<void>;
  handleEdit: (store: Store) => void;
  handleDelete: (storeId: string) => Promise<void>;
  refreshStores: () => Promise<void>;
}

export function useStoreManagement(): UseStoreManagementReturn {
  const [stores, setStores] = useState<Store[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    church_id: "",
    manager_id: "",
    is_active: true,
  });

  const supabase = createClient();

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Load stores with related data
        const { data: storesData, error: storesError } = await supabase
          .from("stores")
          .select(
            `
            *,
            churches (
              id,
              name
            )
          `
          )
          .order("created_at", { ascending: false });

        if (storesError) throw storesError;

        // Manually join manager data
        const storesWithManagers = await Promise.all(
          (storesData || []).map(async (store) => {
            if (store.manager_id) {
              const { data: manager } = await supabase
                .from("servants")
                .select("id, first_name, last_name")
                .eq("id", store.manager_id)
                .single();

              return {
                ...store,
                manager,
              };
            }
            return store;
          })
        );

        setStores(storesWithManagers || []);

        // Load churches
        const { data: churchesData, error: churchesError } = await supabase
          .from("churches")
          .select("id, name")
          .eq("is_active", true)
          .order("name");

        if (churchesError) throw churchesError;
        setChurches((churchesData as any) || []);

        // Load servants
        const { data: servantsData, error: servantsError } = await supabase
          .from("servants")
          .select("id, first_name, last_name, church_id")
          .eq("is_active", true)
          .order("first_name");

        if (servantsError) throw servantsError;
        setServants((servantsData as any) || []);
      } catch (err) {
        console.error("Error loading store management data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      church_id: "",
      manager_id: "",
      is_active: true,
    });
    setEditingStore(null);
    setError(null);
  };

  const refreshStores = async () => {
    try {
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select(
          `
          *,
          churches (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (storesError) throw storesError;

      // Manually join manager data
      const storesWithManagers = await Promise.all(
        (storesData || []).map(async (store) => {
          if (store.manager_id) {
            const { data: manager } = await supabase
              .from("servants")
              .select("id, first_name, last_name")
              .eq("id", store.manager_id)
              .single();

            return {
              ...store,
              manager,
            };
          }
          return store;
        })
      );

      setStores(storesWithManagers || []);
    } catch (err) {
      console.error("Error refreshing stores:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.name.trim() ||
        !formData.church_id ||
        !formData.manager_id
      ) {
        setError("Please fill in all required fields");
        return;
      }

      const storeData = {
        name: formData.name.trim(),
        church_id: parseInt(formData.church_id),
        manager_id: parseInt(formData.manager_id),
        is_active: formData.is_active,
      };

      if (editingStore) {
        // Update existing store
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", editingStore.id);

        if (error) throw error;
      } else {
        // Create new store
        const { error } = await supabase.from("stores").insert(storeData);

        if (error) throw error;
      }

      await refreshStores();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving store:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      church_id: store.church_id.toString(),
      manager_id: store.manager_id ? store.manager_id.toString() : "",
      is_active: store.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId);

      if (error) throw error;

      await refreshStores();
    } catch (err) {
      console.error("Error deleting store:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return {
    // State
    stores,
    churches,
    servants,
    loading,
    error,
    dialogOpen,
    editingStore,
    formData,

    // Actions
    setDialogOpen,
    setEditingStore,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
    refreshStores,
  };
}

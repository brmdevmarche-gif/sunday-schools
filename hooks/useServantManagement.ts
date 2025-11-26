"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Servant, Church } from "@/lib/types";

export interface ServantFormData {
  church_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  role: "superAdmin" | "admin" | "servant" | "beginner";
  year_type: "kg" | "primary" | "preparatory" | "secondary" | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface UseServantManagementReturn {
  // State
  servants: Servant[];
  churches: { id: string; name: string }[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  dialogOpen: boolean;
  editingServant: Servant | null;
  formData: ServantFormData;

  // Actions
  setDialogOpen: (open: boolean) => void;
  setEditingServant: (servant: Servant | null) => void;
  updateFormData: (
    field: string,
    value: string | boolean | null | number
  ) => void;
  resetForm: () => void;
  handleSubmit: () => Promise<void>;
  handleEdit: (servant: Servant) => void;
  handleDelete: (id: string) => Promise<void>;
  refreshServants: () => Promise<void>;
}

const initialFormData: ServantFormData = {
  church_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address: "",
  role: "servant",
  year_type: null,
  start_date: "",
  end_date: "",
  is_active: true,
  latitude: null,
  longitude: null,
};

export function useServantManagement(): UseServantManagementReturn {
  const [servants, setServants] = useState<Servant[]>([]);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServant, setEditingServant] = useState<Servant | null>(null);
  const [formData, setFormData] = useState<ServantFormData>(initialFormData);

  const supabase = createClient();

  useEffect(() => {
    refreshServants();
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setChurches(data || []);
    } catch (err) {
      console.error("Error fetching churches:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch churches");
    }
  };

  const refreshServants = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("servants")
        .select(
          `
          *,
          church (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServants(data || []);
    } catch (err) {
      console.error("Error fetching servants:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch servants");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (
    field: string,
    value: string | boolean | null | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingServant(null);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors and start submitting
      setError(null);
      setSubmitting(true);

      // Validation
      if (!formData.first_name.trim()) {
        setError("First name is required");
        return;
      }

      if (!formData.last_name.trim()) {
        setError("Last name is required");
        return;
      }

      if (!formData.church_id) {
        setError("Church selection is required");
        return;
      }

      // Validate email format if provided
      if (
        formData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      ) {
        setError("Please enter a valid email address");
        return;
      }

      // Check for email uniqueness if email is provided
      if (formData.email.trim()) {
        const { data: existingServant } = await supabase
          .from("servants")
          .select("id")
          .eq("email", formData.email.trim())
          .single();

        if (
          existingServant &&
          (!editingServant || existingServant.id !== editingServant.id)
        ) {
          setError("This email address is already in use by another servant");
          return;
        }
      }

      const servantData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        church_id: formData.church_id, // UUID string, not integer
        email: formData.email.trim() ? formData.email.trim() : null,
        phone: formData.phone.trim() ? formData.phone.trim() : null,
        date_of_birth: formData.date_of_birth ? formData.date_of_birth : null,
        address: formData.address.trim() ? formData.address.trim() : null,
        role: formData.role.trim() ? formData.role.trim() : null,
        year_type: formData.year_type,
        start_date: formData.start_date ? formData.start_date : null,
        end_date: formData.end_date ? formData.end_date : null,
        is_active: formData.is_active,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      if (editingServant) {
        // Update existing servant
        const { error } = await supabase
          .from("servants")
          .update(servantData)
          .eq("id", editingServant.id);

        if (error) throw error;
      } else {
        // Create new servant
        const { error } = await supabase.from("servants").insert(servantData);

        if (error) throw error;
      }

      await refreshServants();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving servant:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase.from("servants").delete().eq("id", id);
      if (error) throw error;

      await refreshServants();
    } catch (err) {
      console.error("Error deleting servant:", err);
      setError(err instanceof Error ? err.message : "Failed to delete servant");
      throw err; // Re-throw to allow component to handle UI feedback
    }
  };

  const handleEdit = (servant: Servant) => {
    setFormData({
      first_name: servant.first_name,
      last_name: servant.last_name,
      church_id: servant.church_id, // Already a UUID string
      email: servant.email || "",
      phone: servant.phone || "",
      date_of_birth: servant.date_of_birth || "",
      address: servant.address || "",
      role: (servant.role as ServantFormData["role"]) || "servant",
      year_type: servant.year_type || null,
      start_date: servant.start_date || "",
      end_date: servant.end_date || "",
      is_active: servant.is_active ?? true,
      latitude: servant.latitude || null,
      longitude: servant.longitude || null,
    });
    setEditingServant(servant);
    setDialogOpen(true);
  };

  return {
    // State
    servants,
    churches,
    loading,
    error,
    submitting,
    dialogOpen,
    editingServant,
    formData,

    // Actions
    setDialogOpen,
    setEditingServant,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
    refreshServants,
  };
}

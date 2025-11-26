"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  
} from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Store as StoreIcon,
  Plus,
  Edit,
  Trash2,
  Package,
  Users,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { useStoreManagement } from "@/hooks/useStoreManagement";

interface StoreManagementProps {
  churchId?: number;
}

export function StoreManagement({ churchId }: StoreManagementProps) {
  const [activeTab, setActiveTab] = useState<"stores" | "items" | "assignments">("stores");
  
  const {
    stores,
    churches,
    servants,
    loading,
    error,
    dialogOpen,
    editingStore,
    formData,
    setDialogOpen,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
  } = useStoreManagement();

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch stores
      const storesQuery = supabase.from("stores").select(`
          *,
          church:churches(*),
          manager:servants(*)
        `);

      if (churchId) {
        storesQuery.eq("church_id", churchId);
      }

      const { data: storesData, error: storesError } = await storesQuery;
      if (storesError) throw storesError;

      // Fetch churches if not filtered by churchId
      if (!churchId) {
        const { data: churchesData, error: churchesError } = await supabase
          .from("churches")
          .select("*")
          .order("name");
        if (churchesError) throw churchesError;
        setChurches(churchesData || []);
      }

      // Fetch servants
      const servantsQuery = supabase
        .from("servants")
        .select("*")
        .eq("is_active", true)
        .order("first_name");

      if (churchId) {
        servantsQuery.eq("church_id", churchId);
      }

      const { data: servantsData, error: servantsError } = await servantsQuery;
      if (servantsError) throw servantsError;

      // Fetch class groups
      const classGroupsQuery = supabase
        .from("class_groups")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (churchId) {
        classGroupsQuery.eq("church_id", churchId);
      }

      const { data: classGroupsData, error: classGroupsError } =
        await classGroupsQuery;
      if (classGroupsError) throw classGroupsError;

      setStores(storesData || []);
      setServants(servantsData || []);
      setClassGroups(classGroupsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      handleError(new Error("Failed to load store data"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();

      const storeData = {
        name: formData.name,
        description: formData.description || null,
        church_id: parseInt(formData.church_id.toString()),
        manager_id: formData.manager_id
          ? parseInt(formData.manager_id.toString())
          : null,
        is_active: formData.is_active,
      };

      if (selectedStore) {
        // Update existing store
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", selectedStore.id);

        if (error) throw error;
        setIsEditDialogOpen(false);
      } else {
        // Create new store
        const { error } = await supabase.from("stores").insert([storeData]);

        if (error) throw error;
        setIsCreateDialogOpen(false);
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        description: "",
        church_id: churchId || "",
        manager_id: "",
        is_active: true,
      });
      setSelectedStore(null);
      fetchData();
    } catch (error) {
      console.error("Error saving store:", error);
      handleError(new Error("Failed to save store"));
    }
  };

  const handleEdit = (store: Store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      description: store.description || "",
      church_id: store.church_id.toString(),
      manager_id: store.manager_id?.toString() || "",
      is_active: store.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (storeId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this store? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting store:", error);
      handleError(new Error("Failed to delete store"));
    }
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      church_id: churchId || "",
      manager_id: "",
      is_active: true,
    });
    setSelectedStore(null);
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Store Management</h1>
          <p className="text-muted-foreground">
            Manage church stores, items, and assignments
          </p>
        </div>
        <SimpleButton onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </SimpleButton>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("stores")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stores"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <StoreIcon className="w-4 h-4 inline mr-2" />
            Stores
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "items"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Items
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "assignments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Class Assignments
          </button>
        </nav>
      </div>

      {/* Stores Tab */}
      {activeTab === "stores" && (
        <Card>
          <CardHeader>
            <CardTitle>Stores</CardTitle>
            <CardDescription>
              Manage stores for your {churchId ? "church" : "organization"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stores.length === 0 ? (
              <div className="text-center py-8">
                <StoreIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No stores yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first store to get started
                </p>
                <SimpleButton onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Store
                </SimpleButton>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {!churchId && <TableHead>Church</TableHead>}
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{store.name}</div>
                          {store.description && (
                            <div className="text-sm text-muted-foreground">
                              {store.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {!churchId && <TableCell>{store.church?.name}</TableCell>}
                      <TableCell>
                        {store.manager
                          ? `${store.manager.first_name} ${store.manager.last_name}`
                          : "No manager assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={store.is_active ? "default" : "secondary"}
                        >
                          {store.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(store)}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(store.id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items Tab */}
      {activeTab === "items" && (
        <Card>
          <CardHeader>
            <CardTitle>Store Items</CardTitle>
            <CardDescription>
              Manage items available in your stores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Items management coming soon
              </h3>
              <p className="text-muted-foreground">
                This section will allow you to manage store items
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <Card>
          <CardHeader>
            <CardTitle>Class Assignments</CardTitle>
            <CardDescription>
              Assign stores to specific class groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Assignments management coming soon
              </h3>
              <p className="text-muted-foreground">
                This section will allow you to assign stores to class groups
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Store</DialogTitle>
            <DialogDescription>
              Add a new store to your church or organization
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter store name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter store description"
                />
              </div>
              {!churchId && (
                <div className="grid gap-2">
                  <Label htmlFor="church_id">Church</Label>
                  <Select
                    value={formData.church_id.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, church_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem
                          key={church.id}
                          value={church.id.toString()}
                        >
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="manager_id">Store Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manager_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No manager</SelectItem>
                    {servants.map((servant) => (
                      <SelectItem
                        key={servant.id}
                        value={servant.id.toString()}
                      >
                        {servant.first_name} {servant.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <SimpleButton
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </SimpleButton>
              <SimpleButton type="submit">Create Store</SimpleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
            <DialogDescription>Update store information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Store Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter store name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter store description"
                />
              </div>
              {!churchId && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-church_id">Church</Label>
                  <Select
                    value={formData.church_id.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, church_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem
                          key={church.id}
                          value={church.id.toString()}
                        >
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-manager_id">Store Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manager_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No manager</SelectItem>
                    {servants.map((servant) => (
                      <SelectItem
                        key={servant.id}
                        value={servant.id.toString()}
                      >
                        {servant.first_name} {servant.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <SimpleButton
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </SimpleButton>
              <SimpleButton type="submit">Save Changes</SimpleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

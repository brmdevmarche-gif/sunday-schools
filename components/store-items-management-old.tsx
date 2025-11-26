"use client";

import React, { useState, useEffect } from "react";
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
import { Store, StoreItem } from "@/lib/types";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Star,
} from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import { useErrorHandler } from "@/components/ui/error-boundary";

interface StoreItemsManagementProps {
  storeId?: number;
  churchId?: number;
}

export function StoreItemsManagement({
  storeId,
  churchId,
}: StoreItemsManagementProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>(
    storeId?.toString() || ""
  );
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const handleError = useErrorHandler();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    store_id: storeId?.toString() || "",
    price_points: 0,
    price_cash: 0,
    stock_quantity: 0,
    category: "",
    image_url: "",
    is_active: true,
    requires_approval: true,
  });

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchStores();
    }
  }, [churchId]);

  useEffect(() => {
    if (selectedStore && isSupabaseConfigured()) {
      fetchItems();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const storesQuery = supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (churchId) {
        storesQuery.eq("church_id", churchId);
      }

      const { data, error } = await storesQuery;
      if (error) throw error;

      setStores(data || []);

      // If only one store, auto-select it
      if (data && data.length === 1 && !selectedStore) {
        setSelectedStore(data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
      handleError(new Error("Failed to load stores"));
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("store_items")
        .select(
          `
          *,
          store:stores(*)
        `
        )
        .eq("store_id", selectedStore)
        .order("name");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      handleError(new Error("Failed to load store items"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supabase = createClient();

      const itemData = {
        name: formData.name,
        description: formData.description || null,
        store_id: parseInt(formData.store_id),
        price_points: parseInt(formData.price_points.toString()),
        price_cash: parseFloat(formData.price_cash.toString()),
        stock_quantity: parseInt(formData.stock_quantity.toString()),
        category: formData.category || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        requires_approval: formData.requires_approval,
      };

      if (selectedItem) {
        // Update existing item
        const { error } = await supabase
          .from("store_items")
          .update(itemData)
          .eq("id", selectedItem.id);

        if (error) throw error;
        setIsEditDialogOpen(false);
      } else {
        // Create new item
        const { error } = await supabase.from("store_items").insert([itemData]);

        if (error) throw error;
        setIsCreateDialogOpen(false);
      }

      // Reset form and refresh data
      resetForm();
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
      handleError(new Error("Failed to save item"));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      store_id: selectedStore,
      price_points: 0,
      price_cash: 0,
      stock_quantity: 0,
      category: "",
      image_url: "",
      is_active: true,
      requires_approval: true,
    });
    setSelectedItem(null);
  };

  const handleEdit = (item: StoreItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      store_id: item.store_id.toString(),
      price_points: item.price_points,
      price_cash: item.price_cash,
      stock_quantity: item.stock_quantity,
      category: item.category || "",
      image_url: item.image_url || "",
      is_active: item.is_active,
      requires_approval: item.requires_approval,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("store_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      handleError(new Error("Failed to delete item"));
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  if (loading && stores.length === 0) {
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
          <h1 className="text-3xl font-bold">Store Items</h1>
          <p className="text-muted-foreground">
            Manage items available in your stores
          </p>
        </div>
        <SimpleButton onClick={openCreateDialog} disabled={!selectedStore}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </SimpleButton>
      </div>

      {/* Store Selection */}
      {!storeId && stores.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Store</CardTitle>
            <CardDescription>
              Choose a store to manage its items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {selectedStore && (
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              {stores.find((s) => s.id.toString() === selectedStore)?.name}{" "}
              inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first item to get started
                </p>
                <SimpleButton onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </SimpleButton>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price (Points)</TableHead>
                    <TableHead>Price (Cash)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="outline">{item.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.price_points > 0 ? (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {item.price_points}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Free</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.price_cash > 0 ? (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                            {item.price_cash.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.stock_quantity === 0 ? "secondary" : "default"
                          }
                        >
                          {item.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge
                            variant={item.is_active ? "default" : "secondary"}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {item.requires_approval && (
                            <Badge variant="outline" className="text-xs">
                              Requires Approval
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Item</DialogTitle>
            <DialogDescription>Add a new item to the store</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Books, Supplies"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter item description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price_points">Price (Points)</Label>
                  <Input
                    id="price_points"
                    type="number"
                    min="0"
                    value={formData.price_points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price_cash">Price (Cash)</Label>
                  <Input
                    id="price_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_cash}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_cash: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock_quantity">Stock</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_approval: checked })
                    }
                  />
                  <Label htmlFor="requires_approval">Requires Approval</Label>
                </div>
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
              <SimpleButton type="submit">Create Item</SimpleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update item information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Books, Supplies"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter item description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price_points">Price (Points)</Label>
                  <Input
                    id="edit-price_points"
                    type="number"
                    min="0"
                    value={formData.price_points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price_cash">Price (Cash)</Label>
                  <Input
                    id="edit-price_cash"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_cash}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_cash: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock_quantity">Stock</Label>
                  <Input
                    id="edit-stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-image_url">Image URL</Label>
                <Input
                  id="edit-image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="edit-is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_approval: checked })
                    }
                  />
                  <Label htmlFor="edit-requires_approval">
                    Requires Approval
                  </Label>
                </div>
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

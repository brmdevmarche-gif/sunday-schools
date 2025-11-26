"use client";

import React from "react";
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
  Package,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Coins,
} from "lucide-react";
import { useStoreItems } from "@/hooks/useStoreItems";

interface StoreItemsManagementProps {
  storeId: number;
}

export function StoreItemsManagement({ storeId }: StoreItemsManagementProps) {
  const {
    items,
    store,
    loading,
    error,
    submitting,
    dialogOpen,
    editingItem,
    formData,
    setDialogOpen,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
  } = useStoreItems(storeId);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading store items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Store not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{store.name} - Items</h2>
          <p className="text-gray-600">Manage inventory for this store</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <SimpleDialogTrigger>
            <SimpleButton onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </SimpleButton>
          </SimpleDialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? "Update the item information below."
                  : "Fill in the details to add a new item to the store."}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  placeholder="Enter item description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_points">Points Price</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      id="price_points"
                      type="number"
                      min="0"
                      value={formData.price_points}
                      onChange={(e) =>
                        updateFormData("price_points", e.target.value)
                      }
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price_cash">Cash Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    <Input
                      id="price_cash"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_cash}
                      onChange={(e) =>
                        updateFormData("price_cash", e.target.value)
                      }
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      updateFormData("stock_quantity", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => updateFormData("category", e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => updateFormData("image_url", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      updateFormData("is_active", checked)
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) =>
                      updateFormData("requires_approval", checked)
                    }
                  />
                  <Label htmlFor="requires_approval">Requires Approval</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <SimpleButton
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </SimpleButton>
              <SimpleButton onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? editingItem
                    ? "Updating..."
                    : "Adding..."
                  : editingItem
                  ? "Update Item"
                  : "Add Item"}
              </SimpleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Store Inventory</span>
          </CardTitle>
          <CardDescription>
            Manage items, pricing, and stock levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing</TableHead>
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
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="secondary">{item.category}</Badge>
                    ) : (
                      <span className="text-gray-400">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {item.price_points > 0 && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Coins className="h-3 w-3 text-blue-500" />
                          <span className="text-blue-600">
                            {item.price_points} points
                          </span>
                        </div>
                      )}
                      {item.price_cash > 0 && (
                        <div className="flex items-center space-x-1 text-sm">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">
                            ${item.price_cash.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`text-sm ${
                        item.stock_quantity === 0
                          ? "text-red-600"
                          : item.stock_quantity <= 10
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {item.stock_quantity} in stock
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {item.requires_approval && (
                        <Badge variant="outline">Approval Required</Badge>
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
                        <Edit className="h-4 w-4" />
                      </SimpleButton>
                      <SimpleButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </SimpleButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No items in store
              </h3>
              <p className="text-gray-500">
                Add your first item to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

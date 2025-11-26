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
import { Store } from "@/lib/types";

interface StoreManagementProps {
  churchId?: string;
}

export function StoreManagement({ churchId }: StoreManagementProps) {
  const [activeTab, setActiveTab] = useState<
    "stores" | "items" | "assignments"
  >("stores");

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stores...</div>
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

  // Filter stores by church if churchId is provided
  const filteredStores = churchId
    ? stores.filter((store) => store.church_id === churchId)
    : stores;

  // Filter servants by selected church
  const filteredServants = formData.church_id
    ? servants.filter((servant) => servant.church_id === formData.church_id)
    : servants;

  const renderStoresTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Store Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <SimpleDialogTrigger>
            <SimpleButton onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Store
            </SimpleButton>
          </SimpleDialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? "Edit Store" : "Create New Store"}
              </DialogTitle>
              <DialogDescription>
                {editingStore
                  ? "Update the store information below."
                  : "Fill in the details to create a new store."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Store Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter store name"
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
                  placeholder="Enter store description"
                />
              </div>
              <div>
                <Label htmlFor="church">Church</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) => updateFormData("church_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id.toString()}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manager">Store Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) => updateFormData("manager_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServants.map((servant) => (
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
            </div>
            <DialogFooter>
              <SimpleButton
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </SimpleButton>
              <SimpleButton onClick={handleSubmit}>
                {editingStore ? "Update Store" : "Create Store"}
              </SimpleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <StoreIcon className="h-5 w-5" />
            <span>Stores</span>
          </CardTitle>
          <CardDescription>
            Manage your church stores and their settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Church</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store: Store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    {(store as any).churches?.name || store.church_id}
                  </TableCell>
                  <TableCell>
                    {(store as any).manager
                      ? `${(store as any).manager.first_name} ${
                          (store as any).manager.last_name
                        }`
                      : "No manager assigned"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={store.is_active ? "default" : "secondary"}>
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
                        <Edit className="h-4 w-4" />
                      </SimpleButton>
                      <SimpleButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(store.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </SimpleButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredStores.length === 0 && (
            <div className="text-center py-8">
              <StoreIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No stores found
              </h3>
              <p className="text-gray-500">
                Create your first store to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderItemsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Store Items</span>
          </CardTitle>
          <CardDescription>
            Manage inventory items across all stores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Store Items Management
            </h3>
            <p className="text-gray-500 mb-4">
              Select a specific store to manage its items, or use the dedicated
              items management page.
            </p>
            <SimpleButton onClick={() => setActiveTab("stores")}>
              Back to Stores
            </SimpleButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Store Assignments</span>
          </CardTitle>
          <CardDescription>
            Assign stores to class groups for student access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Store Assignments
            </h3>
            <p className="text-gray-500 mb-4">
              This feature allows you to assign specific stores to class groups,
              controlling which students can access which stores.
            </p>
            <SimpleButton onClick={() => setActiveTab("stores")}>
              Back to Stores
            </SimpleButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("stores")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "stores"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <StoreIcon className="h-4 w-4 inline mr-2" />
            Stores
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "items"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Items
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "assignments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Assignments
          </button>
        </nav>
      </div>

      {activeTab === "stores" && renderStoresTab()}
      {activeTab === "items" && renderItemsTab()}
      {activeTab === "assignments" && renderAssignmentsTab()}
    </div>
  );
}

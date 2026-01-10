"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Eye,
  ShoppingCart,
  BarChart3,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { StoreItem } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import {
  createStoreItemAction,
  updateStoreItemAction,
  deleteStoreItemAction,
  toggleStoreItemStatusAction,
  getItemDemandStatsAction,
  type ItemDemandStats,
} from "./actions";

interface Church {
  id: string;
  name: string;
  diocese_id: string;
  dioceses: { name: string } | null;
}

interface ClassItem {
  id: string;
  name: string;
  church_id: string;
}

interface StoreClientProps {
  items: StoreItem[];
  churches: Church[];
  dioceses: { id: string; name: string }[];
  classes: ClassItem[];
  userRole: string;
}

export default function StoreClient({
  items: initialItems,
  churches,
  dioceses,
  classes,
  userRole,
}: StoreClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemandView, setShowDemandView] = useState(false);
  const [demandStats, setDemandStats] = useState<ItemDemandStats[]>([]);
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    stock_type: "quantity" as "quantity" | "on_demand",
    stock_quantity: 0,
    price_normal: 0,
    price_mastor: 0,
    price_botl: 0,
    church_ids: [] as string[],
    diocese_ids: [] as string[],
    is_available_to_all_classes: true,
    class_ids: [] as string[],
  });

  // Filter churches based on selected dioceses
  const filteredChurches =
    formData.diocese_ids.length > 0
      ? churches.filter((church) =>
          formData.diocese_ids.includes(church.diocese_id)
        )
      : churches;

  // Filter classes based on selected churches
  const filteredClasses =
    formData.church_ids.length > 0
      ? classes.filter((classItem) =>
          formData.church_ids.includes(classItem.church_id)
        )
      : classes;

  // Auto-remove invalid church selections when diocese filter changes
  const handleDioceseChange = (dioceseId: string, checked: boolean) => {
    let newDioceseIds: string[];
    if (checked) {
      newDioceseIds = [...formData.diocese_ids, dioceseId];
    } else {
      newDioceseIds = formData.diocese_ids.filter((id) => id !== dioceseId);
    }

    // Filter churches to match new diocese selection
    const validChurches =
      newDioceseIds.length > 0
        ? churches.filter((church) => newDioceseIds.includes(church.diocese_id))
        : churches;

    // Remove any selected churches that are no longer in the filtered list
    const validChurchIds = formData.church_ids.filter((id) =>
      validChurches.some((church) => church.id === id)
    );

    setFormData({
      ...formData,
      diocese_ids: newDioceseIds,
      church_ids: validChurchIds,
    });
  };

  // Auto-remove invalid class selections when church filter changes
  const handleChurchChange = (churchId: string, checked: boolean) => {
    let newChurchIds: string[];
    if (checked) {
      newChurchIds = [...formData.church_ids, churchId];
    } else {
      newChurchIds = formData.church_ids.filter((id) => id !== churchId);
    }

    // Filter classes to match new church selection
    const validClasses =
      newChurchIds.length > 0
        ? classes.filter((classItem) =>
            newChurchIds.includes(classItem.church_id)
          )
        : classes;

    // Remove any selected classes that are no longer in the filtered list
    const validClassIds = formData.class_ids.filter((id) =>
      validClasses.some((classItem) => classItem.id === id)
    );

    setFormData({
      ...formData,
      church_ids: newChurchIds,
      class_ids: validClassIds,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      stock_type: "quantity",
      stock_quantity: 0,
      price_normal: 0,
      price_mastor: 0,
      price_botl: 0,
      church_ids: [],
      diocese_ids: [],
      is_available_to_all_classes: true,
      class_ids: [],
    });
  };

  const handleCreate = async () => {
    if (
      !formData.name ||
      (formData.stock_type === "quantity" && formData.stock_quantity < 0)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createStoreItemAction({
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        stock_type: formData.stock_type,
        stock_quantity: formData.stock_quantity,
        price_normal: formData.price_normal,
        price_mastor: formData.price_mastor,
        price_botl: formData.price_botl,
        church_ids: formData.church_ids,
        diocese_ids: formData.diocese_ids,
        is_available_to_all_classes: formData.is_available_to_all_classes,
        class_ids: formData.class_ids,
      });

      if (result.success && result.data) {
        setItems([result.data, ...items]);
        toast.success("Store item created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create store item";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (
      !selectedItem ||
      !formData.name ||
      (formData.stock_type === "quantity" && formData.stock_quantity < 0)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await updateStoreItemAction(selectedItem.id, {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        stock_type: formData.stock_type,
        stock_quantity: formData.stock_quantity,
        price_normal: formData.price_normal,
        price_mastor: formData.price_mastor,
        price_botl: formData.price_botl,
        church_ids: formData.church_ids,
        diocese_ids: formData.diocese_ids,
        is_available_to_all_classes: formData.is_available_to_all_classes,
        class_ids: formData.class_ids,
      });

      setItems(
        items.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                stock_type: formData.stock_type,
                stock_quantity: formData.stock_quantity,
                price_normal: formData.price_normal,
                price_mastor: formData.price_mastor,
                price_botl: formData.price_botl,
                is_available_to_all_classes:
                  formData.is_available_to_all_classes,
              }
            : item
        )
      );

      toast.success("Store item updated successfully");
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update store item";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: StoreItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteStoreItemAction(item.id);
      setItems(items.filter((i) => i.id !== item.id));
      toast.success("Store item deleted successfully");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete store item";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (item: StoreItem) => {
    setIsLoading(true);
    try {
      await toggleStoreItemStatusAction(item.id, !item.is_active);
      setItems(
        items.map((i) =>
          i.id === item.id ? { ...i, is_active: !i.is_active } : i
        )
      );
      toast.success(
        `Store item ${
          item.is_active ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to toggle item status";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: StoreItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      image_url: item.image_url || "",
      stock_type: item.stock_type,
      stock_quantity: item.stock_quantity,
      price_normal: item.price_normal,
      price_mastor: item.price_mastor,
      price_botl: item.price_botl,
      church_ids: [], // Will be loaded from junction table
      diocese_ids: [], // Will be loaded from junction table
      is_available_to_all_classes: item.is_available_to_all_classes,
      class_ids: [], // Will be loaded from junction table
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (item: StoreItem) => {
    router.push(`/admin/store/${item.id}`);
  };

  const loadDemandStats = async () => {
    setIsLoadingDemand(true);
    try {
      const stats = await getItemDemandStatsAction();
      setDemandStats(stats);
      setShowDemandView(true);
    } catch (error) {
      console.error("Failed to load demand stats:", error);
      toast.error("Failed to load demand statistics");
    } finally {
      setIsLoadingDemand(false);
    }
  };

  const exportDemandToExcel = () => {
    if (demandStats.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content (Excel compatible)
    const headers = [
      t("store.item"),
      t("store.stock"),
      t("store.pending"),
      t("store.approved"),
      t("store.needsRestock"),
    ];

    const rows = demandStats.map((stat) => {
      const needsRestock =
        stat.stock_type === "quantity" &&
        stat.pending_requests + stat.approved_requests > stat.stock_quantity;
      return [
        stat.item_name,
        stat.stock_type === "on_demand" ? "Unlimited" : stat.stock_quantity,
        stat.pending_requests,
        stat.approved_requests,
        needsRestock ? t("store.restock") : t("store.ok"),
      ];
    });

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `item-demand-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t("store.exportSuccess"));
  };

  // Filter items based on search
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChurchName = (churchId: string | null) => {
    if (!churchId || churchId === "all") return "All Churches";
    const church = churches.find((c) => c.id === churchId);
    return church ? church.name : "Unknown Church";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t("store.title")} {t("common.management")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("store.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={loadDemandStats}
            disabled={isLoadingDemand}
            className="w-full sm:w-auto"
          >
            <BarChart3 className="me-2 h-4 w-4" />
            {isLoadingDemand ? "Loading..." : t("store.itemDemand")}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/store/orders")}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="me-2 h-4 w-4" />
            {t("store.ordersManagement")}
          </Button>
          <Button onClick={() => router.push("/admin/store/create")} className="w-full sm:w-auto">
            <Plus className="me-2 h-4 w-4" />
            {t("store.addItem")}
          </Button>
        </div>
      </div>

      {/* Demand View */}
      {showDemandView ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowDemandView(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
              <div>
                <h2 className="text-xl font-semibold">{t("store.itemDemand")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("store.itemDemandDescription")}
                </p>
              </div>
            </div>
            <Button onClick={exportDemandToExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {t("store.exportExcel")}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("store.item")}</TableHead>
                  <TableHead className="text-center">{t("store.stock")}</TableHead>
                  <TableHead className="text-center">{t("store.pending")}</TableHead>
                  <TableHead className="text-center">{t("store.approved")}</TableHead>
                  <TableHead className="text-center">{t("store.needsRestock")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("store.noItems")}
                    </TableCell>
                  </TableRow>
                ) : (
                  demandStats.map((stat) => {
                    const needsRestock = stat.stock_type === 'quantity' &&
                      stat.pending_requests + stat.approved_requests > stat.stock_quantity;
                    return (
                      <TableRow key={stat.item_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {stat.item_image_url ? (
                              <img
                                src={stat.item_image_url}
                                alt={stat.item_name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{stat.item_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {stat.stock_type === 'on_demand' ? 'On Demand' : 'Limited Stock'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.stock_type === 'on_demand' ? (
                            <Badge variant="outline">Unlimited</Badge>
                          ) : (
                            <Badge variant={stat.stock_quantity > 0 ? "default" : "destructive"}>
                              {stat.stock_quantity}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{stat.pending_requests}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{stat.approved_requests}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {needsRestock ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("store.restock")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              {t("store.ok")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Items Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price (Normal)</TableHead>
              <TableHead>Price (Mastor)</TableHead>
              <TableHead>Price (Botl)</TableHead>
              {userRole === "super_admin" && <TableHead>Church</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={userRole === "super_admin" ? 8 : 7}
                  className="text-center text-muted-foreground"
                >
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.stock_quantity > 0 ? "default" : "destructive"
                      }
                    >
                      {item.stock_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.price_normal} pts</TableCell>
                  <TableCell>{item.price_mastor} pts</TableCell>
                  <TableCell>{item.price_botl} pts</TableCell>
                  {userRole === "super_admin" && (
                    <TableCell>{getChurchName(item.church_id)}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                        disabled={isLoading}
                      >
                        {item.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      {userRole === "super_admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Store Item</DialogTitle>
            <DialogDescription>
              Create a new item for the store with different pricing tiers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter item description"
                rows={3}
              />
            </div>
            <ImageUpload
              label="Item Image"
              currentImageUrl={formData.image_url}
              onImageUploaded={(url) =>
                setFormData({ ...formData, image_url: url })
              }
              bucket="images"
              folder="store/items"
              maxSizeMB={3}
            />

            {/* Stock Type */}
            <div>
              <Label>Stock Management *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock_type"
                    value="quantity"
                    checked={formData.stock_type === "quantity"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_type: e.target.value as "quantity" | "on_demand",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Limited Quantity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="stock_type"
                    value="on_demand"
                    checked={formData.stock_type === "on_demand"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_type: e.target.value as "quantity" | "on_demand",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Available on Demand</span>
                </label>
              </div>
            </div>

            {/* Stock Quantity (only if type is quantity) */}
            {formData.stock_type === "quantity" && (
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
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
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_normal">Price (Normal) *</Label>
                <Input
                  id="price_normal"
                  type="number"
                  min="0"
                  value={formData.price_normal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_normal: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_mastor">Price (Mastor) *</Label>
                <Input
                  id="price_mastor"
                  type="number"
                  min="0"
                  value={formData.price_mastor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_mastor: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_botl">Price (Botl) *</Label>
                <Input
                  id="price_botl"
                  type="number"
                  min="0"
                  value={formData.price_botl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_botl: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
            </div>

            {/* Church Selection (Super Admin only) */}
            {userRole === "super_admin" && churches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Available in Churches</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        formData.church_ids.length === filteredChurches.length
                      ) {
                        setFormData({ ...formData, church_ids: [] });
                      } else {
                        setFormData({
                          ...formData,
                          church_ids: filteredChurches.map((c) => c.id),
                        });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.church_ids.length === filteredChurches.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Select specific churches where this item will be available
                </p>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {filteredChurches.map((church) => (
                    <label
                      key={church.id}
                      className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.church_ids.includes(church.id)}
                        onChange={(e) =>
                          handleChurchChange(church.id, e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {church.name}
                        {church.dioceses && ` - ${church.dioceses.name}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Diocese Selection (Super Admin only) */}
            {userRole === "super_admin" && dioceses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Available in Dioceses</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.diocese_ids.length === dioceses.length) {
                        setFormData({ ...formData, diocese_ids: [] });
                      } else {
                        setFormData({
                          ...formData,
                          diocese_ids: dioceses.map((d) => d.id),
                        });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.diocese_ids.length === dioceses.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Select dioceses - item will be available to all churches in
                  selected dioceses
                </p>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {dioceses.map((diocese) => (
                    <label
                      key={diocese.id}
                      className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.diocese_ids.includes(diocese.id)}
                        onChange={(e) =>
                          handleDioceseChange(diocese.id, e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{diocese.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Class Availability */}
            <div>
              <Label>Class Availability *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="class_availability"
                    checked={formData.is_available_to_all_classes}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: true,
                        class_ids: [],
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Available to All Classes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="class_availability"
                    checked={!formData.is_available_to_all_classes}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: false,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Specific Classes Only</span>
                </label>
              </div>
            </div>

            {/* Specific Classes Selection */}
            {!formData.is_available_to_all_classes &&
              filteredClasses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Classes</Label>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          formData.class_ids.length === filteredClasses.length
                        ) {
                          setFormData({ ...formData, class_ids: [] });
                        } else {
                          setFormData({
                            ...formData,
                            class_ids: filteredClasses.map((c) => c.id),
                          });
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {formData.class_ids.length === filteredClasses.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  <div className="border rounded p-2 max-h-40 overflow-y-auto">
                    {filteredClasses.map((classItem) => (
                      <label
                        key={classItem.id}
                        className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.class_ids.includes(classItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                class_ids: [
                                  ...formData.class_ids,
                                  classItem.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                class_ids: formData.class_ids.filter(
                                  (id) => id !== classItem.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{classItem.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store Item</DialogTitle>
            <DialogDescription>
              Update item information and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter item description"
                rows={3}
              />
            </div>
            <ImageUpload
              label="Item Image"
              currentImageUrl={formData.image_url}
              onImageUploaded={(url) =>
                setFormData({ ...formData, image_url: url })
              }
              bucket="images"
              folder="store/items"
              maxSizeMB={3}
            />

            {/* Stock Type */}
            <div>
              <Label>Stock Management *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_stock_type"
                    value="quantity"
                    checked={formData.stock_type === "quantity"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_type: e.target.value as "quantity" | "on_demand",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Limited Quantity</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_stock_type"
                    value="on_demand"
                    checked={formData.stock_type === "on_demand"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_type: e.target.value as "quantity" | "on_demand",
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Available on Demand</span>
                </label>
              </div>
            </div>

            {/* Stock Quantity (only if type is quantity) */}
            {formData.stock_type === "quantity" && (
              <div className="space-y-2">
                <Label htmlFor="edit-stock_quantity">Stock Quantity *</Label>
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
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price_normal">Price (Normal) *</Label>
                <Input
                  id="edit-price_normal"
                  type="number"
                  min="0"
                  value={formData.price_normal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_normal: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price_mastor">Price (Mastor) *</Label>
                <Input
                  id="edit-price_mastor"
                  type="number"
                  min="0"
                  value={formData.price_mastor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_mastor: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price_botl">Price (Botl) *</Label>
                <Input
                  id="edit-price_botl"
                  type="number"
                  min="0"
                  value={formData.price_botl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_botl: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Points"
                />
              </div>
            </div>

            {/* Church Selection (Super Admin only) */}
            {userRole === "super_admin" && churches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Available in Churches</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        formData.church_ids.length === filteredChurches.length
                      ) {
                        setFormData({ ...formData, church_ids: [] });
                      } else {
                        setFormData({
                          ...formData,
                          church_ids: filteredChurches.map((c) => c.id),
                        });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.church_ids.length === filteredChurches.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Select specific churches where this item will be available
                </p>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {filteredChurches.map((church) => (
                    <label
                      key={church.id}
                      className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.church_ids.includes(church.id)}
                        onChange={(e) =>
                          handleChurchChange(church.id, e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {church.name}
                        {church.dioceses && ` - ${church.dioceses.name}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Diocese Selection (Super Admin only) */}
            {userRole === "super_admin" && dioceses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Available in Dioceses</Label>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.diocese_ids.length === dioceses.length) {
                        setFormData({ ...formData, diocese_ids: [] });
                      } else {
                        setFormData({
                          ...formData,
                          diocese_ids: dioceses.map((d) => d.id),
                        });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.diocese_ids.length === dioceses.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Select dioceses - item will be available to all churches in
                  selected dioceses
                </p>
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {dioceses.map((diocese) => (
                    <label
                      key={diocese.id}
                      className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.diocese_ids.includes(diocese.id)}
                        onChange={(e) =>
                          handleDioceseChange(diocese.id, e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{diocese.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Class Availability */}
            <div>
              <Label>Class Availability *</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_class_availability"
                    checked={formData.is_available_to_all_classes}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: true,
                        class_ids: [],
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Available to All Classes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="edit_class_availability"
                    checked={!formData.is_available_to_all_classes}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: false,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span>Specific Classes Only</span>
                </label>
              </div>
            </div>

            {/* Specific Classes Selection */}
            {!formData.is_available_to_all_classes &&
              filteredClasses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Classes</Label>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          formData.class_ids.length === filteredClasses.length
                        ) {
                          setFormData({ ...formData, class_ids: [] });
                        } else {
                          setFormData({
                            ...formData,
                            class_ids: filteredClasses.map((c) => c.id),
                          });
                        }
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {formData.class_ids.length === filteredClasses.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  <div className="border rounded p-2 max-h-40 overflow-y-auto">
                    {filteredClasses.map((classItem) => (
                      <label
                        key={classItem.id}
                        className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.class_ids.includes(classItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                class_ids: [
                                  ...formData.class_ids,
                                  classItem.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                class_ids: formData.class_ids.filter(
                                  (id) => id !== classItem.id
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{classItem.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.image_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="max-h-64 rounded-lg object-cover"
                  />
                </div>
              )}
              <div>
                <Label>Item Name</Label>
                <p className="text-lg font-semibold">{selectedItem.name}</p>
              </div>
              {selectedItem.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-muted-foreground">
                    {selectedItem.description}
                  </p>
                </div>
              )}
              <div>
                <Label>Stock Quantity</Label>
                <p className="text-lg">{selectedItem.stock_quantity}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price (Normal)</Label>
                  <p className="text-lg font-semibold">
                    {selectedItem.price_normal} pts
                  </p>
                </div>
                <div>
                  <Label>Price (Mastor)</Label>
                  <p className="text-lg font-semibold">
                    {selectedItem.price_mastor} pts
                  </p>
                </div>
                <div>
                  <Label>Price (Botl)</Label>
                  <p className="text-lg font-semibold">
                    {selectedItem.price_botl} pts
                  </p>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div>
                  <Badge
                    variant={selectedItem.is_active ? "default" : "secondary"}
                  >
                    {selectedItem.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {userRole === "super_admin" && (
                <div>
                  <Label>Church</Label>
                  <p>{getChurchName(selectedItem.church_id)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

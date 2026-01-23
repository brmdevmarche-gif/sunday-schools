"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { StoreItem } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { normalizeNonNegativeIntInput, toNonNegativeInt } from "@/lib/utils";
import {
  createStoreItemAction,
  deleteStoreItemAction,
  toggleStoreItemStatusAction,
  getItemDemandStatsByMonthAction,
  type MonthlyItemDemandStats,
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
  totalCount: number;
  page: number;
  pageSize: number;
  from: string | null;
  to: string | null;
  churches: Church[];
  dioceses: { id: string; name: string }[];
  classes: ClassItem[];
  userRole: string;
}

export default function StoreClient({
  items: initialItems,
  totalCount,
  page,
  pageSize,
  from,
  to,
  churches,
  dioceses,
  classes,
  userRole,
}: StoreClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [items, setItems] = useState<StoreItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromLocal, setFromLocal] = useState<string>(() =>
    isoToDatetimeLocal(from)
  );
  const [toLocal, setToLocal] = useState<string>(() => isoToDatetimeLocal(to));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemandView, setShowDemandView] = useState(false);
  const [demandGroups, setDemandGroups] = useState<MonthlyItemDemandStats[]>(
    []
  );
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);
  const [expandedDemandMonths, setExpandedDemandMonths] = useState<
    Set<string>
  >(new Set());
  const [demandFromLocal, setDemandFromLocal] = useState<string>("");
  const [demandToLocal, setDemandToLocal] = useState<string>("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setFromLocal(isoToDatetimeLocal(from));
    setToLocal(isoToDatetimeLocal(to));
  }, [from, to]);

  useEffect(() => {
    // Expand all demand month groups by default whenever data changes
    setExpandedDemandMonths(new Set(demandGroups.map((g) => g.month_key)));
  }, [demandGroups]);

  function isoToDatetimeLocal(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function datetimeLocalToIso(local: string) {
    if (!local) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function pushWithParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`?${sp.toString()}`);
  }

  function applyDateFilter(
    nextFromIso: string | null,
    nextToIso: string | null
  ) {
    pushWithParams({
      page: "1",
      pageSize: String(pageSize),
      from: nextFromIso,
      to: nextToIso,
    });
  }

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));

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

  const openViewDialog = (item: StoreItem) => {
    router.push(`/admin/store/${item.id}`);
  };

  const loadDemandStats = async () => {
    setIsLoadingDemand(true);
    try {
      const fromIso = datetimeLocalToIso(demandFromLocal);
      const toIso = datetimeLocalToIso(demandToLocal);
      const groups = await getItemDemandStatsByMonthAction({
        from: fromIso ?? undefined,
        to: toIso ?? undefined,
      });
      setDemandGroups(groups);
      setShowDemandView(true);
    } catch (error) {
      console.error("Failed to load demand stats:", error);
      toast.error("Failed to load demand statistics");
    } finally {
      setIsLoadingDemand(false);
    }
  };

  const exportDemandToExcel = () => {
    if (demandGroups.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Create CSV content (Excel compatible)
    const headers = [
      t("common.date"),
      t("store.item"),
      t("store.stock"),
      t("store.pending"),
      t("store.approved"),
      t("store.needsRestock"),
    ];

    const rows: Array<Array<string | number>> = [];
    for (const group of demandGroups) {
      for (const stat of group.stats) {
        const needsRestock =
          stat.stock_type === "quantity" &&
          stat.pending_requests + stat.approved_requests > stat.stock_quantity;
        rows.push([
          group.month_label,
          stat.item_name,
          stat.stock_type === "on_demand" ? "Unlimited" : stat.stock_quantity,
          stat.pending_requests,
          stat.approved_requests,
          needsRestock ? t("store.restock") : t("store.ok"),
        ]);
      }
    }

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const csvContent =
      BOM + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

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

  const groupedItems = (() => {
    const groups = new Map<
      string,
      { key: string; label: string; items: StoreItem[] }
    >();
    for (const item of filteredItems) {
      const d = new Date(item.created_at);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${yyyy}-${mm}`;
      const label = new Date(yyyy, d.getMonth(), 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      });
      const existing = groups.get(key);
      if (existing) existing.items.push(item);
      else groups.set(key, { key, label, items: [item] });
    }
    return Array.from(groups.values()).sort((a, b) =>
      b.key.localeCompare(a.key)
    );
  })();

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
          <Button
            onClick={() => router.push("/admin/store/create")}
            className="w-full sm:w-auto"
          >
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
              <Button variant="ghost" onClick={() => setShowDemandView(false)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
              <div>
                <h2 className="text-xl font-semibold">
                  {t("store.itemDemand")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("store.itemDemandDescription")}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">{t("common.from")}</Label>
                <Input
                  type="datetime-local"
                  value={demandFromLocal}
                  onChange={(e) => setDemandFromLocal(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.to")}</Label>
                <Input
                  type="datetime-local"
                  value={demandToLocal}
                  onChange={(e) => setDemandToLocal(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={loadDemandStats}
                disabled={isLoadingDemand}
              >
                {t("common.apply")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDemandFromLocal("");
                  setDemandToLocal("");
                  loadDemandStats();
                }}
              >
                {t("common.clear")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setDate(now.getDate() - 7);
                  setDemandFromLocal(isoToDatetimeLocal(start.toISOString()));
                  setDemandToLocal(isoToDatetimeLocal(now.toISOString()));
                  loadDemandStats();
                }}
              >
                {t("store.lastWeek")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setMonth(now.getMonth() - 1);
                  setDemandFromLocal(isoToDatetimeLocal(start.toISOString()));
                  setDemandToLocal(isoToDatetimeLocal(now.toISOString()));
                  loadDemandStats();
                }}
              >
                {t("store.lastMonth")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                    0,
                    0,
                    0
                  );
                  setDemandFromLocal(isoToDatetimeLocal(start.toISOString()));
                  setDemandToLocal(isoToDatetimeLocal(now.toISOString()));
                  loadDemandStats();
                }}
              >
                {t("store.currentMonth")}
              </Button>
              <Button
                onClick={exportDemandToExcel}
                variant="outline"
                disabled={demandGroups.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("store.exportExcel")}
              </Button>
            </div>
          </div>

          {demandGroups.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              {t("store.noItems")}
            </div>
          ) : (
            <div className="space-y-8">
              {demandGroups.map((group) => {
                const isExpanded = expandedDemandMonths.has(group.month_key);
                return (
                  <div key={group.month_key} className="space-y-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-left hover:bg-muted"
                      onClick={() =>
                        setExpandedDemandMonths((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.month_key)) {
                            next.delete(group.month_key);
                          } else {
                            next.add(group.month_key);
                          }
                          return next;
                        })
                      }
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{group.month_label}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {group.stats.length} {t("store.items")}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("store.item")}</TableHead>
                              <TableHead className="text-center">
                                {t("store.stock")}
                              </TableHead>
                              <TableHead className="text-center">
                                {t("store.pending")}
                              </TableHead>
                              <TableHead className="text-center">
                                {t("store.approved")}
                              </TableHead>
                              <TableHead className="text-center">
                                {t("store.needsRestock")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.stats.map((stat) => {
                              const needsRestock =
                                stat.stock_type === "quantity" &&
                                stat.pending_requests +
                                  stat.approved_requests >
                                  stat.stock_quantity;
                              return (
                                <TableRow
                                  key={`${group.month_key}-${stat.item_id}`}
                                >
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
                                        <div className="font-medium">
                                          {stat.item_name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {stat.stock_type === "on_demand"
                                            ? "On Demand"
                                            : "Limited Stock"}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {stat.stock_type === "on_demand" ? (
                                      <Badge variant="outline">Unlimited</Badge>
                                    ) : (
                                      <Badge
                                        variant={
                                          stat.stock_quantity > 0
                                            ? "default"
                                            : "destructive"
                                        }
                                      >
                                        {stat.stock_quantity}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Clock className="h-4 w-4 text-yellow-500" />
                                      <span className="font-medium">
                                        {stat.pending_requests}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-blue-500" />
                                      <span className="font-medium">
                                        {stat.approved_requests}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {needsRestock ? (
                                      <Badge
                                        variant="destructive"
                                        className="gap-1"
                                      >
                                        <AlertTriangle className="h-3 w-3" />
                                        {t("store.restock")}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-green-600"
                                      >
                                        {t("store.ok")}
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="flex items-end gap-4 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Date/Time Range */}
            <div className="flex items-end gap-2 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">{t("common.from")}</Label>
                <Input
                  type="datetime-local"
                  value={fromLocal}
                  onChange={(e) => setFromLocal(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("common.to")}</Label>
                <Input
                  type="datetime-local"
                  value={toLocal}
                  onChange={(e) => setToLocal(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  applyDateFilter(
                    datetimeLocalToIso(fromLocal),
                    datetimeLocalToIso(toLocal)
                  )
                }
              >
                {t("common.apply")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFromLocal("");
                  setToLocal("");
                  applyDateFilter(null, null);
                }}
              >
                {t("common.clear")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setDate(now.getDate() - 7);
                  const fromIso = start.toISOString();
                  const toIso = now.toISOString();
                  setFromLocal(isoToDatetimeLocal(fromIso));
                  setToLocal(isoToDatetimeLocal(toIso));
                  applyDateFilter(fromIso, toIso);
                }}
              >
                {t("store.lastWeek")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setMonth(now.getMonth() - 1);
                  const fromIso = start.toISOString();
                  const toIso = now.toISOString();
                  setFromLocal(isoToDatetimeLocal(fromIso));
                  setToLocal(isoToDatetimeLocal(toIso));
                  applyDateFilter(fromIso, toIso);
                }}
              >
                {t("store.lastMonth")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                    0,
                    0,
                    0
                  );
                  const fromIso = start.toISOString();
                  const toIso = now.toISOString();
                  setFromLocal(isoToDatetimeLocal(fromIso));
                  setToLocal(isoToDatetimeLocal(toIso));
                  applyDateFilter(fromIso, toIso);
                }}
              >
                {t("store.currentMonth")}
              </Button>
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
                  groupedItems.flatMap((group) => {
                    const colSpan = userRole === "super_admin" ? 8 : 7;
                    return [
                      <TableRow key={`month-${group.key}`}>
                        <TableCell
                          colSpan={colSpan}
                          className="bg-muted/40 font-medium"
                        >
                          {group.label}
                        </TableCell>
                      </TableRow>,
                      ...group.items.map((item) => (
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
                                item.stock_quantity > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {item.stock_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.price_normal} pts</TableCell>
                          <TableCell>{item.price_mastor} pts</TableCell>
                          <TableCell>{item.price_botl} pts</TableCell>
                          {userRole === "super_admin" && (
                            <TableCell>
                              {getChurchName(item.church_id)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge
                              variant={item.is_active ? "default" : "secondary"}
                            >
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
                                onClick={() =>
                                  router.push(`/admin/store/${item.id}/edit`)
                                }
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
                      )),
                    ];
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm text-muted-foreground">
              {filteredItems.length} / {totalCount} {t("store.items")} •{" "}
              {t("common.page")} {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  pushWithParams({ page: String(Math.max(1, page - 1)) })
                }
                disabled={page <= 1}
              >
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  pushWithParams({
                    page: String(Math.min(totalPages, page + 1)),
                  })
                }
                disabled={page >= totalPages}
              >
                {t("common.next")}
              </Button>
            </div>
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
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(
                      e.target.value
                    );
                    setFormData({
                      ...formData,
                      stock_quantity: toNonNegativeInt(normalized, 0),
                    });
                  }}
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
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(
                      e.target.value
                    );
                    setFormData({
                      ...formData,
                      price_normal: toNonNegativeInt(normalized, 0),
                    });
                  }}
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
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(
                      e.target.value
                    );
                    setFormData({
                      ...formData,
                      price_mastor: toNonNegativeInt(normalized, 0),
                    });
                  }}
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
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(
                      e.target.value
                    );
                    setFormData({
                      ...formData,
                      price_botl: toNonNegativeInt(normalized, 0),
                    });
                  }}
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

      {/* Editing is handled on the dedicated page: /admin/store/[id]/edit */}
    </div>
  );
}

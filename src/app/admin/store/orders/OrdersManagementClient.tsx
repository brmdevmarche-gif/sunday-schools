"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Filter,
  Search,
} from "lucide-react";
import { updateOrderStatusAction, bulkUpdateOrderStatusAction } from "./actions";
import type { OrderStatus } from "@/lib/types/sunday-school";

interface OrderUser {
  id: string;
  full_name: string | null;
  email: string;
  church_id: string | null;
  diocese_id: string | null;
}

interface OrderItem {
  id: string;
  order_id: string;
  store_item_id: string;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  quantity: number;
  price_tier: string;
  unit_price: number;
  total_price: number;
  created_at: string;
  store_items: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  user_id: string;
  class_id: string | null;
  status: OrderStatus;
  total_points: number;
  notes: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  users: OrderUser;
  order_items: OrderItem[];
}

interface OrdersManagementClientProps {
  orders: Order[];
  userProfile: any;
}

export default function OrdersManagementClient({
  orders,
  userProfile,
}: OrdersManagementClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const userName = order.users?.full_name?.toLowerCase() || "";
        const userEmail = order.users?.email?.toLowerCase() || "";
        const orderId = order.id.toLowerCase();
        const itemNames = order.order_items
          .map((item) => item.item_name.toLowerCase())
          .join(" ");

        if (
          !userName.includes(query) &&
          !userEmail.includes(query) &&
          !orderId.includes(query) &&
          !itemNames.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  function getStatusColor(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "approved":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "fulfilled":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "cancelled":
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  function toggleOrderSelection(orderId: string) {
    const newSelection = new Set(selectedOrders);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrders(newSelection);
  }

  function selectAll() {
    setSelectedOrders(new Set(filteredOrders.map((o) => o.id)));
  }

  function deselectAll() {
    setSelectedOrders(new Set());
  }

  async function handleUpdateStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string
  ) {
    setIsProcessing(true);
    try {
      await updateOrderStatusAction({
        order_id: orderId,
        status,
        admin_notes: notes,
      });
      toast.success(t("store.orderStatusUpdated"));
      router.refresh();
      setSelectedOrder(null);
      setAdminNotes("");
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message || t("store.updateFailed"));
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBulkUpdateStatus(status: OrderStatus) {
    if (selectedOrders.size === 0) {
      toast.error(t("store.noOrdersSelected"));
      return;
    }

    setIsProcessing(true);
    try {
      const orderIds = Array.from(selectedOrders);
      const { successCount, failedCount } = await bulkUpdateOrderStatusAction(
        orderIds,
        status
      );

      toast.success(
        t("store.bulkUpdateSuccess", {
          success: successCount,
          failed: failedCount,
        })
      );
      router.refresh();
      deselectAll();
    } catch (error: any) {
      console.error("Error bulk updating orders:", error);
      toast.error(error.message || t("store.bulkUpdateFailed"));
    } finally {
      setIsProcessing(false);
    }
  }

  const allSelected =
    filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length;
  const someSelected = selectedOrders.size > 0 && !allSelected;

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t("store.ordersManagement")}</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredOrders.length} {t("store.orders")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search and Filter */}
            <div className="flex flex-1 gap-4 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("store.searchOrders")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("store.allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("store.status.pending")}</SelectItem>
                  <SelectItem value="approved">{t("store.status.approved")}</SelectItem>
                  <SelectItem value="fulfilled">
                    {t("store.status.fulfilled")}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t("store.status.cancelled")}
                  </SelectItem>
                  <SelectItem value="rejected">{t("store.status.rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus("approved")}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t("store.approveSelected")} ({selectedOrders.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus("rejected")}
                  disabled={isProcessing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("store.rejectSelected")} ({selectedOrders.size})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkUpdateStatus("fulfilled")}
                  disabled={isProcessing}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {t("store.fulfillSelected")} ({selectedOrders.size})
                </Button>
              </div>
            )}
          </div>

          {/* Select All */}
          {filteredOrders.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) selectAll();
                  else deselectAll();
                }}
                ref={(el) => {
                  if (el) {
                    (el as any).indeterminate = someSelected;
                  }
                }}
              />
              <Label className="text-sm cursor-pointer" onClick={() => {
                if (allSelected) deselectAll();
                else selectAll();
              }}>
                {allSelected
                  ? t("store.deselectAll")
                  : someSelected
                  ? t("store.selectedCount", { count: selectedOrders.size })
                  : t("store.selectAll")}
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="container mx-auto px-4 py-8">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t("store.noOrdersFound")}</p>
              <p className="text-sm text-muted-foreground">
                {t("store.noOrdersFoundDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {order.users?.full_name || order.users?.email}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>#{order.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span>
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            {t(`store.status.${order.status}`)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setSelectedOrder(order)}
                              >
                                {t("store.viewDetails")}
                              </DropdownMenuItem>
                              {order.status === "pending" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(order.id, "approved")
                                    }
                                  >
                                    {t("store.approve")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(order.id, "rejected")
                                    }
                                  >
                                    {t("store.reject")}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {order.status === "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(order.id, "fulfilled")
                                  }
                                >
                                  {t("store.markFulfilled")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                        >
                          {item.store_items?.image_url && (
                            <img
                              src={item.store_items.image_url}
                              alt={item.item_name}
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span>
                            {item.item_name} × {item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <div className="flex items-center px-3 py-1 text-sm text-muted-foreground">
                          +{order.order_items.length - 3} {t("store.more")}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {order.total_points} {t("store.points")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>
                      {t("store.order")} #{selectedOrder.id.slice(0, 8)}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedOrder.users?.full_name || selectedOrder.users?.email} •{" "}
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {t(`store.status.${selectedOrder.status}`)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">{t("store.items")}</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        {item.store_items?.image_url && (
                          <img
                            src={item.store_items.image_url}
                            alt={item.item_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.unit_price} {t("store.points")} × {item.quantity} •{" "}
                            {t(`store.tier.${item.price_tier}`)}
                          </p>
                        </div>
                        <p className="font-bold">
                          {item.total_price} {t("store.points")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">{t("store.userNotes")}</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h3 className="font-semibold mb-2">{t("store.adminNotes")}</h3>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={t("store.adminNotesPlaceholder")}
                    rows={3}
                  />
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>{t("store.total")}</span>
                    <span>
                      {selectedOrder.total_points} {t("store.points")}
                    </span>
                  </div>
                </div>

                {/* Processed Info */}
                {selectedOrder.processed_at && (
                  <div className="text-sm text-muted-foreground">
                    {t("store.processedAt")}{" "}
                    {new Date(selectedOrder.processed_at).toLocaleString()}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  {t("common.close")}
                </Button>
                {selectedOrder.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          "rejected",
                          adminNotes
                        )
                      }
                      disabled={isProcessing}
                    >
                      {t("store.reject")}
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedOrder.id,
                          "approved",
                          adminNotes
                        )
                      }
                      disabled={isProcessing}
                    >
                      {t("store.approve")}
                    </Button>
                  </>
                )}
                {selectedOrder.status === "approved" && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus(
                        selectedOrder.id,
                        "fulfilled",
                        adminNotes
                      )
                    }
                    disabled={isProcessing}
                  >
                    {t("store.markFulfilled")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

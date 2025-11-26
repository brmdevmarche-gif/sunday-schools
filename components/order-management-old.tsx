"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { StudentOrder, Store } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  
} from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Star,
  User,
  Calendar,
  MessageSquare,
  DollarSign,
  Coins,
} from "lucide-react";

interface OrderManagementProps {
  managerId: number;
}

export function OrderManagement({ managerId }: OrderManagementProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "mark_purchased" | "mark_ready"
  >("approve");
  const [actionNotes, setActionNotes] = useState("");

  const supabase = createClient();

  // Load stores managed by this user
  useEffect(() => {
    async function loadStores() {
      try {
        setLoading(true);

        const { data: managedStores, error: storesError } = await supabase
          .from("stores")
          .select("*")
          .eq("manager_id", managerId)
          .eq("is_active", true);

        if (storesError) throw storesError;
        setStores(managedStores || []);

        if (managedStores && managedStores.length > 0) {
          setSelectedStore(managedStores[0]);
        }
      } catch (err) {
        console.error("Error loading stores:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadStores();
  }, [managerId]);

  // Load orders for selected store
  useEffect(() => {
    async function loadOrders() {
      if (!selectedStore) return;

      try {
        const { data: storeOrders, error: ordersError } = await supabase
          .from("student_orders")
          .select(
            `
            id,
            student_id,
            store_item_id,
            quantity,
            total_points,
            total_cash,
            status,
            payment_method,
            notes,
            created_at,
            updated_at,
            students (
              first_name,
              last_name,
              phone_number
            ),
            store_items (
              id,
              name,
              description,
              image_url,
              store_id
            )
          `
          )
          .eq("store_items.store_id", selectedStore.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(storeOrders || []);
      } catch (err) {
        console.error("Error loading orders:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred loading orders"
        );
      }
    }

    loadOrders();
  }, [selectedStore]);

  // Handle order action
  const handleOrderAction = async () => {
    if (!selectedOrder) return;

    try {
      let newStatus = selectedOrder.status;

      switch (actionType) {
        case "approve":
          newStatus = "approved";
          break;
        case "reject":
          newStatus = "cancelled";
          break;
        case "mark_purchased":
          newStatus = "purchased";
          break;
        case "mark_ready":
          newStatus = "ready";
          break;
      }

      const { error } = await supabase
        .from("student_orders")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // If marking as purchased or collected, update student wallet
      if (actionType === "mark_purchased") {
        const paymentAmount =
          selectedOrder.payment_method === "points"
            ? selectedOrder.total_points
            : selectedOrder.total_cash;
        const paymentType = selectedOrder.payment_method;

        // Deduct from student wallet
        const { error: walletError } = await supabase.rpc(
          "update_student_wallet",
          {
            student_id: selectedOrder.student_id,
            points_change: paymentType === "points" ? -paymentAmount : 0,
            cash_change: paymentType === "cash" ? -paymentAmount : 0,
            description: `Purchase: ${selectedOrder.store_items?.name}`,
            order_id: selectedOrder.id,
          }
        );

        if (walletError) {
          console.error("Wallet update error:", walletError);
        }

        // Update item stock
        const { error: stockError } = await supabase
          .from("store_items")
          .update({
            stock_quantity:
              selectedOrder.store_items.stock_quantity - selectedOrder.quantity,
          })
          .eq("id", selectedOrder.store_item_id);

        if (stockError) {
          console.error("Stock update error:", stockError);
        }
      }

      // Reload orders
      if (selectedStore) {
        const { data: storeOrders, error: ordersError } = await supabase
          .from("student_orders")
          .select(
            `
            id,
            student_id,
            store_item_id,
            quantity,
            total_points,
            total_cash,
            status,
            payment_method,
            notes,
            created_at,
            updated_at,
            students (
              first_name,
              last_name,
              phone_number
            ),
            store_items (
              id,
              name,
              description,
              image_url,
              store_id,
              stock_quantity
            )
          `
          )
          .eq("store_items.store_id", selectedStore.id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(storeOrders || []);
      }

      // Reset form
      setActionDialogOpen(false);
      setSelectedOrder(null);
      setActionNotes("");
      setError(null);
    } catch (err) {
      console.error("Error updating order:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "purchased":
        return <Package className="h-4 w-4 text-green-500" />;
      case "ready":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "collected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      case "purchased":
        return "bg-green-100 text-green-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "collected":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableActions = (status: string) => {
    switch (status) {
      case "pending":
        return [
          {
            type: "approve" as const,
            label: "Approve Order",
            variant: "default" as const,
          },
          {
            type: "reject" as const,
            label: "Reject Order",
            variant: "destructive" as const,
          },
        ];
      case "approved":
        return [
          {
            type: "mark_purchased" as const,
            label: "Mark as Purchased",
            variant: "default" as const,
          },
          {
            type: "reject" as const,
            label: "Cancel Order",
            variant: "destructive" as const,
          },
        ];
      case "purchased":
        return [
          {
            type: "mark_ready" as const,
            label: "Mark as Ready",
            variant: "default" as const,
          },
        ];
      default:
        return [];
    }
  };

  const filterOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading orders...</div>
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

  if (stores.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Stores Assigned
              </h3>
              <p className="text-gray-500">
                You are not assigned as a manager for any stores.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">Store Manager</span>
        </div>
      </div>

      {/* Store selection */}
      {stores.length > 1 && (
        <div className="flex space-x-4">
          {stores.map((store) => (
            <SimpleButton
              key={store.id}
              variant={selectedStore?.id === store.id ? "default" : "outline"}
              onClick={() => setSelectedStore(store)}
            >
              {store.name}
            </SimpleButton>
          ))}
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            Pending ({filterOrdersByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filterOrdersByStatus("approved").length})
          </TabsTrigger>
          <TabsTrigger value="purchased">
            Purchased ({filterOrdersByStatus("purchased").length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({filterOrdersByStatus("ready").length})
          </TabsTrigger>
          <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
        </TabsList>

        {["pending", "approved", "purchased", "ready", "all"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {(status === "all" ? orders : filterOrdersByStatus(status)).map(
              (order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">
                            {order.store_items?.name}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>
                                {order.students?.first_name}{" "}
                                {order.students?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span>Quantity: {order.quantity}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                Ordered:{" "}
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {order.payment_method === "points" ? (
                                <Coins className="h-4 w-4 text-blue-500" />
                              ) : (
                                <DollarSign className="h-4 w-4 text-green-500" />
                              )}
                              <span>
                                Total:{" "}
                                {order.payment_method === "points"
                                  ? `${order.total_points} points`
                                  : `$${order.total_cash?.toFixed(2)}`}
                              </span>
                            </div>
                            {order.notes && (
                              <div className="flex items-start space-x-2">
                                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span className="text-gray-600">
                                  {order.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-2 pt-2">
                          {getAvailableActions(order.status).map((action) => (
                            <Dialog
                              key={action.type}
                              open={
                                actionDialogOpen &&
                                selectedOrder?.id === order.id &&
                                actionType === action.type
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setActionDialogOpen(false);
                                  setSelectedOrder(null);
                                }
                              }}
                            >
                              <SimpleDialogTrigger>
                                <SimpleButton
                                  variant={action.variant}
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setActionType(action.type);
                                    setActionDialogOpen(true);
                                  }}
                                >
                                  {action.label}
                                </SimpleButton>
                              </SimpleDialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{action.label}</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to{" "}
                                    {action.label.toLowerCase()} for{" "}
                                    {order.store_items?.name}?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-md">
                                    <div className="text-sm space-y-1">
                                      <div>
                                        <strong>Student:</strong>{" "}
                                        {order.students?.first_name}{" "}
                                        {order.students?.last_name}
                                      </div>
                                      <div>
                                        <strong>Item:</strong>{" "}
                                        {order.store_items?.name}
                                      </div>
                                      <div>
                                        <strong>Quantity:</strong>{" "}
                                        {order.quantity}
                                      </div>
                                      <div>
                                        <strong>Total:</strong>{" "}
                                        {order.payment_method === "points"
                                          ? `${order.total_points} points`
                                          : `$${order.total_cash?.toFixed(2)}`}
                                      </div>
                                    </div>
                                  </div>
                                  {action.type === "reject" && (
                                    <div>
                                      <Label htmlFor="notes">
                                        Reason for rejection (optional)
                                      </Label>
                                      <Textarea
                                        id="notes"
                                        placeholder="Provide a reason for rejecting this order..."
                                        value={actionNotes}
                                        onChange={(e) =>
                                          setActionNotes(e.target.value)
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <SimpleButton
                                    variant="outline"
                                    onClick={() => {
                                      setActionDialogOpen(false);
                                      setSelectedOrder(null);
                                    }}
                                  >
                                    Cancel
                                  </SimpleButton>
                                  <SimpleButton
                                    variant={action.variant}
                                    onClick={handleOrderAction}
                                  >
                                    Confirm {action.label}
                                  </SimpleButton>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ))}
                        </div>
                      </div>

                      {/* Item image */}
                      {order.store_items?.image_url && (
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden ml-4">
                          <img
                            src={order.store_items.image_url}
                            alt={order.store_items.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            )}

            {(status === "all" ? orders : filterOrdersByStatus(status))
              .length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {status === "all" ? "" : status} Orders
                    </h3>
                    <p className="text-gray-500">
                      {status === "all"
                        ? "No orders have been placed yet."
                        : `No orders with ${status} status.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

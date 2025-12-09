"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Package, X } from "lucide-react";
import { cancelOrderAction } from "@/app/admin/store/orders/actions";
import type { Order, OrderItem } from "@/lib/types/sunday-school";

interface OrderWithItems extends Order {
  order_items: Array<OrderItem & {
    store_items: {
      id: string;
      name: string;
      image_url: string | null;
    } | null;
  }>;
}

interface MyOrdersClientProps {
  orders: OrderWithItems[];
  userProfile: any;
}

export default function MyOrdersClient({ orders, userProfile }: MyOrdersClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  async function handleCancelOrder(orderId: string) {
    setIsCancelling(true);
    try {
      await cancelOrderAction(orderId);
      toast.success(t("store.orderCancelled"));
      router.refresh();
      setSelectedOrder(null);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast.error(error.message || t("store.cancelFailed"));
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("store.myOrders")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("store.myOrdersDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t("store.noOrders")}</p>
              <p className="text-sm text-muted-foreground">
                {t("store.noOrdersDescription")}
              </p>
              <Button className="mt-4" onClick={() => router.push("/store")}>
                {t("store.startShopping")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {t("store.order")} #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {t(`store.status.${order.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="font-bold text-foreground">
                      {order.total_points} {t("store.points")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
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
                        +{order.order_items.length - 3} {t("store.moreItems")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>
                    {t("store.order")} #{selectedOrder.id.slice(0, 8)}
                  </DialogTitle>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {t(`store.status.${selectedOrder.status}`)}
                  </Badge>
                </div>
                <DialogDescription>
                  {new Date(selectedOrder.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
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
                            {item.unit_price} {t("store.points")} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold">
                          {item.total_price} {t("store.points")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">{t("store.orderNotes")}</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedOrder.admin_notes && (
                  <div>
                    <h3 className="font-semibold mb-2">{t("store.adminNotes")}</h3>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {selectedOrder.admin_notes}
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>{t("store.total")}</span>
                    <span>
                      {selectedOrder.total_points} {t("store.points")}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  {t("common.close")}
                </Button>
                {selectedOrder.status === "pending" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={isCancelling}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isCancelling ? t("common.cancelling") : t("store.cancelOrder")}
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

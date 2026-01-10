"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  store_items: {
    id: string;
    name: string;
    name_ar?: string | null;
    image_url?: string | null;
  } | null;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_points: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  } | null;
  order_items: OrderItem[];
}

interface ParentOrdersClientProps {
  orders: Order[];
}

export function ParentOrdersClient({ orders }: ParentOrdersClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "fulfilled":
      case "delivered":
        return <Truck className="h-4 w-4" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "approved":
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "fulfilled":
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed":
        return t("status.approved");
      case "fulfilled":
      case "delivered":
        return t("parents.orders.delivered");
      default:
        return t(`status.${status}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "all") return true;
    if (selectedStatus === "confirmed") {
      return order.status === "approved" || order.status === "confirmed";
    }
    if (selectedStatus === "delivered") {
      return order.status === "fulfilled" || order.status === "delivered";
    }
    return order.status === selectedStatus;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/parents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{t("parents.orders.title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("parents.orders.subtitle", { count: filteredOrders.length })}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-4 mb-6">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("parents.orders.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="pending">{t("status.pending")}</SelectItem>
            <SelectItem value="confirmed">{t("status.approved")}</SelectItem>
            <SelectItem value="delivered">
              {t("parents.orders.delivered")}
            </SelectItem>
            <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon="ShoppingBag"
          title={t("parents.orders.noOrders")}
          description={t("parents.orders.noOrdersDescription")}
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <Badge
                    className={`${getStatusColor(order.status)} flex items-center gap-1`}
                  >
                    {getStatusIcon(order.status)}
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDate(order.created_at)}</span>
                  <span className="font-medium text-foreground">
                    {order.total_points} {t("common.pts")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.store_items?.image_url ? (
                        <Image
                          src={item.store_items.image_url}
                          alt={item.store_items.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isRTL
                            ? item.store_items?.name_ar || item.store_items?.name
                            : item.store_items?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {item.unit_price} {t("common.pts")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

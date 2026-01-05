"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Search,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";
import type { StoreItem, OrderStatus } from "@/lib/types";

interface OrderItemWithOrder {
  id: string;
  quantity: number;
  price_tier: string;
  unit_price: number;
  total_price: number;
  created_at: string;
  orders: {
    id: string;
    status: OrderStatus;
    created_at: string;
    users: {
      id: string;
      full_name: string | null;
      email: string;
      user_code: string | null;
    } | null;
  } | null;
}

interface Stats {
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  pendingOrders: number;
  approvedOrders: number;
  fulfilledOrders: number;
  cancelledOrders: number;
}

interface MonthlyData {
  month: string;
  orders: number;
  quantity: number;
}

interface TierDistribution {
  normal: number;
  mastor: number;
  botl: number;
}

interface StoreItemDetailsClientProps {
  item: StoreItem;
  orderItems: OrderItemWithOrder[];
  stats: Stats;
  monthlyData: MonthlyData[];
  tierDistribution: TierDistribution;
}

export default function StoreItemDetailsClient({
  item,
  orderItems,
  stats,
  monthlyData,
  tierDistribution,
}: StoreItemDetailsClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Filter orders
  const filteredOrders = orderItems.filter((oi) => {
    const order = oi.orders;
    if (!order) return false;

    // Status filter
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const userName = order.users?.full_name?.toLowerCase() || "";
      const userEmail = order.users?.email?.toLowerCase() || "";
      const userCode = order.users?.user_code?.toLowerCase() || "";

      if (
        !userName.includes(query) &&
        !userEmail.includes(query) &&
        !userCode.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

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

  // Find max value for chart scaling
  const maxQuantity = Math.max(...monthlyData.map((d) => d.quantity), 1);

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/store")}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div className="flex-1 flex items-center gap-4">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{item.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {item.description || t("store.noDescription")}
                </p>
              </div>
            </div>
            <Badge variant={item.is_active ? "default" : "secondary"}>
              {item.is_active ? t("common.active") : t("common.inactive")}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("store.totalOrders")}
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} {t("store.status.pending").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("store.totalQuantity")}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuantity}</div>
              <p className="text-xs text-muted-foreground">
                {t("store.itemsSold")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("store.totalRevenue")}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRevenue} {t("store.points")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("store.totalPointsSpent")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("store.fulfillmentRate")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrders > 0
                  ? Math.round(
                      (stats.fulfilledOrders / stats.totalOrders) * 100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.fulfilledOrders} / {stats.totalOrders}{" "}
                {t("store.status.fulfilled").toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("store.monthlyOrders")}
              </CardTitle>
              <CardDescription>
                {t("store.ordersOverLast6Months")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyData.map((data) => (
                  <div key={data.month} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-muted-foreground">
                      {data.month}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div
                        className="h-6 bg-primary rounded"
                        style={{
                          width: `${(data.quantity / maxQuantity) * 100}%`,
                          minWidth: data.quantity > 0 ? "8px" : "0",
                        }}
                      />
                      <span className="text-sm font-medium">
                        {data.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t("store.orderStatusDistribution")}</CardTitle>
              <CardDescription>
                {t("store.breakdownByStatus")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span>{t("store.status.pending")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.pendingOrders}</span>
                  <Badge className="bg-yellow-500/10 text-yellow-700">
                    {stats.totalOrders > 0
                      ? Math.round(
                          (stats.pendingOrders / stats.totalOrders) * 100
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>{t("store.status.approved")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.approvedOrders}</span>
                  <Badge className="bg-blue-500/10 text-blue-700">
                    {stats.totalOrders > 0
                      ? Math.round(
                          (stats.approvedOrders / stats.totalOrders) * 100
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span>{t("store.status.fulfilled")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.fulfilledOrders}</span>
                  <Badge className="bg-green-500/10 text-green-700">
                    {stats.totalOrders > 0
                      ? Math.round(
                          (stats.fulfilledOrders / stats.totalOrders) * 100
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>{t("store.cancelled")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats.cancelledOrders}</span>
                  <Badge className="bg-red-500/10 text-red-700">
                    {stats.totalOrders > 0
                      ? Math.round(
                          (stats.cancelledOrders / stats.totalOrders) * 100
                        )
                      : 0}
                    %
                  </Badge>
                </div>
              </div>

              {/* Price Tier Distribution */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">
                  {t("store.priceTierDistribution")}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("store.tier.normal")}</span>
                    <span className="font-medium">{tierDistribution.normal}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("store.tier.mastor")}</span>
                    <span className="font-medium">{tierDistribution.mastor}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{t("store.tier.botl")}</span>
                    <span className="font-medium">{tierDistribution.botl}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>{t("store.pricing")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("store.tier.normal")}
                </p>
                <p className="text-2xl font-bold">
                  {item.price_normal} {t("store.points")}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("store.tier.mastor")}
                </p>
                <p className="text-2xl font-bold">
                  {item.price_mastor} {t("store.points")}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("store.tier.botl")}
                </p>
                <p className="text-2xl font-bold">
                  {item.price_botl} {t("store.points")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("store.ordersForThisItem")}
                </CardTitle>
                <CardDescription>
                  {filteredOrders.length} {t("store.orders")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("store.searchOrders")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as OrderStatus | "all")
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("store.allStatuses")}</SelectItem>
                    <SelectItem value="pending">
                      {t("store.status.pending")}
                    </SelectItem>
                    <SelectItem value="approved">
                      {t("store.status.approved")}
                    </SelectItem>
                    <SelectItem value="fulfilled">
                      {t("store.status.fulfilled")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("store.status.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("store.noOrdersForItem")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("store.customer")}</TableHead>
                    <TableHead>{t("store.quantity")}</TableHead>
                    <TableHead>{t("store.priceTier")}</TableHead>
                    <TableHead>{t("store.total")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((oi) => (
                    <TableRow
                      key={oi.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/admin/store/orders?order=${oi.orders?.id}`)
                      }
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {oi.orders?.users?.full_name ||
                              oi.orders?.users?.email}
                          </p>
                          {oi.orders?.users?.user_code && (
                            <p className="text-sm text-muted-foreground font-mono">
                              ID: {oi.orders.users.user_code}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{oi.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`store.tier.${oi.price_tier}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {oi.total_price} {t("store.points")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(oi.orders?.status || "")}>
                          {t(`store.status.${oi.orders?.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(oi.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

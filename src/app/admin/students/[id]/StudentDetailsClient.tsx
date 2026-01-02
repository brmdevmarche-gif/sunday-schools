"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trophy,
  Clock,
  XCircle,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  GraduationCap,
  Activity as ActivityIcon,
  Coins,
  Package,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatusAction } from "@/app/admin/store/orders/actions";
import PointsAdjustmentDialog from "@/components/PointsAdjustmentDialog";
import type {
  StudentDetails,
  ActivityParticipation,
  AvailableActivity,
  PointsSummary,
  StudentOrder,
} from "./actions";
import type { OrderStatus } from "@/lib/types";

interface StudentDetailsClientProps {
  student: StudentDetails;
  activities: {
    participated: ActivityParticipation[];
    available: AvailableActivity[];
  };
  points: PointsSummary;
  orders: StudentOrder[];
}

export default function StudentDetailsClient({
  student,
  activities,
  points,
  orders,
}: StudentDetailsClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState("participated");
  const [ordersTab, setOrdersTab] = useState("current");
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Split orders into current and past
  const currentOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "approved"
  );
  const pastOrders = orders.filter(
    (order) => order.status === "fulfilled" || order.status === "cancelled" || order.status === "rejected"
  );

  async function handleUpdateOrderStatus(orderId: string, status: OrderStatus) {
    setIsProcessingOrder(true);
    try {
      await updateOrderStatusAction({
        order_id: orderId,
        status,
      });
      toast.success(t("store.orderStatusUpdated"));
      router.refresh();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(error instanceof Error ? error.message : t("store.updateFailed"));
    } finally {
      setIsProcessingOrder(false);
    }
  }

  function getOrderStatusColor(status: string) {
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

  const getInitials = (name: string | null) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        labelKey: string;
      }
    > = {
      pending: { variant: "outline", labelKey: "studentDetails.status.pending" },
      approved: { variant: "default", labelKey: "studentDetails.status.approved" },
      rejected: { variant: "destructive", labelKey: "studentDetails.status.rejected" },
      active: { variant: "default", labelKey: "studentDetails.status.active" },
      withdrawn: { variant: "secondary", labelKey: "studentDetails.status.withdrawn" },
    };

    const config = statusConfig[status] || {
      variant: "outline" as const,
      labelKey: status,
    };
    return <Badge variant={config.variant}>{t(config.labelKey)}</Badge>;
  };

  const getCompletionBadge = (
    completionStatus: string | null,
    isRevoked: boolean | null
  ) => {
    if (isRevoked) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {t("studentDetails.completion.revoked")}
        </Badge>
      );
    }
    if (!completionStatus) return null;

    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        labelKey: string;
        icon?: typeof Clock;
      }
    > = {
      pending: {
        variant: "outline",
        labelKey: "studentDetails.completion.pendingReview",
        icon: Clock,
      },
      approved: {
        variant: "default",
        labelKey: "studentDetails.completion.completed",
        icon: CheckCircle2,
      },
      rejected: {
        variant: "destructive",
        labelKey: "studentDetails.completion.rejected",
        icon: XCircle,
      },
    };

    const item = config[completionStatus] || {
      variant: "outline" as const,
      labelKey: completionStatus,
    };
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {t(item.labelKey)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const age = student.date_of_birth
    ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()
    : null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("studentDetails.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("studentDetails.subtitle")}
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {student.full_name || "Unknown Student"}
              </CardTitle>
              <CardDescription className="mt-1">
                Member since {formatDate(student.created_at)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.user_code && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("users.userCode")}</p>
                  <p className="text-lg font-mono font-bold">{student.user_code}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("studentDetails.email")}</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            {student.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.phone")}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.phone}
                  </p>
                </div>
              </div>
            )}

            {student.date_of_birth && age !== null && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.age")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("studentDetails.yearsOld", { age })} ({formatDate(student.date_of_birth)})
                  </p>
                </div>
              </div>
            )}

            {student.gender && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.gender")}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {t(`studentDetails.genders.${student.gender}`)}
                  </p>
                </div>
              </div>
            )}

            {student.address && (
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.address")}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.address}
                  </p>
                </div>
              </div>
            )}

            {student.diocese_name && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.diocese")}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.diocese_name}
                  </p>
                </div>
              </div>
            )}

            {student.church_name && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("studentDetails.church")}</p>
                  <p className="text-sm text-muted-foreground">
                    {student.church_name}
                  </p>
                </div>
              </div>
            )}

            {student.class_assignments &&
              student.class_assignments.length > 0 && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("studentDetails.classes")}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.class_assignments.map((assignment) => (
                        <Badge key={assignment.class_id} variant="secondary">
                          {assignment.class_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("studentDetails.points.available")}</p>
                <p className="text-3xl font-bold">{points.available_points}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
            <div className="mt-4">
              <PointsAdjustmentDialog
                studentId={student.id}
                studentName={student.full_name || student.email}
                currentPoints={points.available_points}
                onSuccess={() => router.refresh()}
                trigger={
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Coins className="h-4 w-4" />
                    {t("studentDetails.points.adjust")}
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("studentDetails.points.suspended")}</p>
                <p className="text-3xl font-bold">{points.suspended_points}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("studentDetails.points.totalEarned")}</p>
                <p className="text-3xl font-bold">{points.total_earned}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("studentDetails.points.activitiesDone")}</p>
                <p className="text-3xl font-bold">
                  {points.activities_completed}
                </p>
              </div>
              <ActivityIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("studentDetails.points.used")}</p>
                <p className="text-3xl font-bold">
                  {points.used_points}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>{t("studentDetails.activities.title")}</CardTitle>
          <CardDescription>
            {t("studentDetails.activities.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participated">
                {t("studentDetails.activities.participated")} ({activities.participated.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                {t("studentDetails.activities.available")} ({activities.available.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participated" className="mt-4">
              {activities.participated.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {t("studentDetails.activities.noParticipated")}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("studentDetails.table.activity")}</TableHead>
                      <TableHead>{t("studentDetails.table.points")}</TableHead>
                      <TableHead>{t("studentDetails.table.status")}</TableHead>
                      <TableHead>{t("studentDetails.table.completion")}</TableHead>
                      <TableHead>{t("studentDetails.table.requested")}</TableHead>
                      <TableHead>{t("studentDetails.table.completed")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.participated.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {activity.activity_name}
                            </p>
                            {activity.activity_description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {activity.activity_description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {activity.points_awarded !== null
                                ? activity.points_awarded
                                : activity.points}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                        <TableCell>
                          {getCompletionBadge(
                            activity.completion_status,
                            activity.is_revoked
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(activity.requested_at)}
                        </TableCell>
                        <TableCell>
                          {formatDate(activity.completed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="available" className="mt-4">
              {activities.available.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {t("studentDetails.activities.noAvailable")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.available.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        {activity.image_url && (
                          <div className="relative w-full h-32 mb-3">
                            <Image
                              src={activity.image_url}
                              alt={activity.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{activity.name}</h3>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {activity.points} {t("studentDetails.activities.pts")}
                            </span>
                          </div>
                          {activity.deadline && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(activity.deadline)}
                            </div>
                          )}
                        </div>
                        {activity.max_participants && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("studentDetails.activities.maxParticipants", { count: activity.max_participants })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t("store.orders")}
          </CardTitle>
          <CardDescription>
            {t("studentDetails.orders.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={ordersTab} onValueChange={setOrdersTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">
                {t("studentDetails.orders.current")} ({currentOrders.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                {t("studentDetails.orders.past")} ({pastOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-4">
              {currentOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {t("studentDetails.orders.noCurrentOrders")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {t("store.order")} #{order.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(order.created_at)}
                            </CardDescription>
                          </div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {t(`store.status.${order.status}`)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {item.store_items?.image_url && (
                                  <img
                                    src={item.store_items.image_url}
                                    alt={item.item_name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span>
                                  {item.item_name} × {item.quantity}
                                </span>
                              </div>
                              <span className="font-medium">
                                {item.total_price} {t("store.points")}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 border-t font-medium">
                            <span>{t("store.total")}</span>
                            <span>
                              {order.total_points} {t("store.points")}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "approved")
                                }
                                disabled={isProcessingOrder}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {t("store.approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "rejected")
                                }
                                disabled={isProcessingOrder}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {t("store.reject")}
                              </Button>
                            </>
                          )}
                          {order.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateOrderStatus(order.id, "fulfilled")
                              }
                              disabled={isProcessingOrder}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              {t("store.markFulfilled")}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              {pastOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {t("studentDetails.orders.noPastOrders")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {t("store.order")} #{order.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(order.created_at)}
                              {order.processed_at && (
                                <span className="ml-2">
                                  • {t("store.processedAt")} {formatDate(order.processed_at)}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {t(`store.status.${order.status}`)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-2">
                                {item.store_items?.image_url && (
                                  <img
                                    src={item.store_items.image_url}
                                    alt={item.item_name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span>
                                  {item.item_name} × {item.quantity}
                                </span>
                              </div>
                              <span className="font-medium">
                                {item.total_price} {t("store.points")}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between pt-2 border-t font-medium">
                            <span>{t("store.total")}</span>
                            <span>
                              {order.total_points} {t("store.points")}
                            </span>
                          </div>
                        </div>
                        {order.admin_notes && (
                          <div className="mt-3 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">{t("store.adminNotes")}: </span>
                            {order.admin_notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

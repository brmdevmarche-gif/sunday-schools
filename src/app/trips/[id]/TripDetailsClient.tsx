"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Info,
  CheckCircle2,
  XCircle,
  Bus,
  Package,
} from "lucide-react";
import { subscribeToTripAction } from "../actions";
import type { TripWithDetails, ExtendedUser, ParentChild } from "@/lib/types";

interface TripDetailsClientProps {
  trip: TripWithDetails;
  userProfile: ExtendedUser;
  childContext?: ParentChild | null;
  allChildren?: ParentChild[];
}

export default function TripDetailsClient({
  trip,
  userProfile,
  childContext,
  allChildren = [],
}: TripDetailsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  const isParent = userProfile.role === "parent";

  // Get currency symbol based on locale
  const getCurrencySymbol = () => {
    return locale === "ar" ? "ج.م" : "E.L";
  };
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [isChildSelectOpen, setIsChildSelectOpen] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({
    emergency_contact: "",
    medical_info: "",
  });

  const isSubscribed = !!trip.my_participation;
  const isApproved = trip.my_participation?.approval_status === "approved";
  const isPending = trip.my_participation?.approval_status === "pending";

  // Get the price based on user's tier (or child's tier if parent)
  function getUserPrice() {
    // If parent booking for child, use child's price_tier
    // Otherwise, use the logged-in user's price_tier
    const priceTier = childContext 
      ? (childContext.price_tier || "normal")
      : (userProfile.price_tier || "normal");
    
    if (priceTier === "mastor") return trip.price_mastor;
    if (priceTier === "botl") return trip.price_botl;
    return trip.price_normal;
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "started":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "ended":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "canceled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "soldout":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  function getTypeColor(type: string | null) {
    switch (type) {
      case "one_day":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "spiritual":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "volunteering":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "fun":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "retreat":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400";
      case "carnival":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400";
      case "tournament":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  function handleSubscribeClick() {
    // If parent without child context, prompt to select child first
    if (isParent && !childContext) {
      setIsChildSelectOpen(true);
    } else {
      setIsSubscribeDialogOpen(true);
    }
  }

  function handleChildSelect(childId: string) {
    setIsChildSelectOpen(false);
    // Navigate to trip details page with child context
    router.push(`/trips/${trip.id}?for=${childId}`);
  }

  async function handleSubscribe() {
    setIsSubscribing(true);
    try {
      await subscribeToTripAction({
        trip_id: trip.id,
        emergency_contact: subscribeForm.emergency_contact || undefined,
        medical_info: subscribeForm.medical_info || undefined,
        // Pass child ID if parent is booking for a child
        for_student_id: childContext?.id,
      });
      toast.success(t("studentTrips.subscribeSuccess"));
      setIsSubscribeDialogOpen(false);
      setSubscribeForm({ emergency_contact: "", medical_info: "" });

      // Redirect to parent dashboard if booking for child, otherwise refresh
      if (childContext) {
        router.push("/dashboard/parents");
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error subscribing to trip:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("studentTrips.subscribeFailed")
      );
    } finally {
      setIsSubscribing(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{trip.title}</h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge className={getStatusColor(trip.status)}>
                  {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                </Badge>
                {trip.trip_type && (
                  <Badge className={getTypeColor(trip.trip_type)}>
                    {trip.trip_type.replace("_", " ")}
                  </Badge>
                )}
                {!trip.available && (
                  <Badge variant="outline">
                    {t("studentTrips.unavailable")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Image */}
            {trip.image_url && (
              <Card className="overflow-hidden">
                <img
                  src={trip.image_url}
                  alt={trip.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </Card>
            )}

            {/* Description */}
            {trip.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    {t("studentTrips.aboutTrip")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {trip.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Destinations */}
            {trip.destinations && trip.destinations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t("studentTrips.destinations")} ({trip.destinations.length}
                    )
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trip.destinations.map((dest, idx) => (
                      <div
                        key={dest.id}
                        className="flex gap-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {dest.destination_name}
                          </h4>
                          {dest.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {dest.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transportation Details */}
            {trip.transportation_details && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5" />
                    {t("studentTrips.transportation")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {trip.transportation_details}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* What to Bring */}
            {trip.what_to_bring && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t("studentTrips.whatToBring")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {trip.what_to_bring}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t("studentTrips.tripDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.start_datetime && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {t("studentTrips.startDate")}
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {formatDateTime(trip.start_datetime)}
                    </p>
                  </div>
                )}

                {trip.end_datetime && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Clock className="h-4 w-4 text-green-500" />
                      {t("studentTrips.endDate")}
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {formatDateTime(trip.end_datetime)}
                    </p>
                  </div>
                )}

                <Separator />

                {trip.max_participants && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Users className="h-4 w-4 text-orange-500" />
                      {t("studentTrips.capacity")}
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {t("studentTrips.maxParticipantsCount", {
                        count: trip.max_participants,
                      })}
                      {trip.participants_count !== undefined && (
                        <span className="ml-1">
                          ({trip.participants_count}{" "}
                          {t("studentTrips.registered")})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    {t("studentTrips.price")}
                  </div>
                  <p className="text-2xl font-bold text-primary pl-6">
                    {getCurrencySymbol()}
                    {getUserPrice()}
                  </p>
                </div>

                {trip.requires_parent_approval && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-muted-foreground">
                        {t("studentTrips.parentApprovalRequired")}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subscription Status / Subscribe Button */}
            <Card>
              <CardHeader>
                <CardTitle>{t("studentTrips.yourStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSubscribed ? (
                  (() => {
                    const totalPrice = getUserPrice();
                    const amountPaid = trip.my_participation?.amount_paid || 0;
                    const amountRemaining = Math.max(0, totalPrice - amountPaid);
                    const paymentStatus = trip.my_participation?.payment_status;

                    return (
                      <>
                        <div className="flex items-center gap-2">
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="font-medium text-green-600">
                                {t("studentTrips.approved")}
                              </span>
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="h-5 w-5 text-yellow-500" />
                              <span className="font-medium text-yellow-600">
                                {t("studentTrips.pendingApproval")}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="font-medium text-red-600">
                                {t("studentTrips.rejected")}
                              </span>
                            </>
                          )}
                        </div>

                        {paymentStatus && (
                          <div className="pt-2 border-t space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {t("studentTrips.payment")}:
                              </span>
                              <Badge
                                variant={
                                  paymentStatus === "paid"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {paymentStatus === "partially_paid"
                                  ? t("trips.partiallyPaid")
                                  : paymentStatus === "paid"
                                  ? t("studentTrips.paid")
                                  : t("trips.stats.unpaid")}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center justify-between">
                                <span>{t("trips.messages.amountPaid")}:</span>
                                <span className="font-medium">
                                  {getCurrencySymbol()}
                                  {amountPaid.toFixed(2)}{" "}
                                  <span className="text-xs text-muted-foreground">
                                    / {getCurrencySymbol()}
                                    {totalPrice.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>{t("trips.messages.amountRemaining")}:</span>
                                <span className="font-medium">
                                  {getCurrencySymbol()}
                                  {amountRemaining.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                    {trip.my_participation?.emergency_contact && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium mb-1">
                          {t("studentTrips.emergencyContact")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trip.my_participation.emergency_contact}
                        </p>
                      </div>
                    )}
                      </>
                    );
                  })()
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {t("studentTrips.notSubscribed")}
                    </p>
                    {trip.status === "active" && trip.available ? (
                      <Button
                        className="w-full"
                        onClick={handleSubscribeClick}
                      >
                        {t("studentTrips.subscribeToTrip")}
                      </Button>
                    ) : (
                      <p className="text-sm text-destructive">
                        {t("studentTrips.tripNotAvailable")}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Subscribe Dialog */}
      <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[96vw] max-h-[92vh] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t("studentTrips.subscribeToTrip")}
            </DialogTitle>
            <DialogDescription>
              {t("studentTrips.subscribeDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Event Details (important block, no card wrapper) */}
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-1">
                <p className="font-semibold text-2xl sm:text-3xl">
                  {trip.title}
                </p>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span className="font-semibold text-xl sm:text-2xl text-primary">
                    {getCurrencySymbol()}
                    {getUserPrice()}
                  </span>
                </div>
                {trip.destinations && trip.destinations.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    <span className="text-sm sm:text-base text-muted-foreground">
                      {trip.destinations[0].destination_name}
                      {trip.destinations.length > 1 &&
                        ` +${trip.destinations.length - 1} ${t("common.more")}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
                {trip.start_datetime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("studentTrips.start")}:{" "}
                      {formatDateTime(trip.start_datetime)}
                    </span>
                  </div>
                )}
                {trip.end_datetime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      {t("studentTrips.end")}: {formatDateTime(trip.end_datetime)}
                    </span>
                  </div>
                )}
                {trip.requires_parent_approval && (
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("studentTrips.parentApprovalRequired")}
                    </span>
                  </div>
                )}

                {trip.destinations && trip.destinations.length > 0 && (
                  <div className="flex flex-col gap-1 pt-2 border-t mt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                      <span className="font-medium">
                        {t("studentTrips.destinations")}
                      </span>
                    </div>
                    <div className="pl-5 space-y-1">
                      {trip.destinations.slice(0, 2).map((dest, idx) => (
                        <p
                          key={dest.id}
                          className="text-xs sm:text-sm text-muted-foreground"
                        >
                          {idx + 1}. {dest.destination_name}
                        </p>
                      ))}
                      {trip.destinations.length > 2 && (
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          +{trip.destinations.length - 2} {t("common.more")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional extra info */}
            <div className="border rounded-2xl">
              <button
                type="button"
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium">
                  {t("studentTrips.additionalInfo")} ({t("common.optional")})
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    showAdditionalInfo ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showAdditionalInfo && (
                <div className="space-y-4 p-4 pt-0 border-t">
                  <div>
                    <Label htmlFor="emergency_contact">
                      {t("studentTrips.emergencyContact")}
                    </Label>
                    <Input
                      id="emergency_contact"
                      value={subscribeForm.emergency_contact}
                      onChange={(e) =>
                        setSubscribeForm({
                          ...subscribeForm,
                          emergency_contact: e.target.value,
                        })
                      }
                      placeholder={t("studentTrips.emergencyContactPlaceholder")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="medical_info">
                      {t("studentTrips.medicalInfo")}
                    </Label>
                    <Textarea
                      id="medical_info"
                      value={subscribeForm.medical_info}
                      onChange={(e) =>
                        setSubscribeForm({
                          ...subscribeForm,
                          medical_info: e.target.value,
                        })
                      }
                      placeholder={t("studentTrips.medicalInfoPlaceholder")}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsSubscribeDialogOpen(false)}
            >
              {t("studentTrips.cancel")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              size="lg"
              onClick={handleSubscribe}
              disabled={isSubscribing}
            >
              {isSubscribing
                ? t("studentTrips.subscribing")
                : t("studentTrips.subscribe")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Child Selection Dialog for Parents */}
      {isParent && (
        <Dialog open={isChildSelectOpen} onOpenChange={setIsChildSelectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("parents.selectChild")}</DialogTitle>
              <DialogDescription>
                {t("studentTrips.selectChildToBook")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {allChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-start"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{child.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {child.class_name || child.church_name || ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsChildSelectOpen(false)}
              >
                {t("common.cancel")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

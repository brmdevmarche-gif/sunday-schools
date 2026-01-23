"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  Calendar,
  Clock,
  Users,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { subscribeToTripAction } from "./actions";
import type { TripWithDetails, TripType, ParentChild } from "@/lib/types";
import { ChildContextBanner } from "@/components/parents";

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
  email?: string;
  church_id?: string | null;
  diocese_id?: string | null;
  price_tier?: "normal" | "mastor" | "botl" | null;
}

interface TripsClientProps {
  trips: TripWithDetails[];
  userProfile: UserProfile;
  /** Child context when parent is booking for a child */
  childContext?: ParentChild | null;
  /** All children for the parent (for child switcher) */
  allChildren?: ParentChild[];
}

export default function TripsClient({
  trips: initialTrips,
  userProfile,
  childContext,
  allChildren = [],
}: TripsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TripType | "all">("all");
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(
    null
  );
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({
    emergency_contact: "",
    medical_info: "",
  });
  const [isChildSelectOpen, setIsChildSelectOpen] = useState(false);

  const isParent = userProfile.role === "parent";

  // Filter trips
  const filteredTrips = useMemo(() => {
    let filtered = initialTrips;

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.trip_type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [initialTrips, typeFilter, searchQuery]);

  function getTypeColor(type: TripType | null) {
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
      case "other":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  }

  // Get currency symbol based on locale
  const getCurrencySymbol = () => {
    return locale === "ar" ? "ج.م" : "E.L";
  };

  // Get the price based on user's tier (or child's tier if parent)
  function getUserPrice(trip: TripWithDetails) {
    // If parent booking for child, use child's price_tier
    // Otherwise, use the logged-in user's price_tier
    const priceTier = childContext 
      ? ((childContext as any).price_tier || "normal")
      : (userProfile.price_tier || "normal");
    
    if (priceTier === "mastor") return trip.price_mastor;
    if (priceTier === "botl") return trip.price_botl;
    return trip.price_normal;
  }

  function handleSubscribeClick(trip: TripWithDetails) {
    setSelectedTrip(trip);
    // If parent without child context, prompt to select child first
    if (isParent && !childContext) {
      setIsChildSelectOpen(true);
    } else {
      setIsSubscribeDialogOpen(true);
    }
  }

  function handleChildSelect(childId: string) {
    setIsChildSelectOpen(false);
    // Navigate to trips page with child context and the trip will be selected
    router.push(`/trips?for=${childId}`);
  }

  async function handleSubscribe() {
    if (!selectedTrip) return;

    setIsSubscribing(true);
    try {
      await subscribeToTripAction({
        trip_id: selectedTrip.id,
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

  // Handle child switching
  const handleChildChange = (childId: string) => {
    router.push(`/trips?for=${childId}`);
  };

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky z-10 top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label={t("common.back") || "Back"}
              >
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {t("studentTrips.title")}
                </h1>
                {childContext && (
                  <h3 className="text-sm text-muted-foreground">
                    {t("parents.actions.bookTripForChild", {
                      name: childContext.full_name,
                    })}
                  </h3>
                )}
              </div>
            </div>
            {/* Child selector - compact avatar that opens bottom sheet */}
            {/* {childContext && (
              <ChildContextBanner
                child={childContext}
                allChildren={allChildren}
                onChildChange={handleChildChange}
              />
            )} */}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("studentTrips.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TripType | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("studentTrips.allTypes")}</SelectItem>
              <SelectItem value="one_day">
                {t("trips.types.one_day")}
              </SelectItem>
              <SelectItem value="spiritual">
                {t("trips.types.spiritual")}
              </SelectItem>
              <SelectItem value="volunteering">
                {t("trips.types.volunteering")}
              </SelectItem>
              <SelectItem value="fun">{t("trips.types.fun")}</SelectItem>
              <SelectItem value="retreat">
                {t("trips.types.retreat")}
              </SelectItem>
              <SelectItem value="carnival">
                {t("trips.types.carnival")}
              </SelectItem>
              <SelectItem value="tournament">
                {t("trips.types.tournament")}
              </SelectItem>
              <SelectItem value="other">{t("trips.types.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t("studentTrips.noTrips")}</p>
              <p className="text-sm text-muted-foreground">
                {t("studentTrips.noTripsDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const isSubscribed = !!trip.my_participation;
              const isApproved =
                trip.my_participation?.approval_status === "approved";
              const isPending =
                trip.my_participation?.approval_status === "pending";

              return (
                <Card key={trip.id} className="flex flex-col overflow-hidden">
                  {trip.image_url && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={trip.image_url}
                        alt={trip.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{trip.title}</CardTitle>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {trip.trip_type && (
                            <Badge className={getTypeColor(trip.trip_type)}>
                              {trip.trip_type}
                            </Badge>
                          )}
                          {isSubscribed && (
                            <Badge
                              variant={
                                isApproved
                                  ? "default"
                                  : isPending
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {trip.my_participation?.approval_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    {trip.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trip.description}
                      </p>
                    )}

                    {/* Destinations */}
                    {trip.destinations && trip.destinations.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {t("studentTrips.destinations")}:
                          </span>
                        </div>
                        <div className="pl-6 space-y-1">
                          {trip.destinations.slice(0, 2).map((dest, idx) => (
                            <p
                              key={dest.id}
                              className="text-xs text-muted-foreground"
                            >
                              {idx + 1}. {dest.destination_name}
                            </p>
                          ))}
                          {trip.destinations.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{trip.destinations.length - 2} {t("common.more")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {trip.start_datetime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-muted-foreground">
                            {t("studentTrips.start")}:{" "}
                            {formatDateTime(trip.start_datetime)}
                          </span>
                        </div>
                      )}
                      {trip.end_datetime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">
                            {t("studentTrips.end")}:{" "}
                            {formatDateTime(trip.end_datetime)}
                          </span>
                        </div>
                      )}
                      {trip.max_participants && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <span className="text-muted-foreground">
                            {t("studentTrips.maxParticipants", {
                              count: trip.max_participants,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium">
                            {t("studentTrips.price")}: {getCurrencySymbol()}
                            {getUserPrice(trip)}
                          </span>
                        </div>
                        {isSubscribed && trip.my_participation && (
                          (() => {
                            const totalPrice = getUserPrice(trip);
                            const amountPaid = (trip.my_participation as any)
                              .amount_paid || 0;
                            if (totalPrice <= 0 || amountPaid <= 0) return null;
                            return (
                              <span className="text-xs text-muted-foreground text-right">
                                {getCurrencySymbol()}
                                {amountPaid.toFixed(2)} / {getCurrencySymbol()}
                                {totalPrice.toFixed(2)}
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-2 space-y-2">
                      {isSubscribed && (
                        <div className="flex items-center gap-2 text-sm">
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">
                                {t("studentTrips.approved")}
                              </span>
                              {trip.my_participation?.payment_status && (
                                <Badge className="ml-auto">
                                  {trip.my_participation.payment_status ===
                                  "partially_paid"
                                    ? t("trips.partiallyPaid")
                                    : trip.my_participation.payment_status ===
                                      "paid"
                                    ? t("studentTrips.paid")
                                    : t("trips.stats.unpaid")}
                                </Badge>
                              )}
                            </>
                          ) : isPending ? (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span className="text-yellow-600">
                                {t("studentTrips.pendingApproval")}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">
                                {t("studentTrips.rejected")}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        variant={isSubscribed ? "outline" : "default"}
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        {t("studentTrips.viewDetails")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscribe Dialog */}
      <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t("studentTrips.subscribeToTrip")}
            </DialogTitle>
            <DialogDescription>
              {t("studentTrips.subscribeDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTrip && (
              <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-2">
                <div>
                  <p className="font-semibold text-base">
                    {selectedTrip.title}
                  </p>
                  {selectedTrip.start_datetime && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatDateTime(selectedTrip.start_datetime)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                    <span className="text-muted-foreground">
                      {t("studentTrips.start")}:{" "}
                      {selectedTrip.start_datetime
                        ? formatDateTime(selectedTrip.start_datetime)
                        : "-"}
                    </span>
                  </div>
                  {selectedTrip.end_datetime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        {t("studentTrips.end")}:{" "}
                        {formatDateTime(selectedTrip.end_datetime)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      {t("studentTrips.price")}: {getCurrencySymbol()}
                      {getUserPrice(selectedTrip)}
                    </span>
                  </div>
                  {selectedTrip.requires_parent_approval && (
                    <div className="flex items-center gap-2">
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        {t("studentTrips.parentApprovalRequired")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border rounded-lg">
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubscribeDialogOpen(false)}
            >
              {t("studentTrips.cancel")}
            </Button>
            <Button onClick={handleSubscribe} disabled={isSubscribing}>
              {isSubscribing
                ? t("studentTrips.subscribing")
                : t("studentTrips.subscribe")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Child Selection Dialog for Parents */}
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
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Users,
  Calendar,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import { deleteTripAction } from "./actions";
import type { TripWithDetails, TripStatus, TripType } from "@/lib/types";

interface TripsManagementClientProps {
  trips: TripWithDetails[];
  userProfile: any;
}

export default function TripsManagementClient({
  trips: initialTrips,
  userProfile,
}: TripsManagementClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TripType | "all">("all");
  const [trips, setTrips] = useState(initialTrips);

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Status filter
      if (statusFilter !== "all" && trip.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && trip.trip_type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = trip.title.toLowerCase();
        const description = trip.description?.toLowerCase() || "";

        if (!title.includes(query) && !description.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [trips, statusFilter, typeFilter, searchQuery]);

  function getStatusColor(status: TripStatus) {
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

  async function handleDelete(tripId: string) {
    if (!confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    try {
      await deleteTripAction(tripId);
      setTrips(trips.filter((t) => t.id !== tripId));
      toast.success("Trip deleted successfully");
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      toast.error(error.message || "Failed to delete trip");
    }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trips Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize trips for your church
          </p>
        </div>
        <Button onClick={() => router.push("/admin/trips/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Trip
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as TripStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="soldout">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as TripType | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="one_day">One Day</SelectItem>
            <SelectItem value="spiritual">Spiritual</SelectItem>
            <SelectItem value="volunteering">Volunteering</SelectItem>
            <SelectItem value="fun">Fun</SelectItem>
            <SelectItem value="retreat">Retreat</SelectItem>
            <SelectItem value="carnival">Carnival</SelectItem>
            <SelectItem value="tournament">Tournament</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No trips found</p>
            <p className="text-sm text-muted-foreground">
              Create your first trip to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
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
                    <CardTitle className="text-lg line-clamp-1">
                      {trip.title}
                    </CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status.charAt(0).toUpperCase() +
                          trip.status.slice(1)}
                      </Badge>
                      {trip.trip_type && (
                        <Badge className={getTypeColor(trip.trip_type)}>
                          {trip.trip_type}
                        </Badge>
                      )}
                      {!trip.available && (
                        <Badge variant="outline">Unavailable</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/trips/${trip.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(trip.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      <span className="font-medium">Destinations:</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {trip.destinations.map((dest, idx) => (
                        <p
                          key={dest.id}
                          className="text-xs text-muted-foreground"
                        >
                          {idx + 1}. {dest.destination_name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {trip.start_datetime && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">
                        Start: {formatDateTime(trip.start_datetime)}
                      </span>
                    </div>
                  )}
                  {trip.end_datetime && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        End: {formatDateTime(trip.end_datetime)}
                      </span>
                    </div>
                  )}
                  {trip.max_participants && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Users className="h-4 w-4 text-orange-500" />
                      <span className="text-muted-foreground">
                        Max: {trip.max_participants} participants
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 col-span-2">
                    <span className="font-medium">
                      Price: ${trip.price_normal} (normal), ${trip.price_mastor}{" "}
                      (mastor), ${trip.price_botl} (botl)
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-auto"
                  onClick={() => router.push(`/admin/trips/${trip.id}`)}
                >
                  View Details & Manage
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

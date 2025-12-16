"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Users,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";
import { updateTripParticipantAction } from "../actions";
import type { TripWithDetails, TripParticipantWithUser, TripApprovalStatus, TripPaymentStatus } from "@/lib/types/sunday-school";

interface TripDetailsClientProps {
  trip: TripWithDetails;
  participants: TripParticipantWithUser[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    unpaid: number;
  };
  userProfile: any;
}

export default function TripDetailsClient({
  trip,
  participants: initialParticipants,
  stats: initialStats,
  userProfile,
}: TripDetailsClientProps) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [stats, setStats] = useState(initialStats);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  function formatDate(dateString: string | null) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  }

  function formatTime(timeString: string | null) {
    if (!timeString) return "";
    return timeString.split("T")[1]?.split(".")[0]?.substring(0, 5) || timeString.substring(0, 5);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "approved":
      case "paid":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  }

  async function handleUpdateParticipant(
    participantId: string,
    updates: { approval_status?: TripApprovalStatus; payment_status?: TripPaymentStatus }
  ) {
    setIsUpdating(participantId);
    try {
      await updateTripParticipantAction({
        participant_id: participantId,
        ...updates,
      });

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? {
                ...p,
                ...updates,
                approved_at: updates.approval_status === "approved" ? new Date().toISOString() : p.approved_at,
              }
            : p
        )
      );

      // Update stats
      setStats((prev) => {
        const participant = participants.find((p) => p.id === participantId);
        if (!participant) return prev;

        let newStats = { ...prev };

        // Update approval stats
        if (updates.approval_status && updates.approval_status !== participant.approval_status) {
          if (participant.approval_status === "pending") newStats.pending--;
          if (participant.approval_status === "approved") newStats.approved--;
          if (participant.approval_status === "rejected") newStats.rejected--;

          if (updates.approval_status === "pending") newStats.pending++;
          if (updates.approval_status === "approved") newStats.approved++;
          if (updates.approval_status === "rejected") newStats.rejected++;
        }

        // Update payment stats
        if (updates.payment_status && updates.payment_status !== participant.payment_status) {
          if (participant.payment_status === "paid") newStats.paid--;
          if (participant.payment_status === "pending" || participant.payment_status === null) newStats.unpaid--;

          if (updates.payment_status === "paid") newStats.paid++;
          if (updates.payment_status === "pending" || updates.payment_status === null) newStats.unpaid++;
        }

        return newStats;
      });

      toast.success("Participant updated successfully");
    } catch (error: any) {
      console.error("Error updating participant:", error);
      toast.error(error.message || "Failed to update participant");
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <p className="text-muted-foreground mt-1">Trip Details & Participant Management</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/admin/trips/${trip.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Trip
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Trip Details</TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="h-4 w-4 mr-2" />
            Participants ({stats.total})
          </TabsTrigger>
        </TabsList>

        {/* Trip Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{trip.description || "No description"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Trip Type</p>
                      <Badge className="mt-1">{trip.trip_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={`mt-1 ${getStatusColor(trip.status)}`}>
                        {trip.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Date & Time</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Trip Date
                      </p>
                      <p className="mt-1 font-medium">{formatDate(trip.trip_date)}</p>
                    </div>
                    {trip.trip_time && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Trip Time
                        </p>
                        <p className="mt-1 font-medium">{formatTime(trip.trip_time)}</p>
                      </div>
                    )}
                  </div>

                  {(trip.time_to_go || trip.time_to_back) && (
                    <div className="grid grid-cols-2 gap-4">
                      {trip.time_to_go && (
                        <div>
                          <p className="text-sm text-muted-foreground">Time to Go</p>
                          <p className="mt-1 font-medium">{formatTime(trip.time_to_go)}</p>
                        </div>
                      )}
                      {trip.time_to_back && (
                        <div>
                          <p className="text-sm text-muted-foreground">Time to Back</p>
                          <p className="mt-1 font-medium">{formatTime(trip.time_to_back)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {trip.duration_hours && (
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="mt-1 font-medium">{trip.duration_hours} hours</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Destinations */}
              {trip.destinations && trip.destinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Destinations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trip.destinations.map((dest, index) => (
                      <div key={dest.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dest.location_name}</p>
                            {dest.location_address && (
                              <p className="text-sm text-muted-foreground mt-1">{dest.location_address}</p>
                            )}
                            {dest.location_description && (
                              <p className="text-sm text-muted-foreground mt-2">{dest.location_description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              {(trip.transportation_details || trip.what_to_bring) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trip.transportation_details && (
                      <div>
                        <p className="text-sm text-muted-foreground">Transportation Details</p>
                        <p className="mt-1">{trip.transportation_details}</p>
                      </div>
                    )}
                    {trip.what_to_bring && (
                      <div>
                        <p className="text-sm text-muted-foreground">What to Bring</p>
                        <p className="mt-1">{trip.what_to_bring}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="mt-1 text-2xl font-bold flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {trip.cost || "Free"}
                    </p>
                  </div>
                  {trip.max_participants && (
                    <div>
                      <p className="text-sm text-muted-foreground">Max Participants</p>
                      <p className="mt-1 text-xl font-semibold">{trip.max_participants}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participant Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending Approval</span>
                    <Badge variant="outline" className={getStatusColor("pending")}>
                      {stats.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <Badge variant="outline" className={getStatusColor("approved")}>
                      {stats.approved}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <Badge variant="outline" className={getStatusColor("paid")}>
                      {stats.paid}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unpaid</span>
                    <Badge variant="outline" className={getStatusColor("pending")}>
                      {stats.unpaid}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No participants yet</p>
                  <p className="text-sm text-muted-foreground">Participants will appear here when they register</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {participant.user?.full_name || participant.user?.email}
                            </p>
                            {participant.user?.full_name && (
                              <p className="text-sm text-muted-foreground">{participant.user.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {participant.user?.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                {participant.user.phone}
                              </div>
                            )}
                            {participant.emergency_contact && (
                              <div className="text-xs text-muted-foreground">
                                Emergency: {participant.emergency_contact}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(participant.approval_status)}>
                            {participant.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(participant.payment_status)}>
                            {participant.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(participant.registered_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isUpdating === participant.id}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {participant.approval_status !== "approved" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateParticipant(participant.id, { approval_status: "approved" })
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {participant.approval_status !== "rejected" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateParticipant(participant.id, { approval_status: "rejected" })
                                  }
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {participant.payment_status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateParticipant(participant.id, { payment_status: "paid" })
                                  }
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {participant.payment_status === "paid" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateParticipant(participant.id, { payment_status: "pending" })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Unpaid
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


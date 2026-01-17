"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Phone,
  Plus,
  UserCog,
  Trash2,
  UserCheck,
  ClipboardCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AttendanceStatusButtons } from "@/components/attendance/AttendanceStatusButtons";
import {
  updateTripParticipantAction,
  getTeachersForTripsAction,
  addTripOrganizerAction,
  removeTripOrganizerAction,
  updateTripOrganizerAction,
  getStudentsFromTripClassesAction,
  subscribeStudentToTripAction,
  bulkMarkTripAttendanceAction,
} from "../actions";
import type {
  TripWithDetails,
  TripParticipantWithUser,
  TripApprovalStatus,
  TripPaymentStatus,
  TripOrganizerWithUser,
  AttendanceStatus,
  ExtendedUser,
} from "@/lib/types";
import { ParentActionBadge } from "@/components/ui/parent-action-badge";

interface TripDetailsClientProps {
  trip: TripWithDetails;
  participants: TripParticipantWithUser[];
  organizers: TripOrganizerWithUser[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    unpaid: number;
  };
  userProfile: ExtendedUser;
}

export default function TripDetailsClient({
  trip,
  participants: initialParticipants,
  organizers: initialOrganizers,
  stats: initialStats,
  userProfile,
}: TripDetailsClientProps) {
  const locale = useLocale();
  const t = useTranslations();

  // Get currency symbol based on locale
  const getCurrencySymbol = () => {
    return locale === "ar" ? "ج.م" : "E.L";
  };
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [organizers, setOrganizers] = useState(initialOrganizers);
  const [stats, setStats] = useState(initialStats);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Organizers management state
  const [isAddOrganizerOpen, setIsAddOrganizerOpen] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [organizerRoles, setOrganizerRoles] = useState({
    can_approve: true,
    can_go: true,
    can_take_attendance: true,
    can_collect_payment: true,
  });
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isAddingOrganizer, setIsAddingOrganizer] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(
    null
  ); // Format: "organizerId-permission"
  const [organizerSearchQuery, setOrganizerSearchQuery] = useState("");

  // Add Participants state
  const [isAddParticipantsOpen, setIsAddParticipantsOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [subscribingStudentId, setSubscribingStudentId] = useState<
    string | null
  >(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<
    Map<string, { status: AttendanceStatus; notes?: string }>
  >(new Map());
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Filters state
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<TripApprovalStatus | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<TripPaymentStatus | "partially_paid" | "all">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [churchFilter, setChurchFilter] = useState<string>("all");
  const [dioceseFilter, setDioceseFilter] = useState<string>("all");

  // Payment popup state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedParticipantForPayment, setSelectedParticipantForPayment] = useState<TripParticipantWithUser | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [fulfillAllAmount, setFulfillAllAmount] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  function toggleParticipant(participantId: string) {
    setSelectedParticipants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  }

  function toggleAll() {
    if (selectedParticipants.size === participants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(participants.map((p) => p.id)));
    }
  }

  async function handleBulkUpdate(updates: {
    approval_status?: TripApprovalStatus;
    payment_status?: TripPaymentStatus;
  }) {
    if (selectedParticipants.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const updatePromises = Array.from(selectedParticipants).map(
        (participantId) =>
          updateTripParticipantAction({
            participant_id: participantId,
            ...updates,
          })
      );

      await Promise.all(updatePromises);

      // Update local state for all selected participants
      setParticipants((prev) =>
        prev.map((p) =>
          selectedParticipants.has(p.id)
            ? {
                ...p,
                ...updates,
                approved_at:
                  updates.approval_status === "approved"
                    ? new Date().toISOString()
                    : p.approved_at,
              }
            : p
        )
      );

      // Update stats
      setStats((prev) => {
        let newStats = { ...prev };

        selectedParticipants.forEach((participantId) => {
          const participant = participants.find((p) => p.id === participantId);
          if (!participant) return;

          // Update approval stats
          if (
            updates.approval_status &&
            updates.approval_status !== participant.approval_status
          ) {
            if (participant.approval_status === "pending") newStats.pending--;
            if (participant.approval_status === "approved") newStats.approved--;
            if (participant.approval_status === "rejected") newStats.rejected--;

            if (updates.approval_status === "pending") newStats.pending++;
            if (updates.approval_status === "approved") newStats.approved++;
            if (updates.approval_status === "rejected") newStats.rejected++;
          }

          // Update payment stats
          if (
            updates.payment_status &&
            updates.payment_status !== participant.payment_status
          ) {
            if (participant.payment_status === "paid") newStats.paid--;
            if (
              participant.payment_status === "pending" ||
              participant.payment_status === null
            )
              newStats.unpaid--;

            if (updates.payment_status === "paid") newStats.paid++;
            if (
              updates.payment_status === "pending" ||
              updates.payment_status === null
            )
              newStats.unpaid++;
          }
        });

        return newStats;
      });

      setSelectedParticipants(new Set());
      toast.success(
        t("trips.messages.participantsUpdated", {
          count: selectedParticipants.size,
        })
      );
    } catch (error) {
      console.error("Error updating participants:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("trips.messages.participantsUpdateError")
      );
    } finally {
      setIsBulkUpdating(false);
    }
  }

  async function handleUpdateParticipant(
    participantId: string,
    updates: {
      approval_status?: TripApprovalStatus;
      payment_status?: TripPaymentStatus;
      amount_paid?: number;
    }
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
                approved_at:
                  updates.approval_status === "approved"
                    ? new Date().toISOString()
                    : p.approved_at,
                amount_paid: updates.amount_paid !== undefined ? updates.amount_paid : p.amount_paid,
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
        if (
          updates.approval_status &&
          updates.approval_status !== participant.approval_status
        ) {
          if (participant.approval_status === "pending") newStats.pending--;
          if (participant.approval_status === "approved") newStats.approved--;
          if (participant.approval_status === "rejected") newStats.rejected--;

          if (updates.approval_status === "pending") newStats.pending++;
          if (updates.approval_status === "approved") newStats.approved++;
          if (updates.approval_status === "rejected") newStats.rejected++;
        }

        // Update payment stats
        if (
          updates.payment_status &&
          updates.payment_status !== participant.payment_status
        ) {
          if (participant.payment_status === "paid") newStats.paid--;
          if (
            participant.payment_status === "pending" ||
            participant.payment_status === null
          )
            newStats.unpaid--;

          if (updates.payment_status === "paid") newStats.paid++;
          if (
            updates.payment_status === "pending" ||
            updates.payment_status === null
          )
            newStats.unpaid++;
        }

        return newStats;
      });

      toast.success(t("trips.messages.participantUpdated"));
    } catch (error) {
      console.error("Error updating participant:", error);
      let errorMessage = t("trips.messages.participantUpdateError");
      if (error instanceof Error) {
        if (error.message === "INVALID_PAYMENT_STATUS") {
          errorMessage = t("trips.messages.invalidPaymentStatus");
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setIsUpdating(null);
    }
  }

  // Load available teachers when dialog opens
  async function loadAvailableTeachers() {
    setIsLoadingTeachers(true);
    try {
      const churchIds = trip.churches?.map((c) => c.church_id) || [];
      if (churchIds.length === 0) {
        toast.error("No churches selected for this trip");
        return;
      }

      const result = await getTeachersForTripsAction(churchIds);
      if (result.success) {
        // Filter out teachers who are already organizers
        const organizerIds = new Set(organizers.map((o) => o.user_id));
        const available = result.data.filter((t) => !organizerIds.has(t.id));
        setAvailableTeachers(available);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load teachers"
      );
    } finally {
      setIsLoadingTeachers(false);
    }
  }

  function handleOpenAddOrganizer() {
    // Reset form state before opening dialog
    setSelectedTeacherId("");
    setOrganizerSearchQuery("");
    setOrganizerRoles({
      can_approve: true,
      can_go: true,
      can_take_attendance: true,
      can_collect_payment: true,
    });
    setIsAddOrganizerOpen(true);
    loadAvailableTeachers();
  }

  // Filter teachers by search query (name or phone)
  const filteredTeachers = availableTeachers.filter((teacher) => {
    if (!organizerSearchQuery) return true;
    const query = organizerSearchQuery.toLowerCase();
    return (
      teacher.full_name?.toLowerCase().includes(query) ||
      teacher.email?.toLowerCase().includes(query) ||
      teacher.phone?.toLowerCase().includes(query)
    );
  });

  async function handleAddOrganizer() {
    if (!selectedTeacherId) {
      toast.error("Please select a teacher");
      return;
    }

    setIsAddingOrganizer(true);
    try {
      const result = await addTripOrganizerAction({
        trip_id: trip.id,
        user_id: selectedTeacherId,
        ...organizerRoles,
      });

      if (result.success && result.data) {
        setOrganizers([...organizers, result.data]);
        toast.success("Organizer added successfully");
        setIsAddOrganizerOpen(false);
        setSelectedTeacherId("");
        setOrganizerRoles({
          can_approve: true,
          can_go: true,
          can_take_attendance: true,
          can_collect_payment: true,
        });
      }
    } catch (error) {
      console.error("Error adding organizer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add organizer"
      );
    } finally {
      setIsAddingOrganizer(false);
    }
  }

  async function handleRemoveOrganizer(organizerId: string) {
    if (!confirm("Are you sure you want to remove this organizer?")) {
      return;
    }

    try {
      const result = await removeTripOrganizerAction(organizerId);
      if (result.success) {
        setOrganizers(organizers.filter((o) => o.id !== organizerId));
        toast.success("Organizer removed successfully");
      }
    } catch (error) {
      console.error("Error removing organizer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove organizer"
      );
    }
  }

  async function handleUpdateOrganizerRoles(
    organizerId: string,
    roles: {
      can_approve?: boolean;
      can_go?: boolean;
      can_take_attendance?: boolean;
      can_collect_payment?: boolean;
    }
  ) {
    // Determine which permission is being updated
    const permissionKey = Object.keys(roles)[0] as keyof typeof roles;
    const permissionId = `${organizerId}-${permissionKey}`;

    setUpdatingPermission(permissionId);
    try {
      const result = await updateTripOrganizerAction({
        organizer_id: organizerId,
        ...roles,
      });

      if (result.success && result.data) {
        setOrganizers(
          organizers.map((o) => (o.id === organizerId ? result.data : o))
        );
        toast.success("Organizer roles updated successfully");
      }
    } catch (error) {
      console.error("Error updating organizer:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update organizer"
      );
    } finally {
      setUpdatingPermission(null);
    }
  }

  // Check if user can manage organizers (admins only)
  const canManageOrganizers =
    userProfile.role === "super_admin" ||
    userProfile.role === "diocese_admin" ||
    userProfile.role === "church_admin";

  // Check if user is an organizer with can_approve permission
  const currentUserOrganizer = organizers.find(
    (o) => o.user_id === userProfile.id
  );
  const canAddParticipantsAsOrganizer =
    currentUserOrganizer?.can_approve === true;

  // Check if user can add participants (admins or organizers with can_approve)
  const canAddParticipants =
    canManageOrganizers || canAddParticipantsAsOrganizer;

  // Check if user can take attendance (admins or organizers with can_take_attendance)
  const canTakeAttendance =
    canManageOrganizers || currentUserOrganizer?.can_take_attendance === true;

  // Check if today is the trip start date
  function isTripStartDate(): boolean {
    if (!trip.start_datetime) return false;
    const startDate = new Date(trip.start_datetime);
    const today = new Date();

    // Compare dates (ignore time)
    return (
      startDate.getFullYear() === today.getFullYear() &&
      startDate.getMonth() === today.getMonth() &&
      startDate.getDate() === today.getDate()
    );
  }

  // Load available students when dialog opens
  async function loadAvailableStudents() {
    setIsLoadingStudents(true);
    try {
      const result = await getStudentsFromTripClassesAction(trip.id);
      if (result.success) {
        setAvailableStudents(result.data);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load students"
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }

  function handleOpenAddParticipants() {
    setStudentSearchQuery("");
    setIsAddParticipantsOpen(true);
    loadAvailableStudents();
  }

  // Filter students by search query
  const filteredStudents = availableStudents.filter((student) => {
    if (!studentSearchQuery) return true;
    const query = studentSearchQuery.toLowerCase();
    return (
      student.full_name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.user_code?.toLowerCase().includes(query) ||
      student.class_name?.toLowerCase().includes(query)
    );
  });

  async function handleSubscribeStudent(studentId: string) {
    setSubscribingStudentId(studentId);
    try {
      const result = await subscribeStudentToTripAction(trip.id, studentId);
      if (result.success && result.data) {
        // Add to participants list
        setParticipants([...participants, result.data]);
        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
          unpaid: prev.unpaid + 1,
        }));
        // Remove from available students
        setAvailableStudents((prev) => prev.filter((s) => s.id !== studentId));
        toast.success("Student subscribed successfully");
      }
    } catch (error) {
      console.error("Error subscribing student:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to subscribe student"
      );
    } finally {
      setSubscribingStudentId(null);
    }
  }

  // Initialize attendance records from participants
  function initializeAttendance() {
    const records = new Map<
      string,
      { status: AttendanceStatus; notes?: string }
    >();
    participants.forEach((participant) => {
      // Default to present if already marked, otherwise present
      records.set(participant.id, {
        status:
          ((participant as any).attendance_status as AttendanceStatus) ||
          "present",
        notes: (participant as any).attendance_notes || "",
      });
    });
    setAttendanceRecords(records);
    setActiveTab("attendance");
  }

  function updateAttendanceStatus(
    participantId: string,
    status: AttendanceStatus
  ) {
    setAttendanceRecords((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(participantId) || {
        status: "present" as const,
      };
      newMap.set(participantId, { ...existing, status });
      return newMap;
    });
  }

  function updateAttendanceNotes(participantId: string, notes: string) {
    setAttendanceRecords((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(participantId) || {
        status: "present" as const,
      };
      newMap.set(participantId, { ...existing, notes });
      return newMap;
    });
  }

  async function handleSaveAttendance() {
    if (attendanceRecords.size === 0) {
      toast.error("No attendance records to save");
      return;
    }

    setIsSavingAttendance(true);
    try {
      const records = Array.from(attendanceRecords.entries()).map(
        ([participantId, record]) => ({
          participant_id: participantId,
          attendance_status: record.status,
          notes: record.notes,
        })
      );

      await bulkMarkTripAttendanceAction(trip.id, records);

      // Update local participants state
      setParticipants((prev) =>
        prev.map((p) => {
          const record = attendanceRecords.get(p.id);
          if (record) {
            return {
              ...p,
              attendance_status: record.status as any,
              attendance_notes: record.notes as any,
            } as any;
          }
          return p;
        })
      );

      toast.success("Attendance saved successfully");
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save attendance"
      );
    } finally {
      setIsSavingAttendance(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end sm:items-center justify-between flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <p className="text-muted-foreground mt-1">
              {t("trips.participantManagement")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canTakeAttendance && isTripStartDate() && (
            <Button onClick={initializeAttendance} variant="default">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Attendance
            </Button>
          )}
          <Button onClick={() => router.push(`/admin/trips/${trip.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("trips.editTrip")}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="details">{t("trips.tripDetails")}</TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="h-4 w-4 mr-2" />
            {t("trips.participants")} ({stats.total})
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            disabled={!(canTakeAttendance && isTripStartDate())}
            onClick={() => {
              // Ensure records exist when switching to the tab
              if (attendanceRecords.size === 0 && participants.length > 0) {
                initializeAttendance();
              }
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="organizers">
            <UserCog className="h-4 w-4 mr-2" />
            Organizers ({organizers.length})
          </TabsTrigger>
        </TabsList>

        {/* Trip Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("trips.basicInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("trips.fields.description")}
                    </p>
                    <p className="mt-1">
                      {trip.description || t("trips.messages.noDescription")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("trips.tripType")}
                      </p>
                      <Badge className="mt-1">
                        {t(`trips.types.${trip.trip_type}`)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("trips.fields.status")}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getStatusColor(trip.status)}>
                          {t(`trips.statuses.${trip.status}`)}
                        </Badge>
                        {!trip.available && (
                          <Badge variant="outline">
                            {t("trips.fields.unavailable")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("trips.dateTime")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {trip.start_datetime && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {t("trips.fields.startDateTime")}
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDateTime(trip.start_datetime)}
                        </p>
                      </div>
                    )}
                    {trip.end_datetime && (
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {t("trips.fields.endDateTime")}
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDateTime(trip.end_datetime)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              {trip.destinations && trip.destinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t("trips.destinations")}
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
                            <p className="font-medium">
                              {dest.destination_name}
                            </p>
                            {dest.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {dest.description}
                              </p>
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
                    <CardTitle>{t("trips.additionalInformation")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trip.transportation_details && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("trips.fields.transportationDetails")}
                        </p>
                        <p className="mt-1">{trip.transportation_details}</p>
                      </div>
                    )}
                    {trip.what_to_bring && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("trips.fields.whatToBring")}
                        </p>
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
                  <CardTitle>{t("trips.statistics")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("trips.pricing")}
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="font-medium">
                        {t("studentTrips.normal")}: {getCurrencySymbol()}
                        {trip.price_normal}
                      </p>
                      <p className="font-medium">
                        {t("studentTrips.mastor")}: {getCurrencySymbol()}
                        {trip.price_mastor}
                      </p>
                      <p className="font-medium">
                        {t("studentTrips.botl")}: {getCurrencySymbol()}
                        {trip.price_botl}
                      </p>
                    </div>
                  </div>
                  {trip.max_participants && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("trips.fields.maxParticipants")}
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {trip.max_participants}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("trips.participantStats")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("trips.stats.total")}
                    </span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("trips.stats.pendingApproval")}
                    </span>
                    <Badge
                      variant="outline"
                      className={getStatusColor("pending")}
                    >
                      {stats.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("trips.stats.approved")}
                    </span>
                    <Badge
                      variant="outline"
                      className={getStatusColor("approved")}
                    >
                      {stats.approved}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("trips.stats.paid")}
                    </span>
                    <Badge variant="outline" className={getStatusColor("paid")}>
                      {stats.paid}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {t("trips.stats.unpaid")}
                    </span>
                    <Badge
                      variant="outline"
                      className={getStatusColor("pending")}
                    >
                      {stats.unpaid}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab("participants")}
                  >
                    {t("trips.actions.viewDetailedStats")}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{t("trips.participants")}</CardTitle>
                  <div className="flex items-center gap-2">
                  {selectedParticipants.size > 0 && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {t("trips.messages.selected", {
                          count: selectedParticipants.size,
                        })}
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleBulkUpdate({ approval_status: "approved" })
                        }
                        disabled={isBulkUpdating}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t("trips.actions.approveSelected")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleBulkUpdate({ approval_status: "rejected" })
                        }
                        disabled={isBulkUpdating}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("trips.actions.rejectSelected")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedParticipants(new Set())}
                        disabled={isBulkUpdating}
                      >
                        {t("trips.actions.clearSelection")}
                      </Button>
                    </>
                  )}
                  {canAddParticipants && (
                    <Button onClick={handleOpenAddParticipants}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("trips.addStudents")}
                    </Button>
                  )}
                </div>
                </div>
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("trips.table.approvalStatus")}</Label>
                    <Select value={approvalStatusFilter} onValueChange={(v) => setApprovalStatusFilter(v as TripApprovalStatus | "all")}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="pending">{t("trips.stats.pendingApproval")}</SelectItem>
                        <SelectItem value="approved">{t("trips.stats.approved")}</SelectItem>
                        <SelectItem value="rejected">{t("trips.stats.rejected")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("trips.table.paymentStatus")}</Label>
                    <Select value={paymentStatusFilter} onValueChange={(v) => setPaymentStatusFilter(v as TripPaymentStatus | "partially_paid" | "all")}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="pending">{t("trips.stats.unpaid")}</SelectItem>
                        <SelectItem value="partially_paid">{t("trips.partiallyPaid")}</SelectItem>
                        <SelectItem value="paid">{t("trips.stats.paid")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {trip.classes && trip.classes.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.class")}</Label>
                      <Select value={classFilter} onValueChange={setClassFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.all")}</SelectItem>
                          {trip.classes.map((cls: any) => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                              {cls.class_name || cls.class_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {trip.churches && trip.churches.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.church")}</Label>
                      <Select value={churchFilter} onValueChange={setChurchFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.all")}</SelectItem>
                          {trip.churches.map((church: any) => (
                            <SelectItem key={church.church_id} value={church.church_id}>
                              {church.church_name || church.church_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {trip.dioceses && trip.dioceses.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("common.diocese")}</Label>
                      <Select value={dioceseFilter} onValueChange={setDioceseFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.all")}</SelectItem>
                          {trip.dioceses.map((diocese: any) => (
                            <SelectItem key={diocese.diocese_id} value={diocese.diocese_id}>
                              {diocese.diocese_name || diocese.diocese_id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                // Filter participants
                const filteredParticipants = participants.filter((p: any) => {
                  if (approvalStatusFilter !== "all" && p.approval_status !== approvalStatusFilter) return false;
                  if (paymentStatusFilter !== "all") {
                    if (paymentStatusFilter === "partially_paid" && p.payment_status !== "partially_paid") return false;
                    if (paymentStatusFilter !== "partially_paid" && p.payment_status !== paymentStatusFilter) return false;
                  }
                  if (classFilter !== "all" && (!p.class_info || p.class_info.id !== classFilter)) return false;
                  if (churchFilter !== "all" && (!p.church_info || p.church_info.id !== churchFilter)) return false;
                  if (dioceseFilter !== "all" && (!p.diocese_info || p.diocese_info.id !== dioceseFilter)) return false;
                  return true;
                });

                return filteredParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {t("trips.messages.noParticipants")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("trips.messages.participantsWillAppear")}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedParticipants.size === filteredParticipants.length &&
                            filteredParticipants.length > 0
                          }
                          onCheckedChange={() => {
                            if (selectedParticipants.size === filteredParticipants.length) {
                              setSelectedParticipants(new Set());
                            } else {
                              setSelectedParticipants(new Set(filteredParticipants.map((p: any) => p.id)));
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>{t("trips.table.student")}</TableHead>
                      <TableHead>{t("trips.table.contact")}</TableHead>
                      <TableHead>{t("trips.table.approvalStatus")}</TableHead>
                      <TableHead>{t("trips.table.paymentStatus")}</TableHead>
                      <TableHead>{t("trips.table.registered")}</TableHead>
                      <TableHead>{t("trips.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant: any) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedParticipants.has(participant.id)}
                            onCheckedChange={() =>
                              toggleParticipant(participant.id)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {participant.user?.full_name ||
                                  participant.user?.email}
                              </p>
                              {participant.registrar?.role === "parent" &&
                                participant.registered_by !== participant.user_id && (
                                  <ParentActionBadge
                                    parentName={participant.registrar.full_name || undefined}
                                    compact
                                  />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(participant.user as any)?.user_code && (
                                <span className="font-mono mr-2">
                                  ID: {(participant.user as any).user_code}
                                </span>
                              )}
                              {participant.user?.email}
                            </p>
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
                                {t("trips.table.emergency")}:{" "}
                                {participant.emergency_contact}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(
                              participant.approval_status
                            )}
                          >
                            {participant.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const userTier = (participant.user as any)?.price_tier || "normal";
                            const tripPrice = userTier === "mastor" ? trip.price_mastor : userTier === "botl" ? trip.price_botl : trip.price_normal;
                            const amountPaid = participant.amount_paid || 0;
                            const amountRemaining = Math.max(0, tripPrice - amountPaid);
                            const progressPercentage = tripPrice > 0 ? (amountPaid / tripPrice) * 100 : 0;
                            const locale = useLocale();
                            const currencySymbol = locale === "ar" ? "ج.م" : "E.L";
                            
                            return (
                              <div className="space-y-2 min-w-[200px]">
                                <div className="flex items-center justify-between gap-2">
                                  <Badge
                                    className={getStatusColor(participant.payment_status)}
                                  >
                                    {participant.payment_status === "partially_paid" 
                                      ? t("trips.partiallyPaid")
                                      : participant.payment_status === "paid"
                                      ? t("trips.stats.paid")
                                      : t("trips.stats.unpaid")}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {currencySymbol}{amountPaid.toFixed(2)} / {currencySymbol}{tripPrice.toFixed(2)}
                                  </span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{t("trips.messages.remaining")}: {currencySymbol}{amountRemaining.toFixed(2)}</span>
                                  <span>{progressPercentage.toFixed(0)}%</span>
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(
                              participant.registered_at
                            ).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-start gap-1">
                            {participant.approval_status === "approved" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedParticipantForPayment(participant);
                                    // Calculate user's price and remaining amount
                                    const userTier = (participant.user as any)?.price_tier || "normal";
                                    const tripPrice = userTier === "mastor" ? trip.price_mastor : userTier === "botl" ? trip.price_botl : trip.price_normal;
                                    const currentAmountPaid = participant.amount_paid || 0;
                                    const amountRemaining = Math.max(0, tripPrice - currentAmountPaid);
                                    setPaymentAmount(amountRemaining > 0 ? amountRemaining.toString() : "0");
                                    setFulfillAllAmount(amountRemaining > 0);
                                    setIsPaymentDialogOpen(true);
                                  }}
                                  disabled={isUpdating === participant.id}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {t("trips.actions.pay")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleUpdateParticipant(participant.id, {
                                      approval_status: "rejected",
                                    })
                                  }
                                  disabled={isUpdating === participant.id}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {t("trips.actions.reject")}
                                </Button>
                              </>
                            ) : (
                              <>
                                {participant.approval_status !== "approved" && participant.payment_status !== "paid" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleUpdateParticipant(participant.id, {
                                        approval_status: "approved",
                                      })
                                    }
                                    disabled={isUpdating === participant.id}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    {t("trips.actions.approve")}
                                  </Button>
                                )}
                                {participant.approval_status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleUpdateParticipant(participant.id, {
                                        approval_status: "rejected",
                                      })
                                    }
                                    disabled={isUpdating === participant.id}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {t("trips.actions.reject")}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("trips.tripAttendance.title")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("trips.tripAttendance.description")}
                  </p>
                </div>
                <Button
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance || participants.length === 0}
                  className="gap-2"
                >
                  {isSavingAttendance ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("trips.tripAttendance.saving")}
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-4 w-4" />
                      {t("trips.tripAttendance.saveAttendance")}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {t("trips.tripAttendance.noParticipants")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("trips.tripAttendance.addParticipantsFirst")}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("trips.tripAttendance.student")}</TableHead>
                      <TableHead>{t("trips.tripAttendance.email")}</TableHead>
                      <TableHead>{t("trips.tripAttendance.notes")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => {
                      const record = attendanceRecords.get(participant.id) || {
                        status: "present" as const,
                        notes: "",
                      };

                      return (
                        <TableRow key={participant.id}>
                          <TableCell className="whitespace-normal">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              {(participant.user as any)?.avatar_url ? (
                                <img
                                  src={(participant.user as any).avatar_url}
                                  alt={
                                    participant.user?.full_name ||
                                    participant.user?.email
                                  }
                                  className="h-9 w-9 rounded-full"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">
                                    {participant.user?.full_name ||
                                      participant.user?.email}
                                  </p>
                                  {participant.registrar?.role === "parent" &&
                                    participant.registered_by !== participant.user_id && (
                                      <ParentActionBadge compact />
                                    )}
                                </div>
                                {participant.user?.full_name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {participant.user?.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {participant.user?.email}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <Input
                              placeholder={t(
                                "trips.tripAttendance.notesPlaceholder"
                              )}
                              value={record.notes || ""}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                updateAttendanceNotes(
                                  participant.id,
                                  e.target.value
                                )
                              }
                              className="min-w-[260px]"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <AttendanceStatusButtons
                                status={record.status}
                                onStatusChange={(status) =>
                                  updateAttendanceStatus(participant.id, status)
                                }
                                disabled={isSavingAttendance}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizers Tab */}
        <TabsContent value="organizers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("trips.organizers.title")}</CardTitle>
                {canManageOrganizers && (
                  <Button onClick={handleOpenAddOrganizer}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("trips.organizers.addOrganizer")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {organizers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {t("trips.organizers.noOrganizers")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {canManageOrganizers
                      ? t("trips.organizers.addOrganizersToManage")
                      : t("trips.organizers.organizersWillAppear")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {organizers.map((organizer) => (
                    <div
                      key={organizer.id}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0">
                            {organizer.user?.avatar_url ? (
                              <img
                                src={organizer.user.avatar_url}
                                alt={organizer.user.full_name || ""}
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {organizer.user?.full_name ||
                                organizer.user?.email}
                            </h3>
                            {organizer.user?.full_name && (
                              <p className="text-sm text-muted-foreground">
                                {organizer.user.email}
                              </p>
                            )}
                            {organizer.user?.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {organizer.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        {canManageOrganizers && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOrganizer(organizer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <p className="text-sm font-medium">
                          {t("trips.organizers.permissions")}:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            {canManageOrganizers ? (
                              <>
                                <Checkbox
                                  id={`approve-${organizer.id}`}
                                  checked={organizer.can_approve}
                                  loading={
                                    updatingPermission ===
                                    `${organizer.id}-can_approve`
                                  }
                                  onCheckedChange={(checked) =>
                                    handleUpdateOrganizerRoles(organizer.id, {
                                      can_approve: checked === true,
                                    })
                                  }
                                />
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <Label
                                  htmlFor={`approve-${organizer.id}`}
                                  className="cursor-pointer"
                                >
                                  {t("trips.organizers.canApprove")}
                                </Label>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant={
                                    organizer.can_approve
                                      ? "default"
                                      : "outline"
                                  }
                                  className="mr-2"
                                >
                                  {organizer.can_approve
                                    ? t("common.yes")
                                    : t("common.no")}
                                </Badge>
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <Label>
                                  {t("trips.organizers.canApprove")}
                                </Label>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {canManageOrganizers ? (
                              <>
                                <Checkbox
                                  id={`go-${organizer.id}`}
                                  checked={organizer.can_go}
                                  loading={
                                    updatingPermission ===
                                    `${organizer.id}-can_go`
                                  }
                                  onCheckedChange={(checked) =>
                                    handleUpdateOrganizerRoles(organizer.id, {
                                      can_go: checked === true,
                                    })
                                  }
                                />
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <Label
                                  htmlFor={`go-${organizer.id}`}
                                  className="cursor-pointer"
                                >
                                  {t("trips.organizers.canGo")}
                                </Label>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant={
                                    organizer.can_go ? "default" : "outline"
                                  }
                                  className="mr-2"
                                >
                                  {organizer.can_go
                                    ? t("common.yes")
                                    : t("common.no")}
                                </Badge>
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <Label>{t("trips.organizers.canGo")}</Label>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {canManageOrganizers ? (
                              <>
                                <Checkbox
                                  id={`attendance-${organizer.id}`}
                                  checked={organizer.can_take_attendance}
                                  loading={
                                    updatingPermission ===
                                    `${organizer.id}-can_take_attendance`
                                  }
                                  onCheckedChange={(checked) =>
                                    handleUpdateOrganizerRoles(organizer.id, {
                                      can_take_attendance: checked === true,
                                    })
                                  }
                                />
                                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                                <Label
                                  htmlFor={`attendance-${organizer.id}`}
                                  className="cursor-pointer"
                                >
                                  {t("trips.organizers.canTakeAttendance")}
                                </Label>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant={
                                    organizer.can_take_attendance
                                      ? "default"
                                      : "outline"
                                  }
                                  className="mr-2"
                                >
                                  {organizer.can_take_attendance
                                    ? t("common.yes")
                                    : t("common.no")}
                                </Badge>
                                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                                <Label>
                                  {t("trips.organizers.canTakeAttendance")}
                                </Label>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {canManageOrganizers ? (
                              <>
                                <Checkbox
                                  id={`payment-${organizer.id}`}
                                  checked={organizer.can_collect_payment}
                                  loading={
                                    updatingPermission ===
                                    `${organizer.id}-can_collect_payment`
                                  }
                                  onCheckedChange={(checked) =>
                                    handleUpdateOrganizerRoles(organizer.id, {
                                      can_collect_payment: checked === true,
                                    })
                                  }
                                />
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <Label
                                  htmlFor={`payment-${organizer.id}`}
                                  className="cursor-pointer"
                                >
                                  {t("trips.organizers.canCollectPayment")}
                                </Label>
                              </>
                            ) : (
                              <>
                                <Badge
                                  variant={
                                    organizer.can_collect_payment
                                      ? "default"
                                      : "outline"
                                  }
                                  className="mr-2"
                                >
                                  {organizer.can_collect_payment
                                    ? t("common.yes")
                                    : t("common.no")}
                                </Badge>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <Label>
                                  {t("trips.organizers.canCollectPayment")}
                                </Label>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Organizer Dialog */}
      <Dialog
        open={isAddOrganizerOpen}
        onOpenChange={(open) => {
          setIsAddOrganizerOpen(open);
          if (!open) {
            // Reset form when dialog closes
            setSelectedTeacherId("");
            setOrganizerSearchQuery("");
            setOrganizerRoles({
              can_approve: true,
              can_go: true,
              can_take_attendance: true,
              can_collect_payment: true,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden [&>div]:overflow-visible">
          <DialogHeader>
            <DialogTitle>{t("trips.organizers.addOrganizer")}</DialogTitle>
            <DialogDescription>
              {t("trips.organizers.addOrganizerDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-1">
            {/* Search Teacher */}
            <div className="space-y-2">
              <Label>{t("common.search")}</Label>
              <Input
                placeholder={t("users.searchPlaceholder")}
                value={organizerSearchQuery}
                onChange={(e) => setOrganizerSearchQuery(e.target.value)}
                disabled={isLoadingTeachers || isAddingOrganizer}
              />
            </div>

            {/* Select Teacher */}
            <div className="space-y-2">
              <Label htmlFor="teacher">
                {t("trips.organizers.selectTeacher")} *
              </Label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                disabled={isLoadingTeachers || isAddingOrganizer}
              >
                <SelectTrigger id="teacher">
                  <SelectValue
                    placeholder={t("trips.organizers.selectTeacherPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeachers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {isLoadingTeachers
                        ? t("trips.organizers.loadingTeachers")
                        : organizerSearchQuery
                        ? t("trips.organizers.noTeachersMatch")
                        : t("trips.organizers.noAvailableTeachers")}
                    </div>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name
                          ? `${teacher.full_name}${
                              teacher.phone ? ` - ${teacher.phone}` : ""
                            } (${teacher.email})`
                          : teacher.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>{t("trips.organizers.permissions")}</Label>
              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-approve"
                    checked={organizerRoles.can_approve === true}
                    onCheckedChange={(checked) =>
                      setOrganizerRoles((prev) => ({
                        ...prev,
                        can_approve: checked === true,
                      }))
                    }
                  />
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="new-approve" className="cursor-pointer">
                    {t("trips.organizers.canApprove")}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-go"
                    checked={organizerRoles.can_go === true}
                    onCheckedChange={(checked) =>
                      setOrganizerRoles((prev) => ({
                        ...prev,
                        can_go: checked === true,
                      }))
                    }
                  />
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="new-go" className="cursor-pointer">
                    {t("trips.organizers.canGo")}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-attendance"
                    checked={organizerRoles.can_take_attendance === true}
                    onCheckedChange={(checked) =>
                      setOrganizerRoles((prev) => ({
                        ...prev,
                        can_take_attendance: checked === true,
                      }))
                    }
                  />
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="new-attendance" className="cursor-pointer">
                    {t("trips.organizers.canTakeAttendance")}
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="new-payment"
                    checked={organizerRoles.can_collect_payment === true}
                    onCheckedChange={(checked) =>
                      setOrganizerRoles((prev) => ({
                        ...prev,
                        can_collect_payment: checked === true,
                      }))
                    }
                  />
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="new-payment" className="cursor-pointer">
                    {t("trips.organizers.canCollectPayment")}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOrganizerOpen(false)}
              disabled={isAddingOrganizer}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddOrganizer}
              disabled={isAddingOrganizer || !selectedTeacherId}
            >
              {isAddingOrganizer
                ? t("trips.organizers.adding")
                : t("trips.organizers.addOrganizer")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Participants Dialog */}
      <Dialog
        open={isAddParticipantsOpen}
        onOpenChange={(open) => {
          setIsAddParticipantsOpen(open);
          if (!open) {
            setAvailableStudents([]);
            setStudentSearchQuery("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-hidden [&>div]:overflow-visible">
          <DialogHeader>
            <DialogTitle>{t("trips.addStudents")}</DialogTitle>
            <DialogDescription>
              {t("trips.addStudentsDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-1">
            {/* Search Input */}
            {!isLoadingStudents && availableStudents.length > 0 && (
              <div className="relative">
                <Input
                  placeholder={t("trips.searchStudentsPlaceholder")}
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pr-8"
                />
              </div>
            )}

            {isLoadingStudents ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">
                  {t("trips.noStudentsAvailable")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {trip.classes && trip.classes.length > 0
                    ? t("trips.allStudentsSubscribed")
                    : t("trips.noClassesSelected")}
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">{t("common.noResults")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("trips.noStudentsMatchSearch")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.full_name || student.email}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {student.full_name || student.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {student.user_code && `ID: ${student.user_code} • `}
                          {student.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("trips.class")}: {student.class_name}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSubscribeStudent(student.id)}
                      disabled={subscribingStudentId === student.id}
                    >
                      {subscribingStudentId === student.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("trips.adding")}
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          {t("trips.add")}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddParticipantsOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("trips.actions.markAsPaid")}</DialogTitle>
            <DialogDescription>
              {selectedParticipantForPayment && (
                <span>
                  {t("trips.paymentFor")} {selectedParticipantForPayment.user?.full_name || selectedParticipantForPayment.user?.email}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParticipantForPayment && (() => {
              const userTier = (selectedParticipantForPayment.user as any)?.price_tier || "normal";
              const tripPrice = userTier === "mastor" ? trip.price_mastor : userTier === "botl" ? trip.price_botl : trip.price_normal;
              const currentAmountPaid = selectedParticipantForPayment.amount_paid || 0;
              const amountRemaining = Math.max(0, tripPrice - currentAmountPaid);
              const progressPercentage = tripPrice > 0 ? (currentAmountPaid / tripPrice) * 100 : 0;
              const currencySymbol = locale === "ar" ? "ج.م" : "E.L";
              const maxPayment = amountRemaining; // Can only pay remaining amount
              
              return (
                <>
                  {/* Current Payment Status */}
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t("trips.messages.paymentStatus")}</span>
                        <Badge className={getStatusColor(selectedParticipantForPayment.payment_status)}>
                          {selectedParticipantForPayment.payment_status === "partially_paid" 
                            ? t("trips.partiallyPaid")
                            : selectedParticipantForPayment.payment_status === "paid"
                            ? t("trips.stats.paid")
                            : t("trips.stats.unpaid")}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("trips.messages.amountPaid")}</span>
                          <span className="font-medium">{currencySymbol}{currentAmountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("trips.messages.amountRemaining")}</span>
                          <span className="font-medium">{currencySymbol}{amountRemaining.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("trips.messages.totalPrice")}</span>
                          <span className="font-medium">{currencySymbol}{tripPrice.toFixed(2)}</span>
                        </div>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-xs text-center text-muted-foreground">
                        {progressPercentage.toFixed(0)}% {t("trips.messages.complete")}
                      </p>
                    </div>
                  </div>

                  {/* Payment Amount Input */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount">{t("trips.paymentAmount")}</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      min="0"
                      max={maxPayment}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = parseFloat(value);
                        
                        // Prevent entering more than remaining amount
                        if (value && !isNaN(numValue) && numValue > maxPayment) {
                          setPaymentAmount(maxPayment.toString());
                          toast.error(t("trips.messages.paymentExceedsRemaining", { max: maxPayment }));
                        } else {
                          setPaymentAmount(value);
                        }
                        
                        if (fulfillAllAmount) {
                          setFulfillAllAmount(false);
                        }
                      }}
                      disabled={fulfillAllAmount}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("trips.messages.maxPaymentAmount", { max: maxPayment })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fulfill_all"
                      checked={fulfillAllAmount}
                      disabled={amountRemaining <= 0}
                      onCheckedChange={(checked) => {
                        setFulfillAllAmount(checked === true);
                        if (checked && amountRemaining > 0) {
                          setPaymentAmount(amountRemaining.toString());
                        } else if (!checked) {
                          setPaymentAmount("");
                        }
                      }}
                    />
                    <Label htmlFor="fulfill_all" className="cursor-pointer">
                      {t("trips.fulfillAllAmount")}
                    </Label>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setSelectedParticipantForPayment(null);
                setPaymentAmount("");
                setFulfillAllAmount(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={async () => {
                if (!selectedParticipantForPayment) return;
                setIsProcessingPayment(true);
                try {
                  const amount = parseFloat(paymentAmount);
                  const userTier = (selectedParticipantForPayment.user as any)?.price_tier || "normal";
                  const tripPrice = userTier === "mastor" ? trip.price_mastor : userTier === "botl" ? trip.price_botl : trip.price_normal;
                  
                  // Get current amount paid (default to 0 if not set)
                  const currentAmountPaid = selectedParticipantForPayment.amount_paid || 0;
                  
                  // Calculate new total amount paid
                  const newAmountPaid = currentAmountPaid + amount;
                  
                  // Validate that new total doesn't exceed trip price
                  if (newAmountPaid > tripPrice) {
                    toast.error(t("trips.messages.paymentExceedsPrice", { max: tripPrice }));
                    setIsProcessingPayment(false);
                    return;
                  }
                  
                  // Determine payment status based on new total
                  let paymentStatus: TripPaymentStatus = "paid";
                  if (newAmountPaid < tripPrice) {
                    paymentStatus = "partially_paid";
                  }

                  await handleUpdateParticipant(selectedParticipantForPayment.id, {
                    payment_status: paymentStatus,
                    amount_paid: newAmountPaid,
                  });

                  setIsPaymentDialogOpen(false);
                  setSelectedParticipantForPayment(null);
                  setPaymentAmount("");
                  setFulfillAllAmount(false);
                } catch (error) {
                  console.error("Error processing payment:", error);
                  let errorMessage = t("trips.paymentError");
                  if (error instanceof Error) {
                    if (error.message === "INVALID_PAYMENT_STATUS") {
                      errorMessage = t("trips.messages.invalidPaymentStatus");
                    } else {
                      errorMessage = error.message;
                    }
                  }
                  toast.error(errorMessage);
                } finally {
                  setIsProcessingPayment(false);
                }
              }}
              disabled={
                isProcessingPayment || 
                !paymentAmount || 
                parseFloat(paymentAmount) <= 0 ||
                !selectedParticipantForPayment ||
                (selectedParticipantForPayment && (() => {
                  const userTier = (selectedParticipantForPayment.user as any)?.price_tier || "normal";
                  const tripPrice = userTier === "mastor" ? trip.price_mastor : userTier === "botl" ? trip.price_botl : trip.price_normal;
                  const currentAmountPaid = selectedParticipantForPayment.amount_paid || 0;
                  const amountRemaining = Math.max(0, tripPrice - currentAmountPaid);
                  return amountRemaining <= 0;
                })()) || false
              }
            >
              {isProcessingPayment ? t("common.processing") : t("trips.actions.markAsPaid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Take Attendance Dialog */}
      {/* Attendance is now handled in the Attendance tab (no popup). */}
    </div>
  );
}

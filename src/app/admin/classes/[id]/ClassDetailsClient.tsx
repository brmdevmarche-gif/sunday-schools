"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Users,
  Calendar,
  Building,
  MapPin,
  UserPlus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Clock,
  MapPinIcon,
  DollarSign,
  Tag,
  Eye,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  Loader2,
  Bus,
} from "lucide-react";
import { toast } from "sonner";
import type { ExtendedUser } from "@/lib/types";
import {
  deleteClassAction,
  getAvailableStudentsData,
  getAvailableTeachersData,
  assignUserToClassAction,
  removeUserFromClassAction,
  getAllTripsAction,
  getTripDetailsForClassAction,
  subscribeStudentToTripAction,
  approveTripParticipantAction,
  markTripParticipantAsPaidAction,
  getStudentPriceTier,
} from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassDetailsClientProps {
  classData: any;
  rosterData: any[];
  activitiesData: any[];
  userProfile: ExtendedUser;
}

export default function ClassDetailsClient({
  classData,
  rosterData: initialRosterData,
  activitiesData,
  userProfile,
}: ClassDetailsClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Get currency symbol based on locale
  const getCurrencySymbol = () => {
    return locale === 'ar' ? 'ج.م' : 'E.L';
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"teacher" | "student">(
    "student"
  );
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rosterData, setRosterData] = useState(initialRosterData);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [isLoadingTripDetails, setIsLoadingTripDetails] = useState(false);
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | "subscribed" | "unsubscribed">("all");
  const [subscribingStudentId, setSubscribingStudentId] = useState<string | null>(null);
  const [approvingParticipantId, setApprovingParticipantId] = useState<string | null>(null);
  const [markingPaidParticipantId, setMarkingPaidParticipantId] = useState<string | null>(null);

  const teachers = rosterData.filter((r) => r.assignment_type === "teacher");
  const students = rosterData.filter((r) => r.assignment_type === "student");

  // Filter users based on search
  const filteredUsers = availableUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  async function handleOpenAssignDialog(type: "teacher" | "student") {
    setAssignmentType(type);
    setSelectedUserIds([]);
    setSearchQuery("");

    try {
      const users =
        type === "teacher"
          ? await getAvailableTeachersData(classData.churches?.id || "")
          : await getAvailableStudentsData(classData.churches?.id || "");

      setAvailableUsers(users);
      setIsAssignDialogOpen(true);
    } catch {
      toast.error(t("classes.failedToLoadUsers"));
    }
  }

  async function handleAssignUsers() {
    if (selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const promises = selectedUserIds.map((userId) =>
        assignUserToClassAction(classData.id, userId, assignmentType)
      );

      await Promise.all(promises);

      const count = selectedUserIds.length;
      toast.success(
        count === 1
          ? assignmentType === "teacher"
            ? t("classes.teacherAssigned")
            : t("classes.studentAssigned")
          : `${count} ${
              assignmentType === "teacher"
                ? t("classes.teachersAssigned")
                : t("classes.studentsAssigned")
            }`
      );

      setIsAssignDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(t("classes.assignFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveUser(assignmentId: string) {
    try {
      await removeUserFromClassAction(assignmentId, classData.id);
      toast.success(t("classes.userRemoved"));

      // Update local state
      setRosterData((prev) => prev.filter((r) => r.id !== assignmentId));
    } catch {
      toast.error(t("classes.removeFailed"));
    }
  }

  async function handleDelete() {
    try {
      await deleteClassAction(classData.id);
      toast.success(t("classes.classDeleted"));
      router.push("/admin/classes");
    } catch {
      toast.error(t("classes.deleteFailed"));
    }
  }

  function getActivityTypeColor(type: string) {
    const colors: Record<string, string> = {
      game: "bg-blue-500",
      craft: "bg-purple-500",
      worship: "bg-yellow-500",
      service: "bg-green-500",
      other: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  }

  function getActivityScope(activity: any) {
    if (activity.class_id === classData.id) {
      return { scope: t("classes.classLevel"), variant: "default" as const };
    }
    if (activity.church_id === classData.churches?.id) {
      return { scope: t("classes.churchLevel"), variant: "secondary" as const };
    }
    return { scope: t("classes.dioceseLevel"), variant: "outline" as const };
  }

  async function loadTrips() {
    setIsLoadingTrips(true);
    try {
      const tripsData = await getAllTripsAction(classData.id);
      setTrips(tripsData);
    } catch (error) {
      console.error("Error loading trips:", error);
      toast.error(t("trips.classDetails.failedToLoadTrips"));
    } finally {
      setIsLoadingTrips(false);
    }
  }

  async function loadTripDetails(tripId: string, forceReload: boolean = false) {
    if (!forceReload && selectedTrip === tripId && tripDetails) return; // Already loaded
    setIsLoadingTripDetails(true);
    setSelectedTrip(tripId);
    try {
      const details = await getTripDetailsForClassAction(tripId, classData.id);
      setTripDetails(details);
    } catch (error) {
      console.error("Error loading trip details:", error);
      toast.error(t("trips.classDetails.failedToLoadTripDetails"));
    } finally {
      setIsLoadingTripDetails(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  function exportToCSV() {
    if (!tripDetails || !tripDetails.students || filteredStudents.length === 0) {
      toast.error("No students to export");
      return;
    }

    // CSV Headers
    const headers = [
      t("users.fullName"),
      t("common.email"),
      t("common.phone"),
      t("common.address"),
      t("trips.classDetails.subscriptionStatus"),
      t("trips.table.approvalStatus"),
      t("trips.table.paymentStatus"),
      t("trips.table.registered"),
    ];

    // CSV Rows
    const rows = filteredStudents.map((student: any) => [
      student.full_name || "",
      student.email || "",
      student.phone || "",
      student.address || "",
      student.isSubscribed ? t("trips.classDetails.subscribed") : t("trips.classDetails.notSubscribed"),
      student.approval_status ? (t(`trips.stats.${student.approval_status}`) || student.approval_status) : "",
      student.payment_status ? (t(`trips.stats.${student.payment_status}`) || student.payment_status) : "",
      student.registered_at
        ? formatDateTime(student.registered_at)
        : "",
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) =>
        row
          .map((cell: string) => {
            // Escape commas and quotes in cell values
            const cellString = String(cell || "");
            if (cellString.includes(",") || cellString.includes('"')) {
              return `"${cellString.replace(/"/g, '""')}"`;
            }
            return cellString;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${tripDetails.trip.name || "trip"}_students_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t("trips.classDetails.csvExportedSuccess"));
  }

  function getStudentPrice(student: any, trip: any): { tier: string; price: number } {
    // For now, defaulting to normal tier
    // In the future, this could check student.price_tier or user profile
    // TODO: Get from student profile - could be student.price_tier or check user profile field
    const tierValue: 'normal' | 'mastor' | 'botl' = (student?.price_tier || 'normal') as 'normal' | 'mastor' | 'botl';
    
    let price = 0;
    if (tierValue === 'mastor' && trip.price_mastor !== null) {
      price = trip.price_mastor;
    } else if (tierValue === 'botl' && trip.price_botl !== null) {
      price = trip.price_botl;
    } else if (trip.price_normal !== null) {
      price = trip.price_normal;
    }
    
    const tierLabel = t(`store.tier.${tierValue}`);
    return { tier: tierLabel, price };
  }

  async function handleSubscribeStudent(studentId: string) {
    if (!selectedTrip) return;
    setSubscribingStudentId(studentId);
    try {
      await subscribeStudentToTripAction(selectedTrip, studentId);
      toast.success(t("trips.classDetails.studentSubscribedSuccess"));
      // Reload trip details
      await loadTripDetails(selectedTrip, true);
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error subscribing student:", error);
      toast.error(error.message || t("trips.classDetails.failedToSubscribeStudent"));
    } finally {
      setSubscribingStudentId(null);
    }
  }

  async function handleApproveParticipant(participantId: string) {
    setApprovingParticipantId(participantId);
    try {
      await approveTripParticipantAction(participantId);
      toast.success(t("trips.classDetails.approvedSuccess"));
      // Reload trip details
      if (selectedTrip) {
        await loadTripDetails(selectedTrip, true);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error approving participant:", error);
      toast.error(error.message || t("trips.classDetails.failedToApprove"));
    } finally {
      setApprovingParticipantId(null);
    }
  }

  async function handleMarkAsPaid(participantId: string) {
    setMarkingPaidParticipantId(participantId);
    try {
      await markTripParticipantAsPaidAction(participantId);
      toast.success(t("trips.classDetails.markedAsPaidSuccess"));
      // Reload trip details
      if (selectedTrip) {
        await loadTripDetails(selectedTrip, true);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast.error(error.message || t("trips.classDetails.failedToMarkAsPaid"));
    } finally {
      setMarkingPaidParticipantId(null);
    }
  }

  const filteredStudents = tripDetails?.students
    ? tripDetails.students.filter((student: any) => {
        if (subscriptionFilter === "all") return true;
        if (subscriptionFilter === "subscribed") return student.isSubscribed;
        if (subscriptionFilter === "unsubscribed") return !student.isSubscribed;
        return true;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/classes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <Badge variant={classData.is_active ? "default" : "secondary"}>
                {classData.is_active
                  ? t("common.active")
                  : t("common.inactive")}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {classData.description || t("classes.noDescription")}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignDialog("student")}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t("classes.assignStudent")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignDialog("teacher")}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            {t("classes.assignTeacher")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/classes?edit=${classData.id}`)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      {/* Class Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("classes.classInformation")}</CardTitle>
            <CardDescription>{t("classes.basicDetails")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("classes.church")}</p>
                <p className="text-sm text-muted-foreground">
                  {classData.churches?.name || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("classes.diocese")}</p>
                <p className="text-sm text-muted-foreground">
                  {classData.churches?.dioceses?.name || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">
                  {t("classes.academicYear")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {classData.academic_year || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("classes.capacity")}</p>
                <p className="text-sm text-muted-foreground">
                  {students.length}/{classData.capacity || "-"}{" "}
                  {t("classes.students")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("classes.schedule")}</CardTitle>
            <CardDescription>{t("classes.classSchedule")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{t("classes.gradeLevel")}</p>
              <p className="text-sm text-muted-foreground">
                {classData.grade_level || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">{t("classes.meetingTime")}</p>
              <p className="text-sm text-muted-foreground">
                {classData.schedule || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Class Roster, Activities & Trips */}
      <Tabs defaultValue="roster" className="w-full">
        <TabsList>
          <TabsTrigger value="roster">
            <Users className="h-4 w-4 mr-2" />
            {t("classes.roster")} ({teachers.length + students.length})
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Calendar className="h-4 w-4 mr-2" />
            {t("classes.activities")} ({activitiesData.length})
          </TabsTrigger>
          <TabsTrigger
            value="trips"
            onClick={() => {
              if (trips.length === 0 && !isLoadingTrips) {
                loadTrips();
              }
            }}
          >
            <Bus className="h-4 w-4 mr-2" />
            {t("trips.title")}{trips.length > 0 && ` (${trips.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-4">
          {/* Teachers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {t("classes.teachers")} ({teachers.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("classes.noTeachers")}
                </p>
              ) : (
                <div className="space-y-3">
                  {teachers.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={assignment.user?.avatar_url || undefined}
                          alt={assignment.user?.full_name}
                        />
                        <AvatarFallback>
                          {(
                            assignment.user?.full_name || assignment.user?.email
                          )
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {assignment.user?.full_name || assignment.user?.email}
                        </p>
                        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-2">
                          {assignment.user?.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="break-words">{assignment.user.email}</span>
                            </span>
                          )}
                          {assignment.user?.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="font-medium text-foreground">{assignment.user.phone}</span>
                            </span>
                          )}
                          {assignment.user?.address && (
                            <span className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span className="break-words text-foreground/90">{assignment.user.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {t("classes.students")} ({students.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("classes.noStudents")}
                </p>
              ) : (
                <div className="space-y-3">
                  {students.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={assignment.user?.avatar_url || undefined}
                          alt={assignment.user?.full_name}
                        />
                        <AvatarFallback>
                          {(
                            assignment.user?.full_name || assignment.user?.email
                          )
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {assignment.user?.full_name || assignment.user?.email}
                        </p>
                        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-2">
                          {assignment.user?.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="break-words">{assignment.user.email}</span>
                            </span>
                          )}
                          {assignment.user?.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="font-medium text-foreground">{assignment.user.phone}</span>
                            </span>
                          )}
                          {assignment.user?.address && (
                            <span className="flex items-start gap-1.5">
                              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              <span className="break-words text-foreground/90">{assignment.user.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>{t("classes.classActivities")}</CardTitle>
              <CardDescription>
                {t("classes.activitiesDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t("classes.noActivities")}
                </p>
              ) : (
                <div className="space-y-4">
                  {activitiesData.map((activity) => {
                    const { scope, variant } = getActivityScope(activity);
                    return (
                      <div
                        key={activity.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                {activity.title}
                              </h3>
                              <Badge variant={variant}>{scope}</Badge>
                              {activity.activity_type && (
                                <Badge
                                  className={`${getActivityTypeColor(
                                    activity.activity_type
                                  )} text-white`}
                                >
                                  {t(`activities.${activity.activity_type}`)}
                                </Badge>
                              )}
                            </div>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {activity.activity_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(
                                activity.activity_date
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {activity.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {activity.start_time}
                              {activity.end_time && ` - ${activity.end_time}`}
                            </span>
                          )}
                          {activity.location && (
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {activity.location}
                            </span>
                          )}
                          {activity.cost && activity.cost > 0 && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />{getCurrencySymbol()}{activity.cost}
                            </span>
                          )}
                        </div>

                        {activity.classes?.name && (
                          <p className="text-xs text-muted-foreground">
                            {t("classes.assignedTo")}: {activity.classes.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-4">
          {isLoadingTrips ? (
            <Card>
              <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                  {t("trips.classDetails.loadingTrips")}
                </p>
              </CardContent>
            </Card>
          ) : trips.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  {t("trips.classDetails.noTripsFound")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              {/* Trips List - 30% width */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t("trips.classDetails.allTrips")}</CardTitle>
                  <CardDescription>
                    {t("trips.classDetails.selectTripToView")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {trips.map((trip) => (
                      <Card
                        key={trip.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTrip === trip.id
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => loadTripDetails(trip.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {trip.name}
                              </CardTitle>
                              {trip.description && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  {trip.description}
                                </CardDescription>
                              )}
                            </div>
                            <Badge
                              variant={
                                trip.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {trip.status ? t(`trips.statuses.${trip.status}`) : t("trips.statuses.active")}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {trip.start_datetime && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(trip.start_datetime)}
                                </span>
                              )}
                              {trip.price_normal !== null && (
                                <span className="flex items-center gap-1">
                                  {getCurrencySymbol()}{trip.price_normal}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs pt-1 border-t">
                              <span className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-primary" />
                                <span className="font-medium">
                                  {trip.totalSubscribedCount ?? 0} {t("trips.classDetails.subscribed")}
                                </span>
                              </span>
                              {typeof trip.classSubscribedCount === 'number' && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {trip.classSubscribedCount} {t("trips.classDetails.subscribed")} {t("classes.fromClass")}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trip Details - Class Students - 70% width */}
              <Card className="lg:col-span-7">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {tripDetails?.trip?.name || t("trips.classDetails.selectTrip")}
                      </CardTitle>
                      <CardDescription>
                        {t("trips.classDetails.classStudentsStatus")}
                      </CardDescription>
                    </div>
                    {tripDetails && filteredStudents.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCSV()}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("trips.classDetails.exportCSV")}
                      </Button>
                    )}
                  </div>
                  {tripDetails && (
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={subscriptionFilter}
                          onValueChange={(value: any) =>
                            setSubscriptionFilter(value)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("trips.classDetails.allStudents")}</SelectItem>
                            <SelectItem value="subscribed">{t("trips.classDetails.subscribed")}</SelectItem>
                            <SelectItem value="unsubscribed">
                              {t("trips.classDetails.unsubscribed")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Payment Status Counts */}
                      {(() => {
                        const paidCount = tripDetails.students.filter((s: any) => s.isSubscribed && s.payment_status === 'paid').length;
                        const pendingPaymentCount = tripDetails.students.filter((s: any) => s.isSubscribed && (s.payment_status === 'pending' || s.payment_status === null)).length;
                        
                        return (
                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 dark:text-green-400 font-medium">
                                {paidCount} {t("trips.classDetails.paid")}
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-700 dark:text-orange-400 font-medium">
                                {pendingPaymentCount} {t("trips.classDetails.pendingPayment")}
                              </span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingTripDetails ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t("trips.classDetails.loadingTripDetails")}
                      </p>
                    </div>
                  ) : !tripDetails ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t("trips.classDetails.selectTripToView")}
                      </p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t("trips.classDetails.noStudentsFound")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredStudents.map((student: any) => (
                        <div
                          key={student.id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <Avatar className="h-10 w-10 mt-1">
                            <AvatarImage
                              src={student.avatar_url || undefined}
                              alt={student.full_name}
                            />
                            <AvatarFallback>
                              {(student.full_name || student.email)
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {student.full_name || student.email}
                            </p>
                            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-2">
                              {student.email && (
                                <span className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="break-words">{student.email}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className={student.phone ? "font-medium text-foreground" : "text-muted-foreground/70"}>
                                  {student.phone || "N/A"}
                                </span>
                              </span>
                              <span className="flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span className={student.address ? "break-words text-foreground/90" : "text-muted-foreground/70"}>
                                  {student.address || "N/A"}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {student.isSubscribed ? (
                              <>
                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                  <span className="font-medium text-green-600 text-xs">
                                    {t("trips.classDetails.subscribed")}
                                  </span>
                                  {/* Show approval status badge if pending or approved */}
                                  {student.approval_status && student.approval_status === "pending" && (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                      {t(`trips.stats.${student.approval_status}`) || student.approval_status}
                                    </Badge>
                                  )}
                                  {student.approval_status && student.approval_status === "approved" && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                      {t(`trips.stats.${student.approval_status}`) || student.approval_status}
                                    </Badge>
                                  )}
                                  {/* Show payment status badge */}
                                  {student.payment_status && student.payment_status === "paid" && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                      {t(`trips.stats.${student.payment_status}`) || student.payment_status}
                                    </Badge>
                                  )}
                                  {student.payment_status && student.payment_status === "pending" && student.approval_status === "approved" && (
                                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                      {t(`trips.stats.${student.payment_status}`) || student.payment_status}
                                    </Badge>
                                  )}
                                </div>
                                {/* Price and Category */}
                                {tripDetails?.trip && (
                                  <div className="text-xs text-right mt-1">
                                    {(() => {
                                      const { tier, price } = getStudentPrice(student, tripDetails.trip);
                                      return (
                                        <div className="space-y-1">
                                          <Badge variant="secondary" className="text-xs">
                                            {tier}: {getCurrencySymbol()}{price}
                                          </Badge>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                                {/* Approve Button - Show if subscribed but approval_status is pending */}
                                {student.participant_id && student.approval_status === "pending" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveParticipant(student.participant_id)}
                                    disabled={approvingParticipantId === student.participant_id}
                                    className="text-xs"
                                  >
                                    {approvingParticipantId === student.participant_id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        {t("trips.classDetails.processing")}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        {t("trips.classDetails.approve")}
                                      </>
                                    )}
                                  </Button>
                                )}
                                {/* Payment Button - Only show if approved and not paid */}
                                {student.participant_id && 
                                 student.approval_status === "approved" && 
                                 student.payment_status !== "paid" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsPaid(student.participant_id)}
                                    disabled={markingPaidParticipantId === student.participant_id}
                                    className="text-xs"
                                  >
                                    {markingPaidParticipantId === student.participant_id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        {t("trips.classDetails.processing")}
                                      </>
                                    ) : (
                                      <>
                                        {t("trips.classDetails.payNow")}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-5 w-5 text-gray-400" />
                                  <p className="text-xs text-muted-foreground">
                                    {t("trips.classDetails.notSubscribed")}
                                  </p>
                                </div>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSubscribeStudent(student.id)}
                                  disabled={subscribingStudentId === student.id}
                                  className="text-xs"
                                >
                                  {subscribingStudentId === student.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      {t("trips.classDetails.subscribing")}
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      {t("trips.classDetails.subscribe")}
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Users Dialog (same as before) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {assignmentType === "teacher"
                ? t("classes.assignTeacher")
                : t("classes.assignStudent")}
            </DialogTitle>
            <DialogDescription>
              {t("classes.selectUsersToAssign", { className: classData.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-all ${
                    selectedUserIds.includes(user.id)
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={user.avatar_url || undefined}
                          alt={user.full_name}
                        />
                        <AvatarFallback>
                          {(user.full_name || user.email)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground">
                            {user.phone}
                          </p>
                        )}
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAssignUsers}
              disabled={isSubmitting || selectedUserIds.length === 0}
            >
              {isSubmitting
                ? t("classes.assigning")
                : selectedUserIds.length > 0
                ? `${t("classes.assign")} (${selectedUserIds.length})`
                : t("classes.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("classes.deleteClass")}</DialogTitle>
            <DialogDescription>
              {t("classes.deleteConfirm", { name: classData.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

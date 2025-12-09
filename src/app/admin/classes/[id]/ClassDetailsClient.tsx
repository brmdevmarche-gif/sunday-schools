"use client";

import { useState, useTransition } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
} from "lucide-react";
import { toast } from "sonner";
import type { ExtendedUser } from "@/lib/types/sunday-school";
import {
  deleteClassAction,
  getAvailableStudentsData,
  getAvailableTeachersData,
  assignUserToClassAction,
  removeUserFromClassAction,
} from "../actions";

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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"teacher" | "student">("student");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rosterData, setRosterData] = useState(initialRosterData);

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
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
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
                {classData.is_active ? t("common.active") : t("common.inactive")}
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
                <p className="text-sm font-medium">{t("classes.academicYear")}</p>
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
                  {students.length}/{classData.capacity || "-"} {t("classes.students")}
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

      {/* Tabs: Class Roster & Activities */}
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
        </TabsList>

        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-4">
          {/* Teachers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t("classes.teachers")} ({teachers.length})</span>
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
                          {(assignment.user?.full_name || assignment.user?.email)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {assignment.user?.full_name || assignment.user?.email}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {assignment.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {assignment.user.email}
                            </span>
                          )}
                          {assignment.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {assignment.user.phone}
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
                <span>{t("classes.students")} ({students.length})</span>
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
                          {(assignment.user?.full_name || assignment.user?.email)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {assignment.user?.full_name || assignment.user?.email}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {assignment.user?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {assignment.user.email}
                            </span>
                          )}
                          {assignment.user?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {assignment.user.phone}
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
                              <h3 className="font-semibold">{activity.title}</h3>
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
                              {new Date(activity.activity_date).toLocaleDateString()}
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
                              <DollarSign className="h-4 w-4" />
                              ${activity.cost}
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
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
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

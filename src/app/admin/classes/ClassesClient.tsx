"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Search,
  User as UserIcon,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  Class,
  CreateClassInput,
  Church,
  Diocese,
  ExtendedUser,
} from "@/lib/types";
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
  assignUserToClassAction,
  removeUserFromClassAction,
  getClassAssignmentsData,
  getAvailableTeachersData,
  getAvailableStudentsData,
} from "./actions";

interface ClassWithCount extends Class {
  studentCount: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}

interface Assignment {
  id: string;
  assignment_type: "teacher" | "student";
  user: User;
}

interface ClassesClientProps {
  initialClasses: ClassWithCount[];
  churches: Church[];
  dioceses: Diocese[];
  userProfile: ExtendedUser;
}

export default function ClassesClient({
  initialClasses,
  churches,
  dioceses,
  userProfile,
}: ClassesClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedDioceseFilter, setSelectedDioceseFilter] =
    useState<string>("all");
  const [selectedChurchFilter, setSelectedChurchFilter] =
    useState<string>("all");
  const [classRoster, setClassRoster] = useState<Assignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assignmentType, setAssignmentType] = useState<"teacher" | "student">(
    "teacher"
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [formData, setFormData] = useState<CreateClassInput>({
    church_id: "",
    name: "",
    description: "",
    grade_level: "",
    academic_year: "",
    schedule: "",
    capacity: 30,
  });

  function handleOpenDialog(cls?: Class) {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        church_id: cls.church_id || "",
        name: cls.name,
        description: cls.description || "",
        grade_level: cls.grade_level || "",
        academic_year: cls.academic_year || "",
        schedule: cls.schedule || "",
        capacity: cls.capacity || 30,
      });
    } else {
      setEditingClass(null);
      setFormData({
        church_id: userProfile?.church_id || "",
        name: "",
        description: "",
        grade_level: "",
        academic_year:
          new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
        schedule: "",
        capacity: 30,
      });
    }
    setIsDialogOpen(true);
  }

  async function handleOpenAssignDialog(
    cls: Class,
    type: "teacher" | "student"
  ) {
    setSelectedClass(cls);
    setAssignmentType(type);
    setSelectedUserIds([]);
    setSearchQuery("");

    try {
      const users =
        type === "teacher"
          ? await getAvailableTeachersData(cls.church_id || "")
          : await getAvailableStudentsData(cls.church_id || "");

      setAvailableUsers(users);
      setIsAssignDialogOpen(true);
    } catch {
      toast.error(t("classes.failedToLoadUsers"));
    }
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }

  // Filter users based on search query
  const filteredUsers = availableUsers.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  async function handleOpenRoster(cls: Class) {
    setSelectedClass(cls);

    try {
      const roster = await getClassAssignmentsData(cls.id);
      setClassRoster(roster as Assignment[]);
      setIsRosterDialogOpen(true);
    } catch {
      toast.error(t("classes.failedToLoadRoster"));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingClass) {
        await updateClassAction(editingClass.id, formData);
        toast.success(t("classes.classUpdated"));
      } else {
        await createClassAction(formData);
        toast.success(t("classes.classCreated"));
      }

      setIsDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(
        editingClass ? t("classes.updateFailed") : t("classes.createFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAssignUser() {
    if (!selectedClass || selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // Assign all selected users
      const promises = selectedUserIds.map((userId) =>
        assignUserToClassAction(selectedClass.id, userId, assignmentType)
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
      console.error("Error assigning user:", error);
      toast.error(t("classes.assignFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveUser(assignmentId: string) {
    if (!confirm(t("classes.removeUserConfirm"))) return;

    try {
      await removeUserFromClassAction(assignmentId, selectedClass?.id);
      toast.success(t("classes.userRemoved"));
      if (selectedClass) {
        const roster = await getClassAssignmentsData(selectedClass.id);
        setClassRoster(roster as Assignment[]);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error(t("classes.removeFailed"));
    }
  }

  async function handleDelete(cls: Class) {
    if (!confirm(t("classes.deleteConfirm", { name: cls.name }))) {
      return;
    }

    try {
      await deleteClassAction(cls.id);
      toast.success(t("classes.classDeleted"));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(t("classes.deleteFailed"));
    }
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return "-";
    const church = churches.find((c) => c.id === churchId);
    return church?.name || "-";
  }

  const filteredChurches =
    selectedDioceseFilter === "all"
      ? churches
      : churches.filter((c) => c.diocese_id === selectedDioceseFilter);

  const filteredClasses = initialClasses.filter((cls) => {
    if (
      selectedChurchFilter !== "all" &&
      cls.church_id !== selectedChurchFilter
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("classes.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("classes.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t("classes.addClass")}
        </Button>
      </div>

          {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("common.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label>{t("classes.diocese")}</Label>
              <Select
                value={selectedDioceseFilter}
                onValueChange={setSelectedDioceseFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("classes.allDioceses")}
                  </SelectItem>
                  {dioceses.map((diocese) => (
                    <SelectItem key={diocese.id} value={diocese.id}>
                      {diocese.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-1">
              <Label>{t("classes.church")}</Label>
              <Select
                value={selectedChurchFilter}
                onValueChange={setSelectedChurchFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("classes.allChurches")}
                  </SelectItem>
                  {filteredChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("classes.allClasses")}</CardTitle>
          <CardDescription>
            {t("classes.allClassesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t("classes.noClasses")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("classes.church")}</TableHead>
                  <TableHead>{t("classes.gradeLevel")}</TableHead>
                  <TableHead>{t("classes.academicYear")}</TableHead>
                  <TableHead>{t("classes.schedule")}</TableHead>
                  <TableHead className="text-center">
                    {t("classes.students")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("common.status")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow
                    key={cls.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/classes/${cls.id}`)}
                  >
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{getChurchName(cls.church_id)}</TableCell>
                    <TableCell>{cls.grade_level || "-"}</TableCell>
                    <TableCell>{cls.academic_year || "-"}</TableCell>
                    <TableCell className="text-sm">
                      {cls.schedule || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {cls.studentCount}/{cls.capacity || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cls.is_active ? "default" : "secondary"}>
                        {cls.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRoster(cls);
                          }}
                          title={t("classes.viewRoster")}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignDialog(cls, "student");
                          }}
                          title={t("classes.assignStudent")}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssignDialog(cls, "teacher");
                          }}
                          title={t("classes.assignTeacher")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <UserIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(cls);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cls);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingClass
                  ? t("classes.editClass")
                  : t("classes.createClass")}
              </DialogTitle>
              <DialogDescription>
                {editingClass
                  ? t("classes.updateDescription")
                  : t("classes.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="church_id">{t("classes.church")} *</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, church_id: value })
                  }
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("classes.selectChurch")} />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("classes.className")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  placeholder={t("classes.classNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("common.description")}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder={t("classes.descriptionPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade_level">{t("classes.gradeLevel")}</Label>
                  <Input
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={(e) =>
                      setFormData({ ...formData, grade_level: e.target.value })
                    }
                    disabled={isSubmitting}
                    placeholder={t("classes.gradeLevelPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">
                    {t("classes.academicYear")}
                  </Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        academic_year: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder={t("classes.academicYearPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">{t("classes.schedule")}</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    disabled={isSubmitting}
                    placeholder={t("classes.schedulePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">{t("classes.capacity")}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 30,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder={t("classes.capacityPlaceholder")}
                    min="1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.saving")
                  : editingClass
                  ? t("common.update")
                  : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {assignmentType === "teacher"
                ? t("classes.assignTeacher")
                : t("classes.assignStudent")}
            </DialogTitle>
            <DialogDescription>
              {assignmentType === "teacher"
                ? t("classes.selectTeacher", {
                    className: selectedClass?.name ?? "",
                  })
                : t("classes.selectStudent", {
                    className: selectedClass?.name ?? "",
                  })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  t("common.search") +
                  " " +
                  (assignmentType === "teacher"
                    ? t("classes.byNameEmailPhone")
                    : t("classes.byNameEmailPhone"))
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User Cards */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchQuery
                      ? t("common.noResults")
                      : t("classes.noUsersAvailable")}
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <Card
                    key={user.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
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
                            alt={user.full_name || user.email}
                          />
                          <AvatarFallback className="bg-primary/10">
                            {(user.full_name || user.email)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.full_name ||
                              user.username ||
                              t("common.unnamed")}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                        {selectedUserIds.includes(user.id) && (
                          <div className="flex-shrink-0">
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
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
              onClick={handleAssignUser}
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

      {/* Class Roster Dialog */}
      <Dialog open={isRosterDialogOpen} onOpenChange={setIsRosterDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {t("classes.classRoster", {
                className: selectedClass?.name ?? "",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("classes.rosterDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Teachers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t("classes.teachers")}</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    selectedClass &&
                    handleOpenAssignDialog(selectedClass, "teacher")
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("classes.addTeacher")}
                </Button>
              </div>
              <div className="border rounded-lg">
                {classRoster.filter((r) => r.assignment_type === "teacher")
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    {t("classes.noTeachers")}
                  </p>
                ) : (
                  <Table>
                    <TableBody>
                      {classRoster
                        .filter((r) => r.assignment_type === "teacher")
                        .map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {assignment.user?.full_name ||
                                assignment.user?.email}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUser(assignment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{t("classes.students")}</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    selectedClass &&
                    handleOpenAssignDialog(selectedClass, "student")
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("classes.addStudent")}
                </Button>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {classRoster.filter((r) => r.assignment_type === "student")
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    {t("classes.noStudents")}
                  </p>
                ) : (
                  <Table>
                    <TableBody>
                      {classRoster
                        .filter((r) => r.assignment_type === "student")
                        .map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {assignment.user?.full_name ||
                                assignment.user?.email}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUser(assignment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsRosterDialogOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

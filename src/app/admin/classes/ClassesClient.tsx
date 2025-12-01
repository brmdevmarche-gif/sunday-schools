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
import { Plus, Pencil, Trash2, Users, UserPlus } from "lucide-react";
import type {
  Class,
  CreateClassInput,
  Church,
  Diocese,
} from "@/lib/types/sunday-school";
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
  userProfile: any;
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
  const [selectedUserId, setSelectedUserId] = useState<string>("");

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
    setSelectedUserId("");

    try {
      const users =
        type === "teacher"
          ? await getAvailableTeachersData(cls.church_id || "")
          : await getAvailableStudentsData(cls.church_id || "");

      setAvailableUsers(users);
      setIsAssignDialogOpen(true);
    } catch (error) {
      toast.error(t("classes.failedToLoadUsers"));
    }
  }

  async function handleOpenRoster(cls: Class) {
    setSelectedClass(cls);

    try {
      const roster = await getClassAssignmentsData(cls.id);
      setClassRoster(roster as Assignment[]);
      setIsRosterDialogOpen(true);
    } catch (error) {
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
    if (!selectedClass || !selectedUserId) return;

    setIsSubmitting(true);
    try {
      await assignUserToClassAction(
        selectedClass.id,
        selectedUserId,
        assignmentType
      );
      toast.success(
        assignmentType === "teacher"
          ? t("classes.teacherAssigned")
          : t("classes.studentAssigned")
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
      await removeUserFromClassAction(assignmentId);
      toast.success(t("classes.userRemoved"));
      if (selectedClass) {
        const roster = await getClassAssignmentsData(selectedClass.id);
        setClassRoster(roster as Assignment[]);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
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
                  <TableRow key={cls.id}>
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRoster(cls)}
                          title={t("classes.viewRoster")}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAssignDialog(cls, "teacher")}
                          title={t("classes.assignTeacher")}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(cls)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cls)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {assignmentType === "teacher"
                ? t("classes.assignTeacher")
                : t("classes.assignStudent")}
            </DialogTitle>
            <DialogDescription>
              {assignmentType === "teacher"
                ? t("classes.selectTeacher", { className: selectedClass?.name })
                : t("classes.selectStudent", {
                    className: selectedClass?.name,
                  })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("classes.selectUser")}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      assignmentType === "teacher"
                        ? t("classes.chooseTeacher")
                        : t("classes.chooseStudent")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={isSubmitting || !selectedUserId}
            >
              {isSubmitting ? t("classes.assigning") : t("classes.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Roster Dialog */}
      <Dialog open={isRosterDialogOpen} onOpenChange={setIsRosterDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {t("classes.classRoster", { className: selectedClass?.name })}
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

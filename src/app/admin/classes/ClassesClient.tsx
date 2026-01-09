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
  ResponsiveTable,
  type SortOption,
} from "@/components/ui/responsive-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  GraduationCap,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveFilters } from "@/components/ui/filter-sheet";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { OptimizedAvatar, getInitials } from "@/components/ui/optimized-avatar";
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

type SortColumn = "name" | "church" | "gradeLevel" | "studentCount";
type SortDirection = "asc" | "desc";

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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    classItem: Class | null;
  }>({ open: false, classItem: null });
  const [removeUserConfirm, setRemoveUserConfirm] = useState<{
    open: boolean;
    assignmentId: string | null;
  }>({ open: false, assignmentId: null });
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  function handleRemoveUser(assignmentId: string) {
    setRemoveUserConfirm({ open: true, assignmentId });
  }

  async function confirmRemoveUser() {
    if (!removeUserConfirm.assignmentId) return;

    try {
      await removeUserFromClassAction(
        removeUserConfirm.assignmentId,
        selectedClass?.id
      );
      toast.success(t("classes.userRemoved"));
      if (selectedClass) {
        const roster = await getClassAssignmentsData(selectedClass.id);
        setClassRoster(roster as Assignment[]);
      }
      setRemoveUserConfirm({ open: false, assignmentId: null });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error(t("classes.removeFailed"));
    }
  }

  function handleDelete(cls: Class) {
    setDeleteConfirm({ open: true, classItem: cls });
  }

  async function confirmDelete() {
    if (!deleteConfirm.classItem) return;

    try {
      await deleteClassAction(deleteConfirm.classItem.id);
      toast.success(t("classes.classDeleted"));
      setDeleteConfirm({ open: false, classItem: null });
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

  // Combined sort key for mobile dropdown
  const currentSortKey = `${sortColumn}-${sortDirection}`;

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  function handleMobileSortChange(sortKey: string) {
    const [col, dir] = sortKey.split("-") as [SortColumn, SortDirection];
    setSortColumn(col);
    setSortDirection(dir);
  }

  const sortOptions: SortOption[] = [
    { key: "name-asc", label: t("common.name") + " (A-Z)", direction: "asc" },
    { key: "name-desc", label: t("common.name") + " (Z-A)", direction: "desc" },
    {
      key: "church-asc",
      label: t("classes.church") + " (A-Z)",
      direction: "asc",
    },
    {
      key: "church-desc",
      label: t("classes.church") + " (Z-A)",
      direction: "desc",
    },
    {
      key: "studentCount-asc",
      label: t("classes.students") + " ↑",
      direction: "asc",
    },
    {
      key: "studentCount-desc",
      label: t("classes.students") + " ↓",
      direction: "desc",
    },
  ];

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ms-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ms-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ms-1" />
    );
  }

  const filteredChurches =
    selectedDioceseFilter === "all"
      ? churches
      : churches.filter((c) => c.diocese_id === selectedDioceseFilter);

  // Calculate active filter count
  const activeFilterCount = [
    selectedDioceseFilter !== "all",
    selectedChurchFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSelectedDioceseFilter("all");
    setSelectedChurchFilter("all");
  }

  const filteredClasses = initialClasses
    .filter((cls) => {
      if (
        selectedChurchFilter !== "all" &&
        cls.church_id !== selectedChurchFilter
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "church") {
        comparison = getChurchName(a.church_id).localeCompare(
          getChurchName(b.church_id)
        );
      } else if (sortColumn === "gradeLevel") {
        comparison = (a.grade_level || "").localeCompare(b.grade_level || "");
      } else if (sortColumn === "studentCount") {
        comparison = a.studentCount - b.studentCount;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Pagination
  const {
    paginatedData: paginatedClasses,
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
  } = usePagination({
    data: filteredClasses,
    initialPageSize: 20,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("classes.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("classes.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="me-2 h-4 w-4" />
          {t("classes.addClass")}
        </Button>
      </div>

      {/* Filters - Responsive: inline on desktop, sheet on mobile */}
      <ResponsiveFilters
        title={t("common.filters")}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        clearText={t("common.clearAll")}
        className="mb-0"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label>{t("classes.diocese")}</Label>
            <SearchableSelect
              value={selectedDioceseFilter}
              onValueChange={setSelectedDioceseFilter}
              options={dioceses.map((diocese) => ({
                value: diocese.id,
                label: diocese.name,
              }))}
              placeholder={t("classes.allDioceses")}
              searchPlaceholder={t("common.search")}
              emptyText={t("common.noResults")}
              sheetTitle={t("classes.diocese")}
              showClearOption
              clearOptionLabel={t("classes.allDioceses")}
              clearOptionValue="all"
            />
          </div>

          <div className="flex-1 min-w-[200px] space-y-1">
            <Label>{t("classes.church")}</Label>
            <SearchableSelect
              value={selectedChurchFilter}
              onValueChange={setSelectedChurchFilter}
              options={filteredChurches.map((church) => ({
                value: church.id,
                label: church.name,
              }))}
              placeholder={t("classes.allChurches")}
              searchPlaceholder={t("common.search")}
              emptyText={t("common.noResults")}
              sheetTitle={t("classes.church")}
              showClearOption
              clearOptionLabel={t("classes.allChurches")}
              clearOptionValue="all"
            />
          </div>
        </div>
      </ResponsiveFilters>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("classes.allClasses")}</CardTitle>
          <CardDescription>
            {t("classes.allClassesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={paginatedClasses}
            columns={[
              {
                key: "name",
                header: (
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    {t("common.name")}
                    <SortIcon column="name" />
                  </button>
                ),
                mobileLabel: t("common.name"),
                cell: (cls) => cls.name,
                isTitle: true,
              },
              {
                key: "church",
                header: (
                  <button
                    onClick={() => handleSort("church")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    {t("classes.church")}
                    <SortIcon column="church" />
                  </button>
                ),
                mobileLabel: t("classes.church"),
                cell: (cls) => getChurchName(cls.church_id),
                isSubtitle: true,
              },
              {
                key: "gradeLevel",
                header: (
                  <button
                    onClick={() => handleSort("gradeLevel")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    {t("classes.gradeLevel")}
                    <SortIcon column="gradeLevel" />
                  </button>
                ),
                mobileLabel: t("classes.gradeLevel"),
                cell: (cls) => cls.grade_level || "-",
              },
              {
                key: "academicYear",
                header: t("classes.academicYear"),
                mobileLabel: t("classes.academicYear"),
                cell: (cls) => cls.academic_year || "-",
                showOnMobile: false,
              },
              {
                key: "schedule",
                header: t("classes.schedule"),
                mobileLabel: t("classes.schedule"),
                cell: (cls) => cls.schedule || "-",
                showOnMobile: false,
              },
              {
                key: "studentCount",
                header: (
                  <button
                    onClick={() => handleSort("studentCount")}
                    className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                  >
                    {t("classes.students")}
                    <SortIcon column="studentCount" />
                  </button>
                ),
                mobileLabel: t("classes.students"),
                cell: (cls) => `${cls.studentCount}/${cls.capacity || "-"}`,
                headerClassName: "text-center",
                cellClassName: "text-center",
              },
              {
                key: "status",
                header: t("common.status"),
                mobileLabel: t("common.status"),
                cell: (cls) => (
                  <Badge variant={cls.is_active ? "default" : "secondary"}>
                    {cls.is_active ? t("common.active") : t("common.inactive")}
                  </Badge>
                ),
                headerClassName: "text-center",
                cellClassName: "text-center",
              },
            ]}
            getRowKey={(cls) => cls.id}
            onRowClick={(cls) => router.push(`/admin/classes/${cls.id}`)}
            renderActions={(cls) => (
              <div className="flex justify-end gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRoster(cls);
                  }}
                  title={t("classes.viewRoster")}
                  aria-label={t("classes.viewRoster")}
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
                  aria-label={t("classes.assignStudent")}
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
                  aria-label={t("classes.assignTeacher")}
                  className="text-green-600 hover:text-green-700 hidden sm:flex"
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
                  title={t("common.edit")}
                  aria-label={t("common.edit")}
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
                  title={t("common.delete")}
                  aria-label={t("common.delete")}
                  className="hidden sm:flex"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
            emptyState={
              <EmptyState
                icon={GraduationCap}
                title={t("classes.noClasses")}
                description={t("classes.noClassesDescription")}
                action={{
                  label: t("classes.addClass"),
                  onClick: () => handleOpenDialog(),
                }}
              />
            }
            sortOptions={sortOptions}
            currentSort={currentSortKey}
            onSortChange={handleMobileSortChange}
            sortLabel={t("common.sortBy")}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageSizeChange={onPageSizeChange}
              showPageSize
              showItemCount
              labels={{
                previous: t("common.previous"),
                next: t("common.next"),
                page: t("common.page"),
                of: t("common.of"),
                items: t("classes.classes"),
                itemsPerPage: t("common.perPage"),
              }}
              className="mt-4"
            />
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
                <SearchableSelect
                  value={formData.church_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, church_id: value })
                  }
                  disabled={isSubmitting}
                  options={churches.map((church) => ({
                    value: church.id,
                    label: church.name,
                  }))}
                  placeholder={t("classes.selectChurch")}
                  searchPlaceholder={t("common.search")}
                  emptyText={t("common.noResults")}
                  sheetTitle={t("classes.church")}
                />
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <OptimizedAvatar
                          src={user.avatar_url}
                          alt={user.full_name || user.email || ""}
                          fallback={getInitials(user.full_name || user.email)}
                          size="lg"
                          fallbackClassName="bg-primary/10"
                        />
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
                  <Plus className="h-3 w-3 me-1" />
                  {t("classes.addTeacher")}
                </Button>
              </div>
              <div className="border rounded-lg divide-y">
                {classRoster.filter((r) => r.assignment_type === "teacher")
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    {t("classes.noTeachers")}
                  </p>
                ) : (
                  classRoster
                    .filter((r) => r.assignment_type === "teacher")
                    .map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="text-sm truncate flex-1">
                          {assignment.user?.full_name || assignment.user?.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(assignment.id)}
                          title={t("common.remove")}
                          aria-label={t("common.remove")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
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
                  <Plus className="h-3 w-3 me-1" />
                  {t("classes.addStudent")}
                </Button>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto divide-y">
                {classRoster.filter((r) => r.assignment_type === "student")
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    {t("classes.noStudents")}
                  </p>
                ) : (
                  classRoster
                    .filter((r) => r.assignment_type === "student")
                    .map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="text-sm truncate flex-1">
                          {assignment.user?.full_name || assignment.user?.email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(assignment.id)}
                          title={t("common.remove")}
                          aria-label={t("common.remove")}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
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

      {/* Delete Class Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm({
            open,
            classItem: open ? deleteConfirm.classItem : null,
          })
        }
        title={t("classes.deleteClassTitle")}
        description={t("classes.deleteConfirm", {
          name: deleteConfirm.classItem?.name ?? "",
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Remove User Confirmation Dialog */}
      <ConfirmDialog
        open={removeUserConfirm.open}
        onOpenChange={(open) =>
          setRemoveUserConfirm({
            open,
            assignmentId: open ? removeUserConfirm.assignmentId : null,
          })
        }
        title={t("classes.removeUserTitle")}
        description={t("classes.removeUserConfirm")}
        confirmText={t("common.remove")}
        cancelText={t("common.cancel")}
        onConfirm={confirmRemoveUser}
        variant="destructive"
      />
    </div>
  );
}

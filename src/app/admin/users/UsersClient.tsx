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
import { ResponsiveTable } from "@/components/ui/responsive-table";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pencil,
  UserPlus,
  Link as LinkIcon,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveFilters } from "@/components/ui/filter-sheet";
import type {
  ExtendedUser,
  UserRole,
  Church,
  Diocese,
} from "@/lib/types/sunday-school";
import {
  updateUserRoleAction,
  activateUserAction,
  deactivateUserAction,
  linkParentToStudentAction,
  createUserAction,
} from "./actions";

interface UsersClientProps {
  initialUsers: ExtendedUser[];
  churches: Church[];
  dioceses: Diocese[];
}

export default function UsersClient({
  initialUsers,
  churches,
  dioceses,
}: UsersClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [, startTransition] = useTransition();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [churchFilter, setChurchFilter] = useState<string>("all");
  const [dioceseFilter, setDioceseFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Role assignment form
  const [roleFormData, setRoleFormData] = useState({
    role: "" as UserRole,
    diocese_id: "",
    church_id: "",
  });

  // Create user form
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    role: "student" as UserRole,
    username: "",
    full_name: "",
    diocese_id: "",
    church_id: "",
  });

  // Parent-student linking
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const parents = initialUsers.filter((u) => u.role === "parent");
  const students = initialUsers.filter((u) => u.role === "student");

  function handleOpenRoleDialog(user: ExtendedUser) {
    setSelectedUser(user);
    setRoleFormData({
      role: user.role,
      diocese_id: user.diocese_id || "",
      church_id: user.church_id || "",
    });
    setIsRoleDialogOpen(true);
  }

  function handleOpenLinkDialog() {
    setSelectedParentId("");
    setSelectedStudentId("");
    setIsLinkDialogOpen(true);
  }

  async function handleUpdateRole() {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await updateUserRoleAction(
        selectedUser.id,
        roleFormData.role,
        roleFormData.diocese_id || null,
        roleFormData.church_id || null
      );
      toast.success(t("users.userUpdated"));
      setIsRoleDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error(t("users.updateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLinkParentToStudent() {
    if (!selectedParentId || !selectedStudentId) {
      toast.error(t("users.linkFailed"));
      return;
    }

    setIsSubmitting(true);
    try {
      await linkParentToStudentAction(selectedParentId, selectedStudentId);
      toast.success(t("users.parentLinked"));
      setIsLinkDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error linking parent to student:", error);
      toast.error(t("users.linkFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(user: ExtendedUser) {
    try {
      if (user.is_active) {
        await deactivateUserAction(user.id);
        toast.success(t("users.userDeactivated"));
      } else {
        await activateUserAction(user.id);
        toast.success(t("users.userActivated"));
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      toast.error(t("users.updateFailed"));
    }
  }

  function handleOpenCreateDialog() {
    setCreateFormData({
      email: "",
      password: "",
      role: "student",
      username: "",
      full_name: "",
      diocese_id: "",
      church_id: "",
    });
    setIsCreateDialogOpen(true);
  }

  async function handleCreateUser() {
    if (
      !createFormData.email ||
      !createFormData.password ||
      !createFormData.role
    ) {
      toast.error(t("errors.invalidInput"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserAction({
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        username: createFormData.username || undefined,
        full_name: createFormData.full_name || undefined,
        church_id: createFormData.church_id || undefined,
        diocese_id: createFormData.diocese_id || undefined,
      });
      toast.success(t("users.userCreated"));
      setIsCreateDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        error instanceof Error ? error.message : t("users.createFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function getDioceseName(dioceseId: string | null): string {
    if (!dioceseId) return "-";
    return dioceses.find((d) => d.id === dioceseId)?.name || "-";
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return "-";
    return churches.find((c) => c.id === churchId)?.name || "-";
  }

  // Apply filters
  const filteredUsers = initialUsers.filter((user) => {
    // Role filter
    if (roleFilter !== "all" && user.role !== roleFilter) return false;

    // Church filter
    if (churchFilter !== "all" && user.church_id !== churchFilter) return false;

    // Diocese filter
    if (dioceseFilter !== "all" && user.diocese_id !== dioceseFilter)
      return false;

    // Search query (name, email, username, phone, or user_code)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.user_code?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group users by role
  const usersByRole = filteredUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<UserRole, ExtendedUser[]>);

  // Define role order for display
  const roleOrder: UserRole[] = [
    "super_admin",
    "diocese_admin",
    "church_admin",
    "teacher",
    "parent",
    "student",
  ];
  const sortedRoles = roleOrder.filter((role) => usersByRole[role]?.length > 0);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "diocese_admin":
        return "default";
      case "church_admin":
        return "secondary";
      case "teacher":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Update filters and refresh
  const handleFilterChange = (
    filterType: "role" | "church" | "diocese",
    value: string
  ) => {
    if (filterType === "role") setRoleFilter(value);
    if (filterType === "church") setChurchFilter(value);
    if (filterType === "diocese") setDioceseFilter(value);
  };

  // Calculate active filter count (excluding search)
  const activeFilterCount = [
    roleFilter !== "all",
    churchFilter !== "all",
    dioceseFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setRoleFilter("all");
    setChurchFilter("all");
    setDioceseFilter("all");
    setSearchQuery("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("users.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("users.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleOpenLinkDialog}
            className="w-full sm:w-auto"
          >
            <LinkIcon className="me-2 h-4 w-4" />
            {t("users.linkParent")}
          </Button>
          <Button onClick={handleOpenCreateDialog} className="w-full sm:w-auto">
            <UserPlus className="me-2 h-4 w-4" />
            {t("users.createUser")}
          </Button>
        </div>
      </div>

      {/* Filters - Responsive: inline on desktop, sheet on mobile */}
      <ResponsiveFilters
        title={t("common.filters")}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        clearText={t("common.clearAll")}
      >
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>{t("common.search")}</Label>
            <Input
              placeholder={t("users.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("users.role")}</Label>
            <Select
              value={roleFilter}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.filterByRole")}</SelectItem>
                <SelectItem value="super_admin">
                  {t("roles.super_admin")}
                </SelectItem>
                <SelectItem value="diocese_admin">
                  {t("roles.diocese_admin")}
                </SelectItem>
                <SelectItem value="church_admin">
                  {t("roles.church_admin")}
                </SelectItem>
                <SelectItem value="teacher">{t("roles.teacher")}</SelectItem>
                <SelectItem value="parent">{t("roles.parent")}</SelectItem>
                <SelectItem value="student">{t("roles.student")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("users.diocese")}</Label>
            <Select
              value={dioceseFilter}
              onValueChange={(value) => handleFilterChange("diocese", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("users.filterByDiocese")}
                </SelectItem>
                {dioceses.map((diocese) => (
                  <SelectItem key={diocese.id} value={diocese.id}>
                    {diocese.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("users.church")}</Label>
            <Select
              value={churchFilter}
              onValueChange={(value) => handleFilterChange("church", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.filterByChurch")}</SelectItem>
                {churches.map((church) => (
                  <SelectItem key={church.id} value={church.id}>
                    {church.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ResponsiveFilters>

      {/* Users by Role */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Users}
              title={t("users.noUsers")}
              description={t("users.noUsersDescription")}
              action={{
                label: t("users.createUser"),
                onClick: handleOpenCreateDialog,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Accordion
              type="multiple"
              defaultValue={sortedRoles}
              className="w-full"
            >
              {sortedRoles.map((role) => {
                const usersInRole = usersByRole[role];
                return (
                  <AccordionItem key={role} value={role}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={getRoleBadgeVariant(role)}
                          className="text-base px-3 py-1"
                        >
                          {t(`roles.${role}`)}
                        </Badge>
                        <span className="text-muted-foreground">
                          ({usersInRole.length}{" "}
                          {usersInRole.length === 1 ? "user" : "users"})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ResponsiveTable
                        data={usersInRole}
                        columns={[
                          {
                            key: "user_code",
                            header: t("users.userCode"),
                            mobileLabel: t("users.userCode"),
                            cell: (user) => (
                              <span className="font-mono text-sm">
                                {user.user_code || "-"}
                              </span>
                            ),
                            showOnMobile: false,
                          },
                          {
                            key: "name",
                            header: t("common.name"),
                            mobileLabel: t("common.name"),
                            cell: (user) =>
                              user.full_name || user.username || "-",
                            isTitle: true,
                          },
                          {
                            key: "email",
                            header: t("common.email"),
                            mobileLabel: t("common.email"),
                            cell: (user) => (
                              <span className="truncate">{user.email}</span>
                            ),
                            isSubtitle: true,
                          },
                          {
                            key: "diocese",
                            header: t("users.diocese"),
                            mobileLabel: t("users.diocese"),
                            cell: (user) => getDioceseName(user.diocese_id),
                            showOnMobile: false,
                          },
                          {
                            key: "church",
                            header: t("users.church"),
                            mobileLabel: t("users.church"),
                            cell: (user) => getChurchName(user.church_id),
                          },
                          {
                            key: "status",
                            header: t("common.status"),
                            mobileLabel: t("common.status"),
                            cell: (user) => (
                              <Badge
                                variant={
                                  user.is_active ? "default" : "secondary"
                                }
                              >
                                {user.is_active
                                  ? t("common.active")
                                  : t("common.inactive")}
                              </Badge>
                            ),
                            headerClassName: "text-center",
                            cellClassName: "text-center",
                          },
                        ]}
                        getRowKey={(user) => user.id}
                        onRowClick={(user) =>
                          router.push(`/admin/users/${user.id}`)
                        }
                        renderActions={(user) => (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(user)}
                              aria-label={t("users.editUser")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              aria-label={
                                user.is_active
                                  ? t("users.deactivateUser")
                                  : t("users.activateUser")
                              }
                            >
                              {user.is_active ? (
                                <UserX className="h-4 w-4 text-destructive" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
            <DialogDescription>
              {t("users.subtitle")}:{" "}
              {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("users.role")} *</Label>
              <Select
                value={roleFormData.role}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, role: value as UserRole })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    {t("roles.super_admin")}
                  </SelectItem>
                  <SelectItem value="diocese_admin">
                    {t("roles.diocese_admin")}
                  </SelectItem>
                  <SelectItem value="church_admin">
                    {t("roles.church_admin")}
                  </SelectItem>
                  <SelectItem value="teacher">{t("roles.teacher")}</SelectItem>
                  <SelectItem value="parent">{t("roles.parent")}</SelectItem>
                  <SelectItem value="student">{t("roles.student")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roleFormData.role === "diocese_admin" && (
              <div className="space-y-2">
                <Label>{t("users.diocese")}</Label>
                <Select
                  value={roleFormData.diocese_id}
                  onValueChange={(value) =>
                    setRoleFormData({ ...roleFormData, diocese_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("users.selectDiocese")} />
                  </SelectTrigger>
                  <SelectContent>
                    {dioceses.map((diocese) => (
                      <SelectItem key={diocese.id} value={diocese.id}>
                        {diocese.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {["church_admin", "teacher", "parent", "student"].includes(
              roleFormData.role
            ) && (
              <div className="space-y-2">
                <Label>{t("users.church")}</Label>
                <Select
                  value={roleFormData.church_id}
                  onValueChange={(value) =>
                    setRoleFormData({ ...roleFormData, church_id: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("users.selectChurch")} />
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
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUpdateRole} disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("users.createUser")}</DialogTitle>
            <DialogDescription>{t("users.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.email")} *</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      password: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="john_doe"
                  value={createFormData.username}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      username: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("users.fullName")}</Label>
                <Input
                  placeholder="John Doe"
                  value={createFormData.full_name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      full_name: e.target.value,
                    })
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("users.role")} *</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value) =>
                  setCreateFormData({
                    ...createFormData,
                    role: value as UserRole,
                  })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{t("roles.student")}</SelectItem>
                  <SelectItem value="parent">{t("roles.parent")}</SelectItem>
                  <SelectItem value="teacher">{t("roles.teacher")}</SelectItem>
                  <SelectItem value="church_admin">
                    {t("roles.church_admin")}
                  </SelectItem>
                  <SelectItem value="diocese_admin">
                    {t("roles.diocese_admin")}
                  </SelectItem>
                  <SelectItem value="super_admin">
                    {t("roles.super_admin")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("users.optionalDiocese")}</Label>
                <Select
                  value={createFormData.diocese_id || "none"}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      diocese_id: value === "none" ? "" : value,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("users.selectDiocese")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {dioceses.map((diocese) => (
                      <SelectItem key={diocese.id} value={diocese.id}>
                        {diocese.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("users.optionalChurch")}</Label>
                <Select
                  value={createFormData.church_id || "none"}
                  onValueChange={(value) =>
                    setCreateFormData({
                      ...createFormData,
                      church_id: value === "none" ? "" : value,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("users.selectChurch")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {churches
                      .filter(
                        (c) =>
                          !createFormData.diocese_id ||
                          c.diocese_id === createFormData.diocese_id
                      )
                      .map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateUser} disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("users.createUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Parent to Student Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.linkParent")}</DialogTitle>
            <DialogDescription>{t("users.subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t("roles.parent")} *</Label>
              <Select
                value={selectedParentId}
                onValueChange={setSelectedParentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("users.selectParent")} />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.full_name || parent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("roles.student")} *</Label>
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("users.selectStudent")} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleLinkParentToStudent} disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("users.linkParent")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Mail,
  Phone,
  Building2,
  Users,
  GraduationCap,
} from "lucide-react";
import type {
  Diocese,
  Church,
  DioceseAdmin,
  ExtendedUser,
} from "@/lib/types/sunday-school";
import ImageUpload from "@/components/ImageUpload";
import ColorPicker from "@/components/ColorPicker";
import { updateDiocese } from "../actions";
import { toast } from "sonner";

interface DioceseDetailsClientProps {
  diocese: Diocese;
  churches: Church[];
  dioceseAdmins: (DioceseAdmin & {
    user: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  })[];
  users: ExtendedUser[];
  isSuperAdmin: boolean;
  isDioceseAdmin: boolean;
}

type TabType = "info" | "churches" | "admins" | "users";

export function DioceseDetailsClient({
  diocese: initialDiocese,
  churches,
  dioceseAdmins,
  users,
  isSuperAdmin,
  isDioceseAdmin,
}: DioceseDetailsClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [diocese, setDiocese] = useState(initialDiocese);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isSuperAdmin || isDioceseAdmin;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDiocese(diocese.id, {
        name: diocese.name,
        description: diocese.description,
        location: diocese.location,
        contact_email: diocese.contact_email,
        contact_phone: diocese.contact_phone,
        cover_image_url: diocese.cover_image_url,
        logo_image_url: diocese.logo_image_url,
        theme_primary_color: diocese.theme_primary_color,
        theme_secondary_color: diocese.theme_secondary_color,
        theme_accent_color: diocese.theme_accent_color,
        theme_settings: diocese.theme_settings,
      });
      toast.success(t("dioceses.dioceseUpdated"));
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating diocese:", error);
      toast.error(t("dioceses.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-2 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dioceses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{diocese.name}</h1>
            <p className="text-muted-foreground">{t("dioceses.subtitle")}</p>
          </div>
        </div>
        {canEdit && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("common.edit")}
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      {/* Cover Image */}
      {(diocese.cover_image_url || isEditing) && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
          {diocese.cover_image_url && (
            <img
              src={diocese.cover_image_url}
              alt={diocese.name}
              className="w-full h-full object-cover"
            />
          )}
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <ImageUpload
                label=""
                currentImageUrl={diocese.cover_image_url}
                onImageUploaded={(url) =>
                  setDiocese({ ...diocese, cover_image_url: url })
                }
                bucket="images"
                folder="dioceses/covers"
                className="text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6">
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("info")}
          >
            {t("dioceses.title")} {t("common.name")}
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "churches"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("churches")}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            {t("dioceses.churches")} ({churches.length})
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "admins"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("admins")}
          >
            <Users className="h-4 w-4 inline mr-2" />
            {t("dioceses.manageAdmins")} ({dioceseAdmins.length})
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("users")}
          >
            <GraduationCap className="h-4 w-4 inline mr-2" />
            {t("classes.teachers")} & {t("classes.students")} ({users.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dioceses.title")} Information</CardTitle>
              <CardDescription>
                {t("dioceses.updateDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              {(isEditing || diocese.logo_image_url) && (
                <ImageUpload
                  label={t("dioceses.title") + " Logo"}
                  currentImageUrl={diocese.logo_image_url}
                  onImageUploaded={(url) =>
                    setDiocese({ ...diocese, logo_image_url: url })
                  }
                  bucket="images"
                  folder="dioceses/logos"
                  aspectRatio="square"
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("common.name")}</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={diocese.name}
                      onChange={(e) =>
                        setDiocese({ ...diocese, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p className="text-lg">{diocese.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("dioceses.location")}
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={diocese.location || ""}
                      onChange={(e) =>
                        setDiocese({ ...diocese, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p>{diocese.location || "-"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("dioceses.contactEmail")}
                  </p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={diocese.contact_email || ""}
                      onChange={(e) =>
                        setDiocese({
                          ...diocese,
                          contact_email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p>{diocese.contact_email || "-"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("dioceses.contactPhone")}
                  </p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={diocese.contact_phone || ""}
                      onChange={(e) =>
                        setDiocese({
                          ...diocese,
                          contact_phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  ) : (
                    <p>{diocese.contact_phone || "-"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">{t("common.description")}</p>
                {isEditing ? (
                  <textarea
                    value={diocese.description || ""}
                    onChange={(e) =>
                      setDiocese({ ...diocese, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                ) : (
                  <p>{diocese.description || "-"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Theme Customization (Super Admin Only) */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize the color scheme for this diocese
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <ColorPicker
                      label="Primary Color"
                      value={diocese.theme_primary_color || "#3b82f6"}
                      onChange={(color) =>
                        setDiocese({ ...diocese, theme_primary_color: color })
                      }
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={diocese.theme_secondary_color || "#8b5cf6"}
                      onChange={(color) =>
                        setDiocese({ ...diocese, theme_secondary_color: color })
                      }
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={diocese.theme_accent_color || "#ec4899"}
                      onChange={(color) =>
                        setDiocese({ ...diocese, theme_accent_color: color })
                      }
                    />
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Primary</p>
                      <div
                        className="w-16 h-16 rounded border-2"
                        style={{
                          backgroundColor:
                            diocese.theme_primary_color || "#3b82f6",
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Secondary</p>
                      <div
                        className="w-16 h-16 rounded border-2"
                        style={{
                          backgroundColor:
                            diocese.theme_secondary_color || "#8b5cf6",
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Accent</p>
                      <div
                        className="w-16 h-16 rounded border-2"
                        style={{
                          backgroundColor:
                            diocese.theme_accent_color || "#ec4899",
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "churches" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("dioceses.churches")}</CardTitle>
                <CardDescription>Churches in this diocese</CardDescription>
              </div>
              {canEdit && (
                <Button asChild>
                  <Link href={`/admin/churches?diocese=${diocese.id}`}>
                    {t("churches.addChurch")}
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {churches.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t("churches.noChurches")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("churches.city")}</TableHead>
                    <TableHead>{t("churches.contact")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {churches.map((church) => (
                    <TableRow key={church.id}>
                      <TableCell className="font-medium">
                        {church.name}
                      </TableCell>
                      <TableCell>{church.city || "-"}</TableCell>
                      <TableCell>
                        {church.contact_email && (
                          <a
                            href={`mailto:${church.contact_email}`}
                            className="text-primary hover:underline"
                          >
                            {church.contact_email}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/churches?id=${church.id}`}>
                            {t("common.edit")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "admins" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dioceses.manageAdmins")}</CardTitle>
            <CardDescription>
              Users with admin access to this diocese
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dioceseAdmins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No diocese admins assigned
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.fullName")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dioceseAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.user.full_name}
                      </TableCell>
                      <TableCell>{admin.user.email}</TableCell>
                      <TableCell>
                        {new Date(admin.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={admin.is_active ? "default" : "secondary"}
                        >
                          {admin.is_active
                            ? t("common.active")
                            : t("common.inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "users" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Teachers */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("classes.teachers")} ({teachers.length})
              </CardTitle>
              <CardDescription>
                All teachers in this diocese's churches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("classes.noTeachers")}
                </p>
              ) : (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{teacher.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.email}
                        </p>
                      </div>
                      <Badge variant="outline">{t("roles.teacher")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("classes.students")} ({students.length})
              </CardTitle>
              <CardDescription>
                All students in this diocese's churches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t("classes.noStudents")}
                </p>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      <Badge variant="outline">{t("roles.student")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

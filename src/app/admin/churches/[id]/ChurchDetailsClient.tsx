"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveBreadcrumb } from "@/components/ui/responsive-breadcrumb";
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
  GraduationCap,
  Loader2,
} from "lucide-react";
import type {
  Church,
  Class,
  UserWithClassAssignments,
  Diocese,
} from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { updateChurchAction } from "../actions";
import { toast } from "sonner";

interface ChurchDetailsClientProps {
  church: Church;
  diocese: Diocese | null;
  classes: Class[];
  users: UserWithClassAssignments[];
  isSuperAdmin: boolean;
  isChurchAdmin: boolean;
}

export function ChurchDetailsClient({
  church: initialChurch,
  diocese,
  classes,
  users,
  isSuperAdmin,
  isChurchAdmin,
}: ChurchDetailsClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [church, setChurch] = useState(initialChurch);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isSuperAdmin || isChurchAdmin;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateChurchAction(church.id, {
        name: church.name,
        description: church.description ?? undefined,
        address: church.address ?? undefined,
        city: church.city ?? undefined,
        contact_email: church.contact_email ?? undefined,
        contact_phone: church.contact_phone ?? undefined,
        cover_image_url: church.cover_image_url ?? undefined,
        logo_image_url: church.logo_image_url ?? undefined,
        diocese_id: church.diocese_id || "",
      });
      toast.success(t("churches.churchUpdated"));
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating church:", error);
      toast.error(t("churches.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-2 lg:px-6">
      {/* Breadcrumb Navigation */}
      <ResponsiveBreadcrumb
        items={[
          { label: t("nav.dashboard"), href: "/admin" },
          { label: t("churches.title"), href: "/admin/churches" },
          { label: church.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/churches">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{church.name}</h1>
            <p className="text-muted-foreground">{t("churches.subtitle")}</p>
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
              {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isSaving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </div>

      {/* Cover Image */}
      {(church.cover_image_url || isEditing) && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600">
          {church.cover_image_url && (
            <Image
              src={church.cover_image_url}
              alt={church.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
            />
          )}
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <ImageUpload
                label=""
                currentImageUrl={church.cover_image_url}
                onImageUploaded={(url) =>
                  setChurch({ ...church, cover_image_url: url })
                }
                bucket="images"
                folder="churches/covers"
                className="text-white"
              />
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">
            {t("churches.title")} {t("common.name")}
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Building2 className="h-4 w-4 me-2" />
            {t("churches.classes")} ({classes.length})
          </TabsTrigger>
          <TabsTrigger value="users">
            <GraduationCap className="h-4 w-4 me-2" />
            {t("classes.teachers")} & {t("classes.students")} ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("churches.title")} Information</CardTitle>
              <CardDescription>
                {t("churches.updateDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              {(isEditing || church.logo_image_url) && (
                <ImageUpload
                  label={t("churches.title") + " Logo"}
                  currentImageUrl={church.logo_image_url}
                  onImageUploaded={(url) =>
                    setChurch({ ...church, logo_image_url: url })
                  }
                  bucket="images"
                  folder="churches/logos"
                  aspectRatio="square"
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("common.name")}</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={church.name}
                      onChange={(e) =>
                        setChurch({ ...church, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg">{church.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("churches.diocese")}</p>
                  <p className="text-lg">{diocese?.name || "-"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("churches.city")}</p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={church.city || ""}
                      onChange={(e) =>
                        setChurch({ ...church, city: e.target.value })
                      }
                    />
                  ) : (
                    <p>{church.city || "-"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("churches.address")}
                  </p>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={church.address || ""}
                      onChange={(e) =>
                        setChurch({ ...church, address: e.target.value })
                      }
                    />
                  ) : (
                    <p>{church.address || "-"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("churches.contactEmail")}
                  </p>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={church.contact_email || ""}
                      onChange={(e) =>
                        setChurch({
                          ...church,
                          contact_email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{church.contact_email || "-"}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("churches.contactPhone")}
                  </p>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={church.contact_phone || ""}
                      onChange={(e) =>
                        setChurch({
                          ...church,
                          contact_phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{church.contact_phone || "-"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">{t("common.description")}</p>
                {isEditing ? (
                  <Textarea
                    value={church.description || ""}
                    onChange={(e) =>
                      setChurch({ ...church, description: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <p>{church.description || "-"}</p>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("churches.classes")}</CardTitle>
                  <CardDescription>{t("churches.classesInChurch") || "Classes in this church"}</CardDescription>
                </div>
              {canEdit && (
                <Button asChild>
                  <Link href={`/admin/classes?church=${church.id}`}>
                    {t("classes.addClass")}
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t("classes.noClasses")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("classes.gradeLevel")}</TableHead>
                    <TableHead>{t("classes.schedule")}</TableHead>
                    <TableHead className="text-right">
                      {t("classes.capacity")}
                    </TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">
                        {classItem.name}
                      </TableCell>
                      <TableCell>{classItem.grade_level || "-"}</TableCell>
                      <TableCell>{classItem.schedule || "-"}</TableCell>
                      <TableCell className="text-right">
                        {classItem.capacity || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            classItem.is_active ? "default" : "secondary"
                          }
                        >
                          {classItem.is_active
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
        </TabsContent>

        <TabsContent value="users">
          <div className="grid gap-6 md:grid-cols-2">
          {/* Teachers */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("classes.teachers")} ({teachers.length})
              </CardTitle>
              <CardDescription>
                {t("churches.allTeachersDescription")}
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
                      className="flex flex-col gap-2 p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{teacher.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {teacher.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {teacher.classAssignments
                              ?.map(
                                (a) => a.assignment_type + " of " + a.class_name
                              )
                              .join(", ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {teacher.role}
                          </p>
                        </div>
                        <Badge variant="outline">{t("roles.teacher")}</Badge>
                      </div>
                      {teacher.classAssignments &&
                        teacher.classAssignments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacher.classAssignments.map((assignment) => (
                              <Badge
                                key={assignment.class_id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {assignment.class_name}
                              </Badge>
                            ))}
                          </div>
                        )}
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
                All students in this church&apos;s classes
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
                      className="flex flex-col gap-2 p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                        <Badge variant="outline">{t("roles.student")}</Badge>
                      </div>
                      {student.classAssignments &&
                        student.classAssignments.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.classAssignments.map((assignment) => (
                              <Badge
                                key={assignment.class_id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {assignment.class_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

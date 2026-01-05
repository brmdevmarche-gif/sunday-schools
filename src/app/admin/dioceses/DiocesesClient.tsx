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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, ChevronRight } from "lucide-react";
import type { Diocese, CreateDioceseInput } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import {
  createDioceseAction,
  updateDioceseAction,
  deleteDioceseAction,
} from "./actions";
import { DioceseAdminList } from "@/components/admin/DioceseAdminList";
import { AssignDioceseAdminDialog } from "@/components/admin/AssignDioceseAdminDialog";

interface DioceseWithCount extends Diocese {
  churchCount: number;
}

interface DiocesesClientProps {
  initialDioceses: DioceseWithCount[];
}

export default function DiocesesClient({
  initialDioceses,
}: DiocesesClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDiocese, setEditingDiocese] = useState<Diocese | null>(null);
  const [selectedDioceseId, setSelectedDioceseId] = useState<string | null>(
    null
  );
  const [isAssignAdminOpen, setIsAssignAdminOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDioceseInput>({
    name: "",
    description: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    cover_image_url: "",
    logo_image_url: "",
  });

  function handleOpenDialog(diocese?: Diocese) {
    if (diocese) {
      setEditingDiocese(diocese);
      setFormData({
        name: diocese.name,
        description: diocese.description || "",
        location: diocese.location || "",
        contact_email: diocese.contact_email || "",
        contact_phone: diocese.contact_phone || "",
        cover_image_url: diocese.cover_image_url || "",
        logo_image_url: diocese.logo_image_url || "",
      });
    } else {
      setEditingDiocese(null);
      setFormData({
        name: "",
        description: "",
        location: "",
        contact_email: "",
        contact_phone: "",
        cover_image_url: "",
        logo_image_url: "",
      });
    }
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingDiocese) {
        await updateDioceseAction(editingDiocese.id, formData);
        toast.success(t("dioceses.dioceseUpdated"));
      } else {
        await createDioceseAction(formData);
        toast.success(t("dioceses.dioceseCreated"));
      }

      setIsDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error saving diocese:", error);
      toast.error(
        editingDiocese ? t("dioceses.updateFailed") : t("dioceses.createFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(diocese: Diocese) {
    if (!confirm(t("dioceses.deleteConfirm", { name: diocese.name }))) {
      return;
    }

    try {
      await deleteDioceseAction(diocese.id);
      toast.success(t("dioceses.dioceseDeleted"));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error deleting diocese:", error);
      toast.error(t("dioceses.deleteFailed"));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dioceses.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("dioceses.subtitle")}</p>
        </div>
        {!selectedDioceseId && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("dioceses.addDiocese")}
          </Button>
        )}
      </div>

      {/* Dioceses Table */}
      {!selectedDioceseId && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dioceses.allDioceses")}</CardTitle>
            <CardDescription>
              {t("dioceses.allDiocesesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialDioceses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t("dioceses.noDioceses")}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("dioceses.location")}</TableHead>
                    <TableHead>{t("dioceses.contact")}</TableHead>
                    <TableHead className="text-right">
                      {t("dioceses.churches")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialDioceses.map((diocese) => (
                    <TableRow
                      key={diocese.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        router.push(`/admin/dioceses/${diocese.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {diocese.name}
                      </TableCell>
                      <TableCell>{diocese.location || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {diocese.contact_email && (
                            <div>{diocese.contact_email}</div>
                          )}
                          {diocese.contact_phone && (
                            <div>{diocese.contact_phone}</div>
                          )}
                          {!diocese.contact_email &&
                            !diocese.contact_phone &&
                            "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {diocese.churchCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDioceseId(diocese.id);
                            }}
                            title={t("dioceses.manageAdmins")}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(diocese);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(diocese);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/dioceses/${diocese.id}`);
                            }}
                            title="View details"
                          >
                            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingDiocese
                  ? t("dioceses.editDiocese")
                  : t("dioceses.createDiocese")}
              </DialogTitle>
              <DialogDescription>
                {editingDiocese
                  ? t("dioceses.updateDescription")
                  : t("dioceses.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isSubmitting}
                  placeholder={t("dioceses.namePlaceholder")}
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
                  placeholder={t("dioceses.descriptionPlaceholder")}
                />
              </div>

              {/* Image Uploads */}
              <ImageUpload
                label="Logo Image"
                currentImageUrl={formData.logo_image_url}
                onImageUploaded={(url) =>
                  setFormData({ ...formData, logo_image_url: url })
                }
                bucket="images"
                folder="dioceses/logos"
                aspectRatio="square"
                maxSizeMB={2}
              />
              <ImageUpload
                label="Cover Image"
                currentImageUrl={formData.cover_image_url}
                onImageUploaded={(url) =>
                  setFormData({ ...formData, cover_image_url: url })
                }
                bucket="images"
                folder="dioceses/covers"
                maxSizeMB={3}
              />

              <div className="space-y-2">
                <Label htmlFor="location">{t("dioceses.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder={t("dioceses.locationPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">
                  {t("dioceses.contactEmail")}
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder={t("dioceses.emailPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">
                  {t("dioceses.contactPhone")}
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  disabled={isSubmitting}
                  placeholder={t("dioceses.phonePlaceholder")}
                />
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
                  : editingDiocese
                  ? t("common.update")
                  : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diocese Admin Management */}
      {selectedDioceseId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDioceseId(null)}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              {t("dioceses.backToDioceses")}
            </Button>
          </div>
          <DioceseAdminList
            dioceseId={selectedDioceseId}
            onAssignClick={() => setIsAssignAdminOpen(true)}
          />
        </div>
      )}

      {/* Assign Admin Dialog */}
      {selectedDioceseId && (
        <AssignDioceseAdminDialog
          dioceseId={selectedDioceseId}
          open={isAssignAdminOpen}
          onOpenChange={setIsAssignAdminOpen}
          onSuccess={() => {
            // Refresh will be handled by the dialog component
          }}
        />
      )}
    </div>
  );
}

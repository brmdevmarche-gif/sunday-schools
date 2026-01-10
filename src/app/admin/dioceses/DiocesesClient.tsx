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
  type Column,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { Diocese, CreateDioceseInput } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

type SortColumn = "name" | "location" | "churchCount";
type SortDirection = "asc" | "desc";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dioceseToDelete, setDioceseToDelete] = useState<Diocese | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [formData, setFormData] = useState<CreateDioceseInput>({
    name: "",
    description: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    cover_image_url: "",
    logo_image_url: "",
  });

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
    { key: "location-asc", label: t("dioceses.location") + " (A-Z)", direction: "asc" },
    { key: "location-desc", label: t("dioceses.location") + " (Z-A)", direction: "desc" },
    { key: "churchCount-asc", label: t("dioceses.churches") + " ↑", direction: "asc" },
    { key: "churchCount-desc", label: t("dioceses.churches") + " ↓", direction: "desc" },
  ];

  const sortedDioceses = [...initialDioceses].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === "location") {
      comparison = (a.location || "").localeCompare(b.location || "");
    } else if (sortColumn === "churchCount") {
      comparison = a.churchCount - b.churchCount;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

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

  function openDeleteDialog(diocese: Diocese) {
    setDioceseToDelete(diocese);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!dioceseToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDioceseAction(dioceseToDelete.id);
      toast.success(t("dioceses.dioceseDeleted"));
      setDeleteDialogOpen(false);
      setDioceseToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error deleting diocese:", error);
      toast.error(t("dioceses.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("dioceses.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("dioceses.subtitle")}</p>
        </div>
        {!selectedDioceseId && (
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
            <Plus className="me-2 h-4 w-4" />
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
            <ResponsiveTable
              data={sortedDioceses}
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
                  cell: (diocese) => diocese.name,
                  isTitle: true,
                },
                {
                  key: "location",
                  header: (
                    <button
                      onClick={() => handleSort("location")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {t("dioceses.location")}
                      <SortIcon column="location" />
                    </button>
                  ),
                  mobileLabel: t("dioceses.location"),
                  cell: (diocese) => diocese.location || "-",
                  isSubtitle: true,
                },
                {
                  key: "contact",
                  header: t("dioceses.contact"),
                  mobileLabel: t("dioceses.contact"),
                  cell: (diocese) => (
                    <div className="text-sm">
                      {diocese.contact_email && (
                        <div className="truncate">{diocese.contact_email}</div>
                      )}
                      {diocese.contact_phone && (
                        <div>{diocese.contact_phone}</div>
                      )}
                      {!diocese.contact_email && !diocese.contact_phone && "-"}
                    </div>
                  ),
                },
                {
                  key: "churchCount",
                  header: (
                    <button
                      onClick={() => handleSort("churchCount")}
                      className="flex items-center justify-end hover:text-foreground transition-colors w-full"
                    >
                      {t("dioceses.churches")}
                      <SortIcon column="churchCount" />
                    </button>
                  ),
                  mobileLabel: t("dioceses.churches"),
                  cell: (diocese) => diocese.churchCount,
                  headerClassName: "text-right",
                  cellClassName: "text-right",
                },
              ]}
              getRowKey={(diocese) => diocese.id}
              onRowClick={(diocese) => router.push(`/admin/dioceses/${diocese.id}`)}
              renderActions={(diocese) => (
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDioceseId(diocese.id);
                    }}
                    aria-label={t("dioceses.manageAdmins")}
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
                    aria-label={t("common.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(diocese);
                    }}
                    aria-label={t("common.delete")}
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
                    aria-label={t("common.viewDetails")}
                    className="hidden sm:flex"
                  >
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              )}
              emptyState={
                <EmptyState
                  icon={Building2}
                  title={t("dioceses.noDioceses")}
                  description={t("dioceses.noDiocesesDescription")}
                  action={{
                    label: t("dioceses.addDiocese"),
                    onClick: () => handleOpenDialog(),
                  }}
                />
              }
              sortOptions={sortOptions}
              currentSort={currentSortKey}
              onSortChange={handleMobileSortChange}
              sortLabel={t("common.sortBy")}
            />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDioceseToDelete(null);
        }}
        title={t("dioceses.deleteDiocese")}
        description={
          dioceseToDelete
            ? t("dioceses.deleteConfirm", { name: dioceseToDelete.name })
            : ""
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}

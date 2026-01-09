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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Church as ChurchIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveFilters } from "@/components/ui/filter-sheet";
import type { Church, CreateChurchInput, Diocese } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createChurchAction,
  updateChurchAction,
  deleteChurchAction,
} from "./actions";

interface ChurchWithCount extends Church {
  classCount: number;
}

interface ChurchesClientProps {
  initialChurches: ChurchWithCount[];
  dioceses: Diocese[];
}

type SortColumn = "name" | "diocese" | "city" | "classCount";
type SortDirection = "asc" | "desc";

export default function ChurchesClient({
  initialChurches,
  dioceses,
}: ChurchesClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChurch, setEditingChurch] = useState<Church | null>(null);
  const [selectedDioceseFilter, setSelectedDioceseFilter] =
    useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [churchToDelete, setChurchToDelete] = useState<Church | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [formData, setFormData] = useState<CreateChurchInput>({
    diocese_id: "",
    name: "",
    description: "",
    address: "",
    city: "",
    contact_email: "",
    contact_phone: "",
    cover_image_url: "",
    logo_image_url: "",
  });

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

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

  function handleOpenDialog(church?: Church) {
    if (church) {
      setEditingChurch(church);
      setFormData({
        diocese_id: church.diocese_id || "",
        name: church.name,
        description: church.description || "",
        address: church.address || "",
        city: church.city || "",
        contact_email: church.contact_email || "",
        contact_phone: church.contact_phone || "",
        cover_image_url: church.cover_image_url || "",
        logo_image_url: church.logo_image_url || "",
      });
    } else {
      setEditingChurch(null);
      setFormData({
        diocese_id: "",
        name: "",
        description: "",
        address: "",
        city: "",
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
      if (editingChurch) {
        await updateChurchAction(editingChurch.id, formData);
        toast.success(t("churches.churchUpdated"));
      } else {
        await createChurchAction(formData);
        toast.success(t("churches.churchCreated"));
      }

      setIsDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error saving church:", error);
      toast.error(
        editingChurch ? t("churches.updateFailed") : t("churches.createFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeleteDialog(church: Church) {
    setChurchToDelete(church);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!churchToDelete) return;

    setIsDeleting(true);
    try {
      await deleteChurchAction(churchToDelete.id);
      toast.success(t("churches.churchDeleted"));
      setDeleteDialogOpen(false);
      setChurchToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Error deleting church:", error);
      toast.error(t("churches.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  }

  function getDioceseName(dioceseId: string | null): string {
    if (!dioceseId) return "-";
    const diocese = dioceses.find((d) => d.id === dioceseId);
    return diocese?.name || "-";
  }

  // Calculate active filter count
  const activeFilterCount = selectedDioceseFilter !== "all" ? 1 : 0;

  function clearFilters() {
    setSelectedDioceseFilter("all");
  }

  // Filter and sort churches
  const filteredChurches = (
    selectedDioceseFilter === "all"
      ? initialChurches
      : initialChurches.filter((c) => c.diocese_id === selectedDioceseFilter)
  ).sort((a, b) => {
    let comparison = 0;
    if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === "diocese") {
      comparison = getDioceseName(a.diocese_id).localeCompare(getDioceseName(b.diocese_id));
    } else if (sortColumn === "city") {
      comparison = (a.city || "").localeCompare(b.city || "");
    } else if (sortColumn === "classCount") {
      comparison = a.classCount - b.classCount;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("churches.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("churches.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="me-2 h-4 w-4" />
          {t("churches.addChurch")}
        </Button>
      </div>

      {/* Filter - Responsive: inline on desktop, sheet on mobile */}
      <ResponsiveFilters
        title={t("common.filters")}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        clearText={t("common.clearAll")}
      >
        <div className="flex-1 max-w-xs space-y-1">
          <Label>{t("churches.diocese")}</Label>
          <Select
            value={selectedDioceseFilter}
            onValueChange={setSelectedDioceseFilter}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("churches.allDioceses")}
              </SelectItem>
              {dioceses.map((diocese) => (
                <SelectItem key={diocese.id} value={diocese.id}>
                  {diocese.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ResponsiveFilters>

      {/* Churches Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("churches.allChurches")}</CardTitle>
          <CardDescription>
            {t("churches.allChurchesDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChurches.length === 0 ? (
            <EmptyState
              icon={ChurchIcon}
              title={t("churches.noChurches")}
              description={t("churches.noChurchesDescription")}
              action={{
                label: t("churches.addChurch"),
                onClick: () => handleOpenDialog(),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {t("common.name")}
                      <SortIcon column="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("diocese")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {t("churches.diocese")}
                      <SortIcon column="diocese" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("city")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      {t("churches.location")}
                      <SortIcon column="city" />
                    </button>
                  </TableHead>
                  <TableHead>{t("churches.contact")}</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => handleSort("classCount")}
                      className="flex items-center justify-end hover:text-foreground transition-colors w-full"
                    >
                      {t("churches.classes")}
                      <SortIcon column="classCount" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChurches.map((church) => (
                  <TableRow
                    key={church.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/admin/churches/${church.id}`)}
                  >
                    <TableCell className="font-medium">{church.name}</TableCell>
                    <TableCell>{getDioceseName(church.diocese_id)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {church.city && <div>{church.city}</div>}
                        {church.address && (
                          <div className="text-muted-foreground">
                            {church.address}
                          </div>
                        )}
                        {!church.city && !church.address && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {church.contact_email && (
                          <div>{church.contact_email}</div>
                        )}
                        {church.contact_phone && (
                          <div>{church.contact_phone}</div>
                        )}
                        {!church.contact_email && !church.contact_phone && "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {church.classCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(church);
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
                            openDeleteDialog(church);
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
                            router.push(`/admin/churches/${church.id}`);
                          }}
                          aria-label={t("common.viewDetails")}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingChurch
                  ? t("churches.editChurch")
                  : t("churches.createChurch")}
              </DialogTitle>
              <DialogDescription>
                {editingChurch
                  ? t("churches.updateDescription")
                  : t("churches.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="diocese_id">{t("churches.diocese")} *</Label>
                <Select
                  value={formData.diocese_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, diocese_id: value })
                  }
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("churches.selectDiocese")} />
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
                  placeholder={t("churches.namePlaceholder")}
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
                  placeholder={t("churches.descriptionPlaceholder")}
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
                folder="churches/logos"
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
                folder="churches/covers"
                maxSizeMB={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("churches.city")}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    disabled={isSubmitting}
                    placeholder={t("churches.cityPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("churches.address")}</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    disabled={isSubmitting}
                    placeholder={t("churches.addressPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    {t("churches.contactEmail")}
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder={t("churches.emailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    {t("churches.contactPhone")}
                  </Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    disabled={isSubmitting}
                    placeholder={t("churches.phonePlaceholder")}
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
                  : editingChurch
                  ? t("common.update")
                  : t("common.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setChurchToDelete(null);
        }}
        title={t("churches.deleteChurch")}
        description={
          churchToDelete
            ? t("churches.deleteConfirm", { name: churchToDelete.name })
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

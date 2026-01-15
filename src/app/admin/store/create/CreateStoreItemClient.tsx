"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { createStoreItemAction } from "../actions";
import type { ExtendedUser } from "@/lib/types";
import { normalizeNonNegativeIntInput, toNonNegativeInt } from "@/lib/utils";

interface Church {
  id: string;
  name: string;
  diocese_id: string;
}

interface ClassItem {
  id: string;
  name: string;
  church_id: string;
}

interface CreateStoreItemClientProps {
  userProfile: ExtendedUser;
  churches: Church[];
  dioceses: { id: string; name: string }[];
  classes: ClassItem[];
}

export default function CreateStoreItemClient({
  userProfile,
  churches,
  dioceses,
  classes,
}: CreateStoreItemClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  interface SpecialOfferForm {
    id: string; // Temporary ID for React keys
    special_price_normal: number | null;
    special_price_mastor: number | null;
    special_price_botl: number | null;
    start_local: string;
    end_local: string;
  }

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    stock_type: "quantity" as "quantity" | "on_demand",
    stock_quantity: 0,
    price_normal: 0,
    price_mastor: 0,
    price_botl: 0,
    special_offers: [] as SpecialOfferForm[],
    church_ids: [] as string[],
    diocese_ids: [] as string[],
    is_available_to_all_classes: true,
    class_ids: [] as string[],
  });

  function datetimeLocalToIso(local: string) {
    if (!local) return null;
    const d = new Date(local);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function toDatetimeLocal(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function addSpecialOffer() {
    const newOffer: SpecialOfferForm = {
      id: `temp-${Date.now()}-${Math.random()}`,
      special_price_normal: null,
      special_price_mastor: null,
      special_price_botl: null,
      start_local: "",
      end_local: "",
    };
    setFormData({
      ...formData,
      special_offers: [...formData.special_offers, newOffer],
    });
  }

  function removeSpecialOffer(offerId: string) {
    setFormData({
      ...formData,
      special_offers: formData.special_offers.filter((o) => o.id !== offerId),
    });
  }

  function updateSpecialOffer(offerId: string, updates: Partial<SpecialOfferForm>) {
    setFormData({
      ...formData,
      special_offers: formData.special_offers.map((o) =>
        o.id === offerId ? { ...o, ...updates } : o
      ),
    });
  }

  // Validation functions
  function validateSpecialOffers(): { valid: boolean; error?: string } {
    const offers = formData.special_offers;
    
    // Check each offer has at least one price
    for (const offer of offers) {
      if (
        offer.special_price_normal == null &&
        offer.special_price_mastor == null &&
        offer.special_price_botl == null
      ) {
        return { valid: false, error: t("createStoreItem.errors.specialOfferAtLeastOne") };
      }
      
      if (!offer.start_local || !offer.end_local) {
        return { valid: false, error: t("createStoreItem.errors.specialOfferIncomplete") };
      }
      
      const start = new Date(offer.start_local);
      const end = new Date(offer.end_local);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { valid: false, error: t("createStoreItem.errors.specialOfferIncomplete") };
      }
      
      if (start >= end) {
        return { valid: false, error: t("createStoreItem.errors.specialOfferInvalidRange") };
      }
    }
    
    // Check for overlapping date ranges
    for (let i = 0; i < offers.length; i++) {
      for (let j = i + 1; j < offers.length; j++) {
        const a = offers[i];
        const b = offers[j];
        const aStart = new Date(a.start_local);
        const aEnd = new Date(a.end_local);
        const bStart = new Date(b.start_local);
        const bEnd = new Date(b.end_local);
        
        if (
          (aStart <= bStart && aEnd > bStart) ||
          (bStart <= aStart && bEnd > aStart) ||
          (aStart >= bStart && aEnd <= bEnd) ||
          (bStart >= aStart && bEnd <= aEnd)
        ) {
          return { valid: false, error: t("createStoreItem.errors.specialOfferOverlap") };
        }
      }
    }
    
    // Check for duplicate prices per tier
    const normalPrices = offers
      .map((o) => o.special_price_normal)
      .filter((p): p is number => p != null);
    const mastorPrices = offers
      .map((o) => o.special_price_mastor)
      .filter((p): p is number => p != null);
    const botlPrices = offers
      .map((o) => o.special_price_botl)
      .filter((p): p is number => p != null);
    
    if (new Set(normalPrices).size !== normalPrices.length) {
      return { valid: false, error: t("createStoreItem.errors.specialOfferDuplicatePrice") };
    }
    if (new Set(mastorPrices).size !== mastorPrices.length) {
      return { valid: false, error: t("createStoreItem.errors.specialOfferDuplicatePrice") };
    }
    if (new Set(botlPrices).size !== botlPrices.length) {
      return { valid: false, error: t("createStoreItem.errors.specialOfferDuplicatePrice") };
    }
    
    return { valid: true };
  }

  // Filter churches based on selected dioceses, but always include already selected churches
  // Also show all churches if no dioceses are selected
  const filteredChurches = churches.filter(
    (church) =>
      formData.diocese_ids.length === 0 ||
      formData.diocese_ids.includes(church.diocese_id) ||
      formData.church_ids.includes(church.id)
  );

  // Filter classes based on selected churches, but always include already selected classes
  // Also show all classes if no churches are selected
  const filteredClasses = classes.filter(
    (classItem) =>
      formData.church_ids.length === 0 ||
      formData.church_ids.includes(classItem.church_id) ||
      formData.class_ids.includes(classItem.id)
  );

  function handleDioceseChange(dioceseId: string, checked: boolean) {
    let newDioceseIds: string[];
    if (checked) {
      newDioceseIds = [...formData.diocese_ids, dioceseId];
    } else {
      newDioceseIds = formData.diocese_ids.filter((id) => id !== dioceseId);
    }

    const validChurches =
      newDioceseIds.length > 0
        ? churches.filter((church) => newDioceseIds.includes(church.diocese_id))
        : churches;

    const validChurchIds = formData.church_ids.filter((id) =>
      validChurches.some((church) => church.id === id)
    );

    setFormData({
      ...formData,
      diocese_ids: newDioceseIds,
      church_ids: validChurchIds,
    });
  }

  function handleChurchChange(churchId: string, checked: boolean) {
    let newChurchIds: string[];
    if (checked) {
      newChurchIds = [...formData.church_ids, churchId];
    } else {
      newChurchIds = formData.church_ids.filter((id) => id !== churchId);
    }

    const validClasses =
      newChurchIds.length > 0
        ? classes.filter((classItem) =>
            newChurchIds.includes(classItem.church_id)
          )
        : classes;

    const validClassIds = formData.class_ids.filter((id) =>
      validClasses.some((classItem) => classItem.id === id)
    );

    setFormData({
      ...formData,
      church_ids: newChurchIds,
      class_ids: validClassIds,
    });
  }

  function handleClassChange(classId: string, checked: boolean) {
    if (checked) {
      setFormData({
        ...formData,
        class_ids: [...formData.class_ids, classId],
      });
    } else {
      setFormData({
        ...formData,
        class_ids: formData.class_ids.filter((id) => id !== classId),
      });
    }
  }

  function handleSelectAllDioceses() {
    const allSelected = dioceses.length > 0 && formData.diocese_ids.length === dioceses.length;
    if (allSelected) {
      // Deselect all
      setFormData({
        ...formData,
        diocese_ids: [],
        church_ids: [], // Also clear churches when deselecting all dioceses
      });
    } else {
      // Select all
      const allDioceseIds = dioceses.map((d) => d.id);
      setFormData({
        ...formData,
        diocese_ids: allDioceseIds,
      });
    }
  }

  function handleSelectAllChurches() {
    const allSelected = filteredChurches.length > 0 && 
      formData.church_ids.length === filteredChurches.length &&
      filteredChurches.every((c) => formData.church_ids.includes(c.id));
    
    if (allSelected) {
      // Deselect all
      setFormData({
        ...formData,
        church_ids: [],
        class_ids: [], // Also clear classes when deselecting all churches
      });
    } else {
      // Select all visible churches
      const allChurchIds = filteredChurches.map((c) => c.id);
      setFormData({
        ...formData,
        church_ids: Array.from(new Set([...formData.church_ids, ...allChurchIds])),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.name ||
      (formData.stock_type === "quantity" && formData.stock_quantity < 0)
    ) {
      toast.error(t("createStoreItem.errors.fillRequired"));
      return;
    }

    // Validate special offers
    if (formData.special_offers.length > 0) {
      const validation = validateSpecialOffers();
      if (!validation.valid) {
        toast.error(validation.error || t("createStoreItem.errors.specialOfferIncomplete"));
        return;
      }
    }

    setIsLoading(true);
    try {
      await createStoreItemAction({
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        stock_type: formData.stock_type,
        stock_quantity: formData.stock_quantity,
        price_normal: formData.price_normal,
        price_mastor: formData.price_mastor,
        price_botl: formData.price_botl,
        special_offers: formData.special_offers.map((offer) => ({
          special_price_normal: offer.special_price_normal ?? undefined,
          special_price_mastor: offer.special_price_mastor ?? undefined,
          special_price_botl: offer.special_price_botl ?? undefined,
          start_at: datetimeLocalToIso(offer.start_local)!,
          end_at: datetimeLocalToIso(offer.end_local)!,
        })),
        church_ids: formData.church_ids,
        diocese_ids: formData.diocese_ids,
        is_available_to_all_classes: formData.is_available_to_all_classes,
        class_ids: formData.class_ids,
      });
      toast.success(t("createStoreItem.messages.createSuccess"));
      router.push("/admin/store");
    } catch (error: unknown) {
      console.error("Error creating store item:", error);
      toast.error(
        error instanceof Error ? error.message : t("createStoreItem.messages.createError")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t("createStoreItem.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("createStoreItem.subtitle")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t("createStoreItem.basicInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("createStoreItem.fields.itemName")} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t("createStoreItem.placeholders.itemName")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("createStoreItem.fields.description")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={t("createStoreItem.placeholders.description")}
                    rows={4}
                  />
                </div>

                <ImageUpload
                  label={t("createStoreItem.fields.itemImage")}
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) =>
                    setFormData({ ...formData, image_url: url })
                  }
                  bucket="images"
                  folder="store/items"
                  maxSizeMB={3}
                />
              </CardContent>
            </Card>

            {/* Stock Management */}
            <Card>
              <CardHeader>
                <CardTitle>{t("createStoreItem.stockManagement")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t("createStoreItem.fields.stockType")} *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stock_type"
                        value="quantity"
                        checked={formData.stock_type === "quantity"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_type: e.target.value as
                              | "quantity"
                              | "on_demand",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>{t("createStoreItem.stockTypes.limitedQuantity")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stock_type"
                        value="on_demand"
                        checked={formData.stock_type === "on_demand"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_type: e.target.value as
                              | "quantity"
                              | "on_demand",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>{t("createStoreItem.stockTypes.onDemand")}</span>
                    </label>
                  </div>
                </div>

                {formData.stock_type === "quantity" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">{t("createStoreItem.fields.stockQuantity")} *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onFocus={(e) => {
                        if (e.currentTarget.value === "0") e.currentTarget.select();
                      }}
                      onChange={(e) => {
                        const normalized = normalizeNonNegativeIntInput(e.target.value);
                        setFormData({
                          ...formData,
                          stock_quantity: toNonNegativeInt(normalized, 0),
                        });
                      }}
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>{t("createStoreItem.pricing")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price_normal">{t("createStoreItem.fields.priceNormal")} *</Label>
                  <Input
                    id="price_normal"
                    type="number"
                    min="0"
                    value={formData.price_normal}
                    onFocus={(e) => {
                      if (e.currentTarget.value === "0") e.currentTarget.select();
                    }}
                    onChange={(e) => {
                      const normalized = normalizeNonNegativeIntInput(e.target.value);
                      setFormData({
                        ...formData,
                        price_normal: toNonNegativeInt(normalized, 0),
                      });
                    }}
                    placeholder={t("createStoreItem.placeholders.points")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_mastor">{t("createStoreItem.fields.priceMastor")} *</Label>
                  <Input
                    id="price_mastor"
                    type="number"
                    min="0"
                    value={formData.price_mastor}
                    onFocus={(e) => {
                      if (e.currentTarget.value === "0") e.currentTarget.select();
                    }}
                    onChange={(e) => {
                      const normalized = normalizeNonNegativeIntInput(e.target.value);
                      setFormData({
                        ...formData,
                        price_mastor: toNonNegativeInt(normalized, 0),
                      });
                    }}
                    placeholder={t("createStoreItem.placeholders.points")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_botl">{t("createStoreItem.fields.priceBotl")} *</Label>
                  <Input
                    id="price_botl"
                    type="number"
                    min="0"
                    value={formData.price_botl}
                    onFocus={(e) => {
                      if (e.currentTarget.value === "0") e.currentTarget.select();
                    }}
                    onChange={(e) => {
                      const normalized = normalizeNonNegativeIntInput(e.target.value);
                      setFormData({
                        ...formData,
                        price_botl: toNonNegativeInt(normalized, 0),
                      });
                    }}
                    placeholder={t("createStoreItem.placeholders.points")}
                    required
                  />
                </div>

                {/* Special Offers */}
                <div className="rounded-md border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("createStoreItem.specialOffer")}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("createStoreItem.specialOfferRules")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSpecialOffer}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("common.add")}
                    </Button>
                  </div>

                  {formData.special_offers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("createStoreItem.noSpecialOffers")}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.special_offers.map((offer, index) => (
                        <div
                          key={offer.id}
                          className="border rounded-lg p-4 space-y-3 bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-base">
                              {t("createStoreItem.specialOffer")} #{index + 1}
                            </Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSpecialOffer(offer.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label>
                                {t("createStoreItem.fields.priceNormal")}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={offer.special_price_normal ?? ""}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "0" || e.currentTarget.value === "")
                                    e.currentTarget.select();
                                }}
                                onChange={(e) => {
                                  const normalized = normalizeNonNegativeIntInput(e.target.value);
                                  updateSpecialOffer(offer.id, {
                                    special_price_normal:
                                      normalized === "" ? null : toNonNegativeInt(normalized, 0),
                                  });
                                }}
                                placeholder={t("createStoreItem.placeholders.points")}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                {t("createStoreItem.fields.priceMastor")}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={offer.special_price_mastor ?? ""}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "0" || e.currentTarget.value === "")
                                    e.currentTarget.select();
                                }}
                                onChange={(e) => {
                                  const normalized = normalizeNonNegativeIntInput(e.target.value);
                                  updateSpecialOffer(offer.id, {
                                    special_price_mastor:
                                      normalized === "" ? null : toNonNegativeInt(normalized, 0),
                                  });
                                }}
                                placeholder={t("createStoreItem.placeholders.points")}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                {t("createStoreItem.fields.priceBotl")}
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={offer.special_price_botl ?? ""}
                                onFocus={(e) => {
                                  if (e.currentTarget.value === "0" || e.currentTarget.value === "")
                                    e.currentTarget.select();
                                }}
                                onChange={(e) => {
                                  const normalized = normalizeNonNegativeIntInput(e.target.value);
                                  updateSpecialOffer(offer.id, {
                                    special_price_botl:
                                      normalized === "" ? null : toNonNegativeInt(normalized, 0),
                                  });
                                }}
                                placeholder={t("createStoreItem.placeholders.points")}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>
                                {t("createStoreItem.fields.specialStart")} *
                              </Label>
                              <Input
                                type="datetime-local"
                                value={offer.start_local}
                                onChange={(e) =>
                                  updateSpecialOffer(offer.id, {
                                    start_local: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>
                                {t("createStoreItem.fields.specialEnd")} *
                              </Label>
                              <Input
                                type="datetime-local"
                                value={offer.end_local}
                                onChange={(e) =>
                                  updateSpecialOffer(offer.id, {
                                    end_local: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Diocese & Church Selection */}
            {userProfile.role === "super_admin" && (
              <>
                {dioceses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{t("createStoreItem.availableInDioceses")}</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllDioceses}
                        >
                          {dioceses.length > 0 && formData.diocese_ids.length === dioceses.length
                            ? t("common.deselectAll")
                            : t("common.selectAll")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {dioceses.map((diocese) => (
                          <label
                            key={diocese.id}
                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.diocese_ids.includes(
                                diocese.id
                              )}
                              onChange={(e) =>
                                handleDioceseChange(
                                  diocese.id,
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{diocese.name}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {churches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{t("createStoreItem.availableInChurches")}</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllChurches}
                        >
                          {filteredChurches.length > 0 &&
                          formData.church_ids.length === filteredChurches.length &&
                          filteredChurches.every((c) => formData.church_ids.includes(c.id))
                            ? t("common.deselectAll")
                            : t("common.selectAll")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {filteredChurches.map((church) => (
                          <label
                            key={church.id}
                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.church_ids.includes(church.id)}
                              onChange={(e) =>
                                handleChurchChange(church.id, e.target.checked)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {church.name}
                              {church.diocese_id &&
                                (() => {
                                  const diocese = dioceses.find(
                                    (d) => d.id === church.diocese_id
                                  );
                                  return diocese ? ` - ${diocese.name}` : "";
                                })()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Class Selection */}
            <Card>
              <CardHeader>
                <CardTitle>{t("createStoreItem.classAvailability")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="all_classes">{t("createStoreItem.availableToAllClasses")}</Label>
                  <Switch
                    id="all_classes"
                    checked={formData.is_available_to_all_classes}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: checked,
                        class_ids: checked ? [] : formData.class_ids,
                      })
                    }
                  />
                </div>

                {!formData.is_available_to_all_classes &&
                  filteredClasses.length > 0 && (
                    <div className="border rounded p-2 max-h-40 overflow-y-auto">
                      {filteredClasses.map((classItem) => (
                        <label
                          key={classItem.id}
                          className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.class_ids.includes(classItem.id)}
                            onChange={(e) =>
                              handleClassChange(classItem.id, e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{classItem.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? t("createStoreItem.creating") : t("createStoreItem.createItem")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

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
import { ArrowLeft, Save, Plus } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { updateStoreItemAction } from "../../actions";
import type { ExtendedUser, StoreItem, StoreItemSpecialOffer } from "@/lib/types";
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

interface EditStoreItemClientProps {
  userProfile: ExtendedUser;
  item: StoreItem;
  churches: Church[];
  dioceses: { id: string; name: string }[];
  classes: ClassItem[];
  initialChurchIds: string[];
  initialDioceseIds: string[];
  initialClassIds: string[];
  initialSpecialOffers: StoreItemSpecialOffer[];
}

function isoToDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function datetimeLocalToIso(local: string) {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDurationMs(ms: number, t: (key: string) => string) {
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = Math.max(0, totalMinutes - days * 60 * 24 - hours * 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${t("common.days")}`);
  if (hours > 0) parts.push(`${hours} ${t("common.hours")}`);
  if (parts.length === 0) parts.push(`${minutes} ${t("common.minutes")}`);
  return parts.join(" ");
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

export default function EditStoreItemClient({
  userProfile,
  item,
  churches,
  dioceses,
  classes,
  initialChurchIds,
  initialDioceseIds,
  initialClassIds,
  initialSpecialOffers,
}: EditStoreItemClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  type LocalSpecialOffer = {
    price: number;
    start_local: string;
    end_local: string;
  };

  const initialOffersLocal: LocalSpecialOffer[] =
    initialSpecialOffers.length > 0
      ? initialSpecialOffers.map((o) => ({
          price: o.price,
          start_local: isoToDatetimeLocal(o.start_at),
          end_local: isoToDatetimeLocal(o.end_at),
        }))
      : item.special_price != null &&
          item.special_price_start_at &&
          item.special_price_end_at
        ? [
            {
              price: item.special_price,
              start_local: isoToDatetimeLocal(item.special_price_start_at),
              end_local: isoToDatetimeLocal(item.special_price_end_at),
            },
          ]
        : [];

  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || "",
    image_url: item.image_url || "",
    stock_type: item.stock_type as "quantity" | "on_demand",
    stock_quantity: item.stock_quantity,
    price_normal: item.price_normal,
    price_mastor: item.price_mastor,
    price_botl: item.price_botl,
    is_active: item.is_active,
    special_offer_enabled: initialOffersLocal.length > 0,
    special_offers: initialOffersLocal,
    church_ids: initialChurchIds,
    diocese_ids: initialDioceseIds,
    is_available_to_all_classes: item.is_available_to_all_classes,
    class_ids: initialClassIds,
  });

  function setSpecialPreset(
    offerIndex: number,
    preset:
      | "now"
      | "today"
      | "thisWeek"
      | "thisMonth"
      | "tomorrow"
      | "nextWeek"
      | "nextMonth"
  ) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const endOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(23, 59, 0, 0);
      return x;
    };
    const startOfWeekSunday = (d: Date) => {
      const x = startOfDay(d);
      x.setDate(x.getDate() - x.getDay());
      return x;
    };
    const endOfWeekSaturday = (d: Date) => {
      const s = startOfWeekSunday(d);
      const x = new Date(s);
      x.setDate(s.getDate() + 6);
      x.setHours(23, 59, 0, 0);
      return x;
    };
    const startOfMonth = (d: Date) => {
      const x = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      return x;
    };
    const endOfMonth = (d: Date) => {
      const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 0, 0);
      return x;
    };

    switch (preset) {
      case "now": {
        end.setDate(end.getDate() + 1);
        break;
      }
      case "today": {
        const s = startOfDay(now);
        const e = endOfDay(now);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
      case "tomorrow": {
        const t = new Date(now);
        t.setDate(t.getDate() + 1);
        const s = startOfDay(t);
        const e = endOfDay(t);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
      case "thisWeek": {
        const s = startOfWeekSunday(now);
        const e = endOfWeekSaturday(now);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
      case "nextWeek": {
        const next = new Date(now);
        next.setDate(next.getDate() + 7);
        const s = startOfWeekSunday(next);
        const e = endOfWeekSaturday(next);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
      case "thisMonth": {
        const s = startOfMonth(now);
        const e = endOfMonth(now);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
      case "nextMonth": {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const s = startOfMonth(next);
        const e = endOfMonth(next);
        start.setTime(s.getTime());
        end.setTime(e.getTime());
        break;
      }
    }

    const nextOffers = [...formData.special_offers];
    if (!nextOffers[offerIndex]) return;
    nextOffers[offerIndex] = {
      ...nextOffers[offerIndex],
      start_local: toDatetimeLocal(start),
      end_local: toDatetimeLocal(end),
    };
    setFormData({ ...formData, special_offers: nextOffers });
  }

  // Filter churches based on selected dioceses
  const filteredChurches =
    formData.diocese_ids.length > 0
      ? churches.filter((church) =>
          formData.diocese_ids.includes(church.diocese_id)
        )
      : churches;

  // Filter classes based on selected churches
  const filteredClasses =
    formData.church_ids.length > 0
      ? classes.filter((classItem) =>
          formData.church_ids.includes(classItem.church_id)
        )
      : classes;

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
        ? classes.filter((classItem) => newChurchIds.includes(classItem.church_id))
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.name ||
      (formData.stock_type === "quantity" && formData.stock_quantity < 0)
    ) {
      toast.error(t("createStoreItem.errors.fillRequired"));
      return;
    }

    const offersIso =
      formData.special_offer_enabled
        ? formData.special_offers.map((o) => ({
            price: o.price,
            start_at: datetimeLocalToIso(o.start_local),
            end_at: datetimeLocalToIso(o.end_local),
          }))
        : [];

    if (formData.special_offer_enabled) {
      if (offersIso.length === 0) {
        toast.error(t("createStoreItem.errors.specialOfferAtLeastOne"));
        return;
      }

      const normalized = offersIso.map((o) => ({
        price: o.price,
        start_at: o.start_at,
        end_at: o.end_at,
        start_ms: o.start_at ? new Date(o.start_at).getTime() : NaN,
        end_ms: o.end_at ? new Date(o.end_at).getTime() : NaN,
      }));

      // Validate: complete + valid range + unique price + unique range + no overlaps
      const seenPrices = new Set<number>();
      const seenRanges = new Set<string>();
      const seenStarts = new Set<string>();
      const seenEnds = new Set<string>();

      for (const o of normalized) {
        if (!o.price || !o.start_at || !o.end_at) {
          toast.error(t("createStoreItem.errors.specialOfferIncomplete"));
          return;
        }
        if (Number.isNaN(o.start_ms) || Number.isNaN(o.end_ms) || o.start_ms >= o.end_ms) {
          toast.error(t("createStoreItem.errors.specialOfferInvalidRange"));
          return;
        }
        if (seenPrices.has(o.price)) {
          toast.error(t("createStoreItem.errors.specialOfferDuplicatePrice"));
          return;
        }
        seenPrices.add(o.price);

        const rangeKey = `${o.start_at}__${o.end_at}`;
        if (seenRanges.has(rangeKey)) {
          toast.error(t("createStoreItem.errors.specialOfferDuplicateRange"));
          return;
        }
        seenRanges.add(rangeKey);

        if (seenStarts.has(o.start_at)) {
          toast.error(t("createStoreItem.errors.specialOfferDuplicateStart"));
          return;
        }
        seenStarts.add(o.start_at);

        if (seenEnds.has(o.end_at)) {
          toast.error(t("createStoreItem.errors.specialOfferDuplicateEnd"));
          return;
        }
        seenEnds.add(o.end_at);
      }

      const sorted = [...normalized].sort((a, b) => a.start_ms - b.start_ms);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        // Overlap if previous end is after current start
        if (prev.end_ms > cur.start_ms) {
          toast.error(t("createStoreItem.errors.specialOfferOverlap"));
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      await updateStoreItemAction(item.id, {
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        stock_type: formData.stock_type,
        stock_quantity: formData.stock_quantity,
        price_normal: formData.price_normal,
        price_mastor: formData.price_mastor,
        price_botl: formData.price_botl,
        is_active: formData.is_active,
        special_offers: formData.special_offer_enabled
          ? offersIso.map((o) => ({
              price: o.price,
              start_at: o.start_at as string,
              end_at: o.end_at as string,
            }))
          : [],
        special_price: null,
        special_price_start_at: null,
        special_price_end_at: null,
        church_ids: formData.church_ids,
        diocese_ids: formData.diocese_ids,
        is_available_to_all_classes: formData.is_available_to_all_classes,
        class_ids: formData.class_ids,
      });

      toast.success(t("store.itemUpdated"));
      router.push("/admin/store");
    } catch (error: unknown) {
      console.error("Error updating store item:", error);
      toast.error(
        error instanceof Error ? error.message : t("store.updateFailed")
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
          <h1 className="text-3xl font-bold">{t("store.editItem")}</h1>
          <p className="text-muted-foreground mt-1">{item.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t("common.status")}</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>

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
                            stock_type: e.target.value as "quantity" | "on_demand",
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
                            stock_type: e.target.value as "quantity" | "on_demand",
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

            {/* Special Offer (separate section) */}
            <Card>
              <CardHeader>
                <CardTitle>{t("createStoreItem.specialOffer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="special_offer_enabled">
                    {t("createStoreItem.specialOffer")}
                  </Label>
                  <Switch
                    id="special_offer_enabled"
                    checked={formData.special_offer_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        special_offer_enabled: checked,
                        ...(checked
                          ? {
                              special_offers:
                                formData.special_offers.length > 0
                                  ? formData.special_offers
                                  : [{ price: 0, start_local: "", end_local: "" }],
                            }
                          : {
                              special_offers: [],
                            }),
                      })
                    }
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {t("createStoreItem.specialOfferRules")}
                </p>

                {formData.special_offer_enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {t("createStoreItem.fields.specialPrice")}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            special_offers: [
                              ...formData.special_offers,
                              { price: 0, start_local: "", end_local: "" },
                            ],
                          })
                        }
                      >
                        <Plus className="me-2 h-4 w-4" />
                        {t("common.add")}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {formData.special_offers.map((offer, idx) => (
                        <div key={idx} className="rounded-md border p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              {t("createStoreItem.specialOffer")} #{idx + 1}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const next = formData.special_offers.filter((_, i) => i !== idx);
                                setFormData({ ...formData, special_offers: next });
                              }}
                              disabled={formData.special_offers.length <= 1}
                            >
                              {t("common.remove")}
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>{t("createStoreItem.fields.specialPrice")}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={offer.price}
                              onFocus={(e) => {
                                if (e.currentTarget.value === "0") e.currentTarget.select();
                              }}
                              onChange={(e) => {
                                const normalized = normalizeNonNegativeIntInput(e.target.value);
                                const nextOffers = [...formData.special_offers];
                                nextOffers[idx] = {
                                  ...nextOffers[idx],
                                  price: toNonNegativeInt(normalized, 0),
                                };
                                setFormData({ ...formData, special_offers: nextOffers });
                              }}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSpecialPreset(idx, "now")}
                            >
                              {t("createStoreItem.presets.now")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSpecialPreset(idx, "today")}
                            >
                              {t("createStoreItem.presets.today")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSpecialPreset(idx, "thisWeek")}
                            >
                              {t("createStoreItem.presets.thisWeek")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSpecialPreset(idx, "thisMonth")}
                            >
                              {t("createStoreItem.presets.thisMonth")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSpecialPreset(idx, "tomorrow")}
                            >
                              {t("createStoreItem.presets.tomorrow")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSpecialPreset(idx, "nextWeek")}
                            >
                              {t("createStoreItem.presets.nextWeek")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setSpecialPreset(idx, "nextMonth")}
                            >
                              {t("createStoreItem.presets.nextMonth")}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2">
                              <Label>{t("createStoreItem.fields.specialStart")}</Label>
                              <Input
                                type="datetime-local"
                                value={offer.start_local}
                                onChange={(e) => {
                                  const nextOffers = [...formData.special_offers];
                                  nextOffers[idx] = {
                                    ...nextOffers[idx],
                                    start_local: e.target.value,
                                  };
                                  setFormData({ ...formData, special_offers: nextOffers });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t("createStoreItem.fields.specialEnd")}</Label>
                              <Input
                                type="datetime-local"
                                value={offer.end_local}
                                onChange={(e) => {
                                  const nextOffers = [...formData.special_offers];
                                  nextOffers[idx] = {
                                    ...nextOffers[idx],
                                    end_local: e.target.value,
                                  };
                                  setFormData({ ...formData, special_offers: nextOffers });
                                }}
                              />
                              {offer.start_local && offer.end_local && (() => {
                                const startMs = new Date(offer.start_local).getTime();
                                const endMs = new Date(offer.end_local).getTime();
                                if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
                                if (endMs <= startMs) {
                                  return (
                                    <p className="text-xs text-destructive">
                                      {t("createStoreItem.errors.specialOfferInvalidRange")}
                                    </p>
                                  );
                                }
                                return (
                                  <p className="text-xs text-muted-foreground">
                                    {t("createStoreItem.duration")}: {formatDurationMs(endMs - startMs, t)}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Diocese & Church Selection */}
            {userProfile.role === "super_admin" && (
              <>
                {dioceses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("createStoreItem.availableInDioceses")}</CardTitle>
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
                              checked={formData.diocese_ids.includes(diocese.id)}
                              onChange={(e) =>
                                handleDioceseChange(diocese.id, e.target.checked)
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
                      <CardTitle>{t("createStoreItem.availableInChurches")}</CardTitle>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}



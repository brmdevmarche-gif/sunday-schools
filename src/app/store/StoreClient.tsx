"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  ArrowLeft,
  Search,
  Lock,
} from "lucide-react";
import type { StoreItem, PriceTier } from "@/lib/types";
import { createOrderAction } from "../admin/store/orders/actions";

interface CartItem {
  item: StoreItem;
  quantity: number;
  priceTier: PriceTier;
}

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
  email?: string;
  church_id?: string | null;
  diocese_id?: string | null;
}

interface PointsBalance {
  available_points: number;
  suspended_points: number;
  total_earned: number;
}

interface StoreClientProps {
  items: StoreItem[];
  userProfile: UserProfile;
  userClassIds: string[];
  pointsBalance: PointsBalance;
}

export default function StoreClient({
  items,
  userProfile,
  userClassIds,
  pointsBalance,
}: StoreClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 100);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keep "time left" labels up to date without being too chatty.
  useEffect(() => {
    const id = window.setInterval(() => setNowTs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Determine user's price tier based on their profile
  // This should ideally come from a user property, but for now we'll default to normal
  const userPriceTier: PriceTier = "normal"; // TODO: Get from user profile

  function addToCart(item: StoreItem) {
    const newCart = new Map(cart);
    const existing = newCart.get(item.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      newCart.set(item.id, {
        item,
        quantity: 1,
        priceTier: userPriceTier,
      });
    }

    setCart(newCart);
    toast.success(t("store.itemAdded"));
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const newCart = new Map(cart);
    const existing = newCart.get(itemId);
    if (existing) {
      existing.quantity = quantity;
      setCart(newCart);
    }
  }

  function removeFromCart(itemId: string) {
    const newCart = new Map(cart);
    newCart.delete(itemId);
    setCart(newCart);
    toast.success(t("store.itemRemoved"));
  }

  function getActiveSpecialOffer(item: StoreItem) {
    const now = new Date(nowTs);

    // New multi-offer model
    if (Array.isArray(item.special_offers) && item.special_offers.length > 0) {
      for (const offer of item.special_offers) {
        const start = new Date(offer.start_at);
        const end = new Date(offer.end_at);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
        if (now >= start && now <= end) return offer;
      }
    }

    // Legacy single-offer fallback
    if (
      item.special_price != null &&
      item.special_price_start_at &&
      item.special_price_end_at
    ) {
      const start = new Date(item.special_price_start_at);
      const end = new Date(item.special_price_end_at);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (now >= start && now <= end) {
          return {
            id: "legacy",
            store_item_id: item.id,
            price: item.special_price,
            start_at: item.special_price_start_at,
            end_at: item.special_price_end_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        }
      }
    }

    return null;
  }

  function getItemPrice(item: StoreItem, tier: PriceTier): number {
    const activeOffer = getActiveSpecialOffer(item);
    if (activeOffer) return activeOffer.price;

    switch (tier) {
      case "mastor":
        return item.price_mastor;
      case "botl":
        return item.price_botl;
      default:
        return item.price_normal;
    }
  }

  function getBaseTierPrice(item: StoreItem, tier: PriceTier): number {
    switch (tier) {
      case "mastor":
        return item.price_mastor;
      case "botl":
        return item.price_botl;
      default:
        return item.price_normal;
    }
  }

  function isSpecialActive(item: StoreItem): boolean {
    return getActiveSpecialOffer(item) != null;
  }

  const timeLeftFormatter = useMemo(() => {
    function format(endIso: string): string {
      const end = new Date(endIso).getTime();
      if (Number.isNaN(end)) return "";
      const diffMs = end - nowTs;
      if (diffMs <= 0) return "";

      const minutes = Math.ceil(diffMs / 60_000);
      const hours = Math.ceil(diffMs / 3_600_000);
      const days = Math.ceil(diffMs / 86_400_000);

      if (days >= 2) return t("store.timeLeftDays", { count: days });
      if (hours >= 2) return t("store.timeLeftHours", { count: hours });
      return t("store.timeLeftMinutes", { count: Math.max(1, minutes) });
    }

    return { format };
  }, [nowTs, t]);

  function getSpecialTimeLeftText(item: StoreItem): string | null {
    const activeOffer = getActiveSpecialOffer(item);
    if (!activeOffer) return null;
    const formatted = timeLeftFormatter.format(activeOffer.end_at);
    if (!formatted) return null;
    return t("store.specialEndsIn", { time: formatted });
  }

  function calculateTotal(): number {
    let total = 0;
    cart.forEach((cartItem) => {
      const price = getItemPrice(cartItem.item, cartItem.priceTier);
      total += price * cartItem.quantity;
    });
    return total;
  }

  async function handleCheckout() {
    if (cart.size === 0) {
      toast.error(t("store.cartEmpty"));
      return;
    }

    const totalPoints = calculateTotal();

    // Check if user has enough points
    if (pointsBalance.available_points < totalPoints) {
      toast.error(
        t("store.insufficientPoints", {
          available: pointsBalance.available_points,
          required: totalPoints,
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = Array.from(cart.values()).map((cartItem) => ({
        store_item_id: cartItem.item.id,
        quantity: cartItem.quantity,
        price_tier: cartItem.priceTier,
      }));

      await createOrderAction({
        items: orderItems,
        notes: orderNotes || undefined,
        class_id: userClassIds[0] || undefined,
      });

      toast.success(t("store.orderPlaced"));
      setCart(new Map());
      setOrderNotes("");
      setIsCheckoutOpen(false);
      router.push("/store/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("store.orderFailed");

      // Check if it's an insufficient points error
      if (errorMessage.includes("Insufficient points")) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const cartItems = Array.from(cart.values());
  const totalPoints = calculateTotal();

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label={t("common.back") || "Back"}>
                <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t("store.title")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/store/orders")}
              >
                {t("store.myOrders")}
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Points Bar - shows when scrolling */}
        <div
          className={`border-t bg-muted/50 overflow-hidden transition-all duration-300 ${
            hasScrolled ? "max-h-12 py-2" : "max-h-0 py-0"
          }`}
        >
          <div className="container mx-auto px-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("store.availablePoints")}:
              </span>
              <span className="font-bold">
                {pointsBalance.available_points} {t("store.points")}
              </span>
            </div>
            {totalPoints > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t("store.remaining")}:
                </span>
                <span className="font-bold text-muted-foreground">
                  {pointsBalance.available_points - totalPoints}{" "}
                  {t("store.points")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search and Store Items Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("store.availablePoints")}
            </p>
            <p className="text-xl font-bold">
              {pointsBalance.available_points} {t("store.points")}
            </p>
          </div>
          {totalPoints > 0 && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("store.cartTotal")}
                </p>
                <p className="text-xl font-bold text-primary">
                  -{totalPoints} {t("store.points")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t("store.remaining")}
                </p>
                <p className="text-xl font-bold text-muted-foreground">
                  {pointsBalance.available_points - totalPoints}{" "}
                  {t("store.points")}
                </p>
              </div>
            </>
          )}
        </div>
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("store.searchItems")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{t("store.noItems")}</p>
              <p className="text-sm text-muted-foreground">
                {t("store.noItemsDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const price = getItemPrice(item, userPriceTier);
              const basePrice = getBaseTierPrice(item, userPriceTier);
              const specialActive = isSpecialActive(item);
              const specialTimeLeft = specialActive ? getSpecialTimeLeftText(item) : null;
              const inCart = cart.has(item.id);
              const cartQuantity = cart.get(item.id)?.quantity || 0;
              const remainingPoints =
                pointsBalance.available_points - totalPoints;
              const canAfford = price <= remainingPoints;
              const pointsNeeded = price - remainingPoints;

              return (
                <Card key={item.id} className="flex flex-col pt-0">
                  {item.image_url && (
                    <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.description && (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold">{price}</p>
                          {specialActive && basePrice !== price && (
                            <p className="text-sm text-muted-foreground line-through">
                              {basePrice}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t("store.points")}
                        </p>
                        {specialTimeLeft && (
                          <p className="text-xs text-destructive mt-1">
                            {specialTimeLeft}
                          </p>
                        )}
                      </div>
                      {specialActive && (
                        <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                          {t("store.special")}
                        </span>
                      )}
                    </div>

                    {inCart ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, cartQuantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="flex-1 text-center font-medium">
                            {cartQuantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, cartQuantity + 1)
                            }
                            disabled={
                              (item.stock_type === "quantity" &&
                                cartQuantity >= item.stock_quantity) ||
                              !canAfford
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {!canAfford && (
                          <p className="text-xs text-center text-muted-foreground">
                            {t("store.needMorePoints", {
                              points: pointsNeeded,
                            })}
                          </p>
                        )}
                      </div>
                    ) : !canAfford ? (
                      <div className="space-y-2">
                        <Button disabled className="w-full" variant="secondary">
                          <Lock className="h-4 w-4 me-2" />
                          {`${t("store.locked")} - ${
                            pointsBalance.available_points
                          } ${t("store.points")}`}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={
                          item.stock_type === "quantity" &&
                          item.stock_quantity === 0
                        }
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 me-2" />
                        {t("store.addToCart")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button (FAB) */}
      <Button
        onClick={() => setIsCheckoutOpen(true)}
        disabled={cart.size === 0}
        size="lg"
        className="fixed bottom-6 end-6 z-50 h-14 w-14 rounded-full shadow-lg gap-0 p-0"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.size > 0 && (
          <span className="absolute -top-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
            {cart.size}
          </span>
        )}
      </Button>

      {/* Checkout Dialog */}
      <Dialog
        open={isCheckoutOpen}
        onOpenChange={(open) => {
          setIsCheckoutOpen(open);
          if (!open) setIsConfirming(false);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isConfirming ? t("store.confirmOrder") : t("store.checkout")}
            </DialogTitle>
            <DialogDescription>
              {isConfirming
                ? t("store.confirmOrderDescription")
                : t("store.reviewOrder")}
            </DialogDescription>
          </DialogHeader>

          {isConfirming ? (
            /* Confirmation View */
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("store.itemsCount")}
                  </span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("store.totalQuantity")}
                  </span>
                  <span className="font-medium">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                {orderNotes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      {t("store.orderNotes")}
                    </p>
                    <p className="text-sm mt-1">{orderNotes}</p>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t("store.total")}</span>
                  <span>
                    {totalPoints} {t("store.points")}
                  </span>
                </div>
              </div>
              {pointsBalance.available_points >= totalPoints && (
                <div className="text-sm text-foreground">
                  {t("store.remainingPoints", {
                    remaining: pointsBalance.available_points - totalPoints,
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Cart Edit View */
            <div className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((cartItem) => {
                  const price = getItemPrice(cartItem.item, cartItem.priceTier);
                  const basePrice = getBaseTierPrice(cartItem.item, cartItem.priceTier);
                  const specialActive = isSpecialActive(cartItem.item);
                  const total = price * cartItem.quantity;
                  const remainingPoints =
                    pointsBalance.available_points - totalPoints;
                  const canAddMore = price <= remainingPoints;
                  const pointsNeededForMore = price - remainingPoints;

                  return (
                    <div
                      key={cartItem.item.id}
                      className="flex items-center gap-4 p-3 border rounded-lg flex-col"
                    >
                      <div className="flex justify-between w-full items-start gap-4">
                        {cartItem.item.image_url && (
                          <img
                            src={cartItem.item.image_url}
                            alt={cartItem.item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {cartItem.item.name}
                          </p>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>
                              {price} {t("store.points")}
                            </span>
                            {specialActive && basePrice !== price && (
                              <span className="line-through">
                                {basePrice} {t("store.points")}
                              </span>
                            )}
                            {specialActive && (
                              <span className="text-destructive font-medium">
                                {t("store.special")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between w-full items-baseline">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                cartItem.item.id,
                                cartItem.quantity - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {cartItem.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(
                                cartItem.item.id,
                                cartItem.quantity + 1
                              )
                            }
                            disabled={
                              (cartItem.item.stock_type === "quantity" &&
                                cartItem.quantity >=
                                  cartItem.item.stock_quantity) ||
                              !canAddMore
                            }
                            title={
                              !canAddMore
                                ? t("store.needMorePoints", {
                                    points: pointsNeededForMore,
                                  })
                                : undefined
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(cartItem.item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-bold text-end min-w-[80px]">
                          {total} {t("store.points")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Notes */}
              <div className="space-y-2">
                <Label>{t("store.orderNotes")}</Label>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={t("store.orderNotesPlaceholder")}
                  rows={3}
                />
              </div>

              {/* Total */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>{t("store.total")}</span>
                  <span>
                    {totalPoints} {t("store.points")}
                  </span>
                </div>
                {pointsBalance.available_points < totalPoints && (
                  <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">
                    {t("store.insufficientPointsWarning", {
                      available: pointsBalance.available_points,
                      required: totalPoints,
                      shortfall: totalPoints - pointsBalance.available_points,
                    })}
                  </div>
                )}
                {pointsBalance.available_points >= totalPoints && (
                  <div className="text-sm text-muted-foreground">
                    {t("store.remainingPoints", {
                      remaining: pointsBalance.available_points - totalPoints,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {isConfirming ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsConfirming(false)}
                >
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleCheckout}
                  disabled={
                    isSubmitting || pointsBalance.available_points < totalPoints
                  }
                >
                  {isSubmitting
                    ? t("common.submitting")
                    : t("store.confirmAndPlace")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() => setIsConfirming(true)}
                  disabled={
                    cart.size === 0 ||
                    pointsBalance.available_points < totalPoints
                  }
                >
                  {t("store.placeOrder")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

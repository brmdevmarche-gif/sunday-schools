"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { StoreItem, PriceTier } from "@/lib/types";
import { createOrderAction } from "../admin/store/orders/actions";

interface CartItem {
  item: StoreItem;
  quantity: number;
  priceTier: PriceTier;
}

interface StoreClientProps {
  items: StoreItem[];
  userProfile: any;
  userClassIds: string[];
}

export default function StoreClient({
  items,
  userProfile,
  userClassIds,
}: StoreClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function getItemPrice(item: StoreItem, tier: PriceTier): number {
    switch (tier) {
      case "mastor":
        return item.price_mastor;
      case "botl":
        return item.price_botl;
      default:
        return item.price_normal;
    }
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
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || t("store.orderFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const cartItems = Array.from(cart.values());
  const totalPoints = calculateTotal();

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t("store.title")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("store.description")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/store/orders")}
              >
                {t("store.myOrders")}
              </Button>
              <Button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.size === 0}
                className="gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {t("store.cart")} ({cart.size})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Store Items Grid */}
      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
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
            {items.map((item) => {
              const price = getItemPrice(item, userPriceTier);
              const inCart = cart.has(item.id);
              const cartQuantity = cart.get(item.id)?.quantity || 0;

              return (
                <Card key={item.id} className="flex flex-col">
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
                        <p className="text-2xl font-bold">{price}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("store.points")}
                        </p>
                      </div>
                      {item.stock_type === "quantity" && (
                        <Badge variant="secondary">
                          {item.stock_quantity} {t("store.inStock")}
                        </Badge>
                      )}
                    </div>

                    {inCart ? (
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
                            item.stock_type === "quantity" &&
                            cartQuantity >= item.stock_quantity
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
                    ) : (
                      <Button
                        onClick={() => addToCart(item)}
                        disabled={
                          item.stock_type === "quantity" &&
                          item.stock_quantity === 0
                        }
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
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

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("store.checkout")}</DialogTitle>
            <DialogDescription>{t("store.reviewOrder")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((cartItem) => {
                const price = getItemPrice(cartItem.item, cartItem.priceTier);
                const total = price * cartItem.quantity;

                return (
                  <div
                    key={cartItem.item.id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    {cartItem.item.image_url && (
                      <img
                        src={cartItem.item.image_url}
                        alt={cartItem.item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{cartItem.item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {price} {t("store.points")} × {cartItem.quantity}
                      </p>
                    </div>
                    <p className="font-bold">
                      {total} {t("store.points")}
                    </p>
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
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>{t("store.total")}</span>
                <span>
                  {totalPoints} {t("store.points")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCheckout} disabled={isSubmitting}>
              {isSubmitting ? t("common.submitting") : t("store.placeOrder")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

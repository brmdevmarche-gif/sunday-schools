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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Package, Search, Plus, Minus, Trash2, AlertTriangle, Coins } from "lucide-react";
import {
  searchStudentsForOrderAction,
  createOrderForStudentAction,
} from "../actions";
import { getStudentPointsBalanceAction } from "@/app/admin/points/actions";

interface StudentSearchResult {
  id: string;
  full_name: string | null;
  email: string;
  user_code: string | null;
  price_tier: string | null;
}

interface StoreItemForOrder {
  id: string;
  name: string;
  image_url: string | null;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  stock_quantity: number;
  stock_type: string;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
  email?: string;
  church_id?: string | null;
  diocese_id?: string | null;
}

interface CreateOrderForStudentClientProps {
  storeItems: StoreItemForOrder[];
  userProfile: UserProfile;
}

export default function CreateOrderForStudentClient({
  storeItems,
  userProfile,
}: CreateOrderForStudentClientProps) {
  const t = useTranslations();
  const router = useRouter();

  // Student search state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<
    StudentSearchResult[]
  >([]);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentSearchResult | null>(null);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentBalance, setStudentBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Order state
  const [orderItems, setOrderItems] = useState<
    { item: StoreItemForOrder; quantity: number }[]
  >([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Search students
  async function handleSearchStudents(query: string) {
    setStudentSearchQuery(query);
    if (query.length < 2) {
      setStudentSearchResults([]);
      return;
    }

    setIsSearchingStudents(true);
    try {
      const result = await searchStudentsForOrderAction(query);
      setStudentSearchResults(result.data);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error(t("store.searchStudentsFailed"));
    } finally {
      setIsSearchingStudents(false);
    }
  }

  // Fetch student balance when selected
  async function fetchStudentBalance(studentId: string) {
    setIsLoadingBalance(true);
    try {
      const balance = await getStudentPointsBalanceAction(studentId);
      setStudentBalance(balance?.available_points ?? 0);
    } catch (error) {
      console.error("Error fetching student balance:", error);
      setStudentBalance(0);
    } finally {
      setIsLoadingBalance(false);
    }
  }

  // Handle student selection
  async function handleSelectStudent(student: StudentSearchResult) {
    setSelectedStudent(student);
    setStudentSearchQuery("");
    setStudentSearchResults([]);
    await fetchStudentBalance(student.id);
  }

  // Handle clearing student selection
  function handleClearStudent() {
    setSelectedStudent(null);
    setStudentBalance(null);
    setOrderItems([]);
  }

  // Check if order exceeds available points
  const orderTotal = calculateOrderTotal();
  const hasInsufficientPoints = studentBalance !== null && orderTotal > studentBalance;

  // Filter store items based on search
  const filteredStoreItems = storeItems.filter(
    (item) =>
      item.is_active &&
      item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  // Calculate order total based on student's price tier
  function calculateOrderTotal() {
    if (!selectedStudent) return 0;
    const tier = selectedStudent.price_tier || "normal";
    return orderItems.reduce((total, { item, quantity }) => {
      const price =
        tier === "mastor"
          ? item.price_mastor
          : tier === "botl"
          ? item.price_botl
          : item.price_normal;
      return total + price * quantity;
    }, 0);
  }

  // Get price for item based on student's tier
  function getItemPrice(item: StoreItemForOrder) {
    if (!selectedStudent) return item.price_normal;
    const tier = selectedStudent.price_tier || "normal";
    return tier === "mastor"
      ? item.price_mastor
      : tier === "botl"
      ? item.price_botl
      : item.price_normal;
  }

  // Add item to order
  function addItemToOrder(item: StoreItemForOrder) {
    const existing = orderItems.find((oi) => oi.item.id === item.id);
    if (existing) {
      setOrderItems(
        orderItems.map((oi) =>
          oi.item.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi
        )
      );
    } else {
      setOrderItems([...orderItems, { item, quantity: 1 }]);
    }
  }

  // Update item quantity
  function updateItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter((oi) => oi.item.id !== itemId));
    } else {
      setOrderItems(
        orderItems.map((oi) =>
          oi.item.id === itemId ? { ...oi, quantity } : oi
        )
      );
    }
  }

  // Remove item from order
  function removeItem(itemId: string) {
    setOrderItems(orderItems.filter((oi) => oi.item.id !== itemId));
  }

  // Create order for student
  async function handleCreateOrder() {
    if (!selectedStudent || orderItems.length === 0) {
      toast.error(t("store.selectStudentAndItems"));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createOrderForStudentAction({
        student_id: selectedStudent.id,
        items: orderItems.map(({ item, quantity }) => ({
          store_item_id: item.id,
          quantity,
        })),
        notes: orderNotes,
      });

      toast.success(
        t("store.orderCreatedForStudent", { points: result.total_points })
      );
      router.push("/admin/store/orders");
    } catch (error) {
      console.error("Error creating order for student:", error);
      toast.error(error instanceof Error ? error.message : t("store.createOrderFailed"));
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin/store/orders")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {t("store.createOrderForStudent")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("store.createOrderForStudentDescription")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Selection & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Student */}
            <Card>
              <CardHeader>
                <CardTitle>{t("store.step1SelectStudent")}</CardTitle>
                <CardDescription>
                  {t("store.searchStudentDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStudent ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                    <div className="flex-1">
                      <p className="font-medium">
                        {selectedStudent.full_name || selectedStudent.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.user_code &&
                          `ID: ${selectedStudent.user_code} • `}
                        {selectedStudent.email}
                        {selectedStudent.price_tier &&
                          ` • ${t(`store.tier.${selectedStudent.price_tier}`)}`}
                      </p>
                      {/* Display points balance */}
                      <div className="flex items-center gap-2 mt-2">
                        <Coins className="h-4 w-4 text-amber-500" />
                        {isLoadingBalance ? (
                          <span className="text-sm text-muted-foreground">
                            {t("common.loading")}...
                          </span>
                        ) : (
                          <span className="text-sm font-medium">
                            {t("store.availablePoints")}: {studentBalance ?? 0} {t("store.points")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearStudent}
                    >
                      {t("common.change")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("store.searchStudentPlaceholder")}
                        value={studentSearchQuery}
                        onChange={(e) => handleSearchStudents(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {isSearchingStudents && (
                      <p className="text-sm text-muted-foreground">
                        {t("common.searching")}...
                      </p>
                    )}
                    {studentSearchResults.length > 0 && (
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {studentSearchResults.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-muted border-b last:border-b-0"
                            onClick={() => handleSelectStudent(student)}
                          >
                            <p className="font-medium">
                              {student.full_name || student.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.user_code &&
                                `ID: ${student.user_code} • `}
                              {student.email}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Select Items */}
            <Card>
              <CardHeader>
                <CardTitle>{t("store.step2SelectItems")}</CardTitle>
                <CardDescription>
                  {t("store.selectItemsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Item Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("store.searchItems")}
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Available Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredStoreItems.length === 0 ? (
                    <p className="col-span-2 text-center text-muted-foreground py-8">
                      {t("store.noItemsAvailable")}
                    </p>
                  ) : (
                    filteredStoreItems.map((item) => {
                      const price = getItemPrice(item);
                      const inCart = orderItems.some(
                        (oi) => oi.item.id === item.id
                      );
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`text-left p-3 border rounded-lg hover:bg-muted flex items-center gap-3 transition-colors ${
                            inCart ? "border-primary bg-primary/5" : ""
                          }`}
                          onClick={() => addItemToOrder(item)}
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {price} {t("store.points")}
                            </p>
                          </div>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </button>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card>
              <CardHeader>
                <CardTitle>{t("store.orderNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={t("store.orderNotesPlaceholder")}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>{t("store.orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t("store.noItemsSelected")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map(({ item, quantity }) => {
                      const price = getItemPrice(item);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 border rounded-lg"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {price} × {quantity} = {price * quantity}{" "}
                              {t("store.points")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateItemQuantity(item.id, quantity - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateItemQuantity(item.id, quantity + 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>{t("store.total")}</span>
                    <span>
                      {orderTotal} {t("store.points")}
                    </span>
                  </div>
                  {/* Available points */}
                  {selectedStudent && studentBalance !== null && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">{t("store.availablePoints")}</span>
                      <span className={hasInsufficientPoints ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {studentBalance} {t("store.points")}
                      </span>
                    </div>
                  )}
                  {/* Insufficient points warning */}
                  {hasInsufficientPoints && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive">
                        {t("store.insufficientPoints", {
                          required: orderTotal,
                          available: studentBalance
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full"
                    onClick={handleCreateOrder}
                    disabled={
                      isProcessing ||
                      !selectedStudent ||
                      orderItems.length === 0 ||
                      hasInsufficientPoints
                    }
                  >
                    {isProcessing
                      ? t("common.creating")
                      : t("store.createOrder")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/admin/store/orders")}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

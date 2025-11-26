"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingCart,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Wallet,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import { useStudentStore } from "@/hooks/useStudentStore";

interface StudentStoreProps {
  studentId: number;
  classId: number;
}

export function StudentStore({ studentId, classId }: StudentStoreProps) {
  const {
    stores,
    storeItems,
    studentOrders,
    selectedStore,
    searchTerm,
    categoryFilter,
    loading,
    error,
    orderDialogOpen,
    selectedItem,
    orderQuantity,
    orderNotes,
    paymentMethod,
    studentWallet,
    filteredItems,
    categories,
    setSelectedStore,
    setSearchTerm,
    setCategoryFilter,
    setOrderDialogOpen,
    setSelectedItem,
    setOrderQuantity,
    setOrderNotes,
    setPaymentMethod,
    handleOrderSubmit,
    getStatusColor,
  } = useStudentStore(studentId, classId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "purchased":
        return <Package className="h-4 w-4 text-green-500" />;
      case "ready":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "collected":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading stores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Stores Available
              </h3>
              <p className="text-gray-500">
                No stores are currently assigned to your class.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with wallet info */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Class Store</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">
              Points:{" "}
              <span className="font-semibold text-blue-600">
                {studentWallet.points}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">
              Cash:{" "}
              <span className="font-semibold text-green-600">
                ${studentWallet.cash}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Items</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Store selection */}
          {stores.length > 1 && (
            <div className="flex space-x-4">
              {stores.map((store) => (
                <SimpleButton
                  key={store.id}
                  variant={
                    selectedStore?.id === store.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedStore(store)}
                >
                  {store.name}
                </SimpleButton>
              ))}
            </div>
          )}

          {/* Search and filters */}
          <div className="flex space-x-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category || ""}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100 relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {item.stock_quantity <= 10 && (
                    <Badge className="absolute top-2 right-2 bg-orange-500">
                      Low Stock: {item.stock_quantity}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <div className="space-y-1">
                      {item.price_points && (
                        <div className="text-sm">
                          <span className="text-blue-600 font-semibold">
                            {item.price_points} points
                          </span>
                        </div>
                      )}
                      {item.price_cash && (
                        <div className="text-sm">
                          <span className="text-green-600 font-semibold">
                            ${item.price_cash}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.category && (
                      <Badge variant="secondary">{item.category}</Badge>
                    )}
                  </div>
                  <Dialog
                    open={orderDialogOpen && selectedItem?.id === item.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setOrderDialogOpen(false);
                        setSelectedItem(null);
                      }
                    }}
                  >
                    <SimpleDialogTrigger
                      className="w-full"
                      onClick={() => {
                        setSelectedItem(item);
                        setOrderDialogOpen(true);
                        setPaymentMethod(
                          item.price_points && item.price_points > 0
                            ? "points"
                            : "cash"
                        );
                      }}
                      disabled={item.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {item.stock_quantity === 0
                        ? "Out of Stock"
                        : "Order Item"}
                    </SimpleDialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Order {item.name}</DialogTitle>
                        <DialogDescription>
                          {item.requires_approval
                            ? "This item requires approval from the store manager."
                            : "Your order will be processed immediately."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={item.stock_quantity}
                            value={orderQuantity}
                            onChange={(e) =>
                              setOrderQuantity(parseInt(e.target.value) || 1)
                            }
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Available: {item.stock_quantity}
                          </p>
                        </div>
                        {item.price_points && item.price_cash && (
                          <div>
                            <Label>Payment Method</Label>
                            <Select
                              value={paymentMethod}
                              onValueChange={(value: "points" | "cash") =>
                                setPaymentMethod(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="points">
                                  Points (
                                  {(item.price_points || 0) * orderQuantity}{" "}
                                  points)
                                </SelectItem>
                                <SelectItem value="cash">
                                  Cash ($
                                  {(
                                    (item.price_cash || 0) * orderQuantity
                                  ).toFixed(2)}
                                  )
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any special instructions..."
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                          />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Total:</span>
                              <span className="font-semibold">
                                {paymentMethod === "points"
                                  ? `${
                                      (item.price_points || 0) * orderQuantity
                                    } points`
                                  : `$${(
                                      (item.price_cash || 0) * orderQuantity
                                    ).toFixed(2)}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Your Balance:</span>
                              <span
                                className={
                                  (
                                    paymentMethod === "points"
                                      ? (item.price_points || 0) *
                                          orderQuantity >
                                        studentWallet.points
                                      : (item.price_cash || 0) * orderQuantity >
                                        studentWallet.cash
                                  )
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {paymentMethod === "points"
                                  ? `${studentWallet.points} points`
                                  : `$${studentWallet.cash.toFixed(2)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <SimpleButton
                          variant="outline"
                          onClick={() => {
                            setOrderDialogOpen(false);
                            setSelectedItem(null);
                          }}
                        >
                          Cancel
                        </SimpleButton>
                        <SimpleButton
                          onClick={handleOrderSubmit}
                          disabled={
                            orderQuantity > item.stock_quantity ||
                            (paymentMethod === "points" &&
                              (item.price_points || 0) * orderQuantity >
                                studentWallet.points) ||
                            (paymentMethod === "cash" &&
                              (item.price_cash || 0) * orderQuantity >
                                studentWallet.cash)
                          }
                        >
                          {item.requires_approval
                            ? "Submit for Approval"
                            : "Order Now"}
                        </SimpleButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="space-y-4">
            {studentOrders.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-gray-500">
                      Start browsing items to place your first order!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              studentOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">
                            {(order as any).store_items?.name}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.status)}
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Quantity: {order.quantity}</p>
                          <p>
                            Total:{" "}
                            {order.payment_method === "points"
                              ? `${order.total_points} points`
                              : `$${order.total_cash?.toFixed(2)}`}
                          </p>
                          {order.notes && <p>Notes: {order.notes}</p>}
                          <p>
                            Ordered:{" "}
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {(order as any).store_items?.image_url && (
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden ml-4">
                          <img
                            src={(order as any).store_items.image_url}
                            alt={(order as any).store_items.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

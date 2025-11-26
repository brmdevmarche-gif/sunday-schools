"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
import { SimpleSimpleDialogTrigger } from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Star, 
  User,
  Calendar,
  MessageSquare,
  DollarSign,
  Coins
} from "lucide-react";
import { useOrderManagement } from "@/hooks/useOrderManagement";

interface OrderManagementProps {
  managerId: number;
}

export function OrderManagement({ managerId }: OrderManagementProps) {
  const {
    orders,
    stores,
    selectedStore,
    loading,
    error,
    actionDialogOpen,
    selectedOrder,
    actionType,
    actionNotes,
    setSelectedStore,
    setActionDialogOpen,
    setSelectedOrder,
    setActionType,
    setActionNotes,
    handleOrderAction,
    filterOrdersByStatus,
    getStatusColor,
    getAvailableActions
  } = useOrderManagement(managerId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'purchased': return <Package className="h-4 w-4 text-green-500" />
      case 'ready': return <Star className="h-4 w-4 text-purple-500" />
      case 'collected': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading orders...</div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stores Assigned</h3>
              <p className="text-gray-500">You are not assigned as a manager for any stores.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">Store Manager</span>
        </div>
      </div>

      {/* Store selection */}
      {stores.length > 1 && (
        <div className="flex space-x-4">
          {stores.map((store) => (
            <SimpleButton
              key={store.id}
              variant={selectedStore?.id === store.id ? "default" : "outline"}
              onClick={() => setSelectedStore(store)}
            >
              {store.name}
            </SimpleButton>
          ))}
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            Pending ({filterOrdersByStatus('pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({filterOrdersByStatus('approved').length})
          </TabsTrigger>
          <TabsTrigger value="purchased">
            Purchased ({filterOrdersByStatus('purchased').length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({filterOrdersByStatus('ready').length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'purchased', 'ready', 'all'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {(status === 'all' ? orders : filterOrdersByStatus(status)).map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{order.store_items?.name}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>
                              {order.students?.first_name} {order.students?.last_name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span>Quantity: {order.quantity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {order.payment_method === 'points' ? (
                              <Coins className="h-4 w-4 text-blue-500" />
                            ) : (
                              <DollarSign className="h-4 w-4 text-green-500" />
                            )}
                            <span>
                              Total: {order.payment_method === 'points' 
                                ? `${order.total_points} points`
                                : `$${order.total_cash?.toFixed(2)}`
                              }
                            </span>
                          </div>
                          {order.notes && (
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="text-gray-600">{order.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2 pt-2">
                        {getAvailableActions(order.status).map((action) => (
                          <Dialog 
                            key={action.type} 
                            open={actionDialogOpen && selectedOrder?.id === order.id && actionType === action.type} 
                            onOpenChange={(open) => {
                              if (!open) {
                                setActionDialogOpen(false)
                                setSelectedOrder(null)
                              }
                            }}
                          >
                            <SimpleDialogTrigger>
                              <SimpleButton
                                variant={action.variant}
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setActionType(action.type)
                                  setActionDialogOpen(true)
                                }}
                              >
                                {action.label}
                              </SimpleButton>
                            </SimpleDialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{action.label}</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to {action.label.toLowerCase()} for {order.store_items?.name}?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-md">
                                  <div className="text-sm space-y-1">
                                    <div><strong>Student:</strong> {order.students?.first_name} {order.students?.last_name}</div>
                                    <div><strong>Item:</strong> {order.store_items?.name}</div>
                                    <div><strong>Quantity:</strong> {order.quantity}</div>
                                    <div><strong>Total:</strong> {order.payment_method === 'points' 
                                      ? `${order.total_points} points`
                                      : `$${order.total_cash?.toFixed(2)}`
                                    }</div>
                                  </div>
                                </div>
                                {action.type === 'reject' && (
                                  <div>
                                    <Label htmlFor="notes">Reason for rejection (optional)</Label>
                                    <Textarea
                                      id="notes"
                                      placeholder="Provide a reason for rejecting this order..."
                                      value={actionNotes}
                                      onChange={(e) => setActionNotes(e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <SimpleButton
                                  variant="outline"
                                  onClick={() => {
                                    setActionDialogOpen(false)
                                    setSelectedOrder(null)
                                  }}
                                >
                                  Cancel
                                </SimpleButton>
                                <SimpleButton 
                                  variant={action.variant}
                                  onClick={handleOrderAction}
                                >
                                  Confirm {action.label}
                                </SimpleButton>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </div>
                    </div>

                    {/* Item image */}
                    {order.store_items?.image_url && (
                      <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden ml-4">
                        <img
                          src={order.store_items.image_url}
                          alt={order.store_items.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(status === 'all' ? orders : filterOrdersByStatus(status)).length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {status === 'all' ? '' : status} Orders
                    </h3>
                    <p className="text-gray-500">
                      {status === 'all' 
                        ? 'No orders have been placed yet.'
                        : `No orders with ${status} status.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
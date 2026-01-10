"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Bus,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  History,
  AlertCircle,
  ChevronRight,
  Backpack,
  Car,
} from "lucide-react";
import { toast } from "sonner";
import { approveTripParticipationAction } from "../actions";
import type { PendingApproval, ApprovalHistoryItem } from "@/lib/types";

interface ApprovalsClientProps {
  pendingApprovals: PendingApproval[];
  approvalHistory: ApprovalHistoryItem[];
}

export function ApprovalsClient({
  pendingApprovals,
  approvalHistory,
}: ApprovalsClientProps) {
  const t = useTranslations("parents.approvals");
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === "ar";

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    approval: PendingApproval | null;
    action: "approve" | "reject";
  }>({ open: false, approval: null, action: "approve" });
  const [notes, setNotes] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
  };

  const handleAction = async () => {
    if (!dialogState.approval) return;

    setProcessingId(dialogState.approval.id);
    setDialogState((prev) => ({ ...prev, open: false }));

    const result = await approveTripParticipationAction({
      participant_id: dialogState.approval.id,
      approved: dialogState.action === "approve",
      notes: notes || undefined,
    });

    if (result.success) {
      toast.success(
        dialogState.action === "approve"
          ? t("approvedSuccess")
          : t("rejectedSuccess")
      );
      router.refresh();
    } else {
      toast.error(result.error || t("approvalFailed"));
    }

    setProcessingId(null);
    setNotes("");
    setSelectedApproval(null);
  };

  const openDialog = (approval: PendingApproval, action: "approve" | "reject") => {
    setDialogState({ open: true, approval, action });
    setNotes("");
  };

  const getTripName = (approval: PendingApproval) => {
    return isRTL && approval.trip_name_ar ? approval.trip_name_ar : approval.trip_name;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            {t("title")}
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            {t("history")}
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                  <p className="font-medium">{t("noApprovals")}</p>
                  <p className="text-sm mt-1">{t("noApprovalsDescription")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <Card
                  key={approval.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedApproval(approval)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Child Avatar */}
                      <OptimizedAvatar
                        src={approval.child_avatar}
                        alt={approval.child_name}
                        fallback={approval.child_name.charAt(0)}
                        size="md"
                      />

                      {/* Trip Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">
                            {getTripName(approval)}
                          </span>
                          {approval.price > 0 && (
                            <Badge variant="secondary">{approval.price} EGP</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Bus className="h-3.5 w-3.5" />
                            {approval.child_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatShortDate(approval.start_date)}
                            {approval.end_date !== approval.start_date && (
                              <> - {formatShortDate(approval.end_date)}</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className={`h-5 w-5 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {approvalHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No approval history yet</p>
                  <p className="text-sm mt-1">Your past decisions will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {approvalHistory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          item.approved
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {item.approved ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.trip_name}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span>{item.child_name}</span>
                          <span>
                            {item.approved ? t("approvedAt") : t("rejectedAt")}:{" "}
                            {formatShortDate(item.approved_at)}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <Badge variant={item.approved ? "default" : "destructive"}>
                        {item.approved ? t("approve") : t("reject")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Trip Details Sheet */}
      <Sheet open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <SheetContent side={isRTL ? "left" : "right"} className="w-full sm:max-w-lg overflow-y-auto">
          {selectedApproval && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  {getTripName(selectedApproval)}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {/* Child Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <OptimizedAvatar
                    src={selectedApproval.child_avatar}
                    alt={selectedApproval.child_name}
                    fallback={selectedApproval.child_name.charAt(0)}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{selectedApproval.child_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered {formatDate(selectedApproval.registered_at)}
                    </p>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="space-y-4">
                  {/* Dates */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{t("dates")}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedApproval.start_date)}
                        {selectedApproval.end_date !== selectedApproval.start_date && (
                          <> - {formatDate(selectedApproval.end_date)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  {selectedApproval.price > 0 && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{t("price")}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedApproval.price} EGP
                          {selectedApproval.price_tier !== "normal" && (
                            <Badge variant="outline" className="ml-2">
                              {selectedApproval.price_tier}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Destinations */}
                  {selectedApproval.destinations && selectedApproval.destinations.length > 0 && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Destinations</p>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          {selectedApproval.destinations.map((dest, idx) => (
                            <li key={idx}>
                              {dest.name}
                              {dest.description && (
                                <span className="text-muted-foreground/70">
                                  {" "}- {dest.description}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Transportation */}
                  {selectedApproval.transportation_details && (
                    <div className="flex items-start gap-3">
                      <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Transportation</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedApproval.transportation_details}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* What to Bring */}
                  {selectedApproval.what_to_bring && (
                    <div className="flex items-start gap-3">
                      <Backpack className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">What to Bring</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {selectedApproval.what_to_bring}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedApproval.trip_description && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm">{selectedApproval.trip_description}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => openDialog(selectedApproval, "reject")}
                    disabled={processingId === selectedApproval.id}
                  >
                    {processingId === selectedApproval.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        {t("reject")}
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => openDialog(selectedApproval, "approve")}
                    disabled={processingId === selectedApproval.id}
                  >
                    {processingId === selectedApproval.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t("approve")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogState.action === "approve"
                ? t("confirmApprove")
                : t("confirmReject")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.action === "approve"
                ? t("confirmApproveDescription")
                : t("confirmRejectDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium">{t("addNotes")}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="mt-2"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                dialogState.action === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {dialogState.action === "approve" ? t("approve") : t("reject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

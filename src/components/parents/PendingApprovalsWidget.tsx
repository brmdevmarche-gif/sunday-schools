"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Bus,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { approveTripParticipationAction } from "@/app/dashboard/parents/actions";
import type { PendingApproval } from "@/lib/types";

interface PendingApprovalsWidgetProps {
  approvals: PendingApproval[];
  compact?: boolean;
}

export function PendingApprovalsWidget({
  approvals,
  compact = false,
}: PendingApprovalsWidgetProps) {
  const t = useTranslations("parents.approvals");
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    approval: PendingApproval | null;
    action: "approve" | "reject";
  }>({ open: false, approval: null, action: "approve" });
  const [notes, setNotes] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
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
  };

  const openDialog = (approval: PendingApproval, action: "approve" | "reject") => {
    setDialogState({ open: true, approval, action });
    setNotes("");
  };

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
            <p className="font-medium">{t("noApprovals")}</p>
            <p className="text-sm mt-1">{t("noApprovalsDescription")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayApprovals = compact ? approvals.slice(0, 3) : approvals;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("title")}
              <Badge variant="destructive" className="ml-2">
                {approvals.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayApprovals.map((approval) => (
            <div
              key={approval.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-card"
            >
              {/* Trip Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Bus className="h-4 w-4 text-blue-500" />
                  <span className="font-medium truncate">
                    {approval.trip_name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {approval.child_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(approval.start_date)}
                    {approval.end_date &&
                      approval.end_date !== approval.start_date && (
                        <> - {formatDate(approval.end_date)}</>
                      )}
                  </span>
                  {approval.price > 0 && (
                    <Badge variant="secondary">{approval.price} EGP</Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => openDialog(approval, "reject")}
                  disabled={processingId === approval.id}
                >
                  {processingId === approval.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("reject")}
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => openDialog(approval, "approve")}
                  disabled={processingId === approval.id}
                >
                  {processingId === approval.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t("approve")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {compact && approvals.length > 3 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/dashboard/parents/approvals")}
            >
              {t("viewHistory")} ({approvals.length - 3} more)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={dialogState.open}
        onOpenChange={(open: boolean) =>
          setDialogState((prev) => ({ ...prev, open }))
        }
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
            <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
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
    </>
  );
}

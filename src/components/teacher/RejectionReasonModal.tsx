"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface RejectionReasonModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onOpenChange: (open: boolean) => void;
  /** Called when rejection is confirmed with reason */
  onConfirm: (reason: string) => Promise<void>;
  /** Title of the request being rejected */
  requestTitle?: string;
  /** Student name */
  studentName?: string;
}

const predefinedReasons = [
  "capacity_full",
  "age_requirement",
  "missing_documents",
  "schedule_conflict",
  "other",
] as const;

type PredefinedReason = (typeof predefinedReasons)[number];

/**
 * RejectionReasonModal - Modal for selecting rejection reason.
 * Used when rejecting trip requests or other approvals.
 */
function RejectionReasonModal({
  open,
  onOpenChange,
  onConfirm,
  requestTitle,
  studentName,
}: RejectionReasonModalProps) {
  const t = useTranslations("teacher.actionRequired");
  const [selectedReason, setSelectedReason] = React.useState<PredefinedReason | "">("");
  const [customReason, setCustomReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    const reason = selectedReason === "other" ? customReason : selectedReason;
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      // Reset state
      setSelectedReason("");
      setCustomReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error confirming rejection:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    onOpenChange(false);
  };

  const isValid = selectedReason && (selectedReason !== "other" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rejectRequest")}</DialogTitle>
          <DialogDescription>
            {studentName && requestTitle
              ? t("rejectConfirmation", { student: studentName, request: requestTitle })
              : t("rejectDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("selectReason")}</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setSelectedReason(value as PredefinedReason)}
              className="space-y-2"
            >
              {predefinedReasons.map((reason) => (
                <div
                  key={reason}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg border p-3 transition-colors",
                    selectedReason === reason
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={reason} id={reason} />
                  <Label
                    htmlFor={reason}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    {t(`reasons.${reason}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom reason textarea */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                {t("customReason")}
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t("customReasonPlaceholder")}
                className="min-h-20 resize-none"
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("rejecting")}
              </>
            ) : (
              t("confirmReject")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { RejectionReasonModal, predefinedReasons };

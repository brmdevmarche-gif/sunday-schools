"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Coins, Plus, Minus, Loader2 } from "lucide-react";
import { teacherAdjustPointsAction } from "@/app/admin/points/actions";

interface PointsAdjustmentDialogProps {
  studentId: string;
  studentName: string;
  currentPoints?: number;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function PointsAdjustmentDialog({
  studentId,
  studentName,
  currentPoints,
  onSuccess,
  trigger,
}: PointsAdjustmentDialogProps) {
  const t = useTranslations("points");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "deduct">("add");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!points || parseInt(points) <= 0) {
      toast.error("Please enter a valid points amount");
      return;
    }

    if (!note || note.trim().length < 3) {
      toast.error("Please enter a note for this adjustment");
      return;
    }

    setLoading(true);
    try {
      const pointsValue = adjustmentType === "add"
        ? parseInt(points)
        : -parseInt(points);

      await teacherAdjustPointsAction(studentId, pointsValue, note.trim());

      toast.success(t("pointsAdjusted"));
      setOpen(false);
      setPoints("");
      setNote("");
      setAdjustmentType("add");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to adjust points:", error);
      if (error instanceof Error) {
        if (error.message.includes("maximum limit")) {
          toast.error(t("maxAdjustmentExceeded"));
        } else if (error.message.includes("Insufficient")) {
          toast.error(t("insufficientPoints"));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(t("adjustFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Coins className="h-4 w-4" />
            {t("adjustPoints")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            {t("adjustPoints")}
          </DialogTitle>
          <DialogDescription>
            {t("adjustPointsDescription")} - <strong>{studentName}</strong>
            {currentPoints !== undefined && (
              <span className="block mt-1">
                Current balance: <strong>{currentPoints}</strong> points
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(v: string) => setAdjustmentType(v as "add" | "deduct")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                  <Plus className="h-4 w-4 text-green-500" />
                  {t("addPoints")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deduct" id="deduct" />
                <Label htmlFor="deduct" className="flex items-center gap-1 cursor-pointer">
                  <Minus className="h-4 w-4 text-red-500" />
                  {t("deductPoints")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Points Amount */}
          <div className="space-y-2">
            <Label htmlFor="points">{t("pointsAmount")}</Label>
            <Input
              id="points"
              type="number"
              min="1"
              max="1000"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="10"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">{t("note")} *</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !points || !note}
            className={adjustmentType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {adjustmentType === "add" ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                {t("addPoints")} ({points || 0})
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 mr-1" />
                {t("deductPoints")} ({points || 0})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

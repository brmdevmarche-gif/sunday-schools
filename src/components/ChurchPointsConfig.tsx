"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Settings, Loader2, Calendar, Bus, UserCheck } from "lucide-react";
import { normalizeNonNegativeIntInput, toNonNegativeInt } from "@/lib/utils";
import {
  getChurchPointsConfigAction,
  upsertChurchPointsConfigAction,
} from "@/app/admin/points/actions";
import type { ChurchPointsConfig, ChurchPointsConfigFormData } from "@/lib/types";

interface ChurchPointsConfigProps {
  churchId: string;
  churchName?: string;
}

export default function ChurchPointsConfigComponent({
  churchId,
  churchName,
}: ChurchPointsConfigProps) {
  const t = useTranslations("points");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ChurchPointsConfigFormData>({
    attendance_points_present: 10,
    attendance_points_late: 5,
    attendance_points_excused: 0,
    attendance_points_absent: 0,
    trip_participation_points: 20,
    max_teacher_adjustment: 50,
    is_attendance_points_enabled: true,
    is_trip_points_enabled: true,
    is_teacher_adjustment_enabled: true,
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await getChurchPointsConfigAction(churchId);
        if (data) {
          setConfig({
            attendance_points_present: data.attendance_points_present,
            attendance_points_late: data.attendance_points_late,
            attendance_points_excused: data.attendance_points_excused,
            attendance_points_absent: data.attendance_points_absent,
            trip_participation_points: data.trip_participation_points,
            max_teacher_adjustment: data.max_teacher_adjustment,
            is_attendance_points_enabled: data.is_attendance_points_enabled,
            is_trip_points_enabled: data.is_trip_points_enabled,
            is_teacher_adjustment_enabled: data.is_teacher_adjustment_enabled,
          });
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [churchId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertChurchPointsConfigAction(churchId, config);
      toast.success(t("configSaved"));
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error(t("configSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("churchConfig")}
          {churchName && <span className="text-muted-foreground">- {churchName}</span>}
        </CardTitle>
        <CardDescription>{t("churchConfigDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attendance Points Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <Label className="text-base font-semibold">{t("attendancePoints")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.is_attendance_points_enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, is_attendance_points_enabled: checked }))
                }
              />
              <Label className="text-sm text-muted-foreground">
                {t("enableAttendancePoints")}
              </Label>
            </div>
          </div>

          {config.is_attendance_points_enabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-7">
              <div className="space-y-2">
                <Label htmlFor="present">{t("presentPoints")}</Label>
                <Input
                  id="present"
                  type="number"
                  min="0"
                  max="100"
                  value={config.attendance_points_present}
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      attendance_points_present: toNonNegativeInt(normalized, 0),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late">{t("latePoints")}</Label>
                <Input
                  id="late"
                  type="number"
                  min="0"
                  max="100"
                  value={config.attendance_points_late}
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      attendance_points_late: toNonNegativeInt(normalized, 0),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excused">{t("excusedPoints")}</Label>
                <Input
                  id="excused"
                  type="number"
                  min="0"
                  max="100"
                  value={config.attendance_points_excused}
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      attendance_points_excused: toNonNegativeInt(normalized, 0),
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="absent">{t("absentPoints")}</Label>
                <Input
                  id="absent"
                  type="number"
                  min="0"
                  max="100"
                  value={config.attendance_points_absent}
                  onFocus={(e) => {
                    if (e.currentTarget.value === "0") e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const normalized = normalizeNonNegativeIntInput(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      attendance_points_absent: toNonNegativeInt(normalized, 0),
                    }));
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Trip Points Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-blue-500" />
              <Label className="text-base font-semibold">{t("tripPoints")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.is_trip_points_enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, is_trip_points_enabled: checked }))
                }
              />
              <Label className="text-sm text-muted-foreground">
                {t("enableTripPoints")}
              </Label>
            </div>
          </div>

          {config.is_trip_points_enabled && (
            <div className="pl-7 max-w-xs">
              <Label htmlFor="tripPoints">{t("participationPoints")}</Label>
              <Input
                id="tripPoints"
                type="number"
                min="0"
                max="1000"
                value={config.trip_participation_points}
                onFocus={(e) => {
                  if (e.currentTarget.value === "0") e.currentTarget.select();
                }}
                onChange={(e) => {
                  const normalized = normalizeNonNegativeIntInput(e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    trip_participation_points: toNonNegativeInt(normalized, 0),
                  }));
                }}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Teacher Limits Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-500" />
              <Label className="text-base font-semibold">{t("teacherLimits")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.is_teacher_adjustment_enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, is_teacher_adjustment_enabled: checked }))
                }
              />
              <Label className="text-sm text-muted-foreground">
                {t("enableTeacherAdjustment")}
              </Label>
            </div>
          </div>

          {config.is_teacher_adjustment_enabled && (
            <div className="pl-7 max-w-xs">
              <Label htmlFor="maxAdjustment">{t("maxAdjustment")}</Label>
              <Input
                id="maxAdjustment"
                type="number"
                min="1"
                max="1000"
                value={config.max_teacher_adjustment}
                onFocus={(e) => {
                  if (e.currentTarget.value === "0") e.currentTarget.select();
                }}
                onChange={(e) => {
                  const normalized = normalizeNonNegativeIntInput(e.target.value);
                  setConfig((prev) => ({
                    ...prev,
                    max_teacher_adjustment: toNonNegativeInt(normalized, 50),
                  }));
                }}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max points a teacher can add/deduct at once
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

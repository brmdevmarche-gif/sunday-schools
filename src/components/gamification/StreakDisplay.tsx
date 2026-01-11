"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, BookOpen, Heart, Calendar, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserStreak, StreakType } from "@/lib/types";

interface StreakDisplayProps {
  streaks: UserStreak[];
  variant?: "compact" | "full";
  className?: string;
}

const streakConfig: Record<
  StreakType,
  { icon: typeof Flame; color: string; bgColor: string }
> = {
  reading: {
    icon: BookOpen,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  spiritual_notes: {
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
  },
  attendance: {
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  combined: {
    icon: Zap,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
};

export default function StreakDisplay({
  streaks,
  variant = "full",
  className,
}: StreakDisplayProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();

  const getStreakLabel = (type: StreakType) => {
    switch (type) {
      case "reading":
        return t("streaks.reading");
      case "spiritual_notes":
        return t("streaks.spiritualNotes");
      case "attendance":
        return t("streaks.attendance");
      case "combined":
        return t("streaks.combined");
      default:
        return type;
    }
  };

  const longestStreak = Math.max(...streaks.map((s) => s.current_streak), 0);
  const bestStreak = streaks.find((s) => s.current_streak === longestStreak);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Flame
          className={cn(
            "h-5 w-5",
            longestStreak > 0 ? "text-orange-500" : "text-muted-foreground"
          )}
        />
        <span className="font-semibold">{longestStreak}</span>
        <span className="text-sm text-muted-foreground">
          {t("streaks.dayStreak")}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {/* Main Streak Display */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div
            className={cn(
              "p-4 rounded-full",
              longestStreak > 0 ? "bg-orange-500/20" : "bg-muted"
            )}
          >
            <Flame
              className={cn(
                "h-10 w-10",
                longestStreak > 0 ? "text-orange-500" : "text-muted-foreground",
                longestStreak >= 7 && "animate-pulse"
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{longestStreak}</p>
            <p className="text-sm text-muted-foreground">
              {t("streaks.dayStreak")}
            </p>
            {bestStreak && (
              <Badge variant="outline" className="mt-1">
                {getStreakLabel(bestStreak.streak_type)}
              </Badge>
            )}
          </div>
        </div>

        {/* Individual Streaks */}
        <div className="grid grid-cols-2 gap-3">
          {streaks.map((streak) => {
            const config = streakConfig[streak.streak_type];
            const Icon = config.icon;
            return (
              <div
                key={streak.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  config.bgColor
                )}
              >
                <Icon className={cn("h-5 w-5", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {getStreakLabel(streak.streak_type)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {streak.current_streak} {t("streaks.current")}
                    </span>
                    <span className="opacity-50">|</span>
                    <span>
                      {streak.longest_streak} {t("streaks.best")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact single streak widget for dashboard
export function SingleStreakWidget({
  current,
  longest,
  type = "combined",
  className,
}: {
  current: number;
  longest: number;
  type?: StreakType;
  className?: string;
}) {
  const t = useTranslations("gamification");
  const config = streakConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        className
      )}
    >
      <div className={cn("p-2 rounded-full", config.bgColor)}>
        <Icon className={cn("h-6 w-6", config.color)} />
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">{current}</span>
          <span className="text-sm text-muted-foreground">
            {t("streaks.days")}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("streaks.bestLabel")}: {longest}
        </p>
      </div>
    </div>
  );
}

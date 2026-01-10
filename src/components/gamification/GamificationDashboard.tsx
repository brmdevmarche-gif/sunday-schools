"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StreakDisplay, { SingleStreakWidget } from "./StreakDisplay";
import BadgeCollection, { BadgeShowcase } from "./BadgeCollection";
import Leaderboard from "./Leaderboard";
import { cn } from "@/lib/utils";
import { Coins, Flame, Award, TrendingUp } from "lucide-react";
import {
  getGamificationProfileAction,
  getBadgeDefinitionsAction,
} from "@/app/gamification/actions";
import type { GamificationProfile, BadgeDefinition, UserStreak } from "@/lib/types";

interface GamificationDashboardProps {
  userId?: string;
  classId?: string;
  variant?: "full" | "compact";
  className?: string;
}

export default function GamificationDashboard({
  userId,
  classId,
  variant = "full",
  className,
}: GamificationDashboardProps) {
  const t = useTranslations("gamification");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileResult, badgesResult] = await Promise.all([
          getGamificationProfileAction(userId),
          getBadgeDefinitionsAction(),
        ]);

        if (profileResult.success && profileResult.data) {
          setProfile(profileResult.data);
        }
        if (badgesResult.success && badgesResult.data) {
          setAllBadges(badgesResult.data);
        }
      } catch (error) {
        console.error("Failed to fetch gamification data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <GamificationDashboardSkeleton variant={variant} className={className} />;
  }

  if (!profile) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("dashboard.noData")}
        </CardContent>
      </Card>
    );
  }

  // Convert streaks object to UserStreak array format
  const streaksArray: UserStreak[] = [
    {
      id: "reading",
      user_id: profile.user_id,
      streak_type: "reading",
      current_streak: profile.streaks.reading,
      longest_streak: profile.longest_streak,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    },
    {
      id: "spiritual",
      user_id: profile.user_id,
      streak_type: "spiritual_notes",
      current_streak: profile.streaks.spiritual,
      longest_streak: profile.longest_streak,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    },
    {
      id: "attendance",
      user_id: profile.user_id,
      streak_type: "attendance",
      current_streak: profile.streaks.attendance,
      longest_streak: profile.longest_streak,
      last_activity_date: null,
      updated_at: new Date().toISOString(),
    },
  ];

  if (variant === "compact") {
    return (
      <CompactDashboard
        profile={profile}
        classId={classId}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Coins}
          iconColor="text-yellow-500"
          value={profile.total_points}
          label={t("stats.totalPoints")}
        />
        <StatCard
          icon={Flame}
          iconColor="text-orange-500"
          value={profile.longest_streak}
          label={t("stats.longestStreak")}
          suffix={t("stats.days")}
        />
        <StatCard
          icon={Award}
          iconColor="text-purple-500"
          value={profile.badges_count}
          label={t("stats.badges")}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-emerald-500"
          value={profile.class_rank || "-"}
          label={t("stats.classRank")}
          prefix="#"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="badges">{t("tabs.badges")}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t("tabs.leaderboard")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <StreakDisplay streaks={streaksArray} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  {t("badges.recentBadges")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BadgeShowcase badges={profile.badges} maxDisplay={6} />
              </CardContent>
            </Card>
          </div>
          <Leaderboard
            initialScope="class"
            scopeId={classId}
            initialPeriod="all_time"
            limit={5}
            highlightUserId={profile.user_id}
            showFilters={false}
          />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeCollection
            allBadges={allBadges}
            earnedBadges={profile.badges}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard
            initialScope="class"
            scopeId={classId}
            highlightUserId={profile.user_id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Compact version for embedding in other pages
function CompactDashboard({
  profile,
  classId,
  className,
}: {
  profile: GamificationProfile;
  classId?: string;
  className?: string;
}) {
  const t = useTranslations("gamification");

  return (
    <Card className={className}>
      <CardContent className="pt-6 space-y-4">
        {/* Quick Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">{profile.total_points}</span>
              <span className="text-sm text-muted-foreground">{t("stats.pts")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">{profile.longest_streak}</span>
              <span className="text-sm text-muted-foreground">{t("stats.days")}</span>
            </div>
          </div>
          {profile.class_rank && (
            <div className="text-sm text-muted-foreground">
              #{profile.class_rank} {t("stats.inClass")}
            </div>
          )}
        </div>

        {/* Badge Showcase */}
        <BadgeShowcase badges={profile.badges} maxDisplay={4} />
      </CardContent>
    </Card>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  prefix,
  suffix,
}: {
  icon: typeof Coins;
  iconColor: string;
  value: number | string;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-full bg-muted")}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {prefix}
              {value}
              {suffix && <span className="text-sm ml-1">{suffix}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading skeleton
function GamificationDashboardSkeleton({
  variant,
  className,
}: {
  variant: "full" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <Card className={className}>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BadgeCard, { EarnedBadgeCard } from "./BadgeCard";
import { cn } from "@/lib/utils";
import {
  Flame,
  Star,
  Trophy,
  BookOpen,
  Heart,
  Calendar,
  Users,
  Sparkles,
  Award,
} from "lucide-react";
import type { BadgeDefinition, BadgeCategory, UserBadgeWithDetails } from "@/lib/types";

interface BadgeCollectionProps {
  allBadges: BadgeDefinition[];
  earnedBadges: UserBadgeWithDetails[];
  className?: string;
}

const categoryConfig: Record<
  BadgeCategory,
  { icon: typeof Flame; label: string; color: string }
> = {
  streak: { icon: Flame, label: "streak", color: "text-orange-500" },
  points: { icon: Star, label: "points", color: "text-yellow-500" },
  competition: { icon: Trophy, label: "competition", color: "text-amber-500" },
  reading: { icon: BookOpen, label: "reading", color: "text-emerald-500" },
  spiritual: { icon: Heart, label: "spiritual", color: "text-pink-500" },
  attendance: { icon: Calendar, label: "attendance", color: "text-blue-500" },
  social: { icon: Users, label: "social", color: "text-cyan-500" },
  special: { icon: Sparkles, label: "special", color: "text-purple-500" },
};

export default function BadgeCollection({
  allBadges,
  earnedBadges,
  className,
}: BadgeCollectionProps) {
  const t = useTranslations("gamification");
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");

  // Create a set of earned badge IDs for quick lookup
  const earnedBadgeIds = new Set(earnedBadges.map((eb) => eb.badge_id));
  const earnedBadgeMap = new Map(earnedBadges.map((eb) => [eb.badge_id, eb]));

  // Get unique categories from available badges
  const categories = Array.from(
    new Set(allBadges.map((b) => b.category))
  ) as BadgeCategory[];

  // Filter badges by category
  const filteredBadges =
    selectedCategory === "all"
      ? allBadges
      : allBadges.filter((b) => b.category === selectedCategory);

  // Calculate progress
  const totalBadges = allBadges.length;
  const earnedCount = earnedBadges.length;
  const progressPercent = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            {t("badges.collection")}
          </CardTitle>
          <Badge variant="outline">
            {earnedCount}/{totalBadges}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% {t("badges.complete")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Filter */}
        <Tabs
          value={selectedCategory}
          onValueChange={(v) => setSelectedCategory(v as BadgeCategory | "all")}
          className="space-y-4"
        >
          <TabsList className="w-full h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="all" className="gap-1">
              {t("badges.categories.all")}
            </TabsTrigger>
            {categories.map((cat) => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              const catBadges = allBadges.filter((b) => b.category === cat);
              const catEarned = catBadges.filter((b) => earnedBadgeIds.has(b.id)).length;
              return (
                <TabsTrigger key={cat} value={cat} className="gap-1">
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span className="hidden sm:inline">
                    {t(`badges.categories.${config.label}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({catEarned}/{catBadges.length})
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {filteredBadges.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("badges.noBadges")}
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {filteredBadges.map((badge) => {
                  const isEarned = earnedBadgeIds.has(badge.id);
                  const earnedData = earnedBadgeMap.get(badge.id);
                  return isEarned && earnedData ? (
                    <EarnedBadgeCard
                      key={badge.id}
                      userBadge={earnedData}
                      size="md"
                    />
                  ) : (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      earned={false}
                      size="md"
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Compact badge showcase for profile/dashboard
export function BadgeShowcase({
  badges,
  maxDisplay = 5,
  className,
}: {
  badges: UserBadgeWithDetails[];
  maxDisplay?: number;
  className?: string;
}) {
  const t = useTranslations("gamification");

  // Sort by rarity (legendary first) and take top badges
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
  const sortedBadges = [...badges]
    .sort((a, b) => rarityOrder[a.badge.rarity] - rarityOrder[b.badge.rarity])
    .slice(0, maxDisplay);

  const remaining = badges.length - maxDisplay;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {sortedBadges.map((ub) => (
        <EarnedBadgeCard key={ub.id} userBadge={ub} size="sm" />
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="h-12 w-12 rounded-xl flex items-center justify-center">
          +{remaining}
        </Badge>
      )}
      {badges.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("badges.noneEarned")}</p>
      )}
    </div>
  );
}

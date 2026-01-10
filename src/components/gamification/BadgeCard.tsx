"use client";

import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Flame,
  Star,
  Trophy,
  Medal,
  BookOpen,
  Heart,
  Calendar,
  Users,
  Zap,
  Crown,
  Award,
  Gem,
  Flag,
  GraduationCap,
  Compass,
  HandHeart,
  CalendarCheck,
  CalendarHeart,
  BookMarked,
  Lock,
  LucideIcon,
} from "lucide-react";
import type { BadgeDefinition, BadgeRarity, UserBadgeWithDetails } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Map icon names to actual icons
const iconMap: Record<string, LucideIcon> = {
  flame: Flame,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  "book-open": BookOpen,
  heart: Heart,
  calendar: Calendar,
  users: Users,
  zap: Zap,
  crown: Crown,
  award: Award,
  gem: Gem,
  flag: Flag,
  "graduation-cap": GraduationCap,
  compass: Compass,
  "hand-heart": HandHeart,
  "calendar-check": CalendarCheck,
  "calendar-heart": CalendarHeart,
  "book-marked": BookMarked,
};

// Rarity colors
const rarityColors: Record<BadgeRarity, string> = {
  common: "border-gray-300 bg-gray-50 dark:bg-gray-900",
  uncommon: "border-green-400 bg-green-50 dark:bg-green-950",
  rare: "border-blue-400 bg-blue-50 dark:bg-blue-950",
  epic: "border-purple-400 bg-purple-50 dark:bg-purple-950",
  legendary: "border-amber-400 bg-amber-50 dark:bg-amber-950 ring-2 ring-amber-200",
};

const rarityGlow: Record<BadgeRarity, string> = {
  common: "",
  uncommon: "",
  rare: "shadow-blue-200/50",
  epic: "shadow-purple-300/50",
  legendary: "shadow-amber-300/50 animate-pulse",
};

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

export default function BadgeCard({
  badge,
  earned = false,
  earnedAt,
  size = "md",
  showDetails = true,
  className,
}: BadgeCardProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();

  const Icon = iconMap[badge.icon] || Star;
  const name = locale === "ar" && badge.name_ar ? badge.name_ar : badge.name;
  const description =
    locale === "ar" && badge.description_ar
      ? badge.description_ar
      : badge.description;

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const colorClasses: Record<string, string> = {
    gold: "text-amber-500",
    orange: "text-orange-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    green: "text-green-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    pink: "text-pink-500",
    cyan: "text-cyan-500",
    silver: "text-gray-400",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const badgeContent = (
    <div
      className={cn(
        "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
        earned ? rarityColors[badge.rarity] : "border-gray-200 bg-gray-100 dark:bg-gray-800",
        earned && rarityGlow[badge.rarity],
        earned && "shadow-lg",
        !earned && "opacity-50 grayscale",
        className
      )}
    >
      {/* Badge Icon */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          sizeClasses[size],
          earned ? "bg-white/50 dark:bg-black/20" : "bg-white/30"
        )}
      >
        {earned ? (
          <Icon className={cn(iconSizes[size], colorClasses[badge.color] || "text-gray-500")} />
        ) : (
          <Lock className={cn(iconSizes[size], "text-gray-400")} />
        )}
      </div>

      {/* Badge Name */}
      {showDetails && (
        <div className="mt-2 text-center">
          <p className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
            {name}
          </p>
          {earned && earnedAt && size !== "sm" && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(earnedAt)}
            </p>
          )}
        </div>
      )}

      {/* Points reward indicator */}
      {earned && badge.points_reward > 0 && size !== "sm" && (
        <Badge variant="secondary" className="mt-2 text-xs">
          +{badge.points_reward} pts
        </Badge>
      )}

      {/* Rarity indicator */}
      {size === "lg" && (
        <Badge
          variant="outline"
          className={cn(
            "mt-2 capitalize text-xs",
            badge.rarity === "legendary" && "border-amber-400 text-amber-600",
            badge.rarity === "epic" && "border-purple-400 text-purple-600",
            badge.rarity === "rare" && "border-blue-400 text-blue-600"
          )}
        >
          {t(`badges.rarity.${badge.rarity}`)}
        </Badge>
      )}

      {/* Secret badge indicator */}
      {badge.is_secret && !earned && (
        <Badge variant="outline" className="absolute -top-2 -right-2 text-xs">
          ?
        </Badge>
      )}
    </div>
  );

  // Wrap with tooltip for description
  if (description && showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

// Pre-composed component for earned badges from API
export function EarnedBadgeCard({
  userBadge,
  size = "md",
  className,
}: {
  userBadge: UserBadgeWithDetails;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <BadgeCard
      badge={userBadge.badge}
      earned={true}
      earnedAt={userBadge.earned_at}
      size={size}
      className={className}
    />
  );
}

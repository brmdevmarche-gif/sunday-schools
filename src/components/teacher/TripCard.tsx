"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Bus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TripStatus, TripType } from "@/lib/types/modules/trips";

// =====================================================
// TYPES
// =====================================================

export interface TripCardData {
  id: string;
  title: string;
  destination?: string | null;
  startDatetime: string;
  endDatetime?: string | null;
  tripType?: TripType | null;
  status: TripStatus;
  participantsCount: number;
  maxParticipants?: number | null;
  imageUrl?: string | null;
}

export interface TripCardProps extends VariantProps<typeof tripCardVariants> {
  trip: TripCardData;
  onClick?: (id: string) => void;
  className?: string;
}

// =====================================================
// VARIANTS
// =====================================================

const tripCardVariants = cva(
  "relative overflow-hidden transition-all duration-200",
  {
    variants: {
      tripStatus: {
        active: "border-primary/20 hover:border-primary/40",
        started: "border-green-500/40 bg-green-50/50 dark:bg-green-950/20",
        ended: "border-muted opacity-75",
        canceled: "border-destructive/30 bg-destructive/5",
        soldout: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20",
      },
    },
    defaultVariants: {
      tripStatus: "active",
    },
  }
);

// =====================================================
// STATUS BADGE CONFIG
// =====================================================

const statusConfig: Record<
  TripStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  active: {
    label: "upcoming",
    variant: "default",
    icon: Clock,
  },
  started: {
    label: "inProgress",
    variant: "secondary",
    icon: CheckCircle,
  },
  ended: {
    label: "ended",
    variant: "outline",
    icon: CheckCircle,
  },
  canceled: {
    label: "cancelled",
    variant: "destructive",
    icon: XCircle,
  },
  soldout: {
    label: "soldOut",
    variant: "secondary",
    icon: AlertCircle,
  },
};

const tripTypeLabels: Record<TripType, string> = {
  one_day: "oneDay",
  spiritual: "spiritual",
  volunteering: "volunteering",
  fun: "fun",
  retreat: "retreat",
  carnival: "carnival",
  tournament: "tournament",
  other: "other",
};

// =====================================================
// TRIP CARD COMPONENT
// =====================================================

function TripCard({ trip, onClick, className }: TripCardProps) {
  const t = useTranslations("teacher.myTrips");
  const locale = useLocale();

  const startDate = new Date(trip.startDatetime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripDay = new Date(startDate);
  tripDay.setHours(0, 0, 0, 0);
  const isTripToday = today.getTime() === tripDay.getTime();

  // Determine display status
  const displayStatus = isTripToday && trip.status === "active" ? "started" : trip.status;
  const statusInfo = statusConfig[displayStatus];
  const StatusIcon = statusInfo.icon;

  const handleClick = () => {
    if (onClick) {
      onClick(trip.id);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const participantsFull =
    trip.maxParticipants && trip.participantsCount >= trip.maxParticipants;

  return (
    <Link href={`/dashboard/teacher/trips/${trip.id}`}>
      <Card
        data-slot="trip-card"
        className={cn(
          tripCardVariants({ tripStatus: displayStatus }),
          "cursor-pointer hover:shadow-md",
          className
        )}
        onClick={handleClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-1">
                {trip.title}
              </h3>
              {trip.destination && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{trip.destination}</span>
                </div>
              )}
            </div>
            <Badge variant={statusInfo.variant} className="flex-shrink-0">
              <StatusIcon className="h-3 w-3 me-1" aria-hidden="true" />
              {t(`status.${statusInfo.label}`)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          <div className="space-y-2">
            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className={cn(isTripToday && "font-medium text-primary")}>
                {isTripToday ? t("today") : formatDate(startDate)}
              </span>
            </div>

            {/* Trip Type & Participants */}
            <div className="flex items-center justify-between gap-2">
              {trip.tripType && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Bus className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{t(`type.${tripTypeLabels[trip.tripType]}`)}</span>
                </div>
              )}

              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  participantsFull ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                <Users className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  {trip.participantsCount}
                  {trip.maxParticipants && (
                    <span className="text-muted-foreground">/{trip.maxParticipants}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Chevron indicator */}
          <div className="absolute end-3 top-1/2 -translate-y-1/2">
            <ChevronRight
              className="h-5 w-5 text-muted-foreground/50 rtl:rotate-180"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// =====================================================
// SKELETON
// =====================================================

function TripCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { TripCard, TripCardSkeleton };

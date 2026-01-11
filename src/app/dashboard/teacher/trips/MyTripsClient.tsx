"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { TripCard } from "@/components/teacher";
import type { TeacherTrip } from "./actions";

interface MyTripsClientProps {
  trips: TeacherTrip[];
}

export function MyTripsClient({ trips }: MyTripsClientProps) {
  const t = useTranslations("teacher.myTrips");

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Bus}
        title={t("noTrips")}
        description={t("noTripsDescription")}
      />
    );
  }

  // Group trips by status: active/started first, then ended
  const activeTrips = trips.filter(
    (t) => t.status === "active" || t.status === "started"
  );
  const pastTrips = trips.filter(
    (t) => t.status === "ended" || t.status === "canceled"
  );

  return (
    <div className="space-y-6">
      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {t("upcomingTrips")}
          </h2>
          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{
                  id: trip.id,
                  title: trip.title,
                  destination: trip.destination,
                  startDatetime: trip.startDatetime,
                  endDatetime: trip.endDatetime,
                  tripType: trip.tripType,
                  status: trip.status,
                  participantsCount: trip.participantsCount,
                  maxParticipants: trip.maxParticipants,
                  imageUrl: trip.imageUrl,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Past Trips */}
      {pastTrips.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            {t("pastTrips")}
          </h2>
          <div className="space-y-3">
            {pastTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{
                  id: trip.id,
                  title: trip.title,
                  destination: trip.destination,
                  startDatetime: trip.startDatetime,
                  endDatetime: trip.endDatetime,
                  tripType: trip.tripType,
                  status: trip.status,
                  participantsCount: trip.participantsCount,
                  maxParticipants: trip.maxParticipants,
                  imageUrl: trip.imageUrl,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

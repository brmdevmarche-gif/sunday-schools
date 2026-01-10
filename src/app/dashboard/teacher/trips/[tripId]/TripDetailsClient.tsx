"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar,
  MapPin,
  Users,
  UserCog,
  ClipboardCheck,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentDrawer } from "@/components/teacher/StudentDrawer";
import { useStudentDrawer } from "@/hooks/useStudentDrawer";
import type {
  TripDetailsData,
  TripParticipantData,
  TripOrganizerData,
} from "../actions";
import { TripAttendanceTab } from "./TripAttendanceTab";

interface TripDetailsClientProps {
  tripDetails: TripDetailsData;
}

// =====================================================
// APPROVAL STATUS CONFIG
// =====================================================

const approvalStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  pending: {
    label: "pending",
    variant: "secondary",
    icon: Clock,
  },
  approved: {
    label: "approved",
    variant: "default",
    icon: CheckCircle,
  },
  rejected: {
    label: "rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

const paymentStatusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "paymentPending",
    variant: "outline",
  },
  paid: {
    label: "paid",
    variant: "default",
  },
  refunded: {
    label: "refunded",
    variant: "secondary",
  },
};

// =====================================================
// TRIP DETAILS CLIENT
// =====================================================

export function TripDetailsClient({ tripDetails }: TripDetailsClientProps) {
  const t = useTranslations("teacher.myTrips");
  const locale = useLocale();
  const { student, isOpen, isLoading, openDrawer, closeDrawer, setIsOpen } = useStudentDrawer();

  const { trip, participants, organizers } = tripDetails;
  const startDate = new Date(trip.startDatetime);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripDay = new Date(startDate);
  tripDay.setHours(0, 0, 0, 0);
  const isTripToday = today.getTime() === tripDay.getTime();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Filter participants by approval status
  const approvedParticipants = participants.filter(
    (p) => p.approvalStatus === "approved"
  );
  const pendingParticipants = participants.filter(
    (p) => p.approvalStatus === "pending"
  );

  const handleParticipantClick = (participant: TripParticipantData) => {
    openDrawer(participant.userId);
  };

  return (
    <div className="space-y-4">
      {/* Trip Info Card */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className={cn(isTripToday && "font-medium text-primary")}>
              {isTripToday ? t("today") : formatDate(startDate)}
            </span>
          </div>

          {/* Location */}
          {trip.destination && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>{trip.destination}</span>
            </div>
          )}

          {/* Participants count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>
              {t("participantsCount", { count: approvedParticipants.length })}
              {trip.maxParticipants && (
                <span className="text-muted-foreground">
                  {" "}
                  / {trip.maxParticipants}
                </span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("tabs.participants")}</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {approvedParticipants.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="organizers" className="gap-1.5">
            <UserCog className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("tabs.organizers")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="gap-1.5"
            disabled={!trip.canTakeAttendance}
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("tabs.attendance")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Participants Tab */}
        <TabsContent value="participants" className="mt-4 space-y-4">
          {/* Pending Section */}
          {pendingParticipants.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("pendingApproval")} ({pendingParticipants.length})
              </h3>
              <div className="space-y-2">
                {pendingParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onClick={() => handleParticipantClick(participant)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Approved Section */}
          {approvedParticipants.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("approvedParticipants")} ({approvedParticipants.length})
              </h3>
              <div className="space-y-2">
                {approvedParticipants.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    onClick={() => handleParticipantClick(participant)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={Users}
              title={t("noParticipants")}
              description={t("noParticipantsDescription")}
            />
          )}
        </TabsContent>

        {/* Organizers Tab */}
        <TabsContent value="organizers" className="mt-4">
          {organizers.length > 0 ? (
            <div className="space-y-2">
              {organizers.map((organizer) => (
                <OrganizerCard key={organizer.id} organizer={organizer} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserCog}
              title={t("noOrganizers")}
              description={t("noOrganizersDescription")}
            />
          )}
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="mt-4">
          <TripAttendanceTab
            tripId={trip.id}
            participants={approvedParticipants}
            canTakeAttendance={trip.canTakeAttendance}
            isTripToday={isTripToday}
          />
        </TabsContent>
      </Tabs>

      {/* Student Drawer */}
      <StudentDrawer
        student={student}
        open={isOpen}
        onOpenChange={setIsOpen}
        loading={isLoading}
      />
    </div>
  );
}

// =====================================================
// PARTICIPANT CARD
// =====================================================

interface ParticipantCardProps {
  participant: TripParticipantData;
  onClick: () => void;
}

function ParticipantCard({ participant, onClick }: ParticipantCardProps) {
  const t = useTranslations("teacher.myTrips");
  const approvalInfo = approvalStatusConfig[participant.approvalStatus];
  const paymentInfo = paymentStatusConfig[participant.paymentStatus];
  const ApprovalIcon = approvalInfo.icon;

  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <OptimizedAvatar
            src={participant.avatarUrl}
            alt={participant.fullName}
            size="md"
            fallback={participant.fullName.charAt(0)}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{participant.fullName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {participant.email}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={approvalInfo.variant} className="text-xs">
              <ApprovalIcon className="h-3 w-3 me-1" aria-hidden="true" />
              {t(`approval.${approvalInfo.label}`)}
            </Badge>
            {participant.approvalStatus === "approved" && (
              <Badge variant={paymentInfo.variant} className="text-xs">
                <CreditCard className="h-3 w-3 me-1" aria-hidden="true" />
                {t(`payment.${paymentInfo.label}`)}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// ORGANIZER CARD
// =====================================================

interface OrganizerCardProps {
  organizer: TripOrganizerData;
}

function OrganizerCard({ organizer }: OrganizerCardProps) {
  const t = useTranslations("teacher.myTrips");

  const permissions = [
    organizer.canApprove && t("permissions.canApprove"),
    organizer.canTakeAttendance && t("permissions.canTakeAttendance"),
    organizer.canCollectPayment && t("permissions.canCollectPayment"),
    organizer.canGo && t("permissions.canGo"),
  ].filter(Boolean);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <OptimizedAvatar
            src={organizer.avatarUrl}
            alt={organizer.fullName}
            size="md"
            fallback={organizer.fullName.charAt(0)}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{organizer.fullName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {organizer.email}
            </p>
            {permissions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {permissions.map((perm, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

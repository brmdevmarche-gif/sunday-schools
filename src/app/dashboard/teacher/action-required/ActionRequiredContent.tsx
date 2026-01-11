"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Bus, Trophy, Activity, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ApprovalCard,
  RejectionReasonModal,
  StudentDrawer,
} from "@/components/teacher";
import { useStudentDrawer } from "@/hooks/useStudentDrawer";
import {
  type PendingActionsResult,
  type PendingAction,
  approveTripRequest,
  rejectTripRequest,
} from "./actions";

type FilterType = "all" | "trips" | "competitions" | "activities";

interface ActionRequiredContentProps {
  pendingActions: PendingActionsResult;
}

export function ActionRequiredContent({
  pendingActions,
}: ActionRequiredContentProps) {
  const t = useTranslations("teacher.actionRequired");
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [rejectionModal, setRejectionModal] = React.useState<{
    open: boolean;
    action: PendingAction | null;
  }>({ open: false, action: null });
  const { student, isOpen, isLoading, openDrawer, setIsOpen } = useStudentDrawer();

  // Track which items have been processed
  const [processedIds, setProcessedIds] = React.useState<Set<string>>(new Set());

  const filterOptions: { value: FilterType; label: string; count: number }[] = [
    {
      value: "all",
      label: t("all"),
      count: pendingActions.totalCount,
    },
    {
      value: "trips",
      label: t("trips"),
      count: pendingActions.trips.length,
    },
    {
      value: "competitions",
      label: t("competitions"),
      count: pendingActions.competitions.length,
    },
  ];

  const getFilteredActions = (): PendingAction[] => {
    let actions: PendingAction[] = [];

    switch (filter) {
      case "trips":
        actions = pendingActions.trips;
        break;
      case "competitions":
        actions = pendingActions.competitions;
        break;
      case "activities":
        actions = pendingActions.activities;
        break;
      default:
        actions = [
          ...pendingActions.trips,
          ...pendingActions.competitions,
          ...pendingActions.activities,
        ];
    }

    // Filter out processed items
    return actions.filter((action) => !processedIds.has(action.id));
  };

  const handleApprove = async (action: PendingAction) => {
    if (action.type === "trip") {
      const result = await approveTripRequest(action.id);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(action.id));
      }
    }
    // Add other types here
  };

  const handleRejectClick = (action: PendingAction) => {
    setRejectionModal({ open: true, action });
  };

  const handleRejectConfirm = async (reason: string) => {
    const action = rejectionModal.action;
    if (!action) return;

    if (action.type === "trip") {
      const result = await rejectTripRequest(action.id, reason);
      if (result.success) {
        setProcessedIds((prev) => new Set(prev).add(action.id));
      }
    }
    // Add other types here
  };

  const filteredActions = getFilteredActions();

  // Group actions by type for display
  const groupedActions = React.useMemo(() => {
    if (filter !== "all") {
      return { [filter]: filteredActions };
    }

    const groups: Record<string, PendingAction[]> = {};

    const trips = filteredActions.filter((a) => a.type === "trip");
    const competitions = filteredActions.filter((a) => a.type === "competition");
    const activities = filteredActions.filter((a) => a.type === "activity");

    if (trips.length > 0) groups.trips = trips;
    if (competitions.length > 0) groups.competitions = competitions;
    if (activities.length > 0) groups.activities = activities;

    return groups;
  }, [filteredActions, filter]);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "trips":
        return Bus;
      case "competitions":
        return Trophy;
      case "activities":
        return Activity;
      default:
        return Zap;
    }
  };

  const getSectionTitle = (type: string) => {
    switch (type) {
      case "trips":
        return t("tripApprovals");
      case "competitions":
        return t("competitionReviews");
      case "activities":
        return t("activityApprovals");
      default:
        return t("pendingItems");
    }
  };

  if (pendingActions.totalCount === 0) {
    return (
      <EmptyState
        icon={Zap}
        title={t("allCaughtUp")}
        description={t("noPendingActions")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
            className={cn(
              "min-h-9",
              filter === option.value && "shadow-sm"
            )}
          >
            {option.label}
            {option.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-xs",
                  filter === option.value
                    ? "bg-primary-foreground/20"
                    : "bg-muted"
                )}
              >
                {option.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Empty state for filtered view */}
      {filteredActions.length === 0 && (
        <EmptyState
          icon={Zap}
          title={t("noItemsInCategory")}
          description={t("tryDifferentFilter")}
        />
      )}

      {/* Grouped Actions */}
      {Object.entries(groupedActions).map(([type, actions]) => {
        const Icon = getSectionIcon(type);
        return (
          <div key={type} className="space-y-3">
            {/* Section Header */}
            {filter === "all" && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {getSectionTitle(type)} ({actions.length})
              </div>
            )}

            {/* Action Cards */}
            <div className="space-y-3">
              {actions.map((action) => (
                <ApprovalCard
                  key={action.id}
                  id={action.id}
                  type={action.type}
                  student={{
                    id: action.studentId,
                    name: action.studentName,
                    avatarUrl: action.studentAvatar,
                  }}
                  title={action.title}
                  subtitle={action.subtitle}
                  requestedAt={action.requestedAt}
                  parentInitiated={action.parentInitiated}
                  onApprove={() => handleApprove(action)}
                  onReject={async () => handleRejectClick(action)}
                  onStudentClick={() => openDrawer(action.studentId)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Rejection Reason Modal */}
      <RejectionReasonModal
        open={rejectionModal.open}
        onOpenChange={(open) =>
          setRejectionModal((prev) => ({ ...prev, open }))
        }
        onConfirm={handleRejectConfirm}
        studentName={rejectionModal.action?.studentName}
        requestTitle={rejectionModal.action?.title}
      />

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

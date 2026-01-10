"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Megaphone, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AnnouncementCard,
  AnnouncementDetail,
  type AnnouncementType,
} from "@/components/teacher";
import {
  type TeacherAnnouncement,
  markAnnouncementRead,
} from "./actions";

type FilterType = "all" | "unread" | "urgent";

interface AnnouncementsClientProps {
  announcements: TeacherAnnouncement[];
}

export function AnnouncementsClient({ announcements }: AnnouncementsClientProps) {
  const t = useTranslations("teacher.announcements");
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<TeacherAnnouncement | null>(null);
  const [localAnnouncements, setLocalAnnouncements] =
    React.useState<TeacherAnnouncement[]>(announcements);

  const filterOptions: { value: FilterType; label: string; count: number }[] = [
    {
      value: "all",
      label: t("all"),
      count: localAnnouncements.length,
    },
    {
      value: "unread",
      label: t("unread"),
      count: localAnnouncements.filter((a) => !a.isRead).length,
    },
    {
      value: "urgent",
      label: t("urgent"),
      count: localAnnouncements.filter((a) => a.type === "urgent").length,
    },
  ];

  const filteredAnnouncements = React.useMemo(() => {
    switch (filter) {
      case "unread":
        return localAnnouncements.filter((a) => !a.isRead);
      case "urgent":
        return localAnnouncements.filter((a) => a.type === "urgent");
      default:
        return localAnnouncements;
    }
  }, [localAnnouncements, filter]);

  const handleAnnouncementClick = React.useCallback(
    async (id: string) => {
      const announcement = localAnnouncements.find((a) => a.id === id);
      if (!announcement) return;

      setSelectedAnnouncement(announcement);

      // Mark as read if not already
      if (!announcement.isRead) {
        await markAnnouncementRead(id);
        setLocalAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
        );
      }
    },
    [localAnnouncements]
  );

  const handleBack = React.useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  // Show detail view if announcement is selected
  if (selectedAnnouncement) {
    return (
      <AnnouncementDetail
        announcement={{
          id: selectedAnnouncement.id,
          title: selectedAnnouncement.title,
          content: selectedAnnouncement.content,
          type: selectedAnnouncement.type,
          sender: selectedAnnouncement.sender || undefined,
          publishedAt: selectedAnnouncement.publishedAt,
          expiresAt: selectedAnnouncement.expiresAt,
        }}
        onBack={handleBack}
      />
    );
  }

  // Show list view
  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title={t("noAnnouncements")}
        description={t("noAnnouncementsDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={t("noFilteredAnnouncements")}
          description={t("tryDifferentFilter")}
        />
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              id={announcement.id}
              title={announcement.title}
              preview={announcement.preview}
              type={announcement.type}
              isRead={announcement.isRead}
              sender={announcement.sender || undefined}
              publishedAt={announcement.publishedAt}
              onClick={handleAnnouncementClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

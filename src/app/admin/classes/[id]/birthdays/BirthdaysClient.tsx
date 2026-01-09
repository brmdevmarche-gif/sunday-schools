"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Cake,
  Calendar,
  Users,
  GraduationCap,
} from "lucide-react";

interface BirthdaysClientProps {
  classData: any;
  rosterData: any[];
}

interface UserWithBirthday {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  assignment_type: string;
  day: number;
}

export default function BirthdaysClient({
  classData,
  rosterData,
}: BirthdaysClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  // Month names based on locale
  const monthNames = useMemo(() => {
    if (locale === "ar") {
      return [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
    }
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  }, [locale]);

  // Organize users by birth month
  const birthdaysByMonth = useMemo(() => {
    const months: UserWithBirthday[][] = Array.from({ length: 12 }, () => []);

    rosterData.forEach((assignment) => {
      const user = assignment.user;
      if (user && user.date_of_birth) {
        const date = new Date(user.date_of_birth);
        const month = date.getMonth(); // 0-indexed
        const day = date.getDate();

        months[month].push({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          avatar_url: user.avatar_url,
          date_of_birth: user.date_of_birth,
          assignment_type: assignment.assignment_type,
          day,
        });
      }
    });

    // Sort each month by day
    months.forEach((month) => {
      month.sort((a, b) => a.day - b.day);
    });

    return months;
  }, [rosterData]);

  // Count totals
  const totalWithBirthdays = useMemo(() => {
    return rosterData.filter((r) => r.user?.date_of_birth).length;
  }, [rosterData]);

  const totalWithoutBirthdays = rosterData.length - totalWithBirthdays;

  function formatBirthday(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate();

    if (locale === "ar") {
      return `${day}`;
    }

    // Add ordinal suffix for English
    const suffix = getOrdinalSuffix(day);
    return `${day}${suffix}`;
  }

  function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  function getInitials(name: string | null, email: string): string {
    const displayName = name || email;
    return displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/classes/${classData.id}`)}
          >
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("common.back")}
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Cake className="h-8 w-8 text-pink-500" />
              <h1 className="text-3xl font-bold">{t("birthdays.title")}</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {classData.name} - {t("birthdays.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{rosterData.length}</p>
                <p className="text-sm text-muted-foreground">{t("birthdays.totalMembers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Cake className="h-8 w-8 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{totalWithBirthdays}</p>
                <p className="text-sm text-muted-foreground">{t("birthdays.withBirthdays")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalWithoutBirthdays}</p>
                <p className="text-sm text-muted-foreground">{t("birthdays.withoutBirthdays")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthNames.map((monthName, monthIndex) => (
          <Card key={monthIndex} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {monthName}
                </span>
                <Badge variant="secondary">
                  {birthdaysByMonth[monthIndex].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {birthdaysByMonth[monthIndex].length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("birthdays.noBirthdays")}
                </p>
              ) : (
                <div className="space-y-3">
                  {birthdaysByMonth[monthIndex].map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (user.assignment_type === "student") {
                          router.push(`/admin/students/${user.id}`);
                        } else {
                          router.push(`/admin/users/${user.id}`);
                        }
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar_url || undefined}
                          alt={user.full_name || user.email}
                        />
                        <AvatarFallback>
                          {getInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.full_name || user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant={user.assignment_type === "teacher" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {user.assignment_type === "teacher" ? (
                              <GraduationCap className="h-3 w-3 me-1" />
                            ) : (
                              <Users className="h-3 w-3 me-1" />
                            )}
                            {user.assignment_type === "teacher"
                              ? t("roles.teacher")
                              : t("roles.student")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-pink-500">
                        <Cake className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {formatBirthday(user.date_of_birth!)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

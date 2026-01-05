import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DashboardNavbar from "./DashboardNavbar";
import AnnouncementsWidget from "@/components/announcements/AnnouncementsWidget";
import {
  Bus,
  ShoppingBag,
  Activity,
  BookOpen,
  Bell,
  MapPin,
  ChevronRight,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

export const dynamic = 'force-dynamic'

async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export default async function DashboardPage() {
  const profile = await getUserProfile()
  const t = await getTranslations()

  if (!profile) {
    redirect("/login");
  }

  // Get student's class if student
  let studentClass: { id: string; name: string } | null = null;
  if (profile.role === "student") {
    const { data: classData } = await supabase
      .from("class_students")
      .select(`classes(id, name)`)
      .eq("student_id", profile.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (classData?.classes) {
      studentClass = classData.classes as unknown as {
        id: string;
        name: string;
      };
    }
  }

  // Get student's points balance
  let pointsBalance = {
    available_points: 0,
    suspended_points: 0,
    total_earned: 0,
  };
  const { data: balanceData } = await supabase
    .from("student_points_balance")
    .select("available_points, suspended_points, total_earned")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (balanceData) {
    pointsBalance = balanceData;
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navigationCards = [
    {
      title: t("studentHome.trips"),
      description: t("studentHome.tripsDescription"),
      href: "/trips",
      icon: Bus,
      color: "bg-blue-500",
      available: true,
    },
    {
      title: t("studentHome.store"),
      description: t("studentHome.storeDescription"),
      href: "/store",
      icon: ShoppingBag,
      color: "bg-green-500",
      available: true,
    },
    {
      title: t("studentHome.activities"),
      description: t("studentHome.activitiesDescription"),
      href: "/activities",
      icon: Activity,
      color: "bg-purple-500",
      available: true,
    },
    {
      title: t("studentHome.announcements"),
      description: t("studentHome.announcementsDescription"),
      href: "/announcements",
      icon: Bell,
      color: "bg-orange-500",
      available: true,
    },
    {
      title: t("studentHome.lessons"),
      description: t("studentHome.lessonsDescription"),
      href: "/lessons",
      icon: BookOpen,
      color: "bg-red-500",
      available: false,
      comingSoon: true,
    },
  ];

  const churchData = profile.churches as {
    name: string;
    cover_image_url: string | null;
  } | null;
  const churchName = churchData?.name;
  const churchImage = churchData?.cover_image_url;

  // Default church cover image
  const defaultCoverImage =
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&h=400&fit=crop";

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <DashboardActions />
        </div>

        <SecurityAlerts />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{profile?.full_name || profile?.username || t('dashboard.welcomeBack')}</CardTitle>
              <CardDescription>{t('dashboard.profileInfo')}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/profile">{t('dashboard.editProfile')}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.avatar_url && (
              <div className="flex items-center space-x-4">
                <img
                  src={profile.avatar_url}
                  alt={t('dashboard.profile')}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              </div>
            )}

            <div className="grid gap-3">
              <div>
                <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.email')}</span>
                <p>{profile?.email}</p>
              </div>

              {profile?.username && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.username')}</span>
                  <p>@{profile.username}</p>
                </div>
              )}

              {profile?.full_name && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.fullName')}</span>
                  <p>{profile.full_name}</p>
                </div>
              )}

              {profile?.bio && (
                <div>
                  <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.bio')}</span>
                  <p className="text-sm">{profile.bio}</p>
                </div>
              )}

              <div>
                <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.accountCreated')}</span>
                <p>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-sm text-muted-foreground">{t('dashboard.userId')}</span>
                <p className="font-mono text-xs">{profile?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {t("studentHome.quickAccess")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card) => (
              <Link
                key={card.title}
                href={card.available ? card.href : "#"}
                className={card.available ? "" : "cursor-not-allowed"}
              >
                <Card
                  className={`h-full transition-all hover:shadow-md ${
                    card.available ? "hover:scale-[1.02]" : "opacity-60"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${card.color}`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      {card.comingSoon && (
                        <Badge variant="secondary" className="text-xs">
                          {t("studentHome.comingSoon")}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-4">{card.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {card.description}
                    </p>
                    {card.available && (
                      <div className="flex items-center gap-1 text-sm text-primary mt-3">
                        <span>{t("studentHome.viewMore")}</span>
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="pt-2">
          <AnnouncementsWidget />
        </div>
      </div>
    </div>
  )
}

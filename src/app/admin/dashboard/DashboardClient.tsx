"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Building2, Church, School, Users, Bell } from "lucide-react";
import type { ExtendedUser } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DashboardClientProps {
  userProfile: ExtendedUser;
  stats: {
    dioceses: number;
    churches: number;
    classes: number;
    users: number;
  };
}

export default function DashboardClient({
  userProfile,
  stats,
}: DashboardClientProps) {
  const t = useTranslations();
  const [annCount, setAnnCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_unviewed_announcements_count");
        if (error) return;
        setAnnCount((data as number) || 0);
      } catch {
        // ignore
      }
    }
    loadCount();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {userProfile?.full_name || "Admin"}!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {userProfile.role === "super_admin" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Dioceses
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.dioceses}</div>
                <p className="text-xs text-muted-foreground">
                  Across the system
                </p>
              </CardContent>
            </Card>
          )}

          {(userProfile.role === "super_admin" ||
            userProfile.role === "diocese_admin") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {userProfile.role === "super_admin"
                    ? "Total Churches"
                    : "Churches in Diocese"}
                </CardTitle>
                <Church className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.churches}</div>
                <p className="text-xs text-muted-foreground">Active churches</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userProfile.role === "teacher"
                  ? "My Classes"
                  : "Total Classes"}
              </CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.classes}</div>
              <p className="text-xs text-muted-foreground">
                Sunday school classes
              </p>
            </CardContent>
          </Card>

          {userProfile.role !== "teacher" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
                <p className="text-xs text-muted-foreground">
                  Students, teachers, parents
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("adminDashboard.quickActions.title")}</CardTitle>
          <CardDescription>
            {t("adminDashboard.quickActions.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/announcements/inbox" className="block">
              <Card className="cursor-pointer hover:bg-muted transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{t("nav.announcements")}</span>
                    {annCount > 0 && (
                      <Badge className="text-xs px-2 py-0.5">{annCount}</Badge>
                    )}
                  </CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Unread announcements for your account.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {userProfile?.role === "super_admin" && (
              <Card className="cursor-pointer hover:bg-muted transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("adminDashboard.quickActions.manageDioceses")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("adminDashboard.quickActions.addEditDioceses")}
                  </p>
                </CardContent>
              </Card>
            )}

              {(userProfile?.role === "super_admin" ||
                userProfile?.role === "diocese_admin") && (
                <Card className="cursor-pointer hover:bg-muted transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">Manage Churches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Add or edit churches
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="cursor-pointer hover:bg-muted transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Manage Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create and organize classes
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted transition-colors">
                <CardHeader>
                  <CardTitle className="text-base">Manage Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add teachers, students, parents
                  </p>
                </CardContent>
              </Card>

              {userProfile?.role === "teacher" && (
                <>
                  <Card className="cursor-pointer hover:bg-muted transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">My Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        View assigned classes
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted transition-colors">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Take Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Mark student attendance
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

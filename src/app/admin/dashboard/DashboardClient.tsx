"use client";

import { useTranslations } from "next-intl";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Church, School, Users } from "lucide-react";
import type { ExtendedUser } from "@/lib/types";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("adminDashboard.title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("adminDashboard.welcome", {
            name: userProfile?.full_name || t("adminDashboard.admin"),
          })}
        </p>
        {userProfile?.user_code && (
          <p className="text-sm text-muted-foreground mt-1">
            {t("users.userCode")}: <span className="font-mono font-medium text-foreground">{userProfile.user_code}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userProfile.role === "super_admin" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("adminDashboard.stats.totalDioceses")}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dioceses}</div>
              <p className="text-xs text-muted-foreground">
                {t("adminDashboard.stats.acrossSystem")}
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
                  ? t("adminDashboard.stats.totalChurches")
                  : t("adminDashboard.stats.churchesInDiocese")}
              </CardTitle>
              <Church className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.churches}</div>
              <p className="text-xs text-muted-foreground">
                {t("adminDashboard.stats.activeChurches")}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userProfile.role === "teacher"
                ? t("adminDashboard.stats.myClasses")
                : t("adminDashboard.stats.totalClasses")}
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classes}</div>
            <p className="text-xs text-muted-foreground">
              {t("adminDashboard.stats.sundaySchoolClasses")}
            </p>
          </CardContent>
        </Card>

        {userProfile.role !== "teacher" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("adminDashboard.stats.totalUsers")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                {t("adminDashboard.stats.usersDescription")}
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
                  <CardTitle className="text-base">
                    {t("adminDashboard.quickActions.manageChurches")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("adminDashboard.quickActions.addEditChurches")}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="cursor-pointer hover:bg-muted transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("adminDashboard.quickActions.manageClasses")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("adminDashboard.quickActions.createOrganizeClasses")}
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted transition-colors">
              <CardHeader>
                <CardTitle className="text-base">
                  {t("adminDashboard.quickActions.manageUsers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("adminDashboard.quickActions.addUsers")}
                </p>
              </CardContent>
            </Card>

            {userProfile?.role === "teacher" && (
              <>
                <Card className="cursor-pointer hover:bg-muted transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("adminDashboard.quickActions.myClasses")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("adminDashboard.quickActions.viewAssignedClasses")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-muted transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("adminDashboard.quickActions.takeAttendance")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("adminDashboard.quickActions.markAttendance")}
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
          <CardTitle>{t("adminDashboard.recentActivity.title")}</CardTitle>
          <CardDescription>
            {t("adminDashboard.recentActivity.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("adminDashboard.recentActivity.noActivity")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

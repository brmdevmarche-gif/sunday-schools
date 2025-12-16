"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AdminSidebar from "./AdminSidebar";
import { getCurrentUserProfileClient } from "@/lib/sunday-school/users";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface UserProfile {
  role: string;
  full_name?: string | null;
  email: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const t = useTranslations();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        // Load user profile
        const profile = await getCurrentUserProfileClient();

        if (!profile) {
          toast.error(t("errors.notAuthenticated"));
          router.push("/login");
          return;
        }

        // Check if user can access admin panel
        const canAccess = [
          "super_admin",
          "diocese_admin",
          "church_admin",
          "teacher",
        ].includes(profile.role);
        if (!canAccess) {
          toast.error(t("errors.notAuthorized"));
          router.push("/dashboard");
          return;
        }

        setUserProfile(profile);

        // Build navigation items based on role
        const items: NavItem[] = [];

        // Dashboard - available to all admin users
        items.push({
          name: t("nav.dashboard"),
          href: "/admin",
          icon: "dashboard",
        });

        // Quick Attendance - for teachers and super admins
        if (profile.role === "teacher" || profile.role === "super_admin") {
          items.push({
            name: t("attendance.quickAttendance"),
            href: "/attendance",
            icon: "check",
          });
        }

        // Diocese Management - super admin only
        if (profile.role === "super_admin") {
          items.push({
            name: t("nav.dioceses"),
            href: "/admin/dioceses",
            icon: "building",
          });
        }

        // Church Management - super admin and diocese admin
        if (
          profile.role === "super_admin" ||
          profile.role === "diocese_admin"
        ) {
          items.push({
            name: t("nav.churches"),
            href: "/admin/churches",
            icon: "church",
          });
        }

        // Class Management - all admins and teachers
        items.push({
          name: t("nav.classes"),
          href: "/admin/classes",
          icon: "school",
        });

        // Attendance - all admins and teachers
        items.push({
          name: t("attendance.title"),
          href: "/admin/attendance",
          icon: "check",
        });

        // Student Management - all admins
        if (
          ["super_admin", "diocese_admin", "church_admin"].includes(
            profile.role
          )
        ) {
          items.push({
            name: "Students",
            href: "/admin/students",
            icon: "student",
          });
        }

        // User Management - all admins
        if (
          ["super_admin", "diocese_admin", "church_admin"].includes(
            profile.role
          )
        ) {
          items.push({
            name: t("nav.users"),
            href: "/admin/users",
            icon: "users",
          });
        }

        // Store Management - super admin and church admin
        if (["super_admin", "church_admin"].includes(profile.role)) {
          items.push({ name: "Store", href: "/admin/store", icon: "store" });
        }

        // Activities Management - all admins and teachers
        items.push({
          name: t("activities.title"),
          href: "/admin/activities",
          icon: "trophy",
        });

        // Trips Management - all admins and teachers
        items.push({
          name: "Trips",
          href: "/admin/trips",
          icon: "trip",
        });

        setNavItems(items);
      } catch (error) {
        console.error("Error loading admin layout:", error);
        toast.error(t("errors.serverError"));
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router, t]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(t("nav.logout"));
      router.push("/login");
    } catch {
      toast.error(t("errors.serverError"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <AdminSidebar
          items={navItems}
          userRole={userProfile?.role}
          userName={userProfile?.full_name || userProfile?.email}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="default" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>{t("nav.dashboard")}</SheetTitle>
          </VisuallyHidden>
          <AdminSidebar
            items={navItems}
            userRole={userProfile?.role}
            userName={userProfile?.full_name || userProfile?.email}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto pt-22 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AdminSidebar from "./AdminSidebar";
import { getCurrentUserProfileClient } from "@/lib/sunday-school/users";
import { NAVIGATION_ITEMS, filterNavigationByPermissions } from "@/lib/permissions/navigation";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { hasForbiddenPermission } from "@/lib/permissions/forbidden";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clientLogger } from '@/lib/client-logger'

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface UserProfile {
  id: string;
  role: string;
  full_name?: string | null;
  email: string;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { permissionCodes, isLoading: permissionsLoading, error: permissionsError } = usePermissions();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastDeniedPathRef = useRef<string | null>(null);
  const lastForbiddenToastRef = useRef(false);

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
      } catch (error) {
        clientLogger.error("Error loading admin layout", error);
        toast.error(t("errors.serverError"));
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router, t]);

  const navItems: NavItem[] = useMemo(() => {
    if (!userProfile) return [];

    const roleBasedFallback = (): NavItem[] => {
      const items: NavItem[] = [];

      items.push({
        name: t("nav.dashboard"),
        href: "/admin",
        icon: "dashboard",
      });

      if (userProfile.role === "teacher" || userProfile.role === "super_admin") {
        items.push({
          name: t("attendance.quickAttendance"),
          href: "/attendance",
          icon: "check",
        });
      }

      if (userProfile.role === "super_admin") {
        items.push({
          name: t("nav.dioceses"),
          href: "/admin/dioceses",
          icon: "building",
        });
      }

      if (userProfile.role === "super_admin" || userProfile.role === "diocese_admin") {
        items.push({
          name: t("nav.churches"),
          href: "/admin/churches",
          icon: "church",
        });
      }

      items.push({
        name: t("nav.classes"),
        href: "/admin/classes",
        icon: "school",
      });

      items.push({
        name: t("attendance.title"),
        href: "/admin/attendance",
        icon: "check",
      });

      if (["super_admin", "diocese_admin", "church_admin"].includes(userProfile.role)) {
        items.push({
          name: "Students",
          href: "/admin/students",
          icon: "student",
        });
      }

      if (["super_admin", "diocese_admin", "church_admin"].includes(userProfile.role)) {
        items.push({
          name: t("nav.users"),
          href: "/admin/users",
          icon: "users",
        });
      }

      if (["super_admin", "church_admin"].includes(userProfile.role)) {
        items.push({ name: "Store", href: "/admin/store", icon: "store" });
      }

      items.push({
        name: t("activities.title"),
        href: "/admin/activities",
        icon: "trophy",
      });

      items.push({
        name: "Trips",
        href: "/admin/trips",
        icon: "trip",
      });

      items.push({
        name: t("nav.announcements"),
        href: "/admin/announcements",
        icon: "announcement",
      });

      return items;
    };

    // While loading or when permissions are failing, keep a reasonable fallback menu.
    if (permissionsLoading || permissionsError) {
      return roleBasedFallback();
    }

    const filteredNav = filterNavigationByPermissions(NAVIGATION_ITEMS, permissionCodes);

    const items: NavItem[] = filteredNav.map((item) => {
      const translationKey = item.name.toLowerCase().replace(/\s+/g, "_");
      let translatedName: string;
      try {
        translatedName = t(`nav.${translationKey}`);
      } catch {
        translatedName = item.name;
      }

      return {
        name: translatedName,
        href: item.href,
        icon: item.icon,
      };
    });

    // Keep the old "Quick Attendance" shortcut (outside /admin) when allowed.
    if (
      (userProfile.role === "teacher" || userProfile.role === "super_admin") &&
      permissionCodes.includes("attendance.view")
    ) {
      const alreadyPresent = items.some((i) => i.href === "/attendance");
      if (!alreadyPresent) {
        items.splice(1, 0, {
          name: t("attendance.quickAttendance"),
          href: "/attendance",
          icon: "check",
        });
      }
    }

    return items;
  }, [permissionCodes, permissionsError, permissionsLoading, t, userProfile]);

  const isForbiddenAdmin = useMemo(() => {
    if (permissionsLoading || permissionsError) return false;
    return hasForbiddenPermission(permissionCodes);
  }, [permissionCodes, permissionsError, permissionsLoading]);

  // Forbidden permission gate: block all admin actions and force the user to /admin.
  useEffect(() => {
    if (!userProfile) return;
    if (permissionsLoading || permissionsError) return;
    if (!isForbiddenAdmin) return;

    if (pathname !== "/admin") {
      router.replace("/admin");
    }

    if (!lastForbiddenToastRef.current) {
      lastForbiddenToastRef.current = true;
      toast.error(
        "You are not eligible to do any actions in this admin app."
      );
    }
  }, [isForbiddenAdmin, pathname, permissionsError, permissionsLoading, router, userProfile]);

  // If permissions change and the current route is no longer allowed, redirect away.
  useEffect(() => {
    if (!userProfile) return;
    if (permissionsLoading || permissionsError) return;
    if (isForbiddenAdmin) return;

    const path = pathname || "";

    // Handle the legacy non-admin quick route.
    if (path.startsWith("/attendance") && !permissionCodes.includes("attendance.view")) {
      if (lastDeniedPathRef.current !== path) {
        lastDeniedPathRef.current = path;
        toast.error(t("errors.notAuthorized"));
      }
      router.replace("/admin");
      return;
    }

    if (!path.startsWith("/admin")) return;

    const match = NAVIGATION_ITEMS
      .filter((item) => path === item.href || path.startsWith(item.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];

    if (!match?.permission) return;

    if (!permissionCodes.includes(match.permission)) {
      if (lastDeniedPathRef.current !== path) {
        lastDeniedPathRef.current = path;
        toast.error(t("errors.notAuthorized"));
      }
      router.replace("/admin");
    }
  }, [pathname, permissionCodes, permissionsError, permissionsLoading, router, t, userProfile]);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  if (isForbiddenAdmin) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Not eligible</CardTitle>
            <CardDescription>
              You are not eligible to do any actions in this admin app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
            <Button onClick={handleLogout}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Header with Burger Menu */}
      <div className="fixed top-0 inset-x-0 z-40 flex h-14 items-center border-b bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <span className="ms-3 text-lg font-semibold">Knesty</span>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 ltr:left-0 rtl:right-0 z-50 transform transition-transform duration-300 lg:hidden",
          isMobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
        )}
      >
        <AdminSidebar
          items={navItems}
          userRole={userProfile?.role}
          userName={userProfile?.full_name || userProfile?.email}
          onLogout={handleLogout}
          isMobile={true}
          onClose={() => setIsMobileOpen(false)}
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">
        <AdminSidebar
          items={navItems}
          userRole={userProfile?.role}
          userName={userProfile?.full_name || userProfile?.email}
          onLogout={handleLogout}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

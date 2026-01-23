"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AdminSidebar from "./AdminSidebar";
import { getCurrentUserProfileClient } from "@/lib/sunday-school/users";
import { getUserPermissionCodes } from "@/lib/sunday-school/roles.client";
import { NAVIGATION_ITEMS, filterNavigationByPermissions } from "@/lib/permissions/navigation";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const t = useTranslations();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

        // Try to get user permissions (new system)
        // Fallback to role-based navigation if permissions not available
        try {
          const permissionCodes = await getUserPermissionCodes();
          
          // Filter navigation items based on permissions
          const filteredNav = filterNavigationByPermissions(
            NAVIGATION_ITEMS,
            permissionCodes
          );

          // Map to NavItem format with translations
          const items: NavItem[] = filteredNav.map((item) => {
            // Map icon names to translation keys
            const translationKey = item.name.toLowerCase().replace(/\s+/g, '_');
            // Try to get translation, fallback to original name if not found
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

          // Add Quick Attendance for teachers (legacy support)
          if (
            (profile.role === "teacher" || profile.role === "super_admin") &&
            permissionCodes.includes("attendance.view")
          ) {
            items.splice(1, 0, {
              name: t("attendance.quickAttendance"),
              href: "/attendance",
              icon: "check",
            });
          }

          setNavItems(items);
        } catch (error) {
          // Fallback to role-based navigation if permissions fail
          console.warn("Failed to load permissions, using role-based navigation:", error);
          
          // Build navigation items based on role (backward compatibility)
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

          // Announcements Management - all admins and teachers
          items.push({
            name: t("nav.announcements"),
            href: "/admin/announcements",
            icon: "announcement",
          });

          setNavItems(items);
        }
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
      <main className="flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParentSidebar } from "./ParentSidebar";
import { Bell, Users, Star, ChevronDown } from "lucide-react";
import type { ParentChild } from "@/lib/types";

interface ParentDashboardNavbarProps {
  parentName: string | null;
  parentAvatar: string | null;
  parentChildren: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
}

export function ParentDashboardNavbar({
  parentName,
  parentAvatar,
  parentChildren,
  pendingApprovalsCount,
  unreadNotificationsCount,
}: ParentDashboardNavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);

  const isRTL = locale === "ar";
  const selectedChildId = searchParams.get("for");
  const isHomePage = pathname === "/dashboard/parents";

  // Find selected child
  const selectedChild = parentChildren.find((c) => c.id === selectedChildId);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "P";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChildChange = (childId: string) => {
    if (childId === "all") {
      // Remove the 'for' param
      const params = new URLSearchParams(searchParams.toString());
      params.delete("for");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.push(newUrl);
    } else {
      // Set the 'for' param
      const params = new URLSearchParams(searchParams.toString());
      params.set("for", childId);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const totalBadgeCount = pendingApprovalsCount + unreadNotificationsCount;

  // Determine if we should show the child selector
  // Show it when:
  // - Not on home page (always required)
  // - On home page with more than one child (optional, can select "all")
  const showChildSelector = parentChildren.length > 0;
  const showAllOption = isHomePage;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 ${
        isScrolled
          ? "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg border-b border-white/20 dark:border-gray-700/50"
          : "bg-background border-b"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-2">
            <ParentSidebar
              parentName={parentName}
              parentChildren={parentChildren}
              pendingApprovalsCount={pendingApprovalsCount}
              unreadNotificationsCount={unreadNotificationsCount}
            />
            <Link href="/dashboard/parents" className="flex items-center gap-2">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-bold text-lg hidden sm:inline">Knasty</span>
            </Link>
          </div>

          {/* Center: Child Selector */}
          {showChildSelector && (
            <div className="flex-1 flex justify-center max-w-xs mx-4">
              <Select
                value={selectedChildId || "all"}
                onValueChange={handleChildChange}
              >
                <SelectTrigger className="w-full bg-muted/50 border-0">
                  <div className="flex items-center gap-2">
                    {selectedChild ? (
                      <>
                        <OptimizedAvatar
                          src={selectedChild.avatar_url}
                          alt={selectedChild.full_name}
                          fallback={getInitials(selectedChild.full_name)}
                          size="xs"
                          className="h-6 w-6"
                        />
                        <div className="flex flex-col items-start text-start">
                          <span className="text-sm font-medium truncate max-w-[120px]">
                            {selectedChild.full_name}
                          </span>
                          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {selectedChild.points_balance}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {t("parents.nav.allChildren")}
                        </span>
                      </>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent align="center">
                  {showAllOption && (
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span>{t("parents.nav.allChildren")}</span>
                      </div>
                    </SelectItem>
                  )}
                  {parentChildren.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center gap-2">
                        <OptimizedAvatar
                          src={child.avatar_url}
                          alt={child.full_name}
                          fallback={getInitials(child.full_name)}
                          size="xs"
                          className="h-6 w-6"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">{child.full_name}</span>
                          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            {child.points_balance} {t("common.pts")}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Right: Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {/* Quick Notifications Button */}
            <Link href="/dashboard/parents/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-5 text-center">
                    {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
                  </span>
                )}
                <span className="sr-only">
                  {t("parents.notifications.title")}
                </span>
              </Button>
            </Link>

            {/* Parent Avatar */}
            <Link href="/dashboard/profile">
              <OptimizedAvatar
                src={parentAvatar}
                alt={parentName || "Parent"}
                fallback={getInitials(parentName)}
                size="sm"
                className="h-8 w-8 border-2 border-primary/10 cursor-pointer hover:border-primary/30 transition-colors"
                fallbackClassName="text-xs bg-primary/10 text-primary"
              />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

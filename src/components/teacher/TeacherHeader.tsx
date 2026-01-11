"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Settings, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { signOut } from "@/lib/auth";
import { SearchCommand, SearchTrigger, useSearchShortcut } from "./SearchCommand";

interface TeacherHeaderProps {
  /** Page title */
  title: string;
  /** Back link URL (if provided, shows back arrow) */
  backHref?: string;
  /** Back button aria-label */
  backLabel?: string;
  /** Show search button */
  showSearch?: boolean;
  /** Show profile dropdown (default: true) */
  showProfile?: boolean;
  /** Teacher name for avatar */
  teacherName?: string;
  /** Teacher avatar URL */
  teacherAvatar?: string;
  /** Additional class names */
  className?: string;
  /** Additional elements to render on the right */
  rightContent?: React.ReactNode;
}

/**
 * TeacherHeader - Consistent header for teacher dashboard pages
 * Includes back navigation (optional), title, search, and profile dropdown
 */
export function TeacherHeader({
  title,
  backHref,
  backLabel,
  showSearch = true,
  showProfile = true,
  teacherName,
  teacherAvatar,
  className,
  rightContent,
}: TeacherHeaderProps) {
  const router = useRouter();
  const t = useTranslations();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Cmd+K / Ctrl+K keyboard shortcut
  useSearchShortcut(() => setSearchOpen(true));

  const getInitials = (name?: string) => {
    if (!name) return "T";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      toast.success(t("studentHome.logoutSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("studentHome.logoutFailed"));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className
        )}
      >
        <div className="container flex h-14 items-center gap-4 px-4">
          {/* Back Button */}
          {backHref && (
            <Link
              href={backHref}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label={backLabel || t("teacher.search.back")}
            >
              <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
            </Link>
          )}

          {/* Title */}
          <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>

          {/* Right Content */}
          {rightContent}

          {/* Search Button */}
          {showSearch && <SearchTrigger onClick={() => setSearchOpen(true)} />}

          {/* Profile Dropdown */}
          {showProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  aria-label={t("nav.profile")}
                >
                  <OptimizedAvatar
                    src={teacherAvatar}
                    alt={teacherName || "Teacher"}
                    fallback={getInitials(teacherName)}
                    size="sm"
                    className="h-8 w-8"
                    fallbackClassName="text-xs bg-primary text-primary-foreground"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t("nav.settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? t("common.loading") : t("studentHome.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Search Dialog */}
      {showSearch && (
        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import {
  Menu,
  Home,
  AlertCircle,
  Bell,
  Megaphone,
  ShoppingBag,
  ShoppingCart,
  Bus,
  Activity,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Plus,
  Star,
  Check,
} from "lucide-react";
import type { ParentChild } from "@/lib/types";

type ChildRequiredAction = "store" | "trips" | "activities" | null;

interface ParentSidebarProps {
  parentName: string | null;
  parentChildren: ParentChild[];
  pendingApprovalsCount: number;
  unreadNotificationsCount: number;
  unreadAnnouncementsCount?: number;
}

export function ParentSidebar({
  parentName,
  parentChildren: children,
  pendingApprovalsCount,
  unreadNotificationsCount,
  unreadAnnouncementsCount = 0,
}: ParentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [childSelectorOpen, setChildSelectorOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChildRequiredAction>(null);
  const isRTL = locale === "ar";

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("auth.logoutSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("auth.logoutFailed"));
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (href: string) => pathname === href;
  const isChildActive = (childId: string) =>
    pathname.includes(`/children/${childId}`);

  // Handle navigation that requires child selection
  const handleChildRequiredNav = (action: ChildRequiredAction) => {
    if (children.length === 0) {
      toast.error(t("parents.nav.noChildrenForAction"));
      return;
    }

    if (children.length === 1) {
      // Only one child, navigate directly
      navigateWithChild(children[0].id, action);
    } else {
      // Multiple children, show selector
      setPendingAction(action);
      setChildSelectorOpen(true);
    }
  };

  const navigateWithChild = (childId: string, action: ChildRequiredAction) => {
    setIsOpen(false);
    setChildSelectorOpen(false);
    setPendingAction(null);

    switch (action) {
      case "store":
        router.push(`/store?for=${childId}`);
        break;
      case "trips":
        router.push(`/trips?for=${childId}`);
        break;
      case "activities":
        router.push(`/activities?for=${childId}`);
        break;
    }
  };

  const handleChildSelect = (childId: string) => {
    if (pendingAction) {
      navigateWithChild(childId, pendingAction);
    }
  };

  const getActionLabel = (action: ChildRequiredAction): string => {
    switch (action) {
      case "store":
        return t("parents.nav.selectChildForStore");
      case "trips":
        return t("parents.nav.selectChildForTrips");
      case "activities":
        return t("parents.nav.selectChildForActivities");
      default:
        return t("parents.selectChild");
    }
  };

  const NavLink = ({
    href,
    icon: Icon,
    label,
    badge,
    disabled,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
    badge?: number;
    disabled?: boolean;
  }) => (
    <Link
      href={disabled ? "#" : href}
      onClick={() => !disabled && setIsOpen(false)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        isActive(href)
          ? "bg-primary/10 text-primary"
          : disabled
          ? "opacity-50 cursor-not-allowed text-muted-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </span>
      <span className="flex items-center gap-2">
        {badge !== undefined && badge > 0 && (
          <Badge variant="destructive" className="text-xs px-2 py-0.5">
            {badge > 99 ? "99+" : badge}
          </Badge>
        )}
        {!disabled && <ChevronIcon className="h-4 w-4 text-muted-foreground" />}
      </span>
    </Link>
  );

  // Button that requires child selection
  const ChildRequiredNavButton = ({
    icon: Icon,
    label,
    action,
  }: {
    icon: React.ElementType;
    label: string;
    action: ChildRequiredAction;
  }) => (
    <button
      onClick={() => handleChildRequiredNav(action)}
      className="flex items-center justify-between px-3 py-2.5 w-full rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </span>
      <ChevronIcon className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  const ChildNavItem = ({ child }: { child: ParentChild }) => (
    <Link
      href={`/dashboard/parents/children/${child.id}`}
      onClick={() => setIsOpen(false)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
        isChildActive(child.id)
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <OptimizedAvatar
          src={child.avatar_url}
          alt={child.full_name}
          fallback={getInitials(child.full_name)}
          size="sm"
          className="h-8 w-8 border border-primary/20"
          fallbackClassName="text-xs bg-primary/20 text-primary"
        />
        <div className="flex flex-col">
          <span className="font-medium text-sm">{child.full_name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {child.class_name || t("parents.children.noClass")}
            <span className="text-amber-600 flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-current" />
              {child.points_balance}
            </span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {child.pending_approvals_count > 0 && (
          <Badge variant="destructive" className="text-xs">
            {child.pending_approvals_count}
          </Badge>
        )}
        <ChevronIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );

  // Child selector item for the dialog
  const ChildSelectorItem = ({ child }: { child: ParentChild }) => (
    <button
      onClick={() => handleChildSelect(child.id)}
      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <OptimizedAvatar
          src={child.avatar_url}
          alt={child.full_name}
          fallback={getInitials(child.full_name)}
          size="md"
          className="h-10 w-10"
        />
        <div className="text-start">
          <p className="font-medium">{child.full_name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {child.class_name && <span>{child.class_name}</span>}
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="h-3 w-3 fill-current" />
              {child.points_balance}
            </span>
          </div>
        </div>
      </div>
      <ChevronIcon className="h-5 w-5 text-muted-foreground" />
    </button>
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t("common.menu")}</span>
          </Button>
        </SheetTrigger>

        <SheetContent
          side={isRTL ? "right" : "left"}
          className="w-[300px] sm:w-[350px] overflow-y-auto"
        >
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Image
                src="/Logo.png"
                alt="Knasty"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div className="text-start">
                <SheetTitle>{t("common.welcome")}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {parentName?.split(" ")[0] || t("parents.dashboard.title")}
                </p>
              </div>
            </div>
          </SheetHeader>

          <nav className="mt-6 space-y-6">
            {/* Home Section */}
            <div>
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("parents.nav.home")}
              </p>
              <NavLink
                href="/dashboard/parents"
                icon={Home}
                label={t("nav.dashboard")}
              />
            </div>

            {/* My Children Section */}
            <div>
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("parents.children.title")}
              </p>
              <div className="space-y-1">
                {children.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    {t("parents.dashboard.noChildren")}
                  </p>
                ) : (
                  children.map((child) => (
                    <ChildNavItem key={child.id} child={child} />
                  ))
                )}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    toast.info(t("parents.nav.addChildInfo"));
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label={t("parents.nav.addChild")}
                >
                  <div className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{t("parents.nav.addChild")}</span>
                </button>
              </div>
            </div>

            {/* Actions Section */}
            <div>
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("parents.nav.actions")}
              </p>
              <div className="space-y-1">
                <NavLink
                  href="/dashboard/parents/approvals"
                  icon={AlertCircle}
                  label={t("parents.approvals.title")}
                  badge={pendingApprovalsCount}
                />
                <NavLink
                  href="/dashboard/parents/notifications"
                  icon={Bell}
                  label={t("parents.notifications.title")}
                  badge={unreadNotificationsCount}
                />
                <NavLink
                  href="/announcements"
                  icon={Megaphone}
                  label={t("nav.announcements")}
                  badge={unreadAnnouncementsCount}
                />
              </div>
            </div>

            {/* For My Children Section - Requires child selection */}
            <div>
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("parents.nav.forMyChildren")}
              </p>
              <div className="space-y-1">
                <ChildRequiredNavButton
                  icon={ShoppingBag}
                  label={t("parents.nav.store")}
                  action="store"
                />
                <NavLink
                  href="/dashboard/parents/orders"
                  icon={ShoppingCart}
                  label={t("parents.nav.orders")}
                />
                <ChildRequiredNavButton
                  icon={Bus}
                  label={t("parents.nav.trips")}
                  action="trips"
                />
                <ChildRequiredNavButton
                  icon={Activity}
                  label={t("parents.nav.activities")}
                  action="activities"
                />
              </div>
            </div>

            <Separator />

            {/* Account Section */}
            <div>
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("parents.nav.account")}
              </p>
              <div className="space-y-1">
                <NavLink
                  href="/dashboard/profile"
                  icon={User}
                  label={t("nav.profile")}
                />
                <NavLink
                  href="/dashboard/settings"
                  icon={Settings}
                  label={t("nav.settings")}
                />
              </div>
            </div>

            <Separator />

            {/* Logout */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              {t("auth.logout")}
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Child Selector Dialog */}
      <Dialog open={childSelectorOpen} onOpenChange={setChildSelectorOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{getActionLabel(pendingAction)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {children.map((child) => (
              <ChildSelectorItem key={child.id} child={child} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

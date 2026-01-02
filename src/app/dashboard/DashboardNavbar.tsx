"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { signOut } from "@/lib/auth";
import {
  Menu,
  Home,
  Bus,
  ShoppingBag,
  Activity,
  Bell,
  BookOpen,
  User,
  Settings,
  LogOut,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";

interface DashboardNavbarProps {
  userName?: string | null;
}

export default function DashboardNavbar({ userName }: DashboardNavbarProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("studentHome.logoutSuccess"));
      router.push("/login");
    } catch {
      toast.error(t("studentHome.logoutFailed"));
    }
  };

  const navigationItems = [
    {
      title: t("nav.dashboard"),
      href: "/dashboard",
      icon: Home,
    },
    {
      title: t("studentHome.trips"),
      href: "/trips",
      icon: Bus,
    },
    {
      title: t("studentHome.store"),
      href: "/store",
      icon: ShoppingBag,
    },
    {
      title: t("store.myOrders"),
      href: "/store/orders",
      icon: ShoppingCart,
    },
    {
      title: t("studentHome.activities"),
      href: "/activities",
      icon: Activity,
    },
    {
      title: t("studentHome.announcements"),
      href: "/announcements",
      icon: Bell,
      disabled: true,
    },
    {
      title: t("studentHome.lessons"),
      href: "/lessons",
      icon: BookOpen,
      disabled: true,
    },
  ];

  const accountItems = [
    {
      title: t("nav.profile"),
      href: "/dashboard/profile",
      icon: User,
    },
    {
      title: t("nav.settings"),
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg border-b border-white/20 dark:border-gray-700/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/Logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span
              className={`font-bold text-lg hidden sm:inline transition-colors ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              Knasty
            </span>
          </Link>

          {/* Burger Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant={isScrolled ? "outline" : "secondary"}
                size="icon"
                className={`shrink-0 ${
                  !isScrolled
                    ? "bg-white/20 hover:bg-white/30 border-white/30"
                    : ""
                }`}
              >
                <Menu
                  className={`h-5 w-5 ${!isScrolled ? "text-white" : ""}`}
                />
                <span className="sr-only">{t("studentHome.menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[350px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 shadow-lg border-b border-white/20 dark:border-gray-700/50"
            >
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Image
                    src="/Logo.png"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  <SheetTitle className="text-left">
                    {userName
                      ? t("common.welcome") + ", " + userName.split(" ")[0]
                      : "Knasty"}
                  </SheetTitle>
                </div>
              </SheetHeader>

              <nav className="flex flex-col gap-1 mt-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.disabled ? "#" : item.href}
                    onClick={() => !item.disabled && setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      item.disabled
                        ? "opacity-50 cursor-not-allowed text-muted-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.title}</span>
                    {item.disabled && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {t("common.comingSoon")}
                      </span>
                    )}
                    {!item.disabled && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    )}
                  </Link>
                ))}
              </nav>

              <Separator className="my-4" />

              <div className="space-y-1">
                <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {t("studentHome.account")}
                </p>
                {accountItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                  </Link>
                ))}
              </div>

              <Separator className="my-4" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                {t("studentHome.logout")}
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

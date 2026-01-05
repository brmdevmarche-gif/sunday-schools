"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor, Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

export default function Home() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleLanguageChange(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-end p-4">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <Select value={locale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-auto gap-2">
              <Globe className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme Selector */}
          {mounted && (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-auto gap-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t("settings.light")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t("settings.dark")}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t("settings.system")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Logo.png"
                alt="Knasty Logo"
                width={100}
                height={100}
                className="rounded-xl"
              />
            </div>
            <CardTitle className="text-3xl font-bold">Knasty</CardTitle>
            <CardDescription className="text-base mt-2">
              {t("common.sundaySchoolSystem") ||
                "Sunday School Management System"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <Button asChild size="lg" className="w-full">
                <Link href="/login">{t("auth.logIn")}</Link>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {t("auth.contactAdmin") ||
                "Contact your administrator to get your login credentials"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

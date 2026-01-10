"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { logLoginAttempt } from "@/lib/login-history";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { toast } from "sonner";
import { ArrowLeft, Sun, Moon, Monitor, Globe } from "lucide-react";
import { getEmailByUserCode } from "./actions";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleLanguageChange(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      let email = identifier;

      // Check if input is a user_code (numeric, 6 digits) instead of email
      if (/^\d{6}$/.test(identifier)) {
        // Look up the email by user_code using server action
        const userEmail = await getEmailByUserCode(identifier);

        if (!userEmail) {
          throw new Error(t("auth.invalidUserCode"));
        }

        email = userEmail;
      }

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      // Log successful login
      if (user?.id) {
        await logLoginAttempt(user.id, true);
      }

      toast.success(t("auth.loginSuccess"));
      router.refresh();

      // Fetch user's role to determine redirect
      if (user?.id) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        // Redirect based on role
        if (profile?.role) {
          switch (profile.role) {
            case "super_admin":
            case "diocese_admin":
            case "church_admin":
              router.push("/admin");
              break;
            case "teacher":
              router.push("/dashboard/teacher");
              break;
            case "parent":
              router.push("/dashboard/parents");
              break;
            default:
              router.push("/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      // Log failed login attempt
      const errorMessage =
        error instanceof Error ? error.message : t("auth.loginFailed");
      await logLoginAttempt(null, false, errorMessage);

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>

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
                {theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
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

      {/* Login Form */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/Logo.png"
                alt="Knasty Logo"
                width={80}
                height={80}
                className="rounded-xl"
              />
            </div>
            <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
            <CardDescription>
              {t("auth.loginDescription")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">{t("auth.emailOrUserCode")}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t("auth.emailOrUserCodePlaceholder")}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="mt-6">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("auth.loggingIn") : t("auth.logIn")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

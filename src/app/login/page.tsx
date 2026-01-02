"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth";
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
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await signIn(identifier, password);

      // Log successful login
      if (user?.id) {
        await logLoginAttempt(user.id, true);
      }

      toast.success(t("auth.loginSuccess"));
      router.refresh();

      // Fetch user's role to determine redirect
      if (user?.id) {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        // Redirect admins to /admin, students/parents to /dashboard
        const adminRoles = ["super_admin", "diocese_admin", "church_admin", "teacher"];
        if (profile?.role && adminRoles.includes(profile.role)) {
          router.push("/admin");
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.login")}</CardTitle>
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
          <CardFooter className="mt-6 flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("auth.loggingIn") : t("auth.logIn")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link href="/signup" className="text-primary hover:underline">
                {t("auth.signUp")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

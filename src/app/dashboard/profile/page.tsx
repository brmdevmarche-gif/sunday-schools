"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserProfile,
  updateUserProfile,
  isUsernameAvailable,
  type UserProfile,
} from "@/lib/profile";
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
import { ArrowLeft } from "lucide-react";

export default function ProfileEditPage() {
  const router = useRouter();
  const t = useTranslations();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }

        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          setUsername(userProfile.username || "");
          setFullName(userProfile.full_name || "");
          setAvatarUrl(userProfile.avatar_url || "");
          setBio(userProfile.bio || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error(t("profile.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate username if changed
      if (username && username !== profile?.username) {
        const available = await isUsernameAvailable(username);
        if (!available) {
          toast.error(t("profile.usernameTaken"));
          setIsSaving(false);
          return;
        }
      }

      // Update profile
      const updates = {
        username: username || undefined,
        full_name: fullName || undefined,
        avatar_url: avatarUrl || undefined,
        bio: bio || undefined,
      };

      const updatedProfile = await updateUserProfile(updates);
      setProfile(updatedProfile);
      toast.success(t("profile.profileUpdated"));

      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : t("profile.updateFailed")
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t("profile.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 me-1 rtl:rotate-180" />
              {t("profile.backToDashboard")}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("profile.editProfile")}</CardTitle>
            <CardDescription>{t("profile.updateProfileInfo")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t("profile.username")}</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-1">@</span>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    disabled={isSaving}
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.usernameHint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">{t("profile.fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatarUrl">{t("profile.avatarUrl")}</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.avatarUrlHint")}
                </p>
                {avatarUrl && (
                  <div className="mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt={t("profile.avatarPreview")}
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("profile.bio")}</Label>
                <textarea
                  id="bio"
                  placeholder={t("profile.bioPlaceholder")}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isSaving}
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500 {t("profile.characters")}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isSaving}
              >
                {t("profile.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("profile.saving") : t("profile.saveChanges")}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

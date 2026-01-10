"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

interface LanguageSwitcherProps {
  showLabel?: boolean;
  onLanguageChange?: (locale: string) => void;
}

export default function LanguageSwitcher({
  showLabel = true,
  onLanguageChange,
}: LanguageSwitcherProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLanguageChange(newLocale: string) {
    startTransition(() => {
      // Set locale cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // Call optional callback
      if (onLanguageChange) {
        onLanguageChange(newLocale);
      }

      // Refresh to apply new locale
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {showLabel && <Label>{t("settings.language")}</Label>}
      <Select
        value={locale}
        onValueChange={handleLanguageChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

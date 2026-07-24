"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Menu,
  Sun,
  Moon,
  Monitor,
  Globe,
  Code,
  Code2,
  Home,
  GraduationCap,
  BookOpen,
  Users,
  Church,
  Building2,
  Shield,
} from "lucide-react";
import { DOCS_SECTIONS, filterSectionsByRole } from "./docs-content";
import type { UserRole } from "@/lib/types";

interface DocsClientProps {
  userRole?: UserRole | null;
  isAuthenticated: boolean;
}

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
];

const iconMap = {
  home: Home,
  "graduate-cap": GraduationCap,
  "book-open": BookOpen,
  users: Users,
  church: Church,
  "building-2": Building2,
  shield: Shield,
  code: Code,
  "code-2": Code2,
};

export default function DocsClient({
  userRole,
  isAuthenticated,
}: DocsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const visibleSections = filterSectionsByRole(userRole || null);

  useEffect(() => {
    if (visibleSections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(visibleSections[0].id);
      setExpandedAccordions([visibleSections[0].id]);
    }
  }, [visibleSections, selectedSectionId]);

  function handleLanguageChange(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  const selectedSection = visibleSections.find(
    (s) => s.id === selectedSectionId,
  );

  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Home;
  };

  const handleBackClick = () => {
    if (isAuthenticated) {
      router.back();
    } else {
      router.push("/login");
    }
  };

  const sidebarContent = (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <div className="space-y-6">
        {visibleSections.map((section) => {
          const Icon = getIcon(section.icon);
          return (
            <div key={section.id}>
              <button
                onClick={() => {
                  setSelectedSectionId(section.id);
                  setMobileMenuOpen(false);
                  if (!expandedAccordions.includes(section.id)) {
                    setExpandedAccordions([...expandedAccordions, section.id]);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-3",
                  selectedSectionId === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">
                  {t(section.titleKey)}
                </span>
              </button>

              {selectedSectionId === section.id &&
                section.subsections.length > 0 && (
                  <div className="space-y-1 ms-3 border-s border-muted ps-3">
                    {section.subsections.map((subsection) => (
                      <button
                        key={subsection.id}
                        onClick={() => {
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-start px-3 py-1.5 text-xs rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {t(subsection.titleKey)}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            aria-label={t("docs.backButton")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
            {t("docs.title")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label={t("common.menu")}>
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={locale === "ar" ? "right" : "left"}
              className="w-80"
            >
              <SheetHeader>
                <SheetTitle>{t("docs.title")}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{sidebarContent}</div>
            </SheetContent>
          </Sheet>

          {/* Language Selector */}
          <Select value={locale} onValueChange={handleLanguageChange}>
            <SelectTrigger
              className="w-auto gap-2"
              aria-label={t("common.language")}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
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
          {mounted ? (
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger
                className="w-auto gap-2"
                aria-label={t("common.theme")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" aria-hidden="true" />
                    {t("settings.light")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" aria-hidden="true" />
                    {t("settings.dark")}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" aria-hidden="true" />
                    {t("settings.system")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 w-9 rounded-md border border-input" />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-e lg:bg-card">
          {sidebarContent}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <main
            id="main-content"
            className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
          >
            {selectedSection ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {t(selectedSection.titleKey)}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {t(selectedSection.descriptionKey)}
                  </p>
                </div>

                {selectedSection.subsections.length > 0 ? (
                  <Accordion
                    type="single"
                    collapsible
                    value={expandedAccordions[0] || ""}
                    onValueChange={(value) => {
                      setExpandedAccordions(value ? [value] : []);
                    }}
                    className="w-full"
                  >
                    {selectedSection.subsections.map((subsection) => (
                      <AccordionItem key={subsection.id} value={subsection.id}>
                        <AccordionTrigger className="text-lg hover:no-underline">
                          {t(subsection.titleKey)}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                            {/* Content is rendered as plain text from i18n keys */}
                            {t(subsection.contentKey)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="rounded-lg border border-muted bg-muted/50 p-6 text-center">
                    <p className="text-muted-foreground">
                      {t("docs.noContent")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {t("docs.selectSection")}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

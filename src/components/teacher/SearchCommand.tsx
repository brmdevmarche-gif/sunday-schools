"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  User,
  BookOpen,
  Bus,
  Clock,
  Loader2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStudentDrawer } from "@/hooks/useStudentDrawer";
import { StudentDrawer } from "@/components/teacher/StudentDrawer";
import {
  searchAll,
  type SearchResults,
  type StudentSearchResult,
  type ClassSearchResult,
  type TripSearchResult,
} from "@/app/dashboard/teacher/search/actions";

// =====================================================
// TYPES
// =====================================================

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RecentSearch {
  id: string;
  type: "student" | "class" | "trip";
  title: string;
  subtitle?: string;
  timestamp: number;
}

// =====================================================
// LOCAL STORAGE HELPERS
// =====================================================

const RECENT_SEARCHES_KEY = "teacher-recent-searches";
const MAX_RECENT_SEARCHES = 5;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(search: Omit<RecentSearch, "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches().filter((r) => r.id !== search.id);
    const updated = [{ ...search, timestamp: Date.now() }, ...recent].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}

// =====================================================
// SEARCH COMMAND COMPONENT
// =====================================================

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const t = useTranslations("teacher.search");
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([]);
  const { student, isOpen, isLoading: drawerLoading, openDrawer, setIsOpen } = useStudentDrawer();

  // Load recent searches on mount
  React.useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchAll(query);
        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults({ students: [], classes: [], trips: [], totalCount: 0 });
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const handleStudentSelect = (student: StudentSearchResult) => {
    addRecentSearch({
      id: student.id,
      type: "student",
      title: student.name,
      subtitle: student.className,
    });
    onOpenChange(false);
    openDrawer(student.id);
  };

  const handleClassSelect = (cls: ClassSearchResult) => {
    addRecentSearch({
      id: cls.id,
      type: "class",
      title: cls.name,
      subtitle: cls.churchName,
    });
    onOpenChange(false);
    router.push(`/dashboard/teacher/classes/${cls.id}`);
  };

  const handleTripSelect = (trip: TripSearchResult) => {
    addRecentSearch({
      id: trip.id,
      type: "trip",
      title: trip.title,
      subtitle: trip.destination || undefined,
    });
    onOpenChange(false);
    router.push(`/dashboard/teacher/trips/${trip.id}`);
  };

  const handleRecentSelect = (recent: RecentSearch) => {
    switch (recent.type) {
      case "student":
        onOpenChange(false);
        openDrawer(recent.id);
        break;
      case "class":
        onOpenChange(false);
        router.push(`/dashboard/teacher/classes/${recent.id}`);
        break;
      case "trip":
        onOpenChange(false);
        router.push(`/dashboard/teacher/trips/${recent.id}`);
        break;
    }
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const hasResults =
    results && (results.students.length > 0 || results.classes.length > 0 || results.trips.length > 0);

  const getTypeIcon = (type: "student" | "class" | "trip") => {
    switch (type) {
      case "student":
        return User;
      case "class":
        return BookOpen;
      case "trip":
        return Bus;
    }
  };

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("title")}
        description={t("description")}
      >
        <CommandInput
          placeholder={t("placeholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && !query && recentSearches.length > 0 && (
            <CommandGroup
              heading={
                <div className="flex items-center justify-between">
                  <span>{t("recentSearches")}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearRecent}
                  >
                    {t("clearRecent")}
                  </Button>
                </div>
              }
            >
              {recentSearches.map((recent) => {
                const Icon = getTypeIcon(recent.type);
                return (
                  <CommandItem
                    key={`${recent.type}-${recent.id}`}
                    onSelect={() => handleRecentSelect(recent)}
                  >
                    <Clock className="me-2 h-4 w-4 text-muted-foreground" />
                    <Icon className="me-2 h-4 w-4" />
                    <span>{recent.title}</span>
                    {recent.subtitle && (
                      <span className="ms-2 text-muted-foreground">
                        {recent.subtitle}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!isLoading && query && !hasResults && (
            <CommandEmpty>{t("noResults")}</CommandEmpty>
          )}

          {!isLoading && hasResults && (
            <>
              {/* Students */}
              {results.students.length > 0 && (
                <CommandGroup heading={t("students")}>
                  {results.students.map((student) => (
                    <CommandItem
                      key={student.id}
                      onSelect={() => handleStudentSelect(student)}
                      className="flex items-center gap-3"
                    >
                      <OptimizedAvatar
                        src={student.avatarUrl}
                        alt={student.name}
                        size="sm"
                        fallback={student.name.charAt(0)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{student.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {student.className}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("student")}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.students.length > 0 &&
                (results.classes.length > 0 || results.trips.length > 0) && (
                  <CommandSeparator />
                )}

              {/* Classes */}
              {results.classes.length > 0 && (
                <CommandGroup heading={t("classes")}>
                  {results.classes.map((cls) => (
                    <CommandItem
                      key={cls.id}
                      onSelect={() => handleClassSelect(cls)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{cls.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {cls.churchName} • {t("studentsCount", { count: cls.studentCount })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("class")}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.classes.length > 0 && results.trips.length > 0 && (
                <CommandSeparator />
              )}

              {/* Trips */}
              {results.trips.length > 0 && (
                <CommandGroup heading={t("trips")}>
                  {results.trips.map((trip) => (
                    <CommandItem
                      key={trip.id}
                      onSelect={() => handleTripSelect(trip)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{trip.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {trip.destination || t("noDestination")}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("trip")}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>

      {/* Student Drawer */}
      <StudentDrawer
        student={student}
        open={isOpen}
        onOpenChange={setIsOpen}
        loading={drawerLoading}
      />
    </>
  );
}

// =====================================================
// SEARCH TRIGGER BUTTON
// =====================================================

interface SearchTriggerProps {
  onClick: () => void;
  className?: string;
}

export function SearchTrigger({ onClick, className }: SearchTriggerProps) {
  const t = useTranslations("teacher.search");

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("relative", className)}
      aria-label={t("openSearch")}
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">{t("openSearch")}</span>
    </Button>
  );
}

// =====================================================
// SEARCH KEYBOARD SHORTCUT HOOK
// =====================================================

export function useSearchShortcut(onOpen: () => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ClassSelectorClientProps {
  classes: { id: string; name: string; churchName: string }[];
}

export function ClassSelectorClient({ classes }: ClassSelectorClientProps) {
  const t = useTranslations("teacher.attendance");
  const router = useRouter();
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  const handleClassSelect = (classId: string) => {
    setNavigatingTo(classId);
    router.push(`/dashboard/teacher/attendance?classId=${classId}`);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        {t("selectClassDescription")}
      </p>

      {classes.map((cls) => (
        <Card
          key={cls.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md active:scale-[0.99]",
            navigatingTo === cls.id && "opacity-70"
          )}
          onClick={() => handleClassSelect(cls.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClassSelect(cls.id);
            }
          }}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{cls.name}</h3>
              {cls.churchName && (
                <p className="text-sm text-muted-foreground truncate">
                  {cls.churchName}
                </p>
              )}
            </div>

            {navigatingTo === cls.id ? (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground rtl:rotate-180" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

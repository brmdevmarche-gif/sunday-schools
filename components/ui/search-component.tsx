"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchComponent() {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        placeholder="Search students, servants, activities..."
        className="pl-10 bg-muted/50 border-border"
      />
    </div>
  );
}

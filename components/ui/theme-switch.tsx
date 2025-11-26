"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ThemeSwitchProps {
  showLabel?: boolean;
  labelPosition?: "left" | "right";
  className?: string;
}

export function ThemeSwitch({
  showLabel = true,
  labelPosition = "right",
  className = "",
}: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Switch disabled />
        {showLabel && (
          <Label className="text-sm text-muted-foreground">Loading...</Label>
        )}
      </div>
    );
  }

  const isDark = theme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  const switchElement = (
    <div className="relative">
      <Switch
        checked={isDark}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {isDark ? (
          <Moon className="h-3 w-3 text-white ml-3" />
        ) : (
          <Sun className="h-3 w-3 text-yellow-600 mr-3" />
        )}
      </div>
    </div>
  );

  const labelElement = showLabel && (
    <Label htmlFor="theme-switch" className="text-sm font-medium">
      {isDark ? "Dark" : "Light"} Mode
    </Label>
  );

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {labelPosition === "left" && labelElement}
      {switchElement}
      {labelPosition === "right" && labelElement}
    </div>
  );
}

// Compact theme switch without labels
export function CompactThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Switch disabled className="w-8 h-4" />;
  }

  const isDark = theme === "dark";

  return (
    <Switch
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      className="w-8 h-4 data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    />
  );
}

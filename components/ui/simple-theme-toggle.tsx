"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { SimpleButton } from "@/components/ui/simple-button";

interface SimpleThemeToggleProps {
  showLabel?: boolean;
  variant?: "button" | "icon";
  size?: "sm" | "md" | "lg";
}

export function SimpleThemeToggle({
  showLabel = false,
  variant = "icon",
  size = "md",
}: SimpleThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <SimpleButton variant="ghost" size="icon" disabled>
        <Sun className="h-4 w-4" />
      </SimpleButton>
    );
  }

  const isDark = theme === "dark";
  const isSystem = theme === "system";

  const handleToggle = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (isSystem) {
      return <Monitor className="h-4 w-4" />;
    }
    return isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (isSystem) return "System";
    return isDark ? "Light" : "Dark";
  };

  const buttonSize =
    variant === "icon"
      ? "icon"
      : size === "sm"
      ? "sm"
      : size === "lg"
      ? "lg"
      : "default";

  return (
    <SimpleButton
      variant="ghost"
      size={buttonSize}
      onClick={handleToggle}
      className="hover:bg-muted transition-colors"
      title={`Switch to ${getLabel()} mode`}
    >
      {getIcon()}
      {showLabel && variant === "button" && (
        <span className="ml-2">{getLabel()}</span>
      )}
      <span className="sr-only">Toggle theme: {getLabel()}</span>
    </SimpleButton>
  );
}

// Quick access component for floating theme toggle
export function FloatingThemeToggle() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-1 shadow-lg">
        <SimpleThemeToggle />
      </div>
    </div>
  );
}

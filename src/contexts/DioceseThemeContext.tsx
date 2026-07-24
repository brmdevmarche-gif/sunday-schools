'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/client-logger';

interface DioceseTheme {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
}

interface DioceseThemeContextValue {
  theme: DioceseTheme | null;
  isLoading: boolean;
}

const DioceseThemeContext = createContext<DioceseThemeContextValue>({
  theme: null,
  isLoading: true,
});

export function useDioceseTheme() {
  return useContext(DioceseThemeContext);
}

/**
 * Convert a hex color like "#3b82f6" to an RGB string "59 130 246"
 * for use in CSS custom properties with oklch or direct rgb().
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

/**
 * Generate a foreground color (white or dark) based on the luminance of the background.
 */
function contrastForeground(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  // Relative luminance (sRGB)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff';
}

export function DioceseThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<DioceseTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTheme() {
      try {
        const res = await fetch('/api/diocese-theme');
        if (!res.ok) {
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled && data.theme) {
          setTheme(data.theme);
          applyThemeToDOM(data.theme);
        }
      } catch (error) {
        clientLogger.error('Failed to fetch diocese theme', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchTheme();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DioceseThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </DioceseThemeContext.Provider>
  );
}

/**
 * Apply diocese theme colors as CSS custom properties on <html>.
 * This overrides the defaults from globals.css for --primary, --secondary, --accent
 * and their foreground variants.
 */
function applyThemeToDOM(theme: DioceseTheme) {
  const root = document.documentElement;

  if (theme.primary) {
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-foreground', contrastForeground(theme.primary));
    // Sidebar primary follows diocese primary
    root.style.setProperty('--sidebar-primary', theme.primary);
    root.style.setProperty('--sidebar-primary-foreground', contrastForeground(theme.primary));
    // Ring color uses primary
    root.style.setProperty('--ring', theme.primary);
  }

  if (theme.secondary) {
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--secondary-foreground', contrastForeground(theme.secondary));
  }

  if (theme.accent) {
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-foreground', contrastForeground(theme.accent));
    // Sidebar accent follows diocese accent
    root.style.setProperty('--sidebar-accent', theme.accent);
    root.style.setProperty('--sidebar-accent-foreground', contrastForeground(theme.accent));
  }
}

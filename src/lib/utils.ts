import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize an integer input string:
 * - Keep only digits
 * - Remove leading zeros when there are multiple digits (e.g. "012" -> "12")
 */
export function normalizeNonNegativeIntInput(raw: string): string {
  const digitsOnly = (raw ?? "").replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.replace(/^0+(?=\d)/, "");
}

export function toNonNegativeInt(raw: string, fallback = 0): number {
  const normalized = normalizeNonNegativeIntInput(raw);
  if (!normalized) return fallback;
  const n = parseInt(normalized, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize a non-negative decimal input string:
 * - Keep digits and a single dot
 * - Remove leading zeros from integer part when possible (e.g. "012.5" -> "12.5", "00.5" -> "0.5")
 */
export function normalizeNonNegativeDecimalInput(raw: string): string {
  let s = (raw ?? "").replace(/[^\d.]/g, "");
  if (!s) return "";

  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    // Keep only first dot
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    const [intPartRaw, fracPart = ""] = s.split(".");
    const intPart = (intPartRaw || "0").replace(/^0+(?=\d)/, "") || "0";
    return `${intPart}.${fracPart}`;
  }

  return s.replace(/^0+(?=\d)/, "");
}

export function toNonNegativeFloat(raw: string, fallback = 0): number {
  const normalized = normalizeNonNegativeDecimalInput(raw);
  if (!normalized) return fallback;
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : fallback;
}
# Design System Gaps — Knasty Portal

**Date**: 2026-03-21

This document identifies gaps in the design system (Tailwind CSS v4 + shadcn/ui + Radix UI) that affect accessibility, UX consistency, and RTL support.

---

## 1. Missing Design Tokens

### 1.1 Safe Area Insets
**Gap**: `pb-safe` and `safe-area-inset-bottom` classes are used but never defined.
**Impact**: Teacher bottom nav and floating action button have no safe area padding on iOS devices with home indicator.
**Fix**: Add to `globals.css`:
```css
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 1.2 Dynamic Viewport Height
**Gap**: No `h-dvh` / `min-h-dvh` utility awareness. 45+ components use `h-screen` / `min-h-screen` (100vh).
**Impact**: Content cut off on mobile Safari.
**Fix**: Tailwind v4 supports `h-dvh` natively. Replace `h-screen` with `h-dvh` and `min-h-screen` with `min-h-dvh` in layout-level containers.

### 1.3 Reduced Motion
**Gap**: No `prefers-reduced-motion` media query anywhere. `tw-animate-css` does not include reduced motion support.
**Fix**: Add to `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 1.4 Focus Ring Token
**Gap**: Focus ring color `--ring: oklch(0.7 0.1 195)` (teal) may have insufficient contrast against some backgrounds.
**Impact**: Focus indicator may not be visible to low-vision users on light teal or white backgrounds.
**Fix**: Verify 3:1 contrast ratio of ring color against all surface colors. Consider darker ring or double-ring pattern (inner white, outer dark).

---

## 2. Color Contrast Failures

### 2.1 Light Mode

| Token Pair | Approx Colors | Context | Ratio | Required | Fix |
|------------|--------------|---------|-------|----------|-----|
| secondary-foreground on secondary | white on #58b7bd | Secondary buttons | ~3.2:1 | 4.5:1 | Darken secondary to `oklch(0.55 0.08 195)` OR use dark foreground |
| muted-foreground on background | #6b7c8d on #ededed | Placeholder/help text | ~3.8:1 | 4.5:1 | Darken muted-foreground to `oklch(0.40 0.02 240)` |
| muted-foreground on card | #6b7c8d on white | Placeholder on cards | ~4.5:1 | 4.5:1 | Borderline — darken slightly for safety |

### 2.2 Dark Mode

| Token Pair | Approx Colors | Context | Ratio | Required | Fix |
|------------|--------------|---------|-------|----------|-----|
| secondary-foreground on secondary | dark on bright teal | Secondary buttons | ~5:1 | 4.5:1 | PASS |
| muted-foreground on background | #999 on #2a2f3a | Help text in dark | ~4.8:1 | 4.5:1 | PASS |

### 2.3 Non-Text Contrast

| Element | Current | Required (3:1) | Fix |
|---------|---------|----------------|-----|
| Input borders | `oklch(0.86 0.01 240)` on white | ~2.8:1 | Darken border to `oklch(0.75 0.01 240)` |
| Checkbox borders | Same as input | ~2.8:1 | Same fix |
| Disabled button opacity | `opacity-50` | May fail | Test with actual computed colors |

---

## 3. Component-Level Gaps

### 3.1 Button Variants — Touch Target
**Current sizes**:
- `default`: h-9 (36px) — below 44px
- `sm`: h-8 (32px) — below 44px
- `lg`: h-10 (40px) — below 44px
- `icon`: h-9 w-9 (36x36px) — below 44px

**Gap**: No mobile-responsive size variant.
**Fix**: Add to button.tsx size variants:
```typescript
// Option A: responsive default
default: "h-11 md:h-9 px-4 py-2 has-[>svg]:px-3",
sm: "h-10 md:h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
icon: "size-11 md:size-9",

// Option B: new "mobile" size
mobile: "h-11 rounded-md px-4 py-2",
mobileIcon: "size-11",
```

### 3.2 Checkbox/Radio — Touch Target
**Current**: `size-4` (16px) — below 24px WCAG 2.5.8 minimum.
**Fix**: Increase to `size-5` (20px) and add invisible touch target padding:
```css
/* In checkbox.tsx/radio-group.tsx */
.touch-target {
  position: relative;
}
.touch-target::before {
  content: '';
  position: absolute;
  inset: -12px; /* Creates 44px touch target around 20px control */
}
```

### 3.3 Table Component — Accessibility
**Gaps**:
- `TableHead` uses `text-left` (should be `text-start` for RTL)
- No `scope="col"` default on `<th>`
- `TableCaption` component exists but is never used

**Fix for table.tsx**:
```tsx
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"  // ADD
      className={cn(
        "text-foreground h-10 px-2 text-start align-middle font-medium ...",
        //                          ^^^^^^^^^^^ was text-left
        className
      )}
      {...props}
    />
  )
}
```

### 3.4 FormMessage — Missing role="alert"
**Gap**: Error messages are not announced to screen readers.
**Fix**:
```tsx
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  // ... existing code ...
  return (
    <p
      role="alert"  // ADD
      data-slot="form-message"
      // ...
    />
  )
}
```

### 3.5 Sonner Toaster — RTL + Duration
**Gaps**:
- Position doesn't adapt to RTL locale
- No custom duration (default 4s may be too short for errors)

**Fix**:
```tsx
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const dir = document.documentElement.dir  // or use next-intl

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      duration={6000}
      // ... rest
    />
  )
}
```

---

## 4. Missing Utility Classes

### 4.1 Screen Reader Only (sr-only)
Tailwind provides `sr-only` and `not-sr-only`. These are used in some places but should be used more extensively for:
- Icon-only button labels
- Table captions
- Form required field indicators
- Badge count context

### 4.2 Focus-Visible Skip Link Pattern
No reusable skip link component exists. Create:
```tsx
// src/components/ui/skip-link.tsx
export function SkipLink({ href = "#main-content", children }: { href?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  )
}
```

---

## 5. Date Formatting Utility Gap

**Gap**: Date formatting is inconsistent across components. Some use raw `toLocaleDateString()`, others use custom formatting.
**Fix**: Create a centralized `formatDate` utility:
```typescript
// src/lib/format-date.ts
export function formatDate(date: string | Date, locale: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...options,
  }).format(new Date(date))
}
```

---

## 6. globals.css Additions Needed

```css
/* === Safe Area Support === */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .animate-progress-bar {
    animation: none;
  }
}

/* === Touch Target Helper === */
.touch-target-44 {
  position: relative;
  min-height: 44px;
  min-width: 44px;
}
```

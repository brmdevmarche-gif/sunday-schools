# Forms Migration Guide — Knasty Portal

**Date**: 2026-03-21
**Goal**: Migrate all forms to react-hook-form + Zod with full WCAG 2.2 AA accessibility built in.

---

## Current State

The app has two form patterns:

### Pattern A: react-hook-form + shadcn Form (Correct)
Used in: RoleForm, AnnouncementForm, some admin create forms
- `FormControl` automatically provides `aria-invalid`, `aria-describedby`
- `FormLabel` links to input via `htmlFor`
- `FormMessage` displays inline errors

### Pattern B: Manual useState (Needs Migration)
Used in: Many admin forms, teacher forms, parent forms
- No `aria-invalid` on inputs
- Errors shown via `toast()` only — no inline errors
- No `aria-describedby` linking inputs to error messages
- No programmatic error identification

---

## Target Architecture

Every form should use this pattern:

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// 1. Define Zod schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  age: z.coerce.number().min(1).max(120).optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ExampleForm() {
  const t = useTranslations("forms")

  // 2. Initialize form with Zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  // 3. Handle submission
  async function onSubmit(values: FormValues) {
    try {
      const result = await serverAction(values)
      if (result.error) {
        // Set server-side errors on specific fields
        form.setError("email", { message: result.error })
        return
      }
      toast.success(t("saveSuccess"))
    } catch {
      toast.error(t("saveError"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* 4. Each field follows this pattern */}
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                {t("nameLabel")}
                {/* Visual required indicator */}
                <span aria-hidden="true" className="text-destructive ms-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("namePlaceholder")}
                  aria-required="true"
                  // aria-invalid is set automatically by FormControl
                  // aria-describedby is set automatically by FormControl
                />
              </FormControl>
              <FormDescription>
                {t("nameDescription")}
              </FormDescription>
              {/* FormMessage renders inline error with role="alert" */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("emailLabel")}
                <span aria-hidden="true" className="text-destructive ms-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  aria-required="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  )
}
```

---

## Accessibility Requirements Checklist

Every form MUST satisfy these requirements:

### Labels (WCAG 3.3.2)
- [ ] Every input has a `<FormLabel>` (visible) or `<Label className="sr-only">` (hidden)
- [ ] Required fields have visual `*` indicator with `aria-hidden="true"` (so SR reads `aria-required` instead)
- [ ] Complex inputs have `<FormDescription>` explaining expected format

### Error Handling (WCAG 3.3.1, 3.3.3)
- [ ] `aria-invalid` is set on error fields (automatic via FormControl)
- [ ] Error message is linked via `aria-describedby` (automatic via FormControl)
- [ ] `FormMessage` has `role="alert"` (needs to be added to form.tsx)
- [ ] Error messages are specific: "Email is required" not "Required"
- [ ] Error messages include fix suggestion: "Enter a valid email (e.g., name@example.com)"

### Required Fields (WCAG 1.3.5)
- [ ] `aria-required="true"` on every required input
- [ ] `required` HTML attribute for native validation fallback

### Autocomplete (WCAG 1.3.5)
- [ ] `autoComplete` attribute on all applicable inputs:
  - Email: `autoComplete="email"`
  - Name: `autoComplete="name"`
  - Phone: `autoComplete="tel"`
  - Password: `autoComplete="current-password"` or `autoComplete="new-password"`

### Focus Management
- [ ] After submission error, focus moves to first error field
- [ ] After successful submission, focus moves to confirmation or next logical element
- [ ] Dialog forms return focus to trigger on close (Radix handles this)

---

## FormMessage Fix (Required Before Migration)

The current `FormMessage` in `form.tsx` is missing `role="alert"`. Fix this FIRST:

```tsx
// src/components/ui/form.tsx — FormMessage component
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      role="alert"  // <-- ADD THIS
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  )
}
```

---

## Migration Priority

### Priority 1: Forms with security/data-critical actions
These forms handle user data and should be migrated first:

| Form | File | Current Pattern | Fields |
|------|------|----------------|--------|
| Create User | `api/admin/create-user/route.ts` | Zod (API side) | Already has Zod |
| Create Student (admin) | `StudentsClient.tsx` | useState | name, email, class, role |
| Create Trip | `CreateTripClient.tsx` | useState | name, description, date, destination, cost |
| Create Store Item | `CreateStoreItemClient.tsx` | useState | name, description, price, image |
| Edit Trip | `EditTripClient.tsx` | useState | same as create |

### Priority 2: High-frequency teacher forms
| Form | File | Current Pattern | Fields |
|------|------|----------------|--------|
| Take Attendance | `TakeAttendanceClient.tsx` | useState | student statuses, notes |
| Points Adjustment | `PointsAdjustmentDialog.tsx` | useState | points, reason |
| Rejection Reason | `RejectionReasonModal.tsx` | useState | reason text |

### Priority 3: Admin management forms
| Form | File | Current Pattern | Fields |
|------|------|----------------|--------|
| Create Church | `ChurchesClient.tsx` | useState | name, diocese, address |
| Create Class | `ClassesClient.tsx` | useState | name, church, level |
| Create Diocese | `DiocesesClient.tsx` | useState | name |
| Settings | `SettingsClient.tsx` | useState | various settings |

---

## Schema Examples

### Student Creation
```typescript
import { z } from "zod"
import { USER_ROLES } from "@/lib/constants/roles"

export const createStudentSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  role: z.enum(USER_ROLES, { errorMap: () => ({ message: "Select a valid role" }) }),
  class_id: z.string().uuid("Select a class").optional(),
  parent_id: z.string().uuid().optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
})
```

### Trip Creation
```typescript
export const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(200),
  description: z.string().max(2000).optional(),
  destination: z.string().min(1, "Destination is required"),
  trip_date: z.string().min(1, "Trip date is required"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  max_participants: z.coerce.number().int().min(1).optional(),
  requires_parent_approval: z.boolean().default(true),
})
```

---

## Error Focus Management Pattern

After form submission fails, automatically focus the first error field:

```typescript
async function onSubmit(values: FormValues) {
  const result = await serverAction(values)

  if (result.fieldErrors) {
    // Set errors on specific fields
    Object.entries(result.fieldErrors).forEach(([field, message]) => {
      form.setError(field as keyof FormValues, { message })
    })

    // Focus first error field
    const firstErrorField = Object.keys(result.fieldErrors)[0]
    if (firstErrorField) {
      form.setFocus(firstErrorField as keyof FormValues)
    }
    return
  }

  if (result.error) {
    toast.error(result.error)
    return
  }

  toast.success(t("success"))
}
```

---

## Testing Each Migrated Form

After migrating each form:
1. [ ] Tab through all fields — logical order
2. [ ] Submit empty form — inline errors appear, first error focused
3. [ ] Screen reader: errors announced via role="alert"
4. [ ] Required fields announced as "required" by screen reader
5. [ ] Autocomplete works (password manager fills applicable fields)
6. [ ] RTL layout: labels on correct side, error messages flow correctly
7. [ ] Form submits successfully with valid data

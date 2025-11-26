# Knesty Portal - AI Coding Instructions

## Project Context
- **Stack**: Next.js 14 (App Router), TypeScript, Supabase (Auth/DB), Tailwind CSS, shadcn/ui.
- **Architecture**: Server-Side Rendering (SSR) priority.
  - **Server Components**: Layouts, initial data fetching, structural elements (`app/(admin)/layout.tsx`).
  - **Client Components**: Interactive elements, form handling, real-time updates (`components/ui/*`).
- **Styling**: Tailwind CSS with `shadcn/ui` components. Avoid custom CSS classes where utility classes suffice.

## Code Style & Conventions
- **Naming**:
  - Components: `PascalCase` (e.g., `ServantManagement`).
  - Files: `kebab-case` (e.g., `servant-management.tsx`).
  - Database: `snake_case` (e.g., `first_name`, `church_id`).
  - IDs: Use UUID strings for all entity IDs.
- **TypeScript**: Strict mode enabled. Define interfaces for all data structures.
  - Use `interface` for object shapes.
  - Use `type` for unions/enums (e.g., `type ServantRole = "admin" | "servant"`).
- **Imports**: Use `@/` alias for project root (e.g., `import { Button } from "@/components/ui/button"`).

## Key Patterns
- **Data Fetching**:
  - Prefer fetching data in Server Components where possible.
  - Use custom hooks (e.g., `useServantManagement`) for complex client-side logic and state.
- **State Management**:
  - URL state for shareable UI states (search params).
  - React Context/Zustand for global client state if needed.
- **Database Interaction**:
  - Use Supabase client.
  - Respect Row Level Security (RLS) policies.
  - Handle errors gracefully with user-friendly messages (e.g., `sonner` toasts or inline alerts).

## Domain Model (Reference)
### Hierarchy
`Diocese` -> `Churches` -> `Servants` / `Students` / `Classes`

### Key Entities
- **Servants**: Roles (`superAdmin`, `admin`, `servant`, `beginner`).
- **Students**: Linked to `church_id` and `class_groups`.
- **Stores**: Points-based system for students.

## Critical Workflows
- **Development**: `npm run dev` (Port 3070).
- **Linting**: `npm run lint`.

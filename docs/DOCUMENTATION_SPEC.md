# Knasty Portal — Documentation Spec

> **Version:** 1.0
> **Date:** March 22, 2026
> **Author:** Bisho / Claude
> **Format:** Bilingual HTML site (English + Arabic), responsive (mobile + desktop)

---

## 1. Overview

This spec defines the full documentation deliverable for **Knasty Portal**, a Sunday School Management System built with Next.js 16 + Supabase. The documentation will be a **self-contained, responsive HTML site** with:

- **3 main sections:** API Reference, User Guides (per role), Developer Docs
- **2 languages:** English (LTR) and Arabic (RTL) with a language switcher
- **Responsive layout:** Mobile-first design that works on phones, tablets, and desktops
- **Visual aids:** Screenshots, code samples, annotated examples, and animated GIFs demonstrating workflows
- **Navigation:** Sidebar (desktop) / hamburger menu (mobile) with search

---

## 2. Site Structure

```
Documentation Site
├── Home / Landing Page
│   ├── Quick overview of Knasty Portal
│   ├── Role selector (jump to your guide)
│   └── Quick links to all sections
│
├── 📘 User Guides (one per role)
│   ├── 👑 Super Admin Guide
│   ├── ⛪ Diocese Admin Guide
│   ├── 🏠 Church Admin Guide
│   ├── 👨‍🏫 Teacher Guide
│   ├── 👨‍👩‍👧 Parent Guide
│   └── 🎒 Student Guide
│
├── 🔧 API Reference
│   ├── Authentication
│   ├── Endpoints by Module
│   ├── Server Actions by Module
│   ├── Error Handling
│   └── Rate Limiting
│
└── 🏗️ Developer Documentation
    ├── Architecture Overview
    ├── Getting Started (Setup)
    ├── Security Model
    ├── Database Schema
    ├── Permissions System
    ├── Internationalization (i18n)
    ├── Coding Conventions
    └── Testing Checklist
```

---

## 3. User Guides — Detailed Spec

Each user guide follows the same structure, tailored to the role's available features.

### 3.1 Guide Template (applies to all roles)

Each guide contains:

1. **Getting Started**
   - How to log in (email or user code + password)
   - Language selection (English / Arabic)
   - Theme selection (light / dark)
   - 📸 Screenshot: Login page
   - 🎬 GIF: Login flow animation

2. **Dashboard Overview**
   - What the user sees after login
   - Navigation structure explanation
   - 📸 Screenshot: Dashboard (mobile + desktop)
   - 📸 Annotated screenshot: labeling each section

3. **Feature Walkthroughs** (role-specific, see below)
   - Step-by-step with screenshots at each step
   - 🎬 GIF: Key multi-step workflows
   - Code/input samples where applicable

4. **Common Tasks Quick Reference**
   - Table of tasks → where to find them
   - Keyboard shortcuts (if any)

5. **Troubleshooting / FAQ**
   - Common issues per role
   - Who to contact

---

### 3.2 👑 Super Admin Guide

**Dashboard:** Full system overview — diocese count, church count, class count, user count, attendance stats.

**Sections to document:**

| Section | Key Tasks | Visual Aids |
|---------|-----------|-------------|
| **Dashboard** | View system-wide stats, navigate to any module | 📸 Desktop + mobile screenshots |
| **Dioceses** | Create, edit, delete dioceses; assign diocese admins | 📸 List view, create form, admin assignment dialog. 🎬 GIF: Creating a diocese |
| **Churches** | Create, edit, delete churches; link to diocese | 📸 List, create form, detail page |
| **Classes** | Create, edit classes; set capacity, schedule, grade level; manage assignments | 📸 Class list, detail with roster, birthday page. 🎬 GIF: Assigning students to a class |
| **Users** | Create users (email+password); change roles; activate/deactivate; link parents to students; change passwords | 📸 User list, create user form, user detail, role change. 🎬 GIF: Creating a user and assigning role |
| **Students** | Create, edit, delete students; assign to classes; view activities/points/orders | 📸 Student detail tabs |
| **Attendance** | Mark attendance (present/absent/excused/late); bulk actions; view history & stats | 📸 Attendance marking UI, stats charts. 🎬 GIF: Marking attendance for a class |
| **Activities** | Create/edit activities; manage participation approval; track completions; revoke points | 📸 Activity list, create form, participants view, completions view |
| **Competitions** | Create competitions (text/pdf/google form); review submissions; award placements | 📸 Competition form, submissions review |
| **Readings** | Create reading schedules; set daily readings; track student progress | 📸 Schedule creator, day entries |
| **Spiritual Notes** | Create templates; review student submissions; approve/reject/bulk approve | 📸 Template form, review queue |
| **Trips** | Create trips (8 types); set destinations; manage pricing (3 tiers); approve participants; mark trip attendance | 📸 Trip form, participant list, attendance marking. 🎬 GIF: Creating a multi-destination trip |
| **Store** | Create items with 3-tier pricing; manage stock; create special offers | 📸 Item form, pricing config, special offers |
| **Orders** | View all orders; approve/fulfill/cancel; create orders for students | 📸 Order list, order detail, status workflow |
| **Points** | Configure church points; view balances; adjust points; view transaction history | 📸 Points config, transaction log |
| **Announcements** | Create, edit, schedule, deactivate; target by role/diocese/church/class; view inbox | 📸 Create form, targeting options. 🎬 GIF: Creating and targeting an announcement |
| **Roles & Permissions** | Create custom roles; assign permissions by module; manage user-role assignments | 📸 Role form, permission selector grid |
| **Settings** | User preferences; backup logs; database stats | 📸 Settings page |

---

### 3.3 ⛪ Diocese Admin Guide

**Scope:** Everything within their diocese. Cannot see other dioceses.

**Sections:** Same as Super Admin minus Dioceses management. Filtered to diocese scope for Churches, Classes, Users, Students.

**Key differences to highlight:**
- Cannot create users above their role level
- Church list filtered to their diocese
- Stats scoped to diocese

---

### 3.4 🏠 Church Admin Guide

**Scope:** Everything within their church.

**Sections:** Classes, Users, Students, Attendance, Activities, Trips, Store, Orders, Points, Announcements, Settings.

**Key differences to highlight:**
- No Dioceses or Churches management
- All data scoped to their church
- Can manage store items
- Points configuration for their church

---

### 3.5 👨‍🏫 Teacher Guide

**Dashboard:** Welcome banner, stats grid (classes, pending actions, students, attendance rate), quick attendance button, action cards, class cards, trip cards, announcements.

**Navigation:** Bottom nav (mobile) — Home, Classes, Action Required, Announcements, Trips.

**Sections to document:**

| Section | Key Tasks | Visual Aids |
|---------|-----------|-------------|
| **Dashboard** | View stats at a glance; quick attendance | 📸 Mobile + desktop views. 🎬 GIF: Quick attendance flow |
| **Classes** | View assigned classes; browse roster; view class stats | 📸 Class list, roster, stats |
| **Student Drawer** | View student profile, attendance tab, points tab; adjust points | 📸 Drawer in 3 tabs. 🎬 GIF: Opening drawer and adjusting points |
| **Attendance** | Select class → mark present/absent/excused/late; bulk actions | 📸 Attendance UI with status buttons. 🎬 GIF: Full attendance marking workflow |
| **Action Required** | View pending trip approvals; approve/reject with reason | 📸 Pending actions, rejection modal |
| **Trips** | View organized trips; manage participants; mark trip attendance | 📸 Trip detail, participant management |
| **Announcements** | View announcements; mark as read; view details | 📸 Announcement list, detail |
| **Search** | Cmd/Ctrl+K search: students, classes, trips | 📸 Search overlay. 🎬 GIF: Quick search demo |
| **Profile & Settings** | View/edit personal profile; change preferences | 📸 Profile page |

---

### 3.6 👨‍👩‍👧 Parent Guide

**Dashboard:** Children overview cards, pending approvals widget, notifications widget.

**Navigation:** Top navbar with child selector, sidebar with sections.

**Sections to document:**

| Section | Key Tasks | Visual Aids |
|---------|-----------|-------------|
| **Dashboard** | View all children at a glance; see pending items | 📸 Dashboard mobile + desktop. 🎬 GIF: Switching between children |
| **Child Selector** | Switch active child; view per-child data | 📸 Dropdown selector. 🎬 GIF: Selecting a child |
| **Child Profile** | View child details: class, attendance summary, activity stats, points, badges, streaks | 📸 Child detail page with all stats |
| **Approvals** | View pending trip approvals; approve or review | 📸 Approval list, approval action. 🎬 GIF: Approving a trip |
| **Notifications** | View all notifications; mark as read; bulk mark all | 📸 Notification list, notification types |
| **Store (for child)** | Browse items available to child; view pricing | 📸 Store page as parent |
| **Orders** | View child's orders and statuses | 📸 Order history |
| **Trips (for child)** | Browse available trips; view details | 📸 Trip list for child |
| **Activities (for child)** | Browse available activities for child | 📸 Activity list |
| **Announcements** | View system announcements | 📸 Announcements feed |

---

### 3.7 🎒 Student Guide

**Dashboard:** Profile hero with church cover image, points card, gamification widget, navigation cards grid, announcements.

**Navigation:** Top navbar, grid-based navigation from dashboard.

**Sections to document:**

| Section | Key Tasks | Visual Aids |
|---------|-----------|-------------|
| **Dashboard** | View profile, points, badges, streaks; navigate to features | 📸 Full dashboard mobile + desktop. 🎬 GIF: Dashboard tour |
| **Gamification** | View earned badges (by rarity); check streaks; see leaderboard position | 📸 Badge gallery, streak display, leaderboard. 🎬 GIF: Earning a badge |
| **Points** | View available/suspended/earned points | 📸 Points card |
| **Trips** | Browse available trips; register; view trip details; check registration status | 📸 Trip list, trip detail, registration. 🎬 GIF: Registering for a trip |
| **Store** | Browse items; view pricing (by student tier); add to cart; place order | 📸 Store browse, item detail, checkout. 🎬 GIF: Purchasing an item |
| **Orders** | View past orders and statuses | 📸 Order history |
| **Activities** | Browse available activities; participate; submit completions | 📸 Activity list, participation. 🎬 GIF: Completing an activity |
| **Competitions** | View competitions; submit entries (text/pdf/google form) | 📸 Competition detail, submission form |
| **Readings** | View reading schedules; today's reading; mark as complete; track streaks | 📸 Reading schedule, daily reading. 🎬 GIF: Completing today's reading |
| **Spiritual Notes** | Browse templates; submit reflections; view past notes | 📸 Template list, submission form |
| **Announcements** | View system announcements | 📸 Announcements page |
| **Profile & Settings** | View profile; change language/theme | 📸 Profile page, settings |

---

## 4. API Reference — Detailed Spec

### 4.1 Structure

```
API Reference
├── Overview
│   ├── Base URL
│   ├── Authentication (Supabase session cookies)
│   ├── CSRF Protection (X-CSRF-Token header)
│   ├── Response Envelope: { success: bool, data?: T, error?: string }
│   └── Rate Limiting (PG-backed, per-endpoint limits)
│
├── REST API Endpoints
│   ├── Health
│   │   └── GET /api/health
│   ├── Authentication
│   │   └── GET /api/auth/profile
│   ├── Permissions
│   │   ├── GET /api/permissions
│   │   └── GET /api/permissions/stream (SSE)
│   ├── Admin — Users
│   │   ├── POST /api/admin/create-user
│   │   └── GET /api/admin/users
│   ├── Admin — Dioceses
│   │   ├── GET /api/admin/dioceses/[id]/admins
│   │   └── DELETE /api/admin/dioceses/[id]/admins/[userId]
│   ├── Announcements
│   │   └── GET /api/announcements/unviewed-count
│   └── Teacher
│       ├── GET /api/teacher/students/[studentId]
│       ├── GET /api/teacher/students/[studentId]/attendance
│       └── GET /api/teacher/students/[studentId]/points
│
└── Server Actions (grouped by module)
    ├── Authentication (2 actions)
    ├── Admin — Dioceses (5 actions)
    ├── Admin — Churches (5 actions)
    ├── Admin — Classes (8 actions)
    ├── Admin — Users (8 actions)
    ├── Admin — Students (9 actions)
    ├── Admin — Attendance (7 actions)
    ├── Admin — Activities (10 actions)
    ├── Admin — Competitions (6 actions)
    ├── Admin — Readings (5 actions)
    ├── Admin — Spiritual Notes (9 actions)
    ├── Admin — Trips (8 actions)
    ├── Admin — Store Items (6 actions)
    ├── Admin — Orders (8 actions)
    ├── Admin — Points (10 actions)
    ├── Admin — Announcements (7 actions)
    ├── Admin — Roles (3 actions)
    ├── Admin — Settings (5 actions)
    ├── Student — Activities (6 actions)
    ├── Student — Trips (4 actions)
    ├── Student — Competitions (5 actions)
    ├── Student — Readings (6 actions)
    ├── Student — Spiritual Notes (4 actions)
    ├── Teacher — Dashboard (2 actions)
    ├── Teacher — Classes (4 actions)
    ├── Teacher — Attendance (3 actions)
    ├── Teacher — Trips (4 actions)
    ├── Teacher — Announcements (4 actions)
    ├── Teacher — Action Required (3 actions)
    ├── Teacher — Search (4 actions)
    ├── Parent — Dashboard (3 actions)
    ├── Parent — Approvals (3 actions)
    ├── Parent — Children (2 actions)
    ├── Parent — Notifications (4 actions)
    └── Gamification (8 actions)
```

### 4.2 Per-Endpoint Documentation Pattern

Each endpoint/action will include:

```
### POST /api/admin/create-user

**Description:** Creates a new user account with profile and role assignment.

**Auth Required:** Admin (super_admin, diocese_admin, church_admin)
**CSRF Required:** Yes
**Rate Limit:** 10 requests/minute

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | Minimum 8 characters |
| role | UserRole | Yes | Must be below caller's role level |
| first_name | string | Yes | |
| last_name | string | Yes | |
| phone | string | No | |
| diocese_id | uuid | Conditional | Required for diocese-scoped roles |
| church_id | uuid | Conditional | Required for church-scoped roles |

**Success Response (201):**
{ "success": true, "data": { "user": { ... }, "profile": { ... } } }

**Error Responses:**
| Status | Error | When |
|--------|-------|------|
| 400 | "Validation failed" | Invalid input |
| 403 | "Insufficient permissions" | Role hierarchy violation |
| 409 | "Email already exists" | Duplicate email |
| 429 | "Rate limit exceeded" | Too many requests |

**Example (cURL):**
curl -X POST /api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ..." \
  -d '{ "email": "teacher@church.org", ... }'
```

---

## 5. Developer Documentation — Detailed Spec

### 5.1 Architecture Overview

- **Diagram:** High-level architecture (Next.js ↔ Supabase ↔ Postgres)
- **Diagram:** Request flow (Browser → Proxy → Page/API → Auth Guard → Supabase)
- **Diagram:** Component hierarchy per role
- **Diagram:** Database entity relationship (simplified)

Visual format: Mermaid diagrams rendered inline or as SVG.

### 5.2 Getting Started

- Prerequisites (Node.js, npm, Supabase CLI)
- Clone & install
- Environment variables (.env.local setup)
- Local Supabase setup (config.toml)
- Running migrations (`npm run db:push`)
- Seeding data (`npm run db:seed`)
- Starting dev server (`npm run dev`)
- Running checks (`npm run lint`, `npx tsc --noEmit`)

### 5.3 Security Model

- **Auth Guards:** requireAuth, requireAdmin, requireStaff, requireParent (with code samples)
- **API Auth:** requireAdminApiUser, requireStaffApiUser, isAuthError (with code samples)
- **CSRF:** validateCsrf pattern for mutating endpoints
- **RLS:** Row Level Security on all tables — policy patterns
- **XSS:** Sanitization on write and read
- **Rate Limiting:** PG-backed rate limiter configuration
- **Role Hierarchy:** Visual diagram + code reference
- **Audit Logging:** Trigger-based audit trail

### 5.4 Database Schema

- **ER Diagram:** Full entity relationship diagram (Mermaid)
- **Table-by-table reference:** Name, columns, types, constraints, RLS policies
- **Migration history:** Overview of 55 migrations
- **Conventions:** RLS-first, audit triggers, data retention

### 5.5 Permissions System

- **Diagram:** Permission → Role → User flow
- **Permission categories:** Module, resource, action
- **System roles vs custom roles**
- **Navigation filtering:** How sidebar items map to permissions
- **Code patterns:** PageWithPermissions, PermissionGuard, PermissionButton, usePermissions hook

### 5.6 Internationalization (i18n)

- **Setup:** next-intl configuration
- **Translation files:** en.json, ar.json structure
- **Server vs client usage** (getTranslations vs useTranslations)
- **RTL support:** Logical CSS properties reference table
- **Adding new strings:** Step-by-step

### 5.7 Coding Conventions

- File naming (page.tsx, *Client.tsx, route.ts)
- Proxy vs middleware (why proxy.ts, not middleware.ts)
- Logging (structured loggers, never console.log)
- API response envelope (apiSuccess, apiError)
- Error boundaries pattern
- Destructive actions (ConfirmDialog, never window.confirm)
- Type definitions location and patterns

### 5.8 Testing Checklist

Full 15-point checklist from CLAUDE.md, expanded with examples for each item.

---

## 6. Visual Aids Spec

### 6.1 Screenshots

**Format:** PNG, optimized for web
**Variants:** Mobile (375px) + Desktop (1280px) for key pages
**Annotations:** Numbered callouts with descriptions
**Naming:** `{section}-{page}-{variant}.png` (e.g., `admin-dashboard-desktop.png`)

**Estimated count:** ~120 screenshots (60 pages × 2 variants)

### 6.2 Animated GIFs / Short Videos

**Format:** GIF (lightweight, auto-playing) or WebM (for longer flows)
**Resolution:** 800px wide (desktop), 375px wide (mobile)
**Duration:** 5–15 seconds per GIF
**Frame rate:** 10–15 fps (good balance of quality and file size)

**Key workflows to animate:**

| # | Workflow | Role | Estimated Duration |
|---|---------|------|--------------------|
| 1 | Login flow (email → dashboard) | All | 8s |
| 2 | Creating a diocese | Super Admin | 12s |
| 3 | Creating a user and assigning role | Admin | 15s |
| 4 | Assigning students to a class | Admin | 12s |
| 5 | Marking attendance for a class | Teacher | 10s |
| 6 | Quick attendance from dashboard | Teacher | 8s |
| 7 | Opening student drawer & adjusting points | Teacher | 12s |
| 8 | Cmd+K search demo | Teacher | 8s |
| 9 | Creating a multi-destination trip | Admin | 15s |
| 10 | Registering for a trip (student) | Student | 10s |
| 11 | Approving a trip (parent) | Parent | 8s |
| 12 | Switching between children | Parent | 8s |
| 13 | Purchasing from store | Student | 12s |
| 14 | Completing an activity | Student | 10s |
| 15 | Completing today's reading | Student | 8s |
| 16 | Earning a badge | Student | 8s |
| 17 | Creating an announcement with targeting | Admin | 12s |
| 18 | Creating a store item with 3-tier pricing | Admin | 12s |
| 19 | Reviewing spiritual notes (bulk approve) | Admin/Teacher | 10s |
| 20 | Language switching (EN ↔ AR with RTL flip) | All | 8s |

**Total:** ~20 GIFs, produced using browser automation (Claude in Chrome GIF creator) against a running dev instance of the app.

> **Note:** GIF/video generation requires the app to be running locally. These will be captured by navigating the actual app and recording interactions.

---

## 7. Responsive HTML Site Design

### 7.1 Layout

```
Desktop (≥1024px):
┌──────────────────────────────────────────────┐
│  Header: Logo | Search | Language | Theme    │
├──────────┬───────────────────────────────────┤
│ Sidebar  │  Content Area                     │
│ (240px)  │  ┌─────────────────────────────┐  │
│          │  │ Breadcrumb                  │  │
│ Nav      │  │ Page Title                  │  │
│ items    │  │ Content with screenshots,   │  │
│ grouped  │  │ tables, code blocks, GIFs   │  │
│ by       │  │                             │  │
│ section  │  │ Next/Previous navigation    │  │
│          │  └─────────────────────────────┘  │
└──────────┴───────────────────────────────────┘

Mobile (<1024px):
┌──────────────────────┐
│ ☰ Logo  🔍 🌐 🌙    │
├──────────────────────┤
│ Breadcrumb           │
│ Page Title           │
│                      │
│ Content (full width) │
│ Responsive images    │
│ Stacked tables       │
│                      │
│ Next/Previous nav    │
└──────────────────────┘
```

### 7.2 Features

- **Language Switcher:** Toggle EN/AR — switches all content and flips LTR↔RTL
- **Theme Toggle:** Light / Dark mode
- **Search:** Full-text search across all documentation
- **Sidebar Navigation:** Collapsible sections with active state highlighting
- **Breadcrumbs:** Show current location in hierarchy
- **Code Blocks:** Syntax-highlighted, copy-to-clipboard button
- **Tables:** Responsive — horizontal scroll on mobile or card-stack layout
- **Screenshots:** Lightbox on click, responsive sizing
- **GIFs:** Auto-play, click to pause, responsive
- **Scroll Spy:** Sidebar highlights current section based on scroll position
- **Anchor Links:** Every heading has a linkable anchor
- **Print Friendly:** CSS print styles for documentation export

### 7.3 Technology

- **Single HTML file** with embedded CSS and JS (self-contained, no build step)
- **CSS:** Custom properties for theming, CSS Grid + Flexbox for layout
- **JS:** Vanilla JS for interactivity (search, nav, theme, language switch)
- **Icons:** Inline SVG (no external dependencies)
- **Fonts:** System font stack (no external font loading)

---

## 8. Content Organization per Language

### English (LTR)
- Primary content language
- All technical terms in English
- Code samples in English
- API documentation in English only (developer-facing)

### Arabic (RTL)
- Full translation of all user guide content
- Navigation and UI labels in Arabic
- Screenshots with Arabic locale where applicable
- Developer docs: Bilingual headers, English code blocks with Arabic descriptions
- API docs: Arabic descriptions with English parameter names and code

---

## 9. Delivery Plan

### Phase 1: Spec & Structure (this document)
- [x] Codebase exploration
- [x] Feature catalog
- [x] Documentation spec

### Phase 2: Developer Documentation
- Architecture diagrams (Mermaid)
- Setup guide
- Security model docs
- Database schema reference
- Coding conventions

### Phase 3: API Reference
- REST endpoint documentation
- Server action documentation
- Code samples and examples

### Phase 4: User Guides
- One guide per role (6 total)
- Step-by-step walkthroughs
- Screenshots (requires running app)
- Annotated examples

### Phase 5: Visual Aids
- Screenshot capture (requires running app)
- GIF recording (requires running app)
- Annotation and labeling

### Phase 6: HTML Site Assembly
- Build responsive HTML shell
- Populate with all content
- Add bilingual support
- Add search, navigation, theme toggle
- Test on mobile and desktop

### Phase 7: Review & Polish
- Cross-reference with codebase
- Verify all links and references
- Test language switching
- Test responsive breakpoints
- Final review

---

## 10. File Deliverables

```
docs/
├── DOCUMENTATION_SPEC.md          ← This file
├── knasty-portal-docs.html        ← Main documentation site
├── assets/
│   ├── screenshots/               ← All screenshot PNGs
│   │   ├── admin/
│   │   ├── teacher/
│   │   ├── parent/
│   │   └── student/
│   └── gifs/                      ← All animated GIFs
│       ├── login-flow.gif
│       ├── create-diocese.gif
│       ├── mark-attendance.gif
│       └── ...
└── README.md                      ← Quick reference for the docs folder
```

> **Note on self-contained HTML:** The final `knasty-portal-docs.html` will embed all text content, styles, and scripts inline. Screenshots and GIFs will be referenced from the `assets/` directory (or base64-encoded for full portability).

---

## 11. Dependencies & Prerequisites for Full Delivery

| Requirement | Needed For | Status |
|-------------|-----------|--------|
| Codebase access | All sections | ✅ Available |
| Running dev instance | Screenshots, GIFs | ⚠️ Requires `npm run dev` |
| Seed data | Realistic screenshots | ⚠️ Requires `npm run db:seed` |
| Supabase running | App functionality | ⚠️ Requires local Supabase |
| Test user accounts | Per-role screenshots | ⚠️ Need accounts for each role |

> **Important:** Screenshots and GIFs can only be captured with a running instance of the app with seed data. The documentation text, structure, API reference, and developer docs can all be created from the codebase alone. Visual aids will be added when the app is running.

---

## 12. Estimated Scope

| Section | Pages of Content | Screenshots | GIFs | Effort |
|---------|-----------------|-------------|------|--------|
| Landing/Home | 1 | 0 | 0 | Small |
| Super Admin Guide | 15-20 | ~30 | 5-6 | Large |
| Diocese Admin Guide | 8-10 | ~15 | 2-3 | Medium |
| Church Admin Guide | 10-12 | ~20 | 3-4 | Medium |
| Teacher Guide | 8-10 | ~15 | 4-5 | Medium |
| Parent Guide | 6-8 | ~12 | 3-4 | Medium |
| Student Guide | 8-10 | ~15 | 4-5 | Medium |
| API Reference | 15-20 | 0 | 0 | Large |
| Developer Docs | 10-15 | 2-3 | 0 | Large |
| **Total** | **~80-105** | **~110-120** | **~20** | — |

---

*This spec serves as the blueprint for the complete Knasty Portal documentation. Each section will be built incrementally following the delivery plan above.*

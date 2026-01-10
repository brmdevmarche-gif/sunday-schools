# AI UI Generation Prompt: Parent Navigation & Child Tracking

**Target Tools:** v0.dev, Lovable, Bolt, or similar AI UI generators
**Date:** January 2026

---

## Prompt 1: Parent Dashboard Sidebar Navigation

```
Create a modern mobile-first sidebar navigation component for a parent dashboard in a church/Sunday school management app. The sidebar should slide in from the left on mobile.

**Design Requirements:**
- Use shadcn/ui components (Sheet, Button, Badge, Avatar, Separator)
- Support RTL layout (Arabic language)
- Glassmorphism style with backdrop blur
- Tailwind CSS styling

**Sidebar Structure:**

1. **Header Section:**
   - App logo (40x40px rounded)
   - "Welcome" text with parent's first name
   - Close button (X icon)

2. **My Children Section:**
   - Section label "MY CHILDREN" in muted uppercase
   - For each child, show a row with:
     - Circular avatar (32x32px)
     - Child's name (bold)
     - Class name + points with star icon (e.g., "Grade 3 • ⭐ 450")
     - Red badge if they have pending approvals
     - Chevron right icon
   - "Add Child" button at bottom with dashed border circle and plus icon

3. **Actions Section:**
   - Section label "ACTIONS"
   - "Pending Approvals" with AlertCircle icon and red count badge (e.g., "3")
   - "Notifications" with Bell icon and count badge
   - "Announcements" with Megaphone icon

4. **For My Children Section:**
   - Section label "FOR MY CHILDREN"
   - "Store" with ShoppingBag icon
   - "Orders" with ShoppingCart icon
   - "Trips" with Bus icon

5. **Account Section (after separator):**
   - "Profile" with User icon
   - "Settings" with Settings icon

6. **Logout Button:**
   - Red text color
   - LogOut icon
   - Full width ghost button

**Interaction States:**
- Active nav item: primary/10 background with primary text color
- Hover: accent background
- Badges: destructive variant for counts

**Sample Data:**
- Parent name: "Ahmed"
- Children:
  - Marina (Grade 3, 450 pts, 1 pending approval)
  - George (Grade 1, 230 pts, 0 pending approvals)
- Pending approvals: 3
- Notifications: 5

Generate the React component with TypeScript and include sample data.
```

---

## Prompt 2: Child Action Sheet (Bottom Sheet)

```
Create a mobile-first action sheet component that appears as a bottom sheet on mobile and a centered dialog on desktop. This is for a parent to take actions on behalf of their child.

**Design Requirements:**
- Use shadcn/ui Sheet (mobile) and Dialog (desktop)
- Responsive: use useMediaQuery hook for breakpoint detection
- Clean, modern design with adequate spacing
- Tailwind CSS

**Content Structure:**

1. **Header (centered):**
   - Large avatar (64x64px)
   - Child's name (bold, lg text)
   - Info line: "Grade 3 • St. Mark Church • ⭐ 450 pts" (muted text)

2. **Action Groups with Labels:**

   **PROFILE**
   - "View Profile" with User icon (blue)

   **ACTIVITIES**
   - "View Attendance" with Calendar icon (purple)
   - "View Activities" with Activity icon (green)
   - "View Badges" with Award icon (amber)

   **ACTIONS**
   - "Order from Store" with ShoppingBag icon (green)
   - "Book a Trip" with Bus icon (blue)

   **HISTORY**
   - "View Orders" with ShoppingCart icon (gray)
   - "View Trip Bookings" with MapPin icon (gray)

3. **Close Button:**
   - Full width outline button
   - "Close" text

**Each action row should have:**
- Icon on the left with appropriate color
- Label text
- Chevron right icon on the right
- Full width clickable area
- Hover state with accent background

**Sample Data:**
- Child: Marina Magdi
- Class: Grade 3
- Church: St. Mark Church
- Points: 450

Generate React component with TypeScript.
```

---

## Prompt 3: Parent Orders Page

```
Create a page showing all store orders a parent has placed for their children. Mobile-first design for a church/Sunday school app.

**Design Requirements:**
- Use shadcn/ui components (Card, Badge, Select, Avatar)
- Clean list view with cards
- Filter functionality
- Tailwind CSS

**Page Structure:**

1. **Header:**
   - Back arrow button (left)
   - Title: "My Children's Orders"

2. **Filters Row:**
   - Child filter dropdown: "All Children", "Marina", "George"
   - Status filter dropdown: "All", "Pending", "Confirmed", "Delivered"

3. **Orders List:**
   Each order card should show:
   - Child's avatar (small, 24x24) + name
   - Order number (e.g., "#1234")
   - Date (e.g., "Jan 5, 2026")
   - Status badge (color-coded: Pending=yellow, Confirmed=blue, Delivered=green)
   - Item count + total points (e.g., "3 items • 150 points")
   - Preview of items with small images and names

**Empty State:**
- ShoppingCart icon (large, muted)
- "No orders found" text
- Subtext based on filter

**Sample Data:**
3 orders:
1. Marina, Order #1234, Jan 5 2026, Pending, 3 items (150 pts): Teddy Bear, Storybook x2
2. George, Order #1198, Jan 3 2026, Delivered, 1 item (75 pts): Board Game
3. Marina, Order #1150, Dec 28 2025, Delivered, 2 items (60 pts): Coloring Book, Crayons

Generate React component with TypeScript and the filter logic.
```

---

## Prompt 4: Child Context Banner for Store

```
Create a sticky context banner component that shows which child a parent is shopping for in a store. Include the ability to switch children.

**Design Requirements:**
- Sticky positioning below navbar (top-14)
- Use shadcn/ui Sheet for child switcher
- Subtle background (primary/5 or muted)
- Tailwind CSS

**Banner Content:**
- Left side:
  - Child's avatar (32x32px)
  - Two lines of text:
    - "Shopping for: **Marina Magdi**" (bold name)
    - "⭐ 450 points available" (muted, smaller)
- Right side:
  - "Change" button (ghost variant, small)
  - Only show if parent has multiple children

**Child Switcher (Bottom Sheet):**
- Title: "Select Child"
- Search input if more than 5 children
- List of children with:
  - Avatar
  - Name (bold)
  - Class name
  - Points with star icon
  - Checkmark on currently selected child
- Clicking a child switches context and closes sheet

**Sample Data:**
Current child: Marina (Grade 3, 450 pts)
Other children: George (Grade 1, 230 pts)

Generate React component with TypeScript, including the switcher functionality.
```

---

## Prompt 5: Child Selection Prompt for Store

```
Create a full-width prompt component that asks a parent to select which child they want to shop for. This appears when a parent visits the store without a child selected.

**Design Requirements:**
- Card-based layout
- Centered content
- Use shadcn/ui Card, Avatar, Button
- Tailwind CSS

**Component Structure:**

1. **Container:**
   - Full width card with padding
   - Subtle border
   - Rounded corners

2. **Header:**
   - Users icon (family silhouette)
   - Title: "Select a child to shop for"
   - Subtitle: "Choose which child you want to order items for"

3. **Children Grid:**
   - 2 columns on mobile, 3+ on larger screens
   - Each child as a card:
     - Large avatar (64x64px)
     - Name (bold)
     - Class name (muted)
     - Points: "⭐ 450 points"
     - "Select" button (outline style)
   - Hover: slight scale transform, shadow increase

**Sample Data:**
2 children:
- Marina Magdi, Grade 3, 450 points
- George Magdi, Grade 1, 230 points

Generate React component with TypeScript. The onSelect callback should receive the child's ID.
```

---

## Prompt 6: Parent Trips Overview Page

```
Create a page showing all trip bookings for a parent's children, grouped by upcoming and past trips.

**Design Requirements:**
- Mobile-first with card-based layout
- Grouped sections (Upcoming, Past)
- Status indicators for each child
- Use shadcn/ui components
- Tailwind CSS

**Page Structure:**

1. **Header:**
   - Back arrow
   - Title: "My Children's Trips"

2. **Filters Row:**
   - Child filter: "All Children" dropdown
   - Status filter: "All", "Confirmed", "Pending", "Cancelled"

3. **Upcoming Section:**
   - Section header with Bus icon
   - Trip cards showing:
     - Trip cover image (16:9 aspect ratio, rounded)
     - Trip name (bold)
     - Location with MapPin icon
     - Dates with Calendar icon
     - For each registered child:
       - Small avatar + name
       - Status badge (Confirmed=green check, Pending=yellow clock)

4. **Past Section:**
   - Same structure but with "Attended" status
   - Slightly muted appearance

**Empty State:**
- Bus icon
- "No trip bookings found"

**Sample Data:**
Upcoming:
- "Summer Camp 2026", Alexandria, July 15-22, 2026
  - Marina: Confirmed
  - George: Pending Approval

Past:
- "Beach Day Trip", Ain Sokhna, Dec 20, 2025
  - Marina: Attended

Generate React component with TypeScript.
```

---

## Prompt 7: Complete Parent Dashboard

```
Create a complete parent dashboard home page for a church/Sunday school management app. This is the main page parents see after logging in.

**Design Requirements:**
- Mobile-first responsive design
- Use shadcn/ui components throughout
- Modern, clean design with subtle gradients
- Tailwind CSS

**Page Structure:**

1. **Navbar (fixed top):**
   - Hamburger menu (opens sidebar)
   - App logo + "Knasty" text
   - Notification bell with badge
   - Parent's avatar

2. **Welcome Section:**
   - Parent's avatar (large, 64x64)
   - "Welcome back" (muted)
   - Parent's name (bold, 2xl)

3. **Quick Stats Row (3 cards):**
   - Children count (Users icon, blue)
   - Pending Approvals (AlertCircle icon, orange)
   - Unread Notifications (Bell icon, purple)

4. **Two Column Layout (lg+):**

   **Left Column - My Children:**
   - Card with "My Children" header (Users icon)
   - List of child cards showing:
     - Avatar
     - Name + chevron
     - Class + church
     - Points with star
     - Red badge if pending approvals
   - Clicking opens action sheet

   **Right Column - Widgets:**
   - Pending Approvals Widget (compact, max 3 items)
     - Trip approval requests
     - "View All" link
   - Notifications Widget (compact, max 3 items)
     - Recent notifications
     - "View All" link

5. **Action Sheet (opens on child click):**
   - Child info header
   - Grouped actions
   - Close button

**Sample Data:**
- Parent: Ahmed Magdi
- Children: Marina (Grade 3, 450 pts, 1 approval), George (Grade 1, 230 pts)
- Pending Approvals: 3 (Summer Camp for Marina, Beach Trip for George, Store Order)
- Notifications: 5 unread

Generate a complete React page with TypeScript, including all sub-components and interactivity.
```

---

## Usage Instructions

### For v0.dev:
1. Copy the desired prompt
2. Paste into v0.dev chat
3. Iterate on the generated result
4. Export code when satisfied

### For Lovable:
1. Create new project
2. Paste prompt in the AI chat
3. Let it generate the component
4. Refine with follow-up prompts

### For Bolt:
1. Start new project with React + Tailwind
2. Paste prompt
3. Review and customize

---

## Tech Stack Notes

These prompts assume:
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **shadcn/ui** components (install via npx shadcn@latest)
- **Lucide React** for icons
- **next-intl** for i18n (optional, can be simplified)

If the AI tool doesn't support shadcn/ui, you can ask it to:
- Use Radix UI primitives directly
- Use Headless UI
- Create custom components with Tailwind

---

## Customization Tips

After generating, you may want to:

1. **Add RTL support:** Add `rtl:` prefixes for Arabic layout
2. **Add animations:** Use Framer Motion for smooth transitions
3. **Connect to real data:** Replace sample data with API calls
4. **Add loading states:** Skeleton loaders for async content
5. **Add error handling:** Empty states and error boundaries

---

*Prompts created by Sally, UX Expert*
*For Knasty Portal Parent Features - January 2026*

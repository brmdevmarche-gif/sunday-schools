# AI UI Generation Prompt: Parent Child Selection & Actions

**Use this prompt with:** v0.dev, Lovable, Bolt, or similar AI UI generators

---

## PROMPT FOR AI UI TOOL

```
Create a mobile-first React dashboard for parents in a Sunday School management app. The design should use Tailwind CSS and shadcn/ui components.

### CONTEXT
This is a parent dashboard where parents can:
1. See their linked children
2. Select a child to act on their behalf
3. Order items from the store for that child
4. Book/register that child for trips

The app supports RTL (Arabic) and uses a blue/orange color scheme.

### SCREENS TO GENERATE

#### Screen 1: Parent Dashboard Home
Layout:
- Fixed header with app logo (left), notification bell with badge (right)
- Hero section with welcome message "Welcome back, [Parent Name]"
- "My Children" section title with child count badge
- Horizontal scrollable row of child cards (on mobile) / Grid of 3 on desktop
- Each child card shows:
  - Circular avatar (48px) with initials fallback
  - Child's full name (bold)
  - Class name (muted text, smaller)
  - Points balance with coin icon (amber color)
  - Small badge if pending approvals exist (red/destructive)
  - Entire card is clickable with hover:shadow-md effect
- Below: Quick action cards grid (2 columns):
  - "Pending Approvals" card with orange icon and count
  - "Store" card with green shopping bag icon
  - "Upcoming Trips" card with blue bus icon
  - "Notifications" card with bell icon and unread count

Interactions:
- Clicking a child card opens the Child Action Sheet
- Quick action cards navigate to respective pages

#### Screen 2: Child Action Sheet (Bottom Sheet / Modal)
Trigger: When parent taps on a child card

Layout (Bottom Sheet on mobile, centered Dialog on desktop):
- Sheet handle indicator at top
- Child avatar (64px) centered at top
- Child name (large, bold, centered)
- Child info: Class • Church • Points balance
- Divider line
- Action buttons list (full width, stacked vertically):
  1. "View Profile" - ChevronRight icon, navigates to /dashboard/children/[id]
  2. "Order from Store" - ShoppingBag icon (green), navigates to /store?child=[id]
  3. "Book a Trip" - Bus icon (blue), navigates to /trips?child=[id]
  4. "View Attendance" - Calendar icon, navigates to /dashboard/children/[id]?tab=attendance
  5. "Cancel" button at bottom (outline variant)

Each action button:
- Full width
- Icon on left, text in middle, chevron on right
- Hover/active state with background color change
- 48px minimum touch target height

#### Screen 3: Store Page with Child Context
URL: /store?child=[childId]

Layout:
- Sticky context banner at top (below navbar):
  - Small avatar (32px) + "Ordering for [Child Name]" text
  - "Change" button (ghost variant) to switch child
  - Light blue/primary-50 background
- Product grid (2 columns mobile, 3-4 desktop)
- Each product card:
  - Product image (square, rounded)
  - Product name
  - Price in points with coin icon
  - "Add to Cart" button
- Floating cart button (bottom right):
  - Shopping cart icon with item count badge
  - Opens cart sheet

Cart Sheet:
- List of items with quantity controls (+/-)
- Child avatar + name reminder: "Cart for [Child Name]"
- Total points
- "Checkout" button (disabled if child has insufficient points)
- Warning message if insufficient points

#### Screen 4: Trip Booking with Child Context
URL: /trips?child=[childId]

Layout:
- Same sticky context banner as store
- Trips list/grid:
  - Trip cover image
  - Trip name
  - Date range (start - end)
  - Price (with price tier based on child)
  - Status badge (Open, Full, Closed)
  - "Register" button

Trip Registration Flow:
1. Tap "Register" on a trip
2. Opens confirmation dialog:
   - Trip summary card
   - Child info card
   - Price breakdown
   - Checkbox: "I confirm my child can participate"
   - "Register [Child Name]" primary button
   - "Cancel" outline button
3. Success state:
   - Checkmark animation
   - "Registration pending approval" if requires_parent_approval
   - "Registration confirmed" if auto-approved

#### Screen 5: Child Switcher (Reusable Component)
Used when clicking "Change" on context banner

Layout (Sheet from bottom):
- Title: "Select Child"
- Search input (if > 5 children)
- List of children:
  - Avatar + Name + Class
  - Checkmark on currently selected
  - Tap to select and close

### DESIGN TOKENS

Colors:
- Primary: Blue (bg-blue-500, text-blue-500)
- Secondary: Gray (bg-gray-100)
- Success: Green (bg-green-500)
- Warning: Orange/Amber (bg-orange-500)
- Destructive: Red (bg-red-500)
- Muted text: text-gray-500
- Background: bg-white, dark:bg-gray-950

Spacing:
- Container padding: px-4 sm:px-6
- Card padding: p-4
- Gap between cards: gap-4
- Section spacing: space-y-6

Border radius:
- Cards: rounded-xl
- Buttons: rounded-lg
- Avatars: rounded-full
- Inputs: rounded-md

Shadows:
- Cards: shadow-sm, hover:shadow-md
- Sheets: shadow-lg

Typography:
- Headings: font-bold
- Subtext: text-sm text-muted-foreground
- Points/Numbers: font-mono or tabular-nums

### ICONS (lucide-react)
- User/Avatar: User, Users
- Store: ShoppingBag, ShoppingCart
- Trips: Bus, MapPin, Calendar
- Points: Coins, Star
- Navigation: ChevronRight, ChevronLeft, X
- Actions: Check, Plus, Minus
- Notifications: Bell, BellDot

### COMPONENT LIBRARY
Use shadcn/ui components:
- Card, CardHeader, CardContent, CardFooter
- Button (variants: default, secondary, outline, ghost, destructive)
- Badge (variants: default, secondary, destructive, outline)
- Avatar, AvatarImage, AvatarFallback
- Sheet, SheetContent, SheetHeader, SheetTitle
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- Input, Label
- Checkbox

### RESPONSIVE BEHAVIOR
- Mobile: Single column, bottom sheets, full-width buttons
- Tablet (sm): 2-column grids, wider cards
- Desktop (lg): 3-4 column grids, dialogs instead of sheets, sidebar navigation

### ACCESSIBILITY
- All interactive elements must have visible focus states
- Minimum touch target: 44x44px on mobile
- Color contrast ratio: 4.5:1 minimum
- aria-labels on icon-only buttons
- Role="dialog" on modals with aria-modal="true"

### ANIMATIONS
- Sheet slide up: duration-300 ease-out
- Card hover scale: scale-[1.02] transition-transform
- Button press: active:scale-[0.98]
- Success checkmark: Lottie or CSS animation

### STATE HANDLING
Show these states:
- Loading: Skeleton cards, spinner on buttons
- Empty: "No children linked" with illustration
- Error: Toast notification + retry button
- Insufficient points: Warning badge on cart, disabled checkout
```

---

## USAGE INSTRUCTIONS

### For v0.dev:
1. Paste the prompt above
2. Request each screen separately for better results
3. Ask for responsive variants

### For Lovable:
1. Use the full prompt
2. Specify "shadcn/ui + Tailwind CSS"
3. Request Next.js App Router compatible code

### For Bolt:
1. Start with Screen 1 (Dashboard)
2. Iterate on each component
3. Request TypeScript interfaces

---

## EXPECTED OUTPUT

The AI should generate:
1. React/Next.js components
2. TypeScript interfaces for data
3. Tailwind CSS styling
4. Proper component composition
5. Responsive layouts
6. Accessible markup

---

## REFINEMENT PROMPTS

After initial generation, use these to refine:

### RTL Support:
```
Add RTL (right-to-left) support for Arabic. Use:
- flex-row-reverse for RTL
- text-right for RTL
- space-x-reverse for RTL gaps
- Swap ChevronRight/Left based on direction
```

### Dark Mode:
```
Add dark mode support using Tailwind's dark: prefix.
- Background: dark:bg-gray-950
- Cards: dark:bg-gray-900 dark:border-gray-800
- Text: dark:text-gray-100
```

### Loading States:
```
Add loading skeleton states for:
- Child cards (pulsing placeholder)
- Product grid (skeleton cards)
- Trip list (skeleton items)
Use the Skeleton component from shadcn/ui
```

### Error States:
```
Add error state UI:
- Error message card with red border
- Retry button
- Toast notification component
- Empty state illustrations
```

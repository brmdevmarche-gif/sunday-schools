# Next.js + Supabase + shadcn/ui App

A modern full-stack web application built with Next.js 16, Supabase, and shadcn/ui.

## Features

- **Next.js 16** - Latest version with App Router and TypeScript
- **Supabase** - Backend as a Service for authentication and database
- **shadcn/ui** - Beautiful, accessible UI components built with Radix UI and Tailwind CSS
- **Authentication** - Ready-to-use login and signup pages with Supabase Auth
- **User Profiles** - Custom profile fields (username, bio, avatar, full name)
- **Login History** - Track all login attempts with device info and timestamps
- **Security Alerts** - Automatic detection of suspicious login activity
- **Row Level Security** - Properly configured RLS policies for data protection
- **Protected Routes** - Middleware-based authentication and route protection
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework for styling

## Project Structure

```
src/
├── app/
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── dashboard/          # Protected dashboard
│   │   ├── profile/        # Profile edit page
│   │   └── page.tsx        # Dashboard page
│   ├── page.tsx            # Home page
│   ├── layout.tsx          # Root layout
│   └── middleware.ts       # Auth middleware
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── middleware.ts   # Middleware client
│   ├── auth.ts             # Authentication helpers
│   └── profile.ts          # Profile management helpers
└── supabase/
    └── migrations/         # SQL migration files
```

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher (recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
```

2. Environment variables are already configured in `.env.local`

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the application

### Database Setup

**Important:** Before using the app, you need to run the database migrations to set up RLS policies and user profiles.

1. Go to your Supabase dashboard: https://wzfkvegqytcnjdkxowvx.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Run the migration files in the `supabase/migrations/` directory in order:
   - `01_enable_rls_policies.sql` - Enables Row Level Security
   - `02_add_profile_fields.sql` - Adds custom profile fields
   - `03_auto_create_user_profile.sql` - Auto-creates profiles on signup
   - `04_create_login_history.sql` - Creates login history tracking table

See `supabase/migrations/README.md` for detailed instructions.

**Configure Supabase URLs:**

4. In your Supabase dashboard, go to **Authentication** → **URL Configuration**
5. Add these URLs:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** `http://localhost:3000/**`

## Available Pages

- **/** - Home page with app overview
- **/login** - User login page
- **/signup** - User registration page
- **/dashboard** - Protected dashboard (requires authentication)
- **/dashboard/profile** - Edit user profile (username, bio, avatar, etc.)

## Authentication

The app uses Supabase Auth for user management. Helper functions are available in `src/lib/auth.ts`:

- `signUp(email, password)` - Register a new user
- `signIn(email, password)` - Sign in an existing user
- `signOut()` - Sign out the current user
- `getCurrentUser()` - Get the currently authenticated user
- `getSession()` - Get the current session

## User Profiles

User profile management is available through `src/lib/profile.ts`:

- `getUserProfile()` - Get the current user's profile with custom fields
- `updateUserProfile(updates)` - Update profile fields
- `getProfileById(userId)` - Get another user's profile by ID
- `isUsernameAvailable(username)` - Check if a username is available

### Profile Fields

Each user profile includes:
- `email` - User's email (from auth)
- `username` - Unique username
- `full_name` - Full name
- `avatar_url` - Profile picture URL
- `bio` - User biography (max 500 characters)
- `created_at` - Account creation date
- `updated_at` - Last profile update

## Login History & Security

The app automatically tracks all login attempts and provides security monitoring features through `src/lib/login-history.ts`:

### Features:
- **Login Tracking** - Records every successful and failed login attempt
- **Device Information** - Captures browser, OS, and device type
- **Security Alerts** - Warns users about suspicious activity (multiple failed attempts)
- **Last Login Display** - Shows when and where you last logged in
- **Login History** - View your complete login history on the dashboard

### What's Tracked:
- Success/failure status
- IP address (when available)
- User agent (browser and device info)
- Timestamp of each attempt
- Failure reason (for failed logins)

### Security Features:
- Automatic detection of multiple failed login attempts (3+ in 24 hours)
- Alerts for unusual activity (2+ failed attempts in 1 hour)
- Visual indicators for successful vs failed logins
- RLS policies ensure users only see their own login history

### Helper Functions:
- `logLoginAttempt(userId, success, failureReason)` - Log a login attempt
- `getLoginHistory(limit)` - Get recent login history
- `getLastSuccessfulLogin()` - Get previous login info
- `detectSuspiciousActivity()` - Check for security issues
- `getLoginStats()` - Get login statistics

## UI Components

The following shadcn/ui components are included:

- Button
- Card
- Input
- Label
- Form
- Sonner (Toast notifications)

Add more components using:

```bash
npx shadcn@latest add [component-name]
```

## Row Level Security (RLS)

This app uses Supabase Row Level Security to protect user data. The configured policies ensure:

- Users can only view and edit their own profile data
- Authentication is required to access the users table
- Profile data is automatically created when users sign up
- Usernames must be unique across all users

All RLS policies are defined in `supabase/migrations/01_enable_rls_policies.sql`.

## Next Steps

1. **Run the database migrations** - Follow the instructions in `supabase/migrations/README.md`
2. **Configure Supabase URLs** - Add localhost:3000 to allowed URLs in Supabase dashboard
3. **Test the authentication flow** - Sign up, log in, and edit your profile
4. **Customize the UI** - Modify components and pages to match your brand
5. **Add more features** - Build on top of this foundation with additional tables and functionality

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# How to Push Only Updated/New Migrations with Supabase CLI

## Overview

Supabase CLI automatically tracks which migrations have been applied. When you push migrations, it only applies **new** ones that haven't been run yet.

---

## Step 1: Link Your Project (if not already linked)

First, you need to link your local project to your remote Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

You'll need:
- **Project Reference ID**: Found in Supabase Dashboard → Settings → General
- **Database Password**: The password you set when creating the project

---

## Step 2: Check Applied Migrations

See which migrations have already been applied:

```bash
npx supabase migration list
```

This shows:
- ✅ Applied migrations (already in database)
- ⏳ Pending migrations (new files that need to be applied)

---

## Step 3: Push Only New Migrations

Push all new migrations that haven't been applied yet:

```bash
npx supabase db push
```

**This command:**
- ✅ Compares local migration files with remote database
- ✅ Only applies migrations that haven't been run
- ✅ Skips already-applied migrations automatically
- ✅ Shows you which migrations are being applied

---

## Alternative: Push Specific Migration

If you want to push a specific migration file:

```bash
npx supabase migration up
```

This applies all pending migrations in order.

---

## Check Migration Status

After pushing, verify what's been applied:

```bash
npx supabase migration list
```

---

## Troubleshooting

### If migrations are out of sync:

```bash
# Reset migration tracking (CAREFUL - only if needed)
npx supabase migration repair --status reverted --version TIMESTAMP

# Or mark a migration as applied without running it
npx supabase migration repair --status applied --version TIMESTAMP
```

### If you get "migration already applied" error:

The migration file might have been modified. Supabase tracks migrations by:
- **Filename** (timestamp prefix)
- **File hash** (content)

If you modify an existing migration file, you'll need to create a new one instead.

---

## Best Practices

1. **Never modify applied migrations** - Create new migration files instead
2. **Use timestamped filenames** - Supabase CLI creates these automatically
3. **Test locally first** - Use `supabase start` to test migrations locally
4. **Check before pushing** - Always run `migration list` first

---

## Quick Reference

```bash
# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Check status
npx supabase migration list

# Push new migrations only
npx supabase db push

# See what will be applied
npx supabase migration list --db-url "postgresql://..."
```


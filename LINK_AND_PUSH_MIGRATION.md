# How to Link Supabase Project and Push Wishlist Migration

## Step 1: Get Your Project Reference ID

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **General**
4. Copy the **Reference ID** (it looks like: `abcdefghijklmnopqrst`)

OR

Look at your Supabase URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`
The part after `/project/` is your project reference ID.

## Step 2: Link Your Project

Run this command (replace `YOUR_PROJECT_REF` with your actual project ref):

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted for:
- Database password (the one you set when creating the project)

## Step 3: Push the Migration

After linking, run:

```bash
npx supabase db push
```

This will push all new migrations, including the wishlist migration.

## Alternative: Push Specific Migration

If you only want to push the wishlist migration:

```bash
npx supabase migration up
```

---

## Quick Method: Direct SQL Push

If linking doesn't work, you can also push the migration directly using the database connection:

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

Replace:
- `[YOUR-PASSWORD]` with your database password
- `[YOUR-PROJECT-REF]` with your project reference ID



#!/usr/bin/env node

/**
 * Script to run SQL migration against Supabase database
 * Usage: node scripts/apply-migration.js <migration-file>
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("❌ Error: Please provide a migration file path");
  console.error(
    "Usage: node scripts/apply-migration.js supabase/migrations/12_add_diocese_admin_assignments.sql"
  );
  process.exit(1);
}

const migrationPath = join(__dirname, "..", migrationFile);

console.log("📁 Reading migration file:", migrationPath);
const sql = readFileSync(migrationPath, "utf8");

console.log("🚀 Running migration against Supabase...");
console.log("🔗 URL:", SUPABASE_URL);
console.log("");

// Use the Management API to execute SQL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

console.log("⚠️  Note: This script requires direct database access.");
console.log("");
console.log("📋 To apply this migration, please use one of these methods:");
console.log("");
console.log("Option 1 - Supabase SQL Editor (Recommended):");
console.log(
  `  1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`
);
console.log("  2. Copy and paste the SQL from:");
console.log("     supabase/migrations/12_add_diocese_admin_assignments.sql");
console.log('  3. Click "Run" to execute');
console.log("");
console.log("Option 2 - PostgreSQL Client:");
console.log("  1. Get connection string from: Dashboard → Settings → Database");
console.log(
  '  2. Run: psql "connection-string" -f supabase/migrations/12_add_diocese_admin_assignments.sql'
);
console.log("");
console.log("Option 3 - Copy SQL to clipboard (macOS):");
console.log(
  "  Run: cat supabase/migrations/12_add_diocese_admin_assignments.sql | pbcopy"
);
console.log("");

// Try to copy to clipboard on macOS
import { exec } from "child_process";
exec(`cat "${migrationPath}" | pbcopy`, (error) => {
  if (!error) {
    console.log(
      "✅ SQL copied to clipboard! Paste it in the Supabase SQL Editor."
    );
    console.log(
      `   Link: https://supabase.com/dashboard/project/${projectRef}/sql/new`
    );
  }
});

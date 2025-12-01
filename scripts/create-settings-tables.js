#!/usr/bin/env node

/**
 * Script to create user_settings and backup_logs tables using Supabase SQL directly
 */

const path = require("path");
const fs = require("fs");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, "..", "supabase", "migrations", "11_add_user_settings.sql");
const migrationSQL = fs.readFileSync(migrationPath, "utf8");

console.log("🚀 Applying migration 11_add_user_settings.sql...");
console.log("📁 Reading from:", migrationPath);
console.log("\n⚠️  NOTE: Some errors about existing objects are normal and can be ignored.\n");

// We'll use the direct postgres endpoint if available through Supabase
// For now, just print instructions
console.log("=" .repeat(70));
console.log("INSTRUCTIONS:");
console.log("=" .repeat(70));
console.log("\n1. Go to your Supabase Dashboard SQL Editor:");
console.log(`   ${SUPABASE_URL.replace('.supabase.co', '')}.supabase.co/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)[1]}/sql/new`);
console.log("\n2. Copy and execute the following SQL:\n");
console.log("=" .repeat(70));
console.log(migrationSQL);
console.log("=" .repeat(70));
console.log("\n3. Or run: node scripts/run-migration.js supabase/migrations/11_add_user_settings.sql");
console.log("\nAlternatively, I'll try to create just the tables without policies...\n");

// Try to create the tables using a simple approach
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function tryCreateTables() {
  console.log("Attempting to check if tables exist...");

  // Check if user_settings table exists
  const { data: settingsData, error: settingsError } = await supabase
    .from("user_settings")
    .select("*")
    .limit(1);

  if (settingsError && settingsError.code === 'PGRST204') {
    console.log("❌ user_settings table does NOT exist");
  } else if (!settingsError || settingsError.code === 'PGRST116') {
    console.log("✅ user_settings table exists");
  }

  // Check if backup_logs table exists
  const { data: logsData, error: logsError } = await supabase
    .from("backup_logs")
    .select("*")
    .limit(1);

  if (logsError && logsError.code === 'PGRST204') {
    console.log("❌ backup_logs table does NOT exist");
  } else if (!logsError || logsError.code === 'PGRST116') {
    console.log("✅ backup_logs table exists");
  }

  console.log("\n💡 Please apply the migration using one of the methods above.");
}

tryCreateTables();

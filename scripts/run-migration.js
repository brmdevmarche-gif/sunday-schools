#!/usr/bin/env node

/**
 * Script to run SQL migration against Supabase database
 * Usage: node scripts/run-migration.js <migration-file>
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

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
    "Usage: node scripts/run-migration.js supabase/migrations/12_add_diocese_admin_assignments.sql"
  );
  process.exit(1);
}

const migrationPath = path.join(__dirname, "..", migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Error: Migration file not found: ${migrationPath}`);
  process.exit(1);
}

console.log("📁 Reading migration file:", migrationPath);
const sql = fs.readFileSync(migrationPath, "utf8");

console.log("🚀 Running migration against Supabase...");
console.log("🔗 URL:", SUPABASE_URL);

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

// Make the API request
const postData = JSON.stringify({ query: sql });

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Length": Buffer.byteLength(postData),
  },
};

const req = https.request(apiUrl, options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log("✅ Migration completed successfully!");
      if (data) {
        console.log("Response:", data);
      }
    } else {
      console.error("❌ Migration failed!");
      console.error("Status:", res.statusCode);
      console.error("Response:", data);
      process.exit(1);
    }
  });
});

req.on("error", (error) => {
  console.error("❌ Error running migration:", error.message);
  process.exit(1);
});

req.write(postData);
req.end();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

async function applyMigration() {
  console.log('🔄 Applying migration 18_create_store_orders.sql...\n');

  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/18_create_store_orders.sql'
  );

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📋 To apply this migration, please follow these steps:\n');
  console.log('OPTION 1: Using Supabase Dashboard (RECOMMENDED)');
  console.log('━'.repeat(80));
  console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('2. Copy and paste the SQL below');
  console.log('3. Click "Run" to execute\n');

  console.log('OPTION 2: Using Direct Connection');
  console.log('━'.repeat(80));
  console.log('If you have your database password, you can use:');
  console.log('node scripts/run-sql-direct.js\n');

  console.log('═'.repeat(80));
  console.log('SQL TO EXECUTE:');
  console.log('═'.repeat(80));
  console.log(sql);
  console.log('═'.repeat(80));
  console.log('\n✨ After running the SQL, the store orders tables will be created!\n');
}

applyMigration().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

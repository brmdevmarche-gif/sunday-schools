#!/usr/bin/env node

/**
 * Script to create tables using pg library
 * Usage: DB_URL="postgresql://..." node scripts/create-tables-with-pg.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('\n❌ Error: Database URL not provided');
  console.error('\nUsage:');
  console.error('  DB_URL="postgresql://..." node scripts/create-tables-with-pg.js');
  console.error('\nTo get your database URL:');
  console.error('  1. Go to Supabase Dashboard > Project Settings > Database');
  console.error('  2. Copy the "Connection string" under "Connection pooling"');
  console.error('  3. Replace [YOUR-PASSWORD] with your database password\n');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '..', 'supabase', 'create-tables-only.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false // Supabase uses SSL
  }
});

async function createTables() {
  try {
    console.log('\n🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    console.log('📝 Creating tables...');
    await client.query(sql);

    console.log('✅ Tables created successfully!\n');
    console.log('The following tables are now available:');
    console.log('  - user_settings');
    console.log('  - backup_logs\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Tables already exist (this is OK)');
      console.log('✅ Database is ready!\n');
    } else {
      console.error('\n❌ Error creating tables:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createTables();

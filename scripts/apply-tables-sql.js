#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'supabase', 'create-tables-only.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('\n' + '='.repeat(80));
console.log('  CREATING USER_SETTINGS AND BACKUP_LOGS TABLES');
console.log('='.repeat(80));
console.log('\nTo create the missing tables, please follow ONE of these options:\n');

console.log('OPTION 1: Use Supabase Dashboard SQL Editor (RECOMMENDED)');
console.log('-'.repeat(80));
console.log('1. Go to: https://supabase.com/dashboard/project/pdwajdbmhpuigzlnjbqa/sql/new');
console.log('2. Copy and paste the SQL below');
console.log('3. Click "Run" to execute\n');

console.log('OPTION 2: Use supabase CLI (if you have database password)');
console.log('-'.repeat(80));
console.log('supabase db execute -f supabase/create-tables-only.sql --db-url <YOUR_DB_URL>\n');

console.log('='.repeat(80));
console.log('SQL TO EXECUTE:');
console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\nAfter running the SQL, restart your Next.js server to see the changes.\n');

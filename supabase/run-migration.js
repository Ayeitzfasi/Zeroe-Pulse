// Script to run migrations against Supabase
// Usage: node run-migration.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL || 'https://ogwupzlixgncahfgcxix.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Run: export SUPABASE_SERVICE_KEY=your-key-here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`Running migration: ${filename}`);

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
    // If RPC doesn't exist, try direct query
    return { error: 'RPC not available' };
  });

  if (error) {
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      console.error('Migration failed. Please run the SQL manually in Supabase Dashboard.');
      console.error('Go to: https://supabase.com/dashboard/project/ogwupzlixgncahfgcxix/sql');
      console.error('\nSQL to run:');
      console.error('---');
      console.error(sql);
      console.error('---');
      return false;
    }
  }

  console.log(`Migration ${filename} completed successfully!`);
  return true;
}

// Run all migrations in order
const migrations = fs.readdirSync(path.join(__dirname, 'migrations'))
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${migrations.length} migration(s)`);

for (const migration of migrations) {
  const success = await runMigration(migration);
  if (!success) {
    process.exit(1);
  }
}

console.log('All migrations completed!');

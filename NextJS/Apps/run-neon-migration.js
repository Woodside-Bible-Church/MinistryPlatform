const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    console.log('Reading migration script...');
    const scriptPath = migrationFile || process.argv[2];
    if (!scriptPath) {
      throw new Error('Please provide a migration file path');
    }

    const fullPath = path.isAbsolute(scriptPath)
      ? scriptPath
      : path.join(__dirname, scriptPath);

    const script = fs.readFileSync(fullPath, 'utf8');
    console.log(`✓ Read migration: ${path.basename(scriptPath)}\n`);

    console.log('Executing migration...');
    await client.query(script);
    console.log('✓ Migration executed successfully\n');

    console.log('✅ Migration completed!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.stack) {
      console.error('\nStack trace:', err.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

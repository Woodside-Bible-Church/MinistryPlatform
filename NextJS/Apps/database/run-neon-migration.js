const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration(filePath) {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  console.log(`\n📄 Running migration: ${fileName}`);
  console.log('=' .repeat(60));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    await client.query(sqlContent);

    console.log(`\n✅ Migration ${fileName} completed successfully!`);
  } catch (err) {
    console.error(`\n❌ Error running migration ${fileName}:`);
    console.error(`  ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-neon-migration.js <migration-file.sql>');
    process.exit(1);
  }

  const fullPath = path.resolve(migrationFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  await runMigration(fullPath);
}

main();

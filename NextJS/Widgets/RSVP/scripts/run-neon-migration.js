const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use connection string from environment or fallback to Apps project
const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_lGTphbusEM51@ep-empty-mud-a4x0nlg5.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Connected to Neon database');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/neon-migrations/001-create-rsvp-field-types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 001-create-rsvp-field-types.sql');

    // Run migration
    await client.query(sql);

    console.log('✓ Migration completed successfully');

    // Verify data
    const result = await client.query('SELECT COUNT(*) FROM rsvp_field_types');
    console.log(`✓ Inserted ${result.rows[0].count} field types`);

    // Show sample data
    const sample = await client.query('SELECT component_name, display_name, mp_fallback_type FROM rsvp_field_types ORDER BY id LIMIT 5');
    console.log('\nSample data:');
    sample.rows.forEach(row => {
      console.log(`  - ${row.component_name} → ${row.mp_fallback_type}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

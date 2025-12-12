#!/usr/bin/env node
require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

async function runSqlFile(filePath) {
  const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  try {
    console.log(`\nConnecting to ${config.server}...`);
    const pool = await sql.connect(config);

    console.log(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Split by GO statements and execute each batch
    const batches = sqlContent
      .split(/^\s*GO\s*$/im)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`Executing ${batches.length} SQL batches...\n`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`[${i + 1}/${batches.length}] Executing batch...`);
      const result = await pool.request().query(batches[i]);
      if (result.rowsAffected && result.rowsAffected.length > 0) {
        console.log(`  ✓ Rows affected: ${result.rowsAffected[0]}`);
      } else {
        console.log(`  ✓ Batch completed`);
      }
    }

    console.log('\n✅ SQL deployment completed successfully!\n');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ SQL deployment failed:');
    console.error(err.message);
    if (err.precedingErrors) {
      console.error('\nPreceding errors:');
      err.precedingErrors.forEach(e => console.error(`  - ${e.message}`));
    }
    process.exit(1);
  }
}

const filePath = process.argv[2] || '../../../Database/StoredProcs/RSVP/sp-get-project-rsvp-data-with-slug.sql';
const absolutePath = path.resolve(__dirname, filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

runSqlFile(absolutePath);

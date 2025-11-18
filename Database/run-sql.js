#!/usr/bin/env node
/**
 * Run SQL files against SQL Server using Node.js mssql package
 * Usage: node run-sql.js <sql-file-path> [--test]
 */

require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const isTest = args.includes('--test');
const sqlFilePath = args.find(arg => !arg.startsWith('--'));

if (!sqlFilePath) {
  console.error('Error: SQL file path required');
  console.error('Usage: node run-sql.js <sql-file-path> [--test]');
  console.error('   or: node run-sql.js --test <sql-file-path>');
  process.exit(1);
}

// Determine which env vars to use
const envPrefix = isTest ? 'SQL_SERVER_TEST' : 'SQL_SERVER';
const config = {
  server: isTest ? process.env.SQL_SERVER_TEST : process.env.SQL_SERVER,
  database: isTest ? process.env.SQL_DATABASE_TEST : process.env.SQL_DATABASE,
  user: isTest ? process.env.SQL_USER_TEST : process.env.SQL_USER,
  password: isTest ? process.env.SQL_PASSWORD_TEST : process.env.SQL_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

async function runSqlFile() {
  let pool;
  try {
    // Read SQL file
    const fullPath = path.resolve(sqlFilePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    console.log(`\nConnecting to: ${config.server}/${config.database}`);
    console.log(`Running: ${path.basename(sqlFilePath)}\n`);

    // Connect to database
    pool = await sql.connect(config);

    // Split by GO statements (case-insensitive)
    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`Executing ${batches.length} batch(es)...\n`);

    // Execute each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      try {
        const result = await pool.request().query(batch);

        // Display results if there are any
        if (result.recordset && result.recordset.length > 0) {
          console.table(result.recordset);
        }

        if (result.rowsAffected && result.rowsAffected.length > 0) {
          const total = result.rowsAffected.reduce((a, b) => a + b, 0);
          if (total > 0) {
            console.log(`✓ Batch ${i + 1}: ${total} row(s) affected`);
          }
        }
      } catch (batchError) {
        console.error(`✗ Error in batch ${i + 1}:`);
        console.error(batchError.message);
        throw batchError;
      }
    }

    console.log(`\n✓ Successfully executed ${path.basename(sqlFilePath)}`);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

runSqlFile();

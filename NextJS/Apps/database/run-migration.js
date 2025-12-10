const fs = require('fs');
const path = require('path');
const sql = require('mssql');

// Azure SQL Database configuration
const config = {
  server: 'ministryplatform.database.windows.net',
  database: 'MinistryPlatform',
  user: 'mpuser',
  password: 'M1n1stryP@ssw0rd!',
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  port: 1433,
};

async function runMigration(filePath) {
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);

  console.log(`\n📄 Running migration: ${fileName}`);
  console.log('=' .repeat(60));

  try {
    const pool = await sql.connect(config);

    // Split by GO statements (case-insensitive)
    const batches = sqlContent
      .split(/^\s*GO\s*$/gim)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (batch) {
        console.log(`\n  Executing batch ${i + 1}/${batches.length}...`);
        const result = await pool.request().query(batch);

        // Print any messages/output
        if (result.recordset && result.recordset.length > 0) {
          result.recordset.forEach(row => {
            console.log(`  ℹ️  ${Object.values(row)[0]}`);
          });
        }
      }
    }

    console.log(`\n✅ Migration ${fileName} completed successfully!`);
    await pool.close();
    return true;
  } catch (err) {
    console.error(`\n❌ Error running migration ${fileName}:`);
    console.error(`  ${err.message}`);
    if (err.precedingErrors) {
      err.precedingErrors.forEach(e => {
        console.error(`  ${e.message}`);
      });
    }
    process.exit(1);
  }
}

async function main() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file.sql>');
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

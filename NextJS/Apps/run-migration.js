const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  requestTimeout: 30000,
};

async function runMigration() {
  try {
    console.log('Connecting to SQL Server...');
    const pool = await sql.connect(config);

    console.log('Reading migration script...');
    const scriptPath = path.join(__dirname, 'database-migration-simple-clean-slate.sql');
    const script = fs.readFileSync(scriptPath, 'utf8');

    // Split by GO statements
    const batches = script
      .split(/^\s*GO\s*$/mi)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`Found ${batches.length} batches to execute\n`);

    for (let i = 0; i < batches.length; i++) {
      console.log(`Executing batch ${i + 1}/${batches.length}...`);
      const result = await pool.request().query(batches[i]);

      // Print any messages
      if (result.recordset) {
        console.log(result.recordset);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();

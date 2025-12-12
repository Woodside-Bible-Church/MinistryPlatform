#!/usr/bin/env node
require('dotenv').config();
const sql = require('mssql');

async function findProc() {
  const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
      encrypt: false,
      trustServerCertilicate: true,
    },
  };

  try {
    console.log(`\nConnecting to ${config.server}...`);
    console.log(`Database: ${config.database}\n`);
    const pool = await sql.connect(config);

    // Try multiple ways to find it
    console.log('Method 1: sys.objects');
    const result1 = await pool.request().query(`
      SELECT name, type_desc, create_date, modify_date
      FROM sys.objects
      WHERE name LIKE '%RSVP%Project%Data%'
        AND type = 'P'
    `);
    console.log('Found:', result1.recordset.length);
    result1.recordset.forEach(r => console.log(`  - ${r.name} (${r.type_desc})`));

    console.log('\nMethod 2: sys.procedures');
    const result2 = await pool.request().query(`
      SELECT name
      FROM sys.procedures
      WHERE name LIKE '%Project_Data%'
    `);
    console.log('Found:', result2.recordset.length);
    result2.recordset.forEach(r => console.log(`  - ${r.name}`));

    console.log('\nMethod 3: Try to execute it');
    try {
      const testResult = await pool.request()
        .input('RSVP_Slug', sql.NVarChar, 'christmas-2025')
        .execute('api_Custom_RSVP_Project_Data_JSON');
      console.log('✓ Procedure exists and can be executed!');
      console.log('Returned:', testResult.recordset ? testResult.recordset.length : 0, 'rows');
    } catch (execError) {
      console.log('✗ Cannot execute:', execError.message);
    }

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Query failed:');
    console.error(err.message);
    process.exit(1);
  }
}

findProc();

#!/usr/bin/env node
/**
 * Get the definition of a stored procedure from the database
 * Usage: node scripts/get-stored-proc.js <procedure-name>
 */

require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function getStoredProcedure() {
  const procName = process.argv[2];

  if (!procName) {
    console.error('Usage: node scripts/get-stored-proc.js <procedure-name>');
    process.exit(1);
  }

  try {
    console.log(`\nFetching definition for stored procedure: ${procName}\n`);

    const result = await sql`
      SELECT
        OBJECT_DEFINITION(OBJECT_ID(${procName})) AS definition
    `;

    if (result[0]?.definition) {
      console.log(result[0].definition);
    } else {
      console.log(`Stored procedure '${procName}' not found.`);
    }
  } catch (error) {
    console.error('Error fetching stored procedure:', error.message);
    process.exit(1);
  }
}

getStoredProcedure();

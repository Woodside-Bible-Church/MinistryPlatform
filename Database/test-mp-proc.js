#!/usr/bin/env node
/**
 * Test MinistryPlatform API call to stored procedure
 */

require('dotenv').config();

async function testMPProc() {
  try {
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
    const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

    // Get OAuth token
    console.log('Getting OAuth token...');
    const tokenResponse = await fetch(`${baseUrl}/oauth/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      }),
    });

    const { access_token } = await tokenResponse.json();
    console.log('✓ Got access token\n');

    // Call stored procedure
    console.log('Calling api_Custom_GetProjectBudgets_JSON...');
    const procUrl = `${baseUrl}/procs/api_Custom_GetProjectBudgets_JSON`;

    const procResponse = await fetch(procUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await procResponse.json();
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data.length);

    if (Array.isArray(data) && data[0]) {
      console.log('\nFirst element is array:', Array.isArray(data[0]));
      console.log('First element length:', data[0].length);

      if (Array.isArray(data[0]) && data[0][0]) {
        const firstRow = data[0][0];
        console.log('\n=== FIRST ROW ===');
        console.log('Keys:', Object.keys(firstRow));

        // Find the JSON column
        for (const key of Object.keys(firstRow)) {
          const value = firstRow[key];
          console.log(`\n${key}:`);
          console.log('  Type:', typeof value);
          console.log('  Length:', value?.length);

          if (typeof value === 'string' && value.startsWith('[')) {
            console.log('  First 100 chars:', value.substring(0, 100));
            console.log('  Last 100 chars:', value.substring(Math.max(0, value.length - 100)));

            // Try to parse
            try {
              const parsed = JSON.parse(value);
              console.log('  ✓ Valid JSON!');
              console.log('  Parsed length:', Array.isArray(parsed) ? parsed.length : 'N/A');
            } catch (e) {
              console.log('  ✗ JSON parse error:', e.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testMPProc();

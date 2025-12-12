#!/usr/bin/env node
/**
 * Test the optimized stored procedure via API
 * Real-world performance test
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../NextJS/Apps/.env') });

const MP_API_BASE_URL = process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org/ministryplatformapi';
const MP_CLIENT_ID = process.env.MINISTRY_PLATFORM_CLIENT_ID;
const MP_CLIENT_SECRET = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

async function getAccessToken() {
  const tokenUrl = `${MP_API_BASE_URL}/oauth/connect/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
    client_id: MP_CLIENT_ID,
    client_secret: MP_CLIENT_SECRET,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function executeProcedure(accessToken, procedureName, params) {
  const url = `${MP_API_BASE_URL}/procs/${procedureName}`;

  const startTime = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const duration = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  return { result, duration };
}

async function runTest() {
  try {
    console.log('\n🔐 Authenticating with MinistryPlatform...');
    const accessToken = await getAccessToken();
    console.log('✅ Authenticated successfully\n');

    console.log('━'.repeat(80));
    console.log('🧪 Testing api_Custom_GetProjectBudgetDetails_JSON');
    console.log('━'.repeat(80));
    console.log('');

    // Run 5 tests to see performance
    const results = [];
    for (let i = 1; i <= 5; i++) {
      console.log(`Run #${i}...`);

      const { result, duration } = await executeProcedure(
        accessToken,
        'api_Custom_GetProjectBudgetDetails_JSON',
        { '@Slug': 'winter-retreat-2025' }
      );

      const jsonResult = result[0]?.[0]?.JsonResult;
      const dataSize = jsonResult ? Buffer.byteLength(jsonResult, 'utf8') : 0;
      const parsedData = jsonResult ? JSON.parse(jsonResult) : null;

      results.push({
        run: i,
        duration,
        dataSize,
        projectTitle: parsedData?.Project_Title || 'N/A'
      });

      console.log(`  ⏱️  Duration: ${duration}ms`);
      console.log(`  💾 Data Size: ${(dataSize / 1024).toFixed(2)} KB`);
      console.log(`  📊 Project: ${parsedData?.Project_Title || 'N/A'}`);
      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('━'.repeat(80));
    console.log('');

    const durations = results.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log(`Runs: ${results.length}`);
    console.log(`Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`Fastest: ${minDuration}ms`);
    console.log(`Slowest: ${maxDuration}ms`);
    console.log(`Range: ${maxDuration - minDuration}ms`);
    console.log('');
    console.log(`Original Performance: 1358ms`);
    console.log(`Current Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`Improvement: ${((1 - avgDuration / 1358) * 100).toFixed(1)}%`);
    console.log('');

    console.log('Individual Run Times:');
    results.forEach(r => {
      const bar = '█'.repeat(Math.floor(r.duration / 10));
      console.log(`  Run ${r.run}: ${r.duration}ms ${bar}`);
    });

    console.log('');
    console.log('✅ Test complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runTest();

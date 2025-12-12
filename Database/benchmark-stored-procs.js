/**
 * Benchmark Script for MinistryPlatform Budget Stored Procedures
 * Tests the performance of budget-related API procedures
 * Saves results to JSON files for analysis
 */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../NextJS/Apps/.env') });

// Configuration - will be loaded from environment
const MP_API_BASE_URL = process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org/ministryplatformapi';
const MP_BASE_URL = MP_API_BASE_URL.replace('/ministryplatformapi', '');  // Get the root URL for OAuth
const MP_CLIENT_ID = process.env.MINISTRY_PLATFORM_CLIENT_ID;
const MP_CLIENT_SECRET = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

// Define stored procedures to benchmark (budget-focused)
const storedProcedures = [
  {
    name: 'api_Custom_GetProjectBudgets_JSON',
    params: {},
    description: 'Get all projects with budgets'
  },
  {
    name: 'api_Custom_GetProjectBudgets_JSON',
    params: { '@Slug': 'winter-retreat-2025' },
    description: 'Get single project by slug',
    filename: 'GetProjectBudgets_single'
  },
  {
    name: 'api_Custom_GetProjectBudgetDetails_JSON',
    params: { '@Slug': 'winter-retreat-2025' },
    description: 'Get project budget details (full nested data with categories, line items, transactions)'
  },
  {
    name: 'api_Custom_GetProjectPurchaseRequests_JSON',
    params: { '@ProjectID': 7 },
    description: 'Get all purchase requests for project'
  },
  {
    name: 'api_Custom_GetProjectPurchaseRequests_JSON',
    params: { '@ProjectID': 7, '@RequestedByContactID': 1 },
    description: 'Get purchase requests filtered by contact',
    filename: 'GetProjectPurchaseRequests_filtered'
  },
];

async function getAccessToken() {
  if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
    throw new Error('Missing MINISTRY_PLATFORM_CLIENT_ID or MINISTRY_PLATFORM_CLIENT_SECRET environment variables');
  }

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
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function parseNestedJsonStrings(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Try to parse if it looks like JSON
    if ((obj.startsWith('{') && obj.endsWith('}')) || (obj.startsWith('[') && obj.endsWith(']'))) {
      try {
        return JSON.parse(obj);
      } catch (e) {
        return obj;
      }
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => parseNestedJsonStrings(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = parseNestedJsonStrings(obj[key]);
    }
    return result;
  }

  return obj;
}

async function executeProcedure(accessToken, procedureName, params) {
  const url = `${MP_API_BASE_URL}/procs/${procedureName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function runBenchmark() {
  try {
    console.log('🔐 Authenticating with MinistryPlatform...');
    console.log(`   API URL: ${MP_API_BASE_URL}`);
    console.log('');

    const accessToken = await getAccessToken();
    console.log('✅ Authenticated successfully\n');

    const results = [];
    const outputDir = path.join(__dirname, 'benchmark-results');

    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}\n`);
    console.log('━'.repeat(80));
    console.log('');

    // Run each stored procedure
    for (const proc of storedProcedures) {
      const filename = proc.filename || proc.name;
      console.log(`⚡ Running: ${proc.name}`);
      console.log(`   Description: ${proc.description}`);
      if (Object.keys(proc.params).length > 0) {
        console.log(`   Parameters:`, JSON.stringify(proc.params, null, 2).replace(/\n/g, '\n   '));
      }

      try {
        const startTime = Date.now();

        // Execute procedure via API
        const result = await executeProcedure(accessToken, proc.name, proc.params);

        const duration = Date.now() - startTime;


        // Get the JSON result (MinistryPlatform returns nested arrays: [[{ JsonResult: "..." }]])
        const jsonResult = result[0]?.[0]?.JsonResult;
        let parsedData = null;
        let recordCount = 0;
        let dataSize = 0;

        if (jsonResult) {
          dataSize = Buffer.byteLength(jsonResult, 'utf8');
          try {
            parsedData = JSON.parse(jsonResult);
            recordCount = Array.isArray(parsedData) ? parsedData.length : 1;

            // Further parse nested JSON strings (like registrationDiscountsCategory, registrationIncomeCategory)
            // This returns the parsed object, so we need to reassign it
            parsedData = parseNestedJsonStrings(parsedData);
          } catch (e) {
            console.log(`   ⚠️  Warning: Could not parse JSON result`);
            parsedData = jsonResult;
          }
        } else {
          // No JsonResult found, use the entire result
          parsedData = result;
          if (Array.isArray(result)) {
            recordCount = result.length;
            dataSize = Buffer.byteLength(JSON.stringify(result), 'utf8');
          }
        }

        const benchmarkResult = {
          procedure: proc.name,
          description: proc.description,
          parameters: proc.params,
          duration_ms: duration,
          record_count: recordCount,
          data_size_bytes: dataSize,
          data_size_kb: (dataSize / 1024).toFixed(2),
          timestamp: new Date().toISOString(),
          success: true
        };

        results.push(benchmarkResult);

        // Save individual result (save only the parsed data, not the raw API response)
        const outputFile = path.join(outputDir, `${filename}.json`);
        const dataToSave = parsedData !== null ? parsedData : result;
        await fs.writeFile(
          outputFile,
          JSON.stringify(dataToSave, null, 2),
          'utf8'
        );

        console.log(`   ✅ Success`);
        console.log(`   ⏱️  Duration: ${duration}ms`);
        console.log(`   📊 Records: ${recordCount}`);
        console.log(`   💾 Size: ${(dataSize / 1024).toFixed(2)} KB`);
        console.log(`   📄 Saved to: ${path.basename(outputFile)}`);

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          procedure: proc.name,
          description: proc.description,
          parameters: proc.params,
          error: error.message,
          timestamp: new Date().toISOString(),
          success: false
        });
      }

      console.log('');
    }

    console.log('━'.repeat(80));
    console.log('');

    // Save benchmark summary
    const summaryFile = path.join(outputDir, '_benchmark_summary.json');
    await fs.writeFile(
      summaryFile,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        total_procedures: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results
      }, null, 2),
      'utf8'
    );

    console.log('📊 BENCHMARK SUMMARY');
    console.log('━'.repeat(80));
    console.log('');

    // Display results sorted by duration
    const successfulResults = results.filter(r => r.success).sort((a, b) => b.duration_ms - a.duration_ms);

    console.log('Performance Rankings (slowest to fastest):');
    console.log('');

    successfulResults.forEach((result, index) => {
      const badge = index === 0 ? '🐌' : index === successfulResults.length - 1 ? '🚀' : '  ';
      console.log(`${badge} ${result.duration_ms}ms - ${result.procedure}`);
      console.log(`   ${result.description}`);
      console.log(`   Records: ${result.record_count}, Size: ${result.data_size_kb} KB`);
      console.log('');
    });

    console.log('━'.repeat(80));
    console.log(`\n✅ Benchmark complete! Results saved to: ${outputDir}`);
    console.log(`📄 Summary: ${path.basename(summaryFile)}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run benchmark
runBenchmark().catch(console.error);

#!/usr/bin/env node
/**
 * Test api_Custom_GetProjectBudgetDetails_JSON via MinistryPlatform API
 */

require('dotenv').config();

async function testBudgetDetailsAPI() {
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

    // Call stored procedure for Winter Retreat 2025
    console.log('Calling api_Custom_GetProjectBudgetDetails_JSON with slug=winter-retreat-2025...');
    const procUrl = `${baseUrl}/procs/api_Custom_GetProjectBudgetDetails_JSON?@Slug=winter-retreat-2025`;

    const procResponse = await fetch(procUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!procResponse.ok) {
      console.error('✗ API Error:', procResponse.status, procResponse.statusText);
      const errorText = await procResponse.text();
      console.error('Response:', errorText);
      return;
    }

    const data = await procResponse.json();
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Is array:', Array.isArray(data));
    console.log('Length:', data.length);

    if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0]) {
      const firstRow = data[0][0];
      console.log('\n=== FIRST ROW ===');
      console.log('Keys:', Object.keys(firstRow));

      if (firstRow.JsonResult) {
        console.log('\nJsonResult:');
        console.log('  Type:', typeof firstRow.JsonResult);
        console.log('  Length:', firstRow.JsonResult.length);
        console.log('  First 200 chars:', firstRow.JsonResult.substring(0, 200));

        try {
          const parsed = JSON.parse(firstRow.JsonResult);
          console.log('\n✓ Valid JSON!');
          console.log('\n=== PARSED DATA ===');
          console.log('Project_Title:', parsed.Project_Title);
          console.log('Slug:', parsed.Slug);
          console.log('Total_Budget:', parsed.Total_Budget);
          console.log('Total_Actual_Expenses:', parsed.Total_Actual_Expenses);
          console.log('Total_Expected_Income:', parsed.Total_Expected_Income);
          console.log('Expense Categories:', parsed.expenseCategories?.length || 0);
          console.log('Income Line Items:', parsed.incomeLineItemsCategories?.length || 0);
        } catch (e) {
          console.log('\n✗ JSON parse error:', e.message);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testBudgetDetailsAPI();

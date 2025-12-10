#!/usr/bin/env node
/**
 * Refresh MinistryPlatform metadata cache
 * This is typically needed after registering new API procedures
 *
 * Usage: node refresh-mp-metadata.js
 */

require('dotenv').config();

async function refreshMetadata() {
  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org/ministryplatformapi';
  const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
  const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Error: MINISTRY_PLATFORM_CLIENT_ID and MINISTRY_PLATFORM_CLIENT_SECRET must be set in .env');
    process.exit(1);
  }

  try {
    // Step 1: Get OAuth token
    console.log('Getting OAuth token...');
    const tokenUrl = `${baseUrl}/oauth/connect/token`;

    const tokenResponse = await fetch(tokenUrl, {
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get token: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✓ Got access token');

    // Step 2: Refresh metadata cache
    console.log('Refreshing metadata cache...');
    const refreshUrl = `${baseUrl}/tables/refreshMetadata`;

    const refreshResponse = await fetch(refreshUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      throw new Error(`Failed to refresh metadata: ${refreshResponse.status} ${errorText}`);
    }

    console.log('✓ Metadata cache refreshed successfully!');
    console.log('\nYour API procedure is now available at:');
    console.log(`${baseUrl}/procs/api_Custom_GetProjectBudgets_JSON`);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

refreshMetadata();

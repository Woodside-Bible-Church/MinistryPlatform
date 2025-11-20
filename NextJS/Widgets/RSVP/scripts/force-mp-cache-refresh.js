/**
 * Force MinistryPlatform Cache Refresh via API
 *
 * This script forces MP to refresh its cache by calling the system API endpoint.
 */

require('dotenv').config();
const https = require('https');

// Remove /ministryplatformapi suffix if present
const MP_BASE_URL = (process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org').replace('/ministryplatformapi', '');
const CLIENT_ID = process.env.MINISTRY_PLATFORM_CLIENT_ID;
const CLIENT_SECRET = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing environment variables');
  console.error('   Required: MINISTRY_PLATFORM_CLIENT_ID, MINISTRY_PLATFORM_CLIENT_SECRET');
  process.exit(1);
}

async function getAccessToken() {
  console.log('🔑 Getting OAuth access token...');

  const tokenUrl = `${MP_BASE_URL}/ministryplatform/oauth/connect/token`;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get token: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('✅ Access token obtained');
  return data.access_token;
}

async function refreshCache(token) {
  console.log('🔄 Forcing MP cache refresh...');

  const cacheUrl = `${MP_BASE_URL}/ministryplatformapi/cache/refresh`;

  const response = await fetch(cacheUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Cache refresh failed: ${response.status}`);
    console.error(error);
    return false;
  }

  console.log('✅ Cache refresh triggered successfully');
  return true;
}

async function clearTableCache(token, tableName) {
  console.log(`🗑️  Clearing cache for table: ${tableName}...`);

  const cacheUrl = `${MP_BASE_URL}/ministryplatformapi/cache/clear/table/${tableName}`;

  const response = await fetch(cacheUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error(`⚠️  Failed to clear cache for ${tableName}: ${response.status}`);
    return false;
  }

  console.log(`✅ Cache cleared for ${tableName}`);
  return true;
}

async function main() {
  console.log('========================================');
  console.log('MinistryPlatform Cache Refresh Tool');
  console.log('========================================\n');

  try {
    // Get OAuth token
    const token = await getAccessToken();

    // Clear specific table caches
    const tablesToClear = [
      'Event_RSVPs',
      'Event_Participants',
      'Events',
      'RSVP_Statuses'
    ];

    console.log('\n📋 Clearing table-specific caches...\n');
    for (const table of tablesToClear) {
      await clearTableCache(token, table);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between calls
    }

    // Force full cache refresh
    console.log('\n🔄 Triggering full cache refresh...\n');
    await refreshCache(token);

    console.log('\n========================================');
    console.log('✅ Cache refresh complete!');
    console.log('========================================');
    console.log('\nNext steps:');
    console.log('1. Restart IIS Application Pool (if you have access)');
    console.log('2. Wait 1-2 minutes for MP to rebuild cache');
    console.log('3. Try accessing MinistryPlatform again');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

require('dotenv').config({ path: '../NextJS/Apps/.env.local' });

const authUrl = `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/oauth/connect/token`;
const procUrl = `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/procs/api_Custom_GetUserRolesAndGroups_JSON`;

console.log('Auth URL:', authUrl);
console.log('Proc URL:', procUrl);
console.log('');

// Get OAuth token
fetch(authUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
    client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID,
    client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET
  })
}).then(r => r.json()).then(auth => {
  console.log('✓ Got OAuth token');
  console.log('');

  // Test 1: Call with @UserGUID
  console.log('TEST 1: Calling with {"@UserGUID": "..."}');
  return fetch(procUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + auth.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      '@UserGUID': 'b93371a5-ce0f-4b02-a067-65f384a4cd0a'
    })
  }).then(r => {
    console.log('Response status:', r.status, r.statusText);
    return r.text();
  }).then(text => {
    console.log('Response body:', text);
    console.log('');

    // Test 2: Call with UserGUID (no @)
    console.log('TEST 2: Calling with {"UserGUID": "..."}');
    return fetch(procUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + auth.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'UserGUID': 'b93371a5-ce0f-4b02-a067-65f384a4cd0a'
      })
    });
  }).then(r => {
    console.log('Response status:', r.status, r.statusText);
    return r.text();
  }).then(text => {
    console.log('Response body:', text);
  });
}).catch(e => {
  console.error('Error:', e.message);
});

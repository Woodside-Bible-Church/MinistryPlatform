require('dotenv').config({ path: '../NextJS/Apps/.env.local' });

const authUrl = `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/oauth/connect/token`;
const procsUrl = `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/procs`;

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
  console.log('Got auth token');
  return fetch(procsUrl + '/api_Custom_GetUserRolesAndGroups_JSON', {
    headers: { 'Authorization': 'Bearer ' + auth.access_token }
  });
}).then(r => r.json()).then(data => {
  console.log('Procedure metadata:');
  console.log(JSON.stringify(data, null, 2));
}).catch(e => console.error('Error:', e));

import { MPHelper } from './src/providers/MinistryPlatform/mpHelper.js';

const testUserGUID = 'b93371a5-ce0f-4b02-a067-65f384a4cd0a';

console.log('Testing stored procedure call with MPHelper...');
console.log('User GUID:', testUserGUID);
console.log('');

try {
  const mp = new MPHelper();

  console.log('Calling api_Custom_GetUserRolesAndGroups_JSON with { "@UserGUID":', testUserGUID, '}');
  const result = await mp.executeProcedureWithBody(
    'api_Custom_GetUserRolesAndGroups_JSON',
    { '@UserGUID': testUserGUID }
  );

  console.log('');
  console.log('Raw result:', JSON.stringify(result, null, 2));
  console.log('');

  // Extract roles from nested array structure
  if (result && result.length > 0 && Array.isArray(result[0])) {
    const roleObjects = result[0];
    const roles = roleObjects.map(r => r.Roles);
    console.log('✓ SUCCESS! Extracted roles:', roles);
    console.log('Total roles:', roles.length);
  } else {
    console.log('✗ FAILED - Unexpected result structure');
  }
} catch (error) {
  console.error('✗ ERROR:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
}

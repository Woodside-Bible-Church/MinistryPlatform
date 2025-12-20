// Test script for purchase request stored procedure
import 'dotenv/config';
import { getMPAccessToken, getMPBaseUrl } from './src/lib/mpAuth';

async function testStoredProc() {
  try {
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Test with purchase request ID 45 (has transactions based on screenshot)
    const purchaseRequestId = 45;
    const mpUrl = `${baseUrl}/procs/api_Custom_GetPurchaseRequestDetails_JSON?@PurchaseRequestID=${purchaseRequestId}`;

    console.log('Testing stored procedure...');
    console.log('URL:', mpUrl);
    console.log('');

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Raw response from MP:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    // Check the nested structure
    if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0]) {
      const row = data[0][0];
      console.log('JsonResult column:');
      console.log(row.JsonResult);
      console.log('');

      if (row.JsonResult) {
        const purchaseRequest = JSON.parse(row.JsonResult);
        console.log('Parsed purchase request:');
        console.log(JSON.stringify(purchaseRequest, null, 2));
        console.log('');

        // Check transactions field
        console.log('Transactions field type:', typeof purchaseRequest.transactions);
        console.log('Transactions field value:');
        console.log(purchaseRequest.transactions);
        console.log('');

        if (typeof purchaseRequest.transactions === 'string') {
          console.log('Transactions is a string, parsing...');
          const parsedTransactions = JSON.parse(purchaseRequest.transactions);
          console.log('Parsed transactions:');
          console.log(JSON.stringify(parsedTransactions, null, 2));
        } else if (Array.isArray(purchaseRequest.transactions)) {
          console.log('Transactions is already an array with', purchaseRequest.transactions.length, 'items');
        }
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testStoredProc();

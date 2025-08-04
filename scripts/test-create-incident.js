#!/usr/bin/env node

const dotenv = require('dotenv');
const { ServiceNowClient } = require('../dist/utils/servicenow-client');

// Load environment variables
dotenv.config();

async function testCreateIncident() {
  try {
    const client = new ServiceNowClient();
    
    console.log('Creating test incident...');
    const response = await client.makeRequest({
      method: 'POST',
      url: '/api/now/table/incident',
      data: {
        short_description: 'TEST_' + Date.now() + '_Integration Test',
        urgency: '3',
        impact: '3'
      }
    });
    
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response.result && response.result.sys_id) {
      console.log('✅ Incident created successfully!');
      console.log('Sys ID:', response.result.sys_id);
      console.log('Number:', response.result.number);
      
      // Clean up - delete the test incident
      console.log('\nCleaning up...');
      await client.makeRequest({
        method: 'DELETE',
        url: `/api/now/table/incident/${response.result.sys_id}`
      });
      console.log('✅ Test incident deleted');
    } else {
      console.log('❌ Unexpected response structure');
      console.log('Looking for result.sys_id in:', response);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testCreateIncident().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
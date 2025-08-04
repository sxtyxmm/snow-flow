#!/usr/bin/env node

const dotenv = require('dotenv');
const { ServiceNowClient } = require('../dist/utils/servicenow-client');

// Load environment variables
dotenv.config();

console.log('Testing ServiceNow Authentication...');
console.log('Instance:', process.env.SNOW_INSTANCE);
console.log('Client ID:', process.env.SNOW_CLIENT_ID?.substring(0, 10) + '...');
console.log('Username:', process.env.SNOW_USERNAME);
console.log('');

async function testAuth() {
  try {
    const client = new ServiceNowClient();
    
    console.log('Attempting to authenticate...');
    const result = await client.testConnection();
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Authentication successful!');
      console.log('Instance Info:', result.data);
    } else {
      console.log('❌ Authentication failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error during authentication:', error.message);
    console.error('Full error:', error);
  }
}

testAuth().then(() => {
  console.log('\nTest complete');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
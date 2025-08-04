#!/usr/bin/env node

/**
 * Test script to verify deployment timeout configuration
 */

import { ServiceNowClient } from '../dist/utils/servicenow-client.js';
import { config } from 'dotenv';

// Load environment variables
config();

async function testDeploymentTimeout() {
  console.log('🧪 Testing deployment timeout configuration...\n');
  
  // Display configured timeouts
  console.log('📋 Configured Timeouts:');
  console.log(`  - Regular timeout: ${process.env.SNOW_REQUEST_TIMEOUT || '60000'}ms`);
  console.log(`  - Deployment timeout: ${process.env.SNOW_DEPLOYMENT_TIMEOUT || '300000'}ms`);
  console.log(`  - MCP deployment timeout: ${process.env.MCP_DEPLOYMENT_TIMEOUT || '360000'}ms`);
  console.log('');
  
  try {
    // Create client instance
    const client = new ServiceNowClient();
    console.log('✅ ServiceNowClient created successfully');
    
    // Create a test widget with intentionally large content
    const testWidget = {
      name: `test_timeout_widget_${Date.now()}`,
      id: `test_timeout_widget_${Date.now()}`,
      template: '<div>' + 'x'.repeat(10000) + '</div>', // Large template
      css: '/* ' + 'y'.repeat(10000) + ' */', // Large CSS
      server_script: `// ${'z'.repeat(10000)}`, // Large script
      client_script: `// ${'w'.repeat(10000)}`, // Large client script
      public: false,
      roles: '',
      active: true
    };
    
    console.log('\n🚀 Creating test widget with large content...');
    console.log(`  - Widget size: ~${JSON.stringify(testWidget).length} bytes`);
    
    const startTime = Date.now();
    
    const result = await client.createWidget(testWidget);
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      console.log(`\n✅ Widget created successfully in ${duration}ms`);
      console.log(`  - Sys ID: ${result.data.sys_id}`);
      console.log(`  - Widget ID: ${result.data.id}`);
      
      // Clean up - delete the test widget
      console.log('\n🧹 Cleaning up test widget...');
      // Note: ServiceNowClient doesn't have a deleteWidget method, 
      // so cleanup would need to be done manually or via direct API call
      console.log('⚠️  Please delete test widget manually: ' + result.data.id);
    } else {
      console.error(`\n❌ Widget creation failed after ${duration}ms:`, result.error);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️  This appears to be a timeout error. Check your timeout configuration.');
    }
  }
  
  console.log('\n✅ Deployment timeout test completed');
}

// Run the test
testDeploymentTimeout();
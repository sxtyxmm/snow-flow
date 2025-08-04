#!/usr/bin/env node

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Direct require of the compiled file
const { ServiceNowAdvancedFeaturesMCP } = require('../dist/mcp/advanced/servicenow-advanced-features-mcp');

async function testBatchAPI() {
  const mcpServer = new ServiceNowAdvancedFeaturesMCP();
  
  // Wait for auth
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Create a test incident first
    const createResponse = await mcpServer.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/incident',
      data: {
        short_description: 'BATCH_TEST_' + Date.now(),
        urgency: '3',
        impact: '3'
      }
    });
    
    console.log('Create response:', JSON.stringify(createResponse, null, 2));
    const testId = createResponse.result?.sys_id;
    console.log('Created incident:', testId);
    
    // Test batch API
    const response = await mcpServer.executeBatchApi({
      operations: [
        {
          operation: 'query',
          table: 'incident',
          query: `sys_id=${testId}`,
          fields: ['number', 'short_description']
        }
      ],
      parallel_execution: false
    });
    
    console.log('Batch API response:', JSON.stringify(response, null, 2));
    
    if (response.content && response.content[0]) {
      const result = JSON.parse(response.content[0].text);
      console.log('Parsed result:', JSON.stringify(result, null, 2));
    }
    
    // Cleanup
    await mcpServer.client.makeRequest({
      method: 'DELETE',
      url: `/api/now/table/incident/${testId}`
    });
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  // Clean up intervals
  if (mcpServer.authCheckInterval) {
    clearInterval(mcpServer.authCheckInterval);
  }
  if (mcpServer.metricsInterval) {
    clearInterval(mcpServer.metricsInterval);
  }
  
  process.exit(0);
}

testBatchAPI().catch(console.error);
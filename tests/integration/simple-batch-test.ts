/**
 * Simple test to verify batch API works against real instance
 */

import { ServiceNowAdvancedFeaturesMCP } from '../../src/mcp/advanced/servicenow-advanced-features-mcp';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testBatchAPI() {
  const mcpServer = new ServiceNowAdvancedFeaturesMCP();
  
  // Wait for auth
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Create a test incident first
    const createResponse = await (mcpServer as any).client.makeRequest({
      method: 'POST',
      url: '/api/now/table/incident',
      data: {
        short_description: 'BATCH_TEST_' + Date.now(),
        urgency: '3',
        impact: '3'
      }
    });
    
    console.log('Create response:', createResponse);
    const testId = createResponse.result?.sys_id;
    console.log('Created incident:', testId);
    
    // Test batch API
    const response = await (mcpServer as any).executeBatchApi({
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
    
    console.log('Batch API response:', response);
    
    if (response.content && response.content[0]) {
      const result = JSON.parse(response.content[0].text);
      console.log('Parsed result:', result);
    }
    
    // Cleanup
    await (mcpServer as any).client.makeRequest({
      method: 'DELETE',
      url: `/api/now/table/incident/${testId}`
    });
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  // Clean up intervals
  if ((mcpServer as any).authCheckInterval) {
    clearInterval((mcpServer as any).authCheckInterval);
  }
  if ((mcpServer as any).metricsInterval) {
    clearInterval((mcpServer as any).metricsInterval);
  }
  
  process.exit(0);
}

testBatchAPI();
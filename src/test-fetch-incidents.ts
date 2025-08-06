import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

// Test fetchIncidentData like the ML MCP does
async function testFetchIncidents() {
  const logger = new Logger('FetchIncidentsTest');
  const client = new ServiceNowClient();
  
  console.log('🔥 Testing fetchIncidentData with 2000 samples...');
  
  // Simulate exactly what the ML MCP fetchIncidentData method does
  const sample_size = 2000;
  const intelligent_selection = true;
  const focus_categories: string[] = [];
  const query = '';
  
  let finalQuery = query;
  
  // If intelligent selection is enabled and no custom query provided
  if (intelligent_selection && !query) {
    // Build an intelligent query that gets a balanced dataset
    const queries = [];
    
    // Get mix of recent and older incidents
    queries.push('sys_created_onONLast 6 months');
    
    // Get mix of priorities
    queries.push('(priority=1^ORpriority=2^ORpriority=3^ORpriority=4)');
    
    // Get mix of active and resolved
    queries.push('(active=true^ORactive=false)');
    
    // Focus on specific categories if provided
    if (focus_categories.length > 0) {
      const categoryQuery = focus_categories.map(cat => `category=${cat}`).join('^OR');
      queries.push(`(${categoryQuery})`);
    } else {
      // Get diverse categories
      queries.push('categoryISNOTEMPTY');
    }
    
    // Combine all queries
    finalQuery = queries.join('^');
    
    logger.info(`Using intelligent query selection: ${finalQuery}`);
  } else if (query) {
    logger.info(`Using custom query: ${query}`);
  }
  
  // Always order by sys_created_on DESC to get most recent first
  if (finalQuery && !finalQuery.includes('ORDERBY')) {
    finalQuery += '^ORDERBYDESCsys_created_on';
  } else if (!finalQuery) {
    finalQuery = 'ORDERBYDESCsys_created_on';
  }
  
  logger.info(`Attempting to fetch ${sample_size} incidents with query: ${finalQuery}`);
  
  try {
    // 🔴 CRITICAL: Use the actual sample_size parameter, not default of 10
    const response = await client.searchRecords('incident', finalQuery, sample_size);
    
    if (!response.success || !response.data?.result) {
      throw new Error('Failed to fetch incident data. Ensure you have read access to the incident table.');
    }
    
    logger.info(`✅ SUCCESS: Fetched ${response.data.result.length} incidents for ML training (requested: ${sample_size})`);
    
    // Show data distribution like the ML MCP does
    if (response.data.result.length > 0) {
      const categoryDistribution: Record<string, number> = {};
      const priorityDistribution: Record<string, number> = {};
      
      response.data.result.forEach((inc: any) => {
        const category = inc.category || 'uncategorized';
        const priority = inc.priority || '3';
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
        priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
      });
      
      logger.info('Data distribution:');
      logger.info(`Categories: ${JSON.stringify(categoryDistribution)}`);
      logger.info(`Priorities: ${JSON.stringify(priorityDistribution)}`);
      
      // Check if we have enough for training
      if (response.data.result.length >= 100) {
        logger.info('✅ Sufficient data for ML training (need at least 100 incidents)');
      } else {
        logger.warn(`⚠️ Insufficient data for training (need at least 100 incidents, got ${response.data.result.length})`);
      }
    }
    
  } catch (error) {
    logger.error('❌ fetchIncidentData failed:', error);
  }
}

testFetchIncidents().catch(console.error);
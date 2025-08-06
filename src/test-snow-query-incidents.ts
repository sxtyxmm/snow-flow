import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

// Test exact same logic as snow_query_incidents MCP tool
async function testSnowQueryIncidents() {
  const logger = new Logger('SnowQueryIncidentsTest');
  const client = new ServiceNowClient();
  
  console.log('🔍 Testing snow_query_incidents MCP logic...');
  
  // Simulate handleQueryIncidents exactly
  const query = 'state!=7';
  const limit = 5;
  
  logger.info(`Querying incidents with: ${query}`);
  
  try {
    // Step 1: processNaturalLanguageQuery (from operations MCP)
    const processNaturalLanguageQuery = (query: string, context: string): string => {
      const lowerQuery = query.toLowerCase();
      
      // If already a ServiceNow encoded query, return as-is
      if (query.includes('=') || query.includes('!=') || query.includes('^') || query.includes('LIKE')) {
        logger.info(`Using raw ServiceNow query: ${query}`);
        return query;
      }
      
      // Other processing would go here...
      logger.info(`Treating as natural language: ${query}`);
      return `short_descriptionLIKE${query}^ORdescriptionLIKE${query}`;
    };
    
    // Step 2: Process the query
    const processedQuery = processNaturalLanguageQuery(query, 'incident');
    logger.info(`Processed query: "${processedQuery}"`);
    
    // Step 3: Execute the search (exact same as MCP)
    const incidents = await client.searchRecords('incident', processedQuery, limit);
    logger.info(`Search result: success=${incidents.success}, count=${incidents.data?.result?.length || 0}`);
    
    // Step 4: Build result object (exact same as MCP)
    let result = {
      total_results: incidents.success ? incidents.data.result.length : 0,
      incidents: incidents.success ? incidents.data.result : []
    };
    
    // Step 5: Format output (exact same as MCP)
    const output = `Found ${incidents.success ? incidents.data.result.length : 0} incidents matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`;
    
    console.log('\n📋 MCP Output would be:');
    console.log(output);
    
    if (!incidents.success || incidents.data.result.length === 0) {
      logger.error('🚨 This matches the problem! MCP would return 0 incidents');
    } else {
      logger.info('✅ This would work correctly in MCP');
    }
    
  } catch (error) {
    logger.error('❌ Error in snow_query_incidents simulation:', error);
  }
  
  // Direct test without MCP processing
  console.log('\n🔄 Direct test without MCP processing:');
  try {
    const directResult = await client.searchRecords('incident', 'state!=7', limit);
    logger.info(`Direct result: success=${directResult.success}, count=${directResult.data?.result?.length || 0}`);
    
    if (directResult.success && directResult.data?.result?.length > 0) {
      logger.info('✅ Direct call works - problem is in MCP processing');
    }
  } catch (error) {
    logger.error('❌ Direct call also fails:', error);
  }
}

testSnowQueryIncidents().catch(console.error);
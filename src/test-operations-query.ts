import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

async function testOperationsQuery() {
  const logger = new Logger('OperationsQueryTest');
  const client = new ServiceNowClient();
  
  logger.info('Testing operations query processing...');
  
  // Test processNaturalLanguageQuery logic
  const testQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // If already a ServiceNow encoded query, return as-is
    if (query.includes('=') || query.includes('!=') || query.includes('^') || query.includes('LIKE')) {
      logger.info(`Recognized as ServiceNow query: ${query}`);
      return query;
    }
    
    logger.info(`Treating as natural language: ${query}`);
    return `short_descriptionLIKE${query}^ORdescriptionLIKE${query}`;
  };
  
  // Test queries
  const queries = [
    'state!=7',
    'active=true',
    'priority=1',
    'all incidents',
    'high priority',
    ''
  ];
  
  logger.info('\n--- Testing Query Processing ---');
  for (const query of queries) {
    const processed = testQuery(query);
    logger.info(`Input: "${query}" -> Output: "${processed}"`);
  }
  
  logger.info('\n--- Testing Actual Queries ---');
  
  // Test 1: Raw ServiceNow query
  try {
    logger.info('\nTest 1: Testing with state!=7...');
    const result1 = await client.searchRecords('incident', 'state!=7', 10);
    logger.info(`Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result1.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 1 failed:', error);
  }
  
  // Test 2: Empty query
  try {
    logger.info('\nTest 2: Testing with empty query...');
    const result2 = await client.searchRecords('incident', '', 10);
    logger.info(`Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result2.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 2 failed:', error);
  }
  
  // Test 3: Complex query
  try {
    logger.info('\nTest 3: Testing with complex query...');
    const result3 = await client.searchRecords('incident', 'active=true^state!=6^state!=7', 10);
    logger.info(`Result: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result3.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 3 failed:', error);
  }
  
  // Test 4: Test natural language conversion
  try {
    logger.info('\nTest 4: Testing natural language conversion...');
    const nlQuery = 'high priority';
    const processedQuery = testQuery(nlQuery);
    logger.info(`Natural language: "${nlQuery}" -> "${processedQuery}"`);
    
    // Now test the actual operations MCP logic
    const operationsQuery = nlQuery.toLowerCase().includes('high priority') ? 'priority=1' : processedQuery;
    logger.info(`Operations MCP would use: "${operationsQuery}"`);
    
    const result4 = await client.searchRecords('incident', operationsQuery, 10);
    logger.info(`Result: ${result4.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result4.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 4 failed:', error);
  }
}

// Run the test
testOperationsQuery().catch(console.error);
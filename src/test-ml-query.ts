import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

async function testMLQuery() {
  const logger = new Logger('MLQueryTest');
  const client = new ServiceNowClient();
  
  logger.info('Testing ML training query...');
  
  // Build the exact same intelligent query as ML training
  const queries = [];
  queries.push('sys_created_onONLast 6 months');
  queries.push('(priority=1^ORpriority=2^ORpriority=3^ORpriority=4)');
  queries.push('(active=true^ORactive=false)');
  queries.push('categoryISNOTEMPTY');
  
  const finalQuery = queries.join('^');
  logger.info(`Using ML intelligent query: ${finalQuery}`);
  
  // Test 1: Without ordering
  try {
    logger.info('\nTest 1: Query without ordering...');
    const result1 = await client.searchRecords('incident', finalQuery, 10);
    logger.info(`Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result1.data?.result?.length || 0}`);
    
    if (result1.data?.result?.length > 0) {
      logger.info('Sample incidents:');
      result1.data.result.slice(0, 3).forEach((inc: any) => {
        logger.info(`- ${inc.number}: created=${inc.sys_created_on}, priority=${inc.priority}, category=${inc.category || 'none'}`);
      });
    }
  } catch (error) {
    logger.error('Test 1 failed:', error);
  }
  
  // Test 2: With ordering (as ML uses)
  try {
    logger.info('\nTest 2: Query with ordering...');
    const orderedQuery = finalQuery + '^ORDERBYDESCsys_created_on';
    const result2 = await client.searchRecords('incident', orderedQuery, 10);
    logger.info(`Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result2.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 2 failed:', error);
  }
  
  // Test 3: With offset (for streaming)
  try {
    logger.info('\nTest 3: Query with offset...');
    const orderedQuery = finalQuery + '^ORDERBYDESCsys_created_on';
    const result3 = await client.searchRecordsWithOffset('incident', orderedQuery, 10, 0);
    logger.info(`Result: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result3.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 3 failed:', error);
  }
  
  // Test 4: Simplify query to find the issue
  try {
    logger.info('\nTest 4: Testing each query part separately...');
    
    const testQueries = [
      'sys_created_onONLast 6 months',
      'priority=1^ORpriority=2^ORpriority=3^ORpriority=4',
      'active=true^ORactive=false',
      'categoryISNOTEMPTY',
      'category!=null',
      'categoryISNOT EMPTY',
      '' // empty query
    ];
    
    for (const q of testQueries) {
      const result = await client.searchRecords('incident', q, 5);
      logger.info(`Query "${q}" -> ${result.data?.result?.length || 0} results`);
    }
  } catch (error) {
    logger.error('Test 4 failed:', error);
  }
  
  // Test 5: Check if categoryISNOTEMPTY is the problem
  try {
    logger.info('\nTest 5: Testing without category filter...');
    const queriesWithoutCategory = [
      'sys_created_onONLast 6 months',
      '(priority=1^ORpriority=2^ORpriority=3^ORpriority=4)',
      '(active=true^ORactive=false)'
    ];
    const queryWithoutCategory = queriesWithoutCategory.join('^');
    logger.info(`Query without category: ${queryWithoutCategory}`);
    
    const result5 = await client.searchRecords('incident', queryWithoutCategory, 10);
    logger.info(`Result: ${result5.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${result5.data?.result?.length || 0}`);
    
    if (result5.data?.result?.length > 0) {
      logger.info('Categories in results:');
      const categories = new Set(result5.data.result.map((inc: any) => inc.category || 'empty'));
      logger.info(`Unique categories: ${Array.from(categories).join(', ')}`);
    }
  } catch (error) {
    logger.error('Test 5 failed:', error);
  }
}

// Run the test
testMLQuery().catch(console.error);
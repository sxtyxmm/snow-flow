import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

async function testLimitProblem() {
  const logger = new Logger('LimitTest');
  const client = new ServiceNowClient();
  
  logger.info('Testing incident limits...');
  
  // Test different limits
  const limits = [10, 50, 100, 500, 1000];
  
  for (const limit of limits) {
    try {
      logger.info(`\nTesting with limit ${limit}...`);
      const result = await client.searchRecords('incident', 'state!=7', limit);
      logger.info(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      logger.info(`Requested: ${limit}, Got: ${result.data?.result?.length || 0}`);
    } catch (error) {
      logger.error(`Test with limit ${limit} failed:`, error);
    }
  }
  
  // Test with empty query (should get all incidents)
  try {
    logger.info(`\nTesting all incidents with limit 1000...`);
    const result = await client.searchRecords('incident', '', 1000);
    logger.info(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Total incidents found: ${result.data?.result?.length || 0}`);
    
    if (result.data?.result?.length > 0) {
      const states = new Map();
      const priorities = new Map();
      
      result.data.result.forEach((inc: any) => {
        const state = inc.state || 'unknown';
        const priority = inc.priority || 'unknown';
        states.set(state, (states.get(state) || 0) + 1);
        priorities.set(priority, (priorities.get(priority) || 0) + 1);
      });
      
      logger.info('State distribution:', Object.fromEntries(states));
      logger.info('Priority distribution:', Object.fromEntries(priorities));
      
      // Count active incidents (state != 6 and state != 7)
      const activeIncidents = result.data.result.filter((inc: any) => 
        inc.state !== '6' && inc.state !== '7'
      );
      logger.info(`Active incidents (state not 6 or 7): ${activeIncidents.length}`);
    }
  } catch (error) {
    logger.error('All incidents test failed:', error);
  }
  
  // Test what the ML training was actually requesting
  try {
    logger.info(`\nTesting ML training scenario (sample_size 2000)...`);
    const result = await client.searchRecords('incident', 'state!=7', 2000);
    logger.info(`ML training result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`ML would get: ${result.data?.result?.length || 0} incidents out of requested 2000`);
  } catch (error) {
    logger.error('ML training test failed:', error);
  }
}

// Run the test
testLimitProblem().catch(console.error);
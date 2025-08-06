import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

async function testIncidentAccess() {
  const logger = new Logger('IncidentAccessTest');
  const client = new ServiceNowClient();
  
  logger.info('Testing incident table access...');
  
  // Test 1: Empty query (get all)
  try {
    logger.info('Test 1: Fetching ALL incidents with empty query...');
    const allIncidents = await client.searchRecords('incident', '', 10);
    logger.info(`Result: ${allIncidents.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${allIncidents.data?.result?.length || 0}`);
    
    if (allIncidents.data?.result?.length > 0) {
      logger.info('Sample incident states:');
      allIncidents.data.result.slice(0, 5).forEach((inc: any) => {
        logger.info(`- ${inc.number}: state=${inc.state}, active=${inc.active}`);
      });
    }
  } catch (error) {
    logger.error('Test 1 failed:', error);
  }
  
  // Test 2: State not equal to 7
  try {
    logger.info('\nTest 2: Fetching incidents where state!=7...');
    const notClosedIncidents = await client.searchRecords('incident', 'state!=7', 10);
    logger.info(`Result: ${notClosedIncidents.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${notClosedIncidents.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 2 failed:', error);
  }
  
  // Test 3: Active incidents
  try {
    logger.info('\nTest 3: Fetching active incidents...');
    const activeIncidents = await client.searchRecords('incident', 'active=true', 10);
    logger.info(`Result: ${activeIncidents.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`Count: ${activeIncidents.data?.result?.length || 0}`);
  } catch (error) {
    logger.error('Test 3 failed:', error);
  }
  
  // Test 4: All states
  try {
    logger.info('\nTest 4: Checking incident states...');
    const states = ['1', '2', '3', '4', '5', '6', '7', '8'];
    for (const state of states) {
      const stateIncidents = await client.searchRecords('incident', `state=${state}`, 1);
      if (stateIncidents.success && stateIncidents.data?.result?.length > 0) {
        logger.info(`State ${state}: Found incidents`);
      }
    }
  } catch (error) {
    logger.error('Test 4 failed:', error);
  }
  
  // Test 5: User permissions
  try {
    logger.info('\nTest 5: Testing user permissions...');
    const userInfo = await client.get('/api/now/table/sys_user/me');
    logger.info(`Current user: ${userInfo.data?.result?.user_name || 'Unknown'}`);
    logger.info(`Roles: ${userInfo.data?.result?.roles || 'Unknown'}`);
  } catch (error) {
    logger.error('Failed to get user info:', error);
  }
}

// Run the test
testIncidentAccess().catch(console.error);
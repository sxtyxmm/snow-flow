import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

// Test of ML training nu correct batch sizes gebruikt
async function testMLBatchFix() {
  const logger = new Logger('MLBatchFixTest');
  const client = new ServiceNowClient();
  
  console.log('🔍 Testing ML training batch size fix...');
  
  // Simuleer ML fetchIncidentData methode met verschillende batch sizes
  async function testFetchIncidentData(sample_size: number, description: string) {
    logger.info(`\n--- ${description} ---`);
    logger.info(`Requesting ${sample_size} incidents`);
    
    const intelligent_selection = true;
    const focus_categories: string[] = [];
    const query = '';
    
    let finalQuery = '';
    if (intelligent_selection && !query) {
      const queries = [];
      queries.push('sys_created_onONLast 6 months');
      queries.push('(priority=1^ORpriority=2^ORpriority=3^ORpriority=4)');  
      queries.push('(active=true^ORactive=false)');
      queries.push('categoryISNOTEMPTY');
      finalQuery = queries.join('^') + '^ORDERBYDESCsys_created_on';
    }
    
    try {
      const start = Date.now();
      // 🔴 KEY TEST: Use the actual sample_size parameter 
      const response = await client.searchRecords('incident', finalQuery, sample_size);
      const duration = Date.now() - start;
      
      if (response.success) {
        const actualCount = response.data?.result?.length || 0;
        logger.info(`✅ SUCCESS: Got ${actualCount}/${sample_size} incidents (${duration}ms)`);
        
        if (actualCount === Math.min(sample_size, 1000)) { // ServiceNow might limit to 1000
          logger.info(`✅ Correct batch size used`);
        } else if (actualCount === 10) {
          logger.error(`❌ STILL USING DEFAULT LIMIT OF 10!`);
        } else {
          logger.info(`ℹ️ Got ${actualCount} incidents (might be limited by data available)`);
        }
        
        return actualCount;
      } else {
        logger.error(`❌ FAILED: Could not fetch incidents`);
        return 0;
      }
    } catch (error) {
      logger.error(`❌ ERROR:`, error);
      return 0;
    }
  }
  
  // Test verschillende batch sizes
  const testCases = [
    { size: 50, desc: "Small batch (50)" },
    { size: 100, desc: "Medium batch (100)" }, 
    { size: 200, desc: "Large batch (200)" },
    { size: 500, desc: "XL batch (500)" }
  ];
  
  console.log(`\n🧪 Testing different batch sizes:`);
  
  const results = [];
  for (const testCase of testCases) {
    const count = await testFetchIncidentData(testCase.size, testCase.desc);
    results.push({ requested: testCase.size, actual: count });
  }
  
  console.log(`\n📊 Batch Size Results:`);
  results.forEach(r => {
    const success = r.actual > 10 && r.actual >= Math.min(r.requested, 100); // At least more than default 10
    console.log(`  ${r.requested} requested → ${r.actual} actual ${success ? '✅' : '❌'}`);
  });
  
  // Test streaming batches
  console.log(`\n🌊 Testing streaming batch functionality:`);
  const totalSample = 300;
  const batchSize = 100;
  const totalBatches = Math.ceil(totalSample / batchSize);
  
  let streamingTotal = 0;
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const offset = batchNum * batchSize;
    const currentBatchSize = Math.min(batchSize, totalSample - offset);
    
    logger.info(`Streaming batch ${batchNum + 1}/${totalBatches}: offset=${offset}, size=${currentBatchSize}`);
    
    try {
      const response = await client.searchRecordsWithOffset(
        'incident', 
        'sys_created_onONLast 6 months^categoryISNOTEMPTY^ORDERBYDESCsys_created_on',
        currentBatchSize, 
        offset
      );
      
      if (response.success) {
        const batchActual = response.data?.result?.length || 0;
        streamingTotal += batchActual;
        logger.info(`  ✅ Batch got ${batchActual}/${currentBatchSize} incidents`);
        
        if (batchActual < currentBatchSize) {
          logger.info(`  📋 End of data reached`);
          break;
        }
      }
    } catch (error) {
      logger.error(`  ❌ Streaming batch ${batchNum + 1} failed:`, error);
    }
  }
  
  console.log(`\n🎯 Streaming Results:`);
  console.log(`  Total streamed: ${streamingTotal}/${totalSample}`);
  console.log(`  Batch functionality: ${streamingTotal > 10 ? '✅ Working' : '❌ Still limited to 10'}`);
}

testMLBatchFix().catch(console.error);
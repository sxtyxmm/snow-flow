import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

// Test ML batch functionality met realistische sizes
async function testMLBatch() {
  const logger = new Logger('MLBatchTest');
  const client = new ServiceNowClient();
  
  console.log('🔥 Testing ML batch functionality with realistic batch sizes...');
  
  // ML training parameters (zoals ML daadwerkelijk gebruikt)
  const sample_size = 1000; // Totaal aantal incidenten
  const batch_size = 200;   // Per batch
  const intelligent_selection = true;
  const focus_categories: string[] = [];
  const query = '';
  
  // Build intelligent query (zoals ML doet)
  let finalQuery = '';
  if (intelligent_selection && !query) {
    const queries = [];
    queries.push('sys_created_onONLast 6 months');
    queries.push('(priority=1^ORpriority=2^ORpriority=3^ORpriority=4)');
    queries.push('(active=true^ORactive=false)');
    queries.push('categoryISNOTEMPTY');
    finalQuery = queries.join('^') + '^ORDERBYDESCsys_created_on';
  }
  
  logger.info(`Testing ML batch training:`);
  logger.info(`- Sample size: ${sample_size}`);
  logger.info(`- Batch size: ${batch_size}`);
  logger.info(`- Query: ${finalQuery}`);
  
  // Test batch processing zoals ML training doet
  const totalBatches = Math.ceil(sample_size / batch_size);
  let totalProcessed = 0;
  
  console.log(`\n📦 Processing ${totalBatches} batches...`);
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const offset = batchNum * batch_size;
    const currentBatchSize = Math.min(batch_size, sample_size - offset);
    
    logger.info(`\n--- Batch ${batchNum + 1}/${totalBatches} ---`);
    logger.info(`Offset: ${offset}, Size: ${currentBatchSize}`);
    
    try {
      // Test searchRecordsWithOffset (zoals ML streaming doet)
      const start = Date.now();
      const response = await client.searchRecordsWithOffset('incident', finalQuery, currentBatchSize, offset);
      const duration = Date.now() - start;
      
      if (response.success && response.data?.result) {
        const actualCount = response.data.result.length;
        totalProcessed += actualCount;
        
        logger.info(`✅ Success: ${actualCount}/${currentBatchSize} incidents (${duration}ms)`);
        
        // Sample categories for this batch
        const categories = new Set(response.data.result.slice(0, 5).map((inc: any) => inc.category || 'none'));
        logger.info(`Categories sample: ${Array.from(categories).join(', ')}`);
        
        // If we got fewer than requested, we've reached the end
        if (actualCount < currentBatchSize) {
          logger.info(`📋 Reached end of data (got ${actualCount} < ${currentBatchSize})`);
          break;
        }
      } else {
        logger.error(`❌ Batch ${batchNum + 1} failed`);
        break;
      }
      
    } catch (error) {
      logger.error(`❌ Batch ${batchNum + 1} error:`, error);
      break;
    }
  }
  
  console.log(`\n🎯 ML Batch Results:`);
  console.log(`- Total processed: ${totalProcessed}/${sample_size} incidents`);
  console.log(`- Success rate: ${((totalProcessed / sample_size) * 100).toFixed(1)}%`);
  console.log(`- Ready for ML training: ${totalProcessed >= 100 ? '✅ Yes' : '❌ No (need 100+ incidents)'}`);
  
  // Test normal single batch (non-streaming)
  console.log(`\n🔄 Testing single batch (non-streaming mode):`);
  try {
    const singleBatch = await client.searchRecords('incident', finalQuery, batch_size);
    if (singleBatch.success) {
      logger.info(`✅ Single batch: ${singleBatch.data?.result?.length || 0}/${batch_size} incidents`);
    } else {
      logger.error(`❌ Single batch failed`);
    }
  } catch (error) {
    logger.error(`❌ Single batch error:`, error);
  }
}

testMLBatch().catch(console.error);
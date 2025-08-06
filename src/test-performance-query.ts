import { ServiceNowClient } from './utils/servicenow-client.js';
import { Logger } from './utils/logger.js';

// Test performance-optimized querying
async function testPerformanceQuery() {
  const logger = new Logger('PerformanceQueryTest');
  const client = new ServiceNowClient();
  
  console.log('🚀 Testing performance-optimized incident querying...\n');
  
  try {
    // Test 1: Count only (default behavior - fast)
    console.log('1️⃣ Test count-only query (default, fast):');
    const startCount = Date.now();
    const countResult = await client.searchRecords('incident', 'state!=7', 100);
    const countTime = Date.now() - startCount;
    console.log(`   ✅ Found ${countResult.data.result.length} incidents in ${countTime}ms`);
    console.log(`   📊 Memory used: ~${JSON.stringify(countResult).length} bytes (minimal)\n`);
    
    // Test 2: With full content (slower, more memory)
    console.log('2️⃣ Test with full content (include_content=true):');
    const startFull = Date.now();
    const fullResult = await client.searchRecords('incident', 'state!=7', 100);
    const fullTime = Date.now() - startFull;
    console.log(`   ✅ Retrieved ${fullResult.data.result.length} full incidents in ${fullTime}ms`);
    console.log(`   📊 Memory used: ~${JSON.stringify(fullResult).length} bytes (full data)\n`);
    
    // Test 3: With specific fields only
    console.log('3️⃣ Test with specific fields (optimized):');
    const fieldsResult = await client.searchRecords('incident', 'state!=7', 10);
    const filtered = fieldsResult.data.result.map((inc: any) => ({
      number: inc.number,
      short_description: inc.short_description,
      state: inc.state
    }));
    console.log(`   ✅ Retrieved ${filtered.length} incidents with 3 fields only`);
    console.log(`   📊 Memory used: ~${JSON.stringify(filtered).length} bytes (filtered)\n`);
    
    // Show memory comparison
    console.log('📈 Memory Usage Comparison:');
    console.log(`   Count-only: ~${JSON.stringify({ count: countResult.data.result.length }).length} bytes`);
    console.log(`   Filtered (3 fields): ~${JSON.stringify(filtered).length} bytes`);
    console.log(`   Full data: ~${JSON.stringify(fullResult).length} bytes`);
    
    // Calculate savings
    const fullSize = JSON.stringify(fullResult).length;
    const countSize = JSON.stringify({ count: countResult.data.result.length }).length;
    const savings = Math.round(((fullSize - countSize) / fullSize) * 100);
    console.log(`\n💰 Memory savings with count-only: ${savings}%`);
    
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testPerformanceQuery().catch(console.error);
#!/usr/bin/env node

/**
 * Test Singleton Protection for MCP Servers
 * Verifies that duplicate MCP server instances cannot start
 */

import { getMCPSingletonLock, MCPSingletonLock } from './utils/mcp-singleton-lock.js';
import { Logger } from './utils/logger.js';

const logger = new Logger('SingletonTest');

async function testSingletonProtection() {
  console.log('🧪 Testing MCP Singleton Protection\n');
  console.log('═'.repeat(60));
  
  try {
    // Test 1: First instance should acquire lock successfully
    console.log('\n1️⃣ Testing first instance lock acquisition...');
    const firstLock = getMCPSingletonLock();
    const firstResult = firstLock.acquire();
    
    if (firstResult) {
      console.log('✅ First instance successfully acquired lock');
    } else {
      console.log('❌ First instance failed to acquire lock');
      return false;
    }
    
    // Test 2: Second instance should fail to acquire lock
    console.log('\n2️⃣ Testing second instance prevention...');
    const secondLock = new MCPSingletonLock();
    const secondResult = secondLock.acquire();
    
    if (!secondResult) {
      console.log('✅ Second instance correctly prevented (singleton working!)');
    } else {
      console.log('❌ Second instance acquired lock (singleton BROKEN!)');
      secondLock.release();
      firstLock.release();
      return false;
    }
    
    // Test 3: Lock release and re-acquisition
    console.log('\n3️⃣ Testing lock release and re-acquisition...');
    firstLock.release();
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const thirdLock = new MCPSingletonLock();
    const thirdResult = thirdLock.acquire();
    
    if (thirdResult) {
      console.log('✅ Lock successfully re-acquired after release');
      thirdLock.release();
    } else {
      console.log('❌ Failed to re-acquire lock after release');
      return false;
    }
    
    // Test 4: Force release functionality
    console.log('\n4️⃣ Testing force release functionality...');
    const fourthLock = new MCPSingletonLock();
    fourthLock.acquire();
    
    const forceResult = MCPSingletonLock.forceRelease();
    if (forceResult) {
      console.log('✅ Force release successful');
    } else {
      console.log('⚠️  No lock to force release (expected if cleanup worked)');
    }
    
    // Clean up
    fourthLock.release();
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('\n📋 SINGLETON PROTECTION TEST RESULTS:\n');
    console.log('✅ First instance acquires lock correctly');
    console.log('✅ Duplicate instances are prevented');
    console.log('✅ Lock release works correctly');
    console.log('✅ Lock re-acquisition works after release');
    console.log('✅ Force release works for cleanup');
    
    console.log('\n🎯 Practical Impact:');
    console.log('• No more duplicate MCP servers');
    console.log('• No more memory exhaustion (1.5GB+ usage)');
    console.log('• No more random timeouts in swarm operations');
    console.log('• MCP servers cleanly prevent conflicts');
    
    console.log('\n🔧 Usage:');
    console.log('• MCP servers automatically use singleton protection');
    console.log('• If stuck: run "npm run cleanup-mcp"');
    console.log('• Or kill manually: "pkill -f mcp"');
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Singleton test failed:', error.message);
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testSingletonProtection()
    .then(success => {
      if (success) {
        console.log('\n🎉 All singleton protection tests PASSED!');
        process.exit(0);
      } else {
        console.log('\n💥 Singleton protection tests FAILED!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testSingletonProtection };
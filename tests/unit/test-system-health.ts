/**
 * Test script for real system health monitoring
 */

import { SystemHealth } from './system-health';
import { MemorySystem } from '../memory/memory-system';
import { MCPServerManager } from '../utils/mcp-server-manager';

async function testSystemHealth() {
  console.log('🏥 Testing System Health Monitoring...\n');

  // Initialize dependencies
  const memory = new MemorySystem({ dbPath: ':memory:' });
  await memory.initialize();

  const mcpManager = new MCPServerManager();

  const systemHealth = new SystemHealth({
    memory,
    mcpManager,
    config: {
      checks: {
        memory: true,
        mcp: true,
        servicenow: false, // Skip for test
        queen: true
      },
      thresholds: {
        responseTime: 1000,
        memoryUsage: 0.9,
        cpuUsage: 0.8,
        queueSize: 100,
        errorRate: 0.1
      }
    }
  });

  await systemHealth.initialize();

  console.log('📊 Performing health check...\n');
  const status = await systemHealth.performHealthCheck();

  // Display results
  console.log('Overall Status:', status.status);
  console.log('Healthy:', status.healthy);
  console.log('\n🔍 Component Status:');
  
  Object.entries(status.components).forEach(([name, result]) => {
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Message: ${result.message}`);
    if (result.responseTime) {
      console.log(`  Response Time: ${result.responseTime}ms`);
    }
    if (result.details) {
      console.log(`  Details:`, JSON.stringify(result.details, null, 2));
    }
  });

  console.log('\n📈 System Metrics:');
  console.log(`  Uptime: ${(status.metrics.uptime / 1000).toFixed(1)}s`);
  console.log(`  Total Checks: ${status.metrics.totalChecks}`);
  console.log(`  Failed Checks: ${status.metrics.failedChecks}`);
  console.log(`  Avg Response Time: ${status.metrics.avgResponseTime.toFixed(1)}ms`);

  console.log('\n💻 System Resources:');
  const resources = status.metrics.systemResources;
  console.log(`  CPU Usage: ${resources.cpuUsage.toFixed(1)}%`);
  console.log(`  Memory: ${resources.memoryUsage.toFixed(0)}MB / ${resources.memoryTotal.toFixed(0)}MB (${((resources.memoryUsage / resources.memoryTotal) * 100).toFixed(1)}%)`);
  console.log(`  Disk: ${resources.diskUsage.toFixed(1)}% of ${resources.diskTotal.toFixed(1)}GB`);
  console.log(`  Load Average: ${resources.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
  console.log(`  Process Count: ${resources.processCount}`);

  // Test continuous monitoring
  console.log('\n🔄 Starting continuous monitoring (5 second interval)...');
  await systemHealth.startMonitoring(5000);

  // Monitor for 15 seconds
  setTimeout(async () => {
    console.log('\n⏹️  Stopping monitoring...');
    await systemHealth.stopMonitoring();
    
    console.log('\n📊 Final health check:');
    const finalStatus = await systemHealth.getFullStatus();
    console.log(`Status: ${finalStatus.status}`);
    
    // Get history
    const history = await systemHealth.getHealthHistory(10);
    console.log(`\n📜 Recent history (${history.length} checks):`);
    history.forEach(check => {
      console.log(`  ${check.component}: ${check.status} - ${check.message}`);
    });
    
    process.exit(0);
  }, 15000);
}

// Run the test
testSystemHealth().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
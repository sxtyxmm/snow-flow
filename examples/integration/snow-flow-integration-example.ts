/**
 * Snow-Flow Integration Example
 * Demonstrates the complete hive-mind architecture in action
 */

import { 
  snowFlowSystem,
  SnowFlowSystem,
  SwarmOptions,
  SwarmResult,
  SystemStatus 
} from '../index';
import { Logger } from '../utils/logger';
import chalk from 'chalk';

const logger = new Logger('SnowFlowExample');

/**
 * Example 1: Simple Widget Creation
 */
async function createIncidentWidget() {
  console.log(chalk.cyan('\n🚀 Example 1: Creating Incident Management Widget\n'));
  
  try {
    // Initialize the system
    await snowFlowSystem.initialize();
    
    // Execute swarm with default options
    const result = await snowFlowSystem.executeSwarm(
      'Create an incident management widget with real-time charts showing priority distribution and status updates',
      {
        strategy: 'development',
        mode: 'hierarchical',
        maxAgents: 5,
        autoPermissions: false,
        smartDiscovery: true,
        liveTesting: true,
        autoDeploy: true,
        autoRollback: true,
        sharedMemory: true,
        progressMonitoring: true
      }
    );
    
    console.log(chalk.green('✅ Widget created successfully!'));
    console.log(chalk.gray('Session ID:'), result.sessionId);
    console.log(chalk.gray('Artifacts created:'), result.artifacts.length);
    console.log(chalk.gray('Summary:'), result.summary);
    
    // Display metrics
    console.log(chalk.yellow('\n📊 Performance Metrics:'));
    console.log(JSON.stringify(result.metrics, null, 2));
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }
}

/**
 * Example 2: Complex Flow Development
 */
async function createApprovalFlow() {
  console.log(chalk.cyan('\n🚀 Example 2: Creating Equipment Approval Flow\n'));
  
  try {
    // Execute swarm for flow creation
    const result = await snowFlowSystem.executeSwarm(
      'Create an approval flow for equipment requests over $1000 with manager and finance approval steps, email notifications, and catalog item integration',
      {
        strategy: 'development',
        mode: 'distributed',
        parallel: true,
        monitor: true
      }
    );
    
    console.log(chalk.green('✅ Flow created successfully!'));
    
    // Get session details
    const session = snowFlowSystem.getSession(result.sessionId);
    if (session) {
      console.log(chalk.yellow('\n👥 Agents Used:'));
      for (const [agentId, agent] of session.activeAgents) {
        console.log(`  - ${agent.type}: ${agent.status} (${agent.progress}% complete)`);
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }
}

/**
 * Example 3: System Health Monitoring
 */
async function monitorSystemHealth() {
  console.log(chalk.cyan('\n🏥 Example 3: System Health Check\n'));
  
  try {
    const status = await snowFlowSystem.getStatus();
    
    console.log(chalk.blue('System Status:'), status.status);
    console.log(chalk.blue('Initialized:'), status.initialized);
    
    if (status.components) {
      console.log(chalk.yellow('\n📦 Component Health:'));
      for (const [component, health] of Object.entries(status.components)) {
        const statusIcon = health.status === 'healthy' ? '✅' : 
                          health.status === 'degraded' ? '⚠️' : '❌';
        console.log(`  ${statusIcon} ${component}: ${health.status} - ${health.message}`);
      }
    }
    
    if (status.metrics) {
      console.log(chalk.yellow('\n📈 System Metrics:'));
      console.log(`  - Total Sessions: ${status.metrics.totalSessions}`);
      console.log(`  - Success Rate: ${status.metrics.successRate.toFixed(2)}%`);
      console.log(`  - Avg Execution Time: ${(status.metrics.averageExecutionTime / 1000).toFixed(2)}s`);
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }
}

/**
 * Example 4: Memory System Usage
 */
async function demonstrateMemorySystem() {
  console.log(chalk.cyan('\n💾 Example 4: Memory System Demonstration\n'));
  
  try {
    const memory = snowFlowSystem.getMemory();
    if (!memory) {
      console.log(chalk.red('Memory system not available'));
      return;
    }
    
    // Store some data
    await memory.store('example_widget_config', {
      name: 'incident_dashboard',
      type: 'widget',
      features: ['charts', 'filters', 'real-time'],
      createdBy: 'example_agent'
    });
    
    console.log(chalk.green('✅ Data stored in memory'));
    
    // Retrieve data
    const config = await memory.get('example_widget_config');
    console.log(chalk.blue('Retrieved data:'), JSON.stringify(config, null, 2));
    
    // Get memory stats
    const stats = await memory.getDatabaseStats();
    console.log(chalk.yellow('\n📊 Memory Statistics:'));
    console.log(`  - Database Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Table Count: ${stats.tableCount}`);
    console.log(`  - Row Counts:`, stats.rowCounts);
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }
}

/**
 * Example 5: Error Recovery
 */
async function demonstrateErrorRecovery() {
  console.log(chalk.cyan('\n🛡️ Example 5: Error Recovery Demonstration\n'));
  
  try {
    // Simulate a complex operation that might fail
    const result = await snowFlowSystem.executeSwarm(
      'Deploy a widget to a non-existent ServiceNow instance to test error recovery',
      {
        strategy: 'development',
        autoRollback: true
      }
    );
    
    console.log(chalk.green('Operation handled with recovery strategies'));
    
  } catch (error) {
    console.log(chalk.yellow('⚠️ Expected error occurred, recovery attempted'));
    console.error(chalk.gray('Error details:'), error);
  }
}

/**
 * Example 6: Performance Report
 */
async function generatePerformanceReport() {
  console.log(chalk.cyan('\n📊 Example 6: Performance Report Generation\n'));
  
  try {
    // First, run some operations to generate metrics
    await snowFlowSystem.executeSwarm('Create test widget', { strategy: 'development' });
    
    // Wait a bit for metrics to be recorded
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get performance metrics (this would normally use the performance tracker)
    const sessions = snowFlowSystem.listSessions();
    
    console.log(chalk.yellow('📈 Performance Summary:'));
    console.log(`  - Total Sessions: ${sessions.length}`);
    console.log(`  - Active Sessions: ${sessions.filter(s => s.status === 'active').length}`);
    console.log(`  - Completed Sessions: ${sessions.filter(s => s.status === 'completed').length}`);
    console.log(`  - Failed Sessions: ${sessions.filter(s => s.status === 'failed').length}`);
    
  } catch (error) {
    console.error(chalk.red('❌ Error:'), error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.bold.magenta('\n🎯 Snow-Flow Integration Examples\n'));
  console.log(chalk.gray('Demonstrating the complete hive-mind architecture'));
  console.log(chalk.gray('=' . repeat(50)));
  
  try {
    // Initialize the system once
    console.log(chalk.blue('\n🔧 Initializing Snow-Flow System...'));
    await snowFlowSystem.initialize();
    console.log(chalk.green('✅ System initialized successfully!'));
    
    // Run examples
    await createIncidentWidget();
    await createApprovalFlow();
    await monitorSystemHealth();
    await demonstrateMemorySystem();
    await demonstrateErrorRecovery();
    await generatePerformanceReport();
    
    // Shutdown
    console.log(chalk.blue('\n🔧 Shutting down Snow-Flow System...'));
    await snowFlowSystem.shutdown();
    console.log(chalk.green('✅ System shutdown complete!'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Fatal error:'), error);
    process.exit(1);
  }
}

// Run the examples
if (require.main === module) {
  main().catch(console.error);
}

// Export for testing
export { 
  createIncidentWidget,
  createApprovalFlow,
  monitorSystemHealth,
  demonstrateMemorySystem,
  demonstrateErrorRecovery,
  generatePerformanceReport
};
/**
 * Snow-Flow CLI Integration
 * Integrates the hive-mind system with the CLI commands
 */

import { Command } from 'commander';
import { snowFlowSystem, SwarmOptions } from '../snow-flow-system';
import { snowFlowConfig } from '../config/snow-flow-config';
import { Logger } from '../utils/logger';
import chalk from 'chalk';
import ora from 'ora';

const logger = new Logger('SnowFlowCLI');

/**
 * Initialize the swarm command with the integrated system
 */
export function createSwarmCommand(program: Command): void {
  program
    .command('swarm <objective>')
    .description('🚀 Execute multi-agent swarm coordination with REVOLUTIONARY Parallel Agent Engine (v1.1.90) - automatically spawns specialized agent teams working simultaneously with 2-5x performance improvement')
    .option('--strategy <strategy>', 'Swarm strategy', 'development')
    .option('--mode <mode>', 'Coordination mode', 'hierarchical')
    .option('--max-agents <number>', 'Maximum number of agents', '10')
    .option('--parallel', 'Enable parallel execution (auto-detected by default in v1.1.90)')
    .option('--monitor', 'Real-time monitoring')
    .option('--no-auto-permissions', 'Disable automatic permission escalation')
    .option('--no-smart-discovery', 'Disable smart artifact discovery')
    .option('--no-live-testing', 'Disable live testing')
    .option('--no-auto-deploy', 'Disable automatic deployment')
    .option('--no-auto-rollback', 'Disable automatic rollback')
    .option('--no-shared-memory', 'Disable shared memory')
    .option('--no-progress-monitoring', 'Disable progress monitoring')
    .action(async (objective: string, options: any) => {
      const spinner = ora('Initializing Snow-Flow System...').start();
      
      try {
        // Initialize system
        await snowFlowSystem.initialize();
        spinner.succeed('System initialized');
        
        // Parse options
        const swarmOptions: SwarmOptions = {
          strategy: options.strategy,
          mode: options.mode,
          maxAgents: parseInt(options.maxAgents) || 10,
          parallel: options.parallel,
          monitor: options.monitor,
          autoPermissions: options.autoPermissions,
          smartDiscovery: options.smartDiscovery,
          liveTesting: options.liveTesting,
          autoDeploy: options.autoDeploy,
          autoRollback: options.autoRollback,
          sharedMemory: options.sharedMemory,
          progressMonitoring: options.progressMonitoring
        };
        
        console.log(chalk.cyan('\n🐝 Starting Swarm Execution'));
        console.log(chalk.yellow('🚀 NEW v1.1.93: Revolutionary Parallel Agent Spawning - 6+ specialized agents for 2.8x faster development!'));
        console.log(chalk.gray('Objective:'), objective);
        console.log(chalk.gray('Strategy:'), swarmOptions.strategy);
        console.log(chalk.gray('Mode:'), swarmOptions.mode);
        
        // Set up progress monitoring
        if (swarmOptions.progressMonitoring) {
          snowFlowSystem.on('swarm:progress', (data) => {
            const { sessionId, progress } = data;
            console.log(chalk.blue(`[${sessionId}]`), `Progress: ${progress.completed}/${progress.total} tasks`);
          });
          
          snowFlowSystem.on('agent:spawned', (agent) => {
            console.log(chalk.green('✅ Agent spawned:'), agent.type);
            if (agent.specialization) {
              console.log(chalk.blue('   🎯 Specialization:'), agent.specialization);
            }
          });
          
          snowFlowSystem.on('agent:completed', (agent) => {
            console.log(chalk.green('✅ Agent completed:'), agent.type);
          });

          snowFlowSystem.on('parallel:detected', (data) => {
            console.log(chalk.magenta('🚀 Parallel opportunities detected:'), data.opportunities.length);
            data.opportunities.forEach((opp, index) => {
              console.log(chalk.cyan(`   ${index + 1}. ${opp.type}: ${opp.agentCount} agents, estimated ${opp.estimatedSpeedup}x speedup`));
            });
          });
        }
        
        // Execute swarm
        const startTime = Date.now();
        const result = await snowFlowSystem.executeSwarm(objective, swarmOptions);
        const duration = Date.now() - startTime;
        
        // Display results
        console.log(chalk.green('\n✅ Swarm execution completed successfully!'));
        console.log(chalk.gray('Session ID:'), result.sessionId);
        console.log(chalk.gray('Duration:'), `${(duration / 1000).toFixed(2)}s`);
        console.log(chalk.gray('Artifacts created:'), result.artifacts.length);
        
        if (result.artifacts.length > 0) {
          console.log(chalk.yellow('\n📦 Created Artifacts:'));
          result.artifacts.forEach((artifact, index) => {
            console.log(`  ${index + 1}. ${artifact.type}: ${artifact.name} (${artifact.sys_id})`);
          });
        }
        
        console.log(chalk.cyan('\n📝 Summary:'));
        console.log(result.summary);
        
        // Show metrics if available
        if (result.metrics && Object.keys(result.metrics).length > 0) {
          console.log(chalk.yellow('\n📊 Performance Metrics:'));
          console.log(JSON.stringify(result.metrics, null, 2));
        }
        
      } catch (error) {
        spinner.fail('Swarm execution failed');
        logger.error('Swarm execution error:', error);
        console.error(chalk.red('\n❌ Error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Create status command
 */
export function createStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show comprehensive system status')
    .action(async () => {
      const spinner = ora('Checking system status...').start();
      
      try {
        const status = await snowFlowSystem.getStatus();
        spinner.stop();
        
        // Display system status
        console.log(chalk.bold('\n🔍 Snow-Flow System Status\n'));
        
        const statusIcon = status.status === 'healthy' ? '✅' : 
                          status.status === 'degraded' ? '⚠️' : '❌';
        console.log(`${statusIcon} Overall Status: ${chalk.bold(status.status.toUpperCase())}`);
        console.log(chalk.gray('Initialized:'), status.initialized ? 'Yes' : 'No');
        
        if (status.components) {
          console.log(chalk.yellow('\n📦 Component Health:'));
          for (const [component, health] of Object.entries(status.components)) {
            const icon = health.status === 'healthy' ? '✅' : 
                        health.status === 'degraded' ? '⚠️' : '❌';
            console.log(`  ${icon} ${component}: ${health.status}`);
            if (health.message) {
              console.log(chalk.gray(`     ${health.message}`));
            }
          }
        }
        
        if (status.activeSessions !== undefined) {
          console.log(chalk.yellow('\n📊 Activity:'));
          console.log(`  - Active Sessions: ${status.activeSessions}`);
        }
        
        if (status.metrics) {
          console.log(chalk.yellow('\n📈 System Metrics:'));
          console.log(`  - Total Sessions: ${status.metrics.totalSessions}`);
          console.log(`  - Success Rate: ${status.metrics.successRate.toFixed(2)}%`);
          console.log(`  - Avg Execution Time: ${(status.metrics.averageExecutionTime / 1000).toFixed(2)}s`);
        }
        
      } catch (error) {
        spinner.fail('Failed to get system status');
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Create monitor command
 */
export function createMonitorCommand(program: Command): void {
  program
    .command('monitor')
    .description('Real-time system monitoring dashboard')
    .option('--interval <ms>', 'Update interval in milliseconds', '5000')
    .action(async (options) => {
      console.log(chalk.bold.cyan('\n📊 Snow-Flow Real-time Monitor\n'));
      console.log(chalk.gray('Press Ctrl+C to exit'));
      console.log(chalk.gray('=' . repeat(50)));
      
      try {
        // Initialize system if needed
        const status = snowFlowSystem.getStatus();
        if (!(status as any).initialized) {
          await snowFlowSystem.initialize();
        }
        
        // Set up event listeners
        snowFlowSystem.on('swarm:progress', (data) => {
          console.log(chalk.blue(`\n[${new Date().toISOString()}] Swarm Progress`));
          console.log(`  Session: ${data.sessionId}`);
          console.log(`  Progress: ${data.progress.completed}/${data.progress.total}`);
        });
        
        snowFlowSystem.on('agent:spawned', (agent) => {
          console.log(chalk.green(`\n[${new Date().toISOString()}] Agent Spawned`));
          console.log(`  Type: ${agent.type}`);
          console.log(`  ID: ${agent.id}`);
        });
        
        snowFlowSystem.on('performance:metric', (metric) => {
          console.log(chalk.yellow(`\n[${new Date().toISOString()}] Performance Metric`));
          console.log(`  Operation: ${metric.operation}`);
          console.log(`  Duration: ${metric.duration}ms`);
          console.log(`  Success: ${metric.success}`);
        });
        
        snowFlowSystem.on('health:alert', (alert) => {
          console.log(chalk.red(`\n[${new Date().toISOString()}] Health Alert`));
          console.log(`  Type: ${alert.type}`);
          console.log(`  Severity: ${alert.severity}`);
          console.log(`  Message: ${alert.message}`);
        });
        
        // Periodic status update
        const updateInterval = parseInt(options.interval) || 5000;
        setInterval(async () => {
          const status = await snowFlowSystem.getStatus();
          const sessions = snowFlowSystem.listSessions({ status: 'active' });
          
          console.log(chalk.dim(`\n[${new Date().toISOString()}] Status Update`));
          console.log(chalk.dim(`  System: ${status.status}`));
          console.log(chalk.dim(`  Active Sessions: ${sessions.length}`));
          
          if (sessions.length > 0) {
            sessions.forEach(session => {
              console.log(chalk.dim(`    - ${session.id}: ${session.completedTasks}/${session.totalTasks} tasks`));
            });
          }
        }, updateInterval);
        
        // Keep process running
        process.stdin.resume();
        
      } catch (error) {
        console.error(chalk.red('Monitor error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Create memory management commands
 */
export function createMemoryCommands(program: Command): void {
  const memory = program
    .command('memory')
    .description('Manage persistent memory system');
  
  memory
    .command('store <key> <value>')
    .description('Store data in memory')
    .option('--ttl <ms>', 'Time to live in milliseconds')
    .action(async (key: string, value: string, options) => {
      try {
        await snowFlowSystem.initialize();
        const memorySystem = snowFlowSystem.getMemory();
        
        if (!memorySystem) {
          throw new Error('Memory system not available');
        }
        
        // Parse value as JSON if possible
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
        
        await memorySystem.store(key, parsedValue, options.ttl ? parseInt(options.ttl) : undefined);
        console.log(chalk.green('✅ Data stored successfully'));
        
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
  
  memory
    .command('get <key>')
    .description('Retrieve data from memory')
    .action(async (key: string) => {
      try {
        await snowFlowSystem.initialize();
        const memorySystem = snowFlowSystem.getMemory();
        
        if (!memorySystem) {
          throw new Error('Memory system not available');
        }
        
        const value = await memorySystem.get(key);
        
        if (value === null) {
          console.log(chalk.yellow('Key not found or expired'));
        } else {
          console.log(chalk.green('Value:'));
          console.log(JSON.stringify(value, null, 2));
        }
        
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
  
  memory
    .command('stats')
    .description('Show memory system statistics')
    .action(async () => {
      try {
        await snowFlowSystem.initialize();
        const memorySystem = snowFlowSystem.getMemory();
        
        if (!memorySystem) {
          throw new Error('Memory system not available');
        }
        
        const dbStats = await memorySystem.getDatabaseStats();
        const cacheStats = await memorySystem.getCacheStats();
        
        console.log(chalk.bold('\n💾 Memory System Statistics\n'));
        
        console.log(chalk.yellow('Database:'));
        console.log(`  Size: ${(dbStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Tables: ${dbStats.tableCount}`);
        console.log(`  Row Counts:`);
        for (const [table, count] of Object.entries(dbStats.rowCounts)) {
          console.log(`    - ${table}: ${count} rows`);
        }
        
        console.log(chalk.yellow('\nCache:'));
        console.log(`  Size: ${cacheStats.size} entries`);
        console.log(`  Hits: ${cacheStats.hits}`);
        console.log(`  Misses: ${cacheStats.misses}`);
        console.log(`  Hit Rate: ${cacheStats.hits + cacheStats.misses > 0 ? 
          ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) : 0}%`);
        console.log(`  Evictions: ${cacheStats.evictions}`);
        
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Create configuration commands
 */
export function createConfigCommands(program: Command): void {
  const config = program
    .command('config')
    .description('Configuration management');
  
  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const currentConfig = snowFlowConfig.get();
      console.log(chalk.bold('\n⚙️ Snow-Flow Configuration\n'));
      console.log(JSON.stringify(currentConfig, null, 2));
    });
  
  config
    .command('get <path>')
    .description('Get a specific configuration value')
    .action((path: string) => {
      const value = snowFlowConfig.getValue(path);
      if (value === undefined) {
        console.log(chalk.yellow('Configuration key not found'));
      } else {
        console.log(chalk.green('Value:'), JSON.stringify(value, null, 2));
      }
    });
  
  config
    .command('set <path> <value>')
    .description('Set a configuration value')
    .action((path: string, value: string) => {
      try {
        // Parse value as JSON if possible
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value;
        }
        
        snowFlowConfig.setValue(path, parsedValue);
        console.log(chalk.green('✅ Configuration updated'));
        
      } catch (error) {
        console.error(chalk.red('Error:'), (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Integrate all commands with the main program
 */
export function integrateSnowFlowCommands(program: Command): void {
  // Add all integrated commands
  createSwarmCommand(program);
  createStatusCommand(program);
  createMonitorCommand(program);
  createMemoryCommands(program);
  createConfigCommands(program);
  
  // Add shutdown handler
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\nShutting down Snow-Flow System...'));
    try {
      await snowFlowSystem.shutdown();
      console.log(chalk.green('✅ Shutdown complete'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('Shutdown error:'), error);
      process.exit(1);
    }
  });
}
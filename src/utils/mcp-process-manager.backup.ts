/**
 * MCP Process Manager
 * Prevents excessive MCP server spawning and manages resource limits
 */

import { execSync } from 'child_process';
import { Logger } from './logger.js';
import { getMCPSingletonLock } from './mcp-singleton-lock.js';

const logger = new Logger('MCPProcessManager');

export class MCPProcessManager {
  private static instance: MCPProcessManager;
  private readonly MAX_MCP_SERVERS = parseInt(process.env.SNOW_MAX_MCP_SERVERS || '10');
  private readonly MAX_MEMORY_MB = parseInt(process.env.SNOW_MCP_MEMORY_LIMIT || '1500');
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private cleanupTimer?: NodeJS.Timeout;
  
  private constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }
  
  static getInstance(): MCPProcessManager {
    if (!MCPProcessManager.instance) {
      MCPProcessManager.instance = new MCPProcessManager();
    }
    return MCPProcessManager.instance;
  }
  
  /**
   * Check if we can spawn a new MCP server
   */
  canSpawnServer(): boolean {
    const status = this.getSystemStatus();
    
    if (status.processCount >= this.MAX_MCP_SERVERS) {
      logger.warn(`❌ Cannot spawn: Already at max servers (${status.processCount}/${this.MAX_MCP_SERVERS})`);
      return false;
    }
    
    if (status.memoryUsageMB > this.MAX_MEMORY_MB) {
      logger.warn(`❌ Cannot spawn: Memory limit exceeded (${status.memoryUsageMB}MB > ${this.MAX_MEMORY_MB}MB)`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get current MCP system status
   */
  getSystemStatus(): {
    processCount: number;
    memoryUsageMB: number;
    processes: Array<{pid: number; memory: number; name: string}>;
  } {
    try {
      // Count MCP processes
      const psOutput = execSync('ps aux | grep -E "mcp|servicenow.*mcp" | grep -v grep', {
        encoding: 'utf8'
      }).trim();
      
      if (!psOutput) {
        return {
          processCount: 0,
          memoryUsageMB: 0,
          processes: []
        };
      }
      
      const lines = psOutput.split('\n');
      const processes: Array<{pid: number; memory: number; name: string}> = [];
      let totalMemory = 0;
      
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length > 10) {
          const pid = parseInt(parts[1]);
          const memory = Math.round(parseInt(parts[5]) / 1024); // Convert KB to MB
          const name = parts.slice(10).join(' ');
          
          processes.push({ pid, memory, name });
          totalMemory += memory;
        }
      }
      
      return {
        processCount: processes.length,
        memoryUsageMB: totalMemory,
        processes
      };
    } catch (error) {
      // No MCP processes found
      return {
        processCount: 0,
        memoryUsageMB: 0,
        processes: []
      };
    }
  }
  
  /**
   * Kill duplicate MCP servers (keep only the newest)
   */
  killDuplicates(): void {
    const status = this.getSystemStatus();
    
    // Group processes by server type
    const serverGroups = new Map<string, Array<{pid: number; memory: number}>>();
    
    for (const proc of status.processes) {
      // Extract server type from process name
      const match = proc.name.match(/servicenow-([^-]+)-mcp\.js/);
      if (match) {
        const serverType = match[1];
        if (!serverGroups.has(serverType)) {
          serverGroups.set(serverType, []);
        }
        serverGroups.get(serverType)!.push({
          pid: proc.pid,
          memory: proc.memory
        });
      }
    }
    
    // Kill duplicates (keep the first one)
    for (const [serverType, procs] of serverGroups) {
      if (procs.length > 1) {
        logger.warn(`Found ${procs.length} instances of ${serverType}-mcp, killing duplicates...`);
        
        // Sort by PID (older PIDs first) and keep the first one
        procs.sort((a, b) => a.pid - b.pid);
        
        for (let i = 1; i < procs.length; i++) {
          try {
            process.kill(procs[i].pid, 'SIGTERM');
            logger.info(`Killed duplicate ${serverType}-mcp (PID: ${procs[i].pid})`);
          } catch (error) {
            // Process might already be dead
          }
        }
      }
    }
  }
  
  /**
   * Kill all MCP servers
   */
  killAll(): void {
    try {
      execSync('pkill -f mcp', { encoding: 'utf8' });
      logger.info('✅ Killed all MCP processes');
    } catch (error) {
      // pkill returns non-zero if no processes found
    }
  }
  
  /**
   * Clean up excessive resources
   */
  cleanup(): void {
    const status = this.getSystemStatus();
    
    if (status.processCount > this.MAX_MCP_SERVERS) {
      logger.warn(`🧹 Cleaning up excessive MCP servers (${status.processCount} > ${this.MAX_MCP_SERVERS})`);
      this.killDuplicates();
    }
    
    if (status.memoryUsageMB > this.MAX_MEMORY_MB) {
      logger.warn(`🧹 Memory usage too high (${status.memoryUsageMB}MB), killing oldest processes...`);
      
      // Sort by memory usage and kill the highest consumers
      const sorted = status.processes.sort((a, b) => b.memory - a.memory);
      
      let memoryFreed = 0;
      for (const proc of sorted) {
        if (status.memoryUsageMB - memoryFreed <= this.MAX_MEMORY_MB * 0.8) {
          break; // Stop when we're at 80% of limit
        }
        
        try {
          process.kill(proc.pid, 'SIGTERM');
          memoryFreed += proc.memory;
          logger.info(`Killed high-memory process (PID: ${proc.pid}, ${proc.memory}MB)`);
        } catch (error) {
          // Process might already be dead
        }
      }
    }
  }
  
  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    // Clear existing timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    // Run cleanup periodically
    this.cleanupTimer = setInterval(() => {
      const status = this.getSystemStatus();
      
      if (status.processCount > this.MAX_MCP_SERVERS * 0.8 || 
          status.memoryUsageMB > this.MAX_MEMORY_MB * 0.8) {
        logger.info('🔄 Running periodic MCP cleanup...');
        this.cleanup();
      }
    }, this.CLEANUP_INTERVAL);
    
    // Don't block process exit
    this.cleanupTimer.unref();
  }
  
  /**
   * Stop periodic cleanup
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  
  /**
   * Get resource usage summary
   */
  getResourceSummary(): string {
    const status = this.getSystemStatus();
    
    return `MCP Resources:
  Processes: ${status.processCount}/${this.MAX_MCP_SERVERS} (${Math.round(status.processCount / this.MAX_MCP_SERVERS * 100)}%)
  Memory: ${status.memoryUsageMB}MB/${this.MAX_MEMORY_MB}MB (${Math.round(status.memoryUsageMB / this.MAX_MEMORY_MB * 100)}%)
  Status: ${this.getHealthStatus()}`;
  }
  
  /**
   * Get health status
   */
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const status = this.getSystemStatus();
    
    const processPercent = status.processCount / this.MAX_MCP_SERVERS;
    const memoryPercent = status.memoryUsageMB / this.MAX_MEMORY_MB;
    
    if (processPercent > 0.9 || memoryPercent > 0.9) {
      return 'critical';
    }
    
    if (processPercent > 0.7 || memoryPercent > 0.7) {
      return 'warning';
    }
    
    return 'healthy';
  }
}
/**
 * Snow-Flow Main Integration Layer
 * Coordinates all subsystems: Agents, Memory, MCPs, and ServiceNow
 */

import { EventEmitter } from 'events';
import { SnowFlowConfig, ISnowFlowConfig } from './config/snow-flow-config';
import { ServiceNowQueen } from './queen/servicenow-queen';
import { MemorySystem } from './memory/memory-system';
import { MCPServerManager } from './utils/mcp-server-manager';
import { PerformanceTracker } from './monitoring/performance-tracker';
import { SystemHealth } from './health/system-health';
import { ErrorRecovery } from './utils/error-recovery';
import { Logger } from './utils/logger';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

export interface SwarmSession {
  id: string;
  objective: string;
  startedAt: Date;
  status: 'initializing' | 'active' | 'completing' | 'completed' | 'failed';
  queenAgentId: string;
  activeAgents: Map<string, AgentInfo>;
  completedTasks: number;
  totalTasks: number;
  errors: Error[];
}

export interface AgentInfo {
  id: string;
  type: string;
  status: 'spawned' | 'active' | 'blocked' | 'completed' | 'failed';
  assignedTasks: string[];
  progress: number;
  lastActivity: Date;
}

export class SnowFlowSystem extends EventEmitter {
  private config: SnowFlowConfig;
  private queen?: ServiceNowQueen;
  private memory?: MemorySystem;
  private mcpManager?: MCPServerManager;
  private performanceTracker?: PerformanceTracker;
  private systemHealth?: SystemHealth;
  private errorRecovery: ErrorRecovery;
  private logger: Logger;
  private sessions: Map<string, SwarmSession> = new Map();
  private initialized = false;

  constructor(config?: Partial<ISnowFlowConfig>) {
    super();
    this.config = new SnowFlowConfig(config);
    this.logger = new Logger('SnowFlowSystem');
    this.errorRecovery = new ErrorRecovery(this.logger);
  }

  /**
   * Initialize the entire Snow-Flow system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.info('System already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Snow-Flow System...');
      
      // 1. Initialize Memory System
      await this.initializeMemory();
      
      // 2. Initialize MCP Servers
      await this.initializeMCPServers();
      
      // 3. Initialize Queen Agent System
      await this.initializeQueen();
      
      // 4. Initialize Performance Tracking
      await this.initializePerformanceTracking();
      
      // 5. Initialize System Health Monitoring
      await this.initializeHealthMonitoring();
      
      this.initialized = true;
      this.emit('system:initialized');
      this.logger.info('Snow-Flow System initialized successfully');
      
    } catch (error) {
      this.logger.error('System initialization failed:', error);
      await this.errorRecovery.handleCriticalError(error as Error, {
        operation: 'system_initialization',
        fallbackStrategies: ['retry_initialization', 'partial_initialization']
      });
      throw error;
    }
  }

  /**
   * Initialize Memory System with SQLite
   */
  private async initializeMemory(): Promise<void> {
    this.logger.info('Initializing Memory System...');
    
    const dbPath = path.join(
      os.homedir(),
      '.snow-flow',
      'memory',
      'snow-flow.db'
    );
    
    this.memory = new MemorySystem({
      dbPath,
      schema: { version: '1.0.0', autoMigrate: true, ...(this.config.memory.schema || {}) },
      ttl: { default: 86400000, session: 3600000, artifact: 86400000, metric: 3600000, ...(this.config.memory.ttl || {}) }
    });
    
    await this.memory.initialize();
    this.emit('memory:initialized');
  }

  /**
   * Initialize MCP Server Manager
   */
  private async initializeMCPServers(): Promise<void> {
    this.logger.info('Initializing MCP Servers...');
    
    this.mcpManager = new MCPServerManager(JSON.stringify(this.config.mcp));
    
    // Start all required MCP servers
    const servers = [
      'servicenow-deployment',
      'servicenow-intelligent',
      'servicenow-operations',
      'servicenow-platform-development',
      'servicenow-integration',
      'servicenow-automation',
      'servicenow-security-compliance',
      'servicenow-reporting-analytics',
      'servicenow-graph-memory',
      'servicenow-update-set'
    ];
    
    for (const server of servers) {
      try {
        await this.mcpManager.startServer(server);
        this.logger.info(`Started MCP server: ${server}`);
      } catch (error) {
        this.logger.error(`Failed to start MCP server ${server}:`, error);
        // Continue with other servers even if one fails
      }
    }
    
    this.emit('mcp:initialized');
  }

  /**
   * Initialize Queen Agent System
   */
  private async initializeQueen(): Promise<void> {
    this.logger.info('Initializing Queen Agent System...');
    
    if (!this.memory || !this.mcpManager) {
      throw new Error('Memory and MCP must be initialized before Queen');
    }
    
    this.queen = new ServiceNowQueen({
      memoryPath: this.config.memory?.dbPath,
      maxConcurrentAgents: (this.config.agents?.queen as any)?.maxConcurrentAgents || 5,
      learningRate: (this.config.agents?.queen as any)?.learningRate || 0.1,
      debugMode: (this.config as any).debugMode || false,
      autoPermissions: (this.config.agents?.queen as any)?.autoPermissions || false
    });
    
    // ServiceNowQueen is ready to use after construction
    // No initialize method or event handlers available
    
    this.emit('queen:initialized');
  }

  /**
   * Initialize Performance Tracking
   */
  private async initializePerformanceTracking(): Promise<void> {
    this.logger.info('Initializing Performance Tracking...');
    
    if (!this.memory) {
      throw new Error('Memory must be initialized before Performance Tracking');
    }
    
    this.performanceTracker = new PerformanceTracker({
      memory: this.memory,
      config: { sampleRate: 100, metricsRetention: 86400000, aggregationInterval: 60000, ...(this.config.monitoring.performance || {}) }
    });
    
    await this.performanceTracker.initialize();
    
    // Set up performance monitoring
    this.performanceTracker.on('metric:recorded', (metric) => {
      this.emit('performance:metric', metric);
    });
    
    this.emit('performance:initialized');
  }

  /**
   * Initialize System Health Monitoring
   */
  private async initializeHealthMonitoring(): Promise<void> {
    this.logger.info('Initializing System Health Monitoring...');
    
    if (!this.memory || !this.mcpManager) {
      throw new Error('Memory and MCP must be initialized before Health Monitoring');
    }
    
    this.systemHealth = new SystemHealth({
      memory: this.memory,
      mcpManager: this.mcpManager,
      config: {
        checks: { memory: true, mcp: true, servicenow: true, queen: true },
        thresholds: { memoryUsage: 85, responseTime: 5000, queueSize: 100, cpuUsage: 80, errorRate: 5 }
      }
    });
    
    await this.systemHealth.initialize();
    
    // Set up health monitoring
    this.systemHealth.on('health:check', (status) => {
      this.emit('health:status', status);
    });
    
    // Start periodic health checks
    await this.systemHealth.startMonitoring();
    
    this.emit('health:initialized');
  }

  /**
   * Execute a swarm objective
   */
  async executeSwarm(objective: string, options: SwarmOptions = {}): Promise<SwarmResult> {
    if (!this.initialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }
    
    const sessionId = this.generateSessionId();
    const session: SwarmSession = {
      id: sessionId,
      objective,
      startedAt: new Date(),
      status: 'initializing',
      queenAgentId: '',
      activeAgents: new Map(),
      completedTasks: 0,
      totalTasks: 0,
      errors: []
    };
    
    this.sessions.set(sessionId, session);
    
    try {
      // Track swarm execution
      await this.performanceTracker?.startOperation('swarm_execution', {
        sessionId,
        objective
      });
      
      // Execute objective using Queen's main method
      const queenResult = await this.queen!.executeObjective(objective);
      const _analysis = { 
        complexity: 0.5, 
        type: 'unknown', 
        estimatedDuration: 30000,
        queenId: 'main-queen',
        estimatedTasks: 1
      };
      
      session.queenAgentId = _analysis.queenId;
      session.totalTasks = _analysis.estimatedTasks;
      session.status = 'active';
      
      // Execute swarm with Queen coordination (MCP-FIRST workflow)
      console.log(`🚨 SWARM EXECUTING WITH MCP-FIRST WORKFLOW`);
      console.log(`🎯 Objective: ${objective}`);
      
      const executionResult = await this.queen!.executeObjective(objective);
      
      // Update session with swarm-specific progress tracking
      session.completedTasks = 1; // Queen completed the objective
      session.status = 'completed' as any;
      this.emit('swarm:progress', { 
        sessionId, 
        progress: { 
          completed: 1, 
          total: 1, 
          status: 'completed',
          mcpFirst: true,
          realServiceNow: true
        } 
      });
      
      session.status = 'completed';
      await this.performanceTracker?.endOperation('swarm_execution', {
        success: true
      });
      
      return {
        sessionId,
        success: true,
        artifacts: queenResult.artifacts || [],
        summary: queenResult.deploymentResult || queenResult,
        metrics: await this.performanceTracker?.getSessionMetrics(sessionId) || {}
      };
      
    } catch (error) {
      session.status = 'failed';
      session.errors.push(error as Error);
      
      await this.performanceTracker?.endOperation('swarm_execution', {
        success: false,
        error: (error as Error).message
      });
      
      // Attempt recovery
      const recovery = await this.errorRecovery.attemptSwarmRecovery(sessionId, error as Error);
      
      if (recovery.success) {
        return recovery.result as SwarmResult;
      }
      
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<SystemStatus> {
    if (!this.initialized) {
      return {
        initialized: false,
        status: 'not_initialized',
        components: {}
      };
    }
    
    const healthStatus = await this.systemHealth!.getFullStatus();
    const activeSessions = Array.from(this.sessions.values())
      .filter(s => s.status === 'active');
    
    return {
      initialized: true,
      status: healthStatus.healthy ? 'healthy' : 'degraded',
      components: {
        memory: healthStatus.components.memory,
        mcp: healthStatus.components.mcp,
        queen: healthStatus.components.queen,
        performance: healthStatus.components.performance
      },
      activeSessions: activeSessions.length,
      metrics: {
        totalSessions: this.sessions.size,
        successRate: await this.calculateSuccessRate(),
        averageExecutionTime: await this.calculateAverageExecutionTime()
      }
    };
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Snow-Flow System...');
    
    try {
      // Complete active sessions
      for (const session of this.sessions.values()) {
        if (session.status === 'active') {
          await this.gracefullyCompleteSession(session.id);
        }
      }
      
      // Shutdown components in reverse order
      await this.systemHealth?.stopMonitoring();
      await this.performanceTracker?.shutdown();
      await this.queen?.shutdown();
      // Use available shutdown method
      if (this.mcpManager && typeof (this.mcpManager as any).shutdownAll === 'function') {
        await (this.mcpManager as any).shutdownAll();
      } else if (this.mcpManager && typeof (this.mcpManager as any).shutdown === 'function') {
        await (this.mcpManager as any).shutdown();
      }
      await this.memory?.close();
      
      this.initialized = false;
      this.emit('system:shutdown');
      this.logger.info('Snow-Flow System shutdown complete');
      
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): SwarmSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  listSessions(filter?: { status?: string }): SwarmSession[] {
    const sessions = Array.from(this.sessions.values());
    
    if (filter?.status) {
      return sessions.filter(s => s.status === filter.status);
    }
    
    return sessions;
  }

  /**
   * Get memory system instance
   */
  getMemory(): MemorySystem | undefined {
    return this.memory;
  }

  /**
   * Get MCP manager instance
   */
  getMCPManager(): MCPServerManager | undefined {
    return this.mcpManager;
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateAgentInfo(session: SwarmSession, update: any): void {
    const agent = session.activeAgents.get(update.agentId) || {
      id: update.agentId,
      type: update.agentType,
      status: 'spawned',
      assignedTasks: [],
      progress: 0,
      lastActivity: new Date()
    };
    
    Object.assign(agent, update);
    session.activeAgents.set(update.agentId, agent);
  }

  private async gracefullyCompleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.logger.info(`Gracefully completing session ${sessionId}`);
    
    // Notify all active agents to wrap up
    for (const agent of session.activeAgents.values()) {
      if (agent.status === 'active') {
        // Use available shutdown method
        // await this.queen?.shutdown(); // No per-agent shutdown available
      }
    }
    
    // Wait for agents to complete (max 30 seconds)
    const timeout = setTimeout(() => {
      session.status = 'completed';
    }, 30000);
    
    while (session.status === 'active') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const activeAgents = Array.from(session.activeAgents.values())
        .filter(a => a.status === 'active');
      
      if (activeAgents.length === 0) {
        session.status = 'completed';
        clearTimeout(timeout);
        break;
      }
    }
  }

  private async calculateSuccessRate(): Promise<number> {
    const sessions = Array.from(this.sessions.values());
    const completed = sessions.filter(s => s.status === 'completed').length;
    const total = sessions.filter(s => ['completed', 'failed'].includes(s.status)).length;
    
    return total > 0 ? (completed / total) * 100 : 0;
  }

  private async calculateAverageExecutionTime(): Promise<number> {
    const metrics = await this.performanceTracker?.getAggregateMetrics('swarm_execution');
    return metrics?.averageDuration || 0;
  }
}

// Type definitions
export interface SwarmOptions {
  strategy?: 'research' | 'development' | '_analysis' | 'testing' | 'optimization' | 'maintenance';
  mode?: 'centralized' | 'distributed' | 'hierarchical' | 'mesh' | 'hybrid';
  maxAgents?: number;
  parallel?: boolean;
  monitor?: boolean;
  autoPermissions?: boolean;
  smartDiscovery?: boolean;
  liveTesting?: boolean;
  autoDeploy?: boolean;
  autoRollback?: boolean;
  sharedMemory?: boolean;
  progressMonitoring?: boolean;
}

export interface SwarmResult {
  sessionId: string;
  success: boolean;
  artifacts: any[];
  summary: string;
  metrics: any;
}

export interface SystemStatus {
  initialized: boolean;
  status: string;
  components: Record<string, any>;
  activeSessions?: number;
  metrics?: any;
}

// Export singleton instance
export const snowFlowSystem = new SnowFlowSystem();
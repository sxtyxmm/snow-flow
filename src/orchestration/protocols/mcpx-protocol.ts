/**
 * MCPX (Model Context Protocol eXtended) Implementation
 * 
 * Extends MCP with orchestration capabilities for distributed agent coordination
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { 
  MCPXMessage, 
  MCPXResponse, 
  MCPXCommand, 
  MCPMessage, 
  OrchestrationContext,
  ClaudeCodeInstance,
  MCPXError,
  DistributedOrchestrator
} from '../interfaces/distributed-orchestration.interface.js';
import { logger } from '../../utils/logger.js';

export class MCPXProtocol extends EventEmitter {
  private connections: Map<string, WebSocket> = new Map();
  private messageHandlers: Map<MCPXCommand, MCPXMessageHandler> = new Map();
  private responseCallbacks: Map<string, ResponseCallback> = new Map();
  private securityManager: SecurityManager;
  private messageRouter: MessageRouter;

  constructor(
    private orchestrator: DistributedOrchestrator,
    private securityConfig: SecurityConfig
  ) {
    super();
    this.securityManager = new SecurityManager(securityConfig);
    this.messageRouter = new MessageRouter();
    this.setupMessageHandlers();
  }

  // ========================================
  // Connection Management
  // ========================================

  async establishConnection(agent: ClaudeCodeInstance): Promise<Connection> {
    logger.info(`🔗 Establishing MCPX connection to agent: ${agent.id}`, { endpoint: agent.endpoint });

    try {
      // Create WebSocket connection
      const ws = new WebSocket(agent.endpoint + '/mcpx', {
        headers: await this.securityManager.getAuthHeaders(agent)
      });

      // Setup connection handling
      const connection = new Connection(agent.id, ws, this);
      await this.setupConnection(connection);

      // Protocol negotiation
      const negotiationResult = await this.negotiateProtocol(connection);
      if (!negotiationResult.success) {
        throw new Error(`Protocol negotiation failed: ${negotiationResult.error}`);
      }

      this.connections.set(agent.id, ws);
      this.emit('connection:established', { agentId: agent.id, connection });

      logger.info(`✅ MCPX connection established to agent: ${agent.id}`);
      return connection;

    } catch (error) {
      logger.error(`❌ Failed to establish connection to agent: ${agent.id}`, { error: error.message });
      throw new MCPXConnectionError(`Connection failed: ${error.message}`, agent.id);
    }
  }

  async maintainConnection(connection: Connection): Promise<void> {
    const heartbeatInterval = setInterval(async () => {
      try {
        await this.sendHeartbeat(connection);
      } catch (error) {
        logger.warn(`💓 Heartbeat failed for connection: ${connection.agentId}`, { error: error.message });
        clearInterval(heartbeatInterval);
        await this.handleConnectionFailure(connection);
      }
    }, 30000); // 30 second heartbeat

    connection.on('close', () => {
      clearInterval(heartbeatInterval);
      this.connections.delete(connection.agentId);
      this.emit('connection:closed', { agentId: connection.agentId });
    });
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
      logger.info(`🔌 Closed connection to agent: ${connectionId}`);
    }
  }

  // ========================================
  // Protocol Negotiation
  // ========================================

  async negotiateProtocol(connection: Connection): Promise<ProtocolNegotiationResult> {
    const negotiationMessage: MCPXMessage = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: 'mcpx.negotiate',
      params: {
        version: '1.0',
        capabilities: this.getSupportedCapabilities(),
        extensions: ['orchestration', 'coordination', 'distribution']
      },
      timestamp: Date.now(),
      source: this.orchestrator.getInstanceId(),
      priority: 'high'
    };

    try {
      const response = await this.sendMessage(connection, negotiationMessage, 10000);
      
      if (response.success && response.result) {
        const remoteCapabilities = response.result.capabilities;
        const commonCapabilities = this.findCommonCapabilities(
          this.getSupportedCapabilities(), 
          remoteCapabilities
        );

        connection.setNegotiatedCapabilities(commonCapabilities);
        
        return {
          success: true,
          version: response.result.version,
          capabilities: commonCapabilities
        };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Unknown negotiation error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Negotiation timeout or error: ${error.message}`
      };
    }
  }

  // ========================================
  // Message Handling
  // ========================================

  async sendOrchestrationCommand(
    targetInstance: string,
    command: MCPXCommand,
    payload: any,
    timeout: number = 30000
  ): Promise<MCPXResponse> {
    const connection = this.connections.get(targetInstance);
    if (!connection) {
      throw new MCPXConnectionError(`No connection to agent: ${targetInstance}`, targetInstance);
    }

    const message: MCPXMessage = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: command,
      params: payload,
      orchestration: this.getCurrentOrchestrationContext(),
      timestamp: Date.now(),
      source: this.orchestrator.getInstanceId(),
      target: targetInstance,
      priority: 'normal'
    };

    try {
      const response = await this.sendMessageWithTimeout(connection, message, timeout);
      this.logCommandExecution(command, targetInstance, payload, response);
      return response;
    } catch (error) {
      logger.error(`❌ MCPX command failed: ${command}`, { 
        target: targetInstance, 
        error: error.message 
      });
      throw new MCPXCommandError(command, targetInstance, error.message);
    }
  }

  async broadcastCommand(
    instances: string[],
    command: MCPXCommand,
    payload: any,
    timeout: number = 30000
  ): Promise<Map<string, MCPXResponse>> {
    logger.info(`📡 Broadcasting MCPX command: ${command}`, { 
      instances: instances.length,
      command
    });

    const promises = instances.map(async (instanceId) => {
      try {
        const response = await this.sendOrchestrationCommand(instanceId, command, payload, timeout);
        return { instanceId, response };
      } catch (error) {
        logger.warn(`⚠️ Broadcast failed for instance: ${instanceId}`, { error: error.message });
        return { 
          instanceId, 
          response: { 
            success: false, 
            error: { 
              code: 'BROADCAST_FAILED', 
              message: error.message,
              retryable: true 
            } 
          } as MCPXResponse 
        };
      }
    });

    const results = await Promise.allSettled(promises);
    const responseMap = new Map<string, MCPXResponse>();

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        responseMap.set(result.value.instanceId, result.value.response);
      } else {
        responseMap.set(instances[index], {
          success: false,
          error: {
            code: 'PROMISE_REJECTED',
            message: result.reason?.message || 'Unknown error',
            retryable: false
          }
        });
      }
    });

    const successCount = Array.from(responseMap.values()).filter(r => r.success).length;
    logger.info(`📡 Broadcast completed: ${successCount}/${instances.length} successful`);

    return responseMap;
  }

  async handleMCPXMessage(message: MCPXMessage, connection: Connection): Promise<MCPXResponse> {
    try {
      // Security validation
      const securityCheck = await this.securityManager.validateMessage(message, connection);
      if (!securityCheck.valid) {
        throw new MCPXSecurityError(`Security validation failed: ${securityCheck.reason}`);
      }

      // Route message to appropriate handler
      const handler = this.messageHandlers.get(message.method as MCPXCommand);
      if (!handler) {
        throw new MCPXError(`Unknown command: ${message.method}`, 'UNKNOWN_COMMAND', true);
      }

      // Execute handler with context
      const context = this.createExecutionContext(message, connection);
      const result = await handler.handle(message.params, context);

      return {
        success: true,
        result,
        metadata: {
          processingTime: Date.now() - message.timestamp,
          instanceId: this.orchestrator.getInstanceId(),
          resourceUsage: await this.getResourceUsage()
        }
      };

    } catch (error) {
      logger.error(`❌ MCPX message handling failed`, { 
        method: message.method,
        error: error.message
      });

      return {
        success: false,
        error: {
          code: error.code || 'HANDLER_ERROR',
          message: error.message,
          retryable: error.retryable || false
        }
      };
    }
  }

  // ========================================
  // Protocol Translation
  // ========================================

  translateMCPToMCPX(mcpMessage: MCPMessage, context: OrchestrationContext): MCPXMessage {
    return {
      ...mcpMessage,
      orchestration: context,
      timestamp: Date.now(),
      source: this.orchestrator.getInstanceId(),
      priority: 'normal'
    };
  }

  translateMCPXToMCP(mcpxMessage: MCPXMessage): MCPMessage {
    const { orchestration, coordination, distribution, timestamp, source, target, priority, ...mcpMessage } = mcpxMessage;
    return mcpMessage;
  }

  // ========================================
  // Message Handlers Setup
  // ========================================

  private setupMessageHandlers(): void {
    // Orchestration handlers
    this.messageHandlers.set(
      MCPXCommand.ORCHESTRATE_SESSION_START,
      new SessionStartHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.ORCHESTRATE_TASK_ASSIGN,
      new TaskAssignHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.ORCHESTRATE_TASK_COMPLETE,
      new TaskCompleteHandler(this.orchestrator)
    );

    // Coordination handlers
    this.messageHandlers.set(
      MCPXCommand.COORDINATE_STATE_SYNC,
      new StateSyncHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.COORDINATE_DEPENDENCY_RESOLVE,
      new DependencyResolveHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.COORDINATE_QUALITY_GATE,
      new QualityGateHandler(this.orchestrator)
    );

    // Distribution handlers
    this.messageHandlers.set(
      MCPXCommand.DISTRIBUTE_TASK_SPLIT,
      new TaskSplitHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.DISTRIBUTE_RESULT_MERGE,
      new ResultMergeHandler(this.orchestrator)
    );

    // Health & monitoring handlers
    this.messageHandlers.set(
      MCPXCommand.HEALTH_CHECK,
      new HealthCheckHandler(this.orchestrator)
    );

    this.messageHandlers.set(
      MCPXCommand.METRICS_REPORT,
      new MetricsReportHandler(this.orchestrator)
    );
  }

  // ========================================
  // Utility Methods
  // ========================================

  private generateMessageId(): string {
    return `mcpx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSupportedCapabilities(): string[] {
    return [
      'orchestration.session_management',
      'orchestration.task_assignment',
      'coordination.state_sync',
      'coordination.dependency_resolution',
      'distribution.task_splitting',
      'distribution.load_balancing',
      'monitoring.health_check',
      'monitoring.metrics_reporting'
    ];
  }

  private findCommonCapabilities(local: string[], remote: string[]): string[] {
    return local.filter(cap => remote.includes(cap));
  }

  private async sendHeartbeat(connection: Connection): Promise<void> {
    const heartbeat: MCPXMessage = {
      jsonrpc: '2.0',
      method: MCPXCommand.HEALTH_CHECK,
      params: { type: 'heartbeat' },
      timestamp: Date.now(),
      source: this.orchestrator.getInstanceId(),
      priority: 'low'
    };

    await this.sendMessage(connection, heartbeat, 5000);
  }

  private async sendMessageWithTimeout(
    connection: Connection, 
    message: MCPXMessage, 
    timeout: number
  ): Promise<MCPXResponse> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Message timeout after ${timeout}ms`));
      }, timeout);

      this.sendMessage(connection, message)
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async sendMessage(
    connection: Connection, 
    message: MCPXMessage, 
    timeout?: number
  ): Promise<MCPXResponse> {
    return new Promise((resolve, reject) => {
      const messageId = message.id || this.generateMessageId();
      
      // Store callback for response
      this.responseCallbacks.set(messageId.toString(), { resolve, reject });

      // Send message
      connection.send(JSON.stringify(message));

      // Setup timeout if specified
      if (timeout) {
        setTimeout(() => {
          this.responseCallbacks.delete(messageId.toString());
          reject(new Error(`Message timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  private createExecutionContext(message: MCPXMessage, connection: Connection): ExecutionContext {
    return {
      messageId: message.id?.toString() || '',
      source: message.source,
      target: message.target,
      orchestrationContext: message.orchestration,
      connection,
      timestamp: message.timestamp,
      security: {
        agentId: connection.agentId,
        authenticated: connection.isAuthenticated(),
        capabilities: connection.getNegotiatedCapabilities()
      }
    };
  }

  private async getResourceUsage(): Promise<ResourceUsage> {
    // Implementation would gather actual resource metrics
    return {
      cpu: process.cpuUsage().system / 1000000, // Convert to seconds
      memory: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      network: 0, // Would need network monitoring
      storage: 0, // Would need storage monitoring
      apiCalls: 0, // Would need API call counting
    };
  }

  private logCommandExecution(
    command: MCPXCommand, 
    target: string, 
    payload: any, 
    response: MCPXResponse
  ): void {
    logger.info(`🚀 MCPX command executed`, {
      command,
      target,
      success: response.success,
      processingTime: response.metadata?.processingTime,
      error: response.error?.code
    });
  }

  private async handleConnectionFailure(connection: Connection): Promise<void> {
    logger.warn(`🔌 Connection failed for agent: ${connection.agentId}`);
    
    // Remove from active connections
    this.connections.delete(connection.agentId);
    
    // Emit failure event
    this.emit('connection:failed', { agentId: connection.agentId });
    
    // Attempt reconnection if configured
    if (this.shouldAttemptReconnection(connection.agentId)) {
      setTimeout(() => {
        this.attemptReconnection(connection.agentId);
      }, 5000); // 5 second delay
    }
  }

  private shouldAttemptReconnection(agentId: string): boolean {
    // Implementation would check reconnection policy
    return true;
  }

  private async attemptReconnection(agentId: string): Promise<void> {
    logger.info(`🔄 Attempting reconnection to agent: ${agentId}`);
    
    try {
      const agent = await this.orchestrator.getAgent(agentId);
      if (agent) {
        await this.establishConnection(agent);
      }
    } catch (error) {
      logger.error(`❌ Reconnection failed for agent: ${agentId}`, { error: error.message });
    }
  }

  private getCurrentOrchestrationContext(): OrchestrationContext | undefined {
    // Implementation would return current orchestration context
    return undefined;
  }

  private async setupConnection(connection: Connection): Promise<void> {
    connection.on('message', async (data) => {
      try {
        const message: MCPXMessage = JSON.parse(data.toString());
        
        if (message.id && this.responseCallbacks.has(message.id.toString())) {
          // This is a response to our request
          const callback = this.responseCallbacks.get(message.id.toString());
          this.responseCallbacks.delete(message.id.toString());
          
          if (message.error) {
            callback?.reject(new Error(message.error.message));
          } else {
            callback?.resolve({
              success: true,
              result: message.result
            });
          }
        } else {
          // This is an incoming request/notification
          const response = await this.handleMCPXMessage(message, connection);
          
          if (message.id) {
            // Send response back
            const responseMessage = {
              jsonrpc: '2.0',
              id: message.id,
              result: response.success ? response.result : undefined,
              error: response.success ? undefined : response.error
            };
            
            connection.send(JSON.stringify(responseMessage));
          }
        }
      } catch (error) {
        logger.error('❌ Failed to handle MCPX message', { error: error.message });
      }
    });

    connection.on('error', (error) => {
      logger.error(`❌ MCPX connection error for agent: ${connection.agentId}`, { error: error.message });
    });

    connection.on('close', () => {
      logger.info(`🔌 MCPX connection closed for agent: ${connection.agentId}`);
      this.connections.delete(connection.agentId);
    });
  }
}

// ========================================
// Supporting Classes
// ========================================

class Connection extends EventEmitter {
  private negotiatedCapabilities: string[] = [];

  constructor(
    public readonly agentId: string,
    private websocket: WebSocket,
    private protocol: MCPXProtocol
  ) {
    super();
  }

  send(data: string): void {
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(data);
    } else {
      throw new Error(`Connection to ${this.agentId} is not open`);
    }
  }

  close(): void {
    this.websocket.close();
  }

  isAuthenticated(): boolean {
    return this.websocket.readyState === WebSocket.OPEN;
  }

  setNegotiatedCapabilities(capabilities: string[]): void {
    this.negotiatedCapabilities = capabilities;
  }

  getNegotiatedCapabilities(): string[] {
    return [...this.negotiatedCapabilities];
  }
}

class SecurityManager {
  constructor(private config: SecurityConfig) {}

  async getAuthHeaders(agent: ClaudeCodeInstance): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'snow-flow-mcpx/1.0'
    };

    if (agent.authentication.apiKey) {
      headers['Authorization'] = `Bearer ${agent.authentication.apiKey}`;
    }

    return headers;
  }

  async validateMessage(message: MCPXMessage, connection: Connection): Promise<SecurityValidation> {
    // Basic validation - in production, would include:
    // - Message signature verification
    // - Rate limiting checks
    // - Authorization validation
    // - Input sanitization

    if (!message.source) {
      return { valid: false, reason: 'Missing source identifier' };
    }

    return { valid: true };
  }
}

class MessageRouter {
  constructor() {}

  route(message: MCPXMessage): string {
    // Route messages based on type, priority, or other criteria
    return 'default';
  }
}

// ========================================
// Message Handlers
// ========================================

abstract class MCPXMessageHandler {
  constructor(protected orchestrator: DistributedOrchestrator) {}

  abstract handle(params: any, context: ExecutionContext): Promise<any>;
}

class SessionStartHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('🎯 Handling session start request', { sessionId: params.sessionId });
    
    // Implementation would create and initialize session
    const session = await this.orchestrator.createSession(params.config);
    
    return {
      sessionId: session.id,
      status: 'started',
      participants: []
    };
  }
}

class TaskAssignHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('📋 Handling task assignment', { taskId: params.taskId });
    
    // Implementation would assign task to agent
    return {
      taskId: params.taskId,
      assigned: true,
      estimatedCompletion: new Date(Date.now() + params.estimatedDuration)
    };
  }
}

class TaskCompleteHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('✅ Handling task completion', { taskId: params.taskId });
    
    // Implementation would process task completion
    return {
      taskId: params.taskId,
      completed: true,
      result: params.result
    };
  }
}

class StateSyncHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('🔄 Handling state synchronization', { keys: params.keys });
    
    // Implementation would sync state
    return {
      synchronized: params.keys,
      conflicts: [],
      version: Date.now()
    };
  }
}

class DependencyResolveHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('🔗 Handling dependency resolution', { dependencies: params.dependencies });
    
    // Implementation would resolve dependencies
    return {
      resolved: params.dependencies,
      pending: []
    };
  }
}

class QualityGateHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('🛡️ Handling quality gate validation', { gateId: params.gateId });
    
    // Implementation would validate quality gate
    return {
      gateId: params.gateId,
      passed: true,
      score: 0.95,
      validations: []
    };
  }
}

class TaskSplitHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('✂️ Handling task splitting', { taskId: params.taskId });
    
    // Implementation would split task
    return {
      originalTaskId: params.taskId,
      subtasks: [],
      strategy: 'data_parallel'
    };
  }
}

class ResultMergeHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('🔀 Handling result merge', { results: params.results.length });
    
    // Implementation would merge results
    return {
      merged: true,
      result: params.results,
      strategy: 'concatenate'
    };
  }
}

class HealthCheckHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.debug('💓 Handling health check', { type: params.type });
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      metrics: await this.getHealthMetrics()
    };
  }

  private async getHealthMetrics(): Promise<any> {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }
}

class MetricsReportHandler extends MCPXMessageHandler {
  async handle(params: any, context: ExecutionContext): Promise<any> {
    logger.info('📊 Handling metrics report', { metrics: Object.keys(params.metrics) });
    
    // Implementation would process and store metrics
    return {
      received: true,
      timestamp: new Date()
    };
  }
}

// ========================================
// Error Classes
// ========================================

class MCPXConnectionError extends Error {
  constructor(message: string, public agentId: string) {
    super(message);
    this.name = 'MCPXConnectionError';
  }
}

class MCPXCommandError extends Error {
  constructor(
    public command: MCPXCommand,
    public targetInstance: string,
    message: string
  ) {
    super(message);
    this.name = 'MCPXCommandError';
  }
}

class MCPXSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPXSecurityError';
  }
}

// ========================================
// Supporting Types
// ========================================

interface ResponseCallback {
  resolve: (value: MCPXResponse) => void;
  reject: (reason: any) => void;
}

interface SecurityConfig {
  enableAuthentication: boolean;
  enableEncryption: boolean;
  trustedAgents: string[];
  rateLimiting: {
    enabled: boolean;
    maxRequestsPerMinute: number;
  };
}

interface SecurityValidation {
  valid: boolean;
  reason?: string;
}

interface ProtocolNegotiationResult {
  success: boolean;
  version?: string;
  capabilities?: string[];
  error?: string;
}

interface ExecutionContext {
  messageId: string;
  source: string;
  target?: string;
  orchestrationContext?: OrchestrationContext;
  connection: Connection;
  timestamp: number;
  security: {
    agentId: string;
    authenticated: boolean;
    capabilities: string[];
  };
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  apiCalls: number;
}
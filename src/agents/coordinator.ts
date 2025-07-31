/**
 * Agent Coordination System
 * Manages inter-agent communication, task dependencies, and handoffs
 * Integrates with SQLite memory for persistent coordination state
 */

import { EventEmitter } from 'eventemitter3';
import { Agent, AgentMessage } from '../queen/types';
import { QueenMemorySystem } from '../queen/queen-memory';
import * as crypto from 'crypto';

export interface CoordinationContext {
  sessionId: string;
  objectiveId: string;
  agents: Map<string, Agent>;
  dependencies: Map<string, string[]>;
  handoffs: Map<string, HandoffRequest>;
  blockages: Map<string, BlockageInfo>;
}

export interface HandoffRequest {
  id: string;
  fromAgent: string;
  toAgent: string;
  artifactType: string;
  artifactData: any;
  status: 'pending' | 'accepted' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface BlockageInfo {
  agentId: string;
  reason: string;
  blockedTasks: string[];
  dependencies: string[];
  attemptedResolutions: string[];
  createdAt: Date;
}

export interface CoordinationStrategy {
  type: 'sequential' | 'parallel' | 'adaptive';
  rules: CoordinationRule[];
  fallbackStrategy?: string;
}

export interface CoordinationRule {
  condition: string;
  action: string;
  priority: number;
}

export interface RecoveryStrategy {
  errorType: string;
  recoveryActions: RecoveryAction[];
  maxRetries: number;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'reassign' | 'escalate';
  config: Record<string, any>;
}

export class AgentCoordinator extends EventEmitter {
  private memory: QueenMemorySystem;
  private contexts: Map<string, CoordinationContext>;
  private strategies: Map<string, CoordinationStrategy>;
  private recoveryStrategies: Map<string, RecoveryStrategy>;
  private messageQueue: Map<string, AgentMessage[]>;

  constructor(memory: QueenMemorySystem) {
    super();
    this.memory = memory;
    this.contexts = new Map();
    this.strategies = new Map();
    this.recoveryStrategies = new Map();
    this.messageQueue = new Map();

    this.initializeDefaultStrategies();
    this.setupMemorySync();
  }

  /**
   * Create a new coordination context for an objective
   */
  async createContext(sessionId: string, objectiveId: string): Promise<CoordinationContext> {
    const context: CoordinationContext = {
      sessionId,
      objectiveId,
      agents: new Map(),
      dependencies: new Map(),
      handoffs: new Map(),
      blockages: new Map()
    };

    this.contexts.set(objectiveId, context);

    // Store context in memory for persistence
    await this.memory.store(`coordination_context_${objectiveId}`, {
      sessionId,
      objectiveId,
      createdAt: new Date().toISOString()
    });

    this.emit('context:created', { sessionId, objectiveId });

    return context;
  }

  /**
   * Register an agent with the coordinator
   */
  async registerAgent(agent: Agent, objectiveId?: string): Promise<void> {
    // Find or create context
    let context: CoordinationContext | undefined;
    if (objectiveId) {
      context = this.contexts.get(objectiveId);
    } else {
      // Find context that needs this agent type
      for (const ctx of this.contexts.values()) {
        if (!Array.from(ctx.agents.values()).some(a => a.type === agent.type)) {
          context = ctx;
          break;
        }
      }
    }

    if (!context) {
      throw new Error('No suitable coordination context found for agent');
    }

    context.agents.set(agent.id, agent);

    // Store agent registration in memory
    await this.memory.store(`agent_registration_${agent.id}`, {
      agentId: agent.id,
      agentType: agent.type,
      objectiveId: context.objectiveId,
      sessionId: context.sessionId,
      registeredAt: new Date().toISOString()
    });

    // Initialize message queue for agent
    this.messageQueue.set(agent.id, []);

    this.emit('agent:registered', { agent, objectiveId: context.objectiveId });
  }

  /**
   * Manage task dependencies between agents
   */
  async manageDependencies(
    objectiveId: string,
    taskId: string,
    dependencies: string[]
  ): Promise<void> {
    const context = this.contexts.get(objectiveId);
    if (!context) {
      throw new Error(`No context found for objective: ${objectiveId}`);
    }

    context.dependencies.set(taskId, dependencies);

    // Store dependencies in memory
    await this.memory.store(`dependencies_${taskId}`, {
      taskId,
      dependencies,
      objectiveId,
      createdAt: new Date().toISOString()
    });

    // Check if any dependencies are already satisfied
    await this.checkDependencySatisfaction(context, taskId);
  }

  /**
   * Coordinate handoff between agents
   */
  async coordinateHandoff(
    fromAgentId: string,
    toAgentId: string,
    artifactType: string,
    artifactData: any
  ): Promise<HandoffRequest> {
    const handoffId = this.generateId('handoff');
    
    const handoff: HandoffRequest = {
      id: handoffId,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      artifactType,
      artifactData,
      status: 'pending',
      createdAt: new Date()
    };

    // Find context containing these agents
    let context: CoordinationContext | undefined;
    for (const ctx of this.contexts.values()) {
      if (ctx.agents.has(fromAgentId) && ctx.agents.has(toAgentId)) {
        context = ctx;
        break;
      }
    }

    if (!context) {
      throw new Error('No coordination context found for agents');
    }

    context.handoffs.set(handoffId, handoff);

    // Store handoff in memory
    await this.memory.store(`handoff_${handoffId}`, {
      handoff,
      objectiveId: context.objectiveId,
      timestamp: new Date().toISOString()
    });

    // Notify receiving agent
    await this.sendMessage(fromAgentId, toAgentId, 'coordination', {
      type: 'handoff_request',
      handoffId,
      artifactType,
      artifactData
    });

    this.emit('agent:handoff', {
      handoffId,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      artifactType,
      objectiveId: context.objectiveId
    });

    return handoff;
  }

  /**
   * Handle agent blockage with recovery strategies
   */
  async handleBlockage(
    agentId: string,
    reason: string,
    blockedTasks: string[]
  ): Promise<void> {
    // Find context containing this agent
    let context: CoordinationContext | undefined;
    for (const ctx of this.contexts.values()) {
      if (ctx.agents.has(agentId)) {
        context = ctx;
        break;
      }
    }

    if (!context) {
      throw new Error(`No context found for agent: ${agentId}`);
    }

    const blockage: BlockageInfo = {
      agentId,
      reason,
      blockedTasks,
      dependencies: this.findBlockedDependencies(context, blockedTasks),
      attemptedResolutions: [],
      createdAt: new Date()
    };

    context.blockages.set(agentId, blockage);

    // Store blockage in memory
    await this.memory.store(`blockage_${agentId}_${Date.now()}`, {
      blockage,
      objectiveId: context.objectiveId,
      timestamp: new Date().toISOString()
    });

    // Attempt recovery
    await this.attemptRecovery(context, blockage);

    this.emit('agent:blocked', {
      agentId,
      reason,
      blockedTasks,
      objectiveId: context.objectiveId
    });
  }

  /**
   * Send message between agents
   */
  async sendMessage(
    fromAgentId: string,
    toAgentId: string,
    messageType: AgentMessage['type'],
    content: any
  ): Promise<void> {
    const message: AgentMessage = {
      from: fromAgentId,
      to: toAgentId,
      type: messageType,
      content,
      timestamp: new Date()
    };

    // Add to message queue
    const queue = this.messageQueue.get(toAgentId) || [];
    queue.push(message);
    this.messageQueue.set(toAgentId, queue);

    // Store message in memory for audit
    await this.memory.store(`message_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`, {
      message,
      delivered: false,
      timestamp: new Date().toISOString()
    });

    // Process message immediately if agent is listening
    await this.processAgentMessages(toAgentId);

    this.emit('message:sent', message);
  }

  /**
   * Get pending messages for an agent
   */
  async getAgentMessages(agentId: string): Promise<AgentMessage[]> {
    const messages = this.messageQueue.get(agentId) || [];
    
    // Clear processed messages
    this.messageQueue.set(agentId, []);
    
    return messages;
  }

  /**
   * Update handoff status
   */
  async updateHandoffStatus(
    handoffId: string,
    status: HandoffRequest['status']
  ): Promise<void> {
    let handoff: HandoffRequest | undefined;
    let context: CoordinationContext | undefined;

    // Find handoff in contexts
    for (const ctx of this.contexts.values()) {
      if (ctx.handoffs.has(handoffId)) {
        handoff = ctx.handoffs.get(handoffId);
        context = ctx;
        break;
      }
    }

    if (!handoff || !context) {
      throw new Error(`Handoff not found: ${handoffId}`);
    }

    handoff.status = status;
    if (status === 'completed' || status === 'failed') {
      handoff.completedAt = new Date();
    }

    // Update memory
    await this.memory.store(`handoff_status_${handoffId}`, {
      handoffId,
      newStatus: status,
      timestamp: new Date().toISOString()
    });

    this.emit('handoff:updated', {
      handoffId,
      status,
      objectiveId: context.objectiveId
    });
  }

  /**
   * Get coordination status for an objective
   */
  async getCoordinationStatus(objectiveId: string): Promise<{
    agents: { total: number; active: number; blocked: number };
    handoffs: { total: number; pending: number; completed: number };
    dependencies: { total: number; satisfied: number };
    blockages: number;
  }> {
    const context = this.contexts.get(objectiveId);
    if (!context) {
      throw new Error(`No context found for objective: ${objectiveId}`);
    }

    const agents = Array.from(context.agents.values());
    const handoffs = Array.from(context.handoffs.values());

    // Count satisfied dependencies
    let totalDeps = 0;
    let satisfiedDeps = 0;
    for (const deps of context.dependencies.values()) {
      totalDeps += deps.length;
      // Check each dependency (would need task completion tracking)
      satisfiedDeps += deps.filter(d => this.isDependencySatisfied(context, d)).length;
    }

    return {
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'working').length,
        blocked: context.blockages.size
      },
      handoffs: {
        total: handoffs.length,
        pending: handoffs.filter(h => h.status === 'pending').length,
        completed: handoffs.filter(h => h.status === 'completed').length
      },
      dependencies: {
        total: totalDeps,
        satisfied: satisfiedDeps
      },
      blockages: context.blockages.size
    };
  }

  /**
   * Apply coordination strategy
   */
  async applyStrategy(
    objectiveId: string,
    strategyType: string
  ): Promise<void> {
    const context = this.contexts.get(objectiveId);
    if (!context) {
      throw new Error(`No context found for objective: ${objectiveId}`);
    }

    const strategy = this.strategies.get(strategyType);
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyType}`);
    }

    // Apply strategy rules
    for (const rule of strategy.rules) {
      if (this.evaluateCondition(context, rule.condition)) {
        await this.executeAction(context, rule.action);
      }
    }

    this.emit('strategy:applied', { objectiveId, strategyType });
  }

  /**
   * Terminate an agent
   */
  async terminateAgent(agentId: string): Promise<void> {
    // Find and remove agent from all contexts
    for (const context of this.contexts.values()) {
      if (context.agents.has(agentId)) {
        context.agents.delete(agentId);
        
        // Clear any blockages
        context.blockages.delete(agentId);
        
        // Update memory
        await this.memory.store(`agent_terminated_${agentId}`, {
          agentId,
          objectiveId: context.objectiveId,
          terminatedAt: new Date().toISOString()
        });
        
        this.emit('agent:terminated', { agentId, objectiveId: context.objectiveId });
        break;
      }
    }

    // Clear message queue
    this.messageQueue.delete(agentId);
  }

  /**
   * Initialize default coordination strategies
   */
  private initializeDefaultStrategies(): void {
    // Sequential strategy
    this.strategies.set('sequential', {
      type: 'sequential',
      rules: [
        {
          condition: 'hasBlockedAgent',
          action: 'waitForDependencies',
          priority: 1
        },
        {
          condition: 'allDependenciesSatisfied',
          action: 'proceedToNextTask',
          priority: 2
        }
      ]
    });

    // Parallel strategy
    this.strategies.set('parallel', {
      type: 'parallel',
      rules: [
        {
          condition: 'hasIndependentTasks',
          action: 'assignToAvailableAgents',
          priority: 1
        },
        {
          condition: 'hasBlockedAgent',
          action: 'reassignToOtherAgent',
          priority: 2
        }
      ]
    });

    // Adaptive strategy
    this.strategies.set('adaptive', {
      type: 'adaptive',
      rules: [
        {
          condition: 'highComplexity',
          action: 'spawnSpecialistAgent',
          priority: 1
        },
        {
          condition: 'repeatedFailures',
          action: 'switchToFallbackApproach',
          priority: 2
        }
      ]
    });

    // Initialize recovery strategies
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize recovery strategies for error handling
   */
  private initializeRecoveryStrategies(): void {
    // Permission error recovery
    this.recoveryStrategies.set('permission_error', {
      errorType: 'permission_error',
      recoveryActions: [
        {
          type: 'fallback',
          config: { scope: 'global' }
        },
        {
          type: 'escalate',
          config: { requestElevation: true }
        }
      ],
      maxRetries: 3
    });

    // Dependency timeout recovery
    this.recoveryStrategies.set('dependency_timeout', {
      errorType: 'dependency_timeout',
      recoveryActions: [
        {
          type: 'reassign',
          config: { preferredAgentType: 'any' }
        },
        {
          type: 'fallback',
          config: { skipDependency: true }
        }
      ],
      maxRetries: 2
    });

    // Resource exhaustion recovery
    this.recoveryStrategies.set('resource_exhaustion', {
      errorType: 'resource_exhaustion',
      recoveryActions: [
        {
          type: 'retry',
          config: { delay: 5000 }
        },
        {
          type: 'reassign',
          config: { reduceComplexity: true }
        }
      ],
      maxRetries: 3
    });
  }

  /**
   * Set up memory synchronization
   */
  private setupMemorySync(): void {
    // Periodically sync coordination state to memory
    setInterval(async () => {
      for (const [objectiveId, context] of this.contexts) {
        await this.syncContextToMemory(objectiveId, context);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Sync context to memory
   */
  private async syncContextToMemory(
    objectiveId: string,
    context: CoordinationContext
  ): Promise<void> {
    await this.memory.store(`coordination_state_${objectiveId}`, {
      objectiveId,
      sessionId: context.sessionId,
      agentCount: context.agents.size,
      activeHandoffs: Array.from(context.handoffs.values()).filter(h => h.status === 'pending').length,
      blockages: context.blockages.size,
      lastSync: new Date().toISOString()
    });
  }

  /**
   * Check if dependencies are satisfied
   */
  private async checkDependencySatisfaction(
    context: CoordinationContext,
    taskId: string
  ): Promise<void> {
    const dependencies = context.dependencies.get(taskId) || [];
    const allSatisfied = dependencies.every(dep => this.isDependencySatisfied(context, dep));

    if (allSatisfied) {
      this.emit('dependencies:satisfied', {
        taskId,
        objectiveId: context.objectiveId
      });
    }
  }

  /**
   * Check if a specific dependency is satisfied
   */
  private isDependencySatisfied(context: CoordinationContext, dependencyId: string): boolean {
    // Check if dependency task is completed
    // This would integrate with TodoWrite status
    // For now, check if there's a completed handoff for this dependency
    for (const handoff of context.handoffs.values()) {
      if (handoff.artifactType === dependencyId && handoff.status === 'completed') {
        return true;
      }
    }
    return false;
  }

  /**
   * Find blocked dependencies
   */
  private findBlockedDependencies(
    context: CoordinationContext,
    blockedTasks: string[]
  ): string[] {
    const blockedDeps: string[] = [];

    for (const task of blockedTasks) {
      const deps = context.dependencies.get(task) || [];
      blockedDeps.push(...deps);
    }

    return [...new Set(blockedDeps)]; // Remove duplicates
  }

  /**
   * Attempt recovery for blocked agent
   */
  private async attemptRecovery(
    context: CoordinationContext,
    blockage: BlockageInfo
  ): Promise<void> {
    // Find appropriate recovery strategy
    const strategy = this.findRecoveryStrategy(blockage.reason);
    if (!strategy) {
      this.emit('recovery:failed', {
        agentId: blockage.agentId,
        reason: 'No recovery strategy available'
      });
      return;
    }

    // Try recovery actions
    for (const action of strategy.recoveryActions) {
      if (blockage.attemptedResolutions.length >= strategy.maxRetries) {
        break;
      }

      try {
        await this.executeRecoveryAction(context, blockage, action);
        blockage.attemptedResolutions.push(action.type);
        
        // If successful, remove blockage
        context.blockages.delete(blockage.agentId);
        
        this.emit('recovery:success', {
          agentId: blockage.agentId,
          action: action.type
        });
        
        return;
      } catch (error) {
        blockage.attemptedResolutions.push(`${action.type}_failed`);
      }
    }

    this.emit('recovery:exhausted', {
      agentId: blockage.agentId,
      attempts: blockage.attemptedResolutions
    });
  }

  /**
   * Find recovery strategy for error type
   */
  private findRecoveryStrategy(errorReason: string): RecoveryStrategy | undefined {
    // Match error reason to strategy
    for (const [key, strategy] of this.recoveryStrategies) {
      if (errorReason.toLowerCase().includes(key.replace('_', ' '))) {
        return strategy;
      }
    }
    return undefined;
  }

  /**
   * Execute recovery action
   */
  private async executeRecoveryAction(
    context: CoordinationContext,
    blockage: BlockageInfo,
    action: RecoveryAction
  ): Promise<void> {
    switch (action.type) {
      case 'retry':
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, action.config.delay || 1000));
        // Agent would retry its task
        break;

      case 'fallback':
        // Use fallback approach
        await this.sendMessage('coordinator', blockage.agentId, 'coordination', {
          type: 'use_fallback',
          config: action.config
        });
        break;

      case 'reassign': {
        // Find another agent
        const availableAgent = this.findAvailableAgent(context, action.config.preferredAgentType);
        if (availableAgent) {
          await this.reassignTasks(context, blockage.agentId, availableAgent.id);
        }
        break;
      }

      case 'escalate':
        // Escalate to Queen
        this.emit('escalation:required', {
          blockage,
          action: action.config
        });
        break;
    }
  }

  /**
   * Find available agent of specified type
   */
  private findAvailableAgent(
    context: CoordinationContext,
    preferredType: string
  ): Agent | undefined {
    for (const agent of context.agents.values()) {
      if (agent.status === 'idle' && 
          (preferredType === 'any' || agent.type === preferredType)) {
        return agent;
      }
    }
    return undefined;
  }

  /**
   * Reassign tasks from one agent to another
   */
  private async reassignTasks(
    context: CoordinationContext,
    fromAgentId: string,
    toAgentId: string
  ): Promise<void> {
    // Send reassignment message
    await this.sendMessage('coordinator', toAgentId, 'task_assignment', {
      type: 'reassignment',
      fromAgent: fromAgentId,
      reason: 'agent_blocked'
    });

    this.emit('tasks:reassigned', {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      objectiveId: context.objectiveId
    });
  }

  /**
   * Process pending messages for an agent
   */
  private async processAgentMessages(agentId: string): Promise<void> {
    const messages = await this.getAgentMessages(agentId);
    
    for (const message of messages) {
      this.emit('message:delivered', message);
    }
  }

  /**
   * Evaluate strategy condition
   */
  private evaluateCondition(context: CoordinationContext, condition: string): boolean {
    switch (condition) {
      case 'hasBlockedAgent':
        return context.blockages.size > 0;
      
      case 'allDependenciesSatisfied':
        // Check if all dependencies are satisfied
        for (const deps of context.dependencies.values()) {
          if (!deps.every(d => this.isDependencySatisfied(context, d))) {
            return false;
          }
        }
        return true;
      
      case 'hasIndependentTasks':
        // Check for tasks with no dependencies
        return Array.from(context.dependencies.values()).some(deps => deps.length === 0);
      
      case 'highComplexity':
        // Would need complexity metric
        return context.agents.size > 5;
      
      case 'repeatedFailures':
        // Check for multiple blockages
        return context.blockages.size > 2;
      
      default:
        return false;
    }
  }

  /**
   * Execute strategy action
   */
  private async executeAction(context: CoordinationContext, action: string): Promise<void> {
    switch (action) {
      case 'waitForDependencies':
        // Agents would wait for dependencies
        this.emit('action:wait', { objectiveId: context.objectiveId });
        break;
      
      case 'proceedToNextTask':
        // Signal agents to proceed
        for (const agent of context.agents.values()) {
          await this.sendMessage('coordinator', agent.id, 'coordination', {
            type: 'proceed'
          });
        }
        break;
      
      case 'assignToAvailableAgents': {
        // Distribute tasks to available agents
        const availableAgents = Array.from(context.agents.values())
          .filter(a => a.status === 'idle');
        
        // Would assign tasks here
        this.emit('action:assign', { 
          objectiveId: context.objectiveId,
          agentCount: availableAgents.length
        });
        break;
      }
      
      case 'spawnSpecialistAgent':
        // Request Queen to spawn specialist
        this.emit('action:spawn_specialist', { objectiveId: context.objectiveId });
        break;
      
      case 'switchToFallbackApproach':
        // Signal all agents to use fallback
        for (const agent of context.agents.values()) {
          await this.sendMessage('coordinator', agent.id, 'coordination', {
            type: 'use_fallback'
          });
        }
        break;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get coordinator statistics
   */
  async getStats(): Promise<{
    activeContexts: number;
    totalAgents: number;
    activeHandoffs: number;
    blockedAgents: number;
    messagesInQueue: number;
  }> {
    let totalAgents = 0;
    let activeHandoffs = 0;
    let blockedAgents = 0;
    let messagesInQueue = 0;

    for (const context of this.contexts.values()) {
      totalAgents += context.agents.size;
      activeHandoffs += Array.from(context.handoffs.values())
        .filter(h => h.status === 'pending').length;
      blockedAgents += context.blockages.size;
    }

    for (const queue of this.messageQueue.values()) {
      messagesInQueue += queue.length;
    }

    return {
      activeContexts: this.contexts.size,
      totalAgents,
      activeHandoffs,
      blockedAgents,
      messagesInQueue
    };
  }

  /**
   * Clean up completed contexts
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const [objectiveId, context] of this.contexts) {
      // Check if all agents are terminated and no active handoffs
      const allAgentsIdle = Array.from(context.agents.values())
        .every(a => a.status === 'idle' || a.status === 'completed');
      const noActiveHandoffs = Array.from(context.handoffs.values())
        .every(h => h.status === 'completed' || h.status === 'failed');

      if (allAgentsIdle && noActiveHandoffs) {
        // Check age of last activity
        const lastActivity = Math.max(
          ...Array.from(context.handoffs.values())
            .map(h => h.completedAt?.getTime() || 0)
        );

        if (now - lastActivity > maxAge) {
          this.contexts.delete(objectiveId);
          this.emit('context:cleaned', { objectiveId });
        }
      }
    }
  }
}
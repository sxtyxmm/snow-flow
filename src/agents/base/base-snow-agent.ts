/**
 * Base class for all ServiceNow agents in the adaptive system
 */

import { SnowAgent, AgentType, AgentStatus, Task, ServiceNowContext } from '../../types/snow-flow.types.js';
import { ServiceNowClient } from '../../utils/servicenow-client.js';
import { Logger } from '../../utils/logger.js';
import { EventEmitter } from 'eventemitter3';

export interface AgentCapabilities {
  primarySkills: string[];
  secondarySkills: string[];
  complexity: 'low' | 'medium' | 'high';
  autonomy: 'guided' | 'semi-autonomous' | 'fully-autonomous';
}

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageExecutionTime: number;
  lastActivity: Date;
  errorCount: number;
}

export abstract class BaseSnowAgent extends EventEmitter {
  protected id: string;
  protected name: string;
  protected type: AgentType;
  protected status: AgentStatus;
  protected capabilities: AgentCapabilities;
  protected metrics: AgentMetrics;
  protected client: ServiceNowClient;
  protected logger: Logger;
  protected context: ServiceNowContext | null = null;
  protected currentTask: Task | null = null;
  
  constructor(
    type: AgentType,
    name: string,
    capabilities: AgentCapabilities
  ) {
    super();
    this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = name;
    this.type = type;
    this.status = 'idle';
    this.capabilities = capabilities;
    this.metrics = {
      tasksCompleted: 0,
      successRate: 1.0,
      averageExecutionTime: 0,
      lastActivity: new Date(),
      errorCount: 0
    };
    this.client = new ServiceNowClient();
    this.logger = new Logger(`Agent:${name}`);
  }

  /**
   * Get agent information
   */
  getInfo(): SnowAgent {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities.primarySkills,
      metadata: {
        capabilities: this.capabilities,
        metrics: this.metrics,
        context: this.context
      },
      createdAt: new Date(),
      lastActivity: this.metrics.lastActivity
    };
  }

  /**
   * Set ServiceNow context for the agent
   */
  setContext(context: ServiceNowContext): void {
    this.context = context;
    this.logger.info('Context updated', { context });
  }

  /**
   * Execute a task - must be implemented by subclasses
   */
  abstract execute(task: Task, input?: any): Promise<any>;

  /**
   * Analyze if this agent can handle a specific requirement
   */
  canHandle(requirement: string, complexity: 'low' | 'medium' | 'high' = 'medium'): number {
    // Base scoring algorithm
    let score = 0;
    const normalizedReq = requirement.toLowerCase();
    
    // Primary skills matching
    for (const skill of this.capabilities.primarySkills) {
      if (normalizedReq.includes(skill.toLowerCase())) {
        score += 0.8;
      }
    }
    
    // Secondary skills matching
    for (const skill of this.capabilities.secondarySkills) {
      if (normalizedReq.includes(skill.toLowerCase())) {
        score += 0.4;
      }
    }
    
    // Complexity matching
    const complexityMap = { 'low': 1, 'medium': 2, 'high': 3 };
    const reqComplexity = complexityMap[complexity];
    const agentComplexity = complexityMap[this.capabilities.complexity];
    
    if (agentComplexity >= reqComplexity) {
      score += 0.2;
    } else if (agentComplexity < reqComplexity - 1) {
      score *= 0.5; // Penalize if agent can't handle complexity
    }
    
    // Experience bonus based on success rate
    score *= this.metrics.successRate;
    
    return Math.min(score, 1.0);
  }

  /**
   * Start task execution
   */
  protected async startTask(task: Task): Promise<void> {
    this.currentTask = task;
    this.status = 'busy';
    this.logger.info('Starting task', { taskId: task.id, description: task.description });
    this.emit('task:started', { agentId: this.id, taskId: task.id });
  }

  /**
   * Complete task execution
   */
  protected async completeTask(result: any): Promise<void> {
    if (this.currentTask) {
      this.metrics.tasksCompleted++;
      this.metrics.lastActivity = new Date();
      
      // Update success rate
      const totalTasks = this.metrics.tasksCompleted + this.metrics.errorCount;
      this.metrics.successRate = this.metrics.tasksCompleted / totalTasks;
      
      this.logger.info('Task completed', { 
        taskId: this.currentTask.id, 
        result: typeof result === 'object' ? 'object' : result 
      });
      
      this.emit('task:completed', { 
        agentId: this.id, 
        taskId: this.currentTask.id, 
        result 
      });
      
      this.currentTask = null;
      this.status = 'idle';
    }
  }

  /**
   * Handle task error
   */
  protected async handleError(error: Error): Promise<void> {
    this.metrics.errorCount++;
    this.metrics.lastActivity = new Date();
    
    // Update success rate
    const totalTasks = this.metrics.tasksCompleted + this.metrics.errorCount;
    this.metrics.successRate = this.metrics.tasksCompleted / totalTasks;
    
    this.logger.error('Task failed', { 
      taskId: this.currentTask?.id, 
      error: error.message 
    });
    
    this.emit('task:failed', { 
      agentId: this.id, 
      taskId: this.currentTask?.id, 
      error 
    });
    
    this.status = 'error';
    
    // Reset to idle after a short delay
    setTimeout(() => {
      this.status = 'idle';
    }, 5000);
  }

  /**
   * Terminate the agent
   */
  terminate(): void {
    this.status = 'terminated';
    this.emit('agent:terminated', { agentId: this.id });
    this.removeAllListeners();
  }

  /**
   * Get agent health status
   */
  getHealth(): {
    status: string;
    performance: number;
    load: 'low' | 'medium' | 'high';
    ready: boolean;
  } {
    const performance = this.metrics.successRate * 100;
    const load = this.status === 'busy' ? 'high' : 'low';
    const ready = this.status === 'idle';
    
    return {
      status: this.status,
      performance,
      load,
      ready
    };
  }
}
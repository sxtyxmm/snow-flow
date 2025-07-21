import { EventEmitter } from 'eventemitter3';
import { TaskNode, TaskRequirements, ExecutionPlan, ExecutionPhase, ParallelGroup, CoordinationConfig } from './types';
import { SnowAgent, TaskStatus } from '../types/snow-flow.types';
import { SharedMemoryManager } from './shared-memory';
import { logger } from '../utils/logger';

export class TaskDependencyGraph extends EventEmitter {
  private nodes: Map<string, TaskNode> = new Map();
  private edges: Map<string, Set<string>> = new Map();
  private reverseEdges: Map<string, Set<string>> = new Map();
  private sharedMemory: SharedMemoryManager;
  private config: CoordinationConfig;
  private executionStartTime?: Date;

  constructor(sharedMemory: SharedMemoryManager, config: CoordinationConfig) {
    super();
    this.sharedMemory = sharedMemory;
    this.config = config;
    
    logger.info('📊 Task Dependency Graph initialized');
  }

  addTask(
    taskId: string, 
    agent: SnowAgent, 
    requirements: TaskRequirements,
    dependencies: string[] = []
  ): void {
    try {
      // Create task node
      const node: TaskNode = {
        id: taskId,
        agent,
        requirements,
        status: 'pending',
        result: null,
        retryCount: 0
      };

      this.nodes.set(taskId, node);
      this.edges.set(taskId, new Set(dependencies));

      // Build reverse dependency graph for efficient querying
      for (const dep of dependencies) {
        if (!this.reverseEdges.has(dep)) {
          this.reverseEdges.set(dep, new Set());
        }
        this.reverseEdges.get(dep)!.add(taskId);
      }

      logger.debug('📝 Added task to dependency graph', { 
        taskId, 
        agentId: agent?.id,
        dependencies: dependencies.length 
      });

      this.emit('task:added', { taskId, dependencies });

    } catch (error) {
      logger.error('❌ Failed to add task to dependency graph', { taskId, error: error.message });
      throw error;
    }
  }

  async getReadyTasks(): Promise<TaskNode[]> {
    const ready: TaskNode[] = [];
    
    for (const [taskId, node] of this.nodes) {
      if (node.status === 'pending' && await this.areDependenciesComplete(taskId)) {
        ready.push(node);
      }
    }

    return ready;
  }

  async areDependenciesComplete(taskId: string): Promise<boolean> {
    const dependencies = this.edges.get(taskId) || new Set();
    
    for (const depId of dependencies) {
      const depNode = this.nodes.get(depId);
      if (!depNode || depNode.status !== 'completed') {
        return false;
      }
    }

    return true;
  }

  async executeTask(taskId: string): Promise<any> {
    const node = this.nodes.get(taskId);
    if (!node) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check if already executing or completed
    if (node.status === 'in_progress' || node.status === 'completed') {
      return node.result;
    }

    try {
      logger.info('🚀 Executing task', { taskId, agentId: node.agent?.id });

      node.status = 'in_progress';
      node.startTime = new Date();
      
      this.emit('task:started', { taskId, agentId: node.agent?.id });

      // Store task status in shared memory
      await this.sharedMemory.store(`task_status_${taskId}`, {
        status: 'in_progress',
        startTime: node.startTime,
        agentId: node.agent?.id
      });

      // Get dependency results
      const dependencyResults = await this.getDependencyResults(taskId);

      // Execute the task through the agent
      const result = await this.executeTaskWithRetry(node, dependencyResults);

      // Update node
      node.status = 'completed';
      node.result = result;
      node.endTime = new Date();

      // Store result in shared memory
      await this.sharedMemory.store(`task_result_${taskId}`, result);
      await this.sharedMemory.store(`task_status_${taskId}`, {
        status: 'completed',
        endTime: node.endTime,
        duration: node.endTime.getTime() - node.startTime!.getTime()
      });

      logger.info('✅ Task completed successfully', { 
        taskId, 
        duration: node.endTime.getTime() - node.startTime!.getTime()
      });

      this.emit('task:completed', { taskId, result });

      return result;

    } catch (error) {
      node.status = 'failed';
      node.error = error as Error;
      node.endTime = new Date();

      // Store error in shared memory
      await this.sharedMemory.store(`task_error_${taskId}`, {
        error: error.message,
        timestamp: node.endTime
      });

      logger.error('❌ Task execution failed', { 
        taskId, 
        error: error.message,
        retryCount: node.retryCount
      });

      this.emit('task:failed', { taskId, error });

      // Handle error recovery
      if (this.config.enableRetries && node.retryCount < this.config.maxRetries) {
        await this.scheduleRetry(taskId);
      } else {
        await this.handleTaskFailure(taskId, error as Error);
      }

      throw error;
    }
  }

  private async executeTaskWithRetry(node: TaskNode, dependencyResults: Record<string, any>): Promise<any> {
    const maxRetries = this.config.enableRetries ? this.config.maxRetries : 0;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info('🔄 Retrying task execution', { 
            taskId: node.id, 
            attempt: attempt + 1,
            maxRetries: maxRetries + 1
          });
        }

        // Execute task through agent
        const result = await this.executeAgentTask(node, dependencyResults);
        
        return result;

      } catch (error) {
        node.retryCount = attempt + 1;
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  private async executeAgentTask(node: TaskNode, dependencyResults: Record<string, any>): Promise<any> {
    // This would be the interface to the actual agent execution
    // For now, we'll simulate agent task execution
    
    if (!node.agent) {
      throw new Error(`No agent assigned to task: ${node.id}`);
    }

    // Prepare task context
    const taskContext = {
      taskId: node.id,
      requirements: node.requirements,
      dependencies: dependencyResults,
      sharedMemory: this.sharedMemory
    };

    // Simulate task execution (in real implementation, this would call the agent)
    // TODO: Replace with actual agent task execution interface
    return await this.simulateAgentExecution(node, taskContext);
  }

  private async simulateAgentExecution(node: TaskNode, context: any): Promise<any> {
    // Simulation of agent task execution
    // In real implementation, this would interface with the actual agent system
    
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      taskId: node.id,
      agentId: node.agent?.id,
      outputs: node.requirements.outputs,
      executionTime: delay,
      timestamp: new Date()
    };
  }

  private async scheduleRetry(taskId: string): Promise<void> {
    const node = this.nodes.get(taskId);
    if (!node) return;

    node.status = 'pending';
    
    logger.info('⏰ Scheduled task retry', { taskId, retryCount: node.retryCount });
    
    this.emit('task:retry_scheduled', { taskId, retryCount: node.retryCount });
  }

  private async handleTaskFailure(taskId: string, error: Error): Promise<void> {
    logger.error('💥 Task failed permanently', { taskId, error: error.message });

    switch (this.config.errorRecoveryStrategy) {
      case 'abort':
        this.emit('graph:abort_requested', { failedTask: taskId, error });
        break;
        
      case 'continue':
        // Mark dependent tasks as skipped
        await this.markDependentTasksAsSkipped(taskId);
        break;
        
      case 'retry':
        // Already handled in executeTaskWithRetry
        break;
    }
  }

  private async markDependentTasksAsSkipped(failedTaskId: string): Promise<void> {
    const dependents = this.reverseEdges.get(failedTaskId) || new Set();
    
    for (const dependentId of dependents) {
      const dependentNode = this.nodes.get(dependentId);
      if (dependentNode && dependentNode.status === 'pending') {
        dependentNode.status = 'cancelled';
        
        logger.warn('⏭️ Skipped dependent task due to failure', { 
          taskId: dependentId, 
          failedDependency: failedTaskId 
        });

        // Recursively skip dependents
        await this.markDependentTasksAsSkipped(dependentId);
      }
    }
  }

  async getDependencyResults(taskId: string): Promise<Record<string, any>> {
    const dependencies = this.edges.get(taskId) || new Set();
    const results: Record<string, any> = {};
    
    for (const depId of dependencies) {
      const depNode = this.nodes.get(depId);
      if (depNode && depNode.status === 'completed') {
        results[depId] = depNode.result;
      }
    }
    
    return results;
  }

  async topologicalSort(): Promise<string[][]> {
    const levels: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Calculate in-degrees
    for (const [taskId] of this.nodes) {
      inDegree.set(taskId, (this.edges.get(taskId) || new Set()).size);
    }

    while (visited.size < this.nodes.size) {
      const currentLevel: string[] = [];
      
      // Find tasks with no dependencies
      for (const [taskId] of this.nodes) {
        if (!visited.has(taskId) && inDegree.get(taskId) === 0) {
          currentLevel.push(taskId);
        }
      }
      
      if (currentLevel.length === 0) {
        const remaining = Array.from(this.nodes.keys()).filter(id => !visited.has(id));
        throw new Error(`Circular dependency detected among tasks: ${remaining.join(', ')}`);
      }
      
      levels.push(currentLevel);
      
      // Update in-degrees and mark as visited
      for (const taskId of currentLevel) {
        visited.add(taskId);
        
        const dependents = this.reverseEdges.get(taskId) || new Set();
        for (const dependent of dependents) {
          const currentInDegree = inDegree.get(dependent) || 0;
          inDegree.set(dependent, currentInDegree - 1);
        }
      }
    }
    
    return levels;
  }

  async validateGraph(): Promise<void> {
    try {
      // Check for circular dependencies
      await this.topologicalSort();
      
      // Check that all dependencies exist
      for (const [taskId, dependencies] of this.edges) {
        for (const depId of dependencies) {
          if (!this.nodes.has(depId)) {
            throw new Error(`Task ${taskId} depends on non-existent task: ${depId}`);
          }
        }
      }

      logger.info('✅ Task dependency graph validation passed');

    } catch (error) {
      logger.error('❌ Task dependency graph validation failed', { error: error.message });
      throw error;
    }
  }

  async generateExecutionPlan(): Promise<ExecutionPlan> {
    const levels = await this.topologicalSort();
    const phases: ExecutionPhase[] = [];
    
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      
      phases.push({
        id: `phase_${i}`,
        type: level.length > 1 ? 'parallel' : 'sequential',
        tasks: level,
        estimatedDuration: this.estimatePhaseDuration(level),
        dependencies: i > 0 ? [`phase_${i - 1}`] : []
      });
    }

    const criticalPath = this.findCriticalPath();
    const parallelizationOpportunities = this.findParallelizationOpportunities(levels);

    return {
      phases,
      totalEstimatedTime: phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0),
      criticalPath,
      parallelizationOpportunities
    };
  }

  private estimatePhaseDuration(tasks: string[]): number {
    // Simple estimation - in practice this would be more sophisticated
    return Math.max(...tasks.map(taskId => {
      const node = this.nodes.get(taskId);
      return node?.requirements.constraints?.find(c => c.type === 'time')?.value || 60000; // Default 1 minute
    }));
  }

  private findCriticalPath(): string[] {
    // Simplified critical path calculation
    // In practice, this would use more sophisticated algorithms
    const levels = this.getTopologicalLevels();
    return levels.flat();
  }

  private getTopologicalLevels(): string[][] {
    try {
      return this.topologicalSort() as any;
    } catch {
      return [];
    }
  }

  private findParallelizationOpportunities(levels: string[][]): ParallelGroup[] {
    const opportunities: ParallelGroup[] = [];
    
    for (const level of levels) {
      if (level.length > 1) {
        opportunities.push({
          tasks: level,
          estimatedSavings: (level.length - 1) * this.estimatePhaseDuration(level),
          riskLevel: level.length > 3 ? 'high' : level.length > 1 ? 'medium' : 'low'
        });
      }
    }
    
    return opportunities;
  }

  // Query methods
  getTotalTasks(): number {
    return this.nodes.size;
  }

  getCompletedTasks(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'completed');
  }

  getFailedTasks(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'failed');
  }

  getInProgressTasks(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'in_progress');
  }

  getPendingTasks(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(node => node.status === 'pending');
  }

  getTask(taskId: string): TaskNode | undefined {
    return this.nodes.get(taskId);
  }

  getMaxParallelism(): number {
    try {
      const levels = this.getTopologicalLevels();
      return Math.max(...levels.map(level => level.length));
    } catch {
      return 1;
    }
  }

  getComplexityScore(): number {
    const totalTasks = this.getTotalTasks();
    const totalDependencies = Array.from(this.edges.values())
      .reduce((sum, deps) => sum + deps.size, 0);
    
    // Complexity score between 0 and 1
    return totalTasks > 0 ? Math.min(totalDependencies / (totalTasks * totalTasks), 1) : 0;
  }

  async getExecutionStats(): Promise<ExecutionStats> {
    const total = this.getTotalTasks();
    const completed = this.getCompletedTasks();
    const failed = this.getFailedTasks();
    const inProgress = this.getInProgressTasks();

    return {
      totalTasks: total,
      completedTasks: completed.length,
      failedTasks: failed.length,
      inProgressTasks: inProgress.length,
      averageExecutionTime: completed.length > 0 
        ? completed.reduce((sum, task) => {
            const duration = task.endTime && task.startTime 
              ? task.endTime.getTime() - task.startTime.getTime() 
              : 0;
            return sum + duration;
          }, 0) / completed.length
        : 0,
      totalRetries: Array.from(this.nodes.values()).reduce((sum, node) => sum + node.retryCount, 0)
    };
  }
}

interface ExecutionStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  averageExecutionTime: number;
  totalRetries: number;
}
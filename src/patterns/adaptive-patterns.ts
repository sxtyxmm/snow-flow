/**
 * Adaptive Coordination Patterns - Different execution strategies for dynamic teams
 */

import { Logger } from '../utils/logger.js';
import { BaseSnowAgent } from '../agents/base/base-snow-agent.js';

export interface AdaptiveTeam {
  id: string;
  specialists: Map<string, BaseSnowAgent>;
  coordinator: any;
  taskAnalysis: any;
  executionPlan: ExecutionPlan;
  createdAt: Date;
}

export interface ExecutionPlan {
  strategy: 'sequential' | 'parallel' | 'hybrid';
  steps: ExecutionStep[];
  parallelTasks: ParallelTask[];
  dependencies: TaskDependency[];
  estimatedDuration: number;
}

export interface ExecutionStep {
  id: string;
  agent: string;
  task: any;
  dependencies: string[];
  estimatedTime: number;
  retryPolicy?: RetryPolicy;
}

export interface ParallelTask {
  id: string;
  agent: string;
  task: any;
  canRunInParallel: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskDependency {
  prerequisite: string;
  dependent: string;
  type: 'data' | 'completion' | 'approval';
  transferData?: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface ExecutionResult {
  success: boolean;
  results: Map<string, any>;
  errors: Map<string, Error>;
  executionTime: number;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  metadata: Record<string, any>;
}

export interface CoordinationContext {
  sharedData: Map<string, any>;
  executionState: Map<string, ExecutionStepState>;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
}

export interface ExecutionStepState {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: Error;
  retryCount: number;
}

export interface ErrorHandlingConfig {
  strategy: 'fail_fast' | 'continue_on_error' | 'retry_failed';
  maxRetries: number;
  escalationPath: string[];
  notificationChannels: string[];
}

export interface MonitoringConfig {
  trackProgress: boolean;
  logLevel: 'minimal' | 'detailed' | 'debug';
  metricsCollection: boolean;
  realTimeUpdates: boolean;
}

export class AdaptivePatterns {
  private logger: Logger;
  private activeExecutions: Map<string, CoordinationContext> = new Map();

  constructor() {
    this.logger = new Logger('AdaptivePatterns');
  }

  /**
   * Execute tasks sequentially with dependency management
   */
  async executeSequentialPattern(team: AdaptiveTeam, plan: ExecutionPlan): Promise<ExecutionResult> {
    this.logger.info('Executing sequential pattern', {
      teamId: team.id,
      stepCount: plan.steps.length
    });

    const startTime = Date.now();
    const context = this.initializeContext(team, plan);
    const results = new Map<string, any>();
    const errors = new Map<string, Error>();
    let completedSteps = 0;
    let failedSteps = 0;

    try {
      // Execute steps in order, respecting dependencies
      const sortedSteps = this.topologicalSort(plan.steps, plan.dependencies);
      
      for (const step of sortedSteps) {
        try {
          // Check if dependencies are satisfied
          if (!this.areDependenciesSatisfied(step, context)) {
            throw new Error(`Dependencies not satisfied for step ${step.id}`);
          }

          // Update step state
          this.updateStepState(context, step.id, 'running');

          // Execute the step
          const specialist = team.specialists.get(step.agent);
          if (!specialist) {
            throw new Error(`Specialist ${step.agent} not found in team`);
          }

          // Prepare input data from previous steps and shared context
          const inputData = this.prepareInputData(step, context);
          
          this.logger.info('Executing step', {
            stepId: step.id,
            agent: step.agent,
            dependencies: step.dependencies
          });

          const stepResult = await this.executeStepWithRetry(specialist, step, inputData);
          
          // Store results and update context
          results.set(step.id, stepResult);
          context.sharedData.set(step.id, stepResult);
          this.updateStepState(context, step.id, 'completed', stepResult);
          
          completedSteps++;
          this.logger.info('Step completed successfully', { stepId: step.id });

        } catch (error) {
          failedSteps++;
          const stepError = error as Error;
          errors.set(step.id, stepError);
          this.updateStepState(context, step.id, 'failed', undefined, stepError);
          
          this.logger.error('Step execution failed', {
            stepId: step.id,
            error: stepError.message
          });

          // Handle error based on strategy
          if (context.errorHandling.strategy === 'fail_fast') {
            throw stepError;
          }
          // For 'continue_on_error', we continue to next step
        }
      }

      const executionTime = Date.now() - startTime;
      
      return {
        success: failedSteps === 0,
        results,
        errors,
        executionTime,
        totalSteps: plan.steps.length,
        completedSteps,
        failedSteps,
        metadata: {
          strategy: 'sequential',
          teamId: team.id,
          context: this.serializeContext(context)
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Sequential execution failed', error);
      
      return {
        success: false,
        results,
        errors,
        executionTime,
        totalSteps: plan.steps.length,
        completedSteps,
        failedSteps,
        metadata: {
          strategy: 'sequential',
          teamId: team.id,
          fatalError: (error as Error).message
        }
      };
    } finally {
      this.cleanupContext(team.id);
    }
  }

  /**
   * Execute tasks in parallel where possible
   */
  async executeParallelPattern(team: AdaptiveTeam, plan: ExecutionPlan): Promise<ExecutionResult> {
    this.logger.info('Executing parallel pattern', {
      teamId: team.id,
      parallelTaskCount: plan.parallelTasks.length
    });

    const startTime = Date.now();
    const context = this.initializeContext(team, plan);
    const results = new Map<string, any>();
    const errors = new Map<string, Error>();

    try {
      // Group tasks by priority
      const taskGroups = this.groupTasksByPriority(plan.parallelTasks);
      let completedSteps = 0;
      let failedSteps = 0;

      // Execute each priority group in parallel
      for (const [priority, tasks] of taskGroups) {
        this.logger.info('Executing priority group', { priority, taskCount: tasks.length });
        
        const promises = tasks.map(async (task) => {
          try {
            const specialist = team.specialists.get(task.agent);
            if (!specialist) {
              throw new Error(`Specialist ${task.agent} not found`);
            }

            this.updateStepState(context, task.id, 'running');
            
            const inputData = this.prepareInputData(task, context);
            const result = await specialist.execute({
              id: task.id,
              type: 'custom',
              description: JSON.stringify(task.task),
              priority: 'medium',
              status: 'in_progress',
              assignedAgent: task.agent,
              dependencies: [],
              createdAt: new Date(),
              metadata: task.task
            }, inputData);

            results.set(task.id, result);
            context.sharedData.set(task.id, result);
            this.updateStepState(context, task.id, 'completed', result);
            
            return { taskId: task.id, success: true, result };
            
          } catch (error) {
            const taskError = error as Error;
            errors.set(task.id, taskError);
            this.updateStepState(context, task.id, 'failed', undefined, taskError);
            
            return { taskId: task.id, success: false, error: taskError };
          }
        });

        // Wait for all tasks in this priority group to complete
        const groupResults = await Promise.allSettled(promises);
        
        groupResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              completedSteps++;
            } else {
              failedSteps++;
            }
          } else {
            failedSteps++;
            const taskId = tasks[index].id;
            errors.set(taskId, new Error(result.reason));
          }
        });

        // Check if we should continue based on error handling strategy
        if (failedSteps > 0 && context.errorHandling.strategy === 'fail_fast') {
          break;
        }
      }

      const executionTime = Date.now() - startTime;
      
      return {
        success: failedSteps === 0,
        results,
        errors,
        executionTime,
        totalSteps: plan.parallelTasks.length,
        completedSteps,
        failedSteps,
        metadata: {
          strategy: 'parallel',
          teamId: team.id,
          priorityGroups: taskGroups.size
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Parallel execution failed', error);
      
      return {
        success: false,
        results,
        errors,
        executionTime,
        totalSteps: plan.parallelTasks.length,
        completedSteps: 0,
        failedSteps: plan.parallelTasks.length,
        metadata: {
          strategy: 'parallel',
          teamId: team.id,
          fatalError: (error as Error).message
        }
      };
    } finally {
      this.cleanupContext(team.id);
    }
  }

  /**
   * Execute hybrid pattern - combination of sequential and parallel
   */
  async executeHybridPattern(team: AdaptiveTeam, plan: ExecutionPlan): Promise<ExecutionResult> {
    this.logger.info('Executing hybrid pattern', {
      teamId: team.id,
      sequentialSteps: plan.steps.length,
      parallelTasks: plan.parallelTasks.length
    });

    const startTime = Date.now();
    const context = this.initializeContext(team, plan);
    const allResults = new Map<string, any>();
    const allErrors = new Map<string, Error>();
    let totalCompleted = 0;
    let totalFailed = 0;

    try {
      // Phase 1: Execute sequential steps that have dependencies
      if (plan.steps.length > 0) {
        this.logger.info('Executing sequential phase');
        
        const sequentialResult = await this.executeSequentialPattern(team, {
          ...plan,
          parallelTasks: [] // Only sequential for this phase
        });

        // Merge results
        sequentialResult.results.forEach((value, key) => allResults.set(key, value));
        sequentialResult.errors.forEach((value, key) => allErrors.set(key, value));
        totalCompleted += sequentialResult.completedSteps;
        totalFailed += sequentialResult.failedSteps;

        // Check if we should continue
        if (!sequentialResult.success && context.errorHandling.strategy === 'fail_fast') {
          throw new Error('Sequential phase failed, aborting hybrid execution');
        }
      }

      // Phase 2: Execute parallel tasks that can run independently
      if (plan.parallelTasks.length > 0) {
        this.logger.info('Executing parallel phase');
        
        const parallelResult = await this.executeParallelPattern(team, {
          ...plan,
          steps: [] // Only parallel for this phase
        });

        // Merge results
        parallelResult.results.forEach((value, key) => allResults.set(key, value));
        parallelResult.errors.forEach((value, key) => allErrors.set(key, value));
        totalCompleted += parallelResult.completedSteps;
        totalFailed += parallelResult.failedSteps;
      }

      const executionTime = Date.now() - startTime;
      const totalSteps = plan.steps.length + plan.parallelTasks.length;
      
      return {
        success: totalFailed === 0,
        results: allResults,
        errors: allErrors,
        executionTime,
        totalSteps,
        completedSteps: totalCompleted,
        failedSteps: totalFailed,
        metadata: {
          strategy: 'hybrid',
          teamId: team.id,
          phases: ['sequential', 'parallel'],
          sequentialSteps: plan.steps.length,
          parallelTasks: plan.parallelTasks.length
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Hybrid execution failed', error);
      
      return {
        success: false,
        results: allResults,
        errors: allErrors,
        executionTime,
        totalSteps: plan.steps.length + plan.parallelTasks.length,
        completedSteps: totalCompleted,
        failedSteps: totalFailed,
        metadata: {
          strategy: 'hybrid',
          teamId: team.id,
          fatalError: (error as Error).message
        }
      };
    } finally {
      this.cleanupContext(team.id);
    }
  }

  /**
   * Initialize coordination context
   */
  private initializeContext(team: AdaptiveTeam, plan: ExecutionPlan): CoordinationContext {
    const context: CoordinationContext = {
      sharedData: new Map(),
      executionState: new Map(),
      errorHandling: {
        strategy: 'continue_on_error',
        maxRetries: 3,
        escalationPath: ['team-lead', 'manager'],
        notificationChannels: ['email']
      },
      monitoring: {
        trackProgress: true,
        logLevel: 'detailed',
        metricsCollection: true,
        realTimeUpdates: true
      }
    };

    // Initialize step states
    plan.steps.forEach(step => {
      context.executionState.set(step.id, {
        status: 'pending',
        retryCount: 0
      });
    });

    plan.parallelTasks.forEach(task => {
      context.executionState.set(task.id, {
        status: 'pending',
        retryCount: 0
      });
    });

    this.activeExecutions.set(team.id, context);
    return context;
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(steps: ExecutionStep[], dependencies: TaskDependency[]): ExecutionStep[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize graph
    steps.forEach(step => {
      graph.set(step.id, []);
      inDegree.set(step.id, 0);
    });
    
    // Build dependency graph
    dependencies.forEach(dep => {
      const prereqList = graph.get(dep.prerequisite) || [];
      prereqList.push(dep.dependent);
      graph.set(dep.prerequisite, prereqList);
      
      const currentDegree = inDegree.get(dep.dependent) || 0;
      inDegree.set(dep.dependent, currentDegree + 1);
    });
    
    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: ExecutionStep[] = [];
    
    // Find nodes with no incoming edges
    inDegree.forEach((degree, stepId) => {
      if (degree === 0) {
        queue.push(stepId);
      }
    });
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentStep = steps.find(s => s.id === currentId);
      if (currentStep) {
        result.push(currentStep);
      }
      
      const neighbors = graph.get(currentId) || [];
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighborId);
        }
      });
    }
    
    return result;
  }

  /**
   * Check if step dependencies are satisfied
   */
  private areDependenciesSatisfied(step: ExecutionStep, context: CoordinationContext): boolean {
    return step.dependencies.every(depId => {
      const depState = context.executionState.get(depId);
      return depState && depState.status === 'completed';
    });
  }

  /**
   * Prepare input data for step execution
   */
  private prepareInputData(step: ExecutionStep | ParallelTask, context: CoordinationContext): any {
    const inputData: any = {
      sharedContext: Object.fromEntries(context.sharedData),
      stepConfig: step.task
    };

    // Add dependency outputs if this is a sequential step
    if ('dependencies' in step) {
      step.dependencies.forEach(depId => {
        const depResult = context.sharedData.get(depId);
        if (depResult) {
          inputData[`${depId}_output`] = depResult;
        }
      });
    }

    return inputData;
  }

  /**
   * Execute step with retry logic
   */
  private async executeStepWithRetry(
    specialist: BaseSnowAgent,
    step: ExecutionStep,
    inputData: any
  ): Promise<any> {
    const retryPolicy = step.retryPolicy || {
      maxRetries: 3,
      baseDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const result = await specialist.execute({
          id: step.id,
          type: 'custom',
          description: JSON.stringify(step.task),
          priority: 'medium',
          status: 'in_progress',
          assignedAgent: step.agent,
          dependencies: step.dependencies,
          createdAt: new Date(),
          metadata: step.task
        }, inputData);
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryPolicy.maxRetries) {
          const delay = Math.min(
            retryPolicy.baseDelay * Math.pow(retryPolicy.backoffMultiplier, attempt),
            retryPolicy.maxDelay
          );
          
          this.logger.warn('Step execution failed, retrying', {
            stepId: step.id,
            attempt: attempt + 1,
            delay,
            error: lastError.message
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Step execution failed after all retries');
  }

  /**
   * Update step execution state
   */
  private updateStepState(
    context: CoordinationContext,
    stepId: string,
    status: ExecutionStepState['status'],
    result?: any,
    error?: Error
  ): void {
    const currentState = context.executionState.get(stepId);
    if (currentState) {
      currentState.status = status;
      if (status === 'running') {
        currentState.startTime = new Date();
      } else if (status === 'completed' || status === 'failed') {
        currentState.endTime = new Date();
        currentState.result = result;
        currentState.error = error;
      }
      
      context.executionState.set(stepId, currentState);
    }
  }

  /**
   * Group parallel tasks by priority
   */
  private groupTasksByPriority(tasks: ParallelTask[]): Map<string, ParallelTask[]> {
    const groups = new Map<string, ParallelTask[]>();
    
    tasks.forEach(task => {
      const priority = task.priority || 'medium';
      const group = groups.get(priority) || [];
      group.push(task);
      groups.set(priority, group);
    });
    
    // Return in priority order: high, medium, low
    const orderedGroups = new Map<string, ParallelTask[]>();
    ['high', 'medium', 'low'].forEach(priority => {
      if (groups.has(priority)) {
        orderedGroups.set(priority, groups.get(priority)!);
      }
    });
    
    return orderedGroups;
  }

  /**
   * Serialize context for result metadata
   */
  private serializeContext(context: CoordinationContext): any {
    return {
      sharedDataKeys: Array.from(context.sharedData.keys()),
      executionStates: Object.fromEntries(
        Array.from(context.executionState.entries()).map(([key, state]) => [
          key,
          {
            status: state.status,
            retryCount: state.retryCount,
            hasResult: !!state.result,
            hasError: !!state.error
          }
        ])
      ),
      errorHandling: context.errorHandling,
      monitoring: context.monitoring
    };
  }

  /**
   * Cleanup context resources
   */
  private cleanupContext(teamId: string): void {
    this.activeExecutions.delete(teamId);
    this.logger.info('Context cleaned up', { teamId });
  }

  /**
   * Get current execution status for monitoring
   */
  getExecutionStatus(teamId: string): any {
    const context = this.activeExecutions.get(teamId);
    if (!context) {
      return null;
    }
    
    return {
      teamId,
      activeSteps: Array.from(context.executionState.entries())
        .filter(([_, state]) => state.status === 'running')
        .map(([id, _]) => id),
      completedSteps: Array.from(context.executionState.entries())
        .filter(([_, state]) => state.status === 'completed')
        .length,
      failedSteps: Array.from(context.executionState.entries())
        .filter(([_, state]) => state.status === 'failed')
        .length,
      sharedDataSize: context.sharedData.size
    };
  }
}
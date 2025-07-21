import { EventEmitter } from 'eventemitter3';
import { BaseTeam, CoordinationConfig } from './types';
import { TaskDependencyGraph } from './task-dependencies';
import { QualityGateManager } from './quality-gates';
import { ProgressMonitor } from './progress-monitor';
import { logger } from '../utils/logger';

export abstract class ExecutionPattern extends EventEmitter {
  protected qualityGates: QualityGateManager;
  protected progressMonitor: ProgressMonitor;
  protected config: CoordinationConfig;

  constructor(
    qualityGates: QualityGateManager, 
    progressMonitor: ProgressMonitor, 
    config: CoordinationConfig
  ) {
    super();
    this.qualityGates = qualityGates;
    this.progressMonitor = progressMonitor;
    this.config = config;
  }

  abstract execute(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<Record<string, any>>;

  protected async executeTaskWithQualityGates(
    taskId: string, 
    taskGraph: TaskDependencyGraph
  ): Promise<any> {
    try {
      // Execute the task
      const result = await taskGraph.executeTask(taskId);

      // Run quality gates if enabled
      if (this.config.enableQualityGates) {
        const gateResult = await this.qualityGates.validateTask(taskId, result);
        
        if (!gateResult.passed && gateResult.blocking) {
          throw new Error(`Quality gate failed for task ${taskId}: ${gateResult.validations.map(v => v.error).join('; ')}`);
        }

        // Store quality gate results
        return {
          ...result,
          qualityGates: gateResult
        };
      }

      return result;

    } catch (error) {
      logger.error('❌ Task execution with quality gates failed', { 
        taskId, 
        error: error.message 
      });
      throw error;
    }
  }

  protected async waitForAvailableSlot(currentTasks: Set<string>): Promise<void> {
    while (currentTasks.size >= this.config.maxConcurrentTasks) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

export class SequentialExecutionPattern extends ExecutionPattern {
  async execute(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<Record<string, any>> {
    logger.info('🚶‍♂️ Starting sequential execution pattern');
    
    const result: Record<string, any> = {};
    const executionOrder = await this.getSequentialOrder(taskGraph);
    
    let completedTasks = 0;
    const totalTasks = executionOrder.length;

    for (const taskId of executionOrder) {
      try {
        logger.info('🔄 Executing task sequentially', { 
          taskId, 
          progress: `${completedTasks + 1}/${totalTasks}` 
        });

        const taskResult = await this.executeTaskWithQualityGates(taskId, taskGraph);
        result[taskId] = taskResult;
        completedTasks++;

        this.emit('task:completed', { 
          taskId, 
          result: taskResult, 
          progress: completedTasks / totalTasks 
        });

        logger.info('✅ Task completed sequentially', { 
          taskId, 
          remainingTasks: totalTasks - completedTasks 
        });

      } catch (error) {
        logger.error('❌ Sequential task execution failed', { 
          taskId, 
          error: error.message 
        });

        this.emit('task:failed', { taskId, error });

        // Handle error based on recovery strategy
        if (this.config.errorRecoveryStrategy === 'abort') {
          throw error;
        }
        // Continue with next task for 'continue' strategy
      }
    }

    logger.info('🏁 Sequential execution completed', { 
      completedTasks, 
      totalTasks 
    });

    return result;
  }

  private async getSequentialOrder(taskGraph: TaskDependencyGraph): Promise<string[]> {
    const levels = await taskGraph.topologicalSort();
    return levels.flat();
  }
}

export class ParallelExecutionPattern extends ExecutionPattern {
  async execute(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<Record<string, any>> {
    logger.info('🏃‍♂️ Starting parallel execution pattern');
    
    const result: Record<string, any> = {};
    const executionLevels = await taskGraph.topologicalSort();
    
    let totalCompleted = 0;
    const totalTasks = executionLevels.flat().length;

    for (let levelIndex = 0; levelIndex < executionLevels.length; levelIndex++) {
      const level = executionLevels[levelIndex];
      
      logger.info('🚀 Executing parallel level', { 
        level: levelIndex + 1, 
        tasks: level, 
        parallelTasks: level.length 
      });

      try {
        // Execute all tasks in the level in parallel
        const levelTasks = level.map(taskId => 
          this.executeTaskWithQualityGates(taskId, taskGraph)
            .then(taskResult => ({ taskId, result: taskResult }))
            .catch(error => ({ taskId, error }))
        );

        const levelResults = await Promise.allSettled(levelTasks);
        
        // Process results
        for (const settled of levelResults) {
          if (settled.status === 'fulfilled') {
            const { taskId, result: taskResult, error } = settled.value;
            
            if (error) {
              logger.error('❌ Parallel task failed', { taskId, error: error.message });
              this.emit('task:failed', { taskId, error });
              
              if (this.config.errorRecoveryStrategy === 'abort') {
                throw error;
              }
            } else {
              result[taskId] = taskResult;
              totalCompleted++;
              
              this.emit('task:completed', { 
                taskId, 
                result: taskResult, 
                progress: totalCompleted / totalTasks 
              });
              
              logger.info('✅ Parallel task completed', { taskId });
            }
          }
        }

        logger.info('✅ Parallel level completed', { 
          level: levelIndex + 1, 
          completedTasks: level.length 
        });

      } catch (error) {
        logger.error('❌ Parallel level execution failed', { 
          level: levelIndex + 1, 
          error: error.message 
        });
        
        if (this.config.errorRecoveryStrategy === 'abort') {
          throw error;
        }
      }
    }

    logger.info('🏁 Parallel execution completed', { 
      totalCompleted, 
      totalTasks,
      levels: executionLevels.length
    });

    return result;
  }
}

export class HybridExecutionPattern extends ExecutionPattern {
  async execute(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<Record<string, any>> {
    logger.info('🤸‍♂️ Starting hybrid execution pattern');
    
    const result: Record<string, any> = {};
    const optimizedPlan = await this.optimizeExecutionPlan(taskGraph);
    
    let totalCompleted = 0;
    const totalTasks = taskGraph.getTotalTasks();

    for (let phaseIndex = 0; phaseIndex < optimizedPlan.phases.length; phaseIndex++) {
      const phase = optimizedPlan.phases[phaseIndex];
      
      logger.info('🔄 Executing hybrid phase', { 
        phase: phaseIndex + 1, 
        type: phase.type, 
        tasks: phase.tasks.length 
      });

      try {
        if (phase.type === 'parallel') {
          await this.executeParallelPhase(phase.tasks, taskGraph, result);
        } else {
          await this.executeSequentialPhase(phase.tasks, taskGraph, result);
        }

        totalCompleted += phase.tasks.length;
        
        this.emit('phase:completed', { 
          phase: phaseIndex + 1, 
          type: phase.type, 
          progress: totalCompleted / totalTasks 
        });

      } catch (error) {
        logger.error('❌ Hybrid phase execution failed', { 
          phase: phaseIndex + 1, 
          error: error.message 
        });
        
        if (this.config.errorRecoveryStrategy === 'abort') {
          throw error;
        }
      }
    }

    logger.info('🏁 Hybrid execution completed', { 
      totalCompleted, 
      totalTasks,
      phases: optimizedPlan.phases.length
    });

    return result;
  }

  private async optimizeExecutionPlan(taskGraph: TaskDependencyGraph): Promise<OptimizedExecutionPlan> {
    const levels = await taskGraph.topologicalSort();
    const phases: OptimizedPhase[] = [];

    for (const level of levels) {
      if (level.length === 1) {
        // Single task - run sequentially
        phases.push({
          type: 'sequential',
          tasks: level,
          estimatedDuration: this.estimateTaskDuration(level[0], taskGraph),
          riskLevel: 'low'
        });
      } else {
        // Multiple tasks - analyze for optimization
        const riskLevel = this.assessParallelRisk(level, taskGraph);
        
        if (riskLevel === 'high' || level.length > this.config.maxConcurrentTasks) {
          // Break into smaller parallel groups or sequential
          phases.push(...this.optimizeLargeLevel(level, taskGraph));
        } else {
          // Run in parallel
          phases.push({
            type: 'parallel',
            tasks: level,
            estimatedDuration: Math.max(...level.map(taskId => this.estimateTaskDuration(taskId, taskGraph))),
            riskLevel
          });
        }
      }
    }

    return {
      phases,
      totalEstimatedTime: phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0),
      optimizationStrategy: 'hybrid'
    };
  }

  private optimizeLargeLevel(tasks: string[], taskGraph: TaskDependencyGraph): OptimizedPhase[] {
    const phases: OptimizedPhase[] = [];
    const maxParallel = this.config.maxConcurrentTasks;
    
    // Split into chunks that can run in parallel
    for (let i = 0; i < tasks.length; i += maxParallel) {
      const chunk = tasks.slice(i, i + maxParallel);
      
      phases.push({
        type: 'parallel',
        tasks: chunk,
        estimatedDuration: Math.max(...chunk.map(taskId => this.estimateTaskDuration(taskId, taskGraph))),
        riskLevel: this.assessParallelRisk(chunk, taskGraph)
      });
    }
    
    return phases;
  }

  private async executeParallelPhase(
    tasks: string[], 
    taskGraph: TaskDependencyGraph, 
    result: Record<string, any>
  ): Promise<void> {
    const parallelTasks = tasks.map(taskId => 
      this.executeTaskWithQualityGates(taskId, taskGraph)
        .then(taskResult => {
          result[taskId] = taskResult;
          this.emit('task:completed', { taskId, result: taskResult });
          return { taskId, success: true };
        })
        .catch(error => {
          this.emit('task:failed', { taskId, error });
          if (this.config.errorRecoveryStrategy === 'abort') {
            throw error;
          }
          return { taskId, success: false, error };
        })
    );

    await Promise.all(parallelTasks);
  }

  private async executeSequentialPhase(
    tasks: string[], 
    taskGraph: TaskDependencyGraph, 
    result: Record<string, any>
  ): Promise<void> {
    for (const taskId of tasks) {
      try {
        const taskResult = await this.executeTaskWithQualityGates(taskId, taskGraph);
        result[taskId] = taskResult;
        this.emit('task:completed', { taskId, result: taskResult });
      } catch (error) {
        this.emit('task:failed', { taskId, error });
        if (this.config.errorRecoveryStrategy === 'abort') {
          throw error;
        }
      }
    }
  }

  private estimateTaskDuration(taskId: string, taskGraph: TaskDependencyGraph): number {
    const task = taskGraph.getTask(taskId);
    if (!task) return 60000; // Default 1 minute

    // Look for time constraints
    const timeConstraint = task.requirements.constraints?.find(c => c.type === 'time');
    if (timeConstraint) {
      return timeConstraint.value;
    }

    // Estimate based on task complexity
    const complexity = task.requirements.capabilities?.length || 1;
    return Math.min(complexity * 30000, 300000); // 30s per capability, max 5 minutes
  }

  private assessParallelRisk(tasks: string[], taskGraph: TaskDependencyGraph): 'low' | 'medium' | 'high' {
    // Assess risk based on resource requirements
    let resourceConflicts = 0;
    const requiredResources = new Set<string>();

    for (const taskId of tasks) {
      const task = taskGraph.getTask(taskId);
      if (!task) continue;

      const resources = task.requirements.resources || [];
      for (const resource of resources) {
        const resourceKey = `${resource.type}:${resource.metadata?.identifier || 'default'}`;
        if (requiredResources.has(resourceKey)) {
          resourceConflicts++;
        }
        requiredResources.add(resourceKey);
      }
    }

    if (resourceConflicts > 2 || tasks.length > 5) return 'high';
    if (resourceConflicts > 0 || tasks.length > 3) return 'medium';
    return 'low';
  }
}

export class AdaptiveExecutionPattern extends ExecutionPattern {
  private performanceHistory: Map<string, PerformanceMetrics> = new Map();
  
  async execute(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<Record<string, any>> {
    logger.info('🧠 Starting adaptive execution pattern');
    
    const result: Record<string, any> = {};
    let currentStrategy: 'sequential' | 'parallel' | 'hybrid' = 'hybrid';
    
    const levels = await taskGraph.topologicalSort();
    let totalCompleted = 0;
    const totalTasks = levels.flat().length;

    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      
      // Adapt strategy based on performance history and current conditions
      const adaptedStrategy = await this.adaptStrategy(level, taskGraph);
      
      if (adaptedStrategy !== currentStrategy) {
        logger.info('🔄 Adapting execution strategy', { 
          from: currentStrategy, 
          to: adaptedStrategy, 
          level: levelIndex + 1 
        });
        currentStrategy = adaptedStrategy;
      }

      const startTime = Date.now();
      
      try {
        switch (currentStrategy) {
          case 'sequential':
            await this.executeSequentialLevel(level, taskGraph, result);
            break;
          case 'parallel':
            await this.executeParallelLevel(level, taskGraph, result);
            break;
          case 'hybrid':
            await this.executeHybridLevel(level, taskGraph, result);
            break;
        }

        const executionTime = Date.now() - startTime;
        this.recordPerformanceMetrics(levelIndex, currentStrategy, level.length, executionTime, true);
        
        totalCompleted += level.length;

      } catch (error) {
        const executionTime = Date.now() - startTime;
        this.recordPerformanceMetrics(levelIndex, currentStrategy, level.length, executionTime, false);
        
        logger.error('❌ Adaptive level execution failed', { 
          level: levelIndex + 1, 
          strategy: currentStrategy, 
          error: error.message 
        });
        
        if (this.config.errorRecoveryStrategy === 'abort') {
          throw error;
        }
      }
    }

    logger.info('🏁 Adaptive execution completed', { 
      totalCompleted, 
      totalTasks,
      finalStrategy: currentStrategy
    });

    return result;
  }

  private async adaptStrategy(
    level: string[], 
    taskGraph: TaskDependencyGraph
  ): Promise<'sequential' | 'parallel' | 'hybrid'> {
    const levelSize = level.length;
    const complexity = this.calculateLevelComplexity(level, taskGraph);
    const riskLevel = this.assessParallelRisk(level, taskGraph);
    const historicalPerformance = this.getHistoricalPerformance();

    // Decision matrix based on multiple factors
    if (levelSize === 1) {
      return 'sequential';
    }

    if (riskLevel === 'high' || complexity > 0.8) {
      return 'sequential';
    }

    if (levelSize <= 3 && riskLevel === 'low' && historicalPerformance.parallelSuccessRate > 0.8) {
      return 'parallel';
    }

    if (levelSize > this.config.maxConcurrentTasks || complexity > 0.6) {
      return 'hybrid';
    }

    // Default to parallel for medium-sized, low-risk levels
    return historicalPerformance.parallelSuccessRate > 0.6 ? 'parallel' : 'hybrid';
  }

  private calculateLevelComplexity(level: string[], taskGraph: TaskDependencyGraph): number {
    let totalComplexity = 0;
    
    for (const taskId of level) {
      const task = taskGraph.getTask(taskId);
      if (!task) continue;
      
      const capabilities = task.requirements.capabilities?.length || 1;
      const resources = task.requirements.resources?.length || 1;
      const constraints = task.requirements.constraints?.length || 0;
      
      totalComplexity += (capabilities + resources + constraints) / 10;
    }
    
    return Math.min(totalComplexity / level.length, 1);
  }

  private async executeSequentialLevel(
    level: string[], 
    taskGraph: TaskDependencyGraph, 
    result: Record<string, any>
  ): Promise<void> {
    for (const taskId of level) {
      const taskResult = await this.executeTaskWithQualityGates(taskId, taskGraph);
      result[taskId] = taskResult;
    }
  }

  private async executeParallelLevel(
    level: string[], 
    taskGraph: TaskDependencyGraph, 
    result: Record<string, any>
  ): Promise<void> {
    const tasks = level.map(taskId => 
      this.executeTaskWithQualityGates(taskId, taskGraph)
        .then(taskResult => {
          result[taskId] = taskResult;
          return taskResult;
        })
    );
    
    await Promise.all(tasks);
  }

  private async executeHybridLevel(
    level: string[], 
    taskGraph: TaskDependencyGraph, 
    result: Record<string, any>
  ): Promise<void> {
    const maxParallel = Math.min(level.length, this.config.maxConcurrentTasks);
    
    for (let i = 0; i < level.length; i += maxParallel) {
      const chunk = level.slice(i, i + maxParallel);
      await this.executeParallelLevel(chunk, taskGraph, result);
    }
  }

  private recordPerformanceMetrics(
    level: number, 
    strategy: string, 
    taskCount: number, 
    executionTime: number, 
    success: boolean
  ): void {
    const key = `${strategy}_${taskCount}`;
    const existing = this.performanceHistory.get(key) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      averageTime: 0,
      bestTime: Infinity,
      worstTime: 0
    };

    existing.totalExecutions++;
    if (success) {
      existing.successfulExecutions++;
    }
    
    existing.averageTime = (existing.averageTime * (existing.totalExecutions - 1) + executionTime) / existing.totalExecutions;
    existing.bestTime = Math.min(existing.bestTime, executionTime);
    existing.worstTime = Math.max(existing.worstTime, executionTime);

    this.performanceHistory.set(key, existing);
  }

  private getHistoricalPerformance(): { parallelSuccessRate: number; hybridSuccessRate: number } {
    let parallelTotal = 0, parallelSuccess = 0;
    let hybridTotal = 0, hybridSuccess = 0;

    for (const [key, metrics] of this.performanceHistory) {
      if (key.startsWith('parallel_')) {
        parallelTotal += metrics.totalExecutions;
        parallelSuccess += metrics.successfulExecutions;
      } else if (key.startsWith('hybrid_')) {
        hybridTotal += metrics.totalExecutions;
        hybridSuccess += metrics.successfulExecutions;
      }
    }

    return {
      parallelSuccessRate: parallelTotal > 0 ? parallelSuccess / parallelTotal : 0.5,
      hybridSuccessRate: hybridTotal > 0 ? hybridSuccess / hybridTotal : 0.7
    };
  }

  private assessParallelRisk(tasks: string[], taskGraph: TaskDependencyGraph): 'low' | 'medium' | 'high' {
    // Implementation similar to HybridExecutionPattern
    let resourceConflicts = 0;
    const requiredResources = new Set<string>();

    for (const taskId of tasks) {
      const task = taskGraph.getTask(taskId);
      if (!task) continue;

      const resources = task.requirements.resources || [];
      for (const resource of resources) {
        const resourceKey = `${resource.type}:${resource.metadata?.identifier || 'default'}`;
        if (requiredResources.has(resourceKey)) {
          resourceConflicts++;
        }
        requiredResources.add(resourceKey);
      }
    }

    if (resourceConflicts > 2 || tasks.length > 5) return 'high';
    if (resourceConflicts > 0 || tasks.length > 3) return 'medium';
    return 'low';
  }
}

// Supporting interfaces
interface OptimizedExecutionPlan {
  phases: OptimizedPhase[];
  totalEstimatedTime: number;
  optimizationStrategy: string;
}

interface OptimizedPhase {
  type: 'sequential' | 'parallel';
  tasks: string[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface PerformanceMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  averageTime: number;
  bestTime: number;
  worstTime: number;
}
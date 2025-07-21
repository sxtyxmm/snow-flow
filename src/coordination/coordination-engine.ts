import { EventEmitter } from 'eventemitter3';
import { SharedMemoryManager } from './shared-memory';
import { TaskDependencyGraph } from './task-dependencies';
import { QualityGateManager } from './quality-gates';
import { ProgressMonitor } from './progress-monitor';
import { SequentialExecutionPattern, ParallelExecutionPattern, HybridExecutionPattern } from './execution-patterns';
import { 
  CoordinationResult, 
  TaskSpecification, 
  BaseTeam, 
  CoordinationConfig,
  ExecutionMetrics,
  ExecutionPlan
} from './types';
import { logger } from '../utils/logger';

export class CoordinationEngine extends EventEmitter {
  private sharedMemory: SharedMemoryManager;
  private qualityGates: QualityGateManager;
  private progressMonitor: ProgressMonitor;
  private config: CoordinationConfig;

  constructor(config: Partial<CoordinationConfig> = {}) {
    super();
    
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 300000, // 5 minutes
      enableRetries: true,
      maxRetries: 3,
      enableQualityGates: true,
      enableProgressMonitoring: true,
      executionPattern: 'auto',
      memoryTtl: 3600000, // 1 hour
      errorRecoveryStrategy: 'retry',
      ...config
    };

    this.sharedMemory = new SharedMemoryManager(this.config.memoryTtl);
    this.qualityGates = new QualityGateManager();
    this.progressMonitor = new ProgressMonitor();

    logger.info('🚀 Coordination Engine initialized', { config: this.config });
  }

  async coordinateTeamExecution(
    team: BaseTeam, 
    specification: TaskSpecification
  ): Promise<CoordinationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🎯 Starting team coordination', { 
        specification: specification.name,
        tasks: specification.tasks.length 
      });

      // Initialize shared context
      await this.initializeSharedContext(specification);

      // Create and optimize task dependency graph
      const taskGraph = await this.createTaskGraph(team, specification);

      // Setup quality gates
      await this.setupQualityGates(specification);

      // Start progress monitoring
      if (this.config.enableProgressMonitoring) {
        await this.progressMonitor.startMonitoring(team, taskGraph);
      }

      // Execute coordinated tasks
      const results = await this.executeCoordinatedTasks(team, taskGraph, specification);

      // Validate final result
      const finalValidation = await this.validateFinalResult(results, specification);

      const metrics = this.calculateMetrics(taskGraph, startTime);

      return {
        success: true,
        results,
        metrics,
        errors: [],
        warnings: finalValidation.warnings || []
      };

    } catch (error) {
      logger.error('❌ Team coordination failed', { error: error.message });
      
      return {
        success: false,
        results: {},
        metrics: this.calculateErrorMetrics(startTime),
        errors: [error as Error],
        warnings: []
      };
    }
  }

  private async initializeSharedContext(specification: TaskSpecification): Promise<void> {
    logger.info('🧠 Initializing shared context');
    
    // Store specification in shared memory
    await this.sharedMemory.store('task_specification', specification);
    
    // Initialize shared context variables
    for (const [key, value] of Object.entries(specification.sharedContext)) {
      await this.sharedMemory.store(`context_${key}`, value);
    }

    // Create coordination namespace
    await this.sharedMemory.store('coordination_metadata', {
      startTime: new Date(),
      totalTasks: specification.tasks.length,
      executionId: Math.random().toString(36).substr(2, 9)
    });
  }

  private async createTaskGraph(team: BaseTeam, specification: TaskSpecification): Promise<TaskDependencyGraph> {
    logger.info('📊 Creating task dependency graph');
    
    const taskGraph = new TaskDependencyGraph(this.sharedMemory, this.config);

    // Add tasks to graph
    for (const taskDef of specification.tasks) {
      // Find appropriate agent
      const agent = this.findBestAgent(team, taskDef);
      if (!agent) {
        throw new Error(`No suitable agent found for task: ${taskDef.id} (requires: ${taskDef.agentType})`);
      }

      taskGraph.addTask(
        taskDef.id,
        agent,
        taskDef.requirements,
        taskDef.dependencies
      );
    }

    // Validate graph for circular dependencies
    await taskGraph.validateGraph();

    logger.info('✅ Task dependency graph created', { 
      totalTasks: specification.tasks.length,
      maxParallelism: await taskGraph.getMaxParallelism()
    });

    return taskGraph;
  }

  private findBestAgent(team: BaseTeam, taskDef: any): any {
    // Get agents of the required type
    const candidates = team.getAgentsByType(taskDef.agentType);
    
    if (candidates.length === 0) {
      return null;
    }

    // Simple selection: first available agent
    // TODO: Implement more sophisticated agent selection algorithm
    return candidates.find(agent => agent.status === 'idle') || candidates[0];
  }

  private async setupQualityGates(specification: TaskSpecification): Promise<void> {
    if (!this.config.enableQualityGates) {
      return;
    }

    logger.info('🛡️ Setting up quality gates');

    for (const gateConfig of specification.qualityGates) {
      for (const taskId of gateConfig.taskIds) {
        for (const gate of gateConfig.gates) {
          this.qualityGates.addGate(taskId, gate);
        }
      }
    }
  }

  private async executeCoordinatedTasks(
    team: BaseTeam, 
    taskGraph: TaskDependencyGraph,
    specification: TaskSpecification
  ): Promise<Record<string, any>> {
    logger.info('🚀 Starting coordinated task execution');

    // Select execution pattern
    const executionPattern = this.selectExecutionPattern(taskGraph, specification);
    
    logger.info('📋 Execution pattern selected', { pattern: executionPattern.constructor.name });

    // Execute tasks
    const results = await executionPattern.execute(team, taskGraph);

    // Emit completion event
    this.emit('coordination:completed', { results, taskGraph });

    return results;
  }

  private selectExecutionPattern(taskGraph: TaskDependencyGraph, specification: TaskSpecification): any {
    const patternType = specification.executionPattern || this.config.executionPattern;

    switch (patternType) {
      case 'sequential':
        return new SequentialExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
      
      case 'parallel':
        return new ParallelExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
      
      case 'hybrid':
        return new HybridExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
      
      case 'auto':
        // Intelligent pattern selection based on task characteristics
        return this.selectOptimalPattern(taskGraph);
      
      default:
        return new HybridExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
    }
  }

  private selectOptimalPattern(taskGraph: TaskDependencyGraph): any {
    const complexity = taskGraph.getComplexityScore();
    const parallelism = taskGraph.getMaxParallelism();
    
    if (parallelism > 3 && complexity < 0.7) {
      logger.info('🏃‍♂️ Selected parallel execution pattern');
      return new ParallelExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
    } else if (complexity > 0.8) {
      logger.info('🚶‍♂️ Selected sequential execution pattern');
      return new SequentialExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
    } else {
      logger.info('🤸‍♂️ Selected hybrid execution pattern');
      return new HybridExecutionPattern(this.qualityGates, this.progressMonitor, this.config);
    }
  }

  private async validateFinalResult(results: Record<string, any>, specification: TaskSpecification): Promise<any> {
    logger.info('🔍 Validating final coordination result');
    
    const validation = {
      success: true,
      warnings: [] as string[]
    };

    // Check if all required tasks completed
    for (const taskDef of specification.tasks) {
      if (!results[taskDef.id]) {
        validation.success = false;
        validation.warnings.push(`Task ${taskDef.id} did not complete successfully`);
      }
    }

    // Check if all required outputs are present
    for (const taskDef of specification.tasks) {
      const taskResult = results[taskDef.id];
      if (taskResult) {
        for (const expectedOutput of taskDef.outputs) {
          if (!taskResult[expectedOutput]) {
            validation.warnings.push(`Task ${taskDef.id} missing expected output: ${expectedOutput}`);
          }
        }
      }
    }

    return validation;
  }

  private calculateMetrics(taskGraph: TaskDependencyGraph, startTime: number): ExecutionMetrics {
    const endTime = Date.now();
    const totalTasks = taskGraph.getTotalTasks();
    const completedTasks = taskGraph.getCompletedTasks();
    const failedTasks = taskGraph.getFailedTasks();

    return {
      totalTasks,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      totalExecutionTime: endTime - startTime,
      averageTaskTime: completedTasks.length > 0 ? 
        completedTasks.reduce((sum, task) => sum + (task.endTime!.getTime() - task.startTime!.getTime()), 0) / completedTasks.length : 0,
      concurrentTasks: this.config.maxConcurrentTasks
    };
  }

  private calculateErrorMetrics(startTime: number): ExecutionMetrics {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalExecutionTime: Date.now() - startTime,
      averageTaskTime: 0,
      concurrentTasks: 0
    };
  }

  // Public API methods

  async getExecutionPlan(specification: TaskSpecification): Promise<ExecutionPlan> {
    // Initialize a proper planning team with required agents
    const planningTeam = this.createPlanningTeam(specification);
    const taskGraph = new TaskDependencyGraph(this.sharedMemory, this.config);
    
    // Add tasks with proper agent assignments for realistic planning
    for (const taskDef of specification.tasks) {
      const agent = this.assignOptimalAgent(taskDef, planningTeam);
      taskGraph.addTask(taskDef.id, agent, taskDef.requirements, taskDef.dependencies);
    }

    return await taskGraph.generateExecutionPlan();
  }

  /**
   * Create a planning team based on task requirements
   */
  private createPlanningTeam(specification: TaskSpecification): BaseTeam {
    const agents = new Map();
    
    // Analyze tasks to determine required agent types
    for (const task of specification.tasks) {
      const requiredType = this.determineAgentType(task);
      if (!agents.has(requiredType)) {
        agents.set(requiredType, {
          id: `${requiredType}_agent_${Date.now()}`,
          type: requiredType,
          capabilities: task.requirements || [],
          status: 'ready'
        });
      }
    }

    // Ensure at least one general agent exists
    if (agents.size === 0) {
      agents.set('general', {
        id: `general_agent_${Date.now()}`,
        type: 'general',
        capabilities: [],
        status: 'ready'
      });
    }

    return {
      agents,
      id: `planning_team_${Date.now()}`,
      name: 'Planning Team',
      type: 'planning'
    } as BaseTeam;
  }

  /**
   * Determine the optimal agent type for a task
   */
  private determineAgentType(task: any): string {
    const taskType = task.type?.toLowerCase() || '';
    const requirements = task.requirements || [];
    
    if (taskType.includes('widget') || requirements.includes('frontend')) return 'frontend';
    if (taskType.includes('flow') || requirements.includes('process')) return 'process';
    if (taskType.includes('backend') || requirements.includes('server')) return 'backend';
    if (taskType.includes('security') || requirements.includes('security')) return 'security';
    if (taskType.includes('data') || requirements.includes('database')) return 'data';
    
    return 'general'; // Default fallback
  }

  /**
   * Assign optimal agent from team for a task
   */
  private assignOptimalAgent(task: any, team: BaseTeam): any {
    const requiredType = this.determineAgentType(task);
    const agent = team.agents.get(requiredType) || team.agents.get('general');
    
    if (!agent) {
      logger.warn(`No suitable agent found for task type: ${requiredType}, creating default agent`);
      return {
        id: `default_agent_${Date.now()}`,
        type: 'general',
        capabilities: [],
        status: 'ready'
      };
    }
    
    return agent;
  }

  getSharedMemory(): SharedMemoryManager {
    return this.sharedMemory;
  }

  getQualityGateManager(): QualityGateManager {
    return this.qualityGates;
  }

  async pauseExecution(): Promise<void> {
    logger.info('⏸️ Pausing coordination execution');
    this.emit('coordination:paused');
  }

  async resumeExecution(): Promise<void> {
    logger.info('▶️ Resuming coordination execution');
    this.emit('coordination:resumed');
  }

  async abortExecution(reason: string): Promise<void> {
    logger.warn('🛑 Aborting coordination execution', { reason });
    this.emit('coordination:aborted', { reason });
  }
}
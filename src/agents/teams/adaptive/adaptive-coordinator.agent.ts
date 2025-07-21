/**
 * Adaptive Coordinator Agent - Analyzes unknown tasks and dynamically assembles specialized teams
 */

import { BaseSnowAgent, AgentCapabilities } from '../../base/base-snow-agent.js';
import { Task, TaskPriority } from '../../../types/snow-flow.types.js';
import { TaskAnalyzer, TaskAnalysis } from '../../../intelligence/task-analyzer.js';
import { TeamAssembler } from '../../../assembly/team-assembler.js';
import { AdaptivePatterns } from '../../../patterns/adaptive-patterns.js';
import { Logger } from '../../../utils/logger.js';

export interface AdaptiveTeam {
  id: string;
  specialists: Map<string, BaseSnowAgent>;
  coordinator: AdaptiveCoordinatorAgent;
  taskAnalysis: TaskAnalysis;
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
}

export interface ParallelTask {
  id: string;
  agent: string;
  task: any;
  canRunInParallel: boolean;
}

export interface TaskDependency {
  prerequisite: string;
  dependent: string;
  type: 'data' | 'completion' | 'approval';
}

export interface TaskAnalysisRequest {
  description: string;
  context?: any;
  priority?: TaskPriority;
  constraints?: string[];
  expectedOutput?: string;
}

export class AdaptiveCoordinatorAgent extends BaseSnowAgent {
  private taskAnalyzer: TaskAnalyzer;
  private teamAssembler: TeamAssembler;
  private adaptivePatterns: AdaptivePatterns;
  private activeTeams: Map<string, AdaptiveTeam> = new Map();
  private taskHistory: TaskAnalysis[] = [];

  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'task_analysis',
        'team_coordination',
        'requirement_analysis',
        'strategy_planning',
        'resource_allocation'
      ],
      secondarySkills: [
        'pattern_recognition',
        'workflow_optimization',
        'risk_assessment',
        'performance_monitoring'
      ],
      complexity: 'high',
      autonomy: 'fully-autonomous'
    };

    super('coordinator', 'AdaptiveCoordinator', capabilities);
    
    this.taskAnalyzer = new TaskAnalyzer();
    this.teamAssembler = new TeamAssembler();
    this.adaptivePatterns = new AdaptivePatterns();
    
    this.logger.info('Adaptive Coordinator Agent initialized');
  }

  /**
   * Main execution method for unknown/custom tasks
   */
  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const request: TaskAnalysisRequest = {
        description: task.description,
        context: input?.context,
        priority: task.priority,
        constraints: input?.constraints,
        expectedOutput: input?.expectedOutput
      };

      const result = await this.executeAdaptiveTask(request);
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Analyze unknown task and determine requirements
   */
  async analyzeUnknownTask(request: TaskAnalysisRequest): Promise<TaskAnalysis> {
    this.logger.info('Analyzing unknown task', { description: request.description });
    
    try {
      // Use AI-powered task analysis
      const analysis = await this.taskAnalyzer.analyzeTaskType({
        description: request.description,
        context: request.context,
        priority: request.priority,
        constraints: request.constraints || [],
        expectedOutput: request.expectedOutput
      });

      // Enhance analysis with historical patterns
      const enhancedAnalysis = await this.enhanceWithHistory(analysis);
      
      // Store for future learning
      this.taskHistory.push(enhancedAnalysis);
      
      this.logger.info('Task analysis completed', {
        taskType: enhancedAnalysis.taskType,
        complexity: enhancedAnalysis.complexity,
        requiredSkills: enhancedAnalysis.requiredSkills.length
      });
      
      return enhancedAnalysis;
      
    } catch (error) {
      this.logger.error('Task analysis failed', error);
      throw new Error(`Failed to analyze task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Dynamically assemble specialized team based on analysis
   */
  async assembleTeam(analysis: TaskAnalysis): Promise<AdaptiveTeam> {
    this.logger.info('Assembling adaptive team', {
      taskType: analysis.taskType,
      requiredSkills: analysis.requiredSkills
    });
    
    try {
      // Identify required skill sets
      const skillRequirements = await this.taskAnalyzer.identifyRequiredSkills(analysis);
      
      // Suggest optimal team composition
      const teamComposition = await this.taskAnalyzer.suggestTeamComposition(skillRequirements);
      
      // Assemble the team using available specialists
      const specialists = await this.teamAssembler.assembleTeam(skillRequirements);
      
      // Create execution plan
      const executionPlan = await this.createExecutionPlan(analysis, teamComposition);
      
      const team: AdaptiveTeam = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        specialists,
        coordinator: this,
        taskAnalysis: analysis,
        executionPlan,
        createdAt: new Date()
      };
      
      this.activeTeams.set(team.id, team);
      
      this.logger.info('Team assembled successfully', {
        teamId: team.id,
        specialistCount: specialists.size,
        strategy: executionPlan.strategy
      });
      
      return team;
      
    } catch (error) {
      this.logger.error('Team assembly failed', error);
      throw new Error(`Failed to assemble team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute adaptive task with dynamic coordination
   */
  async executeAdaptiveTask(request: TaskAnalysisRequest): Promise<any> {
    this.logger.info('Executing adaptive task', { description: request.description });
    
    try {
      // Step 1: Analyze the task
      const analysis = await this.analyzeUnknownTask(request);
      
      // Step 2: Assemble specialized team
      const team = await this.assembleTeam(analysis);
      
      // Step 3: Execute with adaptive coordination
      const result = await this.coordinateAdaptiveExecution(team, analysis);
      
      // Step 4: Cleanup team resources
      await this.cleanupTeam(team.id);
      
      this.logger.info('Adaptive task execution completed', {
        taskType: analysis.taskType,
        teamId: team.id,
        success: !!result.success
      });
      
      return {
        success: true,
        taskAnalysis: analysis,
        teamComposition: Array.from(team.specialists.keys()),
        executionStrategy: team.executionPlan.strategy,
        result: result,
        metrics: {
          analysisTime: result.analysisTime,
          assemblyTime: result.assemblyTime,
          executionTime: result.executionTime,
          totalTime: result.totalTime
        },
        recommendations: this.generateRecommendations(analysis, team, result)
      };
      
    } catch (error) {
      this.logger.error('Adaptive task execution failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        analysis: null,
        recommendations: ['Review task requirements and try again', 'Consider breaking down complex tasks']
      };
    }
  }

  /**
   * Coordinate execution based on optimal patterns
   */
  private async coordinateAdaptiveExecution(team: AdaptiveTeam, analysis: TaskAnalysis): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (team.executionPlan.strategy) {
        case 'sequential':
          result = await this.adaptivePatterns.executeSequentialPattern(team, team.executionPlan);
          break;
          
        case 'parallel':
          result = await this.adaptivePatterns.executeParallelPattern(team, team.executionPlan);
          break;
          
        case 'hybrid':
          result = await this.adaptivePatterns.executeHybridPattern(team, team.executionPlan);
          break;
          
        default:
          throw new Error(`Unknown execution strategy: ${team.executionPlan.strategy}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        ...result,
        executionTime,
        strategy: team.executionPlan.strategy,
        teamSize: team.specialists.size
      };
      
    } catch (error) {
      this.logger.error('Execution coordination failed', error);
      throw error;
    }
  }

  /**
   * Create execution plan based on analysis and team composition
   */
  private async createExecutionPlan(analysis: TaskAnalysis, teamComposition: any): Promise<ExecutionPlan> {
    const strategy = this.determineExecutionStrategy(analysis);
    const steps: ExecutionStep[] = [];
    const parallelTasks: ParallelTask[] = [];
    const dependencies: TaskDependency[] = [];
    
    // Create execution steps based on task complexity and dependencies
    if (analysis.hasServiceNowComponents) {
      steps.push({
        id: 'servicenow_setup',
        agent: 'servicenow-specialist',
        task: { type: 'setup', description: 'Setup ServiceNow environment' },
        dependencies: [],
        estimatedTime: 300000 // 5 minutes
      });
    }
    
    if (analysis.requiresDataProcessing) {
      steps.push({
        id: 'data_processing',
        agent: 'data-specialist',
        task: { type: 'data_analysis', description: analysis.description },
        dependencies: analysis.hasServiceNowComponents ? ['servicenow_setup'] : [],
        estimatedTime: 600000 // 10 minutes
      });
    }
    
    if (analysis.requiresIntegration) {
      const integrationStep: ExecutionStep = {
        id: 'integration_setup',
        agent: 'integration-specialist',
        task: { type: 'integration', description: analysis.description },
        dependencies: ['data_processing'],
        estimatedTime: 900000 // 15 minutes
      };
      
      if (strategy === 'parallel' && !analysis.hasStrictDependencies) {
        parallelTasks.push({
          id: integrationStep.id,
          agent: integrationStep.agent,
          task: integrationStep.task,
          canRunInParallel: true
        });
      } else {
        steps.push(integrationStep);
      }
    }
    
    // Add more steps based on analysis requirements...
    
    const estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedTime, 0) +
                              parallelTasks.reduce((sum, task) => sum + 300000, 0); // Base time for parallel tasks
    
    return {
      strategy,
      steps,
      parallelTasks,
      dependencies,
      estimatedDuration
    };
  }

  /**
   * Determine optimal execution strategy
   */
  private determineExecutionStrategy(analysis: TaskAnalysis): 'sequential' | 'parallel' | 'hybrid' {
    if (analysis.hasStrictDependencies || analysis.complexity === 'high') {
      return 'sequential';
    }
    
    if (analysis.canParallelize && analysis.requiredSkills.length > 2) {
      return 'parallel';
    }
    
    if (analysis.complexity === 'medium' && analysis.requiredSkills.length > 1) {
      return 'hybrid';
    }
    
    return 'sequential';
  }

  /**
   * Enhance analysis with historical patterns
   */
  private async enhanceWithHistory(analysis: TaskAnalysis): Promise<TaskAnalysis> {
    // Find similar historical tasks
    const similarTasks = this.taskHistory.filter(task => 
      task.taskType === analysis.taskType ||
      task.requiredSkills.some(skill => analysis.requiredSkills.includes(skill))
    );
    
    if (similarTasks.length > 0) {
      // Apply lessons learned
      const avgComplexity = similarTasks.reduce((sum, task) => {
        const complexityMap = { 'low': 1, 'medium': 2, 'high': 3 };
        return sum + complexityMap[task.complexity];
      }, 0) / similarTasks.length;
      
      if (avgComplexity > 2 && analysis.complexity === 'medium') {
        analysis.complexity = 'high';
        analysis.recommendations.push('Complexity upgraded based on historical patterns');
      }
      
      // Add successful patterns from history
      const successfulPatterns = similarTasks
        .filter(task => task.successRate > 0.8)
        .map(task => task.recommendedPattern)
        .filter(Boolean);
      
      if (successfulPatterns.length > 0) {
        analysis.recommendedPattern = successfulPatterns[0];
      }
    }
    
    return analysis;
  }

  /**
   * Generate recommendations based on execution results
   */
  private generateRecommendations(analysis: TaskAnalysis, team: AdaptiveTeam, result: any): string[] {
    const recommendations: string[] = [];
    
    if (result.executionTime > team.executionPlan.estimatedDuration * 1.5) {
      recommendations.push('Consider optimizing workflow - execution took longer than expected');
    }
    
    if (team.specialists.size > 5) {
      recommendations.push('Large team size may introduce coordination overhead');
    }
    
    if (analysis.complexity === 'high' && team.executionPlan.strategy === 'parallel') {
      recommendations.push('Sequential execution might be more reliable for high complexity tasks');
    }
    
    if (result.success && result.executionTime < team.executionPlan.estimatedDuration * 0.8) {
      recommendations.push('Excellent performance - consider this pattern for similar tasks');
    }
    
    return recommendations;
  }

  /**
   * Cleanup team resources
   */
  private async cleanupTeam(teamId: string): Promise<void> {
    const team = this.activeTeams.get(teamId);
    if (team) {
      // Terminate all specialists
      for (const specialist of team.specialists.values()) {
        specialist.terminate();
      }
      
      this.activeTeams.delete(teamId);
      this.logger.info('Team cleanup completed', { teamId });
    }
  }

  /**
   * Get current active teams
   */
  getActiveTeams(): AdaptiveTeam[] {
    return Array.from(this.activeTeams.values());
  }

  /**
   * Get task execution history
   */
  getTaskHistory(): TaskAnalysis[] {
    return [...this.taskHistory];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    const totalTasks = this.taskHistory.length;
    const successfulTasks = this.taskHistory.filter(task => task.successRate > 0.8).length;
    const avgComplexity = this.taskHistory.reduce((sum, task) => {
      const complexityMap = { 'low': 1, 'medium': 2, 'high': 3 };
      return sum + complexityMap[task.complexity];
    }, 0) / totalTasks || 0;
    
    return {
      totalTasksAnalyzed: totalTasks,
      successRate: totalTasks > 0 ? successfulTasks / totalTasks : 0,
      averageComplexity: avgComplexity,
      activeTeams: this.activeTeams.size,
      specialistTypes: this.getUniqueSpecialistTypes()
    };
  }

  /**
   * Get unique specialist types that have been used
   */
  private getUniqueSpecialistTypes(): string[] {
    const types = new Set<string>();
    
    for (const team of this.activeTeams.values()) {
      for (const specialistType of team.specialists.keys()) {
        types.add(specialistType);
      }
    }
    
    return Array.from(types);
  }
}
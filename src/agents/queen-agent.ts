/**
 * Queen Agent Core
 * Master coordinator that analyzes objectives and spawns specialized agents
 * Works through Claude Code interface using TodoWrite for task coordination
 */

import { EventEmitter } from 'eventemitter3';
import { TodoItem, TodoStatus } from '../types/todo.types';
import { ServiceNowTask, Agent, AgentType, TaskAnalysis, DeploymentPattern } from '../queen/types';
import { QueenMemorySystem } from '../queen/queen-memory';
import { AgentCoordinator } from './coordinator';
import * as crypto from 'crypto';

export interface QueenAgentConfig {
  memoryPath?: string;
  maxConcurrentAgents?: number;
  debugMode?: boolean;
  autoSpawn?: boolean;
  claudeCodeInterface?: boolean;
}

export interface QueenObjective {
  id: string;
  description: string;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  constraints?: {
    maxDuration?: number;
    requiredCapabilities?: string[];
    forbiddenActions?: string[];
  };
}

export interface TodoCoordination {
  taskId: string;
  todos: TodoItem[];
  agentAssignments: Map<string, string>; // todoId -> agentId
  dependencies: Map<string, string[]>; // todoId -> [dependencyIds]
}

export class QueenAgent extends EventEmitter {
  private memory: QueenMemorySystem;
  private coordinator: AgentCoordinator;
  private config: Required<QueenAgentConfig>;
  private activeObjectives: Map<string, QueenObjective>;
  private todoCoordinations: Map<string, TodoCoordination>;
  private activeAgents: Map<string, Agent>;

  constructor(config: QueenAgentConfig = {}) {
    super();
    
    this.config = {
      memoryPath: config.memoryPath,
      maxConcurrentAgents: config.maxConcurrentAgents || 8,
      debugMode: config.debugMode || false,
      autoSpawn: config.autoSpawn !== false,
      claudeCodeInterface: config.claudeCodeInterface !== false
    };

    // Initialize core systems
    this.memory = new QueenMemorySystem(this.config.memoryPath);
    this.coordinator = new AgentCoordinator(this.memory);
    this.activeObjectives = new Map();
    this.todoCoordinations = new Map();
    this.activeAgents = new Map();

    this.setupEventHandlers();
    
    if (this.config.debugMode) {
      console.log('👑 Queen Agent initialized with Claude Code interface');
    }
  }

  /**
   * Analyze objective and create coordinated execution plan
   */
  async analyzeObjective(objective: string | QueenObjective): Promise<TaskAnalysis> {
    const queenObjective = typeof objective === 'string' 
      ? { id: this.generateId('obj'), description: objective } 
      : objective;

    this.activeObjectives.set(queenObjective.id, queenObjective);
    this.emit('objective:analyzing', queenObjective);

    try {
      // Analyze objective using memory patterns and neural learning
      const analysis = await this.performObjectiveAnalysis(queenObjective);
      
      // Store analysis in memory for coordination
      await this.memory.store(`analysis_${queenObjective.id}`, {
        objective: queenObjective,
        analysis,
        timestamp: new Date().toISOString()
      });

      // Create TodoWrite coordination structure
      const todoCoordination = await this.createTodoCoordination(queenObjective, analysis);
      this.todoCoordinations.set(queenObjective.id, todoCoordination);

      this.emit('objective:analyzed', { objective: queenObjective, analysis, todos: todoCoordination.todos });
      
      return analysis;

    } catch (error) {
      this.emit('objective:error', { objective: queenObjective, error });
      throw error;
    }
  }

  /**
   * Spawn agents based on objective requirements
   */
  async spawnAgents(objectiveId: string): Promise<Agent[]> {
    const todoCoordination = this.todoCoordinations.get(objectiveId);
    if (!todoCoordination) {
      throw new Error(`No todo coordination found for objective: ${objectiveId}`);
    }

    const analysis = await this.memory.get(`analysis_${objectiveId}`) as { analysis: TaskAnalysis };
    if (!analysis) {
      throw new Error(`No analysis found for objective: ${objectiveId}`);
    }

    const agents: Agent[] = [];
    const requiredAgentTypes = new Set(analysis.analysis.requiredAgents);

    // Spawn agents for each required type
    for (const agentType of requiredAgentTypes) {
      const agent = await this.spawnSpecializedAgent(agentType, objectiveId);
      agents.push(agent);
      this.activeAgents.set(agent.id, agent);
      
      // Assign todos to agent based on capabilities
      this.assignTodosToAgent(agent, todoCoordination);
    }

    // Update memory with agent spawning information
    await this.memory.store(`agents_${objectiveId}`, {
      agents: agents.map(a => ({ id: a.id, type: a.type, capabilities: a.capabilities })),
      timestamp: new Date().toISOString()
    });

    this.emit('agents:spawned', { objectiveId, agents });
    
    return agents;
  }

  /**
   * Monitor and coordinate agent progress
   */
  async monitorProgress(objectiveId: string): Promise<{
    overall: number;
    byAgent: Map<string, number>;
    blockingIssues: string[];
    estimatedCompletion: Date;
  }> {
    const todoCoordination = this.todoCoordinations.get(objectiveId);
    if (!todoCoordination) {
      throw new Error(`No todo coordination found for objective: ${objectiveId}`);
    }

    // Calculate progress from todos
    const completedTodos = todoCoordination.todos.filter(t => t.status === 'completed').length;
    const totalTodos = todoCoordination.todos.length;
    const overallProgress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    // Calculate per-agent progress
    const byAgent = new Map<string, number>();
    for (const [todoId, agentId] of todoCoordination.agentAssignments) {
      const agentTodos = Array.from(todoCoordination.agentAssignments.entries())
        .filter(([_, aid]) => aid === agentId);
      const agentCompleted = agentTodos.filter(([tid, _]) => 
        todoCoordination.todos.find(t => t.id === tid)?.status === 'completed'
      ).length;
      const agentProgress = agentTodos.length > 0 ? (agentCompleted / agentTodos.length) * 100 : 0;
      byAgent.set(agentId, agentProgress);
    }

    // Identify blocking issues
    const blockingIssues = await this.identifyBlockingIssues(todoCoordination);

    // Estimate completion based on current velocity
    const estimatedCompletion = this.estimateCompletion(todoCoordination, overallProgress);

    // Store progress in memory
    await this.memory.store(`progress_${objectiveId}`, {
      overall: overallProgress,
      byAgent: Object.fromEntries(byAgent),
      blockingIssues,
      estimatedCompletion: estimatedCompletion.toISOString(),
      timestamp: new Date().toISOString()
    });

    this.emit('progress:updated', { objectiveId, overall: overallProgress, byAgent, blockingIssues });

    return {
      overall: overallProgress,
      byAgent,
      blockingIssues,
      estimatedCompletion
    };
  }

  /**
   * Make memory-driven decisions based on past patterns
   */
  async makeDecision(context: {
    objective: string;
    currentState: any;
    options: string[];
  }): Promise<{
    decision: string;
    reasoning: string;
    confidence: number;
  }> {
    // Query memory for similar past decisions
    const similarPatterns = await this.memory.findSimilarPatterns(context.objective);
    
    // Analyze success rates of different approaches
    const optionScores = new Map<string, number>();
    for (const option of context.options) {
      const score = this.calculateOptionScore(option, similarPatterns, context);
      optionScores.set(option, score);
    }

    // Select best option
    const bestOption = Array.from(optionScores.entries())
      .sort((a, b) => b[1] - a[1])[0];

    const decision = {
      decision: bestOption[0],
      reasoning: this.generateDecisionReasoning(bestOption[0], similarPatterns, context),
      confidence: bestOption[1] / 100
    };

    // Store decision for future learning
    await this.memory.storeDecision({
      context,
      decision: decision.decision,
      confidence: decision.confidence,
      timestamp: new Date().toISOString()
    });

    this.emit('decision:made', decision);

    return decision;
  }

  /**
   * Create TodoWrite coordination structure
   */
  private async createTodoCoordination(objective: QueenObjective, analysis: TaskAnalysis): Promise<TodoCoordination> {
    const todos: TodoItem[] = [];
    const dependencies = new Map<string, string[]>();

    // Create high-level todos based on task analysis
    if (analysis.type === 'widget') {
      todos.push(...this.createWidgetTodos(objective, analysis));
    } else if (analysis.type === 'flow') {
      todos.push(...this.createFlowTodos(objective, analysis));
    } else if (analysis.type === 'script') {
      todos.push(...this.createScriptTodos(objective, analysis));
    } else if (analysis.type === 'integration') {
      todos.push(...this.createIntegrationTodos(objective, analysis));
    } else {
      todos.push(...this.createGenericTodos(objective, analysis));
    }

    // Set up dependencies based on logical flow
    this.setupTodoDependencies(todos, dependencies);

    return {
      taskId: objective.id,
      todos,
      agentAssignments: new Map(),
      dependencies
    };
  }

  /**
   * Create widget-specific todos
   */
  private createWidgetTodos(objective: QueenObjective, analysis: TaskAnalysis): TodoItem[] {
    const todos: TodoItem[] = [
      {
        id: this.generateId('todo'),
        content: `Analyze widget requirements: ${objective.description}`,
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Design widget HTML template structure',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Implement server-side data processing logic',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Create client-side controller script',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Style widget with responsive CSS',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Test widget functionality with mock data',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Deploy widget to ServiceNow instance',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Validate deployment and run integration tests',
        status: 'pending',
        priority: 'high'
      }
    ];

    return todos;
  }

  /**
   * Create flow-specific todos
   */
  private createFlowTodos(objective: QueenObjective, analysis: TaskAnalysis): TodoItem[] {
    const todos: TodoItem[] = [
      {
        id: this.generateId('todo'),
        content: `Analyze flow requirements: ${objective.description}`,
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Design flow trigger conditions and events',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Map out flow steps and decision points',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Configure flow actions and integrations',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Set up data transformations and variables',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Create flow using natural language API',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Test flow with mock scenarios',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Deploy and activate flow',
        status: 'pending',
        priority: 'high'
      }
    ];

    return todos;
  }

  /**
   * Create script-specific todos
   */
  private createScriptTodos(objective: QueenObjective, analysis: TaskAnalysis): TodoItem[] {
    const todos: TodoItem[] = [
      {
        id: this.generateId('todo'),
        content: `Analyze script requirements: ${objective.description}`,
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Determine script type (Business Rule, Script Include, etc.)',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Design script logic and error handling',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Implement core business logic',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Add logging and debugging capabilities',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Create unit tests for script functions',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Deploy script to ServiceNow',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Validate script execution and performance',
        status: 'pending',
        priority: 'high'
      }
    ];

    return todos;
  }

  /**
   * Create integration-specific todos
   */
  private createIntegrationTodos(objective: QueenObjective, analysis: TaskAnalysis): TodoItem[] {
    const todos: TodoItem[] = [
      {
        id: this.generateId('todo'),
        content: `Analyze integration requirements: ${objective.description}`,
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Identify external systems and APIs',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Design data mapping and transformation',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Configure authentication and security',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Create REST/SOAP message configurations',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Implement error handling and retry logic',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Test integration with mock endpoints',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Deploy and monitor integration',
        status: 'pending',
        priority: 'high'
      }
    ];

    return todos;
  }

  /**
   * Create generic todos for unknown task types
   */
  private createGenericTodos(objective: QueenObjective, analysis: TaskAnalysis): TodoItem[] {
    const todos: TodoItem[] = [
      {
        id: this.generateId('todo'),
        content: `Analyze requirements: ${objective.description}`,
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Research existing ServiceNow capabilities',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Design solution architecture',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Implement core functionality',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Create necessary configurations',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: this.generateId('todo'),
        content: 'Test solution thoroughly',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Deploy to ServiceNow',
        status: 'pending',
        priority: 'high'
      },
      {
        id: this.generateId('todo'),
        content: 'Validate and document solution',
        status: 'pending',
        priority: 'medium'
      }
    ];

    return todos;
  }

  /**
   * Set up logical dependencies between todos
   */
  private setupTodoDependencies(todos: TodoItem[], dependencies: Map<string, string[]>): void {
    // For sequential tasks, each depends on the previous
    for (let i = 1; i < todos.length; i++) {
      dependencies.set(todos[i].id, [todos[i - 1].id]);
    }

    // Some tasks can be parallelized
    // For example, styling and client script can happen in parallel after template is done
    const templateTodo = todos.find(t => t.content.includes('template') || t.content.includes('structure'));
    const stylingTodo = todos.find(t => t.content.includes('CSS') || t.content.includes('style'));
    const clientTodo = todos.find(t => t.content.includes('client') || t.content.includes('controller'));

    if (templateTodo && stylingTodo && clientTodo) {
      // Both styling and client script depend only on template, not on each other
      dependencies.set(stylingTodo.id, [templateTodo.id]);
      dependencies.set(clientTodo.id, [templateTodo.id]);
    }
  }

  /**
   * Assign todos to agent based on capabilities
   */
  private assignTodosToAgent(agent: Agent, todoCoordination: TodoCoordination): void {
    const agentCapabilityMap: Record<AgentType, string[]> = {
      'widget-creator': ['widget', 'template', 'HTML', 'server', 'client', 'deploy widget'],
      'flow-builder': ['flow', 'trigger', 'decision', 'action', 'workflow'],
      'script-writer': ['script', 'business rule', 'logic', 'function'],
      'app-architect': ['architecture', 'design', 'structure', 'solution'],
      'integration-specialist': ['integration', 'REST', 'SOAP', 'API', 'external'],
      'catalog-manager': ['catalog', 'item', 'category', 'variable'],
      'researcher': ['analyze', 'research', 'requirements', 'existing'],
      'tester': ['test', 'validate', 'mock', 'scenario', 'integration test']
    };

    const agentKeywords = agentCapabilityMap[agent.type] || [];

    // Assign todos that match agent capabilities
    for (const todo of todoCoordination.todos) {
      if (!todoCoordination.agentAssignments.has(todo.id)) {
        const todoLower = todo.content.toLowerCase();
        const matches = agentKeywords.some(keyword => todoLower.includes(keyword.toLowerCase()));
        
        if (matches) {
          todoCoordination.agentAssignments.set(todo.id, agent.id);
          
          // Update agent task list
          if (!agent.task) {
            agent.task = todo.id;
          }
        }
      }
    }
  }

  /**
   * Perform deep analysis of objective
   */
  private async performObjectiveAnalysis(objective: QueenObjective): Promise<TaskAnalysis> {
    const description = objective.description.toLowerCase();
    
    // Determine task type
    let type: ServiceNowTask['type'] = 'unknown';
    if (description.includes('widget')) type = 'widget';
    else if (description.includes('flow') || description.includes('workflow')) type = 'flow';
    else if (description.includes('script') || description.includes('business rule')) type = 'script';
    else if (description.includes('app') || description.includes('application')) type = 'application';
    else if (description.includes('integration') || description.includes('api')) type = 'integration';

    // Determine required agents
    const requiredAgents: AgentType[] = [];
    
    // Always include researcher for analysis
    requiredAgents.push('researcher');
    
    // Add type-specific agents
    switch (type) {
      case 'widget':
        requiredAgents.push('widget-creator');
        if (description.includes('test')) requiredAgents.push('tester');
        break;
      case 'flow':
        requiredAgents.push('flow-builder');
        if (description.includes('catalog')) requiredAgents.push('catalog-manager');
        if (description.includes('test')) requiredAgents.push('tester');
        break;
      case 'script':
        requiredAgents.push('script-writer');
        if (description.includes('test')) requiredAgents.push('tester');
        break;
      case 'integration':
        requiredAgents.push('integration-specialist');
        requiredAgents.push('tester');
        break;
      case 'application':
        requiredAgents.push('app-architect');
        requiredAgents.push('widget-creator');
        requiredAgents.push('flow-builder');
        requiredAgents.push('tester');
        break;
      default:
        // For unknown types, spawn a balanced team
        requiredAgents.push('app-architect');
        requiredAgents.push('script-writer');
        break;
    }

    // Estimate complexity based on description
    const complexityFactors = {
      words: description.split(' ').length,
      hasIntegration: description.includes('integration') || description.includes('api'),
      hasMultipleComponents: description.includes('and') || description.includes('with'),
      hasComplexLogic: description.includes('complex') || description.includes('advanced'),
      hasPerformanceReqs: description.includes('performance') || description.includes('optimize')
    };

    const estimatedComplexity = 
      complexityFactors.words / 10 +
      (complexityFactors.hasIntegration ? 2 : 0) +
      (complexityFactors.hasMultipleComponents ? 1 : 0) +
      (complexityFactors.hasComplexLogic ? 2 : 0) +
      (complexityFactors.hasPerformanceReqs ? 1 : 0);

    // Look for successful patterns in memory
    const suggestedPattern = await this.memory.findBestPattern(type);

    // Extract dependencies
    const dependencies: string[] = [];
    if (description.includes('table')) dependencies.push('table_creation');
    if (description.includes('user')) dependencies.push('user_management');
    if (description.includes('approval')) dependencies.push('approval_framework');
    if (description.includes('notification')) dependencies.push('notification_system');

    return {
      type,
      requiredAgents: [...new Set(requiredAgents)], // Remove duplicates
      estimatedComplexity: Math.min(10, Math.max(1, estimatedComplexity)),
      suggestedPattern,
      dependencies
    };
  }

  /**
   * Spawn a specialized agent
   */
  private async spawnSpecializedAgent(type: AgentType, objectiveId: string): Promise<Agent> {
    const agentId = this.generateId(`agent_${type}`);
    
    const agent: Agent = {
      id: agentId,
      type,
      status: 'idle',
      capabilities: this.getAgentCapabilities(type),
      mcpTools: this.getAgentMcpTools(type)
    };

    // Store agent in memory for coordination
    await this.memory.store(`agent_${agentId}`, {
      agent,
      objectiveId,
      spawnedAt: new Date().toISOString()
    });

    // Notify coordinator of new agent
    await this.coordinator.registerAgent(agent);

    this.emit('agent:spawned', agent);

    return agent;
  }

  /**
   * Get agent capabilities based on type
   */
  private getAgentCapabilities(type: AgentType): string[] {
    const capabilityMap: Record<AgentType, string[]> = {
      'widget-creator': ['html_generation', 'css_styling', 'javascript_development', 'servicenow_api', 'widget_deployment'],
      'flow-builder': ['flow_design', 'trigger_configuration', 'action_creation', 'decision_logic', 'flow_testing'],
      'script-writer': ['glide_scripting', 'business_logic', 'error_handling', 'performance_optimization', 'script_deployment'],
      'app-architect': ['system_design', 'architecture_planning', 'component_integration', 'best_practices', 'documentation'],
      'integration-specialist': ['rest_api', 'soap_services', 'data_transformation', 'authentication', 'error_recovery'],
      'catalog-manager': ['catalog_creation', 'variable_management', 'workflow_linking', 'approval_setup', 'ui_design'],
      'researcher': ['requirement_analysis', 'feasibility_study', 'solution_research', 'best_practice_identification'],
      'tester': ['test_planning', 'test_execution', 'mock_data_creation', 'integration_testing', 'performance_testing']
    };

    return capabilityMap[type] || ['general_servicenow_development'];
  }

  /**
   * Get MCP tools available to agent type
   */
  private getAgentMcpTools(type: AgentType): string[] {
    const toolMap: Record<AgentType, string[]> = {
      'widget-creator': ['snow_deploy', 'snow_preview_widget', 'snow_widget_test'],
      'flow-builder': ['snow_create_flow', 'snow_test_flow_with_mock', 'snow_validate_flow_definition'],
      'script-writer': ['snow_create_script_include', 'snow_create_business_rule', 'snow_create_client_script'],
      'app-architect': ['snow_analyze_requirements', 'snow_create_application', 'snow_intelligent_flow_analysis'],
      'integration-specialist': ['snow_create_rest_message', 'snow_create_transform_map', 'snow_test_integration'],
      'catalog-manager': ['snow_catalog_item_search', 'snow_catalog_item_manager', 'snow_link_catalog_to_flow'],
      'researcher': ['snow_find_artifact', 'snow_comprehensive_search', 'snow_discover_existing_flows'],
      'tester': ['snow_test_flow_with_mock', 'snow_widget_test', 'snow_comprehensive_flow_test']
    };

    return toolMap[type] || ['snow_find_artifact'];
  }

  /**
   * Identify blocking issues in todo coordination
   */
  private async identifyBlockingIssues(todoCoordination: TodoCoordination): Promise<string[]> {
    const issues: string[] = [];

    // Check for todos with unmet dependencies
    for (const [todoId, deps] of todoCoordination.dependencies) {
      const todo = todoCoordination.todos.find(t => t.id === todoId);
      if (todo && todo.status === 'pending') {
        const unmetDeps = deps.filter(depId => {
          const depTodo = todoCoordination.todos.find(t => t.id === depId);
          return depTodo && depTodo.status !== 'completed';
        });

        if (unmetDeps.length > 0) {
          issues.push(`Todo "${todo.content}" blocked by ${unmetDeps.length} dependencies`);
        }
      }
    }

    // Check for todos with no assigned agent
    const unassignedTodos = todoCoordination.todos.filter(todo => 
      !todoCoordination.agentAssignments.has(todo.id) && todo.status === 'pending'
    );

    if (unassignedTodos.length > 0) {
      issues.push(`${unassignedTodos.length} todos have no assigned agent`);
    }

    // Check for failed todos
    const failedTodos = todoCoordination.todos.filter(t => t.status === 'cancelled');
    if (failedTodos.length > 0) {
      issues.push(`${failedTodos.length} todos have failed`);
    }

    return issues;
  }

  /**
   * Estimate completion time based on progress
   */
  private estimateCompletion(todoCoordination: TodoCoordination, currentProgress: number): Date {
    const startTime = new Date(todoCoordination.taskId.split('_')[1]); // Extract timestamp from ID
    const elapsedMs = Date.now() - startTime.getTime();
    
    if (currentProgress === 0) {
      // Default estimate if no progress yet
      return new Date(Date.now() + 3600000); // 1 hour
    }

    const estimatedTotalMs = (elapsedMs / currentProgress) * 100;
    const remainingMs = estimatedTotalMs - elapsedMs;
    
    return new Date(Date.now() + remainingMs);
  }

  /**
   * Calculate score for decision option
   */
  private calculateOptionScore(option: string, patterns: DeploymentPattern[], context: any): number {
    let score = 50; // Base score

    // Adjust based on historical success with similar patterns
    for (const pattern of patterns) {
      if (pattern.agentSequence.some(agent => option.toLowerCase().includes(agent))) {
        score += pattern.successRate * 20;
      }
    }

    // Adjust based on context constraints
    if (context.currentState?.failedAttempts?.includes(option)) {
      score -= 30; // Penalize previously failed options
    }

    // Boost score if option matches objective keywords
    const objectiveWords = context.objective.toLowerCase().split(' ');
    const optionWords = option.toLowerCase().split(' ');
    const matches = objectiveWords.filter(word => optionWords.includes(word)).length;
    score += matches * 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate reasoning for decision
   */
  private generateDecisionReasoning(decision: string, patterns: DeploymentPattern[], context: any): string {
    const reasons: string[] = [];

    // Check historical patterns
    const relevantPatterns = patterns.filter(p => 
      p.agentSequence.some(agent => decision.toLowerCase().includes(agent))
    );
    
    if (relevantPatterns.length > 0) {
      const avgSuccess = relevantPatterns.reduce((sum, p) => sum + p.successRate, 0) / relevantPatterns.length;
      reasons.push(`Historical success rate: ${Math.round(avgSuccess)}%`);
    }

    // Check objective alignment
    const objectiveWords = context.objective.toLowerCase().split(' ');
    const decisionWords = decision.toLowerCase().split(' ');
    const alignment = objectiveWords.filter(word => decisionWords.includes(word)).length;
    if (alignment > 0) {
      reasons.push(`Strong alignment with objective (${alignment} matching concepts)`);
    }

    // Default reasoning if no specific reasons
    if (reasons.length === 0) {
      reasons.push('Best option based on current context and available capabilities');
    }

    return reasons.join('; ');
  }

  /**
   * Set up event handlers for coordination
   */
  private setupEventHandlers(): void {
    // Listen to coordinator events
    this.coordinator.on('agent:handoff', async (data) => {
      await this.handleAgentHandoff(data);
    });

    this.coordinator.on('agent:blocked', async (data) => {
      await this.handleAgentBlocked(data);
    });

    this.coordinator.on('coordination:error', async (error) => {
      await this.handleCoordinationError(error);
    });
  }

  /**
   * Handle agent handoff events
   */
  private async handleAgentHandoff(data: any): Promise<void> {
    this.emit('coordination:handoff', data);
    
    // Update todo status if handoff includes completed work
    if (data.completedTodoId) {
      await this.updateTodoStatus(data.objectiveId, data.completedTodoId, 'completed');
    }
  }

  /**
   * Handle agent blocked events
   */
  private async handleAgentBlocked(data: any): Promise<void> {
    this.emit('coordination:blocked', data);
    
    // Attempt to resolve blockage
    const resolution = await this.makeDecision({
      objective: `Resolve blockage for ${data.agentId}`,
      currentState: data,
      options: ['spawn_helper_agent', 'reassign_task', 'provide_fallback', 'wait_for_dependency']
    });

    if (resolution.decision === 'spawn_helper_agent') {
      // Spawn additional agent to help
      await this.spawnAgents(data.objectiveId);
    }
  }

  /**
   * Handle coordination errors
   */
  private async handleCoordinationError(error: any): Promise<void> {
    this.emit('coordination:error', error);
    
    // Log error to memory for learning
    await this.memory.store(`error_${Date.now()}`, {
      error: error.message,
      stack: error.stack,
      context: error.context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update todo status
   */
  private async updateTodoStatus(objectiveId: string, todoId: string, status: TodoStatus): Promise<void> {
    const todoCoordination = this.todoCoordinations.get(objectiveId);
    if (!todoCoordination) return;

    const todo = todoCoordination.todos.find(t => t.id === todoId);
    if (todo) {
      todo.status = status;
      
      // Store update in memory
      await this.memory.store(`todo_update_${todoId}`, {
        todoId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      this.emit('todo:updated', { objectiveId, todoId, status });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get queen status
   */
  async getStatus(): Promise<{
    activeObjectives: number;
    activeAgents: number;
    totalTodos: number;
    completedTodos: number;
    memoryStats: any;
  }> {
    let totalTodos = 0;
    let completedTodos = 0;

    for (const coordination of this.todoCoordinations.values()) {
      totalTodos += coordination.todos.length;
      completedTodos += coordination.todos.filter(t => t.status === 'completed').length;
    }

    return {
      activeObjectives: this.activeObjectives.size,
      activeAgents: this.activeAgents.size,
      totalTodos,
      completedTodos,
      memoryStats: await this.memory.getStats()
    };
  }

  /**
   * Shutdown queen agent
   */
  async shutdown(): Promise<void> {
    if (this.config.debugMode) {
      console.log('👑 Shutting down Queen Agent');
    }

    // Terminate all active agents
    for (const agent of this.activeAgents.values()) {
      await this.coordinator.terminateAgent(agent.id);
    }

    // Close memory system
    this.memory.close();

    // Clear all maps
    this.activeObjectives.clear();
    this.todoCoordinations.clear();
    this.activeAgents.clear();

    this.emit('shutdown');
  }
}

// Export types for TodoWrite integration
export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
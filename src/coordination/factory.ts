/**
 * Factory functions for creating coordination framework components
 */

import { CoordinationEngine } from './coordination-engine';
import { 
  QualityGateManager, 
  CodeQualityGate, 
  SecurityGate, 
  PerformanceGate, 
  ServiceNowGate,
  BusinessLogicGate 
} from './quality-gates';
import { ProgressMonitor } from './progress-monitor';
import { SharedMemoryManager } from './shared-memory';
import { 
  CoordinationConfig, 
  QualityGateConfig, 
  TaskSpecification,
  ProgressListener 
} from './types';
import { logger } from '../utils/logger';

/**
 * Create a coordination engine with sensible defaults
 */
export function createCoordinationEngine(config: Partial<CoordinationConfig> = {}): CoordinationEngine {
  const defaultConfig: CoordinationConfig = {
    maxConcurrentTasks: 5,
    taskTimeout: 300000, // 5 minutes
    enableRetries: true,
    maxRetries: 3,
    enableQualityGates: true,
    enableProgressMonitoring: true,
    executionPattern: 'auto',
    memoryTtl: 3600000, // 1 hour
    errorRecoveryStrategy: 'retry'
  };

  const finalConfig = { ...defaultConfig, ...config };
  
  logger.info('🏭 Creating coordination engine', { config: finalConfig });
  
  return new CoordinationEngine(finalConfig);
}

/**
 * Create standard quality gates for general development
 */
export function createStandardQualityGates(): QualityGateManager {
  const manager = new QualityGateManager({
    enableBlocking: true,
    enableScoring: true,
    minPassingScore: 0.7,
    enableMetrics: true,
    timeoutMs: 30000
  });

  // Add standard gates
  const codeGate = new CodeQualityGate({
    maxComplexity: 10,
    minCoverage: 80,
    requireDocumentation: true,
    blocking: true
  });

  const securityGate = new SecurityGate({
    checkInjection: true,
    checkXSS: true,
    checkSecrets: true,
    checkAuth: true
  });

  const performanceGate = new PerformanceGate({
    maxResponseTime: 5000,
    maxMemoryUsage: 100,
    blocking: false
  });

  logger.info('🛡️ Created standard quality gates', { 
    gates: ['code_quality', 'security', 'performance'] 
  });

  return manager;
}

/**
 * Create ServiceNow-specific quality gates
 */
export function createServiceNowQualityGates(): QualityGateManager {
  const manager = new QualityGateManager({
    enableBlocking: true,
    enableScoring: true,
    minPassingScore: 0.8,
    enableMetrics: true,
    timeoutMs: 45000 // Longer timeout for ServiceNow operations
  });

  // ServiceNow specific gates
  const snowGate = new ServiceNowGate({
    checkScope: true,
    checkUpdateSet: true,
    checkNaming: true,
    checkDependencies: true,
    blocking: true
  });

  const businessGate = new BusinessLogicGate({
    checkRequirements: true,
    checkOutputs: true,
    checkErrorHandling: true,
    blocking: true
  });

  const codeGate = new CodeQualityGate({
    maxComplexity: 15, // Slightly higher for ServiceNow scripts
    minCoverage: 70,   // Slightly lower due to ServiceNow testing constraints
    requireDocumentation: true,
    blocking: true
  });

  const securityGate = new SecurityGate({
    checkInjection: true,
    checkXSS: true,
    checkSecrets: true,
    checkAuth: true,
    checkPermissions: true // Important for ServiceNow
  });

  logger.info('🛡️ Created ServiceNow quality gates', { 
    gates: ['servicenow_compliance', 'business_logic', 'code_quality', 'security'] 
  });

  return manager;
}

/**
 * Create a progress listener with common logging
 */
export function createProgressListener(config: ProgressListenerConfig = {}): ProgressListener {
  const {
    logLevel = 'info',
    logProgress = true,
    logTasks = true,
    logAgents = false,
    logPerformance = false,
    customHandler
  } = config;

  return {
    onProgress(event: string, data: any): void {
      try {
        // Custom handler takes precedence
        if (customHandler) {
          customHandler(event, data);
          return;
        }

        // Standard logging based on event type and configuration
        switch (event) {
          case 'task_progress':
            if (logProgress) {
              logger[logLevel]('📊 Progress Update', {
                completed: data.completed,
                total: data.total,
                percentage: data.percentage,
                phase: data.currentPhase
              });
            }
            break;

          case 'task:completed':
            if (logTasks) {
              logger[logLevel]('✅ Task Completed', {
                taskId: data.taskId,
                progress: `${Math.round(data.progress * 100)}%`
              });
            }
            break;

          case 'task:failed':
            if (logTasks) {
              logger.error('❌ Task Failed', {
                taskId: data.taskId,
                error: data.error?.message
              });
            }
            break;

          case 'agent_health':
            if (logAgents) {
              const unhealthy = Object.entries(data.agents)
                .filter(([, health]: any) => health.status === 'error').length;
              
              if (unhealthy > 0) {
                logger.warn('⚠️ Agent Health Issue', {
                  unhealthyAgents: unhealthy,
                  totalAgents: Object.keys(data.agents).length
                });
              }
            }
            break;

          case 'performance_metrics':
            if (logPerformance) {
              logger[logLevel]('⚡ Performance Metrics', {
                efficiency: `${Math.round(data.efficiency * 100)}%`,
                throughput: data.throughput.toFixed(2),
                averageTime: `${Math.round(data.averageTaskTime / 1000)}s`
              });
            }
            break;

          case 'bottlenecks_detected':
            logger.warn('🚧 Bottlenecks Detected', {
              count: data.bottlenecks?.length || 0,
              types: data.bottlenecks?.map((b: any) => b.type) || []
            });
            break;

          case 'memory:high_usage':
            logger.warn('🧠 High Memory Usage', {
              usage: `${Math.round(data.usage)}%`
            });
            break;

          default:
            // Log unknown events at debug level
            logger.debug('📡 Coordination Event', { event, data });
        }

      } catch (error) {
        logger.error('❌ Progress listener error', { 
          event, 
          error: error.message 
        });
      }
    }
  };
}

/**
 * Create a task specification builder for common ServiceNow patterns
 */
export function createServiceNowTaskSpecification(
  name: string,
  description: string
): TaskSpecificationBuilder {
  return new TaskSpecificationBuilder(name, description);
}

/**
 * Builder pattern for creating task specifications
 */
export class TaskSpecificationBuilder {
  private spec: TaskSpecification;

  constructor(name: string, description: string) {
    this.spec = {
      name,
      description,
      tasks: [],
      sharedContext: {},
      qualityGates: [],
      executionPattern: 'auto'
    };
  }

  /**
   * Add a task to the specification
   */
  addTask(task: {
    id: string;
    name: string;
    description: string;
    agentType: string;
    requirements: any;
    dependencies?: string[];
    outputs?: string[];
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }): TaskSpecificationBuilder {
    this.spec.tasks.push({
      id: task.id,
      name: task.name,
      description: task.description,
      agentType: task.agentType,
      requirements: task.requirements,
      dependencies: task.dependencies || [],
      outputs: task.outputs || [],
      priority: task.priority || 'medium'
    });
    return this;
  }

  /**
   * Add shared context
   */
  addContext(key: string, value: any): TaskSpecificationBuilder {
    this.spec.sharedContext[key] = value;
    return this;
  }

  /**
   * Set execution pattern
   */
  setExecutionPattern(pattern: 'sequential' | 'parallel' | 'hybrid' | 'auto'): TaskSpecificationBuilder {
    this.spec.executionPattern = pattern;
    return this;
  }

  /**
   * Add quality gates
   */
  addQualityGates(config: QualityGateConfig): TaskSpecificationBuilder {
    this.spec.qualityGates.push(config);
    return this;
  }

  /**
   * Add ServiceNow widget development tasks
   */
  addWidgetDevelopmentTasks(widgetName: string): TaskSpecificationBuilder {
    return this
      .addTask({
        id: 'analyze_requirements',
        name: 'Analyze Requirements',
        description: 'Analyze widget requirements and design specifications',
        agentType: 'analyst',
        requirements: {
          inputs: { widgetSpec: widgetName },
          outputs: ['requirements', 'design'],
          capabilities: ['analysis', 'design']
        }
      })
      .addTask({
        id: 'create_widget_template',
        name: 'Create Widget Template',
        description: 'Create HTML template for the widget',
        agentType: 'ui-builder',
        requirements: {
          inputs: {},
          outputs: ['template', 'css'],
          capabilities: ['html', 'css', 'servicenow']
        },
        dependencies: ['analyze_requirements']
      })
      .addTask({
        id: 'implement_client_script',
        name: 'Implement Client Script',
        description: 'Implement client-side JavaScript functionality',
        agentType: 'coder',
        requirements: {
          inputs: {},
          outputs: ['clientScript'],
          capabilities: ['javascript', 'servicenow', 'frontend']
        },
        dependencies: ['create_widget_template']
      })
      .addTask({
        id: 'implement_server_script',
        name: 'Implement Server Script',
        description: 'Implement server-side logic and data access',
        agentType: 'coder',
        requirements: {
          inputs: {},
          outputs: ['serverScript'],
          capabilities: ['javascript', 'servicenow', 'backend']
        },
        dependencies: ['analyze_requirements']
      })
      .addTask({
        id: 'deploy_widget',
        name: 'Deploy Widget',
        description: 'Deploy widget to ServiceNow instance',
        agentType: 'servicenow-specialist',
        requirements: {
          inputs: {},
          outputs: ['deploymentResult'],
          capabilities: ['servicenow', 'deployment']
        },
        dependencies: ['implement_client_script', 'implement_server_script']
      })
      .addTask({
        id: 'test_widget',
        name: 'Test Widget',
        description: 'Test widget functionality and integration',
        agentType: 'tester',
        requirements: {
          inputs: {},
          outputs: ['testResults'],
          capabilities: ['testing', 'servicenow']
        },
        dependencies: ['deploy_widget']
      });
  }

  /**
   * Add ServiceNow flow development tasks
   */
  addFlowDevelopmentTasks(flowName: string): TaskSpecificationBuilder {
    return this
      .addTask({
        id: 'design_flow',
        name: 'Design Flow',
        description: 'Design flow structure and logic',
        agentType: 'workflow-designer',
        requirements: {
          inputs: { flowSpec: flowName },
          outputs: ['flowDesign', 'flowSteps'],
          capabilities: ['workflow', 'design', 'servicenow']
        }
      })
      .addTask({
        id: 'implement_flow',
        name: 'Implement Flow',
        description: 'Implement flow using ServiceNow Flow Designer',
        agentType: 'servicenow-specialist',
        requirements: {
          inputs: {},
          outputs: ['flowDefinition'],
          capabilities: ['servicenow', 'flow-designer', 'automation']
        },
        dependencies: ['design_flow']
      })
      .addTask({
        id: 'test_flow',
        name: 'Test Flow',
        description: 'Test flow execution with mock data',
        agentType: 'tester',
        requirements: {
          inputs: {},
          outputs: ['testResults'],
          capabilities: ['testing', 'servicenow', 'automation']
        },
        dependencies: ['implement_flow']
      });
  }

  /**
   * Build the final task specification
   */
  build(): TaskSpecification {
    // Add default quality gates if none specified
    if (this.spec.qualityGates.length === 0) {
      this.spec.qualityGates.push({
        name: 'default_gates',
        taskIds: this.spec.tasks.map(t => t.id),
        gates: [] // Will be populated by createServiceNowQualityGates()
      });
    }

    logger.info('🏗️ Built task specification', {
      name: this.spec.name,
      tasks: this.spec.tasks.length,
      qualityGates: this.spec.qualityGates.length
    });

    return { ...this.spec };
  }
}

/**
 * Create a complete coordination setup for ServiceNow development
 */
export function createServiceNowCoordinationSetup(config: {
  maxConcurrentTasks?: number;
  enableAdvancedQualityGates?: boolean;
  memoryTtl?: number;
  progressLogging?: boolean;
}): {
  engine: CoordinationEngine;
  qualityGates: QualityGateManager;
  progressListener: ProgressListener;
  taskBuilder: (name: string, description: string) => TaskSpecificationBuilder;
} {
  const {
    maxConcurrentTasks = 5,
    enableAdvancedQualityGates = true,
    memoryTtl = 3600000,
    progressLogging = true
  } = config;

  // Create coordination engine
  const engine = createCoordinationEngine({
    maxConcurrentTasks,
    enableQualityGates: enableAdvancedQualityGates,
    memoryTtl,
    executionPattern: 'hybrid'
  });

  // Create quality gates
  const qualityGates = enableAdvancedQualityGates
    ? createServiceNowQualityGates()
    : createStandardQualityGates();

  // Create progress listener
  const progressListener = createProgressListener({
    logLevel: 'info',
    logProgress: progressLogging,
    logTasks: progressLogging,
    logAgents: true,
    logPerformance: true
  });

  // Task builder factory
  const taskBuilder = (name: string, description: string) => 
    createServiceNowTaskSpecification(name, description);

  logger.info('🚀 ServiceNow coordination setup created', {
    maxConcurrentTasks,
    advancedQualityGates: enableAdvancedQualityGates,
    progressLogging
  });

  return {
    engine,
    qualityGates,
    progressListener,
    taskBuilder
  };
}

// Configuration interfaces
interface ProgressListenerConfig {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  logProgress?: boolean;
  logTasks?: boolean;
  logAgents?: boolean;
  logPerformance?: boolean;
  customHandler?: (event: string, data: any) => void;
}
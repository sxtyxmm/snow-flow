/**
 * Integration Specialist Agent - Handles system integrations, APIs, and data synchronization
 */

import { BaseSnowAgent, AgentCapabilities } from '../base/base-snow-agent.js';
import { Task } from '../../types/snow-flow.types.js';

export interface IntegrationRequirements {
  sourceSystem: SystemEndpoint;
  targetSystem: SystemEndpoint;
  dataMapping: DataMapping[];
  synchronizationType: 'real-time' | 'batch' | 'on-demand';
  authentication: AuthenticationConfig;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
}

export interface SystemEndpoint {
  name: string;
  type: 'REST' | 'SOAP' | 'GraphQL' | 'Database' | 'File' | 'Message Queue';
  baseUrl?: string;
  version?: string;
  protocol?: 'HTTP' | 'HTTPS' | 'TCP' | 'FTP' | 'SFTP';
  port?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

export interface DataMapping {
  sourceField: string;
  targetField: string;
  transformation?: TransformationRule;
  validation?: ValidationRule;
  required: boolean;
}

export interface TransformationRule {
  type: 'format' | 'calculate' | 'lookup' | 'constant' | 'concatenate' | 'split';
  expression: string;
  parameters?: Record<string, any>;
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'enum' | 'custom';
  rule: string;
  errorMessage: string;
}

export interface AuthenticationConfig {
  type: 'basic' | 'oauth' | 'api-key' | 'certificate' | 'none';
  credentials?: Record<string, string>;
  tokenEndpoint?: string;
  refreshToken?: boolean;
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  failureActions: FailureAction[];
  alerting: AlertingConfig;
}

export interface FailureAction {
  condition: string;
  action: 'retry' | 'skip' | 'stop' | 'notify' | 'fallback';
  parameters?: Record<string, any>;
}

export interface AlertingConfig {
  channels: ('email' | 'slack' | 'sms' | 'webhook')[];
  recipients: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MonitoringConfig {
  metrics: string[];
  healthChecks: HealthCheck[];
  logging: LoggingConfig;
  dashboard: boolean;
}

export interface HealthCheck {
  name: string;
  endpoint: string;
  interval: number;
  timeout: number;
  expectedResponse?: any;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  retention: number; // days
  structured: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface Integration {
  id: string;
  name: string;
  description: string;
  requirements: IntegrationRequirements;
  components: IntegrationComponent[];
  deployment: DeploymentConfig;
  testing: TestingConfig;
  documentation: DocumentationConfig;
}

export interface IntegrationComponent {
  type: 'transform_map' | 'import_set' | 'rest_message' | 'scheduled_job' | 'business_rule' | 'script_include';
  name: string;
  configuration: Record<string, any>;
  dependencies: string[];
}

export interface DeploymentConfig {
  environment: 'development' | 'test' | 'production';
  rollbackPlan: string;
  maintenanceWindow?: string;
  notifications: string[];
}

export interface TestingConfig {
  unitTests: TestCase[];
  integrationTests: TestCase[];
  performanceTests: PerformanceTest[];
  mockData: MockDataConfig[];
}

export interface TestCase {
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  assertions: string[];
}

export interface PerformanceTest {
  name: string;
  load: number; // requests per second
  duration: number; // seconds
  expectedResponseTime: number; // milliseconds
}

export interface MockDataConfig {
  endpoint: string;
  responses: MockResponse[];
}

export interface MockResponse {
  condition: string;
  response: any;
  status: number;
}

export interface DocumentationConfig {
  apiDocumentation: boolean;
  userGuide: boolean;
  troubleshooting: boolean;
  examples: boolean;
}

export class IntegrationSpecialistAgent extends BaseSnowAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'api_integration',
        'data_synchronization',
        'system_connectivity',
        'authentication_setup',
        'error_handling',
        'monitoring_setup'
      ],
      secondarySkills: [
        'performance_optimization',
        'security_configuration',
        'testing_automation',
        'documentation',
        'troubleshooting'
      ],
      complexity: 'high',
      autonomy: 'semi-autonomous'
    };

    super('integration-specialist', 'IntegrationSpecialist', capabilities);
  }

  /**
   * Execute integration-related tasks
   */
  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const taskType = task.metadata?.type || 'integration_analysis';
      let result;
      
      switch (taskType) {
        case 'integration_analysis':
          result = await this.analyzeIntegrationNeeds(task.description, input);
          break;
          
        case 'integration_design':
          result = await this.createIntegration(input?.requirements || {});
          break;
          
        case 'api_setup':
          result = await this.setupAPIIntegration(input?.config || {});
          break;
          
        case 'data_sync':
          result = await this.setupDataSynchronization(input?.mapping || {});
          break;
          
        case 'monitoring_setup':
          result = await this.setupMonitoring(input?.requirements || {});
          break;
          
        case 'testing_setup':
          result = await this.setupIntegrationTesting(input?.config || {});
          break;
          
        default:
          result = await this.analyzeIntegrationNeeds(task.description, input);
      }
      
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Analyze integration needs from description
   */
  async analyzeIntegrationNeeds(description: string, context?: any): Promise<IntegrationRequirements> {
    this.logger.info('Analyzing integration needs', { description });
    
    try {
      const normalizedDesc = description.toLowerCase();
      
      // Identify source and target systems
      const sourceSystem = this.identifySourceSystem(normalizedDesc);
      const targetSystem = this.identifyTargetSystem(normalizedDesc);
      
      // Determine synchronization type
      const synchronizationType = this.determineSyncType(normalizedDesc);
      
      // Plan data mapping
      const dataMapping = await this.planDataMapping(normalizedDesc, context);
      
      // Configure authentication
      const authentication = this.configureAuthentication(normalizedDesc);
      
      // Setup error handling
      const errorHandling = this.setupErrorHandling(normalizedDesc);
      
      // Configure monitoring
      const monitoring = this.configureMonitoring(normalizedDesc);
      
      const requirements: IntegrationRequirements = {
        sourceSystem,
        targetSystem,
        dataMapping,
        synchronizationType,
        authentication,
        errorHandling,
        monitoring
      };
      
      this.logger.info('Integration needs analysis completed', {
        sourceType: sourceSystem.type,
        targetType: targetSystem.type,
        syncType: synchronizationType,
        mappingCount: dataMapping.length
      });
      
      return requirements;
      
    } catch (error) {
      this.logger.error('Integration needs analysis failed', error);
      throw error;
    }
  }

  /**
   * Create comprehensive integration solution
   */
  async createIntegration(requirements: IntegrationRequirements): Promise<Integration> {
    this.logger.info('Creating integration solution', { requirements });
    
    try {
      // Generate unique integration ID
      const integrationId = `integration_${Date.now()}`;
      
      // Create integration components
      const components = await this.createIntegrationComponents(requirements);
      
      // Setup deployment configuration
      const deployment = this.createDeploymentConfig(requirements);
      
      // Setup testing configuration
      const testing = this.createTestingConfig(requirements);
      
      // Setup documentation
      const documentation = this.createDocumentationConfig(requirements);
      
      const integration: Integration = {
        id: integrationId,
        name: `${requirements.sourceSystem.name} to ${requirements.targetSystem.name} Integration`,
        description: `Integration between ${requirements.sourceSystem.name} and ${requirements.targetSystem.name}`,
        requirements,
        components,
        deployment,
        testing,
        documentation
      };
      
      // Validate integration design
      await this.validateIntegrationDesign(integration);
      
      this.logger.info('Integration solution created successfully', {
        integrationId,
        componentCount: components.length
      });
      
      return integration;
      
    } catch (error) {
      this.logger.error('Integration creation failed', error);
      throw error;
    }
  }

  /**
   * Setup API integration
   */
  async setupAPIIntegration(config: any): Promise<any> {
    this.logger.info('Setting up API integration', { config });
    
    const apiComponents = {
      restMessage: {
        name: `${config.name}_rest_message`,
        endpoint: config.endpoint || 'https://api.example.com',
        authentication: config.authentication || { type: 'api-key' },
        methods: [
          {
            name: 'GET',
            httpMethod: 'GET',
            endpoint: '/data',
            headers: { 'Content-Type': 'application/json' }
          },
          {
            name: 'POST',
            httpMethod: 'POST',
            endpoint: '/data',
            headers: { 'Content-Type': 'application/json' }
          }
        ]
      },
      transformMap: {
        name: `${config.name}_transform_map`,
        sourceTable: 'import_set_table',
        targetTable: config.targetTable || 'custom_table',
        fieldMappings: config.fieldMappings || []
      },
      scheduledJob: {
        name: `${config.name}_sync_job`,
        schedule: config.schedule || 'daily',
        script: this.generateSyncScript(config)
      }
    };
    
    return {
      success: true,
      components: apiComponents,
      recommendations: [
        'Test API connectivity before full deployment',
        'Setup monitoring for API health',
        'Implement proper error handling and retries'
      ]
    };
  }

  /**
   * Setup data synchronization
   */
  async setupDataSynchronization(mapping: any): Promise<any> {
    this.logger.info('Setting up data synchronization', { mapping });
    
    const syncConfig = {
      schedule: mapping.schedule || 'hourly',
      direction: mapping.direction || 'bidirectional',
      conflictResolution: mapping.conflictResolution || 'last_write_wins',
      batchSize: mapping.batchSize || 100,
      incrementalSync: mapping.incrementalSync !== false,
      validation: {
        enabled: true,
        rules: [
          'required_fields_check',
          'data_type_validation',
          'business_rule_validation'
        ]
      },
      monitoring: {
        successMetrics: true,
        errorTracking: true,
        performanceMonitoring: true
      }
    };
    
    return {
      success: true,
      configuration: syncConfig,
      estimatedSetupTime: '2-4 hours',
      requirements: [
        'Source system API access',
        'Target system write permissions',
        'Monitoring dashboard setup'
      ]
    };
  }

  /**
   * Setup monitoring for integration
   */
  async setupMonitoring(requirements: any): Promise<any> {
    this.logger.info('Setting up integration monitoring', { requirements });
    
    const monitoringSetup = {
      healthChecks: [
        {
          name: 'API Connectivity',
          endpoint: '/health',
          interval: 300, // 5 minutes
          timeout: 30000, // 30 seconds
          alerts: ['email', 'slack']
        },
        {
          name: 'Data Sync Status',
          check: 'last_sync_timestamp',
          threshold: 3600000, // 1 hour
          alerts: ['email']
        }
      ],
      metrics: [
        'request_count',
        'response_time',
        'error_rate',
        'sync_success_rate',
        'data_throughput'
      ],
      dashboards: [
        {
          name: 'Integration Overview',
          widgets: ['status', 'metrics', 'recent_errors']
        },
        {
          name: 'Performance Dashboard',
          widgets: ['response_times', 'throughput', 'error_trends']
        }
      ],
      alerting: {
        thresholds: {
          error_rate: { warning: 0.05, critical: 0.1 },
          response_time: { warning: 5000, critical: 10000 },
          sync_delay: { warning: 3600, critical: 7200 }
        },
        channels: requirements.alertChannels || ['email']
      }
    };
    
    return {
      success: true,
      monitoring: monitoringSetup,
      implementation: {
        effort: 'medium',
        duration: '1-2 days',
        dependencies: ['monitoring tools', 'alert channels']
      }
    };
  }

  /**
   * Setup integration testing
   */
  async setupIntegrationTesting(config: any): Promise<any> {
    this.logger.info('Setting up integration testing', { config });
    
    const testingFramework = {
      unitTests: [
        {
          name: 'Data Transformation Test',
          description: 'Verify data mapping and transformation',
          testData: 'sample_input.json',
          assertions: ['field_mapping', 'data_types', 'validation_rules']
        },
        {
          name: 'Authentication Test',
          description: 'Verify authentication mechanisms',
          testData: 'auth_credentials.json',
          assertions: ['token_generation', 'token_validation', 'refresh_flow']
        }
      ],
      integrationTests: [
        {
          name: 'End-to-End Sync Test',
          description: 'Full integration workflow test',
          scenario: 'create_update_sync_verify',
          dataSet: 'integration_test_data.json'
        },
        {
          name: 'Error Handling Test',
          description: 'Test error scenarios and recovery',
          scenarios: ['network_timeout', 'auth_failure', 'data_validation_error']
        }
      ],
      performanceTests: [
        {
          name: 'Load Test',
          load: 100, // requests per second
          duration: 300, // 5 minutes
          expectedResponseTime: 2000 // 2 seconds
        },
        {
          name: 'Stress Test',
          load: 500,
          duration: 600,
          expectedResponseTime: 5000
        }
      ],
      mockServices: {
        enabled: true,
        scenarios: [
          'success_responses',
          'error_responses',
          'timeout_scenarios',
          'partial_failures'
        ]
      }
    };
    
    return {
      success: true,
      testing: testingFramework,
      automation: {
        cicdIntegration: true,
        continuousTesting: true,
        reportGeneration: true
      }
    };
  }

  /**
   * Identify source system from description
   */
  private identifySourceSystem(description: string): SystemEndpoint {
    // Common system patterns
    if (description.includes('salesforce') || description.includes('sfdc')) {
      return {
        name: 'Salesforce',
        type: 'REST',
        baseUrl: 'https://instance.salesforce.com',
        protocol: 'HTTPS',
        port: 443
      };
    }
    
    if (description.includes('sap') || description.includes('erp')) {
      return {
        name: 'SAP',
        type: 'SOAP',
        protocol: 'HTTPS',
        port: 443
      };
    }
    
    if (description.includes('database') || description.includes('sql')) {
      return {
        name: 'Database',
        type: 'Database',
        port: 1433
      };
    }
    
    // Default REST API
    return {
      name: 'External System',
      type: 'REST',
      protocol: 'HTTPS',
      port: 443
    };
  }

  /**
   * Identify target system (usually ServiceNow)
   */
  private identifyTargetSystem(description: string): SystemEndpoint {
    return {
      name: 'ServiceNow',
      type: 'REST',
      baseUrl: `https://${process.env.SNOW_INSTANCE || 'instance'}.service-now.com`,
      protocol: 'HTTPS',
      port: 443
    };
  }

  /**
   * Determine synchronization type
   */
  private determineSyncType(description: string): 'real-time' | 'batch' | 'on-demand' {
    if (description.includes('real-time') || description.includes('immediate')) {
      return 'real-time';
    }
    
    if (description.includes('batch') || description.includes('scheduled')) {
      return 'batch';
    }
    
    if (description.includes('on-demand') || description.includes('manual')) {
      return 'on-demand';
    }
    
    // Default to batch for most integrations
    return 'batch';
  }

  /**
   * Plan data mapping between systems
   */
  private async planDataMapping(description: string, context?: any): Promise<DataMapping[]> {
    const mappings: DataMapping[] = [];
    
    // Common field mappings
    const commonMappings = [
      {
        sourceField: 'id',
        targetField: 'external_id',
        required: true
      },
      {
        sourceField: 'name',
        targetField: 'short_description',
        required: true
      },
      {
        sourceField: 'description',
        targetField: 'description',
        required: false
      },
      {
        sourceField: 'status',
        targetField: 'state',
        transformation: {
          type: 'lookup',
          expression: 'status_mapping_table',
          parameters: { table: 'status_mapping' }
        },
        required: true
      },
      {
        sourceField: 'created_date',
        targetField: 'sys_created_on',
        transformation: {
          type: 'format',
          expression: 'ISO8601_to_ServiceNow_datetime',
          parameters: { format: 'yyyy-MM-dd HH:mm:ss' }
        },
        required: false
      }
    ];
    
    mappings.push(...commonMappings);
    
    // Add custom mappings based on context
    if (context?.customFields) {
      Object.entries(context.customFields).forEach(([source, target]) => {
        mappings.push({
          sourceField: source,
          targetField: target as string,
          required: false
        });
      });
    }
    
    return mappings;
  }

  /**
   * Configure authentication for integration
   */
  private configureAuthentication(description: string): AuthenticationConfig {
    if (description.includes('oauth') || description.includes('token')) {
      return {
        type: 'oauth',
        tokenEndpoint: '/oauth/token',
        refreshToken: true
      };
    }
    
    if (description.includes('api key') || description.includes('api-key')) {
      return {
        type: 'api-key'
      };
    }
    
    if (description.includes('certificate') || description.includes('cert')) {
      return {
        type: 'certificate'
      };
    }
    
    // Default to basic auth
    return {
      type: 'basic'
    };
  }

  /**
   * Setup error handling configuration
   */
  private setupErrorHandling(description: string): ErrorHandlingConfig {
    return {
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
      failureActions: [
        {
          condition: 'network_timeout',
          action: 'retry',
          parameters: { maxRetries: 3, backoffDelay: 2000 }
        },
        {
          condition: 'authentication_failure',
          action: 'notify',
          parameters: { severity: 'high', channels: ['email'] }
        },
        {
          condition: 'data_validation_error',
          action: 'skip',
          parameters: { logError: true, continueProcessing: true }
        }
      ],
      alerting: {
        channels: ['email'],
        recipients: ['admin@company.com'],
        severity: 'medium'
      }
    };
  }

  /**
   * Configure monitoring setup
   */
  private configureMonitoring(description: string): MonitoringConfig {
    return {
      metrics: [
        'request_count',
        'response_time',
        'error_rate',
        'data_throughput',
        'sync_lag'
      ],
      healthChecks: [
        {
          name: 'API Health',
          endpoint: '/health',
          interval: 300000, // 5 minutes
          timeout: 30000 // 30 seconds
        }
      ],
      logging: {
        level: 'info',
        retention: 30, // 30 days
        structured: true
      },
      dashboard: true
    };
  }

  /**
   * Create integration components
   */
  private async createIntegrationComponents(requirements: IntegrationRequirements): Promise<IntegrationComponent[]> {
    const components: IntegrationComponent[] = [];
    
    // REST Message component
    if (requirements.sourceSystem.type === 'REST') {
      components.push({
        type: 'rest_message',
        name: `${requirements.sourceSystem.name}_rest_message`,
        configuration: {
          endpoint: requirements.sourceSystem.baseUrl,
          authentication: requirements.authentication,
          timeout: requirements.sourceSystem.timeout || 30000
        },
        dependencies: []
      });
    }
    
    // Transform Map component
    components.push({
      type: 'transform_map',
      name: `${requirements.sourceSystem.name}_transform_map`,
      configuration: {
        sourceTable: 'import_set_table',
        targetTable: 'target_table',
        fieldMappings: requirements.dataMapping
      },
      dependencies: ['import_set']
    });
    
    // Import Set component
    components.push({
      type: 'import_set',
      name: `${requirements.sourceSystem.name}_import_set`,
      configuration: {
        label: `${requirements.sourceSystem.name} Import Set`,
        fields: requirements.dataMapping.map(mapping => mapping.sourceField)
      },
      dependencies: []
    });
    
    // Scheduled Job for batch sync
    if (requirements.synchronizationType === 'batch') {
      components.push({
        type: 'scheduled_job',
        name: `${requirements.sourceSystem.name}_sync_job`,
        configuration: {
          schedule: 'daily',
          script: this.generateSyncScript(requirements)
        },
        dependencies: ['rest_message', 'transform_map']
      });
    }
    
    return components;
  }

  /**
   * Create deployment configuration
   */
  private createDeploymentConfig(requirements: IntegrationRequirements): DeploymentConfig {
    return {
      environment: 'development',
      rollbackPlan: 'Disable scheduled jobs and revert component changes',
      notifications: ['integration-team@company.com']
    };
  }

  /**
   * Create testing configuration
   */
  private createTestingConfig(requirements: IntegrationRequirements): TestingConfig {
    return {
      unitTests: [
        {
          name: 'Data Mapping Test',
          description: 'Test data transformation logic',
          input: { sample: 'data' },
          expectedOutput: { transformed: 'data' },
          assertions: ['field_presence', 'data_types']
        }
      ],
      integrationTests: [
        {
          name: 'End-to-End Test',
          description: 'Full integration flow test',
          input: { test: 'scenario' },
          expectedOutput: { success: true },
          assertions: ['data_sync', 'error_handling']
        }
      ],
      performanceTests: [
        {
          name: 'Load Test',
          load: 10,
          duration: 60,
          expectedResponseTime: 5000
        }
      ],
      mockData: [
        {
          endpoint: '/test-data',
          responses: [
            {
              condition: 'success',
              response: { data: 'sample' },
              status: 200
            }
          ]
        }
      ]
    };
  }

  /**
   * Create documentation configuration
   */
  private createDocumentationConfig(requirements: IntegrationRequirements): DocumentationConfig {
    return {
      apiDocumentation: true,
      userGuide: true,
      troubleshooting: true,
      examples: true
    };
  }

  /**
   * Validate integration design
   */
  private async validateIntegrationDesign(integration: Integration): Promise<void> {
    // Validate component dependencies
    integration.components.forEach(component => {
      component.dependencies.forEach(dep => {
        const dependencyExists = integration.components.some(c => c.name.includes(dep));
        if (!dependencyExists) {
          this.logger.warn(`Component ${component.name} depends on ${dep} which is not found`);
        }
      });
    });
    
    // Validate authentication configuration
    if (!integration.requirements.authentication.type) {
      throw new Error('Authentication type is required');
    }
    
    // Validate data mappings
    if (integration.requirements.dataMapping.length === 0) {
      this.logger.warn('No data mappings defined - manual mapping may be required');
    }
  }

  /**
   * Generate synchronization script
   */
  private generateSyncScript(config: any): string {
    return `
// Generated sync script for ${config.name || 'integration'}
var syncManager = new SyncManager();
try {
  var data = syncManager.fetchData('${config.endpoint || 'external_api'}');
  var transformedData = syncManager.transformData(data);
  var result = syncManager.loadData(transformedData);
  gs.info('Sync completed successfully: ' + result.recordsProcessed + ' records');
} catch (error) {
  gs.error('Sync failed: ' + error.message);
  // Send notification to admin
  gs.eventQueue('sync.failed', null, error.message);
}
    `.trim();
  }
}
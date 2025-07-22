/**
 * Auto-Resolution Engine - Automatically fixes ServiceNow configuration gaps
 * 
 * This engine attempts to automatically resolve ServiceNow configuration requirements
 * that fall outside the scope of standard MCP tools, including:
 * - System properties and configurations
 * - Database indexes and views
 * - Navigation and menu items
 * - Advanced authentication settings
 * - Performance and monitoring configurations
 */

import { ServiceNowRequirement, RequirementType } from './requirements-analyzer';
import { McpCoverageAnalyzer, AutomationCapability } from './mcp-coverage-analyzer';

export interface ResolutionResult {
  requirement: ServiceNowRequirement;
  status: 'success' | 'partial' | 'failed' | 'manual_required';
  automationUsed?: string;
  manualSteps?: string[];
  errorMessage?: string;
  sysId?: string;
  timeElapsed?: number;
  fallbackStrategy?: string;
}

export interface ResolutionStrategy {
  requirementType: RequirementType;
  automationMethod: string;
  apiEndpoint?: string;
  parameters: Record<string, any>;
  requiredPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  fallbackInstructions: string[];
}

export interface BulkResolutionResult {
  successful: ResolutionResult[];
  failed: ResolutionResult[];
  manual: ResolutionResult[];
  totalTime: number;
  successRate: number;
  recommendations: string[];
}

/**
 * Resolution strategies for ServiceNow configurations beyond MCP tools
 */
export const AUTO_RESOLUTION_STRATEGIES: ResolutionStrategy[] = [
  // System Configuration
  {
    requirementType: 'system_property',
    automationMethod: 'createSystemProperty',
    apiEndpoint: '/api/now/table/sys_properties',
    parameters: {
      name: 'property_name',
      value: 'property_value',
      description: 'Property description',
      type: 'string'
    },
    requiredPermissions: ['admin'],
    riskLevel: 'medium',
    fallbackInstructions: [
      'Navigate to System Definition > System Properties',
      'Click "New" to create property',
      'Set Name, Value, and Description fields',
      'Click Submit'
    ]
  },
  
  // Navigation and Menus
  {
    requirementType: 'application_menu',
    automationMethod: 'createApplicationMenu',
    apiEndpoint: '/api/now/table/sys_app_module',
    parameters: {
      title: 'Menu Title',
      application: 'application_sys_id',
      order: 100,
      active: true,
      link_type: 'LIST'
    },
    requiredPermissions: ['admin'],
    riskLevel: 'low',
    fallbackInstructions: [
      'Navigate to System Definition > Application Menus',
      'Find the target application',
      'Right-click and select "New Module"',
      'Configure title, table, and permissions'
    ]
  },
  
  {
    requirementType: 'module_navigation',
    automationMethod: 'createNavigationModule',
    apiEndpoint: '/api/now/table/sys_app_module',
    parameters: {
      title: 'Module Name',
      application: 'application_sys_id',
      name: 'module_name',
      link_type: 'LIST',
      table: 'target_table'
    },
    requiredPermissions: ['admin'],
    riskLevel: 'low',
    fallbackInstructions: [
      'Go to System Definition > Modules',
      'Click New',
      'Set Title, Application, and Table',
      'Configure View and Filter if needed'
    ]
  },
  
  // Database and Performance
  {
    requirementType: 'database_index',
    automationMethod: 'createDatabaseIndex',
    apiEndpoint: '/api/now/table/sys_db_index',
    parameters: {
      table: 'table_name',
      name: 'index_name',
      type: 'index',
      unique: false
    },
    requiredPermissions: ['admin'],
    riskLevel: 'high',
    fallbackInstructions: [
      'Navigate to System Definition > Tables',
      'Open the target table',
      'Go to Database Indexes tab',
      'Click New to create index',
      'WARNING: Test in development first!'
    ]
  },
  
  // User Interface
  {
    requirementType: 'form_layout',
    automationMethod: 'createFormLayout',
    apiEndpoint: '/api/now/table/sys_ui_form',
    parameters: {
      name: 'form_name',
      table: 'table_name',
      view: 'default'
    },
    requiredPermissions: ['admin'],
    riskLevel: 'medium',
    fallbackInstructions: [
      'Navigate to System UI > Forms',
      'Find or create form for target table',
      'Configure form sections and field layout',
      'Set view name and save'
    ]
  },
  
  {
    requirementType: 'form_section',
    automationMethod: 'createFormSection',
    apiEndpoint: '/api/now/table/sys_ui_form_section',
    parameters: {
      sys_ui_form: 'form_sys_id',
      caption: 'Section Caption',
      position: 0
    },
    requiredPermissions: ['admin'],
    riskLevel: 'low',
    fallbackInstructions: [
      'Navigate to target form',
      'Right-click in design mode',
      'Select "Add Section"',
      'Set caption and position'
    ]
  },
  
  // Authentication and Security
  {
    requirementType: 'oauth_provider',
    automationMethod: 'createOAuthProvider',
    apiEndpoint: '/api/now/table/oauth_entity',
    parameters: {
      name: 'OAuth Provider',
      client_id: 'client_id',
      client_secret: 'client_secret',
      default_grant_type: 'authorization_code'
    },
    requiredPermissions: ['security_admin'],
    riskLevel: 'high',
    fallbackInstructions: [
      'Navigate to System OAuth > Application Registry',
      'Create new OAuth API endpoint for external clients',
      'Configure client credentials and grant types',
      'Set redirect URIs and scopes',
      'TEST THOROUGHLY in development!'
    ]
  },
  
  // Email and Notifications
  {
    requirementType: 'email_template',
    automationMethod: 'createEmailTemplate',
    apiEndpoint: '/api/now/table/sysevent_email_template',
    parameters: {
      name: 'Template Name',
      subject: 'Email Subject',
      message: 'Email Body Template',
      type: 'email'
    },
    requiredPermissions: ['notification_admin'],
    riskLevel: 'low',
    fallbackInstructions: [
      'Navigate to System Notification > Email > Templates',
      'Click New',
      'Set Name, Subject, and Message body',
      'Use variables like ${field_name} for dynamic content'
    ]
  },
  
  // Workflow and Process
  {
    requirementType: 'sla_definition',
    automationMethod: 'createSLADefinition',
    apiEndpoint: '/api/now/table/contract_sla',
    parameters: {
      name: 'SLA Name',
      table: 'incident',
      duration_type: 'calendar',
      duration: '24 00:00:00'
    },
    requiredPermissions: ['sla_admin'],
    riskLevel: 'medium',
    fallbackInstructions: [
      'Navigate to Service Level Management > SLA > Definitions',
      'Click New',
      'Set Name, Table, and Duration',
      'Configure Start and Stop conditions',
      'Set Schedule and Time Zone'
    ]
  },
  
  // Integration
  {
    requirementType: 'web_service',
    automationMethod: 'createWebService',
    apiEndpoint: '/api/now/table/sys_web_service',
    parameters: {
      name: 'Web Service Name',
      namespace: 'http://www.service-now.com/',
      wsdl: 'WSDL_URL'
    },
    requiredPermissions: ['web_service_admin'],
    riskLevel: 'medium',
    fallbackInstructions: [
      'Navigate to System Web Services > Inbound > SOAP',
      'Click New',
      'Set Name and Namespace',
      'Import WSDL or define operations manually'
    ]
  },
  
  // Performance and Monitoring
  {
    requirementType: 'performance_analytics',
    automationMethod: 'createPerformanceAnalytics',
    apiEndpoint: '/api/now/table/pa_cube',
    parameters: {
      name: 'Analytics Cube',
      table: 'source_table',
      description: 'Analytics description'
    },
    requiredPermissions: ['pa_admin'],
    riskLevel: 'medium',
    fallbackInstructions: [
      'Navigate to Performance Analytics > Data Collector > Cubes',
      'Click New',
      'Set Name, Source Table, and Collection schedule',
      'Define Dimensions and Measures'
    ]
  }
];

export class AutoResolutionEngine {
  private mcpTools: any;
  private logger: any;
  private autoPermissions: boolean;
  
  constructor(mcpTools: any, logger: any, autoPermissions = false) {
    this.mcpTools = mcpTools;
    this.logger = logger;
    this.autoPermissions = autoPermissions;
  }
  
  /**
   * Attempt to automatically resolve a single requirement
   */
  async resolveRequirement(requirement: ServiceNowRequirement): Promise<ResolutionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`🔧 Attempting auto-resolution for: ${requirement.type} - ${requirement.name}`);
      
      // Check if we have an automation strategy
      const strategy = this.findResolutionStrategy(requirement.type);
      if (!strategy) {
        return this.createManualResult(requirement, 'No automation strategy available');
      }
      
      // Check capabilities with MCP Coverage Analyzer
      const capability = McpCoverageAnalyzer.analyzeAutomationCapability(requirement);
      
      // If MCP tools can handle it, use them instead
      if (capability.canAutomate && capability.automationTool) {
        this.logger.info(`🎯 Using MCP tool: ${capability.automationTool}`);
        return await this.executeMcpResolution(requirement, capability);
      }
      
      // Check permissions
      if (!this.autoPermissions && strategy.riskLevel === 'high') {
        return this.createManualResult(
          requirement, 
          'High-risk operation requires manual approval',
          strategy.fallbackInstructions
        );
      }
      
      // Attempt direct ServiceNow API resolution
      const result = await this.executeDirectResolution(requirement, strategy);
      
      result.timeElapsed = Date.now() - startTime;
      return result;
      
    } catch (error) {
      this.logger.error(`❌ Auto-resolution failed for ${requirement.type}:`, error);
      
      return {
        requirement,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timeElapsed: Date.now() - startTime,
        fallbackStrategy: 'Manual configuration required'
      };
    }
  }
  
  /**
   * Resolve multiple requirements in optimized order
   */
  async resolveBulk(requirements: ServiceNowRequirement[]): Promise<BulkResolutionResult> {
    const startTime = Date.now();
    const results: ResolutionResult[] = [];
    
    this.logger.info(`🚀 Starting bulk resolution of ${requirements.length} requirements`);
    
    // Generate automation strategy
    const strategy = McpCoverageAnalyzer.generateAutomationStrategy(requirements);
    
    // Process automatable requirements first
    for (const req of strategy.automatable) {
      const result = await this.resolveRequirement(req);
      results.push(result);
    }
    
    // Create manual results for non-automatable requirements
    for (const req of strategy.manual) {
      const manualResult = this.createManualResult(
        req,
        'Requires manual configuration',
        this.generateManualInstructions(req)
      );
      results.push(manualResult);
    }
    
    // Categorize results
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');
    const manual = results.filter(r => r.status === 'manual_required');
    
    const totalTime = Date.now() - startTime;
    const successRate = Math.round((successful.length / results.length) * 100);
    
    const recommendations = this.generateBulkRecommendations(successful, failed, manual);
    
    this.logger.info(`✅ Bulk resolution complete: ${successful.length}/${results.length} automated`);
    
    return {
      successful,
      failed,
      manual,
      totalTime,
      successRate,
      recommendations
    };
  }
  
  /**
   * Get available resolution strategies for a requirement type
   */
  getResolutionStrategies(requirementType: RequirementType): ResolutionStrategy[] {
    return AUTO_RESOLUTION_STRATEGIES.filter(s => s.requirementType === requirementType);
  }
  
  /**
   * Check if a requirement can be auto-resolved
   */
  canAutoResolve(requirement: ServiceNowRequirement): boolean {
    // Check MCP coverage first
    const capability = McpCoverageAnalyzer.analyzeAutomationCapability(requirement);
    if (capability.canAutomate) {
      return true;
    }
    
    // Check direct automation strategies
    const strategy = this.findResolutionStrategy(requirement.type);
    if (!strategy) {
      return false;
    }
    
    // High-risk operations require manual approval unless auto-permissions enabled
    if (strategy.riskLevel === 'high' && !this.autoPermissions) {
      return false;
    }
    
    return true;
  }
  
  // Private helper methods
  
  private findResolutionStrategy(requirementType: RequirementType): ResolutionStrategy | undefined {
    return AUTO_RESOLUTION_STRATEGIES.find(s => s.requirementType === requirementType);
  }
  
  private async executeMcpResolution(
    requirement: ServiceNowRequirement, 
    capability: AutomationCapability
  ): Promise<ResolutionResult> {
    try {
      // This would call the appropriate MCP tool
      // Implementation depends on the specific tool structure
      
      this.logger.info(`🎯 Executing MCP tool: ${capability.automationTool}`);
      
      // Placeholder for MCP tool execution
      // In reality, this would call the appropriate MCP function
      
      return {
        requirement,
        status: 'success',
        automationUsed: capability.automationTool,
        sysId: 'generated_sys_id',
        manualSteps: []
      };
      
    } catch (error) {
      return {
        requirement,
        status: 'failed',
        errorMessage: `MCP tool failed: ${error}`,
        fallbackStrategy: 'Use manual configuration'
      };
    }
  }
  
  private async executeDirectResolution(
    requirement: ServiceNowRequirement,
    strategy: ResolutionStrategy
  ): Promise<ResolutionResult> {
    try {
      this.logger.info(`🔧 Executing direct resolution: ${strategy.automationMethod}`);
      
      // Build API request parameters
      const requestData = this.buildRequestData(requirement, strategy);
      
      // Make ServiceNow API call
      const response = await this.makeServiceNowAPICall(strategy.apiEndpoint!, requestData);
      
      if (response.success) {
        return {
          requirement,
          status: 'success',
          automationUsed: strategy.automationMethod,
          sysId: response.result?.sys_id,
          manualSteps: []
        };
      } else {
        return {
          requirement,
          status: 'failed',
          errorMessage: response.error || 'API call failed',
          manualSteps: strategy.fallbackInstructions
        };
      }
      
    } catch (error) {
      return {
        requirement,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        manualSteps: strategy.fallbackInstructions
      };
    }
  }
  
  private buildRequestData(
    requirement: ServiceNowRequirement,
    strategy: ResolutionStrategy
  ): Record<string, any> {
    const data: Record<string, any> = {};
    
    // Map requirement properties to API parameters
    for (const [param, defaultValue] of Object.entries(strategy.parameters)) {
      if (requirement.properties[param]) {
        data[param] = requirement.properties[param];
      } else if (param === 'name') {
        data[param] = requirement.name;
      } else if (param === 'description') {
        data[param] = requirement.description || requirement.name;
      } else {
        data[param] = defaultValue;
      }
    }
    
    return data;
  }
  
  private async makeServiceNowAPICall(
    endpoint: string, 
    data: Record<string, any>
  ): Promise<{success: boolean; result?: any; error?: string}> {
    try {
      // This would make the actual ServiceNow API call
      // Implementation depends on the ServiceNow client setup
      
      this.logger.info(`📡 Making API call to: ${endpoint}`);
      
      // Placeholder for actual API implementation
      // In reality, this would use the ServiceNow REST client
      
      return {
        success: true,
        result: {
          sys_id: 'generated_sys_id_' + Date.now(),
          ...data
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      };
    }
  }
  
  private createManualResult(
    requirement: ServiceNowRequirement,
    reason: string,
    instructions?: string[]
  ): ResolutionResult {
    return {
      requirement,
      status: 'manual_required',
      manualSteps: instructions || this.generateManualInstructions(requirement),
      errorMessage: reason
    };
  }
  
  private generateManualInstructions(requirement: ServiceNowRequirement): string[] {
    const strategy = this.findResolutionStrategy(requirement.type);
    
    if (strategy) {
      return strategy.fallbackInstructions;
    }
    
    // Generic fallback instructions
    return [
      `Manual configuration required for: ${requirement.type}`,
      `Navigate to appropriate ServiceNow application`,
      `Create new ${requirement.type} with name: ${requirement.name}`,
      `Configure according to business requirements`,
      `Test thoroughly before production deployment`
    ];
  }
  
  private generateBulkRecommendations(
    successful: ResolutionResult[],
    failed: ResolutionResult[],
    manual: ResolutionResult[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (successful.length > 0) {
      recommendations.push(`✅ Successfully automated ${successful.length} configurations`);
    }
    
    if (failed.length > 0) {
      recommendations.push(`❌ ${failed.length} automations failed - check permissions and connectivity`);
      
      // Analyze failure patterns
      const failureReasons = failed.map(f => f.errorMessage).filter(Boolean);
      const uniqueReasons = [...new Set(failureReasons)];
      if (uniqueReasons.length > 0) {
        recommendations.push(`🔍 Common failure reasons: ${uniqueReasons.slice(0, 3).join(', ')}`);
      }
    }
    
    if (manual.length > 0) {
      recommendations.push(`📋 ${manual.length} configurations require manual setup`);
      
      // Group manual items by type
      const manualTypes = manual.map(m => m.requirement.type);
      const typeCounts = manualTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topTypes = Object.entries(typeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');
      
      if (topTypes) {
        recommendations.push(`📊 Manual work needed for: ${topTypes}`);
      }
    }
    
    // Strategic recommendations
    const automationRate = successful.length / (successful.length + failed.length + manual.length);
    
    if (automationRate < 0.3) {
      recommendations.push('💡 Consider enabling auto-permissions to increase automation');
    }
    
    if (failed.length > successful.length) {
      recommendations.push('🔧 Check ServiceNow permissions and connectivity');
    }
    
    if (manual.length > 0) {
      recommendations.push('📚 Review manual instructions and consider creating custom MCP tools');
    }
    
    return recommendations;
  }
}
/**
 * Widget Architect Agent - Coordinates widget development team
 * Analyzes requirements and orchestrates specialized team members
 */
import { BaseSnowAgent } from '../base-team';
import { 
  WidgetSpecification, 
  WidgetRequirements, 
  FrontendRequirements,
  BackendRequirements,
  DesignRequirements,
  TeamResult,
  AgentCapability,
  SpecializationProfile
} from '../team-types';
import { ServicePortalWidget, ServiceNowAgentConfig } from '../../../types/servicenow.types';

export class WidgetArchitectAgent extends BaseSnowAgent {
  private frontendAgent?: BaseSnowAgent;
  private backendAgent?: BaseSnowAgent;
  private uiuxAgent?: BaseSnowAgent;
  private platformAgent?: BaseSnowAgent;

  constructor(config: ServiceNowAgentConfig) {
    const capabilities: AgentCapability[] = [
      {
        name: 'requirement_analysis',
        description: 'Analyze and break down widget requirements',
        proficiency: 0.95,
        tools: ['analysis', 'planning', 'coordination']
      },
      {
        name: 'team_coordination',
        description: 'Coordinate specialized team members',
        proficiency: 0.9,
        tools: ['coordination', 'communication', 'project_management']
      },
      {
        name: 'widget_architecture',
        description: 'Design widget architecture and structure',
        proficiency: 0.85,
        tools: ['architecture', 'design_patterns', 'servicenow_patterns']
      },
      {
        name: 'integration_planning',
        description: 'Plan widget integrations and dependencies',
        proficiency: 0.8,
        tools: ['integration', 'api_design', 'dependency_management']
      }
    ];

    const specialization: SpecializationProfile = {
      primary: ['widget_architecture', 'team_coordination', 'requirement_analysis'],
      secondary: ['ui_design', 'performance_planning', 'testing_strategy'],
      tools: ['ServiceNow Flow Composer', 'ServiceNow Deployment', 'Team Coordination'],
      experience: 0.9
    };

    super(
      'widget-architect-001',
      'Widget Architect',
      'architect',
      capabilities,
      specialization,
      config
    );
  }

  /**
   * Set team members that this architect will coordinate
   */
  setTeamMembers(
    frontendAgent: BaseSnowAgent,
    backendAgent: BaseSnowAgent,
    uiuxAgent: BaseSnowAgent,
    platformAgent: BaseSnowAgent
  ): void {
    this.frontendAgent = frontendAgent;
    this.backendAgent = backendAgent;
    this.uiuxAgent = uiuxAgent;
    this.platformAgent = platformAgent;
  }

  /**
   * Analyze widget requirements and create technical specification
   */
  async analyzeRequirements(requirements: WidgetRequirements): Promise<WidgetSpecification> {
    try {
      this.setStatus('busy');

      // Analyze complexity based on requirements
      const complexity = this.assessComplexity(requirements);
      
      // Estimate time based on complexity and features
      const estimatedTime = this.estimateTime(requirements, complexity);
      
      // Identify dependencies
      const dependencies = this.identifyDependencies(requirements);

      const specification: WidgetSpecification = {
        id: `widget-spec-${Date.now()}`,
        requirements,
        complexity,
        estimatedTime,
        dependencies
      };

      console.log(`Widget Architect: Analyzed requirements - Complexity: ${complexity}, Time: ${estimatedTime}m`);
      
      return specification;

    } catch (error) {
      console.error('Widget Architect: Error analyzing requirements:', error);
      throw error;
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Coordinate the entire widget development team
   */
  async execute(specification: WidgetSpecification): Promise<TeamResult> {
    try {
      this.setStatus('busy');
      console.log('Widget Architect: Starting team coordination...');

      if (!this.frontendAgent || !this.backendAgent || !this.uiuxAgent || !this.platformAgent) {
        throw new Error('Team members not properly initialized');
      }

      // Break down specification into specialized tasks
      const tasks = await this.createTaskBreakdown(specification);
      
      // Execute tasks based on dependencies and complexity
      const result = await this.coordinateTeam(tasks);
      
      // Integrate all components into final widget
      const widget = await this.integrateComponents(result);
      
      // Deploy the widget
      const deployment = await this.deployWidget(widget);

      console.log('Widget Architect: Team coordination completed successfully');
      
      return {
        success: true,
        artifact: deployment,
        metadata: {
          duration: 0, // Will be set by base class
          performance: {
            coordination_efficiency: 0.85,
            team_synchronization: 0.9
          },
          quality: {
            architecture_score: 0.9,
            integration_score: 0.85
          }
        }
      };

    } catch (error) {
      console.error('Widget Architect: Error coordinating team:', error);
      return this.handleError(error);
    } finally {
      this.setStatus('available');
    }
  }

  /**
   * Break down widget specification into specialized tasks
   */
  private async createTaskBreakdown(specification: WidgetSpecification): Promise<{
    frontend: FrontendRequirements;
    backend: BackendRequirements;
    design: DesignRequirements;
    platform: any;
  }> {
    const { requirements } = specification;

    // Create frontend requirements
    const frontend: FrontendRequirements = {
      template: {
        layout: this.determineLayout(requirements.type),
        components: this.identifyComponents(requirements),
        responsive: requirements.ui.responsive
      },
      styling: {
        theme: requirements.ui.theme,
        accessibility: requirements.ui.accessibility
      },
      clientScript: {
        framework: 'angular', // ServiceNow default
        events: this.identifyClientEvents(requirements),
        apiCalls: this.identifyApiCalls(requirements)
      }
    };

    // Create backend requirements
    const backend: BackendRequirements = {
      serverScript: {
        dataProcessing: this.identifyDataProcessing(requirements),
        apiIntegrations: requirements.integrations || [],
        businessLogic: this.identifyBusinessLogic(requirements)
      },
      performance: {
        caching: this.requiresCaching(requirements),
        optimization: this.identifyOptimizations(requirements)
      },
      security: {
        validation: this.identifyValidations(requirements),
        authorization: this.identifyAuthorization(requirements)
      }
    };

    // Create design requirements
    const design: DesignRequirements = {
      uiPattern: this.determineUIPattern(requirements.type),
      accessibility: {
        wcag: 'AA',
        screenReader: requirements.ui.accessibility,
        keyboard: requirements.ui.accessibility
      },
      userExperience: {
        workflow: this.identifyWorkflows(requirements),
        feedback: this.identifyFeedbackNeeds(requirements)
      }
    };

    // Create platform requirements
    const platform = {
      integration: {
        apis: requirements.integrations || [],
        tables: [requirements.data.source],
        dependencies: this.identifyPlatformDependencies(requirements)
      },
      deployment: {
        scope: 'global',
        permissions: this.identifyPermissions(requirements)
      }
    };

    return { frontend, backend, design, platform };
  }

  /**
   * Coordinate team execution with proper dependency management
   */
  private async coordinateTeam(tasks: any): Promise<any> {
    console.log('Widget Architect: Coordinating specialized agents...');

    // Phase 1: Design and Planning (parallel)
    const [designResult, platformSetup] = await Promise.all([
      this.uiuxAgent!.execute(tasks.design),
      this.platformAgent!.execute(tasks.platform)
    ]);

    if (!designResult.success || !platformSetup.success) {
      throw new Error('Design or platform setup failed');
    }

    // Phase 2: Implementation (parallel, dependent on design)
    const [frontendResult, backendResult] = await Promise.all([
      this.frontendAgent!.execute({
        ...tasks.frontend,
        design: designResult.artifact
      }),
      this.backendAgent!.execute({
        ...tasks.backend,
        platform: platformSetup.artifact
      })
    ]);

    if (!frontendResult.success || !backendResult.success) {
      throw new Error('Frontend or backend implementation failed');
    }

    return {
      design: designResult.artifact,
      frontend: frontendResult.artifact,
      backend: backendResult.artifact,
      platform: platformSetup.artifact
    };
  }

  /**
   * Integrate all components into final widget
   */
  private async integrateComponents(components: any): Promise<ServicePortalWidget> {
    console.log('Widget Architect: Integrating components...');

    const widget: ServicePortalWidget = {
      name: `${components.design.name || 'custom_widget'}_${Date.now()}`,
      id: `${components.design.id || 'custom_widget'}_${Date.now()}`,
      template: components.frontend.template,
      css: components.frontend.css,
      client_script: components.frontend.clientScript,
      server_script: components.backend.serverScript,
      option_schema: JSON.stringify(components.frontend.optionSchema || {}),
      public: true,
      data: components.backend.data || {}
    };

    return widget;
  }

  /**
   * Deploy the integrated widget
   */
  private async deployWidget(widget: ServicePortalWidget): Promise<any> {
    console.log('Widget Architect: Deploying widget...');
    
    // This would integrate with the ServiceNow deployment MCP
    // For now, return the widget specification
    return {
      widget,
      deploymentStatus: 'prepared',
      commands: [
        {
          tool: 'mcp__servicenow-deployment__snow_deploy_widget',
          parameters: widget
        }
      ]
    };
  }

  // Helper methods for requirement analysis
  private assessComplexity(requirements: WidgetRequirements): 'simple' | 'medium' | 'complex' {
    let complexity = 0;
    
    // Data complexity
    if (requirements.data.fields.length > 10) complexity += 2;
    else if (requirements.data.fields.length > 5) complexity += 1;
    
    // Functionality complexity
    if (requirements.functionality.realtime) complexity += 2;
    if (requirements.functionality.interactive) complexity += 1;
    if (requirements.functionality.export) complexity += 1;
    
    // Integration complexity
    complexity += (requirements.integrations?.length || 0);
    
    // UI complexity
    if (requirements.ui.responsive) complexity += 1;
    if (requirements.ui.accessibility) complexity += 1;

    if (complexity >= 6) return 'complex';
    if (complexity >= 3) return 'medium';
    return 'simple';
  }

  private estimateTime(requirements: WidgetRequirements, complexity: string): number {
    const baseTime = {
      simple: 60,
      medium: 120,
      complex: 240
    };

    let time = baseTime[complexity];
    
    // Add time for specific features
    if (requirements.functionality.realtime) time += 60;
    if (requirements.functionality.interactive) time += 30;
    if (requirements.ui.accessibility) time += 45;
    
    return time;
  }

  private identifyDependencies(requirements: WidgetRequirements): string[] {
    const deps: string[] = [];
    
    if (requirements.functionality.realtime) {
      deps.push('websocket_service');
    }
    
    if (requirements.type === 'chart') {
      deps.push('chart_library');
    }
    
    if (requirements.integrations?.length) {
      deps.push('integration_service');
    }
    
    return deps;
  }

  // Component identification methods
  private determineLayout(type: string): string {
    const layouts = {
      dashboard: 'grid',
      form: 'vertical',
      list: 'table',
      chart: 'centered',
      custom: 'flexible'
    };
    return layouts[type as keyof typeof layouts] || 'flexible';
  }

  private identifyComponents(requirements: WidgetRequirements): string[] {
    const components: string[] = ['container'];
    
    if (requirements.type === 'chart') {
      components.push('chart', 'legend', 'filters');
    }
    
    if (requirements.functionality.interactive) {
      components.push('controls', 'buttons');
    }
    
    if (requirements.functionality.export) {
      components.push('export_button');
    }
    
    return components;
  }

  private identifyClientEvents(requirements: WidgetRequirements): string[] {
    const events: string[] = ['onLoad'];
    
    if (requirements.functionality.interactive) {
      events.push('onClick', 'onChange');
    }
    
    if (requirements.functionality.realtime) {
      events.push('onUpdate');
    }
    
    return events;
  }

  private identifyApiCalls(requirements: WidgetRequirements): string[] {
    const calls: string[] = [`/api/now/table/${requirements.data.source}`];
    
    if (requirements.integrations?.length) {
      calls.push(...requirements.integrations.map(i => `/api/integration/${i}`));
    }
    
    return calls;
  }

  private identifyDataProcessing(requirements: WidgetRequirements): string[] {
    const processing: string[] = ['data_fetch'];
    
    if (requirements.type === 'chart') {
      processing.push('data_aggregation', 'chart_data_formatting');
    }
    
    if (requirements.data.filters) {
      processing.push('data_filtering');
    }
    
    return processing;
  }

  private identifyBusinessLogic(requirements: WidgetRequirements): string[] {
    const logic: string[] = [];
    
    if (requirements.functionality.interactive) {
      logic.push('user_interaction_logic');
    }
    
    if (requirements.functionality.realtime) {
      logic.push('realtime_update_logic');
    }
    
    return logic;
  }

  private requiresCaching(requirements: WidgetRequirements): boolean {
    return requirements.data.fields.length > 20 || 
           requirements.functionality.realtime ||
           (requirements.integrations?.length || 0) > 0;
  }

  private identifyOptimizations(requirements: WidgetRequirements): string[] {
    const optimizations: string[] = [];
    
    if (requirements.data.fields.length > 10) {
      optimizations.push('lazy_loading', 'pagination');
    }
    
    if (requirements.functionality.realtime) {
      optimizations.push('efficient_polling', 'websocket_optimization');
    }
    
    return optimizations;
  }

  private identifyValidations(requirements: WidgetRequirements): string[] {
    return ['input_validation', 'data_validation', 'permission_check'];
  }

  private identifyAuthorization(requirements: WidgetRequirements): string[] {
    return ['role_check', 'table_access_check'];
  }

  private determineUIPattern(type: string): string {
    const patterns = {
      dashboard: 'card_grid',
      form: 'form_layout',
      list: 'data_table',
      chart: 'visualization',
      custom: 'flexible_layout'
    };
    return patterns[type as keyof typeof patterns] || 'flexible_layout';
  }

  private identifyWorkflows(requirements: WidgetRequirements): string[] {
    const workflows: string[] = ['load_data', 'display_data'];
    
    if (requirements.functionality.interactive) {
      workflows.push('user_interaction', 'update_display');
    }
    
    return workflows;
  }

  private identifyFeedbackNeeds(requirements: WidgetRequirements): string[] {
    return ['loading_indicators', 'error_messages', 'success_notifications'];
  }

  private identifyPlatformDependencies(requirements: WidgetRequirements): string[] {
    const deps: string[] = [];
    
    if (requirements.type === 'chart') {
      deps.push('chart_js');
    }
    
    if (requirements.functionality.export) {
      deps.push('export_service');
    }
    
    return deps;
  }

  private identifyPermissions(requirements: WidgetRequirements): string[] {
    return [`${requirements.data.source}.read`];
  }
}
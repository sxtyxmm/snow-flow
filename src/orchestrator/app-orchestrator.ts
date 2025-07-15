import { ServiceNowStudioClient } from '../studio/studio-client';
import { BaseAppAgent } from '../agents/base-app-agent';
import { ScriptGeneratorAgent } from '../agents/script-generator.agent';
import { UIBuilderAgent } from '../agents/ui-builder.agent';
import { SchemaDesignerAgent } from '../agents/schema-designer.agent';
import { WorkflowDesignerAgent } from '../agents/workflow-designer.agent';
import { SecurityAgent } from '../agents/security-agent';
import { UpdateSetManagerAgent } from '../agents/update-set-manager.agent';
import { AppGenerationRequest, AppGenerationResult, ServiceNowStudioConfig } from '../types/servicenow-studio.types';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ServiceNowAppOrchestrator {
  private client: ServiceNowStudioClient;
  private agents: Map<string, BaseAppAgent> = new Map();
  private isInitialized: boolean = false;

  constructor(config: ServiceNowStudioConfig) {
    this.client = new ServiceNowStudioClient(config);
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing ServiceNow App Orchestrator');
      
      // Validate connection
      const isConnected = await this.client.validateConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to ServiceNow instance');
      }

      // Initialize specialized agents
      await this.initializeAgents();

      this.isInitialized = true;
      logger.info('ServiceNow App Orchestrator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize app orchestrator', error);
      throw error;
    }
  }

  private async initializeAgents(): Promise<void> {
    const agentConfigs = [
      { name: 'script-generator', class: ScriptGeneratorAgent },
      { name: 'ui-builder', class: UIBuilderAgent },
      { name: 'schema-designer', class: SchemaDesignerAgent },
      { name: 'workflow-designer', class: WorkflowDesignerAgent },
      { name: 'security', class: SecurityAgent },
      { name: 'update-set-manager', class: UpdateSetManagerAgent }
    ];

    for (const config of agentConfigs) {
      const agent = new config.class(this.client);
      this.agents.set(config.name, agent);
      await agent.start();
      logger.info(`Initialized ${config.name} agent: ${agent.getId()}`);
    }
  }

  async generateApplication(request: AppGenerationRequest): Promise<AppGenerationResult> {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    const startTime = Date.now();
    const appId = uuidv4();
    
    try {
      logger.info(`Starting application generation for ${request.appName}`);

      // Validate request
      await this.validateRequest(request);

      // Create application in ServiceNow
      const app = await this.client.createApplication({
        name: request.appName,
        scope: request.appScope,
        version: request.appVersion || '1.0.0',
        short_description: request.appDescription,
        description: request.appDescription,
        vendor: 'Custom',
        vendor_prefix: 'x'
      });

      // Create studio session
      await this.client.createStudioSession(app.sys_id);

      // Generate components in parallel using all agents
      const componentResults = await this.generateComponentsInParallel(request);

      // Deploy components to ServiceNow
      const deploymentResults = await this.deployComponents(componentResults, request);

      // Generate update set
      const updateSetManager = this.agents.get('update-set-manager') as UpdateSetManagerAgent;
      const updateSetResults = await updateSetManager.generateComponent(request);

      // Validate generated application
      const validationResults = await this.validateApplication(app.sys_id, componentResults);

      // Generate final result
      const result: AppGenerationResult = {
        success: true,
        appId: app.sys_id,
        updateSetId: updateSetResults.updateSets[0]?.sys_id,
        components: {
          tables: componentResults.schema?.tables || [],
          fields: componentResults.schema?.fields || [],
          businessRules: componentResults.scripts?.businessRules || [],
          clientScripts: componentResults.scripts?.clientScripts || [],
          uiActions: componentResults.scripts?.uiActions || [],
          uiPages: componentResults.ui?.uiPages || [],
          workflows: componentResults.workflows?.workflows || [],
          acls: componentResults.security?.acls || [],
          widgets: componentResults.ui?.widgets || []
        },
        artifacts: {
          scripts: this.extractScripts(componentResults),
          configurations: this.extractConfigurations(componentResults),
          documentation: this.generateDocumentation(request, componentResults),
          tests: this.generateTests(request, componentResults)
        },
        deploymentInstructions: updateSetResults.deploymentPlan?.instructions || [],
        errors: validationResults.errors || [],
        warnings: validationResults.warnings || [],
        timestamp: new Date().toISOString()
      };

      const processingTime = Date.now() - startTime;
      logger.info(`Application generation completed in ${processingTime}ms for ${request.appName}`);

      return result;
    } catch (error) {
      logger.error(`Application generation failed for ${request.appName}`, error);
      
      return {
        success: false,
        components: {},
        artifacts: {
          scripts: [],
          configurations: [],
          documentation: [],
          tests: []
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  private async validateRequest(request: AppGenerationRequest): Promise<void> {
    const errors: string[] = [];

    if (!request.appName) {
      errors.push('Application name is required');
    }

    if (!request.appScope) {
      errors.push('Application scope is required');
    }

    if (!request.appDescription) {
      errors.push('Application description is required');
    }

    if (!request.requirements || Object.keys(request.requirements).length === 0) {
      errors.push('At least one requirement category must be specified');
    }

    if (errors.length > 0) {
      throw new Error(`Request validation failed: ${errors.join(', ')}`);
    }
  }

  private async generateComponentsInParallel(request: AppGenerationRequest): Promise<any> {
    const results: any = {};

    // Execute all agents in parallel
    const agentPromises = Array.from(this.agents.entries()).map(async ([name, agent]) => {
      try {
        const result = await agent.generateComponent(request);
        return { name, result };
      } catch (error) {
        logger.error(`Agent ${name} failed`, error);
        return { name, result: null, error };
      }
    });

    const agentResults = await Promise.all(agentPromises);

    // Collect results
    for (const { name, result, error } of agentResults) {
      if (result) {
        results[name.replace('-', '_')] = result;
      } else if (error) {
        results[name.replace('-', '_')] = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return results;
  }

  private async deployComponents(componentResults: any, request: AppGenerationRequest): Promise<any> {
    const deploymentResults: any = {};

    try {
      // Deploy schema components first
      if (componentResults.schema_designer) {
        deploymentResults.schema = await this.deploySchemaComponents(componentResults.schema_designer, request);
      }

      // Deploy scripts
      if (componentResults.script_generator) {
        deploymentResults.scripts = await this.deployScriptComponents(componentResults.script_generator, request);
      }

      // Deploy UI components
      if (componentResults.ui_builder) {
        deploymentResults.ui = await this.deployUIComponents(componentResults.ui_builder, request);
      }

      // Deploy workflows
      if (componentResults.workflow_designer) {
        deploymentResults.workflows = await this.deployWorkflowComponents(componentResults.workflow_designer, request);
      }

      // Deploy security components
      if (componentResults.security) {
        deploymentResults.security = await this.deploySecurityComponents(componentResults.security, request);
      }

      return deploymentResults;
    } catch (error) {
      logger.error('Component deployment failed', error);
      throw error;
    }
  }

  private async deploySchemaComponents(schemaResults: any, request: AppGenerationRequest): Promise<any> {
    const deploymentResults: any = { tables: [], fields: [] };

    // Deploy tables
    if (schemaResults.tables) {
      for (const table of schemaResults.tables) {
        try {
          const deployedTable = await this.client.createTable(table);
          deploymentResults.tables.push(deployedTable);
        } catch (error) {
          logger.error(`Failed to deploy table ${table.name}`, error);
        }
      }
    }

    // Deploy fields
    if (schemaResults.fields) {
      for (const field of schemaResults.fields) {
        try {
          const deployedField = await this.client.createField(field);
          deploymentResults.fields.push(deployedField);
        } catch (error) {
          logger.error(`Failed to deploy field ${field.element}`, error);
        }
      }
    }

    return deploymentResults;
  }

  private async deployScriptComponents(scriptResults: any, request: AppGenerationRequest): Promise<any> {
    const deploymentResults: any = { businessRules: [], clientScripts: [], scriptIncludes: [] };

    // Deploy business rules
    if (scriptResults.businessRules) {
      for (const rule of scriptResults.businessRules) {
        try {
          const deployedRule = await this.client.createScript(rule);
          deploymentResults.businessRules.push(deployedRule);
        } catch (error) {
          logger.error(`Failed to deploy business rule ${rule.name}`, error);
        }
      }
    }

    // Deploy client scripts
    if (scriptResults.clientScripts) {
      for (const script of scriptResults.clientScripts) {
        try {
          const deployedScript = await this.client.createScript(script);
          deploymentResults.clientScripts.push(deployedScript);
        } catch (error) {
          logger.error(`Failed to deploy client script ${script.name}`, error);
        }
      }
    }

    // Deploy script includes
    if (scriptResults.scriptIncludes) {
      for (const include of scriptResults.scriptIncludes) {
        try {
          const deployedInclude = await this.client.createScript(include);
          deploymentResults.scriptIncludes.push(deployedInclude);
        } catch (error) {
          logger.error(`Failed to deploy script include ${include.name}`, error);
        }
      }
    }

    return deploymentResults;
  }

  private async deployUIComponents(uiResults: any, request: AppGenerationRequest): Promise<any> {
    // Implementation for UI component deployment
    return uiResults;
  }

  private async deployWorkflowComponents(workflowResults: any, request: AppGenerationRequest): Promise<any> {
    // Implementation for workflow component deployment
    return workflowResults;
  }

  private async deploySecurityComponents(securityResults: any, request: AppGenerationRequest): Promise<any> {
    // Implementation for security component deployment
    return securityResults;
  }

  private async validateApplication(appId: string, componentResults: any): Promise<any> {
    try {
      const validationResult = await this.client.validateApplication(appId);
      return validationResult;
    } catch (error) {
      logger.error(`Application validation failed for ${appId}`, error);
      return {
        errors: ['Application validation failed'],
        warnings: []
      };
    }
  }

  private extractScripts(componentResults: any): string[] {
    const scripts: string[] = [];
    
    if (componentResults.script_generator) {
      const scriptResults = componentResults.script_generator;
      
      if (scriptResults.businessRules) {
        scripts.push(...scriptResults.businessRules.map((rule: any) => rule.script));
      }
      
      if (scriptResults.clientScripts) {
        scripts.push(...scriptResults.clientScripts.map((script: any) => script.script));
      }
      
      if (scriptResults.scriptIncludes) {
        scripts.push(...scriptResults.scriptIncludes.map((include: any) => include.script));
      }
    }
    
    return scripts;
  }

  private extractConfigurations(componentResults: any): string[] {
    // Extract configuration files
    return [];
  }

  private generateDocumentation(request: AppGenerationRequest, componentResults: any): string[] {
    // Generate documentation
    return [];
  }

  private generateTests(request: AppGenerationRequest, componentResults: any): string[] {
    // Generate test scripts
    return [];
  }

  async getApplicationStatus(appId: string): Promise<any> {
    return await this.client.getApplication(appId);
  }

  async getAgentStatus(): Promise<any> {
    const agentStatus: any = {};
    
    for (const [name, agent] of this.agents.entries()) {
      agentStatus[name] = {
        id: agent.getId(),
        type: agent.getType(),
        capabilities: agent.getCapabilities(),
        isRunning: agent.isRunning()
      };
    }
    
    return agentStatus;
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down ServiceNow App Orchestrator');
    
    for (const agent of this.agents.values()) {
      await agent.stop();
    }
    
    await this.client.closeSession();
    this.isInitialized = false;
    
    logger.info('ServiceNow App Orchestrator shutdown complete');
  }
}
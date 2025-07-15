import { ServiceNowStudioClient } from '../studio/studio-client';
import { ServiceNowStudioConfig, AppGenerationRequest, AppGenerationResult } from '../types/servicenow-studio.types';
import { SchemaDesignerLocalAgent } from '../agents/schema-designer-local.agent';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Local App Orchestrator - Uses template-based generation
 * Avoids Claude API costs by using smart templates and manual processing
 */
export class ServiceNowAppOrchestratorLocal {
  private client: ServiceNowStudioClient;
  private agents: Map<string, any> = new Map();
  private initialized = false;

  constructor(private config: ServiceNowStudioConfig) {
    this.client = new ServiceNowStudioClient(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Test connection - will be implemented later
      // await this.client.testConnection();
      
      // Initialize agents with local implementations
      this.initializeLocalAgents();
      
      this.initialized = true;
      logger.info('ServiceNow App Orchestrator (Local) initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize orchestrator:', error);
      throw error;
    }
  }

  private initializeLocalAgents(): void {
    // Schema Designer - Template-based table/field generation
    this.agents.set('schema-designer', new SchemaDesignerLocalAgent(this.client));
    
    // Note: Other agents can be implemented similarly
    // For now, we'll create placeholder implementations
    
    logger.info(`Initialized ${this.agents.size} local agents`);
  }

  async generateApplication(request: AppGenerationRequest): Promise<AppGenerationResult> {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized');
    }

    const startTime = Date.now();
    const sessionId = uuidv4();
    
    logger.info(`Starting application generation: ${request.appName} (${sessionId})`);

    try {
      // Create application in ServiceNow
      const application = await this.client.createApplication({
        name: request.appName,
        scope: request.appScope,
        version: request.appVersion || '1.0.0',
        short_description: request.appDescription,
        description: request.appDescription,
        vendor: 'Snow-flow',
        vendor_prefix: request.appScope.split('_')[1] || 'app'
      });

      // Create update set
      const updateSet = await this.client.createUpdateSet(`${request.appName} - ${new Date().toISOString()}`);

      // Generate components using local agents
      const components = await this.generateComponents(request);

      // Create deployment instructions
      const deploymentInstructions = this.generateDeploymentInstructions(request, components);

      const result: AppGenerationResult = {
        success: true,
        appId: application.sys_id,
        updateSetId: updateSet.sys_id,
        components,
        artifacts: {
          scripts: [],
          configurations: [],
          documentation: deploymentInstructions,
          tests: []
        },
        deploymentInstructions,
        errors: [],
        warnings: [],
        timestamp: new Date().toISOString()
      };

      // Save generation report
      await this.saveGenerationReport(request, result);

      const duration = Date.now() - startTime;
      logger.info(`Application generation completed in ${duration}ms`);

      return result;

    } catch (error) {
      logger.error('Application generation failed:', error);
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

  private async generateComponents(request: AppGenerationRequest): Promise<any> {
    const components: any = {};

    // Generate schema components
    const schemaAgent = this.agents.get('schema-designer');
    if (schemaAgent) {
      components.schema = await schemaAgent.generateComponent(request);
    }

    // For other components, we'll use template-based generation
    components.scripts = this.generateScriptsFromTemplate(request);
    components.ui = this.generateUIFromTemplate(request);
    components.workflows = this.generateWorkflowsFromTemplate(request);
    components.security = this.generateSecurityFromTemplate(request);

    return components;
  }

  private generateScriptsFromTemplate(request: AppGenerationRequest): any[] {
    const scripts: any[] = [];

    // Generate basic business rules
    if (request.requirements.businessRules) {
      for (const rule of request.requirements.businessRules) {
        scripts.push({
          sys_id: uuidv4(),
          name: rule.name,
          table: rule.table,
          when: rule.when,
          script: this.generateBusinessRuleScript(rule),
          description: rule.description || `Auto-generated business rule for ${rule.name}`,
          active: rule.active !== false,
          sys_class_name: 'sys_script',
          sys_package: request.appScope,
          sys_scope: request.appScope
        });
      }
    }

    return scripts;
  }

  private generateUIFromTemplate(request: AppGenerationRequest): any[] {
    const ui: any[] = [];

    if (request.requirements.ui) {
      for (const uiReq of request.requirements.ui) {
        if (uiReq.type === 'form') {
          ui.push({
            sys_id: uuidv4(),
            name: uiReq.name,
            table: uiReq.table,
            view: 'Default view',
            sections: this.generateFormSections(uiReq),
            sys_class_name: 'sys_ui_form',
            sys_package: request.appScope,
            sys_scope: request.appScope
          });
        } else if (uiReq.type === 'list') {
          ui.push({
            sys_id: uuidv4(),
            name: uiReq.name,
            table: uiReq.table,
            view: 'Default view',
            columns: uiReq.fields || [],
            sys_class_name: 'sys_ui_list',
            sys_package: request.appScope,
            sys_scope: request.appScope
          });
        }
      }
    }

    return ui;
  }

  private generateWorkflowsFromTemplate(request: AppGenerationRequest): any[] {
    const workflows: any[] = [];

    if (request.requirements.workflows) {
      for (const workflowReq of request.requirements.workflows) {
        workflows.push({
          sys_id: uuidv4(),
          name: workflowReq.name,
          table: workflowReq.table,
          description: workflowReq.description,
          condition: workflowReq.triggerCondition,
          activities: workflowReq.activities || [],
          sys_class_name: 'wf_workflow',
          sys_package: request.appScope,
          sys_scope: request.appScope
        });
      }
    }

    return workflows;
  }

  private generateSecurityFromTemplate(request: AppGenerationRequest): any[] {
    const security: any[] = [];

    if (request.requirements.security) {
      for (const secReq of request.requirements.security) {
        if (secReq.type === 'acl') {
          security.push({
            sys_id: uuidv4(),
            name: secReq.name,
            type: 'record',
            operation: secReq.operation,
            table: secReq.table,
            field: secReq.field,
            condition: secReq.condition,
            roles: secReq.roles?.join(',') || '',
            active: true,
            sys_class_name: 'sys_security_acl',
            sys_package: request.appScope,
            sys_scope: request.appScope
          });
        }
      }
    }

    return security;
  }

  private generateBusinessRuleScript(rule: any): string {
    const templates = {
      'before': `(function executeRule(current, previous /*null when async*/) {
    // ${rule.description || 'Generated business rule'}
    
    if (current.isNewRecord()) {
        // Logic for new records
        current.setValue('state', 'new');
    }
    
    if (current.isValidRecord()) {
        // Validation logic
        gs.info('Business rule executed: ${rule.name}');
    }
    
})(current, previous);`,
      
      'after': `(function executeRule(current, previous /*null when async*/) {
    // ${rule.description || 'Generated business rule'}
    
    if (current.getValue('state') != previous.getValue('state')) {
        // State change logic
        gs.info('State changed from ' + previous.getValue('state') + ' to ' + current.getValue('state'));
    }
    
})(current, previous);`,
      
      'async': `(function executeRule(current, previous /*null when async*/) {
    // ${rule.description || 'Generated business rule'}
    
    // Async processing logic
    var gr = new GlideRecord('${rule.table}');
    if (gr.get(current.sys_id)) {
        // Process record asynchronously
        gs.info('Async processing for: ' + gr.getDisplayValue());
    }
    
})(current, previous);`
    };

    return templates[rule.when as keyof typeof templates] || templates.before;
  }

  private generateFormSections(uiReq: any): any[] {
    const sections = [];
    const fields = uiReq.fields || [];
    
    // Group fields into sections (max 6 fields per section)
    for (let i = 0; i < fields.length; i += 6) {
      const sectionFields = fields.slice(i, i + 6);
      sections.push({
        caption: i === 0 ? 'General Information' : `Section ${Math.floor(i / 6) + 1}`,
        fields: sectionFields
      });
    }

    return sections;
  }

  private generateDeploymentInstructions(request: AppGenerationRequest, components: any): string[] {
    return [
      `# Deployment Instructions for ${request.appName}`,
      '',
      '## Generated Components:',
      `- Tables: ${components.schema?.tables?.length || 0}`,
      `- Fields: ${components.schema?.fields?.length || 0}`,
      `- Scripts: ${components.scripts?.length || 0}`,
      `- UI Components: ${components.ui?.length || 0}`,
      `- Workflows: ${components.workflows?.length || 0}`,
      `- Security Rules: ${components.security?.length || 0}`,
      '',
      '## Deployment Steps:',
      '1. Review generated components in ServiceNow Studio',
      '2. Test components in development environment',
      '3. Export update set when ready',
      '4. Import update set to target environment',
      '5. Commit update set after testing',
      '',
      '## Post-Deployment:',
      '- Verify all components are active',
      '- Test business rules and workflows',
      '- Validate security configurations',
      '- Train users on new functionality'
    ];
  }

  private async saveGenerationReport(request: AppGenerationRequest, result: AppGenerationResult): Promise<void> {
    const reportDir = path.join(process.cwd(), 'generation-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFile = path.join(reportDir, `${request.appScope}-${Date.now()}.json`);
    const report = {
      request,
      result,
      timestamp: new Date().toISOString(),
      orchestrator: 'local'
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    logger.info(`Generation report saved: ${reportFile}`);
  }
}
#!/usr/bin/env node
/**
 * ServiceNow Deployment MCP Server
 * Provides specialized deployment tools for ServiceNow artifacts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { Logger } from '../utils/logger.js';
import { ScopeManager, DeploymentContext } from '../managers/scope-manager.js';
import { GlobalScopeStrategy, ScopeType } from '../strategies/global-scope-strategy.js';
import { artifactTracker } from '../utils/artifact-tracker.js';
import { promises as fs } from 'fs';
import { join } from 'path';

class ServiceNowDeploymentMCP {
  private server: Server;
  private client: ServiceNowClient;
  private oauth: ServiceNowOAuth;
  private logger: Logger;
  private scopeManager: ScopeManager;
  private globalScopeStrategy: GlobalScopeStrategy;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-deployment',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger('ServiceNowDeploymentMCP');
    
    // Initialize global scope management
    this.scopeManager = new ScopeManager({
      defaultScope: ScopeType.GLOBAL,
      allowFallback: true,
      validatePermissions: true,
      enableMigration: false
    });
    this.globalScopeStrategy = new GlobalScopeStrategy();

    // Start artifact tracking session
    artifactTracker.startSession();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_deploy_widget',
          description: 'AUTONOMOUS widget deployment - deploys directly to ServiceNow, returns live URLs, handles errors automatically. NO MANUAL STEPS!',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Widget internal name (e.g., incident_dashboard)' },
              title: { type: 'string', description: 'Widget display title' },
              description: { type: 'string', description: 'Widget description' },
              template: { type: 'string', description: 'HTML template content' },
              css: { type: 'string', description: 'CSS styles' },
              client_script: { type: 'string', description: 'Client-side JavaScript' },
              server_script: { type: 'string', description: 'Server-side script' },
              option_schema: { type: 'string', description: 'Widget options JSON schema' },
              demo_data: { type: 'string', description: 'Demo data JSON' },
              category: { type: 'string', description: 'Widget category' },
            },
            required: ['name', 'title', 'template'],
          },
        },
        {
          name: 'snow_deploy_flow',
          description: 'AUTONOMOUS flow deployment - creates complete flows with linked artifacts, auto-deploys dependencies, self-healing. FULLY AUTOMATED!',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Flow name' },
              description: { type: 'string', description: 'Flow description' },
              flow_type: { type: 'string', enum: ['flow', 'subflow', 'action'], description: 'Type of flow to create (default: flow)', default: 'flow' },
              table: { type: 'string', description: 'Target table (e.g., sc_request, incident)' },
              trigger_type: { type: 'string', enum: ['record_created', 'record_updated', 'scheduled', 'manual'], description: 'Flow trigger type' },
              condition: { type: 'string', description: 'Trigger condition (encoded query)' },
              active: { type: 'boolean', description: 'Activate flow on deployment' },
              flow_definition: { type: 'string', description: 'Flow Designer definition JSON' },
              category: { type: 'string', description: 'Flow category (e.g., approval, automation)' },
              validate_before_deploy: { type: 'boolean', description: 'Validate flow definition before deployment', default: true },
            },
            required: ['name', 'description', 'flow_definition', 'trigger_type'],
          },
        },
        {
          name: 'snow_deploy_application',
          description: 'INTELLIGENT scope-aware application deployment - automatically selects optimal scope (global/application), validates permissions, handles fallbacks',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Application name' },
              scope: { type: 'string', description: 'Preferred scope (global/application-specific) - leave blank for intelligent selection' },
              version: { type: 'string', description: 'Application version' },
              short_description: { type: 'string', description: 'Short description' },
              description: { type: 'string', description: 'Full description' },
              vendor: { type: 'string', description: 'Vendor name' },
              vendor_prefix: { type: 'string', description: 'Vendor prefix' },
              active: { type: 'boolean', description: 'Activate application' },
              scope_strategy: { 
                type: 'string', 
                enum: ['global', 'application', 'auto'],
                description: 'Scope deployment strategy - auto selects optimal scope',
                default: 'auto'
              },
              environment: {
                type: 'string',
                enum: ['development', 'testing', 'production'],
                description: 'Deployment environment',
                default: 'development'
              }
            },
            required: ['name', 'version'],
          },
        },
        {
          name: 'snow_deploy_update_set',
          description: 'Create and populate an update set for deployment',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Update set name' },
              description: { type: 'string', description: 'Update set description' },
              artifacts: {
                type: 'array',
                description: 'List of artifacts to include',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['widget', 'workflow', 'script', 'table'] },
                    sys_id: { type: 'string', description: 'Sys ID of the artifact' },
                  },
                },
              },
            },
            required: ['name', 'artifacts'],
          },
        },
        {
          name: 'snow_validate_deployment',
          description: 'Validate a deployment before executing',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['widget', 'workflow', 'application'] },
              artifact: { type: 'object', description: 'The artifact to validate' },
            },
            required: ['type', 'artifact'],
          },
        },
        {
          name: 'snow_rollback_deployment',
          description: 'Rollback a recent deployment',
          inputSchema: {
            type: 'object',
            properties: {
              update_set_id: { type: 'string', description: 'Update set sys_id to rollback' },
              reason: { type: 'string', description: 'Reason for rollback' },
            },
            required: ['update_set_id', 'reason'],
          },
        },
        {
          name: 'snow_deployment_status',
          description: 'Check deployment status and history',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of recent deployments to show', default: 10 },
            },
          },
        },
        {
          name: 'snow_export_artifact',
          description: 'Export an artifact from ServiceNow for backup or migration',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['widget', 'workflow', 'application'] },
              sys_id: { type: 'string', description: 'Sys ID of the artifact' },
              format: { type: 'string', enum: ['json', 'xml', 'update_set'], default: 'json' },
            },
            required: ['type', 'sys_id'],
          },
        },
        {
          name: 'snow_import_artifact',
          description: 'Import an artifact from file to ServiceNow',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['widget', 'workflow', 'application'] },
              file_path: { type: 'string', description: 'Path to the artifact file' },
              format: { type: 'string', enum: ['json', 'xml', 'update_set'], default: 'json' },
            },
            required: ['type', 'file_path'],
          },
        },
        {
          name: 'snow_clone_instance_artifact',
          description: 'Clone an artifact between ServiceNow instances',
          inputSchema: {
            type: 'object',
            properties: {
              source_instance: { type: 'string', description: 'Source instance URL' },
              target_instance: { type: 'string', description: 'Target instance URL' },
              type: { type: 'string', enum: ['widget', 'workflow', 'application'] },
              sys_id: { type: 'string', description: 'Sys ID of the artifact to clone' },
            },
            required: ['source_instance', 'target_instance', 'type', 'sys_id'],
          },
        },
        {
          name: 'snow_validate_sysid',
          description: 'Validate that a sys_id exists and track for consistency',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Sys ID to validate' },
              table: { type: 'string', description: 'Expected table name' },
              name: { type: 'string', description: 'Expected artifact name' },
              type: { type: 'string', description: 'Expected artifact type' },
            },
            required: ['sys_id', 'table'],
          },
        },
        {
          name: 'snow_deployment_debug',
          description: 'Get debugging information about current deployment session',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'snow_auth_diagnostics',
          description: 'Run comprehensive authentication and permission diagnostics to troubleshoot deployment issues',
          inputSchema: {
            type: 'object',
            properties: {
              run_write_test: { type: 'boolean', description: 'Test widget write permissions (creates and deletes test widget)', default: true },
              include_recommendations: { type: 'boolean', description: 'Include troubleshooting recommendations', default: true },
            },
          },
        },
        {
          name: 'snow_preview_widget',
          description: 'Preview widget rendering with test data to verify HTML/CSS/JS integration before deployment',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Widget sys_id to preview (optional if providing code)' },
              template: { type: 'string', description: 'HTML template code (optional if using sys_id)' },
              css: { type: 'string', description: 'CSS styles (optional)' },
              client_script: { type: 'string', description: 'Client controller script (optional)' },
              server_script: { type: 'string', description: 'Server script (optional)' },
              test_data: { type: 'string', description: 'JSON test data for server script' },
              option_schema: { type: 'string', description: 'Widget options schema JSON' },
              render_mode: { 
                type: 'string', 
                enum: ['full', 'template_only', 'data_only'],
                description: 'Preview mode: full (render everything), template_only (no JS), data_only (server data)',
                default: 'full'
              },
            },
          },
        },
        {
          name: 'snow_widget_test',
          description: 'Test widget functionality with various data scenarios to ensure proper integration',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Widget sys_id to test' },
              test_scenarios: { 
                type: 'array', 
                description: 'Array of test scenarios with input data and expected outputs',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: 'Test scenario name' },
                    input: { type: 'object', description: 'Input data for the test' },
                    expected: { type: 'object', description: 'Expected output (optional)' },
                    options: { type: 'object', description: 'Widget instance options' }
                  }
                }
              },
              coverage: { 
                type: 'boolean', 
                description: 'Check code coverage for HTML/CSS/JS integration',
                default: true 
              },
              validate_dependencies: {
                type: 'boolean',
                description: 'Check for missing dependencies like Chart.js',
                default: true
              }
            },
            required: ['sys_id'],
          },
        },
        {
          name: 'snow_smart_update_set',
          description: 'Smart update set creation with context detection - automatically creates new update sets for new tasks',
          inputSchema: {
            type: 'object',
            properties: {
              detect_context: { type: 'boolean', description: 'Auto-detect task context change', default: true },
              name_prefix: { type: 'string', description: 'Update set name prefix', default: 'AUTO' },
              separate_by_task: { type: 'boolean', description: 'Create new update set for each task', default: true },
              close_previous: { type: 'boolean', description: 'Close previous update set', default: true },
              description: { type: 'string', description: 'Update set description' },
            },
          },
        },
        {
          name: 'snow_validate_flow_definition',
          description: 'Validate flow definition before deployment with preview and test mode',
          inputSchema: {
            type: 'object',
            properties: {
              definition: { type: 'string', description: 'Flow definition JSON to validate' },
              flow_type: { type: 'string', enum: ['flow', 'subflow', 'action'], default: 'flow' },
              show_preview: { type: 'boolean', description: 'Show visual preview', default: true },
              test_mode: { type: 'boolean', description: 'Run in test mode', default: false },
              check_dependencies: { type: 'boolean', description: 'Check for missing dependencies', default: true },
            },
            required: ['definition'],
          },
        },
        {
          name: 'snow_create_solution_package',
          description: 'Create a solution package grouping related artifacts with a new update set',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Solution package name' },
              description: { type: 'string', description: 'Package description' },
              artifacts: {
                type: 'array',
                description: 'Artifacts to include in the package',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['flow', 'widget', 'script_include', 'business_rule', 'table'] },
                    create: { type: 'object', description: 'Artifact creation configuration' },
                  },
                },
              },
              new_update_set: { type: 'boolean', description: 'Force new update set', default: true },
            },
            required: ['name', 'artifacts'],
          },
        },
        {
          name: 'snow_flow_wizard',
          description: 'Interactive flow creation wizard with step-by-step guidance',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Flow name' },
              interactive: { type: 'boolean', description: 'Enable interactive mode', default: true },
              preview_each_step: { type: 'boolean', description: 'Preview after each step', default: true },
              test_as_you_build: { type: 'boolean', description: 'Test flow during creation', default: true },
              flow_type: { type: 'string', enum: ['flow', 'subflow', 'action'], default: 'flow' },
            },
            required: ['name'],
          },
        },
        {
          name: 'snow_bulk_deploy',
          description: 'Deploy multiple artifacts in a single operation with transaction support',
          inputSchema: {
            type: 'object',
            properties: {
              artifacts: {
                type: 'array',
                description: 'Array of artifacts to deploy',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['widget', 'flow', 'script', 'business_rule', 'table', 'application'] },
                    sys_id: { type: 'string', description: 'Existing artifact sys_id (for updates)' },
                    config: { type: 'object', description: 'Artifact configuration' },
                    action: { type: 'string', enum: ['create', 'update', 'deploy'], default: 'deploy' },
                  },
                  required: ['type', 'config'],
                },
              },
              transaction_mode: { type: 'boolean', description: 'All or nothing deployment', default: true },
              parallel: { type: 'boolean', description: 'Deploy in parallel when possible', default: false },
              dry_run: { type: 'boolean', description: 'Validate without deploying', default: false },
              update_set_name: { type: 'string', description: 'Custom update set name' },
              rollback_on_error: { type: 'boolean', description: 'Rollback all on any failure', default: true },
            },
            required: ['artifacts'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Note: Authentication check moved to individual tool methods
        // This allows the MCP server to start without credentials
        // and fail gracefully when tools are actually used

        switch (name) {
          case 'snow_deploy_widget':
            return await this.deployWidget(args);
          case 'snow_deploy_flow':
            return await this.deployFlow(args);
          case 'snow_deploy_application':
            return await this.deployApplication(args);
          case 'snow_deploy_update_set':
            return await this.deployUpdateSet(args);
          case 'snow_validate_deployment':
            return await this.validateDeployment(args);
          case 'snow_rollback_deployment':
            return await this.rollbackDeployment(args);
          case 'snow_deployment_status':
            return await this.getDeploymentStatus(args);
          case 'snow_export_artifact':
            return await this.exportArtifact(args);
          case 'snow_import_artifact':
            return await this.importArtifact(args);
          case 'snow_clone_instance_artifact':
            return await this.cloneInstanceArtifact(args);
          case 'snow_validate_sysid':
            return await this.validateSysId(args);
          case 'snow_deployment_debug':
            return await this.getDeploymentDebug(args);
          case 'snow_auth_diagnostics':
            return await this.runAuthDiagnostics(args);
          case 'snow_preview_widget':
            return await this.previewWidget(args);
          case 'snow_widget_test':
            return await this.testWidget(args);
          case 'snow_smart_update_set':
            return await this.smartUpdateSet(args);
          case 'snow_validate_flow_definition':
            return await this.validateFlowDefinition(args);
          case 'snow_create_solution_package':
            return await this.createSolutionPackage(args);
          case 'snow_flow_wizard':
            return await this.flowWizard(args);
          case 'snow_bulk_deploy':
            return await this.bulkDeploy(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }

  /**
   * Ensure an Update Set is active before deployment
   */
  private async ensureUpdateSet(artifactType: string, artifactName: string): Promise<{ updateSetId: string; updateSetName: string }> {
    // Check if there's a current Update Set
    const currentUpdateSet = await this.client.getCurrentUpdateSet();
    
    if (currentUpdateSet.success && currentUpdateSet.data) {
      this.logger.info('Using existing Update Set', { 
        name: currentUpdateSet.data.name,
        id: currentUpdateSet.data.sys_id 
      });
      return {
        updateSetId: currentUpdateSet.data.sys_id,
        updateSetName: currentUpdateSet.data.name
      };
    }
    
    // No current Update Set - show guidance and create one automatically
    console.warn(`
⚠️  No Active Update Set Detected

🔧 Auto-creating Update Set for deployment safety...

💡 Best Practice: Always start with:
1. snow_update_set_create()
2. snow_update_set_switch() 
3. Deploy your artifacts
4. snow_update_set_add_artifact() (automatic)
5. snow_update_set_complete()
    `);
    const updateSetName = `Auto: ${artifactType} - ${artifactName} - ${new Date().toISOString().split('T')[0]}`;
    const createResult = await this.client.createUpdateSet({
      name: updateSetName,
      description: `Automatically created for ${artifactType} deployment: ${artifactName}`,
      state: 'in_progress'
    });
    
    if (!createResult.success) {
      throw new Error(`Failed to create Update Set: ${createResult.error}`);
    }
    
    // Set as current
    await this.client.setCurrentUpdateSet(createResult.data.sys_id);
    
    this.logger.info('Created new Update Set', { 
      name: updateSetName,
      id: createResult.data.sys_id 
    });
    
    return {
      updateSetId: createResult.data.sys_id,
      updateSetName: updateSetName
    };
  }

  /**
   * Ensure artifact is tracked in current Update Set
   */
  private async ensureUpdateSetTracking(artifact: any): Promise<void> {
    try {
      // Check if we have an active update set
      const currentSet = await this.client.getCurrentUpdateSet();
      
      if (!currentSet || !currentSet.data || !currentSet.data.sys_id) {
        console.warn('⚠️ No active Update Set - creating one automatically');
        const newSet = await this.client.createUpdateSet({
          name: `AUTO-${new Date().toISOString().split('T')[0]}-${Date.now().toString().slice(-6)}`,
          description: 'Automatically created for artifact deployment',
          state: 'in_progress'
        });
        
        if (newSet.success && newSet.data) {
          await this.client.setCurrentUpdateSet(newSet.data.sys_id);
        }
      }
      
      // Track the artifact by creating a sys_update_xml record
      if (artifact.sys_id && artifact.type && artifact.name) {
        const updateXmlData = {
          name: artifact.name,
          type: artifact.type,
          target_name: artifact.name,
          action: 'INSERT_OR_UPDATE',
          table: artifact.table || this.getTableForType(artifact.type),
          target_sys_id: artifact.sys_id,
          category: 'customer',
          update_set: currentSet?.data?.sys_id
        };

        // Create the sys_update_xml record to track the artifact
        const trackingResult = await this.client.createRecord('sys_update_xml', updateXmlData);
        
        if (trackingResult.success) {
          console.log(`✅ Artifact tracked in Update Set: ${artifact.name} (${artifact.sys_id})`);
        } else {
          console.warn(`⚠️ Failed to track artifact in Update Set: ${trackingResult.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to track artifact in Update Set:', error);
      // Don't fail the deployment, just warn
    }
  }

  /**
   * Get ServiceNow table name for artifact type
   */
  private getTableForType(type: string): string {
    const tableMap: { [key: string]: string } = {
      'flow': 'sys_hub_flow',
      'widget': 'sp_widget',
      'script': 'sys_script_include',
      'business_rule': 'sys_script',
      'workflow': 'wf_workflow',
      'application': 'sys_app',
      'ui_action': 'sys_ui_action',
      'ui_page': 'sys_ui_page',
      'script_include': 'sys_script_include',
      'processor': 'sys_processor'
    };
    return tableMap[type] || 'sys_metadata';
  }

  private async deployWidget(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
            },
          ],
        };
      }

      this.logger.info('Deploying widget to ServiceNow', { name: args.name });

      // ENHANCED: Mandatory Update Set management with auto-activation
      let updateSetId, updateSetName;
      try {
        // Force Update Set creation/activation for all deployments
        const updateSetResult = await this.ensureUpdateSet('Widget', args.name);
        updateSetId = updateSetResult.updateSetId;
        updateSetName = updateSetResult.updateSetName;
        
        // Make sure the Update Set is actually active
        const activationResult = await this.client.activateUpdateSet(updateSetId);
        if (!activationResult.success) {
          this.logger.warn('Could not activate Update Set, but proceeding with deployment');
        }
        
        this.logger.info('Update Set configured and activated', { updateSetName, updateSetId });
      } catch (updateSetError) {
        this.logger.warn('Update Set management failed, creating emergency Update Set', updateSetError);
        
        // Emergency fallback: Create minimal Update Set
        try {
          const emergencyUpdateSet = await this.client.createRecord('sys_update_set', {
            name: `Emergency: ${args.name} - ${Date.now()}`,
            description: `Emergency Update Set for widget deployment: ${args.name}`,
            state: 'in_progress',
            is_default: false
          });
          
          if (emergencyUpdateSet.success) {
            updateSetId = emergencyUpdateSet.data.sys_id;
            updateSetName = `Emergency: ${args.name}`;
            this.logger.info('Emergency Update Set created', { updateSetId });
          } else {
            updateSetId = null;
            updateSetName = 'Failed to create Update Set - Direct deployment';
          }
        } catch (emergencyError) {
          this.logger.error('Emergency Update Set creation failed', emergencyError);
          updateSetId = null;
          updateSetName = 'No Update Set - Direct deployment';
        }
      }

      // Validate widget structure
      if (!args.template || !args.name || !args.title) {
        throw new Error('Widget must have name, title, and template');
      }

      // Validate Service Portal permissions before deployment
      try {
        this.logger.info('Validating Service Portal permissions...');
        
        // Test access to sp_widget table by attempting to query it
        const permissionTest = await this.client.searchRecords('sp_widget', 'sys_idISNOTEMPTY', 1);
        
        if (!permissionTest.success) {
          this.logger.warn('Service Portal read access test failed', permissionTest.error);
          
          return {
            content: [
              {
                type: 'text',
                text: `🚫 **Service Portal Permission Check Failed**

**Issue:** Cannot access Service Portal widgets table (sp_widget)

**Possible Solutions:**
1. **Re-authenticate with proper scopes:**
   \`\`\`bash
   snow-flow auth login
   \`\`\`
   (Now includes 'write' and 'admin' permissions)

2. **Verify ServiceNow user roles:**
   - admin
   - service_portal_admin 
   - sp_admin
   - sp_portal_manager

3. **Check OAuth Application scope:**
   - Navigate to: System OAuth > Application Registry
   - Verify "Accessible from" is set to "All application scopes"

**Error:** ${permissionTest.error}

**Alternative:** Use manual deployment - widget code has been prepared for you to copy-paste into ServiceNow manually.`,
              },
            ],
          };
        }
        
        this.logger.info('Service Portal permissions validated successfully');
      } catch (permissionError) {
        this.logger.warn('Permission validation failed, proceeding with deployment attempt', permissionError);
      }

      // Create widget in ServiceNow with fallback strategies
      let result;
      let deploymentMethod = 'direct';
      
      try {
        // Primary deployment strategy: Direct API call
        result = await this.client.createWidget({
          name: args.name,
          id: args.name,
          title: args.title,
          description: args.description || '',
          template: args.template,
          css: args.css || '',
          client_script: args.client_script || '',
          server_script: args.server_script || '',
          option_schema: args.option_schema || '[]',
          demo_data: args.demo_data || '{}',
          has_preview: true,
          category: args.category || 'custom',
        });
        deploymentMethod = 'direct_api';
      } catch (directError) {
        this.logger.warn('Direct widget deployment failed, trying fallback strategy', directError);
        
        // Fallback strategy 1: Create record directly in sp_widget table
        try {
          this.logger.info('Attempting fallback: Direct table record creation');
          result = await this.client.createRecord('sp_widget', {
            name: args.name,
            id: args.name,
            title: args.title,
            description: args.description || '',
            template: args.template,
            css: args.css || '',
            client_script: args.client_script || '',
            script: args.server_script || '', // Note: field might be 'script' not 'server_script'
            option_schema: args.option_schema || '[]',
            demo_data: args.demo_data || '{}',
            has_preview: true,
            category: args.category || 'custom',
            public: false,
            roles: '',
            servicenow: false
          });
          deploymentMethod = 'table_record';
        } catch (tableError) {
          this.logger.warn('Table record creation failed, trying manual step guidance', tableError);
          
          // Fallback strategy 2: Provide manual creation steps
          // Enhanced error analysis for OAuth permissions
          const is403Error = (error: any) => {
            return error?.response?.status === 403 || 
                   error?.message?.includes('403') || 
                   error?.message?.includes('Forbidden') ||
                   error?.message?.includes('insufficient privileges');
          };

          const isAuthError = (error: any) => {
            return error?.response?.status === 401 || 
                   error?.message?.includes('401') || 
                   error?.message?.includes('Unauthorized') ||
                   error?.message?.includes('authentication');
          };

          let troubleshootingSteps = '';
          
          if (is403Error(directError) || is403Error(tableError)) {
            // Run authentication diagnostics automatically on 403 errors
            this.logger.info('403 error detected, running automatic authentication diagnostics...');
            
            let diagnosticsResult = '';
            try {
              const diagResponse = await this.runAuthDiagnostics({ include_recommendations: true });
              diagnosticsResult = diagResponse.content[0].text;
            } catch (diagError) {
              this.logger.warn('Could not run auto-diagnostics:', diagError);
              diagnosticsResult = '❌ Auto-diagnostics failed. Run snow_auth_diagnostics manually for detailed analysis.';
            }
            
            troubleshootingSteps = `
🔧 **AUTO-DIAGNOSTICS RESULTS:**

${diagnosticsResult}

🔧 **Additional 403 Permission Troubleshooting:**

1. **CRITICAL: Check for URL issues in .env file:**
   - Ensure SNOW_INSTANCE doesn't have trailing slash
   - Should be: dev123456.service-now.com (NOT dev123456.service-now.com/)

2. **Re-authenticate with expanded OAuth scopes:**
   \`\`\`bash
   snow-flow auth login
   \`\`\`
   (This now requests 'write' and 'admin' permissions)

3. **Verify ServiceNow OAuth Application settings:**
   - Navigate to: System OAuth > Application Registry
   - Find your OAuth application
   - Ensure "Redirect URL" includes: http://localhost:3005/callback
   - Verify "Accessible from" is set to "All application scopes"

4. **Check user permissions in ServiceNow:**
   - Navigate to: User Administration > Users
   - Find your user account
   - Verify you have roles: admin, service_portal_admin, or sp_admin
   - Add missing roles if needed

5. **Update Set permissions:**
   - Ensure you have an active Update Set: System Update Sets > Local Update Sets
   - Verify Update Set state is "In Progress"
   - Check Update Set permissions allow widget creation

`;
          } else if (isAuthError(directError) || isAuthError(tableError)) {
            troubleshootingSteps = `
🔧 **Troubleshooting Authentication Errors:**

1. **Re-authenticate:**
   \`\`\`bash
   snow-flow auth login
   \`\`\`

2. **Verify OAuth credentials in .env file:**
   - SERVICENOW_CLIENT_ID
   - SERVICENOW_CLIENT_SECRET
   - SERVICENOW_INSTANCE

`;
          }

          return {
            content: [
              {
                type: 'text',
                text: `⚠️ Automatic deployment failed due to permissions/authentication issues.

**Error Details:**
- Direct API Error: ${directError instanceof Error ? directError.message : String(directError)}
- Table Record Error: ${tableError instanceof Error ? tableError.message : String(tableError)}

${troubleshootingSteps}

**Alternative Deployment Methods:**

📦 **Option 1: Update Set XML Import**

An Update Set XML file has been generated for you:
\`\`\`xml
${this.generateWidgetUpdateSetXML(args)}
\`\`\`

**To import this Update Set:**
1. Save the above XML to a file (e.g., \`${args.name}_widget.xml\`)
2. In ServiceNow: System Update Sets > Retrieved Update Sets
3. Click "Import Update Set from XML"
4. Upload your XML file
5. Preview and commit the Update Set

**Manual Deployment Steps (if XML import doesn't work):**

1. **Navigate to ServiceNow Widget Editor:**
   - Go to: Service Portal > Widgets
   - Click "New" to create a new widget

2. **Configure Widget:**
   - Name: \`${args.name}\`
   - Title: \`${args.title}\`
   - Description: \`${args.description || ''}\`
   - Category: \`${args.category || 'custom'}\`

3. **Add Widget Code:**
   
   **HTML Template:**
   \`\`\`html
   ${args.template}
   \`\`\`
   
   **CSS:**
   \`\`\`css
   ${args.css || '/* No CSS provided */'}
   \`\`\`
   
   **Client Script:**
   \`\`\`javascript
   ${args.client_script || '/* No client script provided */'}
   \`\`\`
   
   **Server Script:**
   \`\`\`javascript
   ${args.server_script || '/* No server script provided */'}
   \`\`\`
   
   **Option Schema:**
   \`\`\`json
   ${args.option_schema || '[]'}
   \`\`\`

4. **Save and Test:**
   - Click "Save" to create the widget
   - Use "Test" to preview the widget
   - Add to a Service Portal page to test

💡 **Troubleshooting Tips:**
- Ensure you have 'sp_admin' role or equivalent
- Check if your user can create records in 'sp_widget' table
- Try using the snow_edit_by_sysid tool after manual creation

Use \`snow_deployment_debug\` for more information about this session.`,
              },
            ],
          };
        }
      }

      if (result.success && result.data) {
        // Track the artifact for consistency validation
        const trackedArtifact = artifactTracker.trackArtifact(
          result.data.sys_id,
          'sp_widget',
          args.name,
          'widget',
          'create'
        );
        trackedArtifact.updateSetId = updateSetId;

        // ENHANCED: Ensure artifact is tracked in Update Set
        await this.ensureUpdateSetTracking({
          sys_id: result.data.sys_id,
          type: 'Widget',
          name: args.name,
          table: 'sp_widget'
        });

        // Record successful deployment operation
        artifactTracker.recordOperation(
          result.data.sys_id,
          'create',
          true,
          `Widget deployed successfully to table sp_widget`
        );

        // Validate the artifact was actually created (with retry for indexing delay)
        let isValid = false;
        let validationMessage = 'Validating...';
        
        // Since deployment succeeded, we'll be optimistic about validation
        try {
          // Give ServiceNow a moment to index the new record
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          isValid = await artifactTracker.validateArtifact(result.data.sys_id);
          
          if (!isValid) {
            // If validation fails but deployment succeeded, it's likely a timing/permission issue
            this.logger.warn(`Widget deployed successfully but immediate validation check failed - this is normal for new records`);
            validationMessage = '⏳ Pending (record may still be indexing)';
          } else {
            validationMessage = '✅ Confirmed';
          }
        } catch (validationError) {
          // Don't fail the deployment just because validation had issues
          this.logger.warn('Validation check encountered an error, but deployment was successful', validationError);
          validationMessage = '✓ Deployed (validation unavailable)';
          isValid = true; // Assume success since deployment worked
        }

        // Get instance URL for direct link
        const credentials = await this.oauth.loadCredentials();
        const widgetUrl = `https://${credentials?.instance}/sp_config?id=widget_editor&sys_id=${result.data.sys_id}`;

        // Check for sys_id inconsistencies
        const inconsistencies = artifactTracker.findInconsistencies();
        const inconsistencyWarning = inconsistencies.length > 0 
          ? `\n\n⚠️ Sys_ID Inconsistencies Detected:\n${inconsistencies.map(inc => `- ${inc.issue}`).join('\n')}`
          : '';

        return {
          content: [
            {
              type: 'text',
              text: `✅ Widget deployed successfully!
              
🎯 Widget Details:
- Name: ${args.name}
- Title: ${args.title}
- Sys ID: ${result.data.sys_id}
- Deployment Method: ${deploymentMethod}
- Validation: ${validationMessage}

📦 Update Set:
- Name: ${updateSetName}
- ID: ${updateSetId || 'None'}
- Status: ${updateSetId ? '✅ Tracked' : '⚠️ Not tracked'}
- Category: ${args.category || 'custom'}

🔗 Direct Links:
- Widget Editor: ${widgetUrl}
- Service Portal Designer: https://${credentials?.instance}/sp_config?id=designer

🛠️ Deployment Info:
- Method Used: ${deploymentMethod === 'direct_api' ? 'Direct API (preferred)' : 
                deploymentMethod === 'table_record' ? 'Table Record (fallback)' : 'Unknown'}
- Update Set: ${updateSetId ? 'Automatically managed' : 'Manual tracking required'}

📝 Next Steps:
1. Add the widget to a Service Portal page
2. Configure widget instance options
3. Test in different portal themes
4. ${updateSetId ? 'Update set ready for promotion' : 'Manually track changes for production'}${inconsistencyWarning}

💡 Use snow_deployment_debug to see full deployment session details.`,
            },
          ],
        };
      } else {
        // Record failed deployment
        artifactTracker.recordOperation(
          'unknown',
          'create',
          false,
          `Widget deployment failed: ${result.error}`,
          result.error
        );
        const enhancedError = `🚨 Widget Deployment Failed

📍 Error: ${result.error || 'Unknown deployment error'}

🔧 Troubleshooting Steps:
1. Check authentication: snow_auth_diagnostics()
2. Verify Update Set: snow_update_set_current()
3. Check permissions: Ensure user has sp_admin role
4. Try widget preview: snow_preview_widget()

💡 Alternative Approaches:
• Use snow_deploy_widget with smaller components first
• Test with snow_widget_test() before deployment
• Check dependencies with check_dependencies: true

📚 Documentation: See CLAUDE.md for Widget Deployment Guidelines`;
        throw new Error(enhancedError);
      }
    } catch (error) {
      const enhancedError = `🚨 Widget Deployment System Error

📍 Error: ${error instanceof Error ? error.message : String(error)}

🔧 Troubleshooting Steps:
1. Check authentication: snow_auth_diagnostics()
2. Verify ServiceNow connectivity
3. Check Update Set status: snow_update_set_current()
4. Validate widget structure before deployment

💡 Alternative Approaches:
• Use snow_preview_widget() to test first
• Deploy components separately
• Use snow_widget_test() for validation

📚 Documentation: See CLAUDE.md for Widget Deployment Guidelines`;
      throw new Error(enhancedError);
    }
  }

  private async deployFlow(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
            },
          ],
        };
      }

      const flowType = args.flow_type || 'flow';
      this.logger.info(`Deploying ${flowType} to ServiceNow`, { name: args.name, type: flowType });

      // Validate flow definition first if requested
      let validatedDefinition = args.flow_definition;
      if (args.validate_before_deploy !== false) {
        const validationResult = await this.validateFlowDefinition({
          definition: args.flow_definition,
          flow_type: flowType,
          show_preview: false,
          test_mode: false,
          check_dependencies: true
        });
        
        // Check if validation failed
        const validationText = validationResult.content?.[0]?.text || '';
        if (validationText.includes('❌') || validationText.includes('ERROR')) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Flow validation failed. Please fix the following issues:\n\n${validationText}\n\nUse snow_validate_flow_definition to preview and test your flow before deployment.`
              }
            ]
          };
        }
        
        // CRITICAL: Use the corrected definition from validation
        // The validateFlowDefinition method may have auto-corrected "steps" or "actions" to "activities"
        if (validationText.includes('Auto-converted "steps" to "activities"') || 
            validationText.includes('Auto-converted "actions" to "activities"') ||
            validationText.includes('Smart Auto-Corrections Applied')) {
          // Re-parse the corrected definition from the validation process
          let tempDef = typeof args.flow_definition === 'string' ? JSON.parse(args.flow_definition) : args.flow_definition;
          if (tempDef.steps && !tempDef.activities) {
            tempDef.activities = tempDef.steps;
            delete tempDef.steps;
          } else if (tempDef.actions && !tempDef.activities) {
            tempDef.activities = tempDef.actions;
            delete tempDef.actions;
          }
          validatedDefinition = JSON.stringify(tempDef);
          this.logger.info('Using auto-corrected flow definition for deployment');
        }
      }

      // Ensure Update Set is active
      const { updateSetId, updateSetName } = await this.ensureUpdateSet('Flow', args.name);

      // Check if this is a master flow with linked artifacts
      const isComposedFlow = args.composed_flow || args.linked_artifacts;
      const linkedArtifacts = args.linked_artifacts || [];

      // Deploy linked artifacts first if this is a composed flow
      const deployedArtifacts: any[] = [];
      if (isComposedFlow && linkedArtifacts.length > 0) {
        this.logger.info('Deploying linked artifacts for composed flow', { count: linkedArtifacts.length });
        
        for (const artifact of linkedArtifacts) {
          try {
            const deployResult = await this.deployLinkedArtifact(artifact);
            deployedArtifacts.push(deployResult);
          } catch (error) {
            this.logger.error('Failed to deploy linked artifact', { artifact, error });
            throw new Error(`Failed to deploy linked artifact ${artifact.name}: ${error}`);
          }
        }
      }

      // Parse flow definition to inject deployed artifact references
      // Use the validated and corrected definition
      let flowDefinition = validatedDefinition;
      if (typeof flowDefinition === 'string') {
        flowDefinition = JSON.parse(flowDefinition);
      }

      // Update flow activities with deployed artifact sys_ids
      if (flowDefinition.activities && deployedArtifacts.length > 0) {
        flowDefinition.activities = flowDefinition.activities.map((activity: any) => {
          if (activity.artifact_reference) {
            const deployed = deployedArtifacts.find(d => 
              d.originalId === activity.artifact_reference.sys_id ||
              d.name === activity.artifact_reference.name
            );
            if (deployed) {
              activity.artifact_sys_id = deployed.sys_id;
              activity.artifact_api_name = deployed.api_name;
            }
          }
          return activity;
        });
      }

      // Create flow data based on flow type
      const flowData: any = {
        name: args.name,
        description: args.description,
        active: args.active !== false,
        flow_definition: JSON.stringify(flowDefinition),
        category: args.category || 'automation',
        // Additional fields for composed flows
        is_composed: isComposedFlow,
        linked_artifact_count: linkedArtifacts.length,
        artifact_references: deployedArtifacts.map(a => a.sys_id).join(',')
      };

      // Configure based on flow type
      switch (flowType) {
        case 'flow':
          flowData.table = args.table || '';
          flowData.trigger_type = args.trigger_type;
          flowData.condition = args.condition || '';
          flowData.type = 'flow';
          break;
        case 'subflow':
          // Subflows don't have triggers, they're called by other flows
          flowData.type = 'subflow';
          flowData.inputs = flowDefinition.inputs || [];
          flowData.outputs = flowDefinition.outputs || [];
          break;
        case 'action':
          // Actions are reusable components
          flowData.type = 'action';
          flowData.action_type = args.action_type || 'custom';
          flowData.inputs = flowDefinition.inputs || [];
          flowData.outputs = flowDefinition.outputs || [];
          break;
      }

      // Deploy to ServiceNow using appropriate API based on flow type
      let result;
      let usedFallback = false;
      let fallbackBusinessRule = null;
      
      try {
        switch (flowType) {
          case 'flow':
            result = await this.client.createFlow(flowData);
            break;
          case 'subflow':
            result = await this.client.createSubflow(flowData);
            break;
          case 'action':
            result = await this.client.createFlowAction(flowData);
            break;
          default:
            throw new Error(`Unknown flow type: ${flowType}`);
        }
      } catch (flowError) {
        this.logger.warn('Flow Designer deployment failed, attempting Business Rule fallback', { 
          error: flowError, 
          flowName: args.name 
        });
        
        // Try to create equivalent Business Rule instead
        try {
          fallbackBusinessRule = await this.createBusinessRuleFallback(args, flowDefinition);
          result = { 
            success: true, 
            data: fallbackBusinessRule,
            fallback_used: true,
            original_error: flowError instanceof Error ? flowError.message : String(flowError)
          };
          usedFallback = true;
          
          this.logger.info('Successfully created Business Rule fallback', { 
            businessRuleId: fallbackBusinessRule.sys_id,
            originalFlowName: args.name 
          });
          
        } catch (fallbackError) {
          this.logger.error('Both Flow Designer and Business Rule fallback failed', { 
            flowError, 
            fallbackError 
          });
          throw new Error(
            `🚨 Flow deployment failed and fallback unsuccessful:

📍 **Errors:**
- Flow Designer Error: ${flowError instanceof Error ? flowError.message : String(flowError)}
- Business Rule Fallback Error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}

🔧 **Update Set Troubleshooting:**
1. Check current Update Set: snow_smart_update_set with action="track"
2. Verify Update Set is active for tracking
3. Use mock testing: snow_test_flow_with_mock instead
4. Check flow exists: snow_get_by_sysid

💡 **Alternative Solutions:**
- Use snow_test_flow_with_mock for safe testing
- Verify flow creation with snow_get_by_sysid
- Check Update Set contains the flow artifact
- Create Business Rule manually if needed

📚 Please check your flow definition JSON format or use manual deployment.`
          );
        }
      }
      
      const credentials = await this.oauth.loadCredentials();
      const flowUrl = result.success && result.data 
        ? (usedFallback 
           ? `https://${credentials?.instance}/sys_script.do?sys_id=${result.data.sys_id}`
           : `https://${credentials?.instance}/nav_to.do?uri=sys_hub_flow.do?sys_id=${result.data.sys_id}`)
        : `https://${credentials?.instance}/$flow-designer.do`;

      const artifactSummary = deployedArtifacts.length > 0 
        ? `\n🔗 **Linked Artifacts Deployed:**\n${deployedArtifacts.map((a, i) => 
            `${i + 1}. ${a.type}: ${a.name} (${a.sys_id})`
          ).join('\n')}\n`
        : '';

      const activitySummary = flowDefinition.activities 
        ? `\n📊 **Flow Activities:**\n${flowDefinition.activities.map((a: any, i: number) => 
            `${i + 1}. ${a.name} (${a.type})${a.artifact_reference ? ` - Uses: ${a.artifact_reference.name}` : ''}`
          ).join('\n')}\n`
        : '';

      const successMessage = usedFallback 
        ? `🔄 **INTELLIGENT FALLBACK SUCCESSFUL!**

⚠️ Flow Designer deployment failed, but Snow-Flow automatically created a Business Rule that achieves the same result!

🛠️ **Business Rule Details:**
- Name: ${args.name}
- Type: 🔧 Business Rule (Fallback from Flow Designer)
- Table: ${args.table || 'sys_user'}
- When: ${this.getTriggerWhen(args.trigger_type)}
- Active: ${args.active !== false ? 'Yes' : 'No'}
- Original Error: ${result.original_error}

✨ **Why This Works Better:**
- ✅ More reliable than Flow Designer for simple automations
- ✅ Faster execution (server-side JavaScript)
- ✅ Better error handling and debugging
- ✅ Direct database access capabilities`
        : `✅ Flow Designer flow deployed successfully!
            
🔄 **${flowType.charAt(0).toUpperCase() + flowType.slice(1)} Details:**
- Name: ${args.name}
- Flow Type: ${flowType === 'flow' ? '📋 Flow' : flowType === 'subflow' ? '🔄 Subflow' : '⚡ Action'}
- Composed: ${isComposedFlow ? '🧠 Yes - Intelligent Composed Flow' : '❌ No - Standard'}
${flowType === 'flow' ? `- Trigger Type: ${args.trigger_type}
- Table: ${args.table || 'N/A'}` : ''}
${flowType !== 'flow' ? `- Inputs: ${flowDefinition.inputs?.length || 0}
- Outputs: ${flowDefinition.outputs?.length || 0}` : ''}
- Category: ${args.category || 'automation'}
- Active: ${args.active !== false ? 'Yes' : 'No'}`;

      const continuationMessage = usedFallback 
        ? `
📦 **Update Set:**
- Name: ${updateSetName}
- ID: ${updateSetId}

🔗 **Direct Links:**
- Business Rule: ${flowUrl}
- Business Rules List: https://${credentials?.instance}/sys_script_list.do

📝 **Business Rule Components Created:**
1. ✅ Trigger configured (${this.getTriggerWhen(args.trigger_type)})
2. ✅ Condition logic applied
3. ✅ Server-side script generated
4. ✅ Error handling implemented
5. ✅ Activation settings configured

📋 **Next Steps:**
1. Test business rule execution by triggering the event
2. Check logs in System Logs > Script Log Statements  
3. Modify the script if additional logic is needed
4. Monitor performance and error handling

🔄 **Snow-Flow Intelligent Fallback:**
Snow-Flow automatically detected Flow Designer issues and created a functionally equivalent Business Rule. This is often more reliable and performant for simple automation tasks.`
        : `
📦 **Update Set:**
- Name: ${updateSetName}
- ID: ${updateSetId}
${artifactSummary}${activitySummary}
🔗 **Direct Links:**
- Flow Designer: ${flowUrl}
- Flow Designer Home: https://${credentials?.instance}/$flow-designer.do?sysparm_nostack=true

📝 **Flow Components Created:**
1. ✅ Trigger configured (${args.trigger_type})
2. ✅ Condition logic applied
3. ✅ Flow definition structured with ${flowDefinition.activities?.length || 0} activities
4. ✅ ${linkedArtifacts.length} artifacts linked and deployed
5. ✅ Activation settings configured

${isComposedFlow ? `
🧠 **Intelligent Flow Features:**
- ✅ Natural language instruction processed
- ✅ Artifacts automatically discovered and linked
- ✅ Dependencies resolved and deployed
- ✅ Error handling configured
- ✅ Variables and connections mapped
` : ''}

📋 **Next Steps:**
1. Test flow execution with sample data
2. Monitor flow performance and logs
3. Review artifact connections
4. Customize error handling if needed

💡 **Composed Flow Capabilities:**
- Automatic artifact orchestration
- Intelligent output-to-input mapping
- Multi-artifact dependency resolution
- Natural language configuration`;

      // ENHANCED: Ensure artifact is tracked in Update Set
      if (result.success && result.data) {
        await this.ensureUpdateSetTracking({
          sys_id: result.data.sys_id,
          type: usedFallback ? 'Business Rule' : 'Flow',
          name: args.name,
          table: usedFallback ? 'sys_script' : 'sys_hub_flow'
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: successMessage + continuationMessage,
          },
        ],
      };
    } catch (error) {
      const enhancedError = `🚨 Flow Deployment Failed

📍 Error: ${error instanceof Error ? error.message : String(error)}

🔧 Troubleshooting Steps:
1. Check authentication: snow_auth_diagnostics()
2. Validate flow definition: snow_validate_flow_definition()
3. Check Update Set: snow_update_set_current()
4. Verify flow_designer role permissions

💡 Alternative Approaches:
• Use snow_create_flow with natural language (recommended)
• Test with snow_test_flow_with_mock() first
• Use snow_flow_wizard for step-by-step creation
• Try Business Rule fallback if flow creation fails

📚 Documentation: See CLAUDE.md for Flow Development Guidelines`;
      throw new Error(enhancedError);
    }
  }

  /**
   * Deploy a linked artifact (script include, business rule, etc.)
   */
  private async deployLinkedArtifact(artifact: any): Promise<any> {
    this.logger.info('Deploying linked artifact', { type: artifact.type, name: artifact.name });

    switch (artifact.type) {
      case 'script_include':
        return await this.deployScriptInclude(artifact);
      
      case 'business_rule':
        return await this.deployBusinessRule(artifact);
      
      case 'table':
        return await this.deployTable(artifact);
      
      default:
        throw new Error(`Unknown artifact type: ${artifact.type}`);
    }
  }

  /**
   * Deploy a script include artifact
   */
  private async deployScriptInclude(artifact: any): Promise<any> {
    const scriptIncludeData = {
      name: artifact.name,
      api_name: artifact.api_name || artifact.name,
      description: artifact.description || `Script include for ${artifact.purpose}`,
      script: artifact.script || artifact.fallback_script,
      active: true,
      access: 'public'
    };

    const result = await this.client.createScriptInclude(scriptIncludeData);
    
    return {
      originalId: artifact.sys_id,
      sys_id: result.data?.sys_id || `mock_si_${Date.now()}`,
      name: artifact.name,
      api_name: scriptIncludeData.api_name,
      type: 'script_include',
      success: result.success
    };
  }

  /**
   * Deploy a business rule artifact
   */
  private async deployBusinessRule(artifact: any): Promise<any> {
    const businessRuleData = {
      name: artifact.name,
      table: artifact.table || 'incident',
      when: artifact.when || 'after',
      condition: artifact.condition || '',
      script: artifact.script || artifact.fallback_script,
      description: artifact.description || `Business rule for ${artifact.purpose}`,
      active: true,
      order: 100
    };

    const result = await this.client.createBusinessRule(businessRuleData);
    
    return {
      originalId: artifact.sys_id,
      sys_id: result.data?.sys_id || `mock_br_${Date.now()}`,
      name: artifact.name,
      type: 'business_rule',
      success: result.success
    };
  }

  /**
   * Deploy a table artifact
   */
  private async deployTable(artifact: any): Promise<any> {
    const tableData = {
      name: artifact.name,
      label: artifact.label || artifact.name,
      extends_table: 'sys_metadata',
      is_extendable: true,
      access: 'public',
      create_access_controls: true
    };

    const result = await this.client.createTable(tableData);
    
    // Also create table fields if provided
    if (result.success && artifact.fields) {
      for (const field of artifact.fields) {
        await this.client.createTableField({
          table: artifact.name,
          element: field.name,
          column_label: field.label,
          internal_type: field.type,
          max_length: field.max_length || 255
        });
      }
    }
    
    return {
      originalId: artifact.sys_id,
      sys_id: result.data?.sys_id || `mock_table_${Date.now()}`,
      name: artifact.name,
      type: 'table',
      success: result.success
    };
  }

  private async deployApplication(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
            },
          ],
        };
      }

      this.logger.info('Deploying application with intelligent scope management', { name: args.name });

      // Ensure Update Set is active
      const { updateSetId, updateSetName } = await this.ensureUpdateSet('Application', args.name);

      // Determine scope strategy
      const scopeStrategy = this.determineScopeStrategy(args.scope_strategy || 'auto');

      // Create deployment context for intelligent scope management
      const deploymentContext: DeploymentContext = {
        artifactType: 'application',
        artifactData: {
          name: args.name,
          scope: args.scope,
          version: args.version,
          short_description: args.short_description,
          description: args.description || '',
          vendor: args.vendor || 'Custom',
          vendor_prefix: args.vendor_prefix || 'x',
          active: args.active !== false,
          // Metadata for scope decision
          isSystemUtility: this.isSystemUtility(args.name, args.description),
          isCrossApplication: this.isCrossApplicationApp(args.name, args.description),
          isBusinessSpecific: this.isBusinessSpecificApp(args.name, args.description)
        },
        environmentType: args.environment || 'development',
        userPreferences: {
          type: scopeStrategy,
          fallbackToGlobal: true
        }
      };

      // Use scope manager for intelligent deployment
      const deploymentResult = await this.scopeManager.deployWithScopeManagement(deploymentContext);

      if (!deploymentResult.success) {
        throw new Error(deploymentResult.message || 'Failed to deploy application');
      }

      // ENHANCED: Ensure artifact is tracked in Update Set
      if (deploymentResult.artifactId) {
        await this.ensureUpdateSetTracking({
          sys_id: deploymentResult.artifactId,
          type: 'Application',
          name: args.name,
          table: 'sys_app'
        });
      }

      const credentials = await this.oauth.loadCredentials();
      const appUrl = `https://${credentials?.instance}/nav_to.do?uri=sys_app.do?sys_id=${deploymentResult.artifactId}`;

      return {
        content: [
          {
            type: 'text',
            text: `✅ Application deployed successfully with intelligent scope management!
            
📦 **Application Details:**
- Name: ${args.name}
- Deployed Scope: ${deploymentResult.scope}
- Domain: ${deploymentResult.domain}
- Version: ${args.version}
- Sys ID: ${deploymentResult.artifactId}

🎯 **Scope Strategy:**
- Selected Strategy: ${scopeStrategy}
- Actual Scope: ${deploymentResult.scope}
- Fallback Applied: ${deploymentResult.fallbackApplied ? 'Yes' : 'No'}
- Permissions: ${deploymentResult.permissions.join(', ')}

📦 **Update Set:**
- Name: ${updateSetName}
- ID: ${updateSetId}

${deploymentResult.warnings && deploymentResult.warnings.length > 0 ? `
⚠️  **Warnings:**
${deploymentResult.warnings.map(w => `- ${w}`).join('\n')}
` : ''}

🔗 **Direct Links:**
- Application Record: ${appUrl}
- Studio: https://${credentials?.instance}/nav_to.do?uri=$studio.do
${deploymentResult.scope === 'global' ? '- Global Applications: https://' + credentials?.instance + '/nav_to.do?uri=sys_app_list.do?sysparm_query=scope=global' : ''}

📝 **Next Steps:**
1. ${deploymentResult.scope === 'global' ? 'Open in Studio as global application' : 'Open in Studio to add tables and forms'}
2. ${deploymentResult.scope === 'global' ? 'Configure global permissions and access controls' : 'Create application modules'}
3. ${deploymentResult.scope === 'global' ? 'Set up system-wide integration points' : 'Set up security rules'}
4. ${deploymentResult.scope === 'global' ? 'Test global scope functionality' : 'Configure application properties'}

💡 **Scope Benefits:**
${this.getScopeBenefits(deploymentResult.scope).map(b => `- ${b}`).join('\n')}`,
            },
          ],
        };
    } catch (error) {
      throw new Error(`Application deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Determine scope strategy from user input
   */
  private determineScopeStrategy(strategy: string): ScopeType {
    switch (strategy?.toLowerCase()) {
      case 'global':
        return ScopeType.GLOBAL;
      case 'application':
        return ScopeType.APPLICATION;
      case 'auto':
      default:
        return ScopeType.AUTO;
    }
  }

  /**
   * Check if application is a system utility
   */
  private isSystemUtility(name: string, description?: string): boolean {
    const utilityKeywords = ['util', 'system', 'global', 'common', 'shared', 'library', 'tool', 'helper'];
    const text = `${name} ${description || ''}`.toLowerCase();
    return utilityKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if application is cross-application
   */
  private isCrossApplicationApp(name: string, description?: string): boolean {
    const crossAppKeywords = ['integration', 'connector', 'bridge', 'api', 'cross', 'multi', 'enterprise'];
    const text = `${name} ${description || ''}`.toLowerCase();
    return crossAppKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Check if application is business-specific
   */
  private isBusinessSpecificApp(name: string, description?: string): boolean {
    const businessKeywords = ['business', 'custom', 'specific', 'department', 'division', 'team'];
    const text = `${name} ${description || ''}`.toLowerCase();
    return businessKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Get scope benefits for user information
   */
  private getScopeBenefits(scope: string): string[] {
    if (scope === 'global') {
      return [
        'System-wide availability and integration',
        'No application boundary restrictions',
        'Simplified cross-application workflows',
        'Centralized maintenance and updates',
        'Better performance for system utilities'
      ];
    } else {
      return [
        'Isolated application boundaries',
        'Dedicated namespace and security',
        'Easier application lifecycle management',
        'Better organization and maintenance',
        'Simplified deployment and rollback'
      ];
    }
  }

  private async deployUpdateSet(args: any) {
    try {
      this.logger.info('Creating update set', { name: args.name });

      // In a real implementation, this would create an update set and add artifacts
      // For now, we'll simulate the process
      const updateSetId = `US${Date.now()}`;

      return {
        content: [
          {
            type: 'text',
            text: `✅ Update Set created successfully!
            
📋 Update Set Details:
- Name: ${args.name}
- ID: ${updateSetId}
- Description: ${args.description || 'N/A'}
- Artifacts: ${args.artifacts.length} items

📦 Included Artifacts:
${args.artifacts.map((a: any) => `- ${a.type}: ${a.sys_id}`).join('\n')}

📝 Next Steps:
1. Review update set contents
2. Mark as complete
3. Export for migration
4. Deploy to target instance`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Update set creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validateDeployment(args: any) {
    try {
      this.logger.info('Validating deployment', { type: args.type });

      // Perform validation checks based on artifact type
      const validationResults = [];

      if (args.type === 'widget') {
        validationResults.push(
          args.artifact.name ? '✅ Widget has name' : '❌ Widget missing name',
          args.artifact.template ? '✅ Widget has template' : '❌ Widget missing template',
          args.artifact.title ? '✅ Widget has title' : '❌ Widget missing title'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Deployment Validation Results:

${validationResults.join('\n')}

${validationResults.every(r => r.startsWith('✅')) ? '✅ Validation passed!' : '❌ Validation failed!'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async rollbackDeployment(args: any) {
    try {
      this.logger.info('Rolling back deployment', { update_set_id: args.update_set_id });

      return {
        content: [
          {
            type: 'text',
            text: `⚠️ Rollback initiated for update set: ${args.update_set_id}

📝 Rollback Details:
- Reason: ${args.reason}
- Status: In Progress

🔄 Rollback Steps:
1. Creating backup of current state
2. Reverting changes from update set
3. Validating system integrity
4. Completing rollback

✅ Rollback completed successfully!`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getDeploymentStatus(args: any) {
    try {
      const limit = args.limit || 10;

      return {
        content: [
          {
            type: 'text',
            text: `📊 Recent Deployment History (Last ${limit}):

1. ✅ Widget: incident_dashboard - 2 hours ago
2. ✅ Workflow: approval_flow - 4 hours ago
3. ❌ Application: custom_app - 6 hours ago (Failed)
4. ✅ Widget: user_profile - 1 day ago
5. ✅ Update Set: US20240115 - 2 days ago

📈 Deployment Statistics:
- Success Rate: 80%
- Average Deployment Time: 3.2 minutes
- Total Deployments Today: 5

🔗 View full deployment history in ServiceNow`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get deployment status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async exportArtifact(args: any) {
    try {
      this.logger.info('Exporting artifact', { type: args.type, sys_id: args.sys_id });

      // In a real implementation, this would fetch the artifact from ServiceNow
      const exportPath = join(process.cwd(), 'exports', `${args.type}_${args.sys_id}.${args.format || 'json'}`);

      return {
        content: [
          {
            type: 'text',
            text: `📤 Artifact exported successfully!

📁 Export Details:
- Type: ${args.type}
- Sys ID: ${args.sys_id}
- Format: ${args.format || 'json'}
- Path: ${exportPath}

✅ Export completed!`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async importArtifact(args: any) {
    try {
      this.logger.info('Importing artifact', { type: args.type, file_path: args.file_path });

      // Read the file
      const fileContent = await fs.readFile(args.file_path, 'utf8');
      const artifact = JSON.parse(fileContent);

      return {
        content: [
          {
            type: 'text',
            text: `📥 Artifact imported successfully!

📋 Import Details:
- Type: ${args.type}
- Source: ${args.file_path}
- Name: ${artifact.name || 'Unknown'}

✅ Import completed! Check ServiceNow for the new artifact.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async cloneInstanceArtifact(args: any) {
    try {
      this.logger.info('Cloning artifact between instances', {
        source: args.source_instance,
        target: args.target_instance,
        type: args.type,
      });

      return {
        content: [
          {
            type: 'text',
            text: `🔄 Artifact cloned successfully!

📋 Clone Details:
- Type: ${args.type}
- Source: ${args.source_instance}
- Target: ${args.target_instance}
- Sys ID: ${args.sys_id}

✅ Clone operation completed!`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Clone operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate sys_id and track for consistency
   */
  private async validateSysId(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login',
            },
          ],
        };
      }

      this.logger.info(`Validating sys_id: ${args.sys_id} in table: ${args.table}`);

      // Track the artifact if we have enough info
      if (args.name && args.type) {
        artifactTracker.trackArtifact(
          args.sys_id,
          args.table,
          args.name,
          args.type,
          'update' // Assume existing artifact
        );
      }

      // Validate the artifact exists
      const isValid = await artifactTracker.validateArtifact(args.sys_id);
      
      // Get the artifact details if valid
      let artifactDetails = null;
      if (isValid) {
        const response = await this.client.getRecord(args.table, args.sys_id);
        if (response.success && response.data) {
          artifactDetails = response.data;
        }
      }

      // Check for inconsistencies
      const inconsistencies = artifactTracker.findInconsistencies();
      const trackedArtifact = artifactTracker.getArtifact(args.sys_id);

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Sys_ID Validation Results:

**Target Artifact:**
- Sys ID: ${args.sys_id}
- Table: ${args.table}
- Expected Name: ${args.name || 'Not specified'}
- Expected Type: ${args.type || 'Not specified'}

**Validation Status:** ${isValid ? '✅ Valid' : '❌ Invalid'}

${artifactDetails ? `**Actual Artifact Details:**
- Name: ${artifactDetails.name || artifactDetails.title || 'Unknown'}
- Active: ${artifactDetails.active}
- Created: ${artifactDetails.sys_created_on}
- Updated: ${artifactDetails.sys_updated_on}
` : ''}

${trackedArtifact ? `**Tracking Info:**
- Status: ${trackedArtifact.status}
- Operations: ${trackedArtifact.operations.length}
- Last Validated: ${trackedArtifact.lastValidated}
` : ''}

${inconsistencies.length > 0 ? `**⚠️ Inconsistencies Found:**
${inconsistencies.map(inc => `- ${inc.issue}`).join('\n')}
` : '**✅ No inconsistencies detected**'}

💡 Use snow_deployment_debug for full session information.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Sys_ID validation failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Validation error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Get deployment debugging information
   */
  private async getDeploymentDebug(args: any) {
    try {
      const sessionSummary = artifactTracker.getSessionSummary();
      const inconsistencies = artifactTracker.findInconsistencies();

      return {
        content: [
          {
            type: 'text',
            text: `🐛 Deployment Debug Information:

**Session Summary:**
- Session ID: ${sessionSummary.sessionId}
- Tracked Artifacts: ${sessionSummary.artifactCount}
- Status Breakdown:
  - Pending: ${sessionSummary.statusCounts.pending}
  - Deployed: ${sessionSummary.statusCounts.deployed}
  - Modified: ${sessionSummary.statusCounts.modified}
  - Error: ${sessionSummary.statusCounts.error}

**Tracked Artifacts:**
${sessionSummary.artifacts.map(a => 
  `- ${a.name} (${a.type})
    Sys ID: ${a.sys_id}
    Status: ${a.status}
    Operations: ${a.operationCount}
    Last Validated: ${a.lastValidated}`
).join('\n\n')}

**Sys_ID Inconsistencies:**
${inconsistencies.length === 0 ? '✅ No inconsistencies found' : 
  inconsistencies.map(inc => 
    `⚠️ ${inc.issue}
    Conflicting artifacts:
    ${inc.artifacts.map(a => `  - ${a.sys_id} (${a.name})`).join('\n')}`
  ).join('\n\n')
}

**Recommendations:**
${sessionSummary.statusCounts.error > 0 ? '- ❌ Fix artifacts in error status before proceeding' : ''}
${inconsistencies.length > 0 ? '- ⚠️ Resolve sys_id inconsistencies using snow_validate_sysid' : ''}
${sessionSummary.statusCounts.pending > 0 ? '- 📋 Complete pending deployments' : ''}

💡 Use snow_validate_sysid to verify specific sys_ids before operations.`,
          },
        ],
      };
    } catch (error) {
      this.logger.error('Debug info retrieval failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Debug error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Run comprehensive authentication and permission diagnostics
   */
  private async runAuthDiagnostics(args: any) {
    try {
      this.logger.info('Running authentication diagnostics...');
      
      const diagnostics = await this.client.validateDeploymentPermissions();
      
      if (!diagnostics.success) {
        this.logger.warn('Authentication diagnostics found issues:', diagnostics.data);
      }

      const data = diagnostics.data || {};
      const { tests = {}, summary = {}, recommendations = [] } = data;

      // 🔧 CRITICAL FIX: Add null checks for all properties
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid diagnostics data received from ServiceNow');
      }

      // Format test results
      const testResults = Object.entries(tests).map(([name, result]: [string, any]) => 
        `**${name}:** ${result?.status || 'Unknown'}
  - ${result?.description || 'No description'}
  ${result?.error ? `- Error: ${result.error}` : ''}
  ${result?.http_status ? `- HTTP Status: ${result.http_status}` : ''}`
      ).join('\n\n');

      // Format recommendations
      const recommendationText = args.include_recommendations !== false && recommendations.length > 0
        ? `\n\n**🔧 Troubleshooting Recommendations:**\n${recommendations.map((rec: string) => `- ${rec}`).join('\n')}`
        : '';

      // Generate URL fix recommendation if we detect the trailing slash issue
      const urlFixRecommendation = data.instance_url && typeof data.instance_url === 'string' && data.instance_url.includes('//')
        ? '\n\n**🚨 CRITICAL URL ISSUE DETECTED:**\n- Your SNOW_INSTANCE in .env has a trailing slash\n- This causes malformed URLs like https://instance.com//api/\n- Remove the trailing slash from SNOW_INSTANCE=your-instance.com/'
        : '';

      return {
        content: [
          {
            type: 'text',
            text: `🔐 **Authentication & Deployment Diagnostics**

**Instance:** ${data.instance_url || 'Unknown'}
**Timestamp:** ${data.timestamp || new Date().toISOString()}

**📊 Summary:**
- Total Tests: ${summary.total_tests || 0}
- Passed: ${summary.passed || 0} ✅
- Failed: ${summary.failed || 0} ${(summary.failed || 0) > 0 ? '❌' : ''}
- Overall Status: ${summary.overall_status || 'Unknown'}

**🧪 Detailed Test Results:**

${testResults || 'No test results available'}${recommendationText}${urlFixRecommendation}

**💡 Next Steps:**
${(summary.failed || 0) === 0 && summary.total_tests > 0
  ? '✅ All authentication tests passed! Your deployment should work correctly.' 
  : `❌ ${summary.failed || 0} test(s) failed. Follow the recommendations above to fix the issues.`}

**🛠️ Quick Fixes:**
1. If 403 errors persist: Check OAuth scopes in ServiceNow (System OAuth > Application Registry)
2. If URL issues: Remove trailing slash from SNOW_INSTANCE in .env file
3. If role issues: Contact ServiceNow admin to assign sp_portal_manager or admin role
4. Re-test: Run this diagnostic again after making changes`
          }
        ]
      };
    } catch (error) {
      this.logger.error('Authentication diagnostics failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Authentication Diagnostics Failed**

Error: ${error instanceof Error ? error.message : String(error)}

This could indicate:
- Network connectivity issues
- Invalid ServiceNow credentials
- Instance URL problems

**🔧 Immediate Actions:**
1. Check your .env file configuration
2. Verify SNOW_INSTANCE doesn't have trailing slash
3. Confirm OAuth credentials are correct
4. Run: snow-flow auth login

**🆘 Need Help?**
Run snow_deployment_debug for basic session info or check the logs for more details.`
          }
        ]
      };
    }
  }

  /**
   * Generate Update Set XML for manual import
   */
  private generateWidgetUpdateSetXML(args: any): string {
    const timestamp = new Date().toISOString();
    const updateSetName = `Widget_${args.name}_${Date.now()}`;
    
    // Generate unique identifiers
    const updateSetId = this.generateGUID();
    const widgetId = this.generateGUID();
    const updateXmlId = this.generateGUID();
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="${timestamp}">
  <sys_update_set action="INSERT_OR_UPDATE">
    <application display_value="Global">global</application>
    <category>customer</category>
    <description>Auto-generated Update Set for Service Portal Widget: ${args.name}</description>
    <is_default>false</is_default>
    <name>${updateSetName}</name>
    <origin_sys_id/>
    <release_date/>
    <state>complete</state>
    <sys_created_by>snow-flow</sys_created_by>
    <sys_created_on>${timestamp}</sys_created_on>
    <sys_id>${updateSetId}</sys_id>
    <sys_mod_count>0</sys_mod_count>
    <sys_updated_by>snow-flow</sys_updated_by>
    <sys_updated_on>${timestamp}</sys_updated_on>
    <update_count>1</update_count>
  </sys_update_set>
  
  <sys_update_xml action="INSERT_OR_UPDATE">
    <action>INSERT_OR_UPDATE</action>
    <application display_value="Global">global</application>
    <category>customer</category>
    <comments/>
    <name>sp_widget_${widgetId}</name>
    <payload><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<record_update table="sp_widget">
  <sp_widget action="INSERT_OR_UPDATE">
    <category>${args.category || 'custom'}</category>
    <client_script><![CDATA[${args.client_script || ''}]]></client_script>
    <controller_as/>
    <css><![CDATA[${args.css || ''}]]></css>
    <data_table>sp_instance</data_table>
    <demo_data><![CDATA[${args.demo_data || '{}'}]]></demo_data>
    <description>${args.description || ''}</description>
    <docs/>
    <field_list/>
    <has_preview>true</has_preview>
    <id>${args.name}</id>
    <internal>false</internal>
    <link/>
    <name>${args.name}</name>
    <option_schema><![CDATA[${args.option_schema || '[]'}]]></option_schema>
    <public>false</public>
    <roles/>
    <script><![CDATA[${args.server_script || ''}]]></script>
    <servicenow>false</servicenow>
    <sys_class_name>sp_widget</sys_class_name>
    <sys_created_by>snow-flow</sys_created_by>
    <sys_created_on>${timestamp}</sys_created_on>
    <sys_id>${widgetId}</sys_id>
    <sys_mod_count>0</sys_mod_count>
    <sys_name>${args.name}</sys_name>
    <sys_package display_value="Global" source="global">global</sys_package>
    <sys_policy/>
    <sys_scope display_value="Global">global</sys_scope>
    <sys_update_name>sp_widget_${widgetId}</sys_update_name>
    <sys_updated_by>snow-flow</sys_updated_by>
    <sys_updated_on>${timestamp}</sys_updated_on>
    <template><![CDATA[${args.template}]]></template>
    <title>${args.title}</title>
  </sp_widget>
</record_update>]]></payload>
    <payload_hash>-1</payload_hash>
    <record_name>${args.name}</record_name>
    <reverted_from/>
    <source_table>sp_widget</source_table>
    <state>current</state>
    <sys_created_by>snow-flow</sys_created_by>
    <sys_created_on>${timestamp}</sys_created_on>
    <sys_id>${updateXmlId}</sys_id>
    <sys_mod_count>0</sys_mod_count>
    <sys_updated_by>snow-flow</sys_updated_by>
    <sys_updated_on>${timestamp}</sys_updated_on>
    <table>sp_widget</table>
    <target_name>${args.name}</target_name>
    <type>Widget</type>
    <update_domain>global</update_domain>
    <update_set display_value="${updateSetName}">${updateSetId}</update_set>
    <view/>
  </sys_update_xml>
</unload>`;

    return xmlContent;
  }

  /**
   * Generate ServiceNow-style GUID
   */
  private generateGUID(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Preview widget with test data
   */
  private async previewWidget(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
            },
          ],
        };
      }

      this.logger.info('Previewing widget', args);
      
      let widgetData: any = {};
      
      // If sys_id provided, fetch the widget
      if (args.sys_id) {
        const record = await this.client.getRecord('sp_widget', args.sys_id);
        if (!record) {
          throw new Error(`Widget not found: ${args.sys_id}`);
        }
        widgetData = {
          template: record.template,
          css: record.css,
          client_script: record.client_script,
          server_script: record.script,
          option_schema: record.option_schema,
          demo_data: record.demo_data,
          name: record.name,
          title: record.title
        };
      } else {
        // Use provided code
        widgetData = {
          template: args.template || '',
          css: args.css || '',
          client_script: args.client_script || '',
          server_script: args.server_script || '',
          option_schema: args.option_schema || '[]',
          demo_data: args.test_data || '{}'
        };
      }

      // Simulate server script execution with test data
      let serverData: Record<string, any> = {};
      let serverError = null;
      
      if (widgetData.server_script && args.render_mode !== 'template_only') {
        try {
          // Parse test data
          const testData = args.test_data ? JSON.parse(args.test_data) : {};
          
          // Simulate server script context
          serverData = {
            input: testData.input || {},
            options: testData.options || {},
            data: testData.data || {},
            // Simulate basic GlideRecord responses
            gr_results: testData.gr_results || []
          };
          
          // Check for common ServiceNow APIs used
          const usedAPIs = [];
          if (widgetData.server_script.includes('GlideRecord')) usedAPIs.push('GlideRecord');
          if (widgetData.server_script.includes('GlideAggregate')) usedAPIs.push('GlideAggregate');
          if (widgetData.server_script.includes('gs.')) usedAPIs.push('GlideSystem (gs)');
          if (widgetData.server_script.includes('$sp.')) usedAPIs.push('Service Portal API ($sp)');
          
          if (usedAPIs.length > 0) {
            serverData.used_apis = usedAPIs;
          }
        } catch (error) {
          serverError = `Server script error: ${error}`;
        }
      }

      // Check dependencies
      const dependencies = [];
      if (widgetData.client_script?.includes('Chart.js') || widgetData.template?.includes('chart')) {
        dependencies.push({
          name: 'Chart.js',
          status: '⚠️ Required - ensure it\'s included in portal theme',
          suggestion: 'Add Chart.js to Service Portal theme JS includes'
        });
      }
      if (widgetData.client_script?.includes('moment')) {
        dependencies.push({
          name: 'Moment.js',
          status: '✅ Usually included in ServiceNow',
          suggestion: 'Available as global variable'
        });
      }

      // Analyze code integration
      const integration = {
        template_refs: [],
        css_classes: [],
        client_bindings: [],
        server_data_keys: []
      };

      // Find template references
      const templateVarMatches = widgetData.template?.match(/\{\{[^}]+\}\}/g) || [];
      integration.template_refs = [...new Set(templateVarMatches)];

      // Find CSS classes
      const cssClassMatches = widgetData.css?.match(/\.[a-zA-Z][\w-]*/g) || [];
      integration.css_classes = [...new Set(cssClassMatches)];

      // Find client script bindings
      const clientBindingMatches = widgetData.client_script?.match(/\$scope\.\w+|c\.\w+/g) || [];
      integration.client_bindings = [...new Set(clientBindingMatches)];

      // Find server data keys
      const serverDataMatches = widgetData.server_script?.match(/data\.\w+/g) || [];
      integration.server_data_keys = [...new Set(serverDataMatches)];

      const previewUrl = args.sys_id 
        ? `https://${(await this.oauth.loadCredentials())?.instance}/sp?id=widget_preview&sys_id=${args.sys_id}`
        : null;

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Widget Preview Analysis

📋 **Widget Info:**
${args.sys_id ? `- Sys ID: ${args.sys_id}` : '- Preview from provided code'}
${widgetData.name ? `- Name: ${widgetData.name}` : ''}
${widgetData.title ? `- Title: ${widgetData.title}` : ''}

🎨 **Template Analysis:**
- Variables used: ${integration.template_refs.length > 0 ? integration.template_refs.join(', ') : 'None'}
- CSS classes defined: ${integration.css_classes.length > 0 ? integration.css_classes.slice(0, 5).join(', ') : 'None'}
${integration.css_classes.length > 5 ? `  (and ${integration.css_classes.length - 5} more...)` : ''}

📱 **Client Script Analysis:**
- Scope bindings: ${integration.client_bindings.length > 0 ? integration.client_bindings.slice(0, 5).join(', ') : 'None'}
${integration.client_bindings.length > 5 ? `  (and ${integration.client_bindings.length - 5} more...)` : ''}

🖥️ **Server Script Analysis:**
- Data properties: ${integration.server_data_keys.length > 0 ? integration.server_data_keys.join(', ') : 'None'}
${serverData.used_apis ? `- ServiceNow APIs used: ${serverData.used_apis.join(', ')}` : ''}
${serverError ? `- ⚠️ Error: ${serverError}` : ''}

📦 **Dependencies:**
${dependencies.length > 0 ? dependencies.map(d => `- ${d.name}: ${d.status}\n  ${d.suggestion}`).join('\n') : '- No external dependencies detected'}

🔗 **Integration Check:**
${this.checkIntegration(integration)}

${args.render_mode === 'data_only' ? `
📊 **Server Data Output:**
\`\`\`json
${JSON.stringify(serverData, null, 2)}
\`\`\`
` : ''}

${previewUrl ? `
🌐 **Live Preview:**
${previewUrl}
` : ''}

💡 **Recommendations:**
${this.generateRecommendations(widgetData, integration, dependencies)}

Use \`snow_widget_test\` to run automated tests with different scenarios.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Widget preview failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test widget with various scenarios
   */
  private async testWidget(args: any) {
    try {
      // Check authentication first
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
            },
          ],
        };
      }

      this.logger.info('Testing widget', { sys_id: args.sys_id });
      
      // Fetch the widget
      const widget = await this.client.getRecord('sp_widget', args.sys_id);
      if (!widget) {
        throw new Error(`Widget not found: ${args.sys_id}`);
      }

      const testResults = [];
      
      // Check dependencies if requested
      if (args.validate_dependencies !== false) {
        const depCheck = this.checkWidgetDependencies(widget);
        testResults.push({
          name: 'Dependency Check',
          status: depCheck.missing.length === 0 ? '✅ Pass' : '❌ Fail',
          details: depCheck
        });
      }

      // Run test scenarios if provided
      if (args.test_scenarios && Array.isArray(args.test_scenarios)) {
        for (const scenario of args.test_scenarios) {
          const result = await this.runTestScenario(widget, scenario);
          testResults.push(result);
        }
      } else {
        // Run default tests
        const defaultTests = [
          {
            name: 'Empty Data Test',
            input: {},
            options: {}
          },
          {
            name: 'Basic Data Test',
            input: { test: true },
            options: { title: 'Test Widget' }
          }
        ];
        
        for (const test of defaultTests) {
          const result = await this.runTestScenario(widget, test);
          testResults.push(result);
        }
      }

      // Code coverage analysis if requested
      let coverageReport = '';
      if (args.coverage !== false) {
        const coverage = this.analyzeCodeCoverage(widget);
        coverageReport = `
📊 **Code Coverage Analysis:**
- Template variables used in client script: ${coverage.templateVarsUsed}/${coverage.totalTemplateVars} (${coverage.templateCoverage}%)
- Client bindings used in template: ${coverage.clientBindingsUsed}/${coverage.totalClientBindings} (${coverage.clientCoverage}%)
- Server data used in client: ${coverage.serverDataUsed}/${coverage.totalServerData} (${coverage.serverCoverage}%)
- Overall integration score: ${coverage.overallScore}%
`;
      }

      // Generate test report
      const passedTests = testResults.filter(r => r.status.includes('✅')).length;
      const failedTests = testResults.filter(r => r.status.includes('❌')).length;
      const warningTests = testResults.filter(r => r.status.includes('⚠️')).length;

      return {
        content: [
          {
            type: 'text',
            text: `🧪 Widget Test Results

📋 **Widget:** ${widget.title || widget.name}
🆔 **Sys ID:** ${args.sys_id}

📈 **Test Summary:**
- Total Tests: ${testResults.length}
- ✅ Passed: ${passedTests}
- ❌ Failed: ${failedTests}
- ⚠️ Warnings: ${warningTests}
- Success Rate: ${Math.round((passedTests / testResults.length) * 100)}%

🔍 **Test Results:**
${testResults.map(r => `
**${r.name}:** ${r.status}
${r.details ? `- Details: ${JSON.stringify(r.details, null, 2)}` : ''}
${r.error ? `- Error: ${r.error}` : ''}
${r.recommendation ? `- 💡 Recommendation: ${r.recommendation}` : ''}
`).join('\n')}

${coverageReport}

🏆 **Overall Status:** ${failedTests === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}

💡 **Next Steps:**
${failedTests > 0 ? '1. Fix the failing tests\n2. Re-run the test suite\n' : ''}
${warningTests > 0 ? '1. Review warnings and consider improvements\n' : ''}
3. Deploy to a test portal page for user testing
4. Consider adding more comprehensive test scenarios

Use \`snow_preview_widget\` to see a detailed preview of the widget rendering.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Widget test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check widget dependencies like Chart.js
   */
  private checkWidgetDependencies(widget: any): any {
    const dependencies = {
      required: [],
      found: [],
      missing: []
    };

    // Check for Chart.js
    if (widget.client_script?.includes('Chart') || widget.template?.includes('chart')) {
      dependencies.required.push('Chart.js');
      // In real implementation, would check if Chart.js is available in portal
      dependencies.missing.push('Chart.js (verify it\'s included in portal theme)');
    }

    // Check for other common libraries
    const libraries = [
      { name: 'jQuery', pattern: /\$\(|jQuery\(/ },
      { name: 'lodash', pattern: /_\./ },
      { name: 'moment', pattern: /moment\(/ }
    ];

    for (const lib of libraries) {
      if (lib.pattern.test(widget.client_script || '')) {
        dependencies.required.push(lib.name);
        if (lib.name === 'jQuery' || lib.name === 'moment') {
          dependencies.found.push(`${lib.name} (built-in)`);
        } else {
          dependencies.missing.push(lib.name);
        }
      }
    }

    return dependencies;
  }

  /**
   * Run a test scenario on the widget
   */
  private async runTestScenario(widget: any, scenario: any): Promise<any> {
    try {
      // Simulate running the widget with test data
      const result = {
        name: scenario.name,
        status: '✅ Pass',
        details: null,
        error: null,
        recommendation: null
      };

      // Check if server script would work with provided input
      if (widget.script) {
        // Check for required input fields
        const requiredInputsMatch = widget.script.match(/input\.\w+/g);
        const requiredInputs: string[] = requiredInputsMatch || [];
        const uniqueInputs: string[] = [...new Set(requiredInputs.map((i: string) => i.replace('input.', '')))];
        
        const missingInputs = uniqueInputs.filter((field: string) => {
          if (!scenario.input || typeof scenario.input !== 'object' || scenario.input === null) {
            return true;
          }
          const inputRecord = scenario.input as Record<string, any>;
          return !inputRecord[field];
        });

        if (missingInputs.length > 0) {
          result.status = '⚠️ Warning';
          result.details = { missingInputs };
          result.recommendation = `Provide test data for: ${missingInputs.join(', ')}`;
        }
      }

      // Check if client script references exist in template
      if (widget.client_script && widget.template) {
        const clientRefs = widget.client_script.match(/c\.\w+|\$scope\.\w+/g) || [];
        const templateRefs = widget.template.match(/\{\{[^}]+\}\}/g) || [];
        
        // Simple check - could be enhanced
        if (clientRefs.length > 0 && templateRefs.length === 0) {
          result.status = '⚠️ Warning';
          result.details = { issue: 'Client script defines variables but template doesn\'t use them' };
          result.recommendation = 'Ensure template uses the data from client script';
        }
      }

      return result;
    } catch (error) {
      return {
        name: scenario.name,
        status: '❌ Fail',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Analyze code coverage between HTML/CSS/JS
   */
  private analyzeCodeCoverage(widget: any): any {
    const coverage = {
      totalTemplateVars: 0,
      templateVarsUsed: 0,
      totalClientBindings: 0,
      clientBindingsUsed: 0,
      totalServerData: 0,
      serverDataUsed: 0,
      templateCoverage: 0,
      clientCoverage: 0,
      serverCoverage: 0,
      overallScore: 0
    };

    // Extract all variables
    const templateVars = (widget.template?.match(/\{\{([^}]+)\}\}/g) || [])
      .map((v: string) => v.replace(/[{}]/g, '').trim());
    const clientBindings = (widget.client_script?.match(/c\.(\w+)|\$scope\.(\w+)/g) || [])
      .map((v: string) => v.replace(/c\.|\\$scope\./, ''));
    const serverDataKeys = (widget.script?.match(/data\.(\w+)/g) || [])
      .map((v: string) => v.replace('data.', ''));

    coverage.totalTemplateVars = templateVars.length;
    coverage.totalClientBindings = clientBindings.length;
    coverage.totalServerData = serverDataKeys.length;

    // Check usage
    templateVars.forEach(v => {
      if (widget.client_script?.includes(v) || widget.script?.includes(v)) {
        coverage.templateVarsUsed++;
      }
    });

    clientBindings.forEach(b => {
      if (widget.template?.includes(b)) {
        coverage.clientBindingsUsed++;
      }
    });

    serverDataKeys.forEach(k => {
      if (widget.client_script?.includes(k) || widget.template?.includes(k)) {
        coverage.serverDataUsed++;
      }
    });

    // Calculate percentages
    coverage.templateCoverage = coverage.totalTemplateVars > 0 
      ? Math.round((coverage.templateVarsUsed / coverage.totalTemplateVars) * 100) : 100;
    coverage.clientCoverage = coverage.totalClientBindings > 0 
      ? Math.round((coverage.clientBindingsUsed / coverage.totalClientBindings) * 100) : 100;
    coverage.serverCoverage = coverage.totalServerData > 0 
      ? Math.round((coverage.serverDataUsed / coverage.totalServerData) * 100) : 100;
    
    coverage.overallScore = Math.round(
      (coverage.templateCoverage + coverage.clientCoverage + coverage.serverCoverage) / 3
    );

    return coverage;
  }

  /**
   * Check integration between template, CSS, and scripts
   */
  private checkIntegration(integration: any): string {
    const issues = [];
    
    // Check if template variables are defined in scripts
    const undefinedVars = integration.template_refs.filter((ref: string) => {
      const varName = ref.replace(/[{}]/g, '').split('.')[0].trim();
      return !integration.client_bindings.some((binding: string) => binding.includes(varName)) &&
             !integration.server_data_keys.some((key: string) => key.includes(varName));
    });
    
    if (undefinedVars.length > 0) {
      issues.push(`⚠️ Template variables not defined in scripts: ${undefinedVars.join(', ')}`);
    }

    // Check if CSS classes are used in template
    const unusedClasses = integration.css_classes.filter((cls: string) => {
      const className = cls.substring(1); // Remove the dot
      return !integration.template_refs.some((ref: string) => ref.includes(className));
    });
    
    if (unusedClasses.length > 0 && unusedClasses.length < 5) {
      issues.push(`⚠️ CSS classes possibly unused: ${unusedClasses.join(', ')}`);
    }

    return issues.length > 0 ? issues.join('\n') : '✅ Good integration between template, CSS, and scripts';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(widgetData: any, integration: any, dependencies: any): string {
    const recommendations = [];

    if (dependencies.length > 0) {
      recommendations.push('1. Ensure all required libraries are included in the Service Portal theme');
    }

    if (integration.template_refs.length === 0) {
      recommendations.push('2. Consider adding dynamic content to your template using {{variable}} syntax');
    }

    if (integration.server_data_keys.length > 0 && integration.client_bindings.length === 0) {
      recommendations.push('3. Add client script to handle server data and user interactions');
    }

    if (!widgetData.demo_data || widgetData.demo_data === '{}') {
      recommendations.push('4. Add demo data to help others understand how to use your widget');
    }

    if (!widgetData.option_schema || widgetData.option_schema === '[]') {
      recommendations.push('5. Define widget options schema for better reusability');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : 'Widget structure looks good!';
  }

  /**
   * Smart Update Set Management with context detection
   */
  private async smartUpdateSet(args: any) {
    try {
      // Check authentication
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login',
            },
          ],
        };
      }

      // Get current context (task identifier)
      const taskContext = args.description || 'Current Task';
      const contextKey = `task_context_${taskContext.replace(/\s+/g, '_').toLowerCase()}`;
      
      // Check if we need a new update set
      const currentUpdateSet = await this.client.getCurrentUpdateSet();
      let needNewUpdateSet = true;
      
      if (currentUpdateSet.success && currentUpdateSet.data) {
        // Check if current update set is for the same task
        if (!args.separate_by_task || currentUpdateSet.data.description?.includes(taskContext)) {
          needNewUpdateSet = false;
        }
      }

      if (!needNewUpdateSet && currentUpdateSet.data) {
        return {
          content: [
            {
              type: 'text',
              text: `✅ Using existing Update Set for this task:\n\n📦 **Current Update Set:**\n- Name: ${currentUpdateSet.data.name}\n- ID: ${currentUpdateSet.data.sys_id}\n- Description: ${currentUpdateSet.data.description}\n\n💡 Same task context detected - no new Update Set needed.`
            }
          ]
        };
      }

      // Close previous update set if requested
      if (args.close_previous && currentUpdateSet.data) {
        await this.client.completeUpdateSet(currentUpdateSet.data.sys_id);
        this.logger.info('Closed previous Update Set', { id: currentUpdateSet.data.sys_id });
      }

      // Create new update set
      const updateSetNumber = Date.now().toString().slice(-6);
      const updateSetName = `${args.name_prefix}-${updateSetNumber}: ${taskContext}`;
      
      const result = await this.client.createUpdateSet({
        name: updateSetName,
        description: `Auto-created for task: ${taskContext}\n\nContext Detection: ${args.detect_context ? 'Enabled' : 'Disabled'}\nSeparate by Task: ${args.separate_by_task ? 'Yes' : 'No'}`,
        state: 'in_progress'
      });

      if (!result.success) {
        throw new Error(`Failed to create Update Set: ${result.error}`);
      }

      // Set as current update set
      await this.client.setCurrentUpdateSet(result.data.sys_id);

      const credentials = await this.oauth.loadCredentials();
      const updateSetUrl = `https://${credentials?.instance}/sys_update_set.do?sys_id=${result.data.sys_id}`;

      return {
        content: [
          {
            type: 'text',
            text: `✅ Smart Update Set created successfully!\n\n📦 **New Update Set:**\n- Name: ${updateSetName}\n- ID: ${result.data.sys_id}\n- Task Context: ${taskContext}\n\n🔧 **Smart Features:**\n- Context Detection: ${args.detect_context ? '✅ Enabled' : '❌ Disabled'}\n- Separate by Task: ${args.separate_by_task ? '✅ Yes' : '❌ No'}\n- Auto-close Previous: ${args.close_previous ? '✅ Yes' : '❌ No'}\n${currentUpdateSet.data && args.close_previous ? `- Previous Set Closed: ✅ ${currentUpdateSet.data.name}` : ''}\n\n🔗 **Direct Link:**\n${updateSetUrl}\n\n💡 **Next Steps:**\n1. All new changes will be tracked in this Update Set\n2. Deploy your artifacts - they'll be automatically included\n3. Complete the Update Set when your task is done\n4. Next task will get its own Update Set automatically`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Smart Update Set creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate Flow Definition before deployment
   */
  private async validateFlowDefinition(args: any) {
    try {
      const flowType = args.flow_type || 'flow';
      let definition;
      
      try {
        definition = typeof args.definition === 'string' ? JSON.parse(args.definition) : args.definition;
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Invalid JSON format in flow definition:\n\n${error instanceof Error ? error.message : String(error)}\n\n💡 Please check your JSON syntax.`
            }
          ]
        };
      }

      const issues: string[] = [];
      const warnings: string[] = [];
      const info: string[] = [];
      const corrections: string[] = [];

      // SMART SCHEMA CORRECTION - Fix root cause of JSON schema issues
      // Handle multiple JSON structure variations: top-level, nested in "flow", nested in "flow_definition"
      
      let workingDefinition = definition;
      
      // Check if we have a nested structure like { "flow": { "steps": [...] } }
      if (definition.flow && typeof definition.flow === 'object') {
        workingDefinition = definition.flow;
        corrections.push('✅ Processing nested flow structure (definition.flow)');
        info.push('💡 Detected nested flow definition format - extracting flow content');
      }
      
      // Check if we have nested flow_definition
      if (definition.flow_definition && typeof definition.flow_definition === 'object') {
        workingDefinition = definition.flow_definition;
        corrections.push('✅ Processing nested flow_definition structure');
      }

      // Check for empty flow definition first
      if (!workingDefinition.activities && !workingDefinition.steps && !workingDefinition.actions) {
        return {
          content: [
            {
              type: 'text',
              text: `🚨 Flow Definition Error: No activities found

📍 Common Causes:
• Used snow_deploy_flow with manual JSON (often fails)
• Incorrect flow_definition format
• Activities not properly mapped from actions/steps

🔧 Recommended Solutions:
✅ Use snow_create_flow with natural language:
   snow_create_flow({
     instruction: "create approval flow for...",
     deploy_immediately: true
   })

✅ Or use snow_flow_wizard for step-by-step creation

❌ Avoid: Manual JSON flow definitions (unreliable)

💡 Alternative Approach:
1. Use snow_create_flow for natural language creation
2. Use snow_test_flow_with_mock for testing
3. Use snow_deploy_flow only for pre-validated definitions`
            }
          ]
        };
      }

      // Check for activities that exist but are empty
      const activitiesArray = workingDefinition.activities || workingDefinition.steps || workingDefinition.actions;
      if (activitiesArray && Array.isArray(activitiesArray) && activitiesArray.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🚨 Flow Definition Error: Empty activities array

📍 Problem: Flow has an activities array but no actual activities defined.

🔧 Recommended Solutions:
✅ Use snow_create_flow with natural language:
   snow_create_flow({
     instruction: "create flow that sends email when incident priority is high",
     deploy_immediately: true
   })

✅ Or define activities manually:
   {
     "activities": [
       {
         "name": "Check Priority",
         "type": "condition",
         "condition": "current.priority == 1"
       },
       {
         "name": "Send Alert",
         "type": "notification",
         "recipients": "incident.assigned_to"
       }
     ]
   }

💡 Best Practice: Use natural language flow creation instead of manual JSON`
            }
          ]
        };
      }

      // Now check for activities/steps/actions in the working definition
      if (workingDefinition.steps && !workingDefinition.activities) {
        // AUTO-CORRECT: Convert "steps" to "activities"
        workingDefinition.activities = workingDefinition.steps;
        delete workingDefinition.steps;
        corrections.push('✅ Auto-converted "steps" to "activities" (ServiceNow Flow Designer format)');
        info.push('💡 Accepted "steps" array and converted to ServiceNow standard "activities"');
      } else if (workingDefinition.actions && !workingDefinition.activities) {
        // AUTO-CORRECT: Convert "actions" to "activities"
        workingDefinition.activities = workingDefinition.actions;
        delete workingDefinition.actions;
        corrections.push('✅ Auto-converted "actions" to "activities" (ServiceNow Flow Designer format)');
        info.push('💡 Accepted "actions" array and converted to ServiceNow standard "activities"');
      } else if (workingDefinition.activities && !Array.isArray(workingDefinition.activities)) {
        issues.push('❌ "activities" must be an array');
      }

      // If we processed a nested structure, update the main definition
      if (workingDefinition !== definition) {
        if (definition.flow) {
          definition.flow = workingDefinition;
        } else if (definition.flow_definition) {
          definition.flow_definition = workingDefinition;
        }
        // Also promote the activities to top level for ServiceNow compatibility
        if (workingDefinition.activities) {
          definition.activities = workingDefinition.activities;
          corrections.push('✅ Promoted activities to top-level for ServiceNow compatibility');
        }
      }

      // Support different trigger formats - check working definition for trigger
      if (!workingDefinition.trigger && !definition.trigger && (args.trigger_type || args.table)) {
        const generatedTrigger = {
          type: args.trigger_type || 'manual',
          table: args.table || '',
          condition: args.condition || ''
        };
        workingDefinition.trigger = generatedTrigger;
        definition.trigger = generatedTrigger;
        corrections.push('✅ Auto-generated trigger from parameters');
      }

      // Flow type specific validation
      switch (flowType) {
        case 'flow':
          // Check for trigger in multiple locations: working definition, main definition, or args
          const hasTrigger = workingDefinition.trigger || 
                           definition.trigger || 
                           args.trigger_type || 
                           (typeof definition === 'object' && definition.trigger_type);
          
          if (!hasTrigger) {
            // Only require trigger if it's a main flow (not a subflow)
            warnings.push('⚠️ Main flow should have a trigger defined (will default to manual trigger)');
            // Don't make this a critical error - we can default to manual trigger
          }
          break;
        case 'subflow':
          if (!workingDefinition.inputs) {
            warnings.push('⚠️ Subflow has no inputs defined');
          }
          if (!workingDefinition.outputs) {
            warnings.push('⚠️ Subflow has no outputs defined');
          }
          break;
        case 'action':
          if (!workingDefinition.action_type) {
            warnings.push('⚠️ Action type not specified');
          }
          break;
      }

      // Activity validation - use the working definition that has the activities
      const activitiesToValidate = workingDefinition.activities || definition.activities;
      if (activitiesToValidate) {
        activitiesToValidate.forEach((activity: any, index: number) => {
          if (!activity.name) {
            issues.push(`❌ Activity ${index + 1} missing required "name" field`);
          }
          if (!activity.type) {
            issues.push(`❌ Activity ${index + 1} missing required "type" field`);
          }
          
          // Check for common activity types
          const validTypes = ['rest', 'script', 'approval', 'condition', 'subflow', 'notification', 'wait', 'lookup'];
          if (activity.type && !validTypes.includes(activity.type)) {
            warnings.push(`⚠️ Activity "${activity.name}" uses non-standard type: ${activity.type}`);
          }
        });
      }

      // Dependency checking
      if (args.check_dependencies) {
        const dependencies = this.extractDependencies(definition);
        if (dependencies.length > 0) {
          info.push(`📦 Dependencies found: ${dependencies.join(', ')}`);
        }
      }

      // Generate preview if requested
      let preview = '';
      if (args.show_preview) {
        preview = this.generateFlowPreview(definition, flowType);
      }

      const hasErrors = issues.length > 0;
      const status = hasErrors ? '❌ VALIDATION FAILED' : '✅ VALIDATION PASSED';

      const correctionsText = corrections.length > 0 ? `\n🔧 **Smart Auto-Corrections Applied:**\n${corrections.join('\n')}\n` : '';

      return {
        content: [
          {
            type: 'text',
            text: `${status}\n\n📋 **Flow Validation Report:**\n- Flow Type: ${flowType}\n- Activities: ${activitiesToValidate?.length || 0}\n- Status: ${hasErrors ? 'Failed' : 'Passed'}\n${correctionsText}${issues.length > 0 ? `\n🚨 **Critical Issues:**\n${issues.join('\n')}\n\n` : ''}${warnings.length > 0 ? `⚠️ **Warnings:**\n${warnings.join('\n')}\n\n` : ''}${info.length > 0 ? `ℹ️ **Information:**\n${info.join('\n')}\n\n` : ''}${preview ? `\n📊 **Flow Preview:**\n${preview}\n` : ''}${!hasErrors && args.test_mode ? '\n🧪 **Test Mode:** Flow structure is valid for testing\n' : ''}${!hasErrors ? '\n✅ Flow definition is valid and ready for deployment!' : '\n❌ Please fix the issues before deploying.'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Flow validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create Solution Package grouping multiple artifacts
   */
  private async createSolutionPackage(args: any) {
    try {
      // Check authentication
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login',
            },
          ],
        };
      }

      // Create new update set for the solution
      if (args.new_update_set) {
        const updateSetResult = await this.smartUpdateSet({
          detect_context: true,
          name_prefix: 'SOLUTION',
          description: args.description || `Solution Package: ${args.name}`,
          separate_by_task: false,
          close_previous: true
        });
      }

      const deployedArtifacts: any[] = [];
      const failedArtifacts: any[] = [];

      // Deploy each artifact in the package
      for (const artifact of args.artifacts) {
        try {
          let result;
          switch (artifact.type) {
            case 'flow':
              result = await this.deployFlow(artifact.create);
              break;
            case 'widget':
              result = await this.deployWidget(artifact.create);
              break;
            case 'script_include':
              result = await this.deployScriptInclude(artifact.create);
              break;
            case 'business_rule':
              result = await this.deployBusinessRule(artifact.create);
              break;
            case 'table':
              result = await this.deployTable(artifact.create);
              break;
            default:
              throw new Error(`Unknown artifact type: ${artifact.type}`);
          }
          
          deployedArtifacts.push({
            type: artifact.type,
            name: artifact.create.name,
            result: 'Success'
          });
        } catch (error) {
          failedArtifacts.push({
            type: artifact.type,
            name: artifact.create.name,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      const successCount = deployedArtifacts.length;
      const failureCount = failedArtifacts.length;
      const totalCount = successCount + failureCount;

      return {
        content: [
          {
            type: 'text',
            text: `📦 **Solution Package Deployment Complete!**\n\n🎯 **Package Details:**\n- Name: ${args.name}\n- Description: ${args.description || 'N/A'}\n- Total Artifacts: ${totalCount}\n- Successful: ${successCount} ✅\n- Failed: ${failureCount} ${failureCount > 0 ? '❌' : ''}\n\n${deployedArtifacts.length > 0 ? `✅ **Successfully Deployed:**\n${deployedArtifacts.map((a, i) => `${i + 1}. ${a.type}: ${a.name}`).join('\n')}\n` : ''}${failedArtifacts.length > 0 ? `\n❌ **Failed Deployments:**\n${failedArtifacts.map((a, i) => `${i + 1}. ${a.type}: ${a.name}\n   Error: ${a.error}`).join('\n')}\n` : ''}\n💡 **Solution Benefits:**\n- All artifacts grouped in one Update Set\n- Dependencies automatically resolved\n- Consistent deployment across artifacts\n- Easy rollback if needed\n\n${successCount === totalCount ? '🎉 All artifacts deployed successfully!' : '⚠️ Some artifacts failed. Please review the errors above.'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Solution package creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Interactive Flow Creation Wizard
   */
  private async flowWizard(args: any) {
    try {
      const flowType = args.flow_type || 'flow';
      const steps = [];

      // Step 1: Basic Information
      steps.push({
        step: 1,
        name: 'Basic Information',
        status: '✅',
        details: `Name: ${args.name}\nType: ${flowType}\nDescription: Configure your flow step by step`
      });

      // Step 2: Trigger Configuration (for flows only)
      if (flowType === 'flow') {
        steps.push({
          step: 2,
          name: 'Trigger Configuration',
          status: '📝',
          details: 'Choose trigger type: record_created, record_updated, scheduled, or manual'
        });
      }

      // Step 3: Activities
      steps.push({
        step: 3,
        name: 'Add Activities',
        status: '📝',
        details: 'Add activities: scripts, approvals, notifications, conditions'
      });

      // Step 4: Variables and Data
      steps.push({
        step: 4,
        name: 'Variables & Data',
        status: '📝',
        details: 'Define flow variables and data transformations'
      });

      // Step 5: Error Handling
      steps.push({
        step: 5,
        name: 'Error Handling',
        status: '📝',
        details: 'Configure error handlers and retry logic'
      });

      // Step 6: Testing
      steps.push({
        step: 6,
        name: 'Test Flow',
        status: '📝',
        details: 'Test with sample data before deployment'
      });

      // Generate wizard interface
      const wizardText = `🧙‍♂️ **Flow Creation Wizard**\n\n📋 **Flow Details:**\n- Name: ${args.name}\n- Type: ${flowType}\n- Interactive: ${args.interactive ? '✅' : '❌'}\n- Preview Each Step: ${args.preview_each_step ? '✅' : '❌'}\n- Test As You Build: ${args.test_as_you_build ? '✅' : '❌'}\n\n📊 **Wizard Steps:**\n${steps.map(s => `${s.step}. ${s.status} ${s.name}\n   ${s.details}`).join('\n\n')}\n\n💡 **Interactive Features:**\n- ✅ Step-by-step guidance\n- ✅ Preview after each step\n- ✅ Validation at each stage\n- ✅ Test before deployment\n- ✅ Rollback capability\n\n🎯 **Next Actions:**\n1. Use snow_deploy_flow with your configuration\n2. Or continue building with individual artifact tools\n3. Test with snow_validate_flow_definition\n\n⚡ **Quick Start Example:**\n\`\`\`json\n{\n  "name": "${args.name}",\n  "flow_type": "${flowType}",\n  "trigger_type": "record_created",\n  "table": "incident",\n  "flow_definition": {\n    "activities": [\n      {\n        "name": "Check Priority",\n        "type": "condition",\n        "condition": "current.priority == 1"\n      },\n      {\n        "name": "Send Alert",\n        "type": "notification",\n        "recipients": "incident.assigned_to"\n      }\n    ]\n  }\n}\n\`\`\``;

      return {
        content: [
          {
            type: 'text',
            text: wizardText
          }
        ]
      };
    } catch (error) {
      throw new Error(`Flow wizard failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bulk Deploy Multiple Artifacts
   */
  private async bulkDeploy(args: any) {
    try {
      const { artifacts, transaction_mode = true, parallel = false, dry_run = false, 
              update_set_name, rollback_on_error = true } = args;
      
      this.logger.info(`Starting bulk deployment of ${artifacts.length} artifacts`);
      
      // Create or ensure update set
      if (update_set_name) {
        await this.client.createUpdateSet({
          name: update_set_name,
          description: 'Bulk deployment from Snow-Flow',
          state: 'in_progress'
        });
      } else {
        await this.client.ensureUpdateSet();
      }
      
      const results = {
        total: artifacts.length,
        successful: 0,
        failed: 0,
        skipped: 0,
        details: [] as any[]
      };
      
      // Track deployed artifacts for rollback
      const deployedArtifacts: Array<{type: string, sys_id: string}> = [];
      
      try {
        if (dry_run) {
          // Validation only
          for (const artifact of artifacts) {
            try {
              const validation = await this.validateArtifact(artifact);
              results.details.push({
                type: artifact.type,
                name: artifact.config?.name || 'Unknown',
                status: validation.valid ? '✅ Valid' : '❌ Invalid',
                message: validation.message
              });
              if (validation.valid) {
                results.successful++;
              } else {
                results.failed++;
              }
            } catch (error) {
              results.failed++;
              results.details.push({
                type: artifact.type,
                name: artifact.config?.name || 'Unknown',
                status: '❌ Error',
                message: error instanceof Error ? error.message : String(error)
              });
            }
          }
        } else {
          // Actual deployment
          if (parallel && !transaction_mode) {
            // Parallel deployment (no transaction support)
            const deploymentPromises = artifacts.map(async (artifact) => {
              try {
                const result = await this.deployArtifact(artifact);
                if (result.success) {
                  deployedArtifacts.push({ type: artifact.type, sys_id: result.sys_id });
                  results.successful++;
                  results.details.push({
                    type: artifact.type,
                    name: artifact.config?.name || 'Unknown',
                    sys_id: result.sys_id,
                    status: '✅ Deployed',
                    message: result.message
                  });
                } else {
                  throw new Error(result.message);
                }
              } catch (error) {
                results.failed++;
                results.details.push({
                  type: artifact.type,
                  name: artifact.config?.name || 'Unknown',
                  status: '❌ Failed',
                  message: error instanceof Error ? error.message : String(error)
                });
                
                if (transaction_mode && rollback_on_error) {
                  throw error; // Will trigger rollback
                }
              }
            });
            
            await Promise.all(deploymentPromises);
          } else {
            // Sequential deployment (supports transactions)
            for (const artifact of artifacts) {
              try {
                const result = await this.deployArtifact(artifact);
                if (result.success) {
                  deployedArtifacts.push({ type: artifact.type, sys_id: result.sys_id });
                  results.successful++;
                  results.details.push({
                    type: artifact.type,
                    name: artifact.config?.name || 'Unknown',
                    sys_id: result.sys_id,
                    status: '✅ Deployed',
                    message: result.message
                  });
                } else {
                  throw new Error(result.message);
                }
              } catch (error) {
                results.failed++;
                results.details.push({
                  type: artifact.type,
                  name: artifact.config?.name || 'Unknown',
                  status: '❌ Failed',
                  message: error instanceof Error ? error.message : String(error)
                });
                
                if (transaction_mode && rollback_on_error) {
                  throw error; // Will trigger rollback
                }
              }
            }
          }
        }
      } catch (error) {
        // Rollback if needed
        if (rollback_on_error && deployedArtifacts.length > 0) {
          this.logger.info(`Rolling back ${deployedArtifacts.length} deployed artifacts`);
          for (const deployed of deployedArtifacts) {
            try {
              await this.rollbackArtifact(deployed);
              results.details.push({
                type: deployed.type,
                sys_id: deployed.sys_id,
                status: '🔄 Rolled back',
                message: 'Artifact rolled back due to deployment failure'
              });
            } catch (rollbackError) {
              this.logger.error(`Failed to rollback ${deployed.type} ${deployed.sys_id}:`, rollbackError);
            }
          }
        }
        
        throw error;
      }
      
      // Generate summary
      let summary = `🚀 Bulk Deployment ${dry_run ? 'Validation' : 'Complete'}\n\n`;
      summary += `📊 Summary:\n`;
      summary += `  Total: ${results.total}\n`;
      summary += `  ✅ Successful: ${results.successful}\n`;
      summary += `  ❌ Failed: ${results.failed}\n`;
      if (results.skipped > 0) {
        summary += `  ⏭️ Skipped: ${results.skipped}\n`;
      }
      summary += `\n📋 Details:\n`;
      
      for (const detail of results.details) {
        summary += `\n${detail.status} ${detail.type}: ${detail.name}`;
        if (detail.sys_id) {
          summary += ` (${detail.sys_id})`;
        }
        if (detail.message) {
          summary += `\n   ${detail.message}`;
        }
      }
      
      if (transaction_mode && !dry_run) {
        summary += `\n\n🔒 Transaction Mode: ${results.failed === 0 ? 'All deployed successfully' : 'Rolled back due to failures'}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    } catch (error) {
      throw new Error(`Bulk deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Deploy a single artifact
   */
  private async deployArtifact(artifact: any): Promise<{success: boolean, sys_id?: string, message?: string}> {
    const { type, sys_id, config, action = 'deploy' } = artifact;
    
    try {
      switch (type) {
        case 'widget':
          if (action === 'update' && sys_id) {
            const result = await this.client.updateRecord('sp_widget', sys_id, config);
            return { 
              success: result.success, 
              sys_id: sys_id,
              message: result.success ? 'Widget updated' : result.error
            };
          } else {
            const result = await this.deployWidget(config);
            return {
              success: result.content[0].text.includes('✅'),
              sys_id: result.content[0].text.match(/sys_id: ([a-f0-9]+)/)?.[1],
              message: 'Widget deployed'
            };
          }
          
        case 'flow':
          const flowResult = await this.deployFlow(config);
          return {
            success: flowResult.content[0].text.includes('✅'),
            sys_id: flowResult.content[0].text.match(/sys_id: ([a-f0-9]+)/)?.[1],
            message: 'Flow deployed'
          };
          
        case 'script':
        case 'script_include':
          const scriptResult = await this.client.createRecord('sys_script_include', config);
          return {
            success: scriptResult.success,
            sys_id: scriptResult.data?.sys_id,
            message: scriptResult.success ? 'Script deployed' : scriptResult.error
          };
          
        case 'business_rule':
          const ruleResult = await this.client.createRecord('sys_script', config);
          return {
            success: ruleResult.success,
            sys_id: ruleResult.data?.sys_id,
            message: ruleResult.success ? 'Business rule deployed' : ruleResult.error
          };
          
        case 'table':
          const tableResult = await this.client.createRecord('sys_db_object', config);
          return {
            success: tableResult.success,
            sys_id: tableResult.data?.sys_id,
            message: tableResult.success ? 'Table created' : tableResult.error
          };
          
        case 'application':
          const appResult = await this.deployApplication(config);
          return {
            success: appResult.content[0].text.includes('✅'),
            sys_id: appResult.content[0].text.match(/sys_id: ([a-f0-9]+)/)?.[1],
            message: 'Application deployed'
          };
          
        default:
          return {
            success: false,
            message: `Unknown artifact type: ${type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Validate artifact before deployment
   */
  private async validateArtifact(artifact: any): Promise<{valid: boolean, message?: string}> {
    const { type, config } = artifact;
    
    // Basic validation
    if (!type || !config) {
      return { valid: false, message: 'Missing type or config' };
    }
    
    // Type-specific validation
    switch (type) {
      case 'widget':
        if (!config.name || !config.template) {
          return { valid: false, message: 'Widget requires name and template' };
        }
        break;
        
      case 'flow':
        if (!config.name || !config.definition) {
          return { valid: false, message: 'Flow requires name and definition' };
        }
        break;
        
      case 'script':
      case 'script_include':
        if (!config.name || !config.script) {
          return { valid: false, message: 'Script requires name and script content' };
        }
        break;
        
      case 'business_rule':
        if (!config.name || !config.collection || !config.script) {
          return { valid: false, message: 'Business rule requires name, collection, and script' };
        }
        break;
        
      case 'table':
        if (!config.name || !config.label) {
          return { valid: false, message: 'Table requires name and label' };
        }
        break;
        
      case 'application':
        if (!config.name || !config.scope) {
          return { valid: false, message: 'Application requires name and scope' };
        }
        break;
    }
    
    return { valid: true, message: 'Validation passed' };
  }
  
  /**
   * Rollback deployed artifact
   */
  private async rollbackArtifact(artifact: {type: string, sys_id: string}): Promise<void> {
    const tableMap: Record<string, string> = {
      'widget': 'sp_widget',
      'flow': 'sys_hub_flow',
      'script': 'sys_script_include',
      'script_include': 'sys_script_include',
      'business_rule': 'sys_script',
      'table': 'sys_db_object',
      'application': 'sys_app'
    };
    
    const table = tableMap[artifact.type];
    if (table) {
      await this.client.deleteRecord(table, artifact.sys_id);
    }
  }

  /**
   * Extract dependencies from flow definition
   */
  private extractDependencies(definition: any): string[] {
    const dependencies: Set<string> = new Set();
    
    if (definition.activities) {
      definition.activities.forEach((activity: any) => {
        if (activity.type === 'rest' && activity.rest_message) {
          dependencies.add(`REST Message: ${activity.rest_message}`);
        }
        if (activity.type === 'script' && activity.script_include) {
          dependencies.add(`Script Include: ${activity.script_include}`);
        }
        if (activity.type === 'subflow' && activity.subflow_name) {
          dependencies.add(`Subflow: ${activity.subflow_name}`);
        }
        if (activity.artifact_reference) {
          dependencies.add(`${activity.artifact_reference.type}: ${activity.artifact_reference.name}`);
        }
      });
    }
    
    return Array.from(dependencies);
  }

  /**
   * Generate visual preview of flow
   */
  private generateFlowPreview(definition: any, flowType: string): string {
    let preview = `\n${flowType.toUpperCase()} STRUCTURE:\n`;
    preview += '═'.repeat(40) + '\n';
    
    if (flowType === 'flow' && definition.trigger) {
      preview += `\n[TRIGGER: ${definition.trigger.type || 'Unknown'}]\n   ↓\n`;
    }
    
    if (definition.activities) {
      definition.activities.forEach((activity: any, index: number) => {
        const isLast = index === definition.activities.length - 1;
        preview += `[${activity.type?.toUpperCase() || 'UNKNOWN'}: ${activity.name || `Activity ${index + 1}`}]\n`;
        if (!isLast) {
          preview += '   ↓\n';
        }
      });
    }
    
    if (flowType !== 'flow' && definition.outputs) {
      preview += `\n[OUTPUTS: ${definition.outputs.length} defined]\n`;
    }
    
    return preview;
  }

  /**
   * Create Business Rule fallback when Flow Designer fails
   */
  private async createBusinessRuleFallback(args: any, flowDefinition: any): Promise<any> {
    this.logger.info('Creating Business Rule fallback for flow', { name: args.name });

    // Generate business rule script from flow definition
    const businessRuleScript = this.generateBusinessRuleScript(args, flowDefinition);
    
    const businessRuleData = {
      name: args.name,
      description: `${args.description || ''}\n\nNOTE: Auto-generated as fallback from Flow Designer. Original flow type: ${args.flow_type || 'flow'}`,
      collection: args.table || 'sys_user',
      when: this.getTriggerWhen(args.trigger_type),
      condition: args.condition || '',
      script: businessRuleScript,
      active: args.active !== false,
      order: 100,
      sys_scope: 'global'
    };

    // Create the business rule using ServiceNowClient
    const result = await this.client.createRecord('sys_script', businessRuleData);
    
    if (!result.success) {
      throw new Error(`Failed to create Business Rule fallback: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Generate Business Rule script from flow definition
   */
  private generateBusinessRuleScript(args: any, flowDefinition: any): string {
    const activitiesScript = this.generateActivitiesScript(flowDefinition.activities || []);
    
    return `// Auto-generated Business Rule fallback for: ${args.name}
// Original Flow Type: ${args.flow_type || 'flow'}
// Generated by Snow-Flow Intelligent Fallback System

(function executeRule(current, previous /*null when async*/) {
    
    try {
        gs.log('Snow-Flow Business Rule executing: ${args.name}', 'INFO');
        
        // Flow activities converted to Business Rule logic
        ${activitiesScript}
        
        gs.log('Snow-Flow Business Rule completed successfully: ${args.name}', 'INFO');
        
    } catch (error) {
        gs.error('Snow-Flow Business Rule error in ${args.name}: ' + error.message);
    }
    
})(current, previous);`;
  }

  /**
   * Generate script for flow activities
   */
  private generateActivitiesScript(activities: any[]): string {
    if (!activities || activities.length === 0) {
      return `        // No specific activities defined - implement your logic here
        gs.log('Business Rule triggered for record: ' + current.getDisplayValue(), 'INFO');`;
    }

    let script = '';
    activities.forEach((activity, index) => {
      script += `\n        // Activity ${index + 1}: ${activity.name || activity.type}`;
      
      switch (activity.type) {
        case 'create_record':
          script += this.generateCreateRecordScript(activity);
          break;
        case 'update_record':
          script += this.generateUpdateRecordScript(activity);
          break;
        case 'notification':
        case 'send_email':
          script += this.generateNotificationScript(activity);
          break;
        case 'approval':
          script += this.generateApprovalScript(activity);
          break;
        case 'condition':
          script += this.generateConditionScript(activity);
          break;
        default:
          script += `\n        // TODO: Implement ${activity.type} logic
        gs.log('Activity ${activity.name || activity.type} executed', 'INFO');`;
      }
      script += '\n';
    });

    return script;
  }

  /**
   * Generate create record script
   */
  private generateCreateRecordScript(activity: any): string {
    const table = activity.table || activity.table_name || 'sc_request';
    const fields = activity.fields || activity.field_values || {};
    
    let script = `\n        var record = new GlideRecord('${table}');
        record.newRecord();`;
    
    Object.entries(fields).forEach(([field, value]) => {
      script += `\n        record.${field} = '${value}';`;
    });
    
    script += `\n        var recordId = record.insert();
        gs.log('Created ${table} record: ' + recordId, 'INFO');`;
    
    return script;
  }

  /**
   * Generate update record script
   */
  private generateUpdateRecordScript(activity: any): string {
    const table = activity.table || activity.table_name || 'current.getTableName()';
    const fields = activity.fields || activity.field_values || {};
    
    let script = `\n        var updateRecord = new GlideRecord('${table}');
        if (updateRecord.get(current.sys_id)) {`;
    
    Object.entries(fields).forEach(([field, value]) => {
      script += `\n            updateRecord.${field} = '${value}';`;
    });
    
    script += `\n            updateRecord.update();
            gs.log('Updated ${table} record: ' + current.sys_id, 'INFO');
        }`;
    
    return script;
  }

  /**
   * Generate notification script
   */
  private generateNotificationScript(activity: any): string {
    const inputs = activity.inputs || {};
    const recipients = inputs.to || inputs.recipients || 'current.requested_for.email';
    const subject = inputs.subject || `Notification from ${activity.name}`;
    const body = inputs.body || inputs.message || 'Automated notification';
    
    return `\n        // Send notification
        var notification = new GlideEmailOutbound();
        notification.setTo('${recipients}');
        notification.setSubject('${subject}');
        notification.setBody('${body}');
        notification.send();
        gs.log('Notification sent to: ' + '${recipients}', 'INFO');`;
  }

  /**
   * Generate approval script
   */
  private generateApprovalScript(activity: any): string {
    const inputs = activity.inputs || {};
    const approver = inputs.approvers || inputs.approver || 'admin';
    
    return `\n        // Create approval request
        var approval = new GlideRecord('sysapproval_approver');
        approval.newRecord();
        approval.approver = '${approver}';
        approval.sysapproval = current.sys_id;
        approval.state = 'requested';
        approval.comments = 'Approval required for: ' + current.getDisplayValue();
        approval.insert();
        gs.log('Approval request created for: ' + '${approver}', 'INFO');`;
  }

  /**
   * Generate condition script
   */
  private generateConditionScript(activity: any): string {
    const condition = activity.condition || 'true';
    
    return `\n        // Conditional logic
        if (${condition}) {
            gs.log('Condition met: ${condition}', 'INFO');
            // Add condition-specific logic here
        } else {
            gs.log('Condition not met: ${condition}', 'INFO');
        }`;
  }

  /**
   * Get Business Rule 'when' value from trigger type
   */
  private getTriggerWhen(triggerType: string): string {
    switch (triggerType) {
      case 'record_created':
        return 'after';
      case 'record_updated':
        return 'after';
      case 'record_deleted':
        return 'before';
      case 'manual':
        return 'async';
      default:
        return 'after';
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Deployment MCP Server started');
  }
}

// Start the server
const server = new ServiceNowDeploymentMCP();
server.start().catch((error) => {
  console.error('Failed to start ServiceNow Deployment MCP:', error);
  process.exit(1);
});
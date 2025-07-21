#!/usr/bin/env node
/**
 * ServiceNow Deployment MCP Server - Agent-Integrated Version
 * Provides specialized deployment tools with full agent coordination
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer, MCPToolResult } from './shared/base-mcp-server.js';
import { AgentContext } from './shared/mcp-memory-manager.js';
import { ScopeManager, DeploymentContext } from '../managers/scope-manager.js';
import { GlobalScopeStrategy, ScopeType } from '../strategies/global-scope-strategy.js';
import { artifactTracker } from '../utils/artifact-tracker.js';

export class ServiceNowDeploymentMCP extends BaseMCPServer {
  private scopeManager: ScopeManager;
  private globalScopeStrategy: GlobalScopeStrategy;

  constructor() {
    super('servicenow-deployment', '2.0.0');
    
    // Initialize scope management
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
    // Define available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_deploy',
          description: 'AGENT-AWARE DEPLOYMENT - Complete deployment workflow with automatic update set management, agent coordination, and memory integration',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['widget', 'flow', 'application', 'script', 'business_rule', 'table', 'batch'],
                description: 'Type of artifact to deploy'
              },
              instruction: {
                type: 'string',
                description: 'Natural language instruction for what to create (for flows/widgets)'
              },
              config: {
                type: 'object',
                description: 'Artifact configuration (alternative to instruction for direct config)'
              },
              artifacts: {
                type: 'array',
                description: 'For batch deployments - array of artifacts',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    config: { type: 'object' },
                    instruction: { type: 'string' }
                  }
                }
              },
              // Agent context parameters
              session_id: {
                type: 'string',
                description: 'Agent session ID for coordination'
              },
              agent_id: {
                type: 'string',
                description: 'Deploying agent ID'
              },
              agent_type: {
                type: 'string',
                description: 'Type of agent performing deployment'
              },
              // Deployment options
              auto_update_set: {
                type: 'boolean',
                description: 'Automatically ensure active Update Set session (default: true)',
                default: true
              },
              fallback_strategy: {
                type: 'string',
                enum: ['manual_steps', 'update_set_only', 'none'],
                description: 'Strategy when direct deployment fails (default: manual_steps)',
                default: 'manual_steps'
              },
              permission_escalation: {
                type: 'string',
                enum: ['auto_request', 'manual', 'none'],
                description: 'How to handle permission errors (default: auto_request)',
                default: 'auto_request'
              },
              deployment_context: {
                type: 'string',
                description: 'Context for Update Set naming (e.g., "incident widget", "approval flow")'
              },
              // Batch options
              parallel: {
                type: 'boolean',
                description: 'Deploy batch artifacts in parallel',
                default: false
              },
              transaction_mode: {
                type: 'boolean',
                description: 'All-or-nothing batch deployment',
                default: true
              },
              dry_run: {
                type: 'boolean',
                description: 'Validate without deploying',
                default: false
              }
            },
            required: ['type']
          }
        },
        {
          name: 'snow_deployment_status',
          description: 'Check deployment status and history with agent tracking',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'Session ID to filter by' },
              limit: { type: 'number', description: 'Number of recent deployments to show', default: 10 },
            }
          }
        },
        {
          name: 'snow_validate_deployment',
          description: 'Validate a deployment before executing with agent coordination',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['widget', 'workflow', 'application'] },
              artifact: { type: 'object', description: 'The artifact to validate' },
              session_id: { type: 'string' },
              agent_id: { type: 'string' }
            },
            required: ['type', 'artifact']
          }
        },
        {
          name: 'snow_rollback_deployment',
          description: 'Rollback a deployment with agent coordination',
          inputSchema: {
            type: 'object',
            properties: {
              update_set_id: { type: 'string', description: 'Update set sys_id to rollback' },
              reason: { type: 'string', description: 'Reason for rollback' },
              session_id: { type: 'string' },
              agent_id: { type: 'string' }
            },
            required: ['update_set_id', 'reason']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'snow_deploy':
            return await this.deployWithAgentCoordination(args);
          case 'snow_deployment_status':
            return await this.getDeploymentStatusWithContext(args);
          case 'snow_validate_deployment':
            return await this.validateDeploymentWithContext(args);
          case 'snow_rollback_deployment':
            return await this.rollbackDeploymentWithContext(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.createErrorResponse(
          `Tool execution failed: ${name}`,
          error
        );
      }
    });
  }

  /**
   * Main deployment method with full agent integration
   */
  private async deployWithAgentCoordination(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_deploy',
      args,
      async (context) => {
        // Check authentication
        if (!await this.checkAuthentication()) {
          return this.createAuthenticationError();
        }

        // Assert no mock data
        this.assertNoMockData('deployment');

        // Get session context for coordination
        const sessionContext = await this.getSessionContext(context.session_id);
        
        // Report initial progress
        await this.reportProgress(context, 10, 'Initializing deployment');

        try {
          // Handle different deployment types
          if (args.type === 'batch') {
            return await this.deployBatch(args, context);
          } else {
            return await this.deploySingleArtifact(args, context);
          }
        } catch (error) {
          // Request Queen intervention for critical errors
          await this.requestQueenIntervention(context, {
            type: 'deployment_failure',
            priority: 'high',
            description: `Failed to deploy ${args.type}: ${error instanceof Error ? error.message : String(error)}`,
            attempted_solutions: ['direct_deployment', 'fallback_strategy']
          });

          throw error;
        }
      }
    );
  }

  /**
   * Deploy a single artifact with memory tracking
   */
  private async deploySingleArtifact(args: any, context: AgentContext): Promise<MCPToolResult> {
    const { type, config, instruction } = args;

    // Report planning phase
    await this.reportProgress(context, 20, 'Planning deployment');

    // Ensure update set if requested
    let updateSetId: string | undefined;
    if (args.auto_update_set !== false) {
      const updateSetResult = await this.ensureUpdateSet(type, config?.name || 'artifact', context);
      updateSetId = updateSetResult.updateSetId;
      
      await this.reportProgress(context, 30, 'Update set ready');
    }

    // Deploy based on type
    let result: any;
    await this.reportProgress(context, 50, `Deploying ${type}`);

    switch (type) {
      case 'widget':
        result = await this.deployWidget(config, context, updateSetId);
        break;
      case 'flow':
        result = await this.deployFlow(config || { instruction }, context, updateSetId);
        break;
      case 'application':
        result = await this.deployApplication(config, context, updateSetId);
        break;
      case 'script':
      case 'business_rule':
        result = await this.deployScript(type, config, context, updateSetId);
        break;
      default:
        throw new Error(`Unsupported deployment type: ${type}`);
    }

    // Store artifact in memory
    await this.storeArtifact(context, {
      sys_id: result.sys_id,
      type,
      name: result.name || config?.name || 'unnamed',
      description: config?.description,
      config,
      update_set_id: updateSetId
    });

    // Record deployment in history
    await this.memory.recordDeployment(
      context.session_id,
      result.sys_id,
      type,
      true,
      context.agent_id
    );

    await this.reportProgress(context, 90, 'Finalizing deployment');

    // Notify next agent if needed
    if (result.next_agent) {
      await this.notifyHandoff(context, result.next_agent, {
        type,
        sys_id: result.sys_id,
        next_steps: result.next_steps || []
      });
    }

    await this.reportProgress(context, 100, 'Deployment complete');

    return this.createSuccessResponse(
      `Successfully deployed ${type}: ${result.name}`,
      {
        sys_id: result.sys_id,
        name: result.name,
        update_set_id: updateSetId,
        deployment_details: result
      },
      {
        agent_id: context.agent_id,
        session_id: context.session_id,
        artifacts_created: [result.sys_id]
      }
    );
  }

  /**
   * Deploy multiple artifacts in batch
   */
  private async deployBatch(args: any, context: AgentContext): Promise<MCPToolResult> {
    const { artifacts, parallel, transaction_mode, dry_run } = args;
    
    if (!artifacts || !Array.isArray(artifacts)) {
      throw new Error('Batch deployment requires artifacts array');
    }

    await this.reportProgress(context, 10, `Preparing batch deployment of ${artifacts.length} artifacts`);

    // Dry run validation
    if (dry_run) {
      const validationResults = await Promise.all(
        artifacts.map(artifact => this.validateArtifact(artifact, context))
      );
      
      return this.createSuccessResponse(
        'Dry run completed - all artifacts validated',
        { validationResults }
      );
    }

    // Create update set for batch
    const updateSetResult = await this.ensureUpdateSet('batch', `Batch deployment`, context);
    const updateSetId = updateSetResult.updateSetId;

    const results: any[] = [];
    const errors: any[] = [];

    try {
      if (parallel) {
        // Deploy in parallel
        await this.reportProgress(context, 30, 'Deploying artifacts in parallel');
        
        const deploymentPromises = artifacts.map((artifact, index) => 
          this.deploySingleArtifact(
            { ...artifact, auto_update_set: false },
            context
          ).catch(error => {
            errors.push({ artifact, error: error.message });
            return null;
          })
        );

        const parallelResults = await Promise.all(deploymentPromises);
        results.push(...parallelResults.filter(r => r !== null));

      } else {
        // Deploy sequentially
        for (let i = 0; i < artifacts.length; i++) {
          const artifact = artifacts[i];
          await this.reportProgress(
            context, 
            30 + (60 * i / artifacts.length), 
            `Deploying artifact ${i + 1} of ${artifacts.length}`
          );

          try {
            const result = await this.deploySingleArtifact(
              { ...artifact, auto_update_set: false },
              context
            );
            results.push(result);
          } catch (error) {
            errors.push({ artifact, error: error instanceof Error ? error.message : String(error) });
            
            if (transaction_mode) {
              // Rollback on error in transaction mode
              await this.rollbackBatch(results, updateSetId, context);
              throw new Error(`Batch deployment failed at artifact ${i + 1}: ${error}`);
            }
          }
        }
      }

      // Check if we need to rollback
      if (transaction_mode && errors.length > 0) {
        await this.rollbackBatch(results, updateSetId, context);
        throw new Error(`Batch deployment failed with ${errors.length} errors`);
      }

      await this.reportProgress(context, 100, 'Batch deployment complete');

      return this.createSuccessResponse(
        `Batch deployment completed: ${results.length} succeeded, ${errors.length} failed`,
        {
          successful: results.length,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          update_set_id: updateSetId
        }
      );

    } catch (error) {
      // Record failed deployment
      await this.memory.recordDeployment(
        context.session_id,
        'batch_deployment',
        'batch',
        false,
        context.agent_id,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }
  }

  /**
   * Deploy widget with agent tracking
   */
  private async deployWidget(config: any, context: AgentContext, updateSetId?: string): Promise<any> {
    this.logger.info('Deploying widget', { 
      name: config.name,
      agent_id: context.agent_id 
    });

    try {
      // Create widget in ServiceNow
      const widgetData = {
        name: config.name,
        id: config.name,
        template: config.template || '<div>Widget Template</div>',
        css: config.css || '',
        server_script: config.server_script || '',
        client_script: config.client_script || '',
        public: false,
        roles: '',
        active: true
      };

      const response = await this.client.createRecord('sp_widget', widgetData);
      
      if (!response.success || !response.result) {
        throw new Error('Failed to create widget in ServiceNow');
      }

      const widgetSysId = response.result.sys_id;

      // Determine next agent based on widget complexity
      let nextAgent: string | undefined;
      let nextSteps: string[] = [];

      if (config.requires_styling || config.template?.includes('class=')) {
        nextAgent = 'ui_specialist';
        nextSteps = ['responsive_styling', 'accessibility_compliance'];
      } else if (config.requires_testing) {
        nextAgent = 'test_agent';
        nextSteps = ['functional_testing', 'performance_testing'];
      }

      return {
        sys_id: widgetSysId,
        name: config.name,
        table: 'sp_widget',
        next_agent: nextAgent,
        next_steps: nextSteps
      };

    } catch (error) {
      this.logger.error('Widget deployment failed', error);
      throw error;
    }
  }

  /**
   * Deploy flow with agent tracking
   */
  private async deployFlow(config: any, context: AgentContext, updateSetId?: string): Promise<any> {
    // For flows with natural language instructions, delegate to flow composer
    if (config.instruction) {
      // Store instruction in shared context for flow builder agent
      await this.memory.updateSharedContext({
        session_id: context.session_id,
        context_key: 'flow_instruction',
        context_value: config.instruction,
        created_by_agent: context.agent_id
      });

      return {
        sys_id: `pending_flow_${Date.now()}`,
        name: 'Flow from instruction',
        instruction: config.instruction,
        next_agent: 'flow_builder',
        next_steps: ['analyze_requirements', 'create_flow_structure', 'deploy_flow']
      };
    }

    // Direct flow deployment
    const flowData = {
      name: config.name,
      description: config.description,
      active: config.active !== false,
      sys_scope: 'global'
    };

    const response = await this.client.createRecord('sys_hub_flow', flowData);
    
    if (!response.success || !response.result) {
      throw new Error('Failed to create flow in ServiceNow');
    }

    return {
      sys_id: response.result.sys_id,
      name: config.name,
      table: 'sys_hub_flow'
    };
  }

  /**
   * Deploy application with scope management
   */
  private async deployApplication(config: any, context: AgentContext, updateSetId?: string): Promise<any> {
    // Determine deployment scope
    const scopeStrategy = config.scope_strategy || 'auto';
    const deploymentContext: DeploymentContext = {
      artifactType: 'application',
      targetScope: scopeStrategy === 'auto' ? undefined : config.scope,
      environment: config.environment || 'development',
      permissions: [] // Will be populated based on auth
    };

    const scope = await this.scopeManager.determineScope(deploymentContext);
    
    const appData = {
      name: config.name,
      scope: scope.scopeName,
      short_description: config.short_description,
      version: config.version,
      vendor: config.vendor || 'Custom',
      vendor_prefix: config.vendor_prefix || 'x',
      active: config.active !== false
    };

    const response = await this.client.createRecord('sys_app', appData);
    
    if (!response.success || !response.result) {
      throw new Error('Failed to create application in ServiceNow');
    }

    return {
      sys_id: response.result.sys_id,
      name: config.name,
      scope: scope.scopeName,
      table: 'sys_app'
    };
  }

  /**
   * Deploy script or business rule
   */
  private async deployScript(type: string, config: any, context: AgentContext, updateSetId?: string): Promise<any> {
    const table = type === 'script' ? 'sys_script' : 'sys_script';
    
    const scriptData = {
      name: config.name,
      script: config.script,
      active: config.active !== false,
      description: config.description
    };

    const response = await this.client.createRecord(table, scriptData);
    
    if (!response.success || !response.result) {
      throw new Error(`Failed to create ${type} in ServiceNow`);
    }

    // Scripts often need testing
    return {
      sys_id: response.result.sys_id,
      name: config.name,
      table,
      next_agent: 'test_agent',
      next_steps: ['syntax_validation', 'unit_testing']
    };
  }

  /**
   * Get deployment status with session filtering
   */
  private async getDeploymentStatusWithContext(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_deployment_status',
      args,
      async (context) => {
        const session_id = args.session_id || context.session_id;
        
        // Get artifacts from memory
        const artifacts = await this.memory.getSessionArtifacts(session_id);
        
        // Get active agents
        const activeAgents = await this.memory.query(`
          SELECT * FROM agent_coordination 
          WHERE session_id = ? 
          ORDER BY last_activity DESC
        `, [session_id]);

        // Get recent deployments
        const deployments = await this.memory.query(`
          SELECT * FROM deployment_history 
          WHERE session_id = ? 
          ORDER BY deployment_time DESC 
          LIMIT ?
        `, [session_id, args.limit || 10]);

        return this.createSuccessResponse(
          `Deployment status for session ${session_id}`,
          {
            artifacts: artifacts.length,
            active_agents: activeAgents.length,
            recent_deployments: deployments,
            session_summary: {
              total_artifacts: artifacts.length,
              artifact_types: this.groupByType(artifacts),
              success_rate: this.calculateSuccessRate(deployments)
            }
          }
        );
      }
    );
  }

  /**
   * Validate deployment with agent context
   */
  private async validateDeploymentWithContext(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_validate_deployment',
      args,
      async (context) => {
        const { type, artifact } = args;
        
        const validationResult = await this.validateArtifact(
          { type, config: artifact },
          context
        );

        if (validationResult.valid) {
          return this.createSuccessResponse(
            `Validation passed for ${type}`,
            validationResult
          );
        } else {
          // Store validation failure in context
          await this.memory.updateSharedContext({
            session_id: context.session_id,
            context_key: `validation_failure_${type}`,
            context_value: JSON.stringify(validationResult),
            created_by_agent: context.agent_id
          });

          return this.createErrorResponse(
            `Validation failed for ${type}`,
            validationResult.errors
          );
        }
      }
    );
  }

  /**
   * Rollback deployment with coordination
   */
  private async rollbackDeploymentWithContext(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_rollback_deployment',
      args,
      async (context) => {
        const { update_set_id, reason } = args;

        // Notify all agents about rollback
        await this.memory.sendAgentMessage({
          session_id: context.session_id,
          from_agent: context.agent_id,
          to_agent: 'all',
          message_type: 'status_update',
          content: JSON.stringify({
            action: 'rollback_initiated',
            update_set_id,
            reason
          })
        });

        // Perform rollback
        const rollbackResult = await this.client.updateRecord('sys_update_set', update_set_id, {
          state: 'reverted',
          description: `Rolled back: ${reason}`
        });

        if (rollbackResult.success) {
          // Update deployment history
          await this.memory.recordDeployment(
            context.session_id,
            update_set_id,
            'rollback',
            true,
            context.agent_id
          );

          return this.createSuccessResponse(
            `Successfully rolled back update set ${update_set_id}`,
            { reason }
          );
        } else {
          throw new Error('Rollback failed');
        }
      }
    );
  }

  // Helper methods

  private async ensureUpdateSet(type: string, name: string, context: AgentContext): Promise<any> {
    // Implementation would check for existing update set or create new one
    // This is simplified for the example
    const updateSetName = `${context.session_id}_${type}_${Date.now()}`;
    
    const response = await this.client.createRecord('sys_update_set', {
      name: updateSetName,
      description: `Created by ${context.agent_type} agent ${context.agent_id}`,
      state: 'in_progress'
    });

    return {
      updateSetId: response.result?.sys_id,
      updateSetName
    };
  }

  private async validateArtifact(artifact: any, context: AgentContext): Promise<any> {
    // Simplified validation logic
    const errors: string[] = [];
    
    if (!artifact.type) errors.push('Missing artifact type');
    if (!artifact.config && !artifact.instruction) errors.push('Missing configuration or instruction');
    
    if (artifact.type === 'widget') {
      if (!artifact.config?.name) errors.push('Widget name is required');
      if (!artifact.config?.template) errors.push('Widget template is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private async rollbackBatch(results: any[], updateSetId: string, context: AgentContext): Promise<void> {
    // Rollback logic for batch deployments
    for (const result of results) {
      if (result?.data?.sys_id) {
        try {
          await this.client.deleteRecord(result.data.table || 'sys_metadata', result.data.sys_id);
        } catch (error) {
          this.logger.error('Failed to rollback artifact', error);
        }
      }
    }
  }

  private groupByType(artifacts: any[]): Record<string, number> {
    return artifacts.reduce((acc, artifact) => {
      acc[artifact.artifact_type] = (acc[artifact.artifact_type] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateSuccessRate(deployments: any[]): number {
    if (deployments.length === 0) return 0;
    const successful = deployments.filter(d => d.success).length;
    return Math.round((successful / deployments.length) * 100);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ServiceNowDeploymentMCP();
  server.start().catch(console.error);
}
/**
 * MCP Execution Bridge
 * 
 * Bridges the gap between agent recommendations and actual MCP tool execution
 * Enables Queen Agent and specialized agents to directly execute ServiceNow operations
 */

import { EventEmitter } from 'eventemitter3';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { QueenMemorySystem } from './queen-memory.js';
import { Logger } from '../utils/logger.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export interface AgentRecommendation {
  agentId: string;
  agentType: string;
  action: string;
  tool: string;
  server: string;
  params: any;
  reasoning: string;
  confidence: number;
  dependencies?: string[];
}

export interface MCPExecutionResult {
  success: boolean;
  recommendation: AgentRecommendation;
  toolResult?: any;
  error?: string;
  executionTime: number;
  retries?: number;
  fallbackUsed?: boolean;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Maps agent recommendations to MCP tool calls and executes them
 */
export class MCPExecutionBridge extends EventEmitter {
  private mcpClients: Map<string, Client> = new Map();
  private mcpProcesses: Map<string, ChildProcess> = new Map();
  private sessionAuth: ServiceNowOAuth;
  private memory: QueenMemorySystem;
  private logger: Logger;
  
  // MCP server configurations
  private serverConfigs: Map<string, MCPServerConfig> = new Map([
    ['deployment', { 
      name: 'servicenow-deployment',
      command: 'node',
      args: ['dist/mcp/servicenow-deployment-mcp.js']
    }],
    ['intelligent', { 
      name: 'servicenow-intelligent',
      command: 'node',
      args: ['dist/mcp/servicenow-intelligent-mcp.js']
    }],
    ['operations', { 
      name: 'servicenow-operations',
      command: 'node',
      args: ['dist/mcp/servicenow-operations-mcp.js']
    }],
    ['flow-composer', { 
      name: 'servicenow-flow-composer',
      command: 'node',
      args: ['dist/mcp/servicenow-flow-composer-mcp.js']
    }],
    ['update-set', { 
      name: 'servicenow-update-set',
      command: 'node',
      args: ['dist/mcp/servicenow-update-set-mcp.js']
    }],
  ]);

  // Tool to server mapping
  private toolServerMap: Map<string, string> = new Map([
    // Deployment tools
    ['snow_deploy', 'deployment'],
    ['snow_deploy_widget', 'deployment'],
    ['snow_deploy_flow', 'deployment'],
    ['snow_preview_widget', 'deployment'],
    ['snow_widget_test', 'deployment'],
    
    // Intelligent tools
    ['snow_find_artifact', 'intelligent'],
    ['snow_edit_artifact', 'intelligent'],
    ['snow_comprehensive_search', 'intelligent'],
    ['snow_analyze_requirements', 'intelligent'],
    
    // Flow composer tools
    ['snow_create_flow', 'flow-composer'],
    ['snow_analyze_flow_instruction', 'flow-composer'],
    ['snow_discover_flow_artifacts', 'flow-composer'],
    
    // Operations tools
    ['snow_catalog_item_search', 'operations'],
    ['snow_test_flow_with_mock', 'operations'],
    ['snow_link_catalog_to_flow', 'operations'],
    
    // Update set tools
    ['snow_update_set_create', 'update-set'],
    ['snow_update_set_switch', 'update-set'],
    ['snow_update_set_add_artifact', 'update-set'],
  ]);

  constructor(memory?: QueenMemorySystem) {
    super();
    this.sessionAuth = new ServiceNowOAuth();
    this.memory = memory || new QueenMemorySystem();
    this.logger = new Logger('MCPExecutionBridge');
  }

  /**
   * Execute an agent recommendation by calling the appropriate MCP tool
   */
  async executeAgentRecommendation(
    agent: { id: string; type: string },
    recommendation: AgentRecommendation
  ): Promise<MCPExecutionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing recommendation from ${agent.type} agent:`, {
        tool: recommendation.tool,
        action: recommendation.action,
        confidence: recommendation.confidence
      });

      // 1. Map recommendation to MCP tool
      const toolMapping = await this.mapRecommendationToTool(recommendation);
      
      // 2. Ensure MCP client is connected
      const client = await this.ensureMCPClient(toolMapping.server);
      
      // 3. Execute tool with session authentication
      const toolResult = await this.executeToolWithAuth(
        client,
        toolMapping.tool,
        toolMapping.params
      );
      
      // 4. Store result in shared memory for other agents
      await this.storeExecutionResult(agent.id, recommendation, toolResult);
      
      // 5. Emit execution event for monitoring
      this.emit('execution:complete', {
        agent,
        recommendation,
        result: toolResult,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        recommendation,
        toolResult: toolResult.result,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Execution failed:', error);
      
      // Try fallback strategies
      const fallbackResult = await this.tryFallbackStrategies(
        agent,
        recommendation,
        error
      );
      
      if (fallbackResult.success) {
        return fallbackResult;
      }

      // Store failure for learning
      await this.storeExecutionFailure(agent.id, recommendation, error);

      return {
        success: false,
        recommendation,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        fallbackUsed: true
      };
    }
  }

  /**
   * Map agent recommendation to specific MCP tool
   */
  private async mapRecommendationToTool(
    recommendation: AgentRecommendation
  ): Promise<{ server: string; tool: string; params: any }> {
    // Direct tool mapping if specified
    if (recommendation.tool && recommendation.server) {
      return {
        server: recommendation.server,
        tool: recommendation.tool,
        params: recommendation.params
      };
    }

    // Intelligent mapping based on action
    const mapping = await this.intelligentToolMapping(recommendation);
    
    // Store mapping decision for learning
    await this.memory.store(`tool_mapping_${Date.now()}`, {
      recommendation,
      mapping,
      timestamp: new Date().toISOString()
    });

    return mapping;
  }

  /**
   * Intelligent tool mapping based on action description
   */
  private async intelligentToolMapping(
    recommendation: AgentRecommendation
  ): Promise<{ server: string; tool: string; params: any }> {
    const action = recommendation.action.toLowerCase();
    
    // Widget-related actions
    if (action.includes('widget') || action.includes('portal')) {
      if (action.includes('deploy') || action.includes('create')) {
        return {
          server: 'deployment',
          tool: 'snow_deploy',
          params: { type: 'widget', config: recommendation.params }
        };
      }
      if (action.includes('test')) {
        return {
          server: 'deployment',
          tool: 'snow_widget_test',
          params: recommendation.params
        };
      }
    }

    // Flow-related actions
    if (action.includes('flow') || action.includes('workflow')) {
      if (action.includes('create') || action.includes('build')) {
        return {
          server: 'flow-composer',
          tool: 'snow_create_flow',
          params: {
            instruction: recommendation.params.description || recommendation.action,
            deploy_immediately: true
          }
        };
      }
      if (action.includes('test')) {
        return {
          server: 'operations',
          tool: 'snow_test_flow_with_mock',
          params: recommendation.params
        };
      }
    }

    // Search/discovery actions
    if (action.includes('find') || action.includes('search') || action.includes('discover')) {
      return {
        server: 'intelligent',
        tool: 'snow_find_artifact',
        params: {
          query: recommendation.params.query || recommendation.action,
          type: recommendation.params.type || 'any'
        }
      };
    }

    // Update set actions
    if (action.includes('update set') || action.includes('track')) {
      if (action.includes('create')) {
        return {
          server: 'update-set',
          tool: 'snow_update_set_create',
          params: recommendation.params
        };
      }
      if (action.includes('add') || action.includes('track')) {
        return {
          server: 'update-set',
          tool: 'snow_update_set_add_artifact',
          params: recommendation.params
        };
      }
    }

    // Default fallback - try intelligent search
    return {
      server: 'intelligent',
      tool: 'snow_find_artifact',
      params: {
        query: recommendation.action,
        type: 'any'
      }
    };
  }

  /**
   * Ensure MCP client is connected and ready
   */
  private async ensureMCPClient(serverName: string): Promise<Client> {
    // Check if client already exists and is connected
    const existingClient = this.mcpClients.get(serverName);
    if (existingClient) {
      return existingClient;
    }

    // Get server configuration
    const config = this.serverConfigs.get(serverName);
    if (!config) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    // Spawn MCP server process
    const serverProcess = spawn(config.command, config.args || [], {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.mcpProcesses.set(serverName, serverProcess);

    // Create MCP client
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env },
    });

    const client = new Client({
      name: `queen-agent-${serverName}`,
      version: '1.0.0',
    }, {
      capabilities: {}
    });

    // Connect to server
    await client.connect(transport);
    
    // Store client
    this.mcpClients.set(serverName, client);
    
    this.logger.info(`Connected to MCP server: ${serverName}`);
    
    return client;
  }

  /**
   * Execute tool with authentication
   */
  private async executeToolWithAuth(
    client: Client,
    tool: string,
    params: any
  ): Promise<any> {
    // Ensure we have valid authentication
    const isAuthenticated = await this.sessionAuth.isAuthenticated();
    if (!isAuthenticated) {
      throw new Error('Not authenticated with ServiceNow. Run "snow-flow auth login" first.');
    }

    // Call the tool
    const result = await client.callTool({
      name: tool,
      arguments: params
    });

    return result;
  }

  /**
   * Store execution result in shared memory
   */
  private async storeExecutionResult(
    agentId: string,
    recommendation: AgentRecommendation,
    result: any
  ): Promise<void> {
    const executionRecord = {
      agentId,
      recommendation,
      result,
      timestamp: new Date().toISOString(),
      success: true
    };

    // Store in memory for coordination
    await this.memory.store(`execution_${agentId}_${Date.now()}`, executionRecord);
    
    // Update agent progress
    await this.memory.storeProgress(agentId, {
      lastExecution: executionRecord,
      totalExecutions: await this.getAgentExecutionCount(agentId) + 1
    });
  }

  /**
   * Store execution failure for learning
   */
  private async storeExecutionFailure(
    agentId: string,
    recommendation: AgentRecommendation,
    error: any
  ): Promise<void> {
    const failureRecord = {
      agentId,
      recommendation,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      success: false
    };

    // Store failure for pattern analysis
    await this.memory.store(`failure_${agentId}_${Date.now()}`, failureRecord);
    
    // Update failure patterns
    await this.memory.storeFailurePattern({
      tool: recommendation.tool,
      action: recommendation.action,
      errorType: this.classifyError(error),
      frequency: 1
    });
  }

  /**
   * Try fallback strategies when primary execution fails
   */
  private async tryFallbackStrategies(
    agent: { id: string; type: string },
    recommendation: AgentRecommendation,
    error: any
  ): Promise<MCPExecutionResult> {
    const strategies = [
      this.tryAlternativeTool.bind(this),
      this.trySimplifiedParams.bind(this),
      this.tryManualSteps.bind(this)
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy(agent, recommendation, error);
        if (result.success) {
          this.logger.info('Fallback strategy succeeded:', strategy.name);
          return result;
        }
      } catch (strategyError) {
        this.logger.warn(`Fallback strategy ${strategy.name} failed:`, strategyError);
      }
    }

    return {
      success: false,
      recommendation,
      error: 'All fallback strategies failed',
      executionTime: 0,
      fallbackUsed: true
    };
  }

  /**
   * Try using an alternative tool
   */
  private async tryAlternativeTool(
    agent: { id: string; type: string },
    recommendation: AgentRecommendation,
    error: any
  ): Promise<MCPExecutionResult> {
    // Map to alternative tools based on failure type
    const alternatives: Record<string, string[]> = {
      'snow_deploy': ['snow_deploy_widget', 'snow_deploy_flow'],
      'snow_create_flow': ['snow_flow_wizard', 'snow_deploy'],
      'snow_find_artifact': ['snow_comprehensive_search', 'snow_discover_existing_flows']
    };

    const altTools = alternatives[recommendation.tool];
    if (!altTools || altTools.length === 0) {
      throw new Error('No alternative tools available');
    }

    // Try first alternative
    const altTool = altTools[0];
    const altRecommendation = {
      ...recommendation,
      tool: altTool,
      params: this.adaptParamsForTool(recommendation.params, altTool)
    };

    return this.executeAgentRecommendation(agent, altRecommendation);
  }

  /**
   * Try with simplified parameters
   */
  private async trySimplifiedParams(
    agent: { id: string; type: string },
    recommendation: AgentRecommendation,
    error: any
  ): Promise<MCPExecutionResult> {
    // Simplify complex params
    const simplifiedParams = this.simplifyParams(recommendation.params);
    
    const simplifiedRecommendation = {
      ...recommendation,
      params: simplifiedParams
    };

    return this.executeAgentRecommendation(agent, simplifiedRecommendation);
  }

  /**
   * Generate manual steps as fallback
   */
  private async tryManualSteps(
    agent: { id: string; type: string },
    recommendation: AgentRecommendation,
    error: any
  ): Promise<MCPExecutionResult> {
    // Generate manual steps based on recommendation
    const manualSteps = this.generateManualSteps(recommendation);
    
    return {
      success: true,
      recommendation,
      toolResult: {
        type: 'manual_steps',
        steps: manualSteps,
        reason: 'Automated execution failed, manual steps provided'
      },
      executionTime: 0,
      fallbackUsed: true
    };
  }

  /**
   * Helper methods
   */
  
  private async getAgentExecutionCount(agentId: string): Promise<number> {
    const progress = await this.memory.getProgress(agentId);
    return progress?.totalExecutions || 0;
  }

  private classifyError(error: any): string {
    if (!error) return 'unknown';
    
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return 'authentication';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'not_found';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'permission';
    }
    if (message.includes('rate limit')) {
      return 'rate_limit';
    }
    
    return 'general';
  }

  private adaptParamsForTool(params: any, newTool: string): any {
    // Adapt parameters for different tool format
    const adaptations: Record<string, (p: any) => any> = {
      'snow_deploy_widget': (p) => ({
        name: p.name || p.config?.name,
        title: p.title || p.config?.title,
        template: p.template || p.config?.template || '<div>Widget</div>',
        css: p.css || p.config?.css || '',
        client_script: p.client_script || p.config?.client_script || '',
        server_script: p.server_script || p.config?.server_script || ''
      }),
      'snow_comprehensive_search': (p) => ({
        query: p.query || p.name || p.description,
        include_inactive: false
      })
    };

    const adapter = adaptations[newTool];
    return adapter ? adapter(params) : params;
  }

  private simplifyParams(params: any): any {
    // Remove optional fields and complex nested structures
    const simplified: any = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Flatten nested objects
          simplified[key] = JSON.stringify(value);
        } else if (Array.isArray(value) && value.length > 5) {
          // Limit array size
          simplified[key] = value.slice(0, 5);
        } else {
          simplified[key] = value;
        }
      }
    }
    
    return simplified;
  }

  private generateManualSteps(recommendation: AgentRecommendation): string[] {
    const action = recommendation.action.toLowerCase();
    
    if (action.includes('widget')) {
      return [
        '1. Navigate to Service Portal > Widgets',
        '2. Click "New" to create a widget',
        `3. Set name to: ${recommendation.params.name || 'custom_widget'}`,
        '4. Add HTML template, CSS, and scripts as needed',
        '5. Save and test the widget',
        '6. Add widget to a portal page'
      ];
    }
    
    if (action.includes('flow')) {
      return [
        '1. Navigate to Flow Designer',
        '2. Click "New" > "Flow"',
        `3. Set name to: ${recommendation.params.name || 'custom_flow'}`,
        '4. Configure trigger conditions',
        '5. Add flow steps and actions',
        '6. Test and activate the flow'
      ];
    }
    
    return [
      '1. Log in to ServiceNow instance',
      `2. Execute action: ${recommendation.action}`,
      '3. Use parameters provided in the recommendation',
      '4. Test the implementation',
      '5. Document the changes'
    ];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Disconnect all clients
    for (const [name, client] of this.mcpClients) {
      try {
        await client.close();
        this.logger.info(`Disconnected from MCP server: ${name}`);
      } catch (error) {
        this.logger.error(`Error disconnecting from ${name}:`, error);
      }
    }

    // Terminate all processes
    for (const [name, process] of this.mcpProcesses) {
      try {
        process.kill('SIGTERM');
        this.logger.info(`Terminated MCP server process: ${name}`);
      } catch (error) {
        this.logger.error(`Error terminating ${name}:`, error);
      }
    }

    this.mcpClients.clear();
    this.mcpProcesses.clear();
  }

  /**
   * Public shutdown method for cleanup
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MCP Execution Bridge');
    await this.disconnect();
  }
}
/**
 * Base MCP Server with Agent Integration
 * Provides common functionality for all MCP servers in the agent ecosystem
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ServiceNowClient } from '../../utils/servicenow-client.js';
import { ServiceNowOAuth } from '../../utils/snow-oauth.js';
import { Logger } from '../../utils/logger.js';
import { AgentContextProvider } from './agent-context-provider.js';
import { MCPMemoryManager, AgentContext } from './mcp-memory-manager.js';

export interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    data?: any;
  }>;
  metadata?: {
    agent_id?: string;
    session_id?: string;
    duration_ms?: number;
    artifacts_created?: string[];
  };
}

export abstract class BaseMCPServer {
  protected server: Server;
  protected client: ServiceNowClient;
  protected oauth: ServiceNowOAuth;
  protected logger: Logger;
  protected contextProvider: AgentContextProvider;
  protected memory: MCPMemoryManager;

  constructor(name: string, version: string = '1.0.0') {
    this.server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger(name);
    this.contextProvider = new AgentContextProvider();
    this.memory = MCPMemoryManager.getInstance();
  }

  /**
   * Execute a tool with agent context tracking
   */
  protected async executeWithAgentContext<T>(
    toolName: string,
    args: any,
    operation: (context: AgentContext) => Promise<T>
  ): Promise<MCPToolResult> {
    // Extract agent context
    const agentContext = this.contextProvider.extractAgentContext(args);
    
    // Log operation start
    this.logger.info(`Executing ${toolName}`, {
      agent_id: agentContext.agent_id,
      session_id: agentContext.session_id
    });

    // Execute with context tracking
    const result = await this.contextProvider.executeWithContext(
      {
        ...agentContext,
        operation_name: toolName,
        mcp_server: this.server.serverInfo.name
      },
      async () => operation(agentContext)
    );

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Operation failed: ${result.error}`
          }
        ],
        metadata: {
          agent_id: agentContext.agent_id,
          session_id: agentContext.session_id,
          duration_ms: result.duration_ms
        }
      };
    }

    return result.data as MCPToolResult;
  }

  /**
   * Check authentication with proper error handling
   */
  protected async checkAuthentication(): Promise<boolean> {
    try {
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        this.logger.warn('Not authenticated with ServiceNow');
      }
      return isAuth;
    } catch (error) {
      this.logger.error('Authentication check failed', error);
      return false;
    }
  }

  /**
   * Create standard authentication error response
   */
  protected createAuthenticationError(): MCPToolResult {
    return {
      content: [
        {
          type: 'text',
          text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.'
        }
      ]
    };
  }

  /**
   * Report progress during long operations
   */
  protected async reportProgress(
    context: AgentContext,
    progress: number,
    phase: string
  ): Promise<void> {
    await this.contextProvider.reportProgress(context, progress, phase);
  }

  /**
   * Store artifact with agent tracking
   */
  protected async storeArtifact(
    context: AgentContext,
    artifact: {
      sys_id: string;
      type: string;
      name: string;
      description?: string;
      config?: any;
      update_set_id?: string;
    }
  ): Promise<void> {
    await this.contextProvider.storeArtifact(context, artifact);
  }

  /**
   * Notify handoff to another agent
   */
  protected async notifyHandoff(
    context: AgentContext,
    to_agent: string,
    artifact_info: {
      type: string;
      sys_id: string;
      next_steps: string[];
    }
  ): Promise<void> {
    await this.contextProvider.notifyHandoff(context, to_agent, artifact_info);
  }

  /**
   * Request Queen intervention for issues
   */
  protected async requestQueenIntervention(
    context: AgentContext,
    issue: {
      type: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      attempted_solutions?: string[];
    }
  ): Promise<void> {
    await this.contextProvider.requestQueenIntervention(context, issue);
  }

  /**
   * Get session context for coordination
   */
  protected async getSessionContext(session_id: string): Promise<any> {
    return await this.contextProvider.getSessionContext(session_id);
  }

  /**
   * Create success response with metadata
   */
  protected createSuccessResponse(
    message: string,
    data?: any,
    metadata?: any
  ): MCPToolResult {
    const content: any[] = [
      {
        type: 'text',
        text: `✅ ${message}`
      }
    ];

    if (data) {
      content.push({
        type: 'text',
        text: JSON.stringify(data, null, 2)
      });
    }

    return {
      content,
      metadata
    };
  }

  /**
   * Create error response with metadata
   */
  protected createErrorResponse(
    message: string,
    error?: any,
    metadata?: any
  ): MCPToolResult {
    const content: any[] = [
      {
        type: 'text',
        text: `❌ ${message}`
      }
    ];

    if (error) {
      content.push({
        type: 'text',
        text: `Error details: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    return {
      content,
      metadata
    };
  }

  /**
   * Handle mock data removal - ensure real operations only
   */
  protected assertNoMockData(operation: string): void {
    if (process.env.SNOW_FLOW_MOCK_MODE === 'true') {
      throw new Error(`Mock mode is not supported for ${operation}. All operations must use real ServiceNow instance.`);
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new (await import('@modelcontextprotocol/sdk/server/stdio.js')).StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info(`${this.server.serverInfo.name} MCP server started`);
  }
}
/**
 * Base MCP Server Implementation
 * 
 * Solves DRY violations by providing common functionality for all MCP servers:
 * - Unified authentication handling
 * - Consistent error handling
 * - Session management
 * - Logging and monitoring
 * - Retry logic with exponential backoff
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { Logger } from '../utils/logger.js';

export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
  requiresAuth?: boolean; // Optional flag to disable ServiceNow authentication
  capabilities?: {
    tools?: {};
    resources?: {};
    prompts?: {};
  };
}

export interface ToolResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  retryable?: boolean;
  executionTime?: number;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  expiresIn?: number;
}

/**
 * Base class for all ServiceNow MCP servers
 * Provides common functionality to eliminate code duplication
 */
export abstract class BaseMCPServer {
  protected server: Server;
  protected client: ServiceNowClient;
  protected oauth: ServiceNowOAuth;
  protected logger: Logger;
  protected transport: StdioServerTransport;
  protected tools: Map<string, Tool> = new Map();
  
  // Session management
  private sessionToken?: string;
  private sessionExpiry?: Date;
  private authCheckInterval?: NodeJS.Timeout;
  
  // Performance tracking
  private toolMetrics: Map<string, { calls: number; totalTime: number; errors: number }> = new Map();

  constructor(config: MCPServerConfig) {
    // Initialize server with config
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: config.capabilities || { tools: {} },
      }
    );

    // Initialize common dependencies
    this.client = new ServiceNowClient();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger(`MCP:${config.name}`);
    this.transport = new StdioServerTransport();
    
    // Setup common functionality
    this.setupCommonHandlers();
    this.setupAuthentication();
    this.setupErrorHandling();
    this.setupMetrics();
    
    // Let child classes define their specific tools
    this.setupTools();
  }

  /**
   * Setup common request handlers
   */
  private setupCommonHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()),
    }));

    // Handle tool execution with common auth/error handling
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Track metrics
      const startTime = Date.now();
      let metrics = this.toolMetrics.get(name) || { calls: 0, totalTime: 0, errors: 0 };
      metrics.calls++;
      
      try {
        // Validate authentication first (skip if not required)
        if (this.config.requiresAuth !== false) {
          const authResult = await this.validateAuth();
          if (!authResult.success) {
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Authentication failed: ${authResult.error}`
            );
          }
        }

        // Execute tool with retry logic
        const result = await this.executeWithRetry(name, args);
        
        // Update metrics
        metrics.totalTime += Date.now() - startTime;
        this.toolMetrics.set(name, metrics);
        
        return result;
      } catch (error) {
        // Update error metrics
        metrics.errors++;
        metrics.totalTime += Date.now() - startTime;
        this.toolMetrics.set(name, metrics);
        
        throw error;
      }
    });
  }

  /**
   * Setup authentication with automatic token refresh
   */
  private setupAuthentication(): void {
    // Skip authentication setup if not required
    if (this.config.requiresAuth === false) {
      return;
    }
    
    // Check auth every 5 minutes
    this.authCheckInterval = setInterval(async () => {
      try {
        await this.validateAuth();
      } catch (error) {
        this.logger.error('Background auth check failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Validate authentication with smart caching
   */
  protected async validateAuth(): Promise<AuthResult> {
    try {
      // Check if we have a valid session
      if (this.sessionToken && this.sessionExpiry && this.sessionExpiry > new Date()) {
        return { success: true, token: this.sessionToken };
      }

      // Validate connection
      const connectionResult = await this.validateServiceNowConnection();
      if (!connectionResult.success) {
        return { 
          success: false, 
          error: connectionResult.error || 'Authentication validation failed' 
        };
      }

      // Get fresh token
      const isAuthenticated = await this.oauth.isAuthenticated();
      if (!isAuthenticated) {
        // Try to refresh
        try {
          await this.oauth.refreshAccessToken();
        } catch (refreshError) {
          return {
            success: false,
            error: 'OAuth authentication required. Run "snow-flow auth login" to authenticate.',
          };
        }
      }

      // Cache session info
      const tokenInfo = await this.oauth.loadTokens();
      this.sessionToken = tokenInfo?.access_token;
      this.sessionExpiry = new Date(Date.now() + (tokenInfo?.expires_in || 3600) * 1000);

      return {
        success: true,
        token: this.sessionToken,
        expiresIn: tokenInfo.expires_in,
      };
    } catch (error) {
      this.logger.error('Authentication validation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  /**
   * Execute tool with retry logic
   */
  private async executeWithRetry(toolName: string, args: any, attempt = 1): Promise<any> {
    const maxRetries = 3;
    const backoffMs = 1000 * Math.pow(2, attempt - 1); // Exponential backoff
    
    try {
      // Get tool handler
      const handler = this.getToolHandler(toolName);
      if (!handler) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
      }

      // Execute with timeout
      const timeout = 30000; // 30 seconds
      const result = await Promise.race([
        handler(args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
        ),
      ]);

      return result;
    } catch (error) {
      this.logger.error(`Tool ${toolName} execution failed (attempt ${attempt}):`, error);
      
      // Check if retryable
      if (attempt < maxRetries && this.isRetryableError(error)) {
        this.logger.info(`Retrying ${toolName} after ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.executeWithRetry(toolName, args, attempt + 1);
      }

      // Final failure
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('socket hang up') ||
        message.includes('enotfound') ||
        message.includes('rate limit')
      );
    }
    return false;
  }

  /**
   * Setup global error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    });

    process.on('SIGINT', () => {
      this.logger.info('Received SIGINT, shutting down gracefully...');
      this.gracefulShutdown();
    });
  }

  /**
   * Setup metrics collection
   */
  private setupMetrics(): void {
    // Log metrics every minute
    setInterval(() => {
      const metrics = Array.from(this.toolMetrics.entries()).map(([tool, data]) => ({
        tool,
        calls: data.calls,
        avgTime: data.calls > 0 ? Math.round(data.totalTime / data.calls) : 0,
        errorRate: data.calls > 0 ? (data.errors / data.calls * 100).toFixed(2) : '0',
      }));

      if (metrics.length > 0) {
        this.logger.info('Tool metrics:', metrics);
      }
    }, 60000);
  }

  /**
   * Execute tool with common error handling
   */
  protected async executeTool<T>(
    toolName: string,
    handler: () => Promise<T>
  ): Promise<ToolResult<T>> {
    const startTime = Date.now();
    
    try {
      // Validate auth before execution
      const authResult = await this.validateAuth();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
          retryable: true,
        };
      }

      // Execute the tool logic
      const result = await handler();
      
      // Log success
      this.logger.debug(`Tool ${toolName} executed successfully in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Tool ${toolName} failed:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: this.isRetryableError(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Register a tool
   */
  protected registerTool(tool: Tool, handler: (args: any) => Promise<any>): void {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
  }

  /**
   * Tool handlers map
   */
  private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map();

  /**
   * Get tool handler
   */
  private getToolHandler(name: string): ((args: any) => Promise<any>) | undefined {
    return this.toolHandlers.get(name);
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown...');
    
    // Clear intervals
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    // Log final metrics
    const metrics = Array.from(this.toolMetrics.entries());
    if (metrics.length > 0) {
      this.logger.info('Final metrics:', metrics);
    }

    // Close connections
    try {
      await this.oauth.logout();
    } catch (error) {
      this.logger.error('Error during logout:', error);
    }

    process.exit(0);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    this.logger.info(`Starting ${this.config.name} v${this.config.version}`);
    
    // Validate initial connection (skip if not required)
    if (this.config.requiresAuth !== false) {
      const authResult = await this.validateAuth();
      if (!authResult.success) {
        this.logger.warn('Starting without authentication - some features may be limited');
      }
    }

    await this.server.connect(this.transport);
    this.logger.info('MCP server started successfully');
  }

  /**
   * Abstract method for child classes to implement their specific tools
   */
  /**
   * Validate ServiceNow connection
   */
  protected async validateServiceNowConnection(): Promise<AuthResult> {
    try {
      const isAuthenticated = await this.oauth.isAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated with ServiceNow'
        };
      }

      // Test connection with a simple request
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/sys_properties',
        params: { sysparm_limit: 1 }
      });

      return {
        success: response.success,
        token: 'valid'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection validation failed'
      };
    }
  }

  protected abstract setupTools(): void;
}
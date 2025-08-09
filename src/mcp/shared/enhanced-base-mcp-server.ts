/**
 * Enhanced Base MCP Server with Logging and Token Tracking
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ServiceNowClientWithTracking } from '../../utils/servicenow-client-with-tracking.js';
import { MCPLogger } from './mcp-logger.js';
import { SnowOAuth } from '../../utils/snow-oauth.js';
import { mcpAuth } from '../../utils/mcp-auth-middleware.js';

export interface MCPToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export abstract class EnhancedBaseMCPServer {
  protected server: Server;
  protected client: ServiceNowClientWithTracking;
  protected logger: MCPLogger;
  protected oauth: SnowOAuth;
  protected isAuthenticated: boolean = false;

  constructor(name: string, version: string = '1.0.0') {
    // Create enhanced logger
    this.logger = new MCPLogger(name);
    
    // Log startup
    this.logger.info(`🚀 Starting ${name} MCP Server v${version}`);
    
    // Create enhanced client with tracking
    this.client = new ServiceNowClientWithTracking(this.logger);
    
    // Initialize OAuth
    this.oauth = new SnowOAuth();
    
    // Create server with capabilities
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
    
    // Report initialization
    this.logger.info(`✅ ${name} initialized and ready`);
  }

  /**
   * Execute tool with enhanced tracking
   */
  protected async executeTool(toolName: string, handler: () => Promise<MCPToolResult>): Promise<MCPToolResult> {
    // Start operation tracking
    this.logger.operationStart(toolName);
    
    try {
      // Ensure authentication
      await mcpAuth.ensureAuthenticated();
      this.isAuthenticated = true;
      
      // Execute the tool handler
      const result = await handler();
      
      // Log completion
      this.logger.operationComplete(toolName);
      
      // Send token usage summary if in Claude
      if (process.send) {
        const usage = this.logger.getTokenUsage();
        process.send({
          type: 'token_usage',
          data: {
            tool: toolName,
            tokens: usage
          }
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Tool execution failed: ${toolName}`, error);
      
      // Return error as tool result
      return {
        content: [{
          type: 'text',
          text: `❌ Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }

  /**
   * Validate ServiceNow connection with progress
   */
  protected async validateConnection(): Promise<{ success: boolean; error?: string }> {
    this.logger.progress('Validating ServiceNow connection...');
    
    try {
      // Check credentials
      const credentials = await this.oauth.loadCredentials();
      if (!credentials) {
        return {
          success: false,
          error: 'No ServiceNow credentials found. Run "snow-flow auth login"'
        };
      }
      
      // Check token
      if (!credentials.accessToken) {
        return {
          success: false,
          error: 'OAuth authentication required. Run "snow-flow auth login"'
        };
      }
      
      // Test connection
      this.logger.progress('Testing ServiceNow API connection...');
      const connectionTest = await this.client.testConnection();
      
      if (!connectionTest.success) {
        return {
          success: false,
          error: `ServiceNow connection failed: ${connectionTest.error}`
        };
      }
      
      this.logger.info('✅ ServiceNow connection validated');
      return { success: true };
      
    } catch (error) {
      this.logger.error('Connection validation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create standardized response with tracking
   */
  protected createResponse(message: string, data?: any): MCPToolResult {
    // Log the response
    this.logger.debug('Tool response', { message, hasData: !!data });
    
    // Format response
    const response: MCPToolResult = {
      content: [{
        type: 'text',
        text: message
      }]
    };
    
    // Add data if provided
    if (data) {
      response.content[0].text += '\n\n' + JSON.stringify(data, null, 2);
    }
    
    return response;
  }

  /**
   * Query table with progress tracking
   */
  protected async queryTable(table: string, query: string, limit: number = 10): Promise<any> {
    this.logger.progress(`Querying ${table} table (limit: ${limit})...`);
    
    const result = await this.client.searchRecords(table, query, limit);
    
    const recordCount = result?.data?.result?.length || 0;
    this.logger.info(`Query completed: ${recordCount} records found`);
    
    return result;
  }

  /**
   * Create record with tracking
   */
  protected async createRecord(table: string, data: any): Promise<any> {
    this.logger.progress(`Creating ${table} record...`);
    
    const result = await this.client.createRecord(table, data);
    
    if (result?.success) {
      this.logger.info(`✅ Created ${table} record: ${result.data?.result?.sys_id}`);
    }
    
    return result;
  }

  /**
   * Get client for direct use
   */
  public getClient(): ServiceNowClientWithTracking {
    return this.client;
  }

  /**
   * Get logger for direct use
   */
  public getLogger(): MCPLogger {
    return this.logger;
  }
}
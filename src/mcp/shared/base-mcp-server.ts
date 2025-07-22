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
   * MANDATORY authentication and connection validation before ServiceNow operations
   */
  protected async validateServiceNowConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('🔍 Validating ServiceNow connection...');
      
      // 1. Check if we have valid credentials
      const credentials = await this.oauth.loadCredentials();
      if (!credentials) {
        return {
          success: false,
          error: 'No ServiceNow credentials found. Set up .env file and run "snow-flow auth login".'
        };
      }
      
      // 2. Check if we have access token (OAuth session)
      if (!credentials.accessToken) {
        return {
          success: false,
          error: 'OAuth authentication required. Run "snow-flow auth login" to authenticate.'
        };
      }
      
      // 3. Check if token is still valid
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        this.logger.info('🔄 Token expired, attempting refresh...');
        
        // Try to refresh token
        const refreshResult = await this.oauth.refreshAccessToken();
        if (!refreshResult.success) {
          return {
            success: false,
            error: 'OAuth token expired and refresh failed. Run "snow-flow auth login" to re-authenticate.'
          };
        }
        
        this.logger.info('✅ Token refreshed successfully');
      }
      
      // 4. Test actual ServiceNow connection
      this.logger.info('🔧 About to call testConnection', {
        clientType: this.client.constructor.name,
        clientMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)),
        hasTestConnection: typeof this.client.testConnection === 'function',
        hasMakeRequest: typeof this.client.makeRequest === 'function'
      });
      
      try {
        const connectionTest = await this.client.testConnection();
        if (!connectionTest.success) {
          return {
            success: false,
            error: `ServiceNow connection failed: ${connectionTest.error}`
          };
        }
      } catch (testError) {
        this.logger.error('🔧 testConnection error:', {
          error: testError.message,
          stack: testError.stack,
          clientInfo: {
            type: this.client.constructor.name,
            methods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.client))
          }
        });
        throw testError;
      }
      
      this.logger.info('✅ ServiceNow connection validated');
      return { success: true };
      
    } catch (error) {
      this.logger.error('ServiceNow connection validation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Check authentication with proper error handling (deprecated - use validateServiceNowConnection)
   */
  protected async checkAuthentication(): Promise<boolean> {
    const result = await this.validateServiceNowConnection();
    return result.success;
  }

  /**
   * Create standard authentication error response with detailed instructions
   */
  protected createAuthenticationError(error?: string): MCPToolResult {
    const errorText = error || 'Authentication validation failed';
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ ServiceNow Connection Failed

${errorText}

🔧 To fix this:

1. Ensure .env file has OAuth credentials:
   SNOW_INSTANCE=your-instance.service-now.com
   SNOW_CLIENT_ID=your_oauth_client_id
   SNOW_CLIENT_SECRET=your_oauth_client_secret

2. Authenticate with ServiceNow:
   snow-flow auth login

3. If you still get errors, run diagnostics:
   snow_auth_diagnostics()

💡 To get OAuth credentials:
   • ServiceNow: System OAuth > Application Registry > New OAuth Application
   • Redirect URI: http://localhost:3005/callback
   • Scopes: useraccount write admin`
        }
      ]
    };
  }

  /**
   * Smart artifact discovery - check for existing artifacts before creating new ones
   */
  protected async discoverExistingArtifacts(
    type: string, 
    name: string,
    searchTerms?: string[]
  ): Promise<{ found: boolean; artifacts: any[]; suggestions: string[] }> {
    try {
      this.logger.info(`🔍 Discovering existing ${type} artifacts...`);
      
      const suggestions: string[] = [];
      let artifacts: any[] = [];
      
      // Search by name
      const nameSearch = await this.client.searchRecords(
        this.getTableForType(type),
        `nameLIKE${name}`,
        5
      );
      
      if (nameSearch.success && nameSearch.data?.result?.length > 0) {
        artifacts = nameSearch.data.result;
        suggestions.push(`Found ${artifacts.length} existing ${type}(s) with similar names`);
        suggestions.push(`Consider reusing: ${artifacts.map(a => a.name).join(', ')}`);
      }
      
      // Search by additional terms if provided
      if (searchTerms && searchTerms.length > 0) {
        for (const term of searchTerms) {
          const termSearch = await this.client.searchRecords(
            this.getTableForType(type),
            `nameLIKE${term}^ORdescriptionLIKE${term}`,
            3
          );
          
          if (termSearch.success && termSearch.data?.result?.length > 0) {
            const newArtifacts = termSearch.data.result.filter(
              (new_artifact: any) => !artifacts.some(existing => existing.sys_id === new_artifact.sys_id)
            );
            artifacts.push(...newArtifacts);
            
            if (newArtifacts.length > 0) {
              suggestions.push(`Found ${newArtifacts.length} related ${type}(s) for "${term}"`);
            }
          }
        }
      }
      
      return {
        found: artifacts.length > 0,
        artifacts,
        suggestions
      };
      
    } catch (error) {
      this.logger.warn('Artifact discovery failed', error);
      return { found: false, artifacts: [], suggestions: [] };
    }
  }
  
  /**
   * Ensure active Update Set for tracking changes
   */
  protected async ensureUpdateSet(context: AgentContext, purpose?: string): Promise<string | null> {
    try {
      this.logger.info('📦 Ensuring active Update Set...');
      
      // Check current update set
      const currentUpdateSet = await this.client.getCurrentUpdateSet();
      
      if (currentUpdateSet.success && currentUpdateSet.data) {
        this.logger.info(`✅ Using existing Update Set: ${currentUpdateSet.data.name}`);
        return currentUpdateSet.data.sys_id;
      }
      
      // Create new update set
      const updateSetName = purpose 
        ? `Snow-Flow ${purpose} - ${new Date().toISOString().split('T')[0]}`
        : `Snow-Flow Changes - ${new Date().toISOString().split('T')[0]}`;
      
      this.logger.info(`📦 Creating new Update Set: ${updateSetName}`);
      
      const newUpdateSet = await this.client.createUpdateSet({
        name: updateSetName,
        description: `Automated changes from Snow-Flow Agent (${context.agent_id})`,
        state: 'in_progress'
      });
      
      if (newUpdateSet.success && newUpdateSet.data) {
        // Set it as current
        await this.client.setCurrentUpdateSet(newUpdateSet.data.sys_id);
        this.logger.info(`✅ Update Set created and activated: ${newUpdateSet.data.sys_id}`);
        return newUpdateSet.data.sys_id;
      }
      
      this.logger.warn('⚠️ Could not create Update Set, changes will not be tracked');
      return null;
      
    } catch (error) {
      this.logger.warn('Update Set creation failed', error);
      return null;
    }
  }
  
  /**
   * Automatically track artifact in Update Set
   */
  protected async trackArtifact(
    sysId: string, 
    type: string, 
    name: string,
    updateSetId?: string
  ): Promise<void> {
    try {
      if (!updateSetId) {
        this.logger.warn('No Update Set ID provided for artifact tracking');
        return;
      }
      
      this.logger.info(`📋 Tracking ${type} artifact: ${name} (${sysId})`);
      
      // Add artifact to update set tracking (this is handled automatically by ServiceNow 
      // when artifacts are created/modified, but we can log it for visibility)
      this.logger.info(`✅ Artifact tracked in Update Set: ${updateSetId}`);
      
    } catch (error) {
      this.logger.warn('Artifact tracking failed', error);
    }
  }
  
  /**
   * Get ServiceNow table name for artifact type
   */
  private getTableForType(type: string): string {
    const tableMap: { [key: string]: string } = {
      'widget': 'sp_widget',
      'flow': 'sys_hub_flow', 
      'subflow': 'sys_hub_flow',
      'action': 'sys_hub_action_type_definition',
      'script': 'sys_script_include',
      'business_rule': 'sys_script',
      'table': 'sys_db_object',
      'application': 'sys_app'
    };
    
    return tableMap[type] || 'sys_metadata';
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
   * Enhanced error handling with intelligent recovery strategies
   */
  protected async handleServiceNowError(
    error: any, 
    operation: string, 
    context: AgentContext,
    fallbackOptions?: {
      enableRetry?: boolean;
      enableScopeEscalation?: boolean; 
      enableManualSteps?: boolean;
    }
  ): Promise<MCPToolResult> {
    this.logger.error(`ServiceNow operation failed: ${operation}`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.extractErrorCode(errorMessage);
    
    // Categorize error and determine recovery strategy
    const errorCategory = this.categorizeError(errorMessage, errorCode);
    
    switch (errorCategory) {
      case 'authentication':
        return this.handleAuthenticationError(error, operation, context);
        
      case 'permissions':
        return this.handlePermissionError(error, operation, context, fallbackOptions);
        
      case 'network':
        return this.handleNetworkError(error, operation, context, fallbackOptions);
        
      case 'validation':
        return this.handleValidationError(error, operation, context);
        
      case 'scope':
        return this.handleScopeError(error, operation, context, fallbackOptions);
        
      default:
        return this.handleGenericError(error, operation, context, fallbackOptions);
    }
  }
  
  /**
   * Categorize error for appropriate recovery strategy
   */
  private categorizeError(errorMessage: string, errorCode?: string): string {
    const msgLower = errorMessage.toLowerCase();
    
    // Authentication errors
    if (msgLower.includes('unauthorized') || 
        msgLower.includes('invalid_grant') || 
        msgLower.includes('authentication') ||
        errorCode === '401' || errorCode === '403') {
      return 'authentication';
    }
    
    // Permission errors
    if (msgLower.includes('insufficient privileges') ||
        msgLower.includes('access denied') ||
        msgLower.includes('acl')) {
      return 'permissions';
    }
    
    // Network errors
    if (msgLower.includes('network') ||
        msgLower.includes('timeout') ||
        msgLower.includes('connection') ||
        msgLower.includes('econnrefused')) {
      return 'network';
    }
    
    // Validation errors
    if (msgLower.includes('invalid') ||
        msgLower.includes('required field') ||
        msgLower.includes('constraint') ||
        msgLower.includes('validation')) {
      return 'validation';
    }
    
    // Scope errors
    if (msgLower.includes('scope') ||
        msgLower.includes('application') ||
        msgLower.includes('global')) {
      return 'scope';
    }
    
    return 'generic';
  }
  
  /**
   * Handle authentication errors with automatic recovery
   */
  private async handleAuthenticationError(
    error: any, 
    operation: string, 
    context: AgentContext
  ): Promise<MCPToolResult> {
    this.logger.info('🔄 Attempting automatic authentication recovery...');
    
    // Try to refresh token automatically
    try {
      const refreshResult = await this.oauth.refreshAccessToken();
      if (refreshResult.success) {
        this.logger.info('✅ Token refreshed successfully, retry operation');
        
        // Store recovery in context for coordination
        await this.memory.updateSharedContext({
          session_id: context.session_id,
          context_key: `auth_recovery_${operation}`,
          context_value: JSON.stringify({
            recovery_action: 'token_refresh',
            timestamp: new Date().toISOString(),
            operation: operation
          }),
          created_by_agent: context.agent_id
        });
        
        return this.createSuccessResponse(
          'Authentication recovered - token refreshed',
          { 
            recovery_action: 'token_refresh',
            next_step: 'retry_operation',
            can_continue: true
          }
        );
      }
    } catch (refreshError) {
      this.logger.warn('Token refresh failed', refreshError);
    }
    
    // Request Queen intervention for authentication issues
    await this.requestQueenIntervention(context, {
      type: 'authentication_failure',
      priority: 'high',
      description: `Authentication failed for ${operation}`,
      attempted_solutions: ['token_refresh']
    });
    
    return this.createAuthenticationError(`Authentication failed during ${operation}. Automatic recovery failed.`);
  }
  
  /**
   * Handle permission errors with scope escalation
   */
  private async handlePermissionError(
    error: any, 
    operation: string, 
    context: AgentContext,
    fallbackOptions?: any
  ): Promise<MCPToolResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Try scope escalation if enabled
    if (fallbackOptions?.enableScopeEscalation) {
      this.logger.info('🔝 Attempting scope escalation...');
      
      try {
        // Try to escalate to global scope
        const escalationResult = await this.escalateToGlobalScope(operation, context);
        if (escalationResult.success) {
          return this.createSuccessResponse(
            'Permission issue resolved via scope escalation',
            escalationResult
          );
        }
      } catch (escalationError) {
        this.logger.warn('Scope escalation failed', escalationError);
      }
    }
    
    // Request permission elevation
    await this.requestQueenIntervention(context, {
      type: 'permission_elevation_needed',
      priority: 'high', 
      description: `Insufficient privileges for ${operation}: ${errorMessage}`,
      attempted_solutions: fallbackOptions?.enableScopeEscalation ? ['scope_escalation'] : []
    });
    
    return this.createErrorResponse(
      `Permission error during ${operation}`,
      {
        error: errorMessage,
        recovery_options: [
          '1. Request admin privileges from Queen Agent',
          '2. Try scope escalation to global',
          '3. Create manual Update Set instructions',
          '4. Use alternative deployment approach'
        ],
        next_steps: [
          'Contact ServiceNow admin for elevated permissions',
          'Or use snow_deploy with fallback_strategy="manual_steps"'
        ]
      }
    );
  }
  
  /**
   * Handle network errors with intelligent retry
   */
  private async handleNetworkError(
    error: any, 
    operation: string, 
    context: AgentContext,
    fallbackOptions?: any
  ): Promise<MCPToolResult> {
    if (fallbackOptions?.enableRetry) {
      this.logger.info('🔄 Network error - attempting retry with backoff...');
      
      // Implement exponential backoff retry
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        
        try {
          // Test connection
          const connectionTest = await this.client.testConnection();
          if (connectionTest.success) {
            this.logger.info(`✅ Network recovered after ${attempt} attempts`);
            
            return this.createSuccessResponse(
              'Network error recovered - connection restored',
              {
                recovery_action: 'network_retry',
                attempts: attempt,
                can_continue: true
              }
            );
          }
        } catch (retryError) {
          this.logger.warn(`Retry attempt ${attempt} failed`, retryError);
        }
      }
    }
    
    return this.createErrorResponse(
      `Network error during ${operation}`,
      {
        error: error instanceof Error ? error.message : String(error),
        recovery_options: [
          '1. Check ServiceNow instance availability',
          '2. Verify network connectivity', 
          '3. Check firewall/proxy settings',
          '4. Retry operation in a few minutes'
        ],
        next_steps: [
          'Wait for network recovery and retry',
          'Or check ServiceNow instance status'
        ]
      }
    );
  }
  
  /**
   * Handle validation errors with correction suggestions
   */
  private async handleValidationError(
    error: any, 
    operation: string, 
    context: AgentContext
  ): Promise<MCPToolResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Extract field information from validation error
    const fieldInfo = this.extractFieldInfoFromError(errorMessage);
    
    return this.createErrorResponse(
      `Validation error during ${operation}`,
      {
        error: errorMessage,
        field_issues: fieldInfo,
        recovery_options: [
          '1. Fix required fields and retry',
          '2. Check field constraints and formats',
          '3. Use snow_validate_deployment() first',
          '4. Review ServiceNow table schema'
        ],
        next_steps: [
          'Update configuration with correct field values',
          'Validate against ServiceNow table requirements'
        ]
      }
    );
  }
  
  /**
   * Handle scope errors with automatic fallback
   */
  private async handleScopeError(
    error: any, 
    operation: string, 
    context: AgentContext,
    fallbackOptions?: any
  ): Promise<MCPToolResult> {
    if (fallbackOptions?.enableScopeEscalation) {
      this.logger.info('🌐 Scope error - attempting global scope fallback...');
      
      try {
        const scopeFallback = await this.fallbackToGlobalScope(operation, context);
        if (scopeFallback.success) {
          return this.createSuccessResponse(
            'Scope error resolved - using global scope',
            scopeFallback
          );
        }
      } catch (scopeError) {
        this.logger.warn('Global scope fallback failed', scopeError);
      }
    }
    
    return this.createErrorResponse(
      `Scope error during ${operation}`,
      {
        error: error instanceof Error ? error.message : String(error),
        recovery_options: [
          '1. Deploy to global scope instead',
          '2. Create scoped application first',
          '3. Use manual deployment approach',
          '4. Check application scope permissions'
        ],
        next_steps: [
          'Try snow_deploy with scope_strategy="global"',
          'Or create application scope manually first'
        ]
      }
    );
  }
  
  /**
   * Handle generic errors with comprehensive guidance
   */
  private async handleGenericError(
    error: any, 
    operation: string, 
    context: AgentContext,
    fallbackOptions?: any
  ): Promise<MCPToolResult> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Generate contextual recovery options based on operation type
    const recoveryOptions = this.generateRecoveryOptions(operation, errorMessage);
    
    // Store error for pattern analysis
    await this.memory.updateSharedContext({
      session_id: context.session_id,
      context_key: `error_${operation}_${Date.now()}`,
      context_value: JSON.stringify({
        error: errorMessage,
        operation: operation,
        timestamp: new Date().toISOString(),
        recovery_attempted: Object.keys(fallbackOptions || {})
      }),
      created_by_agent: context.agent_id
    });
    
    return this.createErrorResponse(
      `Unexpected error during ${operation}`,
      {
        error: errorMessage,
        recovery_options: recoveryOptions,
        next_steps: [
          'Review error details and try alternative approach',
          'Use snow_deployment_debug() for diagnostics',
          'Contact Queen Agent for intervention'
        ],
        fallback_available: fallbackOptions?.enableManualSteps || false
      }
    );
  }
  
  /**
   * Helper methods for error handling
   */
  private extractErrorCode(errorMessage: string): string | undefined {
    const codeMatch = errorMessage.match(/(\d{3})/);
    return codeMatch ? codeMatch[1] : undefined;
  }
  
  private extractFieldInfoFromError(errorMessage: string): any {
    const fieldMatch = errorMessage.match(/field[:\s]+([a-z_]+)/i);
    const requiredMatch = errorMessage.match(/required/i);
    
    return {
      field: fieldMatch ? fieldMatch[1] : null,
      is_required: !!requiredMatch,
      raw_message: errorMessage
    };
  }
  
  private generateRecoveryOptions(operation: string, errorMessage: string): string[] {
    const options = [
      '1. Review error message and fix configuration',
      '2. Check ServiceNow instance status and permissions'
    ];
    
    if (operation.includes('deploy')) {
      options.push('3. Use snow_validate_deployment() before retrying');
      options.push('4. Try manual deployment with Update Set');
    }
    
    if (operation.includes('search') || operation.includes('find')) {
      options.push('3. Try alternative search terms');
      options.push('4. Use snow_comprehensive_search() for broader search');
    }
    
    options.push('5. Request Queen Agent intervention for complex issues');
    
    return options;
  }
  
  private async escalateToGlobalScope(operation: string, context: AgentContext): Promise<any> {
    // Implementation would escalate permissions or scope
    // This is a placeholder for actual escalation logic
    this.logger.info(`Attempting scope escalation for ${operation}`);
    return { success: false, reason: 'Escalation not implemented yet' };
  }
  
  private async fallbackToGlobalScope(operation: string, context: AgentContext): Promise<any> {
    // Implementation would fallback to global scope deployment
    this.logger.info(`Attempting global scope fallback for ${operation}`);
    return { success: false, reason: 'Global scope fallback not implemented yet' };
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
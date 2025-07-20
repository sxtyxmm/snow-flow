#!/usr/bin/env node
/**
 * ServiceNow API Client
 * Handles all ServiceNow API operations with OAuth authentication
 */

import axios, { AxiosInstance } from 'axios';
import { ServiceNowOAuth, ServiceNowCredentials } from './snow-oauth';
import { ActionTypeCache } from './action-type-cache';

export interface ServiceNowWidget {
  sys_id?: string;
  name: string;
  id: string;
  title: string;
  description: string;
  template: string;
  css: string;
  client_script: string;
  server_script: string;
  option_schema?: string;
  demo_data?: string;
  has_preview?: boolean;
  category: string;
}

export interface ServiceNowWorkflow {
  sys_id?: string;
  name: string;
  description: string;
  active: boolean;
  workflow_version: string;
  table?: string;
  condition?: string;
}

export interface ServiceNowApplication {
  sys_id?: string;
  name: string;
  scope: string;
  version: string;
  short_description: string;
  description: string;
  vendor: string;
  vendor_prefix: string;
  template?: string;
  logo?: string;
  active: boolean;
}

export interface ServiceNowAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  result?: T[];
}

export class ServiceNowClient {
  private client: AxiosInstance;
  private oauth: ServiceNowOAuth;
  private credentials: ServiceNowCredentials | null = null;
  private actionTypeCache: ActionTypeCache;

  constructor() {
    this.oauth = new ServiceNowOAuth();
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    this.actionTypeCache = new ActionTypeCache(this);
    
    // Add request interceptor for authentication with automatic token refresh
    this.client.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      
      // Get fresh access token (automatically refreshes if expired)
      const accessToken = await this.oauth.getAccessToken();
      
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        // Update local credentials with fresh token
        if (this.credentials) {
          this.credentials.accessToken = accessToken;
        }
      } else {
        console.warn('⚠️ No access token available - request may fail');
      }
      
      return config;
    });
    
    // Add response interceptor for error handling with retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Check if this is a 401 error and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log('🔄 Received 401 error, attempting token refresh...');
          const refreshResult = await this.oauth.refreshAccessToken();
          
          if (refreshResult.success && refreshResult.accessToken) {
            console.log('✅ Token refreshed successfully, retrying request...');
            
            // Update local credentials
            if (this.credentials) {
              this.credentials.accessToken = refreshResult.accessToken;
            }
            
            // Update the authorization header with new token
            originalRequest.headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
            
            // Retry the original request
            return this.client.request(originalRequest);
          } else {
            console.error('❌ Token refresh failed:', refreshResult.error);
            console.log('💡 Please run "snow-flow auth login" to re-authenticate');
          }
        }
        
        // Log other errors for debugging
        if (error.response?.status === 403) {
          console.error('❌ 403 Forbidden - Check ServiceNow permissions');
        } else if (error.response?.status >= 500) {
          console.error('❌ ServiceNow server error:', error.response.status);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Public getter for credentials
   */
  public get credentialsInstance(): ServiceNowCredentials | null {
    return this.credentials;
  }

  /**
   * Ensure we have valid authentication
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.credentials) {
      this.credentials = await this.oauth.loadCredentials();
    }
    
    if (!this.credentials) {
      console.error('❌ No credentials found');
      throw new Error('No ServiceNow credentials found. Please run "snow-flow auth login" first.');
    }
    
    // The OAuth service will handle token refresh automatically
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      console.error('❌ Authentication expired and refresh failed');
      throw new Error('ServiceNow authentication expired. Please run "snow-flow auth login" again.');
    }
  }

  /**
   * Proactively refresh token if it's about to expire
   * Useful for long-running operations
   */
  public async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const tokens = await this.oauth.loadTokens();
      if (!tokens) return false;
      
      const expiresAt = new Date(tokens.expiresAt);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      // If token expires in the next 5 minutes, refresh it
      if (expiresAt <= fiveMinutesFromNow) {
        console.log('🔄 Token expiring soon, refreshing proactively...');
        const refreshResult = await this.oauth.refreshAccessToken();
        
        if (refreshResult.success) {
          console.log('✅ Token refreshed proactively');
          if (this.credentials && refreshResult.accessToken) {
            this.credentials.accessToken = refreshResult.accessToken;
          }
          return true;
        } else {
          console.error('❌ Proactive token refresh failed');
          return false;
        }
      }
      
      return true; // Token still valid
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return false;
    }
  }

  /**
   * Get base URL for ServiceNow instance
   */
  private getBaseUrl(): string {
    if (!this.credentials) {
      throw new Error('No credentials available');
    }
    
    // Remove trailing slash from instance URL to prevent double slashes in API calls
    const instance = this.credentials.instance.replace(/\/$/, '');
    
    return `https://${instance}`;
  }

  /**
   * Sanitize a flow name for use as internal_name
   */
  private sanitizeInternalName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, '') // Remove special characters except underscores and spaces
      .replace(/\s+/g, '_')         // Replace spaces with underscores
      .replace(/_+/g, '_')           // Replace multiple underscores with single
      .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
      .substring(0, 80);             // Limit length to 80 characters
  }

  /**
   * Validate deployment permissions and diagnose authentication issues
   */
  async validateDeploymentPermissions(): Promise<ServiceNowAPIResponse<any>> {
    const diagnostics: any = {
      instance_url: this.getBaseUrl(),
      timestamp: new Date().toISOString(),
      tests: {}
    };

    const tests = [
      {
        name: 'Read Access',
        description: 'Test basic read permissions',
        test: async () => {
          const response = await this.client.get(`${this.getBaseUrl()}/api/now/table/sys_user?sysparm_limit=1`);
          return { success: true, data: response.data };
        }
      },
      {
        name: 'Widget Read Access',
        description: 'Test Service Portal widget read access',
        test: async () => {
          const response = await this.client.get(`${this.getBaseUrl()}/api/now/table/sp_widget?sysparm_limit=1`);
          return { success: true, data: response.data };
        }
      },
      {
        name: 'Update Set Access',
        description: 'Test Update Set management permissions',
        test: async () => {
          const response = await this.client.get(`${this.getBaseUrl()}/api/now/table/sys_update_set?sysparm_limit=1`);
          return { success: true, data: response.data };
        }
      },
      {
        name: 'Widget Write Test',
        description: 'Test Service Portal widget write permissions (dry run)',
        test: async () => {
          // Try to create a minimal test widget that we'll immediately delete
          const testWidget = {
            name: `test_widget_${Date.now()}`,
            id: `test_${Date.now()}`,
            title: 'Test Widget (Will be deleted)',
            template: '<div>Test</div>',
            css: '',
            script: '',
            option_schema: '[]'
          };
          
          try {
            const createResponse = await this.client.post(`${this.getBaseUrl()}/api/now/table/sp_widget`, testWidget);
            const sys_id = createResponse.data.result.sys_id;
            
            // Immediately delete the test widget
            await this.client.delete(`${this.getBaseUrl()}/api/now/table/sp_widget/${sys_id}`);
            
            return { success: true, data: { message: 'Widget write permissions confirmed' } };
          } catch (error) {
            throw error;
          }
        }
      },
      {
        name: 'User Role Check',
        description: 'Check user roles and permissions',
        test: async () => {
          const response = await this.client.get(`${this.getBaseUrl()}/api/now/table/sys_user_role?sysparm_query=user=javascript:gs.getUserID()`);
          return { success: true, data: { roles: response.data.result.map((r: any) => r.role?.display_value || r.role) } };
        }
      }
    ];

    for (const test of tests) {
      try {
        console.log(`Running diagnostic: ${test.name}...`);
        const result = await test.test();
        diagnostics.tests[test.name] = {
          status: '✅ PASS',
          description: test.description,
          result: result.data,
          error: null
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        diagnostics.tests[test.name] = {
          status: '❌ FAIL',
          description: test.description,
          result: null,
          error: errorMessage,
          http_status: this.extractHttpStatus(errorMessage)
        };
      }
    }

    // Analyze results
    const failedTests = Object.values(diagnostics.tests).filter((test: any) => test.status.includes('FAIL'));
    const passedTests = Object.values(diagnostics.tests).filter((test: any) => test.status.includes('PASS'));

    diagnostics.summary = {
      total_tests: tests.length,
      passed: passedTests.length,
      failed: failedTests.length,
      overall_status: failedTests.length === 0 ? '✅ ALL SYSTEMS GO' : '⚠️ ISSUES DETECTED'
    };

    // Generate recommendations
    diagnostics.recommendations = this.generateAuthRecommendations(diagnostics.tests);

    return {
      success: failedTests.length === 0,
      data: diagnostics,
      error: failedTests.length > 0 ? 'Some deployment permissions are missing' : null
    };
  }

  /**
   * Extract HTTP status from error message
   */
  private extractHttpStatus(errorMessage: string): number | null {
    const statusMatch = errorMessage.match(/status code (\d+)/i);
    return statusMatch ? parseInt(statusMatch[1], 10) : null;
  }

  /**
   * Generate authentication recommendations based on test results
   */
  private generateAuthRecommendations(tests: any): string[] {
    const recommendations = [];
    
    if (tests['Widget Write Test']?.status.includes('FAIL')) {
      const error = tests['Widget Write Test'].error;
      if (error.includes('403')) {
        recommendations.push('🔐 Widget deployment failed with 403 Forbidden. Check OAuth scopes: ensure \'useraccount\' and \'glide_system_administration\' scopes are enabled');
        recommendations.push('👤 Verify user has sp_portal_manager or admin role in ServiceNow');
        recommendations.push('🛡️ Check if instance has deployment restrictions for external applications');
      }
      if (error.includes('401')) {
        recommendations.push('🔑 Authentication failed. Re-run: snow-flow auth login');
      }
    }

    if (tests['User Role Check']?.status.includes('PASS')) {
      const roles = tests['User Role Check'].result?.roles || [];
      if (!roles.some((role: string) => role.includes('admin') || role.includes('sp_portal'))) {
        recommendations.push('⚠️ User lacks admin or portal management roles. Contact ServiceNow admin to assign appropriate roles');
      }
    }

    if (tests['Update Set Access']?.status.includes('FAIL')) {
      recommendations.push('📦 Update Set access failed. Ensure user has update_set_manager or admin role');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All authentication checks passed! Deployment should work correctly');
    }

    return recommendations;
  }

  /**
   * Test connection to ServiceNow
   */
  async testConnection(): Promise<ServiceNowAPIResponse<any>> {
    try {
      // Ensure we have credentials first
      await this.ensureAuthenticated();
      
      // Use the /api/now/v2/table/sys_user?sysparm_limit=1 endpoint to test
      // This is a more reliable endpoint that should work on all instances
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/v2/table/sys_user?sysparm_limit=1&sysparm_query=user_name=admin`
      );
      
      // If we can query users, we're connected
      return {
        success: true,
        data: {
          name: 'ServiceNow Instance',
          user_name: 'Connected',
          email: `${this.credentials?.instance}`,
          message: 'Connection successful'
        }
      };
    } catch (error) {
      // Try a simpler endpoint if the first one fails
      try {
        const response = await this.client.get(
          `${this.getBaseUrl()}/api/now/table/sys_properties?sysparm_limit=1`
        );
        
        return {
          success: true,
          data: {
            name: 'ServiceNow Instance',
            user_name: 'Connected',
            email: `${this.credentials?.instance}`,
            message: 'Connection successful (limited access)'
          }
        };
      } catch (secondError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  }

  /**
   * Create a new ServiceNow widget
   */
  async createWidget(widget: ServiceNowWidget): Promise<ServiceNowAPIResponse<ServiceNowWidget>> {
    try {
      console.log('🎨 Creating ServiceNow widget...');
      console.log(`📋 Widget Name: ${widget.name}`);
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sp_widget`,
        {
          name: widget.name,
          id: widget.id,
          title: widget.title,
          description: widget.description,
          template: widget.template,
          css: widget.css,
          client_script: widget.client_script,
          script: widget.server_script, // Service Portal uses 'script' not 'server_script'
          option_schema: widget.option_schema || '[]',
          demo_data: widget.demo_data || '{}',
          has_preview: widget.has_preview || false,
          category: widget.category || 'custom'
        }
      );
      
      console.log('✅ Widget created successfully!');
      console.log(`🆔 Widget ID: ${response.data.result.sys_id}`);
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create widget:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update an existing ServiceNow widget
   */
  async updateWidget(sysId: string, widget: Partial<ServiceNowWidget>): Promise<ServiceNowAPIResponse<ServiceNowWidget>> {
    try {
      console.log(`🔄 Updating widget ${sysId}...`);
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      // Map fields for Service Portal widget API
      const mappedWidget: any = { ...widget };
      if (mappedWidget.server_script !== undefined) {
        mappedWidget.script = mappedWidget.server_script;
        delete mappedWidget.server_script;
      }
      
      const response = await this.client.patch(
        `${this.getBaseUrl()}/api/now/table/sp_widget/${sysId}`,
        mappedWidget
      );
      
      console.log('✅ Widget updated successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to update widget:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get widget by ID
   */
  async getWidget(widgetId: string): Promise<ServiceNowAPIResponse<ServiceNowWidget>> {
    try {
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sp_widget?sysparm_query=id=${widgetId}`
      );
      
      if (response.data.result.length === 0) {
        return {
          success: false,
          error: 'Widget not found'
        };
      }
      
      return {
        success: true,
        data: response.data.result[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a new ServiceNow workflow
   */
  async createWorkflow(workflow: ServiceNowWorkflow): Promise<ServiceNowAPIResponse<ServiceNowWorkflow>> {
    try {
      console.log('🔄 Creating ServiceNow workflow...');
      console.log(`📋 Workflow Name: ${workflow.name}`);
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/wf_workflow`,
        {
          name: workflow.name,
          description: workflow.description,
          active: workflow.active,
          workflow_version: workflow.workflow_version,
          table: workflow.table || '',
          condition: workflow.condition || ''
        }
      );
      
      console.log('✅ Workflow created successfully!');
      console.log(`🆔 Workflow ID: ${response.data.result.sys_id}`);
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create workflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a new ServiceNow application
   */
  async createApplication(application: ServiceNowApplication): Promise<ServiceNowAPIResponse<ServiceNowApplication>> {
    try {
      console.log('🏗️ Creating ServiceNow application...');
      console.log(`📋 Application Name: ${application.name}`);
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_app`,
        {
          name: application.name,
          scope: application.scope,
          version: application.version,
          short_description: application.short_description,
          description: application.description,
          vendor: application.vendor,
          vendor_prefix: application.vendor_prefix,
          template: application.template || '',
          logo: application.logo || '',
          active: application.active
        }
      );
      
      console.log('✅ Application created successfully!');
      console.log(`🆔 Application ID: ${response.data.result.sys_id}`);
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Execute a ServiceNow script
   */
  async executeScript(script: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('⚡ Executing ServiceNow script...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_script_execution`,
        {
          script: script,
          type: 'server'
        }
      );
      
      console.log('✅ Script executed successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to execute script:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get all widgets
   */
  async getWidgets(): Promise<ServiceNowAPIResponse<ServiceNowWidget[]>> {
    try {
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sp_widget?sysparm_limit=100`
      );
      
      return {
        success: true,
        result: response.data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<ServiceNowAPIResponse<ServiceNowWorkflow[]>> {
    try {
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/wf_workflow?sysparm_limit=100`
      );
      
      return {
        success: true,
        result: response.data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get all applications
   */
  async getApplications(): Promise<ServiceNowAPIResponse<ServiceNowApplication[]>> {
    try {
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_app?sysparm_limit=100`
      );
      
      return {
        success: true,
        result: response.data.result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get default flow structure from ServiceNow
   */
  private async getFlowDefaults(): Promise<any> {
    try {
      // Try to get an existing flow to see the structure
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow?sysparm_limit=1&sysparm_fields=sys_class_name,type,status,access,source_ui,sys_domain,sys_domain_path`
      );
      
      if (response.data.result && response.data.result.length > 0) {
        const sample = response.data.result[0];
        return {
          sys_class_name: sample.sys_class_name || 'sys_hub_flow',
          type: sample.type || 'flow',
          status: sample.status || 'published',
          access: sample.access || 'public',
          source_ui: sample.source_ui || 'flow_designer',
          sys_domain: sample.sys_domain || 'global',
          sys_domain_path: sample.sys_domain_path || '/'
        };
      }
    } catch (error) {
      console.log('Could not fetch flow defaults, using minimal defaults');
    }
    
    // Return minimal defaults if we can't get from ServiceNow
    return {
      sys_class_name: 'sys_hub_flow',
      type: 'flow',
      status: 'published',
      access: 'public'
    };
  }

  /**
   * Get instance info
   */
  async getInstanceInfo(): Promise<ServiceNowAPIResponse<any>> {
    try {
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_properties?sysparm_query=name=instance.name`
      );
      
      return {
        success: true,
        data: response.data.result[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a specific record by sys_id
   */
  async getRecord(table: string, sys_id: string): Promise<any> {
    try {
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/${table}/${sys_id}`
      );
      return response.data.result;
    } catch (error) {
      console.error(`Failed to get record from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple records from a table
   */
  async getRecords(table: string, params?: any): Promise<ServiceNowAPIResponse<any[]>> {
    try {
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/${table}`,
        { params }
      );
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error(`Failed to get records from ${table}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Search records in a table using encoded query
   */
  async searchRecords(table: string, query: string, limit: number = 10): Promise<ServiceNowAPIResponse<any>> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/${table}`,
        {
          params: {
            sysparm_query: query,
            sysparm_limit: limit
          }
        }
      );
      return {
        success: true,
        data: {
          result: response.data.result || []
        }
      };
    } catch (error) {
      console.error(`Failed to search records in ${table}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a record in any ServiceNow table
   */
  async createRecord(table: string, data: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/${table}`,
        data
      );
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error(`Failed to create record in ${table}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update a record in any ServiceNow table
   */
  async updateRecord(table: string, sysId: string, data: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.client.patch(
        `${this.getBaseUrl()}/api/now/table/${table}/${sysId}`,
        data
      );
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error(`Failed to update record in ${table}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Delete a record from any ServiceNow table
   */
  async deleteRecord(table: string, sysId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      await this.ensureAuthenticated();
      
      const response = await this.client.delete(
        `${this.getBaseUrl()}/api/now/table/${table}/${sysId}`
      );
      
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error(`Failed to delete record from ${table}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Search for available flow actions in ServiceNow
   */
  async searchFlowActions(searchTerm: string): Promise<any> {
    try {
      console.log(`🔍 Searching for flow actions: ${searchTerm}`);
      
      // Search in sys_hub_action_type_base for available action types
      const results = await this.searchRecords(
        'sys_hub_action_type_base',
        `nameLIKE${searchTerm}^ORlabelLIKE${searchTerm}^ORdescriptionLIKE${searchTerm}`,
        20
      );
      
      // Also search in sys_hub_action_instance for existing actions
      const instanceResults = await this.searchRecords(
        'sys_hub_action_instance',
        `action_nameLIKE${searchTerm}^ORdescriptionLIKE${searchTerm}`,
        10
      );
      
      const actionTypes = results.success ? results.data.result : [];
      const actionInstances = instanceResults.success ? instanceResults.data.result : [];
      
      console.log(`✅ Found ${actionTypes.length} action types and ${actionInstances.length} action instances`);
      
      return {
        actionTypes,
        actionInstances
      };
    } catch (error) {
      console.error('Failed to search flow actions:', error);
      return { actionTypes: [], actionInstances: [] };
    }
  }

  /**
   * Get flow action details
   */
  async getFlowActionDetails(actionTypeId: string): Promise<any> {
    try {
      const actionType = await this.getRecord('sys_hub_action_type_base', actionTypeId);
      
      // Get input/output variables for this action type
      const inputs = await this.searchRecords(
        'sys_hub_action_input',
        `action_type=${actionTypeId}`,
        50
      );
      
      const outputs = await this.searchRecords(
        'sys_hub_action_output',
        `action_type=${actionTypeId}`,
        50
      );
      
      return {
        actionType,
        inputs: inputs.success ? inputs.data.result : [],
        outputs: outputs.success ? outputs.data.result : []
      };
    } catch (error) {
      console.error('Failed to get flow action details:', error);
      return null;
    }
  }

  /**
   * Create a simple Flow Designer flow
   * Focusing on basic flow creation with simple actions
   */
  async createFlow(flow: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔄 Creating Flow Designer flow...');
      console.log(`📋 Flow: ${flow.name}`);
      
      // First, ensure we have an Update Set
      const updateSetResult = await this.ensureUpdateSet();
      
      // Get dynamic defaults from ServiceNow
      const flowDefaults = await this.getFlowDefaults();
      
      // Build flow structure with dynamic defaults
      const flowData = {
        name: flow.name,
        description: flow.description || flow.name,
        active: flow.active !== false,
        internal_name: this.sanitizeInternalName(flow.name),
        category: flow.category || 'custom',
        run_as: 'user_who_triggers',
        // Merge with dynamic defaults from ServiceNow
        ...flowDefaults,
        // Override with any specific values from the flow parameter
        ...flow.overrides
      };
      
      // Create the main flow record
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow`,
        flowData
      );
      
      if (!response.data || !response.data.result) {
        throw new Error('No response data from flow creation');
      }
      
      const flowId = response.data.result.sys_id;
      console.log('✅ Flow created successfully!');
      console.log(`🆔 Flow sys_id: ${flowId}`);
      
      // Create trigger first
      let triggerInstanceId = null;
      let triggerLogicId = null;
      
      if (flow.trigger_type) {
        console.log('📋 Creating flow trigger...');
        try {
          const triggerResult = await this.createFlowTrigger(flowId, {
            type: flow.trigger_type,
            table: flow.table || 'incident',
            condition: flow.trigger_condition || flow.condition || ''
          });
          triggerInstanceId = triggerResult.sys_id;
          
          // Create trigger logic entry
          console.log('📋 Creating trigger logic...');
          const triggerLogic = await this.createFlowLogic(flowId, {
            name: 'Trigger',
            type: 'trigger',
            order: 0,
            instance: triggerInstanceId
          });
          triggerLogicId = triggerLogic.sys_id;
        } catch (triggerError) {
          console.error('Failed to create trigger:', triggerError);
        }
      }
      
      // Create flow actions with logic entries
      const actionLogicIds: string[] = [];
      
      if (flow.actions && Array.isArray(flow.actions)) {
        console.log(`📋 Creating ${flow.actions.length} flow actions...`);
        
        for (let i = 0; i < flow.actions.length; i++) {
          const action = flow.actions[i];
          try {
            const actionResult = await this.createFlowActionInstance(flowId, action, (i + 1) * 100);
            
            // Create action logic entry
            const actionLogic = await this.createFlowLogic(flowId, {
              name: action.name,
              type: 'action',
              order: (i + 1) * 100,
              instance: actionResult.sys_id
            });
            actionLogicIds.push(actionLogic.sys_id);
          } catch (actionError) {
            console.error(`Failed to create action ${action.name}:`, actionError);
          }
        }
      }
      
      // Create connections between trigger and actions
      if (triggerLogicId && actionLogicIds.length > 0) {
        console.log('📋 Creating flow connections...');
        try {
          // Connect trigger to first action
          await this.createFlowConnection(flowId, triggerLogicId, actionLogicIds[0]);
          
          // Connect actions in sequence
          for (let i = 0; i < actionLogicIds.length - 1; i++) {
            await this.createFlowConnection(flowId, actionLogicIds[i], actionLogicIds[i + 1]);
          }
        } catch (connError) {
          console.error('Failed to create connections:', connError);
        }
      }
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a Subflow in ServiceNow
   */
  async createSubflow(subflow: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔄 Creating Subflow...');
      console.log(`📋 Subflow: ${subflow.name}`);
      
      // Ensure Update Set
      const updateSetResult = await this.ensureUpdateSet();
      
      // Create subflow with inputs/outputs
      const subflowData = {
        name: subflow.name,
        description: subflow.description || `Subflow: ${subflow.name}`,
        active: subflow.active !== false,
        internal_name: this.sanitizeInternalName(subflow.name),
        category: subflow.category || 'custom',
        type: 'subflow',
        inputs: JSON.stringify(subflow.inputs || []),
        outputs: JSON.stringify(subflow.outputs || []),
        run_as: 'user_who_calls'
      };

      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow`,
        subflowData
      );

      const subflowId = response.data.result.sys_id;

      // Process flow definition if provided
      if (subflow.flow_definition) {
        const definition = typeof subflow.flow_definition === 'string' 
          ? JSON.parse(subflow.flow_definition) 
          : subflow.flow_definition;

        // Create activities for the subflow
        if (definition.activities) {
          for (let i = 0; i < definition.activities.length; i++) {
            const activity = definition.activities[i];
            await this.createFlowActionInstance(subflowId, activity, (i + 1) * 100);
          }
        }
      }

      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create subflow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a Flow Action (reusable component)
   */
  async createFlowAction(action: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('⚡ Creating Flow Action...');
      console.log(`📋 Action: ${action.name}`);
      
      // Ensure Update Set
      const updateSetResult = await this.ensureUpdateSet();
      
      // Create action with inputs/outputs
      const actionData = {
        name: action.name,
        description: action.description || `Action: ${action.name}`,
        active: action.active !== false,
        internal_name: this.sanitizeInternalName(action.name),
        category: action.category || 'custom',
        type: 'action',
        action_type: action.action_type || 'custom',
        inputs: JSON.stringify(action.inputs || []),
        outputs: JSON.stringify(action.outputs || []),
        script: action.script || '',
        accessible_from: 'all' // Make available to all flows
      };

      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_action_type_definition`,
        actionData
      );

      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create flow action:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }


  /**
   * Create a flow action using discovered ServiceNow action types (private method)
   */
  private async createFlowActionPrivate(flowId: string, action: any, order: number): Promise<any> {
    try {
      console.log(`Creating flow action: ${action.type} - ${action.name}`);
      
      // If we have a discovered action type, use it
      let actionTypeId = action.action_type_id;
      
      // If no specific action type provided, search for one
      if (!actionTypeId) {
        const searchResults = await this.searchFlowActions(action.type);
        if (searchResults.actionTypes && searchResults.actionTypes.length > 0) {
          actionTypeId = searchResults.actionTypes[0].sys_id;
          console.log(`📋 Using discovered action type: ${searchResults.actionTypes[0].name}`);
        } else {
          // Fallback to common action types
          const fallbackMap: any = {
            'notification': 'com.glideapp.servicenow_common.send_email',
            'field_update': 'com.glideapp.servicenow_common.update_record',
            'create_task': 'com.glideapp.servicenow_common.create_record',
            'log': 'com.glideapp.servicenow_common.log_message',
            'wait': 'com.glideapp.servicenow_common.timer',
            'approval': 'com.glideapp.servicenow_common.approval'
          };
          actionTypeId = fallbackMap[action.type] || 'com.glideapp.servicenow_common.script';
          console.log(`📋 Using fallback action type: ${actionTypeId}`);
        }
      }
      
      // Get action details to understand inputs/outputs
      const actionDetails = await this.getFlowActionDetails(actionTypeId);
      
      // Build inputs based on action details
      const inputs = this.buildActionInputs(action, actionDetails);
      
      const actionData = {
        flow: flowId,
        action_name: action.name,
        action_type: actionTypeId,
        order: order * 100,
        active: true,
        // Use proper ServiceNow action configuration
        inputs: JSON.stringify(inputs),
        configuration: this.buildActionConfiguration(action)
      };
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_action_instance`,
        actionData
      );
      
      console.log(`✅ Flow action created: ${action.name}`);
      return response.data.result;
    } catch (error) {
      console.error('Failed to create flow action:', error);
      throw error;
    }
  }

  /**
   * Build action inputs based on action details
   */
  private buildActionInputs(action: any, actionDetails: any): any {
    const inputs: any = {};
    
    if (!actionDetails || !actionDetails.inputs) {
      return inputs;
    }
    
    // Map action properties to ServiceNow input variables
    for (const input of actionDetails.inputs) {
      const inputName = input.name;
      
      switch (action.type) {
        case 'notification':
          if (inputName === 'to' || inputName === 'recipient') {
            inputs[inputName] = action.to || '${trigger.record.assigned_to}';
          } else if (inputName === 'subject') {
            inputs[inputName] = action.subject || 'Flow Notification';
          } else if (inputName === 'message' || inputName === 'body') {
            inputs[inputName] = action.message || 'Flow action executed';
          }
          break;
          
        case 'field_update':
          if (inputName === 'record' || inputName === 'table') {
            inputs[inputName] = '${trigger.record}';
          } else if (inputName === 'field') {
            inputs[inputName] = action.field;
          } else if (inputName === 'value') {
            inputs[inputName] = action.value;
          }
          break;
          
        case 'create_task':
          if (inputName === 'table') {
            inputs[inputName] = action.target_table || 'task';
          } else if (inputName === 'fields') {
            inputs[inputName] = action.fields || {};
          }
          break;
          
        case 'log':
          if (inputName === 'message') {
            inputs[inputName] = action.message || 'Flow action executed';
          } else if (inputName === 'level') {
            inputs[inputName] = action.level || 'info';
          }
          break;
          
        case 'wait':
          if (inputName === 'duration') {
            inputs[inputName] = action.duration || 300;
          }
          break;
          
        case 'approval':
          if (inputName === 'approvers') {
            inputs[inputName] = action.approvers || '${trigger.record.assigned_to.manager}';
          }
          break;
      }
    }
    
    return inputs;
  }

  /**
   * Build simple action configuration
   */
  private buildActionConfiguration(action: any): string {
    const config: any = {
      name: action.name,
      type: action.type
    };
    
    switch (action.type) {
      case 'notification':
        config.to = action.to || 'assigned_to';
        config.subject = action.subject || 'Flow Notification';
        config.body = action.message || 'A flow action has been triggered.';
        break;
        
      case 'field_update':
        config.field = action.field;
        config.value = action.value;
        break;
        
      case 'create_task':
        config.table = action.target_table || 'task';
        config.fields = action.fields || {};
        break;
        
      case 'log':
        config.message = action.message || 'Flow action executed';
        config.level = action.level || 'info';
        break;
        
      case 'wait':
        config.duration = action.duration || 300; // 5 minutes default
        break;
        
      case 'approval':
        config.approvers = action.approvers || 'assigned_to.manager';
        break;
        
      default:
        config.script = action.script || '// Custom action';
    }
    
    return JSON.stringify(config);
  }

  /**
   * Create a flow trigger instance
   */
  private async createFlowTrigger(flowId: string, trigger: any): Promise<any> {
    try {
      // Get trigger type from cache
      let triggerType = await this.actionTypeCache.getTriggerType(trigger.type);
      
      if (!triggerType) {
        console.warn(`Trigger type '${trigger.type}' not found in cache, using default`);
        // Fallback to 'Created' trigger if not found
        triggerType = await this.actionTypeCache.getTriggerType('Created');
        if (!triggerType) {
          throw new Error('Could not find any trigger types');
        }
      }
      
      const triggerTypeId = triggerType.sys_id;
      
      const triggerData = {
        flow: flowId,
        trigger_type: triggerTypeId,
        table_name: trigger.table || 'incident',
        condition: trigger.condition || '',
        order: 0,
        active: true
      };
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_trigger_instance`,
        triggerData
      );
      
      console.log('✅ Trigger created successfully');
      return response.data.result;
    } catch (error) {
      console.error('Failed to create flow trigger:', error);
      throw error;
    }
  }

  /**
   * Create a flow action instance using simplified approach
   */
  private async createFlowActionInstance(flowId: string, action: any, order: number): Promise<any> {
    try {
      console.log(`Creating action instance: ${action.name}`);
      
      // Map action types to search terms
      const actionSearchMap: any = {
        'notification': 'Send Email',
        'email': 'Send Email',
        'field_update': 'Update Record',
        'create_task': 'Create Record',
        'create_record': 'Create Record',
        'wait': 'Wait',
        'approval': 'Approval',
        'log': 'Log'
      };
      
      const searchTerm = actionSearchMap[action.type] || action.type;
      let actionType = await this.actionTypeCache.getActionType(searchTerm);
      
      if (!actionType) {
        console.warn(`Action type '${searchTerm}' not found in cache, using Script action`);
        // Fallback to Script action if not found
        actionType = await this.actionTypeCache.getActionType('Script');
        if (!actionType) {
          throw new Error('Could not find any action types');
        }
      }
      
      const actionTypeId = actionType.sys_id;
      
      // Build inputs based on action type
      let inputs = {};
      switch (action.type) {
        case 'notification':
        case 'email':
          inputs = {
            email_to: action.to || '${trigger.assigned_to.email}',
            email_subject: action.subject || 'Notification',
            email_body: action.message || 'Notification from flow'
          };
          break;
        case 'field_update':
          inputs = {
            table: action.table || 'current',
            field: action.field || 'state',
            value: action.value || ''
          };
          break;
        case 'create_task':
        case 'create_record':
          inputs = {
            table: action.target_table || 'task',
            field_values: JSON.stringify({
              short_description: action.short_description || 'Task from flow',
              assigned_to: action.assigned_to || '${trigger.assigned_to}'
            })
          };
          break;
        case 'wait':
          inputs = {
            duration: action.duration || 300,
            unit: 'seconds'
          };
          break;
        case 'approval':
          inputs = {
            approvers: action.approvers || '${trigger.assigned_to.manager}',
            approval_field: 'approval'
          };
          break;
        default:
          inputs = action.inputs || {};
      }
      
      const actionData = {
        flow: flowId,
        action_name: action.name,
        action_type: actionTypeId,
        order: order,
        active: true,
        inputs: JSON.stringify(inputs)
      };
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_action_instance`,
        actionData
      );
      
      console.log(`✅ Action created: ${action.name}`);
      return response.data.result;
    } catch (error) {
      console.error(`Failed to create action instance ${action.name}:`, error);
      throw error;
    }
  }

  /**
   * Create a flow operation (activity) for a Flow Designer flow
   */
  private async createFlowOperation(flowId: string, operation: any): Promise<any> {
    try {
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow_operation`,
        {
          flow: flowId,
          name: operation.name,
          type: operation.type || 'core',
          action_type: operation.action_type || 'script',
          order: operation.order || 100,
          // Operation-specific configuration
          configuration: JSON.stringify({
            script: operation.script,
            inputs: operation.inputs || {},
            outputs: operation.outputs || {},
            artifact_reference: operation.artifact_reference
          })
        }
      );
      
      return response.data.result;
    } catch (error) {
      console.error('Failed to create flow operation:', error);
      throw error;
    }
  }

  /**
   * Create a Script Include
   */
  async createScriptInclude(scriptInclude: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📝 Creating Script Include...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_script_include`,
        {
          name: scriptInclude.name,
          api_name: scriptInclude.api_name,
          description: scriptInclude.description,
          script: scriptInclude.script,
          active: scriptInclude.active,
          access: scriptInclude.access || 'public'
        }
      );
      
      console.log('✅ Script Include created successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create script include:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a Business Rule
   */
  async createBusinessRule(businessRule: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📋 Creating Business Rule...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_script`,
        {
          name: businessRule.name,
          collection: businessRule.table,
          when: businessRule.when,
          condition: businessRule.condition,
          script: businessRule.script,
          description: businessRule.description,
          active: businessRule.active,
          order: businessRule.order || 100
        }
      );
      
      console.log('✅ Business Rule created successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create business rule:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a Table
   */
  async createTable(table: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🗄️ Creating Table...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_db_object`,
        {
          name: table.name,
          label: table.label,
          extends_table: table.extends_table || 'sys_metadata',
          is_extendable: table.is_extendable !== false,
          access: table.access || 'public',
          create_access_controls: table.create_access_controls !== false
        }
      );
      
      console.log('✅ Table created successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create table:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a Table Field
   */
  async createTableField(field: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📊 Creating Table Field...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_dictionary`,
        {
          name: `${field.table}.${field.element}`,
          element: field.element,
          column_label: field.column_label,
          internal_type: field.internal_type || 'string',
          max_length: field.max_length || 255,
          active: true
        }
      );
      
      console.log('✅ Table Field created successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create table field:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a new Update Set
   */
  async createUpdateSet(updateSet: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📦 Creating Update Set...');
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_update_set`,
        {
          name: updateSet.name,
          description: updateSet.description,
          release_date: updateSet.release_date,
          state: updateSet.state || 'in_progress',
          application: updateSet.application || 'global'
        }
      );
      
      console.log('✅ Update Set created successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to create Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Set current Update Set for the session
   */
  async setCurrentUpdateSet(updateSetId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔄 Setting current Update Set...');
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      // Use the sys_user_preference table to set the current update set
      // First, check if a preference already exists
      const existingPref = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_user_preference`,
        {
          params: {
            sysparm_query: 'name=sys_update_set^user=javascript:gs.getUserID()',
            sysparm_limit: 1
          }
        }
      );
      
      let response;
      if (existingPref.data.result && existingPref.data.result.length > 0) {
        // Update existing preference
        response = await this.client.patch(
          `${this.getBaseUrl()}/api/now/table/sys_user_preference/${existingPref.data.result[0].sys_id}`,
          {
            value: updateSetId
          }
        );
      } else {
        // Create new preference
        response = await this.client.post(
          `${this.getBaseUrl()}/api/now/table/sys_user_preference`,
          {
            name: 'sys_update_set',
            value: updateSetId,
            user: 'javascript:gs.getUserID()'
          }
        );
      }
      
      console.log('✅ Current Update Set changed successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to set current Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get current Update Set
   */
  async getCurrentUpdateSet(): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📋 Getting current Update Set...');
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      // Try to get the current update set using sys_user_preference table
      // This is more reliable than the UI API
      try {
        const response = await this.client.get(
          `${this.getBaseUrl()}/api/now/table/sys_user_preference`,
          {
            params: {
              sysparm_query: 'name=sys_update_set^user=javascript:gs.getUserID()',
              sysparm_limit: 1
            }
          }
        );
        
        if (response.data.result && response.data.result.length > 0) {
          const updateSetId = response.data.result[0].value;
          
          // Get Update Set details
          const updateSetResponse = await this.client.get(
            `${this.getBaseUrl()}/api/now/table/sys_update_set/${updateSetId}`
          );
          
          return {
            success: true,
            data: updateSetResponse.data.result
          };
        }
      } catch (prefError) {
        console.log('⚠️ User preference lookup failed, trying fallback...');
      }
      
      // Fallback: Get the most recent in-progress update set for the current user
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_update_set`,
        {
          params: {
            sysparm_query: 'state=in_progress^sys_created_by=javascript:gs.getUserName()',
            sysparm_orderby: 'sys_created_on',
            sysparm_limit: 1
          }
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        return {
          success: true,
          data: response.data.result[0]
        };
      }
      
      return {
        success: false,
        error: 'No current Update Set found'
      };
    } catch (error) {
      console.error('❌ Failed to get current Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get Update Set by ID
   */
  async getUpdateSet(updateSetId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log(`📋 Getting Update Set ${updateSetId}...`);
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_update_set/${updateSetId}`
      );
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to get Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * List Update Sets
   */
  async listUpdateSets(options: any): Promise<ServiceNowAPIResponse<any[]>> {
    try {
      console.log('📋 Listing Update Sets...');
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      let query = 'sys_created_by=javascript:gs.getUserName()';
      if (options.state) {
        query += `^state=${options.state}`;
      }
      
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_update_set`,
        {
          params: {
            sysparm_query: query,
            sysparm_limit: options.limit || 10,
            sysparm_orderby: 'sys_created_on^DESC'
          }
        }
      );
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to list Update Sets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Complete an Update Set
   */
  async completeUpdateSet(updateSetId: string, notes?: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('✅ Completing Update Set...');
      
      // Ensure we have credentials before making the API call
      await this.ensureAuthenticated();
      
      const response = await this.client.patch(
        `${this.getBaseUrl()}/api/now/table/sys_update_set/${updateSetId}`,
        {
          state: 'complete',
          description: notes ? `${notes}\n\nCompleted: ${new Date().toISOString()}` : undefined
        }
      );
      
      console.log('✅ Update Set completed successfully!');
      
      return {
        success: true,
        data: response.data.result
      };
    } catch (error) {
      console.error('❌ Failed to complete Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Activate an Update Set by setting it as current
   */
  async activateUpdateSet(updateSetId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔄 Activating Update Set...');
      
      // Set the update set as current
      const result = await this.setCurrentUpdateSet(updateSetId);
      
      if (result.success) {
        // Also ensure the update set is in progress state
        const updateResponse = await this.client.patch(
          `${this.getBaseUrl()}/api/now/table/sys_update_set/${updateSetId}`,
          {
            state: 'in_progress'
          }
        );
        
        console.log('✅ Update Set activated successfully!');
        
        return {
          success: true,
          data: updateResponse.data.result
        };
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to activate Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Preview Update Set changes
   */
  async previewUpdateSet(updateSetId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔍 Previewing Update Set changes...');
      
      // Get Update Set details
      const updateSetResponse = await this.getUpdateSet(updateSetId);
      if (!updateSetResponse.success) {
        return updateSetResponse;
      }
      
      // Get Update Set changes
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_update_xml`,
        {
          params: {
            sysparm_query: `update_set=${updateSetId}`,
            sysparm_limit: 1000
          }
        }
      );
      
      return {
        success: true,
        data: {
          ...updateSetResponse.data,
          changes: response.data.result
        }
      };
    } catch (error) {
      console.error('❌ Failed to preview Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Export Update Set as XML
   */
  /**
   * Ensure we have an active Update Set for tracking changes
   */
  async ensureUpdateSet(): Promise<ServiceNowAPIResponse<any>> {
    try {
      // Check if we have a current Update Set
      const currentUpdateSet = await this.getCurrentUpdateSet();
      
      if (currentUpdateSet.success && currentUpdateSet.data) {
        console.log(`📦 Using existing Update Set: ${currentUpdateSet.data.name}`);
        return currentUpdateSet;
      }
      
      // Create a new Update Set if none exists
      const updateSetName = `Snow-Flow Changes ${new Date().toISOString().split('T')[0]}`;
      console.log(`📦 Creating new Update Set: ${updateSetName}`);
      
      const newUpdateSet = await this.createUpdateSet({
        name: updateSetName,
        description: 'Automated changes from Snow-Flow MCP',
        state: 'in_progress'
      });
      
      if (newUpdateSet.success && newUpdateSet.data) {
        // Set it as current
        await this.setCurrentUpdateSet(newUpdateSet.data.sys_id);
        return newUpdateSet;
      }
      
      // If Update Set creation fails, continue without it
      console.warn('⚠️ Could not create Update Set, changes will not be tracked');
      return { success: false, error: 'Update Set creation failed' };
      
    } catch (error) {
      console.warn('⚠️ Update Set management failed:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async exportUpdateSet(updateSetId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('📤 Exporting Update Set...');
      
      // Get Update Set details first
      const updateSetResponse = await this.getUpdateSet(updateSetId);
      if (!updateSetResponse.success) {
        return updateSetResponse;
      }
      
      // Use the unload processor to export
      const response = await this.client.get(
        `${this.getBaseUrl()}/unload.do`,
        {
          params: {
            sysparm_sys_id: updateSetId,
            sysparm_table: 'sys_update_set',
            sysparm_unload_format: 'xml'
          },
          responseType: 'text'
        }
      );
      
      return {
        success: true,
        data: {
          name: updateSetResponse.data.name,
          xml: response.data,
          change_count: updateSetResponse.data.update_count || 0
        }
      };
    } catch (error) {
      console.error('❌ Failed to export Update Set:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Debug flow structure - check what's missing for Flow Designer
   */
  async debugFlow(flowId: string): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔍 Debugging flow structure...');
      
      // Get the flow record
      const flowResponse = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow/${flowId}`
      );
      
      if (!flowResponse.data.result) {
        return { success: false, error: 'Flow not found' };
      }
      
      const flow = flowResponse.data.result;
      
      // Check for sys_hub_flow_logic entries
      const logicResponse = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow_logic?sysparm_query=flow=${flowId}`
      );
      
      // Check for trigger instances
      const triggerResponse = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_hub_trigger_instance?sysparm_query=flow=${flowId}`
      );
      
      // Check for action instances
      const actionResponse = await this.client.get(
        `${this.getBaseUrl()}/api/now/table/sys_hub_action_instance?sysparm_query=flow=${flowId}`
      );
      
      return {
        success: true,
        data: {
          flow: {
            sys_id: flow.sys_id,
            name: flow.name,
            internal_name: flow.internal_name,
            status: flow.status,
            type: flow.type,
            sys_class_name: flow.sys_class_name,
            missing_fields: []
          },
          logic_count: logicResponse.data.result.length,
          trigger_count: triggerResponse.data.result.length,
          action_count: actionResponse.data.result.length,
          logic_entries: logicResponse.data.result,
          triggers: triggerResponse.data.result,
          actions: actionResponse.data.result
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create a flow logic entry (visual representation in Flow Designer)
   */
  private async createFlowLogic(flowId: string, logic: any): Promise<any> {
    try {
      const logicData = {
        flow: flowId,
        name: logic.name,
        type: logic.type,
        order: logic.order,
        active: true,
        instance: logic.instance
      };
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow_logic`,
        logicData
      );
      
      return response.data.result;
    } catch (error) {
      console.error('Failed to create flow logic:', error);
      throw error;
    }
  }

  /**
   * Create a connection between flow logic elements
   */
  private async createFlowConnection(flowId: string, fromId: string, toId: string): Promise<any> {
    try {
      // In ServiceNow, connections are stored as part of the flow logic
      // We need to update the 'from' element to point to the 'to' element
      const connectionData = {
        next: toId
      };
      
      const response = await this.client.patch(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow_logic/${fromId}`,
        connectionData
      );
      
      return response.data.result;
    } catch (error) {
      console.error('Failed to create flow connection:', error);
      // Don't throw - connections might work differently in some versions
      return null;
    }
  }

  /**
   * Generic GET method for ServiceNow API calls
   */
  async get(endpoint: string, params?: any): Promise<any> {
    try {
      await this.ensureAuthenticated();
      const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
      const response = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic POST method for ServiceNow API calls
   */
  async post(endpoint: string, data?: any): Promise<any> {
    try {
      await this.ensureAuthenticated();
      const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PUT method for ServiceNow API calls
   */
  async put(endpoint: string, data?: any): Promise<any> {
    try {
      await this.ensureAuthenticated();
      const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
      const response = await this.client.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PATCH method for ServiceNow API calls
   */
  async patch(endpoint: string, data?: any): Promise<any> {
    try {
      await this.ensureAuthenticated();
      const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
      const response = await this.client.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic DELETE method for ServiceNow API calls
   */
  async delete(endpoint: string): Promise<any> {
    try {
      await this.ensureAuthenticated();
      const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
      const response = await this.client.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
#!/usr/bin/env node
/**
 * ServiceNow API Client
 * Handles all ServiceNow API operations with OAuth authentication
 */

import axios, { AxiosInstance } from 'axios';
import { ServiceNowOAuth, ServiceNowCredentials } from './snow-oauth';

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

  constructor() {
    this.oauth = new ServiceNowOAuth();
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      await this.ensureAuthenticated();
      
      if (this.credentials?.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
      }
      
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.log('🔄 Access token expired, refreshing...');
          const refreshResult = await this.oauth.refreshAccessToken();
          if (refreshResult.success && refreshResult.accessToken) {
            // Update the authorization header with new token
            error.config.headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
            // Retry the original request
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Ensure we have valid authentication
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.credentials) {
      this.credentials = await this.oauth.loadCredentials();
    }
    
    if (!this.credentials) {
      throw new Error('No ServiceNow credentials found. Please run "snow-flow auth login" first.');
    }
    
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      throw new Error('ServiceNow authentication expired. Please run "snow-flow auth login" again.');
    }
  }

  /**
   * Get base URL for ServiceNow instance
   */
  private getBaseUrl(): string {
    if (!this.credentials) {
      throw new Error('No credentials available');
    }
    return `https://${this.credentials.instance}`;
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
          server_script: widget.server_script,
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
      
      const response = await this.client.patch(
        `${this.getBaseUrl()}/api/now/table/sp_widget/${sysId}`,
        widget
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
   * Search records in a table using encoded query
   */
  async searchRecords(table: string, query: string, limit: number = 10): Promise<any[]> {
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
      return response.data.result || [];
    } catch (error) {
      console.error(`Failed to search records in ${table}:`, error);
      return [];
    }
  }

  /**
   * Create a Flow Designer flow
   */
  async createFlow(flow: any): Promise<ServiceNowAPIResponse<any>> {
    try {
      console.log('🔄 Creating Flow Designer flow...');
      
      const response = await this.client.post(
        `${this.getBaseUrl()}/api/now/table/sys_hub_flow`,
        {
          name: flow.name,
          description: flow.description,
          active: flow.active,
          table_name: flow.table,
          trigger_type: flow.trigger_type,
          trigger_condition: flow.condition,
          definition: flow.flow_definition,
          category: flow.category,
          linked_artifacts: flow.artifact_references
        }
      );
      
      console.log('✅ Flow created successfully!');
      
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
      
      // Use the preference API to set the current update set
      const response = await this.client.put(
        `${this.getBaseUrl()}/api/now/ui/user_preference`,
        {
          name: 'sys_update_set',
          value: updateSetId,
          user: 'current'
        }
      );
      
      console.log('✅ Current Update Set changed successfully!');
      
      return {
        success: true,
        data: { update_set_id: updateSetId }
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
      
      // Get the current update set preference
      const response = await this.client.get(
        `${this.getBaseUrl()}/api/now/ui/user_preference/sys_update_set`
      );
      
      if (response.data.result && response.data.result.value) {
        // Get Update Set details
        const updateSetResponse = await this.client.get(
          `${this.getBaseUrl()}/api/now/table/sys_update_set/${response.data.result.value}`
        );
        
        return {
          success: true,
          data: updateSetResponse.data.result
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
}
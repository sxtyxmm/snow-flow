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
}
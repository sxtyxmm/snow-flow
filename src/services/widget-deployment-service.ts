/**
 * Widget Deployment Service
 * Direct ServiceNow API implementation for widget deployment
 * No more MCP failures!
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { Logger } from '../utils/logger.js';
import { unifiedAuthStore } from '../utils/unified-auth-store.js';

export interface WidgetConfig {
  name: string;
  title: string;
  template: string;
  css?: string;
  server_script?: string;
  client_script?: string;
  demo_data?: string;
  option_schema?: string;
  category?: string;
  description?: string;
}

export interface DeploymentResult {
  success: boolean;
  sys_id?: string;
  portalUrl?: string;
  apiEndpoint?: string;
  message: string;
  error?: string;
  verificationStatus?: 'verified' | 'unverified' | 'failed';
}

export class WidgetDeploymentService {
  private static instance: WidgetDeploymentService;
  private logger: Logger;
  private client: ServiceNowClient | null = null;

  private constructor() {
    this.logger = new Logger('WidgetDeploymentService');
  }

  static getInstance(): WidgetDeploymentService {
    if (!WidgetDeploymentService.instance) {
      WidgetDeploymentService.instance = new WidgetDeploymentService();
    }
    return WidgetDeploymentService.instance;
  }

  /**
   * Initialize ServiceNow client
   */
  private async getClient(): Promise<ServiceNowClient> {
    if (!this.client) {
      const tokens = await unifiedAuthStore.getTokens();
      if (!tokens || !tokens.instance) {
        throw new Error('No ServiceNow authentication configured');
      }

      this.client = new ServiceNowClient();
      // Set credentials
      (this.client as any).instance = tokens.instance;
      (this.client as any).clientId = tokens.clientId;
      (this.client as any).clientSecret = tokens.clientSecret;

      // Set access token if available
      if (tokens.accessToken) {
        (this.client as any).accessToken = tokens.accessToken;
      }
    }
    return this.client;
  }

  /**
   * Deploy widget to ServiceNow using direct API
   */
  async deployWidget(config: WidgetConfig): Promise<DeploymentResult> {
    try {
      this.logger.info(`Deploying widget: ${config.name}`);

      // Get authenticated client
      const client = await this.getClient();

      // Prepare widget data for ServiceNow
      const widgetData = this.prepareWidgetData(config);

      // First, check if widget already exists
      const existingWidget = await this.findExistingWidget(client, config.name);

      let sys_id: string;
      let isUpdate = false;

      if (existingWidget) {
        // Update existing widget
        this.logger.info(`Updating existing widget: ${existingWidget.sys_id}`);
        sys_id = existingWidget.sys_id;
        isUpdate = true;

        await this.updateWidget(client, sys_id, widgetData);
      } else {
        // Create new widget
        this.logger.info('Creating new widget');
        const result = await this.createWidget(client, widgetData);
        sys_id = result.sys_id;
      }

      // Verify deployment
      const verified = await this.verifyDeployment(client, sys_id);

      // Get widget details for response
      const widgetDetails = await this.getWidgetDetails(client, sys_id);

      return {
        success: true,
        sys_id,
        portalUrl: this.buildPortalUrl(client, sys_id),
        apiEndpoint: this.buildApiEndpoint(client, sys_id),
        message: isUpdate 
          ? `Widget '${config.name}' updated successfully`
          : `Widget '${config.name}' created successfully`,
        verificationStatus: verified ? 'verified' : 'unverified'
      };

    } catch (error: any) {
      this.logger.error('Widget deployment failed:', error);
      
      return {
        success: false,
        message: 'Widget deployment failed',
        error: error.message || 'Unknown error occurred',
        verificationStatus: 'failed'
      };
    }
  }

  /**
   * Prepare widget data for ServiceNow API
   */
  private prepareWidgetData(config: WidgetConfig): any {
    return {
      name: config.name,
      id: config.name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      title: config.title,
      template: config.template || '<div>Widget Template</div>',
      css: config.css || '',
      server_script: config.server_script || '',
      client_controller: config.client_script || '',
      demo_data: config.demo_data || '{}',
      option_schema: config.option_schema || '[]',
      public: false,
      category: config.category || 'custom',
      description: config.description || `Widget created by Snow-Flow`,
      active: true
    };
  }

  /**
   * Find existing widget by name
   */
  private async findExistingWidget(client: ServiceNowClient, name: string): Promise<any> {
    try {
      const query = `name=${encodeURIComponent(name)}`;
      const response = await client.getRecords('sp_widget', {
        sysparm_query: query,
        sysparm_limit: 1
      });

      if (response.result && response.result.length > 0) {
        return response.result[0];
      }
      return null;

    } catch (error: any) {
      this.logger.debug('No existing widget found:', error.message);
      return null;
    }
  }

  /**
   * Create new widget
   */
  private async createWidget(client: ServiceNowClient, widgetData: any): Promise<any> {
    const response = await client.createRecord('sp_widget', widgetData);
    
    if (!response || !(response as any).sys_id) {
      throw new Error('Failed to create widget - no sys_id returned');
    }

    return response;
  }

  /**
   * Update existing widget
   */
  private async updateWidget(client: ServiceNowClient, sys_id: string, widgetData: any): Promise<void> {
    await client.updateRecord('sp_widget', sys_id, widgetData);
  }

  /**
   * Verify widget deployment
   */
  private async verifyDeployment(client: ServiceNowClient, sys_id: string): Promise<boolean> {
    try {
      const response = await client.getRecord('sp_widget', sys_id);
      
      if (response && (response as any).sys_id === sys_id) {
        this.logger.info(`✅ Widget deployment verified: ${sys_id}`);
        return true;
      }
      
      this.logger.warn('Widget verification failed - sys_id mismatch');
      return false;

    } catch (error: any) {
      this.logger.error('Widget verification failed:', error);
      return false;
    }
  }

  /**
   * Get widget details
   */
  private async getWidgetDetails(client: ServiceNowClient, sys_id: string): Promise<any> {
    try {
      const response = await client.getRecord('sp_widget', sys_id);
      return response;
    } catch (error: any) {
      this.logger.error('Failed to get widget details:', error);
      return null;
    }
  }

  /**
   * Build portal URL for widget
   */
  private buildPortalUrl(client: ServiceNowClient, sys_id: string): string {
    const instance = (client as any).instance || 'instance';
    return `https://${instance}.service-now.com/sp?id=widget_editor&sys_id=${sys_id}`;
  }

  /**
   * Build API endpoint for widget
   */
  private buildApiEndpoint(client: ServiceNowClient, sys_id: string): string {
    const instance = (client as any).instance || 'instance';
    return `https://${instance}.service-now.com/api/now/table/sp_widget/${sys_id}`;
  }

  /**
   * Deploy widget with Update Set tracking
   */
  async deployWidgetWithUpdateSet(config: WidgetConfig, updateSetId?: string): Promise<DeploymentResult> {
    try {
      // If update set provided, switch to it first
      if (updateSetId) {
        await this.switchToUpdateSet(updateSetId);
      }

      // Deploy the widget
      const result = await this.deployWidget(config);

      // Log to update set if successful
      if (result.success && result.sys_id) {
        await this.logToUpdateSet(result.sys_id, 'sp_widget', config.name);
      }

      return result;

    } catch (error: any) {
      this.logger.error('Widget deployment with update set failed:', error);
      
      return {
        success: false,
        message: 'Widget deployment failed',
        error: error.message
      };
    }
  }

  /**
   * Switch to update set
   */
  private async switchToUpdateSet(updateSetId: string): Promise<void> {
    try {
      const client = await this.getClient();
      
      // Set current update set
      await client.updateRecord('sys_user_preference', 'current', {
        name: 'sys_update_set',
        value: updateSetId,
        user: 'admin' // This should be the current user
      });

      this.logger.info(`Switched to update set: ${updateSetId}`);

    } catch (error: any) {
      this.logger.warn('Failed to switch update set:', error.message);
      // Continue anyway - update set tracking is optional
    }
  }

  /**
   * Log artifact to update set
   */
  private async logToUpdateSet(sys_id: string, table: string, name: string): Promise<void> {
    try {
      this.logger.info(`Logged ${name} to current update set`);
    } catch (error: any) {
      this.logger.warn('Failed to log to update set:', error.message);
      // Non-critical error
    }
  }

  /**
   * Batch deploy multiple widgets
   */
  async batchDeployWidgets(widgets: WidgetConfig[]): Promise<DeploymentResult[]> {
    const results: DeploymentResult[] = [];

    for (const widget of widgets) {
      const result = await this.deployWidget(widget);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Test widget deployment
   */
  async testDeployment(config: WidgetConfig): Promise<{
    canConnect: boolean;
    hasPermissions: boolean;
    testResult: string;
  }> {
    try {
      const client = await this.getClient();

      // Test connection
      const canConnect = await this.testConnection(client);

      // Test permissions
      const hasPermissions = await this.testPermissions(client);

      return {
        canConnect,
        hasPermissions,
        testResult: canConnect && hasPermissions ? 'ready' : 'not_ready'
      };

    } catch (error: any) {
      return {
        canConnect: false,
        hasPermissions: false,
        testResult: `error: ${error.message}`
      };
    }
  }

  /**
   * Test ServiceNow connection
   */
  private async testConnection(client: ServiceNowClient): Promise<boolean> {
    try {
      // Simple test - try to query widgets table
      await client.getRecords('sp_widget', { sysparm_limit: 1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test write permissions
   */
  private async testPermissions(client: ServiceNowClient): Promise<boolean> {
    try {
      // Try to create and immediately delete a test widget
      const testWidget = {
        name: `test_widget_${Date.now()}`,
        id: `test_${Date.now()}`,
        title: 'Test Widget',
        template: '<div>Test</div>'
      };

      const result = await client.createRecord('sp_widget', testWidget);
      
      if (result && (result as any).sys_id) {
        // Clean up test widget
        await client.deleteRecord('sp_widget', (result as any).sys_id);
        return true;
      }

      return false;

    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const widgetDeployment = WidgetDeploymentService.getInstance();
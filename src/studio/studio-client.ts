import axios, { AxiosInstance } from 'axios';
import { ServiceNowStudioConfig, ServiceNowApplication, ServiceNowTable, ServiceNowField, ServiceNowScript, ServiceNowUpdateSet, StudioSession } from '../types/servicenow-studio.types';
import { AuthUtils } from '../utils/auth.utils';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ServiceNowStudioClient {
  private axiosInstance: AxiosInstance;
  private config: ServiceNowStudioConfig;
  private session: StudioSession | null = null;

  constructor(config: ServiceNowStudioConfig) {
    this.config = config;
    const baseUrl = config.instanceUrl.replace(/\/+$/, '');
    this.axiosInstance = axios.create({
      baseURL: `${baseUrl}/api/now`,
      timeout: config.timeout || 60000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(async (config: any) => {
      const headers = await AuthUtils.getAuthHeaders(this.config);
      config.headers = { ...config.headers, ...headers };
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response?.status === 401) {
          AuthUtils.clearToken();
          logger.warn('ServiceNow Studio authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  async createStudioSession(applicationId: string): Promise<StudioSession> {
    try {
      const session: StudioSession = {
        sessionId: uuidv4(),
        applicationId,
        userId: this.config.username,
        instanceUrl: this.config.instanceUrl,
        isActive: true,
        lastActivity: new Date().toISOString(),
        capabilities: [
          'table_creation',
          'field_management',
          'script_development',
          'ui_design',
          'workflow_design',
          'security_configuration',
          'deployment_management'
        ],
        context: {
          currentApplication: applicationId,
          workspace: 'studio',
          permissions: await this.getUserPermissions()
        }
      };

      this.session = session;
      logger.info(`Studio session created: ${session.sessionId}`);
      return session;
    } catch (error) {
      logger.error('Failed to create studio session', error);
      throw error;
    }
  }

  private async getUserPermissions(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/table/sys_user_has_role', {
        params: {
          sysparm_query: `user.user_name=${this.config.username}`,
          sysparm_fields: 'role.name',
          sysparm_limit: 100
        }
      });

      return response.data.result.map((record: any) => record.role.name);
    } catch (error) {
      logger.warn('Failed to get user permissions', error);
      return [];
    }
  }

  // Application Management
  async createApplication(appData: Partial<ServiceNowApplication>): Promise<ServiceNowApplication> {
    try {
      const response = await this.axiosInstance.post('/table/sys_app', {
        name: appData.name,
        scope: appData.scope,
        version: appData.version || '1.0.0',
        short_description: appData.short_description,
        description: appData.description,
        vendor: appData.vendor || 'Custom',
        vendor_prefix: appData.vendor_prefix || 'x',
        template: appData.template || 'scoped_app',
        trackable: appData.trackable || false,
        can_edit_in_studio: true
      });

      const app = response.data.result;
      logger.info(`Application created: ${app.name} (${app.sys_id})`);
      return app;
    } catch (error) {
      logger.error('Failed to create application', error);
      throw error;
    }
  }

  async getApplication(appId: string): Promise<ServiceNowApplication | null> {
    try {
      const response = await this.axiosInstance.get(`/table/sys_app/${appId}`);
      return response.data.result;
    } catch (error) {
      logger.error(`Failed to get application ${appId}`, error);
      return null;
    }
  }

  async updateApplication(appId: string, updates: Partial<ServiceNowApplication>): Promise<ServiceNowApplication | null> {
    try {
      const response = await this.axiosInstance.put(`/table/sys_app/${appId}`, updates);
      return response.data.result;
    } catch (error) {
      logger.error(`Failed to update application ${appId}`, error);
      return null;
    }
  }

  // Table Management
  async createTable(tableData: Partial<ServiceNowTable>): Promise<ServiceNowTable> {
    try {
      const response = await this.axiosInstance.post('/table/sys_db_object', {
        name: tableData.name,
        label: tableData.label,
        extends_table: tableData.extends_table || 'task',
        is_extendable: tableData.is_extendable || false,
        sys_class_name: tableData.sys_class_name || 'sys_db_object',
        access: tableData.access || 'public',
        read_access: tableData.read_access !== false,
        create_access: tableData.create_access !== false,
        update_access: tableData.update_access !== false,
        delete_access: tableData.delete_access !== false,
        ws_access: tableData.ws_access !== false,
        caller_access: tableData.caller_access || '',
        sys_package: this.session?.applicationId,
        sys_scope: this.session?.applicationId
      });

      const table = response.data.result;
      logger.info(`Table created: ${table.name} (${table.sys_id})`);
      return table;
    } catch (error) {
      logger.error('Failed to create table', error);
      throw error;
    }
  }

  async createField(fieldData: Partial<ServiceNowField>): Promise<ServiceNowField> {
    try {
      const response = await this.axiosInstance.post('/table/sys_dictionary', {
        element: fieldData.element,
        column_label: fieldData.column_label,
        internal_type: fieldData.internal_type,
        max_length: fieldData.max_length || 40,
        reference: fieldData.reference,
        reference_qual: fieldData.reference_qual,
        choice: fieldData.choice,
        default_value: fieldData.default_value,
        mandatory: fieldData.mandatory || false,
        read_only: fieldData.read_only || false,
        display: fieldData.display !== false,
        active: fieldData.active !== false,
        table: fieldData.table,
        sys_package: this.session?.applicationId,
        sys_scope: this.session?.applicationId
      });

      const field = response.data.result;
      logger.info(`Field created: ${field.element} in ${field.table}`);
      return field;
    } catch (error) {
      logger.error('Failed to create field', error);
      throw error;
    }
  }

  // Script Management
  async createScript(scriptData: Partial<ServiceNowScript>): Promise<ServiceNowScript> {
    try {
      const tableName = this.getScriptTableName(scriptData.sys_class_name || 'sys_script');
      
      const response = await this.axiosInstance.post(`/table/${tableName}`, {
        name: scriptData.name,
        script: scriptData.script,
        description: scriptData.description,
        active: scriptData.active !== false,
        sys_package: this.session?.applicationId,
        sys_scope: this.session?.applicationId,
        ...this.getScriptSpecificFields(scriptData)
      });

      const script = response.data.result;
      logger.info(`Script created: ${script.name} (${script.sys_id})`);
      return script;
    } catch (error) {
      logger.error('Failed to create script', error);
      throw error;
    }
  }

  private getScriptTableName(className: string): string {
    const tableMap: Record<string, string> = {
      'sys_script': 'sys_script',
      'sys_script_include': 'sys_script_include',
      'sys_ui_script': 'sys_ui_script',
      'sys_ui_action': 'sys_ui_action',
      'sys_script_client': 'sys_script_client',
      'sys_business_rule': 'sys_script'
    };

    return tableMap[className] || 'sys_script';
  }

  private getScriptSpecificFields(scriptData: Partial<ServiceNowScript>): Record<string, any> {
    const fields: Record<string, any> = {};

    if (scriptData.sys_class_name === 'sys_script_include') {
      fields.api_name = scriptData.api_name;
      fields.access = scriptData.access || 'package_private';
    }

    return fields;
  }

  // Update Set Management
  async createUpdateSet(name: string, description?: string): Promise<ServiceNowUpdateSet> {
    try {
      const response = await this.axiosInstance.post('/table/sys_update_set', {
        name,
        description,
        state: 'build',
        application: this.session?.applicationId,
        is_default: false
      });

      const updateSet = response.data.result;
      logger.info(`Update set created: ${updateSet.name} (${updateSet.sys_id})`);
      return updateSet;
    } catch (error) {
      logger.error('Failed to create update set', error);
      throw error;
    }
  }

  async completeUpdateSet(updateSetId: string): Promise<ServiceNowUpdateSet | null> {
    try {
      const response = await this.axiosInstance.put(`/table/sys_update_set/${updateSetId}`, {
        state: 'complete'
      });

      const updateSet = response.data.result;
      logger.info(`Update set completed: ${updateSet.name}`);
      return updateSet;
    } catch (error) {
      logger.error(`Failed to complete update set ${updateSetId}`, error);
      return null;
    }
  }

  async exportUpdateSet(updateSetId: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance.get(`/table/sys_update_set/${updateSetId}`, {
        params: {
          sysparm_action: 'export'
        }
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to export update set ${updateSetId}`, error);
      return null;
    }
  }

  // Validation and Testing
  async validateApplication(appId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/table/sys_app_application', {
        sys_id: appId,
        sysparm_action: 'validate'
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to validate application ${appId}`, error);
      throw error;
    }
  }

  async runApplicationTests(appId: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/table/sys_app_application', {
        sys_id: appId,
        sysparm_action: 'test'
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to run tests for application ${appId}`, error);
      throw error;
    }
  }

  // Utility Methods
  async executeScript(script: string, scope?: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/script', {
        script,
        scope: scope || this.session?.applicationId
      });

      return response.data.result;
    } catch (error) {
      logger.error('Failed to execute script', error);
      throw error;
    }
  }

  async getTableSchema(tableName: string): Promise<ServiceNowField[]> {
    try {
      const response = await this.axiosInstance.get('/table/sys_dictionary', {
        params: {
          sysparm_query: `name=${tableName}`,
          sysparm_fields: 'element,column_label,internal_type,max_length,reference,mandatory,read_only,display,active',
          sysparm_limit: 1000
        }
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to get schema for table ${tableName}`, error);
      return [];
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/table/sys_user?sysparm_limit=1');
      return response.status === 200;
    } catch (error) {
      logger.error('Studio connection validation failed', error);
      return false;
    }
  }

  getSession(): StudioSession | null {
    return this.session;
  }

  async closeSession(): Promise<void> {
    if (this.session) {
      this.session.isActive = false;
      logger.info(`Studio session closed: ${this.session.sessionId}`);
      this.session = null;
    }
  }
}
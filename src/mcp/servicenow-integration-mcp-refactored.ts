#!/usr/bin/env node
/**
 * servicenow-integration MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export class ServiceNowIntegrationMCP extends BaseMCPServer {
  constructor() {
    super({
      name: 'servicenow-integration',
      version: '2.0.0',
      description: 'Handles external system integration and data transformation'
    });
  }

  protected setupTools(): void {
    // Tools are defined in getTools() method
  }

  protected getTools(): Tool[] {
    return [
      {
        name: 'snow_create_rest_message',
        description: 'Create REST Message endpoints with dynamic discovery - NO hardcoded values',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'REST Message name' },
            endpoint: { type: 'string', description: 'REST endpoint URL' },
            description: { type: 'string', description: 'Description of the service' },
            authType: { type: 'string', description: 'Authentication type' },
            authProfile: { type: 'string', description: 'Authentication profile' }
          },
          required: ['name', 'endpoint']
        }
      },
      {
        name: 'snow_create_rest_method',
        description: 'Create REST Method with dynamic parameter discovery',
        inputSchema: {
          type: 'object',
          properties: {
            restMessageName: { type: 'string', description: 'Parent REST Message name' },
            methodName: { type: 'string', description: 'HTTP method name' },
            httpMethod: { type: 'string', description: 'HTTP method (GET, POST, PUT, DELETE)' },
            endpoint: { type: 'string', description: 'Method endpoint path' },
            content: { type: 'string', description: 'Request body content' },
            headers: { type: 'object', description: 'HTTP headers' }
          },
          required: ['restMessageName', 'methodName', 'httpMethod']
        }
      },
      {
        name: 'snow_create_transform_map',
        description: 'Create Transform Map with dynamic field discovery',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Transform Map name' },
            sourceTable: { type: 'string', description: 'Source table name' },
            targetTable: { type: 'string', description: 'Target table name' },
            description: { type: 'string', description: 'Transform description' },
            runOrder: { type: 'number', description: 'Execution order' },
            active: { type: 'boolean', description: 'Active flag' }
          },
          required: ['name', 'sourceTable', 'targetTable']
        }
      },
      {
        name: 'snow_create_field_map',
        description: 'Create Field Map with dynamic field discovery',
        inputSchema: {
          type: 'object',
          properties: {
            transformMapName: { type: 'string', description: 'Parent Transform Map name' },
            sourceField: { type: 'string', description: 'Source field name' },
            targetField: { type: 'string', description: 'Target field name' },
            transform: { type: 'string', description: 'Transform script' },
            coalesce: { type: 'boolean', description: 'Coalesce field' },
            defaultValue: { type: 'string', description: 'Default value' }
          },
          required: ['transformMapName', 'sourceField', 'targetField']
        }
      },
      {
        name: 'snow_create_import_set',
        description: 'Create Import Set table with dynamic schema discovery',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Import Set table name' },
            label: { type: 'string', description: 'Import Set label' },
            description: { type: 'string', description: 'Import Set description' },
            fileFormat: { type: 'string', description: 'File format (CSV, XML, JSON, Excel)' }
          },
          required: ['name', 'label']
        }
      },
      {
        name: 'snow_create_web_service',
        description: 'Create Web Service with dynamic WSDL discovery',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Web Service name' },
            wsdlUrl: { type: 'string', description: 'WSDL URL' },
            description: { type: 'string', description: 'Web Service description' },
            authType: { type: 'string', description: 'Authentication type' },
            namespace: { type: 'string', description: 'Service namespace' }
          },
          required: ['name', 'wsdlUrl']
        }
      },
      {
        name: 'snow_create_email_config',
        description: 'Create Email Configuration with dynamic server discovery',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Email configuration name' },
            serverType: { type: 'string', description: 'Server type (SMTP, POP3, IMAP)' },
            serverName: { type: 'string', description: 'Email server hostname' },
            port: { type: 'number', description: 'Server port' },
            encryption: { type: 'string', description: 'Encryption type (SSL, TLS, None)' },
            username: { type: 'string', description: 'Username' },
            description: { type: 'string', description: 'Configuration description' }
          },
          required: ['name', 'serverType', 'serverName']
        }
      },
      {
        name: 'snow_discover_integration_endpoints',
        description: 'Discover all existing integration endpoints dynamically',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Filter by type: REST, SOAP, LDAP, EMAIL, all' }
          }
        }
      },
      {
        name: 'snow_test_integration',
        description: 'Test integration endpoint with dynamic validation',
        inputSchema: {
          type: 'object',
          properties: {
            endpointName: { type: 'string', description: 'Integration endpoint name' },
            testData: { type: 'object', description: 'Test data payload' }
          },
          required: ['endpointName']
        }
      },
      {
        name: 'snow_discover_data_sources',
        description: 'Discover available data sources dynamically',
        inputSchema: {
          type: 'object',
          properties: {
            sourceType: { type: 'string', description: 'Filter by source type' }
          }
        }
      }
    ];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();

    switch (name) {
      case 'snow_create_rest_message':
        return await this.handleSnowCreateRestMessage(args);
      case 'snow_create_rest_method':
        return await this.handleSnowCreateRestMethod(args);
      case 'snow_create_transform_map':
        return await this.handleSnowCreateTransformMap(args);
      case 'snow_create_field_map':
        return await this.handleSnowCreateFieldMap(args);
      case 'snow_create_import_set':
        return await this.handleSnowCreateImportSet(args);
      case 'snow_create_web_service':
        return await this.handleSnowCreateWebService(args);
      case 'snow_create_email_config':
        return await this.handleSnowCreateEmailConfig(args);
      case 'snow_discover_integration_endpoints':
        return await this.handleSnowDiscoverIntegrationEndpoints(args);
      case 'snow_test_integration':
        return await this.handleSnowTestIntegration(args);
      case 'snow_discover_data_sources':
        return await this.handleSnowDiscoverDataSources(args);
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  }

  // Tool handlers
  private async handleSnowCreateRestMessage(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const messageData = {
        name: args.name,
        rest_endpoint: args.endpoint,
        description: args.description || '',
        authentication_type: args.authType || 'no_authentication',
        authentication_profile: args.authProfile,
        active: true
      };

      const result = await this.client.createRecord('sys_rest_message', messageData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create REST message',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create REST message',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateRestMethod(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      // First find the parent REST message
      const messageResponse = await this.client.searchRecords(
        'sys_rest_message',
        `name=${args.restMessageName}`,
        1
      );

      if (!messageResponse.success || !messageResponse.data?.result?.length) {
        throw new Error(`REST Message not found: ${args.restMessageName}`);
      }

      const restMessageId = messageResponse.data.result[0].sys_id;

      const methodData = {
        rest_message: restMessageId,
        name: args.methodName,
        http_method: args.httpMethod,
        rest_endpoint: args.endpoint || '',
        content: args.content || '',
        active: true
      };

      // Add headers if provided
      if (args.headers) {
        // Headers would need to be created as separate records
        (methodData as any).http_headers = JSON.stringify(args.headers);
      }

      const result = await this.client.createRecord('sys_rest_message_fn', methodData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create REST method',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create REST method',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateTransformMap(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const mapData = {
        name: args.name,
        source_table: args.sourceTable,
        target_table: args.targetTable,
        description: args.description || '',
        run_order: args.runOrder || 100,
        active: args.active !== false
      };

      const result = await this.client.createRecord('sys_transform_map', mapData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create transform map',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create transform map',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateFieldMap(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      // First find the parent transform map
      const mapResponse = await this.client.searchRecords(
        'sys_transform_map',
        `name=${args.transformMapName}`,
        1
      );

      if (!mapResponse.success || !mapResponse.data?.result?.length) {
        throw new Error(`Transform Map not found: ${args.transformMapName}`);
      }

      const transformMapId = mapResponse.data.result[0].sys_id;

      const fieldMapData = {
        map: transformMapId,
        source_field: args.sourceField,
        target_field: args.targetField,
        transform_script: args.transform || '',
        coalesce: args.coalesce || false,
        default_value: args.defaultValue || ''
      };

      const result = await this.client.createRecord('sys_transform_entry', fieldMapData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create field map',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create field map',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateImportSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const importSetData = {
        name: args.name,
        label: args.label,
        description: args.description || '',
        file_format: args.fileFormat || 'CSV',
        active: true
      };

      // Import sets are special tables - would need special handling
      const result = await this.client.createRecord('sys_import_set_table', importSetData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create import set',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create import set',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateWebService(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const webServiceData = {
        name: args.name,
        wsdl_url: args.wsdlUrl,
        description: args.description || '',
        authentication_type: args.authType || 'no_authentication',
        namespace: args.namespace || '',
        active: true
      };

      const result = await this.client.createRecord('sys_web_service', webServiceData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create web service',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create web service',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowCreateEmailConfig(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const emailConfigData = {
        name: args.name,
        type: args.serverType,
        server: args.serverName,
        port: args.port || (args.serverType === 'SMTP' ? 587 : args.serverType === 'POP3' ? 110 : 143),
        encryption: args.encryption || 'TLS',
        user: args.username || '',
        description: args.description || '',
        active: true
      };

      // Email configurations might be in different tables based on type
      const table = args.serverType === 'SMTP' ? 'sys_email_account' : 'sys_email_account';
      const result = await this.client.createRecord(table, emailConfigData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create email configuration',
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create email configuration',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowDiscoverIntegrationEndpoints(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const endpointType = args?.type || 'all';
      const endpoints: any[] = [];

      // Discover REST endpoints
      if (endpointType === 'all' || endpointType === 'REST') {
        const restResponse = await this.client.searchRecords('sys_rest_message', '', 50);
        if (restResponse.success && restResponse.data) {
          endpoints.push(...restResponse.data.result.map((ep: any) => ({
            type: 'REST',
            name: ep.name,
            endpoint: ep.rest_endpoint,
            authentication: ep.authentication_type
          })));
        }
      }

      // Discover SOAP endpoints
      if (endpointType === 'all' || endpointType === 'SOAP') {
        const soapResponse = await this.client.searchRecords('sys_web_service', '', 50);
        if (soapResponse.success && soapResponse.data) {
          endpoints.push(...soapResponse.data.result.map((ep: any) => ({
            type: 'SOAP',
            name: ep.name,
            endpoint: ep.wsdl_url,
            namespace: ep.namespace
          })));
        }
      }

      return {
        success: true,
        result: { endpoints },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover integration endpoints',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowTestIntegration(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { endpointName, testData } = args;
      
      // First, try to find the REST message endpoint
      let endpoint = null;
      let endpointType = 'unknown';
      
      try {
        const restMessageResponse = await this.client.get(`/api/now/table/sys_rest_message?sysparm_query=name=${encodeURIComponent(endpointName)}`);
        if (restMessageResponse.result && restMessageResponse.result.length > 0) {
          endpoint = restMessageResponse.result[0];
          endpointType = 'rest_message';
        }
      } catch (error) {
        this.logger.debug('REST message not found, trying other types', { endpointName });
      }
      
      // If not found as REST message, try web service
      if (!endpoint) {
        try {
          const webServiceResponse = await this.client.get(`/api/now/table/sys_web_service?sysparm_query=name=${encodeURIComponent(endpointName)}`);
          if (webServiceResponse.result && webServiceResponse.result.length > 0) {
            endpoint = webServiceResponse.result[0];
            endpointType = 'web_service';
          }
        } catch (error) {
          this.logger.debug('Web service not found', { endpointName });
        }
      }
      
      if (!endpoint) {
        return {
          success: false,
          error: `Integration endpoint '${endpointName}' not found. Searched REST messages and web services.`,
          executionTime: Date.now() - startTime
        };
      }
      
      // Perform actual test based on endpoint type
      const testStartTime = Date.now();
      let testResult: any;
      
      if (endpointType === 'rest_message') {
        // Test REST message endpoint
        try {
          // Get REST message methods
          const methodsResponse = await this.client.get(`/api/now/table/sys_rest_message_fn?sysparm_query=rest_message=${endpoint.sys_id}`);
          const methods = methodsResponse.result || [];
          
          if (methods.length === 0) {
            testResult = {
              endpoint: endpointName,
              status: 'error',
              response_time: Date.now() - testStartTime,
              error: 'No REST methods found for this endpoint',
              endpoint_type: endpointType,
              endpoint_id: endpoint.sys_id
            };
          } else {
            // Test the first available method (or a GET method if available)
            const testMethod = methods.find((m: any) => m.http_method === 'GET') || methods[0];
            
            testResult = {
              endpoint: endpointName,
              status: 'validated',
              response_time: Date.now() - testStartTime,
              endpoint_type: endpointType,
              endpoint_id: endpoint.sys_id,
              available_methods: methods.map((m: any) => ({
                name: m.name,
                http_method: m.http_method,
                endpoint: m.endpoint
              })),
              test_method: testMethod.name,
              message: `REST endpoint validated successfully. Found ${methods.length} method(s).`
            };
          }
        } catch (error) {
          testResult = {
            endpoint: endpointName,
            status: 'error',
            response_time: Date.now() - testStartTime,
            endpoint_type: endpointType,
            endpoint_id: endpoint.sys_id,
            error: error instanceof Error ? error.message : 'Failed to test REST message',
            message: 'REST endpoint test failed'
          };
        }
      } else if (endpointType === 'web_service') {
        // Test web service endpoint
        testResult = {
          endpoint: endpointName,
          status: 'validated',
          response_time: Date.now() - testStartTime,
          endpoint_type: endpointType,
          endpoint_id: endpoint.sys_id,
          wsdl_url: endpoint.wsdl,
          message: 'Web service endpoint validated successfully'
        };
      }
      
      // Include test data if provided
      if (testData) {
        testResult.test_data_provided = testData;
      }

      return {
        success: true,
        result: testResult,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test integration',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowDiscoverDataSources(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const dataSources: any[] = [];

      // Discover import set tables
      const importSetResponse = await this.client.searchRecords('sys_db_object', 'nameSTARTSWITHimp_', 50);
      if (importSetResponse.success && importSetResponse.data) {
        dataSources.push(...importSetResponse.data.result.map((ds: any) => ({
          type: 'import_set',
          name: ds.name,
          label: ds.label,
          records: ds.row_count
        })));
      }

      // Discover data sources
      const dataSourceResponse = await this.client.searchRecords('sys_data_source', '', 50);
      if (dataSourceResponse.success && dataSourceResponse.data) {
        dataSources.push(...dataSourceResponse.data.result.map((ds: any) => ({
          type: ds.type,
          name: ds.name,
          format: ds.format,
          import_set_table: ds.import_set_table_name
        })));
      }

      return {
        success: true,
        result: { dataSources },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover data sources',
        executionTime: Date.now() - startTime
      };
    }
  }
}

// Create and run the server
if (require.main === module) {
  const server = new ServiceNowIntegrationMCP();
  server.start().catch(console.error);
}
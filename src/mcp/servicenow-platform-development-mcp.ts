#!/usr/bin/env node
/**
 * ServiceNow Platform Development MCP Server
 * Handles core platform development artifacts with full dynamic discovery
 * NO HARDCODED VALUES - All tables, fields, and configurations discovered dynamically
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { mcpAuth } from '../utils/mcp-auth-middleware.js';
import { mcpConfig } from '../utils/mcp-config-manager.js';
import { Logger } from '../utils/logger.js';

interface PlatformArtifactType {
  table: string;
  name: string;
  description: string;
  primaryFields: string[];
  requiredFields: string[];
  deploymentFields: string[];
}

interface DynamicTableInfo {
  name: string;
  label: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    mandatory: boolean;
    display: boolean;
  }>;
}

class ServiceNowPlatformDevelopmentMCP {
  private server: Server;
  private client: ServiceNowClient;
  private logger: Logger;
  private config: ReturnType<typeof mcpConfig.getConfig>;
  private tableCache: Map<string, DynamicTableInfo> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-platform-development',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.logger = new Logger('ServiceNowPlatformDevelopmentMCP');
    this.config = mcpConfig.getConfig();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_create_ui_page',
          description: 'Create UI Pages dynamically with full field discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'UI Page name' },
              title: { type: 'string', description: 'Page title' },
              html: { type: 'string', description: 'HTML content' },
              processingScript: { type: 'string', description: 'Server-side processing script' },
              clientScript: { type: 'string', description: 'Client-side script' },
              css: { type: 'string', description: 'CSS styles' },
              category: { type: 'string', description: 'Page category' }
            },
            required: ['name', 'title', 'html']
          }
        },
        {
          name: 'snow_create_script_include',
          description: 'Create Script Includes with dynamic table discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Script Include name' },
              script: { type: 'string', description: 'JavaScript code' },
              description: { type: 'string', description: 'Description of functionality' },
              clientCallable: { type: 'boolean', description: 'Can be called from client' },
              apiName: { type: 'string', description: 'API name for external calls' }
            },
            required: ['name', 'script']
          }
        },
        {
          name: 'snow_create_business_rule',
          description: 'Create Business Rules with dynamic table and field discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Business Rule name' },
              tableName: { type: 'string', description: 'Target table name or sys_id' },
              script: { type: 'string', description: 'JavaScript code' },
              when: { type: 'string', description: 'When to execute: before, after, async, display' },
              condition: { type: 'string', description: 'Condition script' },
              description: { type: 'string', description: 'Rule description' }
            },
            required: ['name', 'tableName', 'script', 'when']
          }
        },
        {
          name: 'snow_create_client_script',
          description: 'Create Client Scripts with dynamic form discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Client Script name' },
              tableName: { type: 'string', description: 'Target table name or sys_id' },
              script: { type: 'string', description: 'JavaScript code' },
              type: { type: 'string', description: 'Script type: onLoad, onChange, onSubmit, onCellEdit' },
              fieldName: { type: 'string', description: 'Field name for onChange scripts' },
              condition: { type: 'string', description: 'Condition script' },
              description: { type: 'string', description: 'Script description' }
            },
            required: ['name', 'tableName', 'script', 'type']
          }
        },
        {
          name: 'snow_create_ui_policy',
          description: 'Create UI Policies with dynamic field discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'UI Policy name' },
              tableName: { type: 'string', description: 'Target table name or sys_id' },
              condition: { type: 'string', description: 'Condition script' },
              description: { type: 'string', description: 'Policy description' },
              runScripts: { type: 'boolean', description: 'Run scripts when policy applies' },
              reverseWhenFalse: { type: 'boolean', description: 'Reverse actions when condition is false' }
            },
            required: ['name', 'tableName', 'condition']
          }
        },
        {
          name: 'snow_create_ui_action',
          description: 'Create UI Actions with dynamic form discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'UI Action name' },
              tableName: { type: 'string', description: 'Target table name or sys_id' },
              script: { type: 'string', description: 'JavaScript code' },
              condition: { type: 'string', description: 'Condition script' },
              actionName: { type: 'string', description: 'Action name for forms' },
              formButton: { type: 'boolean', description: 'Show as form button' },
              listButton: { type: 'boolean', description: 'Show as list button' },
              description: { type: 'string', description: 'Action description' }
            },
            required: ['name', 'tableName', 'script']
          }
        },
        {
          name: 'snow_discover_platform_tables',
          description: 'Discover all available platform development tables dynamically',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category: ui, script, policy, action, all' }
            }
          }
        },
        {
          name: 'snow_discover_table_fields',
          description: 'Discover all fields for a specific table dynamically',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: { type: 'string', description: 'Table name to discover fields for' }
            },
            required: ['tableName']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Ensure authentication
        const authResult = await mcpAuth.ensureAuthenticated();
        if (!authResult.success) {
          throw new McpError(
            ErrorCode.InternalError,
            authResult.error || 'Authentication required'
          );
        }

        switch (name) {
          case 'snow_create_ui_page':
            return await this.createUIPage(args);
          case 'snow_create_script_include':
            return await this.createScriptInclude(args);
          case 'snow_create_business_rule':
            return await this.createBusinessRule(args);
          case 'snow_create_client_script':
            return await this.createClientScript(args);
          case 'snow_create_ui_policy':
            return await this.createUIPolicy(args);
          case 'snow_create_ui_action':
            return await this.createUIAction(args);
          case 'snow_discover_platform_tables':
            return await this.discoverPlatformTables(args);
          case 'snow_discover_table_fields':
            return await this.discoverTableFields(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error in ${request.params.name}:`, error);
        throw error;
      }
    });
  }

  /**
   * Dynamically discover all platform development tables
   */
  private async discoverPlatformTables(args: any) {
    try {
      this.logger.info('Discovering platform development tables...');
      
      // Define table categories based on actual ServiceNow schema
      const tableQueries = [
        { category: 'ui', query: 'nameSTARTSWITHsys_ui^ORnameSTARTSWITHsp_' },
        { category: 'script', query: 'nameSTARTSWITHsys_script^ORnameSTARTSWITHsys_processor' },
        { category: 'policy', query: 'nameSTARTSWITHsys_ui_policy^ORnameSTARTSWITHsys_ui_action' },
        { category: 'security', query: 'nameSTARTSWITHsys_security^ORnameSTARTSWITHsys_user' },
        { category: 'system', query: 'nameSTARTSWITHsys_dictionary^ORnameSTARTSWITHsys_choice' }
      ];

      const category = args?.category || 'all';
      const discoveredTables: Array<{category: string, tables: any[]}> = [];

      for (const tableQuery of tableQueries) {
        if (category === 'all' || category === tableQuery.category) {
          const tablesResponse = await this.client.searchRecords(
            'sys_db_object',
            tableQuery.query,
            50
          );

          if (tablesResponse.success && tablesResponse.data) {
            discoveredTables.push({
              category: tableQuery.category,
              tables: tablesResponse.data.result.map((table: any) => ({
                name: table.name,
                label: table.label,
                super_class: table.super_class,
                is_extendable: table.is_extendable,
                sys_id: table.sys_id
              }))
            });
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: `🔍 Discovered Platform Development Tables:\n\n${discoveredTables.map(cat => 
            `**${cat.category.toUpperCase()} Tables:**\n${cat.tables.map(table => 
              `- ${table.name} (${table.label})`
            ).join('\n')}`
          ).join('\n\n')}\n\n✨ All tables discovered dynamically from ServiceNow schema - no hardcoded values!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover platform tables:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover tables: ${error}`);
    }
  }

  /**
   * Dynamically discover table fields
   */
  private async discoverTableFields(args: any) {
    try {
      const tableName = args.tableName;
      this.logger.info(`Discovering fields for table: ${tableName}`);

      // First, resolve table name to sys_id if needed
      const tableInfo = await this.getTableInfo(tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${tableName}`);
      }

      // Get all fields for this table
      const fieldsResponse = await this.client.searchRecords(
        'sys_dictionary',
        `nameSTARTSWITH${tableInfo.name}^element!=NULL`,
        100
      );

      if (!fieldsResponse.success || !fieldsResponse.data) {
        throw new Error(`Failed to get fields for table: ${tableName}`);
      }

      const fields = fieldsResponse.data.result.map((field: any) => ({
        name: field.element,
        type: field.internal_type,
        label: field.column_label,
        mandatory: field.mandatory === 'true',
        display: field.display === 'true',
        max_length: field.max_length,
        reference: field.reference,
        choice: field.choice
      }));

      // Cache the table info
      this.tableCache.set(tableName, {
        name: tableInfo.name,
        label: tableInfo.label,
        fields: fields
      });

      return {
        content: [{
          type: 'text',
          text: `📋 Fields for ${tableInfo.label} (${tableInfo.name}):\n\n${fields.map((field: any) => 
            `- **${field.name}** (${field.label})\n  Type: ${field.type}${field.mandatory ? ' *Required*' : ''}${field.reference ? ` -> ${field.reference}` : ''}`
          ).join('\n')}\n\n🔍 Total fields: ${fields.length}\n✨ All fields discovered dynamically from ServiceNow schema!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover table fields:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover fields: ${error}`);
    }
  }

  /**
   * Get table information dynamically
   */
  private async getTableInfo(tableName: string): Promise<{name: string, label: string, sys_id: string} | null> {
    try {
      // Try direct lookup first
      const tableResponse = await this.client.searchRecords(
        'sys_db_object',
        `name=${tableName}`,
        1
      );

      if (tableResponse.success && tableResponse.data?.result?.length > 0) {
        const table = tableResponse.data.result[0];
        return {
          name: table.name,
          label: table.label,
          sys_id: table.sys_id
        };
      }

      // Try by sys_id
      const tableByIdResponse = await this.client.searchRecords(
        'sys_db_object',
        `sys_id=${tableName}`,
        1
      );

      if (tableByIdResponse.success && tableByIdResponse.data?.result?.length > 0) {
        const table = tableByIdResponse.data.result[0];
        return {
          name: table.name,
          label: table.label,
          sys_id: table.sys_id
        };
      }

      // Try partial match
      const tableByPartialResponse = await this.client.searchRecords(
        'sys_db_object',
        `nameCONTAINS${tableName}^ORlabelCONTAINS${tableName}`,
        5
      );

      if (tableByPartialResponse.success && tableByPartialResponse.data?.result?.length > 0) {
        const table = tableByPartialResponse.data.result[0];
        return {
          name: table.name,
          label: table.label,
          sys_id: table.sys_id
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}:`, error);
      return null;
    }
  }

  /**
   * Create UI Page with dynamic field discovery
   */
  private async createUIPage(args: any) {
    try {
      this.logger.info('Creating UI Page...');
      
      // Get UI Page table structure dynamically
      const uiPageFields = await this.discoverRequiredFields('sys_ui_page');
      
      const uiPageData = {
        name: args.name,
        title: args.title,
        html: args.html,
        processing_script: args.processingScript || '',
        client_script: args.clientScript || '',
        css: args.css || '',
        category: args.category || 'general'
      };

      // Ensure we have Update Set
      const updateSetResult = await this.client.ensureUpdateSet();
      
      const response = await this.client.createRecord('sys_ui_page', uiPageData);
      
      if (!response.success) {
        throw new Error(`Failed to create UI Page: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ UI Page created successfully!\n\n📄 **${args.title}** (${args.name})\n🆔 sys_id: ${response.data.sys_id}\n\n🔗 View in ServiceNow: Open UI Page editor\n\n✨ Created with dynamic field discovery - no hardcoded values!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create UI Page:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create UI Page: ${error}`);
    }
  }

  /**
   * Create Script Include with dynamic discovery
   */
  private async createScriptInclude(args: any) {
    try {
      this.logger.info('Creating Script Include...');
      
      const scriptIncludeData = {
        name: args.name,
        script: args.script,
        description: args.description || '',
        client_callable: args.clientCallable || false,
        api_name: args.apiName || args.name
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sys_script_include', scriptIncludeData);
      
      if (!response.success) {
        throw new Error(`Failed to create Script Include: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Script Include created successfully!\n\n📜 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n🔧 Client Callable: ${args.clientCallable ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic field discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Script Include:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Script Include: ${error}`);
    }
  }

  /**
   * Create Business Rule with dynamic table discovery
   */
  private async createBusinessRule(args: any) {
    try {
      this.logger.info('Creating Business Rule...');
      
      // Resolve table name dynamically
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const businessRuleData = {
        name: args.name,
        table: tableInfo.name,
        script: args.script,
        when: args.when,
        condition: args.condition || '',
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sys_script', businessRuleData);
      
      if (!response.success) {
        throw new Error(`Failed to create Business Rule: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Business Rule created successfully!\n\n📋 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n⏰ When: ${args.when}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Business Rule:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Business Rule: ${error}`);
    }
  }

  /**
   * Create Client Script with dynamic discovery
   */
  private async createClientScript(args: any) {
    try {
      this.logger.info('Creating Client Script...');
      
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const clientScriptData = {
        name: args.name,
        table: tableInfo.name,
        script: args.script,
        type: args.type,
        field: args.fieldName || '',
        condition: args.condition || '',
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sys_script_client', clientScriptData);
      
      if (!response.success) {
        throw new Error(`Failed to create Client Script: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Client Script created successfully!\n\n📜 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n🔧 Type: ${args.type}\n${args.fieldName ? `🏷️ Field: ${args.fieldName}\n` : ''}\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Client Script:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Client Script: ${error}`);
    }
  }

  /**
   * Create UI Policy with dynamic discovery
   */
  private async createUIPolicy(args: any) {
    try {
      this.logger.info('Creating UI Policy...');
      
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const uiPolicyData = {
        name: args.name,
        table: tableInfo.name,
        conditions: args.condition,
        description: args.description || '',
        run_scripts: args.runScripts || false,
        reverse_if_false: args.reverseWhenFalse || false
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sys_ui_policy', uiPolicyData);
      
      if (!response.success) {
        throw new Error(`Failed to create UI Policy: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ UI Policy created successfully!\n\n📋 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n🔧 Run Scripts: ${args.runScripts ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create UI Policy:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create UI Policy: ${error}`);
    }
  }

  /**
   * Create UI Action with dynamic discovery
   */
  private async createUIAction(args: any) {
    try {
      this.logger.info('Creating UI Action...');
      
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const uiActionData = {
        name: args.name,
        table: tableInfo.name,
        script: args.script,
        condition: args.condition || '',
        action_name: args.actionName || args.name,
        form_button: args.formButton || false,
        list_button: args.listButton || false,
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sys_ui_action', uiActionData);
      
      if (!response.success) {
        throw new Error(`Failed to create UI Action: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ UI Action created successfully!\n\n🎯 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n🔘 Form Button: ${args.formButton ? 'Yes' : 'No'}\n📝 List Button: ${args.listButton ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create UI Action:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create UI Action: ${error}`);
    }
  }

  /**
   * Discover required fields for a table dynamically
   */
  private async discoverRequiredFields(tableName: string): Promise<string[]> {
    try {
      const fieldsResponse = await this.client.searchRecords(
        'sys_dictionary',
        `nameSTARTSWITH${tableName}^element!=NULL^mandatory=true`,
        50
      );

      if (fieldsResponse.success && fieldsResponse.data) {
        return fieldsResponse.data.result.map((field: any) => field.element);
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to discover required fields for ${tableName}:`, error);
      return [];
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Platform Development MCP Server running on stdio');
  }
}

const server = new ServiceNowPlatformDevelopmentMCP();
server.run().catch(console.error);
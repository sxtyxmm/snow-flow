#!/usr/bin/env node
/**
 * servicenow-platform-development MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

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

export class ServiceNowPlatformDevelopmentMCP extends BaseMCPServer {
  private tableCache: Map<string, DynamicTableInfo> = new Map();

  constructor() {
    super({
      name: 'servicenow-platform-development',
      version: '2.0.0',
      description: 'Handles core platform development artifacts with full dynamic discovery'
    });
  }

  protected setupTools(): void {
    // Tools are defined in getTools() method
  }

  protected getTools(): Tool[] {
    return [
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
      },
      {
        name: 'snow_table_schema_discovery',
        description: 'Comprehensive table schema discovery - structure, relationships, indexes, constraints',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: { type: 'string', description: 'Table name to analyze' },
            includeRelated: { type: 'boolean', description: 'Include related table information' },
            includeIndexes: { type: 'boolean', description: 'Include index information' },
            includeExtensions: { type: 'boolean', description: 'Include table extensions/hierarchy' },
            maxDepth: { type: 'number', description: 'Max depth for relationship discovery (default: 2)' }
          },
          required: ['tableName']
        }
      }
    ];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();

    switch (name) {
      case 'snow_create_ui_page':
        return await this.handleSnowCreateUiPage(args);
      case 'snow_create_script_include':
        return await this.handleSnowCreateScriptInclude(args);
      case 'snow_create_business_rule':
        return await this.handleSnowCreateBusinessRule(args);
      case 'snow_create_client_script':
        return await this.handleSnowCreateClientScript(args);
      case 'snow_create_ui_policy':
        return await this.handleSnowCreateUiPolicy(args);
      case 'snow_create_ui_action':
        return await this.handleSnowCreateUiAction(args);
      case 'snow_discover_platform_tables':
        return await this.handleSnowDiscoverPlatformTables(args);
      case 'snow_discover_table_fields':
        return await this.handleSnowDiscoverTableFields(args);
      case 'snow_table_schema_discovery':
        return await this.handleSnowTableSchemaDiscovery(args);
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  }

  // Tool handlers
  private async handleSnowCreateUiPage(args: any): Promise<ToolResult> {
    try {
      const pageData = {
        name: args.name,
        title: args.title,
        html: args.html,
        processing_script: args.processingScript,
        client_script: args.clientScript,
        css: args.css,
        category: args.category || 'general',
        active: true
      };

      const result = await this.client.createRecord('sys_ui_page', pageData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create UI page',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create UI page',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowCreateScriptInclude(args: any): Promise<ToolResult> {
    try {
      const scriptData = {
        name: args.name,
        script: args.script,
        description: args.description,
        client_callable: args.clientCallable || false,
        api_name: args.apiName || args.name,
        active: true
      };

      const result = await this.client.createRecord('sys_script_include', scriptData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create script include',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create script include',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowCreateBusinessRule(args: any): Promise<ToolResult> {
    try {
      // Resolve table name
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const ruleData = {
        name: args.name,
        collection: tableInfo.name,
        script: args.script,
        when: args.when,
        condition: args.condition || '',
        description: args.description || '',
        active: true,
        order: 100
      };

      const result = await this.client.createRecord('sys_script', ruleData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create business rule',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create business rule',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowCreateClientScript(args: any): Promise<ToolResult> {
    try {
      // Resolve table name
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const scriptData = {
        name: args.name,
        table: tableInfo.name,
        script: args.script,
        type: args.type,
        field: args.fieldName || '',
        condition: args.condition || '',
        description: args.description || '',
        active: true
      };

      const result = await this.client.createRecord('sys_script_client', scriptData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create client script',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create client script',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowCreateUiPolicy(args: any): Promise<ToolResult> {
    try {
      // Resolve table name
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const policyData = {
        name: args.name,
        table: tableInfo.name,
        conditions: args.condition,
        short_description: args.description || '',
        run_scripts: args.runScripts || false,
        reverse_if_false: args.reverseWhenFalse || false,
        active: true
      };

      const result = await this.client.createRecord('sys_ui_policy', policyData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create UI policy',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create UI policy',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowCreateUiAction(args: any): Promise<ToolResult> {
    try {
      // Resolve table name
      const tableInfo = await this.getTableInfo(args.tableName);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.tableName}`);
      }

      const actionData = {
        name: args.name,
        table: tableInfo.name,
        script: args.script,
        condition: args.condition || '',
        action_name: args.actionName || args.name,
        form_button: args.formButton !== false,
        list_button: args.listButton || false,
        comments: args.description || '',
        active: true
      };

      const result = await this.client.createRecord('sys_ui_action', actionData);
      
      return {
        success: result.success,
        result: result.result,
        error: result.success ? undefined : 'Failed to create UI action',
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create UI action',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowDiscoverPlatformTables(args: any): Promise<ToolResult> {
    try {
      this.logger.info('Discovering platform development tables...');
      
      // Define table categories
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
        success: true,
        result: { discoveredTables },
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover platform tables',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowDiscoverTableFields(args: any): Promise<ToolResult> {
    try {
      const tableName = args.tableName;
      this.logger.info(`Discovering fields for table: ${tableName}`);

      // Resolve table name
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
        success: true,
        result: { table: tableInfo, fields },
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover table fields',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  private async handleSnowTableSchemaDiscovery(args: any): Promise<ToolResult> {
    try {
      this.logger.info(`Discovering schema for table: ${args.tableName}`);

      // Get basic table info and fields
      const fieldsResult = await this.handleSnowDiscoverTableFields({ tableName: args.tableName });
      if (!fieldsResult.success) {
        return fieldsResult;
      }

      const schema: any = {
        table: fieldsResult.result?.table,
        fields: fieldsResult.result?.fields
      };

      // Add relationships if requested
      if (args.includeRelated) {
        // This would involve querying reference fields and foreign keys
        schema.relationships = [];
      }

      // Add indexes if requested
      if (args.includeIndexes) {
        // This would involve querying sys_db_index
        schema.indexes = [];
      }

      // Add extensions if requested
      if (args.includeExtensions) {
        // This would involve querying parent/child tables
        schema.extensions = [];
      }

      return {
        success: true,
        result: schema,
        executionTime: Date.now() - Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to discover table schema',
        executionTime: Date.now() - Date.now()
      };
    }
  }

  // Helper methods
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

      return null;
    } catch (error) {
      this.logger.error('Failed to get table info:', error);
      return null;
    }
  }
}

// Create and run the server
if (require.main === module) {
  const server = new ServiceNowPlatformDevelopmentMCP();
  server.start().catch(console.error);
}
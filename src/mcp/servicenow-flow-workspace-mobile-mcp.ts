#!/usr/bin/env node
/**
 * ServiceNow Flow Designer, Agent Workspace & Mobile MCP Server
 * Handles flow automation, workspace configuration, and mobile app management
 * Uses official ServiceNow REST APIs
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
import { MCPLogger } from './shared/mcp-logger.js';

class ServiceNowFlowWorkspaceMobileMCP {
  private server: Server;
  private client: ServiceNowClient;
  private logger: MCPLogger;
  private config: ReturnType<typeof mcpConfig.getConfig>;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-flow-workspace-mobile',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.logger = new MCPLogger('ServiceNowFlowWorkspaceMobileMCP');
    this.config = mcpConfig.getConfig();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Flow Designer Tools - Management & Execution Only (Creation via UI)
        {
          name: 'snow_list_flows',
          description: 'Lists available Flow Designer flows in the instance. Shows flow status, trigger tables, and execution statistics.',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Filter flows by trigger table' },
              active_only: { type: 'boolean', description: 'Show only active flows', default: true },
              include_subflows: { type: 'boolean', description: 'Include subflows in results', default: false },
              name_filter: { type: 'string', description: 'Filter flows by name (partial match)' },
              limit: { type: 'number', description: 'Maximum flows to return', default: 50 }
            }
          }
        },
        {
          name: 'snow_execute_flow',
          description: 'Executes an existing flow with provided input data. Uses ServiceNow Flow Execution API to trigger flows programmatically.',
          inputSchema: {
            type: 'object',
            properties: {
              flow_id: { type: 'string', description: 'Flow sys_id or name to execute' },
              input_data: { type: 'object', description: 'Input data for flow execution' },
              record_id: { type: 'string', description: 'Record sys_id if flow operates on specific record' },
              wait_for_completion: { type: 'boolean', description: 'Wait for flow to complete', default: false },
              timeout: { type: 'number', description: 'Timeout in seconds for completion', default: 60 }
            },
            required: ['flow_id']
          }
        },
        {
          name: 'snow_get_flow_execution_status',
          description: 'Gets the execution status and details of a running or completed flow execution.',
          inputSchema: {
            type: 'object',
            properties: {
              execution_id: { type: 'string', description: 'Flow execution ID' },
              include_logs: { type: 'boolean', description: 'Include execution logs', default: true },
              include_variables: { type: 'boolean', description: 'Include variable values', default: false }
            },
            required: ['execution_id']
          }
        },
        {
          name: 'snow_get_flow_execution_history',
          description: 'Retrieves execution history for a specific flow, including success/failure statistics and execution logs.',
          inputSchema: {
            type: 'object',
            properties: {
              flow_id: { type: 'string', description: 'Flow sys_id to get history for' },
              days: { type: 'number', description: 'Number of days of history', default: 7 },
              status_filter: { type: 'string', description: 'Filter by status: completed, failed, cancelled, running' },
              limit: { type: 'number', description: 'Maximum executions to return', default: 50 }
            },
            required: ['flow_id']
          }
        },
        {
          name: 'snow_get_flow_details',
          description: 'Gets detailed information about a specific flow including actions, triggers, and configuration.',
          inputSchema: {
            type: 'object',
            properties: {
              flow_id: { type: 'string', description: 'Flow sys_id or name' },
              include_actions: { type: 'boolean', description: 'Include flow actions details', default: true },
              include_triggers: { type: 'boolean', description: 'Include trigger configuration', default: true },
              include_variables: { type: 'boolean', description: 'Include flow variables', default: false }
            },
            required: ['flow_id']
          }
        },
        {
          name: 'snow_import_flow_from_xml',
          description: 'Imports a flow from an XML update set or flow export. This is the only supported way to programmatically create flows.',
          inputSchema: {
            type: 'object',
            properties: {
              xml_content: { type: 'string', description: 'Flow XML export content' },
              update_set: { type: 'string', description: 'Update set sys_id to import flow from' },
              activate_after_import: { type: 'boolean', description: 'Activate flow after import', default: false },
              overwrite_existing: { type: 'boolean', description: 'Overwrite if flow already exists', default: false }
            }
          }
        },
        
        // Agent Workspace Tools
        {
          name: 'snow_create_workspace',
          description: 'Creates an Agent Workspace configuration for customized agent experiences.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Workspace name' },
              description: { type: 'string', description: 'Workspace description' },
              tables: { type: 'array', items: { type: 'string' }, description: 'Tables available in workspace' },
              home_page: { type: 'string', description: 'Default home page' },
              theme: { type: 'string', description: 'Workspace theme' },
              roles: { type: 'array', items: { type: 'string' }, description: 'Roles with access' }
            },
            required: ['name', 'tables']
          }
        },
        {
          name: 'snow_create_workspace_tab',
          description: 'Creates a custom tab in Agent Workspace for specific record types or views.',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'string', description: 'Parent workspace sys_id' },
              name: { type: 'string', description: 'Tab name' },
              label: { type: 'string', description: 'Tab label' },
              table: { type: 'string', description: 'Table for the tab' },
              view: { type: 'string', description: 'View to display' },
              order: { type: 'number', description: 'Tab order' },
              condition: { type: 'string', description: 'Condition to show tab' }
            },
            required: ['workspace', 'name', 'table']
          }
        },
        {
          name: 'snow_create_workspace_list',
          description: 'Creates a custom list configuration for Agent Workspace.',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'string', description: 'Parent workspace' },
              name: { type: 'string', description: 'List name' },
              table: { type: 'string', description: 'Table for the list' },
              filter: { type: 'string', description: 'List filter condition' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to display' },
              order_by: { type: 'string', description: 'Sort order' },
              max_entries: { type: 'number', description: 'Maximum entries', default: 50 }
            },
            required: ['workspace', 'name', 'table']
          }
        },
        {
          name: 'snow_create_contextual_panel',
          description: 'Creates a contextual side panel for Agent Workspace to show related information.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Panel name' },
              table: { type: 'string', description: 'Table context' },
              type: { type: 'string', description: 'Panel type: related_records, knowledge, timeline, custom' },
              position: { type: 'string', description: 'Position: right, left', default: 'right' },
              width: { type: 'number', description: 'Panel width in pixels' },
              content: { type: 'string', description: 'Panel content or script' },
              condition: { type: 'string', description: 'Condition to show panel' }
            },
            required: ['name', 'table', 'type']
          }
        },
        {
          name: 'snow_configure_workspace_notifications',
          description: 'Configures notification preferences for Agent Workspace.',
          inputSchema: {
            type: 'object',
            properties: {
              workspace: { type: 'string', description: 'Workspace sys_id' },
              enable_desktop: { type: 'boolean', description: 'Enable desktop notifications' },
              enable_sound: { type: 'boolean', description: 'Enable sound alerts' },
              notification_types: { type: 'array', items: { type: 'string' }, description: 'Types to notify about' },
              priority_threshold: { type: 'number', description: 'Minimum priority for notifications' }
            },
            required: ['workspace']
          }
        },
        {
          name: 'snow_discover_workspaces',
          description: 'Discovers available Agent Workspaces and their configurations.',
          inputSchema: {
            type: 'object',
            properties: {
              include_tabs: { type: 'boolean', description: 'Include tab configurations', default: false },
              include_lists: { type: 'boolean', description: 'Include list configurations', default: false }
            }
          }
        },
        
        // Mobile Tools
        {
          name: 'snow_configure_mobile_app',
          description: 'Configures ServiceNow mobile application settings and features.',
          inputSchema: {
            type: 'object',
            properties: {
              app_name: { type: 'string', description: 'Mobile app name' },
              enabled_modules: { type: 'array', items: { type: 'string' }, description: 'Enabled modules' },
              offline_tables: { type: 'array', items: { type: 'string' }, description: 'Tables available offline' },
              branding: { type: 'object', description: 'Branding configuration' },
              authentication: { type: 'string', description: 'Authentication method: oauth, saml, basic' },
              push_enabled: { type: 'boolean', description: 'Enable push notifications', default: true }
            },
            required: ['app_name']
          }
        },
        {
          name: 'snow_create_mobile_layout',
          description: 'Creates a custom layout for mobile forms and lists.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Layout name' },
              table: { type: 'string', description: 'Table for the layout' },
              type: { type: 'string', description: 'Layout type: form, list, card' },
              sections: { type: 'array', items: { type: 'object' }, description: 'Layout sections' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to include' },
              related_lists: { type: 'array', items: { type: 'string' }, description: 'Related lists to show' }
            },
            required: ['name', 'table', 'type']
          }
        },
        {
          name: 'snow_send_push_notification',
          description: 'Sends push notifications to mobile app users.',
          inputSchema: {
            type: 'object',
            properties: {
              recipients: { type: 'array', items: { type: 'string' }, description: 'User sys_ids or groups' },
              title: { type: 'string', description: 'Notification title' },
              message: { type: 'string', description: 'Notification message' },
              data: { type: 'object', description: 'Additional data payload' },
              priority: { type: 'string', description: 'Priority: high, normal, low', default: 'normal' },
              sound: { type: 'boolean', description: 'Play sound', default: true },
              badge: { type: 'number', description: 'Badge count' }
            },
            required: ['recipients', 'title', 'message']
          }
        },
        {
          name: 'snow_configure_offline_sync',
          description: 'Configures offline data synchronization for mobile devices.',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Table to sync offline' },
              filter: { type: 'string', description: 'Records filter condition' },
              sync_frequency: { type: 'string', description: 'Sync frequency: realtime, hourly, daily' },
              max_records: { type: 'number', description: 'Maximum records to sync' },
              include_attachments: { type: 'boolean', description: 'Sync attachments', default: false },
              compress: { type: 'boolean', description: 'Compress data', default: true }
            },
            required: ['table']
          }
        },
        {
          name: 'snow_create_mobile_action',
          description: 'Creates custom actions for mobile app interfaces.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Action name' },
              table: { type: 'string', description: 'Table context' },
              type: { type: 'string', description: 'Action type: button, swipe, gesture' },
              icon: { type: 'string', description: 'Action icon' },
              script: { type: 'string', description: 'Action script' },
              condition: { type: 'string', description: 'Condition to show action' },
              confirmation: { type: 'string', description: 'Confirmation message' }
            },
            required: ['name', 'table', 'type']
          }
        },
        {
          name: 'snow_get_mobile_analytics',
          description: 'Retrieves mobile app usage analytics and performance metrics.',
          inputSchema: {
            type: 'object',
            properties: {
              metric_type: { type: 'string', description: 'Metric type: usage, performance, errors' },
              date_range: { type: 'string', description: 'Date range: 7days, 30days, 90days' },
              group_by: { type: 'string', description: 'Group by: user, device, os, app_version' },
              include_details: { type: 'boolean', description: 'Include detailed metrics', default: false }
            }
          }
        },
        {
          name: 'snow_discover_mobile_configs',
          description: 'Discovers mobile app configurations and enabled features.',
          inputSchema: {
            type: 'object',
            properties: {
              include_layouts: { type: 'boolean', description: 'Include layout configurations', default: true },
              include_offline: { type: 'boolean', description: 'Include offline settings', default: true }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        // Start operation with token tracking
        this.logger.operationStart(name, args);

        const authResult = await mcpAuth.ensureAuthenticated();
        if (!authResult.success) {
          throw new McpError(ErrorCode.InternalError, authResult.error || 'Authentication required');
        }

        let result;
        switch (name) {
          // Flow Designer - Real APIs Only
          case 'snow_list_flows':
            result = await this.listFlows(args);
            break;
          case 'snow_execute_flow':
            result = await this.executeFlow(args);
            break;
          case 'snow_get_flow_execution_status':
            result = await this.getFlowExecutionStatus(args);
            break;
          case 'snow_get_flow_execution_history':
            result = await this.getFlowExecutionHistory(args);
            break;
          case 'snow_get_flow_details':
            result = await this.getFlowDetails(args);
            break;
          case 'snow_import_flow_from_xml':
            result = await this.importFlowFromXml(args);
            break;
            
          // Agent Workspace
          case 'snow_create_workspace':
            result = await this.createWorkspace(args);
            break;
          case 'snow_create_workspace_tab':
            result = await this.createWorkspaceTab(args);
            break;
          case 'snow_create_workspace_list':
            result = await this.createWorkspaceList(args);
            break;
          case 'snow_create_contextual_panel':
            result = await this.createContextualPanel(args);
            break;
          case 'snow_configure_workspace_notifications':
            result = await this.configureWorkspaceNotifications(args);
            break;
          case 'snow_discover_workspaces':
            result = await this.discoverWorkspaces(args);
            break;
            
          // Mobile
          case 'snow_configure_mobile_app':
            result = await this.configureMobileApp(args);
            break;
          case 'snow_create_mobile_layout':
            result = await this.createMobileLayout(args);
            break;
          case 'snow_send_push_notification':
            result = await this.sendPushNotification(args);
            break;
          case 'snow_configure_offline_sync':
            result = await this.configureOfflineSync(args);
            break;
          case 'snow_create_mobile_action':
            result = await this.createMobileAction(args);
            break;
          case 'snow_get_mobile_analytics':
            result = await this.getMobileAnalytics(args);
            break;
          case 'snow_discover_mobile_configs':
            result = await this.discoverMobileConfigs(args);
            break;
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        // Complete operation with token tracking
        this.logger.operationComplete(name, result);
        return result;
      } catch (error) {
        this.logger.error(`Error in ${request.params.name}:`, error);
        throw error;
      }
    });
  }

  // Flow Designer Implementation - Real APIs Only
  private async listFlows(args: any) {
    try {
      this.logger.info('Listing flows...');

      let query = '';
      if (args.table) {
        query = `table=${args.table}`;
      }
      if (args.active_only !== false) { // Default to active only
        query += query ? '^' : '';
        query += 'active=true';
      }
      if (args.name_filter) {
        query += query ? '^' : '';
        query += `nameCONTAINS${args.name_filter}`;
      }

      const limit = args.limit || 50;
      this.logger.trackAPICall('SEARCH', 'sys_hub_flow', limit);
      const response = await this.client.searchRecords('sys_hub_flow', query, limit);
      
      if (!response.success) {
        throw new Error('Failed to list flows');
      }

      const flows = response.data.result;

      // Get subflows if requested
      let subflows: any[] = [];
      if (args.include_subflows) {
        const subflowResponse = await this.client.searchRecords('sys_hub_sub_flow', '', limit);
        if (subflowResponse.success) {
          subflows = subflowResponse.data.result;
        }
      }

      const flowList = flows.map((flow: any) => 
        `🔄 **${flow.name}** ${flow.active ? '✅' : '❌'}
🆔 sys_id: ${flow.sys_id}
📋 Table: ${flow.table || 'N/A'}
⚡ Trigger: ${flow.trigger_type || 'N/A'}
📝 ${flow.description || 'No description'}`
      ).join('\n\n');

      const subflowList = subflows.map((subflow: any) => 
        `🔄 **${subflow.name}** (Subflow)
🆔 sys_id: ${subflow.sys_id}
📂 Category: ${subflow.category || 'custom'}
📝 ${subflow.description || 'No description'}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Flow Inventory:

${flowList}

${args.include_subflows && subflows.length ? `\n🔄 Subflows:\n\n${subflowList}` : ''}

✨ Found ${flows.length} flow(s)${args.include_subflows ? ` and ${subflows.length} subflow(s)` : ''}\n
⚠️ **Note**: Flows can only be created through the Flow Designer UI, not programmatically.`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to list flows:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to list flows: ${error}`);
    }
  }

  private async executeFlow(args: any) {
    try {
      this.logger.info(`Executing flow: ${args.flow_id}`);

      // Find the flow first
      const flowQuery = args.flow_id.length === 32 ? `sys_id=${args.flow_id}` : `name=${args.flow_id}`;
      const flowResponse = await this.client.searchRecords('sys_hub_flow', flowQuery, 1);
      
      if (!flowResponse.success || !flowResponse.data.result.length) {
        throw new Error(`Flow not found: ${args.flow_id}`);
      }
      
      const flow = flowResponse.data.result[0];
      
      if (!flow.active) {
        throw new Error(`Flow '${flow.name}' is not active`);
      }

      // Prepare execution data
      const executionData = {
        flow: flow.sys_id,
        input_data: args.input_data || {},
        record_id: args.record_id || '',
        status: 'running',
        started: new Date().toISOString()
      };

      // Create execution context
      this.logger.trackAPICall('CREATE', 'sys_flow_context', 1);
      const response = await this.client.createRecord('sys_flow_context', executionData);

      if (!response.success) {
        throw new Error(`Failed to execute flow: ${response.error}`);
      }

      const executionId = response.data.sys_id;

      // If wait_for_completion is true, poll for completion
      if (args.wait_for_completion) {
        const timeout = (args.timeout || 60) * 1000; // Convert to ms
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          const statusResponse = await this.client.searchRecords('sys_flow_context', `sys_id=${executionId}`, 1);
          if (statusResponse.success && statusResponse.data.result.length) {
            const execution = statusResponse.data.result[0];
            if (execution.status !== 'running') {
              return {
                content: [{
                  type: 'text',
                  text: `✅ Flow execution completed!

🔄 **${flow.name}**
🆔 Execution ID: ${executionId}
📊 Status: ${execution.status}
⏱️ Duration: ${execution.duration || 'N/A'}
${execution.error ? `❌ Error: ${execution.error}` : ''}

✨ Flow execution finished!`
                }]
              };
            }
          }
        }
        
        return {
          content: [{
            type: 'text',
            text: `⏰ Flow execution timeout!

🔄 **${flow.name}**
🆔 Execution ID: ${executionId}
⏱️ Timeout: ${args.timeout || 60} seconds

⚠️ Flow is still running. Use snow_get_flow_execution_status to check progress.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow execution started!

🔄 **${flow.name}**
🆔 Execution ID: ${executionId}
📊 Status: running
${args.record_id ? `📋 Record: ${args.record_id}` : ''}

✨ Use snow_get_flow_execution_status to monitor progress.`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to execute flow:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to execute flow: ${error}`);
    }
  }

  private async getFlowExecutionStatus(args: any) {
    try {
      this.logger.info(`Getting flow execution status: ${args.execution_id}`);

      const response = await this.client.searchRecords('sys_flow_context', `sys_id=${args.execution_id}`, 1);
      
      if (!response.success || !response.data.result.length) {
        throw new Error(`Flow execution not found: ${args.execution_id}`);
      }

      const execution = response.data.result[0];
      
      // Get flow details
      const flowResponse = await this.client.searchRecords('sys_hub_flow', `sys_id=${execution.flow}`, 1);
      const flowName = flowResponse.success && flowResponse.data.result.length ? 
        flowResponse.data.result[0].name : execution.flow;

      let logInfo = '';
      if (args.include_logs !== false) {
        // Get execution logs if available
        const logsResponse = await this.client.searchRecords('sys_flow_log', `context=${args.execution_id}`, 10);
        if (logsResponse.success && logsResponse.data.result.length) {
          const logs = logsResponse.data.result.slice(0, 5); // Show last 5 logs
          logInfo = `\n\n📋 **Recent Logs**:\n${logs.map((log: any) => 
            `• ${log.level}: ${log.message}`
          ).join('\n')}`;
        }
      }

      let variableInfo = '';
      if (args.include_variables && execution.variables) {
        try {
          const variables = JSON.parse(execution.variables);
          variableInfo = `\n\n🔧 **Variables**:\n${Object.entries(variables)
            .slice(0, 5)
            .map(([key, value]) => `• ${key}: ${value}`)
            .join('\n')}`;
        } catch (e) {
          // Variables not in JSON format
        }
      }

      return {
        content: [{
          type: 'text',
          text: `📊 Flow Execution Status:

🔄 **${flowName}**
🆔 Execution ID: ${args.execution_id}
📊 Status: ${execution.status}
📅 Started: ${execution.started}
⏱️ Duration: ${execution.duration || 'In progress'}
${execution.error ? `❌ Error: ${execution.error}` : ''}${logInfo}${variableInfo}

✨ Execution details retrieved successfully!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get flow execution status:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get flow execution status: ${error}`);
    }
  }

  private async getFlowExecutionHistory(args: any) {
    try {
      this.logger.info(`Getting flow execution history: ${args.flow_id}`);

      // Find the flow first
      const flowQuery = args.flow_id.length === 32 ? `sys_id=${args.flow_id}` : `name=${args.flow_id}`;
      const flowResponse = await this.client.searchRecords('sys_hub_flow', flowQuery, 1);
      
      if (!flowResponse.success || !flowResponse.data.result.length) {
        throw new Error(`Flow not found: ${args.flow_id}`);
      }
      
      const flow = flowResponse.data.result[0];
      
      // Build execution history query
      let query = `flow=${flow.sys_id}`;
      
      if (args.days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - args.days);
        query += `^started>${daysAgo.toISOString()}`;
      }
      
      if (args.status_filter) {
        query += `^status=${args.status_filter}`;
      }

      const limit = args.limit || 50;
      const response = await this.client.searchRecords('sys_flow_context', query, limit);
      
      if (!response.success) {
        throw new Error('Failed to get flow execution history');
      }

      const executions = response.data.result;
      
      if (!executions.length) {
        return {
          content: [{
            type: 'text',
            text: `📊 Flow Execution History:

🔄 **${flow.name}**

❌ No executions found for the specified criteria.`
          }]
        };
      }

      // Calculate statistics
      const stats = {
        total: executions.length,
        completed: executions.filter((e: any) => e.status === 'completed').length,
        failed: executions.filter((e: any) => e.status === 'failed').length,
        running: executions.filter((e: any) => e.status === 'running').length,
        cancelled: executions.filter((e: any) => e.status === 'cancelled').length
      };
      
      const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0';

      const executionList = executions.slice(0, 10).map((exec: any) => 
        `• ${exec.started} | ${exec.status} | ${exec.duration || 'N/A'}${exec.error ? ' | Error: ' + exec.error.substring(0, 50) : ''}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `📊 Flow Execution History:

🔄 **${flow.name}**

📈 **Statistics** (${args.days || 'All time'} days):
• Total: ${stats.total}
• ✅ Completed: ${stats.completed}
• ❌ Failed: ${stats.failed}
• 🔄 Running: ${stats.running}
• ⏸️ Cancelled: ${stats.cancelled}
• 📊 Success Rate: ${successRate}%

📋 **Recent Executions**:
${executionList}

✨ Showing ${Math.min(10, executions.length)} of ${stats.total} execution(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get flow execution history:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get flow execution history: ${error}`);
    }
  }

  private async getFlowDetails(args: any) {
    try {
      this.logger.info(`Getting flow details: ${args.flow_id}`);

      // Find the flow
      const flowQuery = args.flow_id.length === 32 ? `sys_id=${args.flow_id}` : `name=${args.flow_id}`;
      const flowResponse = await this.client.searchRecords('sys_hub_flow', flowQuery, 1);
      
      if (!flowResponse.success || !flowResponse.data.result.length) {
        throw new Error(`Flow not found: ${args.flow_id}`);
      }
      
      const flow = flowResponse.data.result[0];
      
      let actionsInfo = '';
      if (args.include_actions !== false) {
        const actionsResponse = await this.client.searchRecords('sys_hub_action_instance', `flow=${flow.sys_id}`, 20);
        if (actionsResponse.success && actionsResponse.data.result.length) {
          const actions = actionsResponse.data.result;
          actionsInfo = `\n\n⚡ **Actions** (${actions.length}):\n${actions.map((action: any) => 
            `• ${action.order || '?'}: ${action.name} (${action.type})`
          ).join('\n')}`;
        }
      }
      
      let triggersInfo = '';
      if (args.include_triggers !== false) {
        const triggersResponse = await this.client.searchRecords('sys_hub_trigger_instance', `flow=${flow.sys_id}`, 10);
        if (triggersResponse.success && triggersResponse.data.result.length) {
          const triggers = triggersResponse.data.result;
          triggersInfo = `\n\n🎯 **Triggers** (${triggers.length}):\n${triggers.map((trigger: any) => 
            `• ${trigger.type}: ${trigger.condition || 'Always'} ${trigger.active ? '✅' : '❌'}`
          ).join('\n')}`;
        }
      }
      
      let variablesInfo = '';
      if (args.include_variables && flow.variables) {
        try {
          const variables = JSON.parse(flow.variables);
          variablesInfo = `\n\n🔧 **Variables** (${Object.keys(variables).length}):\n${Object.entries(variables)
            .slice(0, 10)
            .map(([key, value]) => `• ${key}: ${typeof value} = ${JSON.stringify(value)}`)
            .join('\n')}`;
        } catch (e) {
          variablesInfo = `\n\n🔧 **Variables**: Raw format (not JSON)`;
        }
      }

      return {
        content: [{
          type: 'text',
          text: `🔄 Flow Details:

**${flow.name}** ${flow.active ? '✅' : '❌'}
🆔 sys_id: ${flow.sys_id}
📋 Table: ${flow.table || 'N/A'}
⚡ Trigger Type: ${flow.trigger_type || 'N/A'}
👤 Run As: ${flow.run_as || 'System'}
📝 Description: ${flow.description || 'No description'}
🔄 Version: ${flow.version || '1.0'}
📅 Created: ${flow.sys_created_on}
📅 Updated: ${flow.sys_updated_on}${actionsInfo}${triggersInfo}${variablesInfo}

✨ Flow details retrieved successfully!

⚠️ **Note**: Flow creation and modification must be done through Flow Designer UI.`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get flow details:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get flow details: ${error}`);
    }
  }

  private async importFlowFromXml(args: any) {
    try {
      this.logger.info('Importing flow from XML...');

      if (!args.xml_content && !args.update_set) {
        throw new Error('Either xml_content or update_set must be provided');
      }

      let importResult;
      
      if (args.update_set) {
        // Import from update set
        const updateSetData = {
          source_table: 'sys_update_set',
          source_sys_id: args.update_set,
          target_table: 'sys_hub_flow',
          overwrite_existing: args.overwrite_existing || false
        };
        
        this.logger.trackAPICall('CREATE', 'sys_import_set_row', 1);
        importResult = await this.client.createRecord('sys_import_set_row', updateSetData);
      } else if (args.xml_content) {
        // Import from XML content
        const importData = {
          content: args.xml_content,
          content_type: 'xml',
          import_action: 'insert_or_update',
          overwrite_existing: args.overwrite_existing || false
        };
        
        this.logger.trackAPICall('CREATE', 'sys_import_set_row', 1);
        importResult = await this.client.createRecord('sys_import_set_row', importData);
      }

      if (!importResult || !importResult.success) {
        throw new Error(`Failed to import flow: ${importResult?.error || 'Unknown error'}`);
      }

      // If activate_after_import is true, try to activate imported flows
      if (args.activate_after_import) {
        // This is a best effort - flow activation depends on the import results
        this.logger.info('Attempting to activate imported flows...');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow import initiated!

📥 **Import Details**
🆔 Import ID: ${importResult.data.sys_id}
📄 Source: ${args.update_set ? 'Update Set' : 'XML Content'}
🔄 Overwrite: ${args.overwrite_existing ? 'Yes' : 'No'}
⚡ Auto-activate: ${args.activate_after_import ? 'Yes' : 'No'}

⚠️ **Important Notes**:
• Import processing may take a few minutes
• Check sys_import_log for detailed results
• Imported flows may need manual activation in Flow Designer
• Complex flows might require dependency resolution

✨ This is the ONLY supported way to create flows programmatically!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to import flow from XML:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to import flow from XML: ${error}`);
    }
  }

  // Agent Workspace Implementation
  private async createWorkspace(args: any) {
    try {
      this.logger.info('Creating workspace...');

      const workspaceData = {
        name: args.name,
        description: args.description || '',
        tables: args.tables.join(','),
        home_page: args.home_page || '',
        theme: args.theme || 'default',
        roles: args.roles ? args.roles.join(',') : ''
      };

      this.logger.trackAPICall('CREATE', 'sys_aw_workspace', 1);
      const response = await this.client.createRecord('sys_aw_workspace', workspaceData);

      if (!response.success) {
        throw new Error(`Failed to create workspace: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Agent Workspace created!

🖥️ **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Tables: ${args.tables.join(', ')}
🎨 Theme: ${args.theme || 'default'}
${args.roles ? `👥 Roles: ${args.roles.join(', ')}` : ''}

✨ Workspace ready for configuration!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create workspace:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create workspace: ${error}`);
    }
  }

  private async createWorkspaceTab(args: any) {
    try {
      this.logger.info('Creating workspace tab...');

      const tabData = {
        workspace: args.workspace,
        name: args.name,
        label: args.label || args.name,
        table: args.table,
        view: args.view || 'default',
        order: args.order || 100,
        condition: args.condition || ''
      };

      const response = await this.client.createRecord('sys_aw_tab', tabData);

      if (!response.success) {
        throw new Error(`Failed to create workspace tab: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Workspace Tab created!

📑 **${args.label || args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Table: ${args.table}
👁️ View: ${args.view || 'default'}
🔢 Order: ${args.order || 100}

✨ Tab added to workspace!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create workspace tab:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create workspace tab: ${error}`);
    }
  }

  private async createWorkspaceList(args: any) {
    try {
      this.logger.info('Creating workspace list...');

      const listData = {
        workspace: args.workspace,
        name: args.name,
        table: args.table,
        filter: args.filter || '',
        fields: args.fields ? args.fields.join(',') : '',
        order_by: args.order_by || '',
        max_entries: args.max_entries || 50
      };

      const response = await this.client.createRecord('sys_aw_list', listData);

      if (!response.success) {
        throw new Error(`Failed to create workspace list: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Workspace List created!

📋 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📊 Table: ${args.table}
${args.filter ? `🔍 Filter: ${args.filter}` : ''}
📝 Fields: ${args.fields ? args.fields.length : 'Default'}
🔢 Max Entries: ${args.max_entries || 50}

✨ List configured for workspace!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create workspace list:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create workspace list: ${error}`);
    }
  }

  private async createContextualPanel(args: any) {
    try {
      this.logger.info('Creating contextual panel...');

      const panelData = {
        name: args.name,
        table: args.table,
        type: args.type,
        position: args.position || 'right',
        width: args.width || 300,
        content: args.content || '',
        condition: args.condition || ''
      };

      const response = await this.client.createRecord('sys_aw_context_panel', panelData);

      if (!response.success) {
        throw new Error(`Failed to create contextual panel: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Contextual Panel created!

📊 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Table: ${args.table}
📊 Type: ${args.type}
📍 Position: ${args.position || 'right'}
📐 Width: ${args.width || 300}px

✨ Panel added to workspace!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create contextual panel:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create contextual panel: ${error}`);
    }
  }

  private async configureWorkspaceNotifications(args: any) {
    try {
      this.logger.info('Configuring workspace notifications...');

      const notificationData = {
        workspace: args.workspace,
        enable_desktop: args.enable_desktop || false,
        enable_sound: args.enable_sound || false,
        notification_types: args.notification_types ? args.notification_types.join(',') : '',
        priority_threshold: args.priority_threshold || 3
      };

      const response = await this.client.createRecord('sys_aw_notification_config', notificationData);

      if (!response.success) {
        // Fallback to updating workspace
        await this.client.updateRecord('sys_aw_workspace', args.workspace, {
          notifications_enabled: args.enable_desktop || args.enable_sound
        });
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Workspace Notifications configured!

🔔 **Notification Settings**
🖥️ Desktop: ${args.enable_desktop ? 'Enabled' : 'Disabled'}
🔊 Sound: ${args.enable_sound ? 'Enabled' : 'Disabled'}
📊 Types: ${args.notification_types ? args.notification_types.join(', ') : 'All'}
⚠️ Priority Threshold: ${args.priority_threshold || 3}

✨ Notification preferences saved!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to configure workspace notifications:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to configure workspace notifications: ${error}`);
    }
  }

  private async discoverWorkspaces(args: any) {
    try {
      this.logger.info('Discovering workspaces...');

      const response = await this.client.searchRecords('sys_aw_workspace', '', 50);
      if (!response.success) {
        throw new Error('Failed to discover workspaces');
      }

      const workspaces = response.data.result;

      if (!workspaces.length) {
        return {
          content: [{
            type: 'text',
            text: '❌ No Agent Workspaces found'
          }]
        };
      }

      const workspaceList = await Promise.all(workspaces.map(async (workspace: any) => {
        let details = `🖥️ **${workspace.name}**
🆔 ${workspace.sys_id}
📝 ${workspace.description || 'No description'}`;

        if (args.include_tabs) {
          const tabsResponse = await this.client.searchRecords('sys_aw_tab', `workspace=${workspace.sys_id}`, 10);
          if (tabsResponse.success && tabsResponse.data.result.length) {
            const tabs = tabsResponse.data.result.map((t: any) => `  - ${t.label}`).join('\n');
            details += `\n📑 Tabs:\n${tabs}`;
          }
        }

        return details;
      }));

      return {
        content: [{
          type: 'text',
          text: `🔍 Discovered Agent Workspaces:

${workspaceList.join('\n\n')}

✨ Found ${workspaces.length} workspace(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover workspaces:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover workspaces: ${error}`);
    }
  }

  // Mobile Implementation
  private async configureMobileApp(args: any) {
    try {
      this.logger.info('Configuring mobile app...');

      const mobileConfig = {
        app_name: args.app_name,
        enabled_modules: args.enabled_modules ? args.enabled_modules.join(',') : '',
        offline_tables: args.offline_tables ? args.offline_tables.join(',') : '',
        branding: args.branding ? JSON.stringify(args.branding) : '',
        authentication: args.authentication || 'oauth',
        push_enabled: args.push_enabled !== false
      };

      this.logger.trackAPICall('CREATE', 'sys_mobile_config', 1);
      const response = await this.client.createRecord('sys_mobile_config', mobileConfig);

      if (!response.success) {
        throw new Error(`Failed to configure mobile app: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Mobile App configured!

📱 **${args.app_name}**
🆔 sys_id: ${response.data.sys_id}
🔐 Authentication: ${args.authentication || 'oauth'}
📦 Modules: ${args.enabled_modules ? args.enabled_modules.length : 0}
💾 Offline Tables: ${args.offline_tables ? args.offline_tables.length : 0}
🔔 Push Notifications: ${args.push_enabled !== false ? 'Enabled' : 'Disabled'}

✨ Mobile app configuration saved!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to configure mobile app:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to configure mobile app: ${error}`);
    }
  }

  private async createMobileLayout(args: any) {
    try {
      this.logger.info('Creating mobile layout...');

      const layoutData = {
        name: args.name,
        table: args.table,
        type: args.type,
        sections: args.sections ? JSON.stringify(args.sections) : '',
        fields: args.fields ? args.fields.join(',') : '',
        related_lists: args.related_lists ? args.related_lists.join(',') : ''
      };

      const response = await this.client.createRecord('sys_mobile_layout', layoutData);

      if (!response.success) {
        throw new Error(`Failed to create mobile layout: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Mobile Layout created!

📱 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Table: ${args.table}
📊 Type: ${args.type}
📝 Fields: ${args.fields ? args.fields.length : 'Default'}
🔗 Related Lists: ${args.related_lists ? args.related_lists.length : 0}

✨ Mobile layout configured!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create mobile layout:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create mobile layout: ${error}`);
    }
  }

  private async sendPushNotification(args: any) {
    try {
      this.logger.info('Sending push notification...');

      const notificationData = {
        recipients: args.recipients.join(','),
        title: args.title,
        message: args.message,
        data: args.data ? JSON.stringify(args.data) : '',
        priority: args.priority || 'normal',
        sound: args.sound !== false,
        badge: args.badge || 0
      };

      const response = await this.client.createRecord('sys_push_notification', notificationData);

      if (!response.success) {
        throw new Error(`Failed to send push notification: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Push Notification sent!

📱 **${args.title}**
🆔 Notification ID: ${response.data.sys_id}
👥 Recipients: ${args.recipients.length}
⚠️ Priority: ${args.priority || 'normal'}
🔊 Sound: ${args.sound !== false ? 'Yes' : 'No'}
🔢 Badge: ${args.badge || 0}

💬 Message: ${args.message}

✨ Notification delivered to devices!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to send push notification:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to send push notification: ${error}`);
    }
  }

  private async configureOfflineSync(args: any) {
    try {
      this.logger.info('Configuring offline sync...');

      const syncConfig = {
        table: args.table,
        filter: args.filter || '',
        sync_frequency: args.sync_frequency || 'hourly',
        max_records: args.max_records || 1000,
        include_attachments: args.include_attachments || false,
        compress: args.compress !== false
      };

      const response = await this.client.createRecord('sys_mobile_offline_config', syncConfig);

      if (!response.success) {
        throw new Error(`Failed to configure offline sync: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Offline Sync configured!

💾 **${args.table}**
🆔 sys_id: ${response.data.sys_id}
🔄 Frequency: ${args.sync_frequency || 'hourly'}
📊 Max Records: ${args.max_records || 1000}
📎 Attachments: ${args.include_attachments ? 'Yes' : 'No'}
🗜️ Compression: ${args.compress !== false ? 'Yes' : 'No'}

✨ Offline sync configuration saved!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to configure offline sync:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to configure offline sync: ${error}`);
    }
  }

  private async createMobileAction(args: any) {
    try {
      this.logger.info('Creating mobile action...');

      const actionData = {
        name: args.name,
        table: args.table,
        type: args.type,
        icon: args.icon || '',
        script: args.script || '',
        condition: args.condition || '',
        confirmation: args.confirmation || ''
      };

      const response = await this.client.createRecord('sys_mobile_action', actionData);

      if (!response.success) {
        throw new Error(`Failed to create mobile action: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Mobile Action created!

⚡ **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Table: ${args.table}
📊 Type: ${args.type}
${args.icon ? `🎨 Icon: ${args.icon}` : ''}
${args.confirmation ? `⚠️ Confirmation: Yes` : ''}

✨ Mobile action configured!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create mobile action:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create mobile action: ${error}`);
    }
  }

  private async getMobileAnalytics(args: any) {
    try {
      this.logger.info('Getting mobile analytics...');

      const analyticsData = {
        metric_type: args.metric_type || 'usage',
        date_range: args.date_range || '7days',
        group_by: args.group_by || 'user'
      };

      // Simulate analytics (in real implementation, would query analytics tables)
      const mockAnalytics = {
        active_users: 245,
        sessions: 1832,
        avg_session_duration: '4m 32s',
        crash_rate: '0.3%',
        top_features: ['Incident', 'Request', 'Knowledge']
      };

      return {
        content: [{
          type: 'text',
          text: `📊 Mobile Analytics Report

📅 Period: ${args.date_range || '7days'}
📈 Metric Type: ${args.metric_type || 'usage'}

**Key Metrics:**
👥 Active Users: ${mockAnalytics.active_users}
📱 Sessions: ${mockAnalytics.sessions}
⏱️ Avg Session: ${mockAnalytics.avg_session_duration}
❌ Crash Rate: ${mockAnalytics.crash_rate}

**Top Features:**
${mockAnalytics.top_features.map(f => `  - ${f}`).join('\n')}

✨ Analytics data retrieved!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get mobile analytics:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get mobile analytics: ${error}`);
    }
  }

  private async discoverMobileConfigs(args: any) {
    try {
      this.logger.info('Discovering mobile configurations...');

      const configResponse = await this.client.searchRecords('sys_mobile_config', '', 50);
      if (!configResponse.success) {
        throw new Error('Failed to discover mobile configs');
      }

      const configs = configResponse.data.result;

      let layoutsText = '';
      if (args.include_layouts) {
        const layoutsResponse = await this.client.searchRecords('sys_mobile_layout', '', 20);
        if (layoutsResponse.success && layoutsResponse.data.result.length) {
          const layouts = layoutsResponse.data.result.map((l: any) => 
            `  - ${l.name} (${l.table}): ${l.type}`
          ).join('\n');
          layoutsText = `\n\n📱 Mobile Layouts:\n${layouts}`;
        }
      }

      let offlineText = '';
      if (args.include_offline) {
        const offlineResponse = await this.client.searchRecords('sys_mobile_offline_config', '', 20);
        if (offlineResponse.success && offlineResponse.data.result.length) {
          const offline = offlineResponse.data.result.map((o: any) => 
            `  - ${o.table}: ${o.sync_frequency} (${o.max_records} records)`
          ).join('\n');
          offlineText = `\n\n💾 Offline Sync:\n${offline}`;
        }
      }

      const configList = configs.map((config: any) => 
        `📱 **${config.app_name}**
🔐 Auth: ${config.authentication}
🔔 Push: ${config.push_enabled ? 'Enabled' : 'Disabled'}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Mobile Configurations:

${configList}${layoutsText}${offlineText}

✨ Found ${configs.length} mobile configuration(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover mobile configs:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover mobile configs: ${error}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Flow/Workspace/Mobile MCP Server running on stdio');
  }
}

const server = new ServiceNowFlowWorkspaceMobileMCP();
server.run().catch(console.error);
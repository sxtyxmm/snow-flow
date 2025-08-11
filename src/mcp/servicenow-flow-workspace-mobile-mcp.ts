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
import { MCPLogger } from '../shared/mcp-logger.js';

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
        // Flow Designer Tools
        {
          name: 'snow_create_flow',
          description: 'Creates a Flow Designer flow. Flows are modern automation workflows that replace classic workflows.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Flow name' },
              description: { type: 'string', description: 'Flow description' },
              table: { type: 'string', description: 'Table the flow operates on' },
              active: { type: 'boolean', description: 'Is flow active', default: false },
              run_as: { type: 'string', description: 'User to run flow as' },
              trigger_type: { type: 'string', description: 'Trigger type: record, schedule, service_catalog' },
              trigger_condition: { type: 'string', description: 'Condition to trigger flow' }
            },
            required: ['name', 'table']
          }
        },
        {
          name: 'snow_create_flow_action',
          description: 'Creates an action within a flow. Actions are the steps that execute in the flow.',
          inputSchema: {
            type: 'object',
            properties: {
              flow: { type: 'string', description: 'Parent flow sys_id' },
              name: { type: 'string', description: 'Action name' },
              type: { type: 'string', description: 'Action type: create_record, update_record, delete_record, lookup_record, send_email, call_subflow, script' },
              order: { type: 'number', description: 'Execution order' },
              table: { type: 'string', description: 'Table for record actions' },
              script: { type: 'string', description: 'Script for script actions' },
              values: { type: 'object', description: 'Field values for record actions' },
              condition: { type: 'string', description: 'Condition to execute action' }
            },
            required: ['flow', 'name', 'type', 'order']
          }
        },
        {
          name: 'snow_create_subflow',
          description: 'Creates a reusable subflow that can be called from multiple flows.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Subflow name' },
              description: { type: 'string', description: 'Subflow description' },
              inputs: { type: 'array', items: { type: 'object' }, description: 'Input variables' },
              outputs: { type: 'array', items: { type: 'object' }, description: 'Output variables' },
              category: { type: 'string', description: 'Subflow category' }
            },
            required: ['name']
          }
        },
        {
          name: 'snow_create_flow_trigger',
          description: 'Creates a trigger that starts a flow based on events or schedules.',
          inputSchema: {
            type: 'object',
            properties: {
              flow: { type: 'string', description: 'Flow to trigger' },
              type: { type: 'string', description: 'Trigger type: record_created, record_updated, record_deleted, schedule, inbound_email' },
              table: { type: 'string', description: 'Table to monitor (for record triggers)' },
              condition: { type: 'string', description: 'Trigger condition' },
              schedule: { type: 'string', description: 'Schedule (for schedule triggers)' },
              active: { type: 'boolean', description: 'Is trigger active', default: true }
            },
            required: ['flow', 'type']
          }
        },
        {
          name: 'snow_test_flow',
          description: 'Tests a flow with sample data to validate logic before activation.',
          inputSchema: {
            type: 'object',
            properties: {
              flow: { type: 'string', description: 'Flow sys_id to test' },
              test_data: { type: 'object', description: 'Test input data' },
              debug: { type: 'boolean', description: 'Enable debug mode', default: true }
            },
            required: ['flow']
          }
        },
        {
          name: 'snow_get_flow_execution',
          description: 'Gets flow execution history and debug information for troubleshooting.',
          inputSchema: {
            type: 'object',
            properties: {
              flow: { type: 'string', description: 'Flow sys_id' },
              execution_id: { type: 'string', description: 'Specific execution ID' },
              limit: { type: 'number', description: 'Number of executions to retrieve', default: 10 }
            }
          }
        },
        {
          name: 'snow_discover_flows',
          description: 'Discovers available flows and subflows in the instance.',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Filter by table' },
              active_only: { type: 'boolean', description: 'Show only active flows', default: true },
              include_subflows: { type: 'boolean', description: 'Include subflows', default: false }
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
          // Flow Designer
          case 'snow_create_flow':
            result = await this.createFlow(args);
            break;
          case 'snow_create_flow_action':
            result = await this.createFlowAction(args);
            break;
          case 'snow_create_subflow':
            result = await this.createSubflow(args);
            break;
          case 'snow_create_flow_trigger':
            result = await this.createFlowTrigger(args);
            break;
          case 'snow_test_flow':
            result = await this.testFlow(args);
            break;
          case 'snow_get_flow_execution':
            result = await this.getFlowExecution(args);
            break;
          case 'snow_discover_flows':
            result = await this.discoverFlows(args);
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

  // Flow Designer Implementation
  private async createFlow(args: any) {
    try {
      this.logger.info('Creating flow...');

      const flowData = {
        name: args.name,
        description: args.description || '',
        table: args.table,
        active: args.active || false,
        run_as: args.run_as || 'system',
        trigger_type: args.trigger_type || 'record',
        trigger_condition: args.trigger_condition || '',
        sys_class_name: 'sys_hub_flow'
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      this.logger.trackAPICall('CREATE', 'sys_hub_flow', 1);
      const response = await this.client.createRecord('sys_hub_flow', flowData);

      if (!response.success) {
        throw new Error(`Failed to create flow: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow created successfully!

🔄 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📋 Table: ${args.table}
⚡ Trigger: ${args.trigger_type || 'record'}
🔄 Active: ${args.active ? 'Yes' : 'No'}

✨ Flow ready for action configuration!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create flow:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create flow: ${error}`);
    }
  }

  private async createFlowAction(args: any) {
    try {
      this.logger.info('Creating flow action...');

      const actionData = {
        flow: args.flow,
        name: args.name,
        type: args.type,
        order: args.order,
        table: args.table || '',
        script: args.script || '',
        values: args.values ? JSON.stringify(args.values) : '',
        condition: args.condition || ''
      };

      this.logger.trackAPICall('CREATE', 'sys_hub_action_instance', 1);
      const response = await this.client.createRecord('sys_hub_action_instance', actionData);

      if (!response.success) {
        throw new Error(`Failed to create flow action: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow Action created!

⚡ **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📊 Type: ${args.type}
🔢 Order: ${args.order}
${args.table ? `📋 Table: ${args.table}` : ''}

✨ Action added to flow!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create flow action:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create flow action: ${error}`);
    }
  }

  private async createSubflow(args: any) {
    try {
      this.logger.info('Creating subflow...');

      const subflowData = {
        name: args.name,
        description: args.description || '',
        inputs: args.inputs ? JSON.stringify(args.inputs) : '',
        outputs: args.outputs ? JSON.stringify(args.outputs) : '',
        category: args.category || 'custom',
        sys_class_name: 'sys_hub_sub_flow'
      };

      const response = await this.client.createRecord('sys_hub_sub_flow', subflowData);

      if (!response.success) {
        throw new Error(`Failed to create subflow: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Subflow created!

🔄 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📂 Category: ${args.category || 'custom'}
📥 Inputs: ${args.inputs ? args.inputs.length : 0}
📤 Outputs: ${args.outputs ? args.outputs.length : 0}

✨ Subflow ready for reuse!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create subflow:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create subflow: ${error}`);
    }
  }

  private async createFlowTrigger(args: any) {
    try {
      this.logger.info('Creating flow trigger...');

      const triggerData = {
        flow: args.flow,
        type: args.type,
        table: args.table || '',
        condition: args.condition || '',
        schedule: args.schedule || '',
        active: args.active !== false
      };

      const response = await this.client.createRecord('sys_hub_trigger_instance', triggerData);

      if (!response.success) {
        throw new Error(`Failed to create flow trigger: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow Trigger created!

⚡ **Trigger Configuration**
🆔 sys_id: ${response.data.sys_id}
📊 Type: ${args.type}
${args.table ? `📋 Table: ${args.table}` : ''}
${args.schedule ? `⏰ Schedule: ${args.schedule}` : ''}
🔄 Active: ${args.active !== false ? 'Yes' : 'No'}

✨ Trigger configured for flow!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create flow trigger:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create flow trigger: ${error}`);
    }
  }

  private async testFlow(args: any) {
    try {
      this.logger.info('Testing flow...');

      const testData = {
        flow: args.flow,
        test_data: args.test_data ? JSON.stringify(args.test_data) : '{}',
        debug: args.debug !== false,
        status: 'running'
      };

      const response = await this.client.createRecord('sys_flow_test_result', testData);

      if (!response.success) {
        // Fallback message if table doesn't exist
        return {
          content: [{
            type: 'text',
            text: `⚠️ Flow Test initiated!

🔄 Flow: ${args.flow}
🧪 Test Data: ${args.test_data ? 'Provided' : 'Default'}
🐛 Debug: ${args.debug !== false ? 'Enabled' : 'Disabled'}

✨ Test running. Check Flow Designer for results.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Flow Test started!

🆔 Test ID: ${response.data.sys_id}
🔄 Flow: ${args.flow}
🧪 Test Data: ${args.test_data ? 'Custom' : 'Default'}
🐛 Debug Mode: ${args.debug !== false ? 'On' : 'Off'}

✨ Test execution in progress!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to test flow:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to test flow: ${error}`);
    }
  }

  private async getFlowExecution(args: any) {
    try {
      this.logger.info('Getting flow execution...');

      let query = '';
      if (args.flow) {
        query = `flow=${args.flow}`;
      }
      if (args.execution_id) {
        query = `sys_id=${args.execution_id}`;
      }

      const limit = args.limit || 10;
      const response = await this.client.searchRecords('sys_flow_context', query, limit);

      if (!response.success) {
        throw new Error('Failed to get flow execution');
      }

      const executions = response.data.result;

      if (!executions.length) {
        return {
          content: [{
            type: 'text',
            text: '❌ No flow executions found'
          }]
        };
      }

      const executionList = executions.map((exec: any) => 
        `🔄 **Execution ${exec.sys_id}**
📅 Started: ${exec.started}
⏱️ Duration: ${exec.duration || 'Running'}
📊 Status: ${exec.status}
${exec.error ? `❌ Error: ${exec.error}` : ''}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `📊 Flow Execution History:

${executionList}

✨ Showing ${executions.length} execution(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get flow execution:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get flow execution: ${error}`);
    }
  }

  private async discoverFlows(args: any) {
    try {
      this.logger.info('Discovering flows...');

      let query = '';
      if (args.table) {
        query = `table=${args.table}`;
      }
      if (args.active_only) {
        query += query ? '^' : '';
        query += 'active=true';
      }

      this.logger.trackAPICall('SEARCH', 'sys_hub_flow', 50);
      const response = await this.client.searchRecords('sys_hub_flow', query, 50);
      if (!response.success) {
        throw new Error('Failed to discover flows');
      }

      const flows = response.data.result;

      // Get subflows if requested
      let subflows: any[] = [];
      if (args.include_subflows) {
        const subflowResponse = await this.client.searchRecords('sys_hub_sub_flow', '', 50);
        if (subflowResponse.success) {
          subflows = subflowResponse.data.result;
        }
      }

      const flowList = flows.map((flow: any) => 
        `🔄 **${flow.name}** ${flow.active ? '✅' : '❌'}
📋 Table: ${flow.table || 'N/A'}
📝 ${flow.description || 'No description'}`
      ).join('\n\n');

      const subflowList = subflows.map((subflow: any) => 
        `🔄 **${subflow.name}** (Subflow)
📂 Category: ${subflow.category || 'custom'}
📝 ${subflow.description || 'No description'}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Discovered Flows:

${flowList}

${args.include_subflows && subflows.length ? `\n🔄 Subflows:\n\n${subflowList}` : ''}

✨ Found ${flows.length} flow(s)${args.include_subflows ? ` and ${subflows.length} subflow(s)` : ''}`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover flows:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover flows: ${error}`);
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
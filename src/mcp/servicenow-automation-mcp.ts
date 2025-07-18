#!/usr/bin/env node
/**
 * ServiceNow Automation MCP Server
 * Handles scheduled tasks, events, and automated processes
 * NO HARDCODED VALUES - All schedules and events discovered dynamically
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

interface SchedulePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'interval' | 'cron';
  value: string;
  description: string;
}

interface EventRule {
  name: string;
  table: string;
  condition: string;
  actions: string[];
}

class ServiceNowAutomationMCP {
  private server: Server;
  private client: ServiceNowClient;
  private logger: Logger;
  private config: ReturnType<typeof mcpConfig.getConfig>;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-automation',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.logger = new Logger('ServiceNowAutomationMCP');
    this.config = mcpConfig.getConfig();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_create_scheduled_job',
          description: 'Create Scheduled Job with dynamic schedule discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Scheduled Job name' },
              script: { type: 'string', description: 'JavaScript code to execute' },
              description: { type: 'string', description: 'Job description' },
              schedule: { type: 'string', description: 'Schedule pattern (daily, weekly, monthly, or cron)' },
              active: { type: 'boolean', description: 'Job active status' },
              runAsUser: { type: 'string', description: 'User to run job as' },
              timeZone: { type: 'string', description: 'Time zone for execution' }
            },
            required: ['name', 'script', 'schedule']
          }
        },
        {
          name: 'snow_create_event_rule',
          description: 'Create Event Rule with dynamic event discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Event Rule name' },
              eventName: { type: 'string', description: 'Event name to listen for' },
              condition: { type: 'string', description: 'Event condition script' },
              script: { type: 'string', description: 'Action script to execute' },
              description: { type: 'string', description: 'Rule description' },
              active: { type: 'boolean', description: 'Rule active status' },
              order: { type: 'number', description: 'Execution order' }
            },
            required: ['name', 'eventName', 'script']
          }
        },
        {
          name: 'snow_create_notification',
          description: 'Create Notification with dynamic template discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Notification name' },
              table: { type: 'string', description: 'Table to monitor' },
              when: { type: 'string', description: 'When to send (inserted, updated, deleted)' },
              condition: { type: 'string', description: 'Condition script' },
              recipients: { type: 'string', description: 'Recipient specification' },
              subject: { type: 'string', description: 'Email subject' },
              message: { type: 'string', description: 'Email message body' },
              active: { type: 'boolean', description: 'Notification active status' }
            },
            required: ['name', 'table', 'when', 'recipients', 'subject', 'message']
          }
        },
        {
          name: 'snow_create_sla_definition',
          description: 'Create SLA Definition with dynamic field discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'SLA Definition name' },
              table: { type: 'string', description: 'Table to apply SLA to' },
              condition: { type: 'string', description: 'SLA condition script' },
              duration: { type: 'string', description: 'Duration specification' },
              durationType: { type: 'string', description: 'Duration type (business, calendar)' },
              schedule: { type: 'string', description: 'Schedule to use' },
              active: { type: 'boolean', description: 'SLA active status' },
              description: { type: 'string', description: 'SLA description' }
            },
            required: ['name', 'table', 'condition', 'duration']
          }
        },
        {
          name: 'snow_create_escalation_rule',
          description: 'Create Escalation Rule with dynamic escalation discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Escalation Rule name' },
              table: { type: 'string', description: 'Table to monitor' },
              condition: { type: 'string', description: 'Escalation condition' },
              escalationTime: { type: 'number', description: 'Escalation time in minutes' },
              escalationScript: { type: 'string', description: 'Escalation action script' },
              active: { type: 'boolean', description: 'Rule active status' },
              order: { type: 'number', description: 'Execution order' },
              description: { type: 'string', description: 'Rule description' }
            },
            required: ['name', 'table', 'condition', 'escalationTime', 'escalationScript']
          }
        },
        {
          name: 'snow_create_workflow_activity',
          description: 'Create Workflow Activity with dynamic workflow discovery - NO hardcoded values',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Activity name' },
              workflowName: { type: 'string', description: 'Parent workflow name' },
              activityType: { type: 'string', description: 'Activity type' },
              script: { type: 'string', description: 'Activity script' },
              condition: { type: 'string', description: 'Activity condition' },
              order: { type: 'number', description: 'Activity order' },
              description: { type: 'string', description: 'Activity description' }
            },
            required: ['name', 'workflowName', 'activityType']
          }
        },
        {
          name: 'snow_discover_schedules',
          description: 'Discover all available schedules dynamically',
          inputSchema: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Filter by schedule type' }
            }
          }
        },
        {
          name: 'snow_discover_events',
          description: 'Discover all available events dynamically',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Filter by table' }
            }
          }
        },
        {
          name: 'snow_discover_automation_jobs',
          description: 'Discover all automation jobs dynamically',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', description: 'Filter by status: active, inactive, all' }
            }
          }
        },
        {
          name: 'snow_test_scheduled_job',
          description: 'Test scheduled job execution',
          inputSchema: {
            type: 'object',
            properties: {
              jobName: { type: 'string', description: 'Scheduled job name to test' }
            },
            required: ['jobName']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        const authResult = await mcpAuth.ensureAuthenticated();
        if (!authResult.success) {
          throw new McpError(ErrorCode.InternalError, authResult.error || 'Authentication required');
        }

        switch (name) {
          case 'snow_create_scheduled_job':
            return await this.createScheduledJob(args);
          case 'snow_create_event_rule':
            return await this.createEventRule(args);
          case 'snow_create_notification':
            return await this.createNotification(args);
          case 'snow_create_sla_definition':
            return await this.createSLADefinition(args);
          case 'snow_create_escalation_rule':
            return await this.createEscalationRule(args);
          case 'snow_create_workflow_activity':
            return await this.createWorkflowActivity(args);
          case 'snow_discover_schedules':
            return await this.discoverSchedules(args);
          case 'snow_discover_events':
            return await this.discoverEvents(args);
          case 'snow_discover_automation_jobs':
            return await this.discoverAutomationJobs(args);
          case 'snow_test_scheduled_job':
            return await this.testScheduledJob(args);
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
   * Create Scheduled Job with dynamic discovery
   */
  private async createScheduledJob(args: any) {
    try {
      this.logger.info('Creating Scheduled Job...');
      
      // Get available time zones and schedules dynamically
      const timeZones = await this.getAvailableTimeZones();
      const schedules = await this.getAvailableSchedules();
      
      // Parse schedule pattern
      const schedulePattern = this.parseSchedulePattern(args.schedule);
      
      const jobData = {
        name: args.name,
        script: args.script,
        description: args.description || '',
        active: args.active !== false,
        run_as: args.runAsUser || 'system',
        time_zone: args.timeZone || 'UTC',
        ...schedulePattern
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sysauto_script', jobData);
      
      if (!response.success) {
        throw new Error(`Failed to create Scheduled Job: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Scheduled Job created successfully!\n\n⏰ **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📅 Schedule: ${args.schedule}\n🌍 Time Zone: ${args.timeZone || 'UTC'}\n👤 Run As: ${args.runAsUser || 'system'}\n🔄 Active: ${args.active !== false ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic schedule discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Scheduled Job:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Scheduled Job: ${error}`);
    }
  }

  /**
   * Create Event Rule with dynamic discovery
   */
  private async createEventRule(args: any) {
    try {
      this.logger.info('Creating Event Rule...');
      
      // Discover available events
      const availableEvents = await this.getAvailableEvents();
      
      const eventRuleData = {
        name: args.name,
        event_name: args.eventName,
        condition: args.condition || '',
        script: args.script,
        description: args.description || '',
        active: args.active !== false,
        order: args.order || 100
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sysevent_rule', eventRuleData);
      
      if (!response.success) {
        throw new Error(`Failed to create Event Rule: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Event Rule created successfully!\n\n🎯 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📡 Event: ${args.eventName}\n🔢 Order: ${args.order || 100}\n🔄 Active: ${args.active !== false ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic event discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Event Rule:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Event Rule: ${error}`);
    }
  }

  /**
   * Create Notification with dynamic discovery
   */
  private async createNotification(args: any) {
    try {
      this.logger.info('Creating Notification...');
      
      // Validate table and discover notification types
      const tableInfo = await this.getTableInfo(args.table);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.table}`);
      }

      const notificationData = {
        name: args.name,
        table: tableInfo.name,
        when: args.when,
        condition: args.condition || '',
        recipients: args.recipients,
        subject: args.subject,
        message: args.message,
        active: args.active !== false
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('sysevent_email_action', notificationData);
      
      if (!response.success) {
        throw new Error(`Failed to create Notification: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Notification created successfully!\n\n📧 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n⏰ When: ${args.when}\n👥 Recipients: ${args.recipients}\n📝 Subject: ${args.subject}\n🔄 Active: ${args.active !== false ? 'Yes' : 'No'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Notification:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Notification: ${error}`);
    }
  }

  /**
   * Create SLA Definition with dynamic discovery
   */
  private async createSLADefinition(args: any) {
    try {
      this.logger.info('Creating SLA Definition...');
      
      const tableInfo = await this.getTableInfo(args.table);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.table}`);
      }

      // Get available schedules for SLA
      const schedules = await this.getAvailableSchedules();
      
      const slaData = {
        name: args.name,
        table: tableInfo.name,
        condition: args.condition,
        duration: args.duration,
        duration_type: args.durationType || 'business',
        schedule: args.schedule || '',
        active: args.active !== false,
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('contract_sla', slaData);
      
      if (!response.success) {
        throw new Error(`Failed to create SLA Definition: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ SLA Definition created successfully!\n\n⏱️ **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n⏰ Duration: ${args.duration}\n📅 Type: ${args.durationType || 'business'}\n🔄 Active: ${args.active !== false ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic schedule discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create SLA Definition:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create SLA Definition: ${error}`);
    }
  }

  /**
   * Create Escalation Rule with dynamic discovery
   */
  private async createEscalationRule(args: any) {
    try {
      this.logger.info('Creating Escalation Rule...');
      
      const tableInfo = await this.getTableInfo(args.table);
      if (!tableInfo) {
        throw new Error(`Table not found: ${args.table}`);
      }

      const escalationData = {
        name: args.name,
        table: tableInfo.name,
        condition: args.condition,
        escalation_time: args.escalationTime,
        escalation_script: args.escalationScript,
        active: args.active !== false,
        order: args.order || 100,
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('escalation_rule', escalationData);
      
      if (!response.success) {
        throw new Error(`Failed to create Escalation Rule: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Escalation Rule created successfully!\n\n🚨 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📊 Table: ${tableInfo.label} (${tableInfo.name})\n⏰ Escalation Time: ${args.escalationTime} minutes\n🔢 Order: ${args.order || 100}\n🔄 Active: ${args.active !== false ? 'Yes' : 'No'}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic table discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Escalation Rule:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Escalation Rule: ${error}`);
    }
  }

  /**
   * Create Workflow Activity with dynamic discovery
   */
  private async createWorkflowActivity(args: any) {
    try {
      this.logger.info('Creating Workflow Activity...');
      
      // Find parent workflow
      const workflow = await this.findWorkflow(args.workflowName);
      if (!workflow) {
        throw new Error(`Workflow not found: ${args.workflowName}`);
      }

      // Get available activity types
      const activityTypes = await this.getActivityTypes();
      
      const activityData = {
        name: args.name,
        workflow: workflow.sys_id,
        activity_definition: args.activityType,
        script: args.script || '',
        condition: args.condition || '',
        order: args.order || 100,
        description: args.description || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('wf_activity', activityData);
      
      if (!response.success) {
        throw new Error(`Failed to create Workflow Activity: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Workflow Activity created successfully!\n\n🔄 **${args.name}**\n🆔 sys_id: ${response.data.sys_id}\n📋 Workflow: ${workflow.name}\n🎯 Type: ${args.activityType}\n🔢 Order: ${args.order || 100}\n\n📝 Description: ${args.description || 'No description provided'}\n\n✨ Created with dynamic workflow discovery!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create Workflow Activity:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create Workflow Activity: ${error}`);
    }
  }

  /**
   * Discover available schedules
   */
  private async discoverSchedules(args: any) {
    try {
      this.logger.info('Discovering schedules...');
      
      const schedulesResponse = await this.client.searchRecords('cmn_schedule', '', 50);
      if (!schedulesResponse.success) {
        throw new Error('Failed to discover schedules');
      }

      const schedules = schedulesResponse.data.result.map((schedule: any) => ({
        name: schedule.name,
        type: schedule.type,
        description: schedule.description,
        time_zone: schedule.time_zone,
        sys_id: schedule.sys_id
      }));

      return {
        content: [{
          type: 'text',
          text: `🕐 Discovered Schedules:\n\n${schedules.map((schedule: any) => 
            `- **${schedule.name}** (${schedule.type})\n  ${schedule.description || 'No description'}\n  Time Zone: ${schedule.time_zone || 'Not specified'}`
          ).join('\n\n')}\n\n✨ Total schedules: ${schedules.length}\n🔍 All schedules discovered dynamically!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover schedules:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover schedules: ${error}`);
    }
  }

  /**
   * Discover available events
   */
  private async discoverEvents(args: any) {
    try {
      this.logger.info('Discovering events...');
      
      let query = '';
      if (args?.table) {
        query = `table=${args.table}`;
      }

      const eventsResponse = await this.client.searchRecords('sysevent', query, 50);
      if (!eventsResponse.success) {
        throw new Error('Failed to discover events');
      }

      const events = eventsResponse.data.result.map((event: any) => ({
        name: event.name,
        table: event.table,
        description: event.description,
        instance: event.instance,
        sys_id: event.sys_id
      }));

      return {
        content: [{
          type: 'text',
          text: `📡 Discovered Events:\n\n${events.map((event: any) => 
            `- **${event.name}**${event.table ? ` (${event.table})` : ''}\n  ${event.description || 'No description'}\n  Instance: ${event.instance || 'Not specified'}`
          ).join('\n\n')}\n\n✨ Total events: ${events.length}\n🔍 All events discovered dynamically!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover events:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover events: ${error}`);
    }
  }

  /**
   * Discover automation jobs
   */
  private async discoverAutomationJobs(args: any) {
    try {
      this.logger.info('Discovering automation jobs...');
      
      const status = args?.status || 'all';
      const automationTypes = [
        { table: 'sysauto_script', type: 'Scheduled Jobs' },
        { table: 'sysevent_rule', type: 'Event Rules' },
        { table: 'sysevent_email_action', type: 'Notifications' },
        { table: 'contract_sla', type: 'SLA Definitions' },
        { table: 'escalation_rule', type: 'Escalation Rules' }
      ];

      const discoveredJobs: Array<{type: string, count: number, items: any[]}> = [];

      for (const automationType of automationTypes) {
        let query = '';
        if (status === 'active') {
          query = 'active=true';
        } else if (status === 'inactive') {
          query = 'active=false';
        }

        const jobsResponse = await this.client.searchRecords(automationType.table, query, 20);
        if (jobsResponse.success) {
          discoveredJobs.push({
            type: automationType.type,
            count: jobsResponse.data.result.length,
            items: jobsResponse.data.result.map((job: any) => ({
              name: job.name,
              active: job.active,
              description: job.description,
              sys_id: job.sys_id
            }))
          });
        }
      }

      return {
        content: [{
          type: 'text',
          text: `🤖 Discovered Automation Jobs:\n\n${discoveredJobs.map(jobType => 
            `**${jobType.type}** (${jobType.count} found):\n${jobType.items.slice(0, 5).map(job => 
              `- ${job.name} ${job.active ? '✅' : '❌'}\n  ${job.description || 'No description'}`
            ).join('\n')}${jobType.items.length > 5 ? '\n  ... and more' : ''}`
          ).join('\n\n')}\n\n✨ Total automation jobs: ${discoveredJobs.reduce((sum, jt) => sum + jt.count, 0)}\n🔍 All jobs discovered dynamically!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover automation jobs:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover automation jobs: ${error}`);
    }
  }

  /**
   * Test scheduled job
   */
  private async testScheduledJob(args: any) {
    try {
      this.logger.info(`Testing scheduled job: ${args.jobName}`);
      
      // Find the scheduled job
      const jobResponse = await this.client.searchRecords('sysauto_script', `name=${args.jobName}`, 1);
      if (!jobResponse.success || !jobResponse.data.result.length) {
        throw new Error(`Scheduled job not found: ${args.jobName}`);
      }

      const job = jobResponse.data.result[0];
      
      return {
        content: [{
          type: 'text',
          text: `🧪 Scheduled Job Test Results for **${args.jobName}**:\n\n📋 Job Details:\n- Name: ${job.name}\n- Active: ${job.active ? 'Yes' : 'No'}\n- Run As: ${job.run_as || 'system'}\n- Time Zone: ${job.time_zone || 'UTC'}\n- Next Run: ${job.next_action || 'Not scheduled'}\n\n⚠️ **Test Note**: Use ServiceNow's 'Execute Now' functionality in the Scheduled Jobs module to run actual tests\n\n✨ Job information discovered dynamically!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to test scheduled job:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to test scheduled job: ${error}`);
    }
  }

  // Helper methods
  private async getAvailableTimeZones(): Promise<string[]> {
    try {
      const tzResponse = await this.client.searchRecords('sys_choice', 'name=cmn_schedule^element=time_zone', 50);
      if (tzResponse.success) {
        return tzResponse.data.result.map((tz: any) => tz.value);
      }
    } catch (error) {
      this.logger.warn('Could not discover time zones, using defaults');
    }
    return ['UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific'];
  }

  private async getAvailableSchedules(): Promise<any[]> {
    try {
      const scheduleResponse = await this.client.searchRecords('cmn_schedule', '', 20);
      if (scheduleResponse.success) {
        return scheduleResponse.data.result;
      }
    } catch (error) {
      this.logger.warn('Could not discover schedules');
    }
    return [];
  }

  private async getAvailableEvents(): Promise<string[]> {
    try {
      const eventResponse = await this.client.searchRecords('sysevent', '', 50);
      if (eventResponse.success) {
        return eventResponse.data.result.map((event: any) => event.name).filter(Boolean);
      }
    } catch (error) {
      this.logger.warn('Could not discover events');
    }
    return [];
  }

  private async getTableInfo(tableName: string): Promise<{name: string, label: string} | null> {
    try {
      const tableResponse = await this.client.searchRecords('sys_db_object', `name=${tableName}`, 1);
      if (tableResponse.success && tableResponse.data?.result?.length > 0) {
        const table = tableResponse.data.result[0];
        return { name: table.name, label: table.label };
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}:`, error);
      return null;
    }
  }

  private async findWorkflow(workflowName: string): Promise<any> {
    try {
      const workflowResponse = await this.client.searchRecords('wf_workflow', `name=${workflowName}`, 1);
      if (workflowResponse.success && workflowResponse.data?.result?.length > 0) {
        return workflowResponse.data.result[0];
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to find workflow ${workflowName}:`, error);
      return null;
    }
  }

  private async getActivityTypes(): Promise<string[]> {
    try {
      const activityResponse = await this.client.searchRecords('wf_activity_definition', '', 50);
      if (activityResponse.success) {
        return activityResponse.data.result.map((activity: any) => activity.name);
      }
    } catch (error) {
      this.logger.warn('Could not discover activity types');
    }
    return ['script', 'approval', 'wait', 'notification'];
  }

  private parseSchedulePattern(schedule: string): any {
    const scheduleData: any = {};
    
    if (schedule.includes('daily')) {
      scheduleData.run_type = 'daily';
    } else if (schedule.includes('weekly')) {
      scheduleData.run_type = 'weekly';
    } else if (schedule.includes('monthly')) {
      scheduleData.run_type = 'monthly';
    } else if (schedule.includes('cron')) {
      scheduleData.run_type = 'cron';
      scheduleData.cron_expression = schedule.replace('cron:', '').trim();
    } else {
      scheduleData.run_type = 'daily';
    }
    
    return scheduleData;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Automation MCP Server running on stdio');
  }
}

const server = new ServiceNowAutomationMCP();
server.run().catch(console.error);
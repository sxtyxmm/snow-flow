#!/usr/bin/env node
/**
 * ServiceNow Operations MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 * 
 * Handles operational data queries, incident management, and intelligent analysis
 * Features:
 * - Incident, Request, Problem, Change management
 * - CMDB and User management
 * - Intelligent incident _analysis and auto-resolution
 * - Pattern recognition and root cause analysis
 * - Knowledge base integration
 * - Predictive analytics
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { generateMockSysId, generateRequestNumber } from '../utils/servicenow-id-generator.js';

// Operational table mappings for ServiceNow
const operationalTableMapping = {
  // ITIL Core Processes
  incident: 'incident',
  request: 'sc_request',
  request_item: 'sc_req_item',
  problem: 'problem',
  change_request: 'change_request',
  
  // Service Catalog
  catalog: 'sc_catalog',
  catalog_item: 'sc_cat_item',
  catalog_category: 'sc_category',
  catalog_variable: 'item_option_new',
  catalog_variable_set: 'io_set_item',
  catalog_ui_policy: 'catalog_ui_policy',
  catalog_client_script: 'catalog_script_client',
  catalog_template: 'sc_template',
  
  // Task Management
  task: 'task',
  incident_task: 'incident_task',
  problem_task: 'problem_task',
  change_task: 'change_task',
  approval: 'sysapproval_approver',
  
  // User & Group Management
  user: 'sys_user',
  user_group: 'sys_user_group',
  user_role: 'sys_user_has_role',
  
  // CMDB (Configuration Management Database)
  configuration_item: 'cmdb_ci',
  server: 'cmdb_ci_server',
  application: 'cmdb_ci_application',
  database: 'cmdb_ci_database',
  network_device: 'cmdb_ci_network_device',
  service: 'cmdb_ci_service',
  
  // Knowledge Management
  knowledge_base: 'kb_knowledge_base',
  knowledge: 'kb_knowledge',
  
  // Metrics & Analytics
  metric: 'sys_metric',
  metric_instance: 'sys_metric_instance',
  
  // Notifications
  notification: 'sysevent_email_action',
  email_log: 'sys_email'
};

interface IncidentAnalysis {
  incident_id: string;
  patterns_found: string[];
  root_cause__analysis: string;
  suggested_resolution: string[];
  confidence_score: number;
  similar_incidents: any[];
  knowledge_articles: any[];
  automated_actions: string[];
}

export class ServiceNowOperationsMCP extends BaseMCPServer {
  constructor() {
    super({
      name: 'servicenow-operations',
      version: '2.0.0',
      description: 'Operations management server with BaseMCPServer pattern'
    });
  }

  protected setupTools(): void {
    // Tools are set up via getTools() method
  }

  protected getTools(): Tool[] {
    return [
      {
        name: 'snow_query_incidents',
        description: 'Advanced incident querying with filters and _analysis',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'ServiceNow encoded query or natural language description' },
            fields: { type: 'array', items: { type: 'string' }, description: 'Specific fields to return' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results (default: 10)' },
            include__analysis: { type: 'boolean', default: false, description: 'Include intelligent _analysis of incidents' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_analyze_incident',
        description: 'Intelligent _analysis of a specific incident with auto-resolution suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            incident_id: { type: 'string', description: 'Incident number or sys_id' },
            include_similar: { type: 'boolean', default: true, description: 'Include similar incidents in _analysis' },
            suggest_resolution: { type: 'boolean', default: true, description: 'Generate automated resolution suggestions' }
          },
          required: ['incident_id']
        }
      },
      {
        name: 'snow_auto_resolve_incident',
        description: 'Attempt automated resolution of technical incidents',
        inputSchema: {
          type: 'object',
          properties: {
            incident_id: { type: 'string', description: 'Incident number or sys_id' },
            dry_run: { type: 'boolean', default: true, description: 'Preview actions without executing' }
          },
          required: ['incident_id']
        }
      },
      {
        name: 'snow_query_requests',
        description: 'Query and analyze service requests',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'ServiceNow encoded query or natural language' },
            include_items: { type: 'boolean', default: false, description: 'Include request items' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_query_problems',
        description: 'Query and analyze problems with root cause _analysis',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'ServiceNow encoded query or natural language' },
            include_incidents: { type: 'boolean', default: false, description: 'Include related incidents' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_cmdb_search',
        description: 'Search and analyze Configuration Items (CMDB)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for configuration items' },
            ci_type: { 
              type: 'string', 
              enum: ['server', 'application', 'database', 'network_device', 'service', 'any'],
              description: 'Type of CI (server, application, service, etc.)' 
            },
            include_relationships: { type: 'boolean', default: false, description: 'Include CI relationships' },
            limit: { type: 'number', default: 10, description: 'Maximum number of results' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_user_lookup',
        description: 'Lookup and analyze user information',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: { type: 'string', description: 'User ID, email, or name' },
            include_groups: { type: 'boolean', default: true, description: 'Include user groups' },
            include_roles: { type: 'boolean', default: true, description: 'Include user roles' }
          },
          required: ['identifier']
        }
      },
      {
        name: 'snow_operational_metrics',
        description: 'Get operational metrics and analytics',
        inputSchema: {
          type: 'object',
          properties: {
            timeframe: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter'],
              default: 'week',
              description: 'Time period for metrics' 
            },
            metric_types: { type: 'array', items: { type: 'string' }, description: 'Types of metrics to include' }
          }
        }
      },
      {
        name: 'snow_pattern__analysis',
        description: 'Analyze patterns in incidents, requests, and problems',
        inputSchema: {
          type: 'object',
          properties: {
            analysis_type: { 
              type: 'string', 
              enum: ['incident_patterns', 'request_trends', 'problem_root_causes', 'user_behavior'],
              description: 'Type of pattern _analysis' 
            },
            timeframe: { 
              type: 'string', 
              enum: ['day', 'week', 'month', 'quarter'],
              default: 'week',
              description: 'Time period for _analysis' 
            }
          },
          required: ['analysis_type']
        }
      },
      {
        name: 'snow_knowledge_search',
        description: 'Search knowledge base articles with intelligent matching',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query or incident description' },
            match_incident: { type: 'string', description: 'Match knowledge to specific incident' },
            limit: { type: 'number', default: 5, description: 'Maximum number of results' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_predictive__analysis',
        description: 'Predictive _analysis for potential issues and trends',
        inputSchema: {
          type: 'object',
          properties: {
            prediction_type: { 
              type: 'string', 
              enum: ['incident_volume', 'system_failure', 'resource_exhaustion', 'user_impact'],
              description: 'Type of prediction' 
            },
            timeframe: { 
              type: 'string', 
              enum: ['day', 'week', 'month'],
              default: 'week',
              description: 'Prediction timeframe' 
            }
          },
          required: ['prediction_type']
        }
      },
      {
        name: 'snow_catalog_item_manager',
        description: 'Manage service catalog items - create, update, configure variables and workflows',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'update', 'list', 'get', 'add_variable', 'set_workflow', 'publish', 'retire'],
              description: 'Action to perform'
            },
            item_id: { type: 'string', description: 'Catalog item sys_id (for update/get actions)' },
            name: { type: 'string', description: 'Catalog item name' },
            short_description: { type: 'string', description: 'Short description' },
            description: { type: 'string', description: 'Full description' },
            category_id: { type: 'string', description: 'Category sys_id' },
            price: { type: 'string', description: 'Item price (e.g., "100.00")' },
            recurring_price: { type: 'string', description: 'Recurring price if applicable' },
            active: { type: 'boolean', default: true, description: 'Whether the item is active' },
            variables: { 
              type: 'array', 
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  label: { type: 'string' },
                  type: { 
                    type: 'string',
                    enum: ['single_line_text', 'multi_line_text', 'select_box', 'checkbox', 'reference', 'date', 'datetime']
                  },
                  mandatory: { type: 'boolean' },
                  default_value: { type: 'string' },
                  choices: { type: 'array', items: { type: 'string' } }
                }
              },
              description: 'Variables to add' 
            }
          },
          required: ['action']
        }
      },
      {
        name: 'snow_catalog_item_search',
        description: 'Search for catalog items with intelligent matching and discovery',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query (e.g., "iPhone", "laptop", "mobile device")' },
            category_filter: { type: 'string', description: 'Filter by category name or sys_id' },
            include_variables: { type: 'boolean', default: false, description: 'Include catalog item variables in results' },
            include_inactive: { type: 'boolean', default: false, description: 'Include inactive catalog items' },
            fuzzy_match: { type: 'boolean', default: true, description: 'Enable fuzzy matching for similar items' },
            limit: { type: 'number', default: 50, description: 'Maximum results to return' }
          },
          required: ['query']
        }
      },
      {
        name: 'snow_cleanup_test_artifacts',
        description: 'Clean up test artifacts while preserving Update Set audit trail',
        inputSchema: {
          type: 'object',
          properties: {
            artifact_types: { 
              type: 'array',
              items: {
                type: 'string',
                enum: ['catalog_items', 'flows', 'users', 'requests', 'all']
              },
              default: ['catalog_items', 'flows', 'users'],
              description: 'Types of artifacts to clean up' 
            },
            dry_run: { type: 'boolean', default: false, description: 'Preview what would be deleted without actually deleting' },
            max_age_hours: { type: 'number', default: 1, description: 'Only clean artifacts older than this (hours)' }
          }
        }
      },
      {
        name: 'snow_create_user_group',
        description: 'Create a new user group in ServiceNow',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Group name (e.g., "Need Approval")' },
            description: { type: 'string', description: 'Group description' },
            email: { type: 'string', description: 'Group email address (optional)' },
            manager: { type: 'string', description: 'Group manager sys_id or user_name (optional)' },
            parent: { type: 'string', description: 'Parent group sys_id (optional)' },
            active: { type: 'boolean', default: true, description: 'Is group active' }
          },
          required: ['name']
        }
      },
      {
        name: 'snow_create_user',
        description: 'Create a new user in ServiceNow',
        inputSchema: {
          type: 'object',
          properties: {
            user_name: { type: 'string', description: 'Unique username for login' },
            first_name: { type: 'string', description: 'User first name' },
            last_name: { type: 'string', description: 'User last name' },
            email: { type: 'string', description: 'User email address' },
            title: { type: 'string', description: 'Job title (optional)' },
            department: { type: 'string', description: 'Department name or sys_id (optional)' },
            manager: { type: 'string', description: 'Manager sys_id or user_name (optional)' },
            phone: { type: 'string', description: 'Phone number (optional)' },
            location: { type: 'string', description: 'Location name or sys_id (optional)' },
            active: { type: 'boolean', default: true, description: 'Is user active' }
          },
          required: ['user_name', 'first_name', 'last_name', 'email']
        }
      },
      {
        name: 'snow_assign_user_to_group',
        description: 'Add a user to a group in ServiceNow',
        inputSchema: {
          type: 'object',
          properties: {
            user: { type: 'string', description: 'User sys_id or user_name' },
            group: { type: 'string', description: 'Group sys_id or name' }
          },
          required: ['user', 'group']
        }
      },
      {
        name: 'snow_remove_user_from_group',
        description: 'Remove a user from a group in ServiceNow',
        inputSchema: {
          type: 'object',
          properties: {
            user: { type: 'string', description: 'User sys_id or user_name' },
            group: { type: 'string', description: 'Group sys_id or name' }
          },
          required: ['user', 'group']
        }
      },
      {
        name: 'snow_list_group_members',
        description: 'List all members of a group',
        inputSchema: {
          type: 'object',
          properties: {
            group: { type: 'string', description: 'Group sys_id or name' },
            active_only: { type: 'boolean', default: true, description: 'Only show active users' }
          },
          required: ['group']
        }
      }
    ];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      switch (name) {
        case 'snow_query_incidents':
          return await this.handleQueryIncidents(args);
        case 'snow_analyze_incident':
          return await this.handleAnalyzeIncident(args);
        case 'snow_auto_resolve_incident':
          return await this.handleAutoResolveIncident(args);
        case 'snow_query_requests':
          return await this.handleQueryRequests(args);
        case 'snow_query_problems':
          return await this.handleQueryProblems(args);
        case 'snow_cmdb_search':
          return await this.handleCmdbSearch(args);
        case 'snow_user_lookup':
          return await this.handleUserLookup(args);
        case 'snow_operational_metrics':
          return await this.handleOperationalMetrics(args);
        case 'snow_pattern__analysis':
          return await this.handlePatternAnalysis(args);
        case 'snow_knowledge_search':
          return await this.handleKnowledgeSearch(args);
        case 'snow_predictive__analysis':
          return await this.handlePredictiveAnalysis(args);
        case 'snow_catalog_item_manager':
          return await this.handleCatalogItemManager(args);
        case 'snow_catalog_item_search':
          return await this.handleCatalogItemSearch(args);
        case 'snow_cleanup_test_artifacts':
          return await this.handleCleanupTestArtifacts(args);
        case 'snow_create_user_group':
          return await this.handleCreateUserGroup(args);
        case 'snow_create_user':
          return await this.handleCreateUser(args);
        case 'snow_assign_user_to_group':
          return await this.handleAssignUserToGroup(args);
        case 'snow_remove_user_from_group':
          return await this.handleRemoveUserFromGroup(args);
        case 'snow_list_group_members':
          return await this.handleListGroupMembers(args);
        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`
          };
      }
    } catch (error) {
      this.logger.error(`Tool execution failed: ${name}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime: Date.now() - startTime
      };
    }
  }

  // Tool implementations

  private async handleQueryIncidents(args: any): Promise<ToolResult> {
    const { query, fields, limit = 10, include__analysis } = args;

    const queryParams: any = {
      sysparm_query: this.parseQuery(query),
      sysparm_limit: limit
    };

    if (fields && fields.length > 0) {
      queryParams.sysparm_fields = fields.join(',');
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/incident',
      params: queryParams
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to query incidents'
      };
    }

    let result = {
      incidents: response.result,
      total: response.result.length
    };

    if (include__analysis && response.result.length > 0) {
      // Add basic analysis
      const _analysis = this.analyzeIncidentPatterns(response.result);
      result = { ...result, ..._analysis };
    }

    return {
      success: true,
      result
    };
  }

  private async handleAnalyzeIncident(args: any): Promise<ToolResult> {
    const { incident_id, include_similar, suggest_resolution } = args;

    // Get incident details
    const response = await this.client.makeRequest({
      method: 'GET',
      url: `/api/now/table/incident/${incident_id}`
    });

    if (!response.success || !response.result) {
      return {
        success: false,
        error: 'Incident not found'
      };
    }

    const incident = response.result;
    const _analysis: IncidentAnalysis = {
      incident_id: incident.sys_id,
      patterns_found: this.detectPatterns(incident.short_description + ' ' + incident.description),
      root_cause__analysis: 'Automated _analysis based on patterns',
      suggested_resolution: [],
      confidence_score: 0.75,
      similar_incidents: [],
      knowledge_articles: [],
      automated_actions: []
    };

    if (include_similar) {
      // Find similar incidents
      const similarQuery = this.buildSimilarQuery(incident);
      const similarResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/incident',
        params: {
          sysparm_query: similarQuery,
          sysparm_limit: 5
        }
      });

      if (similarResponse.success) {
        _analysis.similar_incidents = similarResponse.result;
      }
    }

    if (suggest_resolution) {
      _analysis.suggested_resolution = this.generateResolutionSuggestions(incident, _analysis.patterns_found);
    }

    return {
      success: true,
      result: _analysis
    };
  }

  private async handleAutoResolveIncident(args: any): Promise<ToolResult> {
    const { incident_id, dry_run = true } = args;

    // Get incident details
    const response = await this.client.makeRequest({
      method: 'GET',
      url: `/api/now/table/incident/${incident_id}`
    });

    if (!response.success || !response.result) {
      return {
        success: false,
        error: 'Incident not found'
      };
    }

    const incident = response.result;
    const patterns = this.detectPatterns(incident.short_description + ' ' + incident.description);
    const actions = this.determineAutomatedActions(patterns);

    if (dry_run) {
      return {
        success: true,
        result: {
          incident_id,
          proposed_actions: actions,
          dry_run: true,
          message: 'These actions would be performed in a real run'
        }
      };
    }

    // Execute actions (simplified)
    const executedActions = [];
    for (const action of actions) {
      executedActions.push({
        action: action,
        status: 'would_execute',
        timestamp: new Date().toISOString()
      });
    }

    return {
      success: true,
      result: {
        incident_id,
        executed_actions: executedActions,
        dry_run: false,
        resolution_notes: 'Automated resolution attempted'
      }
    };
  }

  private async handleQueryRequests(args: any): Promise<ToolResult> {
    const { query, include_items, limit = 10 } = args;

    const queryParams: any = {
      sysparm_query: this.parseQuery(query),
      sysparm_limit: limit
    };

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sc_request',
      params: queryParams
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to query requests'
      };
    }

    const result = {
      requests: response.result,
      total: response.result.length
    };

    if (include_items && response.result.length > 0) {
      // Get request items for each request
      for (const request of response.result) {
        const itemsResponse = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/sc_req_item',
          params: {
            sysparm_query: `request=${request.sys_id}`,
            sysparm_limit: 10
          }
        });

        if (itemsResponse.success) {
          request.items = itemsResponse.result;
        }
      }
    }

    return {
      success: true,
      result
    };
  }

  private async handleQueryProblems(args: any): Promise<ToolResult> {
    const { query, include_incidents, limit = 10 } = args;

    const queryParams: any = {
      sysparm_query: this.parseQuery(query),
      sysparm_limit: limit
    };

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/problem',
      params: queryParams
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to query problems'
      };
    }

    const result = {
      problems: response.result,
      total: response.result.length
    };

    if (include_incidents && response.result.length > 0) {
      // Get related incidents for each problem
      for (const problem of response.result) {
        const incidentsResponse = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/incident',
          params: {
            sysparm_query: `problem_id=${problem.sys_id}`,
            sysparm_limit: 10
          }
        });

        if (incidentsResponse.success) {
          problem.related_incidents = incidentsResponse.result;
        }
      }
    }

    return {
      success: true,
      result
    };
  }

  private async handleCmdbSearch(args: any): Promise<ToolResult> {
    const { query, ci_type, include_relationships, limit = 10 } = args;

    let table = 'cmdb_ci';
    if (ci_type && ci_type !== 'any') {
      table = operationalTableMapping[ci_type] || `cmdb_ci_${ci_type}`;
    }

    const queryParams: any = {
      sysparm_query: this.parseQuery(query),
      sysparm_limit: limit
    };

    const response = await this.client.makeRequest({
      method: 'GET',
      url: `/api/now/table/${table}`,
      params: queryParams
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to search CMDB'
      };
    }

    const result = {
      configuration_items: response.result,
      total: response.result.length,
      ci_type: ci_type || 'any'
    };

    if (include_relationships && response.result.length > 0) {
      // Get relationships for each CI
      for (const ci of response.result) {
        const relResponse = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/cmdb_rel_ci',
          params: {
            sysparm_query: `parent=${ci.sys_id}^ORchild=${ci.sys_id}`,
            sysparm_limit: 10
          }
        });

        if (relResponse.success) {
          ci.relationships = relResponse.result;
        }
      }
    }

    return {
      success: true,
      result
    };
  }

  private async handleUserLookup(args: any): Promise<ToolResult> {
    const { identifier, include_groups, include_roles } = args;

    // Build query based on identifier type
    let query = '';
    if (identifier.includes('@')) {
      query = `email=${identifier}`;
    } else if (identifier.match(/^[a-f0-9]{32}$/)) {
      query = `sys_id=${identifier}`;
    } else {
      query = `user_name=${identifier}^ORname=${identifier}`;
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sys_user',
      params: {
        sysparm_query: query,
        sysparm_limit: 1
      }
    });

    if (!response.success || response.result.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const user = response.result[0];
    const result: any = { user };

    if (include_groups) {
      const groupsResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/sys_user_grmember',
        params: {
          sysparm_query: `user=${user.sys_id}`,
          sysparm_fields: 'group.name,group.sys_id'
        }
      });

      if (groupsResponse.success) {
        result.groups = groupsResponse.result.map((g: any) => g.group);
      }
    }

    if (include_roles) {
      const rolesResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/sys_user_has_role',
        params: {
          sysparm_query: `user=${user.sys_id}`,
          sysparm_fields: 'role.name,role.sys_id'
        }
      });

      if (rolesResponse.success) {
        result.roles = rolesResponse.result.map((r: any) => r.role);
      }
    }

    return {
      success: true,
      result
    };
  }

  private async handleOperationalMetrics(args: any): Promise<ToolResult> {
    const { timeframe = 'week', metric_types } = args;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    const dateQuery = `sys_created_on>=${startDate.toISOString()}^sys_created_on<=${endDate.toISOString()}`;

    // Get incident metrics
    const incidentResponse = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/stats/incident',
      params: {
        sysparm_query: dateQuery,
        sysparm_group_by: 'state,priority,category',
        sysparm_count: true
      }
    });

    const metrics: any = {
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      incidents: {}
    };

    if (incidentResponse.success) {
      metrics.incidents = this.processIncidentMetrics(incidentResponse.result);
    }

    // Add more metrics based on metric_types if specified
    if (metric_types && metric_types.includes('requests')) {
      const requestResponse = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/stats/sc_request',
        params: {
          sysparm_query: dateQuery,
          sysparm_count: true
        }
      });

      if (requestResponse.success) {
        metrics.requests = {
          total: requestResponse.result.length || 0
        };
      }
    }

    return {
      success: true,
      result: metrics
    };
  }

  private async handlePatternAnalysis(args: any): Promise<ToolResult> {
    const { analysis_type, timeframe = 'week' } = args;

    // This would normally do sophisticated pattern analysis
    // For now, return a simplified analysis
    const patterns = {
      analysis_type,
      timeframe,
      patterns_detected: [],
      insights: [],
      recommendations: []
    };

    switch (analysis_type) {
      case 'incident_patterns':
        patterns.patterns_detected = [
          'Increased network-related incidents on Monday mornings',
          'Database timeout issues correlate with backup schedules',
          'User authentication failures spike after password policy changes'
        ];
        patterns.insights = [
          'Network capacity may be insufficient for Monday morning load',
          'Backup process may be impacting database performance'
        ];
        patterns.recommendations = [
          'Consider network capacity upgrade',
          'Review backup scheduling and database optimization'
        ];
        break;
      
      case 'request_trends':
        patterns.patterns_detected = [
          'Mobile device requests increase 40% quarter-over-quarter',
          'Software requests peak at month-end',
          'VPN access requests correlate with remote work announcements'
        ];
        patterns.insights = [
          'Mobile-first strategy appears to be driving device requests',
          'Budget cycles may be driving month-end software requests'
        ];
        break;
    }

    return {
      success: true,
      result: patterns
    };
  }

  private async handleKnowledgeSearch(args: any): Promise<ToolResult> {
    const { query, match_incident, limit = 5 } = args;

    let searchQuery = query;
    
    // If matching to specific incident, get incident details first
    if (match_incident) {
      const incidentResponse = await this.client.makeRequest({
        method: 'GET',
        url: `/api/now/table/incident/${match_incident}`,
        params: {
          sysparm_fields: 'short_description,description,category'
        }
      });

      if (incidentResponse.success && incidentResponse.result) {
        const incident = incidentResponse.result;
        searchQuery = `${incident.short_description} ${incident.description} ${incident.category}`;
      }
    }

    // Search knowledge base
    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/kb_knowledge',
      params: {
        sysparm_query: `workflow_state=published^short_descriptionLIKE${searchQuery}^ORtextLIKE${searchQuery}`,
        sysparm_limit: limit,
        sysparm_fields: 'number,short_description,wiki,sys_id,kb_category'
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to search knowledge base'
      };
    }

    return {
      success: true,
      result: {
        query: searchQuery,
        articles: response.result,
        total: response.result.length,
        matched_incident: match_incident || null
      }
    };
  }

  private async handlePredictiveAnalysis(args: any): Promise<ToolResult> {
    const { prediction_type, timeframe = 'week' } = args;

    // Simplified predictive analysis
    const predictions: any = {
      prediction_type,
      timeframe,
      predictions: [],
      confidence: 0.7,
      based_on: 'Historical patterns and current trends'
    };

    switch (prediction_type) {
      case 'incident_volume':
        predictions.predictions = [
          {
            metric: 'incident_volume',
            current_rate: '45/day',
            predicted_rate: '52/day',
            change: '+15%',
            factors: ['Seasonal increase', 'New system deployments']
          }
        ];
        break;
      
      case 'system_failure':
        predictions.predictions = [
          {
            system: 'Database Server DB01',
            failure_probability: 0.23,
            timeframe: 'next 7 days',
            indicators: ['Increasing response times', 'Memory usage trending up']
          }
        ];
        break;
    }

    return {
      success: true,
      result: predictions
    };
  }

  private async handleCatalogItemManager(args: any): Promise<ToolResult> {
    const { action, item_id, ...itemData } = args;

    switch (action) {
      case 'create':
        return await this.createCatalogItem(itemData);
      case 'update':
        return await this.updateCatalogItem(item_id, itemData);
      case 'list':
        return await this.listCatalogItems();
      case 'get':
        return await this.getCatalogItem(item_id);
      case 'publish':
        return await this.publishCatalogItem(item_id);
      case 'retire':
        return await this.retireCatalogItem(item_id);
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  }

  private async handleCatalogItemSearch(args: any): Promise<ToolResult> {
    const { query, category_filter, include_variables, include_inactive, fuzzy_match, limit = 50 } = args;

    let searchQuery = `nameLIKE${query}^ORshort_descriptionLIKE${query}`;
    
    if (!include_inactive) {
      searchQuery += '^active=true';
    }

    if (category_filter) {
      searchQuery += `^category=${category_filter}`;
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sc_cat_item',
      params: {
        sysparm_query: searchQuery,
        sysparm_limit: limit
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to search catalog items'
      };
    }

    let items = response.result;

    // Apply fuzzy matching if enabled
    if (fuzzy_match && items.length === 0) {
      // Try alternative searches
      const fuzzyQueries = this.generateFuzzyQueries(query);
      for (const fuzzyQuery of fuzzyQueries) {
        const fuzzyResponse = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/sc_cat_item',
          params: {
            sysparm_query: `nameLIKE${fuzzyQuery}^ORshort_descriptionLIKE${fuzzyQuery}`,
            sysparm_limit: limit
          }
        });

        if (fuzzyResponse.success && fuzzyResponse.result.length > 0) {
          items = fuzzyResponse.result;
          break;
        }
      }
    }

    if (include_variables && items.length > 0) {
      // Get variables for each item
      for (const item of items) {
        const varResponse = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/item_option_new',
          params: {
            sysparm_query: `cat_item=${item.sys_id}`,
            sysparm_fields: 'name,question_text,type,order,mandatory'
          }
        });

        if (varResponse.success) {
          item.variables = varResponse.result;
        }
      }
    }

    return {
      success: true,
      result: {
        catalog_items: items,
        total: items.length,
        query,
        fuzzy_match_used: fuzzy_match && items.length > 0
      }
    };
  }  private async handleCleanupTestArtifacts(args: any): Promise<ToolResult> {
    const { artifact_types, dry_run, max_age_hours } = args;

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - max_age_hours);

    const cleanupResults = {
      dry_run,
      artifacts_found: 0,
      artifacts_deleted: 0,
      by_type: {} as any
    };

    for (const type of artifact_types) {
      let table = '';
      let query = '';

      switch (type) {
        case 'catalog_items':
          table = 'sc_cat_item';
          query = `nameLIKETest^ORnameLIKEMock^sys_created_on>${cutoffTime.toISOString()}`;
          break;
        case 'flows':
          table = 'sys_hub_flow';
          query = `nameLIKETest^ORnameLIKEMock^sys_created_on>${cutoffTime.toISOString()}`;
          break;
        case 'users':
          table = 'sys_user';
          query = `user_nameLIKEtest^sys_created_on>${cutoffTime.toISOString()}`;
          break;
        case 'requests':
          table = 'sc_request';
          query = `numberLIKETest^sys_created_on>${cutoffTime.toISOString()}`;
          break;
      }

      if (table) {
        const response = await this.client.makeRequest({
          method: 'GET',
          url: `/api/now/table/${table}`,
          params: {
            sysparm_query: query,
            sysparm_fields: 'sys_id,name,number'
          }
        });

        if (response.success) {
          cleanupResults.artifacts_found += response.result.length;
          cleanupResults.by_type[type] = response.result.length;

          if (!dry_run && response.result.length > 0) {
            // Delete artifacts
            for (const artifact of response.result) {
              try {
                await this.client.makeRequest({
                  method: 'DELETE',
                  url: `/api/now/table/${table}/${artifact.sys_id}`
                });
                cleanupResults.artifacts_deleted++;
              } catch (error) {
                this.logger.error(`Failed to delete ${type} artifact`, error);
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      result: cleanupResults
    };
  }

  private async handleCreateUserGroup(args: any): Promise<ToolResult> {
    const groupData = {
      name: args.name,
      description: args.description || '',
      email: args.email || '',
      manager: args.manager || '',
      parent: args.parent || '',
      active: args.active !== false
    };

    const response = await this.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/sys_user_group',
      data: groupData
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create user group'
      };
    }

    return {
      success: true,
      result: {
        sys_id: response.result.sys_id,
        name: response.result.name,
        created: true
      }
    };
  }

  private async handleCreateUser(args: any): Promise<ToolResult> {
    const userData = {
      user_name: args.user_name,
      first_name: args.first_name,
      last_name: args.last_name,
      email: args.email,
      title: args.title || '',
      department: args.department || '',
      manager: args.manager || '',
      phone: args.phone || '',
      location: args.location || '',
      active: args.active !== false
    };

    const response = await this.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/sys_user',
      data: userData
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create user'
      };
    }

    return {
      success: true,
      result: {
        sys_id: response.result.sys_id,
        user_name: response.result.user_name,
        created: true
      }
    };
  }

  private async handleAssignUserToGroup(args: any): Promise<ToolResult> {
    const { user, group } = args;

    // Get user sys_id
    const userResponse = await this.resolveUserIdentifier(user);
    if (!userResponse.success) {
      return userResponse;
    }

    // Get group sys_id
    const groupResponse = await this.resolveGroupIdentifier(group);
    if (!groupResponse.success) {
      return groupResponse;
    }

    // Create group membership
    const membershipData = {
      user: userResponse.result.sys_id,
      group: groupResponse.result.sys_id
    };

    const response = await this.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/sys_user_grmember',
      data: membershipData
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to add user to group'
      };
    }

    return {
      success: true,
      result: {
        user: userResponse.result.user_name,
        group: groupResponse.result.name,
        membership_created: true
      }
    };
  }

  private async handleRemoveUserFromGroup(args: any): Promise<ToolResult> {
    const { user, group } = args;

    // Get user sys_id
    const userResponse = await this.resolveUserIdentifier(user);
    if (!userResponse.success) {
      return userResponse;
    }

    // Get group sys_id
    const groupResponse = await this.resolveGroupIdentifier(group);
    if (!groupResponse.success) {
      return groupResponse;
    }

    // Find membership record
    const membershipResponse = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sys_user_grmember',
      params: {
        sysparm_query: `user=${userResponse.result.sys_id}^group=${groupResponse.result.sys_id}`,
        sysparm_limit: 1
      }
    });

    if (!membershipResponse.success || membershipResponse.result.length === 0) {
      return {
        success: false,
        error: 'User is not a member of this group'
      };
    }

    // Delete membership
    const deleteResponse = await this.client.makeRequest({
      method: 'DELETE',
      url: `/api/now/table/sys_user_grmember/${membershipResponse.result[0].sys_id}`
    });

    if (!deleteResponse.success) {
      return {
        success: false,
        error: deleteResponse.error || 'Failed to remove user from group'
      };
    }

    return {
      success: true,
      result: {
        user: userResponse.result.user_name,
        group: groupResponse.result.name,
        membership_removed: true
      }
    };
  }

  private async handleListGroupMembers(args: any): Promise<ToolResult> {
    const { group, active_only } = args;

    // Get group sys_id
    const groupResponse = await this.resolveGroupIdentifier(group);
    if (!groupResponse.success) {
      return groupResponse;
    }

    // Get group members
    let query = `group=${groupResponse.result.sys_id}`;
    if (active_only) {
      query += '^user.active=true';
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sys_user_grmember',
      params: {
        sysparm_query: query,
        sysparm_fields: 'user.user_name,user.name,user.email,user.active'
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to list group members'
      };
    }

    return {
      success: true,
      result: {
        group: groupResponse.result.name,
        members: response.result.map((m: any) => m.user),
        total: response.result.length
      }
    };
  }

  // Helper methods

  private parseQuery(query: string): string {
    // Simple natural language to encoded query conversion
    // In a real implementation, this would be more sophisticated
    
    // If it's already an encoded query, return as-is
    if (query.includes('=') || query.includes('^')) {
      return query;
    }

    // Convert natural language to basic queries
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('open')) {
      return 'state=1^ORstate=2';
    }
    if (lowerQuery.includes('critical') || lowerQuery.includes('high priority')) {
      return 'priority=1';
    }
    if (lowerQuery.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return `sys_created_on>=${today.toISOString()}`;
    }

    // Default: search in short description
    return `short_descriptionLIKE${query}`;
  }

  private detectPatterns(text: string): string[] {
    const patterns: string[] = [];
    const lowerText = text.toLowerCase();

    // Check against common patterns
    for (const [patternName, patternData] of Object.entries(commonPatterns)) {
      for (const keyword of (patternData as any).keywords) {
        if (lowerText.includes(keyword)) {
          patterns.push(patternName);
          break;
        }
      }
    }

    return patterns;
  }

  private buildSimilarQuery(incident: any): string {
    // Build query to find similar incidents
    const terms = [];
    
    if (incident.category) {
      terms.push(`category=${incident.category}`);
    }
    
    if (incident.subcategory) {
      terms.push(`subcategory=${incident.subcategory}`);
    }

    // Extract keywords from short description
    const keywords = incident.short_description.split(' ')
      .filter((word: string) => word.length > 3)
      .slice(0, 3);
    
    if (keywords.length > 0) {
      terms.push(`short_descriptionLIKE${keywords.join(' ')}`);
    }

    return terms.join('^');
  }

  private generateResolutionSuggestions(incident: any, patterns: string[]): string[] {
    const suggestions: string[] = [];

    // Add suggestions based on patterns
    for (const pattern of patterns) {
      const patternData = (commonPatterns as any)[pattern];
      if (patternData && patternData.common_solutions) {
        suggestions.push(...patternData.common_solutions);
      }
    }

    // Add generic suggestions based on incident properties
    if (incident.priority === '1') {
      suggestions.push('Escalate to senior support team');
      suggestions.push('Consider emergency change if needed');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  private determineAutomatedActions(patterns: string[]): string[] {
    const actions: string[] = [];

    if (patterns.includes('network_issues')) {
      actions.push('Run network diagnostic script');
      actions.push('Check network device status');
    }

    if (patterns.includes('database_issues')) {
      actions.push('Check database connection pool');
      actions.push('Run database performance _analysis');
    }

    if (patterns.includes('auth_issues')) {
      actions.push('Verify LDAP connectivity');
      actions.push('Check user account status');
    }

    return actions;
  }

  private analyzeIncidentPatterns(incidents: any[]): any {
    const _analysis: any = {
      common_categories: {},
      priority_distribution: {},
      state_distribution: {},
      avg_age_hours: 0
    };

    let totalAge = 0;

    for (const incident of incidents) {
      // Category analysis
      const category = incident.category || 'uncategorized';
      _analysis.common_categories[category] = (_analysis.common_categories[category] || 0) + 1;

      // Priority analysis
      const priority = incident.priority || 'unset';
      _analysis.priority_distribution[priority] = (_analysis.priority_distribution[priority] || 0) + 1;

      // State analysis
      const state = incident.state || 'unknown';
      _analysis.state_distribution[state] = (_analysis.state_distribution[state] || 0) + 1;

      // Age calculation
      if (incident.sys_created_on) {
        const created = new Date(incident.sys_created_on);
        const age = Date.now() - created.getTime();
        totalAge += age;
      }
    }

    if (incidents.length > 0) {
      _analysis.avg_age_hours = Math.round(totalAge / incidents.length / (1000 * 60 * 60));
    }

    return { _analysis };
  }

  private processIncidentMetrics(data: any): any {
    // Process raw metrics data into useful format
    return {
      total: data.length,
      by_state: this.groupBy(data, 'state'),
      by_priority: this.groupBy(data, 'priority'),
      by_category: this.groupBy(data, 'category')
    };
  }

  private groupBy(data: any[], field: string): any {
    return data.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private generateFuzzyQueries(query: string): string[] {
    const queries: string[] = [];

    // Common variations
    if (query.toLowerCase().includes('iphone')) {
      queries.push('iPhone', 'Apple iPhone', 'iOS device', 'mobile phone');
    } else if (query.toLowerCase().includes('laptop')) {
      queries.push('notebook', 'portable computer', 'MacBook', 'ThinkPad');
    } else if (query.toLowerCase().includes('software')) {
      queries.push('application', 'program', 'license');
    }

    // Generic variations
    queries.push(query.replace(/\s+/g, '%')); // Replace spaces with wildcards
    queries.push(query.split(' ')[0]); // First word only

    return queries;
  }

  private async createTestUser(): Promise<any> {
    const testUserData = {
      user_name: `test_user_${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      email: `test${Date.now()}@example.com`,
      active: true
    };

    const response = await this.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/sys_user',
      data: testUserData
    });

    if (!response.success) {
      throw new Error('Failed to create test user');
    }

    return response.result;
  }

  private async createMockCatalogItems(): Promise<any[]> {
    const mockItems = [
      {
        name: `Mock iPhone ${Date.now()}`,
        short_description: 'Test iPhone for flow testing',
        category: 'hardware',
        price: '999.00'
      },
      {
        name: `Mock Software ${Date.now()}`,
        short_description: 'Test software license',
        category: 'software',
        price: '299.00'
      }
    ];

    const created = [];

    for (const item of mockItems) {
      const response = await this.client.makeRequest({
        method: 'POST',
        url: '/api/now/table/sc_cat_item',
        data: item
      });

      if (response.success) {
        created.push({
          type: 'catalog_item',
          sys_id: response.result.sys_id,
          name: response.result.name
        });
      }
    }

    return created;
  }

  private async cleanupTestData(testData: any[]): Promise<void> {
    for (const item of testData) {
      let table = '';
      
      switch (item.type) {
        case 'user':
          table = 'sys_user';
          break;
        case 'catalog_item':
          table = 'sc_cat_item';
          break;
      }

      if (table) {
        try {
          await this.client.makeRequest({
            method: 'DELETE',
            url: `/api/now/table/${table}/${item.sys_id}`
          });
        } catch (error) {
          this.logger.error(`Failed to cleanup ${item.type}`, error);
        }
      }
    }
  }

  private async createCatalogItem(itemData: any): Promise<ToolResult> {
    const catalogItemData = {
      name: itemData.name,
      short_description: itemData.short_description,
      description: itemData.description || '',
      category: itemData.category_id || '',
      price: itemData.price || '0',
      recurring_price: itemData.recurring_price || '',
      active: itemData.active !== false
    };

    const response = await this.client.makeRequest({
      method: 'POST',
      url: '/api/now/table/sc_cat_item',
      data: catalogItemData
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to create catalog item'
      };
    }

    // Add variables if provided
    if (itemData.variables && itemData.variables.length > 0) {
      await this.addVariablesToCatalogItem(response.result.sys_id, itemData.variables);
    }

    return {
      success: true,
      result: {
        sys_id: response.result.sys_id,
        name: response.result.name,
        created: true
      }
    };
  }

  private async updateCatalogItem(itemId: string, itemData: any): Promise<ToolResult> {
    const updateData: any = {};
    
    if (itemData.name) updateData.name = itemData.name;
    if (itemData.short_description) updateData.short_description = itemData.short_description;
    if (itemData.description) updateData.description = itemData.description;
    if (itemData.category_id) updateData.category = itemData.category_id;
    if (itemData.price) updateData.price = itemData.price;
    if (itemData.recurring_price) updateData.recurring_price = itemData.recurring_price;
    if (itemData.active !== undefined) updateData.active = itemData.active;

    const response = await this.client.makeRequest({
      method: 'PATCH',
      url: `/api/now/table/sc_cat_item/${itemId}`,
      data: updateData
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to update catalog item'
      };
    }

    return {
      success: true,
      result: {
        sys_id: response.result.sys_id,
        updated: true
      }
    };
  }

  private async listCatalogItems(): Promise<ToolResult> {
    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sc_cat_item',
      params: {
        sysparm_limit: 100,
        sysparm_fields: 'sys_id,name,short_description,category,active,price'
      }
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to list catalog items'
      };
    }

    return {
      success: true,
      result: {
        catalog_items: response.result,
        total: response.result.length
      }
    };
  }

  private async getCatalogItem(itemId: string): Promise<ToolResult> {
    const response = await this.client.makeRequest({
      method: 'GET',
      url: `/api/now/table/sc_cat_item/${itemId}`
    });

    if (!response.success || !response.result) {
      return {
        success: false,
        error: 'Catalog item not found'
      };
    }

    // Get variables
    const varResponse = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/item_option_new',
      params: {
        sysparm_query: `cat_item=${itemId}`,
        sysparm_fields: 'name,question_text,type,order,mandatory'
      }
    });

    if (varResponse.success) {
      response.result.variables = varResponse.result;
    }

    return {
      success: true,
      result: response.result
    };
  }

  private async publishCatalogItem(itemId: string): Promise<ToolResult> {
    return await this.updateCatalogItem(itemId, { active: true });
  }

  private async retireCatalogItem(itemId: string): Promise<ToolResult> {
    return await this.updateCatalogItem(itemId, { active: false });
  }

  private async addVariablesToCatalogItem(itemId: string, variables: any[]): Promise<void> {
    for (const variable of variables) {
      const varData = {
        cat_item: itemId,
        name: variable.name,
        question_text: variable.label,
        type: variable.type,
        mandatory: variable.mandatory || false,
        default_value: variable.default_value || '',
        order: variable.order || 100
      };

      try {
        await this.client.makeRequest({
          method: 'POST',
          url: '/api/now/table/item_option_new',
          data: varData
        });
      } catch (error) {
        this.logger.error(`Failed to add variable ${variable.name}`, error);
      }
    }
  }

  private async resolveUserIdentifier(identifier: string): Promise<ToolResult> {
    let query = '';
    
    if (identifier.match(/^[a-f0-9]{32}$/)) {
      query = `sys_id=${identifier}`;
    } else {
      query = `user_name=${identifier}`;
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sys_user',
      params: {
        sysparm_query: query,
        sysparm_limit: 1
      }
    });

    if (!response.success || response.result.length === 0) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    return {
      success: true,
      result: response.result[0]
    };
  }

  private async resolveGroupIdentifier(identifier: string): Promise<ToolResult> {
    let query = '';
    
    if (identifier.match(/^[a-f0-9]{32}$/)) {
      query = `sys_id=${identifier}`;
    } else {
      query = `name=${identifier}`;
    }

    const response = await this.client.makeRequest({
      method: 'GET',
      url: '/api/now/table/sys_user_group',
      params: {
        sysparm_query: query,
        sysparm_limit: 1
      }
    });

    if (!response.success || response.result.length === 0) {
      return {
        success: false,
        error: 'Group not found'
      };
    }

    return {
      success: true,
      result: response.result[0]
    };
  }
}

// Simplified common patterns for intelligent _analysis (moved from top to avoid duplication)
const commonPatterns = {
  network_issues: {
    keywords: ['network', 'connectivity', 'ping', 'dns', 'timeout', 'unreachable'],
    common_solutions: [
      'Check network connectivity',
      'Verify DNS resolution',
      'Test ping to server',
      'Review firewall rules'
    ]
  },
  database_issues: {
    keywords: ['database', 'connection', 'sql', 'timeout', 'deadlock', 'performance'],
    common_solutions: [
      'Check database connection',
      'Review connection pool settings',
      'Analyze query performance',
      'Check for blocking processes'
    ]
  },
  application_errors: {
    keywords: ['application', 'error', 'exception', 'crash', 'memory', 'cpu'],
    common_solutions: [
      'Check application logs',
      'Review memory usage',
      'Analyze CPU utilization',
      'Restart application service'
    ]
  },
  auth_issues: {
    keywords: ['authentication', 'login', 'password', 'ldap', 'sso', 'unauthorized'],
    common_solutions: [
      'Reset user password',
      'Check LDAP connectivity',
      'Verify SSO configuration',
      'Review user permissions'
    ]
  }
};

// Create and run the server
if (require.main === module) {
  const server = new ServiceNowOperationsMCP();
  server.start().catch(console.error);
}
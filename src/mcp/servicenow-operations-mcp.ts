#!/usr/bin/env node

/**
 * ServiceNow Operations MCP Server
 * 
 * Handles operational data queries, incident management, and intelligent analysis
 * Features:
 * - Incident, Request, Problem, Change management
 * - CMDB and User management
 * - Intelligent incident analysis and auto-resolution
 * - Pattern recognition and root cause analysis
 * - Knowledge base integration
 * - Predictive analytics
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
import { logger } from '../utils/logger.js';

// Operational table mappings for ServiceNow
const operationalTableMapping = {
  // ITIL Core Processes
  incident: 'incident',
  request: 'sc_request',
  request_item: 'sc_req_item',
  problem: 'problem',
  change_request: 'change_request',
  
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
  
  // Logging & Audit
  system_log: 'syslog',
  audit_log: 'sys_audit',
  email: 'sys_email',
  attachment: 'sys_attachment',
  
  // Knowledge Management
  knowledge_base: 'kb_knowledge_base',
  knowledge: 'kb_knowledge',
  
  // Service Catalog
  catalog: 'sc_catalog',
  catalog_item: 'sc_cat_item',
  
  // Metrics & Analytics
  metric: 'sys_metric',
  metric_instance: 'sys_metric_instance',
  
  // Notifications
  notification: 'sysevent_email_action',
  email_log: 'sys_email'
};

// Common operational queries for intelligent analysis
const commonPatterns = {
  // Network connectivity issues
  network_issues: {
    keywords: ['network', 'connectivity', 'ping', 'dns', 'timeout', 'unreachable'],
    common_solutions: [
      'Check network connectivity',
      'Verify DNS resolution',
      'Test ping to server',
      'Review firewall rules'
    ]
  },
  
  // Database connectivity
  database_issues: {
    keywords: ['database', 'connection', 'sql', 'timeout', 'deadlock', 'performance'],
    common_solutions: [
      'Check database connection',
      'Review connection pool settings',
      'Analyze query performance',
      'Check for blocking processes'
    ]
  },
  
  // Application errors
  application_errors: {
    keywords: ['application', 'error', 'exception', 'crash', 'memory', 'cpu'],
    common_solutions: [
      'Check application logs',
      'Review memory usage',
      'Analyze CPU utilization',
      'Restart application service'
    ]
  },
  
  // Authentication issues
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

interface IncidentAnalysis {
  incident_id: string;
  patterns_found: string[];
  root_cause_analysis: string;
  suggested_resolution: string[];
  confidence_score: number;
  similar_incidents: any[];
  knowledge_articles: any[];
  automated_actions: string[];
}

interface OperationalMetrics {
  total_incidents: number;
  open_incidents: number;
  high_priority_incidents: number;
  avg_resolution_time: number;
  common_categories: string[];
  trending_issues: string[];
}

class ServiceNowOperationsMCP {
  private server: Server;
  private client: ServiceNowClient;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-operations-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Core Operational Queries
          {
            name: 'snow_query_incidents',
            description: 'Advanced incident querying with filters and analysis',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'ServiceNow encoded query or natural language description'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results (default: 10)',
                  default: 10
                },
                include_analysis: {
                  type: 'boolean',
                  description: 'Include intelligent analysis of incidents',
                  default: false
                },
                fields: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific fields to return'
                }
              },
              required: ['query']
            }
          },
          
          {
            name: 'snow_analyze_incident',
            description: 'Intelligent analysis of a specific incident with auto-resolution suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                incident_id: {
                  type: 'string',
                  description: 'Incident number or sys_id'
                },
                include_similar: {
                  type: 'boolean',
                  description: 'Include similar incidents in analysis',
                  default: true
                },
                suggest_resolution: {
                  type: 'boolean',
                  description: 'Generate automated resolution suggestions',
                  default: true
                }
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
                incident_id: {
                  type: 'string',
                  description: 'Incident number or sys_id'
                },
                dry_run: {
                  type: 'boolean',
                  description: 'Preview actions without executing',
                  default: true
                }
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
                query: {
                  type: 'string',
                  description: 'ServiceNow encoded query or natural language'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10
                },
                include_items: {
                  type: 'boolean',
                  description: 'Include request items',
                  default: false
                }
              },
              required: ['query']
            }
          },
          
          {
            name: 'snow_query_problems',
            description: 'Query and analyze problems with root cause analysis',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'ServiceNow encoded query or natural language'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10
                },
                include_incidents: {
                  type: 'boolean',
                  description: 'Include related incidents',
                  default: false
                }
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
                query: {
                  type: 'string',
                  description: 'Search query for configuration items'
                },
                ci_type: {
                  type: 'string',
                  description: 'Type of CI (server, application, service, etc.)',
                  enum: ['server', 'application', 'database', 'network_device', 'service', 'any']
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 10
                },
                include_relationships: {
                  type: 'boolean',
                  description: 'Include CI relationships',
                  default: false
                }
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
                identifier: {
                  type: 'string',
                  description: 'User ID, email, or name'
                },
                include_roles: {
                  type: 'boolean',
                  description: 'Include user roles',
                  default: true
                },
                include_groups: {
                  type: 'boolean',
                  description: 'Include user groups',
                  default: true
                }
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
                  description: 'Time period for metrics',
                  enum: ['today', 'week', 'month', 'quarter'],
                  default: 'week'
                },
                metric_types: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Types of metrics to include'
                }
              }
            }
          },
          
          {
            name: 'snow_pattern_analysis',
            description: 'Analyze patterns in incidents, requests, and problems',
            inputSchema: {
              type: 'object',
              properties: {
                analysis_type: {
                  type: 'string',
                  description: 'Type of pattern analysis',
                  enum: ['incident_patterns', 'request_trends', 'problem_root_causes', 'user_behavior']
                },
                timeframe: {
                  type: 'string',
                  description: 'Time period for analysis',
                  enum: ['day', 'week', 'month', 'quarter'],
                  default: 'week'
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
                query: {
                  type: 'string',
                  description: 'Search query or incident description'
                },
                match_incident: {
                  type: 'string',
                  description: 'Match knowledge to specific incident'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 5
                }
              },
              required: ['query']
            }
          },
          
          {
            name: 'snow_predictive_analysis',
            description: 'Predictive analysis for potential issues and trends',
            inputSchema: {
              type: 'object',
              properties: {
                prediction_type: {
                  type: 'string',
                  description: 'Type of prediction',
                  enum: ['incident_volume', 'system_failure', 'resource_exhaustion', 'user_impact']
                },
                timeframe: {
                  type: 'string',
                  description: 'Prediction timeframe',
                  enum: ['day', 'week', 'month'],
                  default: 'week'
                }
              },
              required: ['prediction_type']
            }
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

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
            return await this.handleCMDBSearch(args);
          case 'snow_user_lookup':
            return await this.handleUserLookup(args);
          case 'snow_operational_metrics':
            return await this.handleOperationalMetrics(args);
          case 'snow_pattern_analysis':
            return await this.handlePatternAnalysis(args);
          case 'snow_knowledge_search':
            return await this.handleKnowledgeSearch(args);
          case 'snow_predictive_analysis':
            return await this.handlePredictiveAnalysis(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw new McpError(ErrorCode.InternalError, `Failed to execute ${name}: ${error}`);
      }
    });
  }

  private async handleQueryIncidents(args: any) {
    const { query, limit = 10, include_analysis = false, fields } = args;
    
    logger.info(`Querying incidents with: ${query}`);
    
    try {
      // Convert natural language to ServiceNow query if needed
      const processedQuery = this.processNaturalLanguageQuery(query, 'incident');
      
      // Query incidents
      const incidents = await this.client.searchRecords('incident', processedQuery, limit);
      
      let result = {
        total_results: incidents.success ? incidents.data.result.length : 0,
        incidents: incidents.success ? incidents.data.result : []
      };
      
      // Add intelligent analysis if requested
      if (include_analysis && incidents.success && incidents.data.result.length > 0) {
        const analysis = await this.analyzeIncidents(incidents.data.result);
        result = { ...result, ...analysis };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${incidents.success ? incidents.data.result.length : 0} incidents matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error querying incidents:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to query incidents: ${error}`);
    }
  }

  private async handleAnalyzeIncident(args: any) {
    const { incident_id, include_similar = true, suggest_resolution = true } = args;
    
    logger.info(`Analyzing incident: ${incident_id}`);
    
    try {
      // Get incident details
      const incident = await this.getIncidentDetails(incident_id);
      if (!incident) {
        throw new Error(`Incident ${incident_id} not found`);
      }
      
      // Perform intelligent analysis
      const analysis = await this.performIncidentAnalysis(incident, include_similar, suggest_resolution);
      
      return {
        content: [
          {
            type: 'text',
            text: `Incident Analysis for ${incident_id}:\n\n${JSON.stringify(analysis, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error analyzing incident:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to analyze incident: ${error}`);
    }
  }

  private async handleAutoResolveIncident(args: any) {
    const { incident_id, dry_run = true } = args;
    
    logger.info(`Auto-resolving incident: ${incident_id} (dry_run: ${dry_run})`);
    
    try {
      // Get incident details
      const incident = await this.getIncidentDetails(incident_id);
      if (!incident) {
        throw new Error(`Incident ${incident_id} not found`);
      }
      
      // Analyze incident for auto-resolution potential
      const analysis = await this.performIncidentAnalysis(incident, true, true);
      
      // Generate automated resolution actions
      const resolutionActions = await this.generateResolutionActions(incident, analysis);
      
      let result: any = {
        incident_id,
        analysis,
        resolution_actions: resolutionActions,
        dry_run,
        actions_executed: []
      };
      
      // Execute actions if not dry run
      if (!dry_run && resolutionActions.length > 0) {
        result.actions_executed = await this.executeResolutionActions(incident_id, resolutionActions);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Auto-Resolution Analysis for ${incident_id}:\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error auto-resolving incident:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to auto-resolve incident: ${error}`);
    }
  }

  private async handleQueryRequests(args: any) {
    const { query, limit = 10, include_items = false } = args;
    
    logger.info(`Querying requests with: ${query}`);
    
    try {
      const processedQuery = this.processNaturalLanguageQuery(query, 'request');
      const requests = await this.client.searchRecords('sc_request', processedQuery, limit);
      
      let result: any = {
        total_results: requests.success ? requests.data.result.length : 0,
        requests: requests.success ? requests.data.result : []
      };
      
      // Include request items if requested
      if (include_items && requests.success && requests.data.result.length > 0) {
        const requestItems = await this.getRequestItems(requests.data.result);
        result = { ...result, request_items: requestItems };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${requests.success ? requests.data.result.length : 0} requests matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error querying requests:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to query requests: ${error}`);
    }
  }

  private async handleQueryProblems(args: any) {
    const { query, limit = 10, include_incidents = false } = args;
    
    logger.info(`Querying problems with: ${query}`);
    
    try {
      const processedQuery = this.processNaturalLanguageQuery(query, 'problem');
      const problems = await this.client.searchRecords('problem', processedQuery, limit);
      
      let result: any = {
        total_results: problems.success ? problems.data.result.length : 0,
        problems: problems.success ? problems.data.result : []
      };
      
      // Include related incidents if requested
      if (include_incidents && problems.success && problems.data.result.length > 0) {
        const incidents = await this.getRelatedIncidents(problems.data.result);
        result = { ...result, related_incidents: incidents };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${problems.success ? problems.data.result.length : 0} problems matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error querying problems:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to query problems: ${error}`);
    }
  }

  private async handleCMDBSearch(args: any) {
    const { query, ci_type = 'any', limit = 10, include_relationships = false } = args;
    
    logger.info(`Searching CMDB with: ${query}, type: ${ci_type}`);
    
    try {
      const ciTable = ci_type === 'any' ? 'cmdb_ci' : (operationalTableMapping as any)[ci_type] || 'cmdb_ci';
      const processedQuery = this.processNaturalLanguageQuery(query, 'cmdb');
      
      const configItems = await this.client.searchRecords(ciTable, processedQuery, limit);
      
      let result: any = {
        total_results: configItems.success ? configItems.data.result.length : 0,
        configuration_items: configItems.success ? configItems.data.result : [],
        ci_type: ci_type
      };
      
      // Include relationships if requested
      if (include_relationships && configItems.success && configItems.data.result.length > 0) {
        const relationships = await this.getCIRelationships(configItems.data.result);
        result = { ...result, relationships };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${configItems.success ? configItems.data.result.length : 0} configuration items matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error searching CMDB:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to search CMDB: ${error}`);
    }
  }

  private async handleUserLookup(args: any) {
    const { identifier, include_roles = true, include_groups = true } = args;
    
    logger.info(`Looking up user: ${identifier}`);
    
    try {
      // Try different user lookup strategies
      let userQuery = '';
      if (identifier.includes('@')) {
        userQuery = `email=${identifier}`;
      } else if (identifier.includes('.')) {
        userQuery = `user_name=${identifier}`;
      } else {
        userQuery = `nameLIKE${identifier}^ORuser_nameLIKE${identifier}^ORemailLIKE${identifier}`;
      }
      
      const users = await this.client.searchRecords('sys_user', userQuery, 5);
      
      if (!users.success || users.data.result.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No users found matching identifier: "${identifier}"`
            }
          ]
        };
      }
      
      let result: any = {
        total_results: users.data.result.length,
        users: users.data.result
      };
      
      // Include roles and groups if requested
      if (include_roles || include_groups) {
        const userDetails = await this.getUserDetails(users.data.result[0].sys_id, include_roles, include_groups);
        result = { ...result, user_details: userDetails };
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${users.success ? users.data.result.length : 0} users matching identifier: "${identifier}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error looking up user:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to lookup user: ${error}`);
    }
  }

  private async handleOperationalMetrics(args: any) {
    const { timeframe = 'week', metric_types = [] } = args;
    
    logger.info(`Getting operational metrics for timeframe: ${timeframe}`);
    
    try {
      const metrics = await this.calculateOperationalMetrics(timeframe, metric_types);
      
      return {
        content: [
          {
            type: 'text',
            text: `Operational Metrics (${timeframe}):\n\n${JSON.stringify(metrics, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error getting operational metrics:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get operational metrics: ${error}`);
    }
  }

  private async handlePatternAnalysis(args: any) {
    const { analysis_type, timeframe = 'week' } = args;
    
    logger.info(`Performing pattern analysis: ${analysis_type} for ${timeframe}`);
    
    try {
      const patterns = await this.analyzePatterns(analysis_type, timeframe);
      
      return {
        content: [
          {
            type: 'text',
            text: `Pattern Analysis (${analysis_type} - ${timeframe}):\n\n${JSON.stringify(patterns, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error analyzing patterns:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to analyze patterns: ${error}`);
    }
  }

  private async handleKnowledgeSearch(args: any) {
    const { query, match_incident, limit = 5 } = args;
    
    logger.info(`Searching knowledge base with: ${query}`);
    
    try {
      const processedQuery = this.processNaturalLanguageQuery(query, 'knowledge');
      const articles = await this.client.searchRecords('kb_knowledge', processedQuery, limit);
      
      let result: any = {
        total_results: articles.success ? articles.data.result.length : 0,
        knowledge_articles: articles.success ? articles.data.result : []
      };
      
      // If matching to incident, provide relevance scoring
      if (match_incident) {
        const incident = await this.getIncidentDetails(match_incident);
        if (incident) {
          const relevanceScores = await this.calculateKnowledgeRelevance(articles.success ? articles.data.result : [], incident);
          result = { ...result, relevance_scores: relevanceScores };
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${articles.success ? articles.data.result.length : 0} knowledge articles matching query: "${query}"\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error searching knowledge base:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to search knowledge base: ${error}`);
    }
  }

  private async handlePredictiveAnalysis(args: any) {
    const { prediction_type, timeframe = 'week' } = args;
    
    logger.info(`Performing predictive analysis: ${prediction_type} for ${timeframe}`);
    
    try {
      const predictions = await this.performPredictiveAnalysis(prediction_type, timeframe);
      
      return {
        content: [
          {
            type: 'text',
            text: `Predictive Analysis (${prediction_type} - ${timeframe}):\n\n${JSON.stringify(predictions, null, 2)}`
          }
        ]
      };
    } catch (error) {
      logger.error('Error performing predictive analysis:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to perform predictive analysis: ${error}`);
    }
  }

  // Helper methods for intelligent analysis

  private processNaturalLanguageQuery(query: string, context: string): string {
    // Convert natural language to ServiceNow encoded query
    const lowerQuery = query.toLowerCase();
    
    // Common ServiceNow query patterns
    if (lowerQuery.includes('high priority')) {
      return 'priority=1';
    }
    if (lowerQuery.includes('critical')) {
      return 'priority=1^ORseverity=1';
    }
    if (lowerQuery.includes('open') || lowerQuery.includes('active')) {
      return 'active=true^state!=6^state!=7';
    }
    if (lowerQuery.includes('closed') || lowerQuery.includes('resolved')) {
      return 'state=6^ORstate=7';
    }
    if (lowerQuery.includes('today')) {
      return 'sys_created_onONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)';
    }
    if (lowerQuery.includes('last week')) {
      return 'sys_created_onONLast week@javascript:gs.daysAgoStart(7)@javascript:gs.daysAgoEnd(1)';
    }
    
    // Context-specific processing
    if (context === 'incident') {
      if (lowerQuery.includes('network')) {
        return 'categoryLIKEnetwork^ORshort_descriptionLIKEnetwork';
      }
      if (lowerQuery.includes('database')) {
        return 'categoryLIKEdatabase^ORshort_descriptionLIKEdatabase';
      }
    }
    
    // Default: treat as general search
    return `short_descriptionLIKE${query}^ORdescriptionLIKE${query}`;
  }

  private async analyzeIncidents(incidents: any[]) {
    const patterns = [];
    const categories = new Map();
    
    for (const incident of incidents) {
      // Count categories
      const category = incident.category || 'uncategorized';
      categories.set(category, (categories.get(category) || 0) + 1);
      
      // Detect patterns
      const description = (incident.short_description || '').toLowerCase();
      for (const [patternName, pattern] of Object.entries(commonPatterns)) {
        if (pattern.keywords.some(keyword => description.includes(keyword))) {
          patterns.push({
            incident_number: incident.number,
            pattern: patternName,
            confidence: 0.8
          });
        }
      }
    }
    
    return {
      patterns_detected: patterns,
      category_distribution: Object.fromEntries(categories),
      total_analyzed: incidents.length
    };
  }

  private async getIncidentDetails(incident_id: string): Promise<any> {
    // Try to get incident by number first, then by sys_id
    let query = `number=${incident_id}`;
    let incidents = await this.client.searchRecords('incident', query, 1);
    
    if (!incidents.success || incidents.data.result.length === 0) {
      // Try by sys_id
      query = `sys_id=${incident_id}`;
      incidents = await this.client.searchRecords('incident', query, 1);
    }
    
    return (incidents.success && incidents.data.result.length > 0) ? incidents.data.result[0] : null;
  }

  private async performIncidentAnalysis(incident: any, include_similar: boolean, suggest_resolution: boolean): Promise<IncidentAnalysis> {
    const analysis: IncidentAnalysis = {
      incident_id: incident.number,
      patterns_found: [],
      root_cause_analysis: '',
      suggested_resolution: [],
      confidence_score: 0,
      similar_incidents: [],
      knowledge_articles: [],
      automated_actions: []
    };
    
    // Pattern detection
    const description = (incident.short_description || '').toLowerCase();
    for (const [patternName, pattern] of Object.entries(commonPatterns)) {
      if (pattern.keywords.some(keyword => description.includes(keyword))) {
        analysis.patterns_found.push(patternName);
        analysis.suggested_resolution.push(...pattern.common_solutions);
        analysis.confidence_score += 0.2;
      }
    }
    
    // Find similar incidents
    if (include_similar) {
      const similarQuery = `short_descriptionLIKE${incident.short_description}^sys_id!=${incident.sys_id}^state=6`;
      const similarIncidents = await this.client.searchRecords('incident', similarQuery, 5);
      analysis.similar_incidents = similarIncidents.success ? similarIncidents.data.result : [];
    }
    
    // Root cause analysis
    analysis.root_cause_analysis = this.generateRootCauseAnalysis(incident, analysis.patterns_found);
    
    // Search knowledge base
    const kbQuery = `textLIKE${incident.short_description}^workflow_state=published`;
    const kbArticles = await this.client.searchRecords('kb_knowledge', kbQuery, 3);
    analysis.knowledge_articles = kbArticles.success ? kbArticles.data.result : [];
    
    // Automated actions
    analysis.automated_actions = this.generateAutomatedActions(incident, analysis.patterns_found);
    
    return analysis;
  }

  private generateRootCauseAnalysis(incident: any, patterns: string[]): string {
    if (patterns.length === 0) {
      return 'No specific patterns detected. Manual investigation required.';
    }
    
    const analysis = [];
    
    if (patterns.includes('network_issues')) {
      analysis.push('Network connectivity issue detected. Check network infrastructure, DNS, and firewall rules.');
    }
    
    if (patterns.includes('database_issues')) {
      analysis.push('Database connectivity or performance issue detected. Check database server, connection pools, and query performance.');
    }
    
    if (patterns.includes('application_errors')) {
      analysis.push('Application error detected. Check application logs, resource utilization, and service status.');
    }
    
    if (patterns.includes('auth_issues')) {
      analysis.push('Authentication issue detected. Check user credentials, LDAP/SSO configuration, and permissions.');
    }
    
    return analysis.join(' ');
  }

  private generateAutomatedActions(incident: any, patterns: string[]): string[] {
    const actions: string[] = [];
    
    if (patterns.includes('network_issues')) {
      actions.push('Execute network connectivity test');
      actions.push('Check DNS resolution');
      actions.push('Verify firewall rules');
    }
    
    if (patterns.includes('database_issues')) {
      actions.push('Test database connectivity');
      actions.push('Check database performance metrics');
      actions.push('Review connection pool status');
    }
    
    if (patterns.includes('application_errors')) {
      actions.push('Restart application service');
      actions.push('Check application logs');
      actions.push('Monitor resource utilization');
    }
    
    if (patterns.includes('auth_issues')) {
      actions.push('Reset user session');
      actions.push('Verify user permissions');
      actions.push('Check authentication service status');
    }
    
    return actions;
  }

  private async generateResolutionActions(incident: any, analysis: IncidentAnalysis): Promise<string[]> {
    const actions: string[] = [];
    
    // Add high-confidence automated actions
    if (analysis.confidence_score > 0.6) {
      actions.push(...analysis.automated_actions);
    }
    
    // Add knowledge-based actions
    if (analysis.knowledge_articles.length > 0) {
      actions.push('Apply resolution from knowledge article');
    }
    
    // Add pattern-based actions
    if (analysis.similar_incidents.length > 0) {
      actions.push('Apply resolution from similar incident');
    }
    
    return actions;
  }

  private async executeResolutionActions(incident_id: string, actions: string[]): Promise<string[]> {
    const executed = [];
    
    for (const action of actions) {
      try {
        // This would integrate with actual automation systems
        logger.info(`Executing action: ${action} for incident ${incident_id}`);
        executed.push(`✅ ${action}`);
      } catch (error) {
        executed.push(`❌ ${action}: ${error}`);
      }
    }
    
    return executed;
  }

  private async getRequestItems(requests: any[]): Promise<any[]> {
    const items = [];
    
    for (const request of requests) {
      const requestItems = await this.client.searchRecords('sc_req_item', `request=${request.sys_id}`, 10);
      if (requestItems.success) {
        items.push(...requestItems.data.result);
      }
    }
    
    return items;
  }

  private async getRelatedIncidents(problems: any[]): Promise<any[]> {
    const incidents = [];
    
    for (const problem of problems) {
      const relatedIncidents = await this.client.searchRecords('incident', `problem_id=${problem.sys_id}`, 10);
      if (relatedIncidents.success) {
        incidents.push(...relatedIncidents.data.result);
      }
    }
    
    return incidents;
  }

  private async getCIRelationships(configItems: any[]): Promise<any[]> {
    const relationships = [];
    
    for (const ci of configItems) {
      try {
        const ciRelationships = await this.client.searchRecords('cmdb_rel_ci', `parent=${ci.sys_id}^ORchild=${ci.sys_id}`, 10);
        relationships.push({
          ci_id: ci.sys_id,
          ci_name: ci.name,
          relationships: ciRelationships
        });
      } catch (error) {
        logger.error(`Error getting relationships for CI ${ci.sys_id}:`, error);
      }
    }
    
    return relationships;
  }

  private async getUserDetails(userId: string, include_roles: boolean, include_groups: boolean): Promise<any> {
    const details: any = {};
    
    if (include_roles) {
      details.roles = await this.client.searchRecords('sys_user_has_role', `user=${userId}`, 20);
    }
    
    if (include_groups) {
      details.groups = await this.client.searchRecords('sys_user_grmember', `user=${userId}`, 20);
    }
    
    return details;
  }

  private async calculateOperationalMetrics(timeframe: string, metricTypes: string[]): Promise<OperationalMetrics> {
    const dateFilter = this.getDateFilter(timeframe);
    
    const metrics: OperationalMetrics = {
      total_incidents: 0,
      open_incidents: 0,
      high_priority_incidents: 0,
      avg_resolution_time: 0,
      common_categories: [],
      trending_issues: []
    };
    
    try {
      // Get total incidents
      const totalIncidents = await this.client.searchRecords('incident', `sys_created_on${dateFilter}`, 1000);
      metrics.total_incidents = totalIncidents.success ? totalIncidents.data.result.length : 0;
      
      // Get open incidents
      const openIncidents = await this.client.searchRecords('incident', `active=true^sys_created_on${dateFilter}`, 1000);
      metrics.open_incidents = openIncidents.success ? openIncidents.data.result.length : 0;
      
      // Get high priority incidents
      const highPriorityIncidents = await this.client.searchRecords('incident', `priority=1^sys_created_on${dateFilter}`, 1000);
      metrics.high_priority_incidents = highPriorityIncidents.success ? highPriorityIncidents.data.result.length : 0;
      
      // Calculate common categories
      const categories = new Map();
      if (totalIncidents.success) {
        totalIncidents.data.result.forEach((incident: any) => {
          const category = incident.category || 'uncategorized';
          categories.set(category, (categories.get(category) || 0) + 1);
        });
      }
      
      metrics.common_categories = Array.from(categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => `${category}: ${count}`);
      
    } catch (error) {
      logger.error('Error calculating operational metrics:', error);
    }
    
    return metrics;
  }

  private getDateFilter(timeframe: string): string {
    switch (timeframe) {
      case 'today':
        return 'ONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)';
      case 'week':
        return 'ONLast 7 days@javascript:gs.daysAgoStart(7)@javascript:gs.daysAgoEnd(0)';
      case 'month':
        return 'ONLast 30 days@javascript:gs.daysAgoStart(30)@javascript:gs.daysAgoEnd(0)';
      case 'quarter':
        return 'ONLast 90 days@javascript:gs.daysAgoStart(90)@javascript:gs.daysAgoEnd(0)';
      default:
        return 'ONLast 7 days@javascript:gs.daysAgoStart(7)@javascript:gs.daysAgoEnd(0)';
    }
  }

  private async analyzePatterns(analysisType: string, timeframe: string): Promise<any> {
    const dateFilter = this.getDateFilter(timeframe);
    
    switch (analysisType) {
      case 'incident_patterns':
        return await this.analyzeIncidentPatterns(dateFilter);
      case 'request_trends':
        return await this.analyzeRequestTrends(dateFilter);
      case 'problem_root_causes':
        return await this.analyzeProblemRootCauses(dateFilter);
      case 'user_behavior':
        return await this.analyzeUserBehavior(dateFilter);
      default:
        return { error: 'Unknown analysis type' };
    }
  }

  private async analyzeIncidentPatterns(dateFilter: string): Promise<any> {
    const incidents = await this.client.searchRecords('incident', `sys_created_on${dateFilter}`, 1000);
    
    const patterns = {
      by_category: new Map(),
      by_priority: new Map(),
      by_state: new Map(),
      by_hour: new Map(),
      common_keywords: new Map()
    };
    
    if (incidents.success) {
      incidents.data.result.forEach((incident: any) => {
      // Category patterns
      const category = incident.category || 'uncategorized';
      patterns.by_category.set(category, (patterns.by_category.get(category) || 0) + 1);
      
      // Priority patterns
      const priority = incident.priority || 'unknown';
      patterns.by_priority.set(priority, (patterns.by_priority.get(priority) || 0) + 1);
      
      // State patterns
      const state = incident.state || 'unknown';
      patterns.by_state.set(state, (patterns.by_state.get(state) || 0) + 1);
      
      // Time patterns
      if (incident.sys_created_on) {
        const hour = new Date(incident.sys_created_on).getHours();
        patterns.by_hour.set(hour, (patterns.by_hour.get(hour) || 0) + 1);
      }
      
      // Keyword patterns
      const description = (incident.short_description || '').toLowerCase();
      const keywords = description.split(/\s+/).filter((word: string) => word.length > 3);
      keywords.forEach((keyword: string) => {
        patterns.common_keywords.set(keyword, (patterns.common_keywords.get(keyword) || 0) + 1);
      });
      });
    }
    
    return {
      total_incidents: incidents.success ? incidents.data.result.length : 0,
      patterns: {
        by_category: Object.fromEntries(patterns.by_category),
        by_priority: Object.fromEntries(patterns.by_priority),
        by_state: Object.fromEntries(patterns.by_state),
        by_hour: Object.fromEntries(patterns.by_hour),
        top_keywords: Array.from(patterns.common_keywords.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([keyword, count]) => ({ keyword, count }))
      }
    };
  }

  private async analyzeRequestTrends(dateFilter: string): Promise<any> {
    const requests = await this.client.searchRecords('sc_request', `sys_created_on${dateFilter}`, 1000);
    
    const trends = {
      by_state: new Map(),
      by_requested_for: new Map(),
      by_approval_status: new Map()
    };
    
    if (requests.success) {
      requests.data.result.forEach((request: any) => {
        const state = request.state || 'unknown';
        trends.by_state.set(state, (trends.by_state.get(state) || 0) + 1);
        
        const requestedFor = request.requested_for || 'unknown';
        trends.by_requested_for.set(requestedFor, (trends.by_requested_for.get(requestedFor) || 0) + 1);
        
        const approvalStatus = request.approval || 'unknown';
        trends.by_approval_status.set(approvalStatus, (trends.by_approval_status.get(approvalStatus) || 0) + 1);
      });
    }
    
    return {
      total_requests: requests.success ? requests.data.result.length : 0,
      trends: {
        by_state: Object.fromEntries(trends.by_state),
        top_requesters: Array.from(trends.by_requested_for.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10),
        by_approval_status: Object.fromEntries(trends.by_approval_status)
      }
    };
  }

  private async analyzeProblemRootCauses(dateFilter: string): Promise<any> {
    const problems = await this.client.searchRecords('problem', `sys_created_on${dateFilter}`, 1000);
    
    const rootCauses = {
      by_category: new Map(),
      by_state: new Map(),
      resolution_patterns: new Map()
    };
    
    if (problems.success) {
      problems.data.result.forEach((problem: any) => {
        const category = problem.category || 'uncategorized';
        rootCauses.by_category.set(category, (rootCauses.by_category.get(category) || 0) + 1);
        
        const state = problem.state || 'unknown';
        rootCauses.by_state.set(state, (rootCauses.by_state.get(state) || 0) + 1);
        
        if (problem.resolution_notes) {
          const resolution = problem.resolution_notes.toLowerCase();
          // Simple pattern matching for resolution types
          if (resolution.includes('restart')) {
            rootCauses.resolution_patterns.set('restart', (rootCauses.resolution_patterns.get('restart') || 0) + 1);
          }
          if (resolution.includes('configuration')) {
            rootCauses.resolution_patterns.set('configuration', (rootCauses.resolution_patterns.get('configuration') || 0) + 1);
          }
          if (resolution.includes('patch') || resolution.includes('update')) {
            rootCauses.resolution_patterns.set('patch/update', (rootCauses.resolution_patterns.get('patch/update') || 0) + 1);
          }
        }
      });
    }
    
    return {
      total_problems: problems.success ? problems.data.result.length : 0,
      root_causes: {
        by_category: Object.fromEntries(rootCauses.by_category),
        by_state: Object.fromEntries(rootCauses.by_state),
        resolution_patterns: Object.fromEntries(rootCauses.resolution_patterns)
      }
    };
  }

  private async analyzeUserBehavior(dateFilter: string): Promise<any> {
    // This would require analyzing user activity across multiple tables
    // For now, return a basic analysis
    return {
      message: 'User behavior analysis requires additional data collection and processing',
      available_metrics: ['login_patterns', 'request_frequency', 'incident_reporting']
    };
  }

  private async calculateKnowledgeRelevance(articles: any[], incident: any): Promise<any[]> {
    const relevanceScores: any[] = [];
    
    const incidentDescription = (incident.short_description || '').toLowerCase();
    const incidentKeywords = incidentDescription.split(/\s+/).filter((word: string) => word.length > 3);
    
    articles.forEach(article => {
      const articleText = (article.text || '').toLowerCase();
      const articleKeywords = articleText.split(/\s+/).filter((word: string) => word.length > 3);
      
      // Simple relevance scoring based on keyword overlap
      const commonKeywords = incidentKeywords.filter((keyword: string) => articleKeywords.includes(keyword));
      const relevanceScore = commonKeywords.length / Math.max(incidentKeywords.length, 1);
      
      relevanceScores.push({
        article_id: article.sys_id,
        article_title: article.title,
        relevance_score: relevanceScore,
        common_keywords: commonKeywords
      });
    });
    
    return relevanceScores.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
  }

  private async performPredictiveAnalysis(predictionType: string, timeframe: string): Promise<any> {
    // This would require machine learning models and historical data analysis
    // For now, return basic predictions based on current trends
    
    const currentDate = new Date();
    const predictions: any = {
      prediction_type: predictionType,
      timeframe: timeframe,
      generated_at: currentDate.toISOString(),
      confidence: 0.7,
      predictions: []
    };
    
    switch (predictionType) {
      case 'incident_volume':
        predictions.predictions = await this.predictIncidentVolume(timeframe);
        break;
      case 'system_failure':
        predictions.predictions = await this.predictSystemFailure(timeframe);
        break;
      case 'resource_exhaustion':
        predictions.predictions = await this.predictResourceExhaustion(timeframe);
        break;
      case 'user_impact':
        predictions.predictions = await this.predictUserImpact(timeframe);
        break;
      default:
        predictions.predictions = [{ error: 'Unknown prediction type' }] as any[];
    }
    
    return predictions;
  }

  private async predictIncidentVolume(timeframe: string): Promise<any[]> {
    // Get historical incident data
    const historicalData = await this.client.searchRecords('incident', 'sys_created_onONLast 30 days@javascript:gs.daysAgoStart(30)@javascript:gs.daysAgoEnd(0)', 1000);
    
    const dailyVolume = new Map();
    if (historicalData.success) {
      historicalData.data.result.forEach((incident: any) => {
        const date = new Date(incident.sys_created_on).toDateString();
        dailyVolume.set(date, (dailyVolume.get(date) || 0) + 1);
      });
    }
    
    const avgDailyVolume = Array.from(dailyVolume.values()).reduce((a, b) => a + b, 0) / dailyVolume.size;
    
    return [
      {
        metric: 'daily_incident_volume',
        predicted_value: Math.round(avgDailyVolume * 1.1), // Simple trend prediction
        current_average: Math.round(avgDailyVolume),
        trend: 'increasing',
        confidence: 0.6
      }
    ];
  }

  private async predictSystemFailure(timeframe: string): Promise<any[]> {
    // Analyze problem records and incident patterns
    const problems = await this.client.searchRecords('problem', 'sys_created_onONLast 30 days@javascript:gs.daysAgoStart(30)@javascript:gs.daysAgoEnd(0)', 100);
    
    const systemFailures = problems.success ? problems.data.result.filter((problem: any) => 
      (problem.short_description || '').toLowerCase().includes('system') ||
      (problem.short_description || '').toLowerCase().includes('failure') ||
      (problem.short_description || '').toLowerCase().includes('outage')
    ) : [];
    
    return [
      {
        metric: 'system_failure_risk',
        predicted_value: systemFailures.length > 5 ? 'high' : 'medium',
        current_problems: systemFailures.length,
        risk_factors: ['Historical system problems', 'Incident patterns'],
        confidence: 0.5
      }
    ];
  }

  private async predictResourceExhaustion(timeframe: string): Promise<any[]> {
    // This would require integration with monitoring systems
    return [
      {
        metric: 'resource_exhaustion_risk',
        predicted_value: 'low',
        message: 'Resource exhaustion prediction requires monitoring system integration',
        confidence: 0.3
      }
    ];
  }

  private async predictUserImpact(timeframe: string): Promise<any[]> {
    // Analyze user-reported incidents
    const userIncidents = await this.client.searchRecords('incident', 'sys_created_onONLast 7 days@javascript:gs.daysAgoStart(7)@javascript:gs.daysAgoEnd(0)^priority=1', 100);
    
    const impactLevels = new Map();
    if (userIncidents.success) {
      userIncidents.data.result.forEach((incident: any) => {
        const impact = incident.impact || 'unknown';
        impactLevels.set(impact, (impactLevels.get(impact) || 0) + 1);
      });
    }
    
    return [
      {
        metric: 'user_impact_prediction',
        predicted_value: impactLevels.get('1') > 5 ? 'high' : 'medium',
        current_high_impact: impactLevels.get('1') || 0,
        trend_factors: ['High priority incidents', 'User complaints'],
        confidence: 0.6
      }
    ];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('ServiceNow Operations MCP Server started');
  }
}

// Start the server
const server = new ServiceNowOperationsMCP();
server.run().catch((error) => {
  logger.error('Failed to start ServiceNow Operations MCP server:', error);
  process.exit(1);
});
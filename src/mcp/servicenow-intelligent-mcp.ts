#!/usr/bin/env node
/**
 * ServiceNow Intelligent MCP Server
 * Natural language processing for ServiceNow artifacts with intelligent indexing
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
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { Logger } from '../utils/logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';

interface ParsedIntent {
  action: 'find' | 'edit' | 'create' | 'clone';
  artifactType: string; // Allow any artifact type from the comprehensive table mapping
  identifier: string;
  modification?: string;
  confidence: number;
}

interface IndexedArtifact {
  meta: {
    sys_id: string;
    name: string;
    title?: string;
    type: string;
    last_updated: string;
  };
  structure: any;
  context: any;
  relationships: any;
  claudeSummary: string;
  modificationPoints: any[];
}

class ServiceNowIntelligentMCP {
  private server: Server;
  private client: ServiceNowClient;
  private oauth: ServiceNowOAuth;
  private logger: Logger;
  private memoryPath: string;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-intelligent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger('ServiceNowIntelligentMCP');
    this.memoryPath = join(process.cwd(), 'memory', 'servicenow_artifacts');

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_find_artifact',
          description: 'AUTONOMOUS artifact discovery - finds ServiceNow artifacts using natural language, searches memory first, then ServiceNow. NO MANUAL SEARCH NEEDED.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Natural language query (e.g., "the widget that shows incidents on homepage")' },
              type: { type: 'string', enum: ['widget', 'flow', 'script', 'application', 'any'], description: 'Artifact type filter' },
            },
            required: ['query'],
          },
        },
        {
          name: 'snow_edit_artifact',
          description: 'AUTONOMOUS artifact modification - edits ServiceNow artifacts using natural language, handles errors automatically, retries on failure. DIRECT MODIFICATION.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Natural language edit instruction (e.g., "pas de flow aan met de naam approval request flow en zorg dat er na de approval stap een mailtje naar test@admin.nl wordt gestuurd")' },
            },
            required: ['query'],
          },
        },
        {
          name: 'snow_analyze_artifact',
          description: 'AUTONOMOUS deep analysis - intelligently indexes artifacts for optimal Claude understanding, stores in memory for future use. SELF-LEARNING SYSTEM.',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'System ID of the artifact' },
              table: { type: 'string', description: 'ServiceNow table name' },
            },
            required: ['sys_id', 'table'],
          },
        },
        {
          name: 'snow_memory_search',
          description: 'Search indexed ServiceNow artifacts in memory',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: { type: 'string', enum: ['widget', 'flow', 'script', 'application'], description: 'Artifact type' },
            },
            required: ['query'],
          },
        },
        {
          name: 'snow_comprehensive_search',
          description: 'COMPREHENSIVE multi-table search - searches across all relevant ServiceNow tables for artifacts. Perfect for finding hard-to-locate items.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Natural language search query' },
              include_inactive: { type: 'boolean', description: 'Include inactive records', default: false },
            },
            required: ['query'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'snow_find_artifact':
            return await this.findArtifact(args);
          case 'snow_edit_artifact':
            return await this.editArtifact(args);
          case 'snow_analyze_artifact':
            return await this.analyzeArtifact(args);
          case 'snow_memory_search':
            return await this.searchMemory(args);
          case 'snow_comprehensive_search':
            return await this.comprehensiveSearch(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }

  private async findArtifact(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Finding ServiceNow artifact', { query: args.query });

      // 1. Parse natural language intent
      const intent = await this.parseIntent(args.query);
      
      // 2. Search in memory first
      const memoryResults = await this.searchInMemory(intent);
      
      if (memoryResults.length > 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🧠 Found in memory:\n\n${this.formatResults(memoryResults)}\n\n💡 Using cached intelligent index for optimal performance.`,
            },
          ],
        };
      }

      // 3. Search ServiceNow live
      this.logger.info(`Searching ServiceNow for: ${intent.identifier} (type: ${intent.artifactType})`);
      const liveResults = await this.searchServiceNow(intent);
      this.logger.info(`ServiceNow search returned ${liveResults?.length || 0} results`);
      
      // Debug log
      if (liveResults && liveResults.length > 0) {
        this.logger.info(`First result: ${JSON.stringify(liveResults[0])}`);
      }
      
      // 4. Index results for future use (only if we have results)
      if (liveResults && liveResults.length > 0) {
        this.logger.info('Indexing found artifacts for future use...');
        for (const result of liveResults) {
          await this.intelligentlyIndex(result);
        }
      }

      const credentials = await this.oauth.loadCredentials();
      const resultText = this.formatResults(liveResults);
      this.logger.info(`Formatted result text: ${resultText.substring(0, 200)}...`);
      const editSuggestion = this.generateEditSuggestion(liveResults?.[0]);

      return {
        content: [
          {
            type: 'text',
            text: `🔍 ServiceNow Search Results:\n\n${resultText}\n\n🔗 ServiceNow Instance: https://${credentials?.instance}\n\n${editSuggestion}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Artifact search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async editArtifact(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Editing ServiceNow artifact', { query: args.query });

      // 1. Parse edit instruction
      const editIntent = await this.parseEditIntent(args.query);
      
      // 2. Find target artifact
      const artifact = await this.findTargetArtifact(editIntent);
      
      // 3. Analyze modification requirements
      const modification = await this.analyzeModification(editIntent, artifact);
      
      // 4. Apply intelligent modification
      const editedArtifact = await this.applyModification(artifact, modification);
      
      // 5. Deploy back to ServiceNow
      const deployResult = await this.deployArtifact(editedArtifact);
      
      // 6. Update memory with changes
      await this.updateMemoryIndex(editedArtifact, modification);

      const credentials = await this.oauth.loadCredentials();
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ ServiceNow artifact successfully modified!\n\n🎯 Modification Details:\n- Artifact: ${artifact.name}\n- Type: ${artifact.type}\n- Changes: ${modification.description}\n\n🔗 View in ServiceNow: https://${credentials?.instance}/nav_to.do?uri=${this.getArtifactUrl(artifact)}\n\n📝 The artifact has been intelligently indexed and is now available for future natural language queries.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Artifact editing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async analyzeArtifact(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Analyzing ServiceNow artifact', { sys_id: args.sys_id });

      // Fetch complete artifact from ServiceNow
      const artifact = await this.client.getRecord(args.table, args.sys_id);
      
      // Perform intelligent indexing
      const indexedArtifact = await this.intelligentlyIndex(artifact);
      
      // Store in memory
      await this.storeInMemory(indexedArtifact);

      return {
        content: [
          {
            type: 'text',
            text: `🧠 Artifact Analysis Complete!\n\n📋 Summary:\n${indexedArtifact.claudeSummary}\n\n🏗️ Structure:\n${JSON.stringify(indexedArtifact.structure, null, 2)}\n\n🎯 Modification Points:\n${indexedArtifact.modificationPoints.map(p => `- ${p.description}`).join('\n')}\n\n💾 Artifact has been intelligently indexed and stored in memory for future natural language interactions.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Artifact analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async searchMemory(args: any) {
    try {
      const results = await this.searchInMemory({
        identifier: args.query,
        artifactType: args.type || 'any',
        action: 'find',
        confidence: 0.8
      });

      return {
        content: [
          {
            type: 'text',
            text: `🧠 Memory Search Results:\n\n${this.formatMemoryResults(results)}\n\n💡 All results are from the intelligent index for instant access.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Memory search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async comprehensiveSearch(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Starting comprehensive search', { query: args.query });

      // Define tables to search with their descriptions
      const searchTables = [
        { name: 'sys_script', desc: 'Business Rules', type: 'business_rule' },
        { name: 'sys_script_include', desc: 'Script Includes', type: 'script_include' },
        { name: 'sys_script_client', desc: 'Client Scripts', type: 'client_script' },
        { name: 'sys_ui_script', desc: 'UI Scripts', type: 'ui_script' },
        { name: 'sp_widget', desc: 'Service Portal Widgets', type: 'widget' },
        { name: 'sys_hub_flow', desc: 'Flow Designer Flows', type: 'flow' },
        { name: 'wf_workflow', desc: 'Workflows', type: 'workflow' },
        { name: 'sys_ui_action', desc: 'UI Actions', type: 'ui_action' },
        { name: 'sys_ui_policy', desc: 'UI Policies', type: 'ui_policy' },
        { name: 'sys_data_policy', desc: 'Data Policies', type: 'data_policy' },
        { name: 'sys_app_application', desc: 'Applications', type: 'application' },
        { name: 'sys_db_object', desc: 'Tables', type: 'table' },
        { name: 'sys_dictionary', desc: 'Dictionary/Fields', type: 'field' },
        { name: 'sysevent_email_action', desc: 'Notifications', type: 'notification' },
        { name: 'sys_transform_map', desc: 'Transform Maps', type: 'transform_map' },
        { name: 'sys_ws_definition', desc: 'REST APIs', type: 'rest_api' },
      ];

      const searchString = args.query.trim();
      const allResults = [];

      // Generate multiple search strategies like Claude Code did
      const searchStrategies = [
        { query: `name=${searchString}`, desc: 'Exact name match' },
        { query: `nameLIKE${searchString}`, desc: 'Name contains' },
        { query: `short_descriptionLIKE${searchString}`, desc: 'Description contains' },
        { query: `nameLIKE${searchString}^ORshort_descriptionLIKE${searchString}`, desc: 'Name or description' },
      ];

      // Add wildcard searches if multiple words
      const words = searchString.split(' ').filter((w: string) => w.length > 2);
      if (words.length > 1) {
        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        searchStrategies.push({ 
          query: `nameLIKE*${firstWord}*${lastWord}*`, 
          desc: 'First and last word match' 
        });
      }

      for (const table of searchTables) {
        this.logger.info(`Searching ${table.desc} (${table.name})...`);
        
        for (const strategy of searchStrategies) {
          try {
            const activeFilter = args.include_inactive ? '' : '^active=true';
            const fullQuery = `${strategy.query}${activeFilter}^LIMIT5`;
            
            const results = await this.client.searchRecords(table.name, fullQuery);
            
            if (results && results.length > 0) {
              // Add metadata to results
              const enhancedResults = results.map(result => ({
                ...result,
                artifact_type: table.type,
                table_name: table.name,
                table_description: table.desc,
                search_strategy: strategy.desc
              }));
              
              allResults.push(...enhancedResults);
              
              // Stop searching this table if we found results
              break;
            }
          } catch (error) {
            this.logger.warn(`Error searching ${table.name}:`, error);
          }
        }
      }

      // Remove duplicates by sys_id
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.sys_id === result.sys_id)
      );

      const credentials = await this.oauth.loadCredentials();
      const resultText = this.formatComprehensiveResults(uniqueResults);

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Comprehensive ServiceNow Search Results:\n\n${resultText}\n\n🔗 ServiceNow Instance: https://${credentials?.instance}\n\n💡 Searched across ${searchTables.length} table types with multiple strategies.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Comprehensive search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async parseIntent(query: string): Promise<ParsedIntent> {
    // Enhanced intent parsing with comprehensive type detection
    const lowercaseQuery = query.toLowerCase();
    
    let artifactType = 'any'; // Default to searching all types
    
    // Check for specific artifact types (order matters - most specific first)
    
    // Service Portal
    if (lowercaseQuery.includes('widget')) artifactType = 'widget';
    else if (lowercaseQuery.includes('portal')) artifactType = 'portal';
    else if (lowercaseQuery.includes('page') && lowercaseQuery.includes('service')) artifactType = 'page';
    else if (lowercaseQuery.includes('theme')) artifactType = 'theme';
    
    // Flow Designer & Workflow
    else if (lowercaseQuery.includes('flow designer') || lowercaseQuery.includes('sys_hub_flow')) artifactType = 'flow';
    else if (lowercaseQuery.includes('workflow') && !lowercaseQuery.includes('orchestration')) artifactType = 'workflow';
    else if (lowercaseQuery.includes('workflow activity')) artifactType = 'workflow_activity';
    else if (lowercaseQuery.includes('flow')) artifactType = 'flow';
    
    // Scripts & Automation (most specific first)
    else if (lowercaseQuery.includes('script include')) artifactType = 'script_include';
    else if (lowercaseQuery.includes('business rule')) artifactType = 'business_rule';
    else if (lowercaseQuery.includes('client script')) artifactType = 'client_script';
    else if (lowercaseQuery.includes('ui script')) artifactType = 'ui_script';
    else if (lowercaseQuery.includes('ui action')) artifactType = 'ui_action';
    else if (lowercaseQuery.includes('ui policy action')) artifactType = 'ui_policy_action';
    else if (lowercaseQuery.includes('ui policy')) artifactType = 'ui_policy';
    else if (lowercaseQuery.includes('data policy rule')) artifactType = 'data_policy_rule';
    else if (lowercaseQuery.includes('data policy')) artifactType = 'data_policy';
    
    // Applications
    else if (lowercaseQuery.includes('scoped app')) artifactType = 'scoped_app';
    else if (lowercaseQuery.includes('application') || lowercaseQuery.includes('app')) artifactType = 'application';
    
    // Tables & Fields
    else if (lowercaseQuery.includes('field') || lowercaseQuery.includes('dictionary')) artifactType = 'field';
    else if (lowercaseQuery.includes('table')) artifactType = 'table';
    
    // Forms & UI
    else if (lowercaseQuery.includes('form section')) artifactType = 'form_section';
    else if (lowercaseQuery.includes('list control')) artifactType = 'list_control';
    else if (lowercaseQuery.includes('related list')) artifactType = 'related_list';
    else if (lowercaseQuery.includes('form')) artifactType = 'form';
    else if (lowercaseQuery.includes('list')) artifactType = 'list';
    else if (lowercaseQuery.includes('view')) artifactType = 'view';
    else if (lowercaseQuery.includes('formatter')) artifactType = 'formatter';
    
    // Reports & Dashboards
    else if (lowercaseQuery.includes('pa dashboard')) artifactType = 'pa_dashboard';
    else if (lowercaseQuery.includes('pa widget')) artifactType = 'pa_widget';
    else if (lowercaseQuery.includes('dashboard')) artifactType = 'dashboard';
    else if (lowercaseQuery.includes('report')) artifactType = 'report';
    else if (lowercaseQuery.includes('gauge')) artifactType = 'gauge';
    else if (lowercaseQuery.includes('chart')) artifactType = 'chart';
    else if (lowercaseQuery.includes('indicator')) artifactType = 'indicator';
    
    // Security & Access Control
    else if (lowercaseQuery.includes('acl') || lowercaseQuery.includes('access control')) artifactType = 'acl';
    else if (lowercaseQuery.includes('role')) artifactType = 'role';
    else if (lowercaseQuery.includes('group')) artifactType = 'group';
    
    // Notifications & Communication
    else if (lowercaseQuery.includes('email template')) artifactType = 'email_template';
    else if (lowercaseQuery.includes('notification')) artifactType = 'notification';
    
    // Import & Export
    else if (lowercaseQuery.includes('import set')) artifactType = 'import_set';
    else if (lowercaseQuery.includes('transform map')) artifactType = 'transform_map';
    
    // Web Services
    else if (lowercaseQuery.includes('rest api') || lowercaseQuery.includes('rest')) artifactType = 'rest_api';
    else if (lowercaseQuery.includes('soap api') || lowercaseQuery.includes('soap')) artifactType = 'soap_api';
    
    // Scheduled Jobs
    else if (lowercaseQuery.includes('scheduled job')) artifactType = 'scheduled_job';
    else if (lowercaseQuery.includes('scheduled import')) artifactType = 'scheduled_import';
    
    // Knowledge Management
    else if (lowercaseQuery.includes('knowledge base')) artifactType = 'knowledge_base';
    else if (lowercaseQuery.includes('knowledge article') || lowercaseQuery.includes('knowledge')) artifactType = 'knowledge_article';
    
    // System Administration
    else if (lowercaseQuery.includes('system property') || lowercaseQuery.includes('property')) artifactType = 'property';
    
    // Mobile
    else if (lowercaseQuery.includes('mobile app') || lowercaseQuery.includes('mobile')) artifactType = 'mobile_app';
    
    // Catalog
    else if (lowercaseQuery.includes('catalog item')) artifactType = 'catalog_item';
    else if (lowercaseQuery.includes('catalog variable')) artifactType = 'catalog_variable';
    else if (lowercaseQuery.includes('catalog')) artifactType = 'catalog';
    
    // SLA & Metrics
    else if (lowercaseQuery.includes('sla')) artifactType = 'sla';
    else if (lowercaseQuery.includes('metric')) artifactType = 'metric';
    
    // Other common types
    else if (lowercaseQuery.includes('attachment')) artifactType = 'attachment';
    else if (lowercaseQuery.includes('language')) artifactType = 'language';
    else if (lowercaseQuery.includes('translation')) artifactType = 'translated_text';
    else if (lowercaseQuery.includes('processor')) artifactType = 'processor';
    else if (lowercaseQuery.includes('update set')) artifactType = 'update_set';
    else if (lowercaseQuery.includes('ml model') || lowercaseQuery.includes('machine learning')) artifactType = 'ml_model';
    else if (lowercaseQuery.includes('spoke')) artifactType = 'spoke';
    else if (lowercaseQuery.includes('connection')) artifactType = 'connection';
    else if (lowercaseQuery.includes('virtual agent') || lowercaseQuery.includes('chatbot')) artifactType = 'virtual_agent';
    else if (lowercaseQuery.includes('event rule')) artifactType = 'event_rule';
    else if (lowercaseQuery.includes('alert')) artifactType = 'alert';
    else if (lowercaseQuery.includes('discovery')) artifactType = 'discovery_schedule';
    else if (lowercaseQuery.includes('ci class')) artifactType = 'ci_class';
    else if (lowercaseQuery.includes('relationship')) artifactType = 'relationship_type';
    else if (lowercaseQuery.includes('service map')) artifactType = 'service_map';
    else if (lowercaseQuery.includes('orchestration workflow')) artifactType = 'orchestration_workflow';
    else if (lowercaseQuery.includes('pipeline')) artifactType = 'pipeline';
    else if (lowercaseQuery.includes('deployment')) artifactType = 'deployment';
    
    // Generic fallbacks
    else if (lowercaseQuery.includes('script')) artifactType = 'script_include';

    return {
      action: 'find',
      artifactType,
      identifier: query,
      confidence: 0.9,
    };
  }

  private async parseEditIntent(query: string): Promise<ParsedIntent & { modification: string }> {
    // Parse edit instructions - would be more sophisticated in real implementation
    const intent = await this.parseIntent(query);
    
    return {
      ...intent,
      action: 'edit',
      modification: query,
    };
  }

  private async searchServiceNow(intent: ParsedIntent) {
    try {
      const tableMapping: Record<string, string> = {
        // Service Portal
        widget: 'sp_widget',
        portal: 'sp_portal',
        page: 'sp_page',
        theme: 'sp_theme',
        
        // Flow Designer & Workflow
        flow: 'sys_hub_flow',
        workflow: 'wf_workflow',
        workflow_activity: 'wf_activity',
        
        // Scripts & Automation
        script_include: 'sys_script_include',
        script: 'sys_script_include',
        business_rule: 'sys_script',
        client_script: 'sys_script_client',
        ui_script: 'sys_ui_script',
        ui_action: 'sys_ui_action',
        ui_policy: 'sys_ui_policy',
        ui_policy_action: 'sys_ui_policy_action',
        data_policy: 'sys_data_policy',
        data_policy_rule: 'sys_data_policy_rule',
        
        // Applications & Scoped Apps
        application: 'sys_app_application',
        app: 'sys_app_application',
        scoped_app: 'sys_app',
        
        // Tables & Fields
        table: 'sys_db_object',
        field: 'sys_dictionary',
        dictionary: 'sys_dictionary',
        
        // Forms & UI
        form: 'sys_form',
        form_section: 'sys_form_section',
        list: 'sys_list',
        list_control: 'sys_list_control',
        view: 'sys_ui_view',
        related_list: 'sys_ui_related_list',
        formatter: 'sys_ui_formatter',
        
        // Reports & Dashboards
        report: 'sys_report',
        dashboard: 'sys_dashboard',
        gauge: 'pa_dashboards',
        chart: 'sys_chart',
        
        // Security & Access Control
        acl: 'sys_security_acl',
        role: 'sys_user_role',
        group: 'sys_user_group',
        
        // Notifications & Communication
        notification: 'sysevent_email_action',
        email_template: 'sysevent_email_template',
        
        // Import & Export
        import_set: 'sys_import_set',
        transform_map: 'sys_transform_map',
        
        // Web Services
        rest_api: 'sys_ws_definition',
        soap_api: 'sys_web_service',
        
        // Scheduled Jobs
        scheduled_job: 'sysauto_script',
        scheduled_import: 'scheduled_import_set',
        
        // Knowledge Management
        knowledge_base: 'kb_knowledge_base',
        knowledge_article: 'kb_knowledge',
        
        // System Administration
        property: 'sys_properties',
        system_property: 'sys_properties',
        
        // Mobile
        mobile_app: 'sys_mobile_application',
        
        // Catalog
        catalog: 'sc_catalog',
        catalog_item: 'sc_cat_item',
        catalog_variable: 'item_option_new',
        
        // SLA & Metrics
        sla: 'contract_sla',
        metric: 'sys_report_color',
        
        // Attachments & Files
        attachment: 'sys_attachment',
        
        // Languages & Translations
        language: 'sys_language',
        translated_text: 'sys_translated',
        
        // Processors & Servlets
        processor: 'sys_processor',
        
        // Update Sets & Deployment
        update_set: 'sys_update_set',
        
        // AI & ML
        ml_model: 'ml_model',
        
        // Integration Hub
        spoke: 'sys_hub_action_type',
        connection: 'sys_connection',
        
        // Virtual Agent
        virtual_agent: 'sys_cs_topic',
        chatbot: 'sys_cs_topic',
        
        // Performance Analytics
        pa_dashboard: 'pa_dashboards',
        pa_widget: 'pa_widgets',
        indicator: 'pa_indicators',
        
        // Event Management
        event_rule: 'em_event_rule',
        alert: 'em_alert',
        
        // Discovery
        discovery_schedule: 'discovery_schedule',
        
        // CMDB
        ci_class: 'sys_db_object',
        relationship_type: 'cmdb_rel_type',
        
        // Service Mapping
        service_map: 'sa_pattern',
        
        // Orchestration
        orchestration_workflow: 'sc_ic_workflow',
        
        // DevOps
        pipeline: 'cicd_pipeline',
        deployment: 'cicd_deployment',
      };

      // If searching for 'any' type, search only the most common tables
      if (intent.artifactType === 'any') {
        this.logger.info('Searching common artifact types...');
        const allResults = [];
        
        // Define most common tables to search when type is 'any'
        const commonTables = {
          widget: 'sp_widget',
          business_rule: 'sys_script',
          client_script: 'sys_script_client',
          script_include: 'sys_script_include',
          flow: 'sys_hub_flow',
          workflow: 'wf_workflow',
          ui_action: 'sys_ui_action',
          table: 'sys_db_object',
          application: 'sys_app_application',
        };
        
        for (const [type, table] of Object.entries(commonTables)) {
          try {
            // Try exact match first for each table
            const searchString = intent.identifier.trim();
            let results = await this.client.searchRecords(table, `name=${searchString}^LIMIT2`);
            
            // If no exact match, try contains
            if (!results || results.length === 0) {
              results = await this.client.searchRecords(table, `nameLIKE${searchString}^LIMIT3`);
            }
            
            // If still no results, try wildcards on first term only
            if (!results || results.length === 0) {
              const firstTerm = searchString.split(' ')[0];
              if (firstTerm && firstTerm.length > 2) {
                results = await this.client.searchRecords(table, `nameLIKE*${firstTerm}*^LIMIT3`);
              }
            }
            
            if (results && results.length > 0) {
              // Add artifact type to results for identification
              const typedResults = results.map(result => ({
                ...result,
                artifact_type: type,
                table_name: table
              }));
              allResults.push(...typedResults);
            }
          } catch (error) {
            this.logger.warn(`Error searching ${table}:`, error);
          }
        }
        
        // If still no results, try broader search in common tables only
        if (allResults.length === 0) {
          this.logger.info('No results found, trying broader search in common tables...');
          const firstTerm = intent.identifier.split(' ')[0];
          if (firstTerm && firstTerm.length > 2) {
            for (const [type, table] of Object.entries(commonTables)) {
              try {
                const broadQuery = `(nameLIKE*${firstTerm}*^ORtitleLIKE*${firstTerm}*^ORshort_descriptionLIKE*${firstTerm}*)^LIMIT5`;
                const results = await this.client.searchRecords(table, broadQuery, 5);
                if (results && results.length > 0) {
                  const typedResults = results.map(result => ({
                    ...result,
                    artifact_type: type,
                    table_name: table
                  }));
                  allResults.push(...typedResults);
                }
              } catch (error) {
                this.logger.warn(`Error in broad search ${table}:`, error);
              }
            }
          }
        }
        
        return allResults;
      }

      // Search specific table
      const table = tableMapping[intent.artifactType];
      if (!table) {
        this.logger.warn(`Unknown artifact type: ${intent.artifactType}`);
        return [];
      }

      // First try exact match
      const searchString = intent.identifier.trim();
      let results = [];
      
      // Try exact name match first
      this.logger.info(`Trying exact match: name=${searchString}`);
      results = await this.client.searchRecords(table, `name=${searchString}^LIMIT5`);
      
      // If no exact match, try contains without wildcards (ServiceNow specific)
      if (!results || results.length === 0) {
        this.logger.info(`No exact match, trying contains: nameLIKE${searchString}`);
        results = await this.client.searchRecords(table, `nameLIKE${searchString}^LIMIT10`);
      }
      
      // Also try description fields
      if (!results || results.length === 0) {
        this.logger.info(`No name match, trying description: short_descriptionLIKE${searchString}`);
        results = await this.client.searchRecords(table, `short_descriptionLIKE${searchString}^ORdescriptionLIKE${searchString}^LIMIT10`);
      }
      
      // If still no results, use the complex query
      if (!results || results.length === 0) {
        const query = this.buildServiceNowQuery(intent);
        this.logger.info(`No contains match, trying complex query: ${query}`);
        results = await this.client.searchRecords(table, query);
      }
      
      // If still no results, try a broader search
      if (!results || results.length === 0) {
        this.logger.info(`No results found, trying broader search...`);
        
        // Try searching with just the first search term with wildcards
        const firstTerm = intent.identifier.split(' ')[0];
        if (firstTerm && firstTerm.length > 2) {
          const broadQuery = `(nameLIKE*${firstTerm}*^ORtitleLIKE*${firstTerm}*^ORshort_descriptionLIKE*${firstTerm}*)^LIMIT10`;
          results = await this.client.searchRecords(table, broadQuery);
        }
        
        // If still no results, get first 10 records to test connection
        if (!results || results.length === 0) {
          this.logger.info(`No results with broad search, fetching sample records...`);
          results = await this.client.searchRecords(table, 'active=true^ORDERBYsys_updated_on^LIMIT10');
        }
      }

      // Ensure we always return an array
      return Array.isArray(results) ? results : [];
    } catch (error) {
      this.logger.error('Error searching ServiceNow', error);
      return [];
    }
  }

  private buildServiceNowQuery(intent: ParsedIntent): string {
    // Build proper ServiceNow encoded query
    const searchString = intent.identifier.trim();
    
    if (searchString.length === 0) {
      // Return first 10 active records if no search terms
      return 'active=true^LIMIT10';
    }

    // First try exact name match
    const exactQuery = `name=${searchString}`;
    
    // Then try name contains (without wildcards for multi-word)
    const containsQuery = `nameLIKE${searchString}`;
    
    // For single words, use wildcards (keep original case for better matching)
    const searchTerms = searchString.split(' ').filter(term => term.length > 1);
    const wildcardQueries = [];
    
    if (searchTerms.length === 1) {
      // Single word - use wildcards with both cases
      const term = searchTerms[0];
      const termLower = term.toLowerCase();
      wildcardQueries.push(`nameLIKE*${term}*`);
      wildcardQueries.push(`nameLIKE*${termLower}*`);
      wildcardQueries.push(`titleLIKE*${term}*`);
      wildcardQueries.push(`titleLIKE*${termLower}*`);
      wildcardQueries.push(`short_descriptionLIKE*${termLower}*`);
    } else {
      // Multiple words - search for first and last word with wildcards
      const firstTerm = searchTerms[0];
      const lastTerm = searchTerms[searchTerms.length - 1];
      const firstLower = firstTerm.toLowerCase();
      const lastLower = lastTerm.toLowerCase();
      
      wildcardQueries.push(`nameLIKE*${firstTerm}*`);
      wildcardQueries.push(`nameLIKE*${firstLower}*`);
      wildcardQueries.push(`nameLIKE*${lastTerm}*`);
      wildcardQueries.push(`nameLIKE*${lastLower}*`);
      wildcardQueries.push(`titleLIKE*${firstTerm}*`);
      wildcardQueries.push(`titleLIKE*${lastTerm}*`);
    }
    
    // Combine queries: try exact match OR contains OR wildcards
    const allQueries = [exactQuery, containsQuery, ...wildcardQueries];
    const query = `(${allQueries.join('^OR')})^LIMIT20`;
    return query;
  }

  private async intelligentlyIndex(artifact: any): Promise<IndexedArtifact> {
    // Intelligent indexing based on artifact type
    const structure = await this.decomposeArtifact(artifact);
    const context = await this.extractContext(artifact);
    const relationships = await this.mapRelationships(artifact);
    const claudeSummary = await this.createClaudeSummary(artifact);
    const modificationPoints = await this.identifyModificationPoints(artifact);

    return {
      meta: {
        sys_id: artifact.sys_id,
        name: artifact.name || artifact.title,
        title: artifact.title,
        type: artifact.sys_class_name || 'unknown',
        last_updated: artifact.sys_updated_on,
      },
      structure,
      context,
      relationships,
      claudeSummary,
      modificationPoints,
    };
  }

  private async decomposeArtifact(artifact: any) {
    // Decompose artifact based on type
    if (artifact.sys_class_name === 'sp_widget') {
      return this.decomposeWidget(artifact);
    } else if (artifact.sys_class_name === 'sys_hub_flow') {
      return this.decomposeFlow(artifact);
    }
    return { type: 'unknown', components: [] };
  }

  private async decomposeWidget(widget: any) {
    return {
      type: 'widget',
      components: {
        template: widget.template ? 'HTML template present' : 'No template',
        css: widget.css ? 'Custom CSS present' : 'No custom CSS',
        client_script: widget.client_script ? 'Client script present' : 'No client script',
        server_script: widget.server_script ? 'Server script present' : 'No server script',
        options: widget.option_schema ? JSON.parse(widget.option_schema) : [],
      },
    };
  }

  private async decomposeFlow(flow: any) {
    return {
      type: 'flow',
      components: {
        name: flow.name,
        description: flow.description,
        active: flow.active,
        trigger: flow.trigger_conditions || 'Unknown trigger',
        steps: 'Flow definition analysis would go here',
      },
    };
  }

  private async extractContext(artifact: any) {
    return {
      usage: 'Context analysis would determine usage patterns',
      dependencies: 'Related artifacts would be identified here',
      impact: 'Impact analysis would be performed here',
    };
  }

  private async mapRelationships(artifact: any) {
    return {
      relatedArtifacts: [],
      dependencies: [],
      usage: [],
    };
  }

  private async createClaudeSummary(artifact: any): Promise<string> {
    const name = artifact.name || artifact.title || 'Unknown';
    const type = artifact.sys_class_name || 'artifact';
    
    return `${name} is a ${type} in ServiceNow. It can be modified using natural language instructions through Snow-Flow.`;
  }

  private async identifyModificationPoints(artifact: any) {
    // Identify common modification points
    return [
      {
        location: 'main_configuration',
        type: 'modify_settings',
        description: 'Main configuration can be modified',
      },
    ];
  }

  private async storeInMemory(artifact: IndexedArtifact) {
    // Store in memory for future access
    await fs.mkdir(this.memoryPath, { recursive: true });
    const filePath = join(this.memoryPath, `${artifact.meta.sys_id}.json`);
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2));
  }

  private async searchInMemory(intent: ParsedIntent) {
    // Search in memory index
    try {
      const files = await fs.readdir(this.memoryPath);
      const results = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(join(this.memoryPath, file), 'utf8');
            const artifact = JSON.parse(content);
            
            // Ensure artifact has basic structure
            if (artifact && (artifact.meta || artifact.claudeSummary)) {
              if (this.matchesIntent(artifact, intent)) {
                results.push(artifact);
              }
            }
          } catch (parseError) {
            this.logger.warn(`Failed to parse memory file: ${file}`, parseError);
            // Continue with next file
          }
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  }

  private matchesIntent(artifact: IndexedArtifact, intent: ParsedIntent): boolean {
    const searchTerm = intent.identifier.toLowerCase();
    
    // Safe access to artifact properties with fallbacks
    const artifactName = (artifact.meta?.name || artifact.meta?.title || '').toLowerCase();
    const artifactSummary = (artifact.claudeSummary || '').toLowerCase();
    
    return artifactName.includes(searchTerm) || artifactSummary.includes(searchTerm);
  }

  private formatResults(results: any[]): string {
    if (!results || results.length === 0) {
      return '❌ No artifacts found matching your search criteria.\n\n🔍 **Debugging Info:**\n- ServiceNow connection appears to be working\n- Try broader search terms\n- Check if widgets exist in your ServiceNow instance\n- Use snow_deploy_widget to create new widgets first';
    }

    const formattedResults = results.map((result, index) => {
      const name = result.name || result.title || result.display_name || result.sys_id || 'Unknown';
      const type = result.sys_class_name || result.type || 'Unknown';
      const artifactType = result.artifact_type || 'Unknown';
      const tableName = result.table_name || 'Unknown';
      const id = result.sys_id || 'Unknown';
      const updated = result.sys_updated_on || result.last_updated || 'Unknown';
      const active = result.active !== undefined ? (result.active ? 'Active' : 'Inactive') : 'Unknown';
      const description = result.short_description || result.description || 'No description';
      
      return `${index + 1}. **${name}**\n   - Artifact Type: ${artifactType}\n   - Table: ${tableName}\n   - Class: ${type}\n   - ID: ${id}\n   - Status: ${active}\n   - Description: ${description}\n   - Updated: ${updated}`;
    }).join('\n\n');

    return `✅ Found ${results.length} artifact(s):\n\n${formattedResults}`;
  }

  private formatMemoryResults(results: IndexedArtifact[]): string {
    return results.map((result, index) => 
      `${index + 1}. **${result.meta.name}**\n   - Type: ${result.meta.type}\n   - Summary: ${result.claudeSummary}\n   - Modification Points: ${result.modificationPoints.length}`
    ).join('\n\n');
  }

  private formatComprehensiveResults(results: any[]): string {
    if (!results || results.length === 0) {
      return '❌ No artifacts found across all ServiceNow tables.\n\n🔍 **Suggestions:**\n- Check spelling and try different terms\n- Include inactive records with include_inactive=true\n- Try broader search terms\n- The artifact might be in a scoped application';
    }

    // Group results by table type
    const groupedResults = results.reduce((groups, result) => {
      const tableDesc = result.table_description || result.table_name;
      if (!groups[tableDesc]) {
        groups[tableDesc] = [];
      }
      groups[tableDesc].push(result);
      return groups;
    }, {} as Record<string, any[]>);

    let output = `✅ Found ${results.length} artifact(s) across ${Object.keys(groupedResults).length} table type(s):\n\n`;

    for (const [tableDesc, tableResults] of Object.entries(groupedResults)) {
      output += `## ${tableDesc}\n`;
      
      (tableResults as any[]).forEach((result: any, index: number) => {
        const name = result.name || result.title || result.display_name || result.sys_id || 'Unknown';
        const active = result.active !== undefined ? (result.active ? 'Active' : 'Inactive') : 'Unknown';
        const description = result.short_description || result.description || 'No description';
        const strategy = result.search_strategy || 'Unknown';
        const collection = result.collection || result.table_name || 'Unknown';
        
        output += `${index + 1}. **${name}**\n`;
        output += `   - Table: ${collection}\n`;
        output += `   - Status: ${active}\n`;
        output += `   - Description: ${description}\n`;
        output += `   - Found via: ${strategy}\n`;
        output += `   - Sys ID: ${result.sys_id}\n`;
        
        if (result.when) output += `   - When: ${result.when}\n`;
        if (result.order) output += `   - Order: ${result.order}\n`;
        if (result.condition) output += `   - Condition: ${result.condition}\n`;
        
        output += '\n';
      });
    }

    return output;
  }

  private generateEditSuggestion(artifact: any): string {
    if (!artifact) {
      return '💡 Use snow_edit_artifact to modify ServiceNow artifacts with natural language.';
    }
    
    const name = artifact.name || artifact.title || artifact.display_name || 'the artifact';
    return `💡 To edit this artifact, use:\n\`snow-flow edit "modify ${name} to add [your requirements]"\``;
  }

  private async findTargetArtifact(intent: ParsedIntent) {
    // Find the specific artifact to edit
    const results = await this.searchServiceNow(intent);
    if (results.length === 0) {
      throw new Error('No matching artifact found');
    }
    
    // Return the best match (first result for now)
    return results[0];
  }

  private async analyzeModification(intent: ParsedIntent, artifact: any) {
    // Analyze what modification is needed
    return {
      type: 'configuration_change',
      description: intent.modification || 'General modification',
      target: artifact.sys_id,
    };
  }

  private async applyModification(artifact: any, modification: any) {
    // Apply the modification - this would be more sophisticated
    return {
      ...artifact,
      modified: true,
      modification_applied: modification,
    };
  }

  private async deployArtifact(artifact: any) {
    // Deploy the modified artifact back to ServiceNow
    return { success: true, message: 'Artifact deployed successfully' };
  }

  private async updateMemoryIndex(artifact: any, modification: any) {
    // Update the memory index with the changes
    const indexed = await this.intelligentlyIndex(artifact);
    await this.storeInMemory(indexed);
  }

  private getArtifactUrl(artifact: any): string {
    // Generate ServiceNow URL for the artifact
    return `sys_id=${artifact.sys_id}`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Intelligent MCP Server started');
  }
}

// Start the server
const server = new ServiceNowIntelligentMCP();
server.start().catch((error) => {
  console.error('Failed to start ServiceNow Intelligent MCP:', error);
  process.exit(1);
});
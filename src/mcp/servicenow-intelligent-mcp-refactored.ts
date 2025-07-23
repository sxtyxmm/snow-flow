#!/usr/bin/env node
/**
 * ServiceNow Intelligent MCP Server - Agent-Integrated Version
 * Smart discovery and memory-aware operations for the agent ecosystem
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BaseMCPServer, MCPToolResult } from './shared/base-mcp-server.js';
import { AgentContext } from './shared/mcp-memory-manager.js';
import * as crypto from 'crypto';

interface SearchResult {
  sys_id: string;
  name: string;
  type: string;
  table: string;
  description?: string;
  relevance_score?: number;
}

export class ServiceNowIntelligentMCP extends BaseMCPServer {
  private searchCache: Map<string, { results: SearchResult[], timestamp: number }>;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    super('servicenow-intelligent', '2.0.0');
    this.searchCache = new Map();
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
              query: { 
                type: 'string', 
                description: 'Natural language query (e.g., "the widget that shows incidents on homepage")' 
              },
              type: { 
                type: 'string', 
                enum: ['widget', 'flow', 'script', 'application', 'any'],
                description: 'Artifact type filter' 
              },
              // Agent context
              session_id: { type: 'string', description: 'Agent session ID' },
              agent_id: { type: 'string', description: 'Searching agent ID' },
              agent_type: { type: 'string', description: 'Type of agent' },
              use_cache: { type: 'boolean', default: true, description: 'Use cached results if available' }
            },
            required: ['query']
          }
        },
        {
          name: 'snow_analyze_artifact',
          description: 'AUTONOMOUS deep analysis - intelligently indexes artifacts for optimal Claude understanding, stores in memory for future use. SELF-LEARNING SYSTEM.',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'System ID of the artifact' },
              table: { type: 'string', description: 'ServiceNow table name' },
              session_id: { type: 'string' },
              agent_id: { type: 'string' },
              agent_type: { type: 'string' },
              deep_analysis: { type: 'boolean', default: true, description: 'Perform deep analysis' }
            },
            required: ['sys_id', 'table']
          }
        },
        {
          name: 'snow_memory_search',
          description: 'Search indexed ServiceNow artifacts in memory',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              type: { 
                type: 'string', 
                enum: ['widget', 'flow', 'script', 'application'],
                description: 'Artifact type' 
              },
              session_id: { type: 'string' },
              agent_id: { type: 'string' }
            },
            required: ['query']
          }
        },
        {
          name: 'snow_comprehensive_search',
          description: 'COMPREHENSIVE multi-table search - searches across all relevant ServiceNow tables for artifacts. Perfect for finding hard-to-locate items.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Natural language search query' },
              include_inactive: { type: 'boolean', default: false, description: 'Include inactive records' },
              session_id: { type: 'string' },
              agent_id: { type: 'string' },
              agent_type: { type: 'string' },
              max_results: { type: 'number', default: 50, description: 'Maximum results to return' }
            },
            required: ['query']
          }
        },
        {
          name: 'memory_store',
          description: 'Store data in persistent memory for multi-agent coordination',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Unique key for the data' },
              value: { description: 'Data to store (any JSON-serializable value)' },
              ttl: { type: 'number', description: 'Time to live in milliseconds (optional)' },
              namespace: { type: 'string', description: 'Namespace for organizing data (optional)', default: 'default' }
            },
            required: ['key', 'value']
          }
        },
        {
          name: 'memory_get',
          description: 'Retrieve data from persistent memory',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Key to retrieve' },
              namespace: { type: 'string', description: 'Namespace to search in (optional)', default: 'default' }
            },
            required: ['key']
          }
        },
        {
          name: 'memory_list',
          description: 'List all keys in memory',
          inputSchema: {
            type: 'object',
            properties: {
              namespace: { type: 'string', description: 'Namespace to list (optional)', default: 'default' },
              pattern: { type: 'string', description: 'Pattern to filter keys (optional)' }
            }
          }
        },
        {
          name: 'todo_write',
          description: 'Create or update todo items for task coordination',
          inputSchema: {
            type: 'object',
            properties: {
              todos: {
                type: 'array',
                description: 'Array of todo items',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Unique ID for the todo' },
                    content: { type: 'string', description: 'Todo description' },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: 'Todo status' },
                    priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Todo priority' }
                  },
                  required: ['id', 'content', 'status', 'priority']
                }
              }
            },
            required: ['todos']
          }
        },
        {
          name: 'todo_read',
          description: 'Read current todo list',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['all', 'pending', 'in_progress', 'completed'], description: 'Filter by status', default: 'all' }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'snow_find_artifact':
            return await this.findArtifactWithMemory(args);
          case 'snow_analyze_artifact':
            return await this.analyzeArtifactWithMemory(args);
          case 'snow_memory_search':
            return await this.searchMemory(args);
          case 'snow_comprehensive_search':
            return await this.comprehensiveSearch(args);
          case 'memory_store':
            return await this.handleMemoryStore(args);
          case 'memory_get':
            return await this.handleMemoryGet(args);
          case 'memory_list':
            return await this.handleMemoryList(args);
          case 'todo_write':
            return await this.handleTodoWrite(args);
          case 'todo_read':
            return await this.handleTodoRead(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.createErrorResponse(
          `Tool execution failed: ${name}`,
          error
        );
      }
    });
  }

  /**
   * Find artifact with memory-first approach
   */
  private async findArtifactWithMemory(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_find_artifact',
      args,
      async (context) => {
        const { query, type, use_cache } = args;

        // Check authentication
        // 🔧 MANDATORY ServiceNow connection validation
        const connectionResult = await this.validateServiceNowConnection();
        if (!connectionResult.success) {
          return this.createAuthenticationError(connectionResult.error);
        }

        this.assertNoMockData('artifact search');

        // Progress: Starting search
        await this.reportProgress(context, 10, 'Starting artifact search');

        // Step 1: Check memory first
        const memoryResults = await this.searchMemoryForArtifacts(query, type, context);
        
        if (memoryResults.length > 0) {
          await this.reportProgress(context, 30, 'Found artifacts in memory');
          
          // Store search in context for other agents
          await this.updateSearchContext(context, query, memoryResults);
          
          return this.createSuccessResponse(
            `Found ${memoryResults.length} artifacts in memory`,
            { results: memoryResults, source: 'memory' }
          );
        }

        // Step 2: Check cache if enabled
        if (use_cache) {
          const cachedResults = this.getCachedResults(query, type);
          if (cachedResults) {
            await this.reportProgress(context, 40, 'Using cached results');
            return this.createSuccessResponse(
              `Found ${cachedResults.length} artifacts (cached)`,
              { results: cachedResults, source: 'cache' }
            );
          }
        }

        // Step 3: Search ServiceNow
        await this.reportProgress(context, 50, 'Searching ServiceNow instance');
        
        const searchResults = await this.searchServiceNow(query, type, context);
        
        // Step 4: Store results in memory and cache
        await this.reportProgress(context, 80, 'Indexing results');
        
        for (const result of searchResults) {
          await this.storeArtifact(context, {
            sys_id: result.sys_id,
            type: result.type,
            name: result.name,
            description: result.description
          });
        }

        // Cache results
        this.cacheResults(query, type, searchResults);
        
        // Update search context
        await this.updateSearchContext(context, query, searchResults);
        
        await this.reportProgress(context, 100, 'Search complete');

        return this.createSuccessResponse(
          `Found ${searchResults.length} artifacts in ServiceNow`,
          { 
            results: searchResults, 
            source: 'servicenow',
            indexed: true 
          }
        );
      }
    );
  }

  /**
   * Analyze artifact with deep learning
   */
  private async analyzeArtifactWithMemory(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_analyze_artifact',
      args,
      async (context) => {
        const { sys_id, table, deep_analysis } = args;

        // 🔧 MANDATORY ServiceNow connection validation
        const connectionResult = await this.validateServiceNowConnection();
        if (!connectionResult.success) {
          return this.createAuthenticationError(connectionResult.error);
        }

        this.assertNoMockData('artifact analysis');

        await this.reportProgress(context, 10, 'Fetching artifact details');

        // Fetch artifact from ServiceNow
        const artifact = await this.client.getRecord(table, sys_id);
        
        if (!artifact.success || !artifact.result) {
          throw new Error(`Artifact ${sys_id} not found in table ${table}`);
        }

        await this.reportProgress(context, 30, 'Analyzing artifact structure');

        // Perform deep analysis
        const analysis = await this.performDeepAnalysis(artifact.result, table, deep_analysis);
        
        // Store analysis in memory
        await this.memory.updateSharedContext({
          session_id: context.session_id,
          context_key: `artifact_analysis_${sys_id}`,
          context_value: JSON.stringify(analysis),
          created_by_agent: context.agent_id
        });

        // Store enhanced artifact info
        await this.storeArtifact(context, {
          sys_id: sys_id,
          type: this.getArtifactType(table),
          name: artifact.result.name || artifact.result.id || sys_id,
          description: artifact.result.description,
          config: analysis.config
        });

        await this.reportProgress(context, 70, 'Identifying relationships');

        // Find related artifacts
        const relationships = await this.findRelationships(artifact.result, table, context);
        
        // Notify relevant agents based on artifact type
        if (analysis.requires_ui_work && this.getArtifactType(table) === 'widget') {
          await this.notifyHandoff(context, 'ui_specialist', {
            type: 'widget',
            sys_id: sys_id,
            next_steps: analysis.suggested_improvements || []
          });
        }

        await this.reportProgress(context, 100, 'Analysis complete');

        return this.createSuccessResponse(
          `Deep analysis completed for ${artifact.result.name || sys_id}`,
          {
            artifact: {
              sys_id: sys_id,
              name: artifact.result.name,
              type: this.getArtifactType(table),
              table: table
            },
            analysis: analysis,
            relationships: relationships,
            indexed: true
          }
        );
      }
    );
  }

  /**
   * Search memory for artifacts
   */
  private async searchMemory(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_memory_search',
      args,
      async (context) => {
        const { query, type } = args;

        const artifacts = await this.memory.getSessionArtifacts(context.session_id);
        
        const results = artifacts.filter(artifact => {
          const matchesType = !type || artifact.artifact_type === type;
          const matchesQuery = 
            artifact.name.toLowerCase().includes(query.toLowerCase()) ||
            (artifact.description && artifact.description.toLowerCase().includes(query.toLowerCase()));
          
          return matchesType && matchesQuery;
        });

        return this.createSuccessResponse(
          `Found ${results.length} artifacts in memory`,
          { results }
        );
      }
    );
  }

  /**
   * Comprehensive search across all tables
   */
  private async comprehensiveSearch(args: any): Promise<MCPToolResult> {
    return await this.executeWithAgentContext(
      'snow_comprehensive_search',
      args,
      async (context) => {
        const { query, include_inactive, max_results } = args;

        // 🔧 MANDATORY ServiceNow connection validation
        const connectionResult = await this.validateServiceNowConnection();
        if (!connectionResult.success) {
          return this.createAuthenticationError(connectionResult.error);
        }

        this.assertNoMockData('comprehensive search');

        // Define tables to search
        const searchTables = [
          { table: 'sp_widget', type: 'widget', nameField: 'name' },
          { table: 'sys_hub_flow', type: 'flow', nameField: 'name' },
          { table: 'sys_script_include', type: 'script', nameField: 'name' },
          { table: 'sys_app', type: 'application', nameField: 'name' },
          { table: 'sc_cat_item', type: 'catalog_item', nameField: 'name' },
          { table: 'sys_script', type: 'business_rule', nameField: 'name' }
        ];

        const allResults: SearchResult[] = [];
        let tablesSearched = 0;

        for (const searchConfig of searchTables) {
          await this.reportProgress(
            context, 
            10 + (80 * tablesSearched / searchTables.length),
            `Searching ${searchConfig.type} records`
          );

          try {
            const results = await this.searchTable(
              searchConfig.table,
              searchConfig.nameField,
              query,
              searchConfig.type,
              include_inactive,
              Math.floor(max_results / searchTables.length)
            );

            allResults.push(...results);
            tablesSearched++;

            // Store found artifacts
            for (const result of results) {
              await this.storeArtifact(context, {
                sys_id: result.sys_id,
                type: result.type,
                name: result.name,
                description: result.description
              });
            }
          } catch (error) {
            this.logger.warn(`Failed to search ${searchConfig.table}`, error);
          }
        }

        // Sort by relevance
        allResults.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

        // Limit results
        const finalResults = allResults.slice(0, max_results);

        await this.reportProgress(context, 100, 'Search complete');

        return this.createSuccessResponse(
          `Comprehensive search found ${finalResults.length} artifacts across ${tablesSearched} tables`,
          {
            results: finalResults,
            tables_searched: tablesSearched,
            total_found: allResults.length,
            limited_to: max_results
          }
        );
      }
    );
  }

  // Helper methods

  private async searchMemoryForArtifacts(
    query: string, 
    type: string | undefined, 
    context: AgentContext
  ): Promise<SearchResult[]> {
    const artifacts = await this.memory.getSessionArtifacts(context.session_id);
    
    return artifacts
      .filter(artifact => {
        const matchesType = !type || type === 'any' || artifact.artifact_type === type;
        const queryLower = query.toLowerCase();
        const matchesQuery = 
          artifact.name.toLowerCase().includes(queryLower) ||
          (artifact.description && artifact.description.toLowerCase().includes(queryLower));
        
        return matchesType && matchesQuery;
      })
      .map(artifact => ({
        sys_id: artifact.sys_id,
        name: artifact.name,
        type: artifact.artifact_type,
        table: this.getTableForType(artifact.artifact_type),
        description: artifact.description,
        relevance_score: this.calculateRelevance(artifact.name, query)
      }));
  }

  private async searchServiceNow(
    query: string,
    type: string | undefined,
    context: AgentContext
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Determine which tables to search
    const tablesToSearch = type && type !== 'any' 
      ? [this.getSearchConfigForType(type)]
      : this.getAllSearchConfigs();

    for (const config of tablesToSearch) {
      try {
        const tableResults = await this.searchTable(
          config.table,
          config.nameField,
          query,
          config.type,
          false,
          10
        );
        results.push(...tableResults);
      } catch (error) {
        this.logger.warn(`Search failed for table ${config.table}`, error);
      }
    }

    return results;
  }

  private async searchTable(
    table: string,
    nameField: string,
    query: string,
    type: string,
    includeInactive: boolean,
    limit: number
  ): Promise<SearchResult[]> {
    const encodedQuery = `${nameField}LIKE${query}${includeInactive ? '' : '^active=true'}`;
    
    const response = await this.client.getRecords(table, {
      sysparm_query: encodedQuery,
      sysparm_limit: limit,
      sysparm_fields: `sys_id,${nameField},description,active`
    });

    if (!response.success || !response.result) {
      return [];
    }

    return response.result.map((record: any) => ({
      sys_id: record.sys_id,
      name: record[nameField] || 'Unnamed',
      type: type,
      table: table,
      description: record.description,
      relevance_score: this.calculateRelevance(record[nameField] || '', query)
    }));
  }

  private async performDeepAnalysis(
    artifact: any,
    table: string,
    deep: boolean
  ): Promise<any> {
    const analysis: any = {
      structure: {},
      dependencies: [],
      config: {},
      suggested_improvements: []
    };

    // Analyze based on artifact type
    const artifactType = this.getArtifactType(table);
    
    switch (artifactType) {
      case 'widget':
        analysis.structure = {
          has_template: !!artifact.template,
          has_css: !!artifact.css,
          has_client_script: !!artifact.client_script,
          has_server_script: !!artifact.server_script,
          uses_options: !!artifact.option_schema
        };
        
        if (deep) {
          // Check for common patterns
          if (artifact.template && !artifact.template.includes('ng-')) {
            analysis.suggested_improvements.push('Consider using Angular directives');
          }
          if (!artifact.css || artifact.css.length < 50) {
            analysis.suggested_improvements.push('Add responsive CSS styling');
            analysis.requires_ui_work = true;
          }
        }
        
        analysis.config = {
          name: artifact.name,
          template_size: artifact.template?.length || 0,
          css_size: artifact.css?.length || 0,
          requires_data: artifact.server_script?.includes('data.') || false
        };
        break;

      case 'flow':
        analysis.structure = {
          trigger_type: artifact.trigger_type,
          table: artifact.table_name,
          active: artifact.active,
          has_conditions: !!artifact.condition
        };
        
        analysis.config = {
          name: artifact.name,
          complexity: 'medium' // Would need to analyze flow definition
        };
        break;

      case 'script':
        analysis.structure = {
          api_name: artifact.api_name,
          client_callable: artifact.client_callable,
          active: artifact.active
        };
        
        if (deep && artifact.script) {
          // Simple dependency detection
          const scriptDeps = [];
          if (artifact.script.includes('GlideRecord')) scriptDeps.push('GlideRecord API');
          if (artifact.script.includes('GlideAjax')) scriptDeps.push('GlideAjax');
          if (artifact.script.includes('gs.')) scriptDeps.push('GlideSystem API');
          
          analysis.dependencies = scriptDeps;
        }
        break;
    }

    return analysis;
  }

  private async findRelationships(
    artifact: any,
    table: string,
    context: AgentContext
  ): Promise<any[]> {
    const relationships = [];
    
    // Find references in the artifact
    if (table === 'sp_widget' && artifact.server_script) {
      // Look for script includes
      const scriptMatches = artifact.server_script.match(/new\s+(\w+)\(/g);
      if (scriptMatches) {
        for (const match of scriptMatches) {
          const scriptName = match.replace(/new\s+/, '').replace(/\(/, '');
          relationships.push({
            type: 'uses_script',
            name: scriptName,
            table: 'sys_script_include'
          });
        }
      }
    }

    return relationships;
  }

  private async updateSearchContext(
    context: AgentContext,
    query: string,
    results: SearchResult[]
  ): Promise<void> {
    await this.memory.updateSharedContext({
      session_id: context.session_id,
      context_key: `search_${this.hashQuery(query)}`,
      context_value: JSON.stringify({
        query,
        results: results.map(r => ({
          sys_id: r.sys_id,
          name: r.name,
          type: r.type
        })),
        timestamp: new Date().toISOString(),
        found_count: results.length
      }),
      created_by_agent: context.agent_id
    });
  }

  private getCachedResults(query: string, type?: string): SearchResult[] | null {
    const cacheKey = `${query}_${type || 'any'}`;
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }
    
    return null;
  }

  private cacheResults(query: string, type: string | undefined, results: SearchResult[]): void {
    const cacheKey = `${query}_${type || 'any'}`;
    this.searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
  }

  private calculateRelevance(name: string, query: string): number {
    const nameLower = name.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (nameLower === queryLower) return 1.0;
    
    // Starts with query
    if (nameLower.startsWith(queryLower)) return 0.9;
    
    // Contains query
    if (nameLower.includes(queryLower)) return 0.7;
    
    // Fuzzy match (simple)
    const queryWords = queryLower.split(/\s+/);
    const matchedWords = queryWords.filter(word => nameLower.includes(word));
    return matchedWords.length / queryWords.length * 0.5;
  }

  private getArtifactType(table: string): string {
    const typeMap: Record<string, string> = {
      'sp_widget': 'widget',
      'sys_hub_flow': 'flow',
      'sys_script_include': 'script',
      'sys_app': 'application',
      'sc_cat_item': 'catalog_item',
      'sys_script': 'business_rule'
    };
    
    return typeMap[table] || 'unknown';
  }

  protected getTableForType(type: string): string {
    const tableMap: Record<string, string> = {
      'widget': 'sp_widget',
      'flow': 'sys_hub_flow',
      'script': 'sys_script_include',
      'application': 'sys_app',
      'catalog_item': 'sc_cat_item',
      'business_rule': 'sys_script'
    };
    
    return tableMap[type] || 'sys_metadata';
  }

  private getSearchConfigForType(type: string): any {
    const configs: Record<string, any> = {
      'widget': { table: 'sp_widget', type: 'widget', nameField: 'name' },
      'flow': { table: 'sys_hub_flow', type: 'flow', nameField: 'name' },
      'script': { table: 'sys_script_include', type: 'script', nameField: 'name' },
      'application': { table: 'sys_app', type: 'application', nameField: 'name' }
    };
    
    return configs[type] || configs['widget'];
  }

  private getAllSearchConfigs(): any[] {
    return [
      { table: 'sp_widget', type: 'widget', nameField: 'name' },
      { table: 'sys_hub_flow', type: 'flow', nameField: 'name' },
      { table: 'sys_script_include', type: 'script', nameField: 'name' },
      { table: 'sys_app', type: 'application', nameField: 'name' }
    ];
  }

  private hashQuery(query: string): string {
    return crypto.createHash('md5').update(query).digest('hex').substring(0, 8);
  }

  /**
   * Memory store handler
   */
  private async handleMemoryStore(args: any): Promise<MCPToolResult> {
    const { key, value, ttl, namespace = 'default' } = args;
    
    try {
      // Store in shared context
      await this.memory.updateSharedContext({
        session_id: 'global',
        context_key: `${namespace}:${key}`,
        context_value: JSON.stringify(value),
        created_by_agent: 'intelligent_mcp'
      });
      
      return this.createSuccessResponse(
        `Data stored successfully with key: ${namespace}:${key}`,
        { key: `${namespace}:${key}`, namespace }
      );
    } catch (error) {
      return this.createErrorResponse('Failed to store in memory', error);
    }
  }

  /**
   * Memory get handler
   */
  private async handleMemoryGet(args: any): Promise<MCPToolResult> {
    const { key, namespace = 'default' } = args;
    
    try {
      // Get from session context
      const sessionContext = await this.memory.getSessionContext('global');
      const fullKey = `${namespace}:${key}`;
      
      if (!sessionContext || !sessionContext[fullKey]) {
        return this.createSuccessResponse(
          `Key not found: ${namespace}:${key}`,
          { value: null, found: false }
        );
      }
      
      return this.createSuccessResponse(
        `Data retrieved successfully`,
        { 
          key: `${namespace}:${key}`,
          namespace,
          value: JSON.parse(sessionContext[fullKey]),
          found: true
        }
      );
    } catch (error) {
      return this.createErrorResponse('Failed to retrieve from memory', error);
    }
  }

  /**
   * Memory list handler
   */
  private async handleMemoryList(args: any): Promise<MCPToolResult> {
    const { namespace = 'default', pattern } = args;
    
    try {
      // Get all contexts for global session
      const sessionContext = await this.memory.getSessionContext('global');
      
      if (!sessionContext) {
        return this.createSuccessResponse(
          `No keys found in namespace ${namespace}`,
          { namespace, count: 0, keys: [] }
        );
      }
      
      // Filter by namespace
      let keys = Object.keys(sessionContext)
        .filter(k => k.startsWith(`${namespace}:`))
        .map(k => k.replace(`${namespace}:`, ''));
      
      // Apply pattern filter if provided
      if (pattern) {
        const regex = new RegExp(pattern);
        keys = keys.filter(k => regex.test(k));
      }
      
      return this.createSuccessResponse(
        `Found ${keys.length} keys in namespace ${namespace}`,
        { namespace, count: keys.length, keys }
      );
    } catch (error) {
      return this.createErrorResponse('Failed to list memory keys', error);
    }
  }

  /**
   * Todo write handler
   */
  private async handleTodoWrite(args: any): Promise<MCPToolResult> {
    const { todos } = args;
    
    try {
      // Store todos in shared context
      await this.memory.updateSharedContext({
        session_id: 'global',
        context_key: 'todos:current',
        context_value: JSON.stringify(todos),
        created_by_agent: 'intelligent_mcp'
      });
      
      // Update individual todo items for quick access
      for (const todo of todos) {
        await this.memory.updateSharedContext({
          session_id: 'global',
          context_key: `todos:item:${todo.id}`,
          context_value: JSON.stringify(todo),
          created_by_agent: 'intelligent_mcp'
        });
      }
      
      return this.createSuccessResponse(
        `Updated ${todos.length} todo items`,
        { todos, count: todos.length }
      );
    } catch (error) {
      return this.createErrorResponse('Failed to write todos', error);
    }
  }

  /**
   * Todo read handler
   */
  private async handleTodoRead(args: any): Promise<MCPToolResult> {
    const { status = 'all' } = args;
    
    try {
      // Get current todos from session context
      const sessionContext = await this.memory.getSessionContext('global');
      const todosKey = 'todos:current';
      
      if (!sessionContext || !sessionContext[todosKey]) {
        return this.createSuccessResponse(
          'No todos found',
          { todos: [], count: 0 }
        );
      }
      
      let todos = JSON.parse(sessionContext[todosKey]);
      
      // Filter by status if not 'all'
      if (status !== 'all') {
        todos = todos.filter((t: any) => t.status === status);
      }
      
      return this.createSuccessResponse(
        `Found ${todos.length} todos`,
        { todos, count: todos.length }
      );
    } catch (error) {
      return this.createErrorResponse('Failed to read todos', error);
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ServiceNowIntelligentMCP();
  server.start().catch(console.error);
}
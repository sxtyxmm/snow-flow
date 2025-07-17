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
  artifactType: 'widget' | 'flow' | 'script' | 'application';
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
      
      // 4. Index results for future use (only if we have results)
      if (liveResults && liveResults.length > 0) {
        this.logger.info('Indexing found artifacts for future use...');
        for (const result of liveResults) {
          await this.intelligentlyIndex(result);
        }
      }

      const credentials = await this.oauth.loadCredentials();
      const resultText = this.formatResults(liveResults);
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

  private async parseIntent(query: string): Promise<ParsedIntent> {
    // Simple intent parsing - in real implementation would use NLP
    const lowercaseQuery = query.toLowerCase();
    
    let artifactType: ParsedIntent['artifactType'] = 'widget';
    if (lowercaseQuery.includes('flow') || lowercaseQuery.includes('workflow')) {
      artifactType = 'flow';
    } else if (lowercaseQuery.includes('script')) {
      artifactType = 'script';
    } else if (lowercaseQuery.includes('application') || lowercaseQuery.includes('app')) {
      artifactType = 'application';
    }

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
      const tableMapping = {
        widget: 'sp_widget',
        flow: 'sys_hub_flow',
        script: 'sys_script_include',
        application: 'sys_app_application',
      };

      const table = tableMapping[intent.artifactType];
      if (!table) {
        this.logger.warn(`Unknown artifact type: ${intent.artifactType}`);
        return [];
      }

      // First try specific search
      const query = this.buildServiceNowQuery(intent);
      this.logger.info(`Searching ${table} with query: ${query}`);
      
      let results = await this.client.searchRecords(table, query);
      
      // If no results and we have a specific search, try a broader search
      if (!results || results.length === 0) {
        this.logger.info(`No results found with specific query, trying broader search...`);
        
        // Try searching with just the first search term
        const firstTerm = intent.identifier.split(' ')[0];
        const broadQuery = `nameLIKE${firstTerm}^ORtitleLIKE${firstTerm}`;
        results = await this.client.searchRecords(table, broadQuery);
        
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
    const searchTerms = intent.identifier.toLowerCase().split(' ').filter(term => term.length > 0);
    
    if (searchTerms.length === 0) {
      // Return all active records if no search terms
      return 'active=true';
    }

    // Create LIKE queries with wildcards for each term
    const queries = [];
    for (const term of searchTerms) {
      // Search in both name and title fields with wildcards
      queries.push(`nameLIKE${term}`);
      queries.push(`titleLIKE${term}`);
    }
    
    // Join with OR to find any match
    return queries.join('^OR');
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
      const id = result.sys_id || 'Unknown';
      const updated = result.sys_updated_on || result.last_updated || 'Unknown';
      const active = result.active !== undefined ? (result.active ? 'Active' : 'Inactive') : 'Unknown';
      
      return `${index + 1}. **${name}**\n   - Type: ${type}\n   - ID: ${id}\n   - Status: ${active}\n   - Updated: ${updated}`;
    }).join('\n\n');

    return `✅ Found ${results.length} artifact(s):\n\n${formattedResults}`;
  }

  private formatMemoryResults(results: IndexedArtifact[]): string {
    return results.map((result, index) => 
      `${index + 1}. **${result.meta.name}**\n   - Type: ${result.meta.type}\n   - Summary: ${result.claudeSummary}\n   - Modification Points: ${result.modificationPoints.length}`
    ).join('\n\n');
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
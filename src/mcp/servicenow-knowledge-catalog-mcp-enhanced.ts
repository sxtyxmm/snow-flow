#!/usr/bin/env node
/**
 * ServiceNow Knowledge Management & Service Catalog MCP Server - ENHANCED VERSION
 * With logging, token tracking, and progress indicators
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhancedBaseMCPServer, MCPToolResult } from './shared/enhanced-base-mcp-server.js';
import { mcpAuth } from '../utils/mcp-auth-middleware.js';
import { mcpConfig } from '../utils/mcp-config-manager.js';

class ServiceNowKnowledgeCatalogMCPEnhanced extends EnhancedBaseMCPServer {
  private config: ReturnType<typeof mcpConfig.getConfig>;

  constructor() {
    super('servicenow-knowledge-catalog-enhanced', '2.0.0');
    this.config = mcpConfig.getConfig();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Knowledge Management Tools
        {
          name: 'snow_create_knowledge_article',
          description: 'Creates a knowledge article in ServiceNow Knowledge Base using kb_knowledge table.',
          inputSchema: {
            type: 'object',
            properties: {
              short_description: { type: 'string', description: 'Article title' },
              text: { type: 'string', description: 'Article content (HTML supported)' },
              kb_knowledge_base: { type: 'string', description: 'Knowledge base sys_id or name' },
              kb_category: { type: 'string', description: 'Category sys_id or name' },
              article_type: { type: 'string', description: 'Type: text, html, wiki' },
              workflow_state: { type: 'string', description: 'State: draft, review, published, retired' },
              valid_to: { type: 'string', description: 'Expiration date (YYYY-MM-DD)' },
              meta_description: { type: 'string', description: 'SEO meta description' },
              keywords: { type: 'array', items: { type: 'string' }, description: 'Search keywords' },
              author: { type: 'string', description: 'Author user sys_id or username' }
            },
            required: ['short_description', 'text']
          }
        },
        {
          name: 'snow_search_knowledge',
          description: 'Searches knowledge articles in kb_knowledge table with full-text search.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query text' },
              kb_knowledge_base: { type: 'string', description: 'Filter by knowledge base' },
              kb_category: { type: 'string', description: 'Filter by category' },
              workflow_state: { type: 'string', description: 'Filter by state (published, draft, etc.)' },
              limit: { type: 'number', description: 'Maximum results to return', default: 10 },
              include_content: { type: 'boolean', description: 'Include full article content', default: false }
            },
            required: ['query']
          }
        },
        // ... other tools omitted for brevity
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        
        // Execute with enhanced tracking
        return await this.executeTool(name, async () => {
          switch (name) {
            case 'snow_create_knowledge_article':
              return await this.createKnowledgeArticle(args as any);
            case 'snow_search_knowledge':
              return await this.searchKnowledge(args as any);
            default:
              throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
          }
        });
      } catch (error) {
        if (error instanceof McpError) throw error;
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
      }
    });
  }

  /**
   * Create Knowledge Article with enhanced tracking
   */
  private async createKnowledgeArticle(args: any): Promise<MCPToolResult> {
    this.logger.info('Creating knowledge article...', {
      title: args.short_description,
      hasContent: !!args.text,
      contentLength: args.text?.length
    });

    // Validate connection
    const connCheck = await this.validateConnection();
    if (!connCheck.success) {
      return this.createResponse(`❌ Connection failed: ${connCheck.error}`);
    }

    // Progress indicator
    this.logger.progress('Building knowledge article data...');

    const articleData = {
      short_description: args.short_description,
      text: args.text,
      kb_knowledge_base: args.kb_knowledge_base || '',
      kb_category: args.kb_category || '',
      article_type: args.article_type || 'text',
      workflow_state: args.workflow_state || 'draft',
      valid_to: args.valid_to || '',
      meta_description: args.meta_description || '',
      keywords: args.keywords?.join(',') || '',
      author: args.author || ''
    };

    this.logger.progress('Creating article in ServiceNow...');
    
    // Create with tracking
    const response = await this.createRecord('kb_knowledge', articleData);

    if (!response.success) {
      this.logger.error('Failed to create knowledge article', response.error);
      return this.createResponse(`❌ Failed to create article: ${response.error}`);
    }

    // Success with details
    const result = response.data;
    this.logger.info('✅ Knowledge article created successfully', {
      sys_id: result.sys_id,
      number: result.number,
      title: args.short_description
    });

    return this.createResponse(
      `✅ Knowledge Article created successfully!

📚 **${args.short_description}**
🆔 sys_id: ${result.sys_id}
📋 Number: ${result.number}
📊 State: ${args.workflow_state || 'draft'}
📝 Type: ${args.article_type || 'text'}
${args.kb_knowledge_base ? `📁 Knowledge Base: ${args.kb_knowledge_base}` : ''}
${args.kb_category ? `🏷️ Category: ${args.kb_category}` : ''}
${args.valid_to ? `📅 Valid Until: ${args.valid_to}` : ''}

✨ Article created and ready for review!`
    );
  }

  /**
   * Search Knowledge with enhanced tracking
   */
  private async searchKnowledge(args: any): Promise<MCPToolResult> {
    this.logger.info('Searching knowledge articles...', {
      query: args.query,
      limit: args.limit || 10,
      includeContent: args.include_content
    });

    // Build query
    let query = `short_descriptionLIKE${args.query}^ORtextLIKE${args.query}`;
    
    if (args.kb_knowledge_base) {
      query += `^kb_knowledge_base=${args.kb_knowledge_base}`;
    }
    if (args.kb_category) {
      query += `^kb_category=${args.kb_category}`;
    }
    if (args.workflow_state) {
      query += `^workflow_state=${args.workflow_state}`;
    } else {
      query += '^workflow_state=published'; // Default to published only
    }

    this.logger.progress(`Searching kb_knowledge table for: "${args.query}"...`);

    // Search with tracking
    const limit = args.limit || 10;
    const response = await this.queryTable('kb_knowledge', query, limit);

    if (!response.success) {
      this.logger.error('Knowledge search failed', response.error);
      return this.createResponse(`❌ Search failed: ${response.error}`);
    }

    const articles = response.data.result;

    if (!articles.length) {
      this.logger.info('No articles found', { query: args.query });
      return this.createResponse(`❌ No knowledge articles found matching "${args.query}"`);
    }

    this.logger.info(`Found ${articles.length} knowledge articles`);

    // Format results
    const articleList = articles.map((article: any) => {
      const snippet = args.include_content ? 
        article.text?.substring(0, 200) + '...' : 
        article.short_description;
      
      return `📄 **${article.short_description}**
🆔 ${article.sys_id}
📊 State: ${article.workflow_state}
📅 Updated: ${article.sys_updated_on}
${args.include_content ? `📝 ${snippet}` : ''}`;
    }).join('\n\n');

    return this.createResponse(
      `🔍 Knowledge Search Results for "${args.query}":

${articleList}

✨ Found ${articles.length} article(s)`
    );
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log ready state
    this.logger.info('🚀 ServiceNow Knowledge & Catalog MCP Server (Enhanced) running');
    this.logger.info('📊 Token tracking enabled');
    this.logger.info('⏳ Progress indicators active');
  }
}

// Start the enhanced server
const server = new ServiceNowKnowledgeCatalogMCPEnhanced();
server.start().catch((error) => {
  console.error('Failed to start enhanced server:', error);
  process.exit(1);
});
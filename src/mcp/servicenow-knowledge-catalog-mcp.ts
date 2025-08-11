#!/usr/bin/env node
/**
 * ServiceNow Knowledge Management & Service Catalog MCP Server
 * Handles knowledge articles, service catalog items, and related operations
 * Uses official ServiceNow REST APIs for kb_knowledge and sc_cat_item tables
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

class ServiceNowKnowledgeCatalogMCP {
  private server: Server;
  private client: ServiceNowClient;
  private logger: MCPLogger;
  private config: ReturnType<typeof mcpConfig.getConfig>;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-knowledge-catalog',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ServiceNowClient();
    this.logger = new MCPLogger('ServiceNowKnowledgeCatalogMCP');
    this.config = mcpConfig.getConfig();

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Knowledge Management Tools
        {
          name: 'snow_create_knowledge_article',
          description: 'Creates a knowledge article in ServiceNow Knowledge Base. Articles can contain solutions, how-to guides, or reference information.',
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
          description: 'Searches knowledge articles using keywords, categories, or filters. Returns relevant articles with snippets.',
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
        {
          name: 'snow_update_knowledge_article',
          description: 'Updates an existing knowledge article. Can modify content, metadata, or workflow state.',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Article sys_id to update' },
              short_description: { type: 'string', description: 'Updated title' },
              text: { type: 'string', description: 'Updated content' },
              workflow_state: { type: 'string', description: 'New state' },
              valid_to: { type: 'string', description: 'New expiration date' },
              meta_description: { type: 'string', description: 'Updated SEO description' },
              keywords: { type: 'array', items: { type: 'string' }, description: 'Updated keywords' }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_retire_knowledge_article',
          description: 'Retires a knowledge article, making it unavailable for general use while preserving history.',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Article sys_id to retire' },
              retirement_reason: { type: 'string', description: 'Reason for retirement' },
              replacement_article: { type: 'string', description: 'Replacement article sys_id (optional)' }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_create_knowledge_base',
          description: 'Creates a new knowledge base for organizing articles by topic, department, or audience.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Knowledge base title' },
              description: { type: 'string', description: 'Knowledge base description' },
              owner: { type: 'string', description: 'Owner user or group' },
              managers: { type: 'array', items: { type: 'string' }, description: 'Manager users or groups' },
              kb_version: { type: 'string', description: 'Version number' },
              active: { type: 'boolean', description: 'Active status', default: true }
            },
            required: ['title']
          }
        },
        {
          name: 'snow_discover_knowledge_bases',
          description: 'Discovers available knowledge bases and their categories in the ServiceNow instance.',
          inputSchema: {
            type: 'object',
            properties: {
              active_only: { type: 'boolean', description: 'Show only active knowledge bases', default: true }
            }
          }
        },
        // Service Catalog Tools
        {
          name: 'snow_create_catalog_item',
          description: 'Creates a service catalog item for user self-service requests. Includes forms, workflows, and fulfillment.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Catalog item name' },
              short_description: { type: 'string', description: 'Brief description' },
              description: { type: 'string', description: 'Full description (HTML)' },
              category: { type: 'string', description: 'Category sys_id or name' },
              sc_catalogs: { type: 'string', description: 'Catalog sys_id or name' },
              price: { type: 'string', description: 'Item price' },
              recurring_price: { type: 'string', description: 'Recurring price' },
              recurring_frequency: { type: 'string', description: 'Frequency: monthly, yearly' },
              workflow: { type: 'string', description: 'Fulfillment workflow name' },
              delivery_time: { type: 'string', description: 'Expected delivery time' },
              active: { type: 'boolean', description: 'Active status', default: true },
              billable: { type: 'boolean', description: 'Is billable', default: false },
              mobile_hide_price: { type: 'boolean', description: 'Hide price on mobile', default: false }
            },
            required: ['name', 'short_description']
          }
        },
        {
          name: 'snow_create_catalog_variable',
          description: 'Adds a variable (form field) to a catalog item for collecting user input during ordering.',
          inputSchema: {
            type: 'object',
            properties: {
              cat_item: { type: 'string', description: 'Catalog item sys_id' },
              name: { type: 'string', description: 'Variable name' },
              question_text: { type: 'string', description: 'Question to display' },
              type: { type: 'string', description: 'Type: single_line_text, multi_line_text, select_box, checkbox, reference, etc.' },
              order: { type: 'number', description: 'Display order' },
              mandatory: { type: 'boolean', description: 'Is required', default: false },
              default_value: { type: 'string', description: 'Default value' },
              help_text: { type: 'string', description: 'Help text for users' },
              reference: { type: 'string', description: 'Reference table (for reference type)' },
              choice_table: { type: 'string', description: 'Choice list name (for select_box)' }
            },
            required: ['cat_item', 'name', 'question_text', 'type']
          }
        },
        {
          name: 'snow_create_catalog_ui_policy',
          description: 'Creates UI policies for catalog items to control form behavior based on user input.',
          inputSchema: {
            type: 'object',
            properties: {
              cat_item: { type: 'string', description: 'Catalog item sys_id' },
              short_description: { type: 'string', description: 'Policy name' },
              condition: { type: 'string', description: 'Condition script' },
              applies_to: { type: 'string', description: 'Applies to: item, set, or variable' },
              active: { type: 'boolean', description: 'Active status', default: true },
              on_load: { type: 'boolean', description: 'Run on form load', default: true },
              reverse_if_false: { type: 'boolean', description: 'Reverse actions if false', default: true }
            },
            required: ['cat_item', 'short_description', 'condition']
          }
        },
        {
          name: 'snow_create_catalog_client_script',
          description: 'Creates client scripts for catalog items to add custom JavaScript behavior to forms.',
          inputSchema: {
            type: 'object',
            properties: {
              cat_item: { type: 'string', description: 'Catalog item sys_id' },
              name: { type: 'string', description: 'Script name' },
              script: { type: 'string', description: 'JavaScript code' },
              type: { type: 'string', description: 'Type: onLoad, onChange, onSubmit, onCellEdit' },
              applies_to: { type: 'string', description: 'Applies to: item, set, variable' },
              variable: { type: 'string', description: 'Variable name (for onChange)' },
              active: { type: 'boolean', description: 'Active status', default: true }
            },
            required: ['cat_item', 'name', 'script', 'type']
          }
        },
        {
          name: 'snow_search_catalog',
          description: 'Searches service catalog for items, categories, or catalogs. Returns available items for ordering.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              category: { type: 'string', description: 'Filter by category' },
              catalog: { type: 'string', description: 'Filter by catalog' },
              active_only: { type: 'boolean', description: 'Show only active items', default: true },
              include_variables: { type: 'boolean', description: 'Include item variables', default: false },
              limit: { type: 'number', description: 'Maximum results', default: 20 }
            }
          }
        },
        {
          name: 'snow_order_catalog_item',
          description: 'Orders a catalog item programmatically, creating a request (RITM) with specified variable values.',
          inputSchema: {
            type: 'object',
            properties: {
              cat_item: { type: 'string', description: 'Catalog item sys_id' },
              requested_for: { type: 'string', description: 'User sys_id or username' },
              variables: { type: 'object', description: 'Variable name-value pairs' },
              quantity: { type: 'number', description: 'Quantity to order', default: 1 },
              delivery_address: { type: 'string', description: 'Delivery address' },
              special_instructions: { type: 'string', description: 'Special instructions' }
            },
            required: ['cat_item', 'requested_for']
          }
        },
        {
          name: 'snow_get_catalog_item_details',
          description: 'Gets detailed information about a catalog item including variables, pricing, and availability.',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: { type: 'string', description: 'Catalog item sys_id' },
              include_variables: { type: 'boolean', description: 'Include all variables', default: true },
              include_ui_policies: { type: 'boolean', description: 'Include UI policies', default: false },
              include_client_scripts: { type: 'boolean', description: 'Include client scripts', default: false }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_discover_catalogs',
          description: 'Discovers available service catalogs and their categories in the ServiceNow instance.',
          inputSchema: {
            type: 'object',
            properties: {
              include_categories: { type: 'boolean', description: 'Include category tree', default: true },
              active_only: { type: 'boolean', description: 'Show only active catalogs', default: true }
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
          // Knowledge Management
          case 'snow_create_knowledge_article':
            result = await this.createKnowledgeArticle(args);
            break;
          case 'snow_search_knowledge':
            result = await this.searchKnowledge(args);
            break;
          case 'snow_update_knowledge_article':
            result = await this.updateKnowledgeArticle(args);
            break;
          case 'snow_retire_knowledge_article':
            result = await this.retireKnowledgeArticle(args);
            break;
          case 'snow_create_knowledge_base':
            result = await this.createKnowledgeBase(args);
            break;
          case 'snow_discover_knowledge_bases':
            result = await this.discoverKnowledgeBases(args);
            break;
          
          // Service Catalog
          case 'snow_create_catalog_item':
            result = await this.createCatalogItem(args);
            break;
          case 'snow_create_catalog_variable':
            result = await this.createCatalogVariable(args);
            break;
          case 'snow_create_catalog_ui_policy':
            result = await this.createCatalogUIPolicy(args);
            break;
          case 'snow_create_catalog_client_script':
            result = await this.createCatalogClientScript(args);
            break;
          case 'snow_search_catalog':
            result = await this.searchCatalog(args);
            break;
          case 'snow_order_catalog_item':
            result = await this.orderCatalogItem(args);
            break;
          case 'snow_get_catalog_item_details':
            result = await this.getCatalogItemDetails(args);
            break;
          case 'snow_discover_catalogs':
            result = await this.discoverCatalogs(args);
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

  /**
   * Create Knowledge Article
   * Uses kb_knowledge table
   */
  private async createKnowledgeArticle(args: any) {
    try {
      this.logger.info('Creating knowledge article...');

      // Find knowledge base if name provided
      let kbId = args.kb_knowledge_base;
      if (kbId && !kbId.match(/^[a-f0-9]{32}$/)) {
        const kbResponse = await this.client.searchRecords('kb_knowledge_base', `title=${kbId}`, 1);
        if (kbResponse.success && kbResponse.data.result.length) {
          kbId = kbResponse.data.result[0].sys_id;
        }
      }

      // Find category if name provided
      let categoryId = args.kb_category;
      if (categoryId && !categoryId.match(/^[a-f0-9]{32}$/)) {
        const catResponse = await this.client.searchRecords('kb_category', `label=${categoryId}`, 1);
        if (catResponse.success && catResponse.data.result.length) {
          categoryId = catResponse.data.result[0].sys_id;
        }
      }

      const articleData = {
        short_description: args.short_description,
        text: args.text,
        kb_knowledge_base: kbId || '',
        kb_category: categoryId || '',
        article_type: args.article_type || 'text',
        workflow_state: args.workflow_state || 'draft',
        valid_to: args.valid_to || '',
        meta_description: args.meta_description || '',
        keywords: args.keywords ? args.keywords.join(',') : '',
        author: args.author || ''
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      this.logger.trackAPICall('CREATE', 'kb_knowledge', 1);
      const response = await this.client.createRecord('kb_knowledge', articleData);

      if (!response.success) {
        throw new Error(`Failed to create knowledge article: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Knowledge Article created successfully!

📚 **${args.short_description}**
🆔 sys_id: ${response.data.sys_id}
📂 Knowledge Base: ${args.kb_knowledge_base || 'Default'}
🏷️ Category: ${args.kb_category || 'Uncategorized'}
📝 Type: ${args.article_type || 'text'}
📊 State: ${args.workflow_state || 'draft'}
${args.keywords ? `🔍 Keywords: ${args.keywords.join(', ')}` : ''}
${args.valid_to ? `📅 Valid Until: ${args.valid_to}` : ''}

✨ Article created and ready for review!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create knowledge article:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create knowledge article: ${error}`);
    }
  }

  /**
   * Search Knowledge Articles
   * Uses kb_knowledge table with text search
   */
  private async searchKnowledge(args: any) {
    try {
      this.logger.info('Searching knowledge articles...');

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

      const limit = args.limit || 10;
      this.logger.trackAPICall('SEARCH', 'kb_knowledge', limit);
      const response = await this.client.searchRecords('kb_knowledge', query, limit);

      if (!response.success) {
        throw new Error('Failed to search knowledge articles');
      }

      const articles = response.data.result;

      if (!articles.length) {
        return {
          content: [{
            type: 'text',
            text: `❌ No knowledge articles found matching "${args.query}"`
          }]
        };
      }

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

      return {
        content: [{
          type: 'text',
          text: `🔍 Knowledge Search Results for "${args.query}":

${articleList}

✨ Found ${articles.length} article(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to search knowledge:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to search knowledge: ${error}`);
    }
  }

  /**
   * Update Knowledge Article
   */
  private async updateKnowledgeArticle(args: any) {
    try {
      this.logger.info('Updating knowledge article...');

      const updateData: any = {};
      if (args.short_description) updateData.short_description = args.short_description;
      if (args.text) updateData.text = args.text;
      if (args.workflow_state) updateData.workflow_state = args.workflow_state;
      if (args.valid_to) updateData.valid_to = args.valid_to;
      if (args.meta_description) updateData.meta_description = args.meta_description;
      if (args.keywords) updateData.keywords = args.keywords.join(',');

      this.logger.trackAPICall('UPDATE', 'kb_knowledge', 1);
      const response = await this.client.updateRecord('kb_knowledge', args.sys_id, updateData);

      if (!response.success) {
        throw new Error(`Failed to update knowledge article: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Knowledge Article updated successfully!

🆔 sys_id: ${args.sys_id}
${args.short_description ? `📚 New Title: ${args.short_description}` : ''}
${args.workflow_state ? `📊 New State: ${args.workflow_state}` : ''}
${args.valid_to ? `📅 Valid Until: ${args.valid_to}` : ''}

✨ Article updated!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to update knowledge article:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to update knowledge article: ${error}`);
    }
  }

  /**
   * Retire Knowledge Article
   */
  private async retireKnowledgeArticle(args: any) {
    try {
      this.logger.info('Retiring knowledge article...');

      const updateData = {
        workflow_state: 'retired',
        retirement_date: new Date().toISOString(),
        retirement_reason: args.retirement_reason || 'Retired via API'
      };

      if (args.replacement_article) {
        updateData['replacement_article'] = args.replacement_article;
      }

      this.logger.trackAPICall('UPDATE', 'kb_knowledge', 1);
      const response = await this.client.updateRecord('kb_knowledge', args.sys_id, updateData);

      if (!response.success) {
        throw new Error(`Failed to retire knowledge article: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Knowledge Article retired successfully!

🆔 sys_id: ${args.sys_id}
📊 State: Retired
📝 Reason: ${args.retirement_reason || 'Retired via API'}
${args.replacement_article ? `🔄 Replacement: ${args.replacement_article}` : ''}

✨ Article retired and archived!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to retire knowledge article:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to retire knowledge article: ${error}`);
    }
  }

  /**
   * Create Knowledge Base
   */
  private async createKnowledgeBase(args: any) {
    try {
      this.logger.info('Creating knowledge base...');

      const kbData = {
        title: args.title,
        description: args.description || '',
        owner: args.owner || '',
        kb_version: args.kb_version || '1.0',
        active: args.active !== false
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      const response = await this.client.createRecord('kb_knowledge_base', kbData);

      if (!response.success) {
        throw new Error(`Failed to create knowledge base: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Knowledge Base created successfully!

📚 **${args.title}**
🆔 sys_id: ${response.data.sys_id}
📝 Description: ${args.description || 'No description'}
👤 Owner: ${args.owner || 'Not specified'}
🔢 Version: ${args.kb_version || '1.0'}
🔄 Active: ${args.active !== false ? 'Yes' : 'No'}

✨ Knowledge base ready for articles!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create knowledge base:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create knowledge base: ${error}`);
    }
  }

  /**
   * Discover Knowledge Bases
   */
  private async discoverKnowledgeBases(args: any) {
    try {
      this.logger.info('Discovering knowledge bases...');

      let query = '';
      if (args.active_only) {
        query = 'active=true';
      }

      const kbResponse = await this.client.searchRecords('kb_knowledge_base', query, 50);
      if (!kbResponse.success) {
        throw new Error('Failed to discover knowledge bases');
      }

      const knowledgeBases = kbResponse.data.result;

      // Get categories for each knowledge base
      const kbWithCategories = await Promise.all(knowledgeBases.map(async (kb: any) => {
        const catResponse = await this.client.searchRecords('kb_category', `kb_knowledge_base=${kb.sys_id}`, 20);
        const categories = catResponse.success ? catResponse.data.result : [];
        return { ...kb, categories };
      }));

      const kbText = kbWithCategories.map((kb: any) => {
        const categoryList = kb.categories.map((cat: any) => `  - ${cat.label}`).join('\n');
        return `📚 **${kb.title}** ${kb.active ? '✅' : '❌'}
🆔 ${kb.sys_id}
📝 ${kb.description || 'No description'}
📂 Categories:
${categoryList || '  No categories'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Discovered Knowledge Bases:

${kbText}

✨ Found ${knowledgeBases.length} knowledge base(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover knowledge bases:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover knowledge bases: ${error}`);
    }
  }

  /**
   * Create Catalog Item
   * Uses sc_cat_item table
   */
  private async createCatalogItem(args: any) {
    try {
      this.logger.info('Creating catalog item...');

      // Find category if name provided
      let categoryId = args.category;
      if (categoryId && !categoryId.match(/^[a-f0-9]{32}$/)) {
        const catResponse = await this.client.searchRecords('sc_category', `title=${categoryId}`, 1);
        if (catResponse.success && catResponse.data.result.length) {
          categoryId = catResponse.data.result[0].sys_id;
        }
      }

      // Find catalog if name provided
      let catalogId = args.sc_catalogs;
      if (catalogId && !catalogId.match(/^[a-f0-9]{32}$/)) {
        const catalogResponse = await this.client.searchRecords('sc_catalog', `title=${catalogId}`, 1);
        if (catalogResponse.success && catalogResponse.data.result.length) {
          catalogId = catalogResponse.data.result[0].sys_id;
        }
      }

      const itemData = {
        name: args.name,
        short_description: args.short_description,
        description: args.description || '',
        category: categoryId || '',
        sc_catalogs: catalogId || '',
        price: args.price || '0',
        recurring_price: args.recurring_price || '0',
        recurring_frequency: args.recurring_frequency || '',
        workflow: args.workflow || '',
        delivery_time: args.delivery_time || '3 business days',
        active: args.active !== false,
        billable: args.billable || false,
        mobile_hide_price: args.mobile_hide_price || false
      };

      const updateSetResult = await this.client.ensureUpdateSet();
      this.logger.trackAPICall('CREATE', 'sc_cat_item', 1);
      const response = await this.client.createRecord('sc_cat_item', itemData);

      if (!response.success) {
        throw new Error(`Failed to create catalog item: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Catalog Item created successfully!

🛍️ **${args.name}**
🆔 sys_id: ${response.data.sys_id}
📝 ${args.short_description}
${args.category ? `📂 Category: ${args.category}` : ''}
${args.price && args.price !== '0' ? `💰 Price: $${args.price}` : ''}
${args.recurring_price && args.recurring_price !== '0' ? `🔄 Recurring: $${args.recurring_price} ${args.recurring_frequency || ''}` : ''}
📦 Delivery: ${args.delivery_time || '3 business days'}
🔄 Active: ${args.active !== false ? 'Yes' : 'No'}

✨ Catalog item ready for ordering!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create catalog item:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create catalog item: ${error}`);
    }
  }

  /**
   * Create Catalog Variable
   * Uses item_option_new table
   */
  private async createCatalogVariable(args: any) {
    try {
      this.logger.info('Creating catalog variable...');

      const variableData = {
        cat_item: args.cat_item,
        name: args.name,
        question_text: args.question_text,
        type: args.type,
        order: args.order || 100,
        mandatory: args.mandatory || false,
        default_value: args.default_value || '',
        help_text: args.help_text || '',
        reference: args.reference || '',
        choice_table: args.choice_table || ''
      };

      const response = await this.client.createRecord('item_option_new', variableData);

      if (!response.success) {
        throw new Error(`Failed to create catalog variable: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Catalog Variable created successfully!

📝 **${args.question_text}**
🆔 sys_id: ${response.data.sys_id}
🏷️ Name: ${args.name}
📊 Type: ${args.type}
🔢 Order: ${args.order || 100}
${args.mandatory ? '⚠️ Required: Yes' : '✅ Required: No'}
${args.default_value ? `📋 Default: ${args.default_value}` : ''}
${args.help_text ? `❓ Help: ${args.help_text}` : ''}

✨ Variable added to catalog item!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create catalog variable:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create catalog variable: ${error}`);
    }
  }

  /**
   * Create Catalog UI Policy
   * Uses catalog_ui_policy table
   */
  private async createCatalogUIPolicy(args: any) {
    try {
      this.logger.info('Creating catalog UI policy...');

      const policyData = {
        catalog_item: args.cat_item,
        short_description: args.short_description,
        catalog_conditions: args.condition,
        applies_catalog: args.applies_to || 'item',
        active: args.active !== false,
        applies_on_load: args.on_load !== false,
        reverse_if_false: args.reverse_if_false !== false
      };

      const response = await this.client.createRecord('catalog_ui_policy', policyData);

      if (!response.success) {
        throw new Error(`Failed to create catalog UI policy: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Catalog UI Policy created successfully!

📋 **${args.short_description}**
🆔 sys_id: ${response.data.sys_id}
🎯 Applies to: ${args.applies_to || 'item'}
🔄 Active: ${args.active !== false ? 'Yes' : 'No'}
⚡ On Load: ${args.on_load !== false ? 'Yes' : 'No'}
🔁 Reverse if False: ${args.reverse_if_false !== false ? 'Yes' : 'No'}

✨ UI policy configured!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create catalog UI policy:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create catalog UI policy: ${error}`);
    }
  }

  /**
   * Create Catalog Client Script
   * Uses catalog_script_client table
   */
  private async createCatalogClientScript(args: any) {
    try {
      this.logger.info('Creating catalog client script...');

      const scriptData = {
        cat_item: args.cat_item,
        name: args.name,
        script: args.script,
        type: args.type,
        applies_to: args.applies_to || 'item',
        cat_variable: args.variable || '',
        active: args.active !== false
      };

      const response = await this.client.createRecord('catalog_script_client', scriptData);

      if (!response.success) {
        throw new Error(`Failed to create catalog client script: ${response.error}`);
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Catalog Client Script created successfully!

📜 **${args.name}**
🆔 sys_id: ${response.data.sys_id}
🎯 Type: ${args.type}
📍 Applies to: ${args.applies_to || 'item'}
${args.variable ? `📝 Variable: ${args.variable}` : ''}
🔄 Active: ${args.active !== false ? 'Yes' : 'No'}

✨ Client script added to catalog item!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create catalog client script:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to create catalog client script: ${error}`);
    }
  }

  /**
   * Search Service Catalog
   */
  private async searchCatalog(args: any) {
    try {
      this.logger.info('Searching service catalog...');

      let query = args.query ? `nameLIKE${args.query}^ORshort_descriptionLIKE${args.query}` : '';
      
      if (args.category) {
        query += query ? '^' : '';
        query += `category=${args.category}`;
      }
      if (args.catalog) {
        query += query ? '^' : '';
        query += `sc_catalogs=${args.catalog}`;
      }
      if (args.active_only) {
        query += query ? '^' : '';
        query += 'active=true';
      }

      const limit = args.limit || 20;
      this.logger.trackAPICall('SEARCH', 'sc_cat_item', limit);
      const response = await this.client.searchRecords('sc_cat_item', query, limit);

      if (!response.success) {
        throw new Error('Failed to search catalog');
      }

      const items = response.data.result;

      if (!items.length) {
        return {
          content: [{
            type: 'text',
            text: `❌ No catalog items found${args.query ? ` matching "${args.query}"` : ''}`
          }]
        };
      }

      const itemList = items.map((item: any) => {
        return `🛍️ **${item.name}**
🆔 ${item.sys_id}
📝 ${item.short_description}
${item.price && item.price !== '0' ? `💰 Price: $${item.price}` : ''}
🔄 Active: ${item.active ? 'Yes' : 'No'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Catalog Search Results${args.query ? ` for "${args.query}"` : ''}:

${itemList}

✨ Found ${items.length} catalog item(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to search catalog:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to search catalog: ${error}`);
    }
  }

  /**
   * Order Catalog Item
   * Creates sc_request and sc_req_item records
   */
  private async orderCatalogItem(args: any) {
    try {
      this.logger.info('Ordering catalog item...');

      // Create service catalog request
      const requestData = {
        requested_for: args.requested_for,
        opened_by: args.requested_for,
        special_instructions: args.special_instructions || ''
      };

      const requestResponse = await this.client.createRecord('sc_request', requestData);
      if (!requestResponse.success) {
        throw new Error(`Failed to create request: ${requestResponse.error}`);
      }

      const requestId = requestResponse.data.sys_id;

      // Create requested item (RITM)
      const ritmData = {
        request: requestId,
        cat_item: args.cat_item,
        requested_for: args.requested_for,
        quantity: args.quantity || 1,
        delivery_address: args.delivery_address || ''
      };

      const ritmResponse = await this.client.createRecord('sc_req_item', ritmData);
      if (!ritmResponse.success) {
        throw new Error(`Failed to create requested item: ${ritmResponse.error}`);
      }

      const ritmId = ritmResponse.data.sys_id;
      const ritmNumber = ritmResponse.data.number;

      // Set variable values if provided
      if (args.variables) {
        for (const [varName, varValue] of Object.entries(args.variables)) {
          const varData = {
            request_item: ritmId,
            name: varName,
            value: varValue
          };
          await this.client.createRecord('sc_item_option_mtom', varData);
        }
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Catalog Item ordered successfully!

🛍️ **Order Placed**
🆔 Request: ${requestId}
📦 RITM: ${ritmNumber}
👤 Requested For: ${args.requested_for}
📊 Quantity: ${args.quantity || 1}
${args.delivery_address ? `📍 Delivery: ${args.delivery_address}` : ''}
${args.special_instructions ? `📝 Instructions: ${args.special_instructions}` : ''}

✨ Order submitted for fulfillment!`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to order catalog item:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to order catalog item: ${error}`);
    }
  }

  /**
   * Get Catalog Item Details
   */
  private async getCatalogItemDetails(args: any) {
    try {
      this.logger.info('Getting catalog item details...');

      const itemResponse = await this.client.getRecord('sc_cat_item', args.sys_id);
      if (!itemResponse.success) {
        throw new Error('Catalog item not found');
      }

      const item = itemResponse.data;
      let details = `🛍️ **${item.name}**
🆔 sys_id: ${item.sys_id}
📝 ${item.short_description}
📄 ${item.description || 'No detailed description'}
${item.price && item.price !== '0' ? `💰 Price: $${item.price}` : ''}
${item.recurring_price && item.recurring_price !== '0' ? `🔄 Recurring: $${item.recurring_price}` : ''}
📦 Delivery: ${item.delivery_time || '3 business days'}
🔄 Active: ${item.active ? 'Yes' : 'No'}`;

      // Get variables if requested
      if (args.include_variables) {
        const varResponse = await this.client.searchRecords('item_option_new', `cat_item=${args.sys_id}`, 50);
        if (varResponse.success && varResponse.data.result.length) {
          const variables = varResponse.data.result.map((v: any) => 
            `  - ${v.question_text} (${v.type})${v.mandatory ? ' *Required' : ''}`
          ).join('\n');
          details += `\n\n📋 **Variables:**\n${variables}`;
        }
      }

      return {
        content: [{
          type: 'text',
          text: details + '\n\n✨ Catalog item details retrieved!'
        }]
      };
    } catch (error) {
      this.logger.error('Failed to get catalog item details:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to get catalog item details: ${error}`);
    }
  }

  /**
   * Discover Service Catalogs
   */
  private async discoverCatalogs(args: any) {
    try {
      this.logger.info('Discovering service catalogs...');

      let query = '';
      if (args.active_only) {
        query = 'active=true';
      }

      const catalogResponse = await this.client.searchRecords('sc_catalog', query, 50);
      if (!catalogResponse.success) {
        throw new Error('Failed to discover catalogs');
      }

      const catalogs = catalogResponse.data.result;

      // Get categories if requested
      const catalogsWithDetails = await Promise.all(catalogs.map(async (catalog: any) => {
        if (args.include_categories) {
          const catResponse = await this.client.searchRecords('sc_category', `sc_catalog=${catalog.sys_id}`, 20);
          const categories = catResponse.success ? catResponse.data.result : [];
          return { ...catalog, categories };
        }
        return catalog;
      }));

      const catalogText = catalogsWithDetails.map((catalog: any) => {
        let text = `🛍️ **${catalog.title}** ${catalog.active ? '✅' : '❌'}
🆔 ${catalog.sys_id}
📝 ${catalog.description || 'No description'}`;
        
        if (catalog.categories) {
          const categoryList = catalog.categories.map((cat: any) => `  - ${cat.title}`).join('\n');
          text += `\n📂 Categories:\n${categoryList || '  No categories'}`;
        }
        
        return text;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Discovered Service Catalogs:

${catalogText}

✨ Found ${catalogs.length} catalog(s)`
        }]
      };
    } catch (error) {
      this.logger.error('Failed to discover catalogs:', error);
      throw new McpError(ErrorCode.InternalError, `Failed to discover catalogs: ${error}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Knowledge & Catalog MCP Server running on stdio');
  }
}

const server = new ServiceNowKnowledgeCatalogMCP();
server.run().catch(console.error);
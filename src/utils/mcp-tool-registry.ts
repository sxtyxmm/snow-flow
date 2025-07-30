#!/usr/bin/env node
/**
 * MCP Tool Registry Mapper
 * 
 * Solves Issue #2: Tool Registry Mapping Failures
 * Provides robust tool name resolution between different MCP providers
 */

import { Logger } from './logger.js';

export interface ToolMapping {
  canonicalName: string;
  aliases: string[];
  provider: string;
  actualTool: string;
  description?: string;
}

export class MCPToolRegistry {
  private toolMappings: Map<string, ToolMapping> = new Map();
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('MCPToolRegistry');
    this.initializeDefaultMappings();
  }

  /**
   * Initialize default tool mappings
   */
  private initializeDefaultMappings(): void {
    // ServiceNow table schema discovery - common confusion point
    this.registerTool({
      canonicalName: 'table_schema_discovery',
      aliases: [
        'mcp__servicenow-operations__snow_table_schema_discovery',
        'snow_table_schema_discovery',
        'table_schema',
        'schema_discovery'
      ],
      provider: 'servicenow-platform-development',
      actualTool: 'mcp__servicenow-platform-development__snow_table_schema_discovery',
      description: 'Comprehensive table schema discovery'
    });

    // Flow deployment tools
    this.registerTool({
      canonicalName: 'deploy_flow',
      aliases: [
        'mcp__servicenow-deployment__snow_deploy_flow',
        'snow_deploy_flow',
        'deploy_flow',
        'flow_deploy'
      ],
      provider: 'servicenow-deployment',
      actualTool: 'mcp__servicenow-deployment__snow_deploy',
      description: 'Deploy flows to ServiceNow'
    });

    // Widget deployment
    this.registerTool({
      canonicalName: 'deploy_widget',
      aliases: [
        'mcp__servicenow-deployment__snow_deploy_widget',
        'snow_deploy_widget',
        'deploy_widget',
        'widget_deploy'
      ],
      provider: 'servicenow-deployment',
      actualTool: 'mcp__servicenow-deployment__snow_deploy',
      description: 'Deploy widgets to ServiceNow'
    });

    // Flow creation
    this.registerTool({
      canonicalName: 'create_flow',
      aliases: [
        'mcp__servicenow-flow-composer__snow_create_flow',
        'snow_create_flow',
        'create_flow',
        'flow_create',
        'snow_xml_flow_from_instruction'
      ],
      provider: 'servicenow-flow-composer',
      actualTool: 'mcp__servicenow-flow-composer__snow_create_flow',
      description: 'Create flows from natural language'
    });

    // Update Set management
    this.registerTool({
      canonicalName: 'update_set_create',
      aliases: [
        'mcp__servicenow-update-set__snow_update_set_create',
        'snow_update_set_create',
        'create_update_set',
        'update_set_new'
      ],
      provider: 'servicenow-update-set',
      actualTool: 'mcp__servicenow-update-set__snow_update_set_create',
      description: 'Create Update Sets'
    });

    // Authentication diagnostics
    this.registerTool({
      canonicalName: 'auth_diagnostics',
      aliases: [
        'mcp__servicenow-deployment__snow_auth_diagnostics',
        'snow_auth_diagnostics',
        'auth_check',
        'permission_check'
      ],
      provider: 'servicenow-deployment',
      actualTool: 'mcp__servicenow-deployment__snow_auth_diagnostics',
      description: 'Authentication and permission diagnostics'
    });

    // Catalog item management
    this.registerTool({
      canonicalName: 'catalog_item_manager',
      aliases: [
        'mcp__servicenow-operations__snow_catalog_item_manager',
        'snow_catalog_item_manager',
        'catalog_manager',
        'manage_catalog'
      ],
      provider: 'servicenow-operations',
      actualTool: 'mcp__servicenow-operations__snow_catalog_item_manager',
      description: 'Manage service catalog items'
    });

    // Platform development tools
    this.registerTool({
      canonicalName: 'discover_table_fields',
      aliases: [
        'mcp__servicenow-platform-development__snow_discover_table_fields',
        'snow_discover_table_fields',
        'discover_fields',
        'table_fields'
      ],
      provider: 'servicenow-platform-development',
      actualTool: 'mcp__servicenow-platform-development__snow_discover_table_fields',
      description: 'Discover table fields'
    });

    // Add more mappings as needed...
  }

  /**
   * Register a tool mapping
   */
  registerTool(mapping: ToolMapping): void {
    // Register by canonical name
    this.toolMappings.set(mapping.canonicalName, mapping);
    
    // Register by actual tool name
    this.toolMappings.set(mapping.actualTool, mapping);
    
    // Register by all aliases
    mapping.aliases.forEach(alias => {
      this.toolMappings.set(alias.toLowerCase(), mapping);
    });
    
    this.logger.debug(`Registered tool: ${mapping.canonicalName} with ${mapping.aliases.length} aliases`);
  }

  /**
   * Resolve a tool name to its actual MCP tool
   */
  resolveTool(toolName: string): string | null {
    // Try exact match first
    let mapping = this.toolMappings.get(toolName);
    
    // Try lowercase match
    if (!mapping) {
      mapping = this.toolMappings.get(toolName.toLowerCase());
    }
    
    // Try partial matches
    if (!mapping) {
      const searchKey = toolName.toLowerCase();
      for (const [key, value] of this.toolMappings.entries()) {
        if (key.includes(searchKey) || searchKey.includes(key)) {
          mapping = value;
          break;
        }
      }
    }
    
    if (mapping) {
      this.logger.debug(`Resolved '${toolName}' to '${mapping.actualTool}'`);
      return mapping.actualTool;
    }
    
    this.logger.warn(`Could not resolve tool: ${toolName}`);
    return null;
  }

  /**
   * Get all tools for a provider
   */
  getProviderTools(provider: string): ToolMapping[] {
    const tools: ToolMapping[] = [];
    const seen = new Set<string>();
    
    for (const mapping of this.toolMappings.values()) {
      if (mapping.provider === provider && !seen.has(mapping.canonicalName)) {
        tools.push(mapping);
        seen.add(mapping.canonicalName);
      }
    }
    
    return tools;
  }

  /**
   * Search tools by keyword
   */
  searchTools(keyword: string): ToolMapping[] {
    const results: ToolMapping[] = [];
    const seen = new Set<string>();
    const searchKey = keyword.toLowerCase();
    
    for (const mapping of this.toolMappings.values()) {
      if (seen.has(mapping.canonicalName)) continue;
      
      if (
        mapping.canonicalName.includes(searchKey) ||
        mapping.description?.toLowerCase().includes(searchKey) ||
        mapping.aliases.some(alias => alias.toLowerCase().includes(searchKey))
      ) {
        results.push(mapping);
        seen.add(mapping.canonicalName);
      }
    }
    
    return results;
  }

  /**
   * Check if a tool exists
   */
  toolExists(toolName: string): boolean {
    return this.resolveTool(toolName) !== null;
  }

  /**
   * Get tool info
   */
  getToolInfo(toolName: string): ToolMapping | null {
    const resolved = this.resolveTool(toolName);
    if (!resolved) return null;
    
    return this.toolMappings.get(resolved) || null;
  }

  /**
   * Export all mappings for documentation
   */
  exportMappings(): Record<string, ToolMapping> {
    const exports: Record<string, ToolMapping> = {};
    const seen = new Set<string>();
    
    for (const mapping of this.toolMappings.values()) {
      if (!seen.has(mapping.canonicalName)) {
        exports[mapping.canonicalName] = mapping;
        seen.add(mapping.canonicalName);
      }
    }
    
    return exports;
  }
}

// Singleton instance
let registryInstance: MCPToolRegistry | null = null;

/**
 * Get or create registry instance
 */
export function getToolRegistry(): MCPToolRegistry {
  if (!registryInstance) {
    registryInstance = new MCPToolRegistry();
  }
  return registryInstance;
}

/**
 * Helper function to resolve tool names
 */
export function resolveToolName(toolName: string): string {
  const registry = getToolRegistry();
  return registry.resolveTool(toolName) || toolName;
}

/**
 * Helper to check if tool exists
 */
export function isValidTool(toolName: string): boolean {
  const registry = getToolRegistry();
  return registry.toolExists(toolName);
}

/**
 * Helper to get tool suggestions
 */
export function suggestTools(partial: string): ToolMapping[] {
  const registry = getToolRegistry();
  return registry.searchTools(partial);
}

// Export types and default instance
export default MCPToolRegistry;
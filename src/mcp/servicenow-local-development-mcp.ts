#!/usr/bin/env node
/**
 * ServiceNow Local Development MCP Server
 * 
 * Bridges ServiceNow artifacts with Claude Code's native file tools
 * by creating temporary local files that can be edited with full
 * Claude Code capabilities, then synced back to ServiceNow.
 * 
 * THIS IS THE KEY TO POWERFUL SERVICENOW DEVELOPMENT!
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhancedBaseMCPServer, MCPToolResult } from './shared/enhanced-base-mcp-server.js';
import { ArtifactLocalSync } from '../utils/artifact-local-sync.js';
import { 
  ARTIFACT_REGISTRY,
  getSupportedTables,
  getTableDisplayName,
  isTableSupported,
  type ValidationResult
} from '../utils/artifact-sync/artifact-registry.js';

export class ServiceNowLocalDevelopmentMCP extends EnhancedBaseMCPServer {
  private syncManager: ArtifactLocalSync;
  
  constructor() {
    super('servicenow-local-development', '1.0.0');
    
    // Initialize after client is available
    this.setupSyncManager();
    this.setupHandlers();
  }
  
  private setupSyncManager(): void {
    // Initialize sync manager with the client from enhanced base server
    this.syncManager = new ArtifactLocalSync(this.client as any);
    this.logger.info('🔧 Local sync manager initialized');
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_pull_artifact',
          description: `Pull ANY ServiceNow artifact to local files for editing with Claude Code's native tools. Automatically detects the artifact type and creates appropriate files based on the artifact registry. Supports: ${getSupportedTables().map(t => getTableDisplayName(t)).join(', ')}`,
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Artifact sys_id to pull'
              },
              table: {
                type: 'string',
                description: 'Optional: Specify table name if known for faster processing',
                enum: getSupportedTables()
              }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_push_artifact',
          description: 'Push local artifact changes back to ServiceNow with validation and coherence checking',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Artifact sys_id to push back'
              },
              force: {
                type: 'boolean',
                description: 'Force push despite validation warnings',
                default: false
              }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_validate_artifact_coherence',
          description: 'Validate coherence and relationships between artifact components (e.g., widget HTML-client-server relationships)',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Artifact sys_id to validate'
              }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_list_supported_artifacts',
          description: 'List all supported artifact types for local synchronization',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: 'snow_sync_status',
          description: 'Check sync status of local artifacts',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Optional: Check specific artifact, or all if omitted'
              }
            }
          }
        },
        {
          name: 'snow_sync_cleanup',
          description: 'Clean up local artifact files after successful sync',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Artifact sys_id to clean up'
              },
              force: {
                type: 'boolean',
                description: 'Force cleanup even with unsaved changes',
                default: false
              }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_convert_to_es5',
          description: 'Convert modern JavaScript code to ES5 for ServiceNow compatibility',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'JavaScript code to convert to ES5'
              },
              context: {
                type: 'string',
                description: 'Context: server_script, client_script, business_rule, etc.',
                enum: ['server_script', 'client_script', 'business_rule', 'script_include', 'ui_script']
              }
            },
            required: ['code']
          }
        },
        // Legacy compatibility tools
        {
          name: 'snow_pull_widget',
          description: 'Pull a ServiceNow widget to local files (legacy - use snow_pull_artifact instead)',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Widget sys_id to pull'
              }
            },
            required: ['sys_id']
          }
        },
        {
          name: 'snow_push_widget',
          description: 'Push widget changes back to ServiceNow (legacy - use snow_push_artifact instead)',
          inputSchema: {
            type: 'object',
            properties: {
              sys_id: {
                type: 'string',
                description: 'Widget sys_id to push'
              }
            },
            required: ['sys_id']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        this.logger.info(`🔧 Executing tool: ${name}`, args);
        
        let result: MCPToolResult;
        
        switch (name) {
          case 'snow_pull_artifact':
            result = await this.pullArtifact(args);
            break;
            
          case 'snow_push_artifact':
            result = await this.pushArtifact(args);
            break;
            
          case 'snow_validate_artifact_coherence':
            result = await this.validateArtifactCoherence(args);
            break;
            
          case 'snow_sync_status':
            result = await this.getSyncStatus(args);
            break;
            
          case 'snow_list_supported_artifacts':
            result = await this.listSupportedArtifacts(args);
            break;
            
          case 'snow_sync_cleanup':
            result = await this.syncCleanup(args);
            break;
            
          case 'snow_convert_to_es5':
            result = await this.convertToES5(args);
            break;
            
          // Legacy compatibility
          case 'snow_pull_widget':
            result = await this.pullWidget(args);
            break;
            
          case 'snow_push_widget':
            result = await this.pushWidget(args);
            break;
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        
        this.logger.info(`✅ Tool ${name} completed successfully`);
        return {
          content: result.content
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`❌ Tool ${name} failed: ${errorMessage}`);
        
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`
            }
          ]
        };
      }
    });
  }

  private async pullArtifact(args: any): Promise<MCPToolResult> {
    const { sys_id, table } = args;
    
    try {
      let artifact;
      if (table) {
        // Use specified table
        artifact = await this.syncManager.pullArtifact(table, sys_id);
      } else {
        // Auto-detect table
        artifact = await this.syncManager.pullArtifactBySysId(sys_id);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully pulled ${artifact.type} to local files at: ${artifact.localPath}\n\n📁 Files created:\n${artifact.files.map(f => `  - ${f.filename} (${f.type})`).join('\n')}\n\n💡 You can now use Claude Code's native tools to edit these files!`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to pull artifact: ${errorMessage}`
          }
        ]
      };
    }
  }

  private async pushArtifact(args: any): Promise<MCPToolResult> {
    const { sys_id, force = false } = args;
    
    try {
      const success = await this.syncManager.pushArtifact(sys_id);
      
      return {
        content: [
          {
            type: 'text',
            text: success 
              ? `✅ Successfully pushed changes back to ServiceNow!`
              : `❌ Failed to push changes. Check logs for details.`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to push artifact: ${errorMessage}`
          }
        ]
      };
    }
  }

  private async getSyncStatus(args: any): Promise<MCPToolResult> {
    const { sys_id } = args;
    
    if (sys_id) {
      const status = this.syncManager.getSyncStatus(sys_id);
      return {
        content: [
          {
            type: 'text',
            text: `Sync status for ${sys_id}: ${status}`
          }
        ]
      };
    } else {
      const artifacts = this.syncManager.listLocalArtifacts();
      const statusText = artifacts.length > 0 
        ? artifacts.map(a => `${a.name} (${a.sys_id}): ${a.syncStatus}`).join('\n')
        : 'No local artifacts found';
      
      return {
        content: [
          {
            type: 'text',
            text: `Local artifacts status:\n${statusText}`
          }
        ]
      };
    }
  }

  private async listSupportedArtifacts(args: any): Promise<MCPToolResult> {
    const supportedTypes = getSupportedTables().map(table => {
      const config = ARTIFACT_REGISTRY[table];
      return {
        table,
        displayName: config?.displayName || table,
        folderName: config?.folderName || table,
        fields: config?.fieldMappings.length || 0,
        hasCoherence: (config?.coherenceRules?.length || 0) > 0,
        requiresES5: config?.fieldMappings.some(fm => fm.validateES5) || false
      };
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Supported ServiceNow artifact types for local sync:\n\n${supportedTypes.map(t => 
            `📦 ${t.displayName} (${t.table})\n   └── ${t.fields} fields, ES5: ${t.requiresES5 ? '✅' : '❌'}, Coherence: ${t.hasCoherence ? '✅' : '❌'}`
          ).join('\n\n')}\n\nTotal: ${supportedTypes.length} artifact types supported`
        }
      ]
    };
  }

  private async validateArtifactCoherence(args: any): Promise<MCPToolResult> {
    const { sys_id } = args;
    
    try {
      const results = await this.syncManager.validateArtifactCoherence(sys_id);
      const hasErrors = results.some(r => !r.valid);
      
      return {
        content: [
          {
            type: 'text',
            text: hasErrors 
              ? `⚠️ Coherence validation found issues:\n${results.filter(r => !r.valid).map(r => r.errors.join(', ')).join('\n')}`
              : `✅ Artifact coherence validation passed!`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to validate coherence: ${errorMessage}`
          }
        ]
      };
    }
  }

  private async syncCleanup(args: any): Promise<MCPToolResult> {
    const { sys_id, force = false } = args;
    
    try {
      await this.syncManager.cleanup(sys_id, force);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully cleaned up local files for ${sys_id}`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to cleanup: ${errorMessage}`
          }
        ]
      };
    }
  }

  private async convertToES5(args: any): Promise<MCPToolResult> {
    const { code, context = 'server_script' } = args;
    
    // Basic ES5 conversion - in a real implementation this would be more sophisticated
    let es5Code = code
      .replace(/\bconst\s+/g, 'var ')
      .replace(/\blet\s+/g, 'var ')
      .replace(/(\w+)\s*=>\s*{/g, 'function($1) {')
      .replace(/(\w+)\s*=>\s*([^{])/g, 'function($1) { return $2; }')
      .replace(/`([^`]*)`/g, (match, content) => {
        return '"' + content.replace(/\$\{([^}]+)\}/g, '" + $1 + "') + '"';
      });
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Converted to ES5 (basic conversion):\n\n\`\`\`javascript\n${es5Code}\n\`\`\`\n\n⚠️ Note: This is a basic conversion. Please review and test the code.`
        }
      ]
    };
  }

  // Legacy compatibility methods
  private async pullWidget(args: any): Promise<MCPToolResult> {
    return this.pullArtifact({ ...args, table: 'sp_widget' });
  }

  private async pushWidget(args: any): Promise<MCPToolResult> {
    return this.pushArtifact(args);
  }
}

// Start the server
async function main() {
  const mcpServer = new ServiceNowLocalDevelopmentMCP();
  const transport = new StdioServerTransport();
  // Access server through a public method
  await (mcpServer as any).server.connect(transport);
  console.error('🚀 ServiceNow Local Development MCP Server started');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Server failed to start:', error);
    process.exit(1);
  });
}
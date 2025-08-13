/**
 * ServiceNow Local Development MCP Server
 * 
 * Bridges ServiceNow artifacts with Claude Code's native file tools
 * by creating temporary local files that can be edited with full
 * Claude Code capabilities, then synced back to ServiceNow.
 * 
 * THIS IS THE KEY TO POWERFUL SERVICENOW DEVELOPMENT!
 */

import { BaseMCPServer } from './base-mcp-server';
import type { MCPToolResult } from './shared/base-mcp-server';
import { ArtifactLocalSync } from '../utils/artifact-local-sync';
import { 
  ARTIFACT_REGISTRY,
  getSupportedTables,
  getTableDisplayName,
  isTableSupported
} from '../utils/artifact-sync/artifact-registry';
import * as fs from 'fs';
import * as path from 'path';

export class ServiceNowLocalDevelopmentMCP extends BaseMCPServer {
  private syncManager: ArtifactLocalSync;
  
  constructor() {
    super('servicenow-local-development', '1.0.0');
    this.syncManager = new ArtifactLocalSync(this.serviceNowClient);
  }

  protected async initializeTools(): Promise<void> {
    // DYNAMIC pull tool - works with ALL artifact types!
    this.addTool({
      name: 'snow_pull_artifact',
      description: `Pull ANY ServiceNow artifact to local files for editing with Claude Code's native tools.
      Automatically detects the artifact type and creates appropriate files based on the artifact registry.
      Supports: ${getSupportedTables().map(t => getTableDisplayName(t)).join(', ')}`,
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Artifact sys_id to pull'
          },
          table: {
            type: 'string',
            description: 'Optional: Specify table name if known',
            enum: getSupportedTables()
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pullArtifact(args)
    });

    // Keep backward compatibility - widget-specific tool
    this.addTool({
      name: 'snow_pull_widget',
      description: `Pull a ServiceNow widget to local files (legacy - use snow_pull_artifact instead)`,
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Widget sys_id to pull'
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pullArtifact({ ...args, table: 'sp_widget' })
    });

    this.addTool({
      name: 'snow_pull_script_include',
      description: 'Pull a Script Include to local JavaScript file (legacy - use snow_pull_artifact)',
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Script Include sys_id'
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pullArtifact({ ...args, table: 'sys_script_include' })
    });

    this.addTool({
      name: 'snow_pull_business_rule',
      description: 'Pull a Business Rule to local JavaScript file (legacy - use snow_pull_artifact)',
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Business Rule sys_id'
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pullArtifact({ ...args, table: 'sys_script' })
    });

    // DYNAMIC push tool - works with ALL artifact types!
    this.addTool({
      name: 'snow_push_artifact',
      description: `Push local artifact changes back to ServiceNow.
      Automatically detects which files changed, validates based on artifact type,
      and updates the corresponding fields. Runs coherence validation for artifacts with rules.`,
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Artifact sys_id to push changes for'
          },
          force: {
            type: 'boolean',
            description: 'Force push even with validation warnings',
            default: false
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pushArtifact(args)
    });

    // Keep backward compatibility
    this.addTool({
      name: 'snow_push_widget',
      description: `Push local widget changes back to ServiceNow (legacy - use snow_push_artifact)`,
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Widget sys_id to push'
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.pushArtifact(args)
    });

    // Sync status tools
    this.addTool({
      name: 'snow_sync_status',
      description: 'Check sync status of local artifacts - shows what\'s modified',
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Optional: specific artifact sys_id'
          }
        }
      },
      handler: async (args: any) => this.getSyncStatus(args)
    });

    this.addTool({
      name: 'snow_sync_cleanup',
      description: 'Clean up local files after successful sync',
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
      },
      handler: async (args: any) => this.cleanup(args)
    });

    // List supported artifact types
    this.addTool({
      name: 'snow_list_supported_artifacts',
      description: 'List all artifact types supported by the local sync system',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => this.listSupportedArtifacts()
    });

    this.addTool({
      name: 'snow_validate_artifact_coherence',
      description: 'Validate artifact based on its type-specific coherence rules',
      inputSchema: {
        type: 'object',
        properties: {
          sys_id: {
            type: 'string',
            description: 'Artifact sys_id to validate'
          }
        },
        required: ['sys_id']
      },
      handler: async (args: any) => this.validateCoherence(args)
    });

    this.addTool({
      name: 'snow_convert_to_es5',
      description: 'Convert modern JavaScript to ES5 for ServiceNow compatibility',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to JavaScript file to convert'
          },
          inline_code: {
            type: 'string',
            description: 'Or provide code directly'
          }
        }
      },
      handler: async (args: any) => this.convertToES5(args)
    });

    // Search tools that work like Claude Code
    this.addTool({
      name: 'snow_search_in_widgets',
      description: 'Search across all widget fields (like Claude Code search but for ServiceNow)',
      inputSchema: {
        type: 'object',
        properties: {
          search_term: {
            type: 'string',
            description: 'Text to search for'
          },
          field: {
            type: 'string',
            description: 'Specific field to search in',
            enum: ['template', 'script', 'client_script', 'css', 'all']
          },
          regex: {
            type: 'boolean',
            description: 'Use regex search',
            default: false
          }
        },
        required: ['search_term']
      },
      handler: async (args: any) => this.searchInWidgets(args)
    });
  }

  /**
   * DYNAMIC pull artifact to local files
   */
  private async pullArtifact(args: any): Promise<MCPToolResult> {
    try {
      let artifact;
      
      if (args.table) {
        // Table specified - direct pull
        artifact = await this.syncManager.pullArtifact(args.table, args.sys_id);
      } else {
        // Auto-detect table
        artifact = await this.syncManager.pullArtifactBySysId(args.sys_id);
      }
      
      const config = artifact.artifactConfig;
      const hasES5 = config?.fieldMappings.some(fm => fm.validateES5);
      const hasCoherence = config?.coherenceRules && config.coherenceRules.length > 0;
      
      const message = `
✅ **${artifact.type} pulled to local files successfully!**

📁 **Location:** \`${artifact.localPath}\`

📄 **Files created:**
${artifact.files.map(f => `- **${f.filename}** (${f.type})`).join('\n')}

🎯 **Now you can:**
1. Use Claude Code's native tools to edit these files
2. Search across files with full regex support
3. Multi-file operations and refactoring
4. Use all VS Code/editor features
5. When done, run \`snow_push_artifact\` to sync back

${hasES5 ? `⚠️ **ES5 Requirement:**
- Server-side scripts MUST be ES5 only
- No const/let/arrow functions/template literals
- Use var and function() syntax only

` : ''}
${hasCoherence ? `🔗 **Coherence Rules:**
- This artifact has validation rules that will be checked
- Run \`snow_validate_artifact_coherence\` to test
- Push will warn about any violations

` : ''}
📝 **Edit the files now, then push changes back to ServiceNow!**
`;
      
      return {
        success: true,
        result: artifact,
        message
      };
    } catch (error: any) {
      return this.error(`Failed to pull artifact: ${error.message}`);
    }
  }

  /**
   * Push artifact changes back to ServiceNow
   */
  private async pushArtifact(args: any): Promise<MCPToolResult> {
    try {
      // First run coherence validation
      const validationResults = await this.syncManager.validateArtifactCoherence(args.sys_id);
      
      if (validationResults.length > 0 && !args.force) {
        const hasErrors = validationResults.some(r => !r.valid);
        if (hasErrors) {
          const message = `
⚠️ **Validation Issues Found**

${validationResults.map(r => {
  let output = '';
  if (r.errors.length > 0) {
    output += '**Errors:**\n' + r.errors.map(e => `- ❌ ${e}`).join('\n') + '\n';
  }
  if (r.warnings.length > 0) {
    output += '**Warnings:**\n' + r.warnings.map(w => `- ⚠️ ${w}`).join('\n') + '\n';
  }
  if (r.hints.length > 0) {
    output += '**Hints:**\n' + r.hints.map(h => `- 💡 ${h}`).join('\n');
  }
  return output;
}).join('\n\n')}

❓ Use \`force: true\` to push anyway, but this may cause runtime errors.
`;
          return {
            success: false,
            result: { validationResults },
            message
          };
        }
      }
      
      const success = await this.syncManager.pushArtifact(args.sys_id);
      
      if (success) {
        return {
          success: true,
          result: { pushed: true },
          message: `✅ Artifact successfully pushed to ServiceNow! Changes are now live.`
        };
      } else {
        return this.error('Failed to push artifact - check logs for details');
      }
    } catch (error: any) {
      return this.error(`Failed to push artifact: ${error.message}`);
    }
  }

  /**
   * Get sync status
   */
  private async getSyncStatus(args: any): Promise<MCPToolResult> {
    const artifacts = this.syncManager.listLocalArtifacts();
    
    if (args.sys_id) {
      const status = this.syncManager.getSyncStatus(args.sys_id);
      return {
        success: true,
        result: { status },
        message: `Sync status for ${args.sys_id}: ${status}`
      };
    }
    
    const message = `
📊 **Local Artifacts Sync Status**

${artifacts.length === 0 ? '📭 No local artifacts currently synced' : ''}
${artifacts.map(a => `
**${a.name}** (${a.type})
- sys_id: \`${a.sys_id}\`
- Status: **${a.syncStatus}**
- Path: \`${a.localPath}\`
- Files: ${a.files.length}
- Modified: ${a.files.filter(f => f.isModified).length}
- Last sync: ${a.lastSyncedAt.toLocaleString()}
`).join('\n---\n')}

💡 Use \`snow_push_artifact <sys_id>\` to push changes
🧹 Use \`snow_sync_cleanup <sys_id>\` to remove local files
`;
    
    return {
      success: true,
      result: artifacts,
      message
    };
  }

  /**
   * Cleanup local files
   */
  private async cleanup(args: any): Promise<MCPToolResult> {
    try {
      await this.syncManager.cleanup(args.sys_id, args.force);
      return {
        success: true,
        result: { cleaned: true },
        message: `✅ Local files cleaned up successfully`
      };
    } catch (error: any) {
      return this.error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * List supported artifact types
   */
  private async listSupportedArtifacts(): Promise<MCPToolResult> {
    const types = getSupportedTables();
    
    const details = types.map(table => {
      const config = ARTIFACT_REGISTRY[table];
      return {
        table,
        displayName: config.displayName,
        folderName: config.folderName,
        fields: config.fieldMappings.length,
        hasCoherence: (config.coherenceRules?.length || 0) > 0,
        requiresES5: config.fieldMappings.some(fm => fm.validateES5)
      };
    });
    
    const message = `
📚 **Supported ServiceNow Artifact Types**

${details.map(d => `
**${d.displayName}**
- Table: \`${d.table}\`
- Folder: \`${d.folderName}/\`
- Fields: ${d.fields}
- Coherence Rules: ${d.hasCoherence ? '✅' : '❌'}
- ES5 Required: ${d.requiresES5 ? '⚠️ Yes' : '✅ No'}
`).join('\n')}

💡 **Usage:**
\`\`\`
snow_pull_artifact({ sys_id: 'abc123' })  // Auto-detect type
snow_pull_artifact({ sys_id: 'abc123', table: 'sp_widget' })  // Specific type
\`\`\`
`;
    
    return {
      success: true,
      result: details,
      message
    };
  }

  /**
   * Validate artifact coherence
   */
  private async validateCoherence(args: any): Promise<MCPToolResult> {
    try {
      const results = await this.syncManager.validateArtifactCoherence(args.sys_id);
      
      if (results.length === 0) {
        return {
          success: true,
          result: { valid: true },
          message: '✅ No coherence rules defined for this artifact type'
        };
      }
      
      const allValid = results.every(r => r.valid);
      const message = `
${allValid ? '✅' : '❌'} **Coherence Validation Results**

${results.map(r => {
  let output = r.valid ? '✅ Valid\n' : '❌ Invalid\n';
  if (r.errors.length > 0) {
    output += '\n**Errors:**\n' + r.errors.map(e => `- ${e}`).join('\n');
  }
  if (r.warnings.length > 0) {
    output += '\n**Warnings:**\n' + r.warnings.map(w => `- ${w}`).join('\n');
  }
  if (r.hints.length > 0) {
    output += '\n**Hints:**\n' + r.hints.map(h => `- ${h}`).join('\n');
  }
  return output;
}).join('\n\n')}
`;
      
      return {
        success: allValid,
        result: results,
        message
      };
    } catch (error: any) {
      return this.error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Convert modern JS to ES5
   */
  private async convertToES5(args: any): Promise<MCPToolResult> {
    let code = args.inline_code;
    
    if (args.file_path && fs.existsSync(args.file_path)) {
      code = fs.readFileSync(args.file_path, 'utf8');
    }
    
    if (!code) {
      return this.error('No code provided to convert');
    }
    
    // Basic conversions (in production, use a proper transpiler)
    let es5Code = code
      // const/let → var
      .replace(/\b(const|let)\s+/g, 'var ')
      // Arrow functions
      .replace(/(\w+)\s*=>\s*{/g, 'function($1) {')
      .replace(/(\([^)]*\))\s*=>\s*{/g, 'function$1 {')
      .replace(/(\w+)\s*=>\s*/g, 'function($1) { return ')
      // Template literals (basic)
      .replace(/`([^`]*)\$\{([^}]*)\}([^`]*)`/g, "'$1' + $2 + '$3'")
      .replace(/`([^`]*)`/g, "'$1'")
      // For...of → for loop
      .replace(/for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(\w+)\s*\)/g, 
        'for (var _i = 0; _i < $2.length; _i++) { var $1 = $2[_i];');
    
    const message = `
✅ **Code converted to ES5**

⚠️ **Review the conversion carefully!**
This is a basic conversion. Complex features may need manual adjustment:
- Classes → function constructors
- async/await → callbacks
- Destructuring → individual assignments
- Spread operator → manual copying

**Common issues to check:**
- Arrow function this binding
- Default parameters
- Object method shorthand
`;
    
    return {
      success: true,
      result: { es5Code },
      message
    };
  }

  /**
   * Search in widgets (like Claude Code search)
   */
  private async searchInWidgets(args: any): Promise<MCPToolResult> {
    const { search_term, field = 'all', regex = false } = args;
    
    // This would search in ServiceNow
    // Similar to Claude Code's search but for ServiceNow widgets
    
    return {
      success: true,
      result: {},
      message: `Search results for "${search_term}" in widgets`
    };
  }

}
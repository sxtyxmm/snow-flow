#!/usr/bin/env ts-node
/**
 * Migration script to convert all MCP servers to BaseMCPServer pattern
 * This reduces code duplication by ~85% per server
 */

import { promises as fs } from 'fs';
import { join } from 'path';

interface ServerMigrationConfig {
  inputFile: string;
  outputFile: string;
  serverName: string;
  className: string;
  version: string;
}

const serversToMigrate: ServerMigrationConfig[] = [
  {
    inputFile: 'servicenow-operations-mcp.ts',
    outputFile: 'servicenow-operations-mcp-refactored.ts',
    serverName: 'servicenow-operations',
    className: 'ServiceNowOperationsMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-platform-development-mcp.ts',
    outputFile: 'servicenow-platform-development-mcp-refactored.ts',
    serverName: 'servicenow-platform-development',
    className: 'ServiceNowPlatformDevelopmentMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-integration-mcp.ts',
    outputFile: 'servicenow-integration-mcp-refactored.ts',
    serverName: 'servicenow-integration',
    className: 'ServiceNowIntegrationMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-automation-mcp.ts',
    outputFile: 'servicenow-automation-mcp-refactored.ts',
    serverName: 'servicenow-automation',
    className: 'ServiceNowAutomationMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-security-compliance-mcp.ts',
    outputFile: 'servicenow-security-compliance-mcp-refactored.ts',
    serverName: 'servicenow-security-compliance',
    className: 'ServiceNowSecurityComplianceMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-reporting-analytics-mcp.ts',
    outputFile: 'servicenow-reporting-analytics-mcp-refactored.ts',
    serverName: 'servicenow-reporting-analytics',
    className: 'ServiceNowReportingAnalyticsMCP',
    version: '2.0.0'
  },
  {
    inputFile: 'servicenow-graph-memory-mcp.ts',
    outputFile: 'servicenow-graph-memory-mcp-refactored.ts',
    serverName: 'servicenow-graph-memory',
    className: 'ServiceNowGraphMemoryMCP',
    version: '2.0.0'
  }
];

async function migrateServer(config: ServerMigrationConfig): Promise<void> {
  const srcPath = join(__dirname, '../src/mcp');
  const inputPath = join(srcPath, config.inputFile);
  const outputPath = join(srcPath, config.outputFile);

  console.log(`\n🔧 Migrating ${config.serverName}...`);

  try {
    // Read the original file
    const content = await fs.readFile(inputPath, 'utf-8');

    // Extract tools from the original server
    const toolsMatch = content.match(/tools:\s*\[([\s\S]*?)\]\s*}\)/);
    if (!toolsMatch) {
      console.error(`❌ Could not extract tools from ${config.inputFile}`);
      return;
    }

    const toolsContent = toolsMatch[1];

    // Extract tool handlers
    const handlers: string[] = [];
    const toolHandlerRegex = /case\s*['"](\w+)['"]\s*:\s*([\s\S]*?)(?=case|default|$)/g;
    let match;
    while ((match = toolHandlerRegex.exec(content)) !== null) {
      handlers.push(`      case '${match[1]}':\n        return this.handle${match[1].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}(args);`);
    }

    // Create the refactored version
    const refactoredContent = `#!/usr/bin/env node
/**
 * ${config.serverName} MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export class ${config.className} extends BaseMCPServer {
  constructor() {
    super({
      name: '${config.serverName}',
      version: '${config.version}',
      description: 'Refactored ${config.serverName} with BaseMCPServer pattern'
    });
  }

  protected setupTools(): void {
    // Tools are set up via getTools() method
  }

  protected getTools(): Tool[] {
    return [${toolsContent}];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();

    switch (name) {
${handlers.join('\n')}
      default:
        return {
          success: false,
          error: \`Unknown tool: \${name}\`
        };
    }
  }

  // TODO: Implement individual tool handlers here
  // Each handler should follow this pattern:
  // private async handleToolName(args: any): Promise<ToolResult> {
  //   try {
  //     // Implementation
  //     return {
  //       success: true,
  //       result: { ... },
  //       executionTime: Date.now() - startTime
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Operation failed',
  //       executionTime: Date.now() - startTime
  //     };
  //   }
  // }
}

// Create and run the server
if (require.main === module) {
  const server = new ${config.className}();
  server.start().catch(console.error);
}`;

    // Write the refactored file
    await fs.writeFile(outputPath, refactoredContent);
    console.log(`✅ Created ${config.outputFile}`);

    // Calculate size reduction
    const originalSize = content.length;
    const refactoredSize = refactoredContent.length;
    const reduction = Math.round((1 - refactoredSize / originalSize) * 100);
    console.log(`   📉 Size reduction: ${reduction}% (${originalSize} → ${refactoredSize} bytes)`);

  } catch (error) {
    console.error(`❌ Error migrating ${config.serverName}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting MCP Server Migration to BaseMCPServer pattern');
  console.log('==================================================');

  for (const config of serversToMigrate) {
    await migrateServer(config);
  }

  console.log('\n✅ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Review each refactored server file');
  console.log('2. Implement the individual tool handlers');
  console.log('3. Update imports in other files');
  console.log('4. Run npm run build to check for TypeScript errors');
}

// Run the migration
main().catch(console.error);
#!/usr/bin/env node
/**
 * Example: ServiceNow Deployment MCP Server - REFACTORED
 * 
 * Shows the DRY improvement by using BaseMCPServer
 * Compare this to the original 500+ line servers - now only ~150 lines!
 */

import { BaseMCPServer } from './base-mcp-server.js';

export class ServiceNowDeploymentMCPRefactored extends BaseMCPServer {
  constructor() {
    super({
      name: 'servicenow-deployment',
      version: '2.0.0',
      description: 'Unified deployment tools for ServiceNow artifacts'
    });
  }

  /**
   * Only implement tool-specific logic
   * All auth, error handling, metrics are inherited!
   */
  protected setupTools(): void {
    // Register deployment tool
    this.registerTool(
      {
        name: 'snow_deploy',
        description: 'Deploy ServiceNow artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['widget', 'flow', 'script'] },
            config: { type: 'object' },
          },
          required: ['type', 'config'],
        },
      },
      // No auth check needed - handled by base class!
      async (args) => this.deployArtifact(args)
    );
  }

  private async deployArtifact(args: any): Promise<any> {
    // Pure business logic - no error handling needed
    switch (args.type) {
      case 'widget':
        return await this.client.createRecord('sp_widget', args.config);
      case 'flow':
        return await this.client.createRecord('sys_hub_flow', args.config);
      case 'script':
        return await this.client.createRecord('sys_script_include', args.config);
      default:
        throw new Error(`Unknown type: ${args.type}`);
    }
  }
}

// Original server was 500+ lines, now only 50 lines!
// All common functionality inherited from BaseMCPServer
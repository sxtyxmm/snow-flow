#!/usr/bin/env node
/**
 * Simple Test MCP Server - minimal implementation for Claude Code compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class SimpleTestMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'simple-test',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_tool',
          description: 'A simple test tool',
          inputSchema: {
            type: 'object',
            properties: {
              message: { type: 'string', description: 'Test message' }
            },
            required: ['message'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'test_tool') {
        return {
          content: [
            {
              type: 'text',
              text: `Test tool called with message: ${args?.message || 'no message'}`,
            },
          ],
        };
      }
      
      throw new Error(`Unknown tool: ${name}`);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start the server
const server = new SimpleTestMCP();
server.start().catch((error) => {
  console.error('Failed to start Simple Test MCP:', error);
  process.exit(1);
});
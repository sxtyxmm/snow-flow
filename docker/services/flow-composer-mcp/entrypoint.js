#!/usr/bin/env node
/**
 * ServiceNow Flow Composer MCP Server Entry Point
 * Initializes the server with HTTP transport for containerization
 */

import { ServiceNowFlowComposerMCP } from '../dist/mcp/servicenow-flow-composer-mcp.js';
import { HttpTransportWrapper } from '../dist/mcp/http-transport-wrapper.js';
import { Logger } from '../dist/utils/logger.js';

const logger = new Logger('ServiceNowFlowComposerMCPContainer');

async function start() {
  try {
    logger.info('Starting ServiceNow Flow Composer MCP Server...');

    // Initialize the MCP server
    const serverInstance = new ServiceNowFlowComposerMCP();

    // Wrap with HTTP transport
    const httpWrapper = new HttpTransportWrapper(serverInstance, {
      name: 'flow-composer-mcp',
      version: '1.0.0',
      port: parseInt(process.env.SERVER_PORT || '3002'),
      healthCheckPath: '/health',
      metricsPath: '/metrics'
    });

    // Start the HTTP server
    await httpWrapper.start();

    logger.info('ServiceNow Flow Composer MCP Server started successfully');
    
  } catch (error) {
    logger.error('Failed to start ServiceNow Flow Composer MCP Server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

start();
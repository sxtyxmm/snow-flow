#!/usr/bin/env node
/**
 * ServiceNow Deployment MCP Server Entry Point
 * Initializes the server with HTTP transport for containerization
 */

import { ServiceNowDeploymentMCP } from '../dist/mcp/servicenow-deployment-mcp.js';
import { HttpTransportWrapper } from '../dist/mcp/http-transport-wrapper.js';
import { Logger } from '../dist/utils/logger.js';

const logger = new Logger('DeploymentMCPContainer');

async function start() {
  try {
    logger.info('Starting ServiceNow Deployment MCP Server...');

    // Initialize the MCP server
    const deploymentServer = new ServiceNowDeploymentMCP();

    // Wrap with HTTP transport
    const httpWrapper = new HttpTransportWrapper(deploymentServer, {
      name: 'servicenow-deployment-mcp',
      version: '1.0.0',
      port: parseInt(process.env.SERVER_PORT || '3001'),
      healthCheckPath: '/health',
      metricsPath: '/metrics'
    });

    // Start the HTTP server
    await httpWrapper.start();

    logger.info('ServiceNow Deployment MCP Server started successfully');
    
  } catch (error) {
    logger.error('Failed to start ServiceNow Deployment MCP Server:', error);
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
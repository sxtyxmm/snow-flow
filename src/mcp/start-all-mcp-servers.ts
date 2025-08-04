#!/usr/bin/env node
/**
 * Start all ServiceNow MCP servers
 */

import { spawn } from 'child_process';
import { Logger } from '../utils/logger.js';

const logger = new Logger('MCPServerLauncher');

async function startAllServers() {
  logger.info('Starting all ServiceNow MCP servers...');

  const servers = [
    {
      name: 'ServiceNow MCP Server',
      script: 'dist/mcp/servicenow-mcp-server.js'
    },
    {
      name: 'ServiceNow Deployment MCP',
      script: 'dist/mcp/servicenow-deployment-mcp.js'
    },
    {
      name: 'ServiceNow Intelligent MCP',
      script: 'dist/mcp/servicenow-intelligent-mcp.js'
    },
    {
      name: 'ServiceNow Update Set MCP',
      script: 'dist/mcp/servicenow-update-set-mcp.js'
    },
    {
      name: 'ServiceNow Advanced Features MCP',
      script: 'dist/mcp/advanced/servicenow-advanced-features-mcp.js'
    },
    {
      name: 'ServiceNow Operations MCP',
      script: 'dist/mcp/servicenow-operations-mcp.js'
    },
    {
      name: 'ServiceNow Reporting Analytics MCP',
      script: 'dist/mcp/servicenow-reporting-analytics-mcp.js'
    },
    {
      name: 'ServiceNow Security Compliance MCP',
      script: 'dist/mcp/servicenow-security-compliance-mcp.js'
    },
    {
      name: 'ServiceNow Platform Development MCP',
      script: 'dist/mcp/servicenow-platform-development-mcp.js'
    },
    {
      name: 'ServiceNow Automation MCP',
      script: 'dist/mcp/servicenow-automation-mcp.js'
    },
    {
      name: 'ServiceNow Integration MCP',
      script: 'dist/mcp/servicenow-integration-mcp.js'
    },
    {
      name: 'Snow-Flow MCP',
      script: 'dist/mcp/snow-flow-mcp.js'
    }
  ];

  const processes = servers.map(server => {
    logger.info(`Starting ${server.name}...`);
    
    const proc = spawn('node', [server.script], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    proc.on('error', (error) => {
      logger.error(`Failed to start ${server.name}:`, error);
    });

    proc.on('exit', (code) => {
      logger.info(`${server.name} exited with code ${code}`);
    });

    return proc;
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down all MCP servers...');
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });

  logger.info('All MCP servers started successfully!');
  logger.info('Press Ctrl+C to stop all servers');
}

startAllServers().catch(error => {
  logger.error('Failed to start MCP servers:', error);
  process.exit(1);
});
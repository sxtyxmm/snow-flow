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
      name: 'ServiceNow Flow Composer MCP',
      script: 'dist/mcp/servicenow-flow-composer-mcp.js'
    },
    {
      name: 'ServiceNow Graph Memory MCP',
      script: 'dist/mcp/servicenow-graph-memory-mcp.js'
    },
    {
      name: 'ServiceNow Update Set MCP',
      script: 'dist/mcp/servicenow-update-set-mcp.js'
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
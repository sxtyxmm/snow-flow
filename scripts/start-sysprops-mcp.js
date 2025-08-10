#!/usr/bin/env node

/**
 * Start ServiceNow System Properties MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'dist', 'mcp', 'servicenow-system-properties-mcp.js');

console.log('🚀 Starting ServiceNow System Properties MCP Server...');
console.log(`📁 Server path: ${serverPath}`);

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ MCP server exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('\n⏹️ Stopping MCP server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Stopping MCP server...');
  child.kill('SIGTERM');
});
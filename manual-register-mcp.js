#!/usr/bin/env node

/**
 * Manual MCP Registration Script for Snow-Flow
 * Run this to register Snow-Flow MCP servers with Claude Desktop
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Claude Desktop config path on macOS
const CLAUDE_CONFIG_PATH = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Claude',
  'claude_desktop_config.json'
);

// Determine Snow-Flow installation path
const SNOW_FLOW_PATH = '/Users/nielsvanderwerf/.nvm/versions/node/v20.15.0/lib/node_modules/snow-flow';

// Snow-Flow MCP servers configuration
const SNOW_FLOW_SERVERS = {
  "snow-flow-operations": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-operations-mcp.js`]
  },
  "snow-flow-automation": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-automation-mcp.js`]
  },
  "snow-flow-integration": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-integration-mcp.js`]
  },
  "snow-flow-deployment": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-deployment-mcp.js`]
  },
  "snow-flow-platform-development": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-platform-development-mcp.js`]
  },
  "snow-flow-reporting-analytics": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-reporting-analytics-mcp.js`]
  },
  "snow-flow-security-compliance": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-security-compliance-mcp.js`]
  },
  "snow-flow-flow-composer": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-flow-composer-mcp.js`]
  },
  "snow-flow-update-set": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-update-set-mcp.js`]
  },
  "snow-flow-intelligent": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-intelligent-mcp.js`]
  },
  "snow-flow-graph-memory": {
    "command": "node",
    "args": [`${SNOW_FLOW_PATH}/dist/mcp/servicenow-graph-memory-mcp.js`]
  }
};

// Add environment variables if .env exists
const envPath = path.join(SNOW_FLOW_PATH, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
  
  // Add env vars to each server
  Object.keys(SNOW_FLOW_SERVERS).forEach(serverKey => {
    SNOW_FLOW_SERVERS[serverKey].env = envVars;
  });
}

console.log('📋 Registering Snow-Flow MCP servers with Claude Desktop...\n');

try {
  // Read existing config
  let config = { mcpServers: {} };
  if (fs.existsSync(CLAUDE_CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
    if (!config.mcpServers) {
      config.mcpServers = {};
    }
  }
  
  // Add Snow-Flow servers
  let addedCount = 0;
  Object.keys(SNOW_FLOW_SERVERS).forEach(key => {
    if (!config.mcpServers[key]) {
      config.mcpServers[key] = SNOW_FLOW_SERVERS[key];
      addedCount++;
      console.log(`✅ Added ${key}`);
    } else {
      console.log(`⏭️  ${key} already exists`);
    }
  });
  
  // Write updated config
  fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
  
  console.log(`\n📝 Updated Claude Desktop configuration`);
  console.log(`   Added ${addedCount} new servers`);
  console.log(`   Path: ${CLAUDE_CONFIG_PATH}`);
  
  console.log('\n🔄 Please restart Claude Desktop to load the MCP servers');
  console.log('💡 Use /mcp in Claude to verify the servers are available');
  
  // Also create a proper .env file in Snow-Flow directory if needed
  if (!fs.existsSync(envPath)) {
    console.log('\n⚠️  No .env file found in Snow-Flow installation');
    console.log('   Create one at: ' + envPath);
    console.log('   With your ServiceNow credentials:');
    console.log('   SNOW_INSTANCE=your-instance.service-now.com');
    console.log('   SNOW_CLIENT_ID=your-client-id');
    console.log('   SNOW_CLIENT_SECRET=your-client-secret');
  }
  
} catch (error) {
  console.error('❌ Error registering MCP servers:', error.message);
  process.exit(1);
}
#!/usr/bin/env node

/**
 * Register Snow-Flow MCP servers with Claude Desktop
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Claude Code config path
const CLAUDE_CONFIG_PATH = path.join(
  os.homedir(),
  '.claude',
  'mcp_config.json'
);

// Snow-Flow MCP servers configuration
const SNOW_FLOW_SERVERS = {
  "snow-flow-operations": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-operations-mcp.js"]
  },
  "snow-flow-automation": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-automation-mcp.js"]
  },
  "snow-flow-integration": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-integration-mcp.js"]
  },
  "snow-flow-deployment": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-deployment-mcp.js"]
  },
  "snow-flow-platform-development": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-platform-development-mcp.js"]
  },
  "snow-flow-reporting-analytics": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-reporting-analytics-mcp.js"]
  },
  "snow-flow-security-compliance": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-security-compliance-mcp.js"]
  },
  "snow-flow-update-set": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-update-set-mcp.js"]
  },
  "snow-flow-intelligent": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-intelligent-mcp.js"]
  },
  "snow-flow-memory": {
    "command": "node",
    "args": ["${SNOW_FLOW_PATH}/dist/mcp/servicenow-memory-mcp.js"]
  }
};

async function registerMCPServers() {
  try {
    // Determine Snow-Flow installation path
    const isGlobalInstall = __dirname.includes('node_modules/snow-flow') || 
                           __dirname.includes('.nvm/versions/node');
    
    const snowFlowPath = process.env.SNOW_FLOW_PATH || 
                        (isGlobalInstall ? path.resolve(__dirname, '..') : process.cwd());
    
    // Replace ${SNOW_FLOW_PATH} with actual path
    const servers = JSON.parse(JSON.stringify(SNOW_FLOW_SERVERS));
    Object.keys(servers).forEach(key => {
      // Replace path placeholder
      if (servers[key].args && servers[key].args[0]) {
        servers[key].args[0] = servers[key].args[0].replace('${SNOW_FLOW_PATH}', snowFlowPath);
      }
      
      // Add environment variables from .env if it exists
      const envPath = path.join(snowFlowPath, '.env');
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const envVars = {};
          
          envContent.split('\n').forEach(line => {
            // Skip comments and empty lines
            if (line.trim() && !line.trim().startsWith('#')) {
              const [key, ...valueParts] = line.split('=');
              if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
                envVars[key.trim()] = value;
              }
            }
          });
          
          // Add env vars to server config
          if (Object.keys(envVars).length > 0) {
            servers[key].env = envVars;
          }
        } catch (err) {
          console.warn('⚠️  Could not read .env file:', err.message);
        }
      }
    });

    // Check if Claude config exists
    if (!fs.existsSync(CLAUDE_CONFIG_PATH)) {
      console.log('⚠️  Claude Code configuration not found.');
      console.log('📍 Creating new configuration at:', CLAUDE_CONFIG_PATH);
      
      // Ensure directory exists
      const configDir = path.dirname(CLAUDE_CONFIG_PATH);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Create new config with "servers" (not "mcpServers")
      const newConfig = {
        servers: servers
      };
      
      fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
      console.log('✅ Created new Claude Code configuration with Snow-Flow MCP servers');
    } else {
      // Read existing config
      let config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
      
      // Initialize servers if not exists (Claude Code uses "servers" not "mcpServers")
      if (!config.servers) {
        config.servers = {};
      }
      
      // Add Snow-Flow servers
      let addedCount = 0;
      Object.keys(servers).forEach(key => {
        if (!config.servers[key]) {
          config.servers[key] = servers[key];
          addedCount++;
        }
      });
      
      // Write updated config
      fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
      
      if (addedCount > 0) {
        console.log(`✅ Added ${addedCount} Snow-Flow MCP servers to Claude Code configuration`);
      } else {
        console.log('✅ All Snow-Flow MCP servers already registered');
      }
    }
    
    console.log('\n📋 Registered MCP servers:');
    Object.keys(servers).forEach(key => {
      console.log(`   - ${key}`);
    });
    
    console.log('\n🔄 MCP servers are now available in Claude Code');
    console.log('💡 Use /mcp in Claude Code to verify the servers are available');
    
  } catch (error) {
    console.error('❌ Error registering MCP servers:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  registerMCPServers();
}

module.exports = { registerMCPServers };
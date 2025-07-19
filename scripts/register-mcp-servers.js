#!/usr/bin/env node

/**
 * Register Snow-Flow MCP servers with Claude Desktop
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

// Snow-Flow MCP servers configuration
const SNOW_FLOW_SERVERS = {
  "snow-flow-operations": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-operations"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-automation": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-automation"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-integration": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-integration"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-deployment": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-deployment"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-platform-development": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-platform-development"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-reporting-analytics": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-reporting-analytics"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-security-compliance": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-security-compliance"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-flow-composer": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-flow-composer"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-update-set": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-update-set"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-intelligent": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-intelligent"],
    "cwd": "${SNOW_FLOW_PATH}"
  },
  "snow-flow-graph-memory": {
    "command": "node",
    "args": ["./mcp-wrapper.sh", "servicenow-graph-memory"],
    "cwd": "${SNOW_FLOW_PATH}"
  }
};

async function registerMCPServers() {
  try {
    // Determine Snow-Flow installation path
    const snowFlowPath = process.env.SNOW_FLOW_PATH || process.cwd();
    
    // Replace ${SNOW_FLOW_PATH} with actual path
    const servers = JSON.parse(JSON.stringify(SNOW_FLOW_SERVERS));
    Object.keys(servers).forEach(key => {
      if (servers[key].cwd === '${SNOW_FLOW_PATH}') {
        servers[key].cwd = snowFlowPath;
      }
    });

    // Check if Claude config exists
    if (!fs.existsSync(CLAUDE_CONFIG_PATH)) {
      console.log('⚠️  Claude Desktop configuration not found.');
      console.log('📍 Creating new configuration at:', CLAUDE_CONFIG_PATH);
      
      // Ensure directory exists
      const configDir = path.dirname(CLAUDE_CONFIG_PATH);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Create new config
      const newConfig = {
        mcpServers: servers
      };
      
      fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(newConfig, null, 2));
      console.log('✅ Created new Claude configuration with Snow-Flow MCP servers');
    } else {
      // Read existing config
      let config = JSON.parse(fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8'));
      
      // Initialize mcpServers if not exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      
      // Add Snow-Flow servers
      let addedCount = 0;
      Object.keys(servers).forEach(key => {
        if (!config.mcpServers[key]) {
          config.mcpServers[key] = servers[key];
          addedCount++;
        }
      });
      
      // Write updated config
      fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
      
      if (addedCount > 0) {
        console.log(`✅ Added ${addedCount} Snow-Flow MCP servers to Claude configuration`);
      } else {
        console.log('✅ All Snow-Flow MCP servers already registered');
      }
    }
    
    console.log('\n📋 Registered MCP servers:');
    Object.keys(servers).forEach(key => {
      console.log(`   - ${key}`);
    });
    
    console.log('\n🔄 Please restart Claude Desktop to load the new MCP servers');
    console.log('💡 Use /mcp in Claude to verify the servers are available');
    
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
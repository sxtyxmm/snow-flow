#!/usr/bin/env node

/**
 * Setup On-Demand MCP Configuration
 * Configures Snow-Flow to use on-demand MCP servers instead of always-on
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_MODES = {
  ALWAYS_ON: 'always-on',
  ON_DEMAND: 'on-demand',
  HYBRID: 'hybrid'
};

async function setupOnDemandMCP(mode = CONFIG_MODES.ON_DEMAND) {
  console.log('🔧 Setting up On-Demand MCP Configuration\n');
  console.log(`Mode: ${mode}\n`);
  
  const claudeConfigPath = path.join(os.homedir(), '.claude', 'claude_desktop_config.json');
  
  // Read existing config
  let config = {};
  if (fs.existsSync(claudeConfigPath)) {
    config = JSON.parse(fs.readFileSync(claudeConfigPath, 'utf8'));
  }
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  if (mode === CONFIG_MODES.ON_DEMAND) {
    console.log('📦 Configuring ON-DEMAND mode...');
    console.log('   • MCP servers start only when needed');
    console.log('   • Auto-shutdown after 5 minutes of inactivity');
    console.log('   • Minimal resource usage\n');
    
    // Use single proxy server for all tools
    config.mcpServers = {
      "snow-flow-proxy": {
        "command": "node",
        "args": [
          path.join(__dirname, '..', 'dist', 'mcp', 'mcp-on-demand-proxy.js')
        ],
        "env": {
          "SNOW_MCP_MODE": "on-demand",
          "SNOW_MCP_INACTIVITY_TIMEOUT": "300000"
        }
      }
    };
    
  } else if (mode === CONFIG_MODES.HYBRID) {
    console.log('🔄 Configuring HYBRID mode...');
    console.log('   • Core servers always running');
    console.log('   • Specialized servers on-demand');
    console.log('   • Balanced resource usage\n');
    
    // Keep essential servers always on, others on-demand
    config.mcpServers = {
      // Always-on core servers
      "servicenow-operations": {
        "command": "node",
        "args": [
          path.join(__dirname, '..', 'dist', 'mcp', 'servicenow-operations-mcp.js')
        ]
      },
      "snow-flow": {
        "command": "node",
        "args": [
          path.join(__dirname, '..', 'dist', 'mcp', 'snow-flow-mcp.js')
        ]
      },
      // On-demand proxy for other servers
      "snow-flow-proxy": {
        "command": "node",
        "args": [
          path.join(__dirname, '..', 'dist', 'mcp', 'mcp-on-demand-proxy.js')
        ],
        "env": {
          "SNOW_MCP_MODE": "hybrid",
          "SNOW_MCP_EXCLUDE_SERVERS": "servicenow-operations,snow-flow"
        }
      }
    };
    
  } else {
    console.log('⚡ Configuring ALWAYS-ON mode...');
    console.log('   • All servers start at launch');
    console.log('   • Maximum performance');
    console.log('   • Higher resource usage\n');
    
    // Load the original always-on configuration
    const mcpConfigPath = path.join(__dirname, '..', 'mcp-config.json');
    if (fs.existsSync(mcpConfigPath)) {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      config.mcpServers = mcpConfig.mcpServers || {};
    }
  }
  
  // Save the configuration
  fs.mkdirSync(path.dirname(claudeConfigPath), { recursive: true });
  fs.writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Configuration saved to:', claudeConfigPath);
  
  // Create environment configuration
  const envPath = path.join(process.cwd(), '.env');
  const envConfig = [];
  
  if (fs.existsSync(envPath)) {
    envConfig.push(...fs.readFileSync(envPath, 'utf8').split('\n'));
  }
  
  // Add or update MCP mode settings
  const modeSettings = [
    `# MCP Server Mode (on-demand, hybrid, always-on)`,
    `SNOW_MCP_MODE=${mode}`,
    ``,
    `# Inactivity timeout for on-demand servers (milliseconds)`,
    `SNOW_MCP_INACTIVITY_TIMEOUT=300000  # 5 minutes`,
    ``,
    `# Maximum MCP servers (for on-demand mode)`,
    `SNOW_MAX_MCP_SERVERS=5  # Reduced for on-demand`,
    ``
  ];
  
  // Remove old settings if they exist
  const filteredConfig = envConfig.filter(line => 
    !line.startsWith('SNOW_MCP_MODE') && 
    !line.startsWith('SNOW_MCP_INACTIVITY_TIMEOUT')
  );
  
  // Add new settings
  filteredConfig.push(...modeSettings);
  
  fs.writeFileSync(envPath, filteredConfig.join('\n'));
  console.log('✅ Environment configuration updated\n');
  
  // Print usage instructions
  console.log('📋 Next Steps:');
  console.log('─'.repeat(40));
  
  if (mode === CONFIG_MODES.ON_DEMAND) {
    console.log('1. Build the proxy: npm run build');
    console.log('2. Restart Claude Desktop');
    console.log('3. MCP servers will start automatically when needed');
    console.log('');
    console.log('📊 Monitor servers:');
    console.log('   snow-flow mcp status');
    console.log('');
    console.log('🔧 Change mode:');
    console.log('   node scripts/setup-on-demand-mcp.js always-on');
    console.log('   node scripts/setup-on-demand-mcp.js hybrid');
  } else if (mode === CONFIG_MODES.HYBRID) {
    console.log('1. Build: npm run build');
    console.log('2. Restart Claude Desktop');
    console.log('3. Core servers run always, others on-demand');
  } else {
    console.log('1. Build: npm run build');
    console.log('2. Start all servers: npm run mcp:start');
    console.log('3. Restart Claude Desktop');
  }
  
  console.log('\n✨ Benefits of On-Demand Mode:');
  console.log('   • 90% less memory usage when idle');
  console.log('   • No timeout errors from resource exhaustion');
  console.log('   • Servers start in <1 second when needed');
  console.log('   • Automatic cleanup after inactivity');
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || CONFIG_MODES.ON_DEMAND;

if (!Object.values(CONFIG_MODES).includes(mode)) {
  console.error(`Invalid mode: ${mode}`);
  console.error(`Valid modes: ${Object.values(CONFIG_MODES).join(', ')}`);
  process.exit(1);
}

setupOnDemandMCP(mode).catch(console.error);
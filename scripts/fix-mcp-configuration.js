#!/usr/bin/env node

/**
 * Fix MCP Server Configuration
 * 
 * This script ensures that all MCP servers are properly configured
 * and registered for both local development and npm installations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// MCP Server configuration that should be consistent across all files
const MCP_SERVERS = {
  "servicenow-deployment": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET", "SNOW_DEPLOYMENT_TIMEOUT", "MCP_DEPLOYMENT_TIMEOUT"]
  },
  "servicenow-update-set": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-intelligent": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-memory": {
    "env": ["MEMORY_PATH", "SNOW_FLOW_HOME"]
  },
  "servicenow-graph-memory": {
    "env": ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD", "SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-operations": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-platform-development": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-integration": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-automation": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-security-compliance": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-reporting-analytics": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "servicenow-flow-composer": {
    "env": ["SNOW_INSTANCE", "SNOW_CLIENT_ID", "SNOW_CLIENT_SECRET"]
  },
  "snow-flow": {
    "env": ["SNOW_FLOW_ENV"]
  }
};

function getProjectRoot() {
  // Find the project root by looking for package.json
  let currentDir = __dirname;
  while (currentDir !== '/') {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'snow-flow') {
          return currentDir;
        }
      } catch (e) {
        // Continue searching
      }
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find snow-flow project root');
}

function fixMcpTemplate() {
  const projectRoot = getProjectRoot();
  const templatePath = path.join(projectRoot, '.mcp.json.template');
  
  console.log('📝 Updating .mcp.json.template...');
  
  const config = {
    servers: {}
  };
  
  // Build configuration from MCP_SERVERS
  Object.entries(MCP_SERVERS).forEach(([name, serverConfig]) => {
    const filename = name === 'snow-flow' ? 'snow-flow-mcp.js' : `${name}-mcp.js`;
    config.servers[name] = {
      command: "node",
      args: [`{{PROJECT_ROOT}}/dist/mcp/${filename}`],
      env: {}
    };
    
    // Add environment variables
    serverConfig.env.forEach(envVar => {
      config.servers[name].env[envVar] = `{{${envVar}}}`;
    });
  });
  
  fs.writeFileSync(templatePath, JSON.stringify(config, null, 2));
  console.log('✅ Updated .mcp.json.template');
}

function fixClaudeTemplate() {
  const projectRoot = getProjectRoot();
  const templatePath = path.join(projectRoot, '.claude.mcp-config.template');
  
  console.log('📝 Updating .claude.mcp-config.template...');
  
  const config = {
    servers: {}
  };
  
  // Build configuration from MCP_SERVERS
  Object.entries(MCP_SERVERS).forEach(([name, serverConfig]) => {
    const filename = name === 'snow-flow' ? 'snow-flow-mcp.js' : `${name}-mcp.js`;
    config.servers[name] = {
      command: "node",
      args: [`\${MCP_PATH}/${filename}`],
      env: {}
    };
    
    // Add environment variables with ${} syntax for Claude
    serverConfig.env.forEach(envVar => {
      config.servers[name].env[envVar] = `\${${envVar}}`;
    });
  });
  
  fs.writeFileSync(templatePath, JSON.stringify(config, null, 2));
  console.log('✅ Updated .claude.mcp-config.template');
}

function fixRegisterScript() {
  const projectRoot = getProjectRoot();
  const scriptPath = path.join(projectRoot, 'scripts', 'register-mcp-servers.js');
  
  console.log('📝 Updating register-mcp-servers.js...');
  
  // Read current script
  let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  
  // Generate SNOW_FLOW_SERVERS object
  const serversObject = {};
  Object.entries(MCP_SERVERS).forEach(([name, serverConfig]) => {
    const filename = name === 'snow-flow' ? 'snow-flow-mcp.js' : `${name}-mcp.js`;
    serversObject[name] = {
      command: "node",
      args: [`\${SNOW_FLOW_PATH}/dist/mcp/${filename}`]
    };
  });
  
  // Replace the SNOW_FLOW_SERVERS constant
  const newServersDefinition = `// Snow-Flow MCP servers configuration
const SNOW_FLOW_SERVERS = ${JSON.stringify(serversObject, null, 2).replace(/"/g, '"')};`;
  
  scriptContent = scriptContent.replace(
    /\/\/ Snow-Flow MCP servers configuration[\s\S]*?};/,
    newServersDefinition
  );
  
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Updated register-mcp-servers.js');
}

function fixSnowFlowMcpServers() {
  const projectRoot = getProjectRoot();
  const mcpServersPath = path.join(projectRoot, '.snow-flow', 'mcp-servers.json');
  
  console.log('📝 Updating .snow-flow/mcp-servers.json...');
  
  const servers = [];
  
  // Add all servers with proper configuration
  Object.entries(MCP_SERVERS).forEach(([name, serverConfig]) => {
    const filename = name === 'snow-flow' ? 'snow-flow-mcp.js' : `${name}-mcp.js`;
    const server = {
      name: name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' MCP',
      script: `dist/mcp/${filename}`,
      autoStart: true
    };
    
    // Add env if needed
    if (serverConfig.env.length > 0) {
      server.env = {};
      serverConfig.env.forEach(envVar => {
        server.env[envVar] = "";
      });
    }
    
    servers.push(server);
  });
  
  fs.writeFileSync(mcpServersPath, JSON.stringify(servers, null, 2));
  console.log('✅ Updated .snow-flow/mcp-servers.json');
}

async function main() {
  console.log('🔧 Fixing MCP Server Configuration...\n');
  
  try {
    // Fix all configuration files
    fixMcpTemplate();
    fixClaudeTemplate();
    fixRegisterScript();
    fixSnowFlowMcpServers();
    
    console.log('\n✅ All MCP server configurations have been fixed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run "npm run build" to rebuild the project');
    console.log('2. Run "node scripts/register-mcp-servers.js" to update Claude configuration');
    console.log('3. Test with "snow-flow init" in a new directory');
    
  } catch (error) {
    console.error('❌ Error fixing MCP configuration:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixMcpConfiguration: main };
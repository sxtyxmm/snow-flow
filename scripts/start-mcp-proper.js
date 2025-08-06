#!/usr/bin/env node

/**
 * Proper MCP Server Starter using MCPServerManager
 * REPLACES the legacy start-all-mcp-servers.ts approach
 */

const path = require('path');

async function startMCPServersProper() {
  console.log('🚀 Starting MCP servers using proper MCPServerManager...\n');
  
  try {
    // Import the proper MCPServerManager
    const { MCPServerManager } = require('../dist/utils/mcp-server-manager.js');
    
    // Initialize manager
    const manager = new MCPServerManager();
    await manager.initialize();
    
    console.log('📋 Initializing MCP server configuration...');
    
    // Start all servers with singleton protection built-in
    await manager.startAllServers();
    
    console.log('✅ All MCP servers started successfully!\n');
    console.log('📊 Server Status:');
    
    // Show server status
    const servers = manager.getServerList();
    for (const server of servers) {
      const status = server.status === 'running' ? '🟢' : 
                    server.status === 'starting' ? '🟡' : 
                    server.status === 'error' ? '🔴' : '⚫';
      console.log(`  ${status} ${server.name}: ${server.status}`);
    }
    
    console.log('\n💡 Benefits of using MCPServerManager:');
    console.log('  • ✅ Singleton protection (no duplicates)');
    console.log('  • ✅ Process lifecycle management');
    console.log('  • ✅ Configuration management');
    console.log('  • ✅ Proper logging and monitoring');
    console.log('  • ✅ Graceful shutdown handling');
    console.log('  • ✅ OAuth integration');
    
    console.log('\n🔧 Management commands:');
    console.log('  • Status: manager.getServerStatus()');
    console.log('  • Stop: manager.stopAllServers()');
    console.log('  • Restart: manager.restartServer(name)');
    
    // Keep process alive to monitor servers
    process.on('SIGINT', async () => {
      console.log('\n🛑 Gracefully shutting down all MCP servers...');
      await manager.stopAllServers();
      console.log('✅ All servers stopped. Goodbye!');
      process.exit(0);
    });
    
    console.log('\n⏳ MCP servers running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Failed to start MCP servers:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Run "npm run build" first');
    console.error('  2. Check if servers are already running');
    console.error('  3. Run "npm run cleanup-mcp" to clean state');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  startMCPServersProper().catch(console.error);
}

module.exports = { startMCPServersProper };
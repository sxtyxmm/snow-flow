#!/usr/bin/env node
/**
 * ⚠️ DEPRECATED: Legacy MCP Server Starter
 * 
 * This script is DEPRECATED and will be removed in v3.0.0
 * Use MCPServerManager instead for proper server management.
 * 
 * Migration: Use scripts/start-mcp-proper.js or MCPServerManager directly
 */

import { Logger } from '../utils/logger.js';

const logger = new Logger('DeprecatedMCPLauncher');

async function startAllServers() {
  logger.warn('⚠️ DEPRECATED: This start-all-mcp-servers.ts script is deprecated!');
  logger.warn('   Please use MCPServerManager or scripts/start-mcp-proper.js instead');
  logger.warn('   This provides proper process management and singleton protection');
  
  console.log('\n🔄 Redirecting to proper MCPServerManager...\n');
  
  try {
    // Redirect to proper approach
    const { MCPServerManager } = await import('../utils/mcp-server-manager.js');
    const manager = new MCPServerManager();
    
    await manager.initialize();
    await manager.startAllServers();
    
    logger.info('✅ Servers started using proper MCPServerManager');
    
  } catch (error: any) {
    logger.error('❌ Failed to start servers:', error.message);
    logger.info('💡 Consider migrating to: scripts/start-mcp-proper.js');
    process.exit(1);
  }
  
  // If we get here, MCPServerManager started successfully
  logger.info('🎉 Migration successful! Using proper MCPServerManager now.');
  
  // Keep process alive to monitor servers (handled by MCPServerManager)
  process.on('SIGINT', () => {
    logger.info('👋 Shutting down...');
    process.exit(0);
  });
}

startAllServers().catch(error => {
  logger.error('Failed to start MCP servers:', error);
  process.exit(1);
});
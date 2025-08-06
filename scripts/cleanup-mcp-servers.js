#!/usr/bin/env node

/**
 * MCP Server Cleanup Script
 * Prevents duplicate MCP servers and memory exhaustion
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function cleanupMCPServers() {
  console.log('🧹 Cleaning up MCP servers...\n');
  
  try {
    // 1. Check for running MCP processes
    const { stdout: psOutput } = await execAsync('ps aux | grep -E "node.*mcp" | grep -v grep | wc -l');
    const processCount = parseInt(psOutput.trim());
    
    if (processCount > 0) {
      console.log(`⚠️  Found ${processCount} running MCP processes`);
      console.log('🔪 Killing all MCP processes...');
      
      // Kill all MCP processes
      await execAsync('pkill -f "node.*mcp"').catch(() => {
        // Ignore errors if no processes found
      });
      
      // Wait for processes to terminate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ All MCP processes terminated\n');
    } else {
      console.log('✅ No MCP processes running\n');
    }
    
    // 2. Clean up any stale lock files
    console.log('🔒 Cleaning up lock files...');
    await execAsync('rm -f /tmp/mcp-*.lock').catch(() => {});
    await execAsync('rm -f ~/.claude/mcp-*.lock').catch(() => {});
    
    // 3. Check memory usage
    const { stdout: memOutput } = await execAsync('ps aux | grep node | awk \'{sum+=$6} END {print sum/1024}\'');
    const nodeMemoryMB = parseFloat(memOutput.trim());
    
    console.log(`📊 Node.js memory usage: ${nodeMemoryMB.toFixed(2)} MB\n`);
    
    if (nodeMemoryMB > 1000) {
      console.log('⚠️  High memory usage detected!');
      console.log('💡 Recommendation: Restart your terminal or run "killall node"\n');
    }
    
    // 4. Create singleton lock mechanism
    console.log('🔐 Setting up singleton lock mechanism...');
    const lockScript = `
const fs = require('fs');
const path = require('path');

const lockFile = path.join(process.env.HOME, '.claude', 'mcp-singleton.lock');
const pid = process.pid;

// Check if lock exists
if (fs.existsSync(lockFile)) {
  const existingPid = fs.readFileSync(lockFile, 'utf8');
  try {
    // Check if process is still running
    process.kill(existingPid, 0);
    console.error('MCP servers already running with PID:', existingPid);
    process.exit(1);
  } catch (e) {
    // Process not running, remove stale lock
    fs.unlinkSync(lockFile);
  }
}

// Create lock
fs.mkdirSync(path.dirname(lockFile), { recursive: true });
fs.writeFileSync(lockFile, pid.toString());

// Clean up on exit
process.on('exit', () => {
  try {
    fs.unlinkSync(lockFile);
  } catch (e) {}
});
`;
    
    // Save singleton script
    const fs = require('fs');
    const path = require('path');
    const singletonPath = path.join(__dirname, '..', 'dist', 'mcp', 'singleton-check.js');
    fs.writeFileSync(singletonPath, lockScript);
    console.log('✅ Singleton mechanism created\n');
    
    // 5. Report status
    console.log('📋 Cleanup Summary:');
    console.log('─'.repeat(40));
    console.log('✅ All MCP processes terminated');
    console.log('✅ Lock files cleaned');
    console.log('✅ Singleton mechanism installed');
    console.log(`✅ Memory usage: ${nodeMemoryMB.toFixed(2)} MB`);
    console.log('\n🎯 Next Steps:');
    console.log('1. Run "npm run build" to rebuild');
    console.log('2. Use "snow-flow mcp start" to start servers properly');
    console.log('3. Monitor with "snow-flow mcp status"');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupMCPServers().catch(console.error);
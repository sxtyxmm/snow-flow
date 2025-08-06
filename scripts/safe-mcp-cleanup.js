#!/usr/bin/env node

/**
 * Safe MCP Cleanup Script
 * Manual cleanup for MCP servers without causing memory crashes
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getProcesses() {
  try {
    const output = execSync('ps aux | grep -E "mcp|servicenow.*mcp" | grep -v grep', {
      encoding: 'utf8'
    }).trim();
    
    if (!output) return [];
    
    const lines = output.split('\n');
    const processes = [];
    
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length > 10) {
        processes.push({
          pid: parseInt(parts[1]),
          memory: Math.round(parseInt(parts[5]) / 1024), // MB
          name: parts.slice(10).join(' ').substring(0, 80)
        });
      }
    }
    
    return processes;
  } catch (error) {
    return [];
  }
}

async function main() {
  console.log('🧹 Safe MCP Cleanup Utility\n');
  console.log('⚠️  WARNING: This will terminate MCP server processes');
  console.log('Only use if experiencing memory issues or crashes\n');
  
  const processes = getProcesses();
  
  if (processes.length === 0) {
    console.log('✅ No MCP processes found');
    process.exit(0);
  }
  
  console.log(`Found ${processes.length} MCP processes:\n`);
  
  // Group by type
  const groups = {};
  let totalMemory = 0;
  
  for (const proc of processes) {
    const match = proc.name.match(/servicenow-([^-]+)-mcp/);
    const type = match ? match[1] : 'other';
    
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(proc);
    totalMemory += proc.memory;
  }
  
  // Display summary
  for (const [type, procs] of Object.entries(groups)) {
    const memSum = procs.reduce((sum, p) => sum + p.memory, 0);
    console.log(`  ${type}: ${procs.length} process(es), ${memSum}MB`);
  }
  
  console.log(`\nTotal memory usage: ${totalMemory}MB`);
  
  // Ask for confirmation
  const answer = await new Promise(resolve => {
    rl.question('\nOptions:\n1. Kill ALL MCP processes\n2. Kill duplicates only (keep 1 of each type)\n3. Kill high memory processes (>100MB)\n4. Cancel\n\nChoice (1-4): ', resolve);
  });
  
  switch (answer.trim()) {
    case '1':
      console.log('\n🔴 Killing ALL MCP processes...');
      for (const proc of processes) {
        try {
          process.kill(proc.pid, 'SIGTERM');
          console.log(`  Killed PID ${proc.pid}`);
        } catch (e) {
          // Already dead
        }
      }
      console.log('✅ All MCP processes terminated');
      break;
      
    case '2':
      console.log('\n🟡 Killing duplicate processes...');
      for (const [type, procs] of Object.entries(groups)) {
        if (procs.length > 1) {
          // Keep the first one, kill the rest
          for (let i = 1; i < procs.length; i++) {
            try {
              process.kill(procs[i].pid, 'SIGTERM');
              console.log(`  Killed duplicate ${type} (PID ${procs[i].pid})`);
            } catch (e) {
              // Already dead
            }
          }
        }
      }
      console.log('✅ Duplicates removed');
      break;
      
    case '3':
      console.log('\n🟠 Killing high memory processes...');
      const highMem = processes.filter(p => p.memory > 100);
      for (const proc of highMem) {
        try {
          process.kill(proc.pid, 'SIGTERM');
          console.log(`  Killed PID ${proc.pid} (${proc.memory}MB)`);
        } catch (e) {
          // Already dead
        }
      }
      console.log('✅ High memory processes terminated');
      break;
      
    default:
      console.log('❌ Cancelled');
      break;
  }
  
  rl.close();
  
  // Show final status
  setTimeout(() => {
    console.log('\n📊 Final status:');
    const remaining = getProcesses();
    console.log(`  Remaining processes: ${remaining.length}`);
    if (remaining.length > 0) {
      const memSum = remaining.reduce((sum, p) => sum + p.memory, 0);
      console.log(`  Memory usage: ${memSum}MB`);
    }
  }, 1000);
}

main().catch(console.error);
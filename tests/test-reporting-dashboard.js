#!/usr/bin/env node
/**
 * Test Script for ServiceNow Reporting & Dashboard MCP Fixes
 * 
 * This script tests the fixed reporting and dashboard creation functionality
 * to ensure reports can fetch data and dashboards are visible in ServiceNow.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configurations
const tests = [
  {
    name: 'Create Basic Report',
    tool: 'snow_create_report',
    args: {
      name: 'Test Incident Report',
      table: 'incident',
      description: 'Test report to verify data fetching',
      fields: ['number', 'short_description', 'priority', 'state', 'assigned_to'],
      conditions: 'active=true',
      sortBy: 'priority',
      sortOrder: 'asc',
      format: 'PDF'
    }
  },
  {
    name: 'Create Dashboard with Widgets',
    tool: 'snow_create_dashboard',
    args: {
      name: 'Test Operations Dashboard',
      description: 'Test dashboard to verify visibility',
      layout: 'grid',
      widgets: [
        {
          name: 'Active Incidents',
          type: 'chart',
          table: 'incident',
          filter: 'active=true'
        },
        {
          name: 'Priority Distribution',
          type: 'pie',
          table: 'incident',
          groupBy: 'priority'
        }
      ],
      refreshInterval: 30,
      public: false
    }
  },
  {
    name: 'Create KPI Indicator',
    tool: 'snow_create_kpi',
    args: {
      name: 'Incident Resolution Time',
      table: 'incident',
      metric: 'sys_created_on',
      aggregation: 'AVG',
      conditions: 'state=6',
      target: 24,
      unit: 'hours',
      frequency: 'daily'
    }
  },
  {
    name: 'Create Performance Analytics',
    tool: 'snow_create_performance_analytics',
    args: {
      name: 'Service Performance',
      category: 'ITSM',
      dataSource: 'incident',
      metrics: [
        { name: 'resolution_time', field: 'calendar_duration', aggregation: 'AVG' },
        { name: 'volume', field: 'sys_id', aggregation: 'COUNT' }
      ],
      dimensions: ['priority', 'category'],
      timeframe: '30d'
    }
  },
  {
    name: 'Test Report Data Export',
    tool: 'snow_export_report_data',
    args: {
      reportName: 'Test Incident Report',
      format: 'CSV',
      includeHeaders: true,
      maxRows: 100
    }
  }
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Run a single test
async function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.cyan}▶ Testing: ${test.name}${colors.reset}`);
    console.log(`  Tool: ${test.tool}`);
    console.log(`  Args:`, JSON.stringify(test.args, null, 2));
    
    // Prepare the command
    const mcpPath = path.join(__dirname, '..', 'src', 'mcp', 'servicenow-reporting-analytics-mcp.ts');
    const args = [
      'claude-flow@alpha',
      'mcp',
      'call',
      test.tool,
      JSON.stringify(test.args)
    ];
    
    // Execute the test
    const startTime = Date.now();
    const child = spawn('npx', args, {
      env: { ...process.env },
      shell: true
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        console.log(`${colors.green}✓ Test passed${colors.reset} (${duration}ms)`);
        if (output.includes('sys_id:')) {
          const sysId = output.match(/sys_id: ([a-f0-9]{32})/)?.[1];
          console.log(`  Created: sys_id=${sysId}`);
        }
        resolve({ test: test.name, success: true, duration, output });
      } else {
        console.log(`${colors.red}✗ Test failed${colors.reset} (${duration}ms)`);
        console.log(`  Error: ${error || 'Unknown error'}`);
        resolve({ test: test.name, success: false, duration, error });
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error(`Test timeout: ${test.name}`));
    }, 30000);
  });
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  ServiceNow Reporting & Dashboard Tests   ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await runTest(test);
      results.push(result);
      if (result.success) passed++;
      else failed++;
    } catch (error) {
      console.log(`${colors.red}✗ Test error: ${error.message}${colors.reset}`);
      failed++;
      results.push({ test: test.name, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${tests.length}`);
  
  // Detailed results
  console.log(`\n${colors.yellow}Detailed Results:${colors.reset}`);
  results.forEach(result => {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    console.log(`${color}${icon} ${result.test}${colors.reset} (${result.duration || 0}ms)`);
  });
  
  // Verification URLs
  console.log(`\n${colors.cyan}📋 Verification Steps:${colors.reset}`);
  console.log('1. Check Performance Analytics:');
  console.log(`   ${process.env.SNOW_INSTANCE}/pa_dashboard.do`);
  console.log('2. Check Reports:');
  console.log(`   ${process.env.SNOW_INSTANCE}/sys_report_list.do`);
  console.log('3. Check Service Portal Pages:');
  console.log(`   ${process.env.SNOW_INSTANCE}/sp_page_list.do`);
  console.log('4. Check Indicators:');
  console.log(`   ${process.env.SNOW_INSTANCE}/pa_indicators_list.do`);
  
  process.exit(failed > 0 ? 1 : 0);
}

// Check environment
if (!process.env.SNOW_INSTANCE) {
  console.error(`${colors.red}Error: SNOW_INSTANCE environment variable not set${colors.reset}`);
  console.log('Please set your ServiceNow instance URL:');
  console.log('export SNOW_INSTANCE=https://your-instance.service-now.com');
  process.exit(1);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
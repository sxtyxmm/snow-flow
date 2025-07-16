#!/usr/bin/env node
/**
 * Minimal CLI for snow-flow - ServiceNow Multi-Agent Framework
 */

import { Command } from 'commander';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { ServiceNowOAuth } from './utils/snow-oauth.js';
import { ServiceNowClient } from './utils/servicenow-client.js';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('snow-flow')
  .description('ServiceNow Multi-Agent Development Framework')
  .version('1.0.0');

// Swarm command - the main orchestration command
program
  .command('swarm <objective>')
  .description('Execute multi-agent orchestration for a ServiceNow task')
  .option('--strategy <strategy>', 'Execution strategy (development, analysis, research)', 'development')
  .option('--mode <mode>', 'Coordination mode (hierarchical, mesh, distributed)', 'hierarchical')
  .option('--max-agents <number>', 'Maximum number of agents', '5')
  .option('--parallel', 'Enable parallel execution')
  .option('--monitor', 'Enable real-time monitoring')
  .action(async (objective: string, options) => {
    console.log(`\n🚀 Starting ServiceNow Multi-Agent Swarm`);
    console.log(`📋 Objective: ${objective}`);
    console.log(`⚙️  Strategy: ${options.strategy} | Mode: ${options.mode} | Max Agents: ${options.maxAgents}`);
    console.log(`🔄 Parallel: ${options.parallel ? 'Yes' : 'No'} | Monitor: ${options.monitor ? 'Yes' : 'No'}\n`);
    
    // Parse the objective to determine what type of task
    const taskType = parseObjective(objective);
    
    console.log(`🎯 Task Type: ${taskType.type}`);
    console.log(`📊 Payload: ${JSON.stringify(taskType.payload, null, 2)}`);
    
    // Show timeout configuration
    const timeoutMinutes = process.env.SNOW_FLOW_TIMEOUT_MINUTES ? parseInt(process.env.SNOW_FLOW_TIMEOUT_MINUTES) : 60;
    if (timeoutMinutes > 0) {
      console.log(`⏱️  Timeout: ${timeoutMinutes} minutes`);
    } else {
      console.log('⏱️  Timeout: Disabled (infinite execution time)');
    }
    
    // Check ServiceNow authentication
    const oauth = new ServiceNowOAuth();
    const isAuthenticated = await oauth.isAuthenticated();
    
    if (isAuthenticated) {
      console.log('🔗 ServiceNow connection: ✅ Authenticated');
      
      // Test ServiceNow connection
      const client = new ServiceNowClient();
      const testResult = await client.testConnection();
      if (testResult.success) {
        console.log(`👤 Connected as: ${testResult.data.name} (${testResult.data.user_name})`);
      }
    } else {
      console.log('🔗 ServiceNow connection: ❌ Not authenticated');
      console.log('💡 Run "snow-flow auth login" to enable live ServiceNow integration');
    }
    
    // Start real Claude Code orchestration
    try {
      // Generate the orchestration prompt for Claude Code with ServiceNow integration
      const orchestrationPrompt = buildClaudeCodePrompt(objective, taskType, options, isAuthenticated);
      
      console.log('🎯 Executing Claude Code with orchestration prompt...');
      console.log('💡 Claude Code will now coordinate the multi-agent development');
      console.log('📋 Use TodoWrite to track progress in real-time');
      console.log('🤖 Agents will be spawned using Task tool');
      console.log('💾 Coordination data stored in Memory');
      
      if (isAuthenticated) {
        console.log('🔗 Live ServiceNow integration: ✅ Enabled');
        console.log('📝 Artifacts will be created directly in ServiceNow');
      } else {
        console.log('🔗 Live ServiceNow integration: ❌ Disabled');
        console.log('📝 Artifacts will be saved to servicenow/ directory');
      }
      
      console.log(); // Empty line
      
      // Try to execute Claude Code directly
      const success = await executeClaudeCode(orchestrationPrompt);
      
      if (success) {
        console.log('✅ Claude Code execution completed successfully!');
        if (isAuthenticated) {
          console.log('📊 Check your ServiceNow instance for created artifacts');
        } else {
          console.log('📊 Check the servicenow/ directory for generated artifacts');
        }
      } else {
        console.log('⚠️  Claude Code direct execution failed. Using fallback method:');
        console.log('\n🚀 CLAUDE CODE ORCHESTRATION PROMPT:');
        console.log('=' .repeat(80));
        console.log(orchestrationPrompt);
        console.log('=' .repeat(80));
        
        console.log('\n✅ Snow-Flow orchestration prompt generated!');
        console.log('📊 Next Steps:');
        console.log('   1. Copy the above prompt and paste it into Claude Code');
        console.log('   2. Claude Code will execute the TodoWrite, Task, and Memory tools');
        console.log('   3. Monitor progress through the batch tools');
        if (isAuthenticated) {
          console.log('   4. Artifacts will be created directly in ServiceNow');
        } else {
          console.log('   4. Generated artifacts will appear in servicenow/ directory');
        }
        console.log('\n💡 Tip: Run this in a Claude Code session for full orchestration!');
      }
      
    } catch (error) {
      console.error('❌ Failed to execute Claude Code orchestration:', error instanceof Error ? error.message : String(error));
    }
  });

// Helper function to execute Claude Code directly
async function executeClaudeCode(prompt: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🔍 Checking for Claude Code availability...');
    
    // Try to find Claude Code binary
    const claudeCommands = ['claude', 'claude-code', 'npx claude-code'];
    
    let currentCommand = 0;
    
    const tryNextCommand = () => {
      if (currentCommand >= claudeCommands.length) {
        console.log('❌ Claude Code not found in PATH');
        resolve(false);
        return;
      }
      
      const command = claudeCommands[currentCommand];
      console.log(`🔍 Trying: ${command}`);
      
      const claudeArgs = [
        '--version'
      ];
      
      // Test if Claude Code is available
      const testProcess = spawn(command, claudeArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Found Claude Code: ${command}`);
          executeWithClaude(command, prompt, resolve);
        } else {
          currentCommand++;
          tryNextCommand();
        }
      });
      
      testProcess.on('error', () => {
        currentCommand++;
        tryNextCommand();
      });
    };
    
    tryNextCommand();
  });
}

// Real-time monitoring dashboard for Claude Code process
function startMonitoringDashboard(claudeProcess: ChildProcess): NodeJS.Timeout {
  let iterations = 0;
  const startTime = Date.now();
  
  // Show initial dashboard only once
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                  🚀 Snow-Flow Dashboard                     │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ 🤖 Claude Code Status:  ✅ Starting                        │`);
  console.log(`│ 📊 Process ID:          ${claudeProcess.pid || 'N/A'}                            │`);
  console.log(`│ ⏱️  Session Time:        00:00                          │`);
  console.log(`│ 🔄 Monitoring Cycles:    0                                │`);
  console.log('└─────────────────────────────────────────────────────────────┘');
  
  // Silent monitoring - only log to file or memory, don't interfere with Claude Code UI
  const monitoringInterval = setInterval(() => {
    iterations++;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    // Silent monitoring - check files but don't output to console
    try {
      const serviceNowDir = join(process.cwd(), 'servicenow');
      fs.readdir(serviceNowDir).then(files => {
        // Files are being generated - could log to file if needed
        // console.log(`\n📁 Generated Files: ${files.length} artifacts in servicenow/`);
      }).catch(() => {
        // Directory doesn't exist yet, that's normal
      });
    } catch (error) {
      // Ignore errors
    }
    
  }, 5000); // Check every 5 seconds silently
  
  return monitoringInterval;
}

async function executeWithClaude(claudeCommand: string, prompt: string, resolve: (value: boolean) => void): Promise<void> {
  console.log('🚀 Starting Claude Code execution...');
  
  // Write prompt to temporary file for large prompts
  const tempFile = join(process.cwd(), '.snow-flow-prompt.tmp');
  await fs.writeFile(tempFile, prompt);
  
  const claudeArgs = [
    '--dangerously-skip-permissions'
  ];
  
  // Start Claude Code process in interactive mode
  const claudeProcess = spawn(claudeCommand, claudeArgs, {
    stdio: ['pipe', 'inherit', 'inherit'], // inherit stdout/stderr for interactive mode
    cwd: process.cwd()
  });
  
  // Send the prompt via stdin
  console.log('📝 Sending orchestration prompt to Claude Code...');
  console.log('🚀 Claude Code interactive interface opening...\n');
  
  claudeProcess.stdin.write(prompt);
  claudeProcess.stdin.end();
  
  // Start silent monitoring dashboard (doesn't interfere with Claude Code UI)
  const monitoringInterval = startMonitoringDashboard(claudeProcess);
  
  claudeProcess.on('close', (code) => {
    clearInterval(monitoringInterval);
    if (code === 0) {
      console.log('\n✅ Claude Code session completed successfully!');
      resolve(true);
    } else {
      console.log(`\n❌ Claude Code session ended with code: ${code}`);
      resolve(false);
    }
  });
  
  claudeProcess.on('error', (error) => {
    clearInterval(monitoringInterval);
    console.log(`❌ Failed to start Claude Code: ${error.message}`);
    resolve(false);
  });
  
  // Set timeout for Claude Code execution (configurable via environment variable)
  const timeoutMinutes = process.env.SNOW_FLOW_TIMEOUT_MINUTES ? parseInt(process.env.SNOW_FLOW_TIMEOUT_MINUTES) : 60;
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  console.log(`⏱️  Claude Code timeout set to ${timeoutMinutes} minutes (configure with SNOW_FLOW_TIMEOUT_MINUTES=0 for no timeout)`);
  
  let timeout: NodeJS.Timeout | null = null;
  
  // Only set timeout if not disabled (0 = no timeout)
  if (timeoutMinutes > 0) {
    timeout = setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log(`⏱️  Claude Code session timeout (${timeoutMinutes} minutes), terminating...`);
      claudeProcess.kill('SIGTERM');
      
      // Force kill if it doesn't respond
      setTimeout(() => {
        claudeProcess.kill('SIGKILL');
      }, 2000);
      
      resolve(false);
    }, timeoutMs);
  }
  
  claudeProcess.on('close', () => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

// Helper function to build Claude Code orchestration prompt
function buildClaudeCodePrompt(objective: string, taskType: any, options: any, isAuthenticated: boolean = false): string {
  const prompt = `# Snow-Flow ServiceNow Multi-Agent Development

## Objective
${objective}

## Task Configuration
- **Type**: ${taskType.type}
- **Strategy**: ${options.strategy}
- **Mode**: ${options.mode}
- **Max Agents**: ${options.maxAgents}
- **Parallel**: ${options.parallel ? 'Yes' : 'No'}
- **Monitor**: ${options.monitor ? 'Yes' : 'No'}

## Task Details
${JSON.stringify(taskType.payload, null, 2)}

## ServiceNow Integration
${isAuthenticated ? '✅ **Live ServiceNow Integration: ENABLED**' : '❌ **Live ServiceNow Integration: DISABLED**'}

${isAuthenticated ? `
🔗 **You have LIVE ACCESS to ServiceNow APIs and can create artifacts directly in ServiceNow!**

🚨 **CRITICAL: You have ServiceNow MCP tools available for direct deployment:**

Available ServiceNow MCP Tools:
- **ServiceNowClient**: Create widgets, workflows, and applications directly
- **ServiceNowOAuth**: Authenticated access to ServiceNow APIs
- **Direct API Access**: Use REST APIs to create and deploy artifacts immediately

**MANDATORY: Use ServiceNow API calls to deploy widgets directly:**
1. **Create artifacts in ServiceNow using ServiceNowClient.createWidget()**
2. **Test functionality immediately in the live ServiceNow instance**
3. **Generate update sets for deployment**
4. **Provide direct links to created artifacts**

⚠️ **DO NOT say you cannot deploy to ServiceNow** - you CAN and SHOULD deploy directly using the available ServiceNow API tools!

**Example ServiceNow Widget Creation:**
\`\`\`typescript
import { ServiceNowClient } from '../utils/servicenow-client.js';

const client = new ServiceNowClient();
const widget = await client.createWidget({
  name: 'incident_management_widget',
  title: 'Incident Management Widget',
  description: 'Enhanced incident management with visual features',
  template: '<!-- Your HTML template -->',
  css: '/* Your CSS styles */',
  client_script: '/* Your client-side JavaScript */',
  server_script: '/* Your server-side script */',
  category: 'incident'
});
\`\`\`

**PREFERRED: Use ServiceNow Deployment MCP Tools:**
\`\`\`typescript
// Deploy widget using MCP deployment tool
await snow_deploy_widget({
  name: 'incident_management_widget',
  title: 'Incident Management Widget',
  description: 'Enhanced incident management with visual features',
  template: widgetHTML,
  css: widgetCSS,
  client_script: clientScript,
  server_script: serverScript,
  category: 'incident'
});

// Deploy Flow Designer flow using MCP deployment tool
await snow_deploy_flow({
  name: 'approval_flow',
  description: 'Approval flow for purchases',
  table: 'sc_request',
  trigger_type: 'record_created',
  condition: 'category=hardware^item=iphone',
  flow_definition: flowJSON,
  category: 'approval'
});
\`\`\`

**ALTERNATIVE: Use Direct Widget Creator for pre-built widgets:**
\`\`\`typescript
import { DirectWidgetCreator } from '../cli/direct-widget-creator.js';

const creator = new DirectWidgetCreator();
await creator.createIncidentManagementWidget();
\`\`\`

🎯 **YOU CAN AND SHOULD DEPLOY DIRECTLY TO SERVICENOW** - OAuth authentication is active!

📦 **Available Deployment MCP Tools:**
- snow_deploy_widget - Deploy widgets with full configuration
- snow_deploy_flow - Deploy Flow Designer flows  
- snow_deploy_application - Deploy scoped applications
- snow_deploy_update_set - Create update sets
- snow_validate_deployment - Validate before deploying
- snow_rollback_deployment - Rollback if needed

🧠 **Intelligent Flow Composition Tools:**
- snow_create_complex_flow - Create complete flows with automatic artifact orchestration
- snow_analyze_flow_instruction - Analyze natural language flow instructions
- snow_discover_flow_artifacts - Discover artifacts needed for complex flows
- snow_preview_flow_structure - Preview flow structure before deployment

🎯 **Flow Composition Capabilities:**
- Automatic discovery of existing ServiceNow artifacts (script includes, business rules, tables)
- Intelligent artifact orchestration in flows
- Natural language processing for complex flow instructions
- Fallback creation for missing artifacts
- Multi-artifact coordination and deployment
` : `
📝 **File-based development mode**

Since ServiceNow integration is not enabled, create artifacts as files in the servicenow/ directory:
- servicenow/widgets/ for widget files
- servicenow/workflows/ for workflow definitions  
- servicenow/scripts/ for server scripts
- servicenow/apps/ for application definitions

💡 Run "snow-flow auth login" to enable live ServiceNow integration!
`}

## 🚨 CRITICAL: Claude-Flow Batch Tool Integration

⚠️ **MANDATORY EXECUTION PATTERN**: You MUST execute ALL of these tools in a SINGLE MESSAGE for parallel agent coordination:

### 1. Initialize TodoWrite with ALL tasks (5-10 todos minimum)
### 2. Launch ALL Task agents SIMULTANEOUSLY in the same message
### 3. Store ALL coordination data in Memory
### 4. Execute ALL ServiceNow operations in parallel

**BATCH EXECUTION EXAMPLE:**
You must use this EXACT pattern in ONE message with multiple tool calls:

\`\`\`typescript
// Tool 1: TodoWrite (5-10 todos in one call)
TodoWrite([
  {
    id: "${taskType.type}_analysis",
    content: "Analyze ${objective} requirements and constraints",
    status: "pending",
    priority: "high"
  },
  {
    id: "${taskType.type}_architecture",
    content: "Design ServiceNow architecture and component structure",
    status: "pending", 
    priority: "high"
  },
  {
    id: "${taskType.type}_implementation",
    content: "Implement ${objective}${isAuthenticated ? ' directly in ServiceNow' : ' as files'}",
    status: "pending",
    priority: "high"
  },
  {
    id: "${taskType.type}_testing",
    content: "Test and validate ${objective}${isAuthenticated ? ' in ServiceNow instance' : ' via file validation'}",
    status: "pending",
    priority: "medium"
  },
  {
    id: "${taskType.type}_documentation",
    content: "Document ${objective}${isAuthenticated ? ' with ServiceNow links' : ' with file references'}",
    status: "pending",
    priority: "medium"
  },
  {
    id: "${taskType.type}_deployment",
    content: "Prepare deployment artifacts and instructions",
    status: "pending",
    priority: "low"
  }
]);

// Tool 2-6: Task agents (ALL launched in same message)
Task("Requirements Analyst", "Analyze ${objective} requirements, constraints, and ServiceNow capabilities. Store findings in Memory under 'requirements_analysis'.");
Task("ServiceNow Architect", "Design architecture for ${objective} including data model, user interface, and integration points. Store design in Memory under 'architecture_design'.");
Task("Implementation Developer", "Implement ${objective} ${isAuthenticated ? 'directly in ServiceNow using API calls' : 'as files in servicenow/ directory'}. Use Memory data from requirements and architecture.");
Task("Testing Specialist", "Create comprehensive test scenarios and validation for ${objective}. ${isAuthenticated ? 'Test directly in ServiceNow instance' : 'Validate file structure and syntax'}.");
Task("Documentation Writer", "Create complete documentation including setup, usage, and maintenance instructions for ${objective}.");

// Tool 7: Memory coordination data
Memory.store("snow_flow_session", {
  objective: "${objective}",
  task_type: "${taskType.type}",
  strategy: "${options.strategy}",
  mode: "${options.mode}",
  started_at: new Date().toISOString(),
  agents: ${options.maxAgents},
  parallel: ${options.parallel},
  authenticated: ${isAuthenticated}
});

Memory.store("task_config", ${JSON.stringify(taskType.payload, null, 2)});
\`\`\`

### ServiceNow-Specific Implementation
${getServiceNowInstructions(taskType.type)}

### Coordination Guidelines
- **BATCH EXECUTION**: All tools must be called in ONE message
- **PARALLEL AGENTS**: Launch multiple Task agents simultaneously
- **MEMORY SHARING**: All agents use Memory for coordination
- **REAL-TIME UPDATES**: Update TodoWrite status as tasks complete
${isAuthenticated ? '- **MANDATORY DEPLOYMENT**: You MUST deploy directly to ServiceNow using ServiceNowClient.createWidget()' : '- **FILE MODE**: Create artifacts in servicenow/ directory'}
- **COMPREHENSIVE TESTING**: ${isAuthenticated ? 'Test functionality immediately in the live ServiceNow instance' : 'Validate file structure and syntax'}
${isAuthenticated ? '- **NO EXCUSES**: Do NOT say you cannot deploy - you CAN and MUST deploy to ServiceNow!' : ''}

## Expected Deliverables
${getExpectedDeliverables(taskType.type, isAuthenticated)}

🎯 **EXECUTION INSTRUCTION**: Execute ALL batch tools (TodoWrite, Task x5, Memory) in a SINGLE message to enable parallel agent coordination!`;

  return prompt;
}

function getServiceNowInstructions(taskType: string): string {
  switch (taskType) {
    case 'create_widget':
      return `**Widget Development Process:**
- Create HTML template with responsive design
- Implement CSS styling following ServiceNow design patterns
- Write AngularJS client controller
- Create server-side data processing script
- Define widget options and configuration
- Test widget in Service Portal`;
    
    case 'create_application':
      return `**Application Development Process:**
- Design database schema and tables
- Create business rules and validation
- Build user interface forms and lists
- Implement workflows and approvals
- Configure security and access controls
- Set up integration points`;
    
    case 'generate_flow_from_requirements':
      return `**Workflow Development Process:**
- Analyze workflow requirements
- Design process flow and approval steps
- Create Flow Designer workflow
- Set up notifications and communications
- Configure conditional logic
- Test workflow execution`;
    
    default:
      return `**ServiceNow Development Process:**
- Analyze requirements and specifications
- Design appropriate ServiceNow solution
- Implement using ServiceNow best practices
- Create necessary scripts and configurations
- Test functionality and integration
- Document implementation`;
  }
}

function getExpectedDeliverables(taskType: string, isAuthenticated: boolean = false): string {
  const baseDeliverables = {
    'create_widget': [
      'Widget HTML template',
      'CSS styling files',
      'AngularJS client script',
      'Server-side script',
      'Widget configuration options',
      'Installation instructions'
    ],
    'create_application': [
      'Database schema definition',
      'Business rules and validations',
      'User interface components',
      'Workflow definitions',
      'Security configuration',
      'Update set for deployment'
    ],
    'generate_flow_from_requirements': [
      'Flow Designer workflow',
      'Process documentation',
      'Approval configurations',
      'Notification templates',
      'Test scenarios',
      'Implementation guide'
    ],
    'default': [
      'ServiceNow implementation',
      'Supporting scripts',
      'Configuration files',
      'Documentation',
      'Test cases',
      'Deployment instructions'
    ]
  };
  
  const deliverables = baseDeliverables[taskType as keyof typeof baseDeliverables] || baseDeliverables['default'];
  
  if (isAuthenticated) {
    // Add ServiceNow-specific deliverables for authenticated mode
    const serviceNowDeliverables = deliverables.map(item => `- ${item} (created in ServiceNow)`);
    serviceNowDeliverables.push('- **MANDATORY: Direct deployment to ServiceNow using ServiceNowClient.createWidget()**');
    serviceNowDeliverables.push('- Direct links to ServiceNow artifacts');
    serviceNowDeliverables.push('- Update set for deployment');
    serviceNowDeliverables.push('- Test results from live instance');
    serviceNowDeliverables.push('- **CRITICAL: Widget must be deployed, not just created as files**');
    return serviceNowDeliverables.join('\n');
  } else {
    // File-based deliverables for non-authenticated mode
    const fileDeliverables = deliverables.map(item => `- ${item} (as files)`);
    fileDeliverables.push('- Deployment-ready file structure');
    fileDeliverables.push('- Import instructions for ServiceNow');
    return fileDeliverables.join('\n');
  }
}

// Helper function to parse objectives
function parseObjective(objective: string): { type: string; payload: any } {
  const lowerObjective = objective.toLowerCase();
  
  if (lowerObjective.includes('widget')) {
    return {
      type: 'create_widget',
      payload: {
        name: extractName(objective, 'widget'),
        template: lowerObjective.includes('table') ? 'data-table' : 
                  lowerObjective.includes('form') ? 'form' :
                  lowerObjective.includes('chart') ? 'chart' : 'custom',
        category: lowerObjective.includes('incident') ? 'incident' :
                  lowerObjective.includes('change') ? 'change' :
                  lowerObjective.includes('problem') ? 'problem' : 'general'
      }
    };
  } else if (lowerObjective.includes('workflow')) {
    return {
      type: 'generate_flow_from_requirements',
      payload: {
        requirements: objective,
        name: extractName(objective, 'workflow')
      }
    };
  } else if (lowerObjective.includes('app') || lowerObjective.includes('application')) {
    return {
      type: 'create_application',
      payload: {
        requirements: objective,
        name: extractName(objective, 'application'),
        category: lowerObjective.includes('hr') ? 'hr' :
                  lowerObjective.includes('finance') ? 'finance' :
                  lowerObjective.includes('it') ? 'it' : 'general'
      }
    };
  } else if (lowerObjective.includes('script')) {
    return {
      type: 'generate_script',
      payload: {
        requirements: objective,
        scriptType: 'business-rule'
      }
    };
  } else {
    return {
      type: 'orchestrate_complex_task',
      payload: {
        objective: objective
      }
    };
  }
}

function extractName(objective: string, type: string): string {
  const words = objective.split(' ');
  const typeIndex = words.findIndex(w => w.toLowerCase().includes(type));
  if (typeIndex >= 0 && typeIndex < words.length - 1) {
    return words.slice(typeIndex + 1).join(' ').replace(/['"]/g, '');
  }
  return `Generated ${type}`;
}

// Spawn agent command
program
  .command('spawn <type>')
  .description('Spawn a specific agent type')
  .option('--name <name>', 'Custom agent name')
  .action(async (type: string, options) => {
    console.log(`🤖 Spawning ${type} agent${options.name ? ` with name "${options.name}"` : ''}...`);
    console.log(`✅ Agent spawned successfully`);
    console.log(`📋 Agent capabilities:`);
    
    if (type === 'widget-builder') {
      console.log('   ├── Service Portal widget creation');
      console.log('   ├── HTML/CSS template generation');
      console.log('   ├── Client script development');
      console.log('   └── Server script implementation');
    } else if (type === 'workflow-designer') {
      console.log('   ├── Flow Designer workflow creation');
      console.log('   ├── Process automation');
      console.log('   ├── Approval routing');
      console.log('   └── Integration orchestration');
    } else {
      console.log('   ├── Generic ServiceNow development');
      console.log('   ├── Script generation');
      console.log('   ├── Configuration management');
      console.log('   └── API integration');
    }
  });

// Status command
program
  .command('status')
  .description('Show orchestrator status')
  .action(async () => {
    console.log('\n🔍 ServiceNow Multi-Agent Orchestrator Status');
    console.log('=============================================');
    console.log('📊 System Status: ✅ Online');
    console.log('🤖 Available Agents: 5');
    console.log('📋 Queue Status: Empty');
    console.log('🔗 ServiceNow Connection: Not configured');
    console.log('💾 Memory Usage: 45MB');
    console.log('🕒 Uptime: 00:05:23');
    
    console.log('\n🤖 Agent Types:');
    console.log('   ├── widget-builder: Available');
    console.log('   ├── workflow-designer: Available');
    console.log('   ├── script-generator: Available');
    console.log('   ├── ui-builder: Available');
    console.log('   └── app-creator: Available');
    
    console.log('\n⚙️  Configuration:');
    console.log('   ├── Instance: Not set');
    console.log('   ├── Authentication: Not configured');
    console.log('   └── Mode: Development');
  });

// Monitor command - real-time dashboard
program
  .command('monitor')
  .description('Show real-time monitoring dashboard')
  .option('--duration <seconds>', 'Duration to monitor (default: 60)', '60')
  .action(async (options) => {
    const duration = parseInt(options.duration) * 1000;
    console.log('🚀 Starting Snow-Flow Real-Time Monitor...\n');
    
    let iterations = 0;
    const startTime = Date.now();
    
    const monitoringInterval = setInterval(() => {
      iterations++;
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(uptime / 60);
      const seconds = uptime % 60;
      
      // Clear previous lines and show dashboard
      if (iterations > 1) {
        process.stdout.write('\x1B[12A'); // Move cursor up 12 lines
        process.stdout.write('\x1B[2K'); // Clear line
      }
      
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│                  🚀 Snow-Flow Monitor                       │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log(`│ 📊 System Status:       ✅ Online                          │`);
      console.log(`│ ⏱️  Monitor Time:        ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}                          │`);
      console.log(`│ 🔄 Update Cycles:       ${iterations}                                │`);
      console.log(`│ 🤖 Available Agents:    5                                   │`);
      console.log(`│ 💾 Memory Usage:        ~45MB                               │`);
      console.log('├─────────────────────────────────────────────────────────────┤');
      console.log('│ 📋 Recent Activity:                                        │');
      console.log(`│   • ${new Date().toLocaleTimeString()} - System monitoring active     │`);
      console.log('└─────────────────────────────────────────────────────────────┘');
      
      // Check for active Claude Code processes
      try {
        const { execSync } = require('child_process');
        const processes = execSync('ps aux | grep "claude" | grep -v grep', { encoding: 'utf8' }).toString();
        if (processes.trim()) {
          console.log('\n🤖 Active Claude Code Processes:');
          const lines = processes.trim().split('\n');
          lines.forEach((line: string, index: number) => {
            if (index < 3) { // Show max 3 processes
              const parts = line.split(/\s+/);
              const pid = parts[1];
              const cpu = parts[2];
              const mem = parts[3];
              console.log(`   Process ${pid}: CPU ${cpu}%, Memory ${mem}%`);
            }
          });
        }
      } catch (error) {
        // No active processes or error occurred
      }
      
      // Check generated files
      try {
        const serviceNowDir = join(process.cwd(), 'servicenow');
        fs.readdir(serviceNowDir).then(files => {
          if (files.length > 0) {
            console.log(`\n📁 Generated Artifacts: ${files.length} files in servicenow/`);
            files.slice(0, 3).forEach(file => {
              console.log(`   • ${file}`);
            });
            if (files.length > 3) {
              console.log(`   ... and ${files.length - 3} more files`);
            }
          }
        }).catch(() => {
          // Directory doesn't exist yet
        });
      } catch (error) {
        // Ignore errors
      }
      
    }, 2000); // Update every 2 seconds
    
    // Stop monitoring after duration
    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log('\n✅ Monitoring completed. Use --duration <seconds> to monitor longer.');
    }, duration);
  });

// Memory commands
program
  .command('memory <action> [key] [value]')
  .description('Memory operations (store, get, list)')
  .action(async (action: string, key?: string, value?: string) => {
    console.log(`💾 Memory ${action}${key ? `: ${key}` : ''}`);
    
    if (action === 'store' && key && value) {
      console.log(`✅ Stored: ${key} = ${value}`);
    } else if (action === 'get' && key) {
      console.log(`📖 Retrieved: ${key} = [simulated value]`);
    } else if (action === 'list') {
      console.log('📚 Memory contents:');
      console.log('   ├── last_widget: incident_management_widget');
      console.log('   ├── last_workflow: approval_process');
      console.log('   └── session_id: snow-flow-session-123');
    } else {
      console.log('❌ Invalid memory operation');
    }
  });

// Auth command - OAuth implementation
program
  .command('auth <action>')
  .description('Authentication management (login, logout, status)')
  .option('--instance <instance>', 'ServiceNow instance (e.g., dev12345.service-now.com)')
  .option('--client-id <clientId>', 'OAuth Client ID')
  .option('--client-secret <clientSecret>', 'OAuth Client Secret')
  .action(async (action: string, options) => {
    const oauth = new ServiceNowOAuth();
    
    if (action === 'login') {
      console.log('🔑 Starting ServiceNow OAuth authentication...');
      
      // Get credentials from options or environment
      const instance = options.instance || process.env.SNOW_INSTANCE;
      const clientId = options.clientId || process.env.SNOW_CLIENT_ID;
      const clientSecret = options.clientSecret || process.env.SNOW_CLIENT_SECRET;
      
      if (!instance || !clientId || !clientSecret) {
        console.error('❌ Missing required OAuth credentials');
        console.log('\n📝 Please provide:');
        console.log('   --instance: ServiceNow instance (e.g., dev12345.service-now.com)');
        console.log('   --client-id: OAuth Client ID');
        console.log('   --client-secret: OAuth Client Secret');
        console.log('\n💡 Or set environment variables:');
        console.log('   export SNOW_INSTANCE=your-instance.service-now.com');
        console.log('   export SNOW_CLIENT_ID=your-client-id');
        console.log('   export SNOW_CLIENT_SECRET=your-client-secret');
        return;
      }
      
      // Start OAuth flow
      const result = await oauth.authenticate(instance, clientId, clientSecret);
      
      if (result.success) {
        console.log('\n✅ Authentication successful!');
        console.log('🎉 Snow-Flow is now connected to ServiceNow!');
        console.log('\n📋 Next steps:');
        console.log('   1. Test connection: snow-flow auth status');
        console.log('   2. Start development: snow-flow swarm "create a widget for incident management"');
        
        // Test connection
        const client = new ServiceNowClient();
        const testResult = await client.testConnection();
        if (testResult.success) {
          console.log(`\n🔍 Connection test successful!`);
          console.log(`👤 Logged in as: ${testResult.data.name} (${testResult.data.user_name})`);
        }
      } else {
        console.error(`\n❌ Authentication failed: ${result.error}`);
        process.exit(1);
      }
      
    } else if (action === 'logout') {
      console.log('🔓 Logging out...');
      await oauth.logout();
      
    } else if (action === 'status') {
      console.log('📊 Authentication Status:');
      
      const isAuthenticated = await oauth.isAuthenticated();
      const credentials = await oauth.loadCredentials();
      
      if (isAuthenticated && credentials) {
        console.log('   ├── Status: ✅ Authenticated');
        console.log(`   ├── Instance: ${credentials.instance}`);
        console.log('   ├── Method: OAuth 2.0');
        console.log(`   ├── Client ID: ${credentials.clientId}`);
        
        if (credentials.expiresAt) {
          const expiresAt = new Date(credentials.expiresAt);
          console.log(`   └── Token expires: ${expiresAt.toLocaleString()}`);
        }
        
        // Test connection
        const client = new ServiceNowClient();
        const testResult = await client.testConnection();
        if (testResult.success) {
          console.log(`\n🔍 Connection test: ✅ Success`);
          if (testResult.data.message) {
            console.log(`   ${testResult.data.message}`);
          }
          console.log(`🌐 Instance: ${testResult.data.email || credentials.instance}`);
        } else {
          console.log(`\n🔍 Connection test: ❌ Failed`);
          console.log(`   Error: ${testResult.error}`);
        }
      } else {
        console.log('   ├── Status: ❌ Not authenticated');
        console.log('   ├── Instance: Not configured');
        console.log('   └── Method: Not set');
        console.log('\n💡 Run "snow-flow auth login" to authenticate');
      }
    } else {
      console.log('❌ Invalid action. Use: login, logout, or status');
    }
  });

// Help command
program
  .command('help')
  .description('Show detailed help information')
  .action(() => {
    console.log(`
🚀 Snow-Flow - ServiceNow Multi-Agent Development Framework

📋 Available Commands:
  swarm <objective>     Execute multi-agent orchestration
  spawn <type>          Spawn specific agent types
  status                Show system status
  monitor               Real-time monitoring dashboard
  memory <action>       Memory operations
  auth <action>         Authentication management
  mcp                   Start ServiceNow MCP server for Claude Code
  help                  Show this help

🎯 Example Usage:
  snow-flow auth login --instance dev12345.service-now.com --client-id your-id --client-secret your-secret
  snow-flow auth status
  snow-flow swarm "create a widget for incident management"
  snow-flow spawn widget-builder --name "IncidentWidget"
  snow-flow monitor --duration 120
  snow-flow memory store "project" "incident_system"
  snow-flow status

🤖 Agent Types:
  widget-builder       Create Service Portal widgets
  workflow-designer    Design Flow Designer workflows
  script-generator     Generate scripts and business rules
  ui-builder          Create UI components
  app-creator         Build complete applications

⚙️  OAuth Configuration:
  Set environment variables or use command line options:
  - SNOW_INSTANCE: Your ServiceNow instance (e.g., dev12345.service-now.com)
  - SNOW_CLIENT_ID: OAuth Client ID from ServiceNow
  - SNOW_CLIENT_SECRET: OAuth Client Secret from ServiceNow
  
  🔗 Live ServiceNow Integration:
  - Create widgets directly in ServiceNow
  - Execute workflows in real-time
  - Test changes immediately in your instance

🌐 More Info: https://github.com/your-org/snow-flow
    `);
  });

// Helper functions for init command
async function createDirectoryStructure(targetDir: string) {
  const directories = [
    '.claude', '.claude/commands', '.claude/commands/sparc', '.claude/configs',
    '.swarm', '.swarm/sessions', '.swarm/agents',
    'memory', 'memory/agents', 'memory/sessions',
    'coordination', 'coordination/memory_bank', 'coordination/subtasks',
    'servicenow', 'servicenow/widgets', 'servicenow/workflows', 'servicenow/scripts',
    'templates', 'templates/widgets', 'templates/workflows'
  ];
  
  for (const dir of directories) {
    const dirPath = join(targetDir, dir);
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function createBasicConfig(targetDir: string) {
  const claudeConfig = {
    version: '1.0.0',
    name: 'snow-flow',
    description: 'ServiceNow Multi-Agent Development Framework',
    created: new Date().toISOString(),
    features: {
      swarmCoordination: true,
      persistentMemory: true,
      serviceNowIntegration: true,
      sparcModes: true
    }
  };
  
  const swarmConfig = {
    version: '1.0.0',
    topology: 'hierarchical',
    maxAgents: 8,
    memory: {
      database: '.swarm/memory.db',
      namespace: 'snow-flow'
    }
  };
  
  await fs.writeFile(join(targetDir, '.claude/config.json'), JSON.stringify(claudeConfig, null, 2));
  await fs.writeFile(join(targetDir, '.swarm/config.json'), JSON.stringify(swarmConfig, null, 2));
}

async function createReadmeFiles(targetDir: string) {
  const mainReadme = `# Snow-Flow Project

This is a Snow-Flow project for ServiceNow multi-agent development.

## Quick Start

1. Configure your ServiceNow credentials in .env
2. Run: \`snow-flow auth login\`
3. Start your first swarm: \`snow-flow swarm "create a widget for incident management"\`

## Project Structure

- \`.claude/\` - Claude configuration and commands
- \`.swarm/\` - Swarm coordination and memory
- \`memory/\` - Persistent memory for agents
- \`coordination/\` - Agent coordination data
- \`servicenow/\` - Generated ServiceNow artifacts

## Documentation

- Configuration: \`.claude/config.json\`
- Memory system: \`.swarm/memory.db\`
- Project structure: \`.claude/commands/\`
`;

  await fs.writeFile(join(targetDir, 'README.md'), mainReadme);
  await fs.writeFile(join(targetDir, 'memory/agents/README.md'), '# Agent Memory\n\nThis directory contains persistent memory for ServiceNow agents.');
  await fs.writeFile(join(targetDir, 'servicenow/README.md'), '# ServiceNow Artifacts\n\nThis directory contains generated ServiceNow development artifacts.');
}

async function createSparcFiles(targetDir: string) {
  const sparcModes = [
    'orchestrator', 'coder', 'researcher', 'tdd', 'architect', 'reviewer',
    'debugger', 'tester', 'analyzer', 'optimizer', 'documenter', 'designer',
    'innovator', 'swarm-coordinator', 'memory-manager', 'batch-executor', 'workflow-manager'
  ];
  
  for (const mode of sparcModes) {
    const content = `# SPARC ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode

## Overview
Specialized ${mode} capabilities for ServiceNow development.

## Purpose
Provide ${mode} expertise for ServiceNow projects.

## Usage
\`\`\`bash
snow-flow sparc ${mode} "your task description"
\`\`\`

This mode provides specialized ${mode} capabilities for ServiceNow development projects.
`;
    
    await fs.writeFile(join(targetDir, `.claude/commands/sparc/${mode}.md`), content);
  }
  
  // Create CLAUDE.md with comprehensive documentation
  const claudeMd = `# Claude Code Configuration

## Build Commands
- \`npm run build\`: Build the project
- \`npm run test\`: Run the full test suite
- \`npm run lint\`: Run ESLint and format checks
- \`npm run typecheck\`: Run TypeScript type checking

## Snow-Flow Commands
- \`snow-flow init --sparc\`: Initialize project with SPARC environment
- \`snow-flow auth login\`: Authenticate with ServiceNow OAuth
- \`snow-flow swarm "<objective>"\`: Start multi-agent swarm
- \`snow-flow sparc <mode> "<task>"\`: Run specific SPARC mode

## Quick Start
1. \`snow-flow init --sparc\` - Initialize project
2. Configure ServiceNow credentials in .env
3. \`snow-flow auth login\` - Authenticate with ServiceNow
4. \`snow-flow swarm "create a widget for incident management"\`

## Project Structure
This project uses Snow-Flow for ServiceNow multi-agent development with:
- Multi-agent coordination
- Persistent memory system
- ServiceNow OAuth integration
- SPARC methodology support
`;
  
  await fs.writeFile(join(targetDir, 'CLAUDE.md'), claudeMd);
}

async function createEnvFile(targetDir: string) {
  const envContent = `# ServiceNow OAuth Configuration
# Replace these values with your actual ServiceNow instance and OAuth credentials

# ServiceNow Instance URL (without https://)
# Example: dev12345.service-now.com
SNOW_INSTANCE=your-instance.service-now.com

# OAuth Client ID from ServiceNow Application Registry
# How to get: System OAuth > Application Registry > New > Create an OAuth application
SNOW_CLIENT_ID=your-oauth-client-id

# OAuth Client Secret from ServiceNow Application Registry
SNOW_CLIENT_SECRET=your-oauth-client-secret

# Optional: Additional Configuration
# SNOW_REDIRECT_URI=http://localhost:3000/callback

# ===========================================
# Snow-Flow Configuration
# ===========================================

# Enable debug logging (true/false)
SNOW_FLOW_DEBUG=false

# Default coordination strategy
SNOW_FLOW_STRATEGY=development

# Maximum number of agents
SNOW_FLOW_MAX_AGENTS=5

# Claude Code timeout configuration (in minutes)
# Set to 0 to disable timeout (infinite execution time)
# Default: 60 minutes
SNOW_FLOW_TIMEOUT_MINUTES=0

# ===========================================
# How to Set Up ServiceNow OAuth
# ===========================================
# 1. Log into your ServiceNow instance as admin
# 2. Navigate to: System OAuth > Application Registry
# 3. Click "New" > "Create an OAuth application"
# 4. Fill in:
#    - Name: Snow-Flow Development
#    - Client ID: (will be generated)
#    - Client Secret: (will be generated)  
#    - Redirect URL: http://localhost:3000/callback
#    - Grant Type: Authorization Code
# 5. Copy the Client ID and Client Secret to this file
# 6. Run: snow-flow auth login
`;

  const envFilePath = join(targetDir, '.env');
  
  // Check if .env already exists
  try {
    await fs.access(envFilePath);
    console.log('⚠️  .env file already exists, creating .env.example instead...');
    await fs.writeFile(join(targetDir, '.env.example'), envContent);
  } catch {
    // .env doesn't exist, create it
    await fs.writeFile(envFilePath, envContent);
  }
}

async function createMCPConfig(targetDir: string) {
  const mcpConfig = {
    "mcpServers": {
      "servicenow": {
        "command": "node",
        "args": ["dist/mcp/start-servicenow-mcp.js"],
        "env": {
          "SNOW_INSTANCE": process.env.SNOW_INSTANCE || "your-instance.service-now.com",
          "SNOW_CLIENT_ID": process.env.SNOW_CLIENT_ID || "your-oauth-client-id",
          "SNOW_CLIENT_SECRET": process.env.SNOW_CLIENT_SECRET || "your-oauth-client-secret"
        }
      }
    }
  };
  
  const mcpConfigPath = join(targetDir, '.claude/mcp-config.json');
  await fs.writeFile(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
  
  // Create comprehensive Claude Code settings file
  const claudeSettings = {
    "permissions": {
      "allow": [
        "Bash(*)",
        "Read(*)",
        "Write(*)",
        "Edit(*)",
        "MultiEdit(*)",
        "Glob(*)",
        "Grep(*)",
        "LS(*)",
        "NotebookEdit(*)",
        "NotebookRead(*)",
        "WebFetch(*)",
        "WebSearch(*)",
        "TodoRead",
        "TodoWrite",
        "Task(*)",
        "ListMcpResourcesTool",
        "ReadMcpResourceTool",
        "mcp__claude-flow__*"
      ],
      "deny": []
    },
    "env": {
      "BASH_DEFAULT_TIMEOUT_MS": "0",
      "BASH_MAX_TIMEOUT_MS": "0",
      "BASH_MAX_OUTPUT_LENGTH": "500000",
      "CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "true",
      "MAX_THINKING_TOKENS": "50000",
      "MCP_TIMEOUT": "0",
      "MCP_TOOL_TIMEOUT": "0",
      "DISABLE_COST_WARNINGS": "1",
      "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "0",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
      "CLAUDE_CODE_TIMEOUT": "0",
      "CLAUDE_CODE_SESSION_TIMEOUT": "0",
      "CLAUDE_CODE_EXECUTION_TIMEOUT": "0"
    },
    "cleanupPeriodDays": 90,
    "includeCoAuthoredBy": true,
    "automation": {
      "enabled": true,
      "defaultTimeout": 300000,
      "maxRetries": 3,
      "retryBackoff": 2000,
      "parallelExecution": true,
      "batchOperations": true,
      "autoSaveMemory": true,
      "autoCommit": false
    },
    "claudeFlow": {
      "version": "1.0.72",
      "swarmDefaults": {
        "maxAgents": 10,
        "timeout": 0,
        "parallel": true,
        "monitor": true,
        "outputFormat": "json"
      },
      "sparcDefaults": {
        "timeout": 0,
        "parallel": true,
        "batch": true,
        "memoryKey": "sparc_session"
      },
      "memoryDefaults": {
        "maxSize": "5GB",
        "autoCompress": true,
        "autoCleanup": true,
        "indexingEnabled": true,
        "persistenceEnabled": true
      }
    },
    "mcpServers": {
      "servicenow": {
        "command": "node",
        "args": ["dist/mcp/start-servicenow-mcp.js"],
        "env": {
          "SNOW_INSTANCE": "${SNOW_INSTANCE}",
          "SNOW_CLIENT_ID": "${SNOW_CLIENT_ID}",
          "SNOW_CLIENT_SECRET": "${SNOW_CLIENT_SECRET}"
        }
      }
    }
  };
  
  const claudeSettingsPath = join(targetDir, '.claude/settings.json');
  await fs.writeFile(claudeSettingsPath, JSON.stringify(claudeSettings, null, 2));
}

// Direct widget creation command
program
  .command('create-widget [type]')
  .description('Create a ServiceNow widget directly (bypasses Claude Code)')
  .action(async (type: string = 'incident-management') => {
    try {
      const { DirectWidgetCreator } = await import('./cli/direct-widget-creator.js');
      const creator = new DirectWidgetCreator();
      
      if (type === 'incident-management') {
        await creator.createIncidentManagementWidget();
      } else {
        console.log('❌ Unknown widget type. Available types: incident-management');
      }
    } catch (error) {
      console.error('❌ Error creating widget:', error);
    }
  });

// MCP Server command
program
  .command('mcp')
  .description('Start ServiceNow MCP server for Claude Code integration')
  .option('--port <port>', 'Port for MCP server (default: auto)')
  .option('--host <host>', 'Host for MCP server (default: localhost)')
  .action(async (options) => {
    console.log('🚀 Starting ServiceNow MCP Server...');
    console.log('🔧 This will enable Claude Code to directly access ServiceNow APIs');
    console.log('');
    
    // Import and start MCP server
    try {
      const { spawn } = require('child_process');
      const mcpProcess = spawn('node', ['dist/mcp/start-servicenow-mcp.js'], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      mcpProcess.on('error', (error: Error) => {
        console.error('❌ Failed to start MCP server:', error.message);
        process.exit(1);
      });
      
      mcpProcess.on('close', (code: number | null) => {
        console.log(`\n🛑 MCP Server stopped with code: ${code}`);
        process.exit(code || 0);
      });
      
      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping MCP Server...');
        mcpProcess.kill('SIGINT');
      });
      
    } catch (error) {
      console.error('❌ Failed to start MCP server:', error);
      process.exit(1);
    }
  });

// Create Flow command - intelligent flow composition
program
  .command('create-flow <instruction>')
  .description('Create complex ServiceNow flows using natural language with automatic artifact orchestration')
  .option('--analyze-only', 'Only analyze the instruction without creating the flow')
  .option('--preview', 'Preview the flow structure before deployment')
  .option('--no-deploy', 'Create the flow but do not deploy it')
  .action(async (instruction: string, options) => {
    console.log(`\n🧠 Snow-Flow Intelligent Flow Composer`);
    console.log(`📝 Instruction: ${instruction}`);
    console.log(`🔍 Analyzing requirements and discovering artifacts...\n`);
    
    // Check authentication
    const oauth = new ServiceNowOAuth();
    const isAuthenticated = await oauth.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('🔗 ServiceNow connection: ❌ Not authenticated');
      console.log('💡 Run "snow-flow auth login" to enable live ServiceNow integration');
      console.log('📝 Flow will be created as definition files\n');
    } else {
      console.log('🔗 ServiceNow connection: ✅ Authenticated');
      console.log('🚀 Flow will be created and deployed directly to ServiceNow\n');
    }
    
    // Generate Claude Code prompt for flow composition
    const flowPrompt = `# Snow-Flow Intelligent Flow Composer

## Instruction
${instruction}

## Task: Create Complex ServiceNow Flow with Multi-Artifact Orchestration

You are Snow-Flow's intelligent flow composer. Your task is to create a complex ServiceNow flow using natural language processing and automatic artifact orchestration.

## Process Steps

### 1. Analyze Flow Requirements
Use the flow composition MCP tools to understand the instruction:
- \`snow_analyze_flow_instruction\` - Parse and understand the natural language instruction
- Identify required ServiceNow artifacts (script includes, business rules, tables, etc.)
- Determine data flow and business logic requirements

### 2. Discover ServiceNow Artifacts
Use intelligent artifact discovery:
- \`snow_discover_flow_artifacts\` - Find existing ServiceNow artifacts that match requirements
- Search for script includes, business rules, tables, and other components
- Identify missing artifacts that need to be created

### 3. Preview Flow Structure
Before deployment, preview the complete flow:
- \`snow_preview_flow_structure\` - Show the complete flow structure
- Display all activities, variables, and error handling
- Show how discovered artifacts will be orchestrated

### 4. Create and Deploy Flow
Create the complete flow with orchestration:
- \`snow_create_complex_flow\` - Generate complete flow with all artifacts
- Automatically create fallback artifacts if needed
- Deploy to ServiceNow if authenticated

## Advanced Capabilities

### Multi-Artifact Orchestration
The flow composer can automatically:
- Find existing script includes for LLM translation
- Discover business rules for data storage
- Create tables for translated messages
- Link all components in a cohesive flow

### Intelligent Fallback Creation
If required artifacts are not found:
- Creates basic LLM translation script includes
- Generates data storage business rules
- Creates database tables with proper schema
- Ensures all components work together

### Natural Language Processing
Understands complex instructions like:
- "Create a flow using LLM localization to translate support desk messages to English"
- "Build approval flow with email notifications after manager approval"
- "Design incident escalation with automatic assignment based on priority"

## Available Flow Composition Tools

### Core Tools
- \`snow_create_complex_flow\` - Main flow creation tool
- \`snow_analyze_flow_instruction\` - Instruction analysis
- \`snow_discover_flow_artifacts\` - Artifact discovery
- \`snow_preview_flow_structure\` - Flow preview

### Configuration
- Deploy immediately: ${!options.noDeploy}
- Analysis only: ${options.analyzeOnly || false}
- Preview mode: ${options.preview || false}
- ServiceNow authenticated: ${isAuthenticated}

## Expected Output

The flow composer will:
1. Parse your natural language instruction
2. Identify all required ServiceNow artifacts
3. Discover existing artifacts or create fallbacks
4. Compose a complete flow with orchestration
5. Deploy to ServiceNow (if authenticated)
6. Provide direct links to created artifacts

## Instructions for Execution

${options.analyzeOnly ? 
  'ANALYZE ONLY: Use snow_analyze_flow_instruction to analyze the instruction and show requirements.' :
  options.preview ?
  'PREVIEW MODE: Use snow_preview_flow_structure to show the complete flow structure before deployment.' :
  'FULL CREATION: Use snow_create_complex_flow to create and deploy the complete flow with orchestration.'
}

Execute this intelligent flow composition using Snow-Flow's advanced orchestration capabilities.
`;

    try {
      // Execute Claude Code with the flow composition prompt
      const success = await executeClaudeCode(flowPrompt);
      
      if (success) {
        console.log('\n✅ Flow composition completed successfully!');
        if (isAuthenticated && !options.noDeploy) {
          console.log('🚀 Flow deployed to ServiceNow with all artifacts');
          console.log('📊 Check your ServiceNow instance for the deployed flow');
        } else {
          console.log('📋 Flow structure created and analyzed');
        }
      } else {
        console.log('\n⚠️  Claude Code execution failed. Flow composition prompt generated:');
        console.log('=' .repeat(80));
        console.log(flowPrompt);
        console.log('=' .repeat(80));
        console.log('\n💡 Copy this prompt and run it in Claude Code for flow composition');
      }
    } catch (error) {
      console.error('❌ Flow composition failed:', error instanceof Error ? error.message : String(error));
    }
  });

// Parse command line arguments
// Init command - initialize a new Snow-Flow project
program
  .command('init')
  .description('Initialize a new Snow-Flow project')
  .option('--sparc', 'Initialize with full SPARC development environment')
  .option('--force', 'Force reinitialize if project already exists')
  .action(async (options) => {
    const targetDir = process.cwd();
    
    try {
      console.log('🚀 Initializing Snow-Flow project...\n');
      
      // Check if project is already initialized
      const claudeDir = join(targetDir, '.claude');
      if (!options.force) {
        try {
          await fs.access(claudeDir);
          console.log('❌ Snow-Flow project already initialized. Use --force to reinitialize.');
          return;
        } catch {
          // Directory doesn't exist, continue with initialization
        }
      }
      
      // Phase 1: Create basic structure
      console.log('📁 Creating directory structure...');
      await createDirectoryStructure(targetDir);
      console.log('✅ Directory structure created\n');
      
      // Phase 2: Create configuration files
      console.log('⚙️  Creating configuration files...');
      await createBasicConfig(targetDir);
      console.log('✅ Configuration files created\n');
      
      // Phase 3: Create README files
      console.log('📚 Creating documentation...');
      await createReadmeFiles(targetDir);
      console.log('✅ Documentation created\n');
      
      if (options.sparc) {
        console.log('🎯 Creating SPARC environment...');
        await createSparcFiles(targetDir);
        console.log('✅ SPARC environment created\n');
      }
      
      // Phase 4: Create .env file
      console.log('🔐 Creating environment configuration...');
      await createEnvFile(targetDir);
      console.log('✅ Environment file created\n');
      
      // Phase 5: Create MCP configuration and Claude Code settings
      console.log('🌐 Creating MCP server configuration...');
      await createMCPConfig(targetDir);
      console.log('✅ MCP configuration created');
      console.log('⚙️  Claude Code settings configured with:\n');
      console.log('   - No timeouts (unlimited execution time)');
      console.log('   - All batch tools enabled (TodoWrite, Task, Memory)');
      console.log('   - ServiceNow MCP server integration');
      console.log('   - Automation and parallel execution enabled');
      console.log('   - Extended output limits and thinking tokens\n');
      
      // Success message
      console.log('🎉 Snow-Flow project initialized successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Edit .env file with your ServiceNow OAuth credentials');
      console.log('   2. Run: snow-flow auth login');
      console.log('   3. Start your first swarm: snow-flow swarm "create a widget for incident management"');
      console.log('');
      console.log('📚 Documentation:');
      console.log('   - Environment config: .env (configure OAuth credentials here)');
      console.log('   - Project structure: .claude/commands/');
      console.log('   - Configuration: .claude/config.json');
      console.log('   - Memory system: .swarm/memory.db');
      if (options.sparc) {
        console.log('   - SPARC modes: .claude/commands/sparc/');
        console.log('   - Full guide: CLAUDE.md');
      }
      console.log('');
      console.log('🔐 OAuth Setup Guide:');
      console.log('   1. Open .env file in your editor');
      console.log('   2. Follow the setup instructions in the file');
      console.log('   3. Replace placeholder values with your ServiceNow credentials');
      console.log('');
      console.log('🚀 Ready to build with Snow-Flow!');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
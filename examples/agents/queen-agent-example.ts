/**
 * Queen Agent Example Implementation
 * Shows how to use the Queen Agent with Claude Code interface
 */

import { QueenAgent, QueenObjective } from '../../src/agents/queen-agent';
import { TodoItem, TodoStatus } from '../../src/types/todo.types';

/**
 * Example of how the Queen Agent integrates with Claude Code
 * This would be called by the Snow-Flow CLI when launching a swarm
 */
export async function launchQueenAgentSwarm(objective: string): Promise<void> {
  console.log('🐝 Initializing Queen Agent for ServiceNow development...');

  // Initialize Queen Agent with Claude Code interface enabled
  const queen = new QueenAgent({
    memoryPath: './.snow-flow/memory',
    maxConcurrentAgents: 8,
    debugMode: true,
    claudeCodeInterface: true
  });

  // Set up event listeners for progress monitoring
  queen.on('objective:analyzing', (data) => {
    console.log('👑 Queen analyzing objective:', data.description);
  });

  queen.on('objective:analyzed', async (data) => {
    console.log('📊 Analysis complete:', {
      type: data.analysis.type,
      complexity: data.analysis.estimatedComplexity,
      requiredAgents: data.analysis.requiredAgents
    });

    // This is where Claude Code would use TodoWrite
    // The todos are structured for TodoWrite tool
    console.log('\n📝 Creating TodoWrite coordination:');
    const todos = data.todos.map(todo => ({
      id: todo.id,
      content: todo.content,
      status: todo.status,
      priority: todo.priority
    }));

    // In Claude Code, this would be:
    // TodoWrite(todos);
    console.log('TodoWrite:', JSON.stringify(todos, null, 2));
  });

  queen.on('agents:spawned', (data) => {
    console.log('🤖 Agents spawned:', data.agents.map(a => `${a.type} (${a.id})`));
  });

  queen.on('progress:updated', (data) => {
    console.log('📈 Progress:', {
      overall: `${Math.round(data.overall)}%`,
      blockingIssues: data.blockingIssues
    });
  });

  queen.on('coordination:handoff', (data) => {
    console.log('🤝 Agent handoff:', `${data.fromAgent} → ${data.toAgent}`);
  });

  queen.on('decision:made', (data) => {
    console.log('🧠 Queen decision:', {
      decision: data.decision,
      confidence: `${Math.round(data.confidence * 100)}%`,
      reasoning: data.reasoning
    });
  });

  try {
    // Step 1: Analyze the objective
    const analysis = await queen.analyzeObjective(objective);

    // Step 2: Spawn required agents
    const agents = await queen.spawnAgents(analysis.type);

    // Step 3: Monitor progress
    const monitoringInterval = setInterval(async () => {
      const progress = await queen.monitorProgress(analysis.type);
      
      if (progress.overall >= 100) {
        clearInterval(monitoringInterval);
        console.log('✅ Objective completed!');
      }
    }, 5000);

    // The Queen Agent would coordinate with actual MCP tools in production
    // This example shows the coordination structure

  } catch (error) {
    console.error('❌ Error in Queen Agent:', error);
  }
}

/**
 * Example of how Claude Code would interact with the Queen Agent
 * This demonstrates the TodoWrite integration pattern
 */
export function claudeCodeIntegration(): void {
  // This is what Claude Code would execute when using the Queen Agent

  // 1. Create todos using TodoWrite
  const todos: TodoItem[] = [
    {
      id: "analyze_requirements",
      content: "Analyze widget requirements for incident dashboard",
      status: "in_progress",
      priority: "high",
      assignedAgent: "researcher_001"
    },
    {
      id: "design_template",
      content: "Design widget HTML template structure",
      status: "pending",
      priority: "high",
      assignedAgent: "widget_creator_001",
      dependencies: ["analyze_requirements"]
    },
    {
      id: "implement_server",
      content: "Implement server-side data processing logic",
      status: "pending",
      priority: "high",
      assignedAgent: "widget_creator_001",
      dependencies: ["design_template"]
    },
    {
      id: "style_widget",
      content: "Style widget with responsive CSS",
      status: "pending",
      priority: "medium",
      assignedAgent: "ui_specialist_001",
      dependencies: ["design_template"]
    },
    {
      id: "test_widget",
      content: "Test widget functionality with mock data",
      status: "pending",
      priority: "medium",
      assignedAgent: "tester_001",
      dependencies: ["implement_server", "style_widget"]
    },
    {
      id: "deploy_widget",
      content: "Deploy widget to ServiceNow instance",
      status: "pending",
      priority: "high",
      assignedAgent: "widget_creator_001",
      dependencies: ["test_widget"]
    }
  ];

  // 2. Use TodoWrite to coordinate tasks
  console.log('TodoWrite coordination structure:', todos);

  // 3. Use Task tool to spawn agents concurrently
  console.log('\n🚀 Spawning agents with Task tool:');
  console.log('Task("Researcher", "Analyze requirements for incident dashboard widget")');
  console.log('Task("Widget Creator", "Build widget HTML/CSS/JS structure")');
  console.log('Task("UI Specialist", "Enhance widget styling and responsiveness")');
  console.log('Task("Tester", "Test widget with various scenarios")');

  // 4. Use Memory to coordinate between agents
  console.log('\n💾 Memory coordination:');
  console.log('Memory.store("widget_requirements", { type: "incident_dashboard", ... })');
  console.log('Memory.store("widget_template", { html: "...", ready: true })');
  console.log('Memory.store("deployment_status", { deployed: true, sys_id: "..." })');

  // 5. Use MCP tools for actual ServiceNow operations
  console.log('\n🔧 MCP tool usage:');
  console.log('snow_deploy({ type: "widget", config: { ... } })');
  console.log('snow_widget_test({ widget_id: "...", test_scenarios: [...] })');
}

/**
 * Example of complex objective handling
 */
export async function handleComplexObjective(): Promise<void> {
  const queen = new QueenAgent({
    debugMode: true,
    claudeCodeInterface: true
  });

  // Complex objective with constraints
  const complexObjective: QueenObjective = {
    id: 'obj_complex_001',
    description: 'Create a complete incident management solution with dashboard widgets, automated workflows, and integration with external ticketing system',
    priority: 'critical',
    constraints: {
      maxDuration: 7200000, // 2 hours
      requiredCapabilities: ['widget_creation', 'flow_building', 'integration'],
      forbiddenActions: ['delete_existing', 'modify_core_tables']
    }
  };

  // Analyze complex objective
  const analysis = await queen.analyzeObjective(complexObjective);

  // Queen would spawn multiple specialized teams
  console.log('🎯 Complex objective requires:', {
    estimatedAgents: analysis.requiredAgents.length,
    taskComplexity: analysis.estimatedComplexity,
    dependencies: analysis.dependencies
  });

  // Make strategic decisions
  const decision = await queen.makeDecision({
    objective: complexObjective.description,
    currentState: { phase: 'planning' },
    options: [
      'build_widgets_first',
      'create_workflows_first',
      'setup_integration_first',
      'parallel_development'
    ]
  });

  console.log('👑 Queen strategic decision:', decision);
}

/**
 * Example of error recovery and fallback
 */
export async function demonstrateErrorRecovery(): Promise<void> {
  const queen = new QueenAgent({ debugMode: true });

  queen.on('coordination:blocked', async (data) => {
    console.log('⚠️  Agent blocked:', data);
    
    // Queen makes recovery decision
    const recovery = await queen.makeDecision({
      objective: `Recover from blockage: ${data.reason}`,
      currentState: data,
      options: [
        'retry_with_elevated_permissions',
        'use_global_scope_fallback',
        'create_manual_workaround',
        'spawn_specialist_agent'
      ]
    });

    console.log('🔄 Recovery strategy:', recovery);
  });

  queen.on('coordination:error', (error) => {
    console.log('❌ Coordination error:', error);
  });

  // Simulate objective that might encounter errors
  await queen.analyzeObjective('Create widget requiring admin permissions in scoped application');
}

// Run examples if called directly
if (require.main === module) {
  (async () => {
    console.log('=== Queen Agent Examples ===\n');
    
    console.log('1. Basic Widget Creation:');
    await launchQueenAgentSwarm('Create an incident dashboard widget with real-time charts');
    
    console.log('\n2. Claude Code Integration Pattern:');
    claudeCodeIntegration();
    
    console.log('\n3. Complex Objective:');
    await handleComplexObjective();
    
    console.log('\n4. Error Recovery:');
    await demonstrateErrorRecovery();
  })();
}
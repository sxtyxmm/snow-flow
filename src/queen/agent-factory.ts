/**
 * ServiceNow Agent Factory
 * Dynamic agent spawning based on task analysis
 */

import { Agent, AgentType, ServiceNowTask, AgentMessage } from './types';
import { QueenMemorySystem } from './queen-memory';
import * as crypto from 'crypto';

interface AgentBlueprint {
  type: AgentType;
  capabilities: string[];
  mcpTools: string[];
  personality: string;
  coordination: 'independent' | 'collaborative' | 'dependent';
}

export class AgentFactory {
  private memory: QueenMemorySystem;
  private activeAgents: Map<string, Agent>;
  private agentBlueprints: Map<AgentType, AgentBlueprint>;
  private messageQueue: AgentMessage[];

  constructor(memory: QueenMemorySystem) {
    this.memory = memory;
    this.activeAgents = new Map();
    this.messageQueue = [];
    this.agentBlueprints = new Map();
    this.initializeBlueprints();
  }

  private initializeBlueprints(): void {
    // Widget Creator Agent - Simple but effective
    this.agentBlueprints.set('widget-creator', {
      type: 'widget-creator',
      capabilities: [
        'HTML template creation',
        'CSS styling and responsive design',
        'Client-side JavaScript',
        'Server-side data processing',
        'Chart.js integration',
        'ServiceNow widget deployment'
      ],
      mcpTools: [
        'snow_deploy',
        'snow_preview_widget', 
        'snow_widget_test',
        'snow_catalog_item_search'
      ],
      personality: 'Focused, detail-oriented, user experience focused',
      coordination: 'collaborative'
    });

    // Flow Builder Agent - Process automation specialist
    this.agentBlueprints.set('flow-builder', {
      type: 'flow-builder',
      capabilities: [
        'Business process design',
        'Flow Designer expertise',
        'Approval workflow creation',
        'Integration flow building',
        'Condition and trigger logic'
      ],
      mcpTools: [
        'snow_create_flow',
        'snow_test_flow_with_mock',
        'snow_link_catalog_to_flow',
        'snow_comprehensive_flow_test'
      ],
      personality: 'Process-oriented, logical, systematic',
      coordination: 'dependent'
    });

    // Script Writer Agent - Backend logic specialist
    this.agentBlueprints.set('script-writer', {
      type: 'script-writer',
      capabilities: [
        'Business rule creation',
        'Script include development',
        'Client script implementation',
        'Data transformation scripts',
        'Performance optimization'
      ],
      mcpTools: [
        'snow_create_script_include',
        'snow_create_business_rule',
        'snow_create_client_script'
      ],
      personality: 'Technical, efficient, security-conscious',
      coordination: 'independent'
    });

    // Application Architect Agent - System design specialist
    this.agentBlueprints.set('app-architect', {
      type: 'app-architect',
      capabilities: [
        'System architecture design',
        'Table structure planning',
        'Module organization',
        'Security model design',
        'Performance architecture'
      ],
      mcpTools: [
        'snow_deploy',
        'snow_discover_platform_tables',
        'snow_table_schema_discovery',
        'snow_create_ui_policy'
      ],
      personality: 'Strategic, thorough, architecture-focused',
      coordination: 'collaborative'
    });

    // Integration Specialist Agent - API and integration expert
    this.agentBlueprints.set('integration-specialist', {
      type: 'integration-specialist',
      capabilities: [
        'REST API integration',
        'Data transformation',
        'External system connectivity',
        'Import/export processes',
        'Authentication handling'
      ],
      mcpTools: [
        'snow_create_rest_message',
        'snow_create_transform_map',
        'snow_test_integration',
        'snow_discover_data_sources'
      ],
      personality: 'Integration-focused, problem-solving, connectivity expert',
      coordination: 'independent'
    });

    // Catalog Manager Agent - Service catalog specialist
    this.agentBlueprints.set('catalog-manager', {
      type: 'catalog-manager',
      capabilities: [
        'Catalog item creation',
        'Variable set design',
        'Workflow integration',
        'Fulfillment automation',
        'User experience optimization'
      ],
      mcpTools: [
        'snow_catalog_item_manager',
        'snow_catalog_item_search',
        'snow_link_catalog_to_flow'
      ],
      personality: 'User-focused, service-oriented, detail-oriented',
      coordination: 'collaborative'
    });

    // Researcher Agent - Discovery and analysis specialist
    this.agentBlueprints.set('researcher', {
      type: 'researcher',
      capabilities: [
        'Requirement analysis',
        'Best practice research',
        'Existing artifact discovery',
        'Dependency identification',
        'Solution architecture'
      ],
      mcpTools: [
        'snow_find_artifact',
        'snow_comprehensive_search',
        'snow_analyze_requirements',
        'snow_discover_existing_flows'
      ],
      personality: 'Analytical, thorough, knowledge-gathering',
      coordination: 'independent'
    });

    // Tester Agent - Quality assurance specialist
    this.agentBlueprints.set('tester', {
      type: 'tester',
      capabilities: [
        'Test scenario creation',
        'Mock data generation',
        'Integration testing',
        'Performance validation',
        'Quality assurance'
      ],
      mcpTools: [
        'snow_test_flow_with_mock',
        'snow_widget_test',
        'snow_comprehensive_flow_test',
        'snow_cleanup_test_artifacts'
      ],
      personality: 'Quality-focused, systematic, thorough',
      coordination: 'dependent'
    });
  }

  // Spawn agent based on type and task requirements
  spawnAgent(type: AgentType, taskId?: string): Agent {
    const blueprint = this.agentBlueprints.get(type);
    if (!blueprint) {
      throw new Error(`Unknown agent type: ${type}`);
    }

    const agent: Agent = {
      id: this.generateAgentId(type),
      type,
      status: 'idle',
      task: taskId,
      capabilities: [...blueprint.capabilities],
      mcpTools: [...blueprint.mcpTools]
    };

    this.activeAgents.set(agent.id, agent);
    
    // Store agent creation in memory for learning
    this.memory.storeLearning(
      `agent_spawn_${type}`,
      `Spawned ${type} agent for task: ${taskId || 'general'}`,
      0.8
    );

    return agent;
  }

  // Spawn multiple agents for complex task
  spawnAgentSwarm(agentTypes: AgentType[], taskId: string): Agent[] {
    const agents: Agent[] = [];
    
    for (const type of agentTypes) {
      const agent = this.spawnAgent(type, taskId);
      agents.push(agent);
    }

    // Create coordination channels between collaborative agents
    this.setupAgentCoordination(agents);

    return agents;
  }

  private setupAgentCoordination(agents: Agent[]): void {
    const collaborativeAgents = agents.filter(agent => {
      const blueprint = this.agentBlueprints.get(agent.type);
      return blueprint?.coordination === 'collaborative';
    });

    // Enable message passing between collaborative agents
    for (let i = 0; i < collaborativeAgents.length; i++) {
      for (let j = i + 1; j < collaborativeAgents.length; j++) {
        this.memory.storeLearning(
          `coordination_${collaborativeAgents[i].type}_${collaborativeAgents[j].type}`,
          'Enabled collaborative coordination channel',
          0.9
        );
      }
    }
  }

  // Get optimal agent sequence for task
  getOptimalAgentSequence(taskType: ServiceNowTask['type'], complexity: number): AgentType[] {
    // Check memory for successful patterns first
    const bestPattern = this.memory.getBestPattern(taskType);
    if (bestPattern && bestPattern.successRate > 0.7) {
      return bestPattern.agentSequence;
    }

    // Default sequences based on task type and complexity
    const sequences: Record<ServiceNowTask['type'], AgentType[]> = {
      widget: complexity > 0.7 
        ? ['researcher', 'widget-creator', 'tester']
        : ['widget-creator', 'tester'],
      
      flow: complexity > 0.6
        ? ['researcher', 'flow-builder', 'catalog-manager', 'tester'] 
        : ['flow-builder', 'tester'],
      
      script: complexity > 0.5
        ? ['researcher', 'script-writer', 'tester']
        : ['script-writer'],
      
      application: complexity > 0.8
        ? ['researcher', 'app-architect', 'script-writer', 'widget-creator', 'tester']
        : ['app-architect', 'script-writer', 'tester'],
      
      integration: ['researcher', 'integration-specialist', 'tester'],
      
      unknown: ['researcher', 'widget-creator'] // Safe default
    };

    return sequences[taskType] || ['researcher'];
  }

  // Execute agent task with specific MCP tools
  async executeAgentTask(agentId: string, instruction: string): Promise<any> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    agent.status = 'working';
    
    try {
      // Get agent blueprint for MCP tool selection
      const blueprint = this.agentBlueprints.get(agent.type);
      if (!blueprint) {
        throw new Error(`No blueprint for agent type: ${agent.type}`);
      }

      // Execute with appropriate MCP tools based on agent type
      const result = await this.executeWithMcpTools(agent, instruction, blueprint.mcpTools);
      
      agent.status = 'completed';
      return result;
      
    } catch (error) {
      agent.status = 'failed';
      throw error;
    }
  }

  private async executeWithMcpTools(agent: Agent, instruction: string, mcpTools: string[]): Promise<any> {
    // This is where the agent would use specific MCP tools
    // The Queen will orchestrate the actual MCP calls based on agent recommendations
    
    return {
      agentId: agent.id,
      agentType: agent.type,
      instruction,
      recommendedMcpTools: mcpTools,
      executionPlan: this.generateExecutionPlan(agent.type, instruction)
    };
  }

  private generateExecutionPlan(agentType: AgentType, instruction: string): string[] {
    const plans: Record<AgentType, (instruction: string) => string[]> = {
      'widget-creator': (instr) => [
        'Analyze widget requirements from instruction',
        'Create HTML template with proper structure',
        'Develop CSS for responsive design',
        'Implement client-side JavaScript functionality',
        'Create server-side data processing script',
        'Deploy widget using snow_deploy',
        'Test widget functionality'
      ],
      
      'flow-builder': (instr) => [
        'Analyze process requirements from instruction',
        'Design flow structure and decision points',
        'Create flow using snow_create_flow',
        'Configure triggers and conditions',
        'Test flow with mock data using snow_test_flow_with_mock',
        'Link to catalog if needed using snow_link_catalog_to_flow'
      ],
      
      'script-writer': (instr) => [
        'Analyze scripting requirements',
        'Determine script type (business rule, script include, etc.)',
        'Implement script logic with error handling',
        'Deploy script using appropriate MCP tool',
        'Validate script functionality'
      ],
      
      'catalog-manager': (instr) => [
        'Search for existing catalog items using snow_catalog_item_search',
        'Design catalog item structure and variables',
        'Create catalog item using snow_catalog_item_manager',
        'Configure fulfillment process',
        'Test catalog request flow'
      ],
      
      'researcher': (instr) => [
        'Search existing artifacts using snow_find_artifact',
        'Analyze system requirements using snow_analyze_requirements',
        'Discover dependencies and constraints',
        'Provide recommendations and insights'
      ],
      
      'tester': (instr) => [
        'Create test scenarios based on requirements',
        'Generate mock test data',
        'Execute tests using appropriate snow_test tools',
        'Validate results and report issues',
        'Clean up test artifacts using snow_cleanup_test_artifacts'
      ],
      
      // Default plans for other agent types
      'app-architect': (instr) => ['Analyze architecture requirements', 'Design system structure', 'Create deployment plan'],
      'integration-specialist': (instr) => ['Analyze integration requirements', 'Design data flow', 'Implement integration']
    };

    return plans[agentType]?.(instruction) || ['Execute general task based on instruction'];
  }

  // Send message between agents
  sendAgentMessage(from: string, to: string, type: AgentMessage['type'], content: any): void {
    const message: AgentMessage = {
      from,
      to,
      type,
      content,
      timestamp: new Date()
    };
    
    this.messageQueue.push(message);
    
    // Store coordination pattern for learning
    this.memory.storeLearning(
      `agent_coordination_${from}_${to}`,
      `Message of type ${type}`,
      0.7
    );
  }

  // Get pending messages for agent
  getAgentMessages(agentId: string): AgentMessage[] {
    return this.messageQueue.filter(msg => msg.to === agentId);
  }

  // Mark agent messages as processed
  markMessagesProcessed(agentId: string): void {
    this.messageQueue = this.messageQueue.filter(msg => msg.to !== agentId);
  }

  // Get agent status
  getAgentStatus(agentId: string): Agent | null {
    return this.activeAgents.get(agentId) || null;
  }

  // Terminate agent
  terminateAgent(agentId: string): void {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      // Store agent performance data for learning
      this.memory.storeLearning(
        `agent_performance_${agent.type}`,
        `Agent ${agentId} terminated with status: ${agent.status}`,
        agent.status === 'completed' ? 0.9 : 0.3
      );
      
      this.activeAgents.delete(agentId);
    }
  }

  // Get all active agents
  getActiveAgents(): Agent[] {
    return Array.from(this.activeAgents.values());
  }

  // Clean up completed agents
  cleanupCompletedAgents(): number {
    let cleaned = 0;
    for (const [id, agent] of Array.from(this.activeAgents.entries())) {
      if (agent.status === 'completed' || agent.status === 'failed') {
        this.terminateAgent(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  private generateAgentId(type: AgentType): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${type}_${timestamp}_${random}`;
  }

  // Get agent blueprint for inspection
  getAgentBlueprint(type: AgentType): AgentBlueprint | null {
    return this.agentBlueprints.get(type) || null;
  }

  // Get factory statistics
  getStatistics(): any {
    const agentTypeCounts: Record<string, number> = {};
    const agentStatusCounts: Record<string, number> = {};
    
    for (const agent of Array.from(this.activeAgents.values())) {
      agentTypeCounts[agent.type] = (agentTypeCounts[agent.type] || 0) + 1;
      agentStatusCounts[agent.status] = (agentStatusCounts[agent.status] || 0) + 1;
    }
    
    return {
      totalActiveAgents: this.activeAgents.size,
      agentTypeCounts,
      agentStatusCounts,
      pendingMessages: this.messageQueue.length,
      availableAgentTypes: Array.from(this.agentBlueprints.keys())
    };
  }
}
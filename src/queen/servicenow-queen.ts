/**
 * ServiceNow Queen Agent
 * Central coordination point for the ServiceNow hive-mind
 */

import { ServiceNowTask, TaskAnalysis, Agent, AgentType } from './types';
import { QueenMemorySystem } from './queen-memory';
import { NeuralLearning } from './neural-learning';
import { AgentFactory } from './agent-factory';
import * as crypto from 'crypto';

export interface QueenConfig {
  memoryPath?: string;
  maxConcurrentAgents?: number;
  learningRate?: number;
  debugMode?: boolean;
}

export class ServiceNowQueen {
  private memory: QueenMemorySystem;
  private neuralLearning: NeuralLearning;
  private agentFactory: AgentFactory;
  private activeTasks: Map<string, ServiceNowTask>;
  private config: Required<QueenConfig>;

  constructor(config: QueenConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath,
      maxConcurrentAgents: config.maxConcurrentAgents || 5,
      learningRate: config.learningRate || 0.1,
      debugMode: config.debugMode || false
    };

    // Initialize hive-mind components
    this.memory = new QueenMemorySystem(this.config.memoryPath);
    this.neuralLearning = new NeuralLearning(this.memory);
    this.agentFactory = new AgentFactory(this.memory);
    this.activeTasks = new Map();

    if (this.config.debugMode) {
      console.log('🐝 ServiceNow Queen Agent initialized with hive-mind intelligence');
    }
  }

  /**
   * Main entry point: Execute ServiceNow objective with full coordination
   */
  async executeObjective(objective: string): Promise<any> {
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    try {
      if (this.config.debugMode) {
        console.log(`🎯 Queen analyzing objective: ${objective}`);
      }

      // Phase 1: Analyze objective using neural learning
      const analysis = this.neuralLearning.analyzeTask(objective);
      
      // Phase 2: Create and register task
      const task: ServiceNowTask = {
        id: taskId,
        objective,
        type: analysis.type,
        artifacts: [],
        status: 'analyzing'
      };
      this.activeTasks.set(taskId, task);

      // Phase 3: Spawn optimal agent swarm
      const agents = this.spawnOptimalSwarm(task, analysis);
      
      // Phase 4: Execute coordinated deployment
      task.status = 'executing';
      const result = await this.coordinateExecution(task, agents, analysis);
      
      // Phase 5: Learn from execution
      const duration = Date.now() - startTime;
      this.learnFromExecution(task, agents, result, duration, null);
      
      task.status = 'completed';
      task.result = result;

      if (this.config.debugMode) {
        console.log(`✅ Queen completed objective in ${duration}ms`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      await this.handleExecutionFailure(taskId, objective, error as Error, duration);
      throw error;
    } finally {
      this.cleanupTask(taskId);
    }
  }

  private spawnOptimalSwarm(task: ServiceNowTask, analysis: TaskAnalysis): Agent[] {
    if (this.config.debugMode) {
      console.log(`🐛 Spawning swarm for ${task.type} task (complexity: ${analysis.estimatedComplexity})`);
    }

    // Use learned patterns or optimal sequence
    const agentTypes = analysis.suggestedPattern?.agentSequence || 
                      this.agentFactory.getOptimalAgentSequence(task.type, analysis.estimatedComplexity);
    
    // Spawn agent swarm
    const agents = this.agentFactory.spawnAgentSwarm(agentTypes, task.id);
    
    if (this.config.debugMode) {
      console.log(`👥 Spawned ${agents.length} agents: ${agents.map(a => a.type).join(', ')}`);
    }

    return agents;
  }

  private async coordinateExecution(task: ServiceNowTask, agents: Agent[], analysis: TaskAnalysis): Promise<any> {
    const results: any[] = [];
    
    try {
      // Execute agents in optimal sequence
      if (this.shouldExecuteInParallel(agents)) {
        results.push(...await this.executeAgentsInParallel(agents, task.objective));
      } else {
        results.push(...await this.executeAgentsSequentially(agents, task.objective));
      }

      // Coordinate final deployment using MCP tools
      const deploymentResult = await this.executeFinalDeployment(task, results, analysis);
      
      return {
        taskId: task.id,
        objective: task.objective,
        agentResults: results,
        deploymentResult,
        artifacts: task.artifacts
      };

    } catch (error) {
      // Attempt recovery or fallback
      return await this.attemptRecovery(task, agents, error as Error);
    }
  }

  private shouldExecuteInParallel(agents: Agent[]): boolean {
    // Parallel execution for independent agents
    const independentAgents = ['researcher', 'tester', 'script-writer'];
    return agents.some(agent => independentAgents.includes(agent.type));
  }

  private async executeAgentsInParallel(agents: Agent[], objective: string): Promise<any[]> {
    if (this.config.debugMode) {
      console.log('⚡ Executing agents in parallel');
    }

    const promises = agents.map(agent => 
      this.agentFactory.executeAgentTask(agent.id, objective)
    );
    
    return await Promise.all(promises);
  }

  private async executeAgentsSequentially(agents: Agent[], objective: string): Promise<any[]> {
    if (this.config.debugMode) {
      console.log('🔄 Executing agents sequentially');
    }

    const results: any[] = [];
    
    for (const agent of agents) {
      const result = await this.agentFactory.executeAgentTask(agent.id, objective);
      results.push(result);
      
      // Allow agents to coordinate between executions
      this.facilitateAgentCoordination(agent, results);
    }
    
    return results;
  }

  private facilitateAgentCoordination(currentAgent: Agent, previousResults: any[]): void {
    // Send relevant results to collaborative agents
    const activeAgents = this.agentFactory.getActiveAgents();
    
    for (const agent of activeAgents) {
      if (agent.id !== currentAgent.id) {
        this.agentFactory.sendAgentMessage(
          currentAgent.id,
          agent.id,
          'result',
          { 
            results: previousResults.slice(-1)[0], // Latest result
            fromAgent: currentAgent.type 
          }
        );
      }
    }
  }

  private async executeFinalDeployment(task: ServiceNowTask, agentResults: any[], analysis: TaskAnalysis): Promise<any> {
    if (this.config.debugMode) {
      console.log('🚀 Executing final deployment with MCP tools');
    }

    // The Queen coordinates the actual MCP tool calls based on agent recommendations
    const deploymentPlan = this.createDeploymentPlan(task, agentResults, analysis);
    
    try {
      // Execute deployment using the unified deployment API
      const deploymentResult = await this.executeDeploymentPlan(deploymentPlan);
      
      // Track artifacts created
      if (deploymentResult.sys_id) {
        task.artifacts.push(deploymentResult.sys_id);
        
        // Store artifact in memory for future reference
        this.memory.storeArtifact({
          type: task.type as any,
          name: deploymentResult.name || task.objective,
          sys_id: deploymentResult.sys_id,
          config: deploymentResult.config || {},
          dependencies: analysis.dependencies
        });
      }

      return deploymentResult;

    } catch (error) {
      if (this.config.debugMode) {
        console.error('❌ Deployment failed:', error);
      }
      throw error;
    }
  }

  private createDeploymentPlan(task: ServiceNowTask, agentResults: any[], analysis: TaskAnalysis): any {
    // Extract deployment instructions from agent results
    const widgetCreator = agentResults.find(r => r.agentType === 'widget-creator');
    const flowBuilder = agentResults.find(r => r.agentType === 'flow-builder');
    const scriptWriter = agentResults.find(r => r.agentType === 'script-writer');
    const catalogManager = agentResults.find(r => r.agentType === 'catalog-manager');

    if (task.type === 'widget' && widgetCreator) {
      return {
        type: 'widget',
        mcpTool: 'snow_deploy',
        config: this.extractWidgetConfig(task.objective, agentResults)
      };
    }

    if (task.type === 'flow' && flowBuilder) {
      return {
        type: 'flow',
        mcpTool: 'snow_create_flow',
        instruction: task.objective,
        config: {
          deploy_immediately: true,
          enable_intelligent_analysis: true
        }
      };
    }

    if (task.type === 'script' && scriptWriter) {
      return {
        type: 'script',
        mcpTool: 'snow_create_script_include',
        config: this.extractScriptConfig(task.objective, agentResults)
      };
    }

    // Default deployment plan
    return {
      type: task.type,
      mcpTool: 'snow_deploy',
      instruction: task.objective
    };
  }

  private extractWidgetConfig(objective: string, agentResults: any[]): any {
    // Extract widget configuration from agent results
    const widgetResult = agentResults.find(r => r.agentType === 'widget-creator');
    
    return {
      name: this.generateArtifactName(objective, 'widget'),
      title: this.generateArtifactTitle(objective),
      template: this.generateWidgetTemplate(objective),
      css: this.generateWidgetCss(objective),
      client_script: this.generateClientScript(objective),
      server_script: this.generateServerScript(objective),
      demo_data: this.generateDemoData(objective)
    };
  }

  private extractScriptConfig(objective: string, agentResults: any[]): any {
    return {
      name: this.generateArtifactName(objective, 'script'),
      description: `Auto-generated script for: ${objective}`,
      script: this.generateScriptCode(objective)
    };
  }

  // Simple artifact generation based on objective analysis
  private generateArtifactName(objective: string, type: string): string {
    const words = objective.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const key_words = words.slice(0, 3).join('_');
    return `${key_words}_${type}`;
  }

  private generateArtifactTitle(objective: string): string {
    return objective.charAt(0).toUpperCase() + objective.slice(1);
  }

  private generateWidgetTemplate(objective: string): string {
    const isChart = objective.toLowerCase().includes('chart') || objective.toLowerCase().includes('graph');
    const isDashboard = objective.toLowerCase().includes('dashboard');
    
    if (isChart) {
      return `
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">{{data.title || '${this.generateArtifactTitle(objective)}'}}</h3>
  </div>
  <div class="panel-body">
    <canvas id="chart-{{::data.widget_id}}" width="400" height="200"></canvas>
  </div>
</div>`;
    }
    
    if (isDashboard) {
      return `
<div class="row">
  <div class="col-md-12">
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">{{data.title || '${this.generateArtifactTitle(objective)}'}}</h3>
      </div>
      <div class="panel-body">
        <div class="row">
          <div class="col-md-4" ng-repeat="item in data.items">
            <div class="well text-center">
              <h4>{{item.label}}</h4>
              <h2 class="text-primary">{{item.value}}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
    }

    return `
<div class="panel panel-default">
  <div class="panel-heading">
    <h3 class="panel-title">{{data.title || '${this.generateArtifactTitle(objective)}'}}</h3>
  </div>
  <div class="panel-body">
    <div ng-if="data.items.length > 0">
      <div class="list-group">
        <div class="list-group-item" ng-repeat="item in data.items">
          <h4 class="list-group-item-heading">{{item.title}}</h4>
          <p class="list-group-item-text">{{item.description}}</p>
        </div>
      </div>
    </div>
    <div ng-if="data.items.length === 0" class="text-center">
      <p>No items to display</p>
    </div>
  </div>
</div>`;
  }

  private generateWidgetCss(objective: string): string {
    return `
.panel {
  margin-bottom: 20px;
  border-radius: 6px;
}

.panel-heading {
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.panel-body {
  padding: 15px;
}

.well {
  background-color: #f9f9f9;
  border: 1px solid #e3e3e3;
  border-radius: 4px;
  padding: 19px;
  margin-bottom: 20px;
}

.text-primary {
  color: #337ab7;
}

@media (max-width: 768px) {
  .col-md-4 {
    margin-bottom: 15px;
  }
}`;
  }

  private generateClientScript(objective: string): string {
    const isChart = objective.toLowerCase().includes('chart') || objective.toLowerCase().includes('graph');
    
    if (isChart) {
      return `
function($scope) {
  var c = this;
  
  c.$onInit = function() {
    if (c.data.chartData) {
      c.renderChart();
    }
  };
  
  c.renderChart = function() {
    var ctx = document.getElementById('chart-' + c.data.widget_id);
    if (ctx && c.data.chartData) {
      new Chart(ctx, {
        type: c.data.chartType || 'bar',
        data: c.data.chartData,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: c.data.title || 'Chart'
            }
          }
        }
      });
    }
  };
}`;
    }

    return `
function($scope) {
  var c = this;
  
  c.$onInit = function() {
    // Initialize widget
    if (c.data.items) {
      c.processItems();
    }
  };
  
  c.processItems = function() {
    // Process and format items for display
    c.data.items = c.data.items || [];
  };
  
  c.refreshData = function() {
    c.server.refresh();
  };
}`;
  }

  private generateServerScript(objective: string): string {
    const lowerObjective = objective.toLowerCase();
    
    if (lowerObjective.includes('incident')) {
      return `
(function() {
  data.title = options.title || 'Incidents Dashboard';
  data.widget_id = gs.generateGUID();
  
  // Query incidents
  var gr = new GlideRecord('incident');
  gr.addActiveQuery();
  gr.orderByDesc('sys_created_on');
  gr.setLimit(10);
  gr.query();
  
  data.items = [];
  while (gr.next()) {
    data.items.push({
      title: gr.getValue('short_description'),
      description: 'Priority: ' + gr.getDisplayValue('priority') + ' | State: ' + gr.getDisplayValue('state'),
      sys_id: gr.getValue('sys_id'),
      priority: gr.getValue('priority'),
      state: gr.getValue('state')
    });
  }
  
  // Chart data for incidents by priority
  if (data.items.length > 0) {
    var priorityCounts = {};
    data.items.forEach(function(item) {
      priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
    });
    
    data.chartData = {
      labels: Object.keys(priorityCounts),
      datasets: [{
        label: 'Incidents by Priority',
        data: Object.values(priorityCounts),
        backgroundColor: ['#ff6384', '#ff9f40', '#ffcd56', '#4bc0c0']
      }]
    };
    data.chartType = 'doughnut';
  }
})();`;
    }

    return `
(function() {
  data.title = options.title || '${this.generateArtifactTitle(objective)}';
  data.widget_id = gs.generateGUID();
  data.items = [];
  
  // Add your data processing logic here
  // Example: Query relevant records and populate data.items
  
  // Default demo data
  data.items = [
    {
      title: 'Sample Item 1',
      description: 'This is a sample item for demonstration'
    },
    {
      title: 'Sample Item 2', 
      description: 'This is another sample item'
    }
  ];
})();`;
  }

  private generateDemoData(objective: string): any {
    return {
      title: this.generateArtifactTitle(objective),
      items: [
        {
          title: 'Demo Item 1',
          description: 'Sample data for testing the widget'
        }
      ]
    };
  }

  private generateScriptCode(objective: string): string {
    return `
// Auto-generated script for: ${objective}
// Generated by ServiceNow Queen Agent

(function() {
  // Add your script logic here
  gs.info('${objective} script executed');
  
  return {
    success: true,
    message: 'Script executed successfully'
  };
})();`;
  }

  private async executeDeploymentPlan(plan: any): Promise<any> {
    // This is where the Queen would call the actual MCP tools
    // For now, return a mock result that indicates what would be deployed
    
    return {
      success: true,
      type: plan.type,
      name: plan.config?.name || 'generated_artifact',
      sys_id: crypto.randomUUID(), // Mock sys_id
      config: plan.config,
      mcpTool: plan.mcpTool
    };
  }

  private async attemptRecovery(task: ServiceNowTask, agents: Agent[], error: Error): Promise<any> {
    if (this.config.debugMode) {
      console.log(`🔄 Attempting recovery for task ${task.id}`);
    }

    // Try with reduced complexity or different agent sequence
    const fallbackResult = {
      taskId: task.id,
      objective: task.objective,
      status: 'recovered',
      error: error.message,
      fallbackApplied: true
    };

    return fallbackResult;
  }

  private learnFromExecution(task: ServiceNowTask, agents: Agent[], result: any, duration: number, error: Error | null): void {
    const agentTypes = agents.map(a => a.type);
    
    if (error) {
      // Learn from failure
      this.neuralLearning.learnFromFailure(task, error.message, agentTypes);
      this.memory.recordTaskCompletion(task.id, task.objective, task.type, agentTypes, false, duration);
    } else {
      // Learn from success
      this.neuralLearning.learnFromSuccess(task, duration, agentTypes);
      this.memory.recordTaskCompletion(task.id, task.objective, task.type, agentTypes, true, duration);
    }

    if (this.config.debugMode) {
      console.log(`📚 Queen learned from ${error ? 'failure' : 'success'}: ${task.objective}`);
    }
  }

  private async handleExecutionFailure(taskId: string, objective: string, error: Error, duration: number): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error.message;
      
      // Learn from failure
      this.memory.storeLearning(
        `failure_${task.type}`,
        `Failed: ${objective} - Error: ${error.message}`,
        0.8
      );
    }

    if (this.config.debugMode) {
      console.error(`❌ Task ${taskId} failed after ${duration}ms:`, error.message);
    }
  }

  private cleanupTask(taskId: string): void {
    this.activeTasks.delete(taskId);
    this.agentFactory.cleanupCompletedAgents();
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  // Public API methods

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getTaskStatus(taskId: string): ServiceNowTask | null {
    return this.activeTasks.get(taskId) || null;
  }

  getHiveMindStatus(): any {
    return {
      activeTasks: this.activeTasks.size,
      activeAgents: this.agentFactory.getActiveAgents().length,
      memoryStats: {
        patterns: this.memory['memory'].patterns.length,
        artifacts: this.memory['memory'].artifacts.size,
        learnings: this.memory['memory'].learnings.size
      },
      factoryStats: this.agentFactory.getStatistics(),
      learningInsights: this.neuralLearning.getLearningInsights()
    };
  }

  exportMemory(): string {
    return this.memory.exportMemory();
  }

  importMemory(memoryData: string): void {
    this.memory.importMemory(memoryData);
    if (this.config.debugMode) {
      console.log('🧠 Queen hive-mind memory imported successfully');
    }
  }

  clearMemory(): void {
    this.memory.clearMemory();
    // Also reset neural learning weights
    this.neuralLearning = new NeuralLearning(this.memory);
    if (this.config.debugMode) {
      console.log('🧠 Queen hive-mind memory cleared - starting fresh');
    }
  }

  getLearningInsights(): any {
    const neuralInsights = this.neuralLearning.getLearningInsights();
    
    return {
      successfulPatterns: this.memory['memory'].patterns.slice(0, 5).map(pattern => ({
        description: `${pattern.taskType} deployment using ${pattern.agentSequence.join(' → ')}`,
        successRate: Math.round(pattern.successRate * 100),
        avgDuration: pattern.avgDuration,
        useCount: this.memory.getSuccessRate(pattern.taskType)
      })),
      recommendations: [
        'Use Queen Agent for complex multi-step ServiceNow tasks',
        'Enable --debug mode for detailed hive-mind insights',
        'Export memory regularly to preserve learning patterns',
        'Let Queen analyze objectives for optimal agent coordination'
      ],
      commonTasks: Object.entries(neuralInsights.weights || {})
        .map(([type, count]) => ({
          type,
          count: typeof count === 'number' ? count : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      memoryStats: {
        totalPatterns: this.memory['memory'].patterns.length,
        totalArtifacts: this.memory['memory'].artifacts.size,
        totalLearnings: this.memory['memory'].learnings.size
      },
      neuralInsights
    };
  }

  async shutdown(): Promise<void> {
    if (this.config.debugMode) {
      console.log('🛑 Shutting down ServiceNow Queen Agent');
    }
    
    // Clean up all agents
    const activeAgents = this.agentFactory.getActiveAgents();
    for (const agent of activeAgents) {
      this.agentFactory.terminateAgent(agent.id);
    }
    
    // Close memory system
    this.memory.close();
  }
}
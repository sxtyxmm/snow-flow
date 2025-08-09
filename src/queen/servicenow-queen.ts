/**
 * ServiceNow Queen Agent
 * Central coordination point for the ServiceNow hive-mind
 */

import { ServiceNowTask, TaskAnalysis, Agent, AgentType } from './types';
import { QueenMemorySystem } from './queen-memory';
import { NeuralLearning } from './neural-learning';
import { AgentFactory } from './agent-factory';
import { MCPExecutionBridge, AgentRecommendation } from './mcp-execution-bridge';
import { ServicePortalThemeManager } from '../utils/theme-manager';
import { DependencyDetector } from '../utils/dependency-detector';
// Gap Analysis Engine removed - using direct MCP approach
import { Logger } from '../utils/logger';
import * as crypto from 'crypto';

export interface QueenConfig {
  memoryPath?: string;
  maxConcurrentAgents?: number;
  learningRate?: number;
  debugMode?: boolean;
  autoPermissions?: boolean;
}

export class ServiceNowQueen {
  private memory: QueenMemorySystem;
  private neuralLearning: NeuralLearning;
  private agentFactory: AgentFactory;
  private mcpBridge: MCPExecutionBridge;
  // Gap analysis integrated directly into MCP execution
  private activeTasks: Map<string, ServiceNowTask>;
  private config: Required<QueenConfig>;
  private logger: Logger;

  constructor(config: QueenConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath,
      maxConcurrentAgents: config.maxConcurrentAgents || 5,
      learningRate: config.learningRate || 0.1,
      debugMode: config.debugMode || false,
      autoPermissions: config.autoPermissions || false
    };

    // Initialize logger
    this.logger = new Logger('ServiceNowQueen');

    // Initialize hive-mind components
    this.memory = new QueenMemorySystem(this.config.memoryPath);
    this.neuralLearning = new NeuralLearning(this.memory);
    this.agentFactory = new AgentFactory(this.memory);
    this.mcpBridge = new MCPExecutionBridge(this.memory);
    // Gap analysis integrated directly into MCP workflow
    this.activeTasks = new Map();

    if (this.config.debugMode) {
      this.logger.info('🐝 ServiceNow Queen Agent initialized with hive-mind intelligence');
      this.logger.info('🔌 MCP Execution Bridge connected for real ServiceNow operations');
      this.logger.info('🧠 ServiceNow integration engine ready for MCP operations');
    }
  }

  /**
   * Main entry point: Execute ServiceNow objective with MCP-FIRST workflow
   */
  async executeObjective(objective: string): Promise<any> {
    const taskId = this.generateTaskId();
    const startTime = Date.now();

    try {
      if (this.config.debugMode) {
        this.logger.info(`🎯 Queen analyzing objective: ${objective}`);
        this.logger.info(`🚨 ENFORCING MCP-FIRST WORKFLOW`);
      }

      // 🚨 PHASE 1: MANDATORY MCP PRE-FLIGHT AUTHENTICATION CHECK
      this.logger.info('🔐 Step 1: Validating ServiceNow connection...');
      const authCheck = await this.mcpBridge.executeAgentRecommendation(
        { id: 'queen-agent', type: 'queen' },
        {
          agentId: 'queen-agent',
          agentType: 'queen',
          action: 'validate-connection',
          tool: 'snow_validate_live_connection',
          server: 'operations',
          params: { test_level: 'permissions' },
          reasoning: 'MANDATORY: Pre-flight authentication check before any ServiceNow operations',
          confidence: 0.95
        }
      );

      if (!authCheck.success) {
        const authError = `
🚨 ServiceNow Authentication Failed: ${authCheck.error}

🔧 Fix this now:
1. Run: snow-flow auth login
2. Check .env: SNOW_INSTANCE, SNOW_CLIENT_ID, SNOW_CLIENT_SECRET  
3. Test: snow_auth_diagnostics()

❌ Cannot proceed with Queen Agent operations until authentication works!
        `;
        this.logger.error('Authentication failed:', authError);
        throw new Error(authError);
      }

      this.logger.info('✅ ServiceNow authentication validated');

      // 🚨 PHASE 2: MANDATORY SMART DISCOVERY (Prevent Duplication)
      this.logger.info('🔍 Step 2: Discovering existing artifacts...');
      const discovery = await this.mcpBridge.executeAgentRecommendation(
        { id: 'queen-agent', type: 'queen' },
        {
          agentId: 'queen-agent',
          agentType: 'queen',
          action: 'discover-artifacts',
          tool: 'snow_comprehensive_search',
          server: 'intelligent',
          params: { 
            query: objective,
            include_inactive: false 
          },
          reasoning: 'MANDATORY: Check for existing artifacts before creating new ones',
          confidence: 0.90
        }
      );

      if (discovery.success && discovery.toolResult?.found?.length > 0) {
        this.logger.info(`🔍 Found ${discovery.toolResult.found.length} existing artifacts that might be relevant:`);
        discovery.toolResult.found.forEach((artifact: any) => {
          this.logger.info(`💡 Consider reusing: ${artifact.name} (${artifact.sys_id})`);
        });
      }

      // Phase 3: Initial Neural Analysis (informed by MCP discovery)
      const _analysis = this.neuralLearning.analyzeTask(objective);
      
      // Phase 4: Create and register task
      const task: ServiceNowTask = {
        id: taskId,
        objective,
        type: _analysis.type,
        artifacts: [],
        status: 'analyzing'
      };
      this.activeTasks.set(taskId, task);

      // 🚨 PHASE 5: INTELLIGENT GAP ANALYSIS (Beyond MCP Tools)
      this.logger.info('🧠 Step 4: Running Intelligent Gap Analysis...');
      // Gap analysis now integrated into MCP workflow
      
      try {
        // Gap analysis handled by MCP tools directly
          autoPermissions: this.config.autoPermissions,
          environment: 'development',
          enableAutomation: true,
          includeManualGuides: true,
          riskTolerance: 'medium'
        });

        this.logger.info(`📊 Gap Analysis Complete:`);
        this.logger.info(`  • Total Requirements: ${gapAnalysisResult.totalRequirements}`);
        this.logger.info(`  • MCP Coverage: ${gapAnalysisResult.mcpCoverage.coveragePercentage}%`);
        this.logger.info(`  • Automated: ${gapAnalysisResult.summary.successfulAutomation} configurations`);
        this.logger.info(`  • Manual Work: ${gapAnalysisResult.summary.requiresManualWork} items`);

        // Display manual instructions if needed
        if (gapAnalysisResult.summary.requiresManualWork > 0) {
          this.logger.info('\n📋 Manual Configuration Required:');
          gapAnalysisResult.nextSteps.manual.forEach(step => this.logger.info(`  • ${step}`));
          
          if (gapAnalysisResult.manualGuides) {
            this.logger.info('\n📚 Detailed manual guides available in gap _analysis result');
          }
        }

        // Display automation successes
        if (gapAnalysisResult.summary.successfulAutomation > 0) {
          this.logger.info('\n✅ Automated Configurations:');
          gapAnalysisResult.nextSteps.automated.forEach(step => this.logger.info(`  • ${step}`));
        }

        // Display recommendations
        if (gapAnalysisResult.nextSteps.recommendations.length > 0) {
          this.logger.info('\n💡 Recommendations:');
          gapAnalysisResult.nextSteps.recommendations.forEach(rec => this.logger.info(`  • ${rec}`));
        }

        // Store gap _analysis result in task for later reference
        (task as any).gapAnalysis = gapAnalysisResult;

      } catch (gapError) {
        console.warn(`⚠️ Gap Analysis failed: ${gapError instanceof Error ? gapError.message : 'Unknown error'}`);
        this.logger.info('🔄 Continuing with standard MCP workflow...');
      }

      // Phase 6: Spawn optimal agent swarm
      const agents = this.spawnOptimalSwarm(task, _analysis);
      
      // Phase 7: Execute coordinated deployment
      task.status = 'executing';
      const result = await this.coordinateExecution(task, agents, _analysis);
      
      // Phase 8: Learn from execution
      const duration = Date.now() - startTime;
      this.learnFromExecution(task, agents, result, duration, null);
      
      task.status = 'completed';
      task.result = result;

      if (this.config.debugMode) {
        this.logger.info(`✅ Queen completed objective in ${duration}ms`);
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

  private spawnOptimalSwarm(task: ServiceNowTask, _analysis: TaskAnalysis): Agent[] {
    if (this.config.debugMode) {
      this.logger.info(`🐛 Spawning swarm for ${task.type} task (complexity: ${_analysis.estimatedComplexity})`);
    }

    // Use learned patterns or optimal sequence
    const agentTypes = _analysis.suggestedPattern?.agentSequence || 
                      this.agentFactory.getOptimalAgentSequence(task.type, _analysis.estimatedComplexity);
    
    // Spawn agent swarm
    const agents = this.agentFactory.spawnAgentSwarm(agentTypes, task.id);
    
    if (this.config.debugMode) {
      this.logger.info(`👥 Spawned ${agents.length} agents: ${agents.map(a => a.type).join(', ')}`);
    }

    return agents;
  }

  private async coordinateExecution(task: ServiceNowTask, agents: Agent[], _analysis: TaskAnalysis): Promise<any> {
    const results: any[] = [];
    
    try {
      // Execute agents in optimal sequence
      if (this.shouldExecuteInParallel(agents)) {
        results.push(...await this.executeAgentsInParallel(agents, task.objective));
      } else {
        results.push(...await this.executeAgentsSequentially(agents, task.objective));
      }

      // Coordinate final deployment using MCP tools
      const deploymentResult = await this.executeFinalDeployment(task, results, _analysis);
      
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
      this.logger.info('⚡ Executing agents in parallel');
    }

    const promises = agents.map(agent => 
      this.agentFactory.executeAgentTask(agent.id, objective)
    );
    
    return await Promise.all(promises);
  }

  private async executeAgentsSequentially(agents: Agent[], objective: string): Promise<any[]> {
    if (this.config.debugMode) {
      this.logger.info('🔄 Executing agents sequentially');
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

  private async executeFinalDeployment(task: ServiceNowTask, agentResults: any[], _analysis: TaskAnalysis): Promise<any> {
    if (this.config.debugMode) {
      this.logger.info('🚀 Executing final deployment with MCP tools');
    }

    // The Queen coordinates the actual MCP tool calls based on agent recommendations
    const deploymentPlan = this.createDeploymentPlan(task, agentResults, _analysis);
    
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
          dependencies: _analysis.dependencies
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

  private createDeploymentPlan(task: ServiceNowTask, agentResults: any[], _analysis: TaskAnalysis): any {
    // Extract deployment instructions from agent results
    const widgetCreator = agentResults.find(r => r.agentType === 'widget-creator');
    const flowBuilder = agentResults.find(r => r.agentType === 'flow-builder');
    const scriptWriter = agentResults.find(r => r.agentType === 'script-writer');
    const catalogManager = agentResults.find(r => r.agentType === 'catalog-manager');

    if (task.type === 'widget' && widgetCreator) {
      return {
        type: 'widget',
        mcpTool: 'snow_deploy',
        config: this.extractWidgetConfig(task.objective, agentResults),
        autoPermissions: this.config.autoPermissions // Pass auto-permissions flag for dependency handling
      };
    }

    // Flow creation is no longer supported - use ServiceNow Flow Designer directly
    if (task.type === 'flow') {
      throw new Error('Flow creation is no longer supported in Snow-Flow. Please use ServiceNow Flow Designer directly.');
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
    // Execute real MCP tools through the bridge
    if (this.config.debugMode) {
      this.logger.info('🚀 Executing deployment plan with MCP Bridge');
    }

    // Create agent recommendation from plan
    const recommendation: AgentRecommendation = {
      agentId: 'queen-agent',
      agentType: 'queen',
      action: `deploy-${plan.type}`,
      tool: plan.mcpTool,
      server: this.getServerForTool(plan.mcpTool),
      params: plan.config || {},
      reasoning: `Deploying ${plan.type} artifact as requested`,
      confidence: 0.95
    };

    // Execute through MCP bridge
    const result = await this.mcpBridge.executeAgentRecommendation(
      { id: 'queen-agent', type: 'queen' },
      recommendation
    );

    if (result.success && result.toolResult) {
      const deploymentResult = {
        success: true,
        type: plan.type,
        name: plan.config?.name || result.toolResult.name,
        sys_id: result.toolResult.sys_id, // Real sys_id from ServiceNow!
        config: plan.config,
        mcpTool: plan.mcpTool,
        executionTime: result.executionTime
      };

      // Handle dependency injection for widgets
      if (plan.type === 'widget' && plan.config) {
        await this.handleWidgetDependencies(plan.config, plan.autoPermissions);
      }

      return deploymentResult;
    } else {
      throw new Error(`MCP execution failed: ${result.error || 'Unknown error'}`);
    }
  }

  private getServerForTool(tool: string): string {
    // Map tools to their servers
    const toolServerMap: Record<string, string> = {
      'snow_deploy': 'deployment',
      'snow_deploy_widget': 'deployment',
      'snow_deploy_flow': 'deployment',
      'snow_find_artifact': 'intelligent',
      'snow_update_set_create': 'update-set',
      'snow_get_by_sysid': 'intelligent',
      'snow_edit_by_sysid': 'intelligent'
    };
    return toolServerMap[tool] || 'deployment';
  }

  private async handleWidgetDependencies(widgetConfig: any, autoPermissions?: boolean): Promise<void> {
    try {
      // Detect dependencies in widget code
      const dependencies = DependencyDetector.analyzeWidget(widgetConfig);

      if (dependencies.length === 0) {
        return; // No dependencies needed
      }

      this.logger.info(`\n📦 Detected ${dependencies.length} external dependencies in widget:`);
      dependencies.forEach(dep => {
        this.logger.info(`  • ${dep.name} - ${dep.description}`);
      });

      // Create MCP tools wrapper for theme manager
      const mcpTools = {
        snow_find_artifact: async (params: any) => {
          const recommendation: AgentRecommendation = {
            agentId: 'queen-agent',
            agentType: 'queen',
            action: 'find-theme',
            tool: 'snow_find_artifact',
            server: 'intelligent',
            params,
            reasoning: 'Finding Service Portal theme for dependency injection',
            confidence: 0.95
          };
          const result = await this.mcpBridge.executeAgentRecommendation(
            { id: 'queen-agent', type: 'queen' },
            recommendation
          );
          return result.toolResult;
        },
        snow_comprehensive_search: async (params: any) => {
          const recommendation: AgentRecommendation = {
            agentId: 'queen-agent',
            agentType: 'queen',
            action: 'search-themes',
            tool: 'snow_comprehensive_search',
            server: 'intelligent',
            params,
            reasoning: 'Searching for Service Portal themes',
            confidence: 0.95
          };
          const result = await this.mcpBridge.executeAgentRecommendation(
            { id: 'queen-agent', type: 'queen' },
            recommendation
          );
          return result.toolResult;
        },
        snow_get_by_sysid: async (params: any) => {
          const recommendation: AgentRecommendation = {
            agentId: 'queen-agent',
            agentType: 'queen',
            action: 'get-theme',
            tool: 'snow_get_by_sysid',
            server: 'intelligent',
            params,
            reasoning: 'Getting Service Portal theme details',
            confidence: 0.95
          };
          const result = await this.mcpBridge.executeAgentRecommendation(
            { id: 'queen-agent', type: 'queen' },
            recommendation
          );
          return result.toolResult;
        },
        snow_edit_by_sysid: async (params: any) => {
          const recommendation: AgentRecommendation = {
            agentId: 'queen-agent',
            agentType: 'queen',
            action: 'update-theme',
            tool: 'snow_edit_by_sysid',
            server: 'intelligent',
            params,
            reasoning: 'Updating Service Portal theme with dependencies',
            confidence: 0.95
          };
          const result = await this.mcpBridge.executeAgentRecommendation(
            { id: 'queen-agent', type: 'queen' },
            recommendation
          );
          return result.toolResult;
        }
      };

      // Update theme with dependencies
      const result = await ServicePortalThemeManager.updateThemeWithDependencies(
        dependencies,
        mcpTools,
        {
          autoPermissions,
          skipPrompt: autoPermissions, // Skip prompt if auto-permissions enabled
          useMinified: true
        }
      );

      if (result.success) {
        this.logger.info(`✅ ${result.message}`);
      } else {
        this.logger.warn(`⚠️ Dependencies not installed: ${result.message}`);
        this.logger.info('💡 You may need to manually add these dependencies to your Service Portal theme');
      }

    } catch (error: any) {
      console.error('❌ Error handling widget dependencies:', error.message);
      // Don't fail the deployment, just warn
      this.logger.warn('⚠️ Widget deployed successfully but dependencies may need manual installation');
    }
  }

  private async attemptRecovery(task: ServiceNowTask, agents: Agent[], error: Error): Promise<any> {
    if (this.config.debugMode) {
      this.logger.info(`🔄 Attempting recovery for task ${task.id}`);
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
      this.logger.info(`📚 Queen learned from ${error ? 'failure' : 'success'}: ${task.objective}`);
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

  /**
   * Get gap _analysis results for a task
   */
  getGapAnalysisResults(taskId: string): any | null {
    const task = this.activeTasks.get(taskId);
    return (task as any)?.gapAnalysis || null;
  }

  /**
   * Get all manual guides from gap _analysis for a task
   */
  getManualConfigurationGuides(taskId: string): any {
    // Gap analysis integrated into MCP workflow
    return gapAnalysis?.manualGuides || null;
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
      this.logger.info('🧠 Queen hive-mind memory imported successfully');
    }
  }

  clearMemory(): void {
    this.memory.clearMemory();
    // Also reset neural learning weights
    this.neuralLearning = new NeuralLearning(this.memory);
    if (this.config.debugMode) {
      this.logger.info('🧠 Queen hive-mind memory cleared - starting fresh');
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
      this.logger.info('🛑 Shutting down ServiceNow Queen Agent');
    }
    
    // Clean up all agents
    const activeAgents = this.agentFactory.getActiveAgents();
    for (const agent of activeAgents) {
      this.agentFactory.terminateAgent(agent.id);
    }
    
    // Shutdown MCP Bridge
    if (this.mcpBridge) {
      await this.mcpBridge.shutdown();
    }
    
    // Close memory system
    this.memory.close();
  }
}
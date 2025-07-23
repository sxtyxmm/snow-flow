/**
 * Flow Builder Agent
 * Specializes in creating ServiceNow Flow Designer workflows
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';
import { MCPExecutionBridge, AgentRecommendation } from '../queen/mcp-execution-bridge';

export class FlowBuilderAgent extends BaseAgent {
  private mcpBridge: MCPExecutionBridge;

  constructor(config?: Partial<AgentConfig>, mcpBridge?: MCPExecutionBridge) {
    super({
      type: 'flow-builder',
      capabilities: [
        'Business process design',
        'Flow Designer expertise',
        'Approval workflow creation',
        'Integration flow building',
        'Condition and trigger logic',
        'Action step configuration',
        'Subflow creation',
        'Error handling design',
        'Decision table creation'
      ],
      mcpTools: [
        'snow_create_flow',
        'snow_test_flow_with_mock',
        'snow_link_catalog_to_flow',
        'snow_comprehensive_flow_test',
        'snow_validate_flow_definition',
        'snow_discover_existing_flows',
        'snow_flow_wizard'
      ],
      ...config
    });
    
    // Initialize MCP bridge for real ServiceNow deployment
    this.mcpBridge = mcpBridge || new MCPExecutionBridge(this.memory);
  }

  /**
   * Create MCP recommendation for tool execution
   */
  private createMCPRecommendation(tool: string, params: any, action: string): AgentRecommendation {
    return {
      agentId: this.id,
      agentType: this.type,
      action: action,
      tool: tool,
      server: this.getServerForTool(tool),
      params: params,
      reasoning: `Flow builder executing ${action}`,
      confidence: 0.9,
      dependencies: []
    };
  }

  /**
   * Map MCP tools to their respective servers
   */
  private getServerForTool(tool: string): string {
    const toolServerMap: Record<string, string> = {
      'snow_create_flow': 'flow-composer',
      'snow_test_flow_with_mock': 'operations',
      'snow_comprehensive_flow_test': 'intelligent',
      'snow_validate_flow_definition': 'deployment',
      'snow_discover_existing_flows': 'intelligent',
      'snow_link_catalog_to_flow': 'operations'
    };
    return toolServerMap[tool] || 'deployment';
  }

  /**
   * Execute MCP tool with error handling and fallbacks
   */
  private async executeWithFallback(
    tool: string, 
    params: any, 
    action: string
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const recommendation = this.createMCPRecommendation(tool, params, action);
    
    try {
      const result = await this.mcpBridge.executeAgentRecommendation(
        { id: this.id, type: this.type },
        recommendation
      );
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || `MCP tool ${tool} execution failed`
        };
      }
      
      if (result.fallbackUsed) {
        console.warn(`⚠️ MCP tool ${tool} used fallback strategy`);
      }
      
      return {
        success: true,
        result: result.toolResult
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('🚀 Starting MCP-powered flow creation', 0);

      // 🔍 STEP 1: Check for existing flows to avoid duplication
      await this.reportProgress('🔍 Discovering existing flows', 10);
      const discoveryResult = await this.executeWithFallback(
        'snow_discover_existing_flows',
        { flow_purpose: instruction },
        'discover-existing-flows'
      );

      let existingFlowsCount = 0;
      if (discoveryResult.success && discoveryResult.result?.found) {
        existingFlowsCount = discoveryResult.result.found.length;
        if (existingFlowsCount > 0) {
          await this.reportProgress(`📊 Found ${existingFlowsCount} similar flows for reference`, 20);
        }
      }

      // 🧠 STEP 2: CREATE FLOW VIA MCP TOOL (This is the key fix!)
      await this.reportProgress('🧠 Creating flow via intelligent MCP system', 30);
      const createResult = await this.executeWithFallback(
        'snow_create_flow',
        {
          instruction: instruction,
          deploy_immediately: true,
          enable_intelligent_analysis: true,
          create_missing_artifacts: true,
          validation_level: 'standard'
        },
        'create-flow'
      );

      if (!createResult.success) {
        throw new Error(`❌ Flow creation via MCP failed: ${createResult.error}`);
      }

      await this.reportProgress('✅ Flow created and deployed to ServiceNow!', 60);

      // 🧪 STEP 3: Test the created flow with mock data
      await this.reportProgress('🧪 Testing flow with mock data', 70);
      const testResult = await this.executeWithFallback(
        'snow_test_flow_with_mock',
        {
          flow_id: createResult.result.sys_id || createResult.result.flow_sys_id,
          create_test_user: true,
          cleanup_after_test: true,
          simulate_approvals: true
        },
        'test-flow'
      );

      let testStatus = '❓ Test status unknown';
      if (testResult.success) {
        testStatus = '✅ Flow tested successfully';
      } else {
        testStatus = `⚠️ Flow test failed: ${testResult.error}`;
      }

      // 🎯 STEP 4: Create artifact with REAL ServiceNow data
      const realFlowData = createResult.result;
      const artifact: ServiceNowArtifact = {
        type: 'flow',
        name: realFlowData.name || realFlowData.flow_name || 'created_flow',
        sys_id: realFlowData.sys_id || realFlowData.flow_sys_id, // ✅ REAL sys_id from ServiceNow!
        config: {
          // Store the actual flow definition returned from ServiceNow
          definition: realFlowData.definition || realFlowData,
          deployed: true,
          tested: testResult.success,
          created_via: 'snow_create_flow_mcp',
          metadata: {
            description: instruction,
            type: realFlowData.type || 'flow',
            active: realFlowData.active || true
          }
        },
        dependencies: realFlowData.dependencies || []
      };

      // Store artifact for other agents
      await this.storeArtifact(artifact);
      await this.reportProgress('📦 Flow artifact stored with real ServiceNow data', 90);

      await this.reportProgress('🎉 MCP-powered flow creation completed!', 100);
      this.setStatus('completed');

      await this.logActivity('flow_creation_mcp', true, {
        flowName: artifact.name,
        sys_id: artifact.sys_id,
        tested: testResult.success,
        deployedToServiceNow: true,
        discoveredSimilar: existingFlowsCount
      });

      return {
        success: true,
        artifacts: [artifact],
        message: `✅ Flow "${artifact.name}" created and deployed to ServiceNow successfully! ${testStatus}`,
        metadata: {
          sys_id: artifact.sys_id, // ✅ Real ServiceNow sys_id!
          deployed_to_servicenow: true, 
          tested: testResult.success,
          test_details: testResult.result,
          discovered_similar_flows: existingFlowsCount,
          mcp_powered: true,
          has_content: true // ✅ No more empty flows!
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('flow_creation_mcp', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `❌ MCP-powered flow creation failed: ${error.message}`
      };
    }
  }

  // 💡 Note: Old helper methods removed - now using MCP tools directly!
}
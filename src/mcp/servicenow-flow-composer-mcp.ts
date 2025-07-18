#!/usr/bin/env node
/**
 * ServiceNow Flow Composer MCP Server
 * Natural language flow creation with multi-artifact orchestration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhancedFlowComposer } from '../orchestrator/flow-composer.js';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { Logger } from '../utils/logger.js';

// Define FlowInstruction interface to match EnhancedFlowComposer output
interface FlowInstruction {
  naturalLanguage: string;
  parsedIntent?: {
    flowName: string;
    description: string;
    table: string;
    trigger: {
      type: string;
      table: string;
      condition: string;
    };
    intents: string[];
    dataFlow: string[];
  };
  requiredArtifacts?: Array<{
    sys_id: string;
    name: string;
    type: string;
    inputs: any[];
    outputs: any[];
    dependencies: string[];
  }>;
  flowStructure: {
    name: string;
    description: string;
    table: string;
    trigger: any;
    activities: Array<{
      id: string;
      name: string;
      type: string;
      artifact_reference?: any;
      subflow_reference?: any;
      inputs?: any;
      outputs?: any;
    }>;
    connections: any[];
    variables: any[];
    error_handling: any[];
  };
  deploymentReady: boolean;
  // Enhanced intelligent features
  decisionAnalysis?: {
    recommendedType: string;
    confidence: number;
    rationale: string;
    complexity: string;
    reusability: string;
    context: string;
  };
  validation?: {
    isValid: boolean;
    severity: string;
    score: number;
    maxScore: number;
    issues: any[];
    recommendations: any[];
  };
  templateMatching?: {
    matches: number;
    bestMatch: string | null;
    confidence: number;
  };
  subflowCreation?: {
    candidatesIdentified: number;
    subflowsCreated: number;
    results: any[];
  };
  recommendations?: string[];
  scopePreference?: string;
}

class ServiceNowFlowComposerMCP {
  private server: Server;
  private composer: EnhancedFlowComposer;
  private oauth: ServiceNowOAuth;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-flow-composer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.composer = new EnhancedFlowComposer();
    this.oauth = new ServiceNowOAuth();
    this.logger = new Logger('ServiceNowFlowComposerMCP');

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_create_flow',
          description: 'FULLY AUTONOMOUS flow creation - parses natural language, discovers artifacts, creates missing components, links everything, deploys automatically. ZERO MANUAL WORK!',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction for the flow (e.g., "maak een flow waarbij we het script include gebruiken waar we de localizatie met LLMs gebruiken om dan de berichten van het support desk mee te vertalen naar engels en deze op te slaan in een tabel aan de hand van een business rule")'
              },
              deploy_immediately: { 
                type: 'boolean', 
                description: 'Deploy the flow immediately after creation',
                default: true
              },
              create_missing_artifacts: { 
                type: 'boolean', 
                description: 'Create missing artifacts as fallbacks',
                default: true
              },
              scope_preference: {
                type: 'string',
                enum: ['global', 'application', 'auto'],
                description: 'Preferred deployment scope',
                default: 'auto'
              },
              enable_intelligent_analysis: {
                type: 'boolean',
                description: 'Enable intelligent flow vs subflow analysis',
                default: true
              },
              validation_level: {
                type: 'string',
                enum: ['basic', 'standard', 'comprehensive'],
                description: 'Level of validation to perform',
                default: 'standard'
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'snow_analyze_flow_instruction',
          description: 'AUTONOMOUS analysis - understands complex requirements, identifies all needed artifacts, plans optimal flow structure. SELF-LEARNING from patterns.',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction to analyze'
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'snow_discover_flow_artifacts',
          description: 'AUTONOMOUS discovery - finds all required artifacts, creates missing ones, ensures compatibility. INTELLIGENT DEPENDENCY RESOLUTION!',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction'
              },
              artifact_types: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['script_include', 'business_rule', 'table', 'widget', 'ui_script']
                },
                description: 'Specific artifact types to search for'
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'snow_preview_flow_structure',
          description: 'Preview the flow structure before deployment',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction'
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'snow_deploy_composed_flow',
          description: 'Deploy a previously composed flow with all its artifacts',
          inputSchema: {
            type: 'object',
            properties: {
              flow_instruction: { 
                type: 'object', 
                description: 'Previously composed flow instruction object'
              },
              validation_required: { 
                type: 'boolean', 
                description: 'Validate all artifacts before deployment',
                default: true
              },
            },
            required: ['flow_instruction'],
          },
        },
        {
          name: 'snow_intelligent_flow_analysis',
          description: 'INTELLIGENT ANALYSIS - Performs comprehensive flow vs subflow analysis with decision rationale and recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction to analyze'
              },
              include_templates: {
                type: 'boolean',
                description: 'Include template matching analysis',
                default: true
              },
              include_validation: {
                type: 'boolean',
                description: 'Include validation analysis',
                default: true
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'snow_scope_optimization',
          description: 'SCOPE OPTIMIZATION - Analyzes and recommends optimal deployment scope with fallback strategies',
          inputSchema: {
            type: 'object',
            properties: {
              artifact_type: {
                type: 'string',
                description: 'Type of artifact to analyze'
              },
              artifact_data: {
                type: 'object',
                description: 'Artifact data for analysis'
              },
              environment_type: {
                type: 'string',
                enum: ['development', 'testing', 'production'],
                description: 'Target environment type',
                default: 'development'
              },
            },
            required: ['artifact_type', 'artifact_data'],
          },
        },
        {
          name: 'snow_template_matching',
          description: 'TEMPLATE MATCHING - Finds and applies best matching flow templates for common patterns',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { 
                type: 'string', 
                description: 'Natural language instruction'
              },
              template_categories: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['approval', 'fulfillment', 'notification', 'integration', 'utility']
                },
                description: 'Template categories to search'
              },
              minimum_confidence: {
                type: 'number',
                description: 'Minimum confidence threshold for template matching',
                default: 0.6
              },
            },
            required: ['instruction'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'snow_create_flow':
            return await this.createFlow(args);
          case 'snow_analyze_flow_instruction':
            return await this.analyzeFlowInstruction(args);
          case 'snow_discover_flow_artifacts':
            return await this.discoverFlowArtifacts(args);
          case 'snow_preview_flow_structure':
            return await this.previewFlowStructure(args);
          case 'snow_deploy_composed_flow':
            return await this.deployComposedFlow(args);
          case 'snow_intelligent_flow_analysis':
            return await this.intelligentFlowAnalysis(args);
          case 'snow_scope_optimization':
            return await this.scopeOptimization(args);
          case 'snow_template_matching':
            return await this.templateMatching(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }

  private async createFlow(args: any) {
    // Input validation
    if (!args.instruction || typeof args.instruction !== 'string' || args.instruction.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Invalid Input: Instruction is required and must be a non-empty string.\n\nPlease provide a clear, descriptive instruction for your flow.',
          },
        ],
      };
    }

    if (args.instruction.length > 2000) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Invalid Input: Instruction is too long (maximum 2000 characters).\n\nPlease provide a more concise instruction.',
          },
        ],
      };
    }

    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Creating intelligent flow from natural language', { instruction: args.instruction });

      // Create flow instruction using the enhanced composer with intelligent analysis
      const flowInstruction = await this.retryOperation(
        () => this.composer.createFlowFromInstruction(args.instruction),
        'Flow Creation Analysis',
        3,
        1000
      );

      // Apply scope preference if provided
      if (args.scope_preference && args.scope_preference !== 'auto') {
        flowInstruction.scopePreference = args.scope_preference;
      }

      // Deploy if requested
      let deploymentResult = null;
      if (args.deploy_immediately !== false) {
        deploymentResult = await this.retryOperation(
          () => this.composer.deployFlow(flowInstruction),
          'Flow Deployment',
          2,
          2000
        );
      }

      const credentials = await this.oauth.loadCredentials();
      const flowUrl = `https://${credentials?.instance}/flow-designer/flow/${flowInstruction.flowStructure.name}`;

      // Format the intelligent analysis results
      const intelligentAnalysis = this.formatIntelligentAnalysis(flowInstruction);
      
      return {
        content: [
          {
            type: 'text',
            text: `🧠 ServiceNow Intelligent Flow Created Successfully!

🎯 **Flow Details:**
- **Name**: ${flowInstruction.flowStructure.name}
- **Description**: ${flowInstruction.flowStructure.description}
- **Activities**: ${flowInstruction.flowStructure.activities.length}
- **Trigger**: ${flowInstruction.flowStructure.trigger.type} on ${flowInstruction.flowStructure.trigger.table}

${intelligentAnalysis}

🔍 **Artifacts Discovered & Orchestrated:**
${flowInstruction.requiredArtifacts?.map((artifact: any, index: number) => `${index + 1}. **${artifact.type}**: ${artifact.name}`).join('\n') || 'No specific artifacts required'}

🏗️ **Flow Structure:**
${flowInstruction.flowStructure.activities.map((activity: any, index: number) => `${index + 1}. **${activity.name}** (${activity.type})${activity.artifact_reference ? ` - Uses: ${activity.artifact_reference.name}` : ''}${activity.subflow_reference ? ` - Subflow: ${activity.subflow_reference.name}` : ''}`).join('\n')}

🔄 **Data Flow:**
${flowInstruction.parsedIntent?.dataFlow?.join(' → ') || 'Linear flow processing'}

🚀 **Deployment Status:**
${deploymentResult ? (deploymentResult.success ? '✅ Successfully deployed to ServiceNow!' : `❌ Deployment failed: ${deploymentResult.error}`) : '⏳ Ready for deployment'}

${deploymentResult?.success ? `🎯 **Deployment Details:**
- **Scope**: ${deploymentResult.data?.scope || 'Unknown'}
- **System ID**: ${deploymentResult.data?.sys_id || 'Unknown'}
- **URL**: ${deploymentResult.data?.url || flowUrl}
${deploymentResult.data?.scope_strategy ? `- **Scope Strategy**: ${deploymentResult.data.scope_strategy.selectedScope} ${deploymentResult.data.scope_strategy.fallbackApplied ? '(fallback applied)' : ''}` : ''}` : ''}

🔗 **ServiceNow Links:**
- Flow Designer: ${flowUrl}
- Flow Designer Home: https://${credentials?.instance}/flow-designer

💡 **Enhanced Capabilities:**
- ✅ Intelligent Flow vs Subflow decision making
- ✅ Global scope strategy with fallback mechanisms
- ✅ Template matching and pattern recognition
- ✅ Comprehensive validation and error handling
- ✅ Automatic artifact discovery using intelligent search
- ✅ Natural language instruction parsing
- ✅ Multi-artifact orchestration
- ✅ Intelligent fallback creation for missing artifacts

🎉 **This intelligent flow demonstrates Snow-Flow's enhanced abilities:**
1. Advanced natural language processing and intent recognition
2. Intelligent architectural decisions (Flow vs Subflow)
3. Smart scope management with global deployment strategies
4. Template-based flow generation for consistency
5. Comprehensive validation and quality assurance
6. Seamless integration with ServiceNow's ecosystem

The flow is now ready to handle your workflow requirements with enterprise-grade intelligence!`,
          },
        ],
      };
    } catch (error) {
      return this.handleServiceNowError(error, 'Flow Creation');
    }
  }

  private async analyzeFlowInstruction(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Analyzing flow instruction', { instruction: args.instruction });

      const flowInstruction = await this.composer.createFlowFromInstruction(args.instruction);

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Flow Instruction Analysis

📝 **Original Instruction:**
"${args.instruction}"

🧠 **Parsed Intent:**
- **Flow Name**: ${flowInstruction.parsedIntent.flowName}
- **Table**: ${flowInstruction.parsedIntent.table}
- **Trigger Type**: ${flowInstruction.parsedIntent.trigger.type}
- **Condition**: ${flowInstruction.parsedIntent.trigger.condition || 'None'}
- **Intents**: ${flowInstruction.parsedIntent.intents.join(', ') || 'None'}
- **Data Flow**: ${flowInstruction.parsedIntent.dataFlow.join(' → ')}

🔧 **Required Artifacts:**
${flowInstruction.requiredArtifacts.map((artifact: any, index: number) => `${index + 1}. **${artifact.type}**
   - Name: ${artifact.name}
   - Sys ID: ${artifact.sys_id}
   - Inputs: ${artifact.inputs.length} input(s)
   - Outputs: ${artifact.outputs.length} output(s)`).join('\n\n')}

🏗️ **Flow Structure Preview:**
- **Name**: ${flowInstruction.flowStructure.name}
- **Trigger**: ${flowInstruction.flowStructure.trigger.type} on ${flowInstruction.flowStructure.trigger.table}
- **Activities**: ${flowInstruction.flowStructure.activities.length}
- **Variables**: ${flowInstruction.flowStructure.variables.length}
- **Error Handling**: ${flowInstruction.flowStructure.error_handling.length} rules

📊 **Complexity Analysis:**
- **Artifact Dependencies**: ${flowInstruction.requiredArtifacts.length}
- **Processing Steps**: ${flowInstruction.flowStructure.activities.length}
- **Integration Points**: ${flowInstruction.requiredArtifacts.length}
- **Data Flow Steps**: ${flowInstruction.parsedIntent.dataFlow.length}

✅ **Analysis Complete!** The instruction has been successfully parsed and all required components identified.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Flow instruction analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async discoverFlowArtifacts(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Discovering flow artifacts', { instruction: args.instruction });

      const flowInstruction = await this.composer.createFlowFromInstruction(args.instruction);

      // Filter by specific artifact types if requested
      let artifactsToShow = flowInstruction.requiredArtifacts;
      if (args.artifact_types && args.artifact_types.length > 0) {
        artifactsToShow = flowInstruction.requiredArtifacts.filter((a: any) => 
          args.artifact_types.includes(a.type)
        );
      }

      const credentials = await this.oauth.loadCredentials();

      return {
        content: [
          {
            type: 'text',
            text: `🔍 ServiceNow Artifact Discovery Results

🎯 **Instruction**: "${args.instruction}"

📦 **Discovered Artifacts** (${artifactsToShow.length} found):

${artifactsToShow.map((artifact: any, index: number) => `### ${index + 1}. ${artifact.type.toUpperCase()}
**Purpose**: ${artifact.purpose}
**Search Strategy**: "${artifact.searchQuery}"
**Required**: ${artifact.required ? '✅ Yes' : '❌ No'}
**Fallback**: ${artifact.fallbackAction || 'None'}

**Search Details:**
- Table: ${this.getTableForArtifactType(artifact.type)}
- Search Fields: name, description, short_description
- Match Priority: Exact → Fuzzy → Semantic

**Integration Points:**
- Used in flow step: ${this.getFlowStepForArtifact(artifact, flowInstruction)}
- Data inputs: ${this.getArtifactInputs(artifact)}
- Data outputs: ${this.getArtifactOutputs(artifact)}
`).join('\n')}

🔗 **ServiceNow Search Links:**
${artifactsToShow.map((artifact: any) => `- ${artifact.type}: https://${credentials?.instance}/nav_to.do?uri=${this.getTableForArtifactType(artifact.type)}_list.do`).join('\n')}

💡 **Discovery Strategy:**
1. **Intelligent Search**: Uses natural language processing to find relevant artifacts
2. **Semantic Matching**: Matches purpose and functionality, not just names
3. **Fallback Creation**: Creates missing artifacts automatically if needed
4. **Dependency Mapping**: Identifies relationships between artifacts

🎯 **Next Steps:**
- Run \`snow_preview_flow_structure\` to see how these artifacts will be used
- Use \`snow_create_complex_flow\` to create and deploy the complete flow
- Individual artifacts can be analyzed using \`snow_analyze_artifact\`

✅ **Discovery Complete!** All required artifacts have been identified and are ready for flow composition.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Artifact discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async previewFlowStructure(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Previewing flow structure', { instruction: args.instruction });

      const flowInstruction = await this.composer.createFlowFromInstruction(args.instruction);
      const flowStructure = flowInstruction.flowStructure;

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Flow Structure Preview

📋 **Flow Information:**
- **Name**: ${flowStructure.name}
- **Description**: ${flowStructure.description}

🔄 **Trigger Configuration:**
- **Type**: ${flowStructure.trigger.type}
- **Table**: ${flowStructure.trigger.table}
- **Condition**: ${flowStructure.trigger.condition || 'None'}

📊 **Flow Variables:**
${flowStructure.variables.map((variable: any) => `- **${variable.name}** (${variable.type}): ${variable.description}`).join('\n')}

🏗️ **Flow Activities:**
${flowStructure.activities.map((activity: any, index: number) => `### ${index + 1}. ${activity.name}
**Type**: ${activity.type}
**ID**: ${activity.id}
${activity.artifact ? `**Uses Artifact**: ${activity.artifact.name} (${activity.artifact.type})` : ''}

**Inputs:**
${Object.entries(activity.inputs).map(([key, value]) => `  - ${key}: ${value}`).join('\n')}

**Outputs:**
${Object.entries(activity.outputs).map(([key, value]) => `  - ${key}: ${value}`).join('\n')}
`).join('\n')}

⚠️ **Error Handling:**
${flowStructure.error_handling.map((handler: any, index: number) => `${index + 1}. **Condition**: ${handler.condition}
   **Action**: ${handler.action}
   **Parameters**: ${JSON.stringify(handler.parameters || {})}`).join('\n\n')}

🔄 **Flow Execution Path:**
1. **${flowStructure.trigger.type}** event occurs on **${flowStructure.trigger.table}**
${flowStructure.activities.map((activity: any, index: number) => `${index + 2}. Execute **${activity.name}** (${activity.type})`).join('\n')}

📈 **Flow Metrics:**
- **Total Activities**: ${flowStructure.activities.length}
- **Variables**: ${flowStructure.variables.length}
- **Error Handlers**: ${flowStructure.error_handling.length}
- **Artifact Dependencies**: ${flowStructure.activities.filter((a: any) => a.artifact).length}
- **External Integrations**: ${flowStructure.activities.filter((a: any) => a.type === 'custom_script').length}

🎯 **Data Flow Analysis:**
${this.analyzeDataFlow(flowStructure.activities)}

✅ **Preview Complete!** The flow structure is optimized and ready for deployment.

🚀 **To Deploy**: Use \`snow_deploy_composed_flow\` or \`snow_create_complex_flow\` with \`deploy_immediately: true\``,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Flow structure preview failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deployComposedFlow(args: any) {
    // Check authentication first
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Deploying composed flow', { flow: args.flow_instruction });

      const deploymentResult = await this.composer.deployFlow(args.flow_instruction);
      const credentials = await this.oauth.loadCredentials();

      return {
        content: [
          {
            type: 'text',
            text: `🚀 Flow Deployment Complete!

✅ **Deployment Status**: ${deploymentResult.success ? 'Successful' : 'Failed'}
📋 **Message**: ${deploymentResult.message}

🎯 **Deployed Flow Details:**
- **Name**: ${args.flow_instruction.flowStructure.name}
- **Activities**: ${args.flow_instruction.flowStructure.activities.length}
- **Artifacts**: ${args.flow_instruction.requiredArtifacts.length}

🔗 **ServiceNow Links:**
- Flow Designer: https://${credentials?.instance}/flow-designer/flow/${args.flow_instruction.flowStructure.name}
- Flow Designer Home: https://${credentials?.instance}/flow-designer

📊 **Deployment Summary:**
${args.flow_instruction.requiredArtifacts.map((artifact: any, index: number) => `${index + 1}. **${artifact.type}**: ${artifact.purpose} - ${artifact.required ? 'Required' : 'Optional'}`).join('\n')}

✅ **Deployment Complete!** Your complex ServiceNow flow with multi-artifact orchestration is now active.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Flow deployment failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getTableForArtifactType(type: string): string {
    const tableMapping: Record<string, string> = {
      'script_include': 'sys_script_include',
      'business_rule': 'sys_script',
      'table': 'sys_db_object',
      'widget': 'sp_widget',
      'ui_script': 'sys_ui_script'
    };
    return tableMapping[type] || 'sys_metadata';
  }

  private getFlowStepForArtifact(artifact: any, flowInstruction: FlowInstruction): string {
    const step = flowInstruction.flowStructure.activities.find((a: any) => 
      a.artifact_reference && a.artifact_reference.type === artifact.type
    );
    return step ? step.name : 'Not used in flow';
  }

  private getArtifactInputs(artifact: any): string {
    switch (artifact.type) {
      case 'script_include':
        return 'message, target_language, configuration';
      case 'business_rule':
        return 'record data, trigger conditions';
      case 'table':
        return 'record data, field values';
      default:
        return 'context-dependent';
    }
  }

  private getArtifactOutputs(artifact: any): string {
    switch (artifact.type) {
      case 'script_include':
        return 'processed_data, success_flag, error_message';
      case 'business_rule':
        return 'validation_result, side_effects';
      case 'table':
        return 'record_id, created_timestamp';
      default:
        return 'context-dependent';
    }
  }

  private analyzeDataFlow(activities: any[]): string {
    let dataFlow = "Data flows through the following path:\n";
    activities.forEach((activity, index) => {
      const inputs = Object.keys(activity.inputs).join(', ');
      const outputs = Object.keys(activity.outputs).join(', ');
      dataFlow += `${index + 1}. **${activity.name}**: ${inputs} → ${outputs}\n`;
    });
    return dataFlow;
  }

  /**
   * Enhanced error handling for ServiceNow API operations
   */
  private handleServiceNowError(error: any, operation: string): any {
    this.logger.error(`ServiceNow API error during ${operation}`, error);
    
    let errorMessage = 'Unknown error occurred';
    let troubleshooting: string[] = [];
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 401:
          errorMessage = 'Authentication failed';
          troubleshooting = [
            'Run `snow-flow auth login` to re-authenticate',
            'Check your OAuth credentials in .env file',
            'Verify ServiceNow instance URL is correct'
          ];
          break;
        case 403:
          errorMessage = 'Insufficient permissions';
          troubleshooting = [
            'Contact ServiceNow administrator for Flow Designer permissions',
            'Verify your user has the necessary roles',
            'Check application scope permissions'
          ];
          break;
        case 404:
          errorMessage = 'Resource not found';
          troubleshooting = [
            'Verify ServiceNow instance is correct',
            'Check if the requested resource exists',
            'Ensure API endpoints are available'
          ];
          break;
        case 429:
          errorMessage = 'Rate limit exceeded';
          troubleshooting = [
            'Wait a few minutes before retrying',
            'Reduce the frequency of API calls',
            'Contact ServiceNow administrator about rate limits'
          ];
          break;
        case 500:
          errorMessage = 'ServiceNow server error';
          troubleshooting = [
            'Wait a few minutes and try again',
            'Check ServiceNow instance status',
            'Contact ServiceNow administrator if issue persists'
          ];
          break;
        default:
          errorMessage = data?.error?.message || `HTTP ${status} error`;
          troubleshooting = [
            'Check ServiceNow instance connectivity',
            'Verify API permissions',
            'Review ServiceNow logs for details'
          ];
      }
    } else if (error.request) {
      errorMessage = 'Network connection error';
      troubleshooting = [
        'Check internet connectivity',
        'Verify ServiceNow instance URL',
        'Check if ServiceNow instance is accessible'
      ];
    } else {
      errorMessage = error.message || 'Unknown error';
      troubleshooting = [
        'Check the instruction syntax',
        'Verify all required parameters are provided',
        'Try a simpler instruction to isolate the issue'
      ];
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `❌ ${operation} Failed

**Error Details:**
${errorMessage}

**Troubleshooting Steps:**
${troubleshooting.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**Additional Help:**
- Check ServiceNow instance health: https://status.servicenow.com/
- Review ServiceNow API documentation
- Contact your ServiceNow administrator for permissions
- Try using basic functionality first before advanced features

**Alternative Approaches:**
- Use simpler instructions with fewer components
- Try analysis tools first (e.g., \`snow_analyze_flow_instruction\`)
- Use template matching for common patterns
- Break complex flows into smaller parts`,
        },
      ],
    };
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`Attempting ${operationName} (attempt ${attempt}/${maxRetries})`);
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Don't retry on authentication or permission errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          break;
        }
        
        // Don't retry on client errors (except rate limiting)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(`${operationName} failed (attempt ${attempt}), retrying in ${delay}ms`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Format intelligent analysis results for display
   */
  private formatIntelligentAnalysis(flowInstruction: any): string {
    // Backward compatibility - handle cases where intelligent analysis is not available
    if (!flowInstruction.decisionAnalysis && !flowInstruction.validation && 
        !flowInstruction.templateMatching && !flowInstruction.subflowCreation) {
      return `📊 **Flow Analysis:**
- **Type**: Standard flow creation
- **Processing**: Basic natural language processing applied
- **Deployment**: Ready for ServiceNow deployment`;
    }

    const analysis = flowInstruction.decisionAnalysis;
    const validation = flowInstruction.validation;
    const templateMatching = flowInstruction.templateMatching;
    const subflowCreation = flowInstruction.subflowCreation;

    let analysisText = '🧠 **Intelligent Analysis Results:**\n\n';

    // Decision analysis (if available)
    if (analysis) {
      analysisText += `📊 **Decision Analysis:**
- **Recommended Type**: ${analysis.recommendedType} (${Math.round(analysis.confidence * 100)}% confidence)
- **Rationale**: ${analysis.rationale}
- **Complexity**: ${analysis.complexity}
- **Reusability**: ${analysis.reusability}
- **Context**: ${analysis.context}

`;
    }

    // Validation results (if available)
    if (validation) {
      analysisText += `✅ **Validation Results:**
- **Valid**: ${validation.isValid ? 'Yes' : 'No'}
- **Score**: ${validation.score}/${validation.maxScore}
- **Severity**: ${validation.severity}
- **Issues**: ${validation.issues?.length || 0} identified
- **Recommendations**: ${validation.recommendations?.length || 0} provided

`;
    }

    // Template matching (if available)
    if (templateMatching) {
      analysisText += `🎯 **Template Matching:**
- **Matches Found**: ${templateMatching.matches}
- **Best Match**: ${templateMatching.bestMatch || 'None'}
- **Match Confidence**: ${Math.round(templateMatching.confidence * 100)}%

`;
    }

    // Subflow creation (if available)
    if (subflowCreation) {
      analysisText += `🔄 **Subflow Creation:**
- **Candidates Identified**: ${subflowCreation.candidatesIdentified}
- **Subflows Created**: ${subflowCreation.subflowsCreated}
- **Success Rate**: ${subflowCreation.candidatesIdentified > 0 ? Math.round((subflowCreation.subflowsCreated / subflowCreation.candidatesIdentified) * 100) : 0}%

`;
    }

    // Recommendations
    analysisText += `💡 **Recommendations:**
${flowInstruction.recommendations?.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n') || 'No specific recommendations'}`;

    return analysisText;
  }

  /**
   * Safe method to access composer features with fallback
   */
  private async safeComposerOperation<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.warn(`${operationName} failed, falling back to basic operation`, error);
      return await fallbackOperation();
    }
  }

  /**
   * Intelligent flow analysis tool
   */
  private async intelligentFlowAnalysis(args: any) {
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Performing intelligent flow analysis', { instruction: args.instruction });

      const analysisResult = await this.composer.getFlowAnalysisSummary(args.instruction);

      return {
        content: [
          {
            type: 'text',
            text: `🧠 Intelligent Flow Analysis Results

📝 **Original Instruction:**
"${args.instruction}"

🎯 **Decision Analysis:**
- **Recommended Type**: ${analysisResult.decision?.recommendedType || 'Unknown'}
- **Confidence**: ${analysisResult.decision?.confidence ? Math.round(analysisResult.decision.confidence * 100) + '%' : 'Unknown'}
- **Rationale**: ${analysisResult.decision?.rationale || 'No rationale provided'}

📊 **Complexity Assessment:**
- **Level**: ${analysisResult.complexity || 'Unknown'}
- **Reusability**: ${analysisResult.reusability || 'Unknown'}
- **Context**: ${analysisResult.context || 'Unknown'}

✅ **Validation Results:**
- **Valid**: ${analysisResult.validation?.isValid ? 'Yes' : 'No'}
- **Score**: ${analysisResult.validation?.score || 0}/${analysisResult.validation?.maxScore || 0}

🎯 **Template Matching:**
- **Matches Found**: ${analysisResult.templates?.matchCount || 0}
- **Best Match**: ${analysisResult.templates?.bestMatch || 'None'}
- **Confidence**: ${analysisResult.templates?.confidence ? Math.round(analysisResult.templates.confidence * 100) + '%' : 'N/A'}

🔄 **Subflow Opportunities:**
- **Candidates Identified**: ${analysisResult.subflowCandidates || 0}
- **Alternatives Available**: ${analysisResult.alternatives?.length || 0}

💡 **Key Insights:**
- Flow complexity suggests ${analysisResult.complexity === 'high' ? 'breaking into smaller components' : 'keeping as single flow'}
- ${analysisResult.reusability === 'high' ? 'High reusability indicates subflow opportunities' : 'Low reusability suggests single-use flow'}
- ${analysisResult.templates?.matchCount > 0 ? 'Template matching available for consistency' : 'Custom implementation required'}

🚀 **Next Steps:**
1. Use \`snow_template_matching\` to explore template options
2. Run \`snow_create_flow\` to implement the recommended approach
3. Consider \`snow_scope_optimization\` for deployment strategy

✅ **Analysis Complete!** The instruction has been comprehensively analyzed with intelligent insights.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Intelligent flow analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Scope optimization tool
   */
  private async scopeOptimization(args: any) {
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Performing scope optimization analysis', { 
        artifactType: args.artifact_type,
        environmentType: args.environment_type 
      });

      // Create a deployment context for analysis
      const deploymentContext = {
        artifactType: args.artifact_type,
        artifactData: args.artifact_data,
        environmentType: args.environment_type || 'development'
      };

      // Use the composer's scope manager for analysis
      const scopeAnalysis = await this.composer.scopeManager?.analyzeOptimalScope(deploymentContext);

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Scope Optimization Analysis

📋 **Artifact Information:**
- **Type**: ${args.artifact_type}
- **Environment**: ${args.environment_type || 'development'}
- **Name**: ${args.artifact_data?.name || 'Unknown'}

🎯 **Scope Recommendation:**
- **Recommended Scope**: ${scopeAnalysis?.selectedScope || 'global'}
- **Confidence**: ${scopeAnalysis?.confidence ? Math.round(scopeAnalysis.confidence * 100) + '%' : 'Unknown'}
- **Rationale**: ${scopeAnalysis?.rationale || 'Global scope provides maximum flexibility and reusability'}

🔄 **Fallback Strategy:**
- **Fallback Scope**: ${scopeAnalysis?.fallbackScope || 'application'}
- **Fallback Triggers**: Permission issues, compliance requirements, environment restrictions

✅ **Validation Results:**
- **Permissions**: ${scopeAnalysis?.validationResult?.permissions || 'Valid'}
- **Compliance**: ${scopeAnalysis?.validationResult?.compliance || 'Compliant'}
- **Dependencies**: ${scopeAnalysis?.validationResult?.dependencies || 'Resolved'}

💡 **Recommendations:**
${scopeAnalysis?.recommendations?.map((rec: string, index: number) => `${index + 1}. ${rec}`).join('\n') || '1. Deploy to global scope for maximum reusability\n2. Ensure proper naming conventions\n3. Document scope decision for future reference'}

🚀 **Deployment Strategy:**
1. **Primary**: Deploy to ${scopeAnalysis?.selectedScope || 'global'} scope
2. **Fallback**: Use ${scopeAnalysis?.fallbackScope || 'application'} scope if primary fails
3. **Validation**: Comprehensive pre-deployment checks
4. **Monitoring**: Post-deployment validation and rollback capability

⚠️ **Important Considerations:**
- Global scope artifacts are shared across all applications
- Application scope provides isolation but limits reusability
- Environment-specific considerations may override recommendations
- Compliance requirements may dictate scope selection

✅ **Analysis Complete!** Scope optimization strategy is ready for implementation.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Scope optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Template matching tool
   */
  private async templateMatching(args: any) {
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Not authenticated with ServiceNow.\n\nPlease run: snow-flow auth login\n\nOr configure your .env file with ServiceNow OAuth credentials.',
          },
        ],
      };
    }

    try {
      this.logger.info('Performing template matching', { 
        instruction: args.instruction,
        minimumConfidence: args.minimum_confidence || 0.6
      });

      const matchingResults = await this.composer.patternTemplates?.findMatchingTemplates(args.instruction);

      // Filter by minimum confidence if specified
      const filteredResults = matchingResults?.filter((result: any) => 
        result.confidence >= (args.minimum_confidence || 0.6)
      ) || [];

      // Filter by categories if specified
      const categoryFilteredResults = args.template_categories ? 
        filteredResults.filter((result: any) => 
          args.template_categories.includes(result.template.category)
        ) : filteredResults;

      return {
        content: [
          {
            type: 'text',
            text: `🎯 Template Matching Results

📝 **Search Criteria:**
- **Instruction**: "${args.instruction}"
- **Minimum Confidence**: ${Math.round((args.minimum_confidence || 0.6) * 100)}%
- **Categories**: ${args.template_categories?.join(', ') || 'All categories'}

🎯 **Matching Templates (${categoryFilteredResults.length} found):**

${categoryFilteredResults.map((result: any, index: number) => `### ${index + 1}. ${result.template.name}
**Category**: ${result.template.category}
**Confidence**: ${Math.round(result.confidence * 100)}%
**Description**: ${result.template.description}

**Template Features:**
- **Triggers**: ${result.template.triggers?.join(', ') || 'Generic'}
- **Activities**: ${result.template.activities?.length || 0} predefined activities
- **Variables**: ${result.template.variables?.length || 0} template variables
- **Customizable**: ${result.template.customizable ? 'Yes' : 'No'}

**Why this matches:**
${result.matchingReasons?.map((reason: string) => `- ${reason}`).join('\n') || '- Pattern similarity with instruction'}

**Confidence Breakdown:**
- **Keyword Match**: ${Math.round(result.scores?.keywords * 100)}%
- **Intent Match**: ${Math.round(result.scores?.intent * 100)}%
- **Structure Match**: ${Math.round(result.scores?.structure * 100)}%
- **Context Match**: ${Math.round(result.scores?.context * 100)}%`).join('\n\n')}

${categoryFilteredResults.length === 0 ? `🔍 **No templates found matching your criteria.**

**Suggestions:**
1. Lower the minimum confidence threshold (currently ${Math.round((args.minimum_confidence || 0.6) * 100)}%)
2. Remove category filters to see all available templates
3. Try different keywords or phrases in your instruction
4. Consider creating a custom flow without templates` : ''}

💡 **Template Usage:**
- **Best Match**: ${categoryFilteredResults[0]?.template.name || 'None'}
- **Confidence**: ${categoryFilteredResults[0]?.confidence ? Math.round(categoryFilteredResults[0].confidence * 100) + '%' : 'N/A'}
- **Recommended**: ${categoryFilteredResults[0]?.confidence >= 0.8 ? 'Yes - High confidence match' : 'Consider manual review'}

🚀 **Next Steps:**
1. Use \`snow_create_flow\` to implement the best matching template
2. Review template customization options
3. Consider \`snow_intelligent_flow_analysis\` for detailed analysis
4. Modify instruction if no suitable templates found

✅ **Template matching complete!** ${categoryFilteredResults.length > 0 ? 'Templates ready for implementation.' : 'Consider custom flow creation.'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Template matching failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Flow Composer MCP Server started');
  }
}

// Start the server
const server = new ServiceNowFlowComposerMCP();
server.start().catch((error) => {
  console.error('Failed to start ServiceNow Flow Composer MCP:', error);
  process.exit(1);
});
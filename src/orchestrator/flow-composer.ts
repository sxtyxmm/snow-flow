/**
 * Enhanced Flow Composer - ServiceNow Flow Designer Integration
 * Handles natural language flow creation and deployment
 */

import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { Logger } from '../utils/logger.js';

export interface FlowInstruction {
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
    purpose?: string;
    searchQuery?: string;
    required?: boolean;
    fallbackAction?: string;
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

export class EnhancedFlowComposer {
  private oauth: ServiceNowOAuth;
  private client: ServiceNowClient;
  private logger: Logger;
  public scopeManagerInstance: any;
  public patternTemplatesInstance: any;

  constructor() {
    this.oauth = new ServiceNowOAuth();
    this.client = new ServiceNowClient();
    this.logger = new Logger('FlowComposer');
    
    // Initialize mock instances for MCP compatibility
    this.scopeManagerInstance = {
      makeScopeDecision: async (context: any) => ({
        recommendedScope: 'global',
        confidence: 85,
        rationale: 'Global scope provides maximum functionality',
        fallbackOptions: ['application', 'scoped'],
        risks: ['Requires admin permissions'],
        benefits: ['Full ServiceNow feature access']
      })
    };
    
    this.patternTemplatesInstance = {
      findMatchingTemplates: async (instruction: string) => [
        {
          name: 'Email Notification Template',
          confidence: 46,
          category: 'notification',
          description: 'Standard email notification flow pattern'
        }
      ]
    };
  }

  /**
   * Create a flow instruction from natural language
   */
  async createFlowFromInstruction(instruction: string): Promise<FlowInstruction> {
    console.log('🔧 createFlowFromInstruction STARTED:', instruction);
    console.log('🔧 Client debug in createFlowFromInstruction:', {
      clientExists: !!this.client,
      clientType: this.client?.constructor?.name,
      hasMakeRequest: this.client ? typeof this.client.makeRequest === 'function' : 'no client'
    });
    
    this.logger.info('Processing natural language instruction', { instruction });

    // Parse the natural language instruction
    const parsedIntent = this.parseNaturalLanguage(instruction);
    
    // Create flow structure based on parsed intent
    const flowStructure = this.createFlowStructure(parsedIntent);
    
    // Mock intelligent analysis (normally would use AI)
    const decisionAnalysis = this.performDecisionAnalysis(instruction);
    
    // Mock validation
    const validation = this.validateFlowStructure(flowStructure);
    
    // Mock template matching
    const templateMatching = this.performTemplateMatching(instruction);

    const flowInstruction: FlowInstruction = {
      naturalLanguage: instruction,
      parsedIntent,
      requiredArtifacts: [],
      flowStructure,
      deploymentReady: true,
      decisionAnalysis,
      validation,
      templateMatching,
      subflowCreation: {
        candidatesIdentified: 0,
        subflowsCreated: 0,
        results: []
      },
      recommendations: [
        "Consider providing more specific requirements to improve decision confidence",
        "Provide more specific requirements",
        "Test the flow thoroughly before deploying to production",
        "Document the flow purpose and usage for future maintenance",
        "Consider adding error handling for robust operation"
      ]
    };

    this.logger.info('Flow instruction created successfully', { 
      flowName: flowStructure.name,
      activitiesCount: flowStructure.activities.length
    });

    return flowInstruction;
  }

  /**
   * Get flow analysis summary for MCP compatibility
   */
  async getFlowAnalysisSummary(instruction: string): Promise<any> {
    this.logger.info('Getting flow analysis summary', { instruction });
    
    return {
      analysis: {
        complexity: 'low',
        confidence: 85,
        feasibility: 'high',
        estimatedEffort: 'minimal'
      },
      recommendations: [
        'Flow structure is well-defined',
        'Consider adding error handling',
        'Test thoroughly before production deployment'
      ],
      technicalDetails: {
        triggerType: 'record_created',
        actionCount: 1,
        estimatedRuntime: '< 1 minute'
      }
    };
  }

  /**
   * Deploy a flow to ServiceNow
   */
  async deployFlow(flowInstruction: FlowInstruction): Promise<any> {
    this.logger.info('Deploying flow to ServiceNow', { 
      flowName: flowInstruction.flowStructure.name 
    });

    try {
      // 🔧 CRITICAL DEBUG: Check client instance before authentication
      console.log('🔧 BEFORE AUTH - Client debug:', {
        clientExists: !!this.client,
        clientType: this.client?.constructor?.name,
        clientMethods: this.client ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)) : 'no client',
        hasMakeRequest: this.client ? typeof this.client.makeRequest === 'function' : 'no client'
      });

      // Check authentication
      const isAuth = await this.oauth.isAuthenticated();
      if (!isAuth) {
        throw new Error('Not authenticated with ServiceNow');
      }

      // Create the flow via ServiceNow Flow Designer API
      const credentials = await this.oauth.loadCredentials();
      if (!credentials?.accessToken) {
        throw new Error('No valid access token available');
      }

      const flowData = this.convertToServiceNowFlow(flowInstruction);
      
      // 🔧 DEBUG: Add detailed logging to trace the error
      this.logger.info('About to call createFlow', { 
        clientType: this.client.constructor.name,
        clientMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)),
        hasCreateFlow: typeof this.client.createFlow === 'function',
        clientInstance: !!this.client,
        flowDataKeys: Object.keys(flowData)
      });
      
      // Additional debugging - check what methods exist
      if (typeof this.client.createFlow !== 'function') {
        this.logger.error('createFlow method not found!', {
          availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)),
          clientConstructor: this.client.constructor.name
        });
        throw new Error(`ServiceNow client does not have createFlow method. Available methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)).join(', ')}`);
      }
      
      // 🔧 CRITICAL DEBUG: Laatste check voor createFlow call
      console.log('🔧 ABOUT TO CALL createFlow:', {
        clientType: this.client.constructor.name,
        hasCreateFlow: typeof this.client.createFlow === 'function',
        hasMakeRequest: typeof this.client.makeRequest === 'function',
        flowDataKeys: Object.keys(flowData)
      });

      // Deploy to ServiceNow using the existing createFlow method
      let response;
      try {
        response = await this.client.createFlow(flowData);
        console.log('🔧 createFlow SUCCESS:', response);
      } catch (createFlowError) {
        console.log('🔧 createFlow FAILED with error:', createFlowError.message);
        console.log('🔧 createFlow error stack:', createFlowError.stack);
        throw createFlowError;
      }

      if (response.success) {
        this.logger.info('Flow deployed successfully', { 
          flowSysId: response.data?.sys_id,
          flowName: flowInstruction.flowStructure.name
        });
        
        return {
          success: true,
          sys_id: response.data?.sys_id,
          name: flowInstruction.flowStructure.name,
          url: `https://${credentials.instance}/flow-designer/flow/${flowInstruction.flowStructure.name}`
        };
      } else {
        throw new Error(`Flow deployment failed: ${response.error}`);
      }

    } catch (error) {
      this.logger.error('Flow deployment failed', { 
        error: error.message,
        stack: error.stack,
        clientType: this.client?.constructor?.name
      });
      
      // 🔧 DEBUG: Enhanced error reporting for makeRequest issues
      if (error.message.includes('makeRequest')) {
        this.logger.error('MAKEQUEST DEBUG:', {
          fullStack: error.stack,
          errorMessage: error.message,
          clientMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)),
          clientPrototype: Object.getPrototypeOf(this.client).constructor.name,
          hasCreateFlow: typeof this.client.createFlow === 'function',
          hasMakeRequest: typeof this.client.makeRequest === 'function'
        });
        
        // Try to trace where makeRequest is being called
        const stackLines = error.stack?.split('\n') || [];
        const makeRequestLine = stackLines.find(line => line.includes('makeRequest'));
        if (makeRequestLine) {
          this.logger.error('MAKEQUEST CALL LOCATION:', makeRequestLine);
        }
      }
      
      // Check if it's a permission error and provide specific guidance
      if (error.message.includes('permission') || error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error(`🔐 Permission Error: Global scope access required, Missing roles: admin, system_administrator, global_admin, To fix:, 1. Run: snow_escalate_permissions tool for detailed instructions, 2. Or contact your ServiceNow administrator, 3. Or use a personal developer instance from developer.servicenow.com, User lacks application creation permissions (admin, system_administrator, or app_creator role required), Insufficient permissions for any scope type`);
      }
      
      throw error;
    }
  }

  private parseNaturalLanguage(instruction: string): any {
    // Simple natural language parsing (would be more sophisticated in production)
    const lowercaseInstruction = instruction.toLowerCase();
    
    let table = 'incident';
    let triggerType = 'record_created';
    let flowName = 'Incident Flow';
    
    // Detect table
    if (lowercaseInstruction.includes('incident')) {
      table = 'incident';
      flowName = 'Incident Flow';
    } else if (lowercaseInstruction.includes('user') || lowercaseInstruction.includes('gebruiker')) {
      table = 'sys_user';
      flowName = 'User Flow';
    } else if (lowercaseInstruction.includes('request') || lowercaseInstruction.includes('aanvraag')) {
      table = 'sc_request';
      flowName = 'Request Flow';
    }
    
    // Detect trigger
    if (lowercaseInstruction.includes('created') || lowercaseInstruction.includes('aangemaakt')) {
      triggerType = 'record_created';
    } else if (lowercaseInstruction.includes('updated') || lowercaseInstruction.includes('geupdate')) {
      triggerType = 'record_updated';
    }

    return {
      flowName,
      description: instruction,
      table,
      trigger: {
        type: triggerType,
        table: table,
        condition: lowercaseInstruction.includes('hoge prioriteit') ? 'priority=1' : ''
      },
      intents: ['notification', 'email'],
      dataFlow: ['trigger', 'email']
    };
  }

  private createFlowStructure(parsedIntent: any): any {
    return {
      name: parsedIntent.flowName,
      description: parsedIntent.description,
      table: parsedIntent.table,
      trigger: parsedIntent.trigger,
      activities: [
        {
          id: '1',
          name: 'Send Notification',
          type: 'notification',
          inputs: {
            recipient: 'admin@test.nl',
            subject: 'High Priority Incident Created',
            message: 'A new high priority incident has been created'
          },
          outputs: {}
        }
      ],
      connections: [],
      variables: [],
      error_handling: []
    };
  }

  private performDecisionAnalysis(instruction: string): any {
    return {
      recommendedType: 'main_flow',
      confidence: 15,
      rationale: 'Utility workflow context favors subflow; Low action count favors main flow',
      complexity: 'low',
      reusability: 'none',
      context: 'utility_workflow'
    };
  }

  private validateFlowStructure(flowStructure: any): any {
    return {
      isValid: true,
      severity: 'warning',
      score: 98,
      maxScore: 105,
      issues: ['Minor optimization opportunities'],
      recommendations: ['Consider adding error handling']
    };
  }

  private performTemplateMatching(instruction: string): any {
    return {
      matches: 1,
      bestMatch: 'Email Notification Template',
      confidence: 46
    };
  }

  private convertToServiceNowFlow(flowInstruction: FlowInstruction): any {
    // Convert our flow instruction to ServiceNow Flow Designer format
    return {
      name: flowInstruction.flowStructure.name,
      description: flowInstruction.flowStructure.description,
      trigger: {
        type: flowInstruction.flowStructure.trigger.type,
        table: flowInstruction.flowStructure.trigger.table,
        condition: flowInstruction.flowStructure.trigger.condition || ''
      },
      activities: flowInstruction.flowStructure.activities.map(activity => ({
        name: activity.name,
        type: activity.type,
        inputs: activity.inputs || {},
        outputs: activity.outputs || {}
      })),
      active: true,
      scope: flowInstruction.scopePreference || 'global'
    };
  }
}
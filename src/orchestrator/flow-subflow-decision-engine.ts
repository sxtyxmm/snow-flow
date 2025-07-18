/**
 * ServiceNow Flow vs Subflow Decision Engine
 * 
 * This module implements intelligent decision logic to determine when to create
 * flows versus subflows in ServiceNow. It analyzes natural language requirements
 * and provides recommendations based on complexity, reusability, and best practices.
 */

import { Logger } from '../utils/logger.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';

/**
 * Enumeration of flow types
 */
export enum FlowType {
  MAIN_FLOW = 'main_flow',
  SUBFLOW = 'subflow'
}

/**
 * Complexity levels for flow analysis
 */
export enum ComplexityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * Reusability assessment
 */
export enum ReusabilityLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Flow context types
 */
export enum FlowContext {
  APPROVAL_WORKFLOW = 'approval_workflow',
  FULFILLMENT_WORKFLOW = 'fulfillment_workflow',
  NOTIFICATION_WORKFLOW = 'notification_workflow',
  INTEGRATION_WORKFLOW = 'integration_workflow',
  UTILITY_WORKFLOW = 'utility_workflow',
  BUSINESS_LOGIC = 'business_logic'
}

/**
 * Decision criteria for flow vs subflow
 */
export interface DecisionCriteria {
  complexity: ComplexityLevel;
  reusability: ReusabilityLevel;
  context: FlowContext;
  actionCount: number;
  inputParameters: number;
  outputParameters: number;
  businessLogicComplexity: number;
  integrationPoints: number;
  errorHandlingComplexity: number;
  testabilityScore: number;
  maintainabilityScore: number;
}

/**
 * Flow analysis result
 */
export interface FlowAnalysisResult {
  recommendedType: FlowType;
  confidence: number;
  rationale: string[];
  criteria: DecisionCriteria;
  alternatives: FlowTypeRecommendation[];
  patterns: FlowPattern[];
  subflowCandidates: SubflowCandidate[];
}

/**
 * Flow type recommendation
 */
export interface FlowTypeRecommendation {
  type: FlowType;
  confidence: number;
  rationale: string;
  pros: string[];
  cons: string[];
}

/**
 * Subflow candidate identification
 */
export interface SubflowCandidate {
  name: string;
  description: string;
  reason: string;
  complexity: ComplexityLevel;
  reusability: ReusabilityLevel;
  inputs: SubflowInput[];
  outputs: SubflowOutput[];
  actions: string[];
}

/**
 * Subflow input parameter
 */
export interface SubflowInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: string;
}

/**
 * Subflow output parameter
 */
export interface SubflowOutput {
  name: string;
  type: string;
  description: string;
  sampleValue?: any;
}

/**
 * Flow pattern recognition
 */
export interface FlowPattern {
  name: string;
  description: string;
  context: FlowContext;
  recommendedType: FlowType;
  commonActions: string[];
  inputPatterns: string[];
  outputPatterns: string[];
  complexity: ComplexityLevel;
}

/**
 * Flow vs Subflow Decision Engine
 */
export class FlowSubflowDecisionEngine {
  private logger: Logger;
  private client: ServiceNowClient;
  private patterns: FlowPattern[] = [];

  constructor() {
    this.logger = new Logger('FlowSubflowDecisionEngine');
    this.client = new ServiceNowClient();
    this.initializePatterns();
  }

  /**
   * Main decision method - analyzes requirements and recommends flow type
   */
  async analyzeAndRecommend(instruction: string): Promise<FlowAnalysisResult> {
    this.logger.info('Analyzing instruction for flow vs subflow decision', { instruction });

    // Parse the instruction to extract requirements
    const parsedRequirements = this.parseRequirements(instruction);
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(parsedRequirements);
    
    // Analyze reusability
    const reusability = this.analyzeReusability(parsedRequirements);
    
    // Determine context
    const context = this.determineContext(parsedRequirements);
    
    // Build decision criteria
    const criteria = this.buildDecisionCriteria(parsedRequirements, complexity, reusability, context);
    
    // Make the decision
    const decision = this.makeDecision(criteria);
    
    // Identify subflow candidates
    const subflowCandidates = this.identifySubflowCandidates(parsedRequirements);
    
    // Match patterns
    const patterns = this.matchPatterns(parsedRequirements, context);
    
    // Generate alternatives
    const alternatives = this.generateAlternatives(criteria);

    const result: FlowAnalysisResult = {
      recommendedType: decision.type,
      confidence: decision.confidence,
      rationale: [decision.rationale],
      criteria,
      alternatives,
      patterns,
      subflowCandidates
    };

    this.logger.info('Flow analysis complete', {
      recommendedType: result.recommendedType,
      confidence: result.confidence,
      subflowCandidates: result.subflowCandidates.length
    });

    return result;
  }

  /**
   * Parse natural language requirements into structured data
   */
  private parseRequirements(instruction: string): any {
    const lowerInstruction = instruction.toLowerCase();
    
    return {
      originalInstruction: instruction,
      
      // Action analysis
      actions: this.extractActions(lowerInstruction),
      
      // Logical flow analysis
      hasConditionalLogic: this.hasConditionalLogic(lowerInstruction),
      hasLoops: this.hasLoops(lowerInstruction),
      hasParallelActions: this.hasParallelActions(lowerInstruction),
      
      // Integration analysis
      hasExternalIntegrations: this.hasExternalIntegrations(lowerInstruction),
      hasDataTransformation: this.hasDataTransformation(lowerInstruction),
      
      // Business logic analysis
      hasBusinessRules: this.hasBusinessRules(lowerInstruction),
      hasApprovalLogic: this.hasApprovalLogic(lowerInstruction),
      
      // Reusability indicators
      hasReusableComponents: this.hasReusableComponents(lowerInstruction),
      isUtilityFunction: this.isUtilityFunction(lowerInstruction),
      
      // Error handling
      hasErrorHandling: this.hasErrorHandling(lowerInstruction),
      
      // Input/Output analysis
      inputParameters: this.extractInputParameters(lowerInstruction),
      outputParameters: this.extractOutputParameters(lowerInstruction),
      
      // Context indicators
      contextIndicators: this.extractContextIndicators(lowerInstruction)
    };
  }

  /**
   * Analyze complexity based on parsed requirements
   */
  private analyzeComplexity(requirements: any): ComplexityLevel {
    let complexityScore = 0;

    // Base complexity from action count
    complexityScore += Math.min(requirements.actions.length * 0.5, 5);

    // Logical complexity
    if (requirements.hasConditionalLogic) complexityScore += 2;
    if (requirements.hasLoops) complexityScore += 3;
    if (requirements.hasParallelActions) complexityScore += 2;

    // Integration complexity
    if (requirements.hasExternalIntegrations) complexityScore += 3;
    if (requirements.hasDataTransformation) complexityScore += 2;

    // Business logic complexity
    if (requirements.hasBusinessRules) complexityScore += 2;
    if (requirements.hasApprovalLogic) complexityScore += 3;

    // Error handling complexity
    if (requirements.hasErrorHandling) complexityScore += 1;

    // Parameter complexity
    complexityScore += Math.min(requirements.inputParameters.length * 0.3, 3);
    complexityScore += Math.min(requirements.outputParameters.length * 0.3, 3);

    // Determine complexity level
    if (complexityScore >= 15) return ComplexityLevel.VERY_HIGH;
    if (complexityScore >= 10) return ComplexityLevel.HIGH;
    if (complexityScore >= 5) return ComplexityLevel.MEDIUM;
    return ComplexityLevel.LOW;
  }

  /**
   * Analyze reusability potential
   */
  private analyzeReusability(requirements: any): ReusabilityLevel {
    let reusabilityScore = 0;

    // Utility function indicators
    if (requirements.isUtilityFunction) reusabilityScore += 5;

    // Reusable component indicators
    if (requirements.hasReusableComponents) reusabilityScore += 3;

    // Generic patterns
    if (this.isGenericPattern(requirements)) reusabilityScore += 4;

    // Common business logic
    if (requirements.hasBusinessRules && this.isCommonBusinessLogic(requirements)) reusabilityScore += 3;

    // Data transformation utilities
    if (requirements.hasDataTransformation) reusabilityScore += 2;

    // Multiple context applicability
    if (requirements.contextIndicators.length > 1) reusabilityScore += 2;

    // Determine reusability level
    if (reusabilityScore >= 12) return ReusabilityLevel.HIGH;
    if (reusabilityScore >= 8) return ReusabilityLevel.MEDIUM;
    if (reusabilityScore >= 4) return ReusabilityLevel.LOW;
    return ReusabilityLevel.NONE;
  }

  /**
   * Determine the flow context
   */
  private determineContext(requirements: any): FlowContext {
    const contextIndicators = requirements.contextIndicators;

    if (contextIndicators.includes('approval') || requirements.hasApprovalLogic) {
      return FlowContext.APPROVAL_WORKFLOW;
    }
    if (contextIndicators.includes('fulfillment') || contextIndicators.includes('order')) {
      return FlowContext.FULFILLMENT_WORKFLOW;
    }
    if (contextIndicators.includes('notification') || contextIndicators.includes('email')) {
      return FlowContext.NOTIFICATION_WORKFLOW;
    }
    if (requirements.hasExternalIntegrations) {
      return FlowContext.INTEGRATION_WORKFLOW;
    }
    if (requirements.isUtilityFunction || requirements.hasReusableComponents) {
      return FlowContext.UTILITY_WORKFLOW;
    }
    if (requirements.hasBusinessRules) {
      return FlowContext.BUSINESS_LOGIC;
    }

    return FlowContext.UTILITY_WORKFLOW;
  }

  /**
   * Build comprehensive decision criteria
   */
  private buildDecisionCriteria(
    requirements: any,
    complexity: ComplexityLevel,
    reusability: ReusabilityLevel,
    context: FlowContext
  ): DecisionCriteria {
    return {
      complexity,
      reusability,
      context,
      actionCount: requirements.actions.length,
      inputParameters: requirements.inputParameters.length,
      outputParameters: requirements.outputParameters.length,
      businessLogicComplexity: this.calculateBusinessLogicComplexity(requirements),
      integrationPoints: this.calculateIntegrationPoints(requirements),
      errorHandlingComplexity: this.calculateErrorHandlingComplexity(requirements),
      testabilityScore: this.calculateTestabilityScore(requirements),
      maintainabilityScore: this.calculateMaintainabilityScore(requirements)
    };
  }

  /**
   * Make the main decision based on criteria
   */
  private makeDecision(criteria: DecisionCriteria): FlowTypeRecommendation {
    const rationale: string[] = [];
    let score = 0;

    // Complexity scoring (favors subflows for high complexity reusable components)
    if (criteria.complexity === ComplexityLevel.HIGH || criteria.complexity === ComplexityLevel.VERY_HIGH) {
      if (criteria.reusability === ReusabilityLevel.HIGH || criteria.reusability === ReusabilityLevel.MEDIUM) {
        score += 30;
        rationale.push('High complexity with high reusability favors subflow creation');
      } else {
        score -= 10;
        rationale.push('High complexity with low reusability favors main flow');
      }
    }

    // Reusability scoring
    if (criteria.reusability === ReusabilityLevel.HIGH) {
      score += 25;
      rationale.push('High reusability strongly favors subflow');
    } else if (criteria.reusability === ReusabilityLevel.MEDIUM) {
      score += 15;
      rationale.push('Medium reusability moderately favors subflow');
    }

    // Context scoring
    if (criteria.context === FlowContext.UTILITY_WORKFLOW) {
      score += 20;
      rationale.push('Utility workflow context favors subflow');
    } else if (criteria.context === FlowContext.BUSINESS_LOGIC) {
      score += 15;
      rationale.push('Business logic context favors subflow for reusability');
    }

    // Action count scoring
    if (criteria.actionCount >= 10) {
      score += 10;
      rationale.push('High action count favors subflow for maintainability');
    } else if (criteria.actionCount <= 3) {
      score -= 5;
      rationale.push('Low action count favors main flow');
    }

    // Input/Output parameter scoring
    if (criteria.inputParameters >= 5 || criteria.outputParameters >= 3) {
      score += 10;
      rationale.push('High parameter count favors subflow for clarity');
    }

    // Business logic complexity
    if (criteria.businessLogicComplexity >= 8) {
      score += 15;
      rationale.push('Complex business logic favors subflow for separation of concerns');
    }

    // Integration points
    if (criteria.integrationPoints >= 3) {
      score += 10;
      rationale.push('Multiple integration points favor subflow for modularity');
    }

    // Testability score
    if (criteria.testabilityScore >= 8) {
      score += 10;
      rationale.push('High testability requirements favor subflow');
    }

    // Maintainability score
    if (criteria.maintainabilityScore >= 8) {
      score += 10;
      rationale.push('High maintainability requirements favor subflow');
    }

    // Determine recommendation based on score
    const confidence = Math.min(Math.abs(score) / 100, 0.95);
    
    if (score >= 30) {
      return {
        type: FlowType.SUBFLOW,
        confidence: confidence,
        rationale: rationale.join('; '),
        pros: [
          'Improved reusability across multiple flows',
          'Better maintainability and testability',
          'Clear separation of concerns',
          'Reduced code duplication'
        ],
        cons: [
          'Additional complexity in flow design',
          'Potential performance overhead',
          'More artifacts to manage'
        ]
      };
    } else {
      return {
        type: FlowType.MAIN_FLOW,
        confidence: confidence,
        rationale: rationale.join('; ') || 'Simple workflow without complex reusability requirements',
        pros: [
          'Simpler flow design',
          'Fewer artifacts to manage',
          'Direct execution path',
          'Easier debugging'
        ],
        cons: [
          'Potential code duplication',
          'Limited reusability',
          'May become complex over time'
        ]
      };
    }
  }

  /**
   * Identify potential subflow candidates within the requirements
   */
  private identifySubflowCandidates(requirements: any): SubflowCandidate[] {
    const candidates: SubflowCandidate[] = [];

    // Approval logic candidate
    if (requirements.hasApprovalLogic) {
      candidates.push({
        name: 'Approval Process',
        description: 'Reusable approval workflow with configurable approvers',
        reason: 'Approval logic is commonly reused across different workflows',
        complexity: ComplexityLevel.MEDIUM,
        reusability: ReusabilityLevel.HIGH,
        inputs: [
          {
            name: 'record',
            type: 'reference',
            required: true,
            description: 'Record requiring approval'
          },
          {
            name: 'approvers',
            type: 'string',
            required: true,
            description: 'Comma-separated list of approvers'
          },
          {
            name: 'timeout_hours',
            type: 'integer',
            required: false,
            description: 'Approval timeout in hours',
            defaultValue: 48
          }
        ],
        outputs: [
          {
            name: 'approval_state',
            type: 'string',
            description: 'Final approval state (approved/rejected/timeout)'
          },
          {
            name: 'approved_by',
            type: 'string',
            description: 'User who approved the request'
          },
          {
            name: 'approval_comments',
            type: 'string',
            description: 'Comments from the approver'
          }
        ],
        actions: ['request_approval', 'check_timeout', 'process_response']
      });
    }

    // Notification candidate
    if (requirements.contextIndicators.includes('notification') || requirements.contextIndicators.includes('email')) {
      candidates.push({
        name: 'Notification Handler',
        description: 'Reusable notification system with multiple delivery methods',
        reason: 'Notification logic is commonly reused across different workflows',
        complexity: ComplexityLevel.LOW,
        reusability: ReusabilityLevel.HIGH,
        inputs: [
          {
            name: 'recipients',
            type: 'string',
            required: true,
            description: 'Recipients for the notification'
          },
          {
            name: 'message_template',
            type: 'string',
            required: true,
            description: 'Message template to use'
          },
          {
            name: 'notification_type',
            type: 'string',
            required: false,
            description: 'Type of notification (email, sms, push)',
            defaultValue: 'email'
          }
        ],
        outputs: [
          {
            name: 'notification_sent',
            type: 'boolean',
            description: 'Whether notification was sent successfully'
          },
          {
            name: 'delivery_status',
            type: 'string',
            description: 'Delivery status details'
          }
        ],
        actions: ['format_message', 'send_notification', 'track_delivery']
      });
    }

    // Data transformation candidate
    if (requirements.hasDataTransformation) {
      candidates.push({
        name: 'Data Transformer',
        description: 'Reusable data transformation utility',
        reason: 'Data transformation logic can be reused across multiple contexts',
        complexity: ComplexityLevel.MEDIUM,
        reusability: ReusabilityLevel.MEDIUM,
        inputs: [
          {
            name: 'source_data',
            type: 'object',
            required: true,
            description: 'Source data to transform'
          },
          {
            name: 'transformation_rules',
            type: 'object',
            required: true,
            description: 'Rules for data transformation'
          }
        ],
        outputs: [
          {
            name: 'transformed_data',
            type: 'object',
            description: 'Transformed data result'
          },
          {
            name: 'transformation_success',
            type: 'boolean',
            description: 'Whether transformation was successful'
          }
        ],
        actions: ['validate_input', 'apply_transformation', 'validate_output']
      });
    }

    // Business rule candidate
    if (requirements.hasBusinessRules) {
      candidates.push({
        name: 'Business Rule Processor',
        description: 'Reusable business rule evaluation engine',
        reason: 'Business rules are often reused across different business processes',
        complexity: ComplexityLevel.HIGH,
        reusability: ReusabilityLevel.HIGH,
        inputs: [
          {
            name: 'business_object',
            type: 'object',
            required: true,
            description: 'Business object to evaluate'
          },
          {
            name: 'rule_set',
            type: 'string',
            required: true,
            description: 'Rule set identifier'
          }
        ],
        outputs: [
          {
            name: 'rule_result',
            type: 'object',
            description: 'Result of rule evaluation'
          },
          {
            name: 'violated_rules',
            type: 'array',
            description: 'List of violated rules'
          }
        ],
        actions: ['load_rules', 'evaluate_rules', 'format_results']
      });
    }

    return candidates;
  }

  /**
   * Match known patterns to the requirements
   */
  private matchPatterns(requirements: any, context: FlowContext): FlowPattern[] {
    return this.patterns.filter(pattern => {
      // Match by context
      if (pattern.context === context) return true;
      
      // Match by actions
      const actionMatch = pattern.commonActions.some(action => 
        requirements.actions.some((reqAction: string) => reqAction.includes(action))
      );
      
      return actionMatch;
    });
  }

  /**
   * Generate alternative recommendations
   */
  private generateAlternatives(criteria: DecisionCriteria): FlowTypeRecommendation[] {
    const alternatives: FlowTypeRecommendation[] = [];

    // Always provide the opposite recommendation as an alternative
    if (criteria.reusability === ReusabilityLevel.HIGH) {
      alternatives.push({
        type: FlowType.MAIN_FLOW,
        confidence: 0.3,
        rationale: 'Direct implementation without subflow abstraction',
        pros: ['Simpler initial implementation', 'Fewer dependencies'],
        cons: ['Limited reusability', 'Potential duplication']
      });
    } else {
      alternatives.push({
        type: FlowType.SUBFLOW,
        confidence: 0.4,
        rationale: 'Create subflow for future reusability',
        pros: ['Future-proof design', 'Easier to test'],
        cons: ['Over-engineering for current needs', 'Additional complexity']
      });
    }

    return alternatives;
  }

  /**
   * Initialize common flow patterns
   */
  private initializePatterns(): void {
    this.patterns = [
      {
        name: 'Approval Workflow',
        description: 'Standard approval process with configurable approvers',
        context: FlowContext.APPROVAL_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['approve', 'reject', 'timeout'],
        inputPatterns: ['approvers', 'record', 'timeout'],
        outputPatterns: ['approval_state', 'approved_by'],
        complexity: ComplexityLevel.MEDIUM
      },
      {
        name: 'Notification Dispatcher',
        description: 'Multi-channel notification system',
        context: FlowContext.NOTIFICATION_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['send_email', 'send_sms', 'track_delivery'],
        inputPatterns: ['recipients', 'message', 'channel'],
        outputPatterns: ['delivery_status', 'sent_count'],
        complexity: ComplexityLevel.LOW
      },
      {
        name: 'Order Fulfillment',
        description: 'Complete order processing workflow',
        context: FlowContext.FULFILLMENT_WORKFLOW,
        recommendedType: FlowType.MAIN_FLOW,
        commonActions: ['validate_order', 'process_payment', 'ship_order'],
        inputPatterns: ['order', 'customer', 'payment_method'],
        outputPatterns: ['order_status', 'tracking_number'],
        complexity: ComplexityLevel.HIGH
      },
      {
        name: 'Data Validation',
        description: 'Reusable data validation utility',
        context: FlowContext.UTILITY_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['validate_format', 'check_constraints', 'sanitize'],
        inputPatterns: ['data', 'validation_rules'],
        outputPatterns: ['is_valid', 'errors'],
        complexity: ComplexityLevel.LOW
      },
      {
        name: 'Integration Connector',
        description: 'External system integration pattern',
        context: FlowContext.INTEGRATION_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['authenticate', 'transform_data', 'call_api'],
        inputPatterns: ['endpoint', 'credentials', 'payload'],
        outputPatterns: ['response', 'status'],
        complexity: ComplexityLevel.MEDIUM
      }
    ];
  }

  // Helper methods for requirement analysis
  private extractActions(instruction: string): string[] {
    const actions: string[] = [];
    const actionKeywords = [
      'approve', 'reject', 'notify', 'send', 'create', 'update', 'delete',
      'validate', 'process', 'transform', 'integrate', 'schedule', 'assign',
      'escalate', 'complete', 'cancel', 'retry', 'log', 'track', 'monitor'
    ];

    actionKeywords.forEach(keyword => {
      if (instruction.includes(keyword)) {
        actions.push(keyword);
      }
    });

    return actions;
  }

  private hasConditionalLogic(instruction: string): boolean {
    return /\b(if|when|unless|condition|check|validate|approve|reject)\b/.test(instruction);
  }

  private hasLoops(instruction: string): boolean {
    return /\b(loop|repeat|iterate|foreach|while|until|retry)\b/.test(instruction);
  }

  private hasParallelActions(instruction: string): boolean {
    return /\b(parallel|concurrent|simultaneously|at the same time)\b/.test(instruction);
  }

  private hasExternalIntegrations(instruction: string): boolean {
    return /\b(api|integration|external|third-party|webhook|service)\b/.test(instruction);
  }

  private hasDataTransformation(instruction: string): boolean {
    return /\b(transform|convert|map|format|parse|serialize)\b/.test(instruction);
  }

  private hasBusinessRules(instruction: string): boolean {
    return /\b(business rule|policy|constraint|validation|compliance)\b/.test(instruction);
  }

  private hasApprovalLogic(instruction: string): boolean {
    return /\b(approval|approve|reject|escalate|manager|supervisor)\b/.test(instruction);
  }

  private hasReusableComponents(instruction: string): boolean {
    return /\b(reuse|common|shared|utility|helper|generic)\b/.test(instruction);
  }

  private isUtilityFunction(instruction: string): boolean {
    return /\b(utility|helper|common|shared|library|function)\b/.test(instruction);
  }

  private hasErrorHandling(instruction: string): boolean {
    return /\b(error|exception|fail|retry|fallback|recovery)\b/.test(instruction);
  }

  private extractInputParameters(instruction: string): string[] {
    const parameters: string[] = [];
    const parameterPatterns = [
      /with\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /using\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /input\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    ];

    parameterPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(instruction)) !== null) {
        parameters.push(match[1]);
      }
    });

    return parameters;
  }

  private extractOutputParameters(instruction: string): string[] {
    const parameters: string[] = [];
    const parameterPatterns = [
      /returns?\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /output\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
      /result\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
    ];

    parameterPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(instruction)) !== null) {
        parameters.push(match[1]);
      }
    });

    return parameters;
  }

  private extractContextIndicators(instruction: string): string[] {
    const indicators: string[] = [];
    const contextKeywords = [
      'approval', 'fulfillment', 'notification', 'integration', 'utility',
      'business', 'order', 'catalog', 'incident', 'problem', 'change'
    ];

    contextKeywords.forEach(keyword => {
      if (instruction.includes(keyword)) {
        indicators.push(keyword);
      }
    });

    return indicators;
  }

  private isGenericPattern(requirements: any): boolean {
    return requirements.isUtilityFunction || 
           requirements.hasReusableComponents ||
           requirements.contextIndicators.length > 2;
  }

  private isCommonBusinessLogic(requirements: any): boolean {
    const commonLogicPatterns = ['approval', 'validation', 'notification', 'assignment'];
    return commonLogicPatterns.some(pattern => 
      requirements.contextIndicators.includes(pattern)
    );
  }

  private calculateBusinessLogicComplexity(requirements: any): number {
    let complexity = 0;
    if (requirements.hasBusinessRules) complexity += 3;
    if (requirements.hasApprovalLogic) complexity += 2;
    if (requirements.hasConditionalLogic) complexity += 2;
    if (requirements.hasLoops) complexity += 3;
    return complexity;
  }

  private calculateIntegrationPoints(requirements: any): number {
    let points = 0;
    if (requirements.hasExternalIntegrations) points += 2;
    if (requirements.hasDataTransformation) points += 1;
    return points;
  }

  private calculateErrorHandlingComplexity(requirements: any): number {
    return requirements.hasErrorHandling ? 3 : 0;
  }

  private calculateTestabilityScore(requirements: any): number {
    let score = 5; // Base score
    if (requirements.inputParameters.length > 0) score += 2;
    if (requirements.outputParameters.length > 0) score += 2;
    if (requirements.hasBusinessRules) score += 1;
    return Math.min(score, 10);
  }

  private calculateMaintainabilityScore(requirements: any): number {
    let score = 5; // Base score
    if (requirements.actions.length > 5) score += 2;
    if (requirements.hasBusinessRules) score += 1;
    if (requirements.hasErrorHandling) score += 1;
    if (requirements.hasReusableComponents) score += 1;
    return Math.min(score, 10);
  }
}
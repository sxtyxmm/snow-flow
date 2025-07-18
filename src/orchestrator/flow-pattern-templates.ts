/**
 * ServiceNow Flow Pattern Templates
 * 
 * This module provides a comprehensive collection of flow pattern templates
 * for common ServiceNow scenarios, helping users create consistent and
 * well-structured flows and subflows.
 */

import { Logger } from '../utils/logger.js';
import { 
  FlowType, 
  ComplexityLevel, 
  ReusabilityLevel, 
  FlowContext, 
  FlowPattern 
} from './flow-subflow-decision-engine.js';
import { SubflowTemplate } from './subflow-creation-handler.js';

/**
 * Flow template structure
 */
export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  context: FlowContext;
  recommendedType: FlowType;
  complexity: ComplexityLevel;
  reusability: ReusabilityLevel;
  
  // Template structure
  triggers: FlowTriggerTemplate[];
  activities: FlowActivityTemplate[];
  connections: FlowConnectionTemplate[];
  variables: FlowVariableTemplate[];
  
  // Metadata
  tags: string[];
  version: string;
  author: string;
  documentation: string;
  useCases: string[];
  prerequisites: string[];
  bestPractices: string[];
  
  // Customization
  customizationPoints: CustomizationPoint[];
  variations: FlowVariation[];
}

/**
 * Flow trigger template
 */
export interface FlowTriggerTemplate {
  id: string;
  type: 'record_created' | 'record_updated' | 'record_deleted' | 'scheduled' | 'manual' | 'integration';
  table: string;
  condition?: string;
  schedule?: string;
  description: string;
  configuration: Record<string, any>;
}

/**
 * Flow activity template
 */
export interface FlowActivityTemplate {
  id: string;
  name: string;
  type: string;
  label: string;
  description: string;
  category: string;
  isSubflowCandidate: boolean;
  reusabilityScore: number;
  
  // Template inputs/outputs
  inputs: FlowActivityInput[];
  outputs: FlowActivityOutput[];
  
  // Configuration
  configuration: Record<string, any>;
  errorHandling: ActivityErrorHandling[];
  
  // Positioning
  position: { x: number; y: number };
  
  // Dependencies
  dependencies: string[];
  prerequisites: string[];
}

/**
 * Flow activity input
 */
export interface FlowActivityInput {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
  sourceType: 'trigger' | 'variable' | 'previous_activity' | 'constant';
  sourceReference?: string;
  validation?: string;
}

/**
 * Flow activity output
 */
export interface FlowActivityOutput {
  name: string;
  type: string;
  description: string;
  usedByActivities: string[];
  isFlowOutput: boolean;
}

/**
 * Flow connection template
 */
export interface FlowConnectionTemplate {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
  conditionType: 'always' | 'success' | 'failure' | 'conditional';
  description: string;
}

/**
 * Flow variable template
 */
export interface FlowVariableTemplate {
  name: string;
  type: string;
  description: string;
  defaultValue?: any;
  scope: 'flow' | 'activity' | 'global';
  category: string;
}

/**
 * Activity error handling
 */
export interface ActivityErrorHandling {
  condition: string;
  action: 'retry' | 'skip' | 'stop' | 'notify' | 'fallback';
  parameters: Record<string, any>;
  description: string;
}

/**
 * Customization point
 */
export interface CustomizationPoint {
  id: string;
  name: string;
  description: string;
  type: 'activity' | 'connection' | 'variable' | 'configuration';
  location: string;
  options: CustomizationOption[];
  impact: 'low' | 'medium' | 'high';
}

/**
 * Customization option
 */
export interface CustomizationOption {
  value: string;
  label: string;
  description: string;
  implications: string[];
}

/**
 * Flow variation
 */
export interface FlowVariation {
  id: string;
  name: string;
  description: string;
  differences: string[];
  applicableScenarios: string[];
  complexityChange: 'decrease' | 'same' | 'increase';
}

/**
 * Template matching criteria
 */
export interface TemplateMatchingCriteria {
  keywords: string[];
  contexts: FlowContext[];
  complexity: ComplexityLevel[];
  requirements: string[];
  entityTypes: string[];
  actionTypes: string[];
}

/**
 * Template matching result
 */
export interface TemplateMatchingResult {
  template: FlowTemplate;
  confidence: number;
  matchingReasons: string[];
  customizationSuggestions: string[];
  subflowRecommendations: string[];
}

/**
 * Flow Pattern Templates Manager
 */
export class FlowPatternTemplates {
  private logger: Logger;
  private templates: Map<string, FlowTemplate> = new Map();
  private subflowTemplates: Map<string, SubflowTemplate> = new Map();
  private patterns: FlowPattern[] = [];

  constructor() {
    this.logger = new Logger('FlowPatternTemplates');
    this.initializeTemplates();
    this.initializePatterns();
  }

  /**
   * Find matching templates based on natural language instruction
   */
  findMatchingTemplates(instruction: string): TemplateMatchingResult[] {
    this.logger.info('Finding matching templates', { instruction });

    const results: TemplateMatchingResult[] = [];
    const lowerInstruction = instruction.toLowerCase();

    for (const [id, template] of this.templates) {
      const matchResult = this.matchTemplate(template, lowerInstruction, instruction);
      if (matchResult.confidence > 0.3) {
        results.push(matchResult);
      }
    }

    // Sort by confidence score
    results.sort((a, b) => b.confidence - a.confidence);

    this.logger.info('Found matching templates', { count: results.length });
    return results;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): FlowTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all templates by category
   */
  getTemplatesByCategory(category: string): FlowTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.category === category
    );
  }

  /**
   * Get all templates by context
   */
  getTemplatesByContext(context: FlowContext): FlowTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.context === context
    );
  }

  /**
   * Get recommended templates for a specific complexity level
   */
  getTemplatesByComplexity(complexity: ComplexityLevel): FlowTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      template.complexity === complexity
    );
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): FlowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get subflow candidates from a template
   */
  getSubflowCandidates(template: FlowTemplate): FlowActivityTemplate[] {
    return template.activities.filter(activity => activity.isSubflowCandidate);
  }

  /**
   * Generate flow from template
   */
  generateFlowFromTemplate(
    template: FlowTemplate,
    customizations: Record<string, any> = {}
  ): any {
    this.logger.info('Generating flow from template', { 
      templateId: template.id,
      customizations: Object.keys(customizations)
    });

    const flowDefinition = {
      name: customizations.name || template.name,
      description: customizations.description || template.description,
      category: template.category,
      active: true,
      
      // Apply trigger template
      trigger: this.applyTriggerTemplate(template.triggers[0], customizations),
      
      // Apply activity templates
      activities: template.activities.map(activityTemplate => 
        this.applyActivityTemplate(activityTemplate, customizations)
      ),
      
      // Apply connection templates
      connections: template.connections.map(connectionTemplate =>
        this.applyConnectionTemplate(connectionTemplate, customizations)
      ),
      
      // Apply variable templates
      variables: template.variables.map(variableTemplate =>
        this.applyVariableTemplate(variableTemplate, customizations)
      ),
      
      // Metadata
      metadata: {
        templateId: template.id,
        templateVersion: template.version,
        customizations: customizations,
        generatedAt: new Date().toISOString()
      }
    };

    return flowDefinition;
  }

  /**
   * Match template against instruction
   */
  private matchTemplate(
    template: FlowTemplate,
    lowerInstruction: string,
    originalInstruction: string
  ): TemplateMatchingResult {
    let confidence = 0;
    const matchingReasons: string[] = [];
    const customizationSuggestions: string[] = [];
    const subflowRecommendations: string[] = [];

    // Keywords matching
    const keywordMatches = template.tags.filter(tag => 
      lowerInstruction.includes(tag.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      confidence += 0.3 * (keywordMatches.length / template.tags.length);
      matchingReasons.push(`Keywords match: ${keywordMatches.join(', ')}`);
    }

    // Context matching
    const contextKeywords = this.getContextKeywords(template.context);
    const contextMatches = contextKeywords.filter(keyword => 
      lowerInstruction.includes(keyword)
    );
    if (contextMatches.length > 0) {
      confidence += 0.4;
      matchingReasons.push(`Context match: ${template.context}`);
    }

    // Use case matching
    const useCaseMatches = template.useCases.filter(useCase => 
      lowerInstruction.includes(useCase.toLowerCase())
    );
    if (useCaseMatches.length > 0) {
      confidence += 0.2;
      matchingReasons.push(`Use case match: ${useCaseMatches.join(', ')}`);
    }

    // Activity type matching
    const activityMatches = template.activities.filter(activity => 
      lowerInstruction.includes(activity.type.toLowerCase()) ||
      lowerInstruction.includes(activity.name.toLowerCase())
    );
    if (activityMatches.length > 0) {
      confidence += 0.1;
      matchingReasons.push(`Activity match: ${activityMatches.map(a => a.name).join(', ')}`);
    }

    // Generate customization suggestions
    if (confidence > 0.5) {
      customizationSuggestions.push(...this.generateCustomizationSuggestions(template, originalInstruction));
    }

    // Generate subflow recommendations
    const subflowCandidates = this.getSubflowCandidates(template);
    if (subflowCandidates.length > 0) {
      subflowRecommendations.push(...subflowCandidates.map(candidate => 
        `Consider creating ${candidate.name} as a reusable subflow`
      ));
    }

    return {
      template,
      confidence: Math.min(confidence, 1.0),
      matchingReasons,
      customizationSuggestions,
      subflowRecommendations
    };
  }

  /**
   * Get context keywords for matching
   */
  private getContextKeywords(context: FlowContext): string[] {
    const keywords: Record<FlowContext, string[]> = {
      [FlowContext.APPROVAL_WORKFLOW]: ['approval', 'approve', 'reject', 'escalate'],
      [FlowContext.FULFILLMENT_WORKFLOW]: ['fulfillment', 'order', 'catalog', 'request'],
      [FlowContext.NOTIFICATION_WORKFLOW]: ['notification', 'email', 'alert', 'message'],
      [FlowContext.INTEGRATION_WORKFLOW]: ['integration', 'api', 'external', 'sync'],
      [FlowContext.UTILITY_WORKFLOW]: ['utility', 'helper', 'common', 'shared'],
      [FlowContext.BUSINESS_LOGIC]: ['business', 'rule', 'policy', 'validation']
    };
    return keywords[context] || [];
  }

  /**
   * Generate customization suggestions
   */
  private generateCustomizationSuggestions(template: FlowTemplate, instruction: string): string[] {
    const suggestions: string[] = [];
    
    // Check for specific entities mentioned in instruction
    if (instruction.includes('iPhone')) {
      suggestions.push('Customize for iPhone-specific catalog items');
    }
    if (instruction.includes('admin')) {
      suggestions.push('Configure admin-specific assignment rules');
    }
    if (instruction.includes('manager')) {
      suggestions.push('Set up manager approval hierarchy');
    }
    
    // Check customization points
    for (const point of template.customizationPoints) {
      if (point.impact === 'high') {
        suggestions.push(`Configure ${point.name}: ${point.description}`);
      }
    }
    
    return suggestions;
  }

  /**
   * Apply trigger template
   */
  private applyTriggerTemplate(triggerTemplate: FlowTriggerTemplate, customizations: Record<string, any>): any {
    return {
      type: customizations.triggerType || triggerTemplate.type,
      table: customizations.table || triggerTemplate.table,
      condition: customizations.condition || triggerTemplate.condition,
      schedule: customizations.schedule || triggerTemplate.schedule,
      configuration: {
        ...triggerTemplate.configuration,
        ...customizations.triggerConfiguration
      }
    };
  }

  /**
   * Apply activity template
   */
  private applyActivityTemplate(activityTemplate: FlowActivityTemplate, customizations: Record<string, any>): any {
    const activityCustomizations = customizations.activities?.[activityTemplate.id] || {};
    
    return {
      id: activityTemplate.id,
      name: activityCustomizations.name || activityTemplate.name,
      type: activityCustomizations.type || activityTemplate.type,
      label: activityCustomizations.label || activityTemplate.label,
      description: activityCustomizations.description || activityTemplate.description,
      
      inputs: activityTemplate.inputs.map(input => ({
        name: input.name,
        type: input.type,
        required: input.required,
        value: activityCustomizations.inputs?.[input.name] || 
               this.resolveInputValue(input, customizations)
      })),
      
      outputs: activityTemplate.outputs.map(output => ({
        name: output.name,
        type: output.type,
        description: output.description
      })),
      
      configuration: {
        ...activityTemplate.configuration,
        ...activityCustomizations.configuration
      },
      
      position: activityTemplate.position,
      errorHandling: activityTemplate.errorHandling
    };
  }

  /**
   * Apply connection template
   */
  private applyConnectionTemplate(connectionTemplate: FlowConnectionTemplate, customizations: Record<string, any>): any {
    const connectionCustomizations = customizations.connections?.[connectionTemplate.id] || {};
    
    return {
      id: connectionTemplate.id,
      from: connectionTemplate.from,
      to: connectionTemplate.to,
      label: connectionCustomizations.label || connectionTemplate.label,
      condition: connectionCustomizations.condition || connectionTemplate.condition,
      conditionType: connectionTemplate.conditionType
    };
  }

  /**
   * Apply variable template
   */
  private applyVariableTemplate(variableTemplate: FlowVariableTemplate, customizations: Record<string, any>): any {
    const variableCustomizations = customizations.variables?.[variableTemplate.name] || {};
    
    return {
      name: variableTemplate.name,
      type: variableTemplate.type,
      description: variableTemplate.description,
      defaultValue: variableCustomizations.defaultValue || variableTemplate.defaultValue,
      scope: variableTemplate.scope,
      category: variableTemplate.category
    };
  }

  /**
   * Resolve input value based on source type
   */
  private resolveInputValue(input: FlowActivityInput, customizations: Record<string, any>): any {
    switch (input.sourceType) {
      case 'trigger':
        return `\${trigger.${input.sourceReference || input.name}}`;
      case 'variable':
        return `\${flow.${input.sourceReference || input.name}}`;
      case 'previous_activity':
        return `\${${input.sourceReference}.${input.name}}`;
      case 'constant':
        return customizations.constants?.[input.name] || input.defaultValue;
      default:
        return input.defaultValue;
    }
  }

  /**
   * Initialize flow templates
   */
  private initializeTemplates(): void {
    // iPhone 6 Approval and Fulfillment Template
    this.templates.set('iphone-approval-fulfillment', {
      id: 'iphone-approval-fulfillment',
      name: 'iPhone 6 Approval and Fulfillment',
      description: 'Complete workflow for iPhone 6 catalog requests with approval and fulfillment',
      category: 'Catalog Management',
      context: FlowContext.FULFILLMENT_WORKFLOW,
      recommendedType: FlowType.MAIN_FLOW,
      complexity: ComplexityLevel.HIGH,
      reusability: ReusabilityLevel.MEDIUM,
      
      triggers: [{
        id: 'catalog_request_trigger',
        type: 'record_created',
        table: 'sc_req_item',
        condition: 'cat_item.name=iPhone 6',
        description: 'Trigger when iPhone 6 catalog item is requested',
        configuration: {
          filter: 'cat_item.name=iPhone 6',
          active: true
        }
      }],
      
      activities: [
        {
          id: 'approval_check',
          name: 'Manager Approval',
          type: 'approval',
          label: 'Manager Approval',
          description: 'Get manager approval for iPhone 6 request',
          category: 'Approval',
          isSubflowCandidate: true,
          reusabilityScore: 8,
          inputs: [
            {
              name: 'record',
              type: 'reference',
              required: true,
              description: 'Catalog request record',
              sourceType: 'trigger',
              sourceReference: 'current'
            },
            {
              name: 'approver',
              type: 'reference',
              required: true,
              description: 'Manager to approve request',
              sourceType: 'trigger',
              sourceReference: 'current.requested_for.manager'
            }
          ],
          outputs: [
            {
              name: 'approval_state',
              type: 'string',
              description: 'Approval result (approved/rejected)',
              usedByActivities: ['fulfillment_check'],
              isFlowOutput: false
            }
          ],
          configuration: {
            approval_type: 'manager',
            timeout: '48 hours'
          },
          errorHandling: [{
            condition: 'timeout',
            action: 'notify',
            parameters: { escalation_group: 'catalog_admins' },
            description: 'Notify admins on approval timeout'
          }],
          position: { x: 200, y: 100 },
          dependencies: [],
          prerequisites: []
        },
        {
          id: 'fulfillment_check',
          name: 'Fulfillment Decision',
          type: 'condition',
          label: 'Check Approval',
          description: 'Check if request was approved',
          category: 'Decision',
          isSubflowCandidate: false,
          reusabilityScore: 3,
          inputs: [
            {
              name: 'approval_state',
              type: 'string',
              required: true,
              description: 'Approval state from previous step',
              sourceType: 'previous_activity',
              sourceReference: 'approval_check'
            }
          ],
          outputs: [
            {
              name: 'proceed_to_fulfillment',
              type: 'boolean',
              description: 'Whether to proceed with fulfillment',
              usedByActivities: ['admin_task', 'user_task'],
              isFlowOutput: false
            }
          ],
          configuration: {
            condition: 'approval_state=approved'
          },
          errorHandling: [],
          position: { x: 400, y: 100 },
          dependencies: ['approval_check'],
          prerequisites: []
        },
        {
          id: 'admin_task',
          name: 'Create Admin Task',
          type: 'create_task',
          label: 'Admin Preparation',
          description: 'Create task for admin to prepare iPhone 6',
          category: 'Task Management',
          isSubflowCandidate: true,
          reusabilityScore: 7,
          inputs: [
            {
              name: 'parent_record',
              type: 'reference',
              required: true,
              description: 'Parent catalog request',
              sourceType: 'trigger',
              sourceReference: 'current'
            },
            {
              name: 'assigned_to',
              type: 'reference',
              required: true,
              description: 'Admin to assign task to',
              sourceType: 'constant',
              defaultValue: 'admin_group'
            }
          ],
          outputs: [
            {
              name: 'admin_task_id',
              type: 'string',
              description: 'Created admin task ID',
              usedByActivities: ['user_task'],
              isFlowOutput: false
            }
          ],
          configuration: {
            task_type: 'admin_pickup',
            priority: 'medium',
            short_description: 'Prepare iPhone 6 for user pickup'
          },
          errorHandling: [{
            condition: 'creation_failed',
            action: 'retry',
            parameters: { max_retries: 3 },
            description: 'Retry task creation on failure'
          }],
          position: { x: 600, y: 50 },
          dependencies: ['fulfillment_check'],
          prerequisites: ['approval_check']
        },
        {
          id: 'user_task',
          name: 'Create User Task',
          type: 'create_task',
          label: 'User Pickup',
          description: 'Create task for user to pick up iPhone 6',
          category: 'Task Management',
          isSubflowCandidate: true,
          reusabilityScore: 6,
          inputs: [
            {
              name: 'parent_record',
              type: 'reference',
              required: true,
              description: 'Parent catalog request',
              sourceType: 'trigger',
              sourceReference: 'current'
            },
            {
              name: 'assigned_to',
              type: 'reference',
              required: true,
              description: 'User to assign task to',
              sourceType: 'trigger',
              sourceReference: 'current.requested_for'
            }
          ],
          outputs: [
            {
              name: 'user_task_id',
              type: 'string',
              description: 'Created user task ID',
              usedByActivities: ['notification'],
              isFlowOutput: false
            }
          ],
          configuration: {
            task_type: 'user_pickup',
            priority: 'medium',
            short_description: 'Pick up your iPhone 6 from admin desk'
          },
          errorHandling: [{
            condition: 'creation_failed',
            action: 'retry',
            parameters: { max_retries: 3 },
            description: 'Retry task creation on failure'
          }],
          position: { x: 600, y: 150 },
          dependencies: ['fulfillment_check'],
          prerequisites: ['approval_check']
        },
        {
          id: 'notification',
          name: 'Send Notification',
          type: 'notification',
          label: 'Notify User',
          description: 'Send notification to user about iPhone 6 availability',
          category: 'Communication',
          isSubflowCandidate: true,
          reusabilityScore: 9,
          inputs: [
            {
              name: 'recipient',
              type: 'reference',
              required: true,
              description: 'User to notify',
              sourceType: 'trigger',
              sourceReference: 'current.requested_for'
            },
            {
              name: 'message',
              type: 'string',
              required: true,
              description: 'Notification message',
              sourceType: 'constant',
              defaultValue: 'Your iPhone 6 is ready for pickup at the admin desk'
            }
          ],
          outputs: [
            {
              name: 'notification_sent',
              type: 'boolean',
              description: 'Whether notification was sent successfully',
              usedByActivities: [],
              isFlowOutput: true
            }
          ],
          configuration: {
            notification_type: 'email',
            template: 'catalog_item_ready'
          },
          errorHandling: [{
            condition: 'send_failed',
            action: 'retry',
            parameters: { max_retries: 2 },
            description: 'Retry notification sending on failure'
          }],
          position: { x: 800, y: 100 },
          dependencies: ['admin_task', 'user_task'],
          prerequisites: ['fulfillment_check']
        }
      ],
      
      connections: [
        {
          id: 'trigger_to_approval',
          from: 'trigger',
          to: 'approval_check',
          label: 'Start Approval',
          condition: '',
          conditionType: 'always',
          description: 'Start approval process'
        },
        {
          id: 'approval_to_decision',
          from: 'approval_check',
          to: 'fulfillment_check',
          label: 'Check Result',
          condition: '',
          conditionType: 'always',
          description: 'Check approval result'
        },
        {
          id: 'decision_to_admin',
          from: 'fulfillment_check',
          to: 'admin_task',
          label: 'Approved',
          condition: 'approval_state=approved',
          conditionType: 'conditional',
          description: 'Proceed if approved'
        },
        {
          id: 'decision_to_user',
          from: 'fulfillment_check',
          to: 'user_task',
          label: 'Approved',
          condition: 'approval_state=approved',
          conditionType: 'conditional',
          description: 'Proceed if approved'
        },
        {
          id: 'admin_to_notification',
          from: 'admin_task',
          to: 'notification',
          label: 'Task Created',
          condition: '',
          conditionType: 'success',
          description: 'Notify after admin task creation'
        },
        {
          id: 'user_to_notification',
          from: 'user_task',
          to: 'notification',
          label: 'Task Created',
          condition: '',
          conditionType: 'success',
          description: 'Notify after user task creation'
        }
      ],
      
      variables: [
        {
          name: 'catalog_item',
          type: 'reference',
          description: 'iPhone 6 catalog item reference',
          defaultValue: null,
          scope: 'flow',
          category: 'Data'
        },
        {
          name: 'approval_timeout',
          type: 'integer',
          description: 'Approval timeout in hours',
          defaultValue: 48,
          scope: 'flow',
          category: 'Configuration'
        }
      ],
      
      tags: ['iphone', 'catalog', 'approval', 'fulfillment', 'task', 'notification'],
      version: '1.0.0',
      author: 'ServiceNow Multi-Agent System',
      documentation: 'Complete workflow for iPhone 6 catalog requests with approval and fulfillment tasks',
      
      useCases: [
        'iPhone 6 catalog item requests',
        'Hardware catalog fulfillment',
        'Manager approval workflows',
        'User pickup coordination'
      ],
      
      prerequisites: [
        'iPhone 6 catalog item configured',
        'Manager hierarchy defined',
        'Admin group configured',
        'Notification templates available'
      ],
      
      bestPractices: [
        'Set appropriate approval timeouts',
        'Configure escalation for timeouts',
        'Use descriptive task names',
        'Test notification delivery'
      ],
      
      customizationPoints: [
        {
          id: 'approval_hierarchy',
          name: 'Approval Hierarchy',
          description: 'Configure approval hierarchy and rules',
          type: 'configuration',
          location: 'approval_check',
          options: [
            {
              value: 'manager',
              label: 'Manager Only',
              description: 'Require only manager approval',
              implications: ['Faster approval process']
            },
            {
              value: 'manager_and_admin',
              label: 'Manager and Admin',
              description: 'Require both manager and admin approval',
              implications: ['Longer approval process', 'Higher security']
            }
          ],
          impact: 'high'
        },
        {
          id: 'notification_channels',
          name: 'Notification Channels',
          description: 'Configure notification delivery methods',
          type: 'activity',
          location: 'notification',
          options: [
            {
              value: 'email',
              label: 'Email Only',
              description: 'Send notifications via email',
              implications: ['Standard delivery']
            },
            {
              value: 'email_and_sms',
              label: 'Email and SMS',
              description: 'Send notifications via email and SMS',
              implications: ['Faster delivery', 'Higher visibility']
            }
          ],
          impact: 'medium'
        }
      ],
      
      variations: [
        {
          id: 'no_approval',
          name: 'No Approval Required',
          description: 'Skip approval process for low-cost items',
          differences: ['Remove approval_check activity', 'Connect trigger directly to fulfillment'],
          applicableScenarios: ['Low-cost items', 'Auto-approved requests'],
          complexityChange: 'decrease'
        },
        {
          id: 'multi_level_approval',
          name: 'Multi-Level Approval',
          description: 'Add additional approval levels',
          differences: ['Add senior manager approval', 'Add budget approval'],
          applicableScenarios: ['High-cost items', 'Executive requests'],
          complexityChange: 'increase'
        }
      ]
    });

    // Simple Notification Template
    this.templates.set('simple-notification', {
      id: 'simple-notification',
      name: 'Simple Notification',
      description: 'Basic notification workflow for sending alerts',
      category: 'Communication',
      context: FlowContext.NOTIFICATION_WORKFLOW,
      recommendedType: FlowType.SUBFLOW,
      complexity: ComplexityLevel.LOW,
      reusability: ReusabilityLevel.HIGH,
      
      triggers: [{
        id: 'notification_trigger',
        type: 'manual',
        table: 'any',
        description: 'Manual trigger for notification',
        configuration: {
          manual_execution: true
        }
      }],
      
      activities: [
        {
          id: 'send_notification',
          name: 'Send Notification',
          type: 'notification',
          label: 'Send Alert',
          description: 'Send notification to specified recipients',
          category: 'Communication',
          isSubflowCandidate: false,
          reusabilityScore: 10,
          inputs: [
            {
              name: 'recipients',
              type: 'string',
              required: true,
              description: 'Comma-separated list of recipients',
              sourceType: 'trigger'
            },
            {
              name: 'subject',
              type: 'string',
              required: true,
              description: 'Email subject line',
              sourceType: 'trigger'
            },
            {
              name: 'message',
              type: 'string',
              required: true,
              description: 'Notification message',
              sourceType: 'trigger'
            }
          ],
          outputs: [
            {
              name: 'sent_successfully',
              type: 'boolean',
              description: 'Whether notification was sent',
              usedByActivities: [],
              isFlowOutput: true
            }
          ],
          configuration: {
            notification_type: 'email'
          },
          errorHandling: [{
            condition: 'send_failed',
            action: 'retry',
            parameters: { max_retries: 3 },
            description: 'Retry sending on failure'
          }],
          position: { x: 200, y: 100 },
          dependencies: [],
          prerequisites: []
        }
      ],
      
      connections: [
        {
          id: 'trigger_to_send',
          from: 'trigger',
          to: 'send_notification',
          label: 'Send',
          condition: '',
          conditionType: 'always',
          description: 'Send notification'
        }
      ],
      
      variables: [
        {
          name: 'delivery_method',
          type: 'string',
          description: 'Notification delivery method',
          defaultValue: 'email',
          scope: 'flow',
          category: 'Configuration'
        }
      ],
      
      tags: ['notification', 'email', 'alert', 'communication', 'simple'],
      version: '1.0.0',
      author: 'ServiceNow Multi-Agent System',
      documentation: 'Simple notification workflow for sending alerts via email',
      
      useCases: [
        'Basic email notifications',
        'Alert sending',
        'Status updates',
        'Simple communications'
      ],
      
      prerequisites: [
        'Email configuration',
        'Notification templates'
      ],
      
      bestPractices: [
        'Use clear subject lines',
        'Keep messages concise',
        'Test delivery before production'
      ],
      
      customizationPoints: [
        {
          id: 'delivery_channels',
          name: 'Delivery Channels',
          description: 'Configure notification delivery channels',
          type: 'configuration',
          location: 'send_notification',
          options: [
            {
              value: 'email',
              label: 'Email',
              description: 'Send via email',
              implications: ['Standard delivery']
            },
            {
              value: 'sms',
              label: 'SMS',
              description: 'Send via SMS',
              implications: ['Faster delivery']
            }
          ],
          impact: 'medium'
        }
      ],
      
      variations: [
        {
          id: 'rich_notification',
          name: 'Rich Notification',
          description: 'Add HTML formatting and attachments',
          differences: ['Add HTML formatting', 'Add attachment support'],
          applicableScenarios: ['Rich content', 'Reports', 'Branded communications'],
          complexityChange: 'increase'
        }
      ]
    });

    // Additional templates would be added here...
  }

  /**
   * Initialize flow patterns
   */
  private initializePatterns(): void {
    this.patterns = [
      {
        name: 'Approval Pattern',
        description: 'Standard approval workflow with escalation',
        context: FlowContext.APPROVAL_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['approve', 'reject', 'escalate'],
        inputPatterns: ['record', 'approver', 'timeout'],
        outputPatterns: ['approval_state', 'approved_by'],
        complexity: ComplexityLevel.MEDIUM
      },
      {
        name: 'Fulfillment Pattern',
        description: 'Complete fulfillment workflow with tasks',
        context: FlowContext.FULFILLMENT_WORKFLOW,
        recommendedType: FlowType.MAIN_FLOW,
        commonActions: ['validate', 'create_task', 'notify'],
        inputPatterns: ['catalog_item', 'requestor', 'approver'],
        outputPatterns: ['fulfillment_status', 'task_ids'],
        complexity: ComplexityLevel.HIGH
      },
      {
        name: 'Notification Pattern',
        description: 'Multi-channel notification system',
        context: FlowContext.NOTIFICATION_WORKFLOW,
        recommendedType: FlowType.SUBFLOW,
        commonActions: ['format_message', 'send_notification'],
        inputPatterns: ['recipients', 'message', 'channel'],
        outputPatterns: ['sent_successfully', 'delivery_status'],
        complexity: ComplexityLevel.LOW
      }
    ];
  }
}
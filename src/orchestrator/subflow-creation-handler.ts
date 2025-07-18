/**
 * ServiceNow Subflow Creation Handler
 * 
 * This module handles the creation of subflows with proper input/output management,
 * validation, and integration with the main flow composer.
 */

import { Logger } from '../utils/logger.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { 
  SubflowCandidate, 
  SubflowInput, 
  SubflowOutput, 
  FlowType,
  ComplexityLevel,
  ReusabilityLevel 
} from './flow-subflow-decision-engine.js';

/**
 * Subflow definition structure
 */
export interface SubflowDefinition {
  name: string;
  label: string;
  description: string;
  category: string;
  inputs: SubflowInputDefinition[];
  outputs: SubflowOutputDefinition[];
  activities: SubflowActivity[];
  connections: SubflowConnection[];
  errorHandling: SubflowErrorHandling[];
  metadata: SubflowMetadata;
}

/**
 * Enhanced subflow input definition
 */
export interface SubflowInputDefinition extends SubflowInput {
  label: string;
  category: string;
  order: number;
  tooltip?: string;
  placeholder?: string;
  options?: string[];
  dependsOn?: string[];
  conditionalLogic?: string;
}

/**
 * Enhanced subflow output definition
 */
export interface SubflowOutputDefinition extends SubflowOutput {
  label: string;
  category: string;
  order: number;
  tooltip?: string;
  format?: string;
  conditionalLogic?: string;
}

/**
 * Subflow activity definition
 */
export interface SubflowActivity {
  id: string;
  name: string;
  type: string;
  label: string;
  description: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  position: { x: number; y: number };
  configuration: Record<string, any>;
  errorHandling: ActivityErrorHandling[];
}

/**
 * Subflow connection definition
 */
export interface SubflowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
  conditionLabel?: string;
  errorPath?: boolean;
}

/**
 * Subflow error handling
 */
export interface SubflowErrorHandling {
  id: string;
  condition: string;
  action: 'retry' | 'skip' | 'stop' | 'notify' | 'fallback';
  parameters: Record<string, any>;
  description: string;
}

/**
 * Activity-specific error handling
 */
export interface ActivityErrorHandling {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

/**
 * Subflow metadata
 */
export interface SubflowMetadata {
  version: string;
  author: string;
  created: Date;
  updated: Date;
  tags: string[];
  complexity: ComplexityLevel;
  reusability: ReusabilityLevel;
  testCoverage: number;
  documentation: string;
  dependencies: string[];
  compatibleVersions: string[];
}

/**
 * Subflow creation result
 */
export interface SubflowCreationResult {
  success: boolean;
  subflow?: SubflowDefinition;
  sys_id?: string;
  url?: string;
  validationErrors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Subflow template
 */
export interface SubflowTemplate {
  name: string;
  description: string;
  category: string;
  complexity: ComplexityLevel;
  baseInputs: SubflowInputDefinition[];
  baseOutputs: SubflowOutputDefinition[];
  baseActivities: SubflowActivity[];
  baseConnections: SubflowConnection[];
  customizationPoints: string[];
}

/**
 * Subflow Creation Handler
 */
export class SubflowCreationHandler {
  private logger: Logger;
  private client: ServiceNowClient;
  private templates: Map<string, SubflowTemplate> = new Map();

  constructor() {
    this.logger = new Logger('SubflowCreationHandler');
    this.client = new ServiceNowClient();
    this.initializeTemplates();
  }

  /**
   * Create a subflow from a candidate
   */
  async createSubflow(candidate: SubflowCandidate): Promise<SubflowCreationResult> {
    this.logger.info('Creating subflow from candidate', { name: candidate.name });

    try {
      // Validate the candidate
      const validationResult = this.validateCandidate(candidate);
      if (!validationResult.isValid) {
        return {
          success: false,
          validationErrors: validationResult.errors
        };
      }

      // Build the subflow definition
      const subflowDef = this.buildSubflowDefinition(candidate);

      // Validate the complete definition
      const defValidation = this.validateSubflowDefinition(subflowDef);
      if (!defValidation.isValid) {
        return {
          success: false,
          validationErrors: defValidation.errors
        };
      }

      // Deploy to ServiceNow
      const deployResult = await this.deploySubflow(subflowDef);
      if (!deployResult.success) {
        return {
          success: false,
          validationErrors: [deployResult.error || 'Deployment failed']
        };
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(subflowDef);

      return {
        success: true,
        subflow: subflowDef,
        sys_id: deployResult.sys_id,
        url: deployResult.url,
        warnings: defValidation.warnings,
        recommendations
      };

    } catch (error) {
      this.logger.error('Failed to create subflow', error);
      return {
        success: false,
        validationErrors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Create multiple subflows from candidates
   */
  async createMultipleSubflows(candidates: SubflowCandidate[]): Promise<SubflowCreationResult[]> {
    this.logger.info('Creating multiple subflows', { count: candidates.length });

    const results: SubflowCreationResult[] = [];
    
    for (const candidate of candidates) {
      const result = await this.createSubflow(candidate);
      results.push(result);
      
      // Add delay to avoid overwhelming ServiceNow
      await this.delay(500);
    }

    return results;
  }

  /**
   * Build subflow definition from candidate
   */
  private buildSubflowDefinition(candidate: SubflowCandidate): SubflowDefinition {
    const name = this.sanitizeName(candidate.name);
    const label = candidate.name;
    
    // Get template if available
    const template = this.findMatchingTemplate(candidate);
    
    return {
      name,
      label,
      description: candidate.description,
      category: this.determineCategory(candidate),
      inputs: this.buildInputDefinitions(candidate.inputs, template),
      outputs: this.buildOutputDefinitions(candidate.outputs, template),
      activities: this.buildActivities(candidate, template),
      connections: this.buildConnections(candidate, template),
      errorHandling: this.buildErrorHandling(candidate),
      metadata: {
        version: '1.0.0',
        author: 'ServiceNow Multi-Agent System',
        created: new Date(),
        updated: new Date(),
        tags: this.generateTags(candidate),
        complexity: candidate.complexity,
        reusability: candidate.reusability,
        testCoverage: 0,
        documentation: this.generateDocumentation(candidate),
        dependencies: [],
        compatibleVersions: ['Tokyo', 'Utah', 'Vancouver']
      }
    };
  }

  /**
   * Build input definitions with enhanced metadata
   */
  private buildInputDefinitions(inputs: SubflowInput[], template?: SubflowTemplate): SubflowInputDefinition[] {
    return inputs.map((input, index) => {
      const baseInput = template?.baseInputs.find(base => base.name === input.name);
      
      return {
        ...input,
        label: this.generateInputLabel(input.name),
        category: this.categorizeInput(input),
        order: index + 1,
        tooltip: input.description,
        placeholder: this.generatePlaceholder(input),
        options: this.generateInputOptions(input),
        dependsOn: this.findInputDependencies(input, inputs),
        conditionalLogic: baseInput?.conditionalLogic
      };
    });
  }

  /**
   * Build output definitions with enhanced metadata
   */
  private buildOutputDefinitions(outputs: SubflowOutput[], template?: SubflowTemplate): SubflowOutputDefinition[] {
    return outputs.map((output, index) => {
      const baseOutput = template?.baseOutputs.find(base => base.name === output.name);
      
      return {
        ...output,
        label: this.generateOutputLabel(output.name),
        category: this.categorizeOutput(output),
        order: index + 1,
        tooltip: output.description,
        format: this.generateOutputFormat(output),
        conditionalLogic: baseOutput?.conditionalLogic
      };
    });
  }

  /**
   * Build activities for the subflow
   */
  private buildActivities(candidate: SubflowCandidate, template?: SubflowTemplate): SubflowActivity[] {
    const activities: SubflowActivity[] = [];
    
    // Add start activity
    activities.push({
      id: 'start',
      name: 'Start',
      type: 'start',
      label: 'Start',
      description: 'Subflow start point',
      inputs: {},
      outputs: {},
      position: { x: 100, y: 100 },
      configuration: {},
      errorHandling: []
    });

    // Add main processing activities based on actions
    candidate.actions.forEach((action, index) => {
      const activityId = `activity_${index + 1}`;
      const activity = this.createActivityFromAction(action, activityId, index);
      activities.push(activity);
    });

    // Add end activity
    activities.push({
      id: 'end',
      name: 'End',
      type: 'end',
      label: 'End',
      description: 'Subflow end point',
      inputs: {},
      outputs: this.buildEndOutputs(candidate.outputs),
      position: { x: 100 + (candidate.actions.length + 1) * 200, y: 100 },
      configuration: {},
      errorHandling: []
    });

    return activities;
  }

  /**
   * Build connections between activities
   */
  private buildConnections(candidate: SubflowCandidate, template?: SubflowTemplate): SubflowConnection[] {
    const connections: SubflowConnection[] = [];
    
    // Sequential connections
    let previousId = 'start';
    
    candidate.actions.forEach((action, index) => {
      const currentId = `activity_${index + 1}`;
      
      connections.push({
        id: `connection_${index + 1}`,
        from: previousId,
        to: currentId,
        label: this.generateConnectionLabel(action)
      });
      
      previousId = currentId;
    });

    // Final connection to end
    connections.push({
      id: 'connection_end',
      from: previousId,
      to: 'end',
      label: 'Complete'
    });

    return connections;
  }

  /**
   * Build error handling for the subflow
   */
  private buildErrorHandling(candidate: SubflowCandidate): SubflowErrorHandling[] {
    const errorHandling: SubflowErrorHandling[] = [];

    // Global error handler
    errorHandling.push({
      id: 'global_error',
      condition: 'any_activity_failed',
      action: 'stop',
      parameters: {
        message: `Error in ${candidate.name} subflow`,
        log_level: 'error'
      },
      description: 'Handle any unexpected errors'
    });

    // Specific error handlers based on complexity
    if (candidate.complexity === ComplexityLevel.HIGH || candidate.complexity === ComplexityLevel.VERY_HIGH) {
      errorHandling.push({
        id: 'retry_handler',
        condition: 'temporary_failure',
        action: 'retry',
        parameters: {
          max_retries: 3,
          delay_seconds: 5
        },
        description: 'Retry on temporary failures'
      });
    }

    return errorHandling;
  }

  /**
   * Create activity from action string
   */
  private createActivityFromAction(action: string, activityId: string, index: number): SubflowActivity {
    const activityType = this.mapActionToActivityType(action);
    
    return {
      id: activityId,
      name: this.generateActivityName(action),
      type: activityType,
      label: this.generateActivityLabel(action),
      description: this.generateActivityDescription(action),
      inputs: this.generateActivityInputs(action),
      outputs: this.generateActivityOutputs(action),
      position: { x: 100 + (index + 1) * 200, y: 100 },
      configuration: this.generateActivityConfiguration(action),
      errorHandling: this.generateActivityErrorHandling(action)
    };
  }

  /**
   * Validate candidate before processing
   */
  private validateCandidate(candidate: SubflowCandidate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!candidate.name || candidate.name.trim() === '') {
      errors.push('Subflow name is required');
    }

    if (!candidate.description || candidate.description.trim() === '') {
      errors.push('Subflow description is required');
    }

    if (!candidate.actions || candidate.actions.length === 0) {
      errors.push('At least one action is required');
    }

    if (candidate.inputs.length === 0) {
      errors.push('At least one input parameter is required');
    }

    if (candidate.outputs.length === 0) {
      errors.push('At least one output parameter is required');
    }

    // Validate input parameters
    candidate.inputs.forEach((input, index) => {
      if (!input.name || input.name.trim() === '') {
        errors.push(`Input parameter ${index + 1} name is required`);
      }
      if (!input.type || input.type.trim() === '') {
        errors.push(`Input parameter ${index + 1} type is required`);
      }
    });

    // Validate output parameters
    candidate.outputs.forEach((output, index) => {
      if (!output.name || output.name.trim() === '') {
        errors.push(`Output parameter ${index + 1} name is required`);
      }
      if (!output.type || output.type.trim() === '') {
        errors.push(`Output parameter ${index + 1} type is required`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate complete subflow definition
   */
  private validateSubflowDefinition(definition: SubflowDefinition): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic structure
    if (!definition.name || definition.name.trim() === '') {
      errors.push('Subflow name is required');
    }

    if (definition.activities.length < 3) { // start, at least one activity, end
      errors.push('Subflow must have at least one processing activity');
    }

    if (definition.connections.length < 2) { // start->activity, activity->end
      errors.push('Subflow must have proper connections');
    }

    // Validate connections
    const activityIds = new Set(definition.activities.map(a => a.id));
    definition.connections.forEach(conn => {
      if (!activityIds.has(conn.from)) {
        errors.push(`Connection references unknown activity: ${conn.from}`);
      }
      if (!activityIds.has(conn.to)) {
        errors.push(`Connection references unknown activity: ${conn.to}`);
      }
    });

    // Warnings for best practices
    if (definition.inputs.length > 10) {
      warnings.push('Subflow has many input parameters, consider grouping related parameters');
    }

    if (definition.outputs.length > 5) {
      warnings.push('Subflow has many output parameters, consider consolidating outputs');
    }

    if (definition.activities.length > 15) {
      warnings.push('Subflow is complex, consider breaking into smaller subflows');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Deploy subflow to ServiceNow
   */
  private async deploySubflow(definition: SubflowDefinition): Promise<{ success: boolean; sys_id?: string; url?: string; error?: string }> {
    try {
      // Convert to ServiceNow format
      const serviceNowFormat = this.convertToServiceNowFormat(definition);
      
      // Deploy via ServiceNow client (using createFlow for now until createSubflow is implemented)
      const result = await this.client.createFlow(serviceNowFormat);
      
      if (result.success) {
        return {
          success: true,
          sys_id: result.data.sys_id,
          url: `https://${process.env.SNOW_INSTANCE}/flow_designer.do#/subflow/${result.data.sys_id}`
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown deployment error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Convert subflow definition to ServiceNow format
   */
  private convertToServiceNowFormat(definition: SubflowDefinition): any {
    return {
      name: definition.name,
      label: definition.label,
      description: definition.description,
      category: definition.category,
      active: true,
      inputs: definition.inputs.map(input => ({
        name: input.name,
        label: input.label,
        type: input.type,
        mandatory: input.required,
        description: input.description,
        default_value: input.defaultValue,
        tooltip: input.tooltip,
        options: input.options,
        order: input.order
      })),
      outputs: definition.outputs.map(output => ({
        name: output.name,
        label: output.label,
        type: output.type,
        description: output.description,
        order: output.order
      })),
      activities: definition.activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        label: activity.label,
        description: activity.description,
        position: activity.position,
        inputs: activity.inputs,
        outputs: activity.outputs,
        configuration: activity.configuration
      })),
      connections: definition.connections.map(conn => ({
        id: conn.id,
        from: conn.from,
        to: conn.to,
        label: conn.label,
        condition: conn.condition
      }))
    };
  }

  /**
   * Generate recommendations for the subflow
   */
  private generateRecommendations(definition: SubflowDefinition): string[] {
    const recommendations: string[] = [];

    // Input recommendations
    if (definition.inputs.length > 5) {
      recommendations.push('Consider grouping related input parameters into objects');
    }

    // Activity recommendations
    if (definition.activities.length > 10) {
      recommendations.push('Consider breaking this subflow into smaller, more focused subflows');
    }

    // Error handling recommendations
    if (definition.errorHandling.length === 0) {
      recommendations.push('Add error handling for better robustness');
    }

    // Documentation recommendations
    if (!definition.metadata.documentation || definition.metadata.documentation.length < 100) {
      recommendations.push('Add comprehensive documentation for better maintainability');
    }

    // Testing recommendations
    recommendations.push('Create test cases to verify subflow functionality');
    recommendations.push('Consider adding validation activities for input parameters');

    return recommendations;
  }

  /**
   * Initialize subflow templates
   */
  private initializeTemplates(): void {
    // Approval template
    this.templates.set('approval', {
      name: 'Approval Process',
      description: 'Standard approval workflow template',
      category: 'Approval',
      complexity: ComplexityLevel.MEDIUM,
      baseInputs: [
        {
          name: 'record',
          label: 'Record',
          type: 'reference',
          required: true,
          description: 'Record to approve',
          category: 'Data',
          order: 1
        },
        {
          name: 'approvers',
          label: 'Approvers',
          type: 'string',
          required: true,
          description: 'List of approvers',
          category: 'Configuration',
          order: 2
        }
      ],
      baseOutputs: [
        {
          name: 'approval_state',
          label: 'Approval State',
          type: 'string',
          description: 'Final approval state',
          category: 'Result',
          order: 1
        }
      ],
      baseActivities: [],
      baseConnections: [],
      customizationPoints: ['approval_logic', 'notification_template', 'timeout_handling']
    });

    // Notification template
    this.templates.set('notification', {
      name: 'Notification Sender',
      description: 'Multi-channel notification template',
      category: 'Communication',
      complexity: ComplexityLevel.LOW,
      baseInputs: [
        {
          name: 'recipients',
          label: 'Recipients',
          type: 'string',
          required: true,
          description: 'Notification recipients',
          category: 'Configuration',
          order: 1
        },
        {
          name: 'message',
          label: 'Message',
          type: 'string',
          required: true,
          description: 'Notification message',
          category: 'Content',
          order: 2
        }
      ],
      baseOutputs: [
        {
          name: 'sent_successfully',
          label: 'Sent Successfully',
          type: 'boolean',
          description: 'Whether notification was sent',
          category: 'Result',
          order: 1
        }
      ],
      baseActivities: [],
      baseConnections: [],
      customizationPoints: ['message_template', 'delivery_method', 'retry_logic']
    });
  }

  // Helper methods
  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  }

  private determineCategory(candidate: SubflowCandidate): string {
    if (candidate.name.toLowerCase().includes('approval')) return 'Approval';
    if (candidate.name.toLowerCase().includes('notification')) return 'Communication';
    if (candidate.name.toLowerCase().includes('data')) return 'Data Processing';
    if (candidate.name.toLowerCase().includes('integration')) return 'Integration';
    return 'Utility';
  }

  private findMatchingTemplate(candidate: SubflowCandidate): SubflowTemplate | undefined {
    const nameKey = candidate.name.toLowerCase();
    for (const [key, template] of this.templates) {
      if (nameKey.includes(key)) {
        return template;
      }
    }
    return undefined;
  }

  private generateTags(candidate: SubflowCandidate): string[] {
    const tags: string[] = [];
    tags.push(candidate.complexity.toLowerCase());
    tags.push(candidate.reusability.toLowerCase());
    tags.push('auto-generated');
    return tags;
  }

  private generateDocumentation(candidate: SubflowCandidate): string {
    return `
# ${candidate.name}

## Description
${candidate.description}

## Reason for Creation
${candidate.reason}

## Complexity Level
${candidate.complexity}

## Reusability Level
${candidate.reusability}

## Actions
${candidate.actions.map(action => `- ${action}`).join('\n')}

## Usage
This subflow can be used in any flow that requires ${candidate.name.toLowerCase()} functionality.

## Inputs
${candidate.inputs.map(input => `- **${input.name}** (${input.type}): ${input.description}`).join('\n')}

## Outputs
${candidate.outputs.map(output => `- **${output.name}** (${output.type}): ${output.description}`).join('\n')}
    `.trim();
  }

  private generateInputLabel(name: string): string {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private generateOutputLabel(name: string): string {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private categorizeInput(input: SubflowInput): string {
    if (input.type === 'reference') return 'Data';
    if (input.name.includes('config') || input.name.includes('setting')) return 'Configuration';
    if (input.name.includes('message') || input.name.includes('content')) return 'Content';
    return 'General';
  }

  private categorizeOutput(output: SubflowOutput): string {
    if (output.name.includes('result') || output.name.includes('success')) return 'Result';
    if (output.name.includes('data') || output.name.includes('record')) return 'Data';
    if (output.name.includes('status') || output.name.includes('state')) return 'Status';
    return 'General';
  }

  private generatePlaceholder(input: SubflowInput): string {
    switch (input.type) {
      case 'string': return `Enter ${input.name}`;
      case 'number': return '0';
      case 'boolean': return 'true';
      default: return '';
    }
  }

  private generateInputOptions(input: SubflowInput): string[] | undefined {
    if (input.name.includes('priority')) {
      return ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'];
    }
    if (input.name.includes('state')) {
      return ['New', 'In Progress', 'Completed', 'Cancelled'];
    }
    return undefined;
  }

  private findInputDependencies(input: SubflowInput, allInputs: SubflowInput[]): string[] {
    // Simple dependency detection based on naming patterns
    const dependencies: string[] = [];
    if (input.name.includes('_type') || input.name.includes('_method')) {
      const baseNames = allInputs.map(i => i.name).filter(name => 
        name !== input.name && input.name.includes(name.split('_')[0])
      );
      dependencies.push(...baseNames);
    }
    return dependencies;
  }

  private generateOutputFormat(output: SubflowOutput): string {
    switch (output.type) {
      case 'string': return 'text';
      case 'number': return 'numeric';
      case 'boolean': return 'true/false';
      case 'object': return 'json';
      default: return 'text';
    }
  }

  private buildEndOutputs(outputs: SubflowOutput[]): Record<string, any> {
    const endOutputs: Record<string, any> = {};
    outputs.forEach(output => {
      endOutputs[output.name] = `\${subflow.${output.name}}`;
    });
    return endOutputs;
  }

  private generateConnectionLabel(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  private mapActionToActivityType(action: string): string {
    const actionMap: Record<string, string> = {
      'approve': 'approval',
      'reject': 'approval',
      'notify': 'notification',
      'send': 'notification',
      'create': 'create_record',
      'update': 'update_record',
      'delete': 'delete_record',
      'validate': 'script',
      'process': 'script',
      'transform': 'script',
      'integrate': 'rest',
      'schedule': 'timer',
      'assign': 'assignment',
      'escalate': 'escalation',
      'complete': 'script',
      'cancel': 'script',
      'retry': 'script',
      'log': 'log',
      'track': 'script',
      'monitor': 'script'
    };
    return actionMap[action] || 'script';
  }

  private generateActivityName(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  private generateActivityLabel(action: string): string {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private generateActivityDescription(action: string): string {
    return `Execute ${action} operation`;
  }

  private generateActivityInputs(action: string): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // Common inputs for all activities
    inputs.record = '${subflow.record}';
    
    // Action-specific inputs
    switch (action) {
      case 'approve':
      case 'reject':
        inputs.approvers = '${subflow.approvers}';
        break;
      case 'notify':
      case 'send':
        inputs.recipients = '${subflow.recipients}';
        inputs.message = '${subflow.message}';
        break;
      case 'create':
      case 'update':
        inputs.table = '${subflow.table}';
        inputs.data = '${subflow.data}';
        break;
    }
    
    return inputs;
  }

  private generateActivityOutputs(action: string): Record<string, any> {
    const outputs: Record<string, any> = {};
    
    // Common outputs
    outputs.success = '${step.success}';
    
    // Action-specific outputs
    switch (action) {
      case 'approve':
      case 'reject':
        outputs.approval_state = '${step.approval_state}';
        outputs.approved_by = '${step.approved_by}';
        break;
      case 'notify':
      case 'send':
        outputs.notification_sent = '${step.notification_sent}';
        break;
      case 'create':
        outputs.created_record = '${step.created_record}';
        break;
      case 'update':
        outputs.updated_record = '${step.updated_record}';
        break;
    }
    
    return outputs;
  }

  private generateActivityConfiguration(action: string): Record<string, any> {
    const config: Record<string, any> = {};
    
    switch (action) {
      case 'approve':
        config.approval_type = 'sequential';
        config.timeout = '24 hours';
        break;
      case 'notify':
        config.notification_type = 'email';
        break;
      case 'create':
        config.insert_mode = 'single';
        break;
    }
    
    return config;
  }

  private generateActivityErrorHandling(action: string): ActivityErrorHandling[] {
    const errorHandling: ActivityErrorHandling[] = [];
    
    // Common error handling
    errorHandling.push({
      condition: 'step.success === false',
      action: 'stop',
      parameters: {
        message: `Failed to execute ${action}`
      }
    });
    
    // Action-specific error handling
    if (action === 'approve') {
      errorHandling.push({
        condition: 'step.timeout === true',
        action: 'escalate',
        parameters: {
          escalation_group: 'managers'
        }
      });
    }
    
    return errorHandling;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
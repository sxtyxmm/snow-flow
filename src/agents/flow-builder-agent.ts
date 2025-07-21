/**
 * Flow Builder Agent
 * Specializes in creating ServiceNow Flow Designer workflows
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';

export class FlowBuilderAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
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
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('Starting flow creation', 0);

      // Analyze flow requirements
      const requirements = await this.analyzeFlowRequirements(instruction);
      await this.reportProgress('Analyzed flow requirements', 15);

      // Check for existing flows
      const existingFlows = await this.checkExistingFlows(requirements);
      if (existingFlows.length > 0) {
        await this.reportProgress('Found existing flows for reference', 25);
      }

      // Design flow structure
      const flowStructure = await this.designFlowStructure(requirements);
      await this.reportProgress('Designed flow structure', 40);

      // Create flow definition
      const flowDefinition = await this.createFlowDefinition(requirements, flowStructure);
      await this.reportProgress('Created flow definition', 60);

      // Configure triggers
      const triggers = await this.configureTriggers(requirements);
      await this.reportProgress('Configured flow triggers', 70);

      // Set up actions
      const actions = await this.setupActions(requirements, flowStructure);
      await this.reportProgress('Set up flow actions', 80);

      // Create flow artifact
      const artifact: ServiceNowArtifact = {
        type: 'flow',
        name: requirements.name,
        config: {
          definition: flowDefinition,
          triggers,
          actions,
          metadata: {
            description: requirements.description,
            category: requirements.category,
            type: requirements.flowType
          }
        },
        dependencies: requirements.dependencies
      };

      // Store artifact for other agents
      await this.storeArtifact(artifact);
      await this.reportProgress('Flow artifact created and stored', 90);

      // Prepare deployment instructions
      const deploymentInstructions = this.prepareDeploymentInstructions(requirements, artifact);

      await this.reportProgress('Flow creation completed', 100);
      this.setStatus('completed');

      await this.logActivity('flow_creation', true, {
        flowName: requirements.name,
        flowType: requirements.flowType,
        triggerCount: triggers.length,
        actionCount: actions.length
      });

      return {
        success: true,
        artifacts: [artifact],
        message: `Flow "${requirements.name}" created successfully`,
        metadata: {
          deploymentInstructions,
          flowType: requirements.flowType,
          triggers: triggers.length,
          actions: actions.length,
          hasApprovals: requirements.needsApproval,
          hasIntegrations: requirements.needsIntegration
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('flow_creation', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `Failed to create flow: ${error.message}`
      };
    }
  }

  private async analyzeFlowRequirements(instruction: string): Promise<any> {
    const requirements = {
      name: '',
      description: instruction,
      flowType: 'flow', // flow, subflow, or action
      category: 'custom',
      triggerType: '',
      targetTable: '',
      needsApproval: false,
      needsNotification: false,
      needsIntegration: false,
      needsCatalogLink: false,
      conditions: [] as string[],
      dependencies: [] as string[],
      steps: [] as string[]
    };

    // Extract flow name
    const nameMatch = instruction.match(/(?:create|build|design)\s+(?:a\s+)?([a-zA-Z0-9_\s]+)\s*(?:flow|workflow|process)/i);
    if (nameMatch) {
      requirements.name = nameMatch[1].trim().toLowerCase().replace(/\s+/g, '_') + '_flow';
    }

    // Determine flow type
    if (/subflow/i.test(instruction)) {
      requirements.flowType = 'subflow';
    } else if (/action/i.test(instruction)) {
      requirements.flowType = 'action';
    }

    // Detect trigger type
    if (/when\s+(?:a\s+)?(?:new\s+)?record\s+is\s+created/i.test(instruction)) {
      requirements.triggerType = 'record_created';
    } else if (/when\s+(?:a\s+)?record\s+is\s+updated/i.test(instruction)) {
      requirements.triggerType = 'record_updated';
    } else if (/scheduled|daily|weekly|monthly/i.test(instruction)) {
      requirements.triggerType = 'scheduled';
    } else if (/manual|on[\s-]?demand/i.test(instruction)) {
      requirements.triggerType = 'manual';
    }

    // Detect target table
    if (/incident/i.test(instruction)) {
      requirements.targetTable = 'incident';
      requirements.category = 'itsm';
    } else if (/request|catalog/i.test(instruction)) {
      requirements.targetTable = 'sc_request';
      requirements.category = 'service_catalog';
      requirements.needsCatalogLink = true;
    } else if (/change/i.test(instruction)) {
      requirements.targetTable = 'change_request';
      requirements.category = 'change_management';
    } else if (/task/i.test(instruction)) {
      requirements.targetTable = 'task';
      requirements.category = 'task_management';
    }

    // Feature detection
    if (/approval|approve|manager/i.test(instruction)) {
      requirements.needsApproval = true;
      requirements.steps.push('approval');
      requirements.dependencies.push('sys_user_group');
    }

    if (/notify|notification|email|send\s+message/i.test(instruction)) {
      requirements.needsNotification = true;
      requirements.steps.push('notification');
    }

    if (/integrate|api|external|rest/i.test(instruction)) {
      requirements.needsIntegration = true;
      requirements.steps.push('integration');
      requirements.dependencies.push('sys_rest_message');
    }

    // Extract conditions
    const conditionMatches = instruction.match(/(?:if|when|condition)\s+([^,\.]+)/gi);
    if (conditionMatches) {
      requirements.conditions = conditionMatches.map(match => 
        match.replace(/^(if|when|condition)\s+/i, '').trim()
      );
    }

    return requirements;
  }

  private async checkExistingFlows(requirements: any): Promise<any[]> {
    // Would use snow_discover_existing_flows MCP tool
    // For now, return empty array
    return [];
  }

  private async designFlowStructure(requirements: any): Promise<any> {
    const structure = {
      stages: [] as any[],
      decisionPoints: [] as any[],
      parallelPaths: false,
      errorHandling: true
    };

    // Start stage
    structure.stages.push({
      name: 'Start',
      type: 'trigger',
      position: { x: 100, y: 100 }
    });

    let currentX = 300;
    const currentY = 100;
    const stepSpacing = 200;

    // Add validation stage if complex flow
    if (requirements.conditions.length > 0) {
      structure.stages.push({
        name: 'Validate Input',
        type: 'action',
        actionType: 'script',
        position: { x: currentX, y: currentY }
      });
      currentX += stepSpacing;
    }

    // Add approval stage if needed
    if (requirements.needsApproval) {
      structure.stages.push({
        name: 'Request Approval',
        type: 'approval',
        position: { x: currentX, y: currentY }
      });
      currentX += stepSpacing;

      // Add decision point for approval result
      structure.decisionPoints.push({
        name: 'Approval Decision',
        condition: 'approval.result == "approved"',
        position: { x: currentX, y: currentY },
        truePath: 'Continue',
        falsePath: 'Rejection Handler'
      });
      currentX += stepSpacing;
    }

    // Add main action stage
    structure.stages.push({
      name: 'Execute Main Action',
      type: 'action',
      actionType: requirements.needsIntegration ? 'integration' : 'script',
      position: { x: currentX, y: currentY }
    });
    currentX += stepSpacing;

    // Add notification stage if needed
    if (requirements.needsNotification) {
      structure.stages.push({
        name: 'Send Notification',
        type: 'notification',
        position: { x: currentX, y: currentY }
      });
      currentX += stepSpacing;
    }

    // End stage
    structure.stages.push({
      name: 'End',
      type: 'end',
      position: { x: currentX, y: currentY }
    });

    // Add error handling path
    if (structure.errorHandling) {
      structure.stages.push({
        name: 'Error Handler',
        type: 'error_handler',
        position: { x: 300, y: 250 }
      });
    }

    return structure;
  }

  private async createFlowDefinition(requirements: any, structure: any): Promise<any> {
    const definition = {
      name: requirements.name,
      description: requirements.description,
      type: requirements.flowType,
      category: requirements.category,
      active: true,
      stages: structure.stages,
      connections: [] as any[],
      variables: [] as any[],
      settings: {
        run_as: 'system',
        error_handling: 'stop_on_error',
        logging_level: 'info'
      }
    };

    // Create connections between stages
    for (let i = 0; i < structure.stages.length - 1; i++) {
      const fromStage = structure.stages[i];
      const toStage = structure.stages[i + 1];
      
      // Skip if this is a decision point
      if (structure.decisionPoints.some(dp => dp.name === fromStage.name)) {
        continue;
      }

      definition.connections.push({
        from: fromStage.name,
        to: toStage.name,
        condition: 'always'
      });
    }

    // Add decision point connections
    for (const decisionPoint of structure.decisionPoints) {
      definition.connections.push({
        from: decisionPoint.name,
        to: decisionPoint.truePath,
        condition: decisionPoint.condition
      });
      definition.connections.push({
        from: decisionPoint.name,
        to: decisionPoint.falsePath,
        condition: `!(${decisionPoint.condition})`
      });
    }

    // Define flow variables
    if (requirements.targetTable) {
      definition.variables.push({
        name: 'current_record',
        type: 'reference',
        reference_table: requirements.targetTable,
        description: 'The record that triggered this flow'
      });
    }

    if (requirements.needsApproval) {
      definition.variables.push({
        name: 'approval_result',
        type: 'string',
        description: 'Result of the approval request'
      });
      definition.variables.push({
        name: 'approver',
        type: 'reference',
        reference_table: 'sys_user',
        description: 'User who approved/rejected the request'
      });
    }

    return definition;
  }

  private async configureTriggers(requirements: any): Promise<any[]> {
    const triggers = [];

    switch (requirements.triggerType) {
      case 'record_created':
        triggers.push({
          type: 'record_created',
          table: requirements.targetTable,
          conditions: requirements.conditions,
          active: true,
          order: 100
        });
        break;

      case 'record_updated':
        triggers.push({
          type: 'record_updated',
          table: requirements.targetTable,
          conditions: requirements.conditions,
          fields_to_watch: ['state', 'priority', 'assignment_group'],
          active: true,
          order: 100
        });
        break;

      case 'scheduled':
        triggers.push({
          type: 'scheduled',
          schedule: {
            type: 'daily',
            time: '00:00',
            timezone: 'UTC'
          },
          active: true,
          order: 100
        });
        break;

      case 'manual':
        triggers.push({
          type: 'manual',
          roles: ['admin', 'itil'],
          ui_action: true,
          active: true,
          order: 100
        });
        break;

      default:
        // Default to record created trigger
        triggers.push({
          type: 'record_created',
          table: requirements.targetTable || 'task',
          active: true,
          order: 100
        });
    }

    return triggers;
  }

  private async setupActions(requirements: any, structure: any): Promise<any[]> {
    const actions = [];

    for (const stage of structure.stages) {
      if (stage.type === 'action' || stage.type === 'approval' || stage.type === 'notification') {
        const action = await this.createAction(stage, requirements);
        if (action) {
          actions.push(action);
        }
      }
    }

    return actions;
  }

  private async createAction(stage: any, requirements: any): Promise<any> {
    const action: any = {
      name: stage.name,
      type: stage.type,
      order: 100,
      active: true
    };

    switch (stage.type) {
      case 'approval':
        action.config = {
          approval_type: 'user',
          approvers: 'current_record.assignment_group.manager',
          approval_message: `Please approve ${requirements.targetTable} ${requirements.name}`,
          due_date: '3 business days',
          reminders: true,
          escalation: {
            enabled: true,
            after: '2 business days',
            escalate_to: 'current_record.assignment_group.manager.manager'
          }
        };
        break;

      case 'notification':
        action.config = {
          recipients: ['current_record.requested_for', 'current_record.assigned_to'],
          template: 'flow_notification',
          subject: `${requirements.name} - Action Completed`,
          message: 'The flow has completed processing your request.',
          include_record_link: true
        };
        break;

      case 'action':
        if (stage.actionType === 'integration') {
          action.config = {
            rest_message: 'External System Integration',
            endpoint: '/api/process',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              record_number: '${current_record.number}',
              record_type: requirements.targetTable,
              action: 'process'
            }
          };
        } else {
          action.config = {
            script: `
// ${stage.name} Script
(function execute(inputs, outputs) {
  // Get the current record
  var current = inputs.current_record;
  
  // Perform the main action
  gs.info('Executing ${stage.name} for ' + current.getDisplayValue());
  
  // Add your business logic here
  current.work_notes = 'Processed by ${requirements.name} flow';
  current.update();
  
  // Set outputs
  outputs.success = true;
  outputs.message = 'Action completed successfully';
  
})(inputs, outputs);`
          };
        }
        break;

      case 'error_handler':
        action.config = {
          script: `
// Error Handler Script
(function handleError(inputs, outputs) {
  var errorMessage = inputs.error_message || 'Unknown error';
  var current = inputs.current_record;
  
  // Log the error
  gs.error('Flow error in ${requirements.name}: ' + errorMessage);
  
  // Update the record with error information
  if (current) {
    current.work_notes = 'Flow error: ' + errorMessage;
    current.update();
  }
  
  // Send error notification if configured
  if (${requirements.needsNotification}) {
    // Send error notification logic
  }
  
})(inputs, outputs);`
        };
        break;
    }

    return action;
  }

  private prepareDeploymentInstructions(requirements: any, artifact: ServiceNowArtifact): any {
    return {
      primaryTool: 'snow_create_flow',
      instruction: `Create ${requirements.flowType} for ${requirements.targetTable || 'general'} with ${requirements.needsApproval ? 'approval' : 'automated'} processing`,
      testingTools: [
        {
          tool: 'snow_test_flow_with_mock',
          purpose: 'Test flow with mock data before deployment'
        },
        {
          tool: 'snow_comprehensive_flow_test',
          purpose: 'Run comprehensive tests including edge cases'
        }
      ],
      validationSteps: [
        'Verify trigger configuration',
        'Test all decision branches',
        'Validate approval routing if applicable',
        'Check error handling paths',
        'Verify notifications are sent correctly'
      ],
      catalogLinking: requirements.needsCatalogLink ? {
        tool: 'snow_link_catalog_to_flow',
        instruction: 'Link this flow to relevant catalog items'
      } : null
    };
  }
}
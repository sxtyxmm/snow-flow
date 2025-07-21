/**
 * Automation Specialist Agent - Handles workflow automation, business rules, and scheduled tasks
 */

import { BaseSnowAgent, AgentCapabilities } from '../base/base-snow-agent.js';
import { Task } from '../../types/snow-flow.types.js';

export interface AutomationRequirements {
  triggerType: 'event' | 'schedule' | 'manual' | 'condition';
  targetTable: string;
  conditions: string[];
  actions: AutomationAction[];
  errorHandling: ErrorHandlingStrategy;
  monitoring: MonitoringConfig;
}

export interface AutomationAction {
  type: 'field_update' | 'record_create' | 'notification' | 'script_execution' | 'approval_request';
  configuration: Record<string, any>;
  order: number;
  conditions?: string[];
}

export interface ErrorHandlingStrategy {
  onFailure: 'stop' | 'continue' | 'retry' | 'escalate';
  retryAttempts?: number;
  notifications?: string[];
}

export interface MonitoringConfig {
  trackExecution: boolean;
  logLevel: 'minimal' | 'detailed' | 'debug';
  performanceMetrics: boolean;
}

export class AutomationSpecialistAgent extends BaseSnowAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'workflow_design',
        'business_rules',
        'scheduled_jobs',
        'event_handling',
        'process_automation'
      ],
      secondarySkills: [
        'script_development',
        'performance_optimization',
        'error_handling',
        'monitoring_setup'
      ],
      complexity: 'medium',
      autonomy: 'semi-autonomous'
    };

    super('automation-specialist', 'AutomationSpecialist', capabilities);
  }

  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const taskType = task.metadata?.type || 'automation_analysis';
      let result;
      
      switch (taskType) {
        case 'workflow_creation':
          result = await this.createWorkflow(input?.requirements || {});
          break;
        case 'business_rule_setup':
          result = await this.setupBusinessRule(input?.config || {});
          break;
        case 'scheduled_task':
          result = await this.createScheduledTask(input?.schedule || {});
          break;
        default:
          result = await this.analyzeAutomationRequirements(task.description, input);
      }
      
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  async analyzeAutomationRequirements(description: string, context?: any): Promise<AutomationRequirements> {
    const normalizedDesc = description.toLowerCase();
    
    return {
      triggerType: this.determineTriggerType(normalizedDesc),
      targetTable: this.extractTargetTable(normalizedDesc),
      conditions: this.extractConditions(normalizedDesc),
      actions: this.identifyActions(normalizedDesc),
      errorHandling: {
        onFailure: 'stop',
        retryAttempts: 3,
        notifications: ['admin@company.com']
      },
      monitoring: {
        trackExecution: true,
        logLevel: 'detailed',
        performanceMetrics: true
      }
    };
  }

  async createWorkflow(requirements: AutomationRequirements): Promise<any> {
    return {
      type: 'workflow',
      name: `auto_workflow_${Date.now()}`,
      trigger: requirements.triggerType,
      table: requirements.targetTable,
      activities: requirements.actions.map((action, index) => ({
        id: `activity_${index + 1}`,
        type: action.type,
        configuration: action.configuration,
        order: action.order
      })),
      errorHandling: requirements.errorHandling,
      active: true
    };
  }

  async setupBusinessRule(config: any): Promise<any> {
    return {
      type: 'business_rule',
      name: config.name || `auto_rule_${Date.now()}`,
      table: config.table || 'incident',
      when: config.when || 'before',
      condition: config.condition || '',
      script: this.generateBusinessRuleScript(config),
      active: true
    };
  }

  async createScheduledTask(schedule: any): Promise<any> {
    return {
      type: 'scheduled_job',
      name: schedule.name || `auto_job_${Date.now()}`,
      schedule: schedule.frequency || 'daily',
      script: this.generateScheduledScript(schedule),
      timezone: schedule.timezone || 'UTC',
      active: true
    };
  }

  private determineTriggerType(description: string): 'event' | 'schedule' | 'manual' | 'condition' {
    if (description.includes('schedule') || description.includes('daily') || description.includes('weekly')) {
      return 'schedule';
    }
    if (description.includes('manual') || description.includes('on-demand')) {
      return 'manual';
    }
    if (description.includes('when') || description.includes('if')) {
      return 'condition';
    }
    return 'event';
  }

  private extractTargetTable(description: string): string {
    const tableMatches = description.match(/\b(incident|problem|change_request|task|sys_user)\b/);
    return tableMatches ? tableMatches[0] : 'task';
  }

  private extractConditions(description: string): string[] {
    const conditions: string[] = [];
    if (description.includes('high priority')) conditions.push('priority=1');
    if (description.includes('critical')) conditions.push('severity=1');
    if (description.includes('new')) conditions.push('state=1');
    return conditions;
  }

  private identifyActions(description: string): AutomationAction[] {
    const actions: AutomationAction[] = [];
    let order = 1;
    
    if (description.includes('notify') || description.includes('email')) {
      actions.push({
        type: 'notification',
        configuration: { type: 'email', recipients: 'assigned_to' },
        order: order++
      });
    }
    
    if (description.includes('update') || description.includes('set')) {
      actions.push({
        type: 'field_update',
        configuration: { field: 'state', value: 'in_progress' },
        order: order++
      });
    }
    
    if (description.includes('approval')) {
      actions.push({
        type: 'approval_request',
        configuration: { approver: 'manager' },
        order: order++
      });
    }
    
    return actions;
  }

  private generateBusinessRuleScript(config: any): string {
    return `
// Auto-generated business rule script
if (current.isValidRecord()) {
  try {
    // Execute automation logic
    gs.info('Business rule executed for: ' + current.getDisplayValue());
    
    // Add custom logic here
    ${config.customLogic || '// Custom logic placeholder'}
    
  } catch (error) {
    gs.error('Business rule failed: ' + error.message);
  }
}
    `.trim();
  }

  private generateScheduledScript(schedule: any): string {
    return `
// Auto-generated scheduled job script
try {
  var records = new GlideRecord('${schedule.table || 'task'}');
  records.addQuery('${schedule.condition || 'active=true'}');
  records.query();
  
  var processed = 0;
  while (records.next()) {
    // Process each record
    ${schedule.logic || '// Processing logic placeholder'}
    processed++;
  }
  
  gs.info('Scheduled job completed: ' + processed + ' records processed');
  
} catch (error) {
  gs.error('Scheduled job failed: ' + error.message);
}
    `.trim();
  }
}
/**
 * Flow Development Team
 * Specialized team for ServiceNow Flow Designer workflows
 */

import { TaskAnalysis } from '../../utils/agent-detector.js';
import { getTeamMode } from '../modes/team-modes.js';

export interface FlowTeamMember {
  role: 'process' | 'trigger' | 'data' | 'security';
  name: string;
  capabilities: string[];
  workload: number;
  status: 'available' | 'busy' | 'offline';
}

export interface FlowDeliverable {
  type: 'flow_design' | 'trigger_config' | 'approval_chain' | 'data_mapping' | 'security_rules' | 'testing_plan' | 'documentation';
  content: string;
  owner: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'review';
  quality_score?: number;
}

export interface FlowProjectPlan {
  projectName: string;
  description: string;
  flowType: 'approval' | 'automation' | 'integration' | 'notification' | 'fulfillment';
  phases: FlowPhase[];
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[];
  deliverables: FlowDeliverable[];
  triggerEvents: string[];
  approvalLevels: number;
}

export interface FlowPhase {
  name: string;
  description: string;
  duration: string;
  dependencies: string[];
  assignedTo: string[];
  deliverables: string[];
  milestones: string[];
}

export class FlowTeam {
  private members: FlowTeamMember[] = [];
  private currentProject?: FlowProjectPlan;
  private teamMode = getTeamMode('flow');

  constructor() {
    this.initializeTeam();
  }

  private initializeTeam(): void {
    this.members = [
      {
        role: 'process',
        name: 'ProcessSpecialistAgent',
        capabilities: [
          'Business process analysis',
          'Workflow design and optimization',
          'Approval chain configuration',
          'Process automation',
          'Exception handling',
          'Performance metrics'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'trigger',
        name: 'TriggerSpecialistAgent',
        capabilities: [
          'Event trigger configuration',
          'Condition logic design',
          'Automated action setup',
          'Schedule-based triggers',
          'Real-time event processing',
          'Error handling and recovery'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'data',
        name: 'DataSpecialistAgent',
        capabilities: [
          'Data transformation logic',
          'Integration data mapping',
          'Data quality validation',
          'Analytics and reporting',
          'Data migration strategies',
          'Performance optimization'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'security',
        name: 'SecuritySpecialistAgent',
        capabilities: [
          'Security architecture design',
          'Access control implementation',
          'Role-based permissions',
          'Compliance requirements',
          'Security audit and review',
          'Threat assessment'
        ],
        workload: 0,
        status: 'available'
      }
    ];
  }

  public createProjectPlan(task: string, analysis: TaskAnalysis): FlowProjectPlan {
    console.log('🔄 Creating Flow Development Project Plan...');

    const flowType = this.determineFlowType(task);
    const complexity = this.assessFlowComplexity(task, analysis);
    const phases = this.generateProjectPhases(task, flowType, complexity);
    const deliverables = this.generateDeliverables(task, flowType, complexity);
    const triggerEvents = this.identifyTriggerEvents(task);
    const approvalLevels = this.calculateApprovalLevels(task);

    this.currentProject = {
      projectName: `Flow Development: ${this.extractFlowName(task)}`,
      description: task,
      flowType,
      phases,
      estimatedDuration: this.calculateDuration(complexity, phases),
      complexity,
      dependencies: this.identifyDependencies(task, flowType),
      deliverables,
      triggerEvents,
      approvalLevels
    };

    console.log(`📋 Project Plan Created:`);
    console.log(`   Flow Name: ${this.extractFlowName(task)}`);
    console.log(`   Flow Type: ${flowType}`);
    console.log(`   Complexity: ${complexity}`);
    console.log(`   Estimated Duration: ${this.currentProject.estimatedDuration}`);
    console.log(`   Approval Levels: ${approvalLevels}`);
    console.log(`   Trigger Events: ${triggerEvents.length}`);
    console.log(`   Phases: ${phases.length}`);
    console.log(`   Deliverables: ${deliverables.length}\n`);

    return this.currentProject;
  }

  private determineFlowType(task: string): 'approval' | 'automation' | 'integration' | 'notification' | 'fulfillment' {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('approval') || taskLower.includes('approve') || taskLower.includes('goedkeuring')) {
      return 'approval';
    }
    if (taskLower.includes('integration') || taskLower.includes('api') || taskLower.includes('external')) {
      return 'integration';
    }
    if (taskLower.includes('notification') || taskLower.includes('email') || taskLower.includes('notify')) {
      return 'notification';
    }
    if (taskLower.includes('fulfillment') || taskLower.includes('provision') || taskLower.includes('deploy')) {
      return 'fulfillment';
    }
    
    return 'automation'; // Default
  }

  private assessFlowComplexity(task: string, analysis: TaskAnalysis): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['single step', 'basic', 'simple', 'one approval', 'direct'],
      medium: ['multiple steps', 'conditional', 'approval chain', 'routing', 'moderate'],
      complex: ['integration', 'multiple systems', 'complex logic', 'nested conditions', 'enterprise', 'advanced']
    };

    const taskLower = task.toLowerCase();
    
    if (complexityIndicators.complex.some(indicator => taskLower.includes(indicator))) {
      return 'complex';
    }
    if (complexityIndicators.medium.some(indicator => taskLower.includes(indicator))) {
      return 'medium';
    }
    return 'simple';
  }

  private generateProjectPhases(task: string, flowType: string, complexity: 'simple' | 'medium' | 'complex'): FlowPhase[] {
    const basePhases: FlowPhase[] = [
      {
        name: 'Process Analysis',
        description: 'Analyze business process and define workflow requirements',
        duration: complexity === 'simple' ? '45min' : complexity === 'medium' ? '1.5hours' : '3hours',
        dependencies: [],
        assignedTo: ['ProcessSpecialistAgent'],
        deliverables: ['process_analysis', 'workflow_requirements', 'stakeholder_mapping'],
        milestones: ['Requirements gathering complete', 'Process design approved']
      },
      {
        name: 'Flow Design',
        description: 'Design flow structure, conditions, and routing logic',
        duration: complexity === 'simple' ? '1hour' : complexity === 'medium' ? '2hours' : '4hours',
        dependencies: ['Process Analysis'],
        assignedTo: ['ProcessSpecialistAgent', 'TriggerSpecialistAgent'],
        deliverables: ['flow_design', 'condition_logic', 'routing_rules'],
        milestones: ['Flow design complete', 'Logic validation complete']
      },
      {
        name: 'Trigger Configuration',
        description: 'Configure triggers, events, and automation rules',
        duration: complexity === 'simple' ? '30min' : complexity === 'medium' ? '1hour' : '2hours',
        dependencies: ['Flow Design'],
        assignedTo: ['TriggerSpecialistAgent'],
        deliverables: ['trigger_config', 'event_rules', 'automation_setup'],
        milestones: ['Triggers configured', 'Event handling tested']
      }
    ];

    // Add data integration phase if needed
    if (flowType === 'integration' || task.toLowerCase().includes('data')) {
      basePhases.push({
        name: 'Data Integration',
        description: 'Configure data mapping and transformation logic',
        duration: complexity === 'simple' ? '45min' : complexity === 'medium' ? '1.5hours' : '3hours',
        dependencies: ['Flow Design'],
        assignedTo: ['DataSpecialistAgent'],
        deliverables: ['data_mapping', 'transformation_logic', 'integration_config'],
        milestones: ['Data mapping complete', 'Integration tested']
      });
    }

    // Add security configuration phase
    basePhases.push({
      name: 'Security Configuration',
      description: 'Configure access controls and security policies',
      duration: complexity === 'simple' ? '20min' : complexity === 'medium' ? '45min' : '1.5hours',
      dependencies: ['Flow Design'],
      assignedTo: ['SecuritySpecialistAgent'],
      deliverables: ['security_config', 'access_controls', 'audit_rules'],
      milestones: ['Security configured', 'Access controls validated']
    });

    // Add testing and deployment phase
    basePhases.push({
      name: 'Testing & Deployment',
      description: 'Test flow execution and deploy to production',
      duration: complexity === 'simple' ? '30min' : complexity === 'medium' ? '1hour' : '2hours',
      dependencies: ['Trigger Configuration', 'Security Configuration'],
      assignedTo: ['ProcessSpecialistAgent', 'TriggerSpecialistAgent'],
      deliverables: ['test_results', 'deployment_package', 'monitoring_setup'],
      milestones: ['Testing complete', 'Production deployment complete']
    });

    return basePhases;
  }

  private generateDeliverables(task: string, flowType: string, complexity: 'simple' | 'medium' | 'complex'): FlowDeliverable[] {
    const deliverables: FlowDeliverable[] = [
      {
        type: 'flow_design',
        content: '',
        owner: 'ProcessSpecialistAgent',
        dependencies: [],
        status: 'pending'
      },
      {
        type: 'trigger_config',
        content: '',
        owner: 'TriggerSpecialistAgent',
        dependencies: ['flow_design'],
        status: 'pending'
      },
      {
        type: 'security_rules',
        content: '',
        owner: 'SecuritySpecialistAgent',
        dependencies: ['flow_design'],
        status: 'pending'
      }
    ];

    // Add approval chain for approval flows
    if (flowType === 'approval') {
      deliverables.push({
        type: 'approval_chain',
        content: '',
        owner: 'ProcessSpecialistAgent',
        dependencies: ['flow_design'],
        status: 'pending'
      });
    }

    // Add data mapping for integration flows
    if (flowType === 'integration' || task.toLowerCase().includes('data')) {
      deliverables.push({
        type: 'data_mapping',
        content: '',
        owner: 'DataSpecialistAgent',
        dependencies: ['flow_design'],
        status: 'pending'
      });
    }

    // Add testing plan for medium and complex flows
    if (complexity !== 'simple') {
      deliverables.push({
        type: 'testing_plan',
        content: '',
        owner: 'ProcessSpecialistAgent',
        dependencies: ['flow_design', 'trigger_config'],
        status: 'pending'
      });
    }

    // Add documentation for complex flows
    if (complexity === 'complex') {
      deliverables.push({
        type: 'documentation',
        content: '',
        owner: 'ProcessSpecialistAgent',
        dependencies: ['flow_design', 'trigger_config', 'security_rules'],
        status: 'pending'
      });
    }

    return deliverables;
  }

  private extractFlowName(task: string): string {
    // Try to extract a meaningful name from the task description
    const patterns = [
      /create\s+(.+?)\s+flow/i,
      /build\s+(.+?)\s+flow/i,
      /develop\s+(.+?)\s+workflow/i,
      /(.+?)\s+approval/i,
      /flow\s+for\s+(.+)/i,
      /workflow\s+for\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, '_').toLowerCase();
      }
    }

    return 'custom_flow';
  }

  private identifyTriggerEvents(task: string): string[] {
    const events: string[] = [];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('when') || taskLower.includes('wanneer')) {
      if (taskLower.includes('created') || taskLower.includes('new')) events.push('record_created');
      if (taskLower.includes('updated') || taskLower.includes('changed')) events.push('record_updated');
      if (taskLower.includes('approved')) events.push('approval_approved');
      if (taskLower.includes('rejected')) events.push('approval_rejected');
      if (taskLower.includes('scheduled') || taskLower.includes('daily') || taskLower.includes('weekly')) events.push('scheduled');
    }

    // Default event if none specified
    if (events.length === 0) {
      events.push('record_created');
    }

    return events;
  }

  private calculateApprovalLevels(task: string): number {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('single approval') || taskLower.includes('one approval')) return 1;
    if (taskLower.includes('two level') || taskLower.includes('two approval')) return 2;
    if (taskLower.includes('three level') || taskLower.includes('multiple approval')) return 3;
    if (taskLower.includes('manager') && taskLower.includes('director')) return 2;
    if (taskLower.includes('approval chain')) return 2;
    
    // Default to 1 for approval flows, 0 for others
    return taskLower.includes('approval') ? 1 : 0;
  }

  private calculateDuration(complexity: 'simple' | 'medium' | 'complex', phases: FlowPhase[]): string {
    const durationMap = {
      simple: '3-4 hours',
      medium: '6-10 hours',
      complex: '12-20 hours'
    };

    return durationMap[complexity];
  }

  private identifyDependencies(task: string, flowType: string): string[] {
    const dependencies: string[] = ['ServiceNow Flow Designer'];
    const taskLower = task.toLowerCase();

    if (flowType === 'approval') {
      dependencies.push('Approval Engine');
    }
    if (flowType === 'integration') {
      dependencies.push('IntegrationHub', 'REST API access');
    }
    if (taskLower.includes('email') || taskLower.includes('notification')) {
      dependencies.push('Email Configuration');
    }
    if (taskLower.includes('schedule')) {
      dependencies.push('Scheduled Jobs');
    }
    if (taskLower.includes('catalog')) {
      dependencies.push('Service Catalog');
    }

    return dependencies;
  }

  public getTeamStatus(): { available: number; busy: number; total: number } {
    const available = this.members.filter(m => m.status === 'available').length;
    const busy = this.members.filter(m => m.status === 'busy').length;
    const total = this.members.length;

    return { available, busy, total };
  }

  public assignTask(memberRole: FlowTeamMember['role'], deliverable: string): boolean {
    const member = this.members.find(m => m.role === memberRole && m.status === 'available');
    if (member) {
      member.status = 'busy';
      member.workload++;
      console.log(`📌 Assigned ${deliverable} to ${member.name}`);
      return true;
    }
    return false;
  }

  public getProjectStatus(): FlowProjectPlan | undefined {
    return this.currentProject;
  }

  public getTeamCapabilities(): string[] {
    return this.teamMode?.capabilities || [];
  }
}
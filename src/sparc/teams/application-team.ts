/**
 * Application Development Team
 * Specialized team for complete ServiceNow application development
 */

import { TaskAnalysis } from '../../utils/agent-detector.js';
import { getTeamMode } from '../modes/team-modes.js';

export interface ApplicationTeamMember {
  role: 'database' | 'logic' | 'interface' | 'security';
  name: string;
  capabilities: string[];
  workload: number;
  status: 'available' | 'busy' | 'offline';
}

export interface ApplicationDeliverable {
  type: 'database_schema' | 'business_logic' | 'user_interface' | 'security_model' | 'workflows' | 'reports' | 'documentation' | 'deployment_guide';
  content: string;
  owner: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'review';
  quality_score?: number;
}

export interface ApplicationProjectPlan {
  projectName: string;
  description: string;
  applicationType: 'itsm' | 'hrsd' | 'custom' | 'asset_management' | 'project_management' | 'vendor_management';
  phases: ApplicationPhase[];
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  dependencies: string[];
  deliverables: ApplicationDeliverable[];
  modules: string[];
  dataModel: ApplicationDataModel;
}

export interface ApplicationPhase {
  name: string;
  description: string;
  duration: string;
  dependencies: string[];
  assignedTo: string[];
  deliverables: string[];
  milestones: string[];
}

export interface ApplicationDataModel {
  tables: string[];
  relationships: string[];
  customFields: number;
  estimatedRecords: string;
}

export class ApplicationTeam {
  private members: ApplicationTeamMember[] = [];
  private currentProject?: ApplicationProjectPlan;
  private teamMode = getTeamMode('application');

  constructor() {
    this.initializeTeam();
  }

  private initializeTeam(): void {
    this.members = [
      {
        role: 'database',
        name: 'DatabaseSpecialistAgent',
        capabilities: [
          'Database schema design',
          'Table relationship modeling',
          'Query optimization',
          'Index strategy',
          'Data migration planning',
          'Performance tuning',
          'Data integrity rules'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'logic',
        name: 'LogicSpecialistAgent',
        capabilities: [
          'Business rule implementation',
          'Complex calculations',
          'Automation scripts',
          'Validation logic',
          'Workflow automation',
          'Integration logic',
          'Performance optimization'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'interface',
        name: 'InterfaceSpecialistAgent',
        capabilities: [
          'Form design and layout',
          'List configuration',
          'UI actions and buttons',
          'User interaction flows',
          'Mobile interface design',
          'Accessibility compliance',
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
          'Threat assessment',
          'Security best practices'
        ],
        workload: 0,
        status: 'available'
      }
    ];
  }

  public createProjectPlan(task: string, analysis: TaskAnalysis): ApplicationProjectPlan {
    console.log('🏗️ Creating Application Development Project Plan...');

    const applicationType = this.determineApplicationType(task);
    const complexity = this.assessApplicationComplexity(task, analysis);
    const dataModel = this.designDataModel(task, applicationType);
    const modules = this.identifyModules(task, applicationType);
    const phases = this.generateProjectPhases(task, applicationType, complexity);
    const deliverables = this.generateDeliverables(task, applicationType, complexity);

    this.currentProject = {
      projectName: `Application Development: ${this.extractApplicationName(task)}`,
      description: task,
      applicationType,
      phases,
      estimatedDuration: this.calculateDuration(complexity, phases),
      complexity,
      dependencies: this.identifyDependencies(task, applicationType),
      deliverables,
      modules,
      dataModel
    };

    console.log(`📋 Project Plan Created:`);
    console.log(`   Application Name: ${this.extractApplicationName(task)}`);
    console.log(`   Application Type: ${applicationType}`);
    console.log(`   Complexity: ${complexity}`);
    console.log(`   Estimated Duration: ${this.currentProject.estimatedDuration}`);
    console.log(`   Modules: ${modules.length}`);
    console.log(`   Tables: ${dataModel.tables.length}`);
    console.log(`   Phases: ${phases.length}`);
    console.log(`   Deliverables: ${deliverables.length}\n`);

    return this.currentProject;
  }

  private determineApplicationType(task: string): 'itsm' | 'hrsd' | 'custom' | 'asset_management' | 'project_management' | 'vendor_management' {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('itsm') || taskLower.includes('incident') || taskLower.includes('service desk')) {
      return 'itsm';
    }
    if (taskLower.includes('hr') || taskLower.includes('human resource') || taskLower.includes('employee')) {
      return 'hrsd';
    }
    if (taskLower.includes('asset') || taskLower.includes('inventory') || taskLower.includes('equipment')) {
      return 'asset_management';
    }
    if (taskLower.includes('project') || taskLower.includes('task management') || taskLower.includes('portfolio')) {
      return 'project_management';
    }
    if (taskLower.includes('vendor') || taskLower.includes('supplier') || taskLower.includes('procurement')) {
      return 'vendor_management';
    }
    
    return 'custom'; // Default
  }

  private assessApplicationComplexity(task: string, analysis: TaskAnalysis): 'simple' | 'medium' | 'complex' | 'enterprise' {
    const complexityIndicators = {
      simple: ['basic', 'simple', 'single module', 'small', 'prototype'],
      medium: ['multiple modules', 'moderate', 'department', 'team'],
      complex: ['integration', 'multiple systems', 'advanced', 'organization', 'company'],
      enterprise: ['enterprise', 'global', 'multi-tenant', 'large scale', 'corporation']
    };

    const taskLower = task.toLowerCase();
    const wordCount = task.split(/\s+/).length;
    const artifactCount = analysis.serviceNowArtifacts.length;
    
    if (complexityIndicators.enterprise.some(indicator => taskLower.includes(indicator)) || 
        wordCount > 30 || artifactCount > 5) {
      return 'enterprise';
    }
    if (complexityIndicators.complex.some(indicator => taskLower.includes(indicator)) || 
        wordCount > 20 || artifactCount > 3) {
      return 'complex';
    }
    if (complexityIndicators.medium.some(indicator => taskLower.includes(indicator)) || 
        wordCount > 15 || artifactCount > 2) {
      return 'medium';
    }
    
    return 'simple';
  }

  private designDataModel(task: string, applicationType: string): ApplicationDataModel {
    const taskLower = task.toLowerCase();
    let tables: string[] = [];
    let relationships: string[] = [];
    let customFields = 0;
    let estimatedRecords = '1K-10K';

    switch (applicationType) {
      case 'itsm':
        tables = ['incident', 'problem', 'change_request', 'knowledge_base'];
        relationships = ['incident_to_problem', 'problem_to_change', 'incident_to_kb'];
        customFields = 10;
        estimatedRecords = '10K-100K';
        break;
      case 'asset_management':
        tables = ['asset', 'asset_category', 'location', 'asset_assignment'];
        relationships = ['asset_to_category', 'asset_to_location', 'asset_to_user'];
        customFields = 15;
        estimatedRecords = '5K-50K';
        break;
      case 'project_management':
        tables = ['project', 'task', 'milestone', 'resource'];
        relationships = ['project_to_task', 'task_to_milestone', 'project_to_resource'];
        customFields = 12;
        estimatedRecords = '1K-20K';
        break;
      case 'vendor_management':
        tables = ['vendor', 'contract', 'purchase_order', 'invoice'];
        relationships = ['vendor_to_contract', 'contract_to_po', 'po_to_invoice'];
        customFields = 20;
        estimatedRecords = '2K-25K';
        break;
      default:
        // Extract tables from task description
        if (taskLower.includes('user') || taskLower.includes('employee')) tables.push('user');
        if (taskLower.includes('request') || taskLower.includes('order')) tables.push('request');
        if (taskLower.includes('approval')) tables.push('approval');
        if (taskLower.includes('task')) tables.push('task');
        
        if (tables.length === 0) tables = ['main_entity'];
        
        customFields = Math.max(5, tables.length * 3);
        estimatedRecords = '1K-10K';
    }

    return {
      tables,
      relationships,
      customFields,
      estimatedRecords
    };
  }

  private identifyModules(task: string, applicationType: string): string[] {
    const modules: string[] = [];
    const taskLower = task.toLowerCase();

    switch (applicationType) {
      case 'itsm':
        modules.push('Incident Management', 'Problem Management', 'Change Management', 'Knowledge Management');
        break;
      case 'asset_management':
        modules.push('Asset Tracking', 'Inventory Management', 'Asset Lifecycle', 'Reporting');
        break;
      case 'project_management':
        modules.push('Project Planning', 'Task Management', 'Resource Allocation', 'Progress Tracking');
        break;
      case 'vendor_management':
        modules.push('Vendor Registry', 'Contract Management', 'Purchase Orders', 'Invoice Processing');
        break;
      default:
        if (taskLower.includes('management')) modules.push('Core Management');
        if (taskLower.includes('report')) modules.push('Reporting');
        if (taskLower.includes('approval')) modules.push('Approval Workflow');
        if (taskLower.includes('notification')) modules.push('Notifications');
        
        if (modules.length === 0) modules.push('Core Functionality');
    }

    return modules;
  }

  private generateProjectPhases(task: string, applicationType: string, complexity: 'simple' | 'medium' | 'complex' | 'enterprise'): ApplicationPhase[] {
    const durationMultiplier = {
      simple: 1,
      medium: 1.5,
      complex: 2.5,
      enterprise: 4
    }[complexity];

    const basePhases: ApplicationPhase[] = [
      {
        name: 'Requirements & Architecture',
        description: 'Gather requirements and design application architecture',
        duration: `${Math.round(4 * durationMultiplier)}hours`,
        dependencies: [],
        assignedTo: ['DatabaseSpecialistAgent', 'LogicSpecialistAgent', 'SecuritySpecialistAgent'],
        deliverables: ['requirements_doc', 'architecture_design', 'data_model'],
        milestones: ['Requirements approved', 'Architecture approved']
      },
      {
        name: 'Database Design',
        description: 'Design and create database schema and relationships',
        duration: `${Math.round(6 * durationMultiplier)}hours`,
        dependencies: ['Requirements & Architecture'],
        assignedTo: ['DatabaseSpecialistAgent'],
        deliverables: ['database_schema', 'table_definitions', 'relationships'],
        milestones: ['Schema design complete', 'Tables created']
      },
      {
        name: 'Business Logic Implementation',
        description: 'Implement business rules, calculations, and automation',
        duration: `${Math.round(8 * durationMultiplier)}hours`,
        dependencies: ['Database Design'],
        assignedTo: ['LogicSpecialistAgent'],
        deliverables: ['business_rules', 'calculations', 'automation_scripts'],
        milestones: ['Core logic implemented', 'Validation rules complete']
      },
      {
        name: 'User Interface Development',
        description: 'Design and implement user interfaces and interactions',
        duration: `${Math.round(6 * durationMultiplier)}hours`,
        dependencies: ['Database Design'],
        assignedTo: ['InterfaceSpecialistAgent'],
        deliverables: ['forms', 'lists', 'ui_actions', 'navigation'],
        milestones: ['Forms complete', 'Navigation implemented']
      },
      {
        name: 'Security Implementation',
        description: 'Implement security controls and access management',
        duration: `${Math.round(4 * durationMultiplier)}hours`,
        dependencies: ['Database Design', 'Business Logic Implementation'],
        assignedTo: ['SecuritySpecialistAgent'],
        deliverables: ['security_model', 'access_controls', 'roles_permissions'],
        milestones: ['Security configured', 'Access controls tested']
      },
      {
        name: 'Integration & Testing',
        description: 'Integrate components and perform comprehensive testing',
        duration: `${Math.round(6 * durationMultiplier)}hours`,
        dependencies: ['Business Logic Implementation', 'User Interface Development', 'Security Implementation'],
        assignedTo: ['DatabaseSpecialistAgent', 'LogicSpecialistAgent', 'InterfaceSpecialistAgent'],
        deliverables: ['integration_tests', 'user_acceptance_tests', 'performance_tests'],
        milestones: ['Integration complete', 'All tests passed']
      }
    ];

    // Add additional phases for complex applications
    if (complexity === 'complex' || complexity === 'enterprise') {
      basePhases.push({
        name: 'Workflow Integration',
        description: 'Integrate with workflows and external systems',
        duration: `${Math.round(4 * durationMultiplier)}hours`,
        dependencies: ['Integration & Testing'],
        assignedTo: ['LogicSpecialistAgent', 'SecuritySpecialistAgent'],
        deliverables: ['workflow_integration', 'external_apis', 'data_sync'],
        milestones: ['Workflows integrated', 'External integration complete']
      });
    }

    if (complexity === 'enterprise') {
      basePhases.push({
        name: 'Performance Optimization',
        description: 'Optimize performance and scalability for enterprise use',
        duration: `${Math.round(6 * durationMultiplier)}hours`,
        dependencies: ['Workflow Integration'],
        assignedTo: ['DatabaseSpecialistAgent', 'LogicSpecialistAgent'],
        deliverables: ['performance_optimization', 'caching_strategy', 'monitoring_setup'],
        milestones: ['Performance targets met', 'Monitoring active']
      });
    }

    return basePhases;
  }

  private generateDeliverables(task: string, applicationType: string, complexity: 'simple' | 'medium' | 'complex' | 'enterprise'): ApplicationDeliverable[] {
    const deliverables: ApplicationDeliverable[] = [
      {
        type: 'database_schema',
        content: '',
        owner: 'DatabaseSpecialistAgent',
        dependencies: [],
        status: 'pending'
      },
      {
        type: 'business_logic',
        content: '',
        owner: 'LogicSpecialistAgent',
        dependencies: ['database_schema'],
        status: 'pending'
      },
      {
        type: 'user_interface',
        content: '',
        owner: 'InterfaceSpecialistAgent',
        dependencies: ['database_schema'],
        status: 'pending'
      },
      {
        type: 'security_model',
        content: '',
        owner: 'SecuritySpecialistAgent',
        dependencies: ['database_schema', 'business_logic'],
        status: 'pending'
      }
    ];

    // Add workflows for medium and above
    if (complexity !== 'simple') {
      deliverables.push({
        type: 'workflows',
        content: '',
        owner: 'LogicSpecialistAgent',
        dependencies: ['business_logic', 'security_model'],
        status: 'pending'
      });
    }

    // Add reports for complex and above
    if (complexity === 'complex' || complexity === 'enterprise') {
      deliverables.push({
        type: 'reports',
        content: '',
        owner: 'DatabaseSpecialistAgent',
        dependencies: ['database_schema', 'business_logic'],
        status: 'pending'
      });
    }

    // Add comprehensive documentation for all
    deliverables.push({
      type: 'documentation',
      content: '',
      owner: 'InterfaceSpecialistAgent',
      dependencies: ['database_schema', 'business_logic', 'user_interface', 'security_model'],
      status: 'pending'
    });

    // Add deployment guide for complex applications
    if (complexity === 'complex' || complexity === 'enterprise') {
      deliverables.push({
        type: 'deployment_guide',
        content: '',
        owner: 'SecuritySpecialistAgent',
        dependencies: ['documentation'],
        status: 'pending'
      });
    }

    return deliverables;
  }

  private extractApplicationName(task: string): string {
    const patterns = [
      /create\s+(.+?)\s+application/i,
      /build\s+(.+?)\s+(system|app|application)/i,
      /develop\s+(.+?)\s+(system|solution)/i,
      /(.+?)\s+(management|system|application)/i
    ];

    for (const pattern of patterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, '_').toLowerCase();
      }
    }

    return 'custom_application';
  }

  private calculateDuration(complexity: 'simple' | 'medium' | 'complex' | 'enterprise', phases: ApplicationPhase[]): string {
    const durationMap = {
      simple: '1-2 days',
      medium: '3-5 days',
      complex: '1-2 weeks',
      enterprise: '2-4 weeks'
    };

    return durationMap[complexity];
  }

  private identifyDependencies(task: string, applicationType: string): string[] {
    const dependencies: string[] = ['ServiceNow Platform', 'Application Studio'];
    const taskLower = task.toLowerCase();

    if (applicationType === 'itsm') {
      dependencies.push('ITIL Process Templates', 'Service Management');
    }
    if (applicationType === 'hrsd') {
      dependencies.push('HR Service Delivery', 'Employee Center');
    }
    if (taskLower.includes('integration') || taskLower.includes('api')) {
      dependencies.push('IntegrationHub', 'REST API framework');
    }
    if (taskLower.includes('mobile')) {
      dependencies.push('ServiceNow Mobile Platform');
    }
    if (taskLower.includes('analytics') || taskLower.includes('dashboard')) {
      dependencies.push('Performance Analytics', 'Reporting Framework');
    }

    return dependencies;
  }

  public getTeamStatus(): { available: number; busy: number; total: number } {
    const available = this.members.filter(m => m.status === 'available').length;
    const busy = this.members.filter(m => m.status === 'busy').length;
    const total = this.members.length;

    return { available, busy, total };
  }

  public assignTask(memberRole: ApplicationTeamMember['role'], deliverable: string): boolean {
    const member = this.members.find(m => m.role === memberRole && m.status === 'available');
    if (member) {
      member.status = 'busy';
      member.workload++;
      console.log(`📌 Assigned ${deliverable} to ${member.name}`);
      return true;
    }
    return false;
  }

  public getProjectStatus(): ApplicationProjectPlan | undefined {
    return this.currentProject;
  }

  public getTeamCapabilities(): string[] {
    return this.teamMode?.capabilities || [];
  }
}
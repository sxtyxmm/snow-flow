/**
 * Widget Development Team
 * Specialized team for Service Portal widget development
 */

import { TaskAnalysis } from '../../utils/agent-detector.js';
import { getTeamMode } from '../modes/team-modes.js';

export interface WidgetTeamMember {
  role: 'frontend' | 'backend' | 'uiux' | 'platform';
  name: string;
  capabilities: string[];
  workload: number;
  status: 'available' | 'busy' | 'offline';
}

export interface WidgetDeliverable {
  type: 'html_template' | 'css_styles' | 'client_script' | 'server_script' | 'demo_data' | 'documentation';
  content: string;
  owner: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'review';
  quality_score?: number;
}

export interface WidgetProjectPlan {
  projectName: string;
  description: string;
  phases: WidgetPhase[];
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
  dependencies: string[];
  deliverables: WidgetDeliverable[];
}

export interface WidgetPhase {
  name: string;
  description: string;
  duration: string;
  dependencies: string[];
  assignedTo: string[];
  deliverables: string[];
  milestones: string[];
}

export class WidgetTeam {
  private members: WidgetTeamMember[] = [];
  private currentProject?: WidgetProjectPlan;
  private teamMode = getTeamMode('widget');

  constructor() {
    this.initializeTeam();
  }

  private initializeTeam(): void {
    this.members = [
      {
        role: 'frontend',
        name: 'WidgetFrontendAgent',
        capabilities: [
          'HTML template development',
          'CSS styling and responsive design',
          'JavaScript client-side logic',
          'AngularJS directives',
          'Performance optimization'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'backend',
        name: 'WidgetBackendAgent',
        capabilities: [
          'Server-side script development',
          'GlideRecord data queries',
          'REST API integration',
          'Data processing',
          'Caching strategies'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'uiux',
        name: 'UIUXSpecialistAgent',
        capabilities: [
          'User experience design',
          'Interface patterns',
          'Accessibility compliance',
          'Usability testing',
          'Mobile-first design'
        ],
        workload: 0,
        status: 'available'
      },
      {
        role: 'platform',
        name: 'PlatformSpecialistAgent',
        capabilities: [
          'Platform configuration',
          'Security and ACL setup',
          'Performance monitoring',
          'Integration architecture',
          'Best practices'
        ],
        workload: 0,
        status: 'available'
      }
    ];
  }

  public createProjectPlan(task: string, analysis: TaskAnalysis): WidgetProjectPlan {
    console.log('🎨 Creating Widget Development Project Plan...');

    const complexity = this.assessWidgetComplexity(task, analysis);
    const phases = this.generateProjectPhases(task, complexity);
    const deliverables = this.generateDeliverables(task, complexity);

    this.currentProject = {
      projectName: `Widget Development: ${this.extractWidgetName(task)}`,
      description: task,
      phases,
      estimatedDuration: this.calculateDuration(complexity, phases),
      complexity,
      dependencies: this.identifyDependencies(task),
      deliverables
    };

    console.log(`📋 Project Plan Created:`);
    console.log(`   Widget Name: ${this.extractWidgetName(task)}`);
    console.log(`   Complexity: ${complexity}`);
    console.log(`   Estimated Duration: ${this.currentProject.estimatedDuration}`);
    console.log(`   Phases: ${phases.length}`);
    console.log(`   Deliverables: ${deliverables.length}\n`);

    return this.currentProject;
  }

  private assessWidgetComplexity(task: string, analysis: TaskAnalysis): 'simple' | 'medium' | 'complex' {
    const complexityIndicators = {
      simple: ['display', 'show', 'list', 'basic', 'simple'],
      medium: ['dashboard', 'interactive', 'filter', 'search', 'form'],
      complex: ['real-time', 'charts', 'integration', 'advanced', 'multiple data sources', 'analytics']
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

  private generateProjectPhases(task: string, complexity: 'simple' | 'medium' | 'complex'): WidgetPhase[] {
    const basePhases: WidgetPhase[] = [
      {
        name: 'Analysis & Design',
        description: 'Analyze requirements and design widget architecture',
        duration: complexity === 'simple' ? '30min' : complexity === 'medium' ? '1hour' : '2hours',
        dependencies: [],
        assignedTo: ['UIUXSpecialistAgent', 'PlatformSpecialistAgent'],
        deliverables: ['requirements_analysis', 'design_mockups', 'technical_specs'],
        milestones: ['Requirements approved', 'Design approved']
      },
      {
        name: 'Frontend Development',
        description: 'Develop HTML template, CSS styling, and client-side JavaScript',
        duration: complexity === 'simple' ? '1hour' : complexity === 'medium' ? '2hours' : '4hours',
        dependencies: ['Analysis & Design'],
        assignedTo: ['WidgetFrontendAgent'],
        deliverables: ['html_template', 'css_styles', 'client_script'],
        milestones: ['Template completed', 'Styling completed', 'Client logic completed']
      },
      {
        name: 'Backend Development',
        description: 'Develop server-side script and data processing logic',
        duration: complexity === 'simple' ? '45min' : complexity === 'medium' ? '1.5hours' : '3hours',
        dependencies: ['Analysis & Design'],
        assignedTo: ['WidgetBackendAgent'],
        deliverables: ['server_script', 'data_processing'],
        milestones: ['Server script completed', 'Data integration completed']
      },
      {
        name: 'Integration & Testing',
        description: 'Integrate components and perform testing',
        duration: complexity === 'simple' ? '30min' : complexity === 'medium' ? '1hour' : '2hours',
        dependencies: ['Frontend Development', 'Backend Development'],
        assignedTo: ['PlatformSpecialistAgent', 'WidgetFrontendAgent'],
        deliverables: ['integrated_widget', 'test_results'],
        milestones: ['Integration completed', 'Testing completed']
      }
    ];

    // Add additional phases for complex widgets
    if (complexity === 'complex') {
      basePhases.push({
        name: 'Performance Optimization',
        description: 'Optimize widget performance and scalability',
        duration: '1hour',
        dependencies: ['Integration & Testing'],
        assignedTo: ['WidgetBackendAgent', 'PlatformSpecialistAgent'],
        deliverables: ['performance_report', 'optimization_improvements'],
        milestones: ['Performance targets met']
      });
    }

    return basePhases;
  }

  private generateDeliverables(task: string, complexity: 'simple' | 'medium' | 'complex'): WidgetDeliverable[] {
    const deliverables: WidgetDeliverable[] = [
      {
        type: 'html_template',
        content: '',
        owner: 'WidgetFrontendAgent',
        dependencies: [],
        status: 'pending'
      },
      {
        type: 'css_styles',
        content: '',
        owner: 'WidgetFrontendAgent', 
        dependencies: ['html_template'],
        status: 'pending'
      },
      {
        type: 'client_script',
        content: '',
        owner: 'WidgetFrontendAgent',
        dependencies: ['html_template'],
        status: 'pending'
      },
      {
        type: 'server_script',
        content: '',
        owner: 'WidgetBackendAgent',
        dependencies: [],
        status: 'pending'
      }
    ];

    // Add demo data for medium and complex widgets
    if (complexity !== 'simple') {
      deliverables.push({
        type: 'demo_data',
        content: '',
        owner: 'WidgetBackendAgent',
        dependencies: ['server_script'],
        status: 'pending'
      });
    }

    // Add documentation for complex widgets
    if (complexity === 'complex') {
      deliverables.push({
        type: 'documentation',
        content: '',
        owner: 'UIUXSpecialistAgent',
        dependencies: ['html_template', 'css_styles', 'client_script', 'server_script'],
        status: 'pending'
      });
    }

    return deliverables;
  }

  private extractWidgetName(task: string): string {
    // Try to extract a meaningful name from the task description
    const patterns = [
      /create\s+(.+?)\s+widget/i,
      /build\s+(.+?)\s+widget/i,
      /develop\s+(.+?)\s+widget/i,
      /(.+?)\s+widget/i,
      /widget\s+for\s+(.+)/i
    ];

    for (const pattern of patterns) {
      const match = task.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, '_').toLowerCase();
      }
    }

    return 'custom_widget';
  }

  private calculateDuration(complexity: 'simple' | 'medium' | 'complex', phases: WidgetPhase[]): string {
    const durationMap = {
      simple: '2-3 hours',
      medium: '4-6 hours', 
      complex: '8-12 hours'
    };

    return durationMap[complexity];
  }

  private identifyDependencies(task: string): string[] {
    const dependencies: string[] = ['ServiceNow Service Portal'];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('chart') || taskLower.includes('graph')) {
      dependencies.push('Chart.js or D3.js');
    }
    if (taskLower.includes('real-time') || taskLower.includes('live')) {
      dependencies.push('WebSocket or Server-Sent Events');
    }
    if (taskLower.includes('integration') || taskLower.includes('api')) {
      dependencies.push('REST API access');
    }
    if (taskLower.includes('mobile')) {
      dependencies.push('Mobile responsive framework');
    }

    return dependencies;
  }

  public getTeamStatus(): { available: number; busy: number; total: number } {
    const available = this.members.filter(m => m.status === 'available').length;
    const busy = this.members.filter(m => m.status === 'busy').length;
    const total = this.members.length;

    return { available, busy, total };
  }

  public assignTask(memberRole: WidgetTeamMember['role'], deliverable: string): boolean {
    const member = this.members.find(m => m.role === memberRole && m.status === 'available');
    if (member) {
      member.status = 'busy';
      member.workload++;
      console.log(`📌 Assigned ${deliverable} to ${member.name}`);
      return true;
    }
    return false;
  }

  public getProjectStatus(): WidgetProjectPlan | undefined {
    return this.currentProject;
  }

  public getTeamCapabilities(): string[] {
    return this.teamMode?.capabilities || [];
  }
}
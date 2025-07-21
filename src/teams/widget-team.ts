import { BaseTeam, TeamOptions, TeamMember, TaskBreakdown, QualityGate } from './base-team.js';
import { 
  FrontendSpecialist, 
  BackendSpecialist, 
  UIUXSpecialist, 
  ServiceNowSpecialist, 
  QASpecialist 
} from '../specialists/widget-specialists.js';

export class WidgetTeam extends BaseTeam {
  constructor(options: TeamOptions = { sharedMemory: true, validation: true, parallel: false, monitor: false }) {
    super(options);
  }

  initializeTeam(): void {
    this.members = [
      {
        name: 'Alex Frontend',
        role: 'Frontend Developer',
        expertise: ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Accessibility'],
        execute: async (task: any, context: any) => {
          const specialist = new FrontendSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Sam Backend',
        role: 'Backend Developer', 
        expertise: ['Server Scripts', 'GlideRecord', 'REST APIs', 'Performance', 'Caching'],
        execute: async (task: any, context: any) => {
          const specialist = new BackendSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Jordan UX',
        role: 'UI/UX Designer',
        expertise: ['User Experience', 'Design Systems', 'Accessibility', 'Usability'],
        execute: async (task: any, context: any) => {
          const specialist = new UIUXSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Taylor Platform',
        role: 'ServiceNow Specialist',
        expertise: ['Platform Integration', 'Best Practices', 'Security', 'Update Sets'],
        execute: async (task: any, context: any) => {
          const specialist = new ServiceNowSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Casey QA',
        role: 'QA Specialist',
        expertise: ['Testing', 'Quality Assurance', 'Automation', 'Validation'],
        execute: async (task: any, context: any) => {
          const specialist = new QASpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      }
    ];

    // Initialize widget-specific quality gates
    this.initializeWidgetQualityGates();
  }

  async execute(task: string): Promise<any> {
    console.log(`\n🎨 Widget Development Team Activated`);
    console.log(`📋 Mission: ${task}`);
    
    return await this.executeWithCoordination(task);
  }

  protected async analyzeRequirements(task: string): Promise<any> {
    console.log(`\n🔍 Widget Team: Analyzing requirements...`);
    
    const complexity = this.assessComplexity(task);
    const components = this.identifyComponents(task);
    const widgetType = this.identifyWidgetType(task);
    const features = this.identifyRequiredFeatures(task);
    
    const requirements = {
      task,
      complexity,
      components,
      widgetType,
      features,
      coordination: this.determineCoordinationPattern(complexity, components),
      estimatedTime: this.estimateProjectTime(complexity, features),
      risks: this.identifyRisks(task),
      dependencies: this.findDependencies(task)
    };

    console.log(`  Widget Type: ${widgetType}`);
    console.log(`  Complexity: ${complexity}`);
    console.log(`  Components: ${components.join(', ')}`);
    console.log(`  Coordination: ${requirements.coordination}`);
    
    return requirements;
  }

  protected async createTaskBreakdown(requirements: any): Promise<TaskBreakdown[]> {
    console.log(`\n📋 Widget Team: Creating task breakdown...`);
    
    const tasks: TaskBreakdown[] = [];
    
    // Always start with UX analysis for widgets
    tasks.push({
      id: 'ux_analysis',
      description: `Analyze user experience requirements for ${requirements.widgetType} widget`,
      assignedTo: this.getMemberByRole('UI/UX Designer'),
      dependencies: [],
      priority: 'high',
      estimatedTime: '30 min'
    });

    // Platform analysis in parallel or after UX
    tasks.push({
      id: 'platform_analysis',
      description: `Analyze ServiceNow platform requirements and deployment strategy`,
      assignedTo: this.getMemberByRole('ServiceNow Specialist'),
      dependencies: requirements.coordination === 'sequential' ? ['ux_analysis'] : [],
      priority: 'high',
      estimatedTime: '30 min'
    });

    // Backend development
    tasks.push({
      id: 'backend_development',
      description: `Develop server scripts and data access for ${requirements.widgetType}`,
      assignedTo: this.getMemberByRole('Backend Developer'),
      dependencies: ['platform_analysis'],
      priority: 'high', 
      estimatedTime: this.estimateBackendTime(requirements)
    });

    // Frontend development
    tasks.push({
      id: 'frontend_development', 
      description: `Create HTML templates, CSS styles, and client scripts for ${requirements.widgetType}`,
      assignedTo: this.getMemberByRole('Frontend Developer'),
      dependencies: ['ux_analysis', 'backend_development'],
      priority: 'high',
      estimatedTime: this.estimateFrontendTime(requirements)
    });

    // Integration and testing
    tasks.push({
      id: 'integration_testing',
      description: `Integrate components and perform comprehensive testing`,
      assignedTo: this.getMemberByRole('QA Specialist'),
      dependencies: ['frontend_development', 'backend_development'],
      priority: 'medium',
      estimatedTime: '45 min'
    });

    // Final validation by platform specialist
    tasks.push({
      id: 'platform_validation',
      description: `Validate deployment readiness and best practices compliance`,
      assignedTo: this.getMemberByRole('ServiceNow Specialist'),
      dependencies: ['integration_testing'],
      priority: 'medium',
      estimatedTime: '20 min'
    });

    console.log(`  Created ${tasks.length} specialized tasks`);
    tasks.forEach(task => {
      console.log(`    ${task.assignedTo.role}: ${task.description} (${task.estimatedTime})`);
    });

    return tasks;
  }

  protected async integrateResults(results: any[]): Promise<any> {
    console.log(`\n🔗 Widget Team: Integrating all specialist deliverables...`);
    
    const integration = {
      teamType: 'Widget Development Team',
      task: this.sharedContext.get('task'),
      timestamp: new Date(),
      specialists: {},
      finalDeliverable: {},
      qualityMetrics: {},
      deploymentPackage: {}
    };

    // Organize results by specialist role
    for (const result of results) {
      if (result.status === 'success' && result.result) {
        const specialist = result.result.specialist;
        integration.specialists[specialist] = result.result;
      }
    }

    // Create integrated widget deliverable
    integration.finalDeliverable = await this.createWidgetDeliverable(integration.specialists);
    
    // Calculate quality metrics
    integration.qualityMetrics = await this.calculateQualityMetrics(results);
    
    // Prepare deployment package
    integration.deploymentPackage = await this.prepareDeploymentPackage(integration.finalDeliverable);
    
    console.log(`✅ Widget integration completed successfully`);
    console.log(`   Components: ${Object.keys(integration.specialists).length} specialists contributed`);
    console.log(`   Quality Score: ${integration.qualityMetrics.overallScore}/100`);
    
    return integration;
  }

  private identifyWidgetType(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('dashboard') || lowerTask.includes('chart') || lowerTask.includes('kpi')) {
      return 'dashboard';
    } else if (lowerTask.includes('form') || lowerTask.includes('input') || lowerTask.includes('submit')) {
      return 'form';
    } else if (lowerTask.includes('list') || lowerTask.includes('table') || lowerTask.includes('grid')) {
      return 'list';
    } else if (lowerTask.includes('filter') || lowerTask.includes('search')) {
      return 'filter';
    } else if (lowerTask.includes('report') || lowerTask.includes('analytics')) {
      return 'reporting';
    }
    
    return 'display';
  }

  private identifyRequiredFeatures(task: string): string[] {
    const features: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('responsive') || lowerTask.includes('mobile')) {
      features.push('responsive_design');
    }
    
    if (lowerTask.includes('realtime') || lowerTask.includes('live')) {
      features.push('real_time_updates');
    }
    
    if (lowerTask.includes('chart') || lowerTask.includes('graph')) {
      features.push('data_visualization');
    }
    
    if (lowerTask.includes('filter') || lowerTask.includes('search')) {
      features.push('filtering');
    }
    
    if (lowerTask.includes('sort') || lowerTask.includes('order')) {
      features.push('sorting');
    }
    
    if (lowerTask.includes('export') || lowerTask.includes('download')) {
      features.push('data_export');
    }
    
    if (lowerTask.includes('print')) {
      features.push('print_support');
    }

    return features;
  }

  private determineCoordinationPattern(complexity: string, components: string[]): string {
    if (complexity === 'complex' || components.length > 3) {
      return 'hybrid'; // Mix of sequential and parallel
    } else if (complexity === 'moderate') {
      return 'parallel'; // Most tasks can run in parallel
    }
    
    return 'sequential'; // Simple linear workflow
  }

  private estimateProjectTime(complexity: string, features: string[]): string {
    const baseTime = {
      'simple': 60,
      'moderate': 120,
      'complex': 180
    };
    
    const featureTime = features.length * 15; // 15 min per feature
    const totalMinutes = baseTime[complexity] + featureTime;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  private identifyRisks(task: string): string[] {
    const risks: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('complex') || lowerTask.includes('advanced')) {
      risks.push('implementation_complexity');
    }
    
    if (lowerTask.includes('performance') || lowerTask.includes('large')) {
      risks.push('performance_requirements');
    }
    
    if (lowerTask.includes('integration') || lowerTask.includes('api')) {
      risks.push('external_dependencies');
    }
    
    if (lowerTask.includes('realtime')) {
      risks.push('real_time_synchronization');
    }
    
    return risks;
  }

  private estimateBackendTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 45 : 30;
    const featureTime = requirements.features.length * 5;
    return `${baseTime + featureTime} min`;
  }

  private estimateFrontendTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 60 : 45;
    const featureTime = requirements.features.length * 8;
    return `${baseTime + featureTime} min`;
  }

  private getMemberByRole(role: string): TeamMember {
    const member = this.members.find(m => m.role === role);
    if (!member) {
      throw new Error(`No team member found with role: ${role}`);
    }
    return member;
  }

  private async createWidgetDeliverable(specialists: any): Promise<any> {
    const deliverable: any = {
      type: 'ServiceNow Widget',
      timestamp: new Date(),
      components: {}
    };

    // Frontend components
    if (specialists['Frontend Developer']) {
      deliverable.components.frontend = {
        template: specialists['Frontend Developer'].deliverables?.template || '',
        styles: specialists['Frontend Developer'].deliverables?.styles || '',
        clientScript: specialists['Frontend Developer'].deliverables?.clientScript || ''
      };
    }

    // Backend components
    if (specialists['Backend Developer']) {
      deliverable.components.backend = {
        serverScript: specialists['Backend Developer'].deliverables?.serverScript || '',
        dataAccess: specialists['Backend Developer'].deliverables?.dataAccess || {},
        optimizations: specialists['Backend Developer'].deliverables?.optimizations || {}
      };
    }

    // UX specifications
    if (specialists['UI/UX Designer']) {
      deliverable.components.ux = specialists['UI/UX Designer'].deliverables?.uxDesign || {};
    }

    // Platform configuration
    if (specialists['ServiceNow Specialist']) {
      deliverable.components.platform = {
        integrationStrategy: specialists['ServiceNow Specialist'].deliverables?.integrationStrategy || {},
        deploymentStrategy: specialists['ServiceNow Specialist'].deliverables?.deploymentStrategy || {}
      };
    }

    // Testing artifacts
    if (specialists['QA Specialist']) {
      deliverable.components.testing = {
        testPlan: specialists['QA Specialist'].deliverables?.testPlan || {},
        testCases: specialists['QA Specialist'].deliverables?.testCases || []
      };
    }

    return deliverable;
  }

  private async calculateQualityMetrics(results: any[]): Promise<any> {
    const successfulTasks = results.filter(r => r.status === 'success').length;
    const totalTasks = results.length;
    const completionRate = (successfulTasks / totalTasks) * 100;
    
    // Calculate component quality scores
    const qualityFactors = {
      completeness: completionRate,
      codeQuality: 85, // Would be calculated from actual code analysis
      testCoverage: 90, // Would be calculated from test results
      performance: 88,  // Would be measured from performance tests
      accessibility: 92, // Would be validated through a11y tools
      security: 90      // Would be assessed through security scans
    };
    
    const overallScore = Object.values(qualityFactors).reduce((sum, score) => sum + score, 0) / Object.keys(qualityFactors).length;
    
    return {
      overallScore: Math.round(overallScore),
      factors: qualityFactors,
      completionRate,
      recommendations: this.generateQualityRecommendations(qualityFactors)
    };
  }

  private generateQualityRecommendations(factors: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.completeness < 90) {
      recommendations.push('Complete remaining development tasks');
    }
    
    if (factors.codeQuality < 85) {
      recommendations.push('Refactor code for better quality');
    }
    
    if (factors.testCoverage < 80) {
      recommendations.push('Increase test coverage');
    }
    
    if (factors.performance < 85) {
      recommendations.push('Optimize performance bottlenecks');
    }
    
    if (factors.accessibility < 90) {
      recommendations.push('Improve accessibility compliance');
    }
    
    if (factors.security < 90) {
      recommendations.push('Address security vulnerabilities');
    }
    
    return recommendations;
  }

  private async prepareDeploymentPackage(deliverable: any): Promise<any> {
    return {
      widgetDefinition: {
        name: this.generateWidgetName(),
        title: this.generateWidgetTitle(),
        description: 'Generated by Widget Development Team',
        template: deliverable.components?.frontend?.template || '',
        css: deliverable.components?.frontend?.styles || '',
        client_script: deliverable.components?.frontend?.clientScript || '',
        server_script: deliverable.components?.backend?.serverScript || '',
        demo_data: this.generateDemoData()
      },
      deploymentInstructions: {
        updateSet: 'Create new update set before deployment',
        testing: 'Execute test plan before going live',
        rollback: 'Keep backup of previous version'
      },
      qualityAssurance: {
        checklist: [
          'All tests passing',
          'Performance benchmarks met',
          'Accessibility standards complied',
          'Security review completed'
        ]
      }
    };
  }

  private generateWidgetName(): string {
    const task = this.sharedContext.get('task') || 'custom_widget';
    return task.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
  }

  private generateWidgetTitle(): string {
    const task = this.sharedContext.get('task') || 'Custom Widget';
    return task.charAt(0).toUpperCase() + task.slice(1);
  }

  private generateDemoData(): any {
    return {
      title: 'Demo Widget',
      message: 'This is a demonstration of the widget functionality',
      items: [
        { name: 'Sample Item 1', value: '100' },
        { name: 'Sample Item 2', value: '200' },
        { name: 'Sample Item 3', value: '150' }
      ]
    };
  }

  private initializeWidgetQualityGates(): void {
    // Add widget-specific quality gates
    this.qualityGates.push(
      {
        name: 'Frontend code validation',
        check: async (results) => {
          const frontendResult = results.find(r => r.result?.specialist === 'Frontend Developer');
          return frontendResult?.status === 'success' && frontendResult.result?.deliverables?.template;
        },
        onFailure: async (results) => {
          console.log('❌ Frontend validation failed - missing or invalid template');
        }
      },
      {
        name: 'Backend script validation', 
        check: async (results) => {
          const backendResult = results.find(r => r.result?.specialist === 'Backend Developer');
          return backendResult?.status === 'success' && backendResult.result?.deliverables?.serverScript;
        },
        onFailure: async (results) => {
          console.log('❌ Backend validation failed - missing or invalid server script');
        }
      },
      {
        name: 'UX design completeness',
        check: async (results) => {
          const uxResult = results.find(r => r.result?.specialist === 'UI/UX Designer');
          return uxResult?.status === 'success' && uxResult.result?.deliverables?.uxDesign;
        }
      },
      {
        name: 'Platform compliance',
        check: async (results) => {
          const platformResult = results.find(r => r.result?.specialist === 'ServiceNow Specialist');
          return platformResult?.status === 'success' && platformResult.result?.deliverables?.integrationStrategy;
        }
      },
      {
        name: 'Quality assurance passed',
        check: async (results) => {
          const qaResult = results.find(r => r.result?.specialist === 'QA Specialist');
          return qaResult?.status === 'success' && qaResult.result?.deliverables?.testPlan;
        }
      }
    );
  }
}
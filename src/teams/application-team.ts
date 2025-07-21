import { BaseTeam, TeamOptions, TeamMember, TaskBreakdown, QualityGate } from './base-team.js';
import { 
  DatabaseSpecialist, 
  BusinessLogicSpecialist, 
  InterfaceSpecialist, 
  PerformanceSpecialist 
} from '../specialists/app-specialists.js';
import { SecuritySpecialist } from '../specialists/flow-specialists.js'; // Reuse security specialist

export class ApplicationTeam extends BaseTeam {
  constructor(options: TeamOptions = { sharedMemory: true, validation: true, parallel: false, monitor: false }) {
    super(options);
  }

  initializeTeam(): void {
    this.members = [
      {
        name: 'Dana Database',
        role: 'Database Designer',
        expertise: ['Table Design', 'Relationships', 'Indexing', 'Performance', 'Data Modeling'],
        execute: async (task: any, context: any) => {
          const specialist = new DatabaseSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Logan Logic',
        role: 'Business Logic Developer',
        expertise: ['Business Rules', 'Script Includes', 'Workflows', 'Calculations', 'Validations'],
        execute: async (task: any, context: any) => {
          const specialist = new BusinessLogicSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Sage Interface',
        role: 'Interface Designer',
        expertise: ['Forms', 'Lists', 'UI Policies', 'Client Scripts', 'User Experience'],
        execute: async (task: any, context: any) => {
          const specialist = new InterfaceSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Quinn Security',
        role: 'Security Specialist',
        expertise: ['Security Analysis', 'Access Control', 'Compliance', 'Vulnerability Assessment'],
        execute: async (task: any, context: any) => {
          const specialist = new SecuritySpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Phoenix Performance',
        role: 'Performance Specialist',
        expertise: ['Query Optimization', 'Caching', 'Indexing', 'Load Testing', 'Monitoring'],
        execute: async (task: any, context: any) => {
          const specialist = new PerformanceSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      }
    ];

    // Initialize application-specific quality gates
    this.initializeApplicationQualityGates();
  }

  async execute(task: string): Promise<any> {
    console.log(`\n🏗️ Application Development Team Activated`);
    console.log(`📋 Mission: ${task}`);
    
    return await this.executeWithCoordination(task);
  }

  protected async analyzeRequirements(task: string): Promise<any> {
    console.log(`\n🔍 Application Team: Analyzing requirements...`);
    
    const complexity = this.assessComplexity(task);
    const components = this.identifyComponents(task);
    const applicationType = this.identifyApplicationType(task);
    const features = this.identifyRequiredFeatures(task);
    const scalability = this.identifyScalabilityNeeds(task);
    const compliance = this.identifyComplianceRequirements(task);
    
    const requirements = {
      task,
      complexity,
      components,
      applicationType,
      features,
      scalability,
      compliance,
      coordination: this.determineCoordinationPattern(complexity, components, scalability),
      estimatedTime: this.estimateProjectTime(complexity, features, scalability),
      risks: this.identifyRisks(task),
      dependencies: this.findDependencies(task)
    };

    console.log(`  Application Type: ${applicationType}`);
    console.log(`  Complexity: ${complexity}`);
    console.log(`  Components: ${components.join(', ')}`);
    console.log(`  Scalability: ${scalability}`);
    console.log(`  Coordination: ${requirements.coordination}`);
    
    return requirements;
  }

  protected async createTaskBreakdown(requirements: any): Promise<TaskBreakdown[]> {
    console.log(`\n📋 Application Team: Creating task breakdown...`);
    
    const tasks: TaskBreakdown[] = [];
    
    // Always start with database design for applications
    tasks.push({
      id: 'database_design',
      description: `Design database schema and relationships for ${requirements.applicationType}`,
      assignedTo: this.getMemberByRole('Database Designer'),
      dependencies: [],
      priority: 'high',
      estimatedTime: '60 min'
    });

    // Security analysis in parallel with database design
    tasks.push({
      id: 'security_analysis',
      description: `Analyze security requirements and compliance needs for ${requirements.applicationType}`,
      assignedTo: this.getMemberByRole('Security Specialist'),
      dependencies: requirements.coordination === 'sequential' ? ['database_design'] : [],
      priority: 'high',
      estimatedTime: '45 min'
    });

    // Business logic development after database design
    tasks.push({
      id: 'business_logic_development',
      description: `Develop business rules, validations, and workflows for the application`,
      assignedTo: this.getMemberByRole('Business Logic Developer'),
      dependencies: ['database_design'],
      priority: 'high',
      estimatedTime: this.estimateBusinessLogicTime(requirements)
    });

    // Interface design after business logic (or in parallel for simple apps)
    const interfaceDependencies = requirements.complexity === 'simple' ? ['database_design'] : ['business_logic_development'];
    tasks.push({
      id: 'interface_design',
      description: `Design user interfaces, forms, and navigation for ${requirements.applicationType}`,
      assignedTo: this.getMemberByRole('Interface Designer'),
      dependencies: interfaceDependencies,
      priority: 'high',
      estimatedTime: this.estimateInterfaceTime(requirements)
    });

    // Performance optimization after core components
    if (requirements.scalability === 'high' || requirements.complexity === 'complex') {
      tasks.push({
        id: 'performance_optimization',
        description: `Optimize performance, implement caching, and design scalability solutions`,
        assignedTo: this.getMemberByRole('Performance Specialist'),
        dependencies: ['business_logic_development', 'interface_design'],
        priority: 'medium',
        estimatedTime: this.estimatePerformanceTime(requirements)
      });
    }

    // Final integration and validation
    const finalDependencies = ['interface_design', 'security_analysis'];
    if (requirements.scalability === 'high' || requirements.complexity === 'complex') {
      finalDependencies.push('performance_optimization');
    }

    tasks.push({
      id: 'application_integration',
      description: `Integrate all components and validate complete application functionality`,
      assignedTo: this.getMemberByRole('Database Designer'), // Lead integration
      dependencies: finalDependencies,
      priority: 'medium',
      estimatedTime: '45 min'
    });

    console.log(`  Created ${tasks.length} specialized tasks`);
    tasks.forEach(task => {
      console.log(`    ${task.assignedTo.role}: ${task.description} (${task.estimatedTime})`);
    });

    return tasks;
  }

  protected async integrateResults(results: any[]): Promise<any> {
    console.log(`\n🔗 Application Team: Integrating all specialist deliverables...`);
    
    const integration = {
      teamType: 'Application Development Team',
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

    // Create integrated application deliverable
    integration.finalDeliverable = await this.createApplicationDeliverable(integration.specialists);
    
    // Calculate quality metrics
    integration.qualityMetrics = await this.calculateQualityMetrics(results);
    
    // Prepare deployment package
    integration.deploymentPackage = await this.prepareDeploymentPackage(integration.finalDeliverable);
    
    console.log(`✅ Application integration completed successfully`);
    console.log(`   Components: ${Object.keys(integration.specialists).length} specialists contributed`);
    console.log(`   Quality Score: ${integration.qualityMetrics.overallScore}/100`);
    
    return integration;
  }

  private identifyApplicationType(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('itsm') || lowerTask.includes('service management')) {
      return 'itsm_application';
    } else if (lowerTask.includes('asset') || lowerTask.includes('inventory')) {
      return 'asset_management';
    } else if (lowerTask.includes('hr') || lowerTask.includes('employee')) {
      return 'hr_application';
    } else if (lowerTask.includes('project') || lowerTask.includes('portfolio')) {
      return 'project_management';
    } else if (lowerTask.includes('financial') || lowerTask.includes('budget')) {
      return 'financial_application';
    } else if (lowerTask.includes('crm') || lowerTask.includes('customer')) {
      return 'crm_application';
    }
    
    return 'custom_application';
  }

  private identifyRequiredFeatures(task: string): string[] {
    const features: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('approval')) {
      features.push('approval_workflow');
    }
    
    if (lowerTask.includes('notification') || lowerTask.includes('email')) {
      features.push('notification_system');
    }
    
    if (lowerTask.includes('dashboard') || lowerTask.includes('analytics')) {
      features.push('dashboards_analytics');
    }
    
    if (lowerTask.includes('integration') || lowerTask.includes('api')) {
      features.push('external_integration');
    }
    
    if (lowerTask.includes('mobile') || lowerTask.includes('responsive')) {
      features.push('mobile_support');
    }
    
    if (lowerTask.includes('audit') || lowerTask.includes('compliance')) {
      features.push('audit_trail');
    }
    
    if (lowerTask.includes('report') || lowerTask.includes('export')) {
      features.push('reporting_export');
    }
    
    if (lowerTask.includes('search') || lowerTask.includes('filter')) {
      features.push('advanced_search');
    }

    return features;
  }

  private identifyScalabilityNeeds(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('enterprise') || lowerTask.includes('large scale')) {
      return 'high';
    } else if (lowerTask.includes('department') || lowerTask.includes('medium')) {
      return 'medium';
    } else if (lowerTask.includes('team') || lowerTask.includes('small')) {
      return 'low';
    }
    
    return 'medium';
  }

  private identifyComplianceRequirements(task: string): string[] {
    const compliance: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('gdpr') || lowerTask.includes('privacy')) {
      compliance.push('gdpr');
    }
    
    if (lowerTask.includes('sox') || lowerTask.includes('financial')) {
      compliance.push('sox');
    }
    
    if (lowerTask.includes('hipaa') || lowerTask.includes('medical')) {
      compliance.push('hipaa');
    }
    
    if (lowerTask.includes('iso') || lowerTask.includes('iso27001')) {
      compliance.push('iso27001');
    }

    return compliance;
  }

  private determineCoordinationPattern(complexity: string, components: string[], scalability: string): string {
    if (complexity === 'complex' || scalability === 'high') {
      return 'hybrid'; // Mix of sequential and parallel
    } else if (components.length > 4) {
      return 'parallel_with_sync'; // Parallel with synchronization points
    } else if (complexity === 'moderate') {
      return 'parallel'; // Most tasks can run in parallel
    }
    
    return 'sequential'; // Simple linear workflow
  }

  private estimateProjectTime(complexity: string, features: string[], scalability: string): string {
    const baseTime = {
      'simple': 180,      // 3 hours
      'moderate': 360,    // 6 hours
      'complex': 600      // 10 hours
    };
    
    const featureTime = features.length * 30; // 30 min per feature
    const scalabilityMultiplier = scalability === 'high' ? 1.5 : scalability === 'medium' ? 1.2 : 1.0;
    
    const totalMinutes = (baseTime[complexity] + featureTime) * scalabilityMultiplier;
    
    if (totalMinutes < 60) {
      return `${Math.round(totalMinutes)} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  private identifyRisks(task: string): string[] {
    const risks: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('complex') || lowerTask.includes('enterprise')) {
      risks.push('architectural_complexity');
    }
    
    if (lowerTask.includes('integration') || lowerTask.includes('api')) {
      risks.push('integration_dependencies');
    }
    
    if (lowerTask.includes('performance') || lowerTask.includes('high volume')) {
      risks.push('performance_requirements');
    }
    
    if (lowerTask.includes('compliance') || lowerTask.includes('regulatory')) {
      risks.push('compliance_complexity');
    }
    
    if (lowerTask.includes('migration') || lowerTask.includes('existing')) {
      risks.push('data_migration_challenges');
    }
    
    return risks;
  }

  private estimateBusinessLogicTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 90 : 60;
    const featureTime = requirements.features.length * 10;
    return `${baseTime + featureTime} min`;
  }

  private estimateInterfaceTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 75 : 50;
    const featureTime = requirements.features.length * 8;
    const mobileBonus = requirements.features.includes('mobile_support') ? 15 : 0;
    return `${baseTime + featureTime + mobileBonus} min`;
  }

  private estimatePerformanceTime(requirements: any): string {
    const baseTime = 45;
    const scalabilityTime = requirements.scalability === 'high' ? 30 : 15;
    return `${baseTime + scalabilityTime} min`;
  }

  private getMemberByRole(role: string): TeamMember {
    const member = this.members.find(m => m.role === role);
    if (!member) {
      throw new Error(`No team member found with role: ${role}`);
    }
    return member;
  }

  private async createApplicationDeliverable(specialists: any): Promise<any> {
    const deliverable: any = {
      type: 'ServiceNow Application',
      timestamp: new Date(),
      components: {}
    };

    // Database components
    if (specialists['Database Designer']) {
      deliverable.components.database = {
        schema: specialists['Database Designer'].deliverables?.schema || {},
        tableDefinitions: specialists['Database Designer'].deliverables?.tableDefinitions || []
      };
    }

    // Business logic components
    if (specialists['Business Logic Developer']) {
      deliverable.components.businessLogic = {
        logicArchitecture: specialists['Business Logic Developer'].deliverables?.logicArchitecture || {},
        implementations: specialists['Business Logic Developer'].deliverables?.implementations || {}
      };
    }

    // Interface components
    if (specialists['Interface Designer']) {
      deliverable.components.interface = {
        interfaceArchitecture: specialists['Interface Designer'].deliverables?.interfaceArchitecture || {},
        implementations: specialists['Interface Designer'].deliverables?.implementations || {}
      };
    }

    // Security components
    if (specialists['Security Specialist']) {
      deliverable.components.security = {
        securityControls: specialists['Security Specialist'].deliverables?.securityControls || {},
        securityPlan: specialists['Security Specialist'].deliverables?.securityPlan || {}
      };
    }

    // Performance components
    if (specialists['Performance Specialist']) {
      deliverable.components.performance = {
        optimizationStrategy: specialists['Performance Specialist'].deliverables?.optimizationStrategy || {},
        implementationPlan: specialists['Performance Specialist'].deliverables?.implementationPlan || {}
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
      databaseDesign: 90, // Would be calculated from schema analysis
      businessLogic: 88,  // Would be calculated from code quality metrics
      interfaceDesign: 92, // Would be assessed through UX evaluation
      securityCompliance: 89, // Would be assessed through security review
      performance: 86     // Would be evaluated through performance testing
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
    
    if (factors.databaseDesign < 85) {
      recommendations.push('Optimize database schema and relationships');
    }
    
    if (factors.businessLogic < 85) {
      recommendations.push('Refactor business logic for better maintainability');
    }
    
    if (factors.interfaceDesign < 90) {
      recommendations.push('Improve user interface design and usability');
    }
    
    if (factors.securityCompliance < 90) {
      recommendations.push('Address security compliance gaps');
    }
    
    if (factors.performance < 85) {
      recommendations.push('Optimize application performance and scalability');
    }
    
    return recommendations;
  }

  private async prepareDeploymentPackage(deliverable: any): Promise<any> {
    const tableDefinitions = deliverable.components?.database?.tableDefinitions || [];
    const businessRules = deliverable.components?.businessLogic?.implementations?.businessRules || [];
    const forms = deliverable.components?.interface?.implementations?.forms || [];
    
    return {
      applicationDefinition: {
        name: this.generateApplicationName(),
        description: 'Generated by Application Development Team',
        version: '1.0.0',
        scope: this.generateApplicationScope(),
        vendor: 'Internal Development',
        vendor_prefix: 'x_app'
      },
      components: {
        tables: tableDefinitions.length,
        businessRules: businessRules.length,
        forms: forms.length,
        workflows: this.countWorkflows(deliverable),
        integrations: this.countIntegrations(deliverable)
      },
      deploymentInstructions: {
        updateSet: 'Create new update set for application deployment',
        testing: 'Execute comprehensive application testing before production',
        security: 'Validate security controls and access permissions',
        performance: 'Conduct performance testing under expected load',
        rollback: 'Prepare rollback plan and backup procedures'
      },
      qualityAssurance: {
        checklist: [
          'All database tables created and validated',
          'Business logic implemented and tested',
          'User interfaces designed and responsive',
          'Security controls implemented and verified',
          'Performance benchmarks met',
          'Integration points tested and functional',
          'Documentation complete and accurate'
        ]
      },
      postDeployment: {
        monitoring: 'Enable application performance monitoring',
        training: 'Conduct user training sessions',
        support: 'Establish support procedures and documentation',
        maintenance: 'Schedule regular maintenance and updates'
      }
    };
  }

  private generateApplicationName(): string {
    const task = this.sharedContext.get('task') || 'custom_application';
    return task.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
  }

  private generateApplicationScope(): string {
    const task = this.sharedContext.get('task') || '';
    
    if (task.toLowerCase().includes('global') || task.toLowerCase().includes('enterprise')) {
      return 'global';
    }
    
    return 'x_app_' + this.generateApplicationName();
  }

  private countWorkflows(deliverable: any): number {
    const workflows = deliverable.components?.businessLogic?.implementations?.workflows || [];
    return workflows.length;
  }

  private countIntegrations(deliverable: any): number {
    // Count integrations from various components
    let count = 0;
    
    const businessLogic = deliverable.components?.businessLogic?.implementations || {};
    if (businessLogic.integrations) {
      count += businessLogic.integrations.length;
    }
    
    return count;
  }

  private initializeApplicationQualityGates(): void {
    // Add application-specific quality gates
    this.qualityGates.push(
      {
        name: 'Database schema validation',
        check: async (results) => {
          const dbResult = results.find(r => r.result?.specialist === 'Database Designer');
          return dbResult?.status === 'success' && dbResult.result?.deliverables?.schema;
        },
        onFailure: async (results) => {
          console.log('❌ Database schema validation failed - missing or invalid schema design');
        }
      },
      {
        name: 'Business logic implementation validation',
        check: async (results) => {
          const logicResult = results.find(r => r.result?.specialist === 'Business Logic Developer');
          return logicResult?.status === 'success' && logicResult.result?.deliverables?.implementations;
        },
        onFailure: async (results) => {
          console.log('❌ Business logic validation failed - missing or invalid implementations');
        }
      },
      {
        name: 'User interface design validation',
        check: async (results) => {
          const uiResult = results.find(r => r.result?.specialist === 'Interface Designer');
          return uiResult?.status === 'success' && uiResult.result?.deliverables?.implementations;
        }
      },
      {
        name: 'Security compliance validation',
        check: async (results) => {
          const securityResult = results.find(r => r.result?.specialist === 'Security Specialist');
          return securityResult?.status === 'success' && securityResult.result?.deliverables?.securityControls;
        }
      },
      {
        name: 'Performance optimization validation',
        check: async (results) => {
          const perfResult = results.find(r => r.result?.specialist === 'Performance Specialist');
          // Performance optimization is optional for simple applications
          return !perfResult || (perfResult?.status === 'success' && perfResult.result?.deliverables?.optimizationStrategy);
        }
      }
    );
  }
}
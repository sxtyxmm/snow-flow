import { BaseTeam, TeamOptions, TeamMember, TaskBreakdown, QualityGate } from './base-team.js';

// Import all available specialists
import { 
  FrontendSpecialist, 
  BackendSpecialist, 
  UIUXSpecialist, 
  ServiceNowSpecialist, 
  QASpecialist 
} from '../specialists/widget-specialists.js';

import { 
  ProcessSpecialist, 
  TriggerSpecialist, 
  DataSpecialist as FlowDataSpecialist, 
  IntegrationSpecialist, 
  SecuritySpecialist 
} from '../specialists/flow-specialists.js';

import { 
  DatabaseSpecialist, 
  BusinessLogicSpecialist, 
  InterfaceSpecialist, 
  PerformanceSpecialist 
} from '../specialists/app-specialists.js';

// Specialist registry for dynamic assembly
interface SpecialistDefinition {
  name: string;
  role: string;
  expertise: string[];
  category: string;
  applicability: string[];
  priority: number;
  createInstance: (options?: any) => any;
}

export class AdaptiveTeam extends BaseTeam {
  private availableSpecialists: SpecialistDefinition[] = [];
  private selectedSpecialists: SpecialistDefinition[] = [];
  private taskAnalysis: any = {};

  constructor(options: TeamOptions = { sharedMemory: true, validation: true, parallel: false, monitor: false }) {
    super(options);
    this.initializeSpecialistRegistry();
  }

  initializeTeam(): void {
    // Team members will be dynamically assembled based on task analysis
    this.members = [];
    
    // Initialize adaptive quality gates
    this.initializeAdaptiveQualityGates();
  }

  async execute(task: string): Promise<any> {
    console.log(`\n🤖 Adaptive Development Team Activated`);
    console.log(`📋 Mission: ${task}`);
    console.log(`🔍 Analyzing task to assemble optimal specialist team...`);
    
    // Analyze task and dynamically assemble team
    await this.analyzeTaskAndAssembleTeam(task);
    
    return await this.executeWithCoordination(task);
  }

  protected async analyzeRequirements(task: string): Promise<any> {
    console.log(`\n🔍 Adaptive Team: Deep task analysis...`);
    
    // Comprehensive task analysis
    this.taskAnalysis = {
      task,
      domain: this.identifyDomain(task),
      complexity: this.assessComplexity(task),
      components: this.identifyComponents(task),
      technologies: this.identifyTechnologies(task),
      requirements: this.extractRequirements(task),
      constraints: this.identifyConstraints(task),
      deliverables: this.identifyDeliverables(task),
      riskFactors: this.identifyRiskFactors(task),
      specialistNeeds: this.analyzeSpecialistNeeds(task)
    };

    const requirements = {
      ...this.taskAnalysis,
      coordination: this.determineCoordinationPattern(this.taskAnalysis),
      estimatedTime: this.estimateProjectTime(this.taskAnalysis),
      teamSize: this.selectedSpecialists.length,
      dependencies: this.findDependencies(task)
    };

    console.log(`  Domain: ${requirements.domain}`);
    console.log(`  Complexity: ${requirements.complexity}`);
    console.log(`  Team Size: ${requirements.teamSize} specialists`);
    console.log(`  Technologies: ${requirements.technologies.join(', ')}`);
    console.log(`  Coordination: ${requirements.coordination}`);
    
    return requirements;
  }

  protected async createTaskBreakdown(requirements: any): Promise<TaskBreakdown[]> {
    console.log(`\n📋 Adaptive Team: Creating dynamic task breakdown...`);
    
    const tasks: TaskBreakdown[] = [];
    
    // Create tasks based on selected specialists and their dependencies
    const specialistTasks = this.createSpecialistTasks(requirements);
    const dependencyMap = this.buildDependencyMap(specialistTasks);
    const prioritizedTasks = this.prioritizeTasks(specialistTasks, dependencyMap);
    
    tasks.push(...prioritizedTasks);
    
    // Add integration task if multiple specialists
    if (this.selectedSpecialists.length > 1) {
      tasks.push({
        id: 'adaptive_integration',
        description: `Integrate all specialist deliverables into cohesive solution`,
        assignedTo: this.selectIntegrationLead(),
        dependencies: tasks.map(t => t.id),
        priority: 'medium',
        estimatedTime: this.estimateIntegrationTime(requirements)
      });
    }

    console.log(`  Created ${tasks.length} adaptive tasks`);
    tasks.forEach(task => {
      console.log(`    ${task.assignedTo.role}: ${task.description} (${task.estimatedTime})`);
    });

    return tasks;
  }

  protected async integrateResults(results: any[]): Promise<any> {
    console.log(`\n🔗 Adaptive Team: Intelligent result integration...`);
    
    const integration = {
      teamType: 'Adaptive Development Team',
      task: this.sharedContext.get('task'),
      timestamp: new Date(),
      assembledTeam: this.getTeamComposition(),
      specialists: {},
      finalDeliverable: {},
      qualityMetrics: {},
      deploymentPackage: {},
      adaptiveInsights: {}
    };

    // Organize results by specialist role
    for (const result of results) {
      if (result.status === 'success' && result.result) {
        const specialist = result.result.specialist;
        integration.specialists[specialist] = result.result;
      }
    }

    // Create adaptive integration based on domain and deliverables
    integration.finalDeliverable = await this.createAdaptiveDeliverable(integration.specialists);
    
    // Calculate adaptive quality metrics
    integration.qualityMetrics = await this.calculateAdaptiveQualityMetrics(results);
    
    // Prepare deployment package
    integration.deploymentPackage = await this.prepareAdaptiveDeploymentPackage(integration.finalDeliverable);
    
    // Generate adaptive insights
    integration.adaptiveInsights = await this.generateAdaptiveInsights(integration);
    
    console.log(`✅ Adaptive integration completed successfully`);
    console.log(`   Team Composition: ${integration.assembledTeam.map(s => s.role).join(', ')}`);
    console.log(`   Quality Score: ${integration.qualityMetrics.overallScore}/100`);
    console.log(`   Adaptive Efficiency: ${integration.adaptiveInsights.efficiency}%`);
    
    return integration;
  }

  private initializeSpecialistRegistry(): void {
    this.availableSpecialists = [
      // Widget Specialists
      {
        name: 'Alex Frontend',
        role: 'Frontend Developer',
        expertise: ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'Accessibility'],
        category: 'frontend',
        applicability: ['widget', 'ui', 'interface', 'web', 'responsive', 'mobile'],
        priority: 90,
        createInstance: (options) => new FrontendSpecialist(options)
      },
      {
        name: 'Sam Backend',
        role: 'Backend Developer',
        expertise: ['Server Scripts', 'GlideRecord', 'REST APIs', 'Performance', 'Caching'],
        category: 'backend',
        applicability: ['server', 'api', 'data', 'performance', 'caching', 'integration'],
        priority: 85,
        createInstance: (options) => new BackendSpecialist(options)
      },
      {
        name: 'Jordan UX',
        role: 'UI/UX Designer',
        expertise: ['User Experience', 'Design Systems', 'Accessibility', 'Usability'],
        category: 'design',
        applicability: ['ux', 'design', 'user', 'interface', 'accessibility', 'usability'],
        priority: 75,
        createInstance: (options) => new UIUXSpecialist(options)
      },
      {
        name: 'Casey QA',
        role: 'QA Specialist',
        expertise: ['Testing', 'Quality Assurance', 'Automation', 'Validation'],
        category: 'quality',
        applicability: ['test', 'quality', 'validation', 'automation', 'qa'],
        priority: 70,
        createInstance: (options) => new QASpecialist(options)
      },
      
      // Flow Specialists
      {
        name: 'Morgan Process',
        role: 'Process Designer',
        expertise: ['Business Logic', 'Workflow Design', 'Process Optimization'],
        category: 'process',
        applicability: ['flow', 'workflow', 'process', 'automation', 'business'],
        priority: 95,
        createInstance: (options) => new ProcessSpecialist(options)
      },
      {
        name: 'Riley Trigger',
        role: 'Trigger Specialist',
        expertise: ['Event Handling', 'Conditions', 'Automation', 'Real-time Processing'],
        category: 'events',
        applicability: ['trigger', 'event', 'condition', 'realtime', 'automation'],
        priority: 80,
        createInstance: (options) => new TriggerSpecialist(options)
      },
      {
        name: 'Avery Data',
        role: 'Data Specialist',
        expertise: ['Data Modeling', 'Variable Management', 'Data Transformation'],
        category: 'data',
        applicability: ['data', 'variable', 'transformation', 'modeling'],
        priority: 85,
        createInstance: (options) => new FlowDataSpecialist(options)
      },
      {
        name: 'Cameron Integration',
        role: 'Integration Specialist',
        expertise: ['API Integration', 'External Systems', 'Data Synchronization'],
        category: 'integration',
        applicability: ['integration', 'api', 'external', 'sync', 'middleware'],
        priority: 75,
        createInstance: (options) => new IntegrationSpecialist(options)
      },
      
      // Application Specialists
      {
        name: 'Dana Database',
        role: 'Database Designer',
        expertise: ['Table Design', 'Relationships', 'Indexing', 'Performance'],
        category: 'database',
        applicability: ['database', 'table', 'schema', 'relationship', 'index'],
        priority: 90,
        createInstance: (options) => new DatabaseSpecialist(options)
      },
      {
        name: 'Logan Logic',
        role: 'Business Logic Developer',
        expertise: ['Business Rules', 'Script Includes', 'Workflows', 'Validations'],
        category: 'business_logic',
        applicability: ['business', 'rule', 'script', 'validation', 'calculation'],
        priority: 85,
        createInstance: (options) => new BusinessLogicSpecialist(options)
      },
      {
        name: 'Sage Interface',
        role: 'Interface Designer',
        expertise: ['Forms', 'Lists', 'UI Policies', 'Client Scripts'],
        category: 'interface',
        applicability: ['form', 'list', 'ui', 'client', 'interface', 'navigation'],
        priority: 80,
        createInstance: (options) => new InterfaceSpecialist(options)
      },
      {
        name: 'Phoenix Performance',
        role: 'Performance Specialist',
        expertise: ['Query Optimization', 'Caching', 'Indexing', 'Load Testing'],
        category: 'performance',
        applicability: ['performance', 'optimization', 'caching', 'load', 'scale'],
        priority: 70,
        createInstance: (options) => new PerformanceSpecialist(options)
      },
      
      // Cross-cutting Specialists
      {
        name: 'Taylor Platform',
        role: 'ServiceNow Specialist',
        expertise: ['Platform Integration', 'Best Practices', 'Update Sets'],
        category: 'platform',
        applicability: ['platform', 'servicenow', 'update', 'deployment', 'best'],
        priority: 95,
        createInstance: (options) => new ServiceNowSpecialist(options)
      },
      {
        name: 'Quinn Security',
        role: 'Security Specialist',
        expertise: ['Security Analysis', 'Access Control', 'Compliance'],
        category: 'security',
        applicability: ['security', 'access', 'compliance', 'audit', 'vulnerability'],
        priority: 85,
        createInstance: (options) => new SecuritySpecialist(options)
      }
    ];
  }

  private async analyzeTaskAndAssembleTeam(task: string): Promise<void> {
    console.log(`\n🧠 Analyzing task characteristics...`);
    
    // Score each specialist based on task relevance
    const specialistScores = this.scoreSpecialists(task);
    
    // Select optimal team composition
    this.selectedSpecialists = this.selectOptimalTeam(specialistScores, task);
    
    // Create team members from selected specialists
    this.members = this.createTeamMembers(this.selectedSpecialists);
    
    console.log(`\n✅ Team assembled with ${this.selectedSpecialists.length} specialists:`);
    this.selectedSpecialists.forEach(specialist => {
      console.log(`   • ${specialist.role} (${specialist.category})`);
    });
  }

  private scoreSpecialists(task: string): Map<string, number> {
    const scores = new Map<string, number>();
    const lowerTask = task.toLowerCase();
    
    this.availableSpecialists.forEach(specialist => {
      let score = 0;
      
      // Base priority score
      score += specialist.priority;
      
      // Applicability matching
      const applicabilityMatches = specialist.applicability.filter(term => 
        lowerTask.includes(term)
      ).length;
      score += applicabilityMatches * 20;
      
      // Expertise matching (fuzzy)
      const expertiseMatches = specialist.expertise.filter(expertise => 
        lowerTask.includes(expertise.toLowerCase()) ||
        this.fuzzyMatch(lowerTask, expertise.toLowerCase())
      ).length;
      score += expertiseMatches * 15;
      
      // Domain-specific bonuses
      score += this.calculateDomainBonus(specialist, task);
      
      scores.set(specialist.role, score);
    });
    
    return scores;
  }

  private fuzzyMatch(text: string, pattern: string): boolean {
    const words = pattern.split(' ');
    return words.some(word => text.includes(word.toLowerCase()));
  }

  private calculateDomainBonus(specialist: SpecialistDefinition, task: string): number {
    const lowerTask = task.toLowerCase();
    let bonus = 0;
    
    // Widget/UI development bonus
    if ((lowerTask.includes('widget') || lowerTask.includes('ui')) && 
        ['frontend', 'design', 'platform'].includes(specialist.category)) {
      bonus += 30;
    }
    
    // Flow development bonus
    if ((lowerTask.includes('flow') || lowerTask.includes('workflow')) && 
        ['process', 'events', 'data', 'platform'].includes(specialist.category)) {
      bonus += 30;
    }
    
    // Application development bonus
    if ((lowerTask.includes('application') || lowerTask.includes('app')) && 
        ['database', 'business_logic', 'interface', 'platform'].includes(specialist.category)) {
      bonus += 30;
    }
    
    // Integration bonus
    if (lowerTask.includes('integration') && specialist.category === 'integration') {
      bonus += 40;
    }
    
    // Performance/scalability bonus
    if ((lowerTask.includes('performance') || lowerTask.includes('scale')) && 
        specialist.category === 'performance') {
      bonus += 35;
    }
    
    // Security bonus
    if ((lowerTask.includes('security') || lowerTask.includes('compliance')) && 
        specialist.category === 'security') {
      bonus += 35;
    }
    
    return bonus;
  }

  private selectOptimalTeam(scores: Map<string, number>, task: string): SpecialistDefinition[] {
    const sortedSpecialists = this.availableSpecialists
      .map(specialist => ({
        specialist,
        score: scores.get(specialist.role) || 0
      }))
      .sort((a, b) => b.score - a.score);
    
    const selected: SpecialistDefinition[] = [];
    const maxTeamSize = this.determineMaxTeamSize(task);
    const minScore = 50; // Minimum relevance threshold
    
    // Always include ServiceNow platform specialist if score is reasonable
    const platformSpecialist = sortedSpecialists.find(s => s.specialist.role === 'ServiceNow Specialist');
    if (platformSpecialist && platformSpecialist.score >= minScore) {
      selected.push(platformSpecialist.specialist);
    }
    
    // Select top scoring specialists up to team size limit
    for (const item of sortedSpecialists) {
      if (selected.length >= maxTeamSize) break;
      if (item.score < minScore) break;
      if (selected.includes(item.specialist)) continue;
      
      // Avoid redundancy - don't select multiple specialists from same category unless high relevance
      const categoryConflict = selected.find(s => s.category === item.specialist.category);
      if (categoryConflict && item.score < 120) continue;
      
      selected.push(item.specialist);
    }
    
    return selected;
  }

  private determineMaxTeamSize(task: string): number {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('simple') || lowerTask.includes('basic')) {
      return 3;
    } else if (lowerTask.includes('complex') || lowerTask.includes('enterprise')) {
      return 6;
    } else if (lowerTask.includes('integration') || lowerTask.includes('multi')) {
      return 5;
    }
    
    return 4; // Default team size
  }

  private createTeamMembers(specialists: SpecialistDefinition[]): TeamMember[] {
    return specialists.map(specialist => ({
      name: specialist.name,
      role: specialist.role,
      expertise: specialist.expertise,
      execute: async (task: any, context: any) => {
        const instance = specialist.createInstance(this.options);
        return await instance.execute(task.description, context);
      }
    }));
  }

  private identifyDomain(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('widget') || (lowerTask.includes('ui') && !lowerTask.includes('flow'))) {
      return 'widget_development';
    } else if (lowerTask.includes('flow') || lowerTask.includes('workflow')) {
      return 'flow_development';
    } else if (lowerTask.includes('application') || lowerTask.includes('app')) {
      return 'application_development';
    } else if (lowerTask.includes('integration')) {
      return 'integration_development';
    } else if (lowerTask.includes('database') || lowerTask.includes('table')) {
      return 'database_development';
    } else if (lowerTask.includes('report') || lowerTask.includes('dashboard')) {
      return 'reporting_development';
    }
    
    return 'general_development';
  }

  private identifyTechnologies(task: string): string[] {
    const technologies: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('html') || lowerTask.includes('css') || lowerTask.includes('javascript')) {
      technologies.push('web_technologies');
    }
    if (lowerTask.includes('rest') || lowerTask.includes('api')) {
      technologies.push('rest_api');
    }
    if (lowerTask.includes('soap')) {
      technologies.push('soap_api');
    }
    if (lowerTask.includes('json') || lowerTask.includes('xml')) {
      technologies.push('data_formats');
    }
    if (lowerTask.includes('oauth') || lowerTask.includes('saml')) {
      technologies.push('authentication');
    }
    if (lowerTask.includes('ldap')) {
      technologies.push('directory_services');
    }
    if (lowerTask.includes('email') || lowerTask.includes('smtp')) {
      technologies.push('email_systems');
    }
    
    return technologies;
  }

  private extractRequirements(task: string): any {
    const lowerTask = task.toLowerCase();
    
    return {
      functional: this.extractFunctionalRequirements(task),
      nonFunctional: this.extractNonFunctionalRequirements(task),
      technical: this.extractTechnicalRequirements(task),
      business: this.extractBusinessRequirements(task)
    };
  }

  private extractFunctionalRequirements(task: string): string[] {
    const requirements: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('create')) requirements.push('creation_capability');
    if (lowerTask.includes('update')) requirements.push('update_capability');
    if (lowerTask.includes('delete')) requirements.push('deletion_capability');
    if (lowerTask.includes('search')) requirements.push('search_capability');
    if (lowerTask.includes('filter')) requirements.push('filtering_capability');
    if (lowerTask.includes('approval')) requirements.push('approval_process');
    if (lowerTask.includes('notification')) requirements.push('notification_system');
    if (lowerTask.includes('report')) requirements.push('reporting_capability');
    
    return requirements;
  }

  private extractNonFunctionalRequirements(task: string): string[] {
    const requirements: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('performance')) requirements.push('performance_optimization');
    if (lowerTask.includes('security')) requirements.push('security_compliance');
    if (lowerTask.includes('scalable')) requirements.push('scalability');
    if (lowerTask.includes('responsive')) requirements.push('responsive_design');
    if (lowerTask.includes('accessible')) requirements.push('accessibility');
    if (lowerTask.includes('reliable')) requirements.push('reliability');
    
    return requirements;
  }

  private extractTechnicalRequirements(task: string): string[] {
    const requirements: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('database')) requirements.push('database_integration');
    if (lowerTask.includes('api')) requirements.push('api_integration');
    if (lowerTask.includes('mobile')) requirements.push('mobile_compatibility');
    if (lowerTask.includes('real')) requirements.push('real_time_processing');
    if (lowerTask.includes('cache')) requirements.push('caching_mechanism');
    
    return requirements;
  }

  private extractBusinessRequirements(task: string): string[] {
    const requirements: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('compliance')) requirements.push('regulatory_compliance');
    if (lowerTask.includes('audit')) requirements.push('audit_trail');
    if (lowerTask.includes('cost')) requirements.push('cost_optimization');
    if (lowerTask.includes('efficiency')) requirements.push('process_efficiency');
    
    return requirements;
  }

  private identifyConstraints(task: string): string[] {
    const constraints: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('budget')) constraints.push('budget_constraint');
    if (lowerTask.includes('time')) constraints.push('time_constraint');
    if (lowerTask.includes('legacy')) constraints.push('legacy_system_constraint');
    if (lowerTask.includes('regulation')) constraints.push('regulatory_constraint');
    if (lowerTask.includes('resource')) constraints.push('resource_constraint');
    
    return constraints;
  }

  private identifyDeliverables(task: string): string[] {
    const deliverables: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('widget')) deliverables.push('service_portal_widget');
    if (lowerTask.includes('flow')) deliverables.push('flow_designer_flow');
    if (lowerTask.includes('application')) deliverables.push('scoped_application');
    if (lowerTask.includes('report')) deliverables.push('report_dashboard');
    if (lowerTask.includes('integration')) deliverables.push('integration_solution');
    if (lowerTask.includes('table')) deliverables.push('database_tables');
    if (lowerTask.includes('form')) deliverables.push('user_interfaces');
    
    return deliverables;
  }

  private identifyRiskFactors(task: string): string[] {
    const risks: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('complex')) risks.push('complexity_risk');
    if (lowerTask.includes('integration')) risks.push('integration_risk');
    if (lowerTask.includes('performance')) risks.push('performance_risk');
    if (lowerTask.includes('security')) risks.push('security_risk');
    if (lowerTask.includes('new') || lowerTask.includes('novel')) risks.push('technology_risk');
    
    return risks;
  }

  private analyzeSpecialistNeeds(task: string): any {
    const needs = {
      required: [] as string[],
      optional: [] as string[],
      priorities: new Map<string, number>()
    };
    
    const lowerTask = task.toLowerCase();
    
    // Always need platform specialist
    needs.required.push('platform');
    needs.priorities.set('platform', 100);
    
    // Domain-specific needs
    if (lowerTask.includes('widget') || lowerTask.includes('ui')) {
      needs.required.push('frontend', 'backend');
      needs.optional.push('design', 'quality');
      needs.priorities.set('frontend', 95);
      needs.priorities.set('backend', 90);
    }
    
    if (lowerTask.includes('flow') || lowerTask.includes('workflow')) {
      needs.required.push('process');
      needs.optional.push('events', 'data', 'integration');
      needs.priorities.set('process', 95);
    }
    
    if (lowerTask.includes('application') || lowerTask.includes('app')) {
      needs.required.push('database', 'business_logic');
      needs.optional.push('interface', 'performance');
      needs.priorities.set('database', 95);
      needs.priorities.set('business_logic', 90);
    }
    
    // Cross-cutting concerns
    if (lowerTask.includes('security') || lowerTask.includes('compliance')) {
      needs.required.push('security');
      needs.priorities.set('security', 95);
    }
    
    if (lowerTask.includes('performance') || lowerTask.includes('scale')) {
      needs.optional.push('performance');
      needs.priorities.set('performance', 85);
    }
    
    return needs;
  }

  private determineCoordinationPattern(analysis: any): string {
    const teamSize = this.selectedSpecialists.length;
    const complexity = analysis.complexity;
    const riskFactors = analysis.riskFactors.length;
    
    if (complexity === 'complex' || riskFactors > 2) {
      return 'sequential_with_reviews';
    } else if (teamSize > 4) {
      return 'hybrid_parallel_sequential';
    } else if (teamSize > 2) {
      return 'parallel_with_sync';
    }
    
    return 'sequential';
  }

  private estimateProjectTime(analysis: any): string {
    const baseTime = {
      'simple': 120,
      'moderate': 240,
      'complex': 420
    };
    
    const teamSize = this.selectedSpecialists.length;
    const parallelEfficiency = Math.min(1.8, 1 + (teamSize - 1) * 0.2); // Diminishing returns
    
    const adjustedTime = baseTime[analysis.complexity] / parallelEfficiency;
    const constraintPenalty = analysis.constraints.length * 30;
    const riskPenalty = analysis.riskFactors.length * 20;
    
    const totalMinutes = adjustedTime + constraintPenalty + riskPenalty;
    
    if (totalMinutes < 60) {
      return `${Math.round(totalMinutes)} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  private createSpecialistTasks(requirements: any): TaskBreakdown[] {
    const tasks: TaskBreakdown[] = [];
    
    this.selectedSpecialists.forEach((specialist, index) => {
      const taskId = `specialist_task_${index + 1}`;
      const member = this.members.find(m => m.role === specialist.role);
      
      if (member) {
        tasks.push({
          id: taskId,
          description: this.generateSpecialistTaskDescription(specialist, requirements),
          assignedTo: member,
          dependencies: this.determineSpecialistDependencies(specialist, tasks),
          priority: this.determineSpecialistPriority(specialist, requirements),
          estimatedTime: this.estimateSpecialistTime(specialist, requirements)
        });
      }
    });
    
    return tasks;
  }

  private generateSpecialistTaskDescription(specialist: SpecialistDefinition, requirements: any): string {
    const domain = requirements.domain.replace('_', ' ');
    const role = specialist.role.toLowerCase();
    
    return `Execute ${role} responsibilities for ${domain} - ${specialist.expertise.slice(0, 2).join(' and ')}`;
  }

  private determineSpecialistDependencies(specialist: SpecialistDefinition, existingTasks: TaskBreakdown[]): string[] {
    const dependencies: string[] = [];
    
    // Database and process design typically come first
    if (!['Database Designer', 'Process Designer', 'ServiceNow Specialist'].includes(specialist.role)) {
      const foundationTask = existingTasks.find(t => 
        ['Database Designer', 'Process Designer'].includes(t.assignedTo.role)
      );
      if (foundationTask) {
        dependencies.push(foundationTask.id);
      }
    }
    
    // Interface depends on business logic
    if (specialist.role === 'Interface Designer') {
      const logicTask = existingTasks.find(t => 
        t.assignedTo.role === 'Business Logic Developer'
      );
      if (logicTask) {
        dependencies.push(logicTask.id);
      }
    }
    
    // Performance optimization comes after core components
    if (specialist.role === 'Performance Specialist') {
      const coreTask = existingTasks.find(t => 
        ['Backend Developer', 'Business Logic Developer'].includes(t.assignedTo.role)
      );
      if (coreTask) {
        dependencies.push(coreTask.id);
      }
    }
    
    return dependencies;
  }

  private determineSpecialistPriority(specialist: SpecialistDefinition, requirements: any): 'high' | 'medium' | 'low' {
    if (['Database Designer', 'Process Designer', 'ServiceNow Specialist'].includes(specialist.role)) {
      return 'high';
    }
    
    if (['Frontend Developer', 'Backend Developer', 'Business Logic Developer'].includes(specialist.role)) {
      return 'high';
    }
    
    if (['Security Specialist', 'Integration Specialist'].includes(specialist.role)) {
      return 'medium';
    }
    
    return 'medium';
  }

  private estimateSpecialistTime(specialist: SpecialistDefinition, requirements: any): string {
    const baseTime = {
      'Database Designer': 60,
      'Process Designer': 50,
      'Frontend Developer': 45,
      'Backend Developer': 40,
      'Business Logic Developer': 55,
      'Interface Designer': 45,
      'Security Specialist': 35,
      'Performance Specialist': 40,
      'Integration Specialist': 45,
      'ServiceNow Specialist': 30,
      'UI/UX Designer': 35,
      'QA Specialist': 30
    };
    
    const base = baseTime[specialist.role] || 30;
    const complexityMultiplier = requirements.complexity === 'complex' ? 1.5 : 
                               requirements.complexity === 'moderate' ? 1.2 : 1.0;
    
    const adjustedTime = base * complexityMultiplier;
    return `${Math.round(adjustedTime)} min`;
  }

  private buildDependencyMap(tasks: TaskBreakdown[]): Map<string, string[]> {
    const dependencyMap = new Map<string, string[]>();
    
    tasks.forEach(task => {
      dependencyMap.set(task.id, task.dependencies);
    });
    
    return dependencyMap;
  }

  private prioritizeTasks(tasks: TaskBreakdown[], dependencyMap: Map<string, string[]>): TaskBreakdown[] {
    // Topological sort based on dependencies and priorities
    const sorted: TaskBreakdown[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`);
      }
      if (visited.has(taskId)) return;
      
      visiting.add(taskId);
      
      const dependencies = dependencyMap.get(taskId) || [];
      dependencies.forEach(depId => visit(depId));
      
      visiting.delete(taskId);
      visited.add(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) sorted.push(task);
    };
    
    tasks.forEach(task => visit(task.id));
    
    return sorted;
  }

  private selectIntegrationLead(): TeamMember {
    // Select the most senior specialist as integration lead
    const priorities = ['ServiceNow Specialist', 'Database Designer', 'Process Designer'];
    
    for (const role of priorities) {
      const member = this.members.find(m => m.role === role);
      if (member) return member;
    }
    
    return this.members[0]; // Fallback to first member
  }

  private estimateIntegrationTime(requirements: any): string {
    const teamSize = this.selectedSpecialists.length;
    const baseTime = 20 + (teamSize * 5); // 5 minutes per additional specialist
    const complexityBonus = requirements.complexity === 'complex' ? 15 : 
                           requirements.complexity === 'moderate' ? 10 : 0;
    
    return `${baseTime + complexityBonus} min`;
  }

  private getTeamComposition(): any[] {
    return this.selectedSpecialists.map(specialist => ({
      role: specialist.role,
      category: specialist.category,
      expertise: specialist.expertise
    }));
  }

  private async createAdaptiveDeliverable(specialists: any): Promise<any> {
    const deliverable: any = {
      type: `Adaptive ${this.taskAnalysis.domain.replace('_', ' ')}`,
      timestamp: new Date(),
      domain: this.taskAnalysis.domain,
      assembledTeam: this.getTeamComposition(),
      components: {}
    };

    // Dynamically organize deliverables based on available specialists
    Object.keys(specialists).forEach(specialistType => {
      const specialist = specialists[specialistType];
      if (specialist.deliverables) {
        deliverable.components[specialistType] = specialist.deliverables;
      }
    });

    // Create domain-specific integration
    deliverable.integratedSolution = await this.createDomainSpecificIntegration(deliverable.components);

    return deliverable;
  }

  private async createDomainSpecificIntegration(components: any): Promise<any> {
    const integration: any = {
      timestamp: new Date(),
      components: Object.keys(components),
      integration_type: this.taskAnalysis.domain
    };

    // Domain-specific integration logic
    switch (this.taskAnalysis.domain) {
      case 'widget_development':
        integration.widget_package = this.integrateWidgetComponents(components);
        break;
      case 'flow_development':
        integration.flow_package = this.integrateFlowComponents(components);
        break;
      case 'application_development':
        integration.application_package = this.integrateApplicationComponents(components);
        break;
      default:
        integration.generic_package = this.integrateGenericComponents(components);
    }

    return integration;
  }

  private integrateWidgetComponents(components: any): any {
    return {
      frontend: components['Frontend Developer'] || {},
      backend: components['Backend Developer'] || {},
      design: components['UI/UX Designer'] || {},
      platform: components['ServiceNow Specialist'] || {},
      quality: components['QA Specialist'] || {}
    };
  }

  private integrateFlowComponents(components: any): any {
    return {
      process: components['Process Designer'] || {},
      triggers: components['Trigger Specialist'] || {},
      data: components['Data Specialist'] || {},
      integration: components['Integration Specialist'] || {},
      security: components['Security Specialist'] || {},
      platform: components['ServiceNow Specialist'] || {}
    };
  }

  private integrateApplicationComponents(components: any): any {
    return {
      database: components['Database Designer'] || {},
      businessLogic: components['Business Logic Developer'] || {},
      interface: components['Interface Designer'] || {},
      security: components['Security Specialist'] || {},
      performance: components['Performance Specialist'] || {},
      platform: components['ServiceNow Specialist'] || {}
    };
  }

  private integrateGenericComponents(components: any): any {
    return components;
  }

  private async calculateAdaptiveQualityMetrics(results: any[]): Promise<any> {
    const successfulTasks = results.filter(r => r.status === 'success').length;
    const totalTasks = results.length;
    const completionRate = (successfulTasks / totalTasks) * 100;
    
    // Calculate adaptive quality factors
    const qualityFactors = {
      completeness: completionRate,
      teamComposition: this.calculateTeamCompositionScore(),
      adaptiveEfficiency: this.calculateAdaptiveEfficiency(),
      specialistPerformance: this.calculateSpecialistPerformance(results),
      integrationQuality: this.calculateIntegrationQuality(results),
      domainOptimization: this.calculateDomainOptimization()
    };
    
    const overallScore = Object.values(qualityFactors).reduce((sum, score) => sum + score, 0) / Object.keys(qualityFactors).length;
    
    return {
      overallScore: Math.round(overallScore),
      factors: qualityFactors,
      completionRate,
      recommendations: this.generateAdaptiveRecommendations(qualityFactors)
    };
  }

  private calculateTeamCompositionScore(): number {
    const optimalSize = this.determineOptimalTeamSize();
    const actualSize = this.selectedSpecialists.length;
    const sizePenalty = Math.abs(actualSize - optimalSize) * 5;
    
    const diversityScore = this.calculateTeamDiversity();
    const relevanceScore = this.calculateTeamRelevance();
    
    return Math.max(50, 100 - sizePenalty + diversityScore + relevanceScore);
  }

  private determineOptimalTeamSize(): number {
    switch (this.taskAnalysis.complexity) {
      case 'simple': return 3;
      case 'moderate': return 4;
      case 'complex': return 5;
      default: return 4;
    }
  }

  private calculateTeamDiversity(): number {
    const categories = new Set(this.selectedSpecialists.map(s => s.category));
    return Math.min(20, categories.size * 4);
  }

  private calculateTeamRelevance(): number {
    const relevantSpecialists = this.selectedSpecialists.filter(s => 
      s.applicability.some(term => this.taskAnalysis.task.toLowerCase().includes(term))
    );
    return (relevantSpecialists.length / this.selectedSpecialists.length) * 20;
  }

  private calculateAdaptiveEfficiency(): number {
    const timeEstimate = this.taskAnalysis.estimatedTime;
    const baselineTime = this.calculateBaselineTime();
    
    const efficiency = (baselineTime / this.parseTimeToMinutes(timeEstimate)) * 100;
    return Math.min(100, efficiency);
  }

  private calculateBaselineTime(): number {
    // Baseline time for single specialist
    return this.taskAnalysis.complexity === 'complex' ? 480 : 
           this.taskAnalysis.complexity === 'moderate' ? 300 : 180;
  }

  private parseTimeToMinutes(timeString: string): number {
    const hours = timeString.includes('h') ? parseInt(timeString.split('h')[0]) * 60 : 0;
    const minutes = timeString.includes('m') ? parseInt(timeString.match(/(\d+)m/)?.[1] || '0') : 0;
    return hours + minutes;
  }

  private calculateSpecialistPerformance(results: any[]): number {
    const performances = results.map(result => result.status === 'success' ? 100 : 0);
    return performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
  }

  private calculateIntegrationQuality(results: any[]): number {
    // Simplified integration quality metric
    const hasIntegrationConflicts = results.some(r => r.error?.includes('integration'));
    return hasIntegrationConflicts ? 70 : 90;
  }

  private calculateDomainOptimization(): number {
    const domainRelevantSpecialists = this.selectedSpecialists.filter(s => 
      this.isDomainRelevant(s, this.taskAnalysis.domain)
    );
    return (domainRelevantSpecialists.length / this.selectedSpecialists.length) * 100;
  }

  private isDomainRelevant(specialist: SpecialistDefinition, domain: string): boolean {
    const domainMapping = {
      'widget_development': ['frontend', 'backend', 'design', 'platform'],
      'flow_development': ['process', 'events', 'data', 'integration', 'platform'],
      'application_development': ['database', 'business_logic', 'interface', 'platform']
    };
    
    const relevantCategories = domainMapping[domain] || [];
    return relevantCategories.includes(specialist.category);
  }

  private generateAdaptiveRecommendations(factors: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.teamComposition < 80) {
      recommendations.push('Optimize team composition for better task coverage');
    }
    
    if (factors.adaptiveEfficiency < 75) {
      recommendations.push('Consider alternative specialist combinations for better efficiency');
    }
    
    if (factors.specialistPerformance < 85) {
      recommendations.push('Review specialist task assignments and dependencies');
    }
    
    if (factors.domainOptimization < 70) {
      recommendations.push('Include more domain-specific specialists');
    }
    
    return recommendations;
  }

  private async prepareAdaptiveDeploymentPackage(deliverable: any): Promise<any> {
    return {
      packageType: `Adaptive ${this.taskAnalysis.domain}`,
      teamComposition: this.getTeamComposition(),
      deliverables: this.summarizeDeliverables(deliverable),
      deploymentStrategy: this.createAdaptiveDeploymentStrategy(),
      qualityAssurance: this.createAdaptiveQAChecklist(),
      adaptiveInsights: await this.generateAdaptiveInsights(deliverable)
    };
  }

  private summarizeDeliverables(deliverable: any): any {
    return {
      totalComponents: Object.keys(deliverable.components || {}).length,
      specialistContributions: Object.keys(deliverable.components || {}),
      integrationType: deliverable.integratedSolution?.integration_type || 'generic',
      complexity: this.taskAnalysis.complexity
    };
  }

  private createAdaptiveDeploymentStrategy(): any {
    return {
      approach: 'adaptive_deployment',
      phases: this.createAdaptivePhases(),
      rollback: 'automatic_rollback_enabled',
      monitoring: 'real_time_monitoring',
      validation: 'multi_specialist_validation'
    };
  }

  private createAdaptivePhases(): any[] {
    const phases = [
      {
        name: 'Foundation Phase',
        specialists: ['ServiceNow Specialist', 'Database Designer', 'Process Designer'],
        description: 'Establish core platform and foundation components'
      },
      {
        name: 'Implementation Phase', 
        specialists: ['Frontend Developer', 'Backend Developer', 'Business Logic Developer'],
        description: 'Implement core functionality and business logic'
      },
      {
        name: 'Integration Phase',
        specialists: ['Integration Specialist', 'Interface Designer'],
        description: 'Integrate components and design user interfaces'
      },
      {
        name: 'Optimization Phase',
        specialists: ['Performance Specialist', 'Security Specialist', 'QA Specialist'],
        description: 'Optimize performance, ensure security, and validate quality'
      }
    ];
    
    // Filter phases based on selected specialists
    return phases.filter(phase => 
      phase.specialists.some(role => 
        this.selectedSpecialists.find(s => s.role === role)
      )
    );
  }

  private createAdaptiveQAChecklist(): string[] {
    const checklist = [
      'Team composition optimized for task requirements',
      'All specialist deliverables completed successfully',
      'Integration between components validated',
      'Domain-specific requirements addressed'
    ];
    
    // Add specialist-specific checks
    this.selectedSpecialists.forEach(specialist => {
      checklist.push(`${specialist.role} deliverables meet quality standards`);
    });
    
    return checklist;
  }

  private async generateAdaptiveInsights(integration: any): Promise<any> {
    return {
      efficiency: this.calculateAdaptiveEfficiency(),
      teamOptimization: this.analyzeTeamOptimization(),
      learningInsights: this.generateLearningInsights(),
      recommendations: this.generateFutureRecommendations()
    };
  }

  private analyzeTeamOptimization(): any {
    return {
      optimalSize: this.determineOptimalTeamSize(),
      actualSize: this.selectedSpecialists.length,
      diversityScore: this.calculateTeamDiversity(),
      relevanceScore: this.calculateTeamRelevance(),
      improvement: this.suggestTeamImprovements()
    };
  }

  private suggestTeamImprovements(): string[] {
    const improvements: string[] = [];
    
    const optimalSize = this.determineOptimalTeamSize();
    const actualSize = this.selectedSpecialists.length;
    
    if (actualSize > optimalSize) {
      improvements.push('Consider reducing team size for better coordination');
    } else if (actualSize < optimalSize) {
      improvements.push('Consider adding specialists for better coverage');
    }
    
    const categories = new Set(this.selectedSpecialists.map(s => s.category));
    if (categories.size < 3) {
      improvements.push('Increase specialist diversity for better perspective');
    }
    
    return improvements;
  }

  private generateLearningInsights(): any {
    return {
      taskPatterns: this.identifyTaskPatterns(),
      specialistEffectiveness: this.assessSpecialistEffectiveness(),
      coordinationPatterns: this.analyzeCoordinationPatterns()
    };
  }

  private identifyTaskPatterns(): any {
    return {
      domain: this.taskAnalysis.domain,
      complexity: this.taskAnalysis.complexity,
      technologies: this.taskAnalysis.technologies,
      commonPatterns: this.identifyCommonPatterns()
    };
  }

  private identifyCommonPatterns(): string[] {
    const patterns: string[] = [];
    
    if (this.taskAnalysis.task.toLowerCase().includes('create') && 
        this.taskAnalysis.task.toLowerCase().includes('with')) {
      patterns.push('creation_with_requirements');
    }
    
    if (this.taskAnalysis.technologies.length > 2) {
      patterns.push('multi_technology_integration');
    }
    
    return patterns;
  }

  private assessSpecialistEffectiveness(): any {
    return {
      highPerformers: this.selectedSpecialists.filter(s => s.priority > 85).map(s => s.role),
      criticalRoles: this.selectedSpecialists.filter(s => s.category === 'platform').map(s => s.role),
      synergies: this.identifySpecialistSynergies()
    };
  }

  private identifySpecialistSynergies(): string[] {
    const synergies: string[] = [];
    
    const hasRoles = (roles: string[]) => 
      roles.every(role => this.selectedSpecialists.find(s => s.role === role));
    
    if (hasRoles(['Frontend Developer', 'Backend Developer'])) {
      synergies.push('full_stack_coverage');
    }
    
    if (hasRoles(['Database Designer', 'Performance Specialist'])) {
      synergies.push('data_optimization_synergy');
    }
    
    if (hasRoles(['Security Specialist', 'Integration Specialist'])) {
      synergies.push('secure_integration_synergy');
    }
    
    return synergies;
  }

  private analyzeCoordinationPatterns(): any {
    return {
      pattern: this.taskAnalysis.coordination,
      effectiveness: this.assessCoordinationEffectiveness(),
      bottlenecks: this.identifyCoordinationBottlenecks()
    };
  }

  private assessCoordinationEffectiveness(): number {
    // Simplified coordination effectiveness assessment
    const teamSize = this.selectedSpecialists.length;
    const complexity = this.taskAnalysis.complexity;
    
    if (complexity === 'complex' && teamSize > 5) {
      return 75; // Complex coordination
    } else if (complexity === 'moderate' && teamSize <= 4) {
      return 90; // Good balance
    } else if (complexity === 'simple' && teamSize <= 3) {
      return 95; // Optimal
    }
    
    return 80; // Default
  }

  private identifyCoordinationBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    if (this.selectedSpecialists.length > 5) {
      bottlenecks.push('team_size_coordination_overhead');
    }
    
    const platformSpecialists = this.selectedSpecialists.filter(s => s.category === 'platform');
    if (platformSpecialists.length > 1) {
      bottlenecks.push('multiple_platform_specialists');
    }
    
    return bottlenecks;
  }

  private generateFutureRecommendations(): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Maintain current team composition pattern for similar tasks');
    
    if (this.calculateAdaptiveEfficiency() > 85) {
      recommendations.push('Consider this team configuration as template for similar projects');
    }
    
    if (this.selectedSpecialists.length > 4) {
      recommendations.push('Explore sub-team coordination patterns for large teams');
    }
    
    return recommendations;
  }

  private initializeAdaptiveQualityGates(): void {
    // Add adaptive quality gates that adjust based on team composition
    this.qualityGates.push(
      {
        name: 'Team composition validation',
        check: async (results) => {
          const relevantSpecialists = this.selectedSpecialists.filter(s => 
            s.applicability.some(term => this.taskAnalysis.task.toLowerCase().includes(term))
          );
          return relevantSpecialists.length >= Math.ceil(this.selectedSpecialists.length * 0.6);
        },
        onFailure: async (results) => {
          console.log('❌ Team composition validation failed - insufficient relevant specialists');
        }
      },
      {
        name: 'Adaptive integration validation',
        check: async (results) => {
          const successfulResults = results.filter(r => r.status === 'success');
          return successfulResults.length >= Math.ceil(results.length * 0.8);
        },
        onFailure: async (results) => {
          console.log('❌ Adaptive integration validation failed - too many specialist failures');
        }
      },
      {
        name: 'Domain optimization validation',
        check: async (results) => {
          const domainRelevantCount = this.selectedSpecialists.filter(s => 
            this.isDomainRelevant(s, this.taskAnalysis.domain)
          ).length;
          return domainRelevantCount >= Math.ceil(this.selectedSpecialists.length * 0.5);
        }
      }
    );
  }
}
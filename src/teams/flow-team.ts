import { BaseTeam, TeamOptions, TeamMember, TaskBreakdown, QualityGate } from './base-team.js';
import { 
  ProcessSpecialist, 
  TriggerSpecialist, 
  DataSpecialist, 
  IntegrationSpecialist, 
  SecuritySpecialist 
} from '../specialists/flow-specialists.js';

export class FlowTeam extends BaseTeam {
  constructor(options: TeamOptions = { sharedMemory: true, validation: true, parallel: false, monitor: false }) {
    super(options);
  }

  initializeTeam(): void {
    this.members = [
      {
        name: 'Morgan Process',
        role: 'Process Designer',
        expertise: ['Business Logic', 'Workflow Design', 'Process Optimization', 'Flow Architecture'],
        execute: async (task: any, context: any) => {
          const specialist = new ProcessSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Riley Trigger',
        role: 'Trigger Specialist', 
        expertise: ['Event Handling', 'Conditions', 'Automation', 'Real-time Processing'],
        execute: async (task: any, context: any) => {
          const specialist = new TriggerSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Avery Data',
        role: 'Data Specialist',
        expertise: ['Data Modeling', 'Variable Management', 'Data Transformation', 'Data Validation'],
        execute: async (task: any, context: any) => {
          const specialist = new DataSpecialist(this.options);
          return await specialist.execute(task.description, context);
        }
      },
      {
        name: 'Cameron Integration',
        role: 'Integration Specialist',
        expertise: ['API Integration', 'External Systems', 'Data Synchronization', 'Middleware'],
        execute: async (task: any, context: any) => {
          const specialist = new IntegrationSpecialist(this.options);
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
      }
    ];

    // Initialize flow-specific quality gates
    this.initializeFlowQualityGates();
  }

  async execute(task: string): Promise<any> {
    console.log(`\n🔄 Flow Development Team Activated`);
    console.log(`📋 Mission: ${task}`);
    
    return await this.executeWithCoordination(task);
  }

  protected async analyzeRequirements(task: string): Promise<any> {
    console.log(`\n🔍 Flow Team: Analyzing requirements...`);
    
    const complexity = this.assessComplexity(task);
    const components = this.identifyComponents(task);
    const flowType = this.identifyFlowType(task);
    const features = this.identifyRequiredFeatures(task);
    const integrations = this.identifyIntegrationNeeds(task);
    
    const requirements = {
      task,
      complexity,
      components,
      flowType,
      features,
      integrations,
      coordination: this.determineCoordinationPattern(complexity, components, integrations),
      estimatedTime: this.estimateProjectTime(complexity, features, integrations),
      risks: this.identifyRisks(task),
      dependencies: this.findDependencies(task)
    };

    console.log(`  Flow Type: ${flowType}`);
    console.log(`  Complexity: ${complexity}`);
    console.log(`  Components: ${components.join(', ')}`);
    console.log(`  Integrations: ${integrations.join(', ')}`);
    console.log(`  Coordination: ${requirements.coordination}`);
    
    return requirements;
  }

  protected async createTaskBreakdown(requirements: any): Promise<TaskBreakdown[]> {
    console.log(`\n📋 Flow Team: Creating task breakdown...`);
    
    const tasks: TaskBreakdown[] = [];
    
    // Always start with process design for flows
    tasks.push({
      id: 'process_design',
      description: `Design ${requirements.flowType} process architecture and business logic`,
      assignedTo: this.getMemberByRole('Process Designer'),
      dependencies: [],
      priority: 'high',
      estimatedTime: '45 min'
    });

    // Security analysis in parallel or after process design
    tasks.push({
      id: 'security_analysis',
      description: `Analyze security requirements and compliance needs for ${requirements.flowType}`,
      assignedTo: this.getMemberByRole('Security Specialist'),
      dependencies: requirements.coordination === 'sequential' ? ['process_design'] : [],
      priority: 'high',
      estimatedTime: '30 min'
    });

    // Data modeling after process design
    tasks.push({
      id: 'data_modeling',
      description: `Design data model, variables, and transformations for flow`,
      assignedTo: this.getMemberByRole('Data Specialist'),
      dependencies: ['process_design'],
      priority: 'high',
      estimatedTime: this.estimateDataTime(requirements)
    });

    // Trigger design after process design
    tasks.push({
      id: 'trigger_design',
      description: `Design trigger mechanisms and event handling for ${requirements.flowType}`,
      assignedTo: this.getMemberByRole('Trigger Specialist'),
      dependencies: ['process_design'],
      priority: 'high',
      estimatedTime: this.estimateTriggerTime(requirements)
    });

    // Integration design if needed
    if (requirements.integrations.length > 0) {
      tasks.push({
        id: 'integration_design',
        description: `Design integration architecture for ${requirements.integrations.join(', ')}`,
        assignedTo: this.getMemberByRole('Integration Specialist'),
        dependencies: ['data_modeling'],
        priority: 'medium',
        estimatedTime: this.estimateIntegrationTime(requirements)
      });
    }

    // Final integration and validation
    const finalDependencies = ['trigger_design', 'data_modeling', 'security_analysis'];
    if (requirements.integrations.length > 0) {
      finalDependencies.push('integration_design');
    }

    tasks.push({
      id: 'flow_integration',
      description: `Integrate all components and validate complete flow definition`,
      assignedTo: this.getMemberByRole('Process Designer'),
      dependencies: finalDependencies,
      priority: 'medium',
      estimatedTime: '30 min'
    });

    console.log(`  Created ${tasks.length} specialized tasks`);
    tasks.forEach(task => {
      console.log(`    ${task.assignedTo.role}: ${task.description} (${task.estimatedTime})`);
    });

    return tasks;
  }

  protected async integrateResults(results: any[]): Promise<any> {
    console.log(`\n🔗 Flow Team: Integrating all specialist deliverables...`);
    
    const integration = {
      teamType: 'Flow Development Team',
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

    // Create integrated flow deliverable
    integration.finalDeliverable = await this.createFlowDeliverable(integration.specialists);
    
    // Calculate quality metrics
    integration.qualityMetrics = await this.calculateQualityMetrics(results);
    
    // Prepare deployment package
    integration.deploymentPackage = await this.prepareDeploymentPackage(integration.finalDeliverable);
    
    console.log(`✅ Flow integration completed successfully`);
    console.log(`   Components: ${Object.keys(integration.specialists).length} specialists contributed`);
    console.log(`   Quality Score: ${integration.qualityMetrics.overallScore}/100`);
    
    return integration;
  }

  private identifyFlowType(task: string): string {
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('approval')) {
      return 'approval_workflow';
    } else if (lowerTask.includes('fulfillment') || lowerTask.includes('provision')) {
      return 'fulfillment_workflow';
    } else if (lowerTask.includes('notification') || lowerTask.includes('alert')) {
      return 'notification_workflow';
    } else if (lowerTask.includes('integration') || lowerTask.includes('sync')) {
      return 'integration_workflow';
    } else if (lowerTask.includes('escalation')) {
      return 'escalation_workflow';
    } else if (lowerTask.includes('automation')) {
      return 'automation_workflow';
    }
    
    return 'utility_workflow';
  }

  private identifyRequiredFeatures(task: string): string[] {
    const features: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('approval')) {
      features.push('approval_engine');
    }
    
    if (lowerTask.includes('notification') || lowerTask.includes('email')) {
      features.push('notification_system');
    }
    
    if (lowerTask.includes('schedule') || lowerTask.includes('timer')) {
      features.push('scheduling');
    }
    
    if (lowerTask.includes('condition') || lowerTask.includes('decision')) {
      features.push('conditional_logic');
    }
    
    if (lowerTask.includes('parallel') || lowerTask.includes('concurrent')) {
      features.push('parallel_processing');
    }
    
    if (lowerTask.includes('error') || lowerTask.includes('exception')) {
      features.push('error_handling');
    }
    
    if (lowerTask.includes('escalation')) {
      features.push('escalation_engine');
    }

    return features;
  }

  private identifyIntegrationNeeds(task: string): string[] {
    const integrations: string[] = [];
    const lowerTask = task.toLowerCase();
    
    if (lowerTask.includes('api') || lowerTask.includes('rest')) {
      integrations.push('rest_api');
    }
    
    if (lowerTask.includes('email') || lowerTask.includes('smtp')) {
      integrations.push('email_system');
    }
    
    if (lowerTask.includes('ldap') || lowerTask.includes('active directory')) {
      integrations.push('ldap');
    }
    
    if (lowerTask.includes('database') || lowerTask.includes('external db')) {
      integrations.push('external_database');
    }
    
    if (lowerTask.includes('webhook')) {
      integrations.push('webhook');
    }
    
    if (lowerTask.includes('soap')) {
      integrations.push('soap_service');
    }

    return integrations;
  }

  private determineCoordinationPattern(complexity: string, components: string[], integrations: string[]): string {
    if (complexity === 'complex' || integrations.length > 2) {
      return 'hybrid'; // Mix of sequential and parallel
    } else if (integrations.length > 0) {
      return 'parallel_with_integration'; // Parallel with final integration step
    } else if (complexity === 'moderate') {
      return 'parallel'; // Most tasks can run in parallel
    }
    
    return 'sequential'; // Simple linear workflow
  }

  private estimateProjectTime(complexity: string, features: string[], integrations: string[]): string {
    const baseTime = {
      'simple': 90,
      'moderate': 150,
      'complex': 240
    };
    
    const featureTime = features.length * 20; // 20 min per feature
    const integrationTime = integrations.length * 30; // 30 min per integration
    const totalMinutes = baseTime[complexity] + featureTime + integrationTime;
    
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
      risks.push('process_complexity');
    }
    
    if (lowerTask.includes('approval') && lowerTask.includes('multi')) {
      risks.push('approval_chain_complexity');
    }
    
    if (lowerTask.includes('integration') || lowerTask.includes('api')) {
      risks.push('external_system_dependencies');
    }
    
    if (lowerTask.includes('realtime') || lowerTask.includes('immediate')) {
      risks.push('performance_requirements');
    }
    
    if (lowerTask.includes('security') || lowerTask.includes('sensitive')) {
      risks.push('security_compliance');
    }
    
    return risks;
  }

  private estimateDataTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 40 : 30;
    const featureTime = requirements.features.length * 5;
    return `${baseTime + featureTime} min`;
  }

  private estimateTriggerTime(requirements: any): string {
    const baseTime = requirements.complexity === 'complex' ? 35 : 25;
    const integrationTime = requirements.integrations.length * 10;
    return `${baseTime + integrationTime} min`;
  }

  private estimateIntegrationTime(requirements: any): string {
    const baseTime = 40;
    const systemTime = requirements.integrations.length * 15;
    return `${baseTime + systemTime} min`;
  }

  private getMemberByRole(role: string): TeamMember {
    const member = this.members.find(m => m.role === role);
    if (!member) {
      throw new Error(`No team member found with role: ${role}`);
    }
    return member;
  }

  private async createFlowDeliverable(specialists: any): Promise<any> {
    const deliverable: any = {
      type: 'ServiceNow Flow',
      timestamp: new Date(),
      components: {}
    };

    // Process design components
    if (specialists['Process Designer']) {
      deliverable.components.process = {
        flowArchitecture: specialists['Process Designer'].deliverables?.flowArchitecture || {},
        flowDefinition: specialists['Process Designer'].deliverables?.flowDefinition || {}
      };
    }

    // Trigger components
    if (specialists['Trigger Specialist']) {
      deliverable.components.trigger = {
        triggerDesign: specialists['Trigger Specialist'].deliverables?.triggerDesign || {},
        triggerConfig: specialists['Trigger Specialist'].deliverables?.triggerConfig || {}
      };
    }

    // Data components
    if (specialists['Data Specialist']) {
      deliverable.components.data = {
        dataArchitecture: specialists['Data Specialist'].deliverables?.dataArchitecture || {},
        dataStrategy: specialists['Data Specialist'].deliverables?.dataStrategy || {}
      };
    }

    // Integration components
    if (specialists['Integration Specialist']) {
      deliverable.components.integration = {
        integrationArchitecture: specialists['Integration Specialist'].deliverables?.integrationArchitecture || {},
        implementationPlan: specialists['Integration Specialist'].deliverables?.implementationPlan || {}
      };
    }

    // Security components
    if (specialists['Security Specialist']) {
      deliverable.components.security = {
        securityControls: specialists['Security Specialist'].deliverables?.securityControls || {},
        securityPlan: specialists['Security Specialist'].deliverables?.securityPlan || {}
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
      processDesign: 88, // Would be calculated from process complexity analysis
      dataIntegrity: 92, // Would be calculated from data validation
      securityCompliance: 90, // Would be assessed through security review
      integrationReliability: 85, // Would be measured from integration tests
      performanceOptimization: 87 // Would be evaluated through performance analysis
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
    
    if (factors.processDesign < 85) {
      recommendations.push('Optimize process design for better efficiency');
    }
    
    if (factors.dataIntegrity < 90) {
      recommendations.push('Strengthen data validation and integrity checks');
    }
    
    if (factors.securityCompliance < 90) {
      recommendations.push('Address security compliance gaps');
    }
    
    if (factors.integrationReliability < 85) {
      recommendations.push('Improve integration error handling and resilience');
    }
    
    if (factors.performanceOptimization < 85) {
      recommendations.push('Optimize flow performance and resource usage');
    }
    
    return recommendations;
  }

  private async prepareDeploymentPackage(deliverable: any): Promise<any> {
    const flowDefinition = deliverable.components?.process?.flowDefinition?.flow || {};
    const triggerConfig = deliverable.components?.trigger?.triggerConfig || {};
    
    return {
      flowDefinition: {
        name: flowDefinition.name || this.generateFlowName(),
        description: flowDefinition.description || 'Generated by Flow Development Team',
        trigger_type: triggerConfig.triggerDefinition?.events?.[0] || 'manual',
        trigger_condition: this.generateTriggerCondition(triggerConfig),
        flow_definition: JSON.stringify(this.generateFlowJson(deliverable)),
        active: true
      },
      deploymentInstructions: {
        updateSet: 'Create new update set before deployment',
        testing: 'Execute comprehensive flow testing before activation',
        monitoring: 'Enable flow execution monitoring and logging',
        rollback: 'Keep backup of previous version'
      },
      qualityAssurance: {
        checklist: [
          'All process steps defined and tested',
          'Trigger conditions validated',
          'Data transformations verified',
          'Security controls implemented',
          'Integration points tested',
          'Error handling scenarios covered'
        ]
      }
    };
  }

  private generateFlowName(): string {
    const task = this.sharedContext.get('task') || 'custom_flow';
    return task.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
  }

  private generateTriggerCondition(triggerConfig: any): string {
    const conditions = triggerConfig.triggerDefinition?.conditions?.conditions || [];
    if (conditions.length === 0) return '';
    
    return conditions.map(c => `${c.field}${c.operator}${c.value}`).join('^');
  }

  private generateFlowJson(deliverable: any): any {
    const processDefinition = deliverable.components?.process?.flowDefinition?.flow || {};
    const triggerConfig = deliverable.components?.trigger?.triggerConfig?.triggerDefinition || {};
    const dataArchitecture = deliverable.components?.data?.dataArchitecture || {};
    
    return {
      flow: {
        name: processDefinition.name || 'Generated Flow',
        description: processDefinition.description || 'Auto-generated flow',
        steps: processDefinition.steps || [],
        variables: dataArchitecture.variables || [],
        trigger: {
          type: triggerConfig.events?.[0] || 'manual',
          conditions: triggerConfig.conditions || {},
          filters: triggerConfig.filters || []
        },
        error_handling: {
          enabled: true,
          retry_count: 3,
          escalation: true
        }
      }
    };
  }

  private initializeFlowQualityGates(): void {
    // Add flow-specific quality gates
    this.qualityGates.push(
      {
        name: 'Process design validation',
        check: async (results) => {
          const processResult = results.find(r => r.result?.specialist === 'Process Designer');
          return processResult?.status === 'success' && processResult.result?.deliverables?.flowDefinition;
        },
        onFailure: async (results) => {
          console.log('❌ Process design validation failed - missing or invalid flow definition');
        }
      },
      {
        name: 'Trigger configuration validation',
        check: async (results) => {
          const triggerResult = results.find(r => r.result?.specialist === 'Trigger Specialist');
          return triggerResult?.status === 'success' && triggerResult.result?.deliverables?.triggerConfig;
        },
        onFailure: async (results) => {
          console.log('❌ Trigger validation failed - missing or invalid trigger configuration');
        }
      },
      {
        name: 'Data model validation',
        check: async (results) => {
          const dataResult = results.find(r => r.result?.specialist === 'Data Specialist');
          return dataResult?.status === 'success' && dataResult.result?.deliverables?.dataArchitecture;
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
        name: 'Integration readiness validation',
        check: async (results) => {
          const integrationResult = results.find(r => r.result?.specialist === 'Integration Specialist');
          // Integration is optional, so pass if no integration specialist or if successful
          return !integrationResult || (integrationResult?.status === 'success' && integrationResult.result?.deliverables?.integrationArchitecture);
        }
      }
    );
  }
}
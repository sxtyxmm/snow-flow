/**
 * Adaptive Coordinator Agent
 * Dynamically assembles and coordinates teams based on task requirements
 */

import { AgentDetector, TaskAnalysis } from '../../utils/agent-detector.js';
import { TeamExecutionResult, TeamSparcOptions } from '../team-sparc.js';
import { getSpecialistMode, getAllSpecialistModes } from '../modes/team-modes.js';

export interface AdaptiveTask {
  description: string;
  analysis: TaskAnalysis;
  options: TeamSparcOptions;
}

export interface DynamicAgent {
  type: string;
  name: string;
  confidence: number;
  capabilities: string[];
  workload: number;
  status: 'available' | 'busy' | 'offline';
  estimatedEffort: string;
}

export interface AdaptiveTeamComposition {
  teamSize: number;
  primaryAgent: DynamicAgent;
  supportingAgents: DynamicAgent[];
  totalConfidence: number;
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TaskDomainAnalysis {
  domains: string[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  crossDomainCount: number;
  unknownElements: string[];
  confidenceScore: number;
}

export class AdaptiveCoordinatorAgent {
  private availableAgents: DynamicAgent[] = [];
  private domainKnowledge = new Map<string, string[]>();
  private performanceHistory = new Map<string, number>();

  constructor() {
    this.initializeAgentPool();
    this.initializeDomainKnowledge();
  }

  async executeAdaptiveTask(task: AdaptiveTask): Promise<TeamExecutionResult> {
    console.log('🤖 Adaptive Coordinator: Analyzing task and assembling optimal team...');
    console.log(`📋 Task: ${task.description}\n`);

    const startTime = Date.now();

    try {
      // Perform domain analysis
      const domainAnalysis = this.analyzeDomains(task.description, task.analysis);
      console.log('🔍 Domain Analysis:');
      console.log(`   Domains: ${domainAnalysis.domains.join(', ')}`);
      console.log(`   Complexity: ${domainAnalysis.complexity}`);
      console.log(`   Cross-domain elements: ${domainAnalysis.crossDomainCount}`);
      console.log(`   Confidence: ${(domainAnalysis.confidenceScore * 100).toFixed(1)}%\n`);

      // Compose adaptive team
      const teamComposition = await this.composeAdaptiveTeam(task, domainAnalysis);
      console.log('👥 Team Composition:');
      console.log(`   Team Size: ${teamComposition.teamSize}`);
      console.log(`   Primary Agent: ${teamComposition.primaryAgent.name} (${(teamComposition.primaryAgent.confidence * 100).toFixed(1)}%)`);
      console.log(`   Supporting Agents: ${teamComposition.supportingAgents.map(a => a.name).join(', ')}`);
      console.log(`   Total Confidence: ${(teamComposition.totalConfidence * 100).toFixed(1)}%`);
      console.log(`   Risk Level: ${teamComposition.riskLevel}\n`);

      // Execute adaptive coordination
      const artifacts = await this.executeAdaptiveCoordination(task, teamComposition);

      // Learn from execution
      this.updatePerformanceHistory(teamComposition, artifacts.length > 0);

      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Adaptive team execution completed successfully in ${executionTime}ms\n`);

      return {
        success: true,
        teamType: 'adaptive',
        coordinator: 'AdaptiveCoordinatorAgent',
        specialists: [teamComposition.primaryAgent.name, ...teamComposition.supportingAgents.map(a => a.name)],
        artifacts,
        executionTime,
        warnings: this.generateAdaptiveWarnings(domainAnalysis, teamComposition)
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Adaptive coordination failed: ${error}`);
      
      return {
        success: false,
        teamType: 'adaptive',
        coordinator: 'AdaptiveCoordinatorAgent',
        specialists: [],
        artifacts: [],
        executionTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private initializeAgentPool(): void {
    const specialistModes = getAllSpecialistModes();
    
    this.availableAgents = Object.entries(specialistModes).map(([type, mode]) => ({
      type,
      name: mode.specialist,
      confidence: 0.8, // Base confidence
      capabilities: mode.capabilities,
      workload: 0,
      status: 'available' as const,
      estimatedEffort: mode.estimatedTime || '2-4 hours'
    }));

    // Add general-purpose agents
    this.availableAgents.push(
      {
        type: 'orchestrator',
        name: 'OrchestratorAgent',
        confidence: 0.9,
        capabilities: ['Task coordination', 'Project management', 'Communication'],
        workload: 0,
        status: 'available',
        estimatedEffort: 'Variable'
      },
      {
        type: 'researcher',
        name: 'ResearcherAgent',
        confidence: 0.7,
        capabilities: ['Information gathering', 'Analysis', 'Documentation'],
        workload: 0,
        status: 'available',
        estimatedEffort: '1-3 hours'
      },
      {
        type: 'tester',
        name: 'TesterAgent',
        confidence: 0.8,
        capabilities: ['Quality assurance', 'Testing', 'Validation'],
        workload: 0,
        status: 'available',
        estimatedEffort: '1-2 hours'
      }
    );
  }

  private initializeDomainKnowledge(): void {
    this.domainKnowledge.set('widget_development', ['frontend', 'backend', 'uiux', 'platform']);
    this.domainKnowledge.set('flow_development', ['process', 'trigger', 'data', 'security']);
    this.domainKnowledge.set('application_development', ['database', 'logic', 'interface', 'security']);
    this.domainKnowledge.set('integration', ['data', 'security', 'backend']);
    this.domainKnowledge.set('security_compliance', ['security', 'database', 'logic']);
    this.domainKnowledge.set('reporting_analytics', ['database', 'data', 'interface']);
    this.domainKnowledge.set('platform_configuration', ['platform', 'security', 'logic']);
  }

  private analyzeDomains(description: string, analysis: TaskAnalysis): TaskDomainAnalysis {
    const descriptionLower = description.toLowerCase();
    const detectedDomains: string[] = [];
    let crossDomainCount = 0;
    const unknownElements: string[] = [];

    // Analyze ServiceNow artifacts to determine domains
    if (analysis.serviceNowArtifacts.includes('widget')) {
      detectedDomains.push('widget_development');
    }
    if (analysis.serviceNowArtifacts.includes('flow') || analysis.serviceNowArtifacts.includes('workflow')) {
      detectedDomains.push('flow_development');
    }
    if (analysis.serviceNowArtifacts.includes('application')) {
      detectedDomains.push('application_development');
    }
    if (analysis.serviceNowArtifacts.includes('integration') || analysis.serviceNowArtifacts.includes('api')) {
      detectedDomains.push('integration');
    }
    if (analysis.serviceNowArtifacts.includes('report') || descriptionLower.includes('analytics')) {
      detectedDomains.push('reporting_analytics');
    }

    // Analyze description for additional domain indicators
    if (descriptionLower.includes('security') || descriptionLower.includes('compliance')) {
      detectedDomains.push('security_compliance');
    }
    if (descriptionLower.includes('platform') || descriptionLower.includes('configuration')) {
      detectedDomains.push('platform_configuration');
    }

    // Check for cross-domain complexity
    const uniqueDomains = Array.from(new Set(detectedDomains));
    crossDomainCount = uniqueDomains.length;

    // Assess unknown elements
    const knownKeywords = [
      'widget', 'flow', 'workflow', 'application', 'integration', 'api', 'security', 
      'database', 'report', 'analytics', 'platform', 'configuration'
    ];
    
    const words = descriptionLower.split(/\s+/);
    const unknownWords = words.filter(word => 
      word.length > 4 && 
      !knownKeywords.some(keyword => word.includes(keyword)) &&
      !['create', 'build', 'develop', 'implement', 'design'].includes(word)
    );

    if (unknownWords.length > 0) {
      unknownElements.push(...unknownWords.slice(0, 3)); // Limit to 3 unknown elements
    }

    // Calculate confidence score
    const baseConfidence = Math.max(0.3, 1 - (unknownElements.length * 0.2));
    const domainConfidence = Math.min(1, uniqueDomains.length > 0 ? 0.8 : 0.4);
    const confidenceScore = (baseConfidence + domainConfidence) / 2;

    return {
      domains: uniqueDomains,
      complexity: this.assessTaskComplexity(analysis, crossDomainCount, unknownElements.length),
      crossDomainCount,
      unknownElements,
      confidenceScore
    };
  }

  private assessTaskComplexity(analysis: TaskAnalysis, crossDomainCount: number, unknownElementCount: number): 'simple' | 'medium' | 'complex' | 'enterprise' {
    let complexityScore = 0;

    // Base complexity from analysis
    if (analysis.complexity === 'simple') complexityScore += 1;
    else if (analysis.complexity === 'medium') complexityScore += 2;
    else if (analysis.complexity === 'complex') complexityScore += 3;

    // Cross-domain complexity
    complexityScore += crossDomainCount;

    // Unknown elements add complexity
    complexityScore += unknownElementCount * 0.5;

    // ServiceNow artifact count
    complexityScore += analysis.serviceNowArtifacts.length * 0.5;

    if (complexityScore >= 6) return 'enterprise';
    if (complexityScore >= 4) return 'complex';
    if (complexityScore >= 2) return 'medium';
    return 'simple';
  }

  private async composeAdaptiveTeam(task: AdaptiveTask, domainAnalysis: TaskDomainAnalysis): Promise<AdaptiveTeamComposition> {
    console.log('🧠 Composing adaptive team based on domain analysis...');

    // Determine required specialists based on domains
    const requiredSpecialists = new Set<string>();
    
    for (const domain of domainAnalysis.domains) {
      const domainSpecialists = this.domainKnowledge.get(domain) || [];
      domainSpecialists.forEach(specialist => requiredSpecialists.add(specialist));
    }

    // If no specific domains detected, use general agent analysis
    if (requiredSpecialists.size === 0) {
      const generalAgents = AgentDetector.analyzeTask(task.description, task.options.maxAgents);
      requiredSpecialists.add(generalAgents.primaryAgent);
      generalAgents.supportingAgents.forEach(agent => requiredSpecialists.add(agent));
    }

    // Select agents with performance weighting
    const selectedAgents: DynamicAgent[] = [];
    
    for (const specialistType of Array.from(requiredSpecialists)) {
      const agent = this.availableAgents.find(a => a.type === specialistType);
      if (agent) {
        // Adjust confidence based on performance history
        const performanceBonus = this.performanceHistory.get(agent.name) || 0;
        agent.confidence = Math.min(1, agent.confidence + performanceBonus);
        
        selectedAgents.push({ ...agent });
      }
    }

    // Ensure we have at least one agent
    if (selectedAgents.length === 0) {
      selectedAgents.push({ ...this.availableAgents.find(a => a.type === 'orchestrator')! });
    }

    // Apply team size constraints
    const maxTeamSize = task.options.maxAgents || 5;
    const finalAgents = selectedAgents
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxTeamSize);

    const primaryAgent = finalAgents[0];
    const supportingAgents = finalAgents.slice(1);

    // Calculate metrics
    const totalConfidence = finalAgents.reduce((sum, agent) => sum + agent.confidence, 0) / finalAgents.length;
    const riskLevel = this.assessRiskLevel(domainAnalysis, totalConfidence);
    const estimatedDuration = this.estimateTeamDuration(finalAgents, domainAnalysis.complexity);

    return {
      teamSize: finalAgents.length,
      primaryAgent,
      supportingAgents,
      totalConfidence,
      estimatedDuration,
      riskLevel
    };
  }

  private assessRiskLevel(domainAnalysis: TaskDomainAnalysis, teamConfidence: number): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Low confidence increases risk
    if (teamConfidence < 0.6) riskScore += 2;
    else if (teamConfidence < 0.8) riskScore += 1;

    // Unknown elements increase risk
    riskScore += domainAnalysis.unknownElements.length;

    // Cross-domain complexity increases risk
    if (domainAnalysis.crossDomainCount > 3) riskScore += 2;
    else if (domainAnalysis.crossDomainCount > 1) riskScore += 1;

    // Overall task complexity
    if (domainAnalysis.complexity === 'enterprise') riskScore += 3;
    else if (domainAnalysis.complexity === 'complex') riskScore += 2;
    else if (domainAnalysis.complexity === 'medium') riskScore += 1;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private estimateTeamDuration(agents: DynamicAgent[], complexity: string): string {
    const baseHours = {
      'simple': 2,
      'medium': 6,
      'complex': 12,
      'enterprise': 24
    }[complexity] || 6;

    // Adjust based on team size and confidence
    const teamSizeMultiplier = Math.max(0.7, 1 - (agents.length - 1) * 0.1);
    const confidenceMultiplier = agents.reduce((sum, agent) => sum + agent.confidence, 0) / agents.length;
    
    const adjustedHours = baseHours * teamSizeMultiplier * (2 - confidenceMultiplier);
    
    if (adjustedHours < 4) return `${Math.round(adjustedHours)} hours`;
    if (adjustedHours < 24) return `${Math.round(adjustedHours)} hours`;
    return `${Math.round(adjustedHours / 8)} days`;
  }

  private async executeAdaptiveCoordination(task: AdaptiveTask, teamComposition: AdaptiveTeamComposition): Promise<any[]> {
    console.log('🚀 Executing adaptive coordination workflow...');

    const artifacts: any[] = [];

    // Create execution phases based on team composition
    const phases = this.generateAdaptivePhases(task, teamComposition);

    console.log(`   Generated ${phases.length} adaptive phases`);

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      console.log(`   🔄 Phase ${i + 1}: ${phase.name}`);

      // Simulate phase execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      const phaseArtifact = {
        phaseId: i + 1,
        name: phase.name,
        assignedTo: phase.assignedTo,
        type: 'adaptive_phase_output',
        completedAt: new Date(),
        confidence: teamComposition.totalConfidence
      };

      artifacts.push(phaseArtifact);
      console.log(`   ✅ Phase ${i + 1} completed`);
    }

    return artifacts;
  }

  private generateAdaptivePhases(task: AdaptiveTask, teamComposition: AdaptiveTeamComposition): any[] {
    const phases = [
      {
        name: 'Adaptive Analysis',
        description: 'Analyze requirements and plan adaptive approach',
        assignedTo: teamComposition.primaryAgent.name,
        duration: '30min'
      },
      {
        name: 'Collaborative Development',
        description: 'Execute development with team collaboration',
        assignedTo: [teamComposition.primaryAgent.name, ...teamComposition.supportingAgents.map(a => a.name)].join(', '),
        duration: '2-4 hours'
      },
      {
        name: 'Adaptive Integration',
        description: 'Integrate components and validate functionality',
        assignedTo: teamComposition.supportingAgents.map(a => a.name).join(', '),
        duration: '1 hour'
      }
    ];

    // Add validation phase for complex tasks
    if (teamComposition.riskLevel !== 'low') {
      phases.push({
        name: 'Risk Mitigation Review',
        description: 'Review and mitigate identified risks',
        assignedTo: 'TesterAgent',
        duration: '45min'
      });
    }

    return phases;
  }

  private updatePerformanceHistory(teamComposition: AdaptiveTeamComposition, success: boolean): void {
    const performanceChange = success ? 0.1 : -0.05;
    
    [teamComposition.primaryAgent, ...teamComposition.supportingAgents].forEach(agent => {
      const currentPerformance = this.performanceHistory.get(agent.name) || 0;
      this.performanceHistory.set(agent.name, Math.max(-0.3, Math.min(0.3, currentPerformance + performanceChange)));
    });
  }

  private generateAdaptiveWarnings(domainAnalysis: TaskDomainAnalysis, teamComposition: AdaptiveTeamComposition): string[] {
    const warnings: string[] = [];

    if (domainAnalysis.confidenceScore < 0.6) {
      warnings.push('Low task understanding confidence - manual oversight recommended');
    }

    if (domainAnalysis.unknownElements.length > 0) {
      warnings.push(`Unknown elements detected: ${domainAnalysis.unknownElements.join(', ')}`);
    }

    if (teamComposition.riskLevel === 'high') {
      warnings.push('High risk level detected - additional validation recommended');
    }

    if (domainAnalysis.crossDomainCount > 3) {
      warnings.push('High cross-domain complexity - consider breaking into smaller tasks');
    }

    return warnings;
  }
}
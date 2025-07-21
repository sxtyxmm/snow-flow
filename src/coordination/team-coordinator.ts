import { WidgetTeam } from '../teams/widget-team.js';
import { FlowTeam } from '../teams/flow-team.js';
import { ApplicationTeam } from '../teams/application-team.js';
import { AdaptiveTeam } from '../teams/adaptive-team.js';
import { IndividualSpecialists } from '../specialists/individual-specialists.js';
import { TeamOptions } from '../teams/base-team.js';

export interface CoordinationOptions extends TeamOptions {
  preferTeams?: boolean;
  maxComplexity?: 'simple' | 'moderate' | 'complex';
  timeConstraint?: string;
  qualityLevel?: 'quick' | 'standard' | 'comprehensive';
}

export interface TaskAnalysis {
  domain: string;
  complexity: 'simple' | 'moderate' | 'complex';
  scope: 'focused' | 'medium' | 'broad';
  timeEstimate: string;
  recommendedApproach: 'individual' | 'team' | 'adaptive';
  confidence: number;
  reasoning: string[];
}

export interface ExecutionResult {
  approach: string;
  executor: string;
  result: any;
  executionTime: number;
  qualityMetrics: any;
  recommendations: string[];
}

export class TeamCoordinator {
  private options: CoordinationOptions;
  private taskHistory: Map<string, TaskAnalysis> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  constructor(options: CoordinationOptions = {}) {
    this.options = {
      sharedMemory: true,
      validation: true,
      parallel: false,
      monitor: false,
      preferTeams: false,
      qualityLevel: 'standard',
      ...options
    };
  }

  async coordinate(task: string): Promise<ExecutionResult> {
    console.log(`\n🎯 Team Coordinator: Analyzing task coordination strategy`);
    console.log(`📝 Task: ${task}`);
    
    const startTime = Date.now();
    
    // Analyze the task to determine optimal approach
    const analysis = await this.analyzeTask(task);
    this.logAnalysis(analysis);
    
    // Store analysis for learning
    this.taskHistory.set(task, analysis);
    
    // Execute using the recommended approach
    let result: any;
    let executor: string;
    
    switch (analysis.recommendedApproach) {
      case 'individual':
        const specialist = this.selectIndividualSpecialist(task, analysis);
        executor = `Individual ${specialist.name}`;
        result = await this.executeWithIndividualSpecialist(specialist, task);
        break;
        
      case 'team':
        const team = this.selectSpecializedTeam(task, analysis);
        executor = team.constructor.name;
        result = await team.execute(task);
        break;
        
      case 'adaptive':
        const adaptiveTeam = new AdaptiveTeam(this.options);
        executor = 'Adaptive Team';
        result = await adaptiveTeam.execute(task);
        break;
        
      default:
        throw new Error(`Unknown approach: ${analysis.recommendedApproach}`);
    }
    
    const executionTime = Date.now() - startTime;
    
    // Calculate quality metrics
    const qualityMetrics = await this.calculateExecutionQuality(result, analysis, executionTime);
    
    // Generate recommendations for future tasks
    const recommendations = this.generateRecommendations(analysis, result, qualityMetrics);
    
    // Store performance metrics
    this.updatePerformanceMetrics(analysis.recommendedApproach, executionTime, qualityMetrics);
    
    console.log(`\n✅ Coordination completed successfully`);
    console.log(`   Approach: ${analysis.recommendedApproach}`);
    console.log(`   Executor: ${executor}`);
    console.log(`   Execution Time: ${executionTime}ms`);
    console.log(`   Quality Score: ${qualityMetrics.overallScore}/100`);
    
    return {
      approach: analysis.recommendedApproach,
      executor,
      result,
      executionTime,
      qualityMetrics,
      recommendations
    };
  }

  private async analyzeTask(task: string): Promise<TaskAnalysis> {
    const domain = this.identifyDomain(task);
    const complexity = this.assessComplexity(task);
    const scope = this.assessScope(task);
    const timeEstimate = this.estimateTime(task, complexity, scope);
    
    // Determine recommended approach
    const approachAnalysis = this.determineOptimalApproach(task, complexity, scope, domain);
    
    return {
      domain,
      complexity,
      scope,
      timeEstimate,
      recommendedApproach: approachAnalysis.approach,
      confidence: approachAnalysis.confidence,
      reasoning: approachAnalysis.reasoning
    };
  }

  private identifyDomain(task: string): string {
    const lowerTask = task.toLowerCase();
    
    // Widget domain indicators
    if (lowerTask.includes('widget') || 
        (lowerTask.includes('ui') && !lowerTask.includes('flow')) ||
        lowerTask.includes('service portal') ||
        lowerTask.includes('dashboard widget')) {
      return 'widget';
    }
    
    // Flow domain indicators
    if (lowerTask.includes('flow') || 
        lowerTask.includes('workflow') ||
        lowerTask.includes('process') ||
        lowerTask.includes('automation') ||
        lowerTask.includes('approval')) {
      return 'flow';
    }
    
    // Application domain indicators
    if (lowerTask.includes('application') || 
        lowerTask.includes('app') ||
        lowerTask.includes('table') ||
        lowerTask.includes('database') ||
        lowerTask.includes('business rule') ||
        lowerTask.includes('script include')) {
      return 'application';
    }
    
    // Individual specialist domains
    if (lowerTask.includes('frontend') || lowerTask.includes('html') || lowerTask.includes('css')) {
      return 'frontend';
    }
    
    if (lowerTask.includes('backend') || lowerTask.includes('server script') || lowerTask.includes('api')) {
      return 'backend';
    }
    
    if (lowerTask.includes('security') || lowerTask.includes('access control') || lowerTask.includes('compliance')) {
      return 'security';
    }
    
    if (lowerTask.includes('data') || lowerTask.includes('query') || lowerTask.includes('analysis')) {
      return 'data';
    }
    
    if (lowerTask.includes('integration') || lowerTask.includes('sync') || lowerTask.includes('external')) {
      return 'integration';
    }
    
    return 'general';
  }

  private assessComplexity(task: string): 'simple' | 'moderate' | 'complex' {
    const lowerTask = task.toLowerCase();
    let complexityScore = 0;
    
    // Simple indicators
    if (lowerTask.includes('simple') || lowerTask.includes('basic') || lowerTask.includes('quick')) {
      complexityScore -= 2;
    }
    
    // Complex indicators
    if (lowerTask.includes('complex') || lowerTask.includes('advanced') || lowerTask.includes('enterprise')) {
      complexityScore += 3;
    }
    
    // Multiple component indicators
    const components = ['ui', 'backend', 'database', 'integration', 'security', 'workflow'];
    const componentCount = components.filter(comp => lowerTask.includes(comp)).length;
    complexityScore += componentCount;
    
    // Integration complexity
    if (lowerTask.includes('integration') || lowerTask.includes('api') || lowerTask.includes('external')) {
      complexityScore += 2;
    }
    
    // Multiple systems/technologies
    const technologies = ['rest', 'soap', 'ldap', 'oauth', 'saml', 'json', 'xml'];
    const techCount = technologies.filter(tech => lowerTask.includes(tech)).length;
    complexityScore += techCount;
    
    // Task length as complexity indicator
    if (task.length > 200) complexityScore += 2;
    else if (task.length > 100) complexityScore += 1;
    
    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  private assessScope(task: string): 'focused' | 'medium' | 'broad' {
    const lowerTask = task.toLowerCase();
    let scopeScore = 0;
    
    // Focused indicators
    if (lowerTask.includes('specific') || lowerTask.includes('single') || lowerTask.includes('one')) {
      scopeScore -= 1;
    }
    
    // Broad indicators
    if (lowerTask.includes('complete') || lowerTask.includes('full') || lowerTask.includes('entire')) {
      scopeScore += 2;
    }
    
    if (lowerTask.includes('multiple') || lowerTask.includes('several') || lowerTask.includes('various')) {
      scopeScore += 2;
    }
    
    // Count action words (indicates broader scope)
    const actions = ['create', 'update', 'delete', 'manage', 'configure', 'implement', 'design'];
    const actionCount = actions.filter(action => lowerTask.includes(action)).length;
    scopeScore += actionCount - 1; // First action is expected, additional ones increase scope
    
    if (scopeScore >= 3) return 'broad';
    if (scopeScore >= 1) return 'medium';
    return 'focused';
  }

  private estimateTime(task: string, complexity: 'simple' | 'moderate' | 'complex', scope: 'focused' | 'medium' | 'broad'): string {
    const baseTime = {
      'simple': { 'focused': 15, 'medium': 30, 'broad': 60 },
      'moderate': { 'focused': 45, 'medium': 90, 'broad': 180 },
      'complex': { 'focused': 90, 'medium': 180, 'broad': 360 }
    };
    
    let minutes = baseTime[complexity][scope];
    
    // Adjust for domain-specific factors
    const lowerTask = task.toLowerCase();
    if (lowerTask.includes('integration') || lowerTask.includes('migration')) {
      minutes *= 1.5;
    }
    
    if (lowerTask.includes('security') || lowerTask.includes('compliance')) {
      minutes *= 1.3;
    }
    
    if (lowerTask.includes('performance') || lowerTask.includes('optimization')) {
      minutes *= 1.2;
    }
    
    minutes = Math.round(minutes);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  private determineOptimalApproach(task: string, complexity: string, scope: string, domain: string): any {
    const reasoning: string[] = [];
    let confidence = 80; // Base confidence
    
    // Individual specialist approach
    if (this.shouldUseIndividualSpecialist(task, complexity, scope, domain)) {
      reasoning.push(`Task is focused on ${domain} specialty`);
      reasoning.push(`Complexity (${complexity}) and scope (${scope}) suitable for individual work`);
      
      if (complexity === 'simple' && scope === 'focused') confidence += 15;
      
      return {
        approach: 'individual',
        confidence: Math.min(confidence, 95),
        reasoning
      };
    }
    
    // Specialized team approach
    if (this.shouldUseSpecializedTeam(domain, complexity, scope)) {
      reasoning.push(`Task clearly fits ${domain} development pattern`);
      reasoning.push(`Complexity (${complexity}) benefits from specialized team collaboration`);
      
      if (['widget', 'flow', 'application'].includes(domain)) confidence += 10;
      if (complexity === 'moderate' || complexity === 'complex') confidence += 5;
      
      return {
        approach: 'team',
        confidence: Math.min(confidence, 90),
        reasoning
      };
    }
    
    // Adaptive team approach (fallback for unclear/complex cases)
    reasoning.push(`Task doesn't clearly fit standard patterns`);
    reasoning.push(`Using adaptive team for optimal specialist selection`);
    
    if (domain === 'general') reasoning.push('Domain is unclear, adaptive analysis will determine needs');
    if (complexity === 'complex') reasoning.push('High complexity benefits from adaptive specialist assembly');
    
    return {
      approach: 'adaptive',
      confidence: Math.max(confidence - 10, 60),
      reasoning
    };
  }

  private shouldUseIndividualSpecialist(task: string, complexity: string, scope: string, domain: string): boolean {
    // Use individual specialist for simple, focused tasks in specific domains
    if (complexity === 'simple' && scope === 'focused' && 
        ['frontend', 'backend', 'security', 'data', 'integration'].includes(domain)) {
      return true;
    }
    
    // Use individual for quick tasks regardless of domain
    if (complexity === 'simple' && scope === 'focused' && 
        this.options.qualityLevel === 'quick') {
      return true;
    }
    
    // Force individual if configured to avoid teams
    if (!this.options.preferTeams && complexity === 'simple') {
      return true;
    }
    
    return false;
  }

  private shouldUseSpecializedTeam(domain: string, complexity: string, scope: string): boolean {
    // Use specialized teams for their core domains
    if (['widget', 'flow', 'application'].includes(domain)) {
      // For moderate/complex tasks or medium/broad scope
      if (complexity !== 'simple' || scope !== 'focused') {
        return true;
      }
      
      // For simple tasks if teams are preferred
      if (this.options.preferTeams) {
        return true;
      }
    }
    
    return false;
  }

  private selectIndividualSpecialist(task: string, analysis: TaskAnalysis): any {
    const lowerTask = task.toLowerCase();
    
    // Map domain to specialist
    switch (analysis.domain) {
      case 'frontend':
        return {
          name: 'Frontend Specialist',
          instance: new IndividualSpecialists.Frontend(this.options)
        };
      case 'backend':
        return {
          name: 'Backend Specialist',
          instance: new IndividualSpecialists.Backend(this.options)
        };
      case 'security':
        return {
          name: 'Security Specialist',
          instance: new IndividualSpecialists.Security(this.options)
        };
      case 'data':
        return {
          name: 'Data Specialist',
          instance: new IndividualSpecialists.Data(this.options)
        };
      case 'integration':
        return {
          name: 'Integration Specialist',
          instance: new IndividualSpecialists.Integration(this.options)
        };
      default:
        // For general tasks, pick the most relevant specialist
        if (lowerTask.includes('script') || lowerTask.includes('server')) {
          return {
            name: 'Backend Specialist',
            instance: new IndividualSpecialists.Backend(this.options)
          };
        } else if (lowerTask.includes('ui') || lowerTask.includes('interface')) {
          return {
            name: 'Frontend Specialist',
            instance: new IndividualSpecialists.Frontend(this.options)
          };
        } else {
          return {
            name: 'Data Specialist',
            instance: new IndividualSpecialists.Data(this.options)
          };
        }
    }
  }

  private selectSpecializedTeam(task: string, analysis: TaskAnalysis): any {
    switch (analysis.domain) {
      case 'widget':
        return new WidgetTeam(this.options);
      case 'flow':
        return new FlowTeam(this.options);
      case 'application':
        return new ApplicationTeam(this.options);
      default:
        // This shouldn't happen if shouldUseSpecializedTeam logic is correct
        throw new Error(`No specialized team available for domain: ${analysis.domain}`);
    }
  }

  private async executeWithIndividualSpecialist(specialist: any, task: string): Promise<any> {
    console.log(`\n👤 Executing with ${specialist.name}...`);
    
    const result = await specialist.instance.execute(task);
    
    return {
      executorType: 'individual',
      specialist: specialist.name,
      result
    };
  }

  private logAnalysis(analysis: TaskAnalysis): void {
    console.log(`\n📊 Task Analysis Results:`);
    console.log(`   Domain: ${analysis.domain}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Scope: ${analysis.scope}`);
    console.log(`   Time Estimate: ${analysis.timeEstimate}`);
    console.log(`   Recommended Approach: ${analysis.recommendedApproach}`);
    console.log(`   Confidence: ${analysis.confidence}%`);
    console.log(`   Reasoning:`);
    analysis.reasoning.forEach(reason => {
      console.log(`     • ${reason}`);
    });
  }

  private async calculateExecutionQuality(result: any, analysis: TaskAnalysis, executionTime: number): Promise<any> {
    const qualityFactors = {
      completeness: this.assessCompleteness(result),
      accuracy: this.assessAccuracy(result, analysis),
      efficiency: this.assessEfficiency(executionTime, analysis),
      maintainability: this.assessMaintainability(result),
      scalability: this.assessScalability(result)
    };
    
    const overallScore = Object.values(qualityFactors).reduce((sum, score) => sum + score, 0) / Object.keys(qualityFactors).length;
    
    return {
      overallScore: Math.round(overallScore),
      factors: qualityFactors,
      executionTime,
      approach: analysis.recommendedApproach
    };
  }

  private assessCompleteness(result: any): number {
    if (!result || !result.result) return 0;
    
    // Check if result has expected structure
    const hasDeliverables = result.result.deliverables || result.result.components || result.result.dataAnalysis;
    const hasSpecialist = result.result.specialist;
    
    if (hasDeliverables && hasSpecialist) return 90;
    if (hasDeliverables || hasSpecialist) return 70;
    return 50;
  }

  private assessAccuracy(result: any, analysis: TaskAnalysis): number {
    // Simplified accuracy assessment based on result structure
    if (!result || !result.result) return 0;
    
    let accuracy = 80; // Base accuracy
    
    // Check if result matches expected domain
    if (result.result.specialist && analysis.domain !== 'general') {
      const specialistDomain = result.result.specialist.toLowerCase();
      if (specialistDomain.includes(analysis.domain) || analysis.domain.includes(specialistDomain.split(' ')[0])) {
        accuracy += 15;
      }
    }
    
    // Check for error indicators
    if (result.result.error || result.result.errors) {
      accuracy -= 20;
    }
    
    return Math.max(Math.min(accuracy, 100), 0);
  }

  private assessEfficiency(executionTime: number, analysis: TaskAnalysis): number {
    // Convert time estimate to milliseconds for comparison
    const estimatedMs = this.parseTimeToMs(analysis.timeEstimate);
    const efficiency = Math.max(0, 100 - ((executionTime - estimatedMs) / estimatedMs) * 50);
    
    return Math.min(efficiency, 100);
  }

  private parseTimeToMs(timeString: string): number {
    const hours = timeString.includes('h') ? parseInt(timeString.split('h')[0]) * 3600000 : 0;
    const minutes = timeString.includes('minutes') ? parseInt(timeString.split(' ')[0]) * 60000 : 
                   timeString.includes('m') ? parseInt(timeString.match(/(\d+)m/)?.[1] || '0') * 60000 : 0;
    return Math.max(hours + minutes, 60000); // Minimum 1 minute
  }

  private assessMaintainability(result: any): number {
    // Simplified maintainability assessment
    if (!result || !result.result) return 50;
    
    let score = 70; // Base score
    
    // Check for documentation/structure
    if (result.result.requirements || result.result.analysis) score += 15;
    if (result.result.recommendations) score += 10;
    if (result.result.quickImplementation) score -= 5; // Quick implementations are less maintainable
    
    return Math.min(score, 100);
  }

  private assessScalability(result: any): number {
    // Simplified scalability assessment
    if (!result || !result.result) return 50;
    
    let score = 75; // Base score
    
    // Team results generally more scalable
    if (result.executorType !== 'individual') score += 15;
    if (result.result.qualityMetrics) score += 10;
    
    return Math.min(score, 100);
  }

  private generateRecommendations(analysis: TaskAnalysis, result: any, qualityMetrics: any): string[] {
    const recommendations: string[] = [];
    
    // Performance recommendations
    if (qualityMetrics.factors.efficiency < 80) {
      recommendations.push('Consider optimizing execution approach for better performance');
    }
    
    // Quality recommendations
    if (qualityMetrics.overallScore < 85) {
      recommendations.push('Review task analysis accuracy for better specialist selection');
    }
    
    // Approach recommendations
    if (analysis.confidence < 80) {
      recommendations.push('Task pattern unclear - consider providing more specific requirements');
    }
    
    // Domain-specific recommendations
    if (analysis.domain === 'general') {
      recommendations.push('Consider specifying domain context for better specialist matching');
    }
    
    return recommendations;
  }

  private updatePerformanceMetrics(approach: string, executionTime: number, qualityMetrics: any): void {
    const current = this.performanceMetrics.get(approach) || {
      totalExecutions: 0,
      totalTime: 0,
      totalQuality: 0,
      averageTime: 0,
      averageQuality: 0
    };
    
    current.totalExecutions++;
    current.totalTime += executionTime;
    current.totalQuality += qualityMetrics.overallScore;
    current.averageTime = current.totalTime / current.totalExecutions;
    current.averageQuality = current.totalQuality / current.totalExecutions;
    
    this.performanceMetrics.set(approach, current);
  }

  // Public methods for accessing coordinator state and metrics

  getTaskHistory(): Map<string, TaskAnalysis> {
    return this.taskHistory;
  }

  getPerformanceMetrics(): Map<string, any> {
    return this.performanceMetrics;
  }

  getCoordinatorInsights(): any {
    const approaches = Array.from(this.performanceMetrics.keys());
    const totalTasks = Array.from(this.taskHistory.values()).length;
    
    return {
      totalTasksCoordinated: totalTasks,
      approachesUsed: approaches,
      performanceByApproach: Object.fromEntries(this.performanceMetrics),
      mostUsedApproach: this.getMostUsedApproach(),
      averageConfidence: this.getAverageConfidence(),
      recommendations: this.getCoordinatorRecommendations()
    };
  }

  private getMostUsedApproach(): string {
    let maxCount = 0;
    let mostUsed = 'none';
    
    this.performanceMetrics.forEach((metrics, approach) => {
      if (metrics.totalExecutions > maxCount) {
        maxCount = metrics.totalExecutions;
        mostUsed = approach;
      }
    });
    
    return mostUsed;
  }

  private getAverageConfidence(): number {
    const analyses = Array.from(this.taskHistory.values());
    if (analyses.length === 0) return 0;
    
    const totalConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0);
    return Math.round(totalConfidence / analyses.length);
  }

  private getCoordinatorRecommendations(): string[] {
    const recommendations: string[] = [];
    const insights = this.getCoordinatorInsights();
    
    if (insights.averageConfidence < 75) {
      recommendations.push('Tasks often have unclear requirements - encourage more specific task descriptions');
    }
    
    if (insights.totalTasksCoordinated > 10) {
      recommendations.push('Consider implementing task pattern caching for frequently similar tasks');
    }
    
    return recommendations;
  }
}
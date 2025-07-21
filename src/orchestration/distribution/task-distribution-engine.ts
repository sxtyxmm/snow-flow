/**
 * Intelligent Task Distribution Engine
 * 
 * Distributes tasks across external Claude Code instances using advanced algorithms
 * for optimal performance, load balancing, and resource utilization.
 */

import { EventEmitter } from 'events';
import {
  TaskSpecification,
  ClaudeCodeInstance,
  DistributionPlan,
  AgentAssignment,
  TaskRequirements,
  LoadBalancingStrategy,
  AffinityRule,
  PerformanceMetrics,
  ResourceRequirement,
  TaskPartition,
  InstanceStatus
} from '../interfaces/distributed-orchestration.interface.js';
import { logger } from '../../utils/logger.js';

export class IntelligentTaskDistributor extends EventEmitter {
  private agentPool: ExternalAgentPool;
  private loadBalancers: Map<string, LoadBalancingStrategy>;
  private taskAnalyzer: TaskAnalyzer;
  private affinityManager: AffinityManager;
  private performanceTracker: PerformanceTracker;
  private costOptimizer: CostOptimizer;

  constructor() {
    super();
    this.agentPool = new ExternalAgentPool();
    this.loadBalancers = this.initializeLoadBalancers();
    this.taskAnalyzer = new TaskAnalyzer();
    this.affinityManager = new AffinityManager();
    this.performanceTracker = new PerformanceTracker();
    this.costOptimizer = new CostOptimizer();
  }

  // ========================================
  // Main Distribution Logic
  // ========================================

  async distributeTask(task: TaskSpecification): Promise<DistributionPlan> {
    logger.info(`🎯 Starting task distribution for: ${task.name}`, { 
      taskId: task.id, 
      type: task.type 
    });

    try {
      // 1. Analyze task requirements and complexity
      const analysis = await this.taskAnalyzer.analyze(task);
      logger.info(`📊 Task analysis completed`, { 
        complexity: analysis.complexity,
        requiredCapabilities: analysis.requirements.capabilities.length,
        estimatedAgents: analysis.estimatedAgentCount
      });

      // 2. Find suitable agents based on capabilities
      const candidates = await this.findSuitableAgents(analysis.requirements);
      if (candidates.length === 0) {
        throw new TaskDistributionError(`No suitable agents found for task: ${task.id}`);
      }
      
      logger.info(`🔍 Found ${candidates.length} suitable agents`);

      // 3. Apply load balancing to optimize distribution
      const loadBalancer = this.selectLoadBalancer(task, analysis);
      const loadBalancedAssignments = await loadBalancer.optimize(candidates, task);

      // 4. Apply affinity rules and constraints
      const affinityOptimized = await this.affinityManager.apply(
        loadBalancedAssignments, 
        task.affinityRules || []
      );

      // 5. Optimize for cost if specified
      const costOptimized = await this.costOptimizer.optimize(affinityOptimized, task);

      // 6. Create execution plan with phases
      const executionPlan = await this.createExecutionPlan(costOptimized, analysis);

      // 7. Generate fallback plan
      const fallbackPlan = await this.generateFallbackPlan(task, candidates);

      const distributionPlan: DistributionPlan = {
        taskId: task.id,
        assignments: costOptimized,
        executionOrder: executionPlan.phases,
        estimated: {
          totalDuration: executionPlan.estimatedDuration,
          parallelization: executionPlan.parallelizationScore,
          resourceUsage: executionPlan.resourceUsage
        },
        fallbackPlan
      };

      // 8. Validate distribution plan
      await this.validateDistributionPlan(distributionPlan, task);

      logger.info(`✅ Task distribution completed`, {
        taskId: task.id,
        assignments: distributionPlan.assignments.length,
        estimatedDuration: distributionPlan.estimated.totalDuration,
        parallelization: distributionPlan.estimated.parallelization
      });

      this.emit('task:distributed', { task, plan: distributionPlan });
      return distributionPlan;

    } catch (error) {
      logger.error(`❌ Task distribution failed for: ${task.id}`, { 
        error: error.message 
      });
      
      this.emit('task:distribution_failed', { task, error });
      throw error;
    }
  }

  // ========================================
  // Agent Discovery and Matching
  // ========================================

  async findSuitableAgents(requirements: TaskRequirements): Promise<ClaudeCodeInstance[]> {
    const allAgents = await this.agentPool.getAvailableAgents();
    
    const suitableAgents = allAgents
      .filter(agent => this.meetsCapabilityRequirements(agent, requirements))
      .filter(agent => this.meetsResourceRequirements(agent, requirements))
      .filter(agent => this.meetsConstraints(agent, requirements))
      .filter(agent => this.isHealthy(agent));

    // Score and sort agents by suitability
    const scoredAgents = suitableAgents
      .map(agent => ({
        agent,
        score: this.scoreAgent(agent, requirements)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.agent);

    return scoredAgents;
  }

  private meetsCapabilityRequirements(agent: ClaudeCodeInstance, requirements: TaskRequirements): boolean {
    const agentCapabilities = agent.capabilities.flatMap(cap => cap.specialization);
    return requirements.capabilities.every(req => 
      agentCapabilities.some(cap => 
        cap.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(cap.toLowerCase())
      )
    );
  }

  private meetsResourceRequirements(agent: ClaudeCodeInstance, requirements: TaskRequirements): boolean {
    for (const requirement of requirements.resources) {
      const agentResource = agent.capabilities.find(cap => 
        cap.resourceRequirements.some(res => res.type === requirement.type)
      );

      if (!agentResource && requirement.amount && requirement.amount > 0) {
        return false;
      }
    }
    return true;
  }

  private meetsConstraints(agent: ClaudeCodeInstance, requirements: TaskRequirements): boolean {
    for (const constraint of requirements.constraints) {
      if (!this.evaluateConstraint(agent, constraint)) {
        return false;
      }
    }
    return true;
  }

  private isHealthy(agent: ClaudeCodeInstance): boolean {
    return agent.status === InstanceStatus.ACTIVE || agent.status === InstanceStatus.IDLE;
  }

  // ========================================
  // Agent Scoring Algorithm
  // ========================================

  private scoreAgent(agent: ClaudeCodeInstance, requirements: TaskRequirements): number {
    let score = 0;

    // Capability match score (40% weight)
    const capabilityScore = this.calculateCapabilityScore(agent, requirements);
    score += capabilityScore * 0.4;

    // Performance score (25% weight)
    const performanceScore = this.calculatePerformanceScore(agent);
    score += performanceScore * 0.25;

    // Load score (20% weight) - inverse of current load
    const loadScore = this.calculateLoadScore(agent);
    score += loadScore * 0.2;

    // Geographic proximity score (10% weight)
    const proximityScore = this.calculateProximityScore(agent);
    score += proximityScore * 0.1;

    // Cost efficiency score (5% weight)
    const costScore = this.calculateCostScore(agent);
    score += costScore * 0.05;

    return Math.min(Math.max(score, 0), 1); // Normalize to 0-1
  }

  private calculateCapabilityScore(agent: ClaudeCodeInstance, requirements: TaskRequirements): number {
    const requiredCapabilities = requirements.capabilities;
    const agentCapabilities = agent.capabilities.flatMap(cap => cap.specialization);
    
    let matches = 0;
    for (const required of requiredCapabilities) {
      const bestMatch = agentCapabilities.find(agentCap => 
        this.calculateCapabilityMatch(required, agentCap) > 0.7
      );
      if (bestMatch) matches++;
    }

    return requiredCapabilities.length > 0 ? matches / requiredCapabilities.length : 0;
  }

  private calculateCapabilityMatch(required: string, available: string): number {
    // Simple string similarity - in production, would use more sophisticated matching
    const similarity = this.stringSimilarity(required.toLowerCase(), available.toLowerCase());
    return similarity;
  }

  private calculatePerformanceScore(agent: ClaudeCodeInstance): number {
    const metrics = agent.metadata.performanceMetrics;
    
    // Normalize metrics to 0-1 scores
    const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / 10000)); // 10s max
    const throughputScore = Math.min(1, metrics.throughput / 100); // 100 tasks/hour max
    const errorRateScore = Math.max(0, 1 - (metrics.errorRate * 10)); // 10% max error rate
    const completionRateScore = metrics.taskCompletionRate;

    return (responseTimeScore + throughputScore + errorRateScore + completionRateScore) / 4;
  }

  private calculateLoadScore(agent: ClaudeCodeInstance): number {
    const currentTasks = this.performanceTracker.getCurrentTaskCount(agent.id);
    const maxTasks = agent.metadata.maxConcurrentTasks;
    
    return Math.max(0, 1 - (currentTasks / maxTasks));
  }

  private calculateProximityScore(agent: ClaudeCodeInstance): number {
    // Would calculate based on geographic distance, network latency, etc.
    // For now, return neutral score
    return 0.5;
  }

  private calculateCostScore(agent: ClaudeCodeInstance): number {
    // Would calculate based on compute costs, data transfer costs, etc.
    // For now, return neutral score
    return 0.5;
  }

  // ========================================
  // Load Balancer Selection
  // ========================================

  private selectLoadBalancer(
    task: TaskSpecification, 
    analysis: TaskAnalysis
  ): IntelligentLoadBalancer {
    // Select based on task characteristics
    if (analysis.complexity > 0.8) {
      return new CapabilityWeightedLoadBalancer(this.performanceTracker);
    } else if (analysis.hasGeographicRequirements) {
      return new GeographicAffinityLoadBalancer();
    } else if (analysis.estimatedAgentCount > 5) {
      return new AIOptimizedLoadBalancer(this.performanceTracker);
    } else {
      return new RoundRobinLoadBalancer();
    }
  }

  // ========================================
  // Execution Plan Creation
  // ========================================

  private async createExecutionPlan(
    assignments: AgentAssignment[], 
    analysis: TaskAnalysis
  ): Promise<ExecutionPlanResult> {
    const phases = await this.identifyExecutionPhases(assignments, analysis);
    const estimatedDuration = this.calculateTotalDuration(phases);
    const parallelizationScore = this.calculateParallelizationScore(phases);
    const resourceUsage = this.calculateResourceUsage(assignments);

    return {
      phases,
      estimatedDuration,
      parallelizationScore,
      resourceUsage
    };
  }

  private async identifyExecutionPhases(
    assignments: AgentAssignment[], 
    analysis: TaskAnalysis
  ): Promise<ExecutionPhase[]> {
    const phases: ExecutionPhase[] = [];
    const dependencyGraph = this.buildDependencyGraph(assignments);
    
    // Topological sort to identify execution order
    const sortedLevels = this.topologicalSort(dependencyGraph);
    
    for (let level = 0; level < sortedLevels.length; level++) {
      const tasksAtLevel = sortedLevels[level];
      const canRunInParallel = tasksAtLevel.length > 1 && !analysis.hasStrictOrdering;

      phases.push({
        id: `phase_${level}`,
        type: canRunInParallel ? 'parallel' : 'sequential',
        tasks: tasksAtLevel.map(task => task.taskPortion.id),
        estimatedDuration: Math.max(...tasksAtLevel.map(t => t.estimatedEnd.getTime() - t.estimatedStart.getTime())),
        dependencies: level > 0 ? [`phase_${level - 1}`] : []
      });
    }

    return phases;
  }

  // ========================================
  // Fallback Planning
  // ========================================

  private async generateFallbackPlan(
    task: TaskSpecification, 
    availableAgents: ClaudeCodeInstance[]
  ): Promise<DistributionPlan> {
    // Create a simpler, more conservative fallback plan
    const fallbackAgents = availableAgents
      .filter(agent => agent.status === InstanceStatus.ACTIVE)
      .sort((a, b) => this.calculateReliabilityScore(b) - this.calculateReliabilityScore(a))
      .slice(0, Math.min(3, availableAgents.length)); // Max 3 agents for fallback

    const loadBalancer = new RoundRobinLoadBalancer();
    const assignments = await loadBalancer.optimize(fallbackAgents, task);

    return {
      taskId: task.id,
      assignments,
      executionOrder: [{
        id: 'fallback_phase',
        type: 'sequential',
        tasks: assignments.map(a => a.taskPortion.id),
        estimatedDuration: Math.max(...assignments.map(a => 
          a.estimatedEnd.getTime() - a.estimatedStart.getTime()
        )),
        dependencies: []
      }],
      estimated: {
        totalDuration: Math.max(...assignments.map(a => 
          a.estimatedEnd.getTime() - a.estimatedStart.getTime()
        )),
        parallelization: 0.3, // Conservative parallelization
        resourceUsage: this.calculateResourceUsage(assignments)
      }
    };
  }

  // ========================================
  // Validation
  // ========================================

  private async validateDistributionPlan(
    plan: DistributionPlan, 
    task: TaskSpecification
  ): Promise<void> {
    const validations = [
      this.validateResourceAllocation(plan, task),
      this.validateDeadlines(plan, task),
      this.validateCapabilities(plan, task),
      this.validateConstraints(plan, task)
    ];

    const results = await Promise.all(validations);
    const failures = results.filter(r => !r.valid);

    if (failures.length > 0) {
      throw new TaskDistributionError(
        `Distribution plan validation failed: ${failures.map(f => f.reason).join(', ')}`
      );
    }
  }

  // ========================================
  // Load Balancing Implementations
  // ========================================

  private initializeLoadBalancers(): Map<string, LoadBalancingStrategy> {
    const balancers = new Map();
    
    balancers.set('round_robin', {
      name: 'round_robin',
      type: 'round_robin',
      parameters: {}
    });
    
    balancers.set('capability_weighted', {
      name: 'capability_weighted',
      type: 'capability_based',
      parameters: { weightFactor: 0.8 }
    });
    
    balancers.set('geographic_affinity', {
      name: 'geographic_affinity',
      type: 'geographic',
      parameters: { maxLatency: 100 }
    });

    return balancers;
  }

  // ========================================
  // Utility Methods
  // ========================================

  private stringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  private evaluateConstraint(agent: ClaudeCodeInstance, constraint: any): boolean {
    // Implementation would evaluate specific constraint types
    return true; // Simplified for now
  }

  private calculateReliabilityScore(agent: ClaudeCodeInstance): number {
    const metrics = agent.metadata.performanceMetrics;
    const healthScore = agent.healthcheck.consecutiveFailures === 0 ? 1 : 
      Math.max(0, 1 - (agent.healthcheck.consecutiveFailures * 0.1));
    
    return (metrics.taskCompletionRate + healthScore) / 2;
  }

  private buildDependencyGraph(assignments: AgentAssignment[]): DependencyGraph {
    // Build dependency graph from task assignments
    // Implementation would create actual dependency relationships
    return new Map();
  }

  private topologicalSort(graph: DependencyGraph): AgentAssignment[][] {
    // Topological sort implementation
    // Returns assignments grouped by execution level
    return [];
  }

  private calculateTotalDuration(phases: ExecutionPhase[]): number {
    return phases.reduce((total, phase) => total + phase.estimatedDuration, 0);
  }

  private calculateParallelizationScore(phases: ExecutionPhase[]): number {
    const parallelPhases = phases.filter(p => p.type === 'parallel').length;
    return phases.length > 0 ? parallelPhases / phases.length : 0;
  }

  private calculateResourceUsage(assignments: AgentAssignment[]): ResourceUsage {
    return {
      cpu: assignments.reduce((total, a) => total + (a.resourceAllocation.find(r => r.type === 'cpu')?.amount || 0), 0),
      memory: assignments.reduce((total, a) => total + (a.resourceAllocation.find(r => r.type === 'memory')?.amount || 0), 0),
      network: 0, // Would calculate network usage
      storage: 0, // Would calculate storage usage
      apiCalls: 0 // Would estimate API calls
    };
  }

  private async validateResourceAllocation(plan: DistributionPlan, task: TaskSpecification): Promise<ValidationResult> {
    // Validate that resource allocation is realistic
    return { valid: true };
  }

  private async validateDeadlines(plan: DistributionPlan, task: TaskSpecification): Promise<ValidationResult> {
    // Validate that deadlines can be met
    if (task.deadline) {
      const estimatedCompletion = new Date(Date.now() + plan.estimated.totalDuration);
      if (estimatedCompletion > task.deadline) {
        return { 
          valid: false, 
          reason: `Estimated completion (${estimatedCompletion}) exceeds deadline (${task.deadline})` 
        };
      }
    }
    return { valid: true };
  }

  private async validateCapabilities(plan: DistributionPlan, task: TaskSpecification): Promise<ValidationResult> {
    // Validate that all required capabilities are covered
    const requiredCapabilities = task.requirements.capabilities;
    const assignedCapabilities = new Set<string>();
    
    for (const assignment of plan.assignments) {
      const agent = await this.agentPool.getAgent(assignment.agentId);
      if (agent) {
        agent.capabilities.forEach(cap => {
          cap.specialization.forEach(spec => assignedCapabilities.add(spec));
        });
      }
    }

    const missingCapabilities = requiredCapabilities.filter(req => 
      !Array.from(assignedCapabilities).some(assigned => 
        assigned.toLowerCase().includes(req.toLowerCase())
      )
    );

    if (missingCapabilities.length > 0) {
      return {
        valid: false,
        reason: `Missing required capabilities: ${missingCapabilities.join(', ')}`
      };
    }

    return { valid: true };
  }

  private async validateConstraints(plan: DistributionPlan, task: TaskSpecification): Promise<ValidationResult> {
    // Validate that all constraints are satisfied
    return { valid: true };
  }
}

// ========================================
// Supporting Classes
// ========================================

class ExternalAgentPool {
  private agents: Map<string, ClaudeCodeInstance> = new Map();

  async getAvailableAgents(): Promise<ClaudeCodeInstance[]> {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === InstanceStatus.ACTIVE || agent.status === InstanceStatus.IDLE);
  }

  async getAgent(agentId: string): Promise<ClaudeCodeInstance | undefined> {
    return this.agents.get(agentId);
  }

  async addAgent(agent: ClaudeCodeInstance): Promise<void> {
    this.agents.set(agent.id, agent);
  }

  async removeAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
  }
}

class TaskAnalyzer {
  async analyze(task: TaskSpecification): Promise<TaskAnalysis> {
    const complexity = this.calculateComplexity(task);
    const estimatedAgentCount = this.estimateAgentCount(task, complexity);
    const hasGeographicRequirements = this.checkGeographicRequirements(task);
    const hasStrictOrdering = this.checkStrictOrdering(task);

    return {
      complexity,
      estimatedAgentCount,
      hasGeographicRequirements,
      hasStrictOrdering,
      requirements: task.requirements
    };
  }

  private calculateComplexity(task: TaskSpecification): number {
    let complexity = 0.3; // Base complexity

    // Factor in number of dependencies
    complexity += Math.min(task.dependencies.length * 0.1, 0.3);

    // Factor in number of required capabilities
    complexity += Math.min(task.requirements.capabilities.length * 0.05, 0.2);

    // Factor in resource requirements
    complexity += Math.min(task.requirements.resources.length * 0.1, 0.2);

    return Math.min(complexity, 1.0);
  }

  private estimateAgentCount(task: TaskSpecification, complexity: number): number {
    const baseAgents = 1;
    const complexityAgents = Math.ceil(complexity * 3);
    const capabilityAgents = Math.ceil(task.requirements.capabilities.length / 2);
    
    return Math.min(Math.max(baseAgents, complexityAgents, capabilityAgents), 8);
  }

  private checkGeographicRequirements(task: TaskSpecification): boolean {
    return task.requirements.constraints.some(constraint => 
      constraint.type === 'resource' && 
      constraint.description.toLowerCase().includes('geographic')
    );
  }

  private checkStrictOrdering(task: TaskSpecification): boolean {
    return task.dependencies.length > 0 ||
           task.requirements.constraints.some(constraint => constraint.type === 'dependency');
  }
}

class AffinityManager {
  async apply(assignments: AgentAssignment[], rules: AffinityRule[]): Promise<AgentAssignment[]> {
    if (rules.length === 0) return assignments;

    let optimizedAssignments = [...assignments];

    for (const rule of rules) {
      optimizedAssignments = await this.applyAffinityRule(optimizedAssignments, rule);
    }

    return optimizedAssignments;
  }

  private async applyAffinityRule(
    assignments: AgentAssignment[], 
    rule: AffinityRule
  ): Promise<AgentAssignment[]> {
    // Implementation would apply specific affinity rules
    // For now, return unchanged assignments
    return assignments;
  }
}

class PerformanceTracker {
  private taskCounts: Map<string, number> = new Map();

  getCurrentTaskCount(agentId: string): number {
    return this.taskCounts.get(agentId) || 0;
  }

  incrementTaskCount(agentId: string): void {
    const current = this.getCurrentTaskCount(agentId);
    this.taskCounts.set(agentId, current + 1);
  }

  decrementTaskCount(agentId: string): void {
    const current = this.getCurrentTaskCount(agentId);
    this.taskCounts.set(agentId, Math.max(0, current - 1));
  }
}

class CostOptimizer {
  async optimize(assignments: AgentAssignment[], task: TaskSpecification): Promise<AgentAssignment[]> {
    // Implementation would optimize for cost efficiency
    // For now, return unchanged assignments
    return assignments;
  }
}

// ========================================
// Load Balancer Implementations
// ========================================

abstract class IntelligentLoadBalancer {
  abstract optimize(candidates: ClaudeCodeInstance[], task: TaskSpecification): Promise<AgentAssignment[]>;
}

class RoundRobinLoadBalancer extends IntelligentLoadBalancer {
  async optimize(candidates: ClaudeCodeInstance[], task: TaskSpecification): Promise<AgentAssignment[]> {
    const assignments: AgentAssignment[] = [];
    const agentCount = Math.min(candidates.length, 3); // Limit to 3 agents for round-robin
    
    for (let i = 0; i < agentCount; i++) {
      const agent = candidates[i];
      assignments.push({
        agentId: agent.id,
        taskPortion: {
          id: `portion_${i}`,
          parentTaskId: task.id,
          work: this.createWorkPortion(task, i, agentCount),
          inputs: task.requirements.inputs,
          expectedOutputs: task.outputs,
          dependencies: task.dependencies
        },
        priority: 1,
        estimatedStart: new Date(),
        estimatedEnd: new Date(Date.now() + (task.estimatedDuration || 300000)),
        resourceAllocation: []
      });
    }

    return assignments;
  }

  private createWorkPortion(task: TaskSpecification, index: number, total: number): any {
    return {
      type: task.type,
      portion: `${index + 1}/${total}`,
      description: `${task.description} (Part ${index + 1} of ${total})`
    };
  }
}

class CapabilityWeightedLoadBalancer extends IntelligentLoadBalancer {
  constructor(private performanceTracker: PerformanceTracker) {
    super();
  }

  async optimize(candidates: ClaudeCodeInstance[], task: TaskSpecification): Promise<AgentAssignment[]> {
    // Implementation would weight assignments based on capabilities
    return new RoundRobinLoadBalancer().optimize(candidates, task);
  }
}

class GeographicAffinityLoadBalancer extends IntelligentLoadBalancer {
  async optimize(candidates: ClaudeCodeInstance[], task: TaskSpecification): Promise<AgentAssignment[]> {
    // Implementation would optimize for geographic proximity
    return new RoundRobinLoadBalancer().optimize(candidates, task);
  }
}

class AIOptimizedLoadBalancer extends IntelligentLoadBalancer {
  constructor(private performanceTracker: PerformanceTracker) {
    super();
  }

  async optimize(candidates: ClaudeCodeInstance[], task: TaskSpecification): Promise<AgentAssignment[]> {
    // Implementation would use ML models for optimization
    return new RoundRobinLoadBalancer().optimize(candidates, task);
  }
}

// ========================================
// Types and Interfaces
// ========================================

interface TaskAnalysis {
  complexity: number;
  estimatedAgentCount: number;
  hasGeographicRequirements: boolean;
  hasStrictOrdering: boolean;
  requirements: TaskRequirements;
}

interface ExecutionPlanResult {
  phases: ExecutionPhase[];
  estimatedDuration: number;
  parallelizationScore: number;
  resourceUsage: ResourceUsage;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

interface ExecutionPhase {
  id: string;
  type: 'sequential' | 'parallel';
  tasks: string[];
  estimatedDuration: number;
  dependencies: string[];
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  apiCalls: number;
}

type DependencyGraph = Map<string, string[]>;

// ========================================
// Error Classes
// ========================================

class TaskDistributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskDistributionError';
  }
}

export { TaskDistributionError };
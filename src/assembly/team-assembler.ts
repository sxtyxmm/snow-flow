/**
 * Team Assembler - Dynamic assembly of specialist agents based on requirements
 */

import { BaseSnowAgent } from '../agents/base/base-snow-agent.js';
import { DataSpecialistAgent } from '../agents/specialists/data-specialist.agent.js';
import { IntegrationSpecialistAgent } from '../agents/specialists/integration-specialist.agent.js';
import { AutomationSpecialistAgent } from '../agents/specialists/automation-specialist.agent.js';
import { ReportingSpecialistAgent } from '../agents/specialists/reporting-specialist.agent.js';
import { SecuritySpecialistAgent } from '../agents/specialists/security-specialist.agent.js';
import { SkillSet } from '../intelligence/task-analyzer.js';
import { Logger } from '../utils/logger.js';

export interface SpecialistPool {
  available: Map<string, typeof BaseSnowAgent>;
  active: Map<string, BaseSnowAgent>;
  capacity: Map<string, CapacityInfo>;
  performance: Map<string, PerformanceMetrics>;
}

export interface CapacityInfo {
  maxConcurrent: number;
  currentLoad: number;
  reservedSlots: number;
  nextAvailable?: Date;
}

export interface PerformanceMetrics {
  averageExecutionTime: number;
  successRate: number;
  totalTasksCompleted: number;
  lastActivity: Date;
  complexityRating: number;
}

export interface TeamConfiguration {
  maxTeamSize: number;
  preferredStructure: 'flat' | 'hierarchical' | 'matrix';
  loadBalancing: boolean;
  skillOverlap: boolean;
  performanceThreshold: number;
}

export interface AssemblyResult {
  success: boolean;
  team: Map<string, BaseSnowAgent>;
  configuration: TeamConfiguration;
  assemblyTime: number;
  warnings: string[];
  recommendations: string[];
  fallbacks: FallbackOption[];
}

export interface FallbackOption {
  description: string;
  impact: 'low' | 'medium' | 'high';
  alternative: string;
  reason: string;
}

export interface SkillMapping {
  skillType: string;
  specialistTypes: string[];
  fallbackTypes: string[];
  complexityMapping: Record<string, string[]>;
}

export class TeamAssembler {
  private logger: Logger;
  private specialistPool: SpecialistPool;
  private skillMappings: Map<string, SkillMapping> = new Map();
  private defaultConfig: TeamConfiguration;

  constructor() {
    this.logger = new Logger('TeamAssembler');
    this.specialistPool = this.initializeSpecialistPool();
    this.initializeSkillMappings();
    this.defaultConfig = {
      maxTeamSize: 8,
      preferredStructure: 'flat',
      loadBalancing: true,
      skillOverlap: false,
      performanceThreshold: 0.8
    };
  }

  /**
   * Assemble team based on required skills
   */
  async assembleTeam(
    requiredSkills: SkillSet[], 
    config?: Partial<TeamConfiguration>
  ): Promise<Map<string, BaseSnowAgent>> {
    const startTime = Date.now();
    const teamConfig = { ...this.defaultConfig, ...config };
    const team = new Map<string, BaseSnowAgent>();
    const warnings: string[] = [];
    const fallbacks: FallbackOption[] = [];

    this.logger.info('Assembling team', {
      requiredSkills: requiredSkills.map(s => s.type),
      maxTeamSize: teamConfig.maxTeamSize
    });

    try {
      // Group skills by importance
      const primarySkills = requiredSkills.filter(s => s.importance === 'primary');
      const secondarySkills = requiredSkills.filter(s => s.importance === 'secondary');
      const optionalSkills = requiredSkills.filter(s => s.importance === 'optional');

      // Assemble primary specialists first
      for (const skill of primarySkills) {
        const specialist = await this.selectSpecialist(skill, team, teamConfig);
        if (specialist) {
          team.set(skill.type, specialist);
          this.updateCapacity(skill.type, 'allocate');
        } else {
          warnings.push(`Could not allocate primary specialist for ${skill.type}`);
          const fallback = this.findFallbackSpecialist(skill, team, teamConfig);
          if (fallback.specialist) {
            team.set(skill.type, fallback.specialist);
            fallbacks.push({
              description: `Using ${fallback.type} as fallback for ${skill.type}`,
              impact: 'medium',
              alternative: fallback.type,
              reason: fallback.reason
            });
          }
        }
      }

      // Add secondary specialists if capacity allows
      if (team.size < teamConfig.maxTeamSize) {
        for (const skill of secondarySkills) {
          if (team.size >= teamConfig.maxTeamSize) break;
          
          const specialist = await this.selectSpecialist(skill, team, teamConfig);
          if (specialist) {
            team.set(skill.type, specialist);
            this.updateCapacity(skill.type, 'allocate');
          }
        }
      }

      // Add optional specialists if there's still capacity and no skill overlap concerns
      if (team.size < teamConfig.maxTeamSize && !teamConfig.skillOverlap) {
        for (const skill of optionalSkills) {
          if (team.size >= teamConfig.maxTeamSize) break;
          
          const specialist = await this.selectSpecialist(skill, team, teamConfig);
          if (specialist) {
            team.set(skill.type, specialist);
            this.updateCapacity(skill.type, 'allocate');
          }
        }
      }

      // Apply load balancing if enabled
      if (teamConfig.loadBalancing) {
        await this.applyLoadBalancing(team, teamConfig);
      }

      const assemblyTime = Date.now() - startTime;
      
      this.logger.info('Team assembly completed', {
        teamSize: team.size,
        assemblyTime,
        warningCount: warnings.length,
        fallbackCount: fallbacks.length
      });

      return team;

    } catch (error) {
      this.logger.error('Team assembly failed', error);
      throw error;
    }
  }

  /**
   * Select optimal specialist for a skill requirement
   */
  private async selectSpecialist(
    skill: SkillSet,
    currentTeam: Map<string, BaseSnowAgent>,
    config: TeamConfiguration
  ): Promise<BaseSnowAgent | null> {
    const skillMapping = this.skillMappings.get(skill.type);
    if (!skillMapping) {
      this.logger.warn('No skill mapping found', { skillType: skill.type });
      return null;
    }

    // Get candidate specialist types based on complexity
    const candidateTypes = this.getCandidateTypes(skill, skillMapping);
    
    // Evaluate candidates
    const candidates = await this.evaluateCandidates(
      candidateTypes,
      skill,
      currentTeam,
      config
    );

    if (candidates.length === 0) {
      return null;
    }

    // Select best candidate based on multiple criteria
    const bestCandidate = this.selectBestCandidate(candidates, skill, config);
    
    if (bestCandidate) {
      return this.instantiateSpecialist(bestCandidate.type);
    }

    return null;
  }

  /**
   * Find fallback specialist when primary selection fails
   */
  private findFallbackSpecialist(
    skill: SkillSet,
    currentTeam: Map<string, BaseSnowAgent>,
    config: TeamConfiguration
  ): { specialist: BaseSnowAgent | null; type: string; reason: string } {
    const skillMapping = this.skillMappings.get(skill.type);
    if (!skillMapping) {
      return { specialist: null, type: '', reason: 'No skill mapping available' };
    }

    // Try fallback types
    for (const fallbackType of skillMapping.fallbackTypes) {
      if (this.isSpecialistAvailable(fallbackType)) {
        const specialist = this.instantiateSpecialist(fallbackType);
        if (specialist) {
          return {
            specialist,
            type: fallbackType,
            reason: `Primary specialist ${skill.type} not available`
          };
        }
      }
    }

    // Try existing team members with overlapping skills
    for (const [teamMemberType, teamMember] of currentTeam) {
      if (teamMember.canHandle(skill.type, skill.complexity) > 0.3) {
        return {
          specialist: teamMember,
          type: teamMemberType,
          reason: `Existing team member can handle ${skill.type} with lower efficiency`
        };
      }
    }

    return { specialist: null, type: '', reason: 'No fallback options available' };
  }

  /**
   * Get candidate specialist types based on skill complexity
   */
  private getCandidateTypes(skill: SkillSet, mapping: SkillMapping): string[] {
    const complexityMapping = mapping.complexityMapping[skill.complexity] || [];
    
    if (complexityMapping.length > 0) {
      return complexityMapping;
    }
    
    // Default to primary specialist types
    return mapping.specialistTypes;
  }

  /**
   * Evaluate candidate specialists
   */
  private async evaluateCandidates(
    candidateTypes: string[],
    skill: SkillSet,
    currentTeam: Map<string, BaseSnowAgent>,
    config: TeamConfiguration
  ): Promise<CandidateEvaluation[]> {
    const candidates: CandidateEvaluation[] = [];

    for (const candidateType of candidateTypes) {
      if (!this.isSpecialistAvailable(candidateType)) {
        continue;
      }

      const evaluation = await this.evaluateCandidate(
        candidateType,
        skill,
        currentTeam,
        config
      );

      if (evaluation.score >= config.performanceThreshold) {
        candidates.push(evaluation);
      }
    }

    return candidates.sort((a, b) => b.score - a.score);
  }

  /**
   * Evaluate individual candidate
   */
  private async evaluateCandidate(
    candidateType: string,
    skill: SkillSet,
    currentTeam: Map<string, BaseSnowAgent>,
    config: TeamConfiguration
  ): Promise<CandidateEvaluation> {
    const performance = this.specialistPool.performance.get(candidateType);
    const capacity = this.specialistPool.capacity.get(candidateType);
    
    let score = 0;
    const factors: Record<string, number> = {};

    // Skill match score (40%)
    const skillMatchScore = this.calculateSkillMatch(candidateType, skill);
    factors.skillMatch = skillMatchScore;
    score += skillMatchScore * 0.4;

    // Performance score (25%)
    if (performance) {
      const performanceScore = (performance.successRate + 
                              (performance.complexityRating / 5) + 
                              Math.min(performance.totalTasksCompleted / 100, 1)) / 3;
      factors.performance = performanceScore;
      score += performanceScore * 0.25;
    }

    // Availability score (20%)
    if (capacity) {
      const availabilityScore = Math.max(0, 
        (capacity.maxConcurrent - capacity.currentLoad) / capacity.maxConcurrent
      );
      factors.availability = availabilityScore;
      score += availabilityScore * 0.2;
    }

    // Team synergy score (10%)
    const synergyScore = this.calculateTeamSynergy(candidateType, currentTeam);
    factors.synergy = synergyScore;
    score += synergyScore * 0.1;

    // Diversity bonus (5%)
    const diversityScore = this.calculateDiversityBonus(candidateType, currentTeam);
    factors.diversity = diversityScore;
    score += diversityScore * 0.05;

    return {
      type: candidateType,
      score,
      factors,
      estimatedTime: skill.estimatedTime,
      riskLevel: this.assessCandidateRisk(candidateType, skill)
    };
  }

  /**
   * Select best candidate from evaluations
   */
  private selectBestCandidate(
    candidates: CandidateEvaluation[],
    skill: SkillSet,
    config: TeamConfiguration
  ): CandidateEvaluation | null {
    if (candidates.length === 0) {
      return null;
    }

    // For critical skills, prefer higher performance even if slightly less available
    if (skill.importance === 'primary' && skill.complexity === 'high') {
      return candidates.find(c => c.factors.performance > 0.8) || candidates[0];
    }

    // For secondary skills, prefer availability
    if (skill.importance === 'secondary') {
      return candidates.find(c => c.factors.availability > 0.7) || candidates[0];
    }

    // Default: highest overall score
    return candidates[0];
  }

  /**
   * Instantiate specialist instance
   */
  private instantiateSpecialist(specialistType: string): BaseSnowAgent | null {
    const SpecialistClass = this.specialistPool.available.get(specialistType);
    if (SpecialistClass) {
      const instance = new SpecialistClass();
      this.specialistPool.active.set(`${specialistType}_${Date.now()}`, instance);
      return instance;
    }
    return null;
  }

  /**
   * Check if specialist type is available
   */
  private isSpecialistAvailable(specialistType: string): boolean {
    const capacity = this.specialistPool.capacity.get(specialistType);
    return capacity ? capacity.currentLoad < capacity.maxConcurrent : false;
  }

  /**
   * Apply load balancing to team
   */
  private async applyLoadBalancing(
    team: Map<string, BaseSnowAgent>,
    config: TeamConfiguration
  ): Promise<void> {
    // Calculate current load distribution
    const loadDistribution = new Map<string, number>();
    
    team.forEach((specialist, skillType) => {
      const capacity = this.specialistPool.capacity.get(skillType);
      if (capacity) {
        const loadPercentage = capacity.currentLoad / capacity.maxConcurrent;
        loadDistribution.set(skillType, loadPercentage);
      }
    });

    // If load is heavily skewed, consider redistributing
    const maxLoad = Math.max(...loadDistribution.values());
    const minLoad = Math.min(...loadDistribution.values());
    
    if (maxLoad - minLoad > 0.5) { // 50% difference
      this.logger.warn('Load imbalance detected', {
        maxLoad,
        minLoad,
        difference: maxLoad - minLoad
      });
      
      // Could implement load redistribution logic here
      // For now, just log the warning
    }
  }

  /**
   * Update capacity tracking
   */
  private updateCapacity(specialistType: string, action: 'allocate' | 'release'): void {
    const capacity = this.specialistPool.capacity.get(specialistType);
    if (capacity) {
      if (action === 'allocate') {
        capacity.currentLoad++;
      } else {
        capacity.currentLoad = Math.max(0, capacity.currentLoad - 1);
      }
      this.specialistPool.capacity.set(specialistType, capacity);
    }
  }

  /**
   * Calculate skill match score
   */
  private calculateSkillMatch(candidateType: string, skill: SkillSet): number {
    // This would typically use the specialist's canHandle method
    const skillMapping = this.skillMappings.get(skill.type);
    if (!skillMapping) return 0;
    
    if (skillMapping.specialistTypes.includes(candidateType)) {
      return 1.0; // Perfect match
    }
    
    if (skillMapping.fallbackTypes.includes(candidateType)) {
      return 0.7; // Good fallback match
    }
    
    return 0.3; // Minimal capability
  }

  /**
   * Calculate team synergy score
   */
  private calculateTeamSynergy(
    candidateType: string,
    currentTeam: Map<string, BaseSnowAgent>
  ): number {
    // Teams with complementary skills have higher synergy
    const complementaryTypes = {
      'data-specialist': ['reporting-specialist', 'integration-specialist'],
      'integration-specialist': ['data-specialist', 'security-specialist'],
      'automation-specialist': ['integration-specialist', 'data-specialist'],
      'reporting-specialist': ['data-specialist'],
      'security-specialist': ['integration-specialist', 'data-specialist']
    };

    const complementary = complementaryTypes[candidateType as keyof typeof complementaryTypes] || [];
    let synergyScore = 0.5; // Base score
    
    currentTeam.forEach((_, teamMemberType) => {
      if (complementary.includes(teamMemberType)) {
        synergyScore += 0.2;
      }
    });
    
    return Math.min(synergyScore, 1.0);
  }

  /**
   * Calculate diversity bonus
   */
  private calculateDiversityBonus(
    candidateType: string,
    currentTeam: Map<string, BaseSnowAgent>
  ): number {
    // Bonus for adding different specialist types
    const existingTypes = Array.from(currentTeam.keys());
    return existingTypes.includes(candidateType) ? 0 : 1.0;
  }

  /**
   * Assess candidate risk level
   */
  private assessCandidateRisk(
    candidateType: string,
    skill: SkillSet
  ): 'low' | 'medium' | 'high' {
    const performance = this.specialistPool.performance.get(candidateType);
    
    if (!performance) return 'high';
    
    if (performance.successRate > 0.9 && performance.totalTasksCompleted > 50) {
      return 'low';
    }
    
    if (performance.successRate > 0.7 && performance.totalTasksCompleted > 10) {
      return 'medium';
    }
    
    return 'high';
  }

  /**
   * Initialize specialist pool
   */
  private initializeSpecialistPool(): SpecialistPool {
    const available = new Map<string, typeof BaseSnowAgent>();
    const capacity = new Map<string, CapacityInfo>();
    const performance = new Map<string, PerformanceMetrics>();

    // Register available specialists
    available.set('data-specialist', DataSpecialistAgent as any);
    available.set('integration-specialist', IntegrationSpecialistAgent as any);
    available.set('automation-specialist', AutomationSpecialistAgent as any);
    available.set('reporting-specialist', ReportingSpecialistAgent as any);
    available.set('security-specialist', SecuritySpecialistAgent as any);

    // Initialize capacity information
    available.forEach((_, type) => {
      capacity.set(type, {
        maxConcurrent: 3,
        currentLoad: 0,
        reservedSlots: 0
      });
      
      performance.set(type, {
        averageExecutionTime: 300000, // 5 minutes
        successRate: 0.85,
        totalTasksCompleted: 0,
        lastActivity: new Date(),
        complexityRating: 3
      });
    });

    return {
      available,
      active: new Map(),
      capacity,
      performance
    };
  }

  /**
   * Initialize skill mappings
   */
  private initializeSkillMappings(): void {
    this.skillMappings.set('data_modeling', {
      skillType: 'data_modeling',
      specialistTypes: ['data-specialist'],
      fallbackTypes: ['integration-specialist'],
      complexityMapping: {
        'low': ['data-specialist'],
        'medium': ['data-specialist'],
        'high': ['data-specialist', 'integration-specialist']
      }
    });

    this.skillMappings.set('api_integration', {
      skillType: 'api_integration',
      specialistTypes: ['integration-specialist'],
      fallbackTypes: ['data-specialist'],
      complexityMapping: {
        'low': ['integration-specialist'],
        'medium': ['integration-specialist'],
        'high': ['integration-specialist', 'security-specialist']
      }
    });

    this.skillMappings.set('workflow_design', {
      skillType: 'workflow_design',
      specialistTypes: ['automation-specialist'],
      fallbackTypes: ['integration-specialist'],
      complexityMapping: {
        'low': ['automation-specialist'],
        'medium': ['automation-specialist'],
        'high': ['automation-specialist', 'integration-specialist']
      }
    });

    this.skillMappings.set('report_creation', {
      skillType: 'report_creation',
      specialistTypes: ['reporting-specialist'],
      fallbackTypes: ['data-specialist'],
      complexityMapping: {
        'low': ['reporting-specialist'],
        'medium': ['reporting-specialist'],
        'high': ['reporting-specialist', 'data-specialist']
      }
    });

    this.skillMappings.set('security_configuration', {
      skillType: 'security_configuration',
      specialistTypes: ['security-specialist'],
      fallbackTypes: ['integration-specialist'],
      complexityMapping: {
        'low': ['security-specialist'],
        'medium': ['security-specialist'],
        'high': ['security-specialist', 'integration-specialist']
      }
    });
  }

  /**
   * Get team assembly statistics
   */
  getAssemblyStatistics(): any {
    return {
      availableSpecialists: this.specialistPool.available.size,
      activeSpecialists: this.specialistPool.active.size,
      capacityUtilization: this.calculateCapacityUtilization(),
      skillMappings: this.skillMappings.size,
      performanceMetrics: this.getAggregatedPerformance()
    };
  }

  /**
   * Calculate overall capacity utilization
   */
  private calculateCapacityUtilization(): number {
    let totalCapacity = 0;
    let totalUsed = 0;
    
    this.specialistPool.capacity.forEach(capacity => {
      totalCapacity += capacity.maxConcurrent;
      totalUsed += capacity.currentLoad;
    });
    
    return totalCapacity > 0 ? totalUsed / totalCapacity : 0;
  }

  /**
   * Get aggregated performance metrics
   */
  private getAggregatedPerformance(): any {
    const performances = Array.from(this.specialistPool.performance.values());
    
    if (performances.length === 0) {
      return { averageSuccessRate: 0, totalTasksCompleted: 0 };
    }
    
    const avgSuccessRate = performances.reduce((sum, p) => sum + p.successRate, 0) / performances.length;
    const totalTasks = performances.reduce((sum, p) => sum + p.totalTasksCompleted, 0);
    
    return {
      averageSuccessRate: avgSuccessRate,
      totalTasksCompleted: totalTasks
    };
  }
}

interface CandidateEvaluation {
  type: string;
  score: number;
  factors: Record<string, number>;
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}
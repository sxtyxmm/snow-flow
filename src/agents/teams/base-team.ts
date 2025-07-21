/**
 * Base classes for specialized agent teams
 */
import { 
  TeamSpecification, 
  TeamResult, 
  TeamMember, 
  TeamCoordinationStrategy,
  AgentCapability,
  SpecializationProfile
} from './team-types';
import { ServiceNowAgentConfig } from '../../types/servicenow.types';

/**
 * Abstract base class for all specialized agents
 */
export abstract class BaseSnowAgent {
  protected id: string;
  protected name: string;
  protected role: string;
  protected capabilities: AgentCapability[];
  protected specialization: SpecializationProfile;
  protected config: ServiceNowAgentConfig;
  protected status: 'available' | 'busy' | 'offline' = 'available';

  constructor(
    id: string,
    name: string,
    role: string,
    capabilities: AgentCapability[],
    specialization: SpecializationProfile,
    config: ServiceNowAgentConfig
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.specialization = specialization;
    this.config = config;
  }

  // Abstract methods that must be implemented by specialized agents
  abstract analyzeRequirements(requirements: any): Promise<any>;
  abstract execute(specification: any): Promise<TeamResult>;
  
  // Common agent methods
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getRole(): string {
    return this.role;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  getStatus(): string {
    return this.status;
  }

  setStatus(status: 'available' | 'busy' | 'offline'): void {
    this.status = status;
  }

  // Check if agent can handle a specific requirement
  canHandle(requirement: string): boolean {
    return this.specialization.primary.includes(requirement) ||
           this.specialization.secondary.includes(requirement);
  }

  // Get proficiency for a specific capability
  getProficiency(capability: string): number {
    const cap = this.capabilities.find(c => c.name === capability);
    return cap ? cap.proficiency : 0;
  }

  // Common error handling
  protected handleError(error: any): TeamResult {
    console.error(`Agent ${this.name} encountered error:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      metadata: {
        duration: 0,
        performance: null,
        quality: null
      }
    };
  }

  // Common validation
  protected validateRequirements(requirements: any): boolean {
    return requirements !== null && requirements !== undefined;
  }
}

/**
 * Abstract base class for specialized teams
 */
export abstract class BaseTeam {
  protected id: string;
  protected name: string;
  protected architect: BaseSnowAgent;
  protected specialists: BaseSnowAgent[];
  protected coordinationStrategy: TeamCoordinationStrategy;
  protected config: ServiceNowAgentConfig;

  constructor(
    id: string,
    name: string,
    architect: BaseSnowAgent,
    specialists: BaseSnowAgent[],
    coordinationStrategy: TeamCoordinationStrategy,
    config: ServiceNowAgentConfig
  ) {
    this.id = id;
    this.name = name;
    this.architect = architect;
    this.specialists = specialists;
    this.coordinationStrategy = coordinationStrategy;
    this.config = config;
  }

  // Abstract methods for team-specific implementation
  abstract analyzeRequirements(requirements: any): Promise<TeamSpecification>;
  abstract executeTask(specification: TeamSpecification): Promise<TeamResult>;

  // Common team methods
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getArchitect(): BaseSnowAgent {
    return this.architect;
  }

  getSpecialists(): BaseSnowAgent[] {
    return this.specialists;
  }

  getAllMembers(): BaseSnowAgent[] {
    return [this.architect, ...this.specialists];
  }

  // Find best agent for a specific task
  findBestAgent(requirement: string): BaseSnowAgent {
    const allAgents = this.getAllMembers();
    
    // Sort by proficiency for the requirement
    const sortedAgents = allAgents
      .filter(agent => agent.canHandle(requirement))
      .sort((a, b) => b.getProficiency(requirement) - a.getProficiency(requirement));

    return sortedAgents[0] || this.architect;
  }

  // Execute task with coordination strategy
  async coordinatedExecution(specification: TeamSpecification): Promise<TeamResult> {
    try {
      this.setAllAgentsStatus('busy');
      
      const startTime = Date.now();
      let result: TeamResult;

      switch (this.coordinationStrategy.type) {
        case 'sequential':
          result = await this.executeSequential(specification);
          break;
        case 'parallel':
          result = await this.executeParallel(specification);
          break;
        case 'hybrid':
          result = await this.executeHybrid(specification);
          break;
        default:
          result = await this.executeSequential(specification);
      }

      const duration = Date.now() - startTime;
      if (result.metadata) {
        result.metadata.duration = duration;
      }

      this.setAllAgentsStatus('available');
      return result;

    } catch (error) {
      this.setAllAgentsStatus('available');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: 0,
          performance: null,
          quality: null
        }
      };
    }
  }

  // Sequential execution strategy
  protected async executeSequential(specification: TeamSpecification): Promise<TeamResult> {
    // First, architect analyzes and creates plan
    const architectPlan = await this.architect.analyzeRequirements(specification.requirements);
    
    // Then, execute specialists in order
    let currentResult = architectPlan;
    for (const specialist of this.specialists) {
      currentResult = await specialist.execute(currentResult);
      if (!currentResult.success) {
        return currentResult;
      }
    }

    return currentResult;
  }

  // Parallel execution strategy
  protected async executeParallel(specification: TeamSpecification): Promise<TeamResult> {
    // Architect creates plan
    const architectPlan = await this.architect.analyzeRequirements(specification.requirements);
    
    // Execute specialists in parallel
    const specialistPromises = this.specialists.map(specialist => 
      specialist.execute(architectPlan)
    );
    
    const results = await Promise.all(specialistPromises);
    
    // Combine results
    return this.combineResults(results);
  }

  // Hybrid execution strategy
  protected async executeHybrid(specification: TeamSpecification): Promise<TeamResult> {
    // Implement based on dependencies
    const architectPlan = await this.architect.analyzeRequirements(specification.requirements);
    
    // Execute based on dependency graph
    return await this.executeDependencyGraph(architectPlan);
  }

  // Combine multiple specialist results
  protected combineResults(results: TeamResult[]): TeamResult {
    const failed = results.find(r => !r.success);
    if (failed) {
      return failed;
    }

    return {
      success: true,
      artifact: results.map(r => r.artifact),
      metadata: {
        duration: Math.max(...results.map(r => r.metadata?.duration || 0)),
        performance: results.map(r => r.metadata?.performance),
        quality: results.map(r => r.metadata?.quality)
      }
    };
  }

  // Execute based on dependency graph
  protected async executeDependencyGraph(plan: any): Promise<TeamResult> {
    // Simplified implementation - can be enhanced with proper dependency resolution
    const dependencies = this.coordinationStrategy.dependencies;
    const executed = new Set<string>();
    const results: TeamResult[] = [];

    // Execute agents in dependency order
    for (const specialist of this.specialists) {
      const agentId = specialist.getId();
      const deps = dependencies.filter(d => d.to === agentId);
      
      // Wait for dependencies
      const depsSatisfied = deps.every(d => executed.has(d.from));
      
      if (depsSatisfied) {
        const result = await specialist.execute(plan);
        results.push(result);
        executed.add(agentId);
        
        if (!result.success) {
          return result;
        }
      }
    }

    return this.combineResults(results);
  }

  // Utility methods
  private setAllAgentsStatus(status: 'available' | 'busy' | 'offline'): void {
    this.architect.setStatus(status);
    this.specialists.forEach(agent => agent.setStatus(status));
  }

  // Get team status
  getTeamStatus(): { architect: string; specialists: { name: string; status: string }[] } {
    return {
      architect: this.architect.getStatus(),
      specialists: this.specialists.map(s => ({
        name: s.getName(),
        status: s.getStatus()
      }))
    };
  }

  // Validate team readiness
  isTeamReady(): boolean {
    return this.getAllMembers().every(agent => agent.getStatus() === 'available');
  }
}

/**
 * Team factory for creating specialized teams
 */
export class TeamFactory {
  static createTeam(
    type: 'widget' | 'flow' | 'application' | 'generic',
    config: ServiceNowAgentConfig
  ): BaseTeam {
    switch (type) {
      case 'widget':
        // Will be implemented in widget team files
        throw new Error('Widget team factory not implemented yet');
      case 'flow':
        // Will be implemented in flow team files
        throw new Error('Flow team factory not implemented yet');
      case 'application':
        // Will be implemented in application team files
        throw new Error('Application team factory not implemented yet');
      default:
        throw new Error(`Unknown team type: ${type}`);
    }
  }
}
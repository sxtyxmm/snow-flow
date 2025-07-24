/**
 * ServiceNow Queen Agent Integration Example
 * 
 * Shows how to integrate the Queen Agent with existing snow-flow CLI
 */

import { createServiceNowQueen, ServiceNowQueen } from '../../src/queen/index.js';
import { Logger } from '../../src/utils/logger';

/**
 * Example: Queen Agent integration for snow-flow CLI
 */
export class QueenIntegration {
  public queen: ServiceNowQueen;
  private logger = new Logger('QueenIntegration');

  constructor(options: {
    debugMode?: boolean;
    memoryPath?: string;
  } = {}) {
    this.queen = createServiceNowQueen({
      debugMode: options.debugMode ?? true,
      memoryPath: options.memoryPath,
      maxConcurrentAgents: 5
    });
  }

  /**
   * Replace existing swarm command with Queen intelligence
   */
  async executeSwarmObjective(objective: string, options: any = {}): Promise<any> {
    this.logger.info('🐝 Queen Agent taking over swarm coordination', { objective, options });
    
    try {
      // Queen analyzes, spawns agents, coordinates, and deploys
      const result = await this.queen.executeObjective(objective);
      
      if (options.monitor) {
        this.logHiveMindStatus();
      }
      
      return {
        success: true,
        result,
        queen_managed: true,
        hive_mind_status: this.queen.getHiveMindStatus()
      };
      
    } catch (error) {
      this.logger.error('❌ Queen Agent execution failed', error);
      return {
        success: false,
        error: (error as Error).message,
        fallback_required: true
      };
    }
  }

  /**
   * Replace SPARC team commands with dynamic agent spawning
   */
  async executeDynamicTeam(taskType: 'widget' | 'flow' | 'app', objective: string): Promise<any> {
    this.logger.info(`🎯 Queen spawning optimal ${taskType} team`, { taskType, objective });
    
    // Queen automatically spawns optimal agents based on task analysis
    const result = await this.queen.executeObjective(objective);
    
    return {
      task_type: taskType,
      objective,
      result,
      agents_spawned: result.agentResults?.length || 0,
      deployment_success: result.deploymentResult?.success || false
    };
  }

  /**
   * Memory-driven development workflow
   */
  async memoryDrivenWorkflow(objective: string): Promise<any> {
    this.logger.info('💾 Using Queen memory for optimal workflow', { objective });
    
    // Queen uses memory to find similar past successes
    const result = await this.queen.executeObjective(objective);
    
    // Export updated memory for persistence
    const memory = this.queen.exportMemory();
    
    return {
      result,
      memory_insights: JSON.parse(memory),
      learning_applied: true
    };
  }

  /**
   * Real-time monitoring integration
   */
  logHiveMindStatus(): void {
    const status = this.queen.getHiveMindStatus();
    
    this.logger.info('\n🐝 HIVE-MIND STATUS 🐝', {
      activeTasks: status.activeTasks,
      activeAgents: status.activeAgents,
      learnedPatterns: status.memoryStats.patterns,
      storedArtifacts: status.memoryStats.artifacts,
      learningInsights: status.memoryStats.learnings
    });
    
    if (status.factoryStats.agentTypeCounts) {
      this.logger.info('\n👥 AGENT BREAKDOWN:', { agentTypeCounts: status.factoryStats.agentTypeCounts });
    }
    
    this.logger.debug('Hive-mind status display completed');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('🛑 Shutting down Queen Agent');
    await this.queen.shutdown();
  }
}

/**
 * CLI Integration Examples
 */

// Example 1: Replace swarm command
export async function replaceSwarmCommand(objective: string, options: any): Promise<any> {
  const queenIntegration = new QueenIntegration({
    debugMode: options.debug || false
  });
  
  try {
    return await queenIntegration.executeSwarmObjective(objective, options);
  } finally {
    await queenIntegration.shutdown();
  }
}

// Example 2: Replace team commands  
export async function replaceTeamCommand(teamType: string, objective: string): Promise<any> {
  const queenIntegration = new QueenIntegration();
  
  const taskType = teamType === 'widget' ? 'widget' :
                   teamType === 'flow' ? 'flow' :
                   teamType === 'app' ? 'app' : 'widget';
  
  try {
    return await queenIntegration.executeDynamicTeam(taskType, objective);
  } finally {
    await queenIntegration.shutdown();
  }
}

// Example 3: Memory-driven SPARC mode
export async function memoryDrivenSparc(objective: string): Promise<any> {
  const queenIntegration = new QueenIntegration({
    debugMode: true
  });
  
  try {
    return await queenIntegration.memoryDrivenWorkflow(objective);
  } finally {
    await queenIntegration.shutdown();
  }
}

/**
 * Usage in snow-flow CLI commands:
 * 
 * // OLD:
 * ./snow-flow swarm "create widget" --strategy development --mode hierarchical
 * 
 * // NEW:
 * ./snow-flow queen "create widget" --monitor
 * 
 * // OLD:
 * ./snow-flow sparc team widget "create dashboard"
 * 
 * // NEW: 
 * ./snow-flow queen "create dashboard" --type widget
 * 
 * // OLD:
 * ./snow-flow sparc run coder "implement feature"
 * 
 * // NEW:
 * ./snow-flow queen "implement feature" --memory-driven
 */

/**
 * Example CLI integration in existing command handlers:
 */

export const CLI_INTEGRATION_EXAMPLES = {
  
  // Replace complex swarm orchestration
  async swarmReplacement(args: string[], options: any) {
    const objective = args.join(' ');
    this.logger.info('🐝 Queen Agent replacing swarm orchestration', { objective, options });
    
    return await replaceSwarmCommand(objective, options);
  },
  
  // Replace SPARC team system
  async teamReplacement(teamType: string, args: string[]) {
    const objective = args.join(' ');
    this.logger.info(`🎯 Queen Agent replacing ${teamType} team`, { teamType, objective });
    
    return await replaceTeamCommand(teamType, objective);
  },
  
  // Single command does everything
  async queenCommand(args: string[], options: any) {
    const objective = args.join(' ');
    this.logger.info('👑 Queen Agent taking full control', { objective, options });
    
    const queenIntegration = new QueenIntegration({
      debugMode: options.debug
    });
    
    try {
      const result = await queenIntegration.executeSwarmObjective(objective, options);
      
      if (options.status) {
        queenIntegration.logHiveMindStatus();
      }
      
      return result;
      
    } finally {
      await queenIntegration.shutdown();
    }
  }
};

/**
 * Backward compatibility wrapper
 */
export function createBackwardCompatibleQueen(): {
  executeSwarm: (objective: string, options?: any) => Promise<any>;
  executeTeam: (type: string, objective: string) => Promise<any>;
  executeSparc: (mode: string, objective: string) => Promise<any>;
  getStatus: () => any;
} {
  const queenIntegration = new QueenIntegration();
  
  return {
    executeSwarm: (objective: string, options: any = {}) => 
      queenIntegration.executeSwarmObjective(objective, options),
    
    executeTeam: (type: string, objective: string) =>
      queenIntegration.executeDynamicTeam(type as any, objective),
    
    executeSparc: (mode: string, objective: string) =>
      queenIntegration.memoryDrivenWorkflow(objective),
    
    getStatus: () => queenIntegration.queen.getHiveMindStatus()
  };
}

export default QueenIntegration;
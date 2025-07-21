/**
 * Team Coordination Framework
 * 
 * A comprehensive framework for managing communication, dependencies, and quality gates
 * between specialized agents in ServiceNow development workflows.
 */

// Core coordination engine
export { CoordinationEngine } from './coordination-engine';

// Shared memory management
export { SharedMemoryManager } from './shared-memory';

// Task dependency management
export { TaskDependencyGraph } from './task-dependencies';

// Quality gates system
export { 
  QualityGateManager,
  CodeQualityGate,
  SecurityGate,
  PerformanceGate,
  ServiceNowGate,
  BusinessLogicGate
} from './quality-gates';

// Execution patterns
export {
  ExecutionPattern,
  SequentialExecutionPattern,
  ParallelExecutionPattern,
  HybridExecutionPattern,
  AdaptiveExecutionPattern
} from './execution-patterns';

// Progress monitoring
export { ProgressMonitor } from './progress-monitor';

// Type definitions
export * from './types';

// Convenience factory functions
export {
  createCoordinationEngine,
  createStandardQualityGates,
  createServiceNowQualityGates,
  createProgressListener
} from './factory';

/**
 * Main coordination framework entry point
 * 
 * Example usage:
 * ```typescript
 * import { CoordinationFramework } from './coordination';
 * 
 * const framework = new CoordinationFramework({
 *   maxConcurrentTasks: 5,
 *   enableQualityGates: true,
 *   executionPattern: 'hybrid'
 * });
 * 
 * const result = await framework.coordinate(team, specification);
 * ```
 */
export class CoordinationFramework {
  private engine: CoordinationEngine;
  
  constructor(config: Partial<import('./types').CoordinationConfig> = {}) {
    this.engine = new CoordinationEngine(config);
  }

  /**
   * Coordinate team execution of a task specification
   */
  async coordinate(
    team: import('./types').BaseTeam, 
    specification: import('./types').TaskSpecification
  ): Promise<import('./types').CoordinationResult> {
    return await this.engine.coordinateTeamExecution(team, specification);
  }

  /**
   * Get execution plan without executing
   */
  async plan(
    specification: import('./types').TaskSpecification
  ): Promise<import('./types').ExecutionPlan> {
    return await this.engine.getExecutionPlan(specification);
  }

  /**
   * Access the shared memory manager
   */
  getSharedMemory(): SharedMemoryManager {
    return this.engine.getSharedMemory();
  }

  /**
   * Access the quality gate manager
   */
  getQualityGates(): QualityGateManager {
    return this.engine.getQualityGateManager();
  }

  /**
   * Pause execution
   */
  async pause(): Promise<void> {
    return await this.engine.pauseExecution();
  }

  /**
   * Resume execution
   */
  async resume(): Promise<void> {
    return await this.engine.resumeExecution();
  }

  /**
   * Abort execution
   */
  async abort(reason: string): Promise<void> {
    return await this.engine.abortExecution(reason);
  }

  /**
   * Subscribe to coordination events
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.engine.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.engine.off(event, listener);
  }
}
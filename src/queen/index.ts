/**
 * ServiceNow Queen Agent - Hive-Mind Intelligence System
 * 
 * Simple, elegant coordination system following claude-flow philosophy
 * 
 * @example
 * ```typescript
 * import { ServiceNowQueen } from './queen';
 * 
 * const queen = new ServiceNowQueen({
 *   debugMode: true,
 *   maxConcurrentAgents: 5
 * });
 * 
 * // Execute any ServiceNow objective
 * const result = await queen.executeObjective("create incident dashboard with charts");
 * ```
 */

// Main Queen Agent
export { ServiceNowQueen, QueenConfig } from './servicenow-queen';

// Core components
export { QueenMemorySystem } from './queen-memory';
export { NeuralLearning } from './neural-learning';
export { AgentFactory } from './agent-factory';

// Types
export {
  ServiceNowTask,
  Agent,
  AgentType,
  TaskAnalysis,
  DeploymentPattern,
  QueenMemory,
  AgentMessage,
  ServiceNowArtifact
} from './types';

// Import for internal use
import { ServiceNowQueen } from './servicenow-queen';

/**
 * Quick start factory function
 */
export function createServiceNowQueen(options: {
  memoryPath?: string;
  debugMode?: boolean;
  maxConcurrentAgents?: number;
} = {}) {
  return new ServiceNowQueen({
    debugMode: options.debugMode ?? process.env.NODE_ENV === 'development',
    memoryPath: options.memoryPath,
    maxConcurrentAgents: options.maxConcurrentAgents ?? 5
  });
}

/**
 * Available agent types for dynamic spawning
 */
export const AVAILABLE_AGENT_TYPES = [
  'widget-creator',
  'flow-builder', 
  'script-writer',
  'app-architect',
  'integration-specialist',
  'catalog-manager',
  'researcher',
  'tester'
] as const;

/**
 * Common ServiceNow task patterns
 */
export const TASK_PATTERNS = {
  WIDGET: {
    keywords: ['widget', 'dashboard', 'chart', 'display', 'portal'],
    complexity_factors: ['chart', 'responsive', 'data_sources', 'real_time']
  },
  FLOW: {
    keywords: ['flow', 'workflow', 'process', 'approval', 'automation'],
    complexity_factors: ['approval_steps', 'integration', 'conditions', 'notifications']
  },
  APPLICATION: {
    keywords: ['application', 'app', 'system', 'module', 'solution'],
    complexity_factors: ['tables', 'business_rules', 'ui_policies', 'integrations']
  },
  INTEGRATION: {
    keywords: ['integration', 'api', 'connect', 'sync', 'import', 'export'],
    complexity_factors: ['external_apis', 'data_transformation', 'authentication', 'error_handling']
  }
} as const;
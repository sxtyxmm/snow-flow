/**
 * ServiceNow Queen Agent Types
 * Simple, elegant type definitions for the hive-mind
 */

export interface ServiceNowTask {
  id: string;
  objective: string;
  type: 'widget' | 'flow' | 'script' | 'application' | 'integration' | 'unknown';
  artifacts: string[];
  status: 'analyzing' | 'planning' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface Agent {
  id: string;
  type: AgentType;
  status: 'idle' | 'working' | 'completed' | 'failed';
  task?: string;
  capabilities: string[];
  mcpTools: string[];
}

export type AgentType = 
  | 'widget-creator'
  | 'flow-builder'
  | 'script-writer'
  | 'app-architect'
  | 'integration-specialist'
  | 'catalog-manager'
  | 'researcher'
  | 'tester';

export interface DeploymentPattern {
  taskType: string;
  successRate: number;
  agentSequence: AgentType[];
  mcpSequence: string[];
  avgDuration: number;
  lastUsed: Date;
}

export interface QueenMemory {
  patterns: DeploymentPattern[];
  artifacts: Map<string, any>;
  agentHistory: Map<string, Agent[]>;
  learnings: Map<string, string>;
}

export interface TaskAnalysis {
  type: ServiceNowTask['type'];
  requiredAgents: AgentType[];
  estimatedComplexity: number;
  suggestedPattern?: DeploymentPattern;
  dependencies: string[];
}

export interface AgentMessage {
  from: string;
  to: string;
  type: 'task' | 'result' | 'error' | 'query' | 'coordination';
  content: any;
  timestamp: Date;
}

export interface ServiceNowArtifact {
  type: 'widget' | 'flow' | 'script' | 'table' | 'catalog_item';
  name: string;
  sys_id?: string;
  config: any;
  dependencies: string[];
}
import { SnowAgent, Task, TaskStatus } from '../types/snow-flow.types';

export interface CoordinationResult {
  success: boolean;
  results: Record<string, any>;
  metrics: ExecutionMetrics;
  errors: Error[];
  warnings: string[];
}

export interface ExecutionMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalExecutionTime: number;
  averageTaskTime: number;
  concurrentTasks: number;
}

export interface TaskSpecification {
  name: string;
  description: string;
  tasks: TaskDefinition[];
  sharedContext: Record<string, any>;
  qualityGates: QualityGateConfig[];
  executionPattern?: 'sequential' | 'parallel' | 'hybrid';
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  agentType: string;
  requirements: TaskRequirements;
  dependencies: string[];
  outputs: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration?: number;
  maxRetries?: number;
}

export interface TaskRequirements {
  inputs: Record<string, any>;
  outputs: string[];
  capabilities: string[];
  resources?: ResourceRequirement[];
  constraints?: Constraint[];
}

export interface ResourceRequirement {
  type: 'memory' | 'compute' | 'servicenow_access' | 'external_api';
  amount?: number;
  metadata?: Record<string, any>;
}

export interface Constraint {
  type: 'time' | 'resource' | 'dependency' | 'quality';
  value: any;
  description: string;
}

export interface TaskNode {
  id: string;
  agent: SnowAgent;
  requirements: TaskRequirements;
  status: TaskStatus;
  result: any;
  error?: Error;
  startTime?: Date;
  endTime?: Date;
  retryCount: number;
  qualityGateResults?: QualityGateResult[];
}

export interface AgentSubscriber {
  agent: SnowAgent;
  callback: (key: string, value: any) => Promise<void>;
}

export interface QualityGateConfig {
  name: string;
  taskIds: string[];
  gates: QualityGate[];
}

export interface QualityGate {
  name: string;
  blocking: boolean;
  validate(result: any): Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  score?: number;
  error?: string;
  warnings?: string[];
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface QualityGateResult {
  gateName: string;
  passed: boolean;
  blocking: boolean;
  validations: ValidationResult[];
  overallScore?: number;
  executionTime: number;
}

export interface ProgressStatus {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentage: number;
  estimated_completion?: Date;
  currentPhase?: string;
  bottlenecks?: string[];
}

export interface ProgressListener {
  onProgress(event: string, data: any): void;
}

export interface ExecutionPlan {
  phases: ExecutionPhase[];
  totalEstimatedTime: number;
  criticalPath: string[];
  parallelizationOpportunities: ParallelGroup[];
}

export interface ExecutionPhase {
  id: string;
  type: 'sequential' | 'parallel';
  tasks: string[];
  estimatedDuration: number;
  dependencies: string[];
}

export interface ParallelGroup {
  tasks: string[];
  estimatedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BaseTeam {
  agents: Map<string, SnowAgent>;
  getAgent(id: string): SnowAgent | undefined;
  addAgent(agent: SnowAgent): void;
  removeAgent(id: string): void;
  getAvailableAgents(): SnowAgent[];
  getAgentsByType(type: string): SnowAgent[];
}

export interface MemoryValue {
  value: any;
  timestamp: number;
  version: number;
  metadata?: Record<string, any>;
}

export interface CoordinationConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  enableRetries: boolean;
  maxRetries: number;
  enableQualityGates: boolean;
  enableProgressMonitoring: boolean;
  executionPattern: 'sequential' | 'parallel' | 'hybrid' | 'auto';
  memoryTtl: number;
  errorRecoveryStrategy: 'abort' | 'continue' | 'retry';
}
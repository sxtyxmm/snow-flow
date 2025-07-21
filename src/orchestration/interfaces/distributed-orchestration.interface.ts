/**
 * Distributed Orchestration Interfaces
 * 
 * Complete interface definitions for the distributed orchestration system
 * that coordinates external Claude Code instances.
 */

// ========================================
// Core Types and Enums
// ========================================

export enum InstanceStatus {
  ACTIVE = 'active',
  IDLE = 'idle', 
  BUSY = 'busy',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
  UNREACHABLE = 'unreachable'
}

export enum ConsistencyLevel {
  EVENTUAL = 'eventual',
  STRONG = 'strong',
  WEAK = 'weak'
}

export enum OrchestrationMode {
  INTERNAL_ONLY = 'internal',
  EXTERNAL_ONLY = 'external', 
  HYBRID = 'hybrid',
  AUTO_BALANCE = 'auto'
}

export enum MCPXCommand {
  // Orchestration Commands
  ORCHESTRATE_SESSION_START = 'mcpx.orchestrate.session.start',
  ORCHESTRATE_SESSION_END = 'mcpx.orchestrate.session.end',
  ORCHESTRATE_TASK_ASSIGN = 'mcpx.orchestrate.task.assign',
  ORCHESTRATE_TASK_COMPLETE = 'mcpx.orchestrate.task.complete',
  
  // Coordination Commands  
  COORDINATE_STATE_SYNC = 'mcpx.coordinate.state.sync',
  COORDINATE_DEPENDENCY_RESOLVE = 'mcpx.coordinate.dependency.resolve',
  COORDINATE_QUALITY_GATE = 'mcpx.coordinate.quality.gate',
  
  // Distribution Commands
  DISTRIBUTE_TASK_SPLIT = 'mcpx.distribute.task.split',
  DISTRIBUTE_LOAD_BALANCE = 'mcpx.distribute.load.balance',
  DISTRIBUTE_RESULT_MERGE = 'mcpx.distribute.result.merge',
  
  // Health & Monitoring
  HEALTH_CHECK = 'mcpx.health.check',
  METRICS_REPORT = 'mcpx.metrics.report',
  STATUS_UPDATE = 'mcpx.status.update'
}

// ========================================
// Agent and Instance Definitions
// ========================================

export interface PerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  cpuUtilization: number;
  memoryUtilization: number;
  taskCompletionRate: number;
}

export interface AgentCapability {
  domain: 'servicenow' | 'development' | 'analysis' | 'security' | 'integration' | 'reporting';
  specialization: string[];
  proficiencyLevel: 'basic' | 'intermediate' | 'expert' | 'specialist';
  resourceRequirements: ResourceRequirement[];
  supportedMCPCommands: string[];
  maxConcurrentTasks: number;
}

export interface ResourceRequirement {
  type: 'memory' | 'compute' | 'servicenow_access' | 'external_api' | 'storage';
  amount?: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface ClaudeCodeInstance {
  id: string;
  endpoint: string;
  capabilities: AgentCapability[];
  status: InstanceStatus;
  metadata: {
    region: string;
    version: string;
    maxConcurrentTasks: number;
    specializations: string[];
    performanceMetrics: PerformanceMetrics;
    tags: Record<string, string>;
  };
  healthcheck: {
    lastSeen: Date;
    responseTime: number;
    errorRate: number;
    consecutiveFailures: number;
  };
  authentication: {
    apiKey?: string;
    certificate?: string;
    tokenEndpoint?: string;
  };
}

// ========================================
// MCPX Protocol Extensions
// ========================================

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface OrchestrationContext {
  sessionId: string;
  executionId: string;
  parentTaskId?: string;
  coordinatorInstance: string;
  sharedState: SharedStateReference;
  qualityGates: QualityGateConfig[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface CoordinationMetadata {
  dependencies: string[];
  synchronizationPoints: SyncPoint[];
  rollbackStrategy: RollbackStrategy;
  progressReporting: ProgressConfig;
  affinityRules: AffinityRule[];
}

export interface DistributionInfo {
  taskPartition: TaskPartition;
  loadBalancing: LoadBalancingStrategy;
  preferredRegions: string[];
  dataLocality: DataLocalityConfig;
}

export interface MCPXMessage extends MCPMessage {
  orchestration?: OrchestrationContext;
  coordination?: CoordinationMetadata;
  distribution?: DistributionInfo;
  timestamp: number;
  source: string;
  target?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface MCPXResponse {
  success: boolean;
  result?: any;
  error?: MCPXError;
  metadata?: {
    processingTime: number;
    instanceId: string;
    resourceUsage: ResourceUsage;
  };
}

export interface MCPXError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  suggestedRetryDelay?: number;
}

// ========================================
// Task Distribution System
// ========================================

export interface TaskSpecification {
  id: string;
  name: string;
  description: string;
  type: 'widget' | 'flow' | 'integration' | 'analysis' | 'deployment';
  requirements: TaskRequirements;
  dependencies: string[];
  outputs: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration?: number;
  maxRetries?: number;
  deadline?: Date;
  affinityRules?: AffinityRule[];
}

export interface TaskRequirements {
  capabilities: string[];
  resources: ResourceRequirement[];
  constraints: Constraint[];
  inputs: Record<string, any>;
  environment: EnvironmentRequirement[];
}

export interface EnvironmentRequirement {
  type: 'servicenow_instance' | 'database' | 'external_api' | 'file_system';
  configuration: Record<string, any>;
  required: boolean;
}

export interface Constraint {
  type: 'time' | 'resource' | 'dependency' | 'quality' | 'security';
  value: any;
  description: string;
  enforced: boolean;
}

export interface DistributionPlan {
  taskId: string;
  assignments: AgentAssignment[];
  executionOrder: ExecutionPhase[];
  estimated: {
    totalDuration: number;
    parallelization: number;
    resourceUsage: ResourceUsage;
  };
  fallbackPlan?: DistributionPlan;
}

export interface AgentAssignment {
  agentId: string;
  taskPortion: TaskPortion;
  priority: number;
  estimatedStart: Date;
  estimatedEnd: Date;
  resourceAllocation: ResourceAllocation[];
}

export interface TaskPortion {
  id: string;
  parentTaskId: string;
  work: any;
  inputs: Record<string, any>;
  expectedOutputs: string[];
  dependencies: string[];
}

export interface ExecutionPhase {
  id: string;
  type: 'sequential' | 'parallel' | 'conditional';
  tasks: string[];
  estimatedDuration: number;
  dependencies: string[];
  conditions?: ExecutionCondition[];
}

export interface ExecutionCondition {
  type: 'success' | 'failure' | 'timeout' | 'quality_gate';
  reference: string;
  action: 'continue' | 'skip' | 'retry' | 'abort';
}

// ========================================
// Load Balancing System
// ========================================

export interface LoadBalancingStrategy {
  name: string;
  type: 'round_robin' | 'weighted' | 'capability_based' | 'geographic' | 'ai_optimized';
  parameters: Record<string, any>;
}

export interface LoadBalancingContext {
  currentLoad: Map<string, number>;
  historicalPerformance: Map<string, PerformanceMetrics>;
  geographicDistribution: Map<string, string>;
  affinityRules: AffinityRule[];
}

export interface AffinityRule {
  type: 'agent_affinity' | 'anti_affinity' | 'data_locality' | 'cost_optimization';
  scope: 'task' | 'session' | 'user' | 'global';
  rules: AffinityConstraint[];
  weight: number;
}

export interface AffinityConstraint {
  property: string;
  operator: 'equals' | 'contains' | 'matches' | 'in_range';
  value: any;
  required: boolean;
}

// ========================================
// State Synchronization System
// ========================================

export interface DistributedSharedMemory {
  store(key: string, value: any, ttl?: number, consistency?: ConsistencyLevel): Promise<void>;
  retrieve(key: string, consistency?: ConsistencyLevel): Promise<any>;
  delete(key: string): Promise<void>;
  subscribe(pattern: string, callback: MemoryChangeCallback): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
  synchronize(targetInstances: string[], keys?: string[]): Promise<SyncResult>;
}

export interface MemoryValue {
  value: any;
  timestamp: number;
  version: number;
  instanceId: string;
  metadata?: {
    ttl?: number;
    checksum: string;
    tags?: string[];
  };
}

export interface SharedStateReference {
  namespace: string;
  keys: string[];
  consistencyLevel: ConsistencyLevel;
  synchronizationStrategy: 'push' | 'pull' | 'bidirectional';
}

export type MemoryChangeCallback = (key: string, value: MemoryValue, changeType: 'create' | 'update' | 'delete') => void;

export interface SyncResult {
  success: boolean;
  synchronized: string[];
  conflicts: MemoryConflict[];
  errors: SyncError[];
  duration: number;
}

export interface MemoryConflict {
  key: string;
  localValue: MemoryValue;
  remoteValues: Map<string, MemoryValue>;
  resolutionStrategy: ConflictResolutionStrategy;
}

export interface ConflictResolutionStrategy {
  type: 'last_write_wins' | 'vector_clock' | 'merge' | 'manual';
  parameters?: Record<string, any>;
}

export interface SyncError {
  instanceId: string;
  error: string;
  retryable: boolean;
}

// ========================================
// Service Discovery System
// ========================================

export interface ServiceRegistry {
  register(service: ServiceDefinition): Promise<void>;
  deregister(serviceId: string): Promise<void>;
  findServices(serviceName: string, criteria?: DiscoveryCriteria): Promise<ServiceDefinition[]>;
  watchServices(serviceName: string, callback: ServiceChangeCallback): Promise<string>;
  unwatchServices(watchId: string): Promise<void>;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  endpoint: string;
  metadata: Record<string, any>;
  health: HealthConfig;
  tags: string[];
  capabilities: AgentCapability[];
  registeredAt: Date;
  lastSeen: Date;
}

export interface HealthConfig {
  check: string;
  interval: number;
  timeout: number;
  retries: number;
  gracePeriod: number;
}

export interface DiscoveryCriteria {
  tags?: string[];
  capabilities?: string[];
  regions?: string[];
  minVersion?: string;
  maxVersion?: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'any';
  filters?: DiscoveryFilter[];
}

export interface DiscoveryFilter {
  property: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export type ServiceChangeCallback = (event: ServiceEvent) => void;

export interface ServiceEvent {
  type: 'registered' | 'deregistered' | 'health_changed' | 'updated';
  service: ServiceDefinition;
  timestamp: Date;
}

// ========================================
// MCP Discovery System
// ========================================

export interface MCPServerInfo {
  id: string;
  name: string;
  endpoint: string;
  version: string;
  capabilities: MCPCapability[];
  metadata: Record<string, any>;
  discoveredAt: Date;
  lastValidated: Date;
}

export interface MCPCapability {
  type: 'tool' | 'resource' | 'prompt';
  name: string;
  description: string;
  schema?: any;
  metadata?: Record<string, any>;
}

export interface MCPRequirements {
  capabilities: string[];
  version?: string;
  performance?: PerformanceRequirement[];
}

export interface PerformanceRequirement {
  metric: 'response_time' | 'throughput' | 'availability';
  threshold: number;
  unit: string;
}

// ========================================
// Orchestration Session Management
// ========================================

export interface OrchestrationSession {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  config: SessionConfig;
  state: SessionState;
  participants: SessionParticipant[];
  metrics: SessionMetrics;
}

export enum SessionStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETING = 'completing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface SessionConfig {
  mode: OrchestrationMode;
  maxConcurrentTasks: number;
  timeout: number;
  retryPolicy: RetryPolicy;
  qualityGates: boolean;
  progressMonitoring: boolean;
  stateReplication: boolean;
  rollbackEnabled: boolean;
}

export interface SessionState {
  sharedMemory: Map<string, any>;
  taskResults: Map<string, any>;
  executionPlan: DistributionPlan;
  currentPhase: string;
  completedTasks: string[];
  failedTasks: string[];
}

export interface SessionParticipant {
  instanceId: string;
  role: 'coordinator' | 'worker' | 'observer';
  joinedAt: Date;
  lastActivity: Date;
  taskAssignments: string[];
}

export interface SessionMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskDuration: number;
  totalExecutionTime: number;
  resourceUsage: ResourceUsage;
  qualityScores: Map<string, number>;
}

// ========================================
// Quality Gates and Validation
// ========================================

export interface QualityGateConfig {
  name: string;
  taskIds: string[];
  gates: QualityGate[];
  blocking: boolean;
  timeout: number;
}

export interface QualityGate {
  name: string;
  type: 'validation' | 'performance' | 'security' | 'compliance';
  blocking: boolean;
  validator: QualityValidator;
}

export interface QualityValidator {
  validate(result: any, context: ValidationContext): Promise<ValidationResult>;
}

export interface ValidationContext {
  taskId: string;
  sessionId: string;
  requirements: TaskRequirements;
  previousResults: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  score?: number;
  error?: string;
  warnings?: string[];
  suggestions?: string[];
  metadata?: Record<string, any>;
}

// ========================================
// Progress Monitoring System
// ========================================

export interface ProgressMonitor {
  startMonitoring(sessionId: string): Promise<void>;
  stopMonitoring(sessionId: string): Promise<void>;
  getProgress(sessionId: string): Promise<ProgressStatus>;
  subscribe(sessionId: string, callback: ProgressCallback): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
}

export interface ProgressStatus {
  sessionId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  percentage: number;
  estimatedCompletion?: Date;
  currentPhase?: string;
  bottlenecks?: Bottleneck[];
  throughput: number;
}

export interface Bottleneck {
  type: 'resource' | 'dependency' | 'performance' | 'quality_gate';
  description: string;
  affectedTasks: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: string;
}

export type ProgressCallback = (progress: ProgressStatus) => void;

// ========================================
// Error Handling and Recovery
// ========================================

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  retryableErrors: string[];
}

export interface RollbackStrategy {
  type: 'full' | 'partial' | 'compensating';
  triggers: RollbackTrigger[];
  actions: RollbackAction[];
}

export interface RollbackTrigger {
  condition: 'task_failure' | 'quality_gate_failure' | 'timeout' | 'manual';
  threshold?: number;
  scope: 'task' | 'phase' | 'session';
}

export interface RollbackAction {
  type: 'restore_state' | 'undo_changes' | 'compensate' | 'notify';
  parameters: Record<string, any>;
  order: number;
}

// ========================================
// Resource Management
// ========================================

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
  apiCalls: number;
  customMetrics?: Record<string, number>;
}

export interface ResourceAllocation {
  type: string;
  amount: number;
  unit: string;
  guaranteed: boolean;
  priority: number;
}

// ========================================
// Utility Types
// ========================================

export interface SyncPoint {
  id: string;
  type: 'barrier' | 'checkpoint' | 'milestone';
  description: string;
  waitFor: string[];
  timeout: number;
}

export interface ProgressConfig {
  reportingInterval: number;
  enableRealTimeUpdates: boolean;
  includeDetailedMetrics: boolean;
  notificationThresholds: number[];
}

export interface TaskPartition {
  strategy: 'data_parallel' | 'task_parallel' | 'pipeline' | 'custom';
  partitions: TaskPortion[];
  mergeStrategy: 'concatenate' | 'aggregate' | 'custom';
}

export interface DataLocalityConfig {
  enableDataLocality: boolean;
  dataLocation: string[];
  movementCost: number;
  cachingStrategy: 'local' | 'distributed' | 'hybrid';
}

// ========================================
// Main Orchestrator Interface
// ========================================

export interface DistributedOrchestrator {
  // Session Management
  createSession(config: SessionConfig): Promise<OrchestrationSession>;
  getSession(sessionId: string): Promise<OrchestrationSession | null>;
  terminateSession(sessionId: string): Promise<void>;
  listSessions(): Promise<OrchestrationSession[]>;

  // Agent Management
  registerAgent(agent: ClaudeCodeInstance): Promise<void>;
  deregisterAgent(agentId: string): Promise<void>;
  getAvailableAgents(criteria?: DiscoveryCriteria): Promise<ClaudeCodeInstance[]>;
  getAgentHealth(agentId: string): Promise<HealthStatus>;

  // Task Orchestration
  orchestrateTask(task: TaskSpecification, session: OrchestrationSession): Promise<OrchestrationResult>;
  distributeTask(task: TaskSpecification, agents: ClaudeCodeInstance[]): Promise<DistributionResult>;
  monitorExecution(sessionId: string): AsyncIterable<ExecutionUpdate>;
  pauseExecution(sessionId: string): Promise<void>;
  resumeExecution(sessionId: string): Promise<void>;
  cancelExecution(sessionId: string, reason: string): Promise<void>;

  // State Management
  getSharedState(sessionId: string): Promise<SharedState>;
  updateSharedState(sessionId: string, updates: StateUpdate[]): Promise<void>;
  syncState(sessionId: string, targetAgents: string[]): Promise<SyncResult>;

  // Service Discovery
  discoverServices(criteria: DiscoveryCriteria): Promise<ServiceDefinition[]>;
  watchServices(criteria: DiscoveryCriteria, callback: ServiceChangeCallback): Promise<string>;
}

export interface OrchestrationResult {
  sessionId: string;
  success: boolean;
  results: Record<string, any>;
  metrics: SessionMetrics;
  errors: OrchestrationError[];
  warnings: string[];
  recommendations?: string[];
}

export interface DistributionResult {
  taskId: string;
  plan: DistributionPlan;
  assignments: AgentAssignment[];
  estimatedCompletion: Date;
}

export interface ExecutionUpdate {
  sessionId: string;
  type: 'progress' | 'completion' | 'error' | 'state_change';
  timestamp: Date;
  data: any;
}

export interface SharedState {
  sessionId: string;
  data: Map<string, any>;
  version: number;
  lastUpdated: Date;
}

export interface StateUpdate {
  key: string;
  value: any;
  operation: 'set' | 'delete' | 'merge';
  metadata?: Record<string, any>;
}

export interface OrchestrationError {
  code: string;
  message: string;
  taskId?: string;
  agentId?: string;
  timestamp: Date;
  retryable: boolean;
  context?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: PerformanceMetrics;
  issues?: string[];
}
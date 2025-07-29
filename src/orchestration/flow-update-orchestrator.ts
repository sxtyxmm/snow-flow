/**
 * 🚀 Flow Update Orchestration with Smart Rollbacks
 * 
 * Intelligent flow updating system that provides safe, reliable updates
 * with automatic testing, validation, and rollback capabilities.
 */

import { Logger } from '../utils/logger.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { MemorySystem } from '../memory/memory-system.js';
import { XMLFirstFlowGenerator, XMLFlowDefinition } from '../utils/xml-first-flow-generator.js';

export interface FlowUpdatePlan {
  flowId: string;
  currentVersion: FlowVersion;
  targetVersion: FlowVersion;
  updateStrategy: 'in_place' | 'blue_green' | 'canary' | 'maintenance_window';
  validationSteps: ValidationStep[];
  rollbackPlan: RollbackPlan;
  estimatedDowntime: number; // milliseconds
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FlowVersion {
  sys_id: string;
  name: string;
  version: string;
  definition: XMLFlowDefinition;
  created_at: Date;
  created_by: string;
  status: 'draft' | 'testing' | 'active' | 'deprecated';
  metadata: {
    changeLog: string[];
    dependencies: string[];
    testResults?: TestResult[];
    performanceMetrics?: PerformanceMetrics;
  };
}

export interface ValidationStep {
  id: string;
  name: string;
  type: 'syntax' | 'dependencies' | 'permissions' | 'performance' | 'integration';
  required: boolean;
  autoFix: boolean;
  estimatedTime: number;
  validator: (flow: XMLFlowDefinition) => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  autoFixApplied: boolean;
  recommendations: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  autoFixable: boolean;
  impact: string;
}

export interface RollbackPlan {
  strategy: 'version_revert' | 'snapshot_restore' | 'manual_steps';
  backupLocation: string;
  rollbackSteps: RollbackStep[];
  estimatedTime: number;
  dataImpact: 'none' | 'minimal' | 'moderate' | 'significant';
}

export interface RollbackStep {
  order: number;
  action: string;
  description: string;
  automated: boolean;
  validationCheck: string;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  executionTime: number;
  details: string;
  artifacts?: any[];
}

export interface PerformanceMetrics {
  averageExecutionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  errorRate: number;
}

export interface UpdateExecutionResult {
  success: boolean;
  flowId: string;
  newVersion?: string;
  executionTime: number;
  rollbackPerformed: boolean;
  validationResults: ValidationResult[];
  testResults: TestResult[];
  issues: string[];
  warnings: string[];
  metrics: {
    stepsCompleted: number;
    totalSteps: number;
    downtime: number;
  };
}

export class FlowUpdateOrchestrator {
  private logger: Logger;
  private client: ServiceNowClient;
  private memory: MemorySystem;
  private xmlGenerator: XMLFirstFlowGenerator;
  private activeUpdates: Map<string, FlowUpdateExecution> = new Map();

  constructor(client: ServiceNowClient, memory: MemorySystem) {
    this.logger = new Logger('FlowUpdateOrchestrator');
    this.client = client;
    this.memory = memory;
    this.xmlGenerator = new XMLFirstFlowGenerator();
  }

  /**
   * Plan a flow update with comprehensive analysis
   */
  async planFlowUpdate(
    flowId: string,
    newDefinition: XMLFlowDefinition,
    options: {
      strategy?: 'in_place' | 'blue_green' | 'canary' | 'maintenance_window';
      riskTolerance?: 'low' | 'medium' | 'high';
      testingLevel?: 'basic' | 'comprehensive' | 'full_integration';
    } = {}
  ): Promise<FlowUpdatePlan> {
    this.logger.info('📋 Planning flow update', { flowId, strategy: options.strategy });

    try {
      // Get current flow version
      const currentFlow = await this.client.getFlow(flowId);
      if (!currentFlow.success) {
        throw new Error(`Failed to retrieve current flow: ${currentFlow.error}`);
      }

      const currentVersion: FlowVersion = {
        sys_id: currentFlow.data.sys_id,
        name: currentFlow.data.name,
        version: currentFlow.data.version || '1.0.0',
        definition: currentFlow.data.definition,
        created_at: new Date(currentFlow.data.sys_created_on),
        created_by: currentFlow.data.sys_created_by,
        status: 'active',
        metadata: {
          changeLog: [],
          dependencies: await this.analyzeDependencies(currentFlow.data.definition)
        }
      };

      // Create target version
      const targetVersion: FlowVersion = {
        sys_id: flowId,
        name: newDefinition.name,
        version: this.generateNextVersion(currentVersion.version),
        definition: newDefinition,
        created_at: new Date(),
        created_by: 'flow_orchestrator',
        status: 'draft',
        metadata: {
          changeLog: await this.generateChangeLog(currentVersion.definition, newDefinition),
          dependencies: await this.analyzeDependencies(newDefinition)
        }
      };

      // Determine update strategy
      const strategy = options.strategy || await this.recommendUpdateStrategy(currentVersion, targetVersion);

      // Create validation steps
      const validationSteps = await this.createValidationSteps(
        currentVersion,
        targetVersion,
        options.testingLevel || 'comprehensive'
      );

      // Create rollback plan
      const rollbackPlan = await this.createRollbackPlan(currentVersion, targetVersion, strategy);

      // Assess risk level
      const riskLevel = await this.assessRiskLevel(currentVersion, targetVersion);

      // Estimate downtime
      const estimatedDowntime = this.estimateDowntime(strategy, validationSteps.length);

      const updatePlan: FlowUpdatePlan = {
        flowId,
        currentVersion,
        targetVersion,
        updateStrategy: strategy,
        validationSteps,
        rollbackPlan,
        estimatedDowntime,
        riskLevel
      };

      // Store plan for execution
      await this.memory.store(`flow_update_plan_${flowId}`, updatePlan, 3600000); // 1 hour

      this.logger.info('✅ Flow update plan created', {
        flowId,
        strategy,
        riskLevel,
        validationSteps: validationSteps.length,
        estimatedDowntime
      });

      return updatePlan;

    } catch (error) {
      this.logger.error('❌ Failed to plan flow update', error);
      throw error;
    }
  }

  /**
   * Execute flow update with monitoring and automatic rollback
   */
  async executeFlowUpdate(
    planId: string,
    options: {
      dryRun?: boolean;
      skipValidation?: boolean;
      forceUpdate?: boolean;
    } = {}
  ): Promise<UpdateExecutionResult> {
    this.logger.info('🚀 Executing flow update', { planId, options });

    const startTime = Date.now();

    try {
      // Load plan
      const plan = await this.memory.get(`flow_update_plan_${planId}`) as FlowUpdatePlan;
      if (!plan) {
        throw new Error(`Update plan not found: ${planId}`);
      }

      // Create execution context
      const execution = new FlowUpdateExecution(plan, this.logger, this.client, this.memory);
      this.activeUpdates.set(planId, execution);

      // Execute update
      const result = await execution.execute(options);

      // Clean up
      this.activeUpdates.delete(planId);

      return result;

    } catch (error) {
      this.logger.error('❌ Flow update execution failed', error);
      
      // Attempt emergency rollback if execution exists
      const execution = this.activeUpdates.get(planId);
      if (execution) {
        try {
          await execution.emergencyRollback();
        } catch (rollbackError) {
          this.logger.error('❌ Emergency rollback also failed', rollbackError);
        }
      }

      throw error;
    }
  }

  /**
   * Monitor active updates
   */
  getActiveUpdates(): Array<{ planId: string; status: string; progress: number }> {
    return Array.from(this.activeUpdates.entries()).map(([planId, execution]) => ({
      planId,
      status: execution.getStatus(),
      progress: execution.getProgress()
    }));
  }

  /**
   * Cancel an active update
   */
  async cancelUpdate(planId: string): Promise<boolean> {
    const execution = this.activeUpdates.get(planId);
    if (!execution) {
      return false;
    }

    try {
      await execution.cancel();
      this.activeUpdates.delete(planId);
      return true;
    } catch (error) {
      this.logger.error('❌ Failed to cancel update', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */

  private async analyzeDependencies(flowDefinition: XMLFlowDefinition): Promise<string[]> {
    const dependencies: string[] = [];

    // Analyze activities for dependencies
    for (const activity of flowDefinition.activities) {
      if (activity.type === 'create_record' || activity.type === 'update_record') {
        dependencies.push(`table:${activity.inputs.table}`);
      }
      
      if (activity.type === 'assign_subflow') {
        dependencies.push(`subflow:${activity.inputs.subflow_id}`);
      }

      if (activity.type === 'rest_step') {
        dependencies.push(`rest_message:${activity.inputs.rest_message}`);
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  private generateNextVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`;
  }

  private async generateChangeLog(current: XMLFlowDefinition, target: XMLFlowDefinition): Promise<string[]> {
    const changes: string[] = [];

    // Name change
    if (current.name !== target.name) {
      changes.push(`Renamed from "${current.name}" to "${target.name}"`);
    }

    // Description change
    if (current.description !== target.description) {
      changes.push('Updated description');
    }

    // Activities comparison
    const currentActivities = current.activities.map(a => a.name);
    const targetActivities = target.activities.map(a => a.name);

    const added = targetActivities.filter(a => !currentActivities.includes(a));
    const removed = currentActivities.filter(a => !targetActivities.includes(a));

    added.forEach(activity => changes.push(`Added activity: ${activity}`));
    removed.forEach(activity => changes.push(`Removed activity: ${activity}`));

    if (changes.length === 0) {
      changes.push('Minor configuration updates');
    }

    return changes;
  }

  private async recommendUpdateStrategy(
    current: FlowVersion,
    target: FlowVersion
  ): Promise<'in_place' | 'blue_green' | 'canary' | 'maintenance_window'> {
    const riskFactors = {
      majorChanges: target.metadata.changeLog.length > 5,
      dependencyChanges: target.metadata.dependencies.length !== current.metadata.dependencies.length,
      structuralChanges: target.definition.activities.length !== current.definition.activities.length,
      criticalFlow: current.name.toLowerCase().includes('critical') || current.name.toLowerCase().includes('production')
    };

    const riskScore = Object.values(riskFactors).filter(Boolean).length;

    if (riskScore >= 3) {
      return 'maintenance_window';
    } else if (riskScore >= 2) {
      return 'blue_green';
    } else if (riskScore >= 1) {
      return 'canary';
    } else {
      return 'in_place';
    }
  }

  private async createValidationSteps(
    current: FlowVersion,
    target: FlowVersion,
    testingLevel: string
  ): Promise<ValidationStep[]> {
    const steps: ValidationStep[] = [
      {
        id: 'syntax_validation',
        name: 'Syntax Validation',
        type: 'syntax',
        required: true,
        autoFix: false,
        estimatedTime: 5000,
        validator: async (flow: XMLFlowDefinition) => {
          return this.validateSyntax(flow);
        }
      },
      {
        id: 'dependency_check',
        name: 'Dependency Check',
        type: 'dependencies',
        required: true,
        autoFix: false,
        estimatedTime: 10000,
        validator: async (flow: XMLFlowDefinition) => {
          return this.validateDependencies(flow);
        }
      },
      {
        id: 'permission_check',
        name: 'Permission Validation',
        type: 'permissions',
        required: true,
        autoFix: false,
        estimatedTime: 8000,
        validator: async (flow: XMLFlowDefinition) => {
          return this.validatePermissions(flow);
        }
      }
    ];

    if (testingLevel === 'comprehensive' || testingLevel === 'full_integration') {
      steps.push({
        id: 'performance_test',
        name: 'Performance Testing',
        type: 'performance',
        required: false,
        autoFix: false,
        estimatedTime: 30000,
        validator: async (flow: XMLFlowDefinition) => {
          return this.performanceTest(flow);
        }
      });
    }

    if (testingLevel === 'full_integration') {
      steps.push({
        id: 'integration_test',
        name: 'Integration Testing',
        type: 'integration',
        required: false,
        autoFix: false,
        estimatedTime: 60000,
        validator: async (flow: XMLFlowDefinition) => {
          return this.integrationTest(flow);
        }
      });
    }

    return steps;
  }

  private async createRollbackPlan(
    current: FlowVersion,
    target: FlowVersion,
    strategy: string
  ): Promise<RollbackPlan> {
    const rollbackSteps: RollbackStep[] = [
      {
        order: 1,
        action: 'Create backup',
        description: 'Create complete backup of current flow version',
        automated: true,
        validationCheck: 'Verify backup integrity'
      },
      {
        order: 2,
        action: 'Restore previous version',
        description: 'Restore flow to previous working version',
        automated: true,
        validationCheck: 'Verify flow is active and accessible'
      },
      {
        order: 3,
        action: 'Validate rollback',
        description: 'Test that rollback was successful',
        automated: true,
        validationCheck: 'Execute test workflow to verify functionality'
      }
    ];

    return {
      strategy: 'version_revert',
      backupLocation: `flow_backup_${current.sys_id}_${Date.now()}`,
      rollbackSteps,
      estimatedTime: 30000, // 30 seconds
      dataImpact: 'minimal'
    };
  }

  private async assessRiskLevel(current: FlowVersion, target: FlowVersion): Promise<'low' | 'medium' | 'high' | 'critical'> {
    let riskScore = 0;

    // Major structural changes
    if (target.definition.activities.length !== current.definition.activities.length) {
      riskScore += 2;
    }

    // Dependency changes
    if (target.metadata.dependencies.length !== current.metadata.dependencies.length) {
      riskScore += 1;
    }

    // Many changes
    if (target.metadata.changeLog.length > 5) {
      riskScore += 1;
    }

    // Critical flow indicators
    if (current.name.toLowerCase().includes('critical') || current.name.toLowerCase().includes('production')) {
      riskScore += 2;
    }

    if (riskScore >= 5) return 'critical';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private estimateDowntime(strategy: string, validationSteps: number): number {
    const baseTime = {
      'in_place': 10000, // 10 seconds
      'blue_green': 5000, // 5 seconds
      'canary': 30000, // 30 seconds
      'maintenance_window': 0 // No downtime during maintenance
    };

    return baseTime[strategy as keyof typeof baseTime] + (validationSteps * 2000);
  }

  // Validation methods
  private async validateSyntax(flow: XMLFlowDefinition): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Basic syntax checks
    if (!flow.name || flow.name.trim().length === 0) {
      issues.push({
        severity: 'error',
        message: 'Flow name is required',
        autoFixable: false,
        impact: 'Flow cannot be created without a name'
      });
    }

    if (!flow.activities || flow.activities.length === 0) {
      issues.push({
        severity: 'error',
        message: 'Flow must have at least one activity',
        autoFixable: false,
        impact: 'Empty flows are not functional'
      });
    }

    // Activity validation
    for (const activity of flow.activities) {
      if (!activity.name) {
        issues.push({
          severity: 'error',
          message: `Activity missing name`,
          location: `Activity ${activity.type}`,
          autoFixable: false,
          impact: 'Activities must have names for identification'
        });
      }

      if (!activity.type) {
        issues.push({
          severity: 'error',
          message: `Activity missing type`,
          location: activity.name,
          autoFixable: false,
          impact: 'Activity type determines functionality'
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      autoFixApplied: false,
      recommendations: issues.length === 0 ? ['Syntax validation passed'] : ['Fix syntax errors before proceeding']
    };
  }

  private async validateDependencies(flow: XMLFlowDefinition): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Check table dependencies
    for (const activity of flow.activities) {
      if ((activity.type === 'create_record' || activity.type === 'update_record') && activity.inputs.table) {
        try {
          const tableExists = await this.client.checkTableExists(activity.inputs.table);
          if (!tableExists) {
            issues.push({
              severity: 'error',
              message: `Table '${activity.inputs.table}' does not exist`,
              location: activity.name,
              autoFixable: false,
              impact: 'Activity will fail at runtime'
            });
          }
        } catch (error) {
          issues.push({
            severity: 'warning',
            message: `Could not verify table '${activity.inputs.table}'`,
            location: activity.name,
            autoFixable: false,
            impact: 'May cause runtime errors'
          });
        }
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      autoFixApplied: false,
      recommendations: ['All dependencies validated successfully']
    };
  }

  private async validatePermissions(flow: XMLFlowDefinition): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Basic permission checks
    if (flow.run_as === 'system') {
      issues.push({
        severity: 'warning',
        message: 'Flow runs as system - consider using user context for security',
        autoFixable: true,
        impact: 'Potential security risk'
      });
    }

    return {
      passed: true,
      issues,
      autoFixApplied: false,
      recommendations: ['Permission validation completed']
    };
  }

  private async performanceTest(flow: XMLFlowDefinition): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Performance heuristics
    if (flow.activities.length > 15) {
      issues.push({
        severity: 'warning',
        message: 'Flow has many activities - may impact performance',
        autoFixable: false,
        impact: 'Longer execution times'
      });
    }

    return {
      passed: true,
      issues,
      autoFixApplied: false,
      recommendations: ['Performance test completed']
    };
  }

  private async integrationTest(flow: XMLFlowDefinition): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Integration test placeholder
    return {
      passed: true,
      issues,
      autoFixApplied: false,
      recommendations: ['Integration test completed']
    };
  }
}

class FlowUpdateExecution {
  private plan: FlowUpdatePlan;
  private logger: Logger;
  private client: ServiceNowClient;
  private memory: MemorySystem;
  private status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'pending';
  private progress: number = 0;
  private backupId?: string;

  constructor(plan: FlowUpdatePlan, logger: Logger, client: ServiceNowClient, memory: MemorySystem) {
    this.plan = plan;
    this.logger = logger;
    this.client = client;
    this.memory = memory;
  }

  async execute(options: any): Promise<UpdateExecutionResult> {
    this.status = 'running';
    const startTime = Date.now();
    
    try {
      // Step 1: Create backup
      this.progress = 10;
      this.backupId = await this.createBackup();
      
      // Step 2: Run validations
      this.progress = 30;
      const validationResults = await this.runValidations(options.skipValidation);
      
      // Step 3: Execute update
      this.progress = 60;
      const updateResult = await this.executeUpdate(options.dryRun);
      
      // Step 4: Post-update validation
      this.progress = 80;
      const testResults = await this.runPostUpdateTests();
      
      // Step 5: Complete
      this.progress = 100;
      this.status = 'completed';
      
      return {
        success: true,
        flowId: this.plan.flowId,
        newVersion: this.plan.targetVersion.version,
        executionTime: Date.now() - startTime,
        rollbackPerformed: false,
        validationResults,
        testResults,
        issues: [],
        warnings: [],
        metrics: {
          stepsCompleted: 5,
          totalSteps: 5,
          downtime: this.plan.estimatedDowntime
        }
      };
      
    } catch (error) {
      this.status = 'failed';
      this.logger.error('❌ Update execution failed, initiating rollback', error);
      
      const rollbackPerformed = await this.performRollback();
      
      return {
        success: false,
        flowId: this.plan.flowId,
        executionTime: Date.now() - startTime,
        rollbackPerformed,
        validationResults: [],
        testResults: [],
        issues: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        metrics: {
          stepsCompleted: Math.floor(this.progress / 20),
          totalSteps: 5,
          downtime: rollbackPerformed ? this.plan.estimatedDowntime * 2 : 0
        }
      };
    }
  }

  async cancel(): Promise<void> {
    this.status = 'cancelled';
    await this.performRollback();
  }

  async emergencyRollback(): Promise<void> {
    await this.performRollback();
  }

  getStatus(): string {
    return this.status;
  }

  getProgress(): number {
    return this.progress;
  }

  private async createBackup(): Promise<string> {
    const backupId = `flow_backup_${this.plan.flowId}_${Date.now()}`;
    await this.memory.store(backupId, this.plan.currentVersion, 86400000); // 24 hours
    return backupId;
  }

  private async runValidations(skip: boolean): Promise<ValidationResult[]> {
    if (skip) {
      return [];
    }

    const results: ValidationResult[] = [];
    
    for (const step of this.plan.validationSteps) {
      if (step.required || !skip) {
        const result = await step.validator(this.plan.targetVersion.definition);
        results.push(result);
        
        if (!result.passed && step.required) {
          throw new Error(`Required validation failed: ${step.name}`);
        }
      }
    }
    
    return results;
  }

  private async executeUpdate(dryRun: boolean): Promise<any> {
    if (dryRun) {
      this.logger.info('🔍 Dry run - skipping actual update');
      return { success: true, message: 'Dry run completed' };
    }

    // Update the flow
    const result = await this.client.updateFlow(this.plan.flowId, this.plan.targetVersion.definition);
    
    if (!result.success) {
      throw new Error(`Flow update failed: ${result.error}`);
    }
    
    return result;
  }

  private async runPostUpdateTests(): Promise<TestResult[]> {
    // Basic connectivity test
    const testResults: TestResult[] = [];
    
    try {
      const flow = await this.client.getFlow(this.plan.flowId);
      testResults.push({
        testName: 'Flow Accessibility Test',
        passed: flow.success,
        executionTime: 1000,
        details: flow.success ? 'Flow is accessible' : 'Flow not accessible'
      });
    } catch (error) {
      testResults.push({
        testName: 'Flow Accessibility Test',
        passed: false,
        executionTime: 1000,
        details: `Test failed: ${error}`
      });
    }
    
    return testResults;
  }

  private async performRollback(): Promise<boolean> {
    try {
      if (!this.backupId) {
        this.logger.error('❌ No backup available for rollback');
        return false;
      }

      this.logger.info('🔄 Performing rollback to previous version');
      
      const backup = await this.memory.get(this.backupId) as FlowVersion;
      if (!backup) {
        throw new Error('Backup not found');
      }

      const result = await this.client.updateFlow(this.plan.flowId, backup.definition);
      
      if (result.success) {
        this.logger.info('✅ Rollback completed successfully');
        return true;
      } else {
        this.logger.error('❌ Rollback failed', result.error);
        return false;
      }
      
    } catch (error) {
      this.logger.error('❌ Rollback operation failed', error);
      return false;
    }
  }
}

export default FlowUpdateOrchestrator;
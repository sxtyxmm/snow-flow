/**
 * Transaction Management for Multi-Step Flow Creation
 * Provides ACID-like properties for complex flow operations
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { FlowErrorHandler, RollbackOperation, TransactionState } from './error-handling.js';
import { Logger } from '../utils/logger.js';

export interface TransactionDefinition {
  id: string;
  name: string;
  description: string;
  steps: TransactionStep[];
  timeout: number;
  isolation_level: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  rollback_on_error: boolean;
  retry_policy: RetryPolicy;
}

export interface TransactionStep {
  id: string;
  name: string;
  operation: 'create' | 'update' | 'delete' | 'validate' | 'custom';
  table: string;
  data?: any;
  condition?: string;
  dependencies: string[];
  compensation?: CompensationAction;
  timeout: number;
  retry_count: number;
  critical: boolean;
}

export interface CompensationAction {
  type: 'delete' | 'update' | 'restore' | 'custom';
  table: string;
  data?: any;
  custom_function?: () => Promise<void>;
}

export interface RetryPolicy {
  max_attempts: number;
  initial_delay: number;
  max_delay: number;
  backoff_multiplier: number;
  retryable_errors: string[];
}

export interface TransactionExecution {
  id: string;
  definition: TransactionDefinition;
  state: TransactionExecutionState;
  start_time: Date;
  end_time?: Date;
  current_step?: string;
  completed_steps: string[];
  failed_steps: string[];
  results: Map<string, any>;
  errors: Map<string, Error>;
  compensations: CompensationAction[];
  locks: Set<string>;
}

export enum TransactionExecutionState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
  TIMEOUT = 'timeout'
}

export interface LockManager {
  acquire(resource: string, timeout: number): Promise<string>;
  release(lockId: string): Promise<void>;
  isLocked(resource: string): boolean;
  getLockOwner(resource: string): string | null;
}

export class TransactionManager {
  private client: ServiceNowClient;
  private errorHandler: FlowErrorHandler;
  private logger: Logger;
  private activeTransactions: Map<string, TransactionExecution> = new Map();
  private lockManager: LockManager;
  private sagaLog: Map<string, any[]> = new Map();

  constructor(client: ServiceNowClient, errorHandler: FlowErrorHandler) {
    this.client = client;
    this.errorHandler = errorHandler;
    this.logger = new Logger('TransactionManager');
    this.lockManager = new SimpleLockManager();
  }

  /**
   * Execute a transaction with ACID properties
   */
  async executeTransaction(definition: TransactionDefinition): Promise<{
    success: boolean;
    transaction_id: string;
    results?: Map<string, any>;
    errors?: Error[];
    compensation_applied?: boolean;
  }> {
    const execution: TransactionExecution = {
      id: definition.id,
      definition,
      state: TransactionExecutionState.PENDING,
      start_time: new Date(),
      completed_steps: [],
      failed_steps: [],
      results: new Map(),
      errors: new Map(),
      compensations: [],
      locks: new Set()
    };

    this.activeTransactions.set(definition.id, execution);

    try {
      // Initialize saga log
      this.sagaLog.set(definition.id, []);

      // Start transaction
      await this.startTransaction(execution);

      // Execute steps
      const result = await this.executeSteps(execution);

      if (result.success) {
        await this.commitTransaction(execution);
        return {
          success: true,
          transaction_id: execution.id,
          results: execution.results
        };
      } else {
        await this.rollbackTransaction(execution);
        return {
          success: false,
          transaction_id: execution.id,
          errors: Array.from(execution.errors.values()),
          compensation_applied: true
        };
      }

    } catch (error) {
      this.logger.error('Transaction execution failed', { transactionId: definition.id, error });
      await this.rollbackTransaction(execution);
      
      return {
        success: false,
        transaction_id: execution.id,
        errors: [error instanceof Error ? error : new Error(String(error))],
        compensation_applied: true
      };
    } finally {
      this.activeTransactions.delete(definition.id);
    }
  }

  /**
   * Execute a saga pattern transaction
   */
  async executeSaga(definition: TransactionDefinition): Promise<{
    success: boolean;
    transaction_id: string;
    results?: Map<string, any>;
    compensations_applied?: CompensationAction[];
  }> {
    const execution: TransactionExecution = {
      id: definition.id,
      definition,
      state: TransactionExecutionState.PENDING,
      start_time: new Date(),
      completed_steps: [],
      failed_steps: [],
      results: new Map(),
      errors: new Map(),
      compensations: [],
      locks: new Set()
    };

    this.activeTransactions.set(definition.id, execution);

    try {
      execution.state = TransactionExecutionState.RUNNING;

      // Execute steps with saga pattern
      for (const step of definition.steps) {
        try {
          const stepResult = await this.executeStep(execution, step);
          execution.results.set(step.id, stepResult);
          execution.completed_steps.push(step.id);

          // Log successful step for saga
          this.logSagaStep(execution.id, step, stepResult);

        } catch (error) {
          execution.errors.set(step.id, error instanceof Error ? error : new Error(String(error)));
          execution.failed_steps.push(step.id);

          // If step failed, compensate previous steps
          await this.compensateSteps(execution);

          return {
            success: false,
            transaction_id: execution.id,
            compensations_applied: execution.compensations
          };
        }
      }

      execution.state = TransactionExecutionState.COMPLETED;
      execution.end_time = new Date();

      return {
        success: true,
        transaction_id: execution.id,
        results: execution.results
      };

    } catch (error) {
      execution.state = TransactionExecutionState.FAILED;
      execution.end_time = new Date();

      await this.compensateSteps(execution);

      return {
        success: false,
        transaction_id: execution.id,
        compensations_applied: execution.compensations
      };
    } finally {
      this.activeTransactions.delete(definition.id);
      this.sagaLog.delete(definition.id);
    }
  }

  /**
   * Create a distributed transaction across multiple ServiceNow instances
   */
  async executeDistributedTransaction(
    definition: TransactionDefinition,
    participants: string[]
  ): Promise<{
    success: boolean;
    transaction_id: string;
    participant_results?: Map<string, any>;
    failed_participants?: string[];
  }> {
    const transactionId = definition.id;
    const participantResults = new Map<string, any>();
    const failedParticipants: string[] = [];

    try {
      // Phase 1: Prepare all participants
      const prepareResults = await Promise.allSettled(
        participants.map(participant => this.prepareParticipant(participant, definition))
      );

      // Check if all participants are prepared
      const allPrepared = prepareResults.every(result => result.status === 'fulfilled');

      if (!allPrepared) {
        // Abort transaction - some participants failed to prepare
        await this.abortDistributedTransaction(transactionId, participants);
        
        prepareResults.forEach((result, index) => {
          if (result.status === 'rejected') {
            failedParticipants.push(participants[index]);
          }
        });

        return {
          success: false,
          transaction_id: transactionId,
          failed_participants: failedParticipants
        };
      }

      // Phase 2: Commit all participants
      const commitResults = await Promise.allSettled(
        participants.map(participant => this.commitParticipant(participant, transactionId))
      );

      // Check if all participants committed successfully
      const allCommitted = commitResults.every(result => result.status === 'fulfilled');

      if (!allCommitted) {
        // Some participants failed to commit - this is a critical situation
        this.logger.error('Distributed transaction commit failed', {
          transactionId,
          failedParticipants: commitResults
            .map((result, index) => result.status === 'rejected' ? participants[index] : null)
            .filter(Boolean)
        });

        // Attempt to rollback successful commits
        await this.rollbackDistributedTransaction(transactionId, participants);
      }

      commitResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          participantResults.set(participants[index], result.value);
        } else {
          failedParticipants.push(participants[index]);
        }
      });

      return {
        success: allCommitted,
        transaction_id: transactionId,
        participant_results: participantResults,
        failed_participants: failedParticipants.length > 0 ? failedParticipants : undefined
      };

    } catch (error) {
      this.logger.error('Distributed transaction failed', { transactionId, error });
      await this.abortDistributedTransaction(transactionId, participants);

      return {
        success: false,
        transaction_id: transactionId,
        failed_participants: participants
      };
    }
  }

  /**
   * Start transaction with isolation
   */
  private async startTransaction(execution: TransactionExecution): Promise<void> {
    execution.state = TransactionExecutionState.RUNNING;
    this.logger.info('Starting transaction', { transactionId: execution.id });

    // Acquire locks based on isolation level
    await this.acquireLocks(execution);

    // Start ServiceNow transaction tracking
    const transactionId = this.errorHandler.startTransaction(execution.definition.name);
    execution.id = transactionId;
  }

  /**
   * Execute all steps in the transaction
   */
  private async executeSteps(execution: TransactionExecution): Promise<{ success: boolean }> {
    const steps = this.orderStepsByDependencies(execution.definition.steps);

    for (const step of steps) {
      execution.current_step = step.id;

      try {
        // Check timeout
        if (this.isTransactionTimeout(execution)) {
          execution.state = TransactionExecutionState.TIMEOUT;
          throw new Error('Transaction timeout');
        }

        // Execute step with retry
        const result = await this.executeStepWithRetry(execution, step);
        execution.results.set(step.id, result);
        execution.completed_steps.push(step.id);

        // Add to rollback stack
        this.errorHandler.addOperation(execution.id, {
          type: step.operation as any,
          table: step.table,
          record_id: result?.sys_id,
          original_data: step.operation === 'update' ? step.data : undefined,
          new_data: result,
          dependencies: step.dependencies
        });

      } catch (error) {
        execution.errors.set(step.id, error instanceof Error ? error : new Error(String(error)));
        execution.failed_steps.push(step.id);

        if (step.critical || execution.definition.rollback_on_error) {
          return { success: false };
        }

        // Continue with non-critical steps
        this.logger.warn('Non-critical step failed, continuing', { stepId: step.id, error });
      }
    }

    return { success: execution.failed_steps.length === 0 };
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStepWithRetry(execution: TransactionExecution, step: TransactionStep): Promise<any> {
    const retryPolicy = execution.definition.retry_policy;
    let lastError: Error | null = null;
    let delay = retryPolicy.initial_delay;

    for (let attempt = 1; attempt <= retryPolicy.max_attempts; attempt++) {
      try {
        return await this.executeStep(execution, step);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        const isRetryable = retryPolicy.retryable_errors.some(retryableError =>
          lastError!.message.toLowerCase().includes(retryableError.toLowerCase())
        );

        if (!isRetryable || attempt === retryPolicy.max_attempts) {
          throw lastError;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * retryPolicy.backoff_multiplier, retryPolicy.max_delay);
      }
    }

    throw lastError;
  }

  /**
   * Execute a single step
   */
  private async executeStep(execution: TransactionExecution, step: TransactionStep): Promise<any> {
    this.logger.debug('Executing step', { transactionId: execution.id, stepId: step.id });

    // Check dependencies
    for (const dependency of step.dependencies) {
      if (!execution.completed_steps.includes(dependency)) {
        throw new Error(`Dependency ${dependency} not completed`);
      }
    }

    // Execute based on operation type
    switch (step.operation) {
      case 'create':
        return await this.client.createRecord(step.table, step.data);

      case 'update':
        if (!step.data?.sys_id) {
          throw new Error('sys_id required for update operation');
        }
        return await this.client.updateRecord(step.table, step.data.sys_id, step.data);

      case 'delete':
        if (!step.data?.sys_id) {
          throw new Error('sys_id required for delete operation');
        }
        return await this.client.deleteRecord(step.table, step.data.sys_id);

      case 'validate':
        return await this.validateData(step.table, step.data, step.condition);

      case 'custom':
        if (step.data?.custom_function) {
          return await step.data.custom_function();
        }
        throw new Error('Custom function not provided');

      default:
        throw new Error(`Unknown operation: ${step.operation}`);
    }
  }

  /**
   * Commit transaction
   */
  private async commitTransaction(execution: TransactionExecution): Promise<void> {
    execution.state = TransactionExecutionState.COMPLETED;
    execution.end_time = new Date();

    // Commit ServiceNow transaction
    await this.errorHandler.commitTransaction(execution.id);

    // Release locks
    await this.releaseLocks(execution);

    this.logger.info('Transaction committed', { transactionId: execution.id });
  }

  /**
   * Rollback transaction
   */
  private async rollbackTransaction(execution: TransactionExecution): Promise<void> {
    execution.state = TransactionExecutionState.COMPENSATING;

    try {
      // Rollback ServiceNow transaction
      await this.errorHandler.rollbackTransaction(execution.id);

      // Apply compensations
      await this.compensateSteps(execution);

      execution.state = TransactionExecutionState.COMPENSATED;
    } catch (error) {
      execution.state = TransactionExecutionState.FAILED;
      this.logger.error('Transaction rollback failed', { transactionId: execution.id, error });
    } finally {
      // Always release locks
      await this.releaseLocks(execution);
      execution.end_time = new Date();
    }
  }

  /**
   * Apply compensations for completed steps
   */
  private async compensateSteps(execution: TransactionExecution): Promise<void> {
    const completedSteps = execution.definition.steps.filter(step =>
      execution.completed_steps.includes(step.id)
    );

    // Apply compensations in reverse order
    for (const step of completedSteps.reverse()) {
      if (step.compensation) {
        try {
          await this.applyCompensation(execution, step.compensation);
          execution.compensations.push(step.compensation);
        } catch (error) {
          this.logger.error('Compensation failed', { stepId: step.id, error });
        }
      }
    }
  }

  /**
   * Apply a compensation action
   */
  private async applyCompensation(execution: TransactionExecution, compensation: CompensationAction): Promise<void> {
    switch (compensation.type) {
      case 'delete':
        const result = execution.results.get(compensation.table);
        if (result?.sys_id) {
          await this.client.deleteRecord(compensation.table, result.sys_id);
        }
        break;

      case 'update':
        if (compensation.data?.sys_id) {
          await this.client.updateRecord(compensation.table, compensation.data.sys_id, compensation.data);
        }
        break;

      case 'restore':
        if (compensation.data) {
          await this.client.createRecord(compensation.table, compensation.data);
        }
        break;

      case 'custom':
        if (compensation.custom_function) {
          await compensation.custom_function();
        }
        break;
    }
  }

  /**
   * Acquire locks for transaction isolation
   */
  private async acquireLocks(execution: TransactionExecution): Promise<void> {
    const resourcesToLock = new Set<string>();

    // Collect resources to lock
    for (const step of execution.definition.steps) {
      if (step.operation === 'update' || step.operation === 'delete') {
        resourcesToLock.add(`${step.table}:${step.data?.sys_id}`);
      } else if (step.operation === 'create') {
        resourcesToLock.add(`${step.table}:create`);
      }
    }

    // Acquire locks
    for (const resource of resourcesToLock) {
      try {
        const lockId = await this.lockManager.acquire(resource, execution.definition.timeout);
        execution.locks.add(lockId);
      } catch (error) {
        // Release already acquired locks
        await this.releaseLocks(execution);
        throw new Error(`Failed to acquire lock for ${resource}: ${error}`);
      }
    }
  }

  /**
   * Release all locks
   */
  private async releaseLocks(execution: TransactionExecution): Promise<void> {
    for (const lockId of execution.locks) {
      try {
        await this.lockManager.release(lockId);
      } catch (error) {
        this.logger.warn('Failed to release lock', { lockId, error });
      }
    }
    execution.locks.clear();
  }

  /**
   * Order steps by dependencies
   */
  private orderStepsByDependencies(steps: TransactionStep[]): TransactionStep[] {
    const ordered: TransactionStep[] = [];
    const remaining = [...steps];

    while (remaining.length > 0) {
      const nextSteps = remaining.filter(step =>
        step.dependencies.every(dep => ordered.some(orderedStep => orderedStep.id === dep))
      );

      if (nextSteps.length === 0) {
        throw new Error('Circular dependency detected in transaction steps');
      }

      ordered.push(...nextSteps);
      remaining.splice(0, remaining.length, ...remaining.filter(step => !nextSteps.includes(step)));
    }

    return ordered;
  }

  /**
   * Check if transaction has timed out
   */
  private isTransactionTimeout(execution: TransactionExecution): boolean {
    const elapsed = Date.now() - execution.start_time.getTime();
    return elapsed > execution.definition.timeout;
  }

  /**
   * Validate data against condition
   */
  private async validateData(table: string, data: any, condition?: string): Promise<boolean> {
    if (!condition) return true;

    // Simple validation logic - could be enhanced with more complex rules
    const record = await this.client.getRecord(table, data.sys_id);
    return record !== null;
  }

  /**
   * Log saga step
   */
  private logSagaStep(transactionId: string, step: TransactionStep, result: any): void {
    const sagaLog = this.sagaLog.get(transactionId) || [];
    sagaLog.push({
      step_id: step.id,
      operation: step.operation,
      table: step.table,
      result: result,
      timestamp: new Date()
    });
    this.sagaLog.set(transactionId, sagaLog);
  }

  /**
   * Prepare participant for distributed transaction
   */
  private async prepareParticipant(participant: string, definition: TransactionDefinition): Promise<any> {
    // Implementation would send prepare request to participant
    // For now, return success
    return { prepared: true, participant };
  }

  /**
   * Commit participant in distributed transaction
   */
  private async commitParticipant(participant: string, transactionId: string): Promise<any> {
    // Implementation would send commit request to participant
    return { committed: true, participant };
  }

  /**
   * Abort distributed transaction
   */
  private async abortDistributedTransaction(transactionId: string, participants: string[]): Promise<void> {
    // Implementation would send abort request to all participants
    this.logger.info('Aborting distributed transaction', { transactionId, participants });
  }

  /**
   * Rollback distributed transaction
   */
  private async rollbackDistributedTransaction(transactionId: string, participants: string[]): Promise<void> {
    // Implementation would send rollback request to all participants
    this.logger.info('Rolling back distributed transaction', { transactionId, participants });
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): TransactionExecution | null {
    return this.activeTransactions.get(transactionId) || null;
  }

  /**
   * Get all active transactions
   */
  getActiveTransactions(): TransactionExecution[] {
    return Array.from(this.activeTransactions.values());
  }
}

/**
 * Simple lock manager implementation
 */
class SimpleLockManager implements LockManager {
  private locks: Map<string, { lockId: string; owner: string; timestamp: Date }> = new Map();

  async acquire(resource: string, timeout: number): Promise<string> {
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!this.locks.has(resource)) {
        this.locks.set(resource, {
          lockId,
          owner: 'transaction_manager',
          timestamp: new Date()
        });
        return lockId;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Failed to acquire lock for ${resource}: timeout`);
  }

  async release(lockId: string): Promise<void> {
    for (const [resource, lock] of this.locks) {
      if (lock.lockId === lockId) {
        this.locks.delete(resource);
        return;
      }
    }
  }

  isLocked(resource: string): boolean {
    return this.locks.has(resource);
  }

  getLockOwner(resource: string): string | null {
    const lock = this.locks.get(resource);
    return lock ? lock.owner : null;
  }
}
/**
 * Comprehensive Error Handling and Rollback System
 * Advanced error handling with automatic rollback capabilities
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { Logger } from '../utils/logger.js';

export interface ErrorContext {
  operation: string;
  flow_id?: string;
  component_type?: string;
  component_id?: string;
  user_input?: any;
  system_state?: any;
  timestamp: Date;
}

export interface ErrorRecoveryAction {
  type: 'rollback' | 'retry' | 'skip' | 'fallback' | 'notify';
  description: string;
  parameters?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

export interface ErrorHandlingResult {
  success: boolean;
  recovered: boolean;
  actions_taken: ErrorRecoveryAction[];
  final_state?: any;
  user_message?: string;
  technical_details?: string;
}

export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  API_ERROR = 'api_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  CONFLICT_ERROR = 'conflict_error',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  FLOW_LOGIC_ERROR = 'flow_logic_error',
  ROLLBACK_ERROR = 'rollback_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface FlowError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  context: ErrorContext;
  original_error?: Error;
  recoverable: boolean;
  suggested_actions: ErrorRecoveryAction[];
  retry_count?: number;
  max_retries?: number;
}

export interface RollbackOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  record_id?: string;
  original_data?: any;
  new_data?: any;
  timestamp: Date;
  dependencies: string[];
  rollback_function?: () => Promise<void>;
}

export interface TransactionState {
  id: string;
  flow_id: string;
  operations: RollbackOperation[];
  status: 'active' | 'committed' | 'rolled_back' | 'failed';
  start_time: Date;
  end_time?: Date;
  checkpoints: TransactionCheckpoint[];
}

export interface TransactionCheckpoint {
  id: string;
  timestamp: Date;
  operation_count: number;
  state_snapshot: any;
  description: string;
}

export class FlowErrorHandler {
  private client: ServiceNowClient;
  private logger: Logger;
  private transactions: Map<string, TransactionState> = new Map();
  private errorHistory: FlowError[] = [];
  private maxErrorHistory = 1000;
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

  constructor(client: ServiceNowClient) {
    this.client = client;
    this.logger = new Logger('FlowErrorHandler');
  }

  /**
   * Handle an error with automatic recovery
   */
  async handleError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const flowError = this.classifyError(error, context);
    this.errorHistory.push(flowError);
    
    // Limit error history size
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    this.logger.error('Flow error occurred', {
      type: flowError.type,
      severity: flowError.severity,
      message: flowError.message,
      context: flowError.context
    });

    // Determine recovery strategy
    const recoveryActions = this.determineRecoveryActions(flowError);
    const result: ErrorHandlingResult = {
      success: false,
      recovered: false,
      actions_taken: []
    };

    // Execute recovery actions
    for (const action of recoveryActions) {
      try {
        const actionResult = await this.executeRecoveryAction(action, flowError);
        result.actions_taken.push(action);
        
        if (actionResult.success) {
          result.success = true;
          result.recovered = true;
          result.final_state = actionResult.final_state;
          break;
        }
      } catch (recoveryError) {
        this.logger.error('Recovery action failed', {
          action: action.type,
          error: recoveryError
        });
      }
    }

    // Generate user-friendly message
    result.user_message = this.generateUserMessage(flowError, result);
    result.technical_details = this.generateTechnicalDetails(flowError, result);

    return result;
  }

  /**
   * Start a new transaction
   */
  startTransaction(flowId: string): string {
    const transactionId = this.generateTransactionId();
    const transaction: TransactionState = {
      id: transactionId,
      flow_id: flowId,
      operations: [],
      status: 'active',
      start_time: new Date(),
      checkpoints: []
    };
    
    this.transactions.set(transactionId, transaction);
    this.logger.info('Transaction started', { transactionId, flowId });
    
    return transactionId;
  }

  /**
   * Add operation to transaction
   */
  addOperation(transactionId: string, operation: Omit<RollbackOperation, 'id' | 'timestamp'>): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    const rollbackOperation: RollbackOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date()
    };
    
    transaction.operations.push(rollbackOperation);
    this.logger.debug('Operation added to transaction', { transactionId, operationId: rollbackOperation.id });
  }

  /**
   * Create checkpoint in transaction
   */
  createCheckpoint(transactionId: string, description: string): string {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    const checkpoint: TransactionCheckpoint = {
      id: this.generateCheckpointId(),
      timestamp: new Date(),
      operation_count: transaction.operations.length,
      state_snapshot: this.captureStateSnapshot(transaction),
      description
    };
    
    transaction.checkpoints.push(checkpoint);
    this.logger.info('Checkpoint created', { transactionId, checkpointId: checkpoint.id, description });
    
    return checkpoint.id;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    transaction.status = 'committed';
    transaction.end_time = new Date();
    
    this.logger.info('Transaction committed', { 
      transactionId, 
      operationCount: transaction.operations.length,
      duration: transaction.end_time.getTime() - transaction.start_time.getTime()
    });
    
    // Clean up transaction after some time
    setTimeout(() => {
      this.transactions.delete(transactionId);
    }, 300000); // 5 minutes
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId: string, toCheckpoint?: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }
    
    this.logger.info('Starting transaction rollback', { transactionId, toCheckpoint });
    
    let operationsToRollback = transaction.operations.slice();
    
    // If rolling back to a checkpoint, only rollback operations after that checkpoint
    if (toCheckpoint) {
      const checkpoint = transaction.checkpoints.find(cp => cp.id === toCheckpoint);
      if (checkpoint) {
        operationsToRollback = transaction.operations.slice(checkpoint.operation_count);
      }
    }
    
    // Rollback operations in reverse order
    operationsToRollback.reverse();
    
    const rollbackErrors: Error[] = [];
    
    for (const operation of operationsToRollback) {
      try {
        await this.rollbackOperation(operation);
        this.logger.debug('Operation rolled back', { operationId: operation.id });
      } catch (error) {
        rollbackErrors.push(error instanceof Error ? error : new Error(String(error)));
        this.logger.error('Rollback operation failed', { operationId: operation.id, error });
      }
    }
    
    transaction.status = rollbackErrors.length > 0 ? 'failed' : 'rolled_back';
    transaction.end_time = new Date();
    
    if (rollbackErrors.length > 0) {
      throw new Error(`Rollback failed with ${rollbackErrors.length} errors: ${rollbackErrors.map(e => e.message).join(', ')}`);
    }
    
    this.logger.info('Transaction rollback completed', { transactionId });
  }

  /**
   * Rollback a single operation
   */
  private async rollbackOperation(operation: RollbackOperation): Promise<void> {
    switch (operation.type) {
      case 'create':
        // Delete the created record
        if (operation.record_id) {
          await this.client.deleteRecord(operation.table, operation.record_id);
        }
        break;
        
      case 'update':
        // Restore original data
        if (operation.record_id && operation.original_data) {
          await this.client.updateRecord(operation.table, operation.record_id, operation.original_data);
        }
        break;
        
      case 'delete':
        // Recreate the deleted record
        if (operation.original_data) {
          await this.client.createRecord(operation.table, operation.original_data);
        }
        break;
    }
    
    // Execute custom rollback function if provided
    if (operation.rollback_function) {
      await operation.rollback_function();
    }
  }

  /**
   * Classify error type and severity
   */
  private classifyError(error: Error, context: ErrorContext): FlowError {
    let type = ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let recoverable = true;
    let suggestedActions: ErrorRecoveryAction[] = [];
    
    const errorMessage = error.message.toLowerCase();
    
    // Classify by error message patterns
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      type = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.HIGH;
      suggestedActions = [
        { type: 'fallback', description: 'Use fallback values', priority: 'high' },
        { type: 'notify', description: 'Notify user of validation issues', priority: 'medium' }
      ];
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      type = ErrorType.AUTHENTICATION_ERROR;
      severity = ErrorSeverity.CRITICAL;
      recoverable = false;
      suggestedActions = [
        { type: 'notify', description: 'Request user to re-authenticate', priority: 'high' }
      ];
    } else if (errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
      type = ErrorType.AUTHORIZATION_ERROR;
      severity = ErrorSeverity.HIGH;
      recoverable = false;
      suggestedActions = [
        { type: 'notify', description: 'Inform user of insufficient permissions', priority: 'high' }
      ];
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      type = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedActions = [
        { type: 'retry', description: 'Retry with exponential backoff', priority: 'high' },
        { type: 'fallback', description: 'Use cached data if available', priority: 'medium' }
      ];
    } else if (errorMessage.includes('timeout')) {
      type = ErrorType.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedActions = [
        { type: 'retry', description: 'Retry with increased timeout', priority: 'high' }
      ];
    } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      type = ErrorType.RATE_LIMIT_ERROR;
      severity = ErrorSeverity.LOW;
      suggestedActions = [
        { type: 'retry', description: 'Retry after delay', priority: 'high', parameters: { delay: 60000 } }
      ];
    } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      type = ErrorType.RESOURCE_NOT_FOUND;
      severity = ErrorSeverity.HIGH;
      suggestedActions = [
        { type: 'fallback', description: 'Create missing resource', priority: 'high' },
        { type: 'notify', description: 'Inform user of missing resource', priority: 'medium' }
      ];
    } else if (errorMessage.includes('conflict') || errorMessage.includes('409')) {
      type = ErrorType.CONFLICT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      suggestedActions = [
        { type: 'retry', description: 'Retry after resolving conflict', priority: 'high' },
        { type: 'fallback', description: 'Use alternative approach', priority: 'medium' }
      ];
    } else if (errorMessage.includes('service unavailable') || errorMessage.includes('503')) {
      type = ErrorType.SERVICE_UNAVAILABLE;
      severity = ErrorSeverity.HIGH;
      suggestedActions = [
        { type: 'retry', description: 'Retry after service recovery', priority: 'high' },
        { type: 'notify', description: 'Inform user of service unavailability', priority: 'medium' }
      ];
    }
    
    // Determine if rollback is needed
    if (context.flow_id && ['create', 'update', 'delete'].includes(context.operation)) {
      suggestedActions.unshift({
        type: 'rollback',
        description: 'Rollback partial changes',
        priority: 'high'
      });
    }
    
    return {
      type,
      severity,
      message: error.message,
      context,
      original_error: error,
      recoverable,
      suggested_actions: suggestedActions,
      retry_count: 0,
      max_retries: this.getMaxRetries(type)
    };
  }

  /**
   * Determine recovery actions based on error
   */
  private determineRecoveryActions(error: FlowError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];
    
    // Sort suggested actions by priority
    const sortedActions = error.suggested_actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Add retry logic for recoverable errors
    if (error.recoverable && error.retry_count < error.max_retries) {
      actions.push({
        type: 'retry',
        description: `Retry operation (attempt ${error.retry_count + 1}/${error.max_retries})`,
        priority: 'high',
        parameters: {
          delay: this.retryDelays[Math.min(error.retry_count, this.retryDelays.length - 1)]
        }
      });
    }
    
    // Add suggested actions
    actions.push(...sortedActions);
    
    return actions;
  }

  /**
   * Execute a recovery action
   */
  private async executeRecoveryAction(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    switch (action.type) {
      case 'retry':
        return await this.executeRetry(action, error);
        
      case 'rollback':
        return await this.executeRollback(action, error);
        
      case 'fallback':
        return await this.executeFallback(action, error);
        
      case 'skip':
        return await this.executeSkip(action, error);
        
      case 'notify':
        return await this.executeNotify(action, error);
        
      default:
        return { success: false };
    }
  }

  /**
   * Execute retry action
   */
  private async executeRetry(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    const delay = action.parameters?.delay || 1000;
    
    this.logger.info('Executing retry', { delay, retryCount: error.retry_count });
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Retry the original operation
      const result = await this.retryOriginalOperation(error);
      return { success: true, final_state: result };
    } catch (retryError) {
      error.retry_count = (error.retry_count || 0) + 1;
      return { success: false };
    }
  }

  /**
   * Execute rollback action
   */
  private async executeRollback(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    if (!error.context.flow_id) {
      return { success: false };
    }
    
    // Find transaction for this flow
    const transaction = Array.from(this.transactions.values())
      .find(t => t.flow_id === error.context.flow_id && t.status === 'active');
    
    if (!transaction) {
      return { success: false };
    }
    
    try {
      await this.rollbackTransaction(transaction.id);
      return { success: true, final_state: 'rolled_back' };
    } catch (rollbackError) {
      return { success: false };
    }
  }

  /**
   * Execute fallback action
   */
  private async executeFallback(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    // Implement fallback logic based on error type
    switch (error.type) {
      case ErrorType.RESOURCE_NOT_FOUND:
        return await this.createMissingResource(error);
        
      case ErrorType.VALIDATION_ERROR:
        return await this.useFallbackValues(error);
        
      case ErrorType.NETWORK_ERROR:
        return await this.useCachedData(error);
        
      default:
        return { success: false };
    }
  }

  /**
   * Execute skip action
   */
  private async executeSkip(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    this.logger.info('Skipping failed operation', { error: error.type });
    return { success: true, final_state: 'skipped' };
  }

  /**
   * Execute notify action
   */
  private async executeNotify(action: ErrorRecoveryAction, error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    // Create notification record
    try {
      await this.client.createRecord('sys_email', {
        to: 'admin@company.com',
        subject: `Flow Error: ${error.type}`,
        body: `An error occurred in flow operation: ${error.message}`
      });
      
      return { success: true, final_state: 'notified' };
    } catch (notifyError) {
      return { success: false };
    }
  }

  /**
   * Retry original operation
   */
  private async retryOriginalOperation(error: FlowError): Promise<any> {
    // This would contain the logic to retry the original operation
    // Implementation depends on the specific operation being retried
    throw new Error('Retry logic not implemented for this operation');
  }

  /**
   * Create missing resource
   */
  private async createMissingResource(error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    // Implementation depends on the specific resource type
    return { success: false };
  }

  /**
   * Use fallback values
   */
  private async useFallbackValues(error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    // Implementation depends on the specific validation error
    return { success: false };
  }

  /**
   * Use cached data
   */
  private async useCachedData(error: FlowError): Promise<{
    success: boolean;
    final_state?: any;
  }> {
    // Implementation depends on the specific cached data available
    return { success: false };
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(error: FlowError, result: ErrorHandlingResult): string {
    if (result.recovered) {
      return `The operation encountered an issue but was automatically recovered. ${error.message}`;
    }
    
    switch (error.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please check your credentials and try again.';
      case ErrorType.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this operation.';
      case ErrorType.VALIDATION_ERROR:
        return 'The provided data is invalid. Please check your inputs and try again.';
      case ErrorType.NETWORK_ERROR:
        return 'Network connection failed. Please check your connection and try again.';
      case ErrorType.RESOURCE_NOT_FOUND:
        return 'The requested resource was not found. It may have been deleted or moved.';
      default:
        return `An error occurred: ${error.message}`;
    }
  }

  /**
   * Generate technical details
   */
  private generateTechnicalDetails(error: FlowError, result: ErrorHandlingResult): string {
    const details = {
      error_type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      actions_taken: result.actions_taken.map(a => a.type),
      recovered: result.recovered,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(details, null, 2);
  }

  /**
   * Get max retries for error type
   */
  private getMaxRetries(errorType: ErrorType): number {
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
      case ErrorType.TIMEOUT_ERROR:
        return 3;
      case ErrorType.RATE_LIMIT_ERROR:
        return 2;
      case ErrorType.SERVICE_UNAVAILABLE:
        return 5;
      default:
        return 1;
    }
  }

  /**
   * Capture state snapshot
   */
  private captureStateSnapshot(transaction: TransactionState): any {
    return {
      transaction_id: transaction.id,
      flow_id: transaction.flow_id,
      operation_count: transaction.operations.length,
      status: transaction.status,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): string {
    return `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total_errors: number;
    errors_by_type: Record<string, number>;
    errors_by_severity: Record<string, number>;
    recovery_rate: number;
  } {
    const stats = {
      total_errors: this.errorHistory.length,
      errors_by_type: {} as Record<string, number>,
      errors_by_severity: {} as Record<string, number>,
      recovery_rate: 0
    };
    
    let recoveredCount = 0;
    
    for (const error of this.errorHistory) {
      // Count by type
      stats.errors_by_type[error.type] = (stats.errors_by_type[error.type] || 0) + 1;
      
      // Count by severity
      stats.errors_by_severity[error.severity] = (stats.errors_by_severity[error.severity] || 0) + 1;
      
      // Count recovered errors
      if (error.recoverable) {
        recoveredCount++;
      }
    }
    
    stats.recovery_rate = stats.total_errors > 0 ? recoveredCount / stats.total_errors : 0;
    
    return stats;
  }

  /**
   * Get active transactions
   */
  getActiveTransactions(): TransactionState[] {
    return Array.from(this.transactions.values())
      .filter(t => t.status === 'active');
  }
}
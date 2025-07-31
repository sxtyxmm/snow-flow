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
   * Retry original operation with exponential backoff
   */
  private async retryOriginalOperation(error: FlowError): Promise<any> {
    const maxRetries = error.max_retries || 3;
    const currentRetryCount = error.retry_count || 0;
    
    this.logger.info(`Attempting retry ${currentRetryCount + 1}/${maxRetries} for operation`, {
      operation: error.context.operation,
      error_type: error.type,
      previous_attempts: currentRetryCount
    });

    // Check if we've exceeded max retries
    if (currentRetryCount >= maxRetries) {
      this.logger.error('Maximum retry attempts exceeded', {
        operation: error.context.operation,
        total_attempts: currentRetryCount,
        final_error: error.message
      });
      
      return {
        success: false,
        final_state: null,
        retry_exhausted: true,
        total_attempts: currentRetryCount,
        last_error: error.message,
        suggested_actions: [
          'Review the operation configuration',
          'Check ServiceNow system status',
          'Contact administrator for manual intervention',
          'Consider alternative approach'
        ]
      };
    }

    // Calculate retry delay using exponential backoff
    const baseDelay = this.retryDelays[Math.min(currentRetryCount, this.retryDelays.length - 1)];
    const jitterDelay = baseDelay + Math.random() * 1000; // Add jitter to prevent thundering herd
    
    this.logger.info(`Waiting ${Math.round(jitterDelay)}ms before retry attempt`, {
      retry_count: currentRetryCount + 1,
      base_delay: baseDelay,
      actual_delay: Math.round(jitterDelay)
    });

    // Wait before retry
    await this.delay(jitterDelay);

    try {
      // Determine retry strategy based on error type
      const retryResult = await this.executeRetryBasedOnErrorType(error);
      
      if (retryResult.success) {
        this.logger.info('Retry attempt successful', {
          operation: error.context.operation,
          retry_count: currentRetryCount + 1,
          success_after_attempts: currentRetryCount + 1
        });
        
        return {
          success: true,
          final_state: retryResult.data,
          retry_count: currentRetryCount + 1,
          recovery_method: 'retry_with_backoff'
        };
      } else {
        // Update error with new retry count and continue retry cycle
        const updatedError: FlowError = {
          ...error,
          retry_count: currentRetryCount + 1,
          message: retryResult.error || error.message
        };
        
        // Recursively retry if not at max attempts
        return await this.retryOriginalOperation(updatedError);
      }
      
    } catch (retryError) {
      this.logger.error('Error during retry attempt', {
        retry_count: currentRetryCount + 1,
        error: retryError instanceof Error ? retryError.message : String(retryError)
      });
      
      // Create updated error for next retry or final failure
      const updatedError: FlowError = {
        ...error,
        retry_count: currentRetryCount + 1,
        message: retryError instanceof Error ? retryError.message : String(retryError),
        original_error: retryError instanceof Error ? retryError : new Error(String(retryError))
      };
      
      // Continue retry cycle
      return await this.retryOriginalOperation(updatedError);
    }
  }

  /**
   * Execute retry based on specific error type
   */
  private async executeRetryBasedOnErrorType(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      switch (error.type) {
        case ErrorType.AUTHENTICATION_ERROR:
          return await this.retryAuthenticationOperation(error);
          
        case ErrorType.NETWORK_ERROR:
        case ErrorType.TIMEOUT_ERROR:
          return await this.retryNetworkOperation(error);
          
        case ErrorType.RATE_LIMIT_ERROR:
          return await this.retryRateLimitedOperation(error);
          
        case ErrorType.SERVICE_UNAVAILABLE:
          return await this.retryServiceUnavailableOperation(error);
          
        case ErrorType.API_ERROR:
          return await this.retryAPIOperation(error);
          
        case ErrorType.CONFLICT_ERROR:
          return await this.retryConflictOperation(error);
          
        case ErrorType.RESOURCE_NOT_FOUND:
          return await this.retryResourceOperation(error);
          
        default:
          return await this.retryGenericOperation(error);
      }
    } catch (executeError) {
      return {
        success: false,
        error: executeError instanceof Error ? executeError.message : String(executeError)
      };
    }
  }

  /**
   * Retry authentication operations
   */
  private async retryAuthenticationOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying authentication operation');
      
      // Try to refresh authentication
      const credentials = this.client.credentialsInstance;
      if (credentials?.refreshToken) {
        // Attempt token refresh
        const refreshResult = await (this.client as any).oauth?.refreshAccessToken();
        if (refreshResult?.success) {
          // Retry the original operation with new token
          return await this.retryWithNewAuthentication(error);
        }
      }
      
      return {
        success: false,
        error: 'Authentication refresh failed - manual re-authentication required'
      };
    } catch (authError) {
      return {
        success: false,
        error: authError instanceof Error ? authError.message : String(authError)
      };
    }
  }

  /**
   * Retry network operations
   */
  private async retryNetworkOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying network operation');
      
      // For network errors, simply retry the original request
      return await this.executeOriginalOperation(error);
    } catch (networkError) {
      return {
        success: false,
        error: networkError instanceof Error ? networkError.message : String(networkError)
      };
    }
  }

  /**
   * Retry rate limited operations with longer delay
   */
  private async retryRateLimitedOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying rate limited operation with extended delay');
      
      // Rate limit errors need longer delays
      const rateLimitDelay = 30000 + Math.random() * 10000; // 30-40 seconds
      await this.delay(rateLimitDelay);
      
      return await this.executeOriginalOperation(error);
    } catch (rateLimitError) {
      return {
        success: false,
        error: rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError)
      };
    }
  }

  /**
   * Retry service unavailable operations
   */
  private async retryServiceUnavailableOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying operation after service unavailability');
      
      // Check service health before retry
      const healthCheck = await this.performServiceHealthCheck();
      if (!healthCheck.healthy) {
        return {
          success: false,
          error: `Service still unavailable: ${healthCheck.reason}`
        };
      }
      
      return await this.executeOriginalOperation(error);
    } catch (serviceError) {
      return {
        success: false,
        error: serviceError instanceof Error ? serviceError.message : String(serviceError)
      };
    }
  }

  /**
   * Retry API operations
   */
  private async retryAPIOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying API operation');
      
      // API errors might be transient, retry with same parameters
      return await this.executeOriginalOperation(error);
    } catch (apiError) {
      return {
        success: false,
        error: apiError instanceof Error ? apiError.message : String(apiError)
      };
    }
  }

  /**
   * Retry conflict operations with modified data
   */
  private async retryConflictOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying conflict operation with modifications');
      
      // For conflicts, try to modify the operation slightly
      const modifiedOperation = await this.modifyOperationForConflictResolution(error);
      return await this.executeModifiedOperation(error, modifiedOperation);
    } catch (conflictError) {
      return {
        success: false,
        error: conflictError instanceof Error ? conflictError.message : String(conflictError)
      };
    }
  }

  /**
   * Retry resource operations
   */
  private async retryResourceOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying resource operation');
      
      // For resource not found, try to create the resource first
      const resourceCreated = await this.ensureResourceExists(error);
      if (resourceCreated.success) {
        return await this.executeOriginalOperation(error);
      }
      
      return {
        success: false,
        error: `Failed to create required resource: ${resourceCreated.error}`
      };
    } catch (resourceError) {
      return {
        success: false,
        error: resourceError instanceof Error ? resourceError.message : String(resourceError)
      };
    }
  }

  /**
   * Generic retry operation
   */
  private async retryGenericOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Performing generic retry operation');
      
      // Generic retry - just execute the original operation again
      return await this.executeOriginalOperation(error);
    } catch (genericError) {
      return {
        success: false,
        error: genericError instanceof Error ? genericError.message : String(genericError)
      };
    }
  }

  /**
   * Execute the original operation that failed
   */
  private async executeOriginalOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // This would reconstruct and execute the original operation
      // For now, we'll simulate the operation based on context
      const operation = error.context.operation;
      const operationType = this.extractOperationType(operation);
      
      switch (operationType) {
        case 'deploy':
          return await this.retryDeployOperation(error);
        case 'search':
          return await this.retrySearchOperation(error);
        case 'create':
          return await this.retryCreateOperation(error);
        case 'update':
          return await this.retryUpdateOperation(error);
        default:
          // Generic HTTP request retry
          return await this.retryHTTPRequest(error);
      }
    } catch (executeError) {
      return {
        success: false,
        error: executeError instanceof Error ? executeError.message : String(executeError)
      };
    }
  }

  // Helper methods for specific operation types
  private async retryDeployOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying deployment operation', { 
        component_type: error.context.component_type,
        component_id: error.context.component_id 
      });
      
      // Extract deployment parameters from context
      const deploymentData = error.context.user_input;
      if (!deploymentData) {
        return { success: false, error: 'No deployment data available for retry' };
      }
      
      // Retry based on component type
      switch (error.context.component_type) {
        case 'widget':
          return await this.retryWidgetDeployment(deploymentData, error);
        case 'flow':
          return await this.retryFlowDeployment(deploymentData, error);
        case 'application':
          return await this.retryApplicationDeployment(deploymentData, error);
        case 'script':
          return await this.retryScriptDeployment(deploymentData, error);
        default:
          return await this.retryGenericDeployment(deploymentData, error);
      }
    } catch (deployError) {
      return {
        success: false,
        error: deployError instanceof Error ? deployError.message : String(deployError)
      };
    }
  }

  private async retrySearchOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying search operation', { operation: error.context.operation });
      
      const searchParams = error.context.user_input;
      if (!searchParams) {
        return { success: false, error: 'No search parameters available for retry' };
      }
      
      // Modify search parameters if this is a retry to avoid same failure
      const modifiedParams = {
        ...searchParams,
        sysparm_limit: Math.min(searchParams.sysparm_limit || 100, 50), // Reduce limit
        sysparm_offset: searchParams.sysparm_offset || 0,
        retry_attempt: (error.retry_count || 0) + 1
      };
      
      // Perform the search request
      const result = await this.client.makeRequest({
        method: 'GET',
        endpoint: searchParams.endpoint || '/api/now/table/sys_metadata',
        params: modifiedParams
      });
      
      if (result.status === 200) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: `Search failed with status: ${result.status}` };
      }
    } catch (searchError) {
      return {
        success: false,
        error: searchError instanceof Error ? searchError.message : String(searchError)
      };
    }
  }

  private async retryCreateOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying create operation', { 
        table: error.context.component_type,
        retry_count: error.retry_count 
      });
      
      const createData = error.context.user_input;
      if (!createData || !createData.table) {
        return { success: false, error: 'No create data or table specified for retry' };
      }
      
      // Modify data for conflict resolution if needed
      const retryData = { ...createData.data };
      
      // If this is a conflict retry, modify unique fields
      if (error.type === ErrorType.CONFLICT_ERROR && error.retry_count > 0) {
        const timestamp = Date.now();
        if (retryData.name) {
          retryData.name = `${retryData.name}_retry_${timestamp}`;
        }
        if (retryData.sys_name) {
          retryData.sys_name = `${retryData.sys_name}_retry_${timestamp}`;
        }
      }
      
      // Perform the create request
      const result = await this.client.createRecord(createData.table, retryData);
      
      if (result && (result as any).sys_id) {
        this.logger.info('Create operation retry successful', { sys_id: (result as any).sys_id });
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Create operation failed - no sys_id returned' };
      }
    } catch (createError) {
      return {
        success: false,
        error: createError instanceof Error ? createError.message : String(createError)
      };
    }
  }

  private async retryUpdateOperation(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying update operation', { 
        table: error.context.component_type,
        record_id: error.context.component_id 
      });
      
      const updateData = error.context.user_input;
      if (!updateData || !updateData.table || !updateData.record_id) {
        return { success: false, error: 'No update data, table, or record ID available for retry' };
      }
      
      // First, verify the record still exists
      try {
        const existingRecord = await this.client.getRecord(updateData.table, updateData.record_id);
        if (!existingRecord) {
          return { success: false, error: 'Record no longer exists for update' };
        }
      } catch (getError) {
        return { success: false, error: 'Cannot verify record existence for update retry' };
      }
      
      // Perform the update request
      const result = await this.client.updateRecord(
        updateData.table, 
        updateData.record_id, 
        updateData.data
      );
      
      if (result) {
        this.logger.info('Update operation retry successful', { sys_id: updateData.record_id });
        return { success: true, data: result };
      } else {
        return { success: false, error: 'Update operation failed' };
      }
    } catch (updateError) {
      return {
        success: false,
        error: updateError instanceof Error ? updateError.message : String(updateError)
      };
    }
  }

  private async retryHTTPRequest(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying HTTP request', { operation: error.context.operation });
      
      const requestData = error.context.user_input;
      if (!requestData) {
        return { success: false, error: 'No request data available for HTTP retry' };
      }
      
      // Construct request with retry-safe parameters
      const requestConfig = {
        method: requestData.method || 'GET',
        endpoint: requestData.endpoint || requestData.url,
        params: requestData.params,
        data: requestData.data,
        timeout: Math.min((requestData.timeout || 30000) * 1.5, 60000), // Increase timeout
        retry_attempt: (error.retry_count || 0) + 1
      };
      
      // Add retry headers
      const headers = {
        ...requestData.headers,
        'X-Retry-Attempt': String(requestConfig.retry_attempt),
        'X-Request-ID': `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const result = await this.client.makeRequest({
        ...requestConfig,
        headers
      });
      
      if (result.status >= 200 && result.status < 300) {
        return { success: true, data: result.data };
      } else {
        return { 
          success: false, 
          error: `HTTP request failed with status: ${result.status} - ${result.statusText}` 
        };
      }
    } catch (httpError) {
      return {
        success: false,
        error: httpError instanceof Error ? httpError.message : String(httpError)
      };
    }
  }

  // Additional helper methods

  private async retryWithNewAuthentication(error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    // Retry with refreshed authentication
    return await this.executeOriginalOperation(error);
  }

  private async performServiceHealthCheck(): Promise<{healthy: boolean, reason?: string}> {
    try {
      // Basic health check - try to access ServiceNow instance
      const response = await this.client.makeRequest({
        method: 'GET',
        endpoint: '/api/now/v2/table/sys_user',
        params: { sysparm_limit: 1 }
      });
      
      return { healthy: response.status === 200 };
    } catch (healthError) {
      return { 
        healthy: false, 
        reason: healthError instanceof Error ? healthError.message : 'Unknown health check error' 
      };
    }
  }

  private async modifyOperationForConflictResolution(error: FlowError): Promise<any> {
    // Modify operation to resolve conflicts (e.g., add timestamp to name)
    const timestamp = Date.now();
    return {
      ...error.context.system_state,
      name: `${error.context.system_state?.name || 'item'}_${timestamp}`,
      modified_for_conflict: true
    };
  }

  private async executeModifiedOperation(error: FlowError, modifiedData: any): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Executing modified operation for conflict resolution', {
        original_operation: error.context.operation,
        modifications: modifiedData.modified_for_conflict ? 'conflict_resolution' : 'standard'
      });
      
      // Execute the operation with modified data based on operation type
      const operationType = this.extractOperationType(error.context.operation);
      
      switch (operationType) {
        case 'create':
          const table = error.context.component_type || 'sys_metadata';
          const result = await this.client.createRecord(table, modifiedData);
          return { success: true, data: result };
          
        case 'update':
          if (!error.context.component_id) {
            return { success: false, error: 'No component ID for update operation' };
          }
          const updateResult = await this.client.updateRecord(
            error.context.component_type || 'sys_metadata',
            error.context.component_id,
            modifiedData
          );
          return { success: true, data: updateResult };
          
        case 'deploy':
          // For deployment operations, use the deployment data structure
          return await this.retryGenericDeployment(modifiedData, error);
          
        default:
          return { success: false, error: 'Unsupported operation type for modification' };
      }
    } catch (executeError) {
      return {
        success: false,
        error: executeError instanceof Error ? executeError.message : String(executeError)
      };
    }
  }

  private async ensureResourceExists(error: FlowError): Promise<{success: boolean, error?: string}> {
    try {
      this.logger.info('Attempting to create missing resource', {
        resource_type: error.context.component_type,
        resource_id: error.context.component_id
      });
      
      // Extract resource information from context
      const resourceData = error.context.user_input;
      if (!resourceData) {
        return { success: false, error: 'No resource data available for creation' };
      }
      
      // Determine resource type and create accordingly
      switch (error.context.component_type) {
        case 'table':
          return await this.createMissingTable(resourceData);
        case 'field':
          return await this.createMissingField(resourceData);
        case 'user':
          return await this.createMissingUser(resourceData);
        case 'group':
          return await this.createMissingGroup(resourceData);
        default:
          // Generic resource creation
          return await this.createGenericResource(resourceData);
      }
    } catch (resourceError) {
      return {
        success: false,
        error: resourceError instanceof Error ? resourceError.message : String(resourceError)
      };
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  // =====================================
  // DEPLOYMENT RETRY METHODS
  // =====================================

  /**
   * Retry widget deployment
   */
  private async retryWidgetDeployment(deploymentData: any, error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying widget deployment', { widget_name: deploymentData.name });
      
      // Construct widget data with retry modifications
      const widgetData = {
        name: deploymentData.name,
        title: deploymentData.title,
        template: deploymentData.template,
        server_script: deploymentData.server_script,
        client_script: deploymentData.client_script,
        css: deploymentData.css,
        category: deploymentData.category || 'custom',
        roles: deploymentData.roles || '',
        public: deploymentData.public !== false
      };

      // If this is a conflict retry, modify the name
      if (error.type === ErrorType.CONFLICT_ERROR && (error.retry_count || 0) > 0) {
        widgetData.name = `${widgetData.name}_retry_${Date.now()}`;
      }

      const result = await this.client.createRecord('sp_widget', widgetData);
      return { success: true, data: result };
    } catch (widgetError) {
      return {
        success: false,
        error: widgetError instanceof Error ? widgetError.message : String(widgetError)
      };
    }
  }

  /**
   * Retry flow deployment
   */
  private async retryFlowDeployment(deploymentData: any, error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying flow deployment', { flow_name: deploymentData.name });
      
      const flowData = {
        name: deploymentData.name,
        description: deploymentData.description,
        active: deploymentData.active !== false,
        flow_designer: deploymentData.flow_definition || '{}',
        trigger_conditions: deploymentData.trigger_conditions,
        table: deploymentData.table
      };

      // Handle conflict retry
      if (error.type === ErrorType.CONFLICT_ERROR && (error.retry_count || 0) > 0) {
        flowData.name = `${flowData.name}_retry_${Date.now()}`;
      }

      const result = await this.client.createRecord('sys_hub_flow', flowData);
      return { success: true, data: result };
    } catch (flowError) {
      return {
        success: false,
        error: flowError instanceof Error ? flowError.message : String(flowError)
      };
    }
  }

  /**
   * Retry application deployment
   */
  private async retryApplicationDeployment(deploymentData: any, error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying application deployment', { app_name: deploymentData.name });
      
      const appData = {
        name: deploymentData.name,
        short_description: deploymentData.short_description,
        description: deploymentData.description,
        version: deploymentData.version || '1.0.0',
        vendor: deploymentData.vendor || 'Custom',
        vendor_prefix: deploymentData.vendor_prefix,
        active: deploymentData.active !== false
      };

      // Handle conflict retry
      if (error.type === ErrorType.CONFLICT_ERROR && (error.retry_count || 0) > 0) {
        appData.name = `${appData.name}_retry_${Date.now()}`;
      }

      const result = await this.client.createRecord('sys_app', appData);
      return { success: true, data: result };
    } catch (appError) {
      return {
        success: false,
        error: appError instanceof Error ? appError.message : String(appError)
      };
    }
  }

  /**
   * Retry script deployment
   */
  private async retryScriptDeployment(deploymentData: any, error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying script deployment', { script_name: deploymentData.name });
      
      const scriptData = {
        name: deploymentData.name,
        script: deploymentData.script,
        description: deploymentData.description,
        api_name: deploymentData.api_name,
        client_callable: deploymentData.client_callable || false,
        active: deploymentData.active !== false
      };

      // Handle conflict retry
      if (error.type === ErrorType.CONFLICT_ERROR && (error.retry_count || 0) > 0) {
        scriptData.name = `${scriptData.name}_retry_${Date.now()}`;
      }

      const result = await this.client.createRecord('sys_script_include', scriptData);
      return { success: true, data: result };
    } catch (scriptError) {
      return {
        success: false,
        error: scriptError instanceof Error ? scriptError.message : String(scriptError)
      };
    }
  }

  /**
   * Generic deployment retry
   */
  private async retryGenericDeployment(deploymentData: any, error: FlowError): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      this.logger.info('Retrying generic deployment', { 
        component_type: error.context.component_type,
        data_keys: Object.keys(deploymentData)
      });

      // Determine table from component type or data
      const table = deploymentData.table || 
                   this.getTableFromComponentType(error.context.component_type) ||
                   'sys_metadata';

      const result = await this.client.createRecord(table, deploymentData);
      return { success: true, data: result };
    } catch (genericError) {
      return {
        success: false,
        error: genericError instanceof Error ? genericError.message : String(genericError)
      };
    }
  }

  // =====================================
  // RESOURCE CREATION METHODS
  // =====================================

  /**
   * Create missing table
   */
  private async createMissingTable(resourceData: any): Promise<{success: boolean, error?: string}> {
    try {
      const tableData = {
        name: resourceData.table_name || resourceData.name,
        label: resourceData.label || resourceData.table_name,
        super_class: resourceData.super_class || 'sys_metadata',
        is_extendable: resourceData.is_extendable !== false
      };

      await this.client.createRecord('sys_db_object', tableData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Create missing field
   */
  private async createMissingField(resourceData: any): Promise<{success: boolean, error?: string}> {
    try {
      const fieldData = {
        table: resourceData.table,
        column_name: resourceData.field_name,
        column_label: resourceData.label || resourceData.field_name,
        internal_type: resourceData.type || 'string',
        max_length: resourceData.max_length || 40
      };

      await this.client.createRecord('sys_dictionary', fieldData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Create missing user
   */
  private async createMissingUser(resourceData: any): Promise<{success: boolean, error?: string}> {
    try {
      const userData = {
        user_name: resourceData.user_name,
        first_name: resourceData.first_name || 'Unknown',
        last_name: resourceData.last_name || 'User',
        email: resourceData.email,
        active: resourceData.active !== false
      };

      await this.client.createRecord('sys_user', userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Create missing group
   */
  private async createMissingGroup(resourceData: any): Promise<{success: boolean, error?: string}> {
    try {
      const groupData = {
        name: resourceData.group_name || resourceData.name,
        description: resourceData.description || `Group ${resourceData.name}`,
        active: resourceData.active !== false
      };

      await this.client.createRecord('sys_user_group', groupData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Create generic resource
   */
  private async createGenericResource(resourceData: any): Promise<{success: boolean, error?: string}> {
    try {
      const table = resourceData.table || 'sys_metadata';
      await this.client.createRecord(table, resourceData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Get ServiceNow table name from component type
   */
  private getTableFromComponentType(componentType?: string): string | null {
    if (!componentType) return null;
    
    const tableMap: Record<string, string> = {
      'widget': 'sp_widget',
      'flow': 'sys_hub_flow',
      'application': 'sys_app',
      'script': 'sys_script_include',
      'business_rule': 'sys_script',
      'client_script': 'sys_script_client',
      'ui_policy': 'sys_ui_policy',
      'ui_action': 'sys_ui_action',
      'table': 'sys_db_object',
      'field': 'sys_dictionary',
      'user': 'sys_user',
      'group': 'sys_user_group'
    };
    
    return tableMap[componentType.toLowerCase()] || null;
  }

  /**
   * Enhanced operation type extraction
   */
  private extractOperationType(operation: string): string {
    const op = operation.toLowerCase();
    
    // More specific operation detection
    if (op.includes('deploy') || op.includes('create_') || op.includes('snow_deploy')) return 'deploy';
    if (op.includes('search') || op.includes('find') || op.includes('query') || op.includes('discover')) return 'search';
    if (op.includes('create') || op.includes('insert') || op.includes('add')) return 'create';
    if (op.includes('update') || op.includes('modify') || op.includes('edit') || op.includes('patch')) return 'update';
    if (op.includes('delete') || op.includes('remove')) return 'delete';
    if (op.includes('get') || op.includes('fetch') || op.includes('retrieve')) return 'read';
    if (op.includes('authenticate') || op.includes('login') || op.includes('auth')) return 'auth';
    if (op.includes('http') || op.includes('request') || op.includes('api')) return 'http';
    
    return 'generic';
  }

  /**
   * Check if error type is retryable
   */
  isRetryableError(errorType: ErrorType): boolean {
    const retryableErrors = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.RATE_LIMIT_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.API_ERROR,
      ErrorType.CONFLICT_ERROR
    ];
    
    return retryableErrors.includes(errorType);
  }

  /**
   * Get circuit breaker status for operation
   */
  getCircuitBreakerStatus(operation: string): {
    isOpen: boolean;
    failureCount: number;
    lastFailureTime?: Date;
  } {
    // Simple circuit breaker implementation
    const recentErrors = this.errorHistory
      .filter(error => 
        error.context.operation === operation && 
        error.context.timestamp.getTime() > Date.now() - 300000 // Last 5 minutes
      );
    
    const failureCount = recentErrors.length;
    const isOpen = failureCount >= 5; // Open circuit after 5 failures
    
    return {
      isOpen,
      failureCount,
      lastFailureTime: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].context.timestamp : undefined
    };
  }
}
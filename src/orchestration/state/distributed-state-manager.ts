/**
 * Distributed State Management System
 * 
 * Manages distributed shared memory and state synchronization across
 * external Claude Code instances using consensus algorithms and conflict resolution.
 */

import { EventEmitter } from 'events';
import {
  DistributedSharedMemory,
  MemoryValue,
  SharedStateReference,
  ConsistencyLevel,
  SyncResult,
  MemoryConflict,
  ConflictResolutionStrategy,
  SyncError,
  MemoryChangeCallback
} from '../interfaces/distributed-orchestration.interface.js';
import { logger } from '../../utils/logger.js';

export class DistributedStateManager extends EventEmitter implements DistributedSharedMemory {
  private localCache: Map<string, MemoryValue> = new Map();
  private distributedStore: DistributedStore;
  private conflictResolver: ConflictResolver;
  private eventBus: EventBus;
  private consensusManager: ConsensusManager;
  private replicationManager: ReplicationManager;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private instanceId: string;

  constructor(
    instanceId: string,
    private config: DistributedStateConfig
  ) {
    super();
    this.instanceId = instanceId;
    this.distributedStore = new DistributedStore(config.storage);
    this.conflictResolver = new ConflictResolver(config.conflictResolution);
    this.eventBus = new EventBus(config.eventBus);
    this.consensusManager = new ConsensusManager(config.consensus);
    this.replicationManager = new ReplicationManager(config.replication);

    this.setupEventHandlers();
    this.startPeriodicSync();
  }

  // ========================================
  // Core State Management Operations
  // ========================================

  async store(
    key: string, 
    value: any, 
    ttl?: number, 
    consistency: ConsistencyLevel = ConsistencyLevel.EVENTUAL
  ): Promise<void> {
    logger.info(`💾 Storing distributed state`, { key, consistency, ttl });

    try {
      // Create memory value with metadata
      const memoryValue: MemoryValue = {
        value,
        timestamp: Date.now(),
        version: await this.getNextVersion(key),
        instanceId: this.instanceId,
        metadata: {
          ttl: ttl ? Date.now() + ttl : undefined,
          checksum: this.calculateChecksum(value),
          consistency,
          tags: this.extractTags(key, value)
        }
      };

      // Handle different consistency levels
      switch (consistency) {
        case ConsistencyLevel.STRONG:
          await this.storeWithStrongConsistency(key, memoryValue);
          break;
        
        case ConsistencyLevel.EVENTUAL:
          await this.storeWithEventualConsistency(key, memoryValue);
          break;
        
        case ConsistencyLevel.WEAK:
          await this.storeWithWeakConsistency(key, memoryValue);
          break;
      }

      logger.info(`✅ Successfully stored state: ${key}`);
      this.emit('state:stored', { key, value: memoryValue, consistency });

    } catch (error) {
      logger.error(`❌ Failed to store state: ${key}`, { error: error.message });
      throw new DistributedStateError(`Store operation failed: ${error.message}`);
    }
  }

  async retrieve(key: string, consistency: ConsistencyLevel = ConsistencyLevel.EVENTUAL): Promise<any> {
    logger.debug(`🔍 Retrieving distributed state: ${key}`, { consistency });

    try {
      let memoryValue: MemoryValue | null = null;

      switch (consistency) {
        case ConsistencyLevel.STRONG:
          memoryValue = await this.retrieveWithStrongConsistency(key);
          break;
        
        case ConsistencyLevel.EVENTUAL:
          memoryValue = await this.retrieveWithEventualConsistency(key);
          break;
        
        case ConsistencyLevel.WEAK:
          memoryValue = await this.retrieveWithWeakConsistency(key);
          break;
      }

      if (!memoryValue) {
        logger.debug(`🔍 State not found: ${key}`);
        return undefined;
      }

      // Check TTL expiration
      if (this.isExpired(memoryValue)) {
        await this.delete(key);
        return undefined;
      }

      logger.debug(`✅ Successfully retrieved state: ${key}`);
      this.emit('state:retrieved', { key, value: memoryValue, consistency });

      return memoryValue.value;

    } catch (error) {
      logger.error(`❌ Failed to retrieve state: ${key}`, { error: error.message });
      throw new DistributedStateError(`Retrieve operation failed: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    logger.info(`🗑️ Deleting distributed state: ${key}`);

    try {
      // Remove from local cache
      this.localCache.delete(key);

      // Remove from distributed store
      await this.distributedStore.delete(key);

      // Notify subscribers
      this.notifySubscribers(key, undefined, 'delete');

      logger.info(`✅ Successfully deleted state: ${key}`);
      this.emit('state:deleted', { key });

    } catch (error) {
      logger.error(`❌ Failed to delete state: ${key}`, { error: error.message });
      throw new DistributedStateError(`Delete operation failed: ${error.message}`);
    }
  }

  // ========================================
  // Subscription Management
  // ========================================

  async subscribe(pattern: string, callback: MemoryChangeCallback): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    
    logger.info(`👁️ Creating subscription: ${subscriptionId}`, { pattern });

    const subscription: SubscriptionInfo = {
      id: subscriptionId,
      pattern,
      callback,
      createdAt: new Date(),
      lastNotified: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // Register with event bus
    await this.eventBus.subscribe(`state.${pattern}`, (event) => {
      this.handleSubscriptionEvent(subscriptionId, event);
    });

    logger.info(`✅ Subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    logger.info(`🛑 Removing subscription: ${subscriptionId}`);

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new DistributedStateError(`Subscription not found: ${subscriptionId}`);
    }

    // Unregister from event bus
    await this.eventBus.unsubscribe(`state.${subscription.pattern}`);

    // Remove from local subscriptions
    this.subscriptions.delete(subscriptionId);

    logger.info(`✅ Subscription removed: ${subscriptionId}`);
  }

  // ========================================
  // State Synchronization
  // ========================================

  async synchronize(targetInstances: string[], keys?: string[]): Promise<SyncResult> {
    logger.info(`🔄 Starting state synchronization`, { 
      targetInstances: targetInstances.length,
      keys: keys?.length || 'all'
    });

    const startTime = Date.now();
    const synchronized: string[] = [];
    const conflicts: MemoryConflict[] = [];
    const errors: SyncError[] = [];

    try {
      // Determine which keys to sync
      const keysToSync = keys || Array.from(this.localCache.keys());
      
      // Sync each key with target instances
      for (const key of keysToSync) {
        try {
          const keyResult = await this.synchronizeKey(key, targetInstances);
          
          if (keyResult.synchronized) {
            synchronized.push(key);
          }

          conflicts.push(...keyResult.conflicts);
          errors.push(...keyResult.errors);

        } catch (error) {
          logger.warn(`⚠️ Failed to sync key: ${key}`, { error: error.message });
          errors.push({
            instanceId: 'local',
            error: `Key sync failed: ${error.message}`,
            retryable: true
          });
        }
      }

      // Resolve conflicts if any
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts);
      }

      const result: SyncResult = {
        success: errors.length === 0,
        synchronized,
        conflicts: conflicts.filter(c => !c.resolutionStrategy),
        errors,
        duration: Date.now() - startTime
      };

      logger.info(`✅ Synchronization completed`, {
        synchronized: synchronized.length,
        conflicts: conflicts.length,
        errors: errors.length,
        duration: result.duration
      });

      this.emit('state:synchronized', result);
      return result;

    } catch (error) {
      logger.error(`❌ Synchronization failed`, { error: error.message });
      
      return {
        success: false,
        synchronized,
        conflicts,
        errors: [...errors, {
          instanceId: 'local',
          error: `Sync operation failed: ${error.message}`,
          retryable: false
        }],
        duration: Date.now() - startTime
      };
    }
  }

  // ========================================
  // Consistency Implementation
  // ========================================

  private async storeWithStrongConsistency(key: string, memoryValue: MemoryValue): Promise<void> {
    logger.debug(`🔒 Strong consistency store: ${key}`);

    // 1. Propose change to consensus group
    const proposal = await this.consensusManager.proposeChange({
      type: 'store',
      key,
      value: memoryValue,
      proposer: this.instanceId
    });

    if (!proposal.approved) {
      throw new DistributedStateError(`Consensus failed for key: ${key}`);
    }

    // 2. Store locally after consensus
    this.localCache.set(key, memoryValue);

    // 3. Replicate to all nodes synchronously
    await this.replicationManager.replicateSync(key, memoryValue);

    // 4. Notify subscribers
    this.notifySubscribers(key, memoryValue, 'create');
  }

  private async storeWithEventualConsistency(key: string, memoryValue: MemoryValue): Promise<void> {
    logger.debug(`⏰ Eventual consistency store: ${key}`);

    // 1. Store locally first
    this.localCache.set(key, memoryValue);

    // 2. Replicate asynchronously
    this.replicationManager.replicateAsync(key, memoryValue)
      .catch(error => {
        logger.warn(`⚠️ Async replication failed for key: ${key}`, { error: error.message });
      });

    // 3. Notify subscribers immediately
    this.notifySubscribers(key, memoryValue, 'create');
  }

  private async storeWithWeakConsistency(key: string, memoryValue: MemoryValue): Promise<void> {
    logger.debug(`📡 Weak consistency store: ${key}`);

    // 1. Store locally only
    this.localCache.set(key, memoryValue);

    // 2. Broadcast change event (best effort)
    this.eventBus.broadcast('state.changed', { key, value: memoryValue, instanceId: this.instanceId })
      .catch(error => {
        logger.debug(`📡 Broadcast failed for key: ${key}`, { error: error.message });
      });

    // 3. Notify local subscribers
    this.notifySubscribers(key, memoryValue, 'create');
  }

  private async retrieveWithStrongConsistency(key: string): Promise<MemoryValue | null> {
    logger.debug(`🔒 Strong consistency retrieve: ${key}`);

    // Read from consensus group to ensure latest value
    const consensusValue = await this.consensusManager.readWithConsensus(key);
    
    if (consensusValue) {
      // Update local cache with consensus value
      this.localCache.set(key, consensusValue);
      return consensusValue;
    }

    return null;
  }

  private async retrieveWithEventualConsistency(key: string): Promise<MemoryValue | null> {
    logger.debug(`⏰ Eventual consistency retrieve: ${key}`);

    // Check local cache first
    const localValue = this.localCache.get(key);
    if (localValue) {
      return localValue;
    }

    // Fallback to distributed store
    const distributedValue = await this.distributedStore.read(key);
    if (distributedValue) {
      this.localCache.set(key, distributedValue);
      return distributedValue;
    }

    return null;
  }

  private async retrieveWithWeakConsistency(key: string): Promise<MemoryValue | null> {
    logger.debug(`📡 Weak consistency retrieve: ${key}`);

    // Only check local cache for weak consistency
    return this.localCache.get(key) || null;
  }

  // ========================================
  // Key Synchronization
  // ========================================

  private async synchronizeKey(key: string, targetInstances: string[]): Promise<KeySyncResult> {
    const localValue = this.localCache.get(key);
    const synchronized: boolean[] = [];
    const conflicts: MemoryConflict[] = [];
    const errors: SyncError[] = [];

    for (const instanceId of targetInstances) {
      try {
        const remoteValue = await this.getRemoteValue(instanceId, key);
        
        if (!remoteValue && localValue) {
          // Local has value, remote doesn't - push to remote
          await this.pushValueToRemote(instanceId, key, localValue);
          synchronized.push(true);
          
        } else if (remoteValue && !localValue) {
          // Remote has value, local doesn't - pull from remote
          this.localCache.set(key, remoteValue);
          synchronized.push(true);
          
        } else if (remoteValue && localValue) {
          // Both have values - check for conflicts
          const conflict = this.detectConflict(key, localValue, remoteValue);
          
          if (conflict) {
            conflicts.push(conflict);
            synchronized.push(false);
          } else {
            // Values are compatible
            synchronized.push(true);
          }
        } else {
          // Neither has value - nothing to sync
          synchronized.push(true);
        }

      } catch (error) {
        logger.warn(`⚠️ Failed to sync key ${key} with instance: ${instanceId}`, { error: error.message });
        errors.push({
          instanceId,
          error: error.message,
          retryable: true
        });
        synchronized.push(false);
      }
    }

    return {
      synchronized: synchronized.every(s => s),
      conflicts,
      errors
    };
  }

  private async getRemoteValue(instanceId: string, key: string): Promise<MemoryValue | null> {
    // Implementation would make remote call to get value
    // For now, return null (would use MCPX protocol)
    return null;
  }

  private async pushValueToRemote(instanceId: string, key: string, value: MemoryValue): Promise<void> {
    // Implementation would push value to remote instance
    // For now, just log (would use MCPX protocol)
    logger.debug(`📤 Pushing value to remote: ${instanceId}`, { key });
  }

  // ========================================
  // Conflict Detection and Resolution
  // ========================================

  private detectConflict(key: string, localValue: MemoryValue, remoteValue: MemoryValue): MemoryConflict | null {
    // Check if values conflict
    if (localValue.version !== remoteValue.version || 
        localValue.timestamp !== remoteValue.timestamp ||
        localValue.metadata?.checksum !== remoteValue.metadata?.checksum) {
      
      return {
        key,
        localValue,
        remoteValues: new Map([[remoteValue.instanceId, remoteValue]]),
        resolutionStrategy: this.selectConflictResolutionStrategy(localValue, remoteValue)
      };
    }

    return null;
  }

  private selectConflictResolutionStrategy(localValue: MemoryValue, remoteValue: MemoryValue): ConflictResolutionStrategy {
    // Default to last write wins
    return {
      type: 'last_write_wins',
      parameters: {}
    };
  }

  private async resolveConflicts(conflicts: MemoryConflict[]): Promise<void> {
    logger.info(`🔧 Resolving ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      try {
        const resolution = await this.conflictResolver.resolve(conflict);
        
        if (resolution.resolved) {
          // Apply resolution
          this.localCache.set(conflict.key, resolution.resolvedValue!);
          logger.info(`✅ Conflict resolved for key: ${conflict.key}`);
        } else {
          logger.warn(`⚠️ Could not resolve conflict for key: ${conflict.key}`);
        }

      } catch (error) {
        logger.error(`❌ Failed to resolve conflict for key: ${conflict.key}`, { error: error.message });
      }
    }
  }

  // ========================================
  // Event Handling and Subscriptions
  // ========================================

  private setupEventHandlers(): void {
    // Handle remote state changes
    this.eventBus.on('state.remote_change', (event) => {
      this.handleRemoteStateChange(event);
    });

    // Handle consensus events
    this.consensusManager.on('consensus.change', (event) => {
      this.handleConsensusChange(event);
    });

    // Handle replication events
    this.replicationManager.on('replication.conflict', (event) => {
      this.handleReplicationConflict(event);
    });
  }

  private handleRemoteStateChange(event: RemoteChangeEvent): void {
    logger.debug(`📡 Remote state change received`, { key: event.key, source: event.sourceInstance });

    // Update local cache with remote change
    if (event.operation === 'store') {
      this.localCache.set(event.key, event.value);
      this.notifySubscribers(event.key, event.value, 'update');
    } else if (event.operation === 'delete') {
      this.localCache.delete(event.key);
      this.notifySubscribers(event.key, undefined, 'delete');
    }
  }

  private handleConsensusChange(event: ConsensusChangeEvent): void {
    logger.info(`🗳️ Consensus change applied`, { key: event.key });

    // Apply consensus decision to local state
    if (event.decision.approved) {
      this.localCache.set(event.key, event.decision.value);
      this.notifySubscribers(event.key, event.decision.value, 'update');
    }
  }

  private handleReplicationConflict(event: ReplicationConflictEvent): void {
    logger.warn(`⚔️ Replication conflict detected`, { key: event.key });

    // Queue conflict for resolution
    this.resolveConflicts([event.conflict]).catch(error => {
      logger.error(`❌ Failed to resolve replication conflict`, { error: error.message });
    });
  }

  private notifySubscribers(key: string, value: MemoryValue | undefined, changeType: 'create' | 'update' | 'delete'): void {
    this.subscriptions.forEach((subscription, subscriptionId) => {
      if (this.matchesPattern(key, subscription.pattern)) {
        try {
          subscription.callback(key, value!, changeType);
          subscription.lastNotified = new Date();
        } catch (error) {
          logger.error(`❌ Subscription callback failed: ${subscriptionId}`, { error: error.message });
        }
      }
    });
  }

  private handleSubscriptionEvent(subscriptionId: string, event: any): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      try {
        subscription.callback(event.key, event.value, event.changeType);
        subscription.lastNotified = new Date();
      } catch (error) {
        logger.error(`❌ Subscription event handling failed: ${subscriptionId}`, { error: error.message });
      }
    }
  }

  // ========================================
  // Utility Methods
  // ========================================

  private async getNextVersion(key: string): Promise<number> {
    const existing = this.localCache.get(key);
    return existing ? existing.version + 1 : 1;
  }

  private calculateChecksum(value: any): string {
    // Simple checksum calculation - in production would use proper hashing
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private extractTags(key: string, value: any): string[] {
    const tags = [];
    
    // Add key-based tags
    if (key.includes('session')) tags.push('session');
    if (key.includes('task')) tags.push('task');
    if (key.includes('agent')) tags.push('agent');
    
    // Add value-based tags
    if (typeof value === 'object' && value !== null) {
      if (value.type) tags.push(`type:${value.type}`);
      if (value.category) tags.push(`category:${value.category}`);
    }
    
    return tags;
  }

  private isExpired(memoryValue: MemoryValue): boolean {
    if (!memoryValue.metadata?.ttl) return false;
    return Date.now() > memoryValue.metadata.ttl;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching - would implement proper glob pattern matching
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      return key.startsWith(pattern.slice(0, -1));
    }
    return key === pattern;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicSync(): void {
    const interval = this.config.syncInterval || 60000; // 1 minute default
    
    setInterval(async () => {
      try {
        logger.debug('🔄 Running periodic state sync');
        
        // Get list of all known instances
        const instances = await this.getKnownInstances();
        
        if (instances.length > 0) {
          await this.synchronize(instances);
        }
        
      } catch (error) {
        logger.warn('⚠️ Periodic sync failed', { error: error.message });
      }
    }, interval);
  }

  private async getKnownInstances(): Promise<string[]> {
    // Implementation would get list of known instances from discovery service
    return [];
  }
}

// ========================================
// Supporting Classes
// ========================================

class DistributedStore {
  constructor(private config: StorageConfig) {}

  async read(key: string): Promise<MemoryValue | null> {
    // Implementation would read from persistent storage
    return null;
  }

  async write(key: string, value: MemoryValue): Promise<void> {
    // Implementation would write to persistent storage
  }

  async delete(key: string): Promise<void> {
    // Implementation would delete from persistent storage
  }

  async replicate(key: string, value: MemoryValue): Promise<void> {
    // Implementation would replicate to other storage nodes
  }
}

class ConflictResolver {
  constructor(private config: ConflictResolutionConfig) {}

  async resolve(conflict: MemoryConflict): Promise<ConflictResolution> {
    logger.info(`🔧 Resolving conflict for key: ${conflict.key}`);

    switch (conflict.resolutionStrategy.type) {
      case 'last_write_wins':
        return this.resolveLastWriteWins(conflict);
      
      case 'vector_clock':
        return this.resolveVectorClock(conflict);
      
      case 'merge':
        return this.resolveMerge(conflict);
      
      case 'manual':
        return this.resolveManual(conflict);
      
      default:
        return { resolved: false, reason: `Unknown resolution strategy: ${conflict.resolutionStrategy.type}` };
    }
  }

  private resolveLastWriteWins(conflict: MemoryConflict): ConflictResolution {
    // Find the value with the latest timestamp
    let latestValue = conflict.localValue;
    let latestTimestamp = conflict.localValue.timestamp;

    for (const remoteValue of conflict.remoteValues.values()) {
      if (remoteValue.timestamp > latestTimestamp) {
        latestValue = remoteValue;
        latestTimestamp = remoteValue.timestamp;
      }
    }

    return {
      resolved: true,
      resolvedValue: latestValue,
      strategy: 'last_write_wins'
    };
  }

  private resolveVectorClock(conflict: MemoryConflict): ConflictResolution {
    // Implementation would use vector clocks for resolution
    // For now, fallback to last write wins
    return this.resolveLastWriteWins(conflict);
  }

  private resolveMerge(conflict: MemoryConflict): ConflictResolution {
    // Implementation would merge conflicting values
    // For now, fallback to last write wins
    return this.resolveLastWriteWins(conflict);
  }

  private resolveManual(conflict: MemoryConflict): ConflictResolution {
    // Implementation would queue for manual resolution
    return {
      resolved: false,
      reason: 'Manual resolution required',
      requiresManualIntervention: true
    };
  }
}

class EventBus {
  private events = new Map<string, Array<(event: any) => void>>();

  constructor(private config: EventBusConfig) {}

  on(eventType: string, callback: (event: any) => void): void {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, []);
    }
    this.events.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: any) => void): void {
    const callbacks = this.events.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(eventType: string, event: any): void {
    const callbacks = this.events.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          logger.error(`❌ Event callback failed`, { eventType, error: error.message });
        }
      });
    }
  }

  async subscribe(pattern: string, callback: (event: any) => void): Promise<void> {
    // Implementation would subscribe to distributed event stream
    this.on(pattern, callback);
  }

  async unsubscribe(pattern: string): Promise<void> {
    // Implementation would unsubscribe from distributed event stream
    this.events.delete(pattern);
  }

  async broadcast(eventType: string, event: any): Promise<void> {
    // Implementation would broadcast to all instances
    this.emit(eventType, event);
  }
}

class ConsensusManager extends EventEmitter {
  constructor(private config: ConsensusConfig) {
    super();
  }

  async proposeChange(proposal: StateChangeProposal): Promise<ConsensusResult> {
    logger.info(`🗳️ Proposing consensus change`, { type: proposal.type, key: proposal.key });

    // Simplified consensus - in production would implement Raft or similar
    const result: ConsensusResult = {
      approved: true,
      votes: new Map([['local', true]]),
      proposal
    };

    this.emit('consensus.change', {
      key: proposal.key,
      decision: result
    });

    return result;
  }

  async readWithConsensus(key: string): Promise<MemoryValue | null> {
    // Implementation would read with consensus guarantees
    return null;
  }
}

class ReplicationManager extends EventEmitter {
  constructor(private config: ReplicationConfig) {
    super();
  }

  async replicateSync(key: string, value: MemoryValue): Promise<void> {
    logger.debug(`📋 Synchronous replication: ${key}`);
    // Implementation would replicate synchronously to all replicas
  }

  async replicateAsync(key: string, value: MemoryValue): Promise<void> {
    logger.debug(`📋 Asynchronous replication: ${key}`);
    // Implementation would replicate asynchronously to replicas
  }
}

// ========================================
// Types and Interfaces
// ========================================

interface DistributedStateConfig {
  storage: StorageConfig;
  conflictResolution: ConflictResolutionConfig;
  eventBus: EventBusConfig;
  consensus: ConsensusConfig;
  replication: ReplicationConfig;
  syncInterval: number;
}

interface StorageConfig {
  type: 'memory' | 'redis' | 'mongodb' | 'postgresql';
  connectionString?: string;
  options: Record<string, any>;
}

interface ConflictResolutionConfig {
  defaultStrategy: 'last_write_wins' | 'vector_clock' | 'merge' | 'manual';
  strategies: Record<string, ConflictResolutionStrategy>;
}

interface EventBusConfig {
  type: 'memory' | 'redis' | 'kafka' | 'nats';
  connectionString?: string;
  options: Record<string, any>;
}

interface ConsensusConfig {
  algorithm: 'raft' | 'pbft' | 'paxos';
  quorumSize: number;
  timeoutMs: number;
}

interface ReplicationConfig {
  factor: number;
  consistency: 'sync' | 'async' | 'mixed';
  zones: string[];
}

interface SubscriptionInfo {
  id: string;
  pattern: string;
  callback: MemoryChangeCallback;
  createdAt: Date;
  lastNotified: Date;
}

interface KeySyncResult {
  synchronized: boolean;
  conflicts: MemoryConflict[];
  errors: SyncError[];
}

interface ConflictResolution {
  resolved: boolean;
  resolvedValue?: MemoryValue;
  strategy?: string;
  reason?: string;
  requiresManualIntervention?: boolean;
}

interface StateChangeProposal {
  type: 'store' | 'delete' | 'update';
  key: string;
  value?: MemoryValue;
  proposer: string;
}

interface ConsensusResult {
  approved: boolean;
  votes: Map<string, boolean>;
  proposal: StateChangeProposal;
}

interface RemoteChangeEvent {
  key: string;
  value: MemoryValue;
  operation: 'store' | 'delete' | 'update';
  sourceInstance: string;
}

interface ConsensusChangeEvent {
  key: string;
  decision: ConsensusResult;
}

interface ReplicationConflictEvent {
  key: string;
  conflict: MemoryConflict;
}

// ========================================
// Error Classes
// ========================================

class DistributedStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DistributedStateError';
  }
}

export { DistributedStateError };
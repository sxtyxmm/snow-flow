import { EventEmitter } from 'eventemitter3';
import { AgentSubscriber, MemoryValue } from './types';
import { SnowAgent } from '../types/snow-flow.types';
import { logger } from '../utils/logger';

export class SharedMemoryManager extends EventEmitter {
  private memory: Map<string, MemoryValue> = new Map();
  private subscribers: Map<string, Set<AgentSubscriber>> = new Map();
  private versionCounters: Map<string, number> = new Map();
  private accessLogs: Map<string, AccessLog[]> = new Map();
  private readonly ttl: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(ttl: number = 3600000) { // 1 hour default TTL
    super();
    this.ttl = ttl;
    
    // Start cleanup interval every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000);

    logger.info('🧠 Shared Memory Manager initialized', { ttl });
  }

  async store(key: string, value: any, notifySubscribers: boolean = true): Promise<void> {
    try {
      const version = this.getNextVersion(key);
      const memoryValue: MemoryValue = {
        value,
        timestamp: Date.now(),
        version,
        metadata: {
          size: this.calculateSize(value),
          type: typeof value,
          lastAccess: Date.now()
        }
      };

      this.memory.set(key, memoryValue);
      
      // Log access
      this.logAccess(key, 'write', value);

      logger.debug('💾 Stored value in shared memory', { 
        key, 
        version, 
        size: memoryValue.metadata?.size 
      });

      if (notifySubscribers) {
        await this.notifySubscribers(key, value, version);
      }

      this.emit('memory:stored', { key, value, version });

    } catch (error) {
      logger.error('❌ Failed to store in shared memory', { key, error: error.message });
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const entry = this.memory.get(key);
      
      if (!entry) {
        logger.debug('🔍 Key not found in shared memory', { key });
        return undefined;
      }

      // Check if expired
      if (this.isExpired(entry)) {
        this.memory.delete(key);
        logger.debug('⏰ Expired entry removed from shared memory', { key });
        return undefined;
      }

      // Update last access
      entry.metadata = {
        ...entry.metadata,
        lastAccess: Date.now()
      };

      // Log access
      this.logAccess(key, 'read', entry.value);

      logger.debug('📖 Retrieved value from shared memory', { 
        key, 
        version: entry.version 
      });

      return entry.value;

    } catch (error) {
      logger.error('❌ Failed to get from shared memory', { key, error: error.message });
      throw error;
    }
  }

  async subscribe(key: string, agent: SnowAgent, callback: (key: string, value: any, version: number) => Promise<void>): Promise<void> {
    try {
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, new Set());
      }

      const subscriber: AgentSubscriber = { agent, callback };
      this.subscribers.get(key)!.add(subscriber);

      logger.info('📡 Agent subscribed to memory key', { 
        agentId: agent.id, 
        key 
      });

      this.emit('memory:subscribed', { agentId: agent.id, key });

    } catch (error) {
      logger.error('❌ Failed to subscribe to shared memory', { key, agentId: agent.id, error: error.message });
      throw error;
    }
  }

  async unsubscribe(key: string, agent: SnowAgent): Promise<void> {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      const toRemove = Array.from(subscribers).find(sub => sub.agent.id === agent.id);
      if (toRemove) {
        subscribers.delete(toRemove);
        logger.info('📡 Agent unsubscribed from memory key', { 
          agentId: agent.id, 
          key 
        });
      }
    }
  }

  async getHistory(key: string, limit: number = 10): Promise<MemoryValue[]> {
    const accessLogs = this.accessLogs.get(key) || [];
    
    return accessLogs
      .filter(log => log.operation === 'write')
      .slice(-limit)
      .map(log => ({
        value: log.value,
        timestamp: log.timestamp,
        version: log.version || 1,
        metadata: log.metadata
      }));
  }

  async getKeys(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.memory.keys());
    
    if (pattern) {
      const regex = new RegExp(pattern);
      return keys.filter(key => regex.test(key));
    }
    
    return keys;
  }

  async delete(key: string): Promise<boolean> {
    try {
      const existed = this.memory.has(key);
      this.memory.delete(key);
      this.subscribers.delete(key);
      this.versionCounters.delete(key);
      this.accessLogs.delete(key);

      if (existed) {
        logger.info('🗑️ Deleted key from shared memory', { key });
        this.emit('memory:deleted', { key });
      }

      return existed;

    } catch (error) {
      logger.error('❌ Failed to delete from shared memory', { key, error: error.message });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keyCount = this.memory.size;
      
      this.memory.clear();
      this.subscribers.clear();
      this.versionCounters.clear();
      this.accessLogs.clear();

      logger.info('🧹 Cleared all shared memory', { deletedKeys: keyCount });
      this.emit('memory:cleared', { deletedKeys: keyCount });

    } catch (error) {
      logger.error('❌ Failed to clear shared memory', { error: error.message });
      throw error;
    }
  }

  async getStats(): Promise<MemoryStats> {
    const totalEntries = this.memory.size;
    const totalSize = Array.from(this.memory.values())
      .reduce((sum, entry) => sum + (entry.metadata?.size || 0), 0);
    
    const subscriberCount = Array.from(this.subscribers.values())
      .reduce((sum, subs) => sum + subs.size, 0);

    const oldestEntry = Array.from(this.memory.values())
      .reduce((oldest, entry) => 
        !oldest || entry.timestamp < oldest.timestamp ? entry : oldest
      );

    return {
      totalEntries,
      totalSize,
      subscriberCount,
      oldestEntryAge: oldestEntry ? Date.now() - oldestEntry.timestamp : 0,
      averageEntrySize: totalEntries > 0 ? totalSize / totalEntries : 0
    };
  }

  async compareAndSwap(key: string, expectedValue: any, newValue: any): Promise<boolean> {
    try {
      const currentEntry = this.memory.get(key);
      
      if (!currentEntry) {
        return false;
      }

      if (JSON.stringify(currentEntry.value) === JSON.stringify(expectedValue)) {
        await this.store(key, newValue);
        return true;
      }

      return false;

    } catch (error) {
      logger.error('❌ Compare and swap failed', { key, error: error.message });
      return false;
    }
  }

  async atomicUpdate(key: string, updateFunction: (currentValue: any) => any): Promise<any> {
    try {
      const currentValue = await this.get(key);
      const newValue = updateFunction(currentValue);
      await this.store(key, newValue);
      return newValue;

    } catch (error) {
      logger.error('❌ Atomic update failed', { key, error: error.message });
      throw error;
    }
  }

  private getNextVersion(key: string): number {
    const current = this.versionCounters.get(key) || 0;
    const next = current + 1;
    this.versionCounters.set(key, next);
    return next;
  }

  private async notifySubscribers(key: string, value: any, version: number): Promise<void> {
    const subscribers = this.subscribers.get(key);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const notifications = Array.from(subscribers).map(async (sub) => {
      try {
        await sub.callback(key, value, version);
      } catch (error) {
        logger.error('❌ Subscriber notification failed', { 
          agentId: sub.agent.id, 
          key, 
          error: error.message 
        });
      }
    });

    await Promise.allSettled(notifications);
  }

  private logAccess(key: string, operation: 'read' | 'write', value: any): void {
    if (!this.accessLogs.has(key)) {
      this.accessLogs.set(key, []);
    }

    const logs = this.accessLogs.get(key)!;
    logs.push({
      timestamp: Date.now(),
      operation,
      value: operation === 'write' ? value : undefined,
      version: this.versionCounters.get(key),
      metadata: {
        size: this.calculateSize(value)
      }
    });

    // Keep only last 100 access logs per key
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
  }

  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  private isExpired(entry: MemoryValue): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  private cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.memory.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.info('🧹 Cleaned up expired memory entries', { count: expiredKeys.length });
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    this.removeAllListeners();
  }
}

interface AccessLog {
  timestamp: number;
  operation: 'read' | 'write';
  value?: any;
  version?: number;
  metadata?: Record<string, any>;
}

interface MemoryStats {
  totalEntries: number;
  totalSize: number;
  subscriberCount: number;
  oldestEntryAge: number;
  averageEntrySize: number;
}
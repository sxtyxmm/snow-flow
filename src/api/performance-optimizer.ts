/**
 * Performance Optimization and Caching Strategy
 * Advanced caching and performance optimization for ServiceNow API calls
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { Logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: Date;
  ttl: number;
  access_count: number;
  last_accessed: Date;
  tags: string[];
  size: number;
}

export interface CacheConfig {
  max_size: number;
  default_ttl: number;
  cleanup_interval: number;
  persistence_enabled: boolean;
  compression_enabled: boolean;
}

export interface PerformanceMetrics {
  cache_hit_rate: number;
  cache_miss_rate: number;
  average_response_time: number;
  api_call_count: number;
  cache_size: number;
  memory_usage: number;
  bandwidth_saved: number;
}

export interface OptimizationHint {
  type: 'batch' | 'cache' | 'compress' | 'parallel' | 'lazy';
  description: string;
  estimated_improvement: number;
  implementation_complexity: 'low' | 'medium' | 'high';
}

export interface BatchRequest {
  id: string;
  requests: APIRequest[];
  priority: 'high' | 'medium' | 'low';
  timeout: number;
  retry_count: number;
}

export interface APIRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  cache_key?: string;
  cacheable: boolean;
  priority: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached: boolean;
  response_time: number;
  cache_hit: boolean;
}

export class PerformanceOptimizer {
  private client: ServiceNowClient;
  private logger: Logger;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private metrics: PerformanceMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  private batchQueue: Map<string, BatchRequest> = new Map();
  private rateLimiter: Map<string, number> = new Map();
  private connectionPool: Map<string, any> = new Map();

  constructor(client: ServiceNowClient, config?: Partial<CacheConfig>) {
    this.client = client;
    this.logger = new Logger('PerformanceOptimizer');
    
    this.config = {
      max_size: 1000,
      default_ttl: 300000, // 5 minutes
      cleanup_interval: 60000, // 1 minute
      persistence_enabled: true,
      compression_enabled: true,
      ...config
    };
    
    this.metrics = {
      cache_hit_rate: 0,
      cache_miss_rate: 0,
      average_response_time: 0,
      api_call_count: 0,
      cache_size: 0,
      memory_usage: 0,
      bandwidth_saved: 0
    };
    
    this.startCleanupTimer();
    this.loadPersistedCache();
  }

  /**
   * Optimized API call with caching and performance monitoring
   */
  async optimizedAPICall<T>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const cacheKey = request.cache_key || this.generateCacheKey(request);
    
    // Check cache first
    if (request.cacheable) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        const responseTime = Date.now() - startTime;
        this.updateMetrics(true, responseTime);
        
        return {
          success: true,
          data: cached,
          cached: true,
          response_time: responseTime,
          cache_hit: true
        };
      }
    }
    
    // Apply rate limiting
    if (this.isRateLimited(request.url)) {
      await this.waitForRateLimit(request.url);
    }
    
    try {
      // Execute API call
      const response = await this.executeAPICall<T>(request);
      const responseTime = Date.now() - startTime;
      
      // Cache successful responses
      if (request.cacheable && response.success && response.data) {
        this.setInCache(cacheKey, response.data, {
          ttl: this.getTTLForRequest(request),
          tags: this.getTagsForRequest(request)
        });
      }
      
      this.updateMetrics(false, responseTime);
      
      return {
        ...response,
        cached: false,
        response_time: responseTime,
        cache_hit: false
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        cached: false,
        response_time: responseTime,
        cache_hit: false
      };
    }
  }

  /**
   * Batch multiple API requests for better performance
   */
  async batchAPIRequests<T>(requests: APIRequest[]): Promise<APIResponse<T>[]> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchRequest: BatchRequest = {
      id: batchId,
      requests: requests.sort((a, b) => b.priority - a.priority),
      priority: 'medium',
      timeout: 30000,
      retry_count: 0
    };
    
    this.batchQueue.set(batchId, batchRequest);
    
    try {
      // Group requests by type for optimization
      const groupedRequests = this.groupRequestsByType(requests);
      const results: APIResponse<T>[] = [];
      
      // Execute groups in parallel
      const groupPromises = Object.entries(groupedRequests).map(async ([type, groupRequests]) => {
        return await this.executeBatchGroup<T>(groupRequests, type);
      });
      
      const groupResults = await Promise.all(groupPromises);
      
      // Flatten results
      for (const groupResult of groupResults) {
        results.push(...groupResult);
      }
      
      return results;
      
    } finally {
      this.batchQueue.delete(batchId);
    }
  }

  /**
   * Preload commonly accessed data
   */
  async preloadData(preloadConfig: {
    action_types: boolean;
    trigger_types: boolean;
    flow_templates: boolean;
    user_preferences: boolean;
  }): Promise<void> {
    const preloadTasks: Promise<void>[] = [];
    
    if (preloadConfig.action_types) {
      preloadTasks.push(this.preloadActionTypes());
    }
    
    if (preloadConfig.trigger_types) {
      preloadTasks.push(this.preloadTriggerTypes());
    }
    
    if (preloadConfig.flow_templates) {
      preloadTasks.push(this.preloadFlowTemplates());
    }
    
    if (preloadConfig.user_preferences) {
      preloadTasks.push(this.preloadUserPreferences());
    }
    
    await Promise.all(preloadTasks);
    this.logger.info('Data preloading completed');
  }

  /**
   * Analyze performance and provide optimization suggestions
   */
  analyzePerformance(): {
    metrics: PerformanceMetrics;
    bottlenecks: string[];
    optimization_hints: OptimizationHint[];
  } {
    const bottlenecks: string[] = [];
    const optimizationHints: OptimizationHint[] = [];
    
    // Analyze cache hit rate
    if (this.metrics.cache_hit_rate < 0.5) {
      bottlenecks.push('Low cache hit rate');
      optimizationHints.push({
        type: 'cache',
        description: 'Increase cache TTL for frequently accessed data',
        estimated_improvement: 0.3,
        implementation_complexity: 'low'
      });
    }
    
    // Analyze response times
    if (this.metrics.average_response_time > 2000) {
      bottlenecks.push('High response times');
      optimizationHints.push({
        type: 'parallel',
        description: 'Implement parallel processing for independent requests',
        estimated_improvement: 0.5,
        implementation_complexity: 'medium'
      });
    }
    
    // Analyze cache size
    if (this.cache.size > this.config.max_size * 0.8) {
      bottlenecks.push('Cache nearing capacity');
      optimizationHints.push({
        type: 'compress',
        description: 'Enable compression for cached data',
        estimated_improvement: 0.4,
        implementation_complexity: 'medium'
      });
    }
    
    // Analyze API call patterns
    const batchableRequests = this.identifyBatchableRequests();
    if (batchableRequests.length > 0) {
      optimizationHints.push({
        type: 'batch',
        description: `Batch ${batchableRequests.length} similar requests`,
        estimated_improvement: 0.6,
        implementation_complexity: 'high'
      });
    }
    
    return {
      metrics: this.metrics,
      bottlenecks,
      optimization_hints: optimizationHints
    };
  }

  /**
   * Implement adaptive caching based on usage patterns
   */
  optimizeCaching(): void {
    const cacheAnalysis = this.analyzeCacheUsage();
    
    // Adjust TTL based on access patterns
    for (const [key, entry] of this.cache) {
      const accessFrequency = entry.access_count / (Date.now() - entry.timestamp.getTime());
      
      if (accessFrequency > 0.01) { // Frequently accessed
        entry.ttl = this.config.default_ttl * 2;
      } else if (accessFrequency < 0.001) { // Rarely accessed
        entry.ttl = this.config.default_ttl * 0.5;
      }
    }
    
    // Implement cache warming for predicted requests
    this.warmCache(cacheAnalysis.predicted_requests);
  }

  /**
   * Get from cache with LRU eviction
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    entry.access_count++;
    entry.last_accessed = new Date();
    
    return entry.value;
  }

  /**
   * Set in cache with size management
   */
  private setInCache<T>(key: string, value: T, options: {
    ttl?: number;
    tags?: string[];
  } = {}): void {
    // Check if cache is full
    if (this.cache.size >= this.config.max_size) {
      this.evictLeastRecent();
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: new Date(),
      ttl: options.ttl || this.config.default_ttl,
      access_count: 1,
      last_accessed: new Date(),
      tags: options.tags || [],
      size: this.estimateSize(value)
    };
    
    this.cache.set(key, entry);
    this.updateCacheMetrics();
  }

  /**
   * Execute API call with connection pooling
   */
  private async executeAPICall<T>(request: APIRequest): Promise<APIResponse<T>> {
    const connection = this.getPooledConnection(request.url);
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (request.method) {
        case 'GET':
          response = await this.client.getRecords(this.extractTable(request.url), request.data);
          break;
        case 'POST':
          response = await this.client.createRecord(this.extractTable(request.url), request.data);
          break;
        case 'PUT':
        case 'PATCH':
          response = await this.client.updateRecord(this.extractTable(request.url), request.data.sys_id, request.data);
          break;
        case 'DELETE':
          response = await this.client.deleteRecord(this.extractTable(request.url), request.data.sys_id);
          break;
        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }
      
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        cached: false,
        response_time: Date.now() - startTime,
        cache_hit: false
      };
      
    } finally {
      this.returnPooledConnection(request.url, connection);
    }
  }

  /**
   * Group requests by type for batch processing
   */
  private groupRequestsByType(requests: APIRequest[]): Record<string, APIRequest[]> {
    const groups: Record<string, APIRequest[]> = {};
    
    for (const request of requests) {
      const type = `${request.method}_${this.extractTable(request.url)}`;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(request);
    }
    
    return groups;
  }

  /**
   * Execute batch group with parallel processing
   */
  private async executeBatchGroup<T>(requests: APIRequest[], type: string): Promise<APIResponse<T>[]> {
    const batchSize = this.getBatchSizeForType(type);
    const results: APIResponse<T>[] = [];
    
    // Process requests in batches
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(request => this.optimizedAPICall<T>(request));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Preload action types
   */
  private async preloadActionTypes(): Promise<void> {
    const request: APIRequest = {
      id: 'preload_action_types',
      method: 'GET',
      url: '/api/now/table/sys_hub_action_type_base',
      cacheable: true,
      priority: 1
    };
    
    await this.optimizedAPICall(request);
  }

  /**
   * Preload trigger types
   */
  private async preloadTriggerTypes(): Promise<void> {
    const request: APIRequest = {
      id: 'preload_trigger_types',
      method: 'GET',
      url: '/api/now/table/sys_hub_trigger_type',
      cacheable: true,
      priority: 1
    };
    
    await this.optimizedAPICall(request);
  }

  /**
   * Preload flow templates
   */
  private async preloadFlowTemplates(): Promise<void> {
    const request: APIRequest = {
      id: 'preload_flow_templates',
      method: 'GET',
      url: '/api/now/table/sys_hub_flow_template',
      cacheable: true,
      priority: 1
    };
    
    await this.optimizedAPICall(request);
  }

  /**
   * Preload user preferences
   */
  private async preloadUserPreferences(): Promise<void> {
    const request: APIRequest = {
      id: 'preload_user_preferences',
      method: 'GET',
      url: '/api/now/table/sys_user_preference',
      cacheable: true,
      priority: 1
    };
    
    await this.optimizedAPICall(request);
  }

  /**
   * Analyze cache usage patterns
   */
  private analyzeCacheUsage(): {
    most_accessed: string[];
    least_accessed: string[];
    predicted_requests: string[];
  } {
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].access_count - a[1].access_count);
    
    const mostAccessed = sortedEntries.slice(0, 10).map(([key]) => key);
    const leastAccessed = sortedEntries.slice(-10).map(([key]) => key);
    
    // Predict likely requests based on patterns
    const predictedRequests = this.predictLikelyRequests(mostAccessed);
    
    return {
      most_accessed: mostAccessed,
      least_accessed: leastAccessed,
      predicted_requests: predictedRequests
    };
  }

  /**
   * Warm cache with predicted requests
   */
  private async warmCache(predictedRequests: string[]): Promise<void> {
    const warmingTasks = predictedRequests.map(async (cacheKey) => {
      if (!this.cache.has(cacheKey)) {
        const request = this.reconstructRequestFromCacheKey(cacheKey);
        if (request) {
          await this.optimizedAPICall(request);
        }
      }
    });
    
    await Promise.all(warmingTasks);
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastRecent(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].last_accessed.getTime() - b[1].last_accessed.getTime());
    
    const entriesToEvict = entries.slice(0, Math.ceil(this.config.max_size * 0.1));
    
    for (const [key] of entriesToEvict) {
      this.cache.delete(key);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(cacheHit: boolean, responseTime: number): void {
    this.metrics.api_call_count++;
    
    if (cacheHit) {
      this.metrics.cache_hit_rate = (this.metrics.cache_hit_rate * (this.metrics.api_call_count - 1) + 1) / this.metrics.api_call_count;
    } else {
      this.metrics.cache_miss_rate = (this.metrics.cache_miss_rate * (this.metrics.api_call_count - 1) + 1) / this.metrics.api_call_count;
    }
    
    this.metrics.average_response_time = (this.metrics.average_response_time * (this.metrics.api_call_count - 1) + responseTime) / this.metrics.api_call_count;
  }

  /**
   * Update cache metrics
   */
  private updateCacheMetrics(): void {
    this.metrics.cache_size = this.cache.size;
    this.metrics.memory_usage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: APIRequest): string {
    const keyParts = [
      request.method,
      request.url,
      JSON.stringify(request.data),
      JSON.stringify(request.headers)
    ];
    
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * Get TTL for specific request type
   */
  private getTTLForRequest(request: APIRequest): number {
    const url = request.url.toLowerCase();
    
    if (url.includes('action_type') || url.includes('trigger_type')) {
      return 3600000; // 1 hour for metadata
    }
    
    if (url.includes('flow_template')) {
      return 1800000; // 30 minutes for templates
    }
    
    if (url.includes('user_preference')) {
      return 600000; // 10 minutes for preferences
    }
    
    return this.config.default_ttl;
  }

  /**
   * Get tags for request
   */
  private getTagsForRequest(request: APIRequest): string[] {
    const tags: string[] = [];
    const url = request.url.toLowerCase();
    
    if (url.includes('action_type')) tags.push('action_type');
    if (url.includes('trigger_type')) tags.push('trigger_type');
    if (url.includes('flow')) tags.push('flow');
    if (url.includes('user')) tags.push('user');
    
    return tags;
  }

  /**
   * Estimate size of cached value
   */
  private estimateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  /**
   * Extract table name from URL
   */
  private extractTable(url: string): string {
    const match = url.match(/\/table\/([^\/\?]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Get batch size for request type
   */
  private getBatchSizeForType(type: string): number {
    if (type.includes('GET')) return 10;
    if (type.includes('POST')) return 5;
    if (type.includes('PUT') || type.includes('PATCH')) return 3;
    if (type.includes('DELETE')) return 3;
    return 5;
  }

  /**
   * Check if request is rate limited
   */
  private isRateLimited(url: string): boolean {
    const domain = this.extractDomain(url);
    const lastRequest = this.rateLimiter.get(domain);
    
    if (!lastRequest) return false;
    
    const timeSinceLastRequest = Date.now() - lastRequest;
    return timeSinceLastRequest < 100; // 100ms rate limit
  }

  /**
   * Wait for rate limit to clear
   */
  private async waitForRateLimit(url: string): Promise<void> {
    const domain = this.extractDomain(url);
    const lastRequest = this.rateLimiter.get(domain);
    
    if (lastRequest) {
      const waitTime = 100 - (Date.now() - lastRequest);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.rateLimiter.set(domain, Date.now());
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'default';
    }
  }

  /**
   * Get pooled connection
   */
  private getPooledConnection(url: string): any {
    const domain = this.extractDomain(url);
    return this.connectionPool.get(domain) || {};
  }

  /**
   * Return pooled connection
   */
  private returnPooledConnection(url: string, connection: any): void {
    const domain = this.extractDomain(url);
    this.connectionPool.set(domain, connection);
  }

  /**
   * Identify batchable requests
   */
  private identifyBatchableRequests(): string[] {
    // Implementation would analyze request patterns
    return [];
  }

  /**
   * Predict likely requests based on patterns
   */
  private predictLikelyRequests(mostAccessed: string[]): string[] {
    // Implementation would use ML or pattern analysis
    return mostAccessed.slice(0, 5);
  }

  /**
   * Reconstruct request from cache key
   */
  private reconstructRequestFromCacheKey(cacheKey: string): APIRequest | null {
    try {
      const decoded = Buffer.from(cacheKey, 'base64').toString();
      const [method, url, data, headers] = decoded.split('|');
      
      return {
        id: 'reconstructed',
        method: method as any,
        url,
        data: JSON.parse(data),
        headers: JSON.parse(headers),
        cacheable: true,
        priority: 1
      };
    } catch {
      return null;
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.config.cleanup_interval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
      this.updateCacheMetrics();
    }
  }

  /**
   * Load persisted cache
   */
  private loadPersistedCache(): void {
    if (!this.config.persistence_enabled) return;
    
    try {
      const cacheFile = path.join(process.env.SNOW_FLOW_HOME || path.join(os.homedir(), '.snow-flow'), 'cache', 'performance_cache.json');
      
      if (fs.existsSync(cacheFile)) {
        const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        
        for (const [key, entry] of Object.entries(cacheData)) {
          this.cache.set(key, {
            ...entry as CacheEntry<any>,
            timestamp: new Date((entry as any).timestamp),
            last_accessed: new Date((entry as any).last_accessed)
          });
        }
        
        this.logger.info(`Loaded ${this.cache.size} entries from persisted cache`);
      }
    } catch (error) {
      this.logger.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Save cache to disk
   */
  saveCacheToDisk(): void {
    if (!this.config.persistence_enabled) return;
    
    try {
      const cacheDir = path.join(process.env.SNOW_FLOW_HOME || path.join(os.homedir(), '.snow-flow'), 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      const cacheFile = path.join(cacheDir, 'performance_cache.json');
      const cacheData = Object.fromEntries(this.cache.entries());
      
      fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
      this.logger.info(`Saved ${this.cache.size} entries to persisted cache`);
    } catch (error) {
      this.logger.warn('Failed to save cache to disk:', error);
    }
  }

  /**
   * Clear cache
   */
  clearCache(tags?: string[]): void {
    if (!tags || tags.length === 0) {
      this.cache.clear();
      this.logger.info('Cleared all cache entries');
    } else {
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.cache) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        this.cache.delete(key);
      }
      
      this.logger.info(`Cleared ${keysToDelete.length} cache entries with tags: ${tags.join(', ')}`);
    }
    
    this.updateCacheMetrics();
  }

  /**
   * Destroy optimizer and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.saveCacheToDisk();
    this.cache.clear();
    this.batchQueue.clear();
    this.rateLimiter.clear();
    this.connectionPool.clear();
    
    this.logger.info('Performance optimizer destroyed');
  }
}
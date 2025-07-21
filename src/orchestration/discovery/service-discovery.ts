/**
 * Service Discovery System
 * 
 * Handles automatic discovery and registration of Claude Code instances and MCP servers
 * in the distributed orchestration environment.
 */

import { EventEmitter } from 'events';
import {
  ClaudeCodeInstance,
  ServiceDefinition,
  ServiceRegistry,
  DiscoveryCriteria,
  ServiceChangeCallback,
  ServiceEvent,
  MCPServerInfo,
  MCPCapability,
  MCPRequirements,
  AgentCapability,
  HealthConfig,
  InstanceStatus
} from '../interfaces/distributed-orchestration.interface';
import { logger } from '../../utils/logger';

export class AgentDiscoveryService extends EventEmitter {
  private registry: ServiceRegistry;
  private healthChecker: HealthChecker;
  private announcer: ServiceAnnouncer;
  private capabilityMatcher: CapabilityMatcher;
  private loadMonitor: LoadMonitor;
  private discoveryConfig: DiscoveryConfig;

  constructor(config: DiscoveryConfig) {
    super();
    this.discoveryConfig = config;
    this.registry = new InMemoryServiceRegistry();
    this.healthChecker = new HealthChecker(config.healthCheck);
    this.announcer = new ServiceAnnouncer(config.announcement);
    this.capabilityMatcher = new CapabilityMatcher();
    this.loadMonitor = new LoadMonitor();
    
    this.startPeriodicDiscovery();
  }

  // ========================================
  // Agent Discovery
  // ========================================

  async discoverAgents(criteria: DiscoveryCriteria = {}): Promise<ClaudeCodeInstance[]> {
    logger.info('🔍 Starting agent discovery', { criteria });

    try {
      // 1. Query registry for available services
      const services = await this.registry.findServices('claude-code-agent', criteria);
      logger.info(`📋 Found ${services.length} registered services`);

      // 2. Convert services to Claude Code instances
      const instances = await this.convertServicesToInstances(services);

      // 3. Filter by health status
      const healthyInstances = await this.filterHealthyAgents(instances);
      logger.info(`💚 ${healthyInstances.length} healthy instances found`);

      // 4. Apply discovery filters
      const filteredInstances = this.applyFilters(healthyInstances, criteria.filters || []);

      // 5. Sort by capability match and performance
      const sortedInstances = await this.sortByRelevance(filteredInstances, criteria);

      logger.info(`✅ Discovery completed: ${sortedInstances.length} agents available`);
      
      this.emit('agents:discovered', { agents: sortedInstances, criteria });
      return sortedInstances;

    } catch (error) {
      logger.error('❌ Agent discovery failed', { error: error.message });
      throw new AgentDiscoveryError(`Discovery failed: ${error.message}`);
    }
  }

  async discoverAgentsByCapability(capabilities: string[]): Promise<ClaudeCodeInstance[]> {
    const criteria: DiscoveryCriteria = {
      capabilities,
      healthStatus: 'healthy'
    };

    const agents = await this.discoverAgents(criteria);
    
    // Score by capability match
    return agents
      .map(agent => ({
        agent,
        score: this.capabilityMatcher.scoreMatch(agent.capabilities, capabilities)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.agent);
  }

  async discoverAgentsByRegion(regions: string[]): Promise<Map<string, ClaudeCodeInstance[]>> {
    const regionMap = new Map<string, ClaudeCodeInstance[]>();

    for (const region of regions) {
      const criteria: DiscoveryCriteria = {
        regions: [region],
        healthStatus: 'healthy'
      };

      const agents = await this.discoverAgents(criteria);
      regionMap.set(region, agents);
    }

    return regionMap;
  }

  // ========================================
  // Service Registration
  // ========================================

  async announceService(instance: ClaudeCodeInstance): Promise<void> {
    logger.info(`📢 Announcing Claude Code instance: ${instance.id}`, {
      endpoint: instance.endpoint,
      capabilities: instance.capabilities.length
    });

    try {
      const serviceDefinition: ServiceDefinition = {
        id: instance.id,
        name: 'claude-code-agent',
        endpoint: instance.endpoint,
        metadata: {
          ...instance.metadata,
          capabilities: instance.capabilities,
          authentication: instance.authentication,
          announcedAt: new Date()
        },
        health: {
          check: `${instance.endpoint}/health`,
          interval: this.discoveryConfig.healthCheck.interval,
          timeout: this.discoveryConfig.healthCheck.timeout,
          retries: 3,
          gracePeriod: 30000
        },
        tags: this.extractTags(instance),
        capabilities: instance.capabilities,
        registeredAt: new Date(),
        lastSeen: new Date()
      };

      await this.registry.register(serviceDefinition);
      
      // Start health monitoring for this instance
      await this.healthChecker.startMonitoring(serviceDefinition);

      logger.info(`✅ Successfully announced service: ${instance.id}`);
      this.emit('service:announced', { instance, serviceDefinition });

    } catch (error) {
      logger.error(`❌ Failed to announce service: ${instance.id}`, { error: error.message });
      throw new ServiceAnnouncementError(`Announcement failed: ${error.message}`);
    }
  }

  async deannounceService(instanceId: string): Promise<void> {
    logger.info(`📴 Deannouncing service: ${instanceId}`);

    try {
      await this.registry.deregister(instanceId);
      await this.healthChecker.stopMonitoring(instanceId);

      logger.info(`✅ Successfully deannounced service: ${instanceId}`);
      this.emit('service:deannounced', { instanceId });

    } catch (error) {
      logger.error(`❌ Failed to deannounce service: ${instanceId}`, { error: error.message });
      throw error;
    }
  }

  // ========================================
  // Continuous Discovery
  // ========================================

  async watchAgents(
    criteria: DiscoveryCriteria, 
    callback: (agents: ClaudeCodeInstance[]) => void
  ): Promise<string> {
    logger.info('👁️ Starting agent watch', { criteria });

    const watchId = this.generateWatchId();
    
    // Initial discovery
    const initialAgents = await this.discoverAgents(criteria);
    callback(initialAgents);

    // Set up continuous watching
    const serviceWatchId = await this.registry.watchServices('claude-code-agent', async (event) => {
      logger.debug('🔄 Service registry event received', { type: event.type, serviceId: event.service.id });
      
      // Re-discover agents when services change
      const updatedAgents = await this.discoverAgents(criteria);
      callback(updatedAgents);
    });

    // Store watch mapping for cleanup
    this.storeWatchMapping(watchId, serviceWatchId);

    return watchId;
  }

  async unwatchAgents(watchId: string): Promise<void> {
    logger.info(`🛑 Stopping agent watch: ${watchId}`);
    
    const serviceWatchId = this.getServiceWatchId(watchId);
    if (serviceWatchId) {
      await this.registry.unwatchServices(serviceWatchId);
      this.cleanupWatchMapping(watchId);
    }
  }

  // ========================================
  // Health Management
  // ========================================

  private async filterHealthyAgents(instances: ClaudeCodeInstance[]): Promise<ClaudeCodeInstance[]> {
    const healthChecks = await Promise.allSettled(
      instances.map(instance => this.healthChecker.checkHealth(instance))
    );

    return instances.filter((instance, index) => {
      const result = healthChecks[index];
      if (result.status === 'fulfilled' && result.value.healthy) {
        return true;
      } else {
        logger.warn(`🩺 Health check failed for agent: ${instance.id}`, {
          reason: result.status === 'rejected' ? result.reason : result.value.reason
        });
        return false;
      }
    });
  }

  // ========================================
  // Utility Methods
  // ========================================

  private async convertServicesToInstances(services: ServiceDefinition[]): Promise<ClaudeCodeInstance[]> {
    return services.map(service => ({
      id: service.id,
      endpoint: service.endpoint,
      capabilities: service.capabilities || [],
      status: this.determineInstanceStatus(service),
      metadata: {
        region: service.metadata.region || 'unknown',
        version: service.metadata.version || '1.0.0',
        maxConcurrentTasks: service.metadata.maxConcurrentTasks || 5,
        specializations: service.metadata.specializations || [],
        performanceMetrics: service.metadata.performanceMetrics || this.getDefaultMetrics(),
        tags: service.metadata.tags || {}
      },
      healthcheck: {
        lastSeen: service.lastSeen,
        responseTime: service.metadata.responseTime || 0,
        errorRate: service.metadata.errorRate || 0,
        consecutiveFailures: service.metadata.consecutiveFailures || 0
      },
      authentication: service.metadata.authentication || {}
    }));
  }

  private determineInstanceStatus(service: ServiceDefinition): InstanceStatus {
    const timeSinceLastSeen = Date.now() - service.lastSeen.getTime();
    
    if (timeSinceLastSeen > 300000) { // 5 minutes
      return InstanceStatus.OFFLINE;
    } else if (timeSinceLastSeen > 60000) { // 1 minute
      return InstanceStatus.UNREACHABLE;
    } else {
      return service.metadata.status || InstanceStatus.ACTIVE;
    }
  }

  private extractTags(instance: ClaudeCodeInstance): string[] {
    const tags = ['claude-code', 'agent'];
    
    // Add capability-based tags
    instance.capabilities.forEach(cap => {
      tags.push(`domain:${cap.domain}`);
      tags.push(`proficiency:${cap.proficiencyLevel}`);
      cap.specialization.forEach(spec => tags.push(`specialization:${spec}`));
    });

    // Add metadata tags
    if (instance.metadata.region) {
      tags.push(`region:${instance.metadata.region}`);
    }
    
    if (instance.metadata.version) {
      tags.push(`version:${instance.metadata.version}`);
    }

    return tags;
  }

  private applyFilters(
    instances: ClaudeCodeInstance[], 
    filters: DiscoveryFilter[]
  ): ClaudeCodeInstance[] {
    return instances.filter(instance => {
      return filters.every(filter => this.evaluateFilter(instance, filter));
    });
  }

  private evaluateFilter(instance: ClaudeCodeInstance, filter: DiscoveryFilter): boolean {
    const value = this.getPropertyValue(instance, filter.property);
    
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'greater_than':
        return Number(value) > Number(filter.value);
      case 'less_than':
        return Number(value) < Number(filter.value);
      default:
        return true;
    }
  }

  private getPropertyValue(instance: ClaudeCodeInstance, property: string): any {
    const path = property.split('.');
    let value: any = instance;
    
    for (const key of path) {
      value = value?.[key];
      if (value === undefined) break;
    }
    
    return value;
  }

  private async sortByRelevance(
    instances: ClaudeCodeInstance[], 
    criteria: DiscoveryCriteria
  ): Promise<ClaudeCodeInstance[]> {
    const scoredInstances = instances.map(instance => ({
      instance,
      score: this.calculateRelevanceScore(instance, criteria)
    }));

    return scoredInstances
      .sort((a, b) => b.score - a.score)
      .map(item => item.instance);
  }

  private calculateRelevanceScore(instance: ClaudeCodeInstance, criteria: DiscoveryCriteria): number {
    let score = 0.5; // Base score

    // Capability match score
    if (criteria.capabilities && criteria.capabilities.length > 0) {
      const capabilityScore = this.capabilityMatcher.scoreMatch(instance.capabilities, criteria.capabilities);
      score += capabilityScore * 0.4;
    }

    // Performance score
    const performanceScore = this.calculatePerformanceScore(instance);
    score += performanceScore * 0.3;

    // Health score
    const healthScore = this.calculateHealthScore(instance);
    score += healthScore * 0.2;

    // Load score
    const loadScore = this.loadMonitor.getLoadScore(instance.id);
    score += loadScore * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  private calculatePerformanceScore(instance: ClaudeCodeInstance): number {
    const metrics = instance.metadata.performanceMetrics;
    const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / 10000));
    const throughputScore = Math.min(1, metrics.throughput / 100);
    const errorRateScore = Math.max(0, 1 - (metrics.errorRate * 10));
    
    return (responseTimeScore + throughputScore + errorRateScore) / 3;
  }

  private calculateHealthScore(instance: ClaudeCodeInstance): number {
    const timeSinceLastSeen = Date.now() - instance.healthcheck.lastSeen.getTime();
    const timeScore = Math.max(0, 1 - (timeSinceLastSeen / 300000)); // 5 minute max
    const failureScore = Math.max(0, 1 - (instance.healthcheck.consecutiveFailures * 0.2));
    
    return (timeScore + failureScore) / 2;
  }

  private startPeriodicDiscovery(): void {
    const interval = this.discoveryConfig.discoveryInterval || 60000; // 1 minute default
    
    setInterval(async () => {
      try {
        logger.debug('🔄 Running periodic discovery sweep');
        
        // Discover all agents and emit updates
        const agents = await this.discoverAgents();
        this.emit('discovery:sweep', { agents, timestamp: new Date() });
        
      } catch (error) {
        logger.warn('⚠️ Periodic discovery sweep failed', { error: error.message });
      }
    }, interval);
  }

  private getDefaultMetrics(): any {
    return {
      averageResponseTime: 1000,
      throughput: 10,
      errorRate: 0.01,
      cpuUtilization: 0.5,
      memoryUtilization: 0.5,
      taskCompletionRate: 0.95
    };
  }

  // Watch management
  private watchMappings = new Map<string, string>();

  private generateWatchId(): string {
    return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private storeWatchMapping(watchId: string, serviceWatchId: string): void {
    this.watchMappings.set(watchId, serviceWatchId);
  }

  private getServiceWatchId(watchId: string): string | undefined {
    return this.watchMappings.get(watchId);
  }

  private cleanupWatchMapping(watchId: string): void {
    this.watchMappings.delete(watchId);
  }
}

// ========================================
// MCP Service Discovery
// ========================================

export class MCPServiceDiscovery extends EventEmitter {
  private mcpRegistry: MCPRegistry;
  private capabilityMatcher: CapabilityMatcher;
  private performanceTracker: MCPPerformanceTracker;

  constructor() {
    super();
    this.mcpRegistry = new MCPRegistry();
    this.capabilityMatcher = new CapabilityMatcher();
    this.performanceTracker = new MCPPerformanceTracker();
  }

  async discoverMCPServers(requirements: MCPRequirements): Promise<MCPServerInfo[]> {
    logger.info('🔍 Discovering MCP servers', { requirements });

    try {
      // 1. Query registry for available MCP servers
      const availableServers = await this.mcpRegistry.listServers();
      logger.info(`📋 Found ${availableServers.length} registered MCP servers`);

      // 2. Filter by capability requirements
      const compatibleServers = await this.capabilityMatcher.filterMCPServers(
        availableServers, 
        requirements.capabilities
      );
      logger.info(`🔧 ${compatibleServers.length} servers match capability requirements`);

      // 3. Filter by performance requirements
      const performanceFiltered = await this.filterByPerformance(
        compatibleServers, 
        requirements.performance || []
      );

      // 4. Score and rank servers
      const rankedServers = this.rankMCPServers(performanceFiltered, requirements);

      logger.info(`✅ MCP discovery completed: ${rankedServers.length} servers available`);
      
      this.emit('mcp:discovered', { servers: rankedServers, requirements });
      return rankedServers;

    } catch (error) {
      logger.error('❌ MCP discovery failed', { error: error.message });
      throw new MCPDiscoveryError(`MCP discovery failed: ${error.message}`);
    }
  }

  async registerMCPServer(serverInfo: MCPServerInfo): Promise<void> {
    logger.info(`📢 Registering MCP server: ${serverInfo.name}`, {
      endpoint: serverInfo.endpoint,
      capabilities: serverInfo.capabilities.length
    });

    try {
      // 1. Validate MCP server capabilities
      const validation = await this.validateMCPServer(serverInfo);
      if (!validation.valid) {
        throw new MCPValidationError(`Invalid MCP server: ${validation.reason}`);
      }

      // 2. Introspect capabilities if not provided
      if (serverInfo.capabilities.length === 0) {
        serverInfo.capabilities = await this.introspectCapabilities(serverInfo);
      }

      // 3. Register with enhanced metadata
      await this.mcpRegistry.register({
        ...serverInfo,
        discoveredAt: new Date(),
        lastValidated: new Date()
      });

      // 4. Start performance monitoring
      await this.performanceTracker.startTracking(serverInfo);

      logger.info(`✅ Successfully registered MCP server: ${serverInfo.name}`);
      this.emit('mcp:registered', { serverInfo });

    } catch (error) {
      logger.error(`❌ Failed to register MCP server: ${serverInfo.name}`, { error: error.message });
      throw error;
    }
  }

  async deregisterMCPServer(serverId: string): Promise<void> {
    logger.info(`📴 Deregistering MCP server: ${serverId}`);

    try {
      await this.mcpRegistry.deregister(serverId);
      await this.performanceTracker.stopTracking(serverId);

      logger.info(`✅ Successfully deregistered MCP server: ${serverId}`);
      this.emit('mcp:deregistered', { serverId });

    } catch (error) {
      logger.error(`❌ Failed to deregister MCP server: ${serverId}`, { error: error.message });
      throw error;
    }
  }

  private async filterByPerformance(
    servers: MCPServerInfo[], 
    requirements: PerformanceRequirement[]
  ): Promise<MCPServerInfo[]> {
    if (requirements.length === 0) return servers;

    return servers.filter(server => {
      const performance = this.performanceTracker.getPerformance(server.id);
      return requirements.every(req => this.meetsPerformanceRequirement(performance, req));
    });
  }

  private meetsPerformanceRequirement(
    performance: MCPPerformanceMetrics | undefined, 
    requirement: PerformanceRequirement
  ): boolean {
    if (!performance) return false;

    switch (requirement.metric) {
      case 'response_time':
        return performance.averageResponseTime <= requirement.threshold;
      case 'throughput':
        return performance.throughput >= requirement.threshold;
      case 'availability':
        return performance.availability >= requirement.threshold;
      default:
        return true;
    }
  }

  private rankMCPServers(servers: MCPServerInfo[], requirements: MCPRequirements): MCPServerInfo[] {
    return servers
      .map(server => ({
        server,
        score: this.calculateMCPScore(server, requirements)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.server);
  }

  private calculateMCPScore(server: MCPServerInfo, requirements: MCPRequirements): number {
    let score = 0.5; // Base score

    // Capability match score
    const capabilityScore = this.capabilityMatcher.scoreMCPMatch(server.capabilities, requirements.capabilities);
    score += capabilityScore * 0.6;

    // Performance score
    const performance = this.performanceTracker.getPerformance(server.id);
    if (performance) {
      const performanceScore = this.calculateMCPPerformanceScore(performance);
      score += performanceScore * 0.3;
    }

    // Recency score (prefer recently updated servers)
    const recencyScore = this.calculateRecencyScore(server);
    score += recencyScore * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  private calculateMCPPerformanceScore(performance: MCPPerformanceMetrics): number {
    const responseTimeScore = Math.max(0, 1 - (performance.averageResponseTime / 5000)); // 5s max
    const throughputScore = Math.min(1, performance.throughput / 50); // 50 req/s max
    const availabilityScore = performance.availability;
    
    return (responseTimeScore + throughputScore + availabilityScore) / 3;
  }

  private calculateRecencyScore(server: MCPServerInfo): number {
    const daysSinceUpdate = (Date.now() - server.lastValidated.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceUpdate / 30)); // 30 days max
  }

  private async validateMCPServer(serverInfo: MCPServerInfo): Promise<MCPValidation> {
    try {
      // Basic validation checks
      if (!serverInfo.endpoint) {
        return { valid: false, reason: 'Missing endpoint' };
      }

      if (!serverInfo.name) {
        return { valid: false, reason: 'Missing name' };
      }

      // Try to connect and validate
      const client = new MCPClient(serverInfo.endpoint);
      const connectionTest = await client.testConnection();
      
      if (!connectionTest.success) {
        return { valid: false, reason: `Connection failed: ${connectionTest.error}` };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, reason: `Validation error: ${error.message}` };
    }
  }

  private async introspectCapabilities(serverInfo: MCPServerInfo): Promise<MCPCapability[]> {
    logger.info(`🔍 Introspecting capabilities for: ${serverInfo.name}`);

    try {
      const client = new MCPClient(serverInfo.endpoint);
      
      // Get available tools and resources
      const [tools, resources] = await Promise.all([
        client.listTools(),
        client.listResources()
      ]);

      const capabilities: MCPCapability[] = [];

      // Convert tools to capabilities
      tools.forEach(tool => {
        capabilities.push({
          type: 'tool',
          name: tool.name,
          description: tool.description || '',
          schema: tool.inputSchema,
          metadata: { tool }
        });
      });

      // Convert resources to capabilities
      resources.forEach(resource => {
        capabilities.push({
          type: 'resource',
          name: resource.name,
          description: resource.description || '',
          metadata: { resource }
        });
      });

      logger.info(`✅ Introspected ${capabilities.length} capabilities`);
      return capabilities;

    } catch (error) {
      logger.warn(`⚠️ Failed to introspect capabilities for ${serverInfo.name}`, { error: error.message });
      return [];
    }
  }
}

// ========================================
// Supporting Classes
// ========================================

class InMemoryServiceRegistry implements ServiceRegistry {
  private services = new Map<string, ServiceDefinition>();
  private watchers = new Map<string, { callback: ServiceChangeCallback; filter: string }>();

  async register(service: ServiceDefinition): Promise<void> {
    const existing = this.services.get(service.id);
    this.services.set(service.id, service);

    const eventType = existing ? 'updated' : 'registered';
    this.notifyWatchers({
      type: eventType as any,
      service,
      timestamp: new Date()
    });
  }

  async deregister(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (service) {
      this.services.delete(serviceId);
      this.notifyWatchers({
        type: 'deregistered',
        service,
        timestamp: new Date()
      });
    }
  }

  async findServices(serviceName: string, criteria?: DiscoveryCriteria): Promise<ServiceDefinition[]> {
    const services = Array.from(this.services.values())
      .filter(service => service.name === serviceName);

    if (!criteria) return services;

    return services.filter(service => {
      // Apply criteria filters
      if (criteria.tags && !criteria.tags.every(tag => service.tags.includes(tag))) {
        return false;
      }

      if (criteria.regions && !criteria.regions.includes(service.metadata.region)) {
        return false;
      }

      if (criteria.healthStatus === 'healthy' && !this.isHealthy(service)) {
        return false;
      }

      return true;
    });
  }

  async watchServices(serviceName: string, callback: ServiceChangeCallback): Promise<string> {
    const watchId = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.watchers.set(watchId, { callback, filter: serviceName });
    return watchId;
  }

  async unwatchServices(watchId: string): Promise<void> {
    this.watchers.delete(watchId);
  }

  private notifyWatchers(event: ServiceEvent): void {
    this.watchers.forEach(({ callback, filter }) => {
      if (event.service.name === filter) {
        callback(event);
      }
    });
  }

  private isHealthy(service: ServiceDefinition): boolean {
    const timeSinceLastSeen = Date.now() - service.lastSeen.getTime();
    return timeSinceLastSeen < 120000; // 2 minutes
  }
}

class HealthChecker {
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();

  constructor(private config: HealthCheckConfig) {}

  async checkHealth(instance: ClaudeCodeInstance): Promise<HealthResult> {
    try {
      const response = await fetch(`${instance.endpoint}/health`, {
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'snow-flow-discovery/1.0'
        }
      });

      const healthy = response.ok;
      const responseTime = Date.now(); // Would measure actual response time
      
      return {
        healthy,
        responseTime,
        details: healthy ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error) {
      return {
        healthy: false,
        responseTime: this.config.timeout,
        details: error.message
      };
    }
  }

  async startMonitoring(service: ServiceDefinition): Promise<void> {
    const interval = setInterval(async () => {
      // Health monitoring logic would go here
      logger.debug(`💓 Health check for service: ${service.id}`);
    }, service.health.interval);

    this.monitoringIntervals.set(service.id, interval);
  }

  async stopMonitoring(serviceId: string): Promise<void> {
    const interval = this.monitoringIntervals.get(serviceId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(serviceId);
    }
  }
}

class ServiceAnnouncer {
  constructor(private config: AnnouncementConfig) {}

  async announce(service: ServiceDefinition): Promise<void> {
    // Implementation would handle service announcement
    // to configured discovery services (Consul, etcd, etc.)
  }
}

class CapabilityMatcher {
  scoreMatch(agentCapabilities: AgentCapability[], requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 1;

    const agentSpecs = agentCapabilities.flatMap(cap => cap.specialization);
    let matches = 0;

    for (const required of requiredCapabilities) {
      const bestMatch = agentSpecs.find(spec => 
        this.calculateSimilarity(required, spec) > 0.7
      );
      if (bestMatch) matches++;
    }

    return matches / requiredCapabilities.length;
  }

  async filterMCPServers(servers: MCPServerInfo[], requiredCapabilities: string[]): Promise<MCPServerInfo[]> {
    return servers.filter(server => {
      const serverCapabilities = server.capabilities.map(cap => cap.name);
      return requiredCapabilities.every(req => 
        serverCapabilities.some(cap => cap.toLowerCase().includes(req.toLowerCase()))
      );
    });
  }

  scoreMCPMatch(serverCapabilities: MCPCapability[], requiredCapabilities: string[]): number {
    if (requiredCapabilities.length === 0) return 1;

    const serverNames = serverCapabilities.map(cap => cap.name);
    let matches = 0;

    for (const required of requiredCapabilities) {
      const bestMatch = serverNames.find(name => 
        this.calculateSimilarity(required, name) > 0.7
      );
      if (bestMatch) matches++;
    }

    return matches / requiredCapabilities.length;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation
    const lower1 = str1.toLowerCase();
    const lower2 = str2.toLowerCase();
    
    if (lower1 === lower2) return 1;
    if (lower1.includes(lower2) || lower2.includes(lower1)) return 0.8;
    
    // Could implement more sophisticated similarity algorithms
    return 0;
  }
}

class LoadMonitor {
  private loadScores = new Map<string, number>();

  getLoadScore(instanceId: string): number {
    return this.loadScores.get(instanceId) || 0.5;
  }

  updateLoadScore(instanceId: string, score: number): void {
    this.loadScores.set(instanceId, score);
  }
}

class MCPRegistry {
  private servers = new Map<string, MCPServerInfo>();

  async listServers(): Promise<MCPServerInfo[]> {
    return Array.from(this.servers.values());
  }

  async register(serverInfo: MCPServerInfo): Promise<void> {
    this.servers.set(serverInfo.id, serverInfo);
  }

  async deregister(serverId: string): Promise<void> {
    this.servers.delete(serverId);
  }

  async getServer(serverId: string): Promise<MCPServerInfo | undefined> {
    return this.servers.get(serverId);
  }
}

class MCPPerformanceTracker {
  private performance = new Map<string, MCPPerformanceMetrics>();

  async startTracking(serverInfo: MCPServerInfo): Promise<void> {
    this.performance.set(serverInfo.id, {
      averageResponseTime: 1000,
      throughput: 10,
      availability: 0.99
    });
  }

  async stopTracking(serverId: string): Promise<void> {
    this.performance.delete(serverId);
  }

  getPerformance(serverId: string): MCPPerformanceMetrics | undefined {
    return this.performance.get(serverId);
  }
}

class MCPClient {
  constructor(private endpoint: string) {}

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.endpoint}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {} }
        })
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listTools(): Promise<any[]> {
    // Implementation would call MCP listTools
    return [];
  }

  async listResources(): Promise<any[]> {
    // Implementation would call MCP listResources
    return [];
  }
}

// ========================================
// Types and Interfaces
// ========================================

interface DiscoveryConfig {
  healthCheck: HealthCheckConfig;
  announcement: AnnouncementConfig;
  discoveryInterval: number;
}

interface HealthCheckConfig {
  interval: number;
  timeout: number;
  retries: number;
}

interface AnnouncementConfig {
  enabled: boolean;
  services: string[];
}

interface HealthResult {
  healthy: boolean;
  responseTime: number;
  details?: string;
  reason?: string;
}

interface MCPValidation {
  valid: boolean;
  reason?: string;
}

interface MCPPerformanceMetrics {
  averageResponseTime: number;
  throughput: number;
  availability: number;
}

import { DiscoveryFilter, PerformanceRequirement } from '../interfaces/distributed-orchestration.interface';

// ========================================
// Error Classes
// ========================================

class AgentDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentDiscoveryError';
  }
}

class ServiceAnnouncementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceAnnouncementError';
  }
}

class MCPDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPDiscoveryError';
  }
}

class MCPValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPValidationError';
  }
}

export { 
  AgentDiscoveryError, 
  MCPDiscoveryError 
};
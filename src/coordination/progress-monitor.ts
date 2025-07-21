import { EventEmitter } from 'eventemitter3';
import { ProgressStatus, ProgressListener, BaseTeam } from './types';
import { TaskDependencyGraph } from './task-dependencies';
import { SnowAgent } from '../types/snow-flow.types';
import { logger } from '../utils/logger';

export class ProgressMonitor extends EventEmitter {
  private listeners: Set<ProgressListener> = new Set();
  private monitoringActive = false;
  private monitoringInterval?: NodeJS.Timeout;
  private agentHealthInterval?: NodeJS.Timeout;
  private memoryMonitorInterval?: NodeJS.Timeout;
  private progressHistory: ProgressSnapshot[] = [];
  private agentMetrics: Map<string, AgentMetrics> = new Map();
  private bottleneckDetector: BottleneckDetector;
  private performanceAnalyzer: PerformanceAnalyzer;

  constructor() {
    super();
    this.bottleneckDetector = new BottleneckDetector();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    
    logger.info('📊 Progress Monitor initialized');
  }

  async startMonitoring(team: BaseTeam, taskGraph: TaskDependencyGraph): Promise<void> {
    if (this.monitoringActive) {
      logger.warn('⚠️ Progress monitoring already active');
      return;
    }

    this.monitoringActive = true;
    logger.info('📊 Starting comprehensive team progress monitoring');

    // Start different monitoring aspects
    await Promise.all([
      this.monitorTaskProgress(taskGraph),
      this.monitorAgentHealth(team),
      this.monitorSharedMemory(),
      this.monitorPerformance(taskGraph),
      this.detectBottlenecks(taskGraph)
    ]);

    this.emit('monitoring:started', { 
      teamSize: team.agents.size, 
      totalTasks: taskGraph.getTotalTasks() 
    });
  }

  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.agentHealthInterval) {
      clearInterval(this.agentHealthInterval);
    }
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }

    logger.info('🛑 Progress monitoring stopped');
    this.emit('monitoring:stopped');
  }

  private async monitorTaskProgress(taskGraph: TaskDependencyGraph): Promise<void> {
    this.monitoringInterval = setInterval(async () => {
      try {
        const status = await this.getProgressStatus(taskGraph);
        
        // Store progress snapshot
        this.progressHistory.push({
          timestamp: new Date(),
          status,
          metrics: await this.gatherMetrics(taskGraph)
        });

        // Keep only last 100 snapshots
        if (this.progressHistory.length > 100) {
          this.progressHistory = this.progressHistory.slice(-100);
        }

        // Notify listeners
        this.notifyListeners('task_progress', status);

        // Check for completion
        if (status.completed) {
          await this.stopMonitoring();
          this.emit('monitoring:completed', status);
        }

        // Analyze trends
        await this.analyzeTrends();

      } catch (error) {
        logger.error('❌ Task progress monitoring error', { error: error.message });
      }
    }, 1000); // Check every second
  }

  private async monitorAgentHealth(team: BaseTeam): Promise<void> {
    this.agentHealthInterval = setInterval(async () => {
      try {
        const healthReport = await this.checkAgentHealth(team);
        
        // Update agent metrics
        for (const [agentId, health] of Object.entries(healthReport.agents)) {
          this.updateAgentMetrics(agentId, health);
        }

        this.notifyListeners('agent_health', healthReport);

        // Check for unhealthy agents
        const unhealthyAgents = Object.entries(healthReport.agents)
          .filter(([, health]) => health.status === 'error' || health.responseTime > 30000);

        if (unhealthyAgents.length > 0) {
          this.emit('agents:unhealthy', { agents: unhealthyAgents });
          logger.warn('⚠️ Unhealthy agents detected', { 
            count: unhealthyAgents.length, 
            agents: unhealthyAgents.map(([id]) => id) 
          });
        }

      } catch (error) {
        logger.error('❌ Agent health monitoring error', { error: error.message });
      }
    }, 5000); // Check every 5 seconds
  }

  private async monitorSharedMemory(): Promise<void> {
    this.memoryMonitorInterval = setInterval(async () => {
      try {
        // This would integrate with the SharedMemoryManager
        // For now, we'll simulate memory monitoring
        const memoryStats = {
          usage: Math.random() * 100,
          operations: Math.floor(Math.random() * 50),
          conflicts: Math.floor(Math.random() * 3)
        };

        this.notifyListeners('memory_stats', memoryStats);

        // Check for memory issues
        if (memoryStats.usage > 90) {
          this.emit('memory:high_usage', memoryStats);
          logger.warn('⚠️ High memory usage detected', memoryStats);
        }

        if (memoryStats.conflicts > 5) {
          this.emit('memory:conflicts', memoryStats);
          logger.warn('⚠️ Memory conflicts detected', memoryStats);
        }

      } catch (error) {
        logger.error('❌ Memory monitoring error', { error: error.message });
      }
    }, 3000); // Check every 3 seconds
  }

  private async monitorPerformance(taskGraph: TaskDependencyGraph): Promise<void> {
    const performanceCheck = async () => {
      try {
        const performance = await this.performanceAnalyzer.analyze(taskGraph);
        this.notifyListeners('performance_metrics', performance);

        // Check for performance degradation
        if (performance.efficiency < 0.5) {
          this.emit('performance:degradation', performance);
          logger.warn('⚠️ Performance degradation detected', performance);
        }

      } catch (error) {
        logger.error('❌ Performance monitoring error', { error: error.message });
      }
    };

    // Run performance check every 10 seconds
    setInterval(performanceCheck, 10000);
  }

  private async detectBottlenecks(taskGraph: TaskDependencyGraph): Promise<void> {
    const bottleneckCheck = async () => {
      try {
        const bottlenecks = await this.bottleneckDetector.detect(taskGraph);
        
        if (bottlenecks.length > 0) {
          this.notifyListeners('bottlenecks_detected', bottlenecks);
          this.emit('bottlenecks:detected', { bottlenecks });
          
          logger.warn('🚧 Bottlenecks detected', { 
            count: bottlenecks.length, 
            types: bottlenecks.map(b => b.type) 
          });
        }

      } catch (error) {
        logger.error('❌ Bottleneck detection error', { error: error.message });
      }
    };

    // Run bottleneck detection every 15 seconds
    setInterval(bottleneckCheck, 15000);
  }

  private async getProgressStatus(taskGraph: TaskDependencyGraph): Promise<ProgressStatus> {
    const totalTasks = taskGraph.getTotalTasks();
    const completedTasks = taskGraph.getCompletedTasks();
    const failedTasks = taskGraph.getFailedTasks();
    const inProgressTasks = taskGraph.getInProgressTasks();

    const percentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const estimatedCompletion = this.estimateCompletion(taskGraph);
    const currentPhase = this.determineCurrentPhase(taskGraph);
    const bottlenecks = await this.bottleneckDetector.detect(taskGraph);

    return {
      total: totalTasks,
      completed: completedTasks.length,
      failed: failedTasks.length,
      inProgress: inProgressTasks.length,
      percentage,
      estimated_completion: estimatedCompletion,
      currentPhase,
      bottlenecks: bottlenecks.map(b => b.description)
    };
  }

  private async checkAgentHealth(team: BaseTeam): Promise<AgentHealthReport> {
    const agents: Record<string, AgentHealth> = {};
    let overallHealth = 'healthy';

    for (const [agentId, agent] of team.agents) {
      try {
        const startTime = Date.now();
        
        // Simulate health check (in real implementation, this would ping the agent)
        const healthCheckResult = await this.performAgentHealthCheck(agent);
        
        const responseTime = Date.now() - startTime;
        
        agents[agentId] = {
          status: healthCheckResult.status,
          responseTime,
          lastActivity: agent.lastActivity,
          currentTask: healthCheckResult.currentTask,
          memoryUsage: healthCheckResult.memoryUsage,
          errorCount: healthCheckResult.errorCount
        };

        if (healthCheckResult.status === 'error') {
          overallHealth = 'degraded';
        }

      } catch (error) {
        agents[agentId] = {
          status: 'error',
          responseTime: 0,
          lastActivity: agent.lastActivity,
          error: error.message
        };
        overallHealth = 'degraded';
      }
    }

    return {
      overall: overallHealth as 'healthy' | 'degraded' | 'critical',
      agents,
      timestamp: new Date()
    };
  }

  private async performAgentHealthCheck(agent: SnowAgent): Promise<any> {
    // Simulate agent health check
    // In real implementation, this would communicate with the actual agent
    
    const isHealthy = Math.random() > 0.1; // 90% healthy
    
    return {
      status: isHealthy ? 'idle' : 'error',
      currentTask: isHealthy ? null : 'stuck_task',
      memoryUsage: Math.random() * 100,
      errorCount: isHealthy ? 0 : Math.floor(Math.random() * 5)
    };
  }

  private updateAgentMetrics(agentId: string, health: AgentHealth): void {
    const existing = this.agentMetrics.get(agentId) || {
      totalChecks: 0,
      healthyChecks: 0,
      averageResponseTime: 0,
      lastSeen: new Date(),
      errors: []
    };

    existing.totalChecks++;
    if (health.status !== 'error') {
      existing.healthyChecks++;
    }

    if (health.responseTime) {
      existing.averageResponseTime = 
        (existing.averageResponseTime * (existing.totalChecks - 1) + health.responseTime) / existing.totalChecks;
    }

    existing.lastSeen = new Date();

    if (health.error) {
      existing.errors.push({
        timestamp: new Date(),
        error: health.error
      });
      
      // Keep only last 10 errors
      if (existing.errors.length > 10) {
        existing.errors = existing.errors.slice(-10);
      }
    }

    this.agentMetrics.set(agentId, existing);
  }

  private estimateCompletion(taskGraph: TaskDependencyGraph): Date | undefined {
    const inProgressTasks = taskGraph.getInProgressTasks();
    const pendingTasks = taskGraph.getPendingTasks();
    
    if (inProgressTasks.length === 0 && pendingTasks.length === 0) {
      return new Date(); // Already completed
    }

    // Calculate average task duration from completed tasks
    const completedTasks = taskGraph.getCompletedTasks();
    const averageDuration = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const duration = task.endTime && task.startTime 
            ? task.endTime.getTime() - task.startTime.getTime() 
            : 60000;
          return sum + duration;
        }, 0) / completedTasks.length
      : 60000; // Default 1 minute

    // Estimate remaining time
    const estimatedRemainingTime = (inProgressTasks.length + pendingTasks.length) * averageDuration;
    
    return new Date(Date.now() + estimatedRemainingTime);
  }

  private determineCurrentPhase(taskGraph: TaskDependencyGraph): string {
    const totalTasks = taskGraph.getTotalTasks();
    const completedTasks = taskGraph.getCompletedTasks().length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    if (percentage < 25) return 'Initialization';
    if (percentage < 50) return 'Development';
    if (percentage < 75) return 'Integration';
    if (percentage < 90) return 'Testing';
    if (percentage < 100) return 'Finalization';
    return 'Completed';
  }

  private async gatherMetrics(taskGraph: TaskDependencyGraph): Promise<Record<string, any>> {
    return {
      taskMetrics: await taskGraph.getExecutionStats(),
      agentMetrics: Object.fromEntries(this.agentMetrics),
      systemMetrics: {
        timestamp: new Date(),
        monitoringDuration: this.progressHistory.length * 1000 // milliseconds
      }
    };
  }

  private async analyzeTrends(): Promise<void> {
    if (this.progressHistory.length < 10) return; // Need enough data

    const recent = this.progressHistory.slice(-10);
    const progressRate = this.calculateProgressRate(recent);
    const errorRate = this.calculateErrorRate(recent);
    
    // Emit trend analysis
    this.notifyListeners('trend_analysis', {
      progressRate,
      errorRate,
      trend: progressRate > 0 ? 'improving' : progressRate < 0 ? 'declining' : 'stable'
    });
  }

  private calculateProgressRate(snapshots: ProgressSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime();
    const progressDiff = last.status.percentage - first.status.percentage;
    
    return timeDiff > 0 ? progressDiff / (timeDiff / 1000) : 0; // Progress per second
  }

  private calculateErrorRate(snapshots: ProgressSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const errors = snapshots.reduce((sum, snapshot) => sum + snapshot.status.failed, 0);
    return errors / snapshots.length;
  }

  // Public API methods
  addListener(listener: ProgressListener): void {
    this.listeners.add(listener);
    logger.debug('👂 Progress listener added', { totalListeners: this.listeners.size });
  }

  removeListener(listener: ProgressListener): void {
    this.listeners.delete(listener);
    logger.debug('👂 Progress listener removed', { totalListeners: this.listeners.size });
  }

  private notifyListeners(event: string, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener.onProgress(event, data);
      } catch (error) {
        logger.error('❌ Progress listener error', { event, error: error.message });
      }
    });
  }

  async getDetailedReport(): Promise<DetailedProgressReport> {
    return {
      overview: this.progressHistory.length > 0 
        ? this.progressHistory[this.progressHistory.length - 1].status 
        : null,
      agentMetrics: Object.fromEntries(this.agentMetrics),
      performanceMetrics: await this.performanceAnalyzer.getOverallMetrics(),
      trends: this.generateTrendSummary(),
      recommendations: this.generateRecommendations()
    };
  }

  private generateTrendSummary(): TrendSummary {
    if (this.progressHistory.length === 0) {
      return { direction: 'unknown', confidence: 0, description: 'Insufficient data' };
    }

    const recent = this.progressHistory.slice(-20);
    const progressRate = this.calculateProgressRate(recent);
    
    return {
      direction: progressRate > 0.1 ? 'improving' : progressRate < -0.1 ? 'declining' : 'stable',
      confidence: Math.min(recent.length / 20, 1),
      description: this.describeTrend(progressRate),
      progressRate
    };
  }

  private describeTrend(rate: number): string {
    if (rate > 0.5) return 'Excellent progress rate';
    if (rate > 0.1) return 'Good progress rate';
    if (rate > -0.1) return 'Stable progress';
    if (rate > -0.5) return 'Slow progress';
    return 'Progress has stalled';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze agent health
    const unhealthyAgents = Array.from(this.agentMetrics.entries())
      .filter(([, metrics]) => metrics.healthyChecks / metrics.totalChecks < 0.8);
    
    if (unhealthyAgents.length > 0) {
      recommendations.push(`Review ${unhealthyAgents.length} underperforming agent(s)`);
    }

    // Analyze progress rate
    if (this.progressHistory.length > 10) {
      const rate = this.calculateProgressRate(this.progressHistory.slice(-10));
      if (rate < 0.1) {
        recommendations.push('Consider increasing parallelism or reviewing task dependencies');
      }
    }

    return recommendations;
  }
}

// Supporting classes
class BottleneckDetector {
  async detect(taskGraph: TaskDependencyGraph): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];
    
    // Detect long-running tasks
    const inProgressTasks = taskGraph.getInProgressTasks();
    const longRunningTasks = inProgressTasks.filter(task => {
      const duration = task.startTime ? Date.now() - task.startTime.getTime() : 0;
      return duration > 300000; // 5 minutes
    });

    for (const task of longRunningTasks) {
      bottlenecks.push({
        type: 'long_running_task',
        taskId: task.id,
        description: `Task ${task.id} has been running for over 5 minutes`,
        severity: 'medium',
        suggestion: 'Consider task timeout or agent health check'
      });
    }

    // Detect dependency chains
    const pendingTasks = taskGraph.getPendingTasks();
    if (pendingTasks.length > inProgressTasks.length * 2) {
      bottlenecks.push({
        type: 'dependency_bottleneck',
        description: 'Many tasks waiting for dependencies to complete',
        severity: 'high',
        suggestion: 'Review task dependencies and consider parallel execution'
      });
    }

    return bottlenecks;
  }
}

class PerformanceAnalyzer {
  private metrics: PerformanceSnapshot[] = [];

  async analyze(taskGraph: TaskDependencyGraph): Promise<PerformanceMetrics> {
    const stats = await taskGraph.getExecutionStats();
    
    const efficiency = stats.totalTasks > 0 
      ? stats.completedTasks / stats.totalTasks 
      : 0;
    
    const throughput = stats.averageExecutionTime > 0 
      ? 1000 / stats.averageExecutionTime 
      : 0;

    const metrics: PerformanceMetrics = {
      efficiency,
      throughput,
      averageTaskTime: stats.averageExecutionTime,
      retryRate: stats.totalRetries / Math.max(stats.totalTasks, 1),
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return metrics;
  }

  async getOverallMetrics(): Promise<OverallPerformanceMetrics> {
    if (this.metrics.length === 0) {
      return {
        averageEfficiency: 0,
        averageThroughput: 0,
        bestEfficiency: 0,
        worstEfficiency: 0,
        trend: 'unknown'
      };
    }

    const efficiencies = this.metrics.map(m => m.efficiency);
    const throughputs = this.metrics.map(m => m.throughput);

    return {
      averageEfficiency: efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length,
      averageThroughput: throughputs.reduce((sum, t) => sum + t, 0) / throughputs.length,
      bestEfficiency: Math.max(...efficiencies),
      worstEfficiency: Math.min(...efficiencies),
      trend: this.calculateTrend()
    };
  }

  private calculateTrend(): 'improving' | 'declining' | 'stable' | 'unknown' {
    if (this.metrics.length < 10) return 'unknown';

    const recent = this.metrics.slice(-5);
    const older = this.metrics.slice(-10, -5);

    const recentAvg = recent.reduce((sum, m) => sum + m.efficiency, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.efficiency, 0) / older.length;

    const diff = recentAvg - olderAvg;
    
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }
}

// Supporting interfaces
interface ProgressSnapshot {
  timestamp: Date;
  status: ProgressStatus;
  metrics: Record<string, any>;
}

interface AgentMetrics {
  totalChecks: number;
  healthyChecks: number;
  averageResponseTime: number;
  lastSeen: Date;
  errors: { timestamp: Date; error: string }[];
}

interface AgentHealth {
  status: 'idle' | 'busy' | 'error';
  responseTime: number;
  lastActivity: Date;
  currentTask?: string;
  memoryUsage?: number;
  errorCount?: number;
  error?: string;
}

interface AgentHealthReport {
  overall: 'healthy' | 'degraded' | 'critical';
  agents: Record<string, AgentHealth>;
  timestamp: Date;
}

interface Bottleneck {
  type: string;
  taskId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

interface PerformanceMetrics {
  efficiency: number;
  throughput: number;
  averageTaskTime: number;
  retryRate: number;
  timestamp: Date;
}

interface PerformanceSnapshot {
  timestamp: Date;
  efficiency: number;
  throughput: number;
}

interface OverallPerformanceMetrics {
  averageEfficiency: number;
  averageThroughput: number;
  bestEfficiency: number;
  worstEfficiency: number;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
}

interface DetailedProgressReport {
  overview: ProgressStatus | null;
  agentMetrics: Record<string, AgentMetrics>;
  performanceMetrics: OverallPerformanceMetrics;
  trends: TrendSummary;
  recommendations: string[];
}

interface TrendSummary {
  direction: 'improving' | 'declining' | 'stable' | 'unknown';
  confidence: number;
  description: string;
  progressRate?: number;
}
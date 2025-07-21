/**
 * Comprehensive example of using the Team Coordination Framework
 * for ServiceNow development workflows
 */

import { 
  CoordinationFramework,
  createServiceNowCoordinationSetup,
  createServiceNowTaskSpecification 
} from './index';
import { SnowAgent } from '../types/snow-flow.types';
import { BaseTeam } from './types';
import { logger } from '../utils/logger';

/**
 * Example: ServiceNow Widget Development with Team Coordination
 */
async function exampleWidgetDevelopment() {
  console.log('🚀 Starting ServiceNow Widget Development Example');

  // 1. Create ServiceNow coordination setup
  const { engine, qualityGates, progressListener, taskBuilder } = 
    createServiceNowCoordinationSetup({
      maxConcurrentTasks: 6,
      enableAdvancedQualityGates: true,
      progressLogging: true
    });

  // 2. Create mock team of specialized agents
  const team = createMockTeam();

  // 3. Add progress monitoring
  const monitor = engine.getSharedMemory();
  
  // Subscribe to progress events
  engine.on('coordination:started', (data) => {
    console.log('🎯 Coordination started:', data);
  });

  engine.on('task:completed', ({ taskId, result }) => {
    console.log(`✅ Task completed: ${taskId}`);
  });

  engine.on('task:failed', ({ taskId, error }) => {
    console.error(`❌ Task failed: ${taskId}`, error.message);
  });

  engine.on('phase:completed', ({ phase, type, progress }) => {
    console.log(`🏁 Phase ${phase} (${type}) completed - ${Math.round(progress * 100)}% done`);
  });

  engine.on('coordination:completed', ({ results, metrics }) => {
    console.log('🎉 Coordination completed!');
    console.log('📊 Metrics:', {
      totalTasks: metrics.totalTasks,
      completedTasks: metrics.completedTasks,
      totalTime: `${Math.round(metrics.totalExecutionTime / 1000)}s`,
      averageTaskTime: `${Math.round(metrics.averageTaskTime / 1000)}s`
    });
  });

  // 4. Build task specification for incident dashboard widget
  const specification = taskBuilder(
    'incident-dashboard-widget',
    'Create a comprehensive incident dashboard widget for ServiceNow'
  )
    .addWidgetDevelopmentTasks('incident_dashboard')
    .addContext('servicenow_instance', 'dev123456')
    .addContext('update_set', 'incident_dashboard_us_001')
    .addContext('widget_requirements', {
      type: 'dashboard',
      data_source: 'incident',
      refresh_interval: 30,
      features: ['real-time updates', 'filtering', 'charts']
    })
    .setExecutionPattern('hybrid')
    .build();

  console.log('📋 Task Specification:', {
    name: specification.name,
    tasks: specification.tasks.length,
    executionPattern: specification.executionPattern
  });

  try {
    // 5. Execute coordination
    const result = await engine.coordinateTeamExecution(team, specification);

    if (result.success) {
      console.log('✅ Widget development completed successfully!');
      console.log('📦 Deliverables:');
      
      Object.entries(result.results).forEach(([taskId, taskResult]) => {
        console.log(`  - ${taskId}: ${Object.keys(taskResult.outputs || {}).join(', ')}`);
      });
    } else {
      console.error('❌ Widget development failed:', result.errors);
    }

  } catch (error) {
    console.error('💥 Coordination failed:', error.message);
  }
}

/**
 * Example: ServiceNow Flow Development with Parallel Execution
 */
async function exampleFlowDevelopment() {
  console.log('🚀 Starting ServiceNow Flow Development Example');

  // Create framework with parallel execution preference
  const framework = new CoordinationFramework({
    maxConcurrentTasks: 8,
    enableQualityGates: true,
    executionPattern: 'parallel'
  });

  const team = createMockTeam();

  // Build complex flow specification
  const specification = createServiceNowTaskSpecification(
    'user-provisioning-flow',
    'Create comprehensive user provisioning automation flow'
  )
    .addFlowDevelopmentTasks('user_provisioning_flow')
    .addTask({
      id: 'create_approval_step',
      name: 'Create Approval Step',
      description: 'Design and implement approval workflow step',
      agentType: 'workflow-designer',
      requirements: {
        inputs: { approvalType: 'manager_approval' },
        outputs: ['approvalStep', 'approvalLogic'],
        capabilities: ['workflow', 'approval', 'servicenow']
      },
      dependencies: ['design_flow']
    })
    .addTask({
      id: 'integrate_ldap',
      name: 'Integrate LDAP',
      description: 'Configure LDAP integration for user data',
      agentType: 'integration-specialist',
      requirements: {
        inputs: { ldapConfig: 'corporate_ldap' },
        outputs: ['ldapIntegration'],
        capabilities: ['ldap', 'integration', 'servicenow']
      },
      dependencies: ['design_flow']
    })
    .addTask({
      id: 'setup_notifications',
      name: 'Setup Notifications',
      description: 'Configure email notifications for the flow',
      agentType: 'servicenow-specialist',
      requirements: {
        inputs: { notificationTemplates: 'standard' },
        outputs: ['notificationConfig'],
        capabilities: ['email', 'notifications', 'servicenow']
      },
      dependencies: ['implement_flow']
    })
    .addContext('servicenow_instance', 'prod12345')
    .addContext('integration_environment', 'production')
    .addContext('compliance_level', 'high')
    .setExecutionPattern('hybrid')
    .build();

  try {
    const result = await framework.coordinate(team, specification);

    if (result.success) {
      console.log('✅ Flow development completed successfully!');
      
      // Display execution metrics
      console.log('📊 Execution Metrics:', {
        parallelTasks: result.metrics.concurrentTasks,
        efficiency: `${Math.round((result.metrics.completedTasks / result.metrics.totalTasks) * 100)}%`,
        totalTime: `${Math.round(result.metrics.totalExecutionTime / 1000)}s`
      });
    }

  } catch (error) {
    console.error('💥 Flow development failed:', error.message);
  }
}

/**
 * Example: Advanced Coordination with Custom Quality Gates
 */
async function exampleAdvancedCoordination() {
  console.log('🚀 Starting Advanced Coordination Example');

  const { engine, qualityGates } = createServiceNowCoordinationSetup({
    maxConcurrentTasks: 4,
    enableAdvancedQualityGates: true
  });

  // Add custom quality gate
  class ComplianceGate {
    name = 'SOX Compliance';
    blocking = true;

    async validate(result: any) {
      const issues = [];
      let score = 1.0;

      // Check SOX compliance requirements
      if (!result.auditTrail) {
        issues.push('Missing audit trail for SOX compliance');
        score -= 0.5;
      }

      if (!result.accessControls) {
        issues.push('Missing access controls documentation');
        score -= 0.3;
      }

      if (!result.changeApproval) {
        issues.push('Missing change approval documentation');
        score -= 0.4;
      }

      return {
        passed: issues.length === 0,
        score,
        error: issues.length > 0 ? issues.join('; ') : undefined,
        suggestions: [
          'Document all changes for audit trail',
          'Implement proper access controls',
          'Get proper change approval'
        ]
      };
    }
  }

  // Add custom gate to quality manager
  qualityGates.addGate('deploy_production_flow', new ComplianceGate());

  const team = createMockTeam();

  const specification = createServiceNowTaskSpecification(
    'production-deployment',
    'Deploy flow to production with full compliance checks'
  )
    .addTask({
      id: 'prepare_deployment',
      name: 'Prepare Deployment',
      description: 'Prepare all deployment artifacts',
      agentType: 'servicenow-specialist',
      requirements: {
        outputs: ['deploymentPackage', 'documentation'],
        capabilities: ['deployment', 'documentation']
      }
    })
    .addTask({
      id: 'compliance_review',
      name: 'Compliance Review',
      description: 'Conduct SOX compliance review',
      agentType: 'security-auditor',
      requirements: {
        outputs: ['complianceReport', 'auditTrail'],
        capabilities: ['compliance', 'audit', 'security']
      },
      dependencies: ['prepare_deployment']
    })
    .addTask({
      id: 'deploy_production_flow',
      name: 'Deploy to Production',
      description: 'Deploy flow to production environment',
      agentType: 'servicenow-specialist',
      requirements: {
        outputs: ['deploymentResult', 'accessControls', 'changeApproval'],
        capabilities: ['deployment', 'production']
      },
      dependencies: ['compliance_review']
    })
    .addContext('environment', 'production')
    .addContext('compliance_framework', 'SOX')
    .setExecutionPattern('sequential') // Sequential for production safety
    .build();

  try {
    const result = await engine.coordinateTeamExecution(team, specification);

    if (result.success) {
      console.log('✅ Production deployment completed with full compliance!');
    } else {
      console.error('❌ Deployment failed compliance checks:', result.errors);
    }

  } catch (error) {
    console.error('💥 Advanced coordination failed:', error.message);
  }
}

/**
 * Example: Real-time Progress Monitoring
 */
async function exampleProgressMonitoring() {
  console.log('🚀 Starting Progress Monitoring Example');

  const framework = new CoordinationFramework({
    enableProgressMonitoring: true,
    maxConcurrentTasks: 5
  });

  // Create custom progress listener
  const progressListener = {
    onProgress(event: string, data: any): void {
      switch (event) {
        case 'task_progress':
          console.log(`📊 Progress: ${data.percentage}% (${data.completed}/${data.total}) - Phase: ${data.currentPhase}`);
          
          if (data.bottlenecks && data.bottlenecks.length > 0) {
            console.warn('🚧 Bottlenecks detected:', data.bottlenecks);
          }
          break;

        case 'agent_health':
          const unhealthyCount = Object.values(data.agents)
            .filter((health: any) => health.status === 'error').length;
          
          if (unhealthyCount > 0) {
            console.warn(`⚠️ ${unhealthyCount} agents are unhealthy`);
          }
          break;

        case 'performance_metrics':
          console.log(`⚡ Performance: Efficiency ${Math.round(data.efficiency * 100)}%, Throughput ${data.throughput.toFixed(2)} tasks/sec`);
          break;

        case 'trend_analysis':
          console.log(`📈 Trend: ${data.trend} (${data.progressRate.toFixed(3)} progress/sec)`);
          break;
      }
    }
  };

  // Get framework's progress monitor
  const monitor = framework['engine'].progressMonitor;
  monitor.addListener(progressListener);

  const team = createMockTeam();

  // Create long-running task specification for monitoring demo
  const specification = createServiceNowTaskSpecification(
    'monitoring-demo',
    'Demonstrate progress monitoring capabilities'
  )
    .addWidgetDevelopmentTasks('monitoring_widget')
    .addFlowDevelopmentTasks('monitoring_flow')
    .addContext('monitoring_demo', true)
    .setExecutionPattern('hybrid')
    .build();

  try {
    const result = await framework.coordinate(team, specification);
    
    if (result.success) {
      console.log('✅ Monitoring demo completed successfully!');
      
      // Get detailed progress report
      const report = await monitor.getDetailedReport();
      console.log('📋 Final Report:', {
        overview: report.overview,
        trends: report.trends,
        recommendations: report.recommendations
      });
    }

  } catch (error) {
    console.error('💥 Monitoring demo failed:', error.message);
  }
}

/**
 * Create a mock team of specialized agents for demonstration
 */
function createMockTeam(): BaseTeam {
  const agents = new Map<string, SnowAgent>();

  // Create different types of agents
  const agentConfigs = [
    { id: 'analyst-001', name: 'Sarah (Analyst)', type: 'analyst', capabilities: ['analysis', 'requirements', 'design'] },
    { id: 'ui-builder-001', name: 'Mike (UI Builder)', type: 'ui-builder', capabilities: ['html', 'css', 'javascript', 'ui-design'] },
    { id: 'coder-001', name: 'Alex (Developer)', type: 'coder', capabilities: ['javascript', 'servicenow', 'backend', 'frontend'] },
    { id: 'coder-002', name: 'Emma (Developer)', type: 'coder', capabilities: ['javascript', 'servicenow', 'integration'] },
    { id: 'snow-specialist-001', name: 'David (ServiceNow)', type: 'servicenow-specialist', capabilities: ['servicenow', 'deployment', 'configuration'] },
    { id: 'workflow-designer-001', name: 'Lisa (Workflow)', type: 'workflow-designer', capabilities: ['workflow', 'flow-designer', 'automation'] },
    { id: 'tester-001', name: 'James (Tester)', type: 'tester', capabilities: ['testing', 'qa', 'servicenow'] },
    { id: 'security-auditor-001', name: 'Rachel (Security)', type: 'security-auditor', capabilities: ['security', 'compliance', 'audit'] },
    { id: 'integration-specialist-001', name: 'Tom (Integration)', type: 'integration-specialist', capabilities: ['integration', 'api', 'ldap'] }
  ];

  agentConfigs.forEach(config => {
    const agent: SnowAgent = {
      id: config.id,
      name: config.name,
      type: config.type as any,
      status: 'idle',
      capabilities: config.capabilities,
      metadata: { specialized: true },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    agents.set(config.id, agent);
  });

  // Create team implementation
  const team: BaseTeam = {
    agents,
    
    getAgent(id: string): SnowAgent | undefined {
      return agents.get(id);
    },

    addAgent(agent: SnowAgent): void {
      agents.set(agent.id, agent);
    },

    removeAgent(id: string): void {
      agents.delete(id);
    },

    getAvailableAgents(): SnowAgent[] {
      return Array.from(agents.values()).filter(agent => agent.status === 'idle');
    },

    getAgentsByType(type: string): SnowAgent[] {
      return Array.from(agents.values()).filter(agent => agent.type === type);
    }
  };

  console.log(`👥 Created mock team with ${agents.size} specialized agents`);
  return team;
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🎬 Starting Team Coordination Framework Examples\n');

  try {
    await exampleWidgetDevelopment();
    console.log('\n' + '='.repeat(80) + '\n');

    await exampleFlowDevelopment();
    console.log('\n' + '='.repeat(80) + '\n');

    await exampleAdvancedCoordination();
    console.log('\n' + '='.repeat(80) + '\n');

    await exampleProgressMonitoring();
    console.log('\n' + '='.repeat(80) + '\n');

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('💥 Example execution failed:', error.message);
  }
}

// Export for use
export {
  exampleWidgetDevelopment,
  exampleFlowDevelopment,
  exampleAdvancedCoordination,
  exampleProgressMonitoring,
  runAllExamples,
  createMockTeam
};

// Run examples if called directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
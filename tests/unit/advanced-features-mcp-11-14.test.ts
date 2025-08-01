/**
 * Unit Tests for ServiceNow Advanced Features MCP Server - Features 11-14
 * Process Mining and Monitoring Testing Suite
 */

import { ServiceNowAdvancedFeaturesMCP } from '../../src/mcp/advanced/servicenow-advanced-features-mcp';
import { ServiceNowClient } from '../../src/utils/servicenow-client';
import { ServiceNowMemoryManager } from '../../src/utils/snow-memory-manager';

// Mock dependencies
jest.mock('../../src/utils/servicenow-client');
jest.mock('../../src/utils/snow-oauth');

// Mock ServiceNowMemoryManager singleton
jest.mock('../../src/utils/snow-memory-manager', () => ({
  ServiceNowMemoryManager: {
    getInstance: jest.fn(() => ({
      store: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      search: jest.fn(),
      getByTags: jest.fn(),
      cleanup: jest.fn(),
      getStats: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn()
    }))
  },
  serviceNowMemoryManager: {
    store: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    search: jest.fn(),
    getByTags: jest.fn(),
    cleanup: jest.fn(),
    getStats: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn()
  }
}));

const MockedServiceNowClient = ServiceNowClient as jest.MockedClass<typeof ServiceNowClient>;

describe('ServiceNow Advanced Features MCP Server - Features 11-14', () => {
  let mcpServer: ServiceNowAdvancedFeaturesMCP;
  let mockSnowClient: jest.Mocked<ServiceNowClient>;
  let mockMemoryManager: jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnowClient = new MockedServiceNowClient() as jest.Mocked<ServiceNowClient>;
    mockMemoryManager = ServiceNowMemoryManager.getInstance() as jest.Mocked<any>;
    mcpServer = new ServiceNowAdvancedFeaturesMCP();
    jest.spyOn(mcpServer as any, 'validateAuth').mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================
  // FEATURE 11: PROCESS MINING ENGINE
  // ========================================
  
  describe('Feature 11: Process Mining Engine (snow_discover_process)', () => {
    const mockProcessData = {
      process_instances: [
        {
          case_id: 'INC0001',
          activities: [
            { activity: 'Create', timestamp: '2024-01-01T10:00:00Z', user: 'john.doe' },
            { activity: 'Assign', timestamp: '2024-01-01T10:30:00Z', user: 'system' },
            { activity: 'Work', timestamp: '2024-01-01T11:00:00Z', user: 'jane.smith' },
            { activity: 'Resolve', timestamp: '2024-01-01T14:00:00Z', user: 'jane.smith' },
            { activity: 'Close', timestamp: '2024-01-01T16:00:00Z', user: 'system' }
          ]
        },
        {
          case_id: 'INC0002',
          activities: [
            { activity: 'Create', timestamp: '2024-01-01T09:00:00Z', user: 'bob.wilson' },
            { activity: 'Escalate', timestamp: '2024-01-01T12:00:00Z', user: 'system' },
            { activity: 'Assign', timestamp: '2024-01-01T12:30:00Z', user: 'system' },
            { activity: 'Work', timestamp: '2024-01-01T13:00:00Z', user: 'senior.tech' },
            { activity: 'Resolve', timestamp: '2024-01-01T15:00:00Z', user: 'senior.tech' }
          ]
        }
      ]
    };

    it('should discover process flows and identify common patterns', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Get process instances
          success: true,
          result: mockProcessData.process_instances
        })
        .mockResolvedValueOnce({ // Get activity definitions
          success: true,
          result: [
            { activity: 'Create', type: 'start', duration_avg: 0 },
            { activity: 'Assign', type: 'system', duration_avg: 1800 },
            { activity: 'Work', type: 'manual', duration_avg: 10800 },
            { activity: 'Resolve', type: 'manual', duration_avg: 3600 },
            { activity: 'Close', type: 'end', duration_avg: 0 }
          ]
        })
        .mockResolvedValueOnce({ // Get performance metrics
          success: true,
          result: {
            avg_process_duration: 21600, // 6 hours
            bottlenecks: ['Work', 'Assign'],
            rework_rate: 0.15,
            compliance_rate: 0.92
          }
        });

      const result = await (mcpServer as any).discoverProcess({
        table_name: 'incident',
        process_scope: 'full_lifecycle',
        timeframe: '30_days',
        include_variants: true,
        detect_bottlenecks: true,
        analyze_compliance: true,
        generate_process_map: true
      });

      expect(result.success).toBe(true);
      expect(result.process_overview).toBeDefined();
      expect(result.process_overview.total_cases).toBe(2);
      expect(result.process_variants).toBeDefined();
      expect(result.process_variants.length).toBeGreaterThan(0);
      expect(result.bottleneck_analysis).toBeDefined();
      expect(result.performance_metrics).toBeDefined();
      expect(result.process_map).toBeDefined();
      expect(result.compliance_analysis).toBeDefined();
    });

    it('should detect process deviations and exceptions', async () => {
      const deviationCases = [
        {
          case_id: 'INC0003',
          activities: [
            { activity: 'Create', timestamp: '2024-01-01T10:00:00Z' },
            { activity: 'Close', timestamp: '2024-01-01T10:05:00Z' }, // Skipped steps
          ]
        },
        {
          case_id: 'INC0004',
          activities: [
            { activity: 'Create', timestamp: '2024-01-01T10:00:00Z' },
            { activity: 'Assign', timestamp: '2024-01-01T10:30:00Z' },
            { activity: 'Reopen', timestamp: '2024-01-01T15:00:00Z' }, // Rework
            { activity: 'Work', timestamp: '2024-01-01T15:30:00Z' },
            { activity: 'Resolve', timestamp: '2024-01-01T16:00:00Z' }
          ]
        }
      ];

      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: deviationCases })
        .mockResolvedValueOnce({ // Standard process model
          success: true,
          result: {
            standard_flow: ['Create', 'Assign', 'Work', 'Resolve', 'Close'],
            deviation_threshold: 0.8
          }
        });

      const result = await (mcpServer as any).discoverProcess({
        table_name: 'incident',
        detect_deviations: true,
        deviation_analysis: 'comprehensive',
        identify_exceptions: true
      });

      expect(result.success).toBe(true);
      expect(result.deviation_analysis).toBeDefined();
      expect(result.deviation_analysis.deviation_cases.length).toBeGreaterThan(0);
      expect(result.exception_patterns).toBeDefined();
      expect(result.process_quality_score).toBeDefined();
    });

    it('should analyze process performance and suggest optimizations', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockProcessData.process_instances })
        .mockResolvedValueOnce({ // Performance benchmarks
          success: true,
          result: {
            industry_benchmarks: {
              avg_resolution_time: 14400, // 4 hours
              first_call_resolution_rate: 0.75,
              customer_satisfaction: 0.85
            },
            current_performance: {
              avg_resolution_time: 21600, // 6 hours
              first_call_resolution_rate: 0.60,
              customer_satisfaction: 0.78
            }
          }
        });

      const result = await (mcpServer as any).discoverProcess({
        table_name: 'incident',
        performance_analysis: true,
        benchmark_comparison: true,
        optimization_suggestions: true,
        roi_analysis: true
      });

      expect(result.success).toBe(true);
      expect(result.performance_comparison).toBeDefined();
      expect(result.optimization_opportunities).toBeDefined();
      expect(result.optimization_opportunities.length).toBeGreaterThan(0);
      expect(result.roi_estimates).toBeDefined();
      expect(result.improvement_roadmap).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 12: WORKFLOW REALITY ANALYZER
  // ========================================
  
  describe('Feature 12: Workflow Reality Analyzer (snow_analyze_workflow_execution)', () => {
    const mockWorkflowData = {
      workflow_definition: {
        name: 'Incident Escalation',
        activities: [
          { name: 'Check Priority', type: 'condition' },
          { name: 'Assign Manager', type: 'task' },
          { name: 'Send Notification', type: 'notification' },
          { name: 'Wait for Approval', type: 'approval' }
        ]
      },
      execution_history: [
        {
          execution_id: 'exec_001',
          workflow_version: '1.0',
          start_time: '2024-01-01T10:00:00Z',
          end_time: '2024-01-01T12:00:00Z',
          status: 'completed',
          activities_executed: ['Check Priority', 'Assign Manager', 'Send Notification']
        },
        {
          execution_id: 'exec_002',
          workflow_version: '1.0',
          start_time: '2024-01-01T11:00:00Z',
          end_time: null,
          status: 'stuck',
          activities_executed: ['Check Priority'],
          stuck_at: 'Wait for Approval'
        }
      ]
    };

    it('should analyze workflow execution patterns and identify issues', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Workflow definition
          success: true,
          result: mockWorkflowData.workflow_definition
        })
        .mockResolvedValueOnce({ // Execution history
          success: true,
          result: mockWorkflowData.execution_history
        })
        .mockResolvedValueOnce({ // Performance metrics
          success: true,
          result: {
            avg_execution_time: 7200, // 2 hours
            success_rate: 0.75,
            stuck_executions: 0.25,
            timeout_rate: 0.05
          }
        });

      const result = await (mcpServer as any).analyzeWorkflowExecution({
        workflow_name: 'Incident Escalation',
        analysis_period: '30_days',
        include_performance_metrics: true,
        identify_bottlenecks: true,
        analyze_failure_patterns: true,
        suggest_improvements: true
      });

      expect(result.success).toBe(true);
      expect(result.workflow_name).toBe('Incident Escalation');
      expect(result.execution_analysis).toBeDefined();
      expect(result.execution_analysis.total_executions).toBe(2);
      expect(result.performance_metrics).toBeDefined();
      expect(result.bottleneck_analysis).toBeDefined();
      expect(result.improvement_suggestions).toBeDefined();
    });

    it('should detect workflow design vs reality gaps', async () => {
      const realityGaps = {
        designed_flow: ['A', 'B', 'C', 'D'],
        actual_flows: [
          ['A', 'B', 'D'], // Skipped C
          ['A', 'C', 'B', 'D'], // Different order
          ['A', 'B', 'C', 'E', 'D'] // Extra step E
        ]
      };

      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockWorkflowData.workflow_definition })
        .mockResolvedValueOnce({ success: true, result: realityGaps });

      const result = await (mcpServer as any).analyzeWorkflowExecution({
        workflow_name: 'Incident Escalation',
        design_vs_reality_analysis: true,
        conformance_checking: true,
        identify_workarounds: true
      });

      expect(result.success).toBe(true);
      expect(result.conformance_analysis).toBeDefined();
      expect(result.conformance_analysis.conformance_rate).toBeLessThan(1.0);
      expect(result.design_gaps).toBeDefined();
      expect(result.workaround_patterns).toBeDefined();
      expect(result.design_improvement_suggestions).toBeDefined();
    });

    it('should analyze resource utilization and capacity', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Resource allocation data
          success: true,
          result: {
            assigned_users: [
              { user: 'john.doe', workload: 15, capacity: 20 },
              { user: 'jane.smith', workload: 25, capacity: 20 },
              { user: 'bob.wilson', workload: 8, capacity: 20 }
            ],
            queue_statistics: {
              avg_queue_time: 3600, // 1 hour
              max_queue_size: 50,
              current_queue_size: 12
            }
          }
        })
        .mockResolvedValueOnce({ // Historical capacity data
          success: true,
          result: {
            peak_hours: ['09:00-11:00', '14:00-16:00'],
            capacity_utilization: 0.85,
            overload_incidents: 8
          }
        });

      const result = await (mcpServer as any).analyzeWorkflowExecution({
        workflow_name: 'Incident Escalation',
        resource_analysis: true,
        capacity_planning: true,
        queue_analysis: true
      });

      expect(result.success).toBe(true);
      expect(result.resource_utilization).toBeDefined();
      expect(result.capacity_analysis).toBeDefined();
      expect(result.queue_analysis).toBeDefined();
      expect(result.capacity_recommendations).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 13: CROSS TABLE PROCESS DISCOVERY
  // ========================================
  
  describe('Feature 13: Cross Table Process Discovery (snow_discover_cross_table_process)', () => {
    const mockCrossTableData = {
      process_map: [
        {
          step: 1,
          table: 'sc_request',
          activity: 'Request Created',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          step: 2,
          table: 'sc_req_item',
          activity: 'Items Added',
          timestamp: '2024-01-01T10:05:00Z'  
        },
        {
          step: 3,
          table: 'sysapproval_approver',
          activity: 'Approval Required',
          timestamp: '2024-01-01T10:10:00Z'
        },
        {
          step: 4,
          table: 'wf_executing',
          activity: 'Workflow Started',
          timestamp: '2024-01-01T10:15:00Z'
        }
      ]
    };

    it('should discover complex processes spanning multiple tables', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Initial process discovery
          success: true,
          result: {
            entry_points: ['sc_request', 'incident', 'change_request'],
            related_tables: ['sc_req_item', 'sysapproval_approver', 'wf_executing']
          }
        })
        .mockResolvedValueOnce({ // Cross-table relationships
          success: true,
          result: [
            { from_table: 'sc_request', to_table: 'sc_req_item', relationship: 'one_to_many' },
            { from_table: 'sc_request', to_table: 'sysapproval_approver', relationship: 'one_to_many' }
          ]
        })
        .mockResolvedValueOnce({ // Process flow data
          success: true,
          result: mockCrossTableData.process_map
        })
        .mockResolvedValueOnce({ // Data flow analysis
          success: true,
          result: {
            data_transformations: [
              { from_field: 'sc_request.number', to_field: 'sc_req_item.request' },
              { from_field: 'sc_request.sys_id', to_field: 'sysapproval_approver.source_table' }
            ]
          }
        });

      const result = await (mcpServer as any).discoverCrossTableProcess({
        discovery_scope: 'specific_modules',
        target_modules: ['service_catalog', 'workflow'],
        max_depth: 3,
        include_data_flow: true,
        analyze_dependencies: true,
        generate_process_map: true,
        export_format: 'json'
      });

      expect(result.success).toBe(true);
      expect(result.discovery_summary).toBeDefined();
      expect(result.discovered_processes).toBeDefined();
      expect(result.discovered_processes.length).toBeGreaterThan(0);
      expect(result.cross_table_relationships).toBeDefined();
      expect(result.data_flow_analysis).toBeDefined();
      expect(result.process_complexity_score).toBeGreaterThan(0);
    });

    it('should identify automation opportunities across tables', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockCrossTableData.process_map })
        .mockResolvedValueOnce({ // Manual activity analysis
          success: true,
          result: {
            manual_activities: [
              { activity: 'Manual Approval', frequency: 150, avg_duration: 7200 },
              { activity: 'Data Entry', frequency: 200, avg_duration: 600 }
            ],
            automation_potential: [
              { activity: 'Manual Approval', automation_score: 0.85, estimated_savings: 1080000 }, // 300 hours
              { activity: 'Data Entry', automation_score: 0.95, estimated_savings: 120000 } // 33 hours
            ]
          }
        })
        .mockResolvedValueOnce({ // Integration opportunities
          success: true,
          result: [
            { integration_type: 'api_automation', description: 'Auto-sync catalog items', roi_score: 8.5 },
            { integration_type: 'workflow_automation', description: 'Automated approvals', roi_score: 9.2 }
          ]
        });

      const result = await (mcpServer as any).discoverCrossTableProcess({
        discovery_scope: 'business_process',
        process_name: 'Service Request Fulfillment',
        identify_automation_opportunities: true,
        calculate_automation_roi: true,
        suggest_integrations: true
      });

      expect(result.success).toBe(true);
      expect(result.automation_opportunities).toBeDefined();
      expect(result.automation_opportunities.length).toBeGreaterThan(0);
      expect(result.automation_roi_analysis).toBeDefined();
      expect(result.integration_suggestions).toBeDefined();
      expect(result.implementation_roadmap).toBeDefined();
    });

    it('should generate comprehensive process documentation', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockCrossTableData.process_map })
        .mockResolvedValueOnce({ // Process documentation
          success: true,
          result: {
            process_description: 'Service Catalog Request Processing',
            stakeholders: ['Requesters', 'Approvers', 'Fulfillment Teams'],
            business_rules: ['Auto-approval for low-value items', 'Manager approval required'],
            compliance_requirements: ['SOX controls', 'Audit trail maintenance']
          }
        });

      const result = await (mcpServer as any).discoverCrossTableProcess({
        discovery_scope: 'full_instance',
        generate_documentation: true,
        include_business_context: true,
        document_compliance_requirements: true,
        export_format: 'markdown'
      });

      expect(result.success).toBe(true);
      expect(result.process_documentation).toBeDefined();
      expect(result.business_context).toBeDefined();
      expect(result.compliance_mapping).toBeDefined();
      expect(result.exported_documentation).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 14: REAL TIME PROCESS MONITORING
  // ========================================
  
  describe('Feature 14: Real Time Process Monitoring (snow_monitor_process)', () => {
    const mockMonitoringData = {
      active_processes: [
        {
          process_id: 'proc_001',
          process_type: 'incident_resolution',
          start_time: '2024-01-01T10:00:00Z',
          current_step: 'investigation',
          assigned_to: 'jane.smith',
          sla_status: 'on_track',
          priority: 'high'
        },
        {
          process_id: 'proc_002', 
          process_type: 'change_approval',
          start_time: '2024-01-01T09:00:00Z',
          current_step: 'cab_review',
          assigned_to: 'change_board',
          sla_status: 'at_risk',
          priority: 'medium'
        }
      ]
    };

    it('should monitor active processes in real-time with alerting', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Get active processes
          success: true,
          result: mockMonitoringData.active_processes
        })
        .mockResolvedValueOnce({ // Performance baselines
          success: true,
          result: {
            baseline_metrics: {
              avg_resolution_time: 14400, // 4 hours
              sla_breach_threshold: 0.1,
              escalation_triggers: ['sla_risk', 'no_activity_2h']
            }
          }
        })
        .mockResolvedValueOnce({ // Real-time metrics
          success: true,
          result: {
            current_metrics: {
              active_count: 25,
              at_risk_count: 3,
              breached_count: 1,
              avg_cycle_time: 16200 // 4.5 hours
            }
          }
        });

      const result = await (mcpServer as any).monitorProcess({
        monitoring_scope: 'critical_processes',
        process_types: ['incident_resolution', 'change_approval'],
        real_time_alerts: true,
        sla_monitoring: true,
        performance_tracking: true,
        dashboard_generation: true
      });

      expect(result.success).toBe(true);
      expect(result.monitoring_summary).toBeDefined();
      expect(result.active_processes).toHaveLength(2);
      expect(result.performance_metrics).toBeDefined();
      expect(result.alert_conditions).toBeDefined();
      expect(result.real_time_dashboard).toBeDefined();
    });

    it('should detect anomalies and trigger automated responses', async () => {
      const anomalyData = {
        detected_anomalies: [
          {
            process_id: 'proc_003',
            anomaly_type: 'unusual_delay',
            severity: 'high',
            description: 'Process stuck for 4 hours without activity',
            suggested_action: 'escalate_to_manager'
          },
          {
            process_id: 'proc_004',
            anomaly_type: 'resource_bottleneck',
            severity: 'medium', 
            description: 'Queue backup in approval step',
            suggested_action: 'load_balance'
          }
        ]
      };

      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockMonitoringData.active_processes })
        .mockResolvedValueOnce({ success: true, result: anomalyData })
        .mockResolvedValueOnce({ // Automated response results
          success: true,
          result: {
            responses_triggered: [
              { action: 'escalate_to_manager', status: 'executed', process_id: 'proc_003' },
              { action: 'load_balance', status: 'executed', process_id: 'proc_004' }
            ]
          }
        });

      const result = await (mcpServer as any).monitorProcess({
        monitoring_scope: 'all_processes',
        anomaly_detection: true,
        automated_responses: true,
        response_actions: ['escalate', 'rebalance', 'notify'],
        learning_mode: true
      });

      expect(result.success).toBe(true);
      expect(result.anomaly_detection).toBeDefined();
      expect(result.anomaly_detection.detected_anomalies.length).toBe(2);
      expect(result.automated_responses).toBeDefined();
      expect(result.response_effectiveness).toBeDefined();
    });

    it('should generate real-time dashboards and reports', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockMonitoringData.active_processes })
        .mockResolvedValueOnce({ // Dashboard data
          success: true,
          result: {
            kpi_metrics: {
              processes_completed_today: 45,
              avg_resolution_time: '4.2h',
              sla_compliance_rate: '94.5%',
              customer_satisfaction: '4.2/5'
            },
            trend_data: {
              resolution_time_trend: [-5.2, 2.1, -1.8, 3.5, -2.1], // % change last 5 days
              volume_trend: [42, 38, 51, 47, 45] // cases per day
            }
          }
        })
        .mockResolvedValueOnce({ // Heat map data
          success: true,
          result: {
            process_heat_map: [
              { process_type: 'incident', load: 'high', performance: 'good' },
              { process_type: 'change', load: 'medium', performance: 'at_risk' },
              { process_type: 'request', load: 'low', performance: 'excellent' }
            ]
          }
        });

      const result = await (mcpServer as any).monitorProcess({
        monitoring_scope: 'performance_focused',
        generate_kpi_dashboard: true,
        include_trend_analysis: true,
        create_heat_maps: true,
        export_dashboard: true,
        dashboard_format: 'html'
      });

      expect(result.success).toBe(true);
      expect(result.kpi_dashboard).toBeDefined();
      expect(result.trend_analysis).toBeDefined();
      expect(result.process_heat_map).toBeDefined();
      expect(result.dashboard_export).toBeDefined();
      expect(result.dashboard_url).toBeDefined();
    });

    it('should handle high-volume monitoring with performance optimization', async () => {
      // Mock high-volume scenario
      const highVolumeData = Array(1000).fill(0).map((_, i) => ({
        process_id: `proc_${i}`,
        process_type: 'high_volume_process',
        status: 'active'
      }));

      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: highVolumeData })
        .mockResolvedValueOnce({ // Sampling strategy results
          success: true,
          result: {
            sampled_processes: 100,
            confidence_level: 0.95,
            margin_of_error: 0.05,
            representative_metrics: {
              avg_processing_time: 1800,
              throughput_per_hour: 250
            }
          }
        });

      const result = await (mcpServer as any).monitorProcess({
        monitoring_scope: 'all_processes',
        high_volume_optimization: true,
        sampling_strategy: 'statistical',
        performance_optimization: true,
        resource_efficient: true
      });

      expect(result.success).toBe(true);
      expect(result.monitoring_optimization).toBeDefined();
      expect(result.sampling_statistics).toBeDefined();
      expect(result.performance_impact).toBeDefined();
      expect(result.resource_usage).toBeDefined();
    });
  });

  // ========================================
  // INTEGRATION TESTS FOR PROCESS FEATURES
  // ========================================
  
  describe('Integration Tests for Process Mining Features', () => {
    it('should integrate process discovery with real-time monitoring', async () => {
      // First discover processes
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Process discovery
          success: true,
          result: { discovered_processes: ['incident_management', 'change_management'] }
        })
        .mockResolvedValueOnce({ // Start monitoring discovered processes
          success: true,
          result: { monitoring_started: true, processes_monitored: 2 }
        });

      const discoveryResult = await (mcpServer as any).discoverProcess({
        table_name: 'incident',
        auto_start_monitoring: true
      });

      const monitoringResult = await (mcpServer as any).monitorProcess({
        discovered_processes: discoveryResult.discovered_processes
      });

      expect(discoveryResult.success).toBe(true);
      expect(monitoringResult.success).toBe(true);
      expect(monitoringResult.integrated_discovery).toBe(true);
    });

    it('should handle cross-feature data sharing and caching', async () => {
      // Mock cached process data from previous discovery
      mockMemoryManager.get.mockResolvedValueOnce({
        data: { process_map: 'cached_data', timestamp: Date.now() - 300000 }, // 5 min ago
        timestamp: Date.now() - 300000
      });

      const result = await (mcpServer as any).analyzeWorkflowExecution({
        workflow_name: 'test_workflow',
        use_cached_process_data: true,
        cache_ttl: 600000 // 10 minutes
      });

      expect(mockMemoryManager.get).toHaveBeenCalled();
      expect(result.used_cached_data).toBe(true);
    });

    it('should maintain performance under concurrent process analysis', async () => {
      mockSnowClient.makeRequest.mockResolvedValue({ success: true, result: {} });

      const concurrentOperations = [
        (mcpServer as any).discoverProcess({ table_name: 'incident' }),
        (mcpServer as any).analyzeWorkflowExecution({ workflow_name: 'test1' }),
        (mcpServer as any).discoverCrossTableProcess({ discovery_scope: 'limited' }),
        (mcpServer as any).monitorProcess({ monitoring_scope: 'active_only' })
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentOperations);
      const executionTime = Date.now() - startTime;

      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBe(4);
      expect(executionTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should handle large-scale process data efficiently', async () => {
      // Mock large dataset
      const largeProcessData = Array(5000).fill(0).map((_, i) => ({
        case_id: `case_${i}`,
        activities: ['start', 'process', 'end']
      }));

      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: largeProcessData
      });

      const result = await (mcpServer as any).discoverProcess({
        table_name: 'large_table',
        optimize_for_large_datasets: true,
        memory_efficient: true,
        sampling_enabled: true
      });

      expect(result.success).toBe(true);
      expect(result.optimization_applied).toBe(true);
      expect(result.memory_usage).toBeDefined();
    });
  });

  // ========================================
  // ERROR HANDLING FOR PROCESS FEATURES
  // ========================================
  
  describe('Error Handling for Process Features', () => {
    it('should handle process discovery failures gracefully', async () => {
      mockSnowClient.makeRequest.mockRejectedValue(
        new Error('Table access denied for process analysis')
      );

      const result = await (mcpServer as any).discoverProcess({
        table_name: 'restricted_table'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Table access denied');
      expect(result.fallback_analysis).toBeDefined();
    });

    it('should handle monitoring service interruptions', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: [] }) // Initial success
        .mockRejectedValueOnce(new Error('Service temporarily unavailable')) // Then failure
        .mockResolvedValueOnce({ success: true, result: [] }); // Recovery

      const result = await (mcpServer as any).monitorProcess({
        monitoring_scope: 'all_processes',
        resilient_monitoring: true,
        auto_recovery: true
      });

      expect(result.success).toBe(true);
      expect(result.service_interruptions).toBeDefined();
      expect(result.recovery_actions).toBeDefined();
    });

    it('should validate process analysis parameters', async () => {
      await expect((mcpServer as any).discoverProcess({
        table_name: '', // Empty table name
        timeframe: 'invalid_timeframe' // Invalid timeframe
      })).rejects.toThrow('Invalid parameters');

      await expect((mcpServer as any).monitorProcess({
        monitoring_scope: 'invalid_scope' // Invalid scope
      })).rejects.toThrow('Invalid monitoring scope');
    });
  });
});
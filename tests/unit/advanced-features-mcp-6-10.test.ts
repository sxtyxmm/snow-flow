/**
 * Unit Tests for ServiceNow Advanced Features MCP Server - Features 6-10
 * Deep Analysis and Code Tools Testing Suite
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

describe('ServiceNow Advanced Features MCP Server - Features 6-10', () => {
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
  // FEATURE 6: DEEP TABLE ANALYSIS
  // ========================================
  
  describe('Feature 6: Deep Table Analysis (snow_analyze_table_deep)', () => {
    const mockTableData = {
      table_info: {
        name: 'incident',
        label: 'Incident',
        record_count: 45000,
        storage_size_mb: 120,
        avg_record_size: 2800
      },
      field_analysis: [
        {
          name: 'state',
          type: 'integer',
          null_count: 0,
          unique_count: 8,
          most_common_values: [{'1': 15000}, {'2': 12000}, {'3': 8000}]
        },
        {
          name: 'short_description',
          type: 'string',
          null_count: 50,
          avg_length: 65,
          max_length: 255
        }
      ]
    };

    it('should perform comprehensive table analysis with data profiling', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Table metadata
          success: true,
          result: mockTableData.table_info
        })
        .mockResolvedValueOnce({ // Field statistics
          success: true,
          result: mockTableData.field_analysis
        })
        .mockResolvedValueOnce({ // Data quality metrics
          success: true,
          result: {
            completeness_score: 94.2,
            consistency_score: 87.5,
            validity_score: 96.8,
            data_quality_issues: [
              { field: 'priority', issue: 'missing_values', count: 250 },
              { field: 'description', issue: 'truncated_data', count: 15 }
            ]
          }
        })
        .mockResolvedValueOnce({ // Performance metrics
          success: true,
          result: {
            query_performance: 'good',
            index_effectiveness: 85.2,
            fragmentation_level: 12.5
          }
        });

      const result = await (mcpServer as any).analyzeTableDeep({
        table_name: 'incident',
        include_data_profiling: true,
        include_quality_metrics: true,
        include_performance_analysis: true,
        include_optimization_suggestions: true,
        sample_size: 1000
      });

      expect(result.success).toBe(true);
      expect(result.table_name).toBe('incident');
      expect(result.data_profile).toBeDefined();
      expect(result.data_profile.record_count).toBe(45000);
      expect(result.field_statistics).toHaveLength(2);
      expect(result.data_quality).toBeDefined();
      expect(result.data_quality.overall_score).toBeGreaterThan(0);
      expect(result.performance_analysis).toBeDefined();
      expect(result.optimization_recommendations).toBeDefined();
    });

    it('should detect data anomalies and outliers', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockTableData.table_info })
        .mockResolvedValueOnce({ // Anomaly detection data
          success: true,
          result: {
            statistical_outliers: [
              { field: 'priority', outlier_count: 25, threshold: 3.5 },
              { field: 'business_duration', outlier_count: 8, threshold: 2.0 }
            ],
            pattern_anomalies: [
              { pattern: 'duplicate_descriptions', count: 150 },
              { pattern: 'suspicious_timestamps', count: 12 }
            ]
          }
        })
        .mockResolvedValueOnce({ // Data distribution analysis
          success: true,
          result: {
            distributions: {
              state: { distribution_type: 'normal', skewness: 0.15 },
              priority: { distribution_type: 'bimodal', skewness: -1.2 }
            }
          }
        });

      const result = await (mcpServer as any).analyzeTableDeep({
        table_name: 'incident',
        detect_anomalies: true,
        anomaly_sensitivity: 'high',
        include_statistical_analysis: true
      });

      expect(result.success).toBe(true);
      expect(result.anomaly_detection).toBeDefined();
      expect(result.anomaly_detection.statistical_outliers.length).toBeGreaterThan(0);
      expect(result.anomaly_detection.pattern_anomalies.length).toBeGreaterThan(0);
      expect(result.statistical_analysis).toBeDefined();
      expect(result.data_health_score).toBeGreaterThan(0);
    });

    it('should analyze table relationships and dependencies', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ success: true, result: mockTableData.table_info })
        .mockResolvedValueOnce({ // Relationship analysis
          success: true,
          result: {
            parent_tables: ['sys_user', 'core_company'],
            child_tables: ['incident_task', 'incident_metric'],
            reference_integrity: 98.7,
            orphaned_records: 45
          }
        })
        .mockResolvedValueOnce({ // Business logic dependencies
          success: true,
          result: [
            { type: 'business_rule', name: 'Calculate Priority', active: true },
            { type: 'workflow', name: 'Incident Escalation', active: true },
            { type: 'ui_policy', name: 'Required Fields', active: true }
          ]
        });

      const result = await (mcpServer as any).analyzeTableDeep({
        table_name: 'incident',
        analyze_relationships: true,
        check_referential_integrity: true,
        include_business_logic: true
      });

      expect(result.success).toBe(true);
      expect(result.relationship_analysis).toBeDefined();
      expect(result.relationship_analysis.parent_tables.length).toBe(2);
      expect(result.relationship_analysis.reference_integrity).toBeGreaterThan(95);
      expect(result.business_logic_dependencies).toHaveLength(3);
      expect(result.integrity_issues).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 7: CODE PATTERN DETECTOR
  // ========================================
  
  describe('Feature 7: Code Pattern Detector (snow_detect_code_patterns)', () => {
    const mockCodeSamples = {
      business_rules: [
        {
          sys_id: 'br1',
          name: 'Priority Calculator',
          script: `
            if (current.urgency == '1' && current.impact == '1') {
              current.priority = '1';
            } else if (current.urgency == '2' && current.impact == '2') {
              current.priority = '2';
            }
            // More similar patterns...
          `
        },
        {
          sys_id: 'br2',
          name: 'Assignment Logic',
          script: `
            var gr = new GlideRecord('sys_user');
            gr.addQuery('department', current.u_department);
            gr.query();
            if (gr.next()) {
              current.assigned_to = gr.sys_id;
            }
          `
        }
      ]
    };

    it('should detect common coding patterns and anti-patterns', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Get all business rules
          success: true,
          result: mockCodeSamples.business_rules
        })
        .mockResolvedValueOnce({ // Get client scripts
          success: true,
          result: [
            {
              sys_id: 'cs1',
              name: 'Field Validation',
              script: 'if (g_form.getValue("priority") == "") { alert("Priority required"); }'
            }
          ]
        })
        .mockResolvedValueOnce({ // Get script includes
          success: true,
          result: [
            {
              sys_id: 'si1',
              name: 'UtilityFunctions',
              script: 'function calculateSLA() { /* complex logic */ }'
            }
          ]
        });

      const result = await (mcpServer as any).detectCodePatterns({
        analysis_scope: 'instance_wide',
        include_business_rules: true,
        include_client_scripts: true,
        include_script_includes: true,
        detect_anti_patterns: true,
        suggest_refactoring: true,
        complexity_analysis: true
      });

      expect(result.success).toBe(true);
      expect(result.analysis_summary).toBeDefined();
      expect(result.pattern_detection).toBeDefined();
      expect(result.pattern_detection.common_patterns.length).toBeGreaterThan(0);
      expect(result.anti_patterns).toBeDefined();
      expect(result.refactoring_opportunities).toBeDefined();
      expect(result.complexity_metrics).toBeDefined();
    });

    it('should analyze code complexity and maintainability', async () => {
      const complexCode = `
        function complexFunction() {
          for (var i = 0; i < 100; i++) {
            if (condition1) {
              for (var j = 0; j < 50; j++) {
                if (condition2) {
                  if (condition3) {
                    // Deep nesting
                    doSomething();
                  }
                }
              }
            }
          }
        }
      `;

      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: [
          {
            sys_id: 'complex1',
            name: 'Complex Business Rule',
            script: complexCode
          }
        ]
      });

      const result = await (mcpServer as any).detectCodePatterns({
        analysis_scope: 'table_specific',
        table_name: 'incident',
        complexity_threshold: 'medium',
        analyze_maintainability: true
      });

      expect(result.success).toBe(true);
      expect(result.complexity_metrics).toBeDefined();
      expect(result.complexity_metrics.high_complexity_scripts.length).toBeGreaterThan(0);
      expect(result.maintainability_index).toBeDefined();
      expect(result.refactoring_priorities).toBeDefined();
    });

    it('should identify security vulnerabilities in code', async () => {
      const vulnerableCode = `
        var userInput = current.u_user_input;
        var query = "SELECT * FROM incident WHERE number = '" + userInput + "'";
        var gr = new GlideRecord('incident');
        gr.addEncodedQuery(query); // SQL injection risk
      `;

      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: [
          {
            sys_id: 'vulnerable1',
            name: 'Vulnerable Script',
            script: vulnerableCode
          }
        ]
      });

      const result = await (mcpServer as any).detectCodePatterns({
        security_analysis: true,
        vulnerability_scan: true,
        check_input_validation: true,
        check_sql_injection: true
      });

      expect(result.success).toBe(true);
      expect(result.security_analysis).toBeDefined();
      expect(result.security_analysis.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.security_analysis.vulnerabilities[0].severity).toBeDefined();
      expect(result.security_recommendations).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 8: PREDICTIVE IMPACT ANALYSIS
  // ========================================
  
  describe('Feature 8: Predictive Impact Analysis (snow_predict_change_impact)', () => {
    const mockChangeRequest = {
      change_type: 'field_modification',
      target_table: 'incident',
      target_field: 'priority',
      proposed_changes: {
        new_type: 'choice',
        new_choices: ['critical', 'high', 'medium', 'low']
      }
    };

    it('should predict comprehensive change impact across system', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Current usage analysis
          success: true,
          result: {
            current_usage: {
              records_affected: 45000,
              business_rules: ['Priority Calculator', 'SLA Assignment'],
              workflows: ['Escalation Process'],
              reports: ['Priority Report', 'SLA Dashboard'],
              ui_policies: ['Priority Validation']
            }
          }
        })
        .mockResolvedValueOnce({ // Dependency chain analysis
          success: true,
          result: {
            direct_dependencies: 8,
            indirect_dependencies: 23,
            dependency_chain: [
              { type: 'business_rule', name: 'Priority Calculator', impact_level: 'high' },
              { type: 'workflow', name: 'Escalation Process', impact_level: 'medium' }
            ]
          }
        })
        .mockResolvedValueOnce({ // Historical change data
          success: true,
          result: {
            similar_changes: [
              { change_id: 'CHG001', success_rate: 85, rollback_required: false },
              { change_id: 'CHG002', success_rate: 60, rollback_required: true }
            ]
          }
        });

      const result = await (mcpServer as any).predictChangeImpact({
        ...mockChangeRequest,
        analyze_dependencies: true,
        include_historical_data: true,
        risk_assessment: true,
        generate_test_plan: true
      });

      expect(result.success).toBe(true);
      expect(result.impact_analysis).toBeDefined();
      expect(result.impact_analysis.affected_components.length).toBeGreaterThan(0);
      expect(result.risk_assessment).toBeDefined();
      expect(result.risk_assessment.overall_risk_score).toBeGreaterThan(0);
      expect(result.recommended_testing).toBeDefined();
      expect(result.rollback_complexity).toBeDefined();
    });

    it('should identify cascading effects and side impacts', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({
          success: true,
          result: {
            cascading_effects: [
              {
                component: 'SLA Definitions',
                impact_type: 'calculation_change',
                severity: 'high',
                affected_records: 1200
              },
              {
                component: 'Assignment Rules',
                impact_type: 'logic_update_required',
                severity: 'medium',
                affected_records: 800
              }
            ]
          }
        })
        .mockResolvedValueOnce({
          success: true,
          result: {
            integration_impacts: [
              { system: 'ITSM Tool', impact: 'API mapping required' },
              { system: 'Monitoring System', impact: 'Alert thresholds need update' }
            ]
          }
        });

      const result = await (mcpServer as any).predictChangeImpact({
        ...mockChangeRequest,
        analyze_cascading_effects: true,
        check_integrations: true,
        deep_analysis: true
      });

      expect(result.success).toBe(true);
      expect(result.cascading_effects).toBeDefined();
      expect(result.cascading_effects.length).toBeGreaterThan(0);
      expect(result.integration_impacts).toBeDefined();
      expect(result.side_effects_probability).toBeGreaterThan(0);
    });

    it('should generate comprehensive testing recommendations', async () => {
      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: {
          test_scenarios: [
            { scenario: 'Priority calculation validation', priority: 'high' },
            { scenario: 'SLA assignment testing', priority: 'high' },
            { scenario: 'UI display verification', priority: 'medium' }
          ]
        }
      });

      const result = await (mcpServer as any).predictChangeImpact({
        ...mockChangeRequest,
        generate_test_scenarios: true,
        create_validation_plan: true,
        automated_test_suggestions: true
      });

      expect(result.success).toBe(true);
      expect(result.testing_plan).toBeDefined();
      expect(result.testing_plan.test_scenarios.length).toBeGreaterThan(0);
      expect(result.validation_checklist).toBeDefined();
      expect(result.automated_testing_options).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 9: AUTO DOCUMENTATION GENERATOR
  // ========================================
  
  describe('Feature 9: Auto Documentation Generator (snow_generate_documentation)', () => {
    it('should generate comprehensive system documentation', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Application overview
          success: true,
          result: {
            application: 'ITSM',
            version: '1.2.0',
            description: 'IT Service Management Application',
            components: ['incident', 'problem', 'change', 'service_catalog']
          }
        })
        .mockResolvedValueOnce({ // Table structures
          success: true,
          result: [
            {
              name: 'incident',
              fields: [
                { name: 'number', type: 'string', mandatory: true },
                { name: 'short_description', type: 'string', mandatory: true }
              ]
            }
          ]
        })
        .mockResolvedValueOnce({ // Business processes
          success: true,
          result: [
            {
              name: 'Incident Management',
              steps: ['Create', 'Assign', 'Work', 'Resolve', 'Close'],
              automation_level: 75
            }
          ]
        });

      const result = await (mcpServer as any).generateDocumentation({
        documentation_scope: 'application',
        application_name: 'ITSM',
        include_data_model: true,
        include_business_processes: true,
        include_integrations: true,
        include_customizations: true,
        output_format: 'markdown',
        generate_diagrams: true
      });

      expect(result.success).toBe(true);
      expect(result.documentation).toBeDefined();
      expect(result.documentation.overview).toBeDefined();
      expect(result.documentation.data_model).toBeDefined();
      expect(result.documentation.business_processes).toBeDefined();
      expect(result.generated_files).toBeDefined();
      expect(result.generated_files.length).toBeGreaterThan(0);
    });

    it('should generate API documentation with examples', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // REST API endpoints
          success: true,
          result: [
            {
              path: '/api/now/table/incident',
              methods: ['GET', 'POST', 'PUT', 'DELETE'],
              description: 'Incident table operations'
            }
          ]
        })
        .mockResolvedValueOnce({ // Scripted REST APIs
          success: true,
          result: [
            {
              name: 'Custom Incident API',
              path: '/api/custom/incident',
              methods: ['GET', 'POST'],
              script: 'function getIncident() { /* implementation */ }'
            }
          ]
        });

      const result = await (mcpServer as any).generateDocumentation({
        documentation_scope: 'api',
        include_rest_apis: true,
        include_scripted_apis: true,
        generate_examples: true,
        include_authentication: true,
        output_format: 'openapi'
      });

      expect(result.success).toBe(true);
      expect(result.api_documentation).toBeDefined();
      expect(result.api_documentation.endpoints.length).toBeGreaterThan(0);
      expect(result.examples).toBeDefined();
      expect(result.openapi_spec).toBeDefined();
    });

    it('should generate process flow diagrams', async () => {
      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: {
          workflow_definition: {
            name: 'Incident Resolution',
            activities: [
              { name: 'Start', type: 'start' },
              { name: 'Categorize', type: 'task' },
              { name: 'Assign', type: 'task' },
              { name: 'Resolve', type: 'task' },
              { name: 'End', type: 'end' }
            ],
            transitions: [
              { from: 'Start', to: 'Categorize' },
              { from: 'Categorize', to: 'Assign' },
              { from: 'Assign', to: 'Resolve' },
              { from: 'Resolve', to: 'End' }
            ]
          }
        }
      });

      const result = await (mcpServer as any).generateDocumentation({
        documentation_scope: 'workflow',
        workflow_name: 'Incident Resolution',
        generate_flow_diagrams: true,
        diagram_format: 'mermaid',
        include_decision_points: true
      });

      expect(result.success).toBe(true);
      expect(result.flow_diagrams).toBeDefined();
      expect(result.flow_diagrams.mermaid_code).toBeDefined();
      expect(result.documentation.workflow_description).toBeDefined();
    });
  });

  // ========================================
  // FEATURE 10: INTELLIGENT REFACTORING
  // ========================================
  
  describe('Feature 10: Intelligent Refactoring (snow_refactor_code)', () => {
    const mockRefactoringTarget = {
      artifact_type: 'business_rule',
      artifact_id: 'br_priority_calc',
      refactoring_goals: ['reduce_complexity', 'improve_performance', 'enhance_maintainability']
    };

    it('should analyze code and suggest intelligent refactoring', async () => {
      const complexBusinessRule = `
        if (current.urgency == '1') {
          if (current.impact == '1') {
            current.priority = '1';
          } else if (current.impact == '2') {
            current.priority = '2';
          }
        } else if (current.urgency == '2') {
          if (current.impact == '1') {
            current.priority = '2';
          } else if (current.impact == '2') {
            current.priority = '3';
          }
        }
        // More repetitive code...
      `;

      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Get current code
          success: true,
          result: {
            sys_id: 'br_priority_calc',
            name: 'Priority Calculator',
            script: complexBusinessRule,
            when: 'before',
            table: 'incident'
          }
        })
        .mockResolvedValueOnce({ // Code analysis
          success: true,
          result: {
            complexity_score: 85,
            maintainability_index: 45,
            code_smells: ['duplicated_code', 'long_method', 'complex_conditional'],
            performance_issues: ['inefficient_loops', 'unnecessary_database_calls']
          }
        });

      const result = await (mcpServer as any).refactorCode({
        ...mockRefactoringTarget,
        analyze_current_code: true,
        suggest_improvements: true,
        generate_refactored_code: true,
        create_test_cases: true,
        preserve_functionality: true
      });

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.complexity_score).toBe(85);
      expect(result.refactoring_suggestions).toBeDefined();
      expect(result.refactoring_suggestions.length).toBeGreaterThan(0);
      expect(result.refactored_code).toBeDefined();
      expect(result.improvement_metrics).toBeDefined();
      expect(result.test_cases).toBeDefined();
    });

    it('should extract reusable functions and create script includes', async () => {
      const duplicatedCode = `
        // Business Rule 1
        var gr1 = new GlideRecord('sys_user');
        gr1.addQuery('department', 'IT');
        gr1.addQuery('active', true);
        gr1.query();
        
        // Business Rule 2  
        var gr2 = new GlideRecord('sys_user');
        gr2.addQuery('department', 'HR');
        gr2.addQuery('active', true);
        gr2.query();
      `;

      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: {
          duplicated_patterns: [
            {
              pattern: 'user_query_by_department',
              occurrences: 8,
              code_snippet: 'var gr = new GlideRecord(\'sys_user\'); gr.addQuery(...)',
              extraction_potential: 'high'
            }
          ]
        }
      });

      const result = await (mcpServer as any).refactorCode({
        artifact_type: 'multiple_business_rules',
        refactoring_goals: ['extract_common_functions', 'reduce_duplication'],
        create_script_includes: true,
        auto_replace_calls: false // Safety first
      });

      expect(result.success).toBe(true);
      expect(result.extracted_functions).toBeDefined();
      expect(result.extracted_functions.length).toBeGreaterThan(0);
      expect(result.script_include_code).toBeDefined();
      expect(result.replacement_instructions).toBeDefined();
    });

    it('should optimize database operations and queries', async () => {
      const inefficientCode = `
        var gr = new GlideRecord('incident');
        gr.query(); // No conditions - full table scan
        while (gr.next()) {
          if (gr.priority == '1') {
            // Process high priority
            var userGr = new GlideRecord('sys_user');
            userGr.get(gr.assigned_to); // Multiple DB calls in loop
            doSomething(userGr);
          }
        }
      `;

      mockSnowClient.makeRequest.mockResolvedValue({
        success: true,
        result: {
          performance_issues: [
            { type: 'full_table_scan', severity: 'high', line: 2 },
            { type: 'n_plus_one_query', severity: 'medium', line: 6 }
          ]
        }
      });

      const result = await (mcpServer as any).refactorCode({
        artifact_type: 'business_rule',
        artifact_id: 'inefficient_rule',
        refactoring_goals: ['optimize_database_operations'],
        performance_optimization: true
      });

      expect(result.success).toBe(true);
      expect(result.performance_improvements).toBeDefined();
      expect(result.optimized_code).toBeDefined();
      expect(result.optimization_explanation).toBeDefined();
      expect(result.estimated_performance_gain).toBeGreaterThan(0);
    });

    it('should ensure refactoring preserves functionality', async () => {
      mockSnowClient.makeRequest
        .mockResolvedValueOnce({ // Original code tests
          success: true,
          result: {
            test_cases: [
              { input: { urgency: '1', impact: '1' }, expected_output: { priority: '1' } },
              { input: { urgency: '2', impact: '2' }, expected_output: { priority: '3' } }
            ]
          }
        })
        .mockResolvedValueOnce({ // Refactored code validation
          success: true,
          result: {
            all_tests_passed: true,
            test_results: [
              { test_id: 1, passed: true },
              { test_id: 2, passed: true }
            ]
          }
        });

      const result = await (mcpServer as any).refactorCode({
        ...mockRefactoringTarget,
        validate_functionality: true,
        run_regression_tests: true,
        generate_before_after_comparison: true
      });

      expect(result.success).toBe(true);
      expect(result.functionality_validation).toBeDefined();
      expect(result.functionality_validation.all_tests_passed).toBe(true);
      expect(result.before_after_comparison).toBeDefined();
      expect(result.regression_test_results).toBeDefined();
    });
  });

  // ========================================
  // INTEGRATION AND PERFORMANCE TESTS
  // ========================================
  
  describe('Integration and Performance Tests for Features 6-10', () => {
    it('should handle concurrent analysis requests efficiently', async () => {
      mockSnowClient.makeRequest.mockResolvedValue({ 
        success: true, 
        result: { data: 'mock' } 
      });

      const promises = [
        (mcpServer as any).analyzeTableDeep({ table_name: 'incident' }),
        (mcpServer as any).detectCodePatterns({ analysis_scope: 'limited' }),
        (mcpServer as any).predictChangeImpact({ change_type: 'simple' }),
        (mcpServer as any).generateDocumentation({ documentation_scope: 'basic' }),
        (mcpServer as any).refactorCode({ artifact_type: 'business_rule' })
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const executionTime = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should cache analysis results for improved performance', async () => {
      const cacheKey = 'table-analysis-incident';
      mockMemoryManager.get.mockResolvedValueOnce({
        data: { cached: true, analysis_complete: true },
        timestamp: Date.now() - 30000 // 30 seconds ago
      });

      const result = await (mcpServer as any).analyzeTableDeep({
        table_name: 'incident',
        use_cache: true,
        cache_ttl: 600000 // 10 minutes
      });

      expect(mockMemoryManager.get).toHaveBeenCalled();
      expect(result.cached).toBe(true);
      expect(mockSnowClient.makeRequest).not.toHaveBeenCalled();
    });

    it('should handle memory pressure gracefully', async () => {
      // Mock memory pressure situation
      jest.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 800 * 1024 * 1024, // 800MB
        heapTotal: 500 * 1024 * 1024, // 500MB  
        heapUsed: 450 * 1024 * 1024, // 450MB
        external: 50 * 1024 * 1024, // 50MB
        arrayBuffers: 10 * 1024 * 1024 // 10MB
      });

      mockSnowClient.makeRequest.mockResolvedValue({ success: true, result: {} });

      const result = await (mcpServer as any).analyzeTableDeep({
        table_name: 'large_table',
        sample_size: 10000, // Large sample
        optimize_memory: true
      });

      expect(result.success).toBe(true);
      expect(result.memory_optimized).toBe(true);
    });
  });
});
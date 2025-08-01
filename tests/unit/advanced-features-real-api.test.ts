/**
 * Unit tests for ServiceNow Advanced Features MCP Server
 * USES REAL SERVICENOW API - NO MOCKS
 */

import { ServiceNowAdvancedFeaturesMCP } from '../../src/mcp/advanced/servicenow-advanced-features-mcp';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for real API access
dotenv.config({ path: path.join(process.cwd(), '.env') });

describe('ServiceNow Advanced Features MCP Server - REAL API TESTS', () => {
  let mcpServer: ServiceNowAdvancedFeaturesMCP;
  let testRecordIds: string[] = [];
  const testPrefix = `UTEST_${Date.now()}_`;

  beforeAll(async () => {
    // Verify we have real credentials
    expect(process.env.SNOW_INSTANCE).toBeDefined();
    expect(process.env.SNOW_CLIENT_ID).toBeDefined();
    expect(process.env.SNOW_CLIENT_SECRET).toBeDefined();

    // Create real MCP server instance
    mcpServer = new ServiceNowAdvancedFeaturesMCP();
    
    // Wait for automatic auth to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify auth worked
    const connectionTest = await (mcpServer as any).client.testConnection();
    expect(connectionTest.success).toBe(true);
  }, 30000);

  afterAll(async () => {
    // Clean up test records
    for (const sysId of testRecordIds) {
      try {
        await (mcpServer as any).client.makeRequest({
          method: 'DELETE',
          url: `/api/now/table/incident/${sysId}`
        });
      } catch (error) {
        console.log('Cleanup error (non-critical):', error);
      }
    }

    // Clean up intervals
    if ((mcpServer as any).authCheckInterval) {
      clearInterval((mcpServer as any).authCheckInterval);
    }
    if ((mcpServer as any).metricsInterval) {
      clearInterval((mcpServer as any).metricsInterval);
    }
  }, 30000);

  describe('Feature 1: Smart Batch API Operations (snow_batch_api)', () => {
    it('should execute batch operations successfully', async () => {
      // Create test incidents first
      const incident1Response = await (mcpServer as any).client.makeRequest({
        method: 'POST',
        url: '/api/now/table/incident',
        data: {
          short_description: `${testPrefix}Batch Test 1`,
          urgency: '3',
          impact: '3'
        }
      });
      const incident1Id = incident1Response.result?.sys_id;
      testRecordIds.push(incident1Id);

      const incident2Response = await (mcpServer as any).client.makeRequest({
        method: 'POST',
        url: '/api/now/table/incident',
        data: {
          short_description: `${testPrefix}Batch Test 2`,
          urgency: '2',
          impact: '2'
        }
      });
      const incident2Id = incident2Response.result?.sys_id;
      testRecordIds.push(incident2Id);

      // Execute batch operations
      const response = await (mcpServer as any).executeBatchApi({
        operations: [
          {
            operation: 'query',
            table: 'incident',
            query: `short_descriptionSTARTSWITH${testPrefix}`,
            fields: ['number', 'short_description', 'urgency'],
            limit: 10
          },
          {
            operation: 'update',
            table: 'incident',
            sys_id: incident1Id,
            data: {
              urgency: '1',
              work_notes: 'Updated via batch API'
            }
          },
          {
            operation: 'query',
            table: 'incident',
            query: `sys_id=${incident1Id}`,
            fields: ['urgency', 'work_notes']
          }
        ],
        parallel: false,
        transactional: false
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.totalOperations).toBe(3);
      expect(result.successfulOperations).toBe(3);
      expect(result.results).toHaveLength(3);
      
      // Verify the update worked
      const verifyResult = result.results.find(r => 
        r.operation === 'query' && r.query === `sys_id=${incident1Id}`
      );
      expect(verifyResult).toBeDefined();
      if (verifyResult && verifyResult.result && verifyResult.result.length > 0) {
        expect(verifyResult.result[0].urgency).toBe('1');
      }
    }, 60000);

    it('should optimize similar queries', async () => {
      const response = await (mcpServer as any).executeBatchApi({
        operations: [
          {
            operation: 'query',
            table: 'incident',
            query: 'state=1',
            fields: ['number', 'short_description'],
            limit: 5
          },
          {
            operation: 'query',
            table: 'incident',
            query: 'state=2',
            fields: ['number', 'short_description'],
            limit: 5
          },
          {
            operation: 'query',
            table: 'incident',
            query: 'state=3',
            fields: ['number', 'short_description'],
            limit: 5
          }
        ],
        parallel: true,
        optimize_queries: true,
        transactional: false
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.apiCallsSaved).toBeGreaterThanOrEqual(0);
    }, 30000);
  });

  describe('Feature 2: Table Relationship Mapping (snow_get_table_relationships)', () => {
    it('should discover table relationships with depth analysis', async () => {
      const response = await (mcpServer as any).getTableRelationships({
        table: 'incident',
        max_depth: 1,
        include_counts: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      expect(result.hierarchy).toBeDefined();
      expect(result.references).toBeDefined();
      expect(result.referenced_by).toBeDefined();
      
      // Incident extends from task
      expect(result.hierarchy.parent_tables).toBeDefined();
      expect(result.hierarchy.parent_tables.length).toBeGreaterThan(0);
      
      // Incident has reference fields
      expect(result.references.outgoing).toBeDefined();
      expect(result.references.field_count).toBeGreaterThan(0);
    }, 30000);

    it('should generate visualization for relationships', async () => {
      const response = await (mcpServer as any).getTableRelationships({
        table: 'task',
        max_depth: 1,
        visualize: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.visualization).toBeDefined();
      expect(result.visualization).toContain('graph TD');
      expect(result.visualization).toContain('task[task]');
    }, 30000);
  });

  describe('Feature 3: Query Performance Analyzer (snow_analyze_query)', () => {
    it('should analyze query performance and suggest optimizations', async () => {
      const response = await (mcpServer as any).analyzeQueryPerformance({
        query: 'state=1^priority<=2',
        table: 'incident',
        analyze_indexes: true,
        suggest_optimizations: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      expect(result.parsed_query).toBeDefined();
      expect(result.field_analysis).toBeDefined();
      expect(result.optimization_suggestions).toBeDefined();
      expect(Array.isArray(result.optimization_suggestions)).toBe(true);
      
      // Should analyze state and priority fields
      expect(result.field_analysis.state).toBeDefined();
      expect(result.field_analysis.priority).toBeDefined();
    }, 30000);

    it('should identify missing indexes', async () => {
      const response = await (mcpServer as any).analyzeQueryPerformance({
        query: 'sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()',
        table: 'incident',
        suggest_indexes: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.performance_score).toBeDefined();
      expect(result.index_recommendations).toBeDefined();
    }, 30000);
  });

  describe('Feature 4: Field Usage Intelligence (snow_analyze_field_usage)', () => {
    it('should analyze field usage patterns', async () => {
      const response = await (mcpServer as any).analyzeFieldUsage({
        table: 'incident',
        include_custom_fields: false,
        analyze_queries: true,
        analyze_views: false,
        analyze_reports: false,
        analyze_business_rules: false,
        analyze_ui_policies: false,
        analyze_workflows: false
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      expect(result.total_fields).toBeGreaterThan(0);
      expect(result.field_analysis).toBeDefined();
      expect(Array.isArray(result.field_analysis)).toBe(true);
      
      // Should have analysis for core fields
      const stateField = result.field_analysis.find(f => f.field_name === 'state');
      if (stateField) {
        expect(stateField.usage_areas).toBeDefined();
      }
    }, 60000);

    it('should identify optimization opportunities', async () => {
      const response = await (mcpServer as any).analyzeFieldUsage({
        table: 'incident',
        include_custom_fields: true,
        unused_threshold_days: 90,
        deprecation_analysis: true,
        analyze_queries: false,
        analyze_views: false,
        analyze_reports: false,
        analyze_business_rules: false,
        analyze_ui_policies: false,
        analyze_workflows: false
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.optimization_opportunities).toBeDefined();
    }, 60000);
  });

  describe('Feature 5: Migration Helper (snow_create_migration_plan)', () => {
    it('should create migration plan for field changes', async () => {
      const response = await (mcpServer as any).createMigrationPlan({
        migration_type: 'field_restructure',
        source_table: 'incident',
        target_table: 'incident',
        target_changes: {
          fields_to_add: [
            {
              name: `u_${testPrefix}test_field`,
              type: 'string',
              label: 'Test Field',
              max_length: 100
            }
          ],
          fields_to_modify: [],
          fields_to_remove: []
        },
        dry_run: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.migration_id).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.plan.phases).toBeDefined();
      expect(result.plan.total_steps).toBeGreaterThan(0);
      expect(result.risk_assessment).toBeDefined();
    }, 30000);
  });

  describe('Feature 6: Deep Table Analysis (snow_analyze_table_deep)', () => {
    it('should perform comprehensive table analysis', async () => {
      const response = await (mcpServer as any).analyzeTableDeep({
        table_name: 'incident',
        analysis_scope: ['structure', 'data_quality', 'performance'],
        include_sample_data: false,
        analyze_child_tables: false,
        generate_recommendations: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.table_name).toBe('incident');
      expect(result.analysis_results).toBeDefined();
      expect(result.analysis_results.structure).toBeDefined();
      expect(result.recommendations).toBeDefined();
    }, 60000);
  });

  describe('Feature 7: Code Pattern Detector (snow_detect_code_patterns)', () => {
    it('should detect patterns in business rules', async () => {
      const response = await (mcpServer as any).detectCodePatterns({
        analysis_scope: ['business_rules'],
        pattern_categories: ['performance', 'maintainability'],
        table_filter: 'incident',
        max_scripts: 10
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.total_scripts_analyzed).toBeGreaterThanOrEqual(0);
      expect(result.patterns_detected).toBeDefined();
    }, 60000);
  });

  describe('Feature 8: Predictive Impact Analysis (snow_predict_change_impact)', () => {
    it('should predict impact of field changes', async () => {
      const response = await (mcpServer as any).predictChangeImpact({
        change_type: 'field_change',
        target_object: 'incident',
        change_details: {
          action: 'update',
          field_changes: ['urgency'],
          new_values: {
            mandatory: true
          }
        },
        include_dependencies: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.impact_analysis).toBeDefined();
      expect(result.risk_score).toBeDefined();
      expect(result.affected_areas).toBeDefined();
    }, 30000);
  });

  describe('Feature 9: Auto Documentation Generator (snow_generate_documentation)', () => {
    it('should generate table documentation', async () => {
      const response = await (mcpServer as any).generateDocumentation({
        documentation_scope: ['tables'],
        target_objects: ['incident'],
        output_format: 'markdown',
        include_diagrams: false,
        include_code_analysis: false
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.documentation_id).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.sections.tables).toBeDefined();
    }, 30000);
  });

  describe('Feature 10: Intelligent Refactoring (snow_refactor_code)', () => {
    it('should analyze code for refactoring opportunities', async () => {
      const response = await (mcpServer as any).refactorCode({
        refactoring_scope: ['business_rules'],
        refactoring_goals: ['performance', 'readability'],
        target_objects: {
          tables: ['incident']
        },
        max_scripts_to_analyze: 5,
        generate_preview: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.refactoring_id).toBeDefined();
      expect(result.analysis_summary).toBeDefined();
    }, 60000);
  });

  describe('Feature 11: Process Mining Engine (snow_discover_process)', () => {
    it('should discover business processes', async () => {
      const response = await (mcpServer as any).discoverProcess({
        process_type: 'incident_resolution',
        analysis_period: '7d',
        min_frequency: 5,
        include_variants: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.process_id).toBeDefined();
      expect(result.main_flow).toBeDefined();
    }, 60000);
  });

  describe('Feature 12: Workflow Reality Analyzer (snow_analyze_workflow_execution)', () => {
    it('should analyze workflow execution patterns', async () => {
      const response = await (mcpServer as any).analyzeWorkflowExecution({
        workflow_type: 'incident',
        analysis_period: '24h',
        include_performance_metrics: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.workflow_analysis).toBeDefined();
    }, 60000);
  });

  describe('Feature 13: Cross Table Process Discovery (snow_discover_cross_table_process)', () => {
    it('should discover cross-table processes', async () => {
      const response = await (mcpServer as any).discoverCrossTableProcess({
        start_table: 'incident',
        end_tables: ['problem'],
        analysis_period: '30d',
        min_occurrences: 3
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.process_discovery_id).toBeDefined();
      expect(result.discovered_patterns).toBeDefined();
    }, 60000);
  });

  describe('Feature 14: Real Time Process Monitoring (snow_monitor_process)', () => {
    it('should setup process monitoring', async () => {
      const response = await (mcpServer as any).monitorProcess({
        process_name: 'incident_creation',
        tables_to_monitor: ['incident'],
        monitoring_duration: '1h',
        alert_conditions: [
          {
            metric: 'volume',
            threshold: 100,
            operator: 'greater_than'
          }
        ]
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result).toBeDefined();
      expect(result.monitor_id).toBeDefined();
      expect(result.monitoring_config).toBeDefined();
    }, 30000);
  });
});
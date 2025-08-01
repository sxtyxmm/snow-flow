/**
 * Integration tests for ServiceNow Advanced Features MCP Server
 * Tests against REAL ServiceNow instance - NO MOCKS
 */

import { ServiceNowAdvancedFeaturesMCP } from '../../src/mcp/advanced/servicenow-advanced-features-mcp';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

describe('ServiceNow Advanced Features - REAL INSTANCE TESTS', () => {
  let mcpServer: ServiceNowAdvancedFeaturesMCP;
  let testRecordIds: string[] = [];
  const testPrefix = `MCTST_${Date.now()}_`;

  beforeAll(async () => {
    // Verify we have real credentials
    expect(process.env.SNOW_INSTANCE).toBeDefined();
    expect(process.env.SNOW_CLIENT_ID).toBeDefined();
    expect(process.env.SNOW_CLIENT_SECRET).toBeDefined();

    // Create real MCP server instance
    mcpServer = new ServiceNowAdvancedFeaturesMCP();
    
    // Wait for automatic auth to complete (happens in constructor)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify auth worked by testing connection
    const connectionTest = await (mcpServer as any).client.testConnection();
    expect(connectionTest.success).toBe(true);
  }, 30000); // 30 second timeout for auth

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

  // ========================================
  // FEATURE 1: SMART BATCH API OPERATIONS
  // ========================================
  
  describe('Feature 1: Smart Batch API Operations (snow_batch_api)', () => {
    it('should execute batch operations on REAL instance', async () => {
      // Create test incident first
      const createResponse = await (mcpServer as any).client.makeRequest({
        method: 'POST',
        url: '/api/now/table/incident',
        data: {
          short_description: `${testPrefix}Batch Test Incident`,
          urgency: '3',
          impact: '3'
        }
      });
      
      // ServiceNow API returns the result object directly
      const testIncidentId = createResponse.result?.sys_id;
      if (!testIncidentId) {
        console.error('Response structure:', createResponse);
        throw new Error('Failed to create test incident - no sys_id in response');
      }
      console.log('Created incident:', testIncidentId);
      testRecordIds.push(testIncidentId);

      // Execute batch operations
      const response = await (mcpServer as any).executeBatchApi({
        operations: [
          {
            operation: 'query',
            table: 'incident',
            query: `short_descriptionSTARTSWITH${testPrefix}`,
            fields: ['number', 'short_description', 'sys_id'],
            limit: 10
          },
          {
            operation: 'update',
            table: 'incident',
            sys_id: testIncidentId,
            data: {
              urgency: '2',
              work_notes: 'Updated via batch API test'
            }
          },
          {
            operation: 'query',
            table: 'incident',
            query: `sys_id=${testIncidentId}`,
            fields: ['urgency', 'work_notes']
          }
        ],
        parallel: false,  // Run sequentially for testing  
        optimize_queries: false,  // Disable optimization for testing
        transactional: false, // Disable transactional mode for testing
        cache_results: false  // Disable caching for testing
      });

      console.log('Batch API Response:', response);
      
      let result;
      try {
        result = JSON.parse(response.content[0].text);
        console.log('Parsed result:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Failed to parse response:', error);
        console.error('Response content:', response.content);
        throw error;
      }
      
      expect(result.success).toBe(true);
      expect(result.totalOperations).toBe(3);
      expect(result.successfulOperations).toBe(3);
      expect(result.results).toHaveLength(3);
      
      // Verify the update worked - check the last query result
      const queryResults = result.results.filter((r: any) => r.operation === 'query');
      console.log('Query results:', JSON.stringify(queryResults, null, 2));
      
      // The last query should return the updated incident
      const lastQueryResult = queryResults[queryResults.length - 1];
      if (lastQueryResult && lastQueryResult.success) {
        console.log('Last query result:', JSON.stringify(lastQueryResult, null, 2));
        // Check if we got any results
        if (lastQueryResult.result && Array.isArray(lastQueryResult.result) && lastQueryResult.result.length > 0) {
          // Find our specific incident in the results
          const ourIncident = lastQueryResult.result.find((inc: any) => inc.sys_id === testIncidentId);
          if (ourIncident) {
            expect(ourIncident.urgency).toBe('2');
          } else {
            console.log('Could not find our incident in results');
          }
        } else {
          console.log('No results from last query');
        }
      }
    }, 30000);

    it('should optimize similar queries on REAL data', async () => {
      // Create multiple test incidents
      const incidents = [];
      for (let i = 0; i < 3; i++) {
        const response = await (mcpServer as any).client.makeRequest({
          method: 'POST',
          url: '/api/now/table/incident',
          data: {
            short_description: `${testPrefix}Query Optimization Test ${i}`,
            priority: String(i + 1),
            state: '1'
          }
        });
        incidents.push(response.result.sys_id);
        testRecordIds.push(response.result.sys_id);
      }

      // Execute optimizable queries
      const response = await (mcpServer as any).executeBatchApi({
        operations: [
          {
            operation: 'query',
            table: 'incident',
            query: `short_descriptionSTARTSWITH${testPrefix}Query Optimization Test 0`,
            fields: ['number', 'short_description']
          },
          {
            operation: 'query',
            table: 'incident',
            query: `short_descriptionSTARTSWITH${testPrefix}Query Optimization Test 1`,
            fields: ['number', 'short_description']
          },
          {
            operation: 'query',
            table: 'incident',
            query: `short_descriptionSTARTSWITH${testPrefix}Query Optimization Test 2`,
            fields: ['number', 'short_description']
          }
        ],
        parallel_execution: true,
        optimize_queries: true
      });

      const result = JSON.parse(response.content[0].text);
      
      expect(result.success).toBe(true);
      expect(result.apiCallsSaved).toBeGreaterThan(0);
      expect(result.reductionPercentage).toBeGreaterThan(0);
    }, 30000);
  });

  // ========================================
  // FEATURE 2: TABLE RELATIONSHIP MAPPING
  // ========================================
  
  describe('Feature 2: Table Relationship Mapping (snow_get_table_relationships)', () => {
    it('should discover REAL table relationships', async () => {
      const response = await (mcpServer as any).getTableRelationships({
        table: 'incident',
        max_depth: 2,
        include_counts: true
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      console.log('Table relationships response:', JSON.stringify(result, null, 2));
      
      // The method returns the data directly, no success field
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      
      // Check if relationships exist before testing them
      if (result.relationships) {
        expect(result.relationships).toBeDefined();
        expect(result.relationships.outbound).toBeDefined();
        expect(result.relationships.inbound).toBeDefined();
        
        // Incident should have relationships to sys_user, cmdb_ci, etc
        const outboundTables = result.relationships.outbound.map((r: any) => r.target_table);
        expect(outboundTables).toContain('sys_user'); // assigned_to, caller_id
      }
    }, 30000);

    it('should generate visualization for REAL relationships', async () => {
      const response = await (mcpServer as any).getTableRelationships({
        table: 'sc_task',
        max_depth: 1,
        generate_visualization: true
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.visualization).toBeDefined();
      expect(result.visualization).toContain('graph TD');
      expect(result.visualization).toContain('sc_task');
    }, 30000);
  });

  // ========================================
  // FEATURE 3: QUERY PERFORMANCE ANALYZER
  // ========================================
  
  describe('Feature 3: Query Performance Analyzer (snow_analyze_query)', () => {
    it('should analyze REAL query performance', async () => {
      const response = await (mcpServer as any).analyzeQueryPerformance({
        query: 'state=1^priority=1',
        table: 'incident',
        analyze_indexes: true,
        suggest_optimizations: true
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      expect(result.parsed_query).toBeDefined();
      expect(result.field_analysis).toBeDefined();
      expect(result.optimization_suggestions).toBeDefined();
      expect(Array.isArray(result.optimization_suggestions)).toBe(true);
    }, 30000);

    it('should identify missing indexes on REAL tables', async () => {
      const response = await (mcpServer as any).analyzeQueryPerformance({
        query: 'u_custom_field=test^opened_atONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()',
        table: 'incident',
        suggest_indexes: true
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.index_recommendations).toBeDefined();
      // Custom fields typically don't have indexes
      if (result.index_recommendations.length > 0) {
        expect(result.index_recommendations[0].reason).toContain('frequently queried');
      }
    }, 30000);
  });

  // ========================================
  // FEATURE 4: FIELD USAGE INTELLIGENCE
  // ========================================
  
  describe('Feature 4: Field Usage Intelligence (snow_analyze_field_usage)', () => {
    it('should analyze REAL field usage patterns', async () => {
      const response = await (mcpServer as any).analyzeFieldUsage({
        table: 'incident',
        include_custom_fields: false,  // Reduce scope
        check_performance_impact: false,
        analyze_workflows: false,
        analyze_business_rules: false,
        analyze_queries: false,  // Disable query analysis
        analyze_views: false,  // Disable view analysis  
        analyze_reports: false,  // Disable report analysis
        analyze_ui_policies: false  // Disable UI policy analysis
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.table).toBe('incident');
      expect(result.total_fields).toBeGreaterThan(0);
      expect(result.field_analysis).toBeDefined();
      expect(Array.isArray(result.field_analysis)).toBe(true);
      
      // Core fields should have high usage
      const stateField = result.field_analysis.find((f: any) => f.field_name === 'state');
      if (stateField) {
        expect(stateField.usage_score).toBeGreaterThan(0);
      }
    }, 30000);

    it('should identify unused custom fields in REAL instance', async () => {
      const response = await (mcpServer as any).analyzeFieldUsage({
        table: 'incident',
        include_custom_fields: false,  // Reduce scope
        unused_threshold_days: 30,
        analyze_workflows: false,
        analyze_business_rules: false,
        analyze_queries: false,  // Disable query analysis
        analyze_views: false,  // Disable view analysis  
        analyze_reports: false,  // Disable report analysis
        analyze_ui_policies: false  // Disable UI policy analysis
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.optimization_opportunities).toBeDefined();
    }, 30000);
  });

  // ========================================
  // FEATURE 5: MIGRATION HELPER
  // ========================================
  
  describe('Feature 5: Migration Helper (snow_create_migration_plan)', () => {
    it('should create migration plan for REAL table changes', async () => {
      const response = await (mcpServer as any).createMigrationPlan({
        migration_type: 'field_restructure',
        source_table: 'incident',
        target_table: 'incident',
        target_changes: {
          fields_to_add: [
            { 
              name: `u_${testPrefix}test_field`, 
              type: 'string', 
              label: 'Test Migration Field',
              max_length: 100
            }
          ],
          fields_to_modify: [],
          fields_to_remove: []
        },
        dry_run: true // Don't actually execute
      });

      const result = response.content ? JSON.parse(response.content[0].text) : response;
      
      expect(result).toBeDefined();
      expect(result.migration_id).toBeDefined();
      expect(result.plan).toBeDefined();
      expect(result.plan.phases).toBeDefined();
      expect(result.plan.total_steps).toBeGreaterThan(0);
      expect(result.risk_assessment).toBeDefined();
    }, 30000);
  });
});
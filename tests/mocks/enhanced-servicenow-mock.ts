#!/usr/bin/env node
/**
 * Enhanced ServiceNow Mock Client
 * Provides realistic mock responses for ServiceNow Advanced Features MCP Server tests
 * Uses the test data generator for consistent and comprehensive test data
 */

import { testDataGenerator } from './servicenow-test-data-generator.js';

export class EnhancedServiceNowMock {
  private static instance: EnhancedServiceNowMock;
  private responseLatency: number = 100; // Default 100ms latency
  private errorRate: number = 0.05; // 5% error rate
  private serviceHealth: 'healthy' | 'degraded' | 'unavailable' = 'healthy';

  private constructor() {}

  public static getInstance(): EnhancedServiceNowMock {
    if (!EnhancedServiceNowMock.instance) {
      EnhancedServiceNowMock.instance = new EnhancedServiceNowMock();
    }
    return EnhancedServiceNowMock.instance;
  }

  // ========================================
  // CONFIGURATION METHODS
  // ========================================

  setResponseLatency(latency: number): void {
    this.responseLatency = latency;
  }

  setErrorRate(rate: number): void {
    this.errorRate = Math.max(0, Math.min(1, rate));
  }

  setServiceHealth(health: 'healthy' | 'degraded' | 'unavailable'): void {
    this.serviceHealth = health;
  }

  // ========================================
  // CORE MOCK RESPONSE GENERATOR
  // ========================================

  async mockRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    // Simulate network latency
    await this.simulateLatency();

    // Check service health
    if (this.serviceHealth === 'unavailable') {
      throw new Error('ServiceNow instance is unavailable');
    }

    // Simulate random errors based on error rate
    if (Math.random() < this.errorRate) {
      throw new Error('Simulated ServiceNow API error');
    }

    // Route to appropriate mock handler
    return this.routeRequest(endpoint, method, data);
  }

  private async routeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    // Parse endpoint to determine response type
    const endpointLower = endpoint.toLowerCase();

    // Table API endpoints
    if (endpointLower.includes('/api/now/table/')) {
      return this.handleTableAPI(endpoint, method, data);
    }

    // Stats API endpoints
    if (endpointLower.includes('/api/now/stats/')) {
      return this.handleStatsAPI(endpoint, method, data);
    }

    // Workflow API endpoints
    if (endpointLower.includes('/api/sn_fd/workflow/')) {
      return this.handleWorkflowAPI(endpoint, method, data);
    }

    // Process mining endpoints
    if (endpointLower.includes('/process') || endpointLower.includes('/mining')) {
      return this.handleProcessAPI(endpoint, method, data);
    }

    // Batch API endpoints
    if (endpointLower.includes('/batch')) {
      return this.handleBatchAPI(endpoint, method, data);
    }

    // Default response
    return this.createSuccessResponse({ message: 'Mock endpoint response' });
  }

  // ========================================
  // TABLE API MOCK HANDLERS
  // ========================================

  private handleTableAPI(endpoint: string, method: string, data?: any): any {
    const tableMatch = endpoint.match(/\/table\/([^\/\?]+)/);
    const tableName = tableMatch ? tableMatch[1] : 'unknown';

    switch (method.toUpperCase()) {
      case 'GET':
        return this.handleTableQuery(tableName, this.parseQueryParams(endpoint));
      case 'POST':
        return this.handleTableInsert(tableName, data);
      case 'PUT':
      case 'PATCH':
        return this.handleTableUpdate(tableName, data);
      case 'DELETE':
        return this.handleTableDelete(tableName);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  private handleTableQuery(tableName: string, params: any): any {
    const limit = parseInt(params.sysparm_limit) || 10;
    let results: any[] = [];

    // Generate appropriate test data based on table name
    switch (tableName) {
      case 'incident':
        results = testDataGenerator.generateIncidentData(limit);
        break;
      case 'sys_user':
        results = testDataGenerator.generateUserData(limit);
        break;
      default:
        // Generate generic records
        results = Array(limit).fill(0).map((_, i) => ({
          sys_id: `${tableName}_${i.toString().padStart(6, '0')}`,
          number: `${tableName.toUpperCase()}${(100000 + i).toString()}`,
          short_description: `Test ${tableName} record ${i + 1}`
        }));
    }

    // Apply query filters if present
    if (params.sysparm_query) {
      results = this.applyQueryFilters(results, params.sysparm_query);
    }

    return this.createSuccessResponse(results);
  }

  private handleTableInsert(tableName: string, data: any): any {
    const newRecord = {
      sys_id: `${tableName}_${Date.now()}`,
      ...data,
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString()
    };

    return this.createSuccessResponse(newRecord);
  }

  private handleTableUpdate(tableName: string, data: any): any {
    const updatedRecord = {
      sys_id: data.sys_id || `${tableName}_existing`,
      ...data,
      sys_updated_on: new Date().toISOString()
    };

    return this.createSuccessResponse(updatedRecord);
  }

  private handleTableDelete(tableName: string): any {
    return this.createSuccessResponse({ deleted: true });
  }

  // ========================================
  // STATS API MOCK HANDLERS
  // ========================================

  private handleStatsAPI(endpoint: string, method: string, data?: any): any {
    const tableMatch = endpoint.match(/\/stats\/([^\/\?]+)/);
    const tableName = tableMatch ? tableMatch[1] : 'unknown';

    return this.createSuccessResponse({
      stats: {
        count: this.getRandomNumber(1000, 50000),
        avg: this.getRandomNumber(1, 100),
        sum: this.getRandomNumber(10000, 500000),
        min: this.getRandomNumber(1, 10),
        max: this.getRandomNumber(90, 100)
      }
    });
  }

  // ========================================
  // WORKFLOW API MOCK HANDLERS
  // ========================================

  private handleWorkflowAPI(endpoint: string, method: string, data?: any): any {
    if (endpoint.includes('/execute')) {
      return this.createSuccessResponse({
        execution_id: `exec_${Date.now()}`,
        status: 'running',
        started_at: new Date().toISOString()
      });
    }

    if (endpoint.includes('/definition')) {
      return this.createSuccessResponse(
        testDataGenerator.generateWorkflowData('test_workflow')
      );
    }

    return this.createSuccessResponse({ workflow: 'mock_workflow' });
  }

  // ========================================
  // PROCESS API MOCK HANDLERS
  // ========================================

  private handleProcessAPI(endpoint: string, method: string, data?: any): any {
    if (endpoint.includes('/discover')) {
      const tableName = this.extractTableFromEndpoint(endpoint) || 'incident';
      return this.createSuccessResponse(
        testDataGenerator.generateProcessData(tableName, 20)
      );
    }

    if (endpoint.includes('/monitor')) {
      return this.createSuccessResponse(
        testDataGenerator.generateMonitoringData()
      );
    }

    if (endpoint.includes('/analyze')) {
      return this.createSuccessResponse({
        analysis: 'process_analysis_complete',
        patterns_found: this.getRandomNumber(5, 15),
        optimization_opportunities: this.getRandomNumber(2, 8)
      });
    }

    return this.createSuccessResponse({ process: 'mock_process' });
  }

  // ========================================
  // BATCH API MOCK HANDLERS
  // ========================================

  private handleBatchAPI(endpoint: string, method: string, data?: any): any {
    if (!data || !data.operations) {
      throw new Error('Batch operations data required');
    }

    const operations = data.operations;
    const results = testDataGenerator.generateBatchApiResults(operations);

    // Simulate longer processing time for batch operations
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.createSuccessResponse(results));
      }, this.responseLatency * operations.length);
    });
  }

  // ========================================
  // SPECIALIZED MOCK HANDLERS
  // ========================================

  generateTableRelationshipData(tableName: string): any {
    return testDataGenerator.generateTableRelationships(tableName);
  }

  generateQueryPerformanceData(query: string, tableName: string): any {
    return testDataGenerator.generateQueryPerformanceData(query);
  }

  generateFieldUsageData(tableName: string): any {
    return testDataGenerator.generateFieldUsageData(tableName);
  }

  generateDeepTableAnalysis(tableName: string): any {
    return {
      success: true,
      table_name: tableName,
      data_profile: {
        record_count: this.getRandomNumber(10000, 100000),
        storage_size_mb: this.getRandomNumber(50, 500),
        avg_record_size: this.getRandomNumber(1000, 5000)
      },
      field_statistics: testDataGenerator.generateFieldUsageData(tableName).field_statistics,
      data_quality: {
        overall_score: this.getRandomNumber(80, 95),
        completeness_score: this.getRandomNumber(85, 100),
        consistency_score: this.getRandomNumber(75, 95),
        validity_score: this.getRandomNumber(90, 100)
      },
      performance_analysis: {
        query_performance: this.getRandomChoice(['excellent', 'good', 'fair', 'poor']),
        index_effectiveness: this.getRandomNumber(70, 95),
        optimization_potential: this.getRandomNumber(10, 40)
      },
      optimization_recommendations: this.generateOptimizationRecommendations()
    };
  }

  generateCodePatternData(scope: string): any {
    return {
      success: true,
      analysis_summary: {
        total_scripts: this.getRandomNumber(100, 500),
        patterns_detected: this.getRandomNumber(20, 80),
        anti_patterns_found: this.getRandomNumber(5, 25)
      },
      pattern_detection: {
        common_patterns: this.generateCommonPatterns(),
        custom_patterns: this.generateCustomPatterns()
      },
      anti_patterns: this.generateAntiPatterns(),
      complexity_metrics: {
        avg_complexity: this.getRandomNumber(3, 8),
        high_complexity_scripts: this.getRandomNumber(5, 20),
        maintainability_index: this.getRandomNumber(60, 90)
      },
      refactoring_opportunities: this.generateRefactoringOpportunities(),
      security_analysis: this.generateSecurityAnalysis()
    };
  }

  generateChangeImpactData(changeType: string): any {
    return {
      success: true,
      impact_analysis: {
        affected_components: this.getRandomNumber(5, 25),
        estimated_effort_hours: this.getRandomNumber(8, 80),
        complexity_score: this.getRandomNumber(1, 10)
      },
      risk_assessment: {
        overall_risk_score: this.getRandomNumber(1, 10),
        risk_factors: this.generateRiskFactors(),
        mitigation_strategies: this.generateMitigationStrategies()
      },
      dependency_analysis: {
        direct_dependencies: this.getRandomNumber(3, 15),
        indirect_dependencies: this.getRandomNumber(5, 30),
        circular_dependencies: this.getRandomNumber(0, 3)
      },
      testing_recommendations: this.generateTestingRecommendations(),
      rollback_complexity: this.getRandomChoice(['low', 'medium', 'high'])
    };
  }

  generateDocumentationData(scope: string): any {
    return {
      success: true,
      documentation: {
        overview: 'Comprehensive system documentation generated automatically',
        data_model: this.generateDataModelDocs(),
        business_processes: this.generateProcessDocs(),
        api_documentation: this.generateAPIDocs()
      },
      generated_files: [
        { name: 'system_overview.md', size: this.getRandomNumber(5000, 20000) },
        { name: 'data_model.md', size: this.getRandomNumber(10000, 50000) },
        { name: 'api_reference.md', size: this.getRandomNumber(8000, 30000) }
      ],
      generation_metrics: {
        total_sections: this.getRandomNumber(20, 100),
        total_words: this.getRandomNumber(5000, 25000),
        diagrams_generated: this.getRandomNumber(5, 20)
      }
    };
  }

  generateRefactoringData(artifactType: string): any {
    return {
      success: true,
      analysis: {
        complexity_score: this.getRandomNumber(60, 95),
        maintainability_index: this.getRandomNumber(40, 80),
        code_smells: this.getRandomNumber(3, 12)
      },
      refactoring_suggestions: this.generateRefactoringSuggestions(),
      refactored_code: this.generateRefactoredCode(),
      improvement_metrics: {
        complexity_reduction: this.getRandomNumber(20, 60),
        maintainability_improvement: this.getRandomNumber(15, 40),
        performance_gain: this.getRandomNumber(10, 30)
      },
      test_cases: this.generateTestCases(),
      validation_results: {
        functionality_preserved: true,
        performance_improved: true,
        all_tests_passed: true
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private async simulateLatency(): Promise<void> {
    if (this.serviceHealth === 'degraded') {
      // Simulate slower response times for degraded service
      const degradedLatency = this.responseLatency * (2 + Math.random());
      await new Promise(resolve => setTimeout(resolve, degradedLatency));
    } else {
      await new Promise(resolve => setTimeout(resolve, this.responseLatency));
    }
  }

  private createSuccessResponse(data: any): any {
    return {
      success: true,
      result: data,
      response_time: this.responseLatency,
      timestamp: new Date().toISOString()
    };
  }

  private parseQueryParams(url: string): any {
    const params: any = {};
    const urlParts = url.split('?');
    if (urlParts.length > 1) {
      const queryString = urlParts[1];
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    }
    return params;
  }

  private applyQueryFilters(results: any[], query: string): any[] {
    // Simple mock filtering - in real implementation would parse ServiceNow encoded query
    if (query.includes('state=1')) {
      return results.filter(r => r.state === '1');
    }
    if (query.includes('priority=1')) {
      return results.filter(r => r.priority === '1');
    }
    // Return all results if no recognized filters
    return results;
  }

  private extractTableFromEndpoint(endpoint: string): string | null {
    const match = endpoint.match(/table[\/=]([^\/\?&]+)/);
    return match ? match[1] : null;
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // ========================================
  // DATA GENERATION HELPERS
  // ========================================

  private generateOptimizationRecommendations(): string[] {
    return [
      'Add composite index on frequently queried fields',
      'Consider table partitioning for large datasets',
      'Review and optimize business rules for performance',
      'Implement data archiving strategy for old records'
    ];
  }

  private generateCommonPatterns(): any[] {
    return [
      { pattern: 'gliderecord_query', frequency: 45, description: 'Standard GlideRecord query pattern' },
      { pattern: 'priority_calculation', frequency: 12, description: 'Priority calculation logic' },
      { pattern: 'user_assignment', frequency: 18, description: 'User assignment logic' }
    ];
  }

  private generateCustomPatterns(): any[] {
    return [
      { pattern: 'custom_validation', frequency: 8, description: 'Custom field validation pattern' },
      { pattern: 'integration_call', frequency: 5, description: 'External system integration pattern' }
    ];
  }

  private generateAntiPatterns(): any[] {
    return [
      { pattern: 'long_method', severity: 'medium', instances: 8 },
      { pattern: 'deep_nesting', severity: 'high', instances: 3 },
      { pattern: 'duplicated_code', severity: 'low', instances: 12 }
    ];
  }

  private generateRefactoringOpportunities(): any[] {
    return [
      { opportunity: 'Extract common functions to Script Include', impact: 'high', effort: 'medium' },
      { opportunity: 'Simplify complex conditional logic', impact: 'medium', effort: 'low' },
      { opportunity: 'Optimize database queries', impact: 'high', effort: 'high' }
    ];
  }

  private generateSecurityAnalysis(): any {
    return {
      vulnerabilities: [
        { type: 'input_validation', severity: 'medium', count: 2 },
        { type: 'sql_injection_risk', severity: 'high', count: 1 }
      ],
      security_score: this.getRandomNumber(70, 90),
      recommendations: [
        'Implement input validation for user data',
        'Use parameterized queries to prevent SQL injection'
      ]
    };
  }

  private generateRiskFactors(): string[] {
    return [
      'High system integration complexity',
      'Multiple dependent components',
      'Limited rollback options',
      'Peak usage time deployment'
    ];
  }

  private generateMitigationStrategies(): string[] {
    return [
      'Implement phased rollout approach',
      'Prepare comprehensive rollback plan',
      'Schedule deployment during maintenance window',
      'Conduct thorough testing in staging environment'
    ];
  }

  private generateTestingRecommendations(): any[] {
    return [
      { test_type: 'unit_tests', priority: 'high', estimated_effort: '8 hours' },
      { test_type: 'integration_tests', priority: 'high', estimated_effort: '12 hours' },
      { test_type: 'performance_tests', priority: 'medium', estimated_effort: '6 hours' },
      { test_type: 'user_acceptance_tests', priority: 'medium', estimated_effort: '16 hours' }
    ];
  }

  private generateDataModelDocs(): any {
    return {
      tables_documented: this.getRandomNumber(10, 50),
      relationships_mapped: this.getRandomNumber(20, 100),
      field_descriptions: this.getRandomNumber(100, 500)
    };
  }

  private generateProcessDocs(): any {
    return {
      processes_documented: this.getRandomNumber(5, 20),
      workflows_analyzed: this.getRandomNumber(8, 30),
      business_rules_cataloged: this.getRandomNumber(25, 100)
    };
  }

  private generateAPIDocs(): any {
    return {
      endpoints_documented: this.getRandomNumber(15, 60),
      examples_generated: this.getRandomNumber(30, 120),
      schemas_defined: this.getRandomNumber(20, 80)
    };
  }

  private generateRefactoringSuggestions(): any[] {
    return [
      { suggestion: 'Extract method for complex calculation', impact: 'high', effort: 'low' },
      { suggestion: 'Replace conditional with polymorphism', impact: 'medium', effort: 'medium' },
      { suggestion: 'Eliminate duplicated code blocks', impact: 'medium', effort: 'low' }
    ];
  }

  private generateRefactoredCode(): string {
    return `
// Refactored code example
function calculatePriority(urgency, impact) {
  const priorityMatrix = {
    '1,1': '1', '1,2': '2', '1,3': '3',
    '2,1': '2', '2,2': '3', '2,3': '4',
    '3,1': '3', '3,2': '4', '3,3': '5'
  };
  return priorityMatrix[urgency + ',' + impact] || '5';
}
    `.trim();
  }

  private generateTestCases(): any[] {
    return [
      { test_name: 'Priority calculation test', input: { urgency: '1', impact: '1' }, expected: '1' },
      { test_name: 'Default priority test', input: { urgency: 'invalid', impact: '2' }, expected: '5' }
    ];
  }
}

// Export singleton instance  
export const enhancedMock = EnhancedServiceNowMock.getInstance();
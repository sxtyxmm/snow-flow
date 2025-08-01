#!/usr/bin/env node
/**
 * ServiceNow Test Data Generator
 * Generates realistic test data for all Advanced Features MCP Server tests
 */

export class ServiceNowTestDataGenerator {
  private static instance: ServiceNowTestDataGenerator;
  private baseTimestamp: number;

  private constructor() {
    this.baseTimestamp = Date.now();
  }

  public static getInstance(): ServiceNowTestDataGenerator {
    if (!ServiceNowTestDataGenerator.instance) {
      ServiceNowTestDataGenerator.instance = new ServiceNowTestDataGenerator();
    }
    return ServiceNowTestDataGenerator.instance;
  }

  // ========================================
  // CORE DATA STRUCTURES
  // ========================================

  generateIncidentData(count: number = 10): any[] {
    return Array(count).fill(0).map((_, i) => ({
      sys_id: `incident_${i.toString().padStart(6, '0')}`,
      number: `INC${(1000000 + i).toString()}`,
      short_description: `Test incident ${i + 1}: ${this.getRandomIncidentDescription()}`,
      description: `Detailed description for incident ${i + 1}. ${this.getRandomLongDescription()}`,
      state: this.getRandomChoice(['1', '2', '3', '6', '7']),
      priority: this.getRandomChoice(['1', '2', '3', '4', '5']),
      urgency: this.getRandomChoice(['1', '2', '3']),
      impact: this.getRandomChoice(['1', '2', '3']),
      category: this.getRandomChoice(['hardware', 'software', 'network', 'database']),
      subcategory: this.getRandomChoice(['server', 'desktop', 'application', 'email']),
      assigned_to: `user_${this.getRandomChoice(['john_doe', 'jane_smith', 'bob_wilson', 'alice_brown'])}`,
      caller_id: `user_caller_${i % 5}`,
      company: `company_${this.getRandomChoice(['acme', 'globex', 'initech', 'hooli'])}`,
      location: `location_${this.getRandomChoice(['ny', 'ca', 'tx', 'fl'])}`,
      opened_at: new Date(this.baseTimestamp - (i * 3600000)).toISOString(), // Hours apart
      updated_at: new Date(this.baseTimestamp - (i * 1800000)).toISOString(), // 30 min apart
      sys_created_on: new Date(this.baseTimestamp - (i * 3600000)).toISOString(),
      sys_updated_on: new Date(this.baseTimestamp - (i * 1800000)).toISOString(),
      work_notes: `Work note ${i + 1}: ${this.getRandomWorkNote()}`,
      close_notes: i % 3 === 0 ? `Resolved: ${this.getRandomResolution()}` : '',
      resolved_at: i % 3 === 0 ? new Date(this.baseTimestamp - (i * 900000)).toISOString() : null,
      closed_at: i % 4 === 0 ? new Date(this.baseTimestamp - (i * 600000)).toISOString() : null
    }));
  }

  generateUserData(count: number = 20): any[] {
    return Array(count).fill(0).map((_, i) => ({
      sys_id: `user_${i.toString().padStart(6, '0')}`,
      user_name: `user${i}@company.com`,
      first_name: this.getRandomFirstName(),
      last_name: this.getRandomLastName(),
      email: `user${i}@company.com`,
      department: this.getRandomChoice(['IT', 'HR', 'Finance', 'Operations', 'Sales']),
      title: this.getRandomChoice(['Analyst', 'Manager', 'Director', 'Specialist', 'Coordinator']),
      location: `location_${this.getRandomChoice(['ny', 'ca', 'tx', 'fl'])}`,
      company: `company_${this.getRandomChoice(['acme', 'globex', 'initech', 'hooli'])}`,
      active: this.getRandomBoolean(0.9), // 90% active
      sys_created_on: new Date(this.baseTimestamp - (i * 86400000)).toISOString(), // Days apart
      last_login_time: new Date(this.baseTimestamp - (i * 3600000)).toISOString()
    }));
  }

  generateTableSchema(tableName: string): any {
    const baseFields = [
      { name: 'sys_id', type: 'guid', label: 'Sys ID', mandatory: true },
      { name: 'sys_created_on', type: 'glide_date_time', label: 'Created', mandatory: true },
      { name: 'sys_created_by', type: 'reference', reference_table: 'sys_user', label: 'Created by' },
      { name: 'sys_updated_on', type: 'glide_date_time', label: 'Updated', mandatory: true },
      { name: 'sys_updated_by', type: 'reference', reference_table: 'sys_user', label: 'Updated by' }
    ];

    const tableSpecificFields: Record<string, any[]> = {
      incident: [
        { name: 'number', type: 'string', label: 'Number', mandatory: true },
        { name: 'short_description', type: 'string', label: 'Short description', mandatory: true },
        { name: 'description', type: 'html', label: 'Description' },
        { name: 'state', type: 'integer', label: 'State', choices: ['1','2','3','6','7'] },
        { name: 'priority', type: 'integer', label: 'Priority', choices: ['1','2','3','4','5'] },
        { name: 'urgency', type: 'integer', label: 'Urgency', choices: ['1','2','3'] },
        { name: 'impact', type: 'integer', label: 'Impact', choices: ['1','2','3'] },
        { name: 'assigned_to', type: 'reference', reference_table: 'sys_user', label: 'Assigned to' },
        { name: 'caller_id', type: 'reference', reference_table: 'sys_user', label: 'Caller' },
        { name: 'company', type: 'reference', reference_table: 'core_company', label: 'Company' }
      ],
      sys_user: [
        { name: 'user_name', type: 'string', label: 'User ID', mandatory: true },
        { name: 'first_name', type: 'string', label: 'First name' },
        { name: 'last_name', type: 'string', label: 'Last name' },
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'department', type: 'reference', reference_table: 'cmn_department', label: 'Department' },
        { name: 'manager', type: 'reference', reference_table: 'sys_user', label: 'Manager' }
      ]
    };

    return {
      name: tableName,
      label: this.toDisplayName(tableName),
      sys_id: `table_${tableName}_id`,
      fields: [...baseFields, ...(tableSpecificFields[tableName] || [])]
    };
  }

  // ========================================
  // BATCH API TEST DATA
  // ========================================

  generateBatchOperations(count: number = 5): any[] {
    const operations = ['query', 'insert', 'update', 'delete'];
    const tables = ['incident', 'sys_user', 'change_request', 'problem'];

    return Array(count).fill(0).map((_, i) => {
      const operation = operations[i % operations.length];
      const table = tables[i % tables.length];

      const base = {
        operation,
        table,
        execution_order: i + 1
      };

      switch (operation) {
        case 'query':
          return {
            ...base,
            query: this.generateEncodedQuery(table),
            fields: this.getTableFields(table).slice(0, 5),
            limit: this.getRandomNumber(10, 100)
          };
        case 'insert':
          return {
            ...base,
            data: this.generateRecordData(table)
          };
        case 'update':
          return {
            ...base,
            sys_id: `${table}_${i.toString().padStart(6, '0')}`,
            data: this.generatePartialRecordData(table)
          };
        case 'delete':
          return {
            ...base,
            sys_id: `${table}_${i.toString().padStart(6, '0')}`
          };
        default:
          return base;
      }
    });
  }

  generateBatchApiResults(operations: any[]): any {
    return {
      success: true,
      totalOperations: operations.length,
      successfulOperations: operations.length - Math.floor(operations.length * 0.1), // 90% success
      failedOperations: Math.floor(operations.length * 0.1),
      totalExecutionTime: this.getRandomNumber(500, 2000),
      results: operations.map((op, i) => ({
        operation: op.operation,
        table: op.table,
        success: i < operations.length - Math.floor(operations.length * 0.1),
        result: op.operation === 'query' ? this.generateQueryResult(op.table) : { sys_id: `result_${i}` },
        error: i >= operations.length - Math.floor(operations.length * 0.1) ? 'Simulated error' : undefined,
        executionTime: this.getRandomNumber(50, 300)
      })),
      apiCallsSaved: Math.floor(operations.length * 0.8),
      reductionPercentage: 80
    };
  }

  // ========================================
  // RELATIONSHIP ANALYSIS TEST DATA
  // ========================================

  generateTableRelationships(tableName: string): any {
    const relationships = {
      incident: {
        outbound: [
          { target_table: 'sys_user', field: 'assigned_to', type: 'reference', cardinality: 'many_to_one' },
          { target_table: 'sys_user', field: 'caller_id', type: 'reference', cardinality: 'many_to_one' },
          { target_table: 'core_company', field: 'company', type: 'reference', cardinality: 'many_to_one' }
        ],
        inbound: [
          { source_table: 'incident_task', field: 'incident', type: 'reference', cardinality: 'one_to_many' },
          { source_table: 'incident_metric', field: 'incident', type: 'reference', cardinality: 'one_to_many' }
        ]
      }
    };

    return {
      success: true,
      table_name: tableName,
      relationships: relationships[tableName as keyof typeof relationships] || { outbound: [], inbound: [] },
      relationship_strength: this.generateRelationshipStrength(),
      cardinality_analysis: this.generateCardinalityAnalysis(),
      performance_impact: this.generatePerformanceImpact(),
      optimization_suggestions: this.generateOptimizationSuggestions()
    };
  }

  // ========================================
  // QUERY PERFORMANCE TEST DATA
  // ========================================

  generateQueryPerformanceData(query: string): any {
    const complexity = this.calculateQueryComplexity(query);
    
    return {
      success: true,
      query,
      performance_metrics: {
        execution_time: this.getRandomNumber(100, 5000),
        rows_examined: this.getRandomNumber(1000, 100000),
        rows_returned: this.getRandomNumber(1, 1000),
        index_usage: complexity > 3 ? [] : ['primary_idx', 'state_idx'],
        cost_estimate: this.getRandomNumber(1, 100),
        memory_usage: this.getRandomNumber(1, 50) * 1024 * 1024 // MB to bytes
      },
      index_analysis: this.generateIndexAnalysis(query),
      optimization_suggestions: this.generateQueryOptimizations(complexity),
      performance_rating: complexity > 5 ? 'poor' : complexity > 3 ? 'fair' : 'good'
    };
  }

  // ========================================
  // FIELD USAGE TEST DATA
  // ========================================

  generateFieldUsageData(tableName: string): any {
    const fields = this.getTableFields(tableName);
    
    return {
      success: true,
      table: tableName,
      field_statistics: fields.map((field, i) => ({
        field: field,
        usage_count: this.getRandomNumber(0, 50000),
        fill_rate: this.getRandomNumber(0, 100),
        avg_length: field.includes('description') ? this.getRandomNumber(50, 500) : this.getRandomNumber(1, 50),
        last_updated: new Date(this.baseTimestamp - (i * 86400000)).toISOString()
      })),
      business_logic_usage: this.generateBusinessLogicUsage(fields),
      usage_recommendations: this.generateUsageRecommendations(),
      cleanup_candidates: this.generateCleanupCandidates(fields)
    };
  }

  // ========================================
  // PROCESS MINING TEST DATA
  // ========================================

  generateProcessData(tableName: string, caseCount: number = 10): any {
    const activities = this.getProcessActivities(tableName);
    
    const processInstances = Array(caseCount).fill(0).map((_, i) => ({
      case_id: `${tableName.toUpperCase()}${(100000 + i).toString()}`,
      activities: this.generateActivitySequence(activities, i)
    }));

    return {
      success: true,
      process_overview: {
        total_cases: caseCount,
        unique_activities: activities.length,
        avg_case_duration: this.getRandomNumber(3600, 86400), // 1-24 hours
        process_complexity: this.getRandomNumber(1, 10)
      },
      process_instances: processInstances,
      process_variants: this.generateProcessVariants(activities),
      bottleneck_analysis: this.generateBottleneckAnalysis(activities),
      performance_metrics: this.generateProcessPerformanceMetrics(),
      process_map: this.generateProcessMap(activities)
    };
  }

  // ========================================
  // WORKFLOW ANALYSIS TEST DATA
  // ========================================

  generateWorkflowData(workflowName: string): any {
    return {
      success: true,
      workflow_name: workflowName,
      workflow_definition: this.generateWorkflowDefinition(workflowName),
      execution_history: this.generateWorkflowExecutions(workflowName),
      performance_metrics: {
        avg_execution_time: this.getRandomNumber(1800, 14400), // 30min - 4h
        success_rate: this.getRandomNumber(70, 95) / 100,
        stuck_executions: this.getRandomNumber(5, 25) / 100,
        timeout_rate: this.getRandomNumber(1, 10) / 100
      },
      bottleneck_analysis: this.generateWorkflowBottlenecks(),
      improvement_suggestions: this.generateWorkflowImprovements()
    };
  }

  // ========================================
  // MONITORING TEST DATA
  // ========================================

  generateMonitoringData(): any {
    return {
      success: true,
      monitoring_summary: {
        active_processes: this.getRandomNumber(10, 100),
        processes_at_risk: this.getRandomNumber(1, 10),
        sla_breaches: this.getRandomNumber(0, 5),
        avg_resolution_time: this.getRandomNumber(3600, 14400)
      },
      active_processes: this.generateActiveProcesses(),
      performance_metrics: this.generateRealtimeMetrics(),
      alert_conditions: this.generateAlertConditions(),
      real_time_dashboard: this.generateDashboardData()
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private getRandomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  private getRandomIncidentDescription(): string {
    const issues = ['Server down', 'Application error', 'Network connectivity', 'Database slow', 'Login issues'];
    const systems = ['Production', 'Development', 'Testing', 'Staging'];
    return `${this.getRandomChoice(issues)} in ${this.getRandomChoice(systems)} environment`;
  }

  private getRandomLongDescription(): string {
    return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
  }

  private getRandomWorkNote(): string {
    const actions = ['Investigated', 'Contacted user', 'Escalated to', 'Resolved by', 'Assigned to'];
    const details = ['team lead', 'vendor', 'specialist', 'manager', 'expert'];
    return `${this.getRandomChoice(actions)} ${this.getRandomChoice(details)} for further analysis.`;
  }

  private getRandomResolution(): string {
    const resolutions = ['Restarted service', 'Updated configuration', 'Replaced component', 'Applied patch', 'User error resolved'];
    return this.getRandomChoice(resolutions);
  }

  private getRandomFirstName(): string {
    const names = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    return this.getRandomChoice(names);
  }

  private getRandomLastName(): string {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return this.getRandomChoice(names);
  }

  private toDisplayName(tableName: string): string {
    return tableName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private getTableFields(tableName: string): string[] {
    const fieldMap: Record<string, string[]> = {
      incident: ['number', 'short_description', 'description', 'state', 'priority', 'urgency', 'impact', 'assigned_to', 'caller_id'],
      sys_user: ['user_name', 'first_name', 'last_name', 'email', 'department', 'manager', 'active'],
      change_request: ['number', 'short_description', 'description', 'state', 'priority', 'risk', 'impact'],
      problem: ['number', 'short_description', 'description', 'state', 'priority', 'cause']
    };
    return fieldMap[tableName] || ['sys_id', 'number', 'short_description', 'state'];
  }

  private generateEncodedQuery(tableName: string): string {
    const queries = [
      'state=1',
      'priority=1^urgency=1',
      'active=true',
      'sys_created_onONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()',
      'assigned_toISEMPTY'
    ];
    return this.getRandomChoice(queries);
  }

  private generateRecordData(tableName: string): any {
    const baseData = {
      short_description: `Test ${tableName} record`,
      description: 'Generated test data for unit testing',
      state: '1'
    };

    const tableSpecific: Record<string, any> = {
      incident: {
        priority: '3',
        urgency: '3',
        impact: '3',
        category: 'software'
      },
      sys_user: {
        user_name: 'test.user@company.com',
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@company.com'
      }
    };

    return { ...baseData, ...(tableSpecific[tableName] || {}) };
  }

  private generatePartialRecordData(tableName: string): any {
    return {
      state: '2',
      short_description: 'Updated test record'
    };
  }

  private generateQueryResult(tableName: string): any[] {
    const count = this.getRandomNumber(1, 10);
    return Array(count).fill(0).map((_, i) => ({
      sys_id: `${tableName}_result_${i}`,
      number: `${tableName.toUpperCase()}${(100000 + i).toString()}`,
      short_description: `Test ${tableName} result ${i + 1}`
    }));
  }

  private generateRelationshipStrength(): any {
    return {
      strong_relationships: this.getRandomNumber(3, 8),
      weak_relationships: this.getRandomNumber(1, 5),
      avg_reference_count: this.getRandomNumber(100, 10000)
    };
  }

  private generateCardinalityAnalysis(): any {
    return {
      one_to_many: this.getRandomNumber(2, 6),
      many_to_one: this.getRandomNumber(3, 8),
      one_to_one: this.getRandomNumber(0, 2)
    };
  }

  private generatePerformanceImpact(): any {
    return {
      query_impact_score: this.getRandomNumber(1, 10),
      join_complexity: this.getRandomNumber(1, 5),
      index_recommendations: ['Consider composite index on (state, priority)', 'Add index on assigned_to field']
    };
  }

  private generateOptimizationSuggestions(): string[] {
    return [
      'Consider denormalizing frequently accessed fields',
      'Add database indexes for common query patterns',
      'Review relationship cardinality for optimization opportunities'
    ];
  }

  private calculateQueryComplexity(query: string): number {
    let complexity = 1;
    if (query.includes('^')) complexity += query.split('^').length - 1;
    if (query.includes('IN')) complexity += 1;
    if (query.includes('LIKE')) complexity += 1;
    if (query.includes('javascript:')) complexity += 2;
    return complexity;
  }

  private generateIndexAnalysis(query: string): any {
    const complexity = this.calculateQueryComplexity(query);
    return {
      indexes_used: complexity <= 3 ? ['primary_key', 'state_idx'] : [],
      missing_indexes: complexity > 3 ? ['composite_state_priority_idx'] : [],
      index_effectiveness: complexity <= 3 ? 0.9 : 0.3
    };
  }

  private generateQueryOptimizations(complexity: number): string[] {
    const optimizations = [];
    if (complexity > 3) {
      optimizations.push('Add composite index for multiple field queries');
      optimizations.push('Consider query restructuring to use existing indexes');
    }
    if (complexity > 5) {
      optimizations.push('Break down complex query into simpler parts');
      optimizations.push('Consider caching frequently accessed data');
    }
    return optimizations;
  }

  private generateBusinessLogicUsage(fields: string[]): any {
    return fields.slice(0, 3).map(field => ({
      field,
      business_rules: this.getRandomNumber(1, 5),
      workflows: this.getRandomNumber(0, 3),
      ui_policies: this.getRandomNumber(0, 2)
    }));
  }

  private generateUsageRecommendations(): string[] {
    return [
      'Consider archiving old records to improve performance',
      'Review unused fields for potential cleanup',
      'Optimize frequently accessed fields with proper indexing'
    ];
  }

  private generateCleanupCandidates(fields: string[]): any[] {
    return fields.slice(-2).map(field => ({
      field,
      usage_score: this.getRandomNumber(0, 30),
      risk_level: 'low',
      recommendation: 'Safe to archive or remove after 90 days'
    }));
  }

  private getProcessActivities(tableName: string): string[] {
    const activityMap: Record<string, string[]> = {
      incident: ['Create', 'Assign', 'Work', 'Resolve', 'Close'],
      change_request: ['Create', 'Plan', 'Approve', 'Implement', 'Review', 'Close'],
      problem: ['Create', 'Investigate', 'Root Cause', 'Workaround', 'Resolve']
    };
    return activityMap[tableName] || ['Start', 'Process', 'Complete'];
  }

  private generateActivitySequence(activities: string[], variant: number): any[] {
    const baseSequence = activities.slice();
    
    // Add some variation based on variant number
    if (variant % 3 === 0) {
      // Add an extra step
      baseSequence.splice(2, 0, 'Escalate');
    } else if (variant % 4 === 0) {
      // Skip a step
      baseSequence.splice(1, 1);
    }

    return baseSequence.map((activity, i) => ({
      activity,
      timestamp: new Date(this.baseTimestamp - ((baseSequence.length - i) * 3600000)).toISOString(),
      user: `user_${this.getRandomChoice(['john_doe', 'jane_smith', 'bob_wilson'])}`
    }));
  }

  private generateProcessVariants(activities: string[]): any[] {
    return [
      { variant: 'Standard', frequency: 0.7, activities: activities },
      { variant: 'Escalated', frequency: 0.2, activities: [...activities.slice(0, 2), 'Escalate', ...activities.slice(2)] },
      { variant: 'Express', frequency: 0.1, activities: activities.filter((_, i) => i !== 1) }
    ];
  }

  private generateBottleneckAnalysis(activities: string[]): any {
    return {
      bottlenecks: activities.slice(1, 3).map(activity => ({
        activity,
        avg_duration: this.getRandomNumber(1800, 14400),
        queue_time: this.getRandomNumber(300, 3600),
        resource_utilization: this.getRandomNumber(70, 95)
      })),
      optimization_potential: this.getRandomNumber(20, 60)
    };
  }

  private generateProcessPerformanceMetrics(): any {
    return {
      throughput: this.getRandomNumber(10, 100),
      cycle_time: this.getRandomNumber(3600, 86400),
      lead_time: this.getRandomNumber(7200, 172800),
      rework_rate: this.getRandomNumber(5, 20) / 100,
      automation_rate: this.getRandomNumber(30, 80) / 100
    };
  }

  private generateProcessMap(activities: string[]): any {
    return {
      nodes: activities.map((activity, i) => ({
        id: i + 1,
        name: activity,
        type: i === 0 ? 'start' : i === activities.length - 1 ? 'end' : 'activity'
      })),
      edges: activities.slice(0, -1).map((_, i) => ({
        from: i + 1,
        to: i + 2,
        frequency: this.getRandomNumber(50, 200)
      }))
    };
  }

  private generateWorkflowDefinition(workflowName: string): any {
    const activities = ['Start', 'Check Conditions', 'Assign Task', 'Send Notification', 'Wait for Approval', 'Complete'];
    return {
      name: workflowName,
      version: '1.0',
      activities: activities.map((name, i) => ({
        id: i + 1,
        name,
        type: this.getRandomChoice(['task', 'condition', 'notification', 'approval'])
      }))
    };
  }

  private generateWorkflowExecutions(workflowName: string, count: number = 5): any[] {
    return Array(count).fill(0).map((_, i) => ({
      execution_id: `exec_${workflowName}_${i}`,
      workflow_version: '1.0',
      start_time: new Date(this.baseTimestamp - (i * 3600000)).toISOString(),
      end_time: i % 4 !== 0 ? new Date(this.baseTimestamp - (i * 3600000) + 7200000).toISOString() : null,
      status: i % 4 === 0 ? 'stuck' : 'completed',
      duration: i % 4 !== 0 ? 7200 : null
    }));
  }

  private generateWorkflowBottlenecks(): any[] {
    return [
      { activity: 'Wait for Approval', avg_duration: 14400, frequency: 0.6 },
      { activity: 'Check Conditions', avg_duration: 1800, frequency: 0.3 }
    ];
  }

  private generateWorkflowImprovements(): string[] {
    return [
      'Implement automated approval for low-risk changes',
      'Add timeout handling for stuck processes',
      'Optimize condition checking logic'
    ];
  }

  private generateActiveProcesses(count: number = 5): any[] {
    return Array(count).fill(0).map((_, i) => ({
      process_id: `proc_${i.toString().padStart(3, '0')}`,
      process_type: this.getRandomChoice(['incident_resolution', 'change_approval', 'problem_investigation']),
      start_time: new Date(this.baseTimestamp - (i * 3600000)).toISOString(),
      current_step: this.getRandomChoice(['investigation', 'approval', 'implementation', 'review']),
      assigned_to: `user_${this.getRandomChoice(['john_doe', 'jane_smith', 'bob_wilson'])}`,
      sla_status: this.getRandomChoice(['on_track', 'at_risk', 'breached']),
      priority: this.getRandomChoice(['high', 'medium', 'low'])
    }));
  }

  private generateRealtimeMetrics(): any {
    return {
      active_count: this.getRandomNumber(20, 100),
      completed_today: this.getRandomNumber(50, 200),
      avg_resolution_time: this.getRandomNumber(3600, 14400),
      sla_compliance_rate: this.getRandomNumber(85, 98) / 100,
      throughput_per_hour: this.getRandomNumber(5, 25)
    };
  }

  private generateAlertConditions(): any[] {
    return [
      { condition: 'sla_at_risk', threshold: 0.8, current_value: 0.85 },
      { condition: 'queue_backup', threshold: 50, current_value: 35 },
      { condition: 'avg_resolution_time', threshold: 14400, current_value: 12600 }
    ];
  }

  private generateDashboardData(): any {
    return {
      kpi_widgets: [
        { name: 'Active Processes', value: this.getRandomNumber(20, 100), trend: 'up' },
        { name: 'SLA Compliance', value: `${this.getRandomNumber(85, 98)}%`, trend: 'stable' },
        { name: 'Avg Resolution Time', value: `${(this.getRandomNumber(3600, 14400) / 3600).toFixed(1)}h`, trend: 'down' }
      ],
      charts: [
        { type: 'line', title: 'Process Volume Trend', data: Array(7).fill(0).map(() => this.getRandomNumber(20, 80)) },
        { type: 'pie', title: 'Process Types', data: [30, 25, 20, 15, 10] }
      ]
    };
  }
}

// Export singleton instance
export const testDataGenerator = ServiceNowTestDataGenerator.getInstance();
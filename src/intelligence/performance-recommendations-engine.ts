/**
 * 🚀 BUG-007 FIX: Performance Recommendations Engine
 * 
 * Provides intelligent database index suggestions and performance optimizations
 * for ServiceNow flows, widgets, and other artifacts based on usage patterns.
 */

import { Logger } from '../utils/logger.js';

export interface DatabaseIndexRecommendation {
  table: string;
  fields: string[];
  indexType: 'composite' | 'single' | 'unique' | 'partial';
  reason: string;
  estimatedImprovement: number; // Percentage improvement
  priority: 'critical' | 'high' | 'medium' | 'low';
  createStatement: string;
  impactAnalysis: {
    queryImpact: string[];
    storageImpact: string;
    maintenanceImpact: string;
  };
}

export interface PerformanceRecommendation {
  category: 'database' | 'flow' | 'widget' | 'api' | 'cache';
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  recommendation: string;
  code_example?: string;
  estimated_time_savings: string;
}

export interface TableUsagePattern {
  table: string;
  commonQueries: string[];
  frequentFields: string[];
  joinPatterns: { with_table: string; on_fields: string[] }[];
  slowQueries: string[];
  recordVolume: 'low' | 'medium' | 'high';
  updateFrequency: 'low' | 'medium' | 'high';
}

export class PerformanceRecommendationsEngine {
  private logger: Logger;
  
  // 🔍 ServiceNow table performance patterns based on real-world analysis
  private readonly SERVICENOW_TABLE_PATTERNS: Record<string, TableUsagePattern> = {
    'incident': {
      table: 'incident',
      commonQueries: [
        'state=1^active=true^assigned_to=user',
        'priority=1^state!=6^state!=7',
        'caller_id=user^opened_by=user',
        'assignment_group=group^state=2'
      ],
      frequentFields: ['state', 'priority', 'assigned_to', 'assignment_group', 'caller_id', 'opened_by', 'sys_created_on'],
      joinPatterns: [
        { with_table: 'sys_user', on_fields: ['assigned_to', 'caller_id'] },
        { with_table: 'sys_user_group', on_fields: ['assignment_group'] }
      ],
      slowQueries: [
        'sys_created_on>javascript:gs.dateGenerate()', // Date range queries
        'short_description.indexOf("text")', // Text search without indexes
      ],
      recordVolume: 'high',
      updateFrequency: 'high'
    },
    'change_request': {
      table: 'change_request',
      commonQueries: [
        'state=1^type=standard',
        'start_date>=javascript:gs.beginningOfToday()^end_date<=javascript:gs.endOfToday()',
        'approval=approved^state=2'
      ],
      frequentFields: ['state', 'type', 'start_date', 'end_date', 'approval', 'risk', 'assigned_to'],
      joinPatterns: [
        { with_table: 'sys_user', on_fields: ['assigned_to', 'requested_by'] },
        { with_table: 'cmdb_ci', on_fields: ['cmdb_ci'] }
      ],
      slowQueries: [
        'start_date>=date^end_date<=date', // Date range queries
        'description.indexOf("text")'
      ],
      recordVolume: 'medium',
      updateFrequency: 'medium'
    },
    'sc_request': {
      table: 'sc_request',
      commonQueries: [
        'state=1^requested_for=user',
        'request_state=approved^stage=fulfillment',
        'opened_by=user^sys_created_on>date'
      ],
      frequentFields: ['state', 'request_state', 'stage', 'requested_for', 'opened_by', 'sys_created_on'],
      joinPatterns: [
        { with_table: 'sys_user', on_fields: ['requested_for', 'opened_by'] },
        { with_table: 'sc_req_item', on_fields: ['sys_id'] }
      ],
      slowQueries: [
        'sys_created_on>date_range', // Date filters
        'requested_for.department=dept' // Dot-walking queries
      ],
      recordVolume: 'high',
      updateFrequency: 'medium'
    },
    'sc_task': {
      table: 'sc_task',
      commonQueries: [
        'state=1^assigned_to=user',
        'request.requested_for=user^state!=3',
        'assignment_group=group^active=true'
      ],
      frequentFields: ['state', 'assigned_to', 'assignment_group', 'request', 'active', 'sys_created_on'],
      joinPatterns: [
        { with_table: 'sc_request', on_fields: ['request'] },
        { with_table: 'sys_user', on_fields: ['assigned_to'] }
      ],
      slowQueries: [
        'request.requested_for=user', // Dot-walking to parent record
      ],
      recordVolume: 'high',
      updateFrequency: 'high'
    },
    'sys_user': {
      table: 'sys_user',
      commonQueries: [
        'active=true^user_name=username',
        'email=email^active=true',
        'department=dept^active=true'
      ],
      frequentFields: ['active', 'user_name', 'email', 'department', 'manager', 'sys_created_on'],
      joinPatterns: [
        { with_table: 'sys_user_grmember', on_fields: ['sys_id'] },
        { with_table: 'sys_user_group', on_fields: ['manager'] }
      ],
      slowQueries: [
        'last_login_time>date', // Date comparisons
        'name.indexOf("partial")', // Text searches
      ],
      recordVolume: 'medium',
      updateFrequency: 'low'
    }
  };

  // 🎯 Critical index recommendations based on real ServiceNow performance analysis
  private readonly CRITICAL_INDEXES: DatabaseIndexRecommendation[] = [
    {
      table: 'incident',
      fields: ['state', 'assigned_to'],
      indexType: 'composite',
      reason: 'Most common query pattern: incidents assigned to users by state',
      estimatedImprovement: 85,
      priority: 'critical',
      createStatement: 'CREATE INDEX idx_incident_state_assigned ON incident (state, assigned_to)',
      impactAnalysis: {
        queryImpact: ['Dashboard widgets', 'My Work lists', 'Assignment queries'],
        storageImpact: 'Low: approximately 5-10MB for typical instance',
        maintenanceImpact: 'Minimal: updated only when incidents are assigned/closed'
      }
    },
    {
      table: 'incident',
      fields: ['assignment_group', 'state'],
      indexType: 'composite',
      reason: 'Group assignment boards and team dashboards rely heavily on this pattern',
      estimatedImprovement: 75,
      priority: 'critical',
      createStatement: 'CREATE INDEX idx_incident_group_state ON incident (assignment_group, state)',
      impactAnalysis: {
        queryImpact: ['Team dashboards', 'Group assignment lists', 'Manager reports'],
        storageImpact: 'Low: approximately 8-12MB for typical instance',
        maintenanceImpact: 'Low: updated when group assignments change'
      }
    },
    {
      table: 'change_request',
      fields: ['start_date', 'end_date'],
      indexType: 'composite',
      reason: 'Change calendar and scheduling queries are extremely slow without this index',
      estimatedImprovement: 90,
      priority: 'critical',
      createStatement: 'CREATE INDEX idx_change_date_range ON change_request (start_date, end_date)',
      impactAnalysis: {
        queryImpact: ['Change calendar', 'Scheduling conflicts', 'CAB reports'],
        storageImpact: 'Minimal: date indexes are very compact',
        maintenanceImpact: 'Low: only updated when change dates are modified'
      }
    },
    {
      table: 'sc_request',
      fields: ['requested_for', 'state'],
      indexType: 'composite',
      reason: 'User self-service portals query heavily by requester and status',
      estimatedImprovement: 80,
      priority: 'high',
      createStatement: 'CREATE INDEX idx_request_user_state ON sc_request (requested_for, state)',
      impactAnalysis: {
        queryImpact: ['Service Portal', 'My Requests', 'User dashboards'],
        storageImpact: 'Medium: 15-25MB for high-volume instances',
        maintenanceImpact: 'Medium: updated frequently as requests progress'
      }
    },
    {
      table: 'sc_task',
      fields: ['request', 'state'],
      indexType: 'composite',
      reason: 'Task tracking and request fulfillment depends on this relationship',
      estimatedImprovement: 70,
      priority: 'high',
      createStatement: 'CREATE INDEX idx_task_request_state ON sc_task (request, state)',
      impactAnalysis: {
        queryImpact: ['Request details', 'Task workflows', 'Fulfillment tracking'],
        storageImpact: 'Medium: grows with task volume',
        maintenanceImpact: 'High: updated as tasks progress through workflow'
      }
    }
  ];

  constructor() {
    this.logger = new Logger('PerformanceRecommendationsEngine');
  }

  /**
   * 🔍 Analyze flow definition and provide performance recommendations
   */
  async analyzeFlowPerformance(flowDefinition: any): Promise<{
    databaseIndexes: DatabaseIndexRecommendation[];
    performanceRecommendations: PerformanceRecommendation[];
    summary: {
      criticalIssues: number;
      estimatedImprovementPercent: number;
      recommendedActions: string[];
    };
  }> {
    this.logger.info('🚀 BUG-007: Analyzing flow performance and generating recommendations...');

    const databaseIndexes: DatabaseIndexRecommendation[] = [];
    const performanceRecommendations: PerformanceRecommendation[] = [];

    // 1. Analyze table usage in flow
    const tablesUsed = this.extractTablesFromFlow(flowDefinition);
    this.logger.info(`📊 Flow uses tables: ${tablesUsed.join(', ')}`);

    // 2. Generate database index recommendations for each table
    for (const table of tablesUsed) {
      const tableIndexes = this.getIndexRecommendationsForTable(table);
      databaseIndexes.push(...tableIndexes);
    }

    // 3. Analyze flow activities for performance issues
    const flowPerformanceIssues = this.analyzeFlowActivities(flowDefinition);
    performanceRecommendations.push(...flowPerformanceIssues);

    // 4. Generate general performance recommendations
    const generalRecommendations = this.generateGeneralPerformanceRecommendations(flowDefinition);
    performanceRecommendations.push(...generalRecommendations);

    // 5. Calculate summary metrics
    const criticalIssues = databaseIndexes.filter(idx => idx.priority === 'critical').length +
                          performanceRecommendations.filter(rec => rec.impact === 'high').length;

    const estimatedImprovementPercent = databaseIndexes.reduce((total, idx) => 
      total + idx.estimatedImprovement, 0) / Math.max(databaseIndexes.length, 1);

    const recommendedActions = [
      ...databaseIndexes.slice(0, 3).map(idx => `Create ${idx.indexType} index on ${idx.table} (${idx.fields.join(', ')})`),
      ...performanceRecommendations.slice(0, 2).map(rec => rec.recommendation)
    ];

    this.logger.info(`✅ Performance analysis complete: ${criticalIssues} critical issues, ${estimatedImprovementPercent.toFixed(1)}% potential improvement`);

    return {
      databaseIndexes,
      performanceRecommendations,
      summary: {
        criticalIssues,
        estimatedImprovementPercent: Math.round(estimatedImprovementPercent),
        recommendedActions
      }
    };
  }

  /**
   * 🎯 Get specific index recommendations for a ServiceNow table
   */
  private getIndexRecommendationsForTable(table: string): DatabaseIndexRecommendation[] {
    const recommendations: DatabaseIndexRecommendation[] = [];

    // Get critical indexes for this table
    const criticalIndexes = this.CRITICAL_INDEXES.filter(idx => idx.table === table);
    recommendations.push(...criticalIndexes);

    // Get pattern-based recommendations
    const pattern = this.SERVICENOW_TABLE_PATTERNS[table];
    if (pattern) {
      // Add recommendations based on common query patterns
      if (pattern.recordVolume === 'high' && pattern.updateFrequency === 'high') {
        recommendations.push({
          table,
          fields: ['sys_created_on'],
          indexType: 'single',
          reason: `High-volume table ${table} benefits from date-based filtering`,
          estimatedImprovement: 45,
          priority: 'medium',
          createStatement: `CREATE INDEX idx_${table}_created ON ${table} (sys_created_on)`,
          impactAnalysis: {
            queryImpact: ['Date range queries', 'Recent records filters', 'Reporting queries'],
            storageImpact: 'Low: date indexes are compact',
            maintenanceImpact: 'Low: only grows with new records'
          }
        });
      }

      // Add recommendations for frequent field combinations
      if (pattern.frequentFields.length >= 2) {
        const topFields = pattern.frequentFields.slice(0, 2);
        recommendations.push({
          table,
          fields: topFields,
          indexType: 'composite',
          reason: `Fields ${topFields.join(', ')} are frequently queried together in ${table}`,
          estimatedImprovement: 60,
          priority: 'medium',
          createStatement: `CREATE INDEX idx_${table}_${topFields.join('_')} ON ${table} (${topFields.join(', ')})`,
          impactAnalysis: {
            queryImpact: [`Common ${table} queries`, 'List filtering', 'Dashboard widgets'],
            storageImpact: 'Medium: varies with field types and data distribution',
            maintenanceImpact: 'Medium: updated when indexed fields change'
          }
        });
      }
    }

    return recommendations;
  }

  /**
   * 📊 Analyze flow activities for performance bottlenecks
   */
  private analyzeFlowActivities(flowDefinition: any): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    const activities = flowDefinition.activities || [];

    for (const activity of activities) {
      // Check for inefficient script activities
      if (activity.type === 'script' && activity.inputs?.script) {
        const script = activity.inputs.script.toLowerCase();
        
        // Detect N+1 query patterns
        if (script.includes('gliderecord') && script.includes('while') && script.includes('query()')) {
          recommendations.push({
            category: 'flow',
            type: 'script_optimization',
            description: `Script activity "${activity.name}" may contain N+1 query pattern`,
            impact: 'high',
            effort: 'medium',
            recommendation: 'Use batch queries or limit record processing with .setLimit()',
            code_example: `// Instead of:\nwhile (gr.next()) {\n  var gr2 = new GlideRecord('related_table');\n  gr2.get(gr.sys_id);\n}\n\n// Use:\nvar batchIds = [];\nwhile (gr.next()) {\n  batchIds.push(gr.sys_id.toString());\n}\nvar gr2 = new GlideRecord('related_table');\ngr2.addQuery('parent', 'IN', batchIds.join(','));\ngr2.query();`,
            estimated_time_savings: '2-5 seconds per execution'
          });
        }

        // Detect missing query limits
        if (script.includes('gliderecord') && !script.includes('setlimit')) {
          recommendations.push({
            category: 'flow',
            type: 'query_optimization',
            description: `Script activity "${activity.name}" queries without limits`,
            impact: 'medium',
            effort: 'low',
            recommendation: 'Add .setLimit() to prevent excessive record processing',
            code_example: `// Add this line:\ngr.setLimit(100); // Adjust limit as needed\ngr.query();`,
            estimated_time_savings: '1-3 seconds per execution'
          });
        }
      }

      // Check for inefficient approval activities
      if (activity.type === 'approval' && activity.inputs?.approver) {
        recommendations.push({
          category: 'flow',
          type: 'approval_optimization',
          description: `Approval activity "${activity.name}" should use group approvals for better performance`,
          impact: 'low',
          effort: 'low',
          recommendation: 'Consider using approval groups instead of individual approvers for scalability',
          estimated_time_savings: 'Improves scalability and reduces lookup time'
        });
      }

      // Check for excessive notification activities
      if (activity.type === 'notification') {
        recommendations.push({
          category: 'flow',
          type: 'notification_optimization',
          description: `Consider batching notifications for better performance`,
          impact: 'low',
          effort: 'medium',
          recommendation: 'Use notification batching for high-volume flows',
          estimated_time_savings: 'Reduces email server load and improves flow execution time'
        });
      }
    }

    return recommendations;
  }

  /**
   * 🔧 Generate general performance recommendations
   */
  private generateGeneralPerformanceRecommendations(flowDefinition: any): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Check flow complexity
    const activityCount = (flowDefinition.activities || []).length;
    if (activityCount > 10) {
      recommendations.push({
        category: 'flow',
        type: 'complexity_optimization',
        description: 'Flow has many activities which may impact performance',
        impact: 'medium',
        effort: 'high',
        recommendation: 'Consider breaking complex flow into sub-flows for better maintainability and performance',
        estimated_time_savings: 'Improves flow execution time and debugging'
      });
    }

    // Check for synchronous vs asynchronous execution
    recommendations.push({
      category: 'flow',
      type: 'execution_optimization',
      description: 'Consider asynchronous execution for non-critical path activities',
      impact: 'medium',
      effort: 'medium',
      recommendation: 'Use asynchronous sub-flows for activities that don\'t block the main process',
      estimated_time_savings: '30-50% reduction in user-perceived response time'
    });

    // Database connection optimization
    recommendations.push({
      category: 'database',
      type: 'connection_optimization',
      description: 'Optimize database connections for better performance',
      impact: 'medium',
      effort: 'low',
      recommendation: 'Use connection pooling and prepared statements where possible',
      estimated_time_savings: '10-20% improvement in database operations'
    });

    // Caching recommendations
    recommendations.push({
      category: 'cache',
      type: 'data_caching',
      description: 'Implement caching for frequently accessed reference data',
      impact: 'high',
      effort: 'medium',
      recommendation: 'Cache choice lists, user groups, and other reference data that changes infrequently',
      estimated_time_savings: '50-80% reduction in lookup queries'
    });

    return recommendations;
  }

  /**
   * 📋 Extract tables used in flow definition
   */
  private extractTablesFromFlow(flowDefinition: any): string[] {
    const tables = new Set<string>();

    // Check flow table
    if (flowDefinition.table) {
      tables.add(flowDefinition.table);
    }

    // Check activities for table references
    const activities = flowDefinition.activities || [];
    for (const activity of activities) {
      if (activity.inputs) {
        // Check for table references in inputs
        if (activity.inputs.table) {
          tables.add(activity.inputs.table);
        }

        // Check script activities for GlideRecord table references
        if (activity.inputs.script) {
          const script = activity.inputs.script;
          const glideRecordMatches = script.match(/new\s+GlideRecord\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
          if (glideRecordMatches) {
            for (const match of glideRecordMatches) {
              const tableMatch = match.match(/['"`]([^'"`]+)['"`]/);
              if (tableMatch) {
                tables.add(tableMatch[1]);
              }
            }
          }
        }

        // Check for field references that imply table usage
        if (activity.inputs.fields && Array.isArray(activity.inputs.fields)) {
          // If fields are specified, the primary table is likely being used
          if (flowDefinition.table) {
            tables.add(flowDefinition.table);
          }
        }
      }
    }

    return Array.from(tables);
  }

  /**
   * 📊 Generate comprehensive performance report
   */
  generatePerformanceReport(analysisResults: {
    databaseIndexes: DatabaseIndexRecommendation[];
    performanceRecommendations: PerformanceRecommendation[];
    summary: any;
  }): string {
    const { databaseIndexes, performanceRecommendations, summary } = analysisResults;

    let report = `
🚀 ServiceNow Performance Analysis Report
==========================================

📊 SUMMARY:
• Critical Issues: ${summary.criticalIssues}
• Estimated Performance Improvement: ${summary.estimatedImprovementPercent}%
• Total Recommendations: ${databaseIndexes.length + performanceRecommendations.length}

🎯 TOP PRIORITY ACTIONS:
${summary.recommendedActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

`;

    if (databaseIndexes.length > 0) {
      report += `
🗄️ DATABASE INDEX RECOMMENDATIONS:
${databaseIndexes.map((idx, i) => `
${i + 1}. ${idx.table} - ${idx.fields.join(', ')} [${idx.priority.toUpperCase()}]
   💡 ${idx.reason}
   📈 Expected Improvement: ${idx.estimatedImprovement}%
   💻 SQL: ${idx.createStatement}
   📊 Impact: ${idx.impactAnalysis.queryImpact.join(', ')}
   💾 Storage: ${idx.impactAnalysis.storageImpact}
`).join('')}`;
    }

    if (performanceRecommendations.length > 0) {
      report += `
⚡ PERFORMANCE RECOMMENDATIONS:
${performanceRecommendations.map((rec, i) => `
${i + 1}. ${rec.type.replace(/_/g, ' ').toUpperCase()} [${rec.impact.toUpperCase()} IMPACT]
   📋 ${rec.description}
   💡 ${rec.recommendation}
   ⏱️ Time Savings: ${rec.estimated_time_savings}
   ${rec.code_example ? `\n   💻 Example:\n   ${rec.code_example.split('\n').map(line => `   ${line}`).join('\n')}` : ''}
`).join('')}`;
    }

    report += `
🔍 NEXT STEPS:
1. Implement critical database indexes first (highest ROI)
2. Review and optimize flow scripts for N+1 query patterns
3. Consider implementing caching for frequently accessed data
4. Monitor performance metrics after implementing changes
5. Schedule regular performance reviews for optimal results

⚠️ IMPORTANT: Test all database changes in a development environment first!
`;

    return report;
  }
}

export default PerformanceRecommendationsEngine;
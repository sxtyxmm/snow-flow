# Focused ServiceNow API & Table Analysis Features

## 🎯 Core Value Proposition
Enhance Snow-Flow with practical API improvements and table insights that directly accelerate ServiceNow development.

## 📦 Feature 1: Smart Batch API Operations

### Problem It Solves
Developers often need to query multiple tables or update many records, resulting in hundreds of individual API calls that slow down development and hit rate limits.

### Implementation
```javascript
// Instead of 100 separate calls, do this:
const results = await snow_batch_api({
  operations: [
    { action: "query", table: "incident", query: "active=true^assigned_to=NULL" },
    { action: "update", table: "incident", sys_id: "abc123", data: { state: 2 } },
    { action: "query", table: "sys_user", query: "active=true^roles=itil" }
  ],
  transaction: true  // All succeed or all fail
});

// Returns organized results:
{
  success: true,
  results: [
    { operation: 0, count: 45, data: [...] },
    { operation: 1, updated: true },
    { operation: 2, count: 12, data: [...] }
  ],
  execution_time: "234ms"
}
```

### Developer Benefits
- 80% reduction in API calls
- Atomic transactions for data consistency
- Faster development iterations

## 🔍 Feature 2: Practical Table Relationship Mapping

### Problem It Solves
Understanding which tables reference each other and impact of changes is time-consuming and error-prone.

### Implementation
```javascript
// Quick relationship check
const relationships = await snow_get_table_relationships({
  table: "sc_request",
  depth: 2  // How many levels to explore
});

// Returns practical info:
{
  table: "sc_request",
  extends: "task",
  references_to: {
    "requested_for": "sys_user",
    "assignment_group": "sys_user_group",
    "catalog_item": "sc_cat_item"
  },
  referenced_by: {
    "sc_req_item": ["request"],
    "sc_task": ["request"],
    "approval_approver": ["source_table=sc_request"]
  },
  common_queries: [
    "requested_for.active=true",
    "state=1^assignment_group=NULL"
  ]
}
```

### Developer Benefits
- Instantly understand table dependencies
- Prevent breaking changes
- Find the right table to query

## 🚀 Feature 3: Query Performance Analyzer

### Problem It Solves
Slow queries in ServiceNow can timeout or impact instance performance, but developers don't know which queries are problematic until production.

### Implementation
```javascript
// Analyze before executing
const analysis = await snow_analyze_query({
  table: "incident",
  query: "active=true^assigned_toISEMPTY^priority=1^opened_at>=javascript:gs.dateGenerate('2023-01-01')"
});

// Returns actionable insights:
{
  estimated_records: 15420,
  performance_score: 45,  // Out of 100
  issues: [
    {
      severity: "high",
      issue: "No index on 'opened_at' for date range queries",
      impact: "~3x slower query"
    }
  ],
  optimized_query: "active=true^assigned_toISEMPTY^priority=1^opened_atONToday@javascript:gs.beginningOfToday()@javascript:gs.endOfToday()",
  suggestion: "Consider adding sys_created_on to query instead"
}
```

### Developer Benefits
- Prevent slow queries before they hit production
- Learn ServiceNow query best practices
- Optimize existing code

## 💡 Feature 4: Field Usage Intelligence

### Problem It Solves
Custom fields proliferate over time, but developers don't know which fields are actually used or can be deprecated.

### Implementation
```javascript
// Analyze field usage
const usage = await snow_analyze_field_usage({
  table: "incident",
  fields: ["u_custom_field_1", "u_legacy_id", "u_special_handling"]
});

// Returns practical data:
{
  fields: [
    {
      name: "u_custom_field_1",
      used_in_queries: 0,
      used_in_views: 0,
      used_in_reports: 0,
      has_data: "12% of records",
      last_updated: "8 months ago",
      recommendation: "Safe to deprecate"
    },
    {
      name: "u_special_handling", 
      used_in_queries: 234,
      used_in_views: 3,
      used_in_business_rules: 2,
      recommendation: "Critical field - do not remove"
    }
  ]
}
```

### Developer Benefits
- Clean up technical debt safely
- Understand field dependencies
- Make informed schema decisions

## 🔄 Feature 5: Simple Migration Helper

### Problem It Solves
Moving data between tables (like custom to OOB) requires careful field mapping and data transformation.

### Implementation
```javascript
// Get migration plan
const plan = await snow_create_migration_plan({
  from: "u_old_equipment",
  to: "alm_asset",
  sample_size: 100  // Analyze 100 records for mapping
});

// Returns simple mapping:
{
  auto_mapped: [
    { from: "u_name", to: "display_name", confidence: 95 },
    { from: "u_serial", to: "serial_number", confidence: 100 }
  ],
  needs_attention: [
    { 
      from: "u_status",
      issue: "Values don't match target choices",
      current_values: ["Active", "Broken", "Storage"],
      target_choices: ["In use", "In maintenance", "In stock"]
    }
  ],
  script_template: "// Auto-generated migration script..."
}
```

### Developer Benefits
- Reduce migration errors
- Save hours of manual mapping
- Get production-ready scripts

## 🧠 Feature 6: Deep Table Analysis (AI-Powered)

### Problem It Solves
Understanding a table's complete structure, patterns, and optimization opportunities requires analyzing thousands of records and relationships - perfect for AI, tedious for humans.

### Implementation
```javascript
const analysis = await snow_analyze_table_deep({
  table: "incident",
  sample_size: 10000  // AI analyzes patterns across thousands of records
});

// Returns AI-discovered insights:
{
  table: "incident",
  ai_insights: {
    patterns: [
      "87% of P1 incidents are resolved by the same 5 users",
      "Incidents created on Mondays take 34% longer to resolve",
      "Field 'u_custom_notes' has 94% similarity to 'work_notes' - possible duplicate"
    ],
    anomalies: [
      "234 incidents have resolution_time < creation_time (data quality issue)",
      "Assignment group 'Network-Legacy' hasn't resolved any ticket in 6 months"
    ],
    optimization_opportunities: [
      {
        finding: "Category 'Hardware' + Subcategory 'Printer' = 89% auto-resolvable",
        suggestion: "Create automation rule for printer issues",
        potential_savings: "~420 hours/year"
      }
    ]
  },
  relationships: {
    hidden_correlations: [
      "location='Building-A' strongly correlates with hardware failures (78%)",
      "assignment_group='ServiceDesk' + urgency=1 = 92% escalation rate"
    ]
  },
  predictive_rules: [
    "IF created_on.day='Monday' AND category='Email' THEN likely_resolution_time > 4 hours",
    "IF caller.department='Finance' AND end_of_month THEN urgency likely upgraded"
  ]
}
```

## 🤖 Feature 7: Intelligent Code Pattern Detector

### Problem It Solves
Finding all variations of similar code patterns across thousands of scripts is impossible for humans but trivial for AI.

### Implementation
```javascript
// Find all variations of a pattern
const patterns = await snow_detect_code_patterns({
  pattern_type: "user_lookup",  // or "date_manipulation", "gliderecord_query", etc.
  scan_artifacts: ["business_rules", "client_scripts", "script_includes"]
});

// AI finds ALL variations:
{
  pattern: "user_lookup",
  found: 234,
  variations: [
    {
      code: "gs.getUser().getUserByID(current.assigned_to)",
      count: 89,
      locations: ["BR_AutoAssign", "CS_ValidateUser", ...],
      issues: ["No null check", "Deprecated method"]
    },
    {
      code: "new GlideRecord('sys_user'); gr.get(assigned_to);",
      count: 45,
      performance: "3x slower than GlideUser",
      suggestion: "Use gs.getUser() instead"
    }
  ],
  refactor_script: "// AI-generated unified approach:..."
}
```

## 🔮 Feature 8: Predictive Impact Analysis

### Problem It Solves
Humans can't predict all cascading effects of changes across complex ServiceNow instances.

### Implementation
```javascript
// Before making any change
const impact = await snow_predict_change_impact({
  change_type: "add_field",
  table: "task",
  field: { name: "u_new_field", type: "string", mandatory: true }
});

// AI predicts cascading effects:
{
  direct_impact: {
    tables_affected: 47,  // All tables extending task
    records_affected: "2.3M",
    forms_broken: 23,     // Forms expecting specific field count
    integrations_affected: ["SAP_Integration", "Teams_Webhook"]
  },
  performance_impact: {
    form_load: "+230ms per form",
    api_response: "+45ms per query",
    database_size: "+1.2GB"
  },
  hidden_impacts: [
    "Mobile app v2.3 will crash (hardcoded field index)",
    "Reporting dashboard expects 39 fields, will break",
    "Transform map 'Legacy_Import' will fail validation"
  ],
  risk_score: 78,
  recommendation: "Add field as optional first, monitor for 30 days"
}
```

## 📊 Feature 9: Auto-Documentation Generator

### Problem It Solves
Writing comprehensive documentation for complex tables/apps is time-consuming and often skipped.

### Implementation
```javascript
// AI reads everything and writes perfect docs
const docs = await snow_generate_documentation({
  artifact: "full_application",  // or specific table
  style: "technical",  // or "end_user", "api_reference"
  include: ["examples", "diagrams", "common_issues"]
});

// Generates complete documentation:
{
  markdown: `# Incident Management System Documentation

## Overview
AI-analyzed 45,892 incidents and identified the following patterns...

## Table Structure
\`\`\`mermaid
graph TD
  incident --> task
  incident --> sys_user[Assigned To]
  incident --> cmdb_ci[Configuration Item]
\`\`\`

## Common Usage Patterns
Based on analysis of 10,000+ queries:
1. 67% of queries filter by assignment_group
2. Most common join: incident → sys_user (caller_id)

## API Examples
\`\`\`javascript
// Most efficient query pattern (used by top performers):
const gr = new GlideRecord('incident');
gr.addActiveQuery();
gr.addQuery('assignment_group', gs.getUser().getMyGroups());
gr.setLimit(100);
\`\`\`

## Performance Tips
- Always include 'active' in queries (reduces set by 89%)
- Index on 'assigned_to' improves performance by 4.2x

## Common Pitfalls
1. Querying without state filter (returns 300K+ records)
2. Not checking for null assigned_to (34% of records)
`,
  diagrams: [...],
  test_cases: [...]
}
```

## 🔄 Feature 10: Intelligent Refactoring Assistant

### Problem It Solves
Refactoring legacy code requires understanding all dependencies and patterns - AI excels at this.

### Implementation
```javascript
// AI refactors with deep understanding
const refactored = await snow_refactor_code({
  script_include: "LegacyUserHelper",
  goals: ["modernize", "improve_performance", "add_error_handling"]
});

// Returns complete refactoring:
{
  original_issues: [
    "Uses deprecated APIs (6 instances)",
    "No error handling in 4 methods",
    "Synchronous operations blocking UI",
    "Violates 3 ServiceNow best practices"
  ],
  refactored_code: "// Modern, performant version...",
  migration_guide: {
    breaking_changes: ["Method 'getUser' now returns Promise"],
    update_required_in: ["BR_UserUpdate", "CS_DisplayUser", ...],
    test_scenarios: ["Test with inactive users", "Test with null input"]
  },
  performance_improvement: "84% faster, 60% less memory"
}
```

## 🛠️ Implementation Approach

### New MCP Tools (10 Total)
1. `snow_batch_api` - Execute multiple operations
2. `snow_get_table_relationships` - Map dependencies  
3. `snow_analyze_query` - Performance insights
4. `snow_analyze_field_usage` - Field intelligence
5. `snow_create_migration_plan` - Migration helper
6. `snow_analyze_table_deep` - AI-powered deep analysis
7. `snow_detect_code_patterns` - Find code patterns everywhere
8. `snow_predict_change_impact` - Predict cascading effects
9. `snow_generate_documentation` - Auto-create perfect docs
10. `snow_refactor_code` - Intelligent code modernization

### Integration Points
- All tools integrate with existing ServiceNow MCP servers
- Results cached in Snow-Flow memory for speed
- Works with Queen Agent for intelligent suggestions

## 📊 Success Metrics
- **Batch API**: 80% reduction in API calls
- **Query Analysis**: Catch 90% of slow queries before production
- **Field Usage**: Identify 95% of unused fields accurately
- **Migration**: 70% reduction in migration script creation time

## 🚦 Simple Implementation Plan

### Week 1-2: Batch API
- Implement transaction support
- Add error handling
- Test with common scenarios

### Week 3-4: Analysis Tools  
- Table relationships
- Query analyzer
- Field usage

### Week 5: Migration Helper
- Auto-mapping logic
- Script generation
- Testing tools

### Week 6: Polish
- Performance optimization
- Documentation
- Integration with Queen

## 🎯 Real Developer Scenarios

### Scenario 1: Daily Development
```javascript
// Developer needs user and their incidents
const data = await snow_batch_api({
  operations: [
    { action: "query", table: "sys_user", query: "user_name=john.doe" },
    { action: "query", table: "incident", query: "caller_id=${user.sys_id}" }
  ]
});
// One call instead of two, with automatic ID injection
```

### Scenario 2: Performance Issue
```javascript
// Developer's widget is slow
const analysis = await snow_analyze_query({
  table: "task",
  query: widget.server_script.query
});
// Immediately shows: "Add index on 'assignment_group' for 5x speedup"
```

This focused approach delivers immediate value to developers without overwhelming complexity!
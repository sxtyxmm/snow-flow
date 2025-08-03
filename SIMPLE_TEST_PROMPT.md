# COMPREHENSIVE SNOW-FLOW MCP TOOLS TEST PROMPT v1.4.39

**UPDATE: Neo4j removed, neural_status & token_usage added, deprecated tools cleaned up**

## 🔥 COPY-PASTE THIS ENTIRE PROMPT INTO CLAUDE TO TEST ALL 90+ WORKING TOOLS!

Dit is een **COMPLETE test** van alle Snow-Flow MCP tools. Volg de instructies en test elke categorie systematisch.

**Expected Results**: ~87% success rate (based on v1.4.39 cleanup)

---

**PROMPT FOR CLAUDE CODE:**

```
Test Snow-Flow MCP tools v1.4.39 systematically per category and report results.

## COMPREHENSIVE TESTING - Expected ~87% success rate

### 🐝 Snow-Flow Native AI Swarm Orchestration (14 tools)
1. mcp__snow-flow__swarm_init --topology "hierarchical" --maxAgents 5
2. mcp__snow-flow__agent_spawn --type "researcher" --name "Research Agent"
3. mcp__snow-flow__task_orchestrate --task "Analyze ServiceNow best practices"
4. mcp__snow-flow__swarm_status
5. mcp__snow-flow__memory_usage --action "store" --key "test_result" --value "success"
6. mcp__snow-flow__memory_search --pattern "test" --limit 10
7. mcp__snow-flow__neural_train --pattern_type "optimization" --training_data "sample data"
8. mcp__snow-flow__neural_patterns --action "analyze"
9. mcp__snow-flow__performance_report --format "summary"
10. mcp__snow-flow__neural_status --modelId "default-model"
11. mcp__snow-flow__token_usage --operation "all" --timeframe "24h"
12. mcp__snow-flow__memory_usage --action "retrieve" --key "test_result"
13. mcp__snow-flow__memory_usage --action "list" --namespace "default"
14. mcp__snow-flow__memory_usage --action "delete" --key "test_result"

### 🔄 Update Set Management (9 tools) - 100% WERKT
15. mcp__servicenow-update-set__snow_update_set_create --name "TEST-139: v1.4.39 Testing" --description "Testing all tools"
16. mcp__servicenow-update-set__snow_update_set_current
17. mcp__servicenow-update-set__snow_update_set_list --limit 5
18. mcp__servicenow-update-set__snow_update_set_add_artifact --type "widget" --sys_id "test123" --name "Test Widget"
19. mcp__servicenow-update-set__snow_update_set_preview
20. mcp__servicenow-update-set__snow_update_set_complete --notes "Testing completed"
21. mcp__servicenow-update-set__snow_update_set_export --output_path "./update_set_export.xml"
22. mcp__servicenow-update-set__snow_ensure_active_update_set --context "testing v1.4.39"
23. mcp__servicenow-deployment__snow_smart_update_set --detect_context true

### 🚀 Deployment Tools (10 tools)
24. mcp__servicenow-deployment__snow_auth_diagnostics
25. mcp__servicenow-deployment__snow_deployment_status --limit 5
26. mcp__servicenow-deployment__snow_validate_deployment --type "widget" --artifact {}
27. mcp__servicenow-deployment__snow_export_artifact --type "widget" --sys_id "test123"
28. mcp__servicenow-deployment__snow_validate_sysid --sys_id "test123" --table "sp_widget"
29. mcp__servicenow-deployment__snow_deployment_debug
30. mcp__servicenow-deployment__snow_preview_widget --template "<div>Test</div>"
31. mcp__servicenow-deployment__snow_widget_test --sys_id "test123"
32. mcp__servicenow-deployment__snow_deploy --type "widget" --instruction "Create test widget"
33. mcp__servicenow-deployment__snow_create_solution_package --name "Test Package" --artifacts []

### 📊 ServiceNow Operations (20 tools) - UITSTEKEND
34. mcp__servicenow-operations__snow_query_incidents --query "priority=1" --limit 5
35. mcp__servicenow-operations__snow_analyze_incident --incident_id "INC0000001"
36. mcp__servicenow-operations__snow_query_requests --query "active=true" --limit 5
37. mcp__servicenow-operations__snow_query_problems --query "active=true" --limit 5
38. mcp__servicenow-operations__snow_cmdb_search --query "server" --ci_type "server"
39. mcp__servicenow-operations__snow_user_lookup --identifier "admin"
40. mcp__servicenow-operations__snow_operational_metrics --timeframe "week"
41. mcp__servicenow-operations__snow_pattern__analysis --analysis_type "incident_patterns"
42. mcp__servicenow-operations__snow_knowledge_search --query "network issues"
43. mcp__servicenow-operations__snow_predictive__analysis --prediction_type "incident_volume"
44. mcp__servicenow-operations__snow_catalog_item_manager --action "list"
45. mcp__servicenow-operations__snow_catalog_item_search --query "iPhone"
46. mcp__servicenow-operations__snow_cleanup_test_artifacts --dry_run true
47. mcp__servicenow-operations__snow_create_user_group --name "Test Group v139"
48. mcp__servicenow-operations__snow_create_user --user_name "test.user.v139" --first_name "Test" --last_name "User" --email "test@example.com"
49. mcp__servicenow-operations__snow_assign_user_to_group --user "test.user.v139" --group "Test Group v139"
50. mcp__servicenow-operations__snow_list_group_members --group "Test Group v139"
51. mcp__servicenow-operations__snow_auto_resolve_incident --incident_id "INC0000001" --dry_run true
52. mcp__servicenow-operations__snow_remove_user_from_group --user "test.user.v139" --group "Test Group v139"
53. mcp__servicenow-operations__snow_catalog_item_manager --action "create" --name "Test Item v139"

### 🔧 Platform Development (9 tools) - PERFECT
54. mcp__servicenow-platform-development__snow_discover_platform_tables --category "all"
55. mcp__servicenow-platform-development__snow_discover_table_fields --tableName "incident"
56. mcp__servicenow-platform-development__snow_table_schema_discovery --tableName "incident"
57. mcp__servicenow-platform-development__snow_create_ui_page --name "test_page_v139" --title "Test Page" --html "<h1>Test</h1>"
58. mcp__servicenow-platform-development__snow_create_script_include --name "TestUtils139" --script "var TestUtils139 = Class.create();"
59. mcp__servicenow-platform-development__snow_create_business_rule --name "Test Rule v139" --tableName "incident" --script "// test" --when "before"
60. mcp__servicenow-platform-development__snow_create_client_script --name "Test Client v139" --tableName "incident" --script "// test" --type "onLoad"
61. mcp__servicenow-platform-development__snow_create_ui_policy --name "Test Policy v139" --tableName "incident" --condition "priority=1"
62. mcp__servicenow-platform-development__snow_create_ui_action --name "Test Action v139" --tableName "incident" --script "// test"

### 🔗 Integration (10 tools)
63. mcp__servicenow-integration__snow_discover_integration_endpoints --type "all"
64. mcp__servicenow-integration__snow_discover_data_sources
65. mcp__servicenow-integration__snow_create_rest_message --name "Test REST v139" --endpoint "https://api.example.com"
66. mcp__servicenow-integration__snow_create_rest_method --restMessageName "Test REST v139" --methodName "GET" --httpMethod "GET"
67. mcp__servicenow-integration__snow_create_transform_map --name "Test Transform v139" --sourceTable "import_set" --targetTable "incident"
68. mcp__servicenow-integration__snow_create_field_map --transformMapName "Test Transform v139" --sourceField "priority" --targetField "priority"
69. mcp__servicenow-integration__snow_create_import_set --name "test_import_v139" --label "Test Import"
70. mcp__servicenow-integration__snow_create_web_service --name "Test WS v139" --wsdlUrl "https://example.com/wsdl"
71. mcp__servicenow-integration__snow_create_email_config --name "Test Email v139" --serverType "SMTP" --serverName "smtp.example.com"
72. mcp__servicenow-integration__snow_test_integration --endpointName "Test REST v139"

### 📈 Reporting & Analytics (11 tools)
73. mcp__servicenow-reporting-analytics__snow_discover_reporting_tables
74. mcp__servicenow-reporting-analytics__snow_discover_report_fields --table "incident"
75. mcp__servicenow-reporting-analytics__snow_analyze_data_quality --table "incident"
76. mcp__servicenow-reporting-analytics__snow_create_report --name "Test Report v139" --table "incident" --fields ["number", "priority"]
77. mcp__servicenow-reporting-analytics__snow_create_dashboard --name "Test Dashboard v139" --widgets []
78. mcp__servicenow-reporting-analytics__snow_create_kpi --name "Test KPI v139" --table "incident" --metric "count" --aggregation "count"
79. mcp__servicenow-reporting-analytics__snow_create_data_visualization --name "Test Viz v139" --type "bar" --dataSource "incident"
80. mcp__servicenow-reporting-analytics__snow_create_performance_analytics --name "Test Analytics v139" --dataSource "incident" --metrics ["count"]
81. mcp__servicenow-reporting-analytics__snow_create_scheduled_report --reportName "Test Report v139" --schedule "daily" --recipients ["test@example.com"]
82. mcp__servicenow-reporting-analytics__snow_generate_insights --table "incident"
83. mcp__servicenow-reporting-analytics__snow_export_report_data --reportName "Test Report v139" --format "CSV"

### ⚙️ Automation (10 tools)
84. mcp__servicenow-automation__snow_discover_schedules
85. mcp__servicenow-automation__snow_discover_events
86. mcp__servicenow-automation__snow_discover_automation_jobs
87. mcp__servicenow-automation__snow_create_scheduled_job --name "Test Job v139" --script "gs.log('test');" --schedule "daily"
88. mcp__servicenow-automation__snow_create_notification --name "Test Notif v139" --table "incident" --when "inserted" --recipients "admin" --subject "Test" --message "Test"
89. mcp__servicenow-automation__snow_create_event_rule --name "Test Event v139" --eventName "incident.insert" --script "// test"
90. mcp__servicenow-automation__snow_create_sla_definition --name "Test SLA v139" --table "incident" --condition "priority=1" --duration "1 hour"
91. mcp__servicenow-automation__snow_create_escalation_rule --name "Test Escalation v139" --table "incident" --condition "priority=1" --escalationTime 60 --escalationScript "// test"
92. mcp__servicenow-automation__snow_create_workflow_activity --name "Test Activity v139" --workflowName "Test Workflow" --activityType "approval"
93. mcp__servicenow-automation__snow_test_scheduled_job --jobName "Test Job v139"

### 🛡️ Security & Compliance (10 tools)
94. mcp__servicenow-security-compliance__snow_discover_security_frameworks
95. mcp__servicenow-security-compliance__snow_discover_security_policies
96. mcp__servicenow-security-compliance__snow_create_security_policy --name "Test Policy v139" --type "access" --rules []
97. mcp__servicenow-security-compliance__snow_create_compliance_rule --name "Test Compliance v139" --framework "SOX" --requirement "Test" --validation "true"
98. mcp__servicenow-security-compliance__snow_create_audit_rule --name "Test Audit v139" --table "incident" --events ["create", "update"]
99. mcp__servicenow-security-compliance__snow_create_access_control --name "Test ACL v139" --table "incident" --operation "read"
100. mcp__servicenow-security-compliance__snow_create_data_policy --name "Test Data v139" --table "incident" --fields ["priority"] --classification "internal"
101. mcp__servicenow-security-compliance__snow_create_vulnerability_scan --name "Test Scan v139" --scope "application"
102. mcp__servicenow-security-compliance__snow_run_compliance_scan --framework "SOX"
103. mcp__servicenow-security-compliance__snow_security_risk_assessment --scope "instance"

## Expected Results Summary

✅ Working Categories (High Success):
- Update Set Management: 9/9 expected (100%)
- ServiceNow Operations: 18/20 expected (90%)
- Platform Development: 9/9 expected (100%)
- Integration: 8/10 expected (80%)
- Reporting & Analytics: 9/11 expected (82%)
- Automation: 8/10 expected (80%)

⚠️ Limited Categories (Permission Issues):
- Security & Compliance: 5/10 expected (50%)
- Deployment Tools: 8/10 expected (80%)

🔧 New/Updated:
- Snow-Flow Swarm: 12/14 expected (86%)
- neural_status & token_usage: Should work 100%

Total Expected: ~87/103 tools working (84.5%)

Report format:
- Per category: X/Y tools working
- Note which specific tools fail
- Highlight any 403/permission errors
- Track actual vs expected success rate
```
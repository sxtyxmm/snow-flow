#!/bin/bash
# Snow-Flow v1.4.39 Test Commands - Shell-Ready Format
# Run each command individually or source this file

echo "🐝 Testing Snow-Flow Native AI Swarm Orchestration (14 tools)"
mcp__snow-flow__swarm_init --topology hierarchical --maxAgents 5
mcp__snow-flow__agent_spawn --type researcher --name "Research Agent"
mcp__snow-flow__task_orchestrate --task "Analyze ServiceNow best practices"
mcp__snow-flow__swarm_status
mcp__snow-flow__memory_usage --action store --key test_result --value success
mcp__snow-flow__memory_search --pattern test --limit 10
mcp__snow-flow__neural_train --pattern_type optimization --training_data "sample data"
mcp__snow-flow__neural_patterns --action analyze
mcp__snow-flow__performance_report --format summary
mcp__snow-flow__neural_status --modelId default-model
mcp__snow-flow__token_usage --operation all --timeframe 24h
mcp__snow-flow__memory_usage --action retrieve --key test_result
mcp__snow-flow__memory_usage --action list --namespace default
mcp__snow-flow__memory_usage --action delete --key test_result

echo "🔄 Testing Update Set Management (9 tools)"
mcp__servicenow-update-set__snow_update_set_create --name "TEST-139: v1.4.39 Testing" --description "Testing all tools"
mcp__servicenow-update-set__snow_update_set_current
mcp__servicenow-update-set__snow_update_set_list --limit 5
mcp__servicenow-update-set__snow_update_set_add_artifact --type widget --sys_id test123 --name "Test Widget"
mcp__servicenow-update-set__snow_update_set_preview
mcp__servicenow-update-set__snow_update_set_complete --notes "Testing completed"
mcp__servicenow-update-set__snow_update_set_export --output_path "./update_set_export.xml"
mcp__servicenow-update-set__snow_ensure_active_update_set --context "testing v1.4.39"
mcp__servicenow-deployment__snow_smart_update_set --detect_context true

echo "🚀 Testing Deployment Tools (10 tools)"
mcp__servicenow-deployment__snow_auth_diagnostics
mcp__servicenow-deployment__snow_deployment_status --limit 5
mcp__servicenow-deployment__snow_validate_deployment --type widget --artifact {}
mcp__servicenow-deployment__snow_export_artifact --type widget --sys_id test123
mcp__servicenow-deployment__snow_validate_sysid --sys_id test123 --table sp_widget
mcp__servicenow-deployment__snow_deployment_debug
mcp__servicenow-deployment__snow_preview_widget --template "<div>Test</div>"
mcp__servicenow-deployment__snow_widget_test --sys_id test123
mcp__servicenow-deployment__snow_deploy --type widget --instruction "Create test widget"
mcp__servicenow-deployment__snow_create_solution_package --name "Test Package" --artifacts []

echo "📊 Testing ServiceNow Operations (20 tools)"
mcp__servicenow-operations__snow_query_incidents --query "priority=1" --limit 5
mcp__servicenow-operations__snow_analyze_incident --incident_id INC0000001
mcp__servicenow-operations__snow_query_requests --query "active=true" --limit 5
mcp__servicenow-operations__snow_query_problems --query "active=true" --limit 5
mcp__servicenow-operations__snow_cmdb_search --query server --ci_type server
mcp__servicenow-operations__snow_user_lookup --identifier admin
mcp__servicenow-operations__snow_operational_metrics --timeframe week
mcp__servicenow-operations__snow_pattern__analysis --analysis_type incident_patterns
mcp__servicenow-operations__snow_knowledge_search --query "network issues"
mcp__servicenow-operations__snow_predictive__analysis --prediction_type incident_volume
mcp__servicenow-operations__snow_catalog_item_manager --action list
mcp__servicenow-operations__snow_catalog_item_search --query iPhone
mcp__servicenow-operations__snow_cleanup_test_artifacts --dry_run true
mcp__servicenow-operations__snow_create_user_group --name "Test Group v139"
mcp__servicenow-operations__snow_create_user --user_name test.user.v139 --first_name Test --last_name User --email test@example.com
mcp__servicenow-operations__snow_assign_user_to_group --user test.user.v139 --group "Test Group v139"
mcp__servicenow-operations__snow_list_group_members --group "Test Group v139"
mcp__servicenow-operations__snow_auto_resolve_incident --incident_id INC0000001 --dry_run true
mcp__servicenow-operations__snow_remove_user_from_group --user test.user.v139 --group "Test Group v139"
mcp__servicenow-operations__snow_catalog_item_manager --action create --name "Test Item v139"

echo "🔧 Testing Platform Development (9 tools)"
mcp__servicenow-platform-development__snow_discover_platform_tables --category all
mcp__servicenow-platform-development__snow_discover_table_fields --tableName incident
mcp__servicenow-platform-development__snow_table_schema_discovery --tableName incident
mcp__servicenow-platform-development__snow_create_ui_page --name test_page_v139 --title "Test Page" --html "<h1>Test</h1>"
mcp__servicenow-platform-development__snow_create_script_include --name TestUtils139 --script "var TestUtils139 = Class.create();"
mcp__servicenow-platform-development__snow_create_business_rule --name "Test Rule v139" --tableName incident --script "// test" --when before
mcp__servicenow-platform-development__snow_create_client_script --name "Test Client v139" --tableName incident --script "// test" --type onLoad
mcp__servicenow-platform-development__snow_create_ui_policy --name "Test Policy v139" --tableName incident --condition "priority=1"
mcp__servicenow-platform-development__snow_create_ui_action --name "Test Action v139" --tableName incident --script "// test"

echo "🔗 Testing Integration (10 tools)"
mcp__servicenow-integration__snow_discover_integration_endpoints --type all
mcp__servicenow-integration__snow_discover_data_sources
mcp__servicenow-integration__snow_create_rest_message --name "Test REST v139" --endpoint "https://api.example.com"
mcp__servicenow-integration__snow_create_rest_method --restMessageName "Test REST v139" --methodName GET --httpMethod GET
mcp__servicenow-integration__snow_create_transform_map --name "Test Transform v139" --sourceTable import_set --targetTable incident
mcp__servicenow-integration__snow_create_field_map --transformMapName "Test Transform v139" --sourceField priority --targetField priority
mcp__servicenow-integration__snow_create_import_set --name test_import_v139 --label "Test Import"
mcp__servicenow-integration__snow_create_web_service --name "Test WS v139" --wsdlUrl "https://example.com/wsdl"
mcp__servicenow-integration__snow_create_email_config --name "Test Email v139" --serverType SMTP --serverName smtp.example.com
mcp__servicenow-integration__snow_test_integration --endpointName "Test REST v139"

echo "📈 Testing Reporting & Analytics (11 tools)"
mcp__servicenow-reporting-analytics__snow_discover_reporting_tables
mcp__servicenow-reporting-analytics__snow_discover_report_fields --table incident
mcp__servicenow-reporting-analytics__snow_analyze_data_quality --table incident
mcp__servicenow-reporting-analytics__snow_create_report --name "Test Report v139" --table incident --fields '["number", "priority"]'
mcp__servicenow-reporting-analytics__snow_create_dashboard --name "Test Dashboard v139" --widgets []
mcp__servicenow-reporting-analytics__snow_create_kpi --name "Test KPI v139" --table incident --metric count --aggregation count
mcp__servicenow-reporting-analytics__snow_create_data_visualization --name "Test Viz v139" --type bar --dataSource incident
mcp__servicenow-reporting-analytics__snow_create_performance_analytics --name "Test Analytics v139" --dataSource incident --metrics '["count"]'
mcp__servicenow-reporting-analytics__snow_create_scheduled_report --reportName "Test Report v139" --schedule daily --recipients '["test@example.com"]'
mcp__servicenow-reporting-analytics__snow_generate_insights --table incident
mcp__servicenow-reporting-analytics__snow_export_report_data --reportName "Test Report v139" --format CSV

echo "⚙️ Testing Automation (10 tools)"
mcp__servicenow-automation__snow_discover_schedules
mcp__servicenow-automation__snow_discover_events
mcp__servicenow-automation__snow_discover_automation_jobs
mcp__servicenow-automation__snow_create_scheduled_job --name "Test Job v139" --script "gs.log('test');" --schedule daily
mcp__servicenow-automation__snow_create_notification --name "Test Notif v139" --table incident --when inserted --recipients admin --subject Test --message Test
mcp__servicenow-automation__snow_create_event_rule --name "Test Event v139" --eventName incident.insert --script "// test"
mcp__servicenow-automation__snow_create_sla_definition --name "Test SLA v139" --table incident --condition "priority=1" --duration "1 hour"
mcp__servicenow-automation__snow_create_escalation_rule --name "Test Escalation v139" --table incident --condition "priority=1" --escalationTime 60 --escalationScript "// test"
mcp__servicenow-automation__snow_create_workflow_activity --name "Test Activity v139" --workflowName "Test Workflow" --activityType approval
mcp__servicenow-automation__snow_test_scheduled_job --jobName "Test Job v139"

echo "🛡️ Testing Security & Compliance (10 tools)"
mcp__servicenow-security-compliance__snow_discover_security_frameworks
mcp__servicenow-security-compliance__snow_discover_security_policies
mcp__servicenow-security-compliance__snow_create_security_policy --name "Test Policy v139" --type access --rules []
mcp__servicenow-security-compliance__snow_create_compliance_rule --name "Test Compliance v139" --framework SOX --requirement Test --validation true
mcp__servicenow-security-compliance__snow_create_audit_rule --name "Test Audit v139" --table incident --events '["create", "update"]'
mcp__servicenow-security-compliance__snow_create_access_control --name "Test ACL v139" --table incident --operation read
mcp__servicenow-security-compliance__snow_create_data_policy --name "Test Data v139" --table incident --fields '["priority"]' --classification internal
mcp__servicenow-security-compliance__snow_create_vulnerability_scan --name "Test Scan v139" --scope application
mcp__servicenow-security-compliance__snow_run_compliance_scan --framework SOX
mcp__servicenow-security-compliance__snow_security_risk_assessment --scope instance

echo "✅ Test commands ready! Total: 103 tools"
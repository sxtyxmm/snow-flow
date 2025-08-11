// Complete Snow-Flow MCP Tools Database
// 🏔️ 17 MCP Servers with 200+ Tools

const snowFlowTools = {
  "servicenow-deployment": {
    name: "🚀 Deployment Server",
    description: "Widget and artifact deployment with COHERENCE VALIDATION",
    badge: "40+ Tools",
    tools: [
      {
        name: "snow_deploy",
        description: "Universal deployment tool for creating NEW ServiceNow artifacts. Features automatic update set management, permission escalation, retry logic, and comprehensive error recovery."
      },
      {
        name: "snow_update", 
        description: "Updates existing ServiceNow artifacts (widgets, applications, etc.). Finds artifact by name or sys_id and modifies it."
      },
      {
        name: "snow_validate_deployment",
        description: "Validates deployment artifacts for compatibility, dependencies, and permissions before execution. Returns validation report with potential issues."
      },
      {
        name: "snow_rollback_deployment",
        description: "Performs safe rollback of a failed deployment to previous state. Tracks rollback history and provides recovery recommendations."
      },
      {
        name: "snow_deployment_status",
        description: "Retrieves comprehensive deployment status including active deployments, recent history, success rates, and performance metrics."
      },
      {
        name: "snow_export_artifact",
        description: "Exports ServiceNow artifacts (widgets, applications) to JSON/XML format for backup, version control, or migration purposes."
      },
      {
        name: "snow_import_artifact",
        description: "Imports previously exported artifacts from JSON/XML files into ServiceNow. Validates compatibility and handles dependencies automatically."
      },
      {
        name: "snow_clone_instance_artifact",
        description: "Clones artifacts directly between ServiceNow instances (dev→test→prod). Handles authentication, dependency resolution, and data migration."
      },
      {
        name: "snow_validate_sysid",
        description: "Validates sys_id existence and consistency across tables. Maintains artifact tracking for deployment integrity and rollback capabilities."
      },
      {
        name: "snow_deployment_debug",
        description: "Provides detailed debugging information including authentication status, permissions, active sessions, and recent deployment logs for troubleshooting."
      },
      {
        name: "snow_auth_diagnostics",
        description: "Performs comprehensive authentication and permission diagnostics. Tests OAuth tokens, API access, table permissions, and provides specific remediation steps."
      },
      {
        name: "snow_preview_widget",
        description: "Renders widget preview with test data for validation before deployment. Simulates Service Portal environment, checks dependencies, and validates data binding."
      },
      {
        name: "snow_widget_test",
        description: "Executes comprehensive widget testing with multiple data scenarios. Validates client/server scripts, API calls, dependencies, and generates coverage reports."
      },
      {
        name: "snow_create_solution_package",
        description: "Creates comprehensive solution packages containing multiple related artifacts (widgets, scripts, rules). Manages dependencies and generates deployment documentation."
      }
    ]
  },
  "servicenow-operations": {
    name: "⚙️ Operations Server",
    description: "Core ServiceNow operations - universal table queries and CRUD operations",
    badge: "30+ Tools",
    tools: [
      {
        name: "snow_query_table",
        description: "Universal table querying with advanced filtering, ordering, pagination, and field selection. Supports complex queries across any ServiceNow table."
      },
      {
        name: "snow_create_record",
        description: "Creates new records in any ServiceNow table with data validation, field mapping, and relationship management."
      },
      {
        name: "snow_update_record", 
        description: "Updates existing records with change tracking, conflict detection, and rollback capabilities."
      },
      {
        name: "snow_delete_record",
        description: "Safely deletes records with dependency checking, cascade options, and recovery mechanisms."
      },
      {
        name: "snow_get_by_sysid",
        description: "Retrieves specific records by sys_id with related data, field history, and reference resolution."
      },
      {
        name: "snow_discover_table_fields",
        description: "Discovers table schema including fields, types, references, and constraints for any ServiceNow table."
      },
      {
        name: "snow_create_incident",
        description: "Creates incidents with automatic categorization, priority assignment, and notification triggering."
      },
      {
        name: "snow_create_request",
        description: "Creates service requests with catalog item integration, approval workflows, and fulfillment tracking."
      },
      {
        name: "snow_create_problem",
        description: "Creates problem records with root cause analysis, related incident linking, and knowledge base integration."
      },
      {
        name: "snow_cmdb_search",
        description: "Advanced CMDB searches with relationship mapping, dependency analysis, and impact assessment."
      },
      {
        name: "snow_user_lookup",
        description: "User management with role assignments, group memberships, and access control validation."
      },
      {
        name: "snow_group_management",
        description: "Group operations including member management, role assignments, and hierarchy navigation."
      },
      {
        name: "snow_catalog_search",
        description: "Service catalog searches with availability checking, pricing, and ordering capabilities."
      },
      {
        name: "snow_knowledge_search",
        description: "Knowledge base searches with relevance scoring, article rating, and usage analytics."
      },
      {
        name: "snow_batch_operations",
        description: "Bulk operations for data migration, cleanup, and batch processing with progress tracking."
      }
    ]
  },
  "servicenow-automation": {
    name: "🤖 Automation Server", 
    description: "Script execution with output capture, scheduling, and system automation",
    badge: "25+ Tools",
    tools: [
      {
        name: "snow_execute_script_with_output",
        description: "Executes background scripts with full output capture including gs.print, gs.info, gs.warn, and gs.error messages. ES5 JavaScript only."
      },
      {
        name: "snow_get_script_output",
        description: "Retrieves execution history and output from previously run background scripts with filtering and search capabilities."
      },
      {
        name: "snow_execute_script_sync",
        description: "Synchronous script execution with immediate results, timeout protection, and error handling."
      },
      {
        name: "snow_get_logs",
        description: "Accesses system logs including application logs, error logs, and audit trails with advanced filtering."
      },
      {
        name: "snow_test_rest_connection",
        description: "Tests REST endpoint connectivity, authentication, and response validation with detailed diagnostics."
      },
      {
        name: "snow_trace_execution", 
        description: "Performance tracing for scripts and workflows with execution time analysis and bottleneck identification."
      },
      {
        name: "snow_schedule_job",
        description: "Creates and manages scheduled jobs with cron expressions, retry logic, and failure notifications."
      },
      {
        name: "snow_create_event",
        description: "Triggers system events and notifications with parameter passing and condition checking."
      },
      {
        name: "snow_create_notification",
        description: "Creates email notifications with template processing, recipient management, and delivery tracking."
      },
      {
        name: "snow_create_sla_definition",
        description: "Defines SLA rules with escalation paths, breach notifications, and performance tracking."
      },
      {
        name: "snow_workflow_management",
        description: "Workflow operations including execution tracking, state management, and activity monitoring."
      },
      {
        name: "snow_rest_message_test",
        description: "Comprehensive REST message testing with payload validation, authentication testing, and response analysis."
      }
    ]
  },
  "servicenow-platform-development": {
    name: "💻 Platform Development Server",
    description: "Platform artifact creation - scripts, rules, policies, and configurations",
    badge: "20+ Tools", 
    tools: [
      {
        name: "snow_create_script_include",
        description: "Creates reusable Script Includes with proper scoping, error handling, and documentation generation."
      },
      {
        name: "snow_create_business_rule",
        description: "Creates Business Rules with condition building, script generation, and execution timing optimization."
      },
      {
        name: "snow_create_client_script",
        description: "Creates Client Scripts with browser compatibility checking, ES5 validation, and performance optimization."
      },
      {
        name: "snow_create_ui_policy",
        description: "Creates UI Policies with field visibility, mandatory rules, and dynamic form behavior."
      },
      {
        name: "snow_create_ui_action",
        description: "Creates UI Actions with permission checking, condition evaluation, and script integration."
      },
      {
        name: "snow_create_ui_page",
        description: "Creates UI Pages with layout design, security validation, and responsive functionality."
      },
      {
        name: "snow_create_acl",
        description: "Creates Access Control Lists with role-based permissions, field-level security, and inheritance rules."
      },
      {
        name: "snow_create_dictionary_entry",
        description: "Creates dictionary entries with field definitions, validation rules, and reference configurations."
      },
      {
        name: "snow_create_table",
        description: "Creates new tables with proper naming conventions, field definitions, and relationship setup."
      },
      {
        name: "snow_create_catalog_item",
        description: "Creates service catalog items with variables, workflows, and fulfillment processes."
      }
    ]
  },
  "servicenow-integration": {
    name: "🔗 Integration Server",
    description: "REST/SOAP integrations, data imports, and external system connectivity", 
    badge: "15+ Tools",
    tools: [
      {
        name: "snow_create_rest_message",
        description: "Creates REST message configurations with authentication, headers, and endpoint management."
      },
      {
        name: "snow_create_soap_message", 
        description: "Creates SOAP web service integrations with WSDL processing and method generation."
      },
      {
        name: "snow_create_transform_map",
        description: "Creates data transformation maps for import set processing with field mapping and validation."
      },
      {
        name: "snow_create_import_set",
        description: "Manages import sets for data migration with error handling and progress tracking."
      },
      {
        name: "snow_test_web_service",
        description: "Tests web service connectivity and functionality with payload validation and response analysis."
      },
      {
        name: "snow_configure_email",
        description: "Configures email settings including SMTP, authentication, and delivery options."
      },
      {
        name: "snow_create_oauth_provider",
        description: "Creates OAuth providers for secure API access with token management and scope control."
      },
      {
        name: "snow_endpoint_discovery",
        description: "Discovers available endpoints and their capabilities with automatic documentation generation."
      },
      {
        name: "snow_integration_testing",
        description: "Comprehensive integration testing with load simulation, error injection, and performance analysis."
      }
    ]
  },
  "servicenow-system-properties": {
    name: "⚙️ System Properties Server",
    description: "Configuration management via ServiceNow system properties",
    badge: "10+ Tools",
    tools: [
      {
        name: "snow_property_get",
        description: "Retrieves system property values with inheritance checking and default value handling."
      },
      {
        name: "snow_property_set", 
        description: "Sets system property values with validation, type checking, and change tracking."
      },
      {
        name: "snow_property_list",
        description: "Lists properties by pattern matching with filtering, sorting, and categorization."
      },
      {
        name: "snow_property_delete",
        description: "Safely removes system properties with dependency checking and backup creation."
      },
      {
        name: "snow_property_bulk_update",
        description: "Bulk property operations for configuration management and environment setup."
      },
      {
        name: "snow_property_export",
        description: "Exports property configurations to JSON format for backup and version control."
      },
      {
        name: "snow_property_import", 
        description: "Imports property configurations from JSON with validation and conflict resolution."
      },
      {
        name: "snow_property_validate",
        description: "Validates property values against constraints and business rules."
      },
      {
        name: "snow_property_search",
        description: "Advanced property search with pattern matching and value filtering."
      }
    ]
  },
  "servicenow-update-set": {
    name: "📦 Update Set Server",
    description: "Change management and deployment with update set lifecycle",
    badge: "10+ Tools",
    tools: [
      {
        name: "snow_create_update_set",
        description: "Creates new update sets with automatic naming, description generation, and proper state management for change tracking."
      },
      {
        name: "snow_switch_update_set",
        description: "Switches active update set with validation and conflict detection. Ensures clean transitions between development phases."
      },
      {
        name: "snow_complete_update_set",
        description: "Marks update sets as complete with validation checks, dependency verification, and deployment readiness assessment."
      },
      {
        name: "snow_preview_update_set",
        description: "Previews update set changes including impact analysis, conflict detection, and rollback requirements before deployment."
      },
      {
        name: "snow_export_update_set",
        description: "Exports update sets to XML format with compression, metadata inclusion, and version control integration."
      },
      {
        name: "snow_import_update_set",
        description: "Imports update sets from XML files with dependency resolution, conflict handling, and rollback preparation."
      },
      {
        name: "snow_rollback_update_set",
        description: "Performs safe rollback of update sets with dependency tracking, data preservation, and system state restoration."
      }
    ]
  },
  "servicenow-development-assistant": {
    name: "🎯 Development Assistant Server",
    description: "Intelligent artifact search, editing, and development assistance",
    badge: "15+ Tools",
    tools: [
      {
        name: "snow_find_artifact",
        description: "Universal artifact finder with fuzzy matching, type filtering, and relationship discovery across all ServiceNow components."
      },
      {
        name: "snow_edit_artifact",
        description: "Intelligent artifact editing with change tracking, validation, and automatic backup creation for safe modifications."
      },
      {
        name: "snow_get_by_sysid",
        description: "Retrieves artifacts by sys_id with complete metadata, relationships, and usage analysis for comprehensive understanding."
      },
      {
        name: "snow_analyze_artifact",
        description: "Deep artifact analysis including dependencies, performance impact, security implications, and optimization opportunities."
      },
      {
        name: "snow_comprehensive_search",
        description: "Advanced search across all ServiceNow tables with relevance scoring, context awareness, and intelligent filtering."
      },
      {
        name: "snow_analyze_requirements",
        description: "Analyzes development requirements with feasibility assessment, resource estimation, and implementation roadmap generation."
      },
      {
        name: "snow_generate_code",
        description: "AI-powered code generation with ServiceNow best practices, ES5 compliance, and pattern recognition."
      },
      {
        name: "snow_suggest_pattern",
        description: "Recommends design patterns based on context, requirements, and ServiceNow architectural principles."
      },
      {
        name: "snow_review_code",
        description: "Comprehensive code review with security analysis, performance optimization, and maintainability scoring."
      },
      {
        name: "snow_optimize_performance",
        description: "Performance optimization recommendations with bottleneck identification and solution prioritization."
      }
    ]
  },
  "servicenow-security-compliance": {
    name: "🔒 Security & Compliance Server",
    description: "Security policy management and compliance auditing",
    badge: "15+ Tools",
    tools: [
      {
        name: "snow_create_security_policy",
        description: "Creates comprehensive security policies with role-based access controls, field encryption, and audit trail configuration."
      },
      {
        name: "snow_audit_compliance",
        description: "Performs SOX, GDPR, HIPAA compliance auditing with automated reporting and remediation recommendations."
      },
      {
        name: "snow_scan_vulnerabilities",
        description: "Security vulnerability scanning across scripts, integrations, and configurations with risk prioritization."
      },
      {
        name: "snow_assess_risk",
        description: "Risk assessment for changes and configurations with impact scoring and mitigation strategy recommendations."
      },
      {
        name: "snow_review_access_control",
        description: "Access Control List review with permission analysis, role optimization, and security gap identification."
      },
      {
        name: "snow_encrypt_fields",
        description: "Field-level encryption setup with key management, performance impact analysis, and compliance verification."
      },
      {
        name: "snow_configure_sso",
        description: "Single Sign-On configuration with SAML, OAuth integration, and security protocol optimization."
      },
      {
        name: "snow_audit_user_access",
        description: "User access auditing with role analysis, permission tracking, and compliance reporting."
      },
      {
        name: "snow_security_dashboard",
        description: "Security metrics dashboard with real-time threat monitoring and compliance status visualization."
      }
    ]
  },
  "servicenow-reporting-analytics": {
    name: "📊 Reporting & Analytics Server",
    description: "Advanced reporting and data visualization with KPI management",
    badge: "20+ Tools",
    tools: [
      {
        name: "snow_create_report",
        description: "Creates advanced reports with custom filters, aggregations, and interactive visualizations using real ServiceNow data."
      },
      {
        name: "snow_create_dashboard",
        description: "Builds comprehensive dashboards with real-time data, drill-down capabilities, and responsive design."
      },
      {
        name: "snow_define_kpi",
        description: "Defines Key Performance Indicators with thresholds, alerting, and automated tracking across business processes."
      },
      {
        name: "snow_schedule_report",
        description: "Schedules automated report delivery with customizable frequencies, formats, and recipient management."
      },
      {
        name: "snow_analyze_data_quality",
        description: "Data quality analysis with completeness scoring, consistency checking, and cleansing recommendations."
      },
      {
        name: "snow_create_chart",
        description: "Creates interactive charts with multiple visualization types, real-time updates, and export capabilities."
      },
      {
        name: "snow_trend_analysis",
        description: "Advanced trend analysis with pattern recognition, forecasting, and anomaly detection using statistical models."
      },
      {
        name: "snow_benchmark_performance",
        description: "Performance benchmarking against industry standards and historical data with improvement recommendations."
      },
      {
        name: "snow_export_analytics",
        description: "Exports analytics data in multiple formats (Excel, PDF, CSV) with customizable layouts and branding."
      },
      {
        name: "snow_real_time_metrics",
        description: "Real-time metrics monitoring with live updates, threshold alerting, and automatic refresh capabilities."
      }
    ]
  },
  "servicenow-machine-learning": {
    name: "🧠 Machine Learning Server",
    description: "AI/ML capabilities with TensorFlow.js and native ML integration",
    badge: "20+ Tools",
    tools: [
      {
        name: "ml_train_incident_classifier",
        description: "Train LSTM neural networks for incident classification with intelligent data selection and balanced datasets."
      },
      {
        name: "ml_predict_change_risk",
        description: "Predict change request risks using machine learning with confidence scoring and risk factor analysis."
      },
      {
        name: "ml_detect_anomalies",
        description: "Anomaly detection in system performance, user behavior, and data patterns using statistical models."
      },
      {
        name: "ml_forecast_incidents",
        description: "Incident volume forecasting with time series analysis, seasonality detection, and capacity planning."
      },
      {
        name: "ml_performance_analytics",
        description: "Integration with ServiceNow's native Performance Analytics ML for KPI forecasting and trend analysis."
      },
      {
        name: "ml_hybrid_recommendation",
        description: "Hybrid ML recommendations combining native ML with TensorFlow.js for optimal accuracy and performance."
      },
      {
        name: "ml_sentiment_analysis",
        description: "Text sentiment analysis for tickets, surveys, and feedback with emotion scoring and trend tracking."
      },
      {
        name: "ml_cluster_analysis",
        description: "Data clustering for incident categorization, user segmentation, and pattern discovery."
      },
      {
        name: "ml_natural_language",
        description: "Natural language processing for automated ticket routing, content extraction, and response generation."
      },
      {
        name: "ml_predictive_maintenance",
        description: "Predictive maintenance modeling for CMDB assets with failure prediction and maintenance scheduling."
      }
    ]
  },
  "servicenow-knowledge-catalog": {
    name: "📚 Knowledge & Catalog Server", 
    description: "Knowledge base and service catalog management",
    badge: "14+ Tools",
    tools: [
      {
        name: "snow_create_knowledge_article",
        description: "Creates knowledge articles with rich content formatting, approval workflows, and automatic categorization."
      },
      {
        name: "snow_search_knowledge",
        description: "Advanced knowledge base search with relevance scoring, content analysis, and usage analytics."
      },
      {
        name: "snow_create_catalog_item",
        description: "Creates service catalog items with variables, workflows, and approval processes for service delivery."
      },
      {
        name: "snow_create_catalog_variable",
        description: "Creates catalog variables with validation, dependencies, and dynamic behavior for enhanced user experience."
      },
      {
        name: "snow_create_catalog_ui_policy",
        description: "Creates UI policies for catalog items with field visibility, mandatory rules, and dynamic form behavior."
      },
      {
        name: "snow_order_catalog_item",
        description: "Processes catalog item orders with approval routing, fulfillment tracking, and status notifications."
      },
      {
        name: "snow_discover_catalogs",
        description: "Discovers available service catalogs with permissions, categories, and item availability analysis."
      },
      {
        name: "snow_knowledge_analytics",
        description: "Knowledge base analytics with usage patterns, content effectiveness, and improvement recommendations."
      },
      {
        name: "snow_catalog_analytics",
        description: "Service catalog analytics with ordering patterns, fulfillment metrics, and user satisfaction analysis."
      },
      {
        name: "snow_content_management",
        description: "Content lifecycle management with versioning, approval workflows, and automated archiving."
      }
    ]
  },
  "servicenow-change-virtualagent-pa": {
    name: "🔄 Change, Virtual Agent & PA Server",
    description: "Change management, Virtual Agent NLU, and Performance Analytics",
    badge: "19+ Tools", 
    tools: [
      {
        name: "snow_create_change_request",
        description: "Creates change requests with risk assessment, approval workflows, and automated scheduling."
      },
      {
        name: "snow_schedule_cab_meeting",
        description: "Schedules Change Advisory Board meetings with attendee management and agenda generation."
      },
      {
        name: "snow_assess_change_risk",
        description: "Assesses change risks with impact analysis, conflict detection, and rollback planning."
      },
      {
        name: "snow_create_va_topic",
        description: "Creates Virtual Agent topics with natural language understanding and response generation."
      },
      {
        name: "snow_train_va_model",
        description: "Trains Virtual Agent NLU models with intent recognition and entity extraction."
      },
      {
        name: "snow_send_va_message",
        description: "Sends Virtual Agent messages with context awareness and conversation flow management."
      },
      {
        name: "snow_create_pa_indicator",
        description: "Creates Performance Analytics indicators with data collection and threshold monitoring."
      },
      {
        name: "snow_create_pa_widget",
        description: "Creates PA dashboard widgets with real-time data visualization and interactive capabilities."
      },
      {
        name: "snow_get_pa_scores",
        description: "Retrieves PA performance scores with trend analysis and benchmark comparisons."
      },
      {
        name: "snow_pa_breakdown",
        description: "PA data breakdown analysis with drill-down capabilities and root cause identification."
      },
      {
        name: "snow_change_calendar",
        description: "Change calendar management with conflict detection, maintenance windows, and capacity planning."
      },
      {
        name: "snow_emergency_change",
        description: "Emergency change processing with expedited approval workflows and risk mitigation."
      }
    ]
  },
  "servicenow-flow-workspace-mobile": {
    name: "📱 Flow, Workspace & Mobile Server",
    description: "Flow Designer, Workspace configuration, and Mobile app management", 
    badge: "20+ Tools",
    tools: [
      {
        name: "snow_create_flow",
        description: "Creates Flow Designer flows with drag-and-drop interface integration and automated testing."
      },
      {
        name: "snow_create_flow_action",
        description: "Creates custom flow actions with input/output validation and error handling."
      },
      {
        name: "snow_test_flow",
        description: "Tests flows with multiple scenarios, data validation, and performance analysis."
      },
      {
        name: "snow_flow_execution_history",
        description: "Analyzes flow execution history with performance metrics and failure analysis."
      },
      {
        name: "snow_create_workspace",
        description: "Creates Agent Workspace configurations with role-based layouts and productivity features."
      },
      {
        name: "snow_workspace_analytics",
        description: "Workspace usage analytics with productivity metrics and user experience analysis."
      },
      {
        name: "snow_configure_mobile_app",
        description: "Configures ServiceNow mobile app with custom branding, features, and security settings."
      },
      {
        name: "snow_create_mobile_screen",
        description: "Creates mobile app screens with responsive design and native functionality."
      },
      {
        name: "snow_send_push_notification",
        description: "Sends push notifications with targeting, scheduling, and delivery tracking."
      },
      {
        name: "snow_configure_offline_sync",
        description: "Configures offline synchronization with data prioritization and conflict resolution."
      },
      {
        name: "snow_mobile_analytics",
        description: "Mobile app analytics with usage patterns, performance metrics, and user engagement analysis."
      },
      {
        name: "snow_workspace_optimization",
        description: "Workspace performance optimization with load time analysis and resource optimization."
      }
    ]
  },
  "servicenow-cmdb-event-hr-csm-devops": {
    name: "🗄️ CMDB, Event, HR, CSM & DevOps Server",
    description: "Configuration, Events, HR, Customer Service, DevOps integration",
    badge: "23+ Tools",
    tools: [
      {
        name: "snow_create_ci",
        description: "Creates Configuration Items with automated discovery, relationship mapping, and lifecycle management."
      },
      {
        name: "snow_create_ci_relationship",
        description: "Creates CI relationships with impact analysis, dependency mapping, and change propagation."
      },
      {
        name: "snow_run_discovery", 
        description: "Runs ServiceNow Discovery with credential management, scheduling, and results analysis."
      },
      {
        name: "snow_cmdb_health_check",
        description: "CMDB health assessment with data quality scoring, relationship validation, and cleansing recommendations."
      },
      {
        name: "snow_create_event",
        description: "Creates system events with correlation rules, severity assessment, and automated response triggers."
      },
      {
        name: "snow_event_correlation",
        description: "Event correlation analysis with pattern recognition, root cause identification, and noise reduction."
      },
      {
        name: "snow_create_hr_case",
        description: "Creates HR cases with automated routing, SLA tracking, and confidentiality controls."
      },
      {
        name: "snow_employee_onboarding",
        description: "Employee onboarding automation with task orchestration, access provisioning, and progress tracking."
      },
      {
        name: "snow_hr_analytics",
        description: "HR analytics with employee satisfaction, case resolution metrics, and trend analysis."
      },
      {
        name: "snow_create_customer_case",
        description: "Creates customer service cases with priority routing, escalation rules, and satisfaction tracking."
      },
      {
        name: "snow_customer_portal",
        description: "Customer portal configuration with self-service capabilities and knowledge integration."
      },
      {
        name: "snow_create_devops_pipeline",
        description: "Creates DevOps deployment pipelines with ServiceNow integration and automated testing."
      },
      {
        name: "snow_ci_impact_analysis", 
        description: "CI impact analysis with service mapping, business impact assessment, and change planning."
      },
      {
        name: "snow_asset_management",
        description: "IT asset management with lifecycle tracking, cost optimization, and compliance monitoring."
      }
    ]
  },
  "servicenow-advanced-features": {
    name: "⚡ Advanced Features Server",
    description: "Advanced optimization and analysis capabilities",
    badge: "14+ Tools",
    tools: [
      {
        name: "snow_batch_api",
        description: "Smart batch API operations with 80% API call reduction through intelligent query optimization and parallel execution."
      },
      {
        name: "snow_get_table_relationships",
        description: "Deep relationship discovery with visual Mermaid diagrams, impact analysis, and performance optimization recommendations."
      },
      {
        name: "snow_analyze_query",
        description: "Query performance analysis with bottleneck detection, index recommendations, and execution time prediction."
      },
      {
        name: "snow_analyze_field_usage",
        description: "Field usage intelligence with deprecation analysis, technical debt scoring, and optimization opportunities."
      },
      {
        name: "snow_create_migration_plan",
        description: "Automated migration planning with risk assessment, transformation scripts, and rollback strategies."
      },
      {
        name: "snow_analyze_table_deep",
        description: "Multi-dimensional table analysis including structure, data quality, performance, security, and compliance assessment."
      },
      {
        name: "snow_detect_code_patterns",
        description: "Advanced pattern recognition with anti-pattern detection, security scanning, and maintainability scoring."
      },
      {
        name: "snow_predict_change_impact",
        description: "AI-powered change impact prediction with risk assessment, dependency analysis, and confidence scoring."
      },
      {
        name: "snow_generate_documentation",
        description: "Intelligent documentation generation with multiple formats, relationship diagrams, and usage examples."
      },
      {
        name: "snow_refactor_code",
        description: "AI-driven code refactoring with performance optimization, security hardening, and preview validation."
      },
      {
        name: "snow_discover_process",
        description: "Process mining from event logs with variant analysis, bottleneck identification, and ROI calculation."
      },
      {
        name: "snow_analyze_workflow_execution",
        description: "Workflow execution analysis vs. designed processes with SLA monitoring and resource optimization."
      },
      {
        name: "snow_monitor_process",
        description: "Real-time process monitoring with anomaly detection, trend analysis, and predictive failure detection."
      }
    ]
  },
  "snow-flow-orchestration": {
    name: "👑 Orchestration Server",
    description: "Multi-agent coordination and task management",
    badge: "25+ Tools",
    tools: [
      {
        name: "swarm_init",
        description: "Initialize multi-agent swarms with strategy selection, coordination protocols, and performance monitoring."
      },
      {
        name: "agent_spawn",
        description: "Create specialized AI agents (researcher, coder, analyst, tester) with role-specific capabilities."
      },
      {
        name: "task_orchestrate",
        description: "Orchestrate complex multi-step tasks with dependency management and parallel execution."
      },
      {
        name: "memory_search",
        description: "Search persistent memory with semantic matching and context-aware retrieval."
      },
      {
        name: "memory_store",
        description: "Store data in persistent memory with versioning, tagging, and relationship mapping."
      },
      {
        name: "neural_train",
        description: "Train TensorFlow.js neural networks with distributed computing and model optimization."
      },
      {
        name: "performance_report",
        description: "Generate comprehensive performance reports with metrics, analysis, and optimization recommendations."
      },
      {
        name: "agent_coordinate",
        description: "Coordinate multiple agents with workload balancing, conflict resolution, and progress tracking."
      },
      {
        name: "task_queue_manage",
        description: "Advanced task queue management with priority scheduling and resource allocation."
      },
      {
        name: "swarm_monitor",
        description: "Real-time swarm monitoring with performance visualization and bottleneck identification."
      },
      {
        name: "workflow_optimize",
        description: "Workflow optimization with execution path analysis and performance tuning recommendations."
      },
      {
        name: "agent_analytics",
        description: "Agent performance analytics with productivity metrics and capability assessment."
      },
      {
        name: "collaboration_hub",
        description: "Multi-agent collaboration hub with communication protocols and shared workspace management."
      }
    ]
  }
};

// Export for use in website
if (typeof module !== 'undefined' && module.exports) {
  module.exports = snowFlowTools;
} else if (typeof window !== 'undefined') {
  window.snowFlowTools = snowFlowTools;
}
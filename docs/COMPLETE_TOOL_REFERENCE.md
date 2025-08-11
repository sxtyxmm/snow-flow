# Snow-Flow Complete Tool Reference

## All 180+ Tools with ServiceNow Tables

### Core Operations Tools (servicenow-operations)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_query_table | Universal table query | Any table |
| snow_create_record | Create record | Any table |
| snow_update_record | Update record | Any table |
| snow_delete_record | Delete record | Any table |
| snow_batch_update | Batch updates | Any table |
| snow_export_data | Export to CSV/JSON | Any table |
| snow_import_data | Import data | sys_import_set |
| snow_execute_script | Run server script | sys_script |
| snow_get_record_count | Count records | Any table |
| snow_duplicate_record | Clone record | Any table |
| snow_merge_records | Merge duplicates | Any table |
| snow_archive_records | Archive old data | Any table |
| snow_restore_record | Restore deleted | sys_audit_delete |
| snow_get_record_history | Get history | sys_audit |
| snow_validate_record | Validate data | Any table |

### Deployment Tools (servicenow-deployment)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_deploy | Universal deployment | Multiple |
| snow_create_widget | Create SP widget | sp_widget |
| snow_create_ui_page | Create UI page | sys_ui_page |
| snow_create_portal_page | Create portal page | sp_page |
| snow_create_portal | Create portal | sp_portal |
| snow_widget_dependency_scan | Scan dependencies | sp_dependency |
| snow_portal_theme_builder | Build theme | sp_theme |
| snow_widget_instance_create | Add to page | sp_instance |
| snow_create_ui_script | Create UI script | sys_ui_script |
| snow_create_style_sheet | Create CSS | sys_ui_style |
| snow_create_ui_macro | Create macro | sys_ui_macro |
| snow_create_content_block | Create content | sys_ui_content_block |
| snow_create_menu | Create menu | sys_ui_menu |
| snow_create_module | Create module | sys_app_module |
| snow_create_application_menu | Create app menu | sys_app_application |
| snow_widget_angular_provider | Angular provider | sp_angular_provider |
| snow_create_ui_action | Create UI action | sys_ui_action |
| snow_create_client_script | Create client script | sys_script_client |
| snow_create_ui_policy | Create UI policy | sys_ui_policy |
| snow_create_data_policy | Create data policy | sys_data_policy |

### Platform Development (servicenow-platform-development)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_table | Create table | sys_db_object |
| snow_create_field | Create field | sys_dictionary |
| snow_modify_field | Modify field | sys_dictionary |
| snow_delete_field | Delete field | sys_dictionary |
| snow_create_index | Create index | sys_db_index |
| snow_create_relationship | Create reference | sys_relationship |
| snow_create_choice_list | Create choices | sys_choice |
| snow_create_dictionary_override | Override field | sys_dictionary_override |
| snow_table_hierarchy | Get hierarchy | sys_db_object |
| snow_field_dependency_check | Check dependencies | sys_dictionary |
| snow_table_extension_create | Extend table | sys_db_object |
| snow_create_database_view | Create view | sys_db_view |

### Machine Learning (servicenow-machine-learning)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| ml_train_incident_classifier | Train classifier | Local model |
| ml_predict_incident | Predict incident | Local model |
| ml_train_change_predictor | Predict change risk | Local model |
| ml_train_anomaly_detector | Detect anomalies | Local model |
| ml_forecast_metrics | Time series forecast | Local model |
| ml_pattern_recognition | Find patterns | Local model |
| ml_sentiment_analysis | Analyze sentiment | Local model |
| ml_text_classification | Classify text | Local model |
| ml_clustering | Data clustering | Local model |
| ml_recommendation_engine | Recommendations | Local model |
| ml_performance_analytics | PA integration | pa_* tables |
| ml_predictive_intelligence | PI integration | ml_* tables |
| ml_agent_intelligence | Agent AI | ml_* tables |
| ml_hybrid_recommendation | Hybrid ML | Multiple |
| ml_model_management | Manage models | ml_model |

### Reporting & Analytics (servicenow-reporting-analytics)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_dashboard | Create dashboard | pa_dashboard |
| snow_create_report | Create report | sys_report |
| snow_create_pa_widget | PA widget | pa_widget |
| snow_create_report_source | Report source | sys_report_source |
| snow_create_metric_base | Metric definition | metric_definition |
| snow_create_indicator | PA indicator | pa_indicator |
| snow_create_breakdown | PA breakdown | pa_breakdown |
| snow_create_scorecard | Scorecard | pa_scorecard |
| snow_create_kpi | KPI | pa_kpi |
| snow_create_gauge | Gauge widget | sys_gauge |
| snow_create_chart | Chart | sys_report_chart |
| snow_create_pivot_table | Pivot table | sys_report_pivot |
| snow_create_calendar | Calendar view | sys_report_calendar |
| snow_create_map | Map view | sys_report_map |
| snow_create_timeline | Timeline | sys_report_timeline |
| snow_schedule_report | Schedule report | sys_report_schedule |
| snow_export_report | Export report | sys_report_export |
| snow_share_report | Share report | sys_report_share |

### Security & Compliance (servicenow-security-compliance)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_security_scan | Security scan | sys_security |
| snow_check_acl | Check ACL | sys_security_acl |
| snow_create_acl | Create ACL | sys_security_acl |
| snow_audit_compliance | Audit check | sys_audit |
| snow_create_security_rule | Security rule | sys_security_rule |
| snow_check_user_criteria | User criteria | sys_user_criteria |
| snow_create_role | Create role | sys_user_role |
| snow_create_group | Create group | sys_user_group |
| snow_password_policy | Password policy | sys_security_password |
| snow_encryption_context | Encryption | sys_encryption_context |
| snow_data_classification | Classify data | sys_data_classification |
| snow_privacy_assessment | Privacy check | sys_privacy |
| snow_vulnerability_scan | Vuln scan | sys_vulnerability |
| snow_compliance_report | Compliance report | sys_compliance |

### Update Set Management (servicenow-update-set)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_update_set_create | Create update set | sys_update_set |
| snow_update_set_switch | Switch current | sys_update_set |
| snow_update_set_retrieve | Get XML | sys_update_set |
| snow_update_set_validate | Validate | sys_update_set |
| snow_update_set_commit | Commit | sys_update_set |
| snow_update_set_back_out | Back out | sys_update_set |
| snow_update_set_preview | Preview | sys_update_preview |
| snow_update_set_merge | Merge sets | sys_update_set |
| snow_update_set_compare | Compare | sys_update_set |
| snow_update_set_export | Export | sys_update_set |

### Automation Tools (servicenow-automation)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_business_rule | Business rule | sys_script |
| snow_create_script_include | Script include | sys_script_include |
| snow_create_scheduled_job | Scheduled job | sysauto_script |
| snow_create_event | Create event | sysevent |
| snow_create_notification | Notification | sysevent_email_action |
| snow_create_email_template | Email template | sysevent_email_template |
| snow_create_sla | SLA definition | contract_sla |
| snow_create_workflow | Workflow | wf_workflow |
| snow_list_flows | List flows | sys_hub_flow |
| snow_execute_flow | Execute flow | sys_flow_context |
| snow_get_flow_execution_status | Flow execution status | sys_flow_context |
| snow_get_flow_execution_history | Flow execution history | sys_flow_context |
| snow_get_flow_details | Flow details | sys_hub_flow |
| snow_import_flow_from_xml | Import flow from XML | sys_import_set_row |
| snow_create_transform_map | Transform map | sys_transform_map |
| snow_create_import_set | Import set | sys_import_set |
| snow_create_data_source | Data source | sys_data_source |
| snow_create_escalation | Escalation | sys_escalation |
| snow_create_assignment_rule | Assignment rule | sys_assignment_rule |
| snow_discover_schedules | Find schedules | cmn_schedule |
| snow_discover_events | Find events | sysevent_register |
| snow_create_atf_test | ATF test | sys_atf_test |
| snow_create_atf_test_step | Test step | sys_atf_step |
| snow_execute_atf_test | Run test | sys_atf_test_result |
| snow_get_atf_results | Test results | sys_atf_test_result |
| snow_create_atf_test_suite | Test suite | sys_atf_test_suite |
| snow_discover_atf_tests | Find tests | sys_atf_test |

### Integration Tools (servicenow-integration)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_rest_message | REST message | sys_rest_message |
| snow_create_soap_message | SOAP message | sys_soap_message |
| snow_create_import_set | Import set | sys_import_set |
| snow_create_transform_map | Transform | sys_transform_map |
| snow_create_data_source | Data source | sys_data_source |
| snow_create_integration_hub | IH action | sys_hub_action |
| snow_create_api | Scripted API | sys_ws_definition |
| snow_create_oauth_provider | OAuth provider | oauth_provider |
| snow_create_jwt_provider | JWT provider | jwt_provider |
| snow_create_basic_auth | Basic auth | sys_basic_auth |

### Advanced Features (servicenow-advanced-features)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_batch_api | Batch operations | Multiple |
| snow_get_table_relationships | Relationships | sys_relationship |
| snow_analyze_query | Query analysis | sys_db_explain |
| snow_analyze_field_usage | Field usage | sys_dictionary |
| snow_create_migration_plan | Migration | sys_migration |
| snow_analyze_table_deep | Deep analysis | sys_db_object |
| snow_detect_code_patterns | Code patterns | sys_script |
| snow_predict_change_impact | Impact prediction | change_request |
| snow_generate_documentation | Auto docs | sys_documentation |
| snow_refactor_code | Refactor | sys_script |
| snow_discover_process | Process mining | sys_audit |
| snow_analyze_workflow_execution | Workflow analysis | wf_executing |
| snow_discover_cross_table_process | Cross-table | Multiple |
| snow_monitor_process | Monitor | sys_audit |
| snow_process_optimization | Optimize | Multiple |

### Performance Optimization (servicenow-performance-optimization)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_optimize_query | Query optimizer | sys_db_explain |
| snow_create_index | Create index | sys_db_index |
| snow_analyze_slow_queries | Slow queries | sys_db_slow_query |
| snow_cache_management | Cache control | sys_cache |
| snow_performance_diagnostic | Diagnostics | sys_performance |
| snow_table_rotation | Table rotation | sys_table_rotation |
| snow_archive_strategy | Archive plan | sys_archive |
| snow_compression_analysis | Compression | sys_compression |

### Process Intelligence (servicenow-process-intelligence)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_process_discovery | Discover process | sys_audit |
| snow_process_conformance | Conformance | sys_audit |
| snow_process_optimization | Optimize | sys_audit |
| snow_bottleneck_detection | Find bottlenecks | sys_audit |
| snow_process_simulation | Simulate | sys_audit |
| snow_process_prediction | Predict | sys_audit |
| snow_variant_analysis | Variants | sys_audit |
| snow_process_benchmark | Benchmark | sys_audit |
| snow_process_automation | Automate | sys_audit |
| snow_process_monitoring | Monitor | sys_audit |

### Snow-Flow Orchestration (snow-flow)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_flow_orchestrate | Orchestrate | Local |
| snow_flow_memory_store | Store memory | Local |
| snow_flow_memory_get | Get memory | Local |
| snow_flow_memory_list | List memory | Local |
| snow_flow_session_create | Create session | Local |
| snow_flow_session_resume | Resume session | Local |
| snow_flow_agent_spawn | Spawn agent | Local |
| snow_flow_agent_coordinate | Coordinate | Local |
| snow_flow_task_create | Create task | Local |
| snow_flow_task_execute | Execute task | Local |
| snow_flow_workflow_run | Run workflow | Local |
| snow_flow_batch_execute | Batch execute | Local |

## Summary Statistics

- **Total Tools:** 180+
- **MCP Servers:** 17
- **ServiceNow Tables Used:** 150+
- **API Endpoints:** All official ServiceNow REST APIs
- **Plugin Requirements:** Some features require PA, VA, HR, CSM, DevOps plugins
- **Authentication:** OAuth 2.0 for all operations
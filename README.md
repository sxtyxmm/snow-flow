# Snow-Flow: ServiceNow Development Platform

[![npm version](https://img.shields.io/npm/v/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/groeimetai/snow-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/groeimetai/snow-flow/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dm/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![Node Version](https://img.shields.io/node/v/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![ServiceNow Compatible](https://img.shields.io/badge/ServiceNow-Compatible-00A1E0?logo=servicenow)](https://www.servicenow.com)
[![GitHub Stars](https://img.shields.io/github/stars/groeimetai/snow-flow?style=social)](https://github.com/groeimetai/snow-flow)

Snow-Flow is an AI-powered development platform for ServiceNow that provides 180+ MCP tools and multi-agent coordination. It enables developers and administrators to interact with ServiceNow through natural language commands and automated workflows.

## Quick Start - One Command to Rule Them All

### 🚀 The Swarm Command
The simplest way to use Snow-Flow is with the swarm command. Just describe what you want in natural language:

```bash
# Basic usage - no flags needed!
snow-flow swarm "Create an incident dashboard with real-time updates"
```

This single command automatically:
- Spawns multiple specialized AI agents
- Discovers existing ServiceNow artifacts
- Creates complete working solutions
- Deploys directly to your instance
- Handles all technical complexity

More examples:
```bash
snow-flow swarm "Build employee onboarding workflow"
snow-flow swarm "Create knowledge base for IT support"
snow-flow swarm "Set up change management process"
snow-flow swarm "Analyze last month's incident patterns"
```

## Core Functionality

Snow-Flow connects directly to ServiceNow instances through OAuth 2.0 authentication and provides:

- Direct API integration with ServiceNow REST endpoints
- Multi-agent system with specialized agents for different tasks
- Natural language interface for ServiceNow operations
- Machine learning capabilities using TensorFlow.js
- Process automation and workflow optimization

## ServiceNow API Integration

### Authentication
Snow-Flow uses OAuth 2.0 for secure authentication with ServiceNow:

```bash
snow-flow auth login
# Opens ServiceNow OAuth consent screen
# Authenticate with ServiceNow credentials
# Token stored locally in ~/.snow-flow/auth.json
```

### Security
- OAuth 2.0 authentication protocol
- Respects ServiceNow ACLs and user permissions
- Local token storage with encryption
- No external data transmission
- All operations logged in ServiceNow audit trails

### Network Architecture
```
┌─────────────┐    OAuth 2.0 + REST APIs    ┌─────────────────┐
│  Snow-Flow  │ ◄─────────────────────────► │ Your ServiceNow │
│   (Local)   │      HTTPS Only              │    Instance     │
└─────────────┘                              └─────────────────┘
```

## Available Tools

Snow-Flow provides 180+ tools across 17 specialized MCP servers:

## Complete Tool Reference

### MCP Server Overview

| Server | Tools | Primary Focus |
|--------|-------|---------------|
| servicenow-operations | 15 | CRUD operations, data management |
| servicenow-deployment | 20 | Widget, portal, and application deployment |
| servicenow-platform-development | 12 | Table creation, field management |
| servicenow-machine-learning | 15 | Neural networks, predictions, anomaly detection |
| servicenow-reporting-analytics | 18 | Dashboards, reports, KPIs |
| servicenow-security-compliance | 14 | Security scanning, ACLs, compliance |
| servicenow-update-set | 10 | Change packaging, version control |
| servicenow-automation | 22 | Business rules, scheduled jobs, ATF testing |
| servicenow-integration | 10 | REST/SOAP, data import/export |
| servicenow-advanced-features | 15 | Process mining, advanced analytics |
| servicenow-knowledge-catalog | 15 | Knowledge management, service catalog |
| servicenow-change-virtualagent-pa | 19 | Change management, virtual agent, PA |
| servicenow-flow-workspace-mobile | 20 | Flow Designer, agent workspace, mobile |
| servicenow-cmdb-event-hr-csm-devops | 23 | CMDB, events, HR, CSM, DevOps |
| servicenow-performance-optimization | 8 | Query optimization, batch operations |
| servicenow-process-intelligence | 10 | Process mining and discovery |
| snow-flow | 12 | Orchestration, memory management |

### Detailed Tool Listing by Server

#### 1. ATF Testing Tools (servicenow-automation)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_atf_test | Create automated test | sys_atf_test |
| snow_create_atf_test_step | Add test steps | sys_atf_step |
| snow_execute_atf_test | Execute tests | sys_atf_test_result |
| snow_get_atf_results | Get test results | sys_atf_test_result |
| snow_create_atf_test_suite | Create test suite | sys_atf_test_suite |
| snow_discover_atf_tests | Find existing tests | sys_atf_test, sys_atf_test_suite |

#### 2. Knowledge Management (servicenow-knowledge-catalog)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_knowledge_article | Create KB article | kb_knowledge |
| snow_search_knowledge | Search articles | kb_knowledge |
| snow_update_knowledge_article | Update article | kb_knowledge |
| snow_retire_knowledge_article | Retire article | kb_knowledge |
| snow_create_knowledge_base | Create KB | kb_knowledge_base |
| snow_discover_knowledge_bases | List KBs | kb_knowledge_base |
| snow_get_knowledge_stats | Article statistics | kb_knowledge |
| snow_knowledge_feedback | Manage feedback | kb_feedback |

#### 3. Service Catalog (servicenow-knowledge-catalog)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_catalog_item | Create catalog item | sc_cat_item |
| snow_create_catalog_variable | Create variables | item_option_new |
| snow_create_catalog_ui_policy | Create UI policies | catalog_ui_policy |
| snow_order_catalog_item | Submit order | sc_req_item |
| snow_search_catalog | Search catalog | sc_cat_item |
| snow_get_catalog_item_details | Get item details | sc_cat_item |
| snow_discover_catalogs | List catalogs | sc_catalog |

#### 4. Change Management (servicenow-change-virtualagent-pa)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_change_request | Create change | change_request |
| snow_create_change_task | Create task | change_task |
| snow_get_change_request | Get change details | change_request |
| snow_update_change_state | Update state | change_request |
| snow_schedule_cab_meeting | Schedule CAB | cab_meeting |
| snow_search_change_requests | Search changes | change_request |

#### 5. Virtual Agent (servicenow-change-virtualagent-pa)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_va_topic | Create topic | sys_cs_topic |
| snow_create_va_topic_block | Create blocks | sys_cs_topic_block |
| snow_get_va_conversation | Get conversation | sys_cs_conversation |
| snow_send_va_message | Send message | sys_cs_conversation |
| snow_handoff_to_agent | Escalate to agent | sys_cs_conversation |
| snow_discover_va_topics | List topics | sys_cs_topic |

#### 6. Performance Analytics (servicenow-change-virtualagent-pa)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_pa_indicator | Create KPI | pa_indicators |
| snow_create_pa_widget | Create widget | pa_widgets |
| snow_create_pa_breakdown | Create breakdown | pa_breakdowns |
| snow_create_pa_threshold | Set threshold | pa_thresholds |
| snow_get_pa_scores | Get scores | pa_scores |
| snow_create_pa_target | Set target | pa_targets |
| snow_analyze_pa_trends | Analyze trends | pa_scores |

#### 7. Flow Designer (servicenow-flow-workspace-mobile)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_flow | Create flow | sys_hub_flow |
| snow_create_flow_action | Create action | sys_hub_action_instance |
| snow_create_subflow | Create subflow | sys_hub_sub_flow |
| snow_add_flow_trigger | Add trigger | sys_hub_trigger_instance |
| snow_publish_flow | Publish flow | sys_hub_flow |
| snow_test_flow | Test flow | sys_flow_context |
| snow_get_flow_execution_details | Get execution | sys_flow_context |

#### 8. Agent Workspace (servicenow-flow-workspace-mobile)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_workspace | Create workspace | sys_aw_workspace |
| snow_configure_workspace_tab | Configure tabs | sys_aw_tab |
| snow_add_workspace_list | Add lists | sys_aw_list |
| snow_create_workspace_form | Create forms | sys_aw_form |
| snow_configure_workspace_ui_action | Add UI actions | sys_aw_ui_action |
| snow_deploy_workspace | Deploy workspace | sys_aw_workspace |

#### 9. Mobile Platform (servicenow-flow-workspace-mobile)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_mobile_app_config | Configure app | sys_mobile_config |
| snow_configure_mobile_layout | Configure layout | sys_mobile_layout |
| snow_create_mobile_applet | Create applet | sys_mobile_applet |
| snow_configure_offline_tables | Offline sync | sys_mobile_offline |
| snow_set_mobile_security | Security settings | sys_mobile_security |
| snow_push_notification_config | Push notifications | sys_push_notification |
| snow_deploy_mobile_app | Deploy app | sys_mobile_deployment |

#### 10. CMDB & Discovery (servicenow-cmdb-event-hr-csm-devops)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_cmdb_ci | Create CI | cmdb_ci_* |
| snow_create_ci_relationship | Create relationship | cmdb_rel_ci |
| snow_discover_ci_dependencies | Find dependencies | cmdb_rel_ci |
| snow_run_discovery | Run discovery | discovery_status |
| snow_get_discovery_status | Get status | discovery_status |
| snow_import_cmdb_data | Import data | sys_import_set |

#### 11. Event Management (servicenow-cmdb-event-hr-csm-devops)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_event | Create event | em_event |
| snow_create_alert_rule | Create rule | em_alert_rule |
| snow_correlate_alerts | Correlate alerts | em_alert |
| snow_get_event_metrics | Get metrics | em_event |

#### 12. HR Service Delivery (servicenow-cmdb-event-hr-csm-devops)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_hr_case | Create HR case | sn_hr_core_case |
| snow_manage_onboarding | Onboarding | sn_hr_core_task |
| snow_manage_offboarding | Offboarding | sn_hr_core_task |
| snow_get_hr_analytics | HR analytics | sn_hr_core_case |

#### 13. Customer Service Management (servicenow-cmdb-event-hr-csm-devops)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_csm_case | Create case | sn_customerservice_case |
| snow_manage_customer_account | Manage account | sn_customerservice_account |
| snow_create_csm_communication | Communications | sn_customerservice_communication |
| snow_get_customer_satisfaction | Get CSAT | sn_customerservice_csat |

#### 14. DevOps (servicenow-cmdb-event-hr-csm-devops)
| Tool | Description | ServiceNow Table |
|------|-------------|------------------|
| snow_create_devops_pipeline | Create pipeline | sn_devops_pipeline |
| snow_track_deployment | Track deployment | sn_devops_deployment |
| snow_manage_devops_change | DevOps change | sn_devops_change |
| snow_get_velocity_metrics | Team velocity | sn_devops_velocity |
| snow_create_devops_artifact | Build artifacts | sn_devops_artifact |

### Table Operations
The universal `snow_query_table` tool works with all ServiceNow tables:

```javascript
// Query any table with optimized performance
snow_query_table({ 
  table: "incident",  // Works with any table
  query: "state!=7",
  fields: ["number", "short_description", "priority"],
  limit: 100
})

// Analytics mode - retrieve all records with minimal fields
snow_query_table({ 
  table: "incident",
  fields: ["sys_created_on", "priority"]  // Omit limit for all records
})

// Count-only mode for large datasets
snow_query_table({ 
  table: "sc_request",
  include_content: false  // Returns count only
})

// Server-side aggregation
snow_query_table({ 
  table: "change_request",
  group_by: "risk",
  order_by: "-count"
})
```

### Development Tools
- Widget creation and deployment
- Business rule development
- Script include management
- Flow Designer automation
- UI Page creation
- Portal configuration

### Service Management
- Incident management
- Change management with CAB scheduling
- Problem management
- Request fulfillment
- Knowledge management

### Enterprise APIs
- Performance Analytics (PA) with KPI management
- Virtual Agent configuration
- Agent Workspace customization
- Mobile platform deployment
- CMDB and Discovery
- Event Management
- HR Service Delivery
- Customer Service Management
- DevOps integration

### Machine Learning

Snow-Flow includes TensorFlow.js for neural network capabilities:

#### Incident Classification
Train LSTM networks on historical incident data:
```bash
snow-flow ml train-incident-classifier --sample-size 5000 --epochs 100
snow-flow ml classify-incident INC0123456
```

#### Change Risk Prediction
Analyze change requests to predict implementation risk:
```bash
snow-flow ml train-change-risk --include-failed-changes
snow-flow ml predict-change-risk CHG0123456
```

#### Time Series Forecasting
Predict future incident volumes:
```bash
snow-flow ml forecast-incidents --days 7 --category network
```

#### Anomaly Detection
Detect unusual patterns using autoencoder networks:
```bash
snow-flow ml detect-anomalies --metric incident_patterns --sensitivity 0.9
```

### ServiceNow Native ML Integration

Access ServiceNow's native ML capabilities when licensed:

#### Performance Analytics ML
```bash
snow-flow ml performance-analytics --indicator "Incident Resolution Time" --forecast-days 90
```

#### Predictive Intelligence
```bash
snow-flow ml predictive-intelligence --operation similar_incidents --incident INC0123456
```

#### Agent Intelligence
```bash
snow-flow ml agent-intelligence --task incident --id INC0123456 --auto-assign
```

Note: Native ML features require appropriate ServiceNow plugin licenses (PA, PI, Agent Intelligence).

## Multi-Agent System

Snow-Flow includes 38 specialized agents that work together:

### Agent Types
- **Architect**: System design and architecture planning
- **Developer**: Code generation and implementation
- **Tester**: Test creation and execution
- **Analyst**: Data analysis and reporting
- **Security**: Compliance and security validation
- **Optimizer**: Performance optimization
- **Documenter**: Documentation generation

### Coordination Modes
- **Hierarchical**: Top-down task delegation
- **Mesh**: Peer-to-peer collaboration
- **Swarm**: Distributed problem solving
- **Adaptive**: Dynamic reorganization based on task requirements

## Installation

### Prerequisites
- Node.js 18.0 or higher
- npm 8.0 or higher
- ServiceNow instance with admin access
- OAuth application configured in ServiceNow

### Install via npm
```bash
npm install -g snow-flow
```

### Initial Setup
```bash
# Initialize configuration
snow-flow init

# Configure authentication
snow-flow auth login

# Verify connection
snow-flow auth test
```

### Troubleshooting: Claude Code stdio Error

If you encounter a stdio/permissions error when using Snow-Flow with Claude Code:

```bash
# 1. Fix Claude permissions
claude --dangerously-skip-permissions

# 2. Activate Claude Code
# Open Claude Code and ensure it's activated with your account

# 3. Login to Claude
# Sign in with your Claude account in the Claude Code interface

# 4. Close Claude Code completely
# Make sure Claude Code is fully closed before proceeding

# 5. Now run Snow-Flow swarm
snow-flow swarm "Your ServiceNow task here"
```

This resolves the common "stdio" error that occurs when Claude Code doesn't have proper permissions to communicate with MCP servers.

## Usage Examples

### Swarm Command (Recommended)
```bash
# The simplest way - just describe what you want!
snow-flow swarm "Create incident management dashboard"

# No flags needed for basic usage
snow-flow swarm "Build service catalog for laptop requests"

# Advanced usage with optional flags
snow-flow swarm "Optimize incident resolution process" --monitor --parallel
```

### Natural Language Commands
```bash
# Create an incident dashboard
snow-flow sparc "Create incident management dashboard with SLA tracking"

# Build a workflow
snow-flow sparc "Create employee onboarding workflow with approval steps"

# Analyze data
snow-flow sparc "Analyze incident resolution patterns from last quarter"
```

### Direct Tool Usage
```bash
# Query incidents
snow-flow query --table incident --limit 10

# Create a widget
snow-flow deploy widget --name "SLA Dashboard" --template dashboard

# Generate documentation
snow-flow generate docs --scope "incident_management"
```

### Advanced Swarm Options
```bash
# With specific strategy
snow-flow swarm "Build complete HR service portal" \
  --strategy development \
  --mode hierarchical \
  --max-agents 8

# Parallel analysis
snow-flow swarm "Analyze system performance bottlenecks" \
  --strategy analysis \
  --mode mesh \
  --parallel

# With monitoring
snow-flow swarm "Deploy production changes" \
  --monitor \
  --auto-rollback
```

## Configuration

Configuration file location: `~/.snow-flow/.env`

### Required Settings
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
```

### Optional Settings
```env
# Timeout configuration (milliseconds)
# SNOW_FLOW_INIT_TIMEOUT=30000
# SNOW_FLOW_OPERATION_TIMEOUT=60000
# SNOW_FLOW_MEMORY_TIMEOUT=5000

# Agent configuration
SNOW_FLOW_MAX_AGENTS=10
SNOW_FLOW_AGENT_MODE=hierarchical

# ML configuration
SNOW_FLOW_ML_ENABLED=true
SNOW_FLOW_ML_MODEL_PATH=./models
```

## Project Structure
```
snow-flow/
├── src/                 # Source code
│   ├── agents/         # Agent implementations
│   ├── mcp/           # MCP server implementations
│   ├── utils/         # Utility functions
│   └── services/      # Service layer
├── dist/               # Compiled JavaScript
├── memory/             # Persistent storage
├── models/             # ML models
└── tests/              # Test suite
```

## Documentation

- [API Reference](docs/api.md)
- [Agent Documentation](docs/agents.md)
- [MCP Tools Reference](docs/tools.md)
- [ML Capabilities](docs/ml.md)
- [Configuration Guide](docs/configuration.md)

## Contributing

Contributions are welcome. Please read the [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- GitHub Issues: [github.com/groeimetai/snow-flow/issues](https://github.com/groeimetai/snow-flow/issues)
- Documentation: [github.com/groeimetai/snow-flow/wiki](https://github.com/groeimetai/snow-flow/wiki)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ServiceNow for the comprehensive REST API
- TensorFlow.js for machine learning capabilities
- Model Context Protocol (MCP) for tool orchestration
# ServiceNow MCP Servers Documentation

## Overview

The ServiceNow Multi-Agent system includes **11 specialized MCP servers** that provide comprehensive coverage for ServiceNow development, operations, and management. Each server focuses on specific aspects of ServiceNow automation and integrates seamlessly with the snow-flow CLI and Claude Code.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ServiceNow Multi-Agent MCP System            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Deployment     │  │  Flow Composer  │  │  Intelligent    │ │
│  │  MCP Server     │  │  MCP Server     │  │  MCP Server     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Update Set     │  │  Graph Memory   │  │  Operations     │ │
│  │  MCP Server     │  │  MCP Server     │  │  MCP Server     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Platform Dev   │  │  Integration    │  │  Automation     │ │
│  │  MCP Server     │  │  MCP Server     │  │  MCP Server     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │  Security &     │  │  Reporting &    │                     │
│  │  Compliance     │  │  Analytics      │                     │
│  │  MCP Server     │  │  MCP Server     │                     │
│  └─────────────────┘  └─────────────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│               Centralized Configuration & Auth                  │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  MCPConfig      │              │  MCPAuth        │          │
│  │  Manager        │              │  Middleware     │          │
│  └─────────────────┘              └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## MCP Server Details

### 1. ServiceNow Deployment MCP
**Purpose**: Autonomous deployment of ServiceNow artifacts with full lifecycle management

**Key Features**:
- **Autonomous Widget Deployment**: Complete widget creation with HTML, CSS, client/server scripts
- **Flow Deployment**: End-to-end flow creation with dependencies
- **Application Deployment**: Scoped application management
- **Update Set Management**: Automated change tracking
- **Deployment Validation**: Pre-deployment checks and validation
- **Rollback capabilities**: Safe deployment rollback

**Tools**:
- `snow_deploy_widget` - Deploy complete widgets to ServiceNow
- `snow_deploy_flow` - Deploy flows with linked artifacts
- `snow_deploy_application` - Deploy scoped applications
- `snow_deploy_update_set` - Create and populate update sets
- `snow_validate_deployment` - Validate before deployment
- `snow_rollback_deployment` - Rollback deployments
- `snow_deployment_status` - Check deployment history
- `snow_export_artifact` - Export artifacts for backup
- `snow_import_artifact` - Import artifacts from files
- `snow_clone_instance_artifact` - Clone between instances

### 2. ServiceNow Flow Composer MCP
**Purpose**: Natural language flow creation with intelligent artifact discovery

**Key Features**:
- **Natural Language Processing**: Create flows from plain language instructions
- **Intelligent Artifact Discovery**: Automatically find and link required artifacts
- **Missing Component Creation**: Create missing dependencies automatically
- **Flow Structure Optimization**: Optimize flow performance and structure
- **Real-time Deployment**: Immediate deployment with feedback

**Tools**:
- `snow_create_flow` - Create flows from natural language
- `snow_analyze_flow_instruction` - Analyze and understand requirements
- `snow_discover_flow_artifacts` - Find required artifacts
- `snow_preview_flow_structure` - Preview flow before deployment
- `snow_deploy_composed_flow` - Deploy composed flows

### 3. ServiceNow Intelligent MCP
**Purpose**: AI-powered artifact discovery and modification

**Key Features**:
- **Natural Language Search**: Find artifacts using plain language
- **Intelligent Editing**: Modify artifacts with natural language instructions
- **Deep Analysis**: Comprehensive artifact analysis with indexing
- **Memory-based Search**: Search previously indexed artifacts
- **Comprehensive Multi-table Search**: Search across all ServiceNow tables

**Tools**:
- `snow_find_artifact` - Natural language artifact discovery
- `snow_edit_artifact` - Edit artifacts with natural language
- `snow_analyze_artifact` - Deep artifact analysis
- `snow_memory_search` - Search indexed artifacts
- `snow_comprehensive_search` - Multi-table search

### 4. ServiceNow Update Set MCP
**Purpose**: Professional update set management and change tracking

**Key Features**:
- **Automated Update Set Creation**: Create update sets for user stories
- **Session Management**: Switch between different update sets
- **Artifact Tracking**: Track all changes in update sets
- **Change Preview**: Preview changes before completion
- **XML Export**: Export update sets for deployment

**Tools**:
- `snow_update_set_create` - Create update sets
- `snow_update_set_switch` - Switch active update sets
- `snow_update_set_current` - Get current update set
- `snow_update_set_list` - List all update sets
- `snow_update_set_complete` - Complete update sets
- `snow_update_set_add_artifact` - Track artifacts
- `snow_update_set_preview` - Preview changes
- `snow_update_set_export` - Export as XML

### 5. ServiceNow Graph Memory MCP
**Purpose**: Neo4j-based intelligent memory system for artifact relationships

**Key Features**:
- **Relationship Mapping**: Map dependencies between artifacts
- **Impact Analysis**: Understand change impact before modifications
- **Pattern Recognition**: Identify common patterns and best practices
- **Graph Visualization**: Generate visualization queries
- **Knowledge Export**: Export learned patterns

**Tools**:
- `snow_graph_index_artifact` - Index artifacts with relationships
- `snow_graph_find_related` - Find related artifacts
- `snow_graph_analyze_impact` - Analyze change impact
- `snow_graph_suggest_artifacts` - AI-powered suggestions
- `snow_graph_pattern_analysis` - Pattern recognition
- `snow_graph_visualize` - Graph visualization
- `snow_graph_export_knowledge` - Export knowledge

### 6. ServiceNow Operations MCP
**Purpose**: Operational queries and ServiceNow management

**Key Features**:
- **Incident Management**: Create and manage incidents
- **Request Management**: Handle service requests
- **Problem Management**: Track and resolve problems
- **CMDB Operations**: Configuration management
- **User Management**: User and group operations
- **Reporting**: Generate operational reports

**Tools**:
- Basic ServiceNow CRUD operations
- Incident lifecycle management
- Request processing
- Problem tracking
- CMDB queries
- User management
- Operational reporting

### 7. ServiceNow Platform Development MCP (NEW!)
**Purpose**: Comprehensive platform development with UI, scripting, and platform customization

**Key Features**:
- **UI Development**: UI Pages, UI Scripts, UI Policies, UI Actions with dynamic discovery
- **Script Management**: Script Includes, Business Rules, Client Scripts with validation
- **Platform Customization**: Dynamic table and field discovery for all platform artifacts
- **NO HARDCODED VALUES**: All tables, fields, and configurations discovered dynamically
- **Automatic Discovery**: Intelligent discovery of platform development artifacts

**Tools**:
- `snow_create_ui_page` - Create UI Pages with dynamic field discovery
- `snow_create_ui_script` - Create UI Scripts with validation
- `snow_create_ui_policy` - Create UI Policies with dynamic field discovery
- `snow_create_ui_action` - Create UI Actions with dynamic table discovery
- `snow_create_script_include` - Create Script Includes with API discovery
- `snow_create_business_rule` - Create Business Rules with dynamic table discovery
- `snow_create_client_script` - Create Client Scripts with form discovery
- `snow_discover_platform_tables` - Discover all platform development tables
- `snow_discover_ui_components` - Discover UI components and their relationships
- `snow_discover_script_apis` - Discover available script APIs and methods

### 8. ServiceNow Integration MCP (NEW!)
**Purpose**: External system integration with REST, SOAP, and data transformation

**Key Features**:
- **REST Integration**: REST Messages and Methods with dynamic authentication discovery
- **SOAP Integration**: Web Services with dynamic WSDL discovery
- **Data Transformation**: Transform Maps and Field Maps with dynamic field discovery
- **Import/Export**: Import Sets with dynamic schema discovery
- **Email Integration**: Email configurations with dynamic server discovery
- **NO HARDCODED VALUES**: All endpoints, auth types, and configurations discovered dynamically

**Tools**:
- `snow_create_rest_message` - Create REST Messages with dynamic auth discovery
- `snow_create_rest_method` - Create REST Methods with dynamic parameter discovery
- `snow_create_transform_map` - Create Transform Maps with dynamic table discovery
- `snow_create_field_map` - Create Field Maps with dynamic field validation
- `snow_create_import_set` - Create Import Sets with dynamic schema discovery
- `snow_create_web_service` - Create Web Services with dynamic WSDL discovery
- `snow_create_email_config` - Create Email Configurations with dynamic server discovery
- `snow_discover_integration_endpoints` - Discover all integration endpoints
- `snow_test_integration` - Test integration endpoints with validation
- `snow_discover_data_sources` - Discover all available data sources

### 9. ServiceNow Automation MCP (NEW!)
**Purpose**: Automated processes, scheduling, and event-driven workflows

**Key Features**:
- **Scheduled Jobs**: Scheduled Jobs with dynamic timezone and schedule discovery
- **Event Management**: Event Rules and Notifications with dynamic event discovery
- **SLA Management**: SLA Definitions with dynamic schedule discovery
- **Workflow Automation**: Escalation Rules and Workflow Activities with dynamic discovery
- **Testing & Monitoring**: Job testing and automation discovery
- **NO HARDCODED VALUES**: All schedules, events, and configurations discovered dynamically

**Tools**:
- `snow_create_scheduled_job` - Create Scheduled Jobs with dynamic schedule discovery
- `snow_create_event_rule` - Create Event Rules with dynamic event discovery
- `snow_create_notification` - Create Notifications with dynamic template discovery
- `snow_create_sla_definition` - Create SLA Definitions with dynamic field discovery
- `snow_create_escalation_rule` - Create Escalation Rules with dynamic discovery
- `snow_create_workflow_activity` - Create Workflow Activities with dynamic discovery
- `snow_discover_schedules` - Discover all available schedules dynamically
- `snow_discover_events` - Discover all available events dynamically
- `snow_discover_automation_jobs` - Discover all automation jobs dynamically
- `snow_test_scheduled_job` - Test scheduled job execution

### 10. ServiceNow Security & Compliance MCP (NEW!)
**Purpose**: Security policies, compliance rules, and audit operations

**Key Features**:
- **Security Policies**: Security policies with dynamic rule discovery
- **Compliance Management**: Compliance rules with dynamic framework discovery
- **Audit Controls**: Audit rules with dynamic event discovery
- **Access Control**: Access control with dynamic role discovery
- **Data Protection**: Data policies with dynamic field discovery
- **Vulnerability Management**: Vulnerability scans with dynamic discovery
- **NO HARDCODED VALUES**: All security configurations discovered dynamically

**Tools**:
- `snow_create_security_policy` - Create Security Policies with dynamic rule discovery
- `snow_create_compliance_rule` - Create Compliance Rules with dynamic framework discovery
- `snow_create_audit_rule` - Create Audit Rules with dynamic event discovery
- `snow_create_access_control` - Create Access Controls with dynamic role discovery
- `snow_create_data_policy` - Create Data Policies with dynamic field discovery
- `snow_create_vulnerability_scan` - Create Vulnerability Scans with dynamic discovery
- `snow_discover_security_frameworks` - Discover available security frameworks
- `snow_discover_security_policies` - Discover existing security policies
- `snow_run_compliance_scan` - Run compliance scans with dynamic rule discovery
- `snow_audit_trail_analysis` - Analyze audit trails for security incidents
- `snow_security_risk_assessment` - Perform security risk assessments

### 11. ServiceNow Reporting & Analytics MCP (NEW!)
**Purpose**: Reports, dashboards, and analytics operations

**Key Features**:
- **Report Creation**: Reports with dynamic table and field discovery
- **Dashboard Management**: Dashboards with dynamic widget discovery
- **KPI Tracking**: KPIs with dynamic metric discovery
- **Data Visualization**: Charts with dynamic type discovery
- **Performance Analytics**: Performance analytics with dynamic metric discovery
- **Scheduled Reporting**: Scheduled reports with dynamic delivery discovery
- **NO HARDCODED VALUES**: All reporting configurations discovered dynamically

**Tools**:
- `snow_create_report` - Create Reports with dynamic table and field discovery
- `snow_create_dashboard` - Create Dashboards with dynamic widget discovery
- `snow_create_kpi` - Create KPIs with dynamic metric discovery
- `snow_create_data_visualization` - Create Data Visualizations with dynamic chart discovery
- `snow_create_performance_analytics` - Create Performance Analytics with dynamic metric discovery
- `snow_create_scheduled_report` - Create Scheduled Reports with dynamic delivery discovery
- `snow_discover_reporting_tables` - Discover all tables available for reporting
- `snow_discover_report_fields` - Discover available fields for reporting
- `snow_analyze_data_quality` - Analyze data quality for reporting
- `snow_generate_insights` - Generate data insights and recommendations
- `snow_export_report_data` - Export report data in various formats

## Configuration Management

### Environment Variables

```bash
# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret
SERVICENOW_OAUTH_REDIRECT_URI=http://localhost:8080/auth/callback

# Neo4j Configuration (for Graph Memory)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Memory Configuration
MEMORY_PROVIDER=file  # file | neo4j | redis
MEMORY_PATH=.snow-flow/memory
MEMORY_MAX_SIZE=1000
MEMORY_TTL=86400

# Performance Configuration
CONNECTION_POOL_SIZE=10
REQUEST_TIMEOUT=30000
RETRY_ATTEMPTS=3
CACHE_ENABLED=true
CACHE_TTL=300

# Logging Configuration
LOG_LEVEL=info  # debug | info | warn | error
ENABLE_FILE_LOGGING=false
LOG_PATH=.snow-flow/logs
```

### Configuration File

Create `.snow-flow/config.json` for advanced configuration:

```json
{
  "servicenow": {
    "instanceUrl": "https://your-instance.service-now.com",
    "maxRetries": 3,
    "timeout": 30000
  },
  "neo4j": {
    "uri": "bolt://localhost:7687",
    "username": "neo4j",
    "password": "your-password",
    "database": "neo4j"
  },
  "memory": {
    "provider": "file",
    "path": ".snow-flow/memory",
    "maxSize": 1000,
    "ttl": 86400
  },
  "performance": {
    "connectionPoolSize": 10,
    "requestTimeout": 30000,
    "retryAttempts": 3,
    "cacheEnabled": true,
    "cacheTtl": 300
  },
  "logging": {
    "level": "info",
    "enableFileLogging": false,
    "logPath": ".snow-flow/logs"
  }
}
```

## Integration with Snow-Flow

### Authentication

All MCP servers use centralized OAuth authentication:

```bash
# Authenticate with ServiceNow
snow-flow auth login

# Check authentication status
snow-flow auth status
```

### Using MCP Servers

MCP servers integrate seamlessly with snow-flow commands:

```bash
# Start all MCP servers
snow-flow mcp start

# Deploy a widget using natural language
snow-flow swarm "Create a widget that shows incident statistics"

# Create a flow using natural language
snow-flow swarm "Create a flow that approves iPhone requests"

# Find and edit artifacts
snow-flow swarm "Find the incident widget and add a new field"
```

### Swarm Integration

MCP servers enhance multi-agent swarms:

```bash
# Deploy complex solutions
snow-flow swarm "Build a complete incident management dashboard with widgets, flows, and reports"

# Analyze and optimize existing artifacts
snow-flow swarm "Analyze all incident-related artifacts and suggest improvements"

# Create integrated solutions
snow-flow swarm "Create a service catalog item with approval workflow and notifications"
```

## Best Practices

### 1. Configuration Management
- Use environment variables for sensitive data
- Use configuration files for complex settings
- Validate configuration before starting MCP servers

### 2. Authentication
- Always authenticate before using MCP servers
- Monitor authentication status
- Handle authentication errors gracefully

### 3. Update Set Management
- Always create update sets for development work
- Use descriptive update set names
- Track all artifacts in update sets

### 4. Graph Memory Usage
- Index important artifacts for better discovery
- Use impact analysis before making changes
- Leverage pattern recognition for best practices

### 5. Error Handling
- Monitor MCP server logs
- Use retry mechanisms for transient failures
- Implement fallback strategies

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check ServiceNow credentials
   - Verify OAuth configuration
   - Re-authenticate if needed

2. **Neo4j Connection Issues**
   - Verify Neo4j is running
   - Check connection credentials
   - Ensure database is accessible

3. **Memory Issues**
   - Check memory provider configuration
   - Verify file system permissions
   - Monitor memory usage

4. **Performance Issues**
   - Adjust connection pool size
   - Enable caching
   - Optimize query patterns

### Debug Mode

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug snow-flow mcp start
```

## Advanced Features

### 1. Hot Configuration Reloading
MCP servers support hot configuration reloading without restart

### 2. Multiple Instance Support
Configure multiple ServiceNow instances with different credentials

### 3. Advanced Caching
Intelligent caching of ServiceNow data for better performance

### 4. Pattern Learning
Graph Memory MCP learns from usage patterns to improve suggestions

### 5. Autonomous Error Recovery
Automatic retry and recovery mechanisms for transient failures

## Monitoring and Observability

### Metrics
- Request/response times
- Success/failure rates
- Authentication status
- Memory usage
- Cache hit rates

### Logging
- Structured logging with timestamps
- Configurable log levels
- File-based logging option
- Error tracking and reporting

### Health Checks
- MCP server health status
- ServiceNow connectivity
- Neo4j connectivity
- Memory system status

## Security Considerations

### Authentication
- OAuth 2.0 with PKCE for secure authentication
- Token refresh mechanisms
- Secure credential storage

### Data Protection
- Encrypted communication with ServiceNow
- Secure credential management
- Audit logging of all operations

### Access Control
- Role-based access through ServiceNow
- Configurable operation permissions
- Update set-based change tracking

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: Performance analytics and insights
2. **Machine Learning**: Predictive artifact suggestions
3. **Multi-Tenant Support**: Support for multiple organizations
4. **API Gateway**: Centralized API management
5. **Workflow Automation**: Advanced workflow capabilities

### Experimental Features
1. **Real-time Collaboration**: Multi-user development support
2. **Version Control Integration**: Git-based artifact management
3. **Testing Framework**: Automated testing capabilities
4. **Performance Optimization**: AI-powered performance tuning

This comprehensive MCP server system provides a solid foundation for ServiceNow automation and development, with room for future expansion and enhancement.
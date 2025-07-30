# Snow-Flow Architecture: ServiceNow Hive-Mind Intelligence

## ⚠️ IMPORTANT: Flow Creation Removed in v1.4.0 ⚠️

**Note**: The Flow Builder agent and all flow-related functionality have been removed in v1.4.0 due to critical bugs. Please use ServiceNow's native Flow Designer interface directly for flow creation. All other agents and functionality continue to work normally.

## 🎯 Vision: Claude-Flow for ServiceNow Development

Snow-Flow implements the **claude-flow philosophy** specifically for ServiceNow development, creating an intelligent swarm of AI agents that collaborate through Claude Code to build, deploy, and maintain ServiceNow solutions.

## 🧠 Core Philosophy (Inspired by Claude-Flow)

### The Hive-Mind Approach
- **Queen Agent**: Master coordinator that analyzes objectives and spawns specialized agents
- **Worker Agents**: ServiceNow-specific specialists (Widget Creators, Flow Builders, Script Writers, etc.)
- **Shared Memory**: SQLite-based persistent memory system for cross-agent coordination
- **Interactive Orchestration**: All coordination happens through Claude Code interface
- **Rapid Task Completion**: Focus on single-objective, quick ServiceNow development tasks

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Snow-Flow Hive-Mind System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Claude Code   │◄──►│  Snow-Flow CLI  │◄──►│ ServiceNow  │  │
│  │   Interface     │    │  Orchestrator   │    │  Instance   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Swarm Memory   │◄──►│  Queen Agent    │◄──►│  MCP Tools  │  │
│  │   (SQLite)      │    │  Coordinator    │    │  (11 MCPs)  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌─────────────────────────────────────────────────────────────┤
│  │              ServiceNow Specialist Agents                   │
│  │                                                             │
│  │  Widget Creator  │  Flow Builder  │  Script Writer        │  │
│  │  Business Rules  │  Table Creator │  Integration Specialist│  │
│  │  Security Agent  │  Test Agent    │  Deployment Agent     │  │
│  └─────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🧠 NEW: Intelligent Gap Analysis Engine (v1.1.88)

The revolutionary **Intelligent Gap Analysis Engine** represents the next evolution of Snow-Flow's hive-mind intelligence, automatically detecting and resolving ServiceNow configurations that go beyond standard MCP tool capabilities.

### 🎯 Gap Analysis Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│             Intelligent Gap Analysis Engine                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Requirements    │  │ MCP Coverage    │  │ Auto-Resolution │ │  
│  │ Analyzer        │──│ Analyzer        │──│ Engine          │ │
│  │ (60+ Types)     │  │ (Gap Detection) │  │ (API Calls)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                       │                      │      │
│           ▼                       ▼                      ▼      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Manual Guide    │  │ Risk Assessment │  │ Environment     │ │
│  │ Generator       │  │ Engine          │  │ Adaptation      │ │
│  │ (Step-by-Step)  │  │ (Safety Check)  │  │ (Dev/Test/Prod) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 🔍 What Gap Analysis Detects

The engine analyzes objectives and identifies requirements across **60+ ServiceNow configuration types**:

**🔐 Authentication & Security:**
- LDAP/SAML authentication setup
- Single Sign-On (SSO) configurations  
- Multi-Factor Authentication (MFA)
- OAuth provider configurations
- Custom ACL rules and data policies

**🗄️ Database & Performance:**
- Database indexes for performance optimization
- Database views and partitioning
- System properties configuration
- Performance analytics setup
- Custom table field configurations

**🧭 Navigation & User Interface:**
- Application menus and modules
- Navigation module customization
- Form layouts and sections
- UI actions and policies
- Custom form designs

**📧 Integration & Communication:**
- Email templates and notifications
- Web service configurations
- Import sets and transform maps
- External API integrations
- Webhook configurations

**🔄 Workflow & Automation:**
- Workflow activities and transitions
- SLA definitions and metrics
- Escalation rules and policies
- Scheduled job configurations
- Event rule automation

### 🤖 Intelligent Resolution Process

**Phase 1: Requirement Detection**
```javascript
// AI-powered analysis of natural language objectives
const requirements = RequirementsAnalyzer.analyzeObjective(
  "create ITSM solution with LDAP authentication and approval workflows"
);
// Result: 12 requirements detected across authentication, workflow, UI categories
```

**Phase 2: MCP Coverage Analysis**
```javascript
// Map what MCP tools can handle vs gaps requiring manual work
const coverage = McpCoverageAnalyzer.analyzeCoverage(requirements);
// Result: 67% MCP coverage, 4 gaps requiring attention
```

**Phase 3: Automatic Resolution**
```javascript
// Attempt automatic configuration via ServiceNow APIs
const automation = await AutoResolutionEngine.resolveBulk(gaps);
// Result: 6 configurations automated, 4 require manual setup
```

**Phase 4: Manual Guide Generation**
```javascript
// Generate detailed step-by-step guides for complex configurations
const guides = ManualInstructionsGenerator.generateBulkInstructions(manualItems);
// Result: Role-specific guides with time estimates and risk assessment
```

### 🎯 Integration with Queen Agent

The Gap Analysis Engine seamlessly integrates into the Queen Agent workflow as **Phase 5: Intelligent Gap Analysis**:

```javascript
// Automatic execution as part of Queen Agent coordination
const gapAnalysisResult = await this.gapAnalysisEngine.analyzeAndResolve(objective, {
  autoPermissions: this.config.autoPermissions,
  environment: 'development',
  enableAutomation: true,
  includeManualGuides: true,
  riskTolerance: 'medium'
});
```

**No additional commands needed** - the Gap Analysis Engine automatically runs during every Queen Agent execution, ensuring comprehensive ServiceNow configuration coverage.

## 🚀 Swarm Command Workflow

### 1. Initialization Phase
```bash
# User runs swarm command
snow-flow swarm "Create incident management widget with charts"
```

**What happens:**
1. **CLI Analysis**: Snow-Flow CLI analyzes the objective
2. **Claude Code Launch**: Starts Claude Code with MCP servers pre-loaded
3. **Queen Spawning**: Queen Agent is initialized in Claude Code
4. **Memory Initialization**: SQLite memory system is prepared

### 2. Agent Coordination Phase
**Queen Agent analyzes objective:**
- **Task Classification**: "widget development" 
- **Complexity Assessment**: "medium complexity"
- **Agent Requirements**: Widget Creator + UI/UX Specialist + Tester

**Agent Spawning:**
```javascript
// Queen spawns specialized agents via Claude Code
TodoWrite([
  {
    id: "widget_creator",
    content: "Create incident management widget with HTML/CSS/JS",
    status: "pending",
    assignedAgent: "widget-creator"
  },
  {
    id: "chart_integration", 
    content: "Integrate Chart.js for data visualization",
    status: "pending",
    assignedAgent: "frontend-specialist"
  }
]);
```

### 3. Memory Coordination Phase
**Shared Memory Tables (SQLite):**
- `swarm_sessions`: Track active swarm sessions
- `agent_coordination`: Inter-agent communication
- `servicenow_artifacts`: Track created widgets, flows, scripts
- `deployment_history`: Record all ServiceNow deployments
- `task_dependencies`: Manage agent task dependencies

**Memory Usage Example:**
```javascript
// Widget Creator stores progress
Memory.store("widget_template", {
  name: "incident_management_widget",
  template: "<div>...</div>",
  server_script: "...",
  status: "in_progress"
});

// UI/UX Specialist reads and enhances
const widget = Memory.get("widget_template");
Memory.update("widget_template", {
  ...widget,
  css: "responsive styling...",
  status: "enhanced"
});
```

### 4. ServiceNow Execution Phase
**MCP Tool Coordination:**
Each agent uses specialized MCP tools:

```javascript
// Widget Creator uses deployment MCP
snow_deploy({
  type: "widget",
  config: widget_config
});

// Test Agent uses operations MCP  
snow_widget_test({
  widget_id: deployed_widget.sys_id,
  test_scenarios: [...]
});

// Security Agent uses security MCP
snow_security_scan({
  artifact_type: "widget",
  artifact_id: deployed_widget.sys_id
});
```

## 🤖 ServiceNow Agent Ecosystem

### Queen Agent (Master Coordinator)
**Responsibilities:**
- Analyze user objectives
- Spawn appropriate specialist agents
- Coordinate inter-agent communication
- Monitor overall progress
- Make strategic decisions

**MCP Tools Used:**
- `snow_analyze_requirements`
- `snow_orchestrate_development` 
- `snow_intelligent_flow_analysis`

### Widget Creator Agent
**Specialization:** ServiceNow Service Portal widgets
**Responsibilities:**
- HTML template creation
- Server script development
- CSS styling
- Demo data generation

**MCP Tools Used:**
- `snow_deploy` (widget type)
- `snow_preview_widget`
- `snow_widget_test`

### Flow Builder Agent  
**Specialization:** ServiceNow Flow Designer workflows
**Responsibilities:**
- Flow structure design
- Trigger configuration
- Action step creation
- Approval process setup

**MCP Tools Used:**
- `snow_create_flow`
- `snow_test_flow_with_mock`
- `snow_validate_flow_definition`

### Script Writer Agent
**Specialization:** Business Rules, Script Includes, Client Scripts
**Responsibilities:**
- Business logic implementation
- Server-side scripting
- Client-side validation
- Performance optimization

**MCP Tools Used:**
- `snow_create_business_rule`
- `snow_create_script_include` 
- `snow_create_client_script`

### Integration Specialist Agent
**Specialization:** External system integrations
**Responsibilities:**
- REST API configurations
- Data transformation mapping
- Authentication setup
- Error handling

**MCP Tools Used:**
- `snow_create_rest_message`
- `snow_create_transform_map`
- `snow_test_integration`

### Security Agent
**Specialization:** Security and compliance
**Responsibilities:**
- Access control validation
- Security policy enforcement
- Vulnerability scanning
- Compliance checking

**MCP Tools Used:**
- `snow_create_access_control`
- `snow_security_scan`
- `snow_run_compliance_scan`

### Test Agent
**Specialization:** Quality assurance and testing
**Responsibilities:**
- Test scenario creation
- Automated testing execution
- Performance validation
- Bug detection

**MCP Tools Used:**
- `snow_test_flow_with_mock`
- `snow_widget_test`
- `snow_comprehensive_flow_test`

## 💾 Memory System Architecture

### SQLite Database Structure
```sql
-- Core swarm coordination
CREATE TABLE swarm_sessions (
  id TEXT PRIMARY KEY,
  objective TEXT,
  started_at TIMESTAMP,
  status TEXT,
  queen_agent_id TEXT
);

CREATE TABLE agent_coordination (
  agent_id TEXT,
  session_id TEXT,
  agent_type TEXT,
  assigned_tasks TEXT,
  status TEXT,
  last_activity TIMESTAMP
);

-- ServiceNow specific tracking
CREATE TABLE servicenow_artifacts (
  sys_id TEXT PRIMARY KEY,
  artifact_type TEXT,
  name TEXT,
  created_by_agent TEXT,
  session_id TEXT,
  deployment_status TEXT
);

CREATE TABLE deployment_history (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  artifact_sys_id TEXT,
  update_set_id TEXT,
  deployed_at TIMESTAMP,
  success BOOLEAN
);

-- Inter-agent communication
CREATE TABLE agent_messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT,
  to_agent TEXT,
  message_type TEXT,
  content TEXT,
  timestamp TIMESTAMP
);

CREATE TABLE shared_context (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_by_agent TEXT,
  session_id TEXT,
  expires_at TIMESTAMP
);
```

### Memory Usage Patterns

**Context Sharing:**
```javascript
// Agent stores context for others
Memory.store("user_requirements", {
  widget_type: "incident_dashboard",
  chart_requirements: ["pie", "bar", "timeline"],
  responsive: true
});

// Other agents read context
const requirements = Memory.get("user_requirements");
```

**Progress Tracking:**
```javascript
// Update deployment progress
Memory.update("deployment_status", {
  widgets_deployed: 2,
  flows_created: 1,
  tests_passed: 15,
  current_phase: "integration_testing"
});
```

## 🔧 MCP Integration Architecture

### MCP Server Organization
Each MCP server provides specialized ServiceNow capabilities:

1. **servicenow-deployment-mcp**: Widget, flow, application deployment
2. **servicenow-intelligent-mcp**: Smart search, artifact analysis
3. **servicenow-operations-mcp**: Incident management, catalog operations
4. **servicenow-flow-composer-mcp**: Natural language flow creation
5. **servicenow-platform-development-mcp**: Scripts, rules, policies
6. **servicenow-integration-mcp**: External system integrations
7. **servicenow-automation-mcp**: Workflow automation
8. **servicenow-security-compliance-mcp**: Security scanning
9. **servicenow-reporting-analytics-mcp**: Data analysis
10. **servicenow-graph-memory-mcp**: Relationship tracking
11. **servicenow-update-set-mcp**: Change management

### MCP Communication Pattern
```javascript
// Agent uses MCP tool through Claude Code
const result = await snow_deploy({
  type: "widget",
  config: {
    name: "incident_dashboard",
    template: widget_template,
    server_script: server_logic
  }
});

// Store result in shared memory
Memory.store("widget_deployment_result", {
  sys_id: result.sys_id,
  deployment_time: new Date(),
  agent_id: "widget_creator_001"
});
```

## 🎯 Command Structure

### Primary Commands
```bash
# Initialize snow-flow environment
snow-flow init --sparc

# Quick single-objective swarm
snow-flow swarm "objective" [options]

# Complex multi-session project
snow-flow hive-mind "project" [options]

# Memory management
snow-flow memory <action> [args]

# Agent management
snow-flow agents list|spawn|status
```

### Swarm Command Options
```bash
snow-flow swarm "Create widget" \
  --max-agents 5 \
  --auto-deploy \
  --auto-permissions \
  --shared-memory \
  --live-testing
```

## 🔄 Execution Flow

### Standard Swarm Execution
1. **CLI Command**: User runs `snow-flow swarm "objective"`
2. **Analysis**: CLI analyzes objective and generates orchestration prompt
3. **Claude Code Launch**: Starts Claude Code with MCP servers loaded
4. **Prompt Injection**: Sends orchestration prompt to Claude Code
5. **Queen Activation**: Queen Agent analyzes and spawns workers
6. **Memory Initialization**: SQLite memory system activated
7. **Agent Coordination**: Agents communicate through memory and TodoWrite
8. **ServiceNow Execution**: Agents use MCP tools to build in ServiceNow
9. **Progress Monitoring**: Real-time status updates via memory
10. **Completion**: Final artifacts delivered, memory persisted

### Memory-Driven Coordination
```javascript
// Example coordination sequence
1. Queen stores objectives: Memory.store("session_objectives", {...})
2. Agents read objectives: const obj = Memory.get("session_objectives")
3. Agents store progress: Memory.update("task_progress", {...})
4. Queen monitors: const progress = Memory.get("task_progress") 
5. Agents coordinate: Memory.store("widget_ready_for_testing", true)
6. Test agent activates: if (Memory.get("widget_ready_for_testing")) {...}
```

## 🚀 Implementation Roadmap

### Phase 1: Core Architecture
- [ ] Refactor swarm command to follow claude-flow pattern
- [ ] Implement Queen Agent coordinator
- [ ] Create SQLite memory system with proper tables
- [ ] Set up agent spawning system

### Phase 2: Agent Ecosystem
- [ ] Implement Widget Creator Agent
- [ ] Implement Flow Builder Agent  
- [ ] Implement Script Writer Agent
- [ ] Implement Test Agent
- [ ] Implement Security Agent

### Phase 3: Memory Coordination
- [ ] Inter-agent communication system
- [ ] Context sharing mechanisms
- [ ] Progress tracking system
- [ ] Session persistence

### Phase 4: MCP Integration
- [ ] Refactor MCPs for agent-based usage
- [ ] Remove mock data and placeholders
- [ ] Implement proper authentication flow
- [ ] Add comprehensive error handling

### Phase 5: Advanced Features
- [ ] Neural pattern recognition
- [ ] Cognitive analysis tools
- [ ] Workflow automation
- [ ] Performance optimization

## 🎯 Success Metrics

### Operational Metrics
- **Agent Spawn Time**: < 5 seconds
- **Memory Query Speed**: < 100ms
- **ServiceNow Deployment Success Rate**: > 95%
- **Inter-Agent Communication Latency**: < 1 second

### User Experience Metrics  
- **Single Command Complexity**: Handle complex objectives with single swarm command
- **Context Preservation**: Maintain context across agent handoffs
- **Error Recovery**: Automatic fallback and retry mechanisms
- **Progress Visibility**: Real-time status updates

## 🔮 Future Vision

Snow-Flow will become the **definitive AI-driven ServiceNow development platform**, where developers can describe any ServiceNow objective in natural language and watch intelligent agents collaborate to build, test, and deploy professional solutions automatically.

**Core Promise**: "Describe what you want in ServiceNow, and our AI swarm will build it for you."

---

*This architecture document serves as the blueprint for transforming Snow-Flow into a true claude-flow inspired ServiceNow development ecosystem.*
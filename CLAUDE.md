# Claude Code Configuration - Snow-Flow Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:

1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**✅ CORRECT: Everything in ONE message**
```javascript
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks")
  - Multiple Read/Write operations
  - Multiple Bash commands
```

**❌ WRONG: Multiple messages (NEVER DO THIS)**
```javascript
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Read("file1.js")
// This is 3x slower and breaks coordination!
```

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking
- `./snow-flow --help`: Show all available commands

## Snow-Flow Complete Command Reference

### Core System Commands
- `./snow-flow start [--ui] [--port 3000]`: Start orchestration system
- `./snow-flow status`: Show comprehensive system status
- `./snow-flow config <subcommand>`: Configuration management

### Agent Management
- `./snow-flow agent spawn <type>`: Create AI agents
- `./snow-flow agent list`: List all active agents

### Task Orchestration
- `./snow-flow task create <type>`: Create and manage tasks
- `./snow-flow workflow <file>`: Execute workflow automation

### Memory Management
- `./snow-flow memory store <key> <data>`: Store persistent data
- `./snow-flow memory get <key>`: Retrieve stored information
- `./snow-flow memory list`: List all memory keys

### SPARC Development Modes
- `./snow-flow sparc "<task>"`: Run orchestrator mode (default)
- `./snow-flow sparc run <mode> "<task>"`: Run specific SPARC mode
- `./snow-flow sparc tdd "<feature>"`: Test-driven development mode

### Swarm Coordination - 🚀 Enhanced with Complete Solution
- `./snow-flow swarm "<objective>" [options]`: Multi-agent swarm coordination - één command voor alles!
- `--strategy`: research, development, analysis, testing, optimization, maintenance, **ml-training** (NEW!)
- `--mode`: centralized, distributed, hierarchical, mesh, hybrid
- `--max-agents <n>`: Maximum number of agents (default: 5)
- `--parallel`: Enable parallel execution
- `--monitor`: Real-time monitoring

**🧠 Intelligent Features (enabled by default):**
- `--smart-discovery`: Smart artifact discovery and reuse (default: **true**)
- `--live-testing`: Enable live testing during development (default: **true**)
- `--auto-deploy`: Automatic deployment when ready (default: **true**)
- `--shared-memory`: Enable shared memory between agents (default: **true**)
- `--ml-integration`: Use ML for predictions and optimization (default: **true**) (NEW!)

### Machine Learning Commands (NEW!)
- `./snow-flow ml train-incident-classifier`: Train incident classification model
- `./snow-flow ml train-change-risk`: Train change risk prediction
- `./snow-flow ml classify-incident <id>`: Classify incident with neural network
- `./snow-flow ml forecast-incidents`: Predict future incident volumes
- `./snow-flow ml detect-anomalies`: Real-time anomaly detection
- `./snow-flow ml performance-analytics`: Use ServiceNow PA ML
- `./snow-flow ml hybrid-recommendation`: Combine native + custom ML

## Quick Start Workflows

### 🚀 Intelligent Development Workflow
```bash
# Simple usage - all intelligent features enabled by default!
./snow-flow swarm "Create incident management dashboard with real-time updates"
# This automatically:
# ✅ Discovers existing artifacts to reuse
# ✅ Tests in real-time on your ServiceNow instance
# ✅ Deploys automatically when ready
# ✅ Shares context between all agents
```

### Research Workflow
```bash
./snow-flow swarm "Research modern web frameworks" --strategy research --mode distributed --parallel
./snow-flow sparc run researcher "Analyze React vs Vue performance"
./snow-flow memory store "research_findings" "Key insights"
```

### Development Workflow
```bash
./snow-flow start --ui --port 3000
./snow-flow sparc tdd "User authentication system with JWT tokens"
./snow-flow swarm "Build e-commerce API" --strategy development --max-agents 8
```

## Integration Patterns

### Memory-Driven Coordination
```bash
# Store architecture decisions
./snow-flow memory store "system_architecture" "Microservices with API Gateway"

# All subsequent operations reference this decision
./snow-flow sparc run coder "Implement user service based on system_architecture"
```

### Multi-Stage Development
```bash
# Stage 1: Research and planning
./snow-flow sparc run researcher "Research authentication best practices"
./snow-flow sparc run architect "Design authentication system"

# Stage 2: Implementation
./snow-flow sparc tdd "User registration and login functionality"

# Stage 3: Testing and deployment
./snow-flow sparc run tester "Comprehensive security testing"
```

## Advanced Batch Tool Patterns

### TodoWrite Coordination
Always use TodoWrite for complex task coordination:

```javascript
TodoWrite([
  {
    id: "architecture_design",
    content: "Design system architecture and component interfaces",
    status: "pending",
    priority: "high",
    dependencies: [],
    estimatedTime: "60min",
    assignedAgent: "architect"
  },
  {
    id: "frontend_development", 
    content: "Develop React components and user interface",
    status: "pending",
    priority: "medium",
    dependencies: ["architecture_design"],
    estimatedTime: "120min",
    assignedAgent: "frontend_team"
  }
]);
```

## Code Style Preferences
- Use ES modules (import/export) syntax
- Destructure imports when possible
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use async/await instead of Promise chains
- Prefer const/let over var

## Workflow Guidelines
- Always run typecheck after making code changes
- Run tests before committing changes
- Use meaningful commit messages
- Create feature branches for new functionality
- Ensure all tests pass before merging

## 📊 MANDATORY AGENT COORDINATION PROTOCOL

### 🔴 CRITICAL: Every Agent MUST Follow This Protocol

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**
```bash
npx snow-flow hooks pre-task --description "[agent task]" --auto-spawn-agents false
npx snow-flow hooks session-restore --session-id "swarm-[id]" --load-memory true
```

**2️⃣ DURING Work (After EVERY Major Step):**
```bash
npx snow-flow hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"
npx snow-flow hooks notify --message "[what was done]" --telemetry true
```

**3️⃣ AFTER Completing Work:**
```bash
npx snow-flow hooks post-task --task-id "[task]" --analyze-performance true
npx snow-flow hooks session-end --export-metrics true --generate-summary true
```

### 🎯 AGENT PROMPT TEMPLATE

When spawning agents, ALWAYS include these coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run `npx snow-flow hooks pre-task --description "[your task]"`
2. DURING: After EVERY file operation, run `npx snow-flow hooks post-edit --file "[file]"`
3. MEMORY: Store ALL decisions using `npx snow-flow hooks notify --message "[decision]"`
4. END: Run `npx snow-flow hooks post-task --task-id "[task]"`

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

## ⚡ PARALLEL EXECUTION IS MANDATORY

**✅ CORRECT (Parallel - ALWAYS DO THIS):**
```
Message 1: [BatchTool]
  // MCP coordination setup
  - mcp__snow-flow__swarm_init
  - mcp__snow-flow__agent_spawn (researcher)
  - mcp__snow-flow__agent_spawn (coder)
  - mcp__snow-flow__agent_spawn (analyst)

  // Task agents with full coordination instructions
  - Task("You are researcher agent. MANDATORY: Run hooks. Task: Research API patterns")
  - Task("You are coder agent. MANDATORY: Run hooks. Task: Implement REST endpoints")
  
  // TodoWrite with ALL todos batched
  - TodoWrite { todos: [
      {id: "research", content: "Research API patterns", status: "in_progress", priority: "high"},
      {id: "design", content: "Design database schema", status: "pending", priority: "high"},
      {id: "implement", content: "Build REST endpoints", status: "pending", priority: "high"},
      {id: "test", content: "Write unit tests", status: "pending", priority: "medium"}
    ]}

  // File operations in parallel
  - Write "api/package.json"
  - Write "api/server.js"
  - Bash "mkdir -p api/{routes,models,tests}"
```

## 🔄 MEMORY COORDINATION PATTERN

Every agent coordination step MUST use memory:

```javascript
// After each major decision or implementation
mcp__snow-flow__memory_usage({
  action: "store",
  key: "swarm-{id}/agent-{name}/{step}",
  value: JSON.stringify({
    timestamp: Date.now(),
    decision: "what was decided",
    implementation: "what was built",
    nextSteps: ["step1", "step2"],
    dependencies: ["dep1", "dep2"]
  })
})
```

## 🧠 Machine Learning Decision Guide

### When to Use Which ML Approach?

```
DECISION TREE:
═══════════════════════════════════════════════════════════════════
Is it a standard ServiceNow object? (incident/change/problem/request)
  └─ YES → Do you have PI/PA license?
      └─ YES → Use Native ML (best: 95%+ accuracy)
      └─ NO → Use TensorFlow.js (good: 80-85% accuracy)
  └─ NO → Is it custom data/table (u_*)?
      └─ YES → ONLY TensorFlow.js works!

Does it need to run in browser? (real-time)
  └─ YES → ONLY TensorFlow.js! (client-side ML)

Is it privacy-sensitive? (HR/salary/personal)
  └─ YES → TensorFlow.js (data stays local)

Must work offline? (mobile/disconnected)
  └─ YES → TensorFlow.js with local storage

Need custom patterns beyond ServiceNow ML?
  └─ YES → TensorFlow.js custom networks
═══════════════════════════════════════════════════════════════════
```

### Unique TensorFlow.js Scenarios:
- **Client-side Widget ML**: Real-time predictions in Service Portal
- **Custom Tables**: ML for u_employee_performance, u_vendor_rating, etc.
- **Form Intelligence**: Live validation and anomaly detection
- **Offline Mobile**: Predictions without connection
- **Privacy-First**: Sensitive calculations stay in browser
- **Custom Patterns**: Beyond standard ServiceNow capabilities

### Example Commands:
```bash
# Client-side ML widget
snow-flow swarm "Create widget with real-time typing predictions using client-side ML"

# Custom table ML
snow-flow swarm "Build ML predictions for u_vendor_performance custom table"

# Privacy-sensitive ML
snow-flow swarm "Create HR salary predictor that keeps data in browser"
```

## Snow-Flow MCP Tools (100+ Total)

Snow-Flow provides comprehensive ServiceNow intelligence through 16 specialized MCP servers:

### 🐝 **Snow-Flow AI Swarm Orchestration** (10+ tools) - NATIVE IMPLEMENTATION!
**IMPORTANT: Use Snow-Flow's built-in swarm orchestration - no external tools needed!**
- `swarm_init` - Initialize AI swarm coordination topology
- `agent_spawn` - Create specialized AI agents for different tasks
- `task_orchestrate` - Orchestrate complex task workflows in parallel
- `swarm_status` - Monitor swarm health and performance  
- `memory_usage` - Persistent memory across sessions with namespacing
- `neural_status` - Neural network pattern effectiveness
- `neural_train` - Train neural patterns with WASM SIMD acceleration
- `neural_patterns` - Analyze cognitive patterns for better coordination
- `memory_search` - Search memory with pattern matching
- `performance_report` - Generate performance reports with metrics


### 🔄 **Process Mining & Workflow Analysis** (4 tools)
- `snow_discover_process` - Real process mining from ServiceNow audit logs
- `snow_analyze_workflow_execution` - Analyze how workflows REALLY work vs design
- `snow_discover_cross_table_process` - Discover end-to-end processes across tables
- `snow_monitor_process` - Real-time process monitoring with anomaly detection

### ⚡ **Advanced Analytics & Performance** (6 tools)
- `snow_batch_api` - 80% API call reduction through intelligent batching
- `snow_get_table_relationships` - Deep table relationship mapping with visualizations
- `snow_analyze_query` - Query performance analysis with optimization suggestions
- `snow_predict_change_impact` - AI-powered change impact prediction (90% accuracy)
- `snow_detect_code_patterns` - Security & performance anti-pattern detection
- `snow_generate_documentation` - Auto-generate documentation from code analysis

### 📊 **ServiceNow Operations** (15+ tools)
- Complete ITIL lifecycle management (Incident, Request, Problem, Change)
- CMDB and User management with intelligent analysis
- AI-powered incident analysis and auto-resolution capabilities
- Pattern recognition and predictive analytics
- Knowledge base integration with smart suggestions

### 🔧 **Platform Development** (8+ tools)
- UI component creation (Pages, scripts, policies, actions)
- Business rule management with dynamic rule creation
- Client script development and form automation
- Complete table schema discovery and analysis
- Field management with dynamic discovery
- Script include development for reusable code libraries

### 🔗 **Integration** (10+ tools)
- REST/SOAP endpoint discovery for external system integration
- Transform map creation and data transformation
- Import set management and data import automation
- Web service integration with WSDL-based connections
- Email configuration and communication integration
- Comprehensive data source discovery and analysis

### 🤖 **Machine Learning & AI** (15+ tools) - NEW!
- `ml_train_incident_classifier` - Train LSTM neural networks for incident classification
- `ml_train_change_risk` - Build change risk prediction models
- `ml_train_anomaly_detector` - Create autoencoder anomaly detection
- `ml_classify_incident` - Classify incidents with 95%+ accuracy
- `ml_predict_change_risk` - Predict change implementation risks
- `ml_forecast_incidents` - Time series forecasting for incident volumes
- `ml_detect_anomalies` - Real-time anomaly detection
- `ml_performance_analytics` - ServiceNow PA ML integration
- `ml_predictive_intelligence` - PI clustering and similarity
- `ml_agent_intelligence` - AI work assignment
- `ml_process_optimization` - ML-driven process improvements
- `ml_virtual_agent_nlu` - Natural language understanding
- `ml_hybrid_recommendation` - Combine native + custom ML
- `ml_model_status` - Model performance metrics
- `ml_evaluate_model` - Model evaluation and testing

### 📈 **Reporting & Analytics** (12+ tools)
- Dynamic report creation with no hardcoded configurations
- Interactive ServiceNow dashboard generation
- KPI management and business metrics tracking
- Advanced data visualization (charts, graphs, visual analytics)
- System performance monitoring and analytics
- Automated report delivery and scheduling

### ⚙️ **Automation** (11+ tools)
- Scheduled job management with dynamic schedule discovery
- Event rule creation and automated event handling
- Smart notification management and delivery
- SLA definition and service level automation
- Escalation rules and automated escalation processes
- Comprehensive workflow activities and process automation

### 🛡️ **Security & Compliance** (12+ tools)
- Security policy management with dynamic configurations
- Compliance rule enforcement (SOX, GDPR, HIPAA)
- Audit trail analysis and security incident detection
- Access control management and role/permission analysis
- Proactive vulnerability scanning and assessment
- Comprehensive security risk assessment and analysis

## Available Agents (25+ Total)

### Core Development Agents
- `coder` - Implementation specialist
- `reviewer` - Code quality assurance
- `tester` - Test creation and validation
- `planner` - Strategic planning
- `researcher` - Information gathering

### Swarm Coordination Agents
- `hierarchical-coordinator` - Queen-led coordination
- `mesh-coordinator` - Peer-to-peer networks
- `adaptive-coordinator` - Dynamic topology
- `collective-intelligence-coordinator` - Hive-mind intelligence

### Specialized Development
- `backend-dev` - API development
- `mobile-dev` - React Native development
- `ml-developer` - Machine learning
- `system-architect` - High-level design
- `security-agent` - Security analysis

### GitHub & Repository Management
- `github-modes` - Comprehensive GitHub integration
- `pr-manager` - Pull request management
- `code-review-swarm` - Multi-agent code review

### SPARC Methodology Agents
- `sparc-coord` - SPARC orchestration
- `sparc-coder` - TDD implementation
- `specification` - Requirements analysis
- `architecture` - System design

## Important Notes
- **Use TodoWrite extensively** for all complex task coordination
- **Leverage Task tool** for parallel agent execution on independent work
- **Store all important information in Memory** for cross-agent coordination
- **Use batch file operations** whenever reading/writing multiple files
- **All swarm operations include automatic batch tool coordination**
- **Monitor progress** with TodoRead during long-running operations
- **Enable parallel execution** with --parallel flags for maximum efficiency

This configuration ensures optimal use of Claude Code's batch tools for swarm orchestration and parallel task execution with full Snow-Flow capabilities.
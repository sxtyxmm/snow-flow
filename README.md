# Snow-Flow 🌨️ - ServiceNow Multi-Agent Development Framework

[![Version](https://img.shields.io/badge/Version-1.1.0-blue.svg)](https://github.com/groeimetai/snow-flow/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-Compatible-blue.svg)](https://www.servicenow.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **AI-Powered ServiceNow Development with Multi-Agent Orchestration**

Snow-Flow is an advanced multi-agent development framework specifically designed for ServiceNow. It combines the power of Claude AI with specialized ServiceNow deployment tools to create widgets, workflows, and applications directly in your ServiceNow instance.

## 🎉 What's New in v1.1.0

### 🌊 Enhanced Flow Composer MCP
- **Natural Language Flow Creation**: Create complex ServiceNow flows using natural language instructions
- **Intelligent Artifact Discovery**: Automatically finds and links existing ServiceNow components
- **Smart Dependency Resolution**: Maps data flow between artifacts intelligently
- **Fallback Artifact Creation**: Creates missing components when needed

### 🎨 Intelligent Template System
- **Context-Aware Selection**: Automatically selects the best template based on requirements
- **Expanded Widget Templates**: Dashboard, data table, form, and chart widgets
- **Advanced Flow Templates**: Approval workflows, integration flows, automation patterns
- **Composite Templates**: Complete systems with multiple orchestrated artifacts

### 🧠 Natural Language Understanding
- **Smart Variable Extraction**: Extracts variables from natural language descriptions
- **Pattern Recognition**: Recognizes approval flows, dashboards, integrations automatically
- **ServiceNow Best Practices**: Applies best practices and security patterns automatically

### ⚡ Update Set Management
- **Automatic Tracking**: All deployments tracked in Update Sets
- **Production Ready**: Export Update Sets for production deployment
- **Change Management**: Complete audit trail for all changes

## ✨ Key Features

- 🤖 **Multi-Agent Orchestration**: Coordinate multiple AI agents for complex ServiceNow development tasks
- 🔗 **Direct ServiceNow Integration**: Deploy widgets, workflows, and applications directly to ServiceNow
- 🔐 **OAuth Authentication**: Secure authentication with ServiceNow instances
- 🎯 **SPARC Methodology**: 17 specialized development modes (researcher, architect, coder, tester, etc.)
- 🚀 **Real-time Deployment**: Deploy and test artifacts immediately in live ServiceNow
- 📊 **Batch Operations**: Parallel execution of multiple tasks for maximum efficiency
- 🔄 **Rollback Support**: Safe deployment with rollback capabilities
- 💾 **Persistent Memory**: Cross-session memory for agent coordination
- 🧠 **Intelligent Flow Composition**: Create complex flows with automatic artifact orchestration  
- 🔍 **Natural Language Processing**: Find, edit, and analyze ServiceNow artifacts using natural language
- 🎯 **Multi-Artifact Discovery**: Automatically discover and orchestrate multiple ServiceNow components
- 🌊 **Flow Composer MCP**: Create Flow Designer flows from natural language with intelligent artifact linking
- ⚡ **Update Set Management**: Automatic Update Set creation and tracking for all deployments

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

### 2. ServiceNow OAuth Setup

1. **Log into your ServiceNow instance as admin**
2. **Navigate to**: `System OAuth > Application Registry`
3. **Click "New"** > "Create an OAuth application"
4. **Fill in the following**:
   - **Name**: `Snow-Flow Development`
   - **Client ID**: (auto-generated)
   - **Client Secret**: (auto-generated)
   - **Redirect URL**: `http://localhost:3005/callback`
   - **Grant Type**: `Authorization Code`
5. **Save** and copy the Client ID and Client Secret

### 3. Project Configuration

```bash
# Initialize a new Snow-Flow project
snow-flow init --sparc

# Configure environment variables
# Edit .env file with your ServiceNow credentials
```

### 4. Environment Variables (.env)

Create a `.env` file in your project root:

```env
# ServiceNow OAuth Configuration
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret

# Snow-Flow Configuration
SNOW_FLOW_DEBUG=false
SNOW_FLOW_STRATEGY=development
SNOW_FLOW_MAX_AGENTS=5
SNOW_FLOW_TIMEOUT_MINUTES=0

# Optional: Advanced Configuration
SNOW_FLOW_PARALLEL=true
SNOW_FLOW_MONITOR=true

# Optional: Neo4j Graph Memory (for intelligent artifact understanding)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
```

### 5. Authentication & First Run

```bash
# Authenticate with ServiceNow
snow-flow auth login

# Create your first widget with AI agents
snow-flow swarm "create a widget for incident management with cool visual features"

# Or create a Flow Designer flow
snow-flow swarm "create a flow designer flow for iPhone 6s purchase approval that requires system admin approval and creates a task 'reisje naar electronica winkel om iphone op te halen' when approved"
```

## 🛠️ Core Commands

### Authentication
```bash
snow-flow auth login          # Authenticate with ServiceNow OAuth
snow-flow auth logout         # Logout from ServiceNow
snow-flow auth status         # Check authentication status
```

### 🧠 Intelligent Natural Language Commands

```bash
# Find ServiceNow artifacts using natural language
snow-flow find "the widget that shows incidents on the homepage"
snow-flow find "approval flow for purchasing equipment"
snow-flow find "script that validates phone numbers"

# Edit artifacts with natural language instructions
snow-flow edit "modify the incident dashboard widget to show priority colors"
snow-flow edit "add email notification to approval flow after manager approval"
snow-flow edit "update the user profile widget with new fields"

# Analyze and understand complex artifacts
snow-flow analyze "incident management flow" --deep-index
snow-flow analyze "user dashboard widget" --relationships
```

### 🚀 Complex Flow Composition

```bash
# Create complex flows with automatic artifact orchestration
snow-flow create-flow "maak een flow waarbij we het script include gebruiken waar we de localizatie met LLMs gebruiken om dan de berichten van het support desk mee te vertalen naar engels en deze op te slaan in een tabel aan de hand van een business rule"

# Analyze flow requirements before creation
snow-flow create-flow "approval flow for hardware purchases over €1000" --analyze-only

# Preview flow structure before deployment
snow-flow create-flow "incident escalation with automatic assignment" --preview

# Create flow but don't deploy immediately
snow-flow create-flow "user onboarding automation" --no-deploy

# Discover artifacts for a flow
snow-flow create-flow "translate support messages and store them" --discover-artifacts
```

### 🌊 Flow Composer MCP Tools

```bash
# Create flows from natural language - FULLY AUTONOMOUS!
snow-flow create-flow "Create a flow that translates incident descriptions to English using LLM when priority is high"

# The Flow Composer MCP automatically:
# ✅ Parses natural language instructions
# ✅ Discovers existing artifacts (script includes, business rules, tables)
# ✅ Creates missing artifacts as fallbacks
# ✅ Links everything with intelligent data flow
# ✅ Deploys directly to ServiceNow Flow Designer
# ✅ Returns live URLs to view your flow
```

### Multi-Agent Swarm
```bash
snow-flow swarm "objective"   # Start multi-agent swarm for complex tasks
snow-flow swarm "create a widget for incident management"
snow-flow swarm "build an approval flow for purchases"
```

### SPARC Development Modes
```bash
snow-flow sparc researcher "analyze ServiceNow best practices"
snow-flow sparc architect "design incident management system"
snow-flow sparc coder "implement the designed system"
snow-flow sparc tester "create comprehensive test scenarios"
```

### Project Management
```bash
snow-flow init --sparc        # Initialize project with SPARC environment
snow-flow status              # Show project and ServiceNow status
snow-flow config show         # Display current configuration
```

## 🎯 What Snow-Flow Can Build

### 🎨 ServiceNow Widgets
- **Incident Management Dashboards** with real-time charts
- **Custom Service Portal Widgets** with modern UI
- **Data Visualization Widgets** with interactive charts
- **User Profile Widgets** with enhanced functionality

### 🔄 Flow Designer Flows
- **Approval Flows** with multi-stage approvals
- **Automation Flows** for repetitive tasks
- **Integration Flows** with external systems
- **Notification Flows** for stakeholder updates

### 📦 Scoped Applications
- **Complete ServiceNow Applications** with full functionality
- **Custom Table Structures** with business rules
- **Security Configurations** with role-based access
- **Update Sets** for production deployment

## 🧠 Neo4j Graph Memory (Optional but Recommended)

Snow-Flow can use Neo4j to create an intelligent knowledge graph of all ServiceNow artifacts, enabling:
- **Instant Understanding**: Claude understands relationships between widgets, flows, scripts
- **Impact Analysis**: See what will break before making changes
- **Pattern Recognition**: Learn from successful implementations
- **AI Suggestions**: Get recommendations based on past success

### Neo4j Setup

1. **Install Neo4j** (if not already installed):
```bash
# macOS
brew install neo4j

# Ubuntu/Debian
wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
echo 'deb https://debian.neo4j.com stable 5.0' | sudo tee /etc/apt/sources.list.d/neo4j.list
sudo apt-get update
sudo apt-get install neo4j

# Or use Docker
docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
```

2. **Start Neo4j**:
```bash
# Local installation
neo4j start

# Or with Docker
docker start neo4j
```

3. **Configure Snow-Flow** (add to .env):
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

4. **Use Graph Memory**:
```bash
# Index all discovered artifacts
snow-flow graph index-all

# Analyze impact before changes
snow-flow graph impact "widget_123"

# Find related artifacts
snow-flow graph find-related "script_include_456"

# Get AI suggestions
snow-flow graph suggest "incident management dashboard"
```

## 🚀 Complex Development Scenarios

Snow-Flow excels at complex, multi-component ServiceNow development tasks. Here are real-world scenarios you can execute:

### 1. 🏢 Complete Incident Management System
```bash
snow-flow swarm "Build a complete incident management system with dashboard, automated assignment based on category, SLA tracking, escalation flows, and manager approval for high priority incidents"
```

**What happens autonomously:**
- Creates incident dashboard widget with real-time charts
- Builds assignment rules based on category/priority matrix
- Implements SLA tracking with breach notifications
- Creates escalation flow with multi-level approvals
- Links all components with proper data flow
- Deploys everything with zero manual steps

### 2. 🛒 Employee Purchase Request Portal
```bash
snow-flow swarm "Create an employee self-service portal for IT equipment requests with approval workflow based on cost (manager approval for >€1000, director for >€5000), automated procurement task creation, and budget tracking dashboard"
```

**Autonomous execution:**
- Designs service portal with catalog items
- Creates multi-tier approval flow with cost conditions
- Integrates with procurement system
- Builds budget tracking widget with spend analytics
- Sets up automated email notifications
- Creates related tables and business rules

### 3. 🔄 Change Management Automation
```bash
snow-flow create-flow "Implement change management process with risk assessment, CAB approval for high-risk changes, automated testing schedules, rollback procedures, and post-implementation reviews"
```

**System automatically:**
- Analyzes existing change tables and processes
- Creates risk assessment calculator
- Builds CAB approval workflow
- Implements automated test scheduling
- Creates rollback procedures with impact analysis
- Sets up post-implementation review tasks

### 4. 🔐 Security Incident Response Platform
```bash
snow-flow swarm "Build security incident response platform with automated threat classification, SOAR integration, evidence collection workflows, stakeholder notifications based on severity, and compliance reporting dashboard"
```

**Full autonomous development:**
- Creates threat classification ML model integration
- Builds evidence collection procedures
- Implements severity-based notification matrix
- Creates compliance dashboard with audit trails
- Links with existing security tools
- Deploys with proper access controls

### 5. 📊 Executive KPI Dashboard System
```bash
snow-flow swarm "Create executive dashboard showing real-time KPIs from multiple sources: incident resolution times, change success rates, project status, budget utilization, and employee satisfaction scores with drill-down capabilities"
```

**Autonomous implementation:**
- Discovers all relevant data sources
- Creates aggregation scripts for KPIs
- Builds responsive dashboard widgets
- Implements drill-down navigation
- Sets up scheduled data refresh
- Optimizes for performance

### 6. 🤖 AI-Powered Service Desk
```bash
snow-flow swarm "Implement AI-powered service desk with natural language ticket creation, automatic categorization using ML, suggested solutions from knowledge base, sentiment analysis for escalation, and chatbot integration"
```

**System handles:**
- NLP integration for ticket parsing
- ML model for categorization
- Knowledge base search integration
- Sentiment analysis implementation
- Chatbot workflow creation
- All API integrations

### 7. 🌊 Complex Multi-Artifact Flow Composition
```bash
snow-flow create-flow "Create a flow that uses the localization script include with LLMs to translate support desk messages to English and store them in a table using a business rule"
```

**Flow Composer automatically:**
- Discovers existing localization script includes
- Finds or creates translation business rules
- Links artifacts with proper data flow
- Maps outputs to inputs intelligently
- Handles error conditions
- Deploys complete flow with all dependencies

### 8. 🏭 Multi-Stage Software Deployment Pipeline
```bash
snow-flow create-flow "Create software deployment pipeline with developer request form, automated testing in dev, staging deployment with smoke tests, CAB approval for production, automated rollout with health checks, and rollback triggers"
```

**Fully automated creation of:**
- Developer request catalog item
- Environment promotion workflows
- Automated testing integrations
- CAB approval process
- Health check monitoring
- Automated rollback procedures

### 9. 📈 Predictive Incident Prevention System
```bash
snow-flow swarm "Build predictive incident prevention system that analyzes patterns, identifies potential issues before they occur, creates preventive tasks, tracks prevention effectiveness, and shows ROI dashboard"
```

**Autonomous development includes:**
- Pattern analysis engine
- Predictive model integration
- Preventive task automation
- Effectiveness tracking metrics
- ROI calculation dashboard
- Continuous learning loop

### 10. 🌐 Multi-Language Support System
```bash
snow-flow create-flow "Implement multi-language support system with automatic translation of tickets, knowledge articles, and notifications using LLM integration, with quality review workflow and glossary management"
```

**System automatically:**
- Integrates LLM translation services
- Creates quality review workflows
- Builds glossary management system
- Implements language detection
- Sets up notification templates
- Handles right-to-left languages

### 11. 🔗 Cross-Platform Integration Hub
```bash
snow-flow swarm "Create integration hub connecting ServiceNow with Jira, Slack, Teams, SAP, and Salesforce with bi-directional sync, conflict resolution, mapping interface, and monitoring dashboard"
```

**Complete autonomous setup:**
- Discovers available APIs
- Creates integration workflows
- Implements conflict resolution
- Builds mapping interface
- Sets up monitoring dashboard
- Handles authentication for all platforms

### 💡 How It Works

For each scenario, Snow-Flow:

1. **Understands Context**: Uses NLP to parse requirements
2. **Progressive Indexing**: Finds only relevant existing artifacts
3. **Intelligent Planning**: Creates optimal implementation plan
4. **Parallel Execution**: Multiple agents work simultaneously
5. **Artifact Orchestration**: Links all components properly
6. **Direct Deployment**: Deploys to ServiceNow instantly
7. **Learning & Optimization**: Stores patterns for future use

### 🎯 Key Benefits

- **Zero Manual Steps**: Everything happens autonomously
- **Intelligent Reuse**: Leverages existing components
- **Best Practices**: Follows ServiceNow standards
- **Performance Optimized**: Only indexes what's needed
- **Continuous Learning**: Gets better with each use

## 🔧 Advanced Features

### 🌊 Flow Composer MCP - Natural Language Flow Creation

Snow-Flow's Flow Composer MCP is a powerful tool that creates complete ServiceNow flows from natural language:

```javascript
// Create complex flows with multi-artifact orchestration
await snow_create_complex_flow({
  instruction: "Create a flow that translates incident descriptions to English using LLM when priority is high"
});

// Analyze flow requirements
await snow_analyze_flow_instruction({
  instruction: "approval flow with manager and director approval for purchases over €5000"
});

// Discover and orchestrate artifacts
await snow_discover_flow_artifacts({
  instruction: "use the translation script include to process support messages",
  artifact_types: ['script_include', 'business_rule', 'table']
});

// Preview flow structure before deployment
await snow_preview_flow_structure({
  instruction: "incident escalation flow with automatic assignment based on category"
});
```

**Flow Composer Features:**
- 🧠 **Natural Language Understanding**: Parses complex instructions in any language
- 🔍 **Intelligent Artifact Discovery**: Finds and links existing ServiceNow components
- 🔗 **Automatic Dependency Resolution**: Maps data flow between artifacts
- 🎯 **Smart Fallback Creation**: Creates missing artifacts when needed
- ⚡ **Direct Deployment**: Deploys complete flows to Flow Designer
- 📊 **Error Handling**: Automatic retry and validation logic

### ⚡ Update Set Management

All deployments are automatically tracked in Update Sets for safe production deployment:

```javascript
// Create Update Set for a user story
await snow_update_set_create({
  name: "STORY-123: Add incident translation flow",
  description: "Implements automatic translation for support messages",
  user_story: "STORY-123"
});

// Track artifacts in current Update Set
await snow_update_set_add_artifact({
  type: "flow",
  sys_id: "flow_sys_id_here",
  name: "incident_translation_flow"
});

// Preview all changes
await snow_update_set_preview();

// Export for production deployment
await snow_update_set_export({
  output_path: "./exports/STORY-123.xml"
});
```

### 🧠 Intelligent Natural Language Processing
Snow-Flow features advanced AI-powered natural language processing for ServiceNow artifacts:

```bash
# Find artifacts using natural language
snow-flow find "the widget that shows incidents on the homepage"
snow-flow find "approval flow for hardware requests over €1000"

# Edit using natural language instructions
snow-flow edit "pas de flow aan met de naam 'approval request flow' en zorg dat er na de approval stap een mailtje naar test@admin.nl wordt gestuurd"

# Analyze and understand complex ServiceNow artifacts
snow-flow analyze "incident management widget" --deep-index
```

### 🔍 Intelligent Artifact Discovery
Snow-Flow automatically discovers and indexes ServiceNow artifacts with intelligent memory:

- **Smart Search**: Find artifacts using natural language descriptions
- **Contextual Understanding**: AI understands artifact purpose and relationships
- **Memory Indexing**: Large scripts and flows are intelligently indexed for optimal Claude interaction
- **Modification Points**: Automatically identifies where and how artifacts can be modified

### Direct ServiceNow Deployment
Snow-Flow includes specialized MCP (Model Context Protocol) tools for direct ServiceNow deployment:

```javascript
// Deploy widgets directly to ServiceNow
await snow_deploy_widget({
  name: 'incident_dashboard',
  title: 'Incident Management Dashboard',
  template: widgetHTML,
  css: widgetCSS,
  client_script: clientScript,
  server_script: serverScript,
  category: 'incident'
});

// Deploy Flow Designer flows with approval logic
await snow_deploy_flow({
  name: 'purchase_approval',
  description: 'Purchase approval with task creation',
  table: 'sc_request',
  trigger_type: 'record_created',
  condition: 'category=hardware',
  flow_definition: flowJSON,
  category: 'approval'
});

// Deploy composed flows with linked artifacts
await snow_deploy_flow({
  name: 'translation_flow',
  description: 'Translate and store support messages',
  composed_flow: true,
  linked_artifacts: [
    { type: 'script_include', name: 'LLMTranslationUtil' },
    { type: 'business_rule', name: 'StoreTranslatedMessage' },
    { type: 'table', name: 'u_translations' }
  ],
  flow_definition: composedFlowJSON
});
```

### 🤖 Intelligent Multi-Agent Coordination
Snow-Flow uses advanced batch processing with intelligent artifact understanding:

```javascript
// Intelligent artifact processing with memory indexing
TodoWrite([
  {
    id: "discover_artifacts",
    content: "Discover and index existing ServiceNow artifacts",
    status: "pending",
    priority: "high"
  },
  {
    id: "analyze_requirements", 
    content: "Analyze modification requirements using natural language",
    status: "pending",
    priority: "high"
  }
]);

// Agents work with intelligent memory
Task("ServiceNow Discovery Agent", "Find and index 'approval request flow' using natural language processing");
Task("Contextual Editor Agent", "Apply modifications based on memory-indexed artifact structure");
Task("Deployment Agent", "Deploy modified artifacts back to ServiceNow");
Task("Memory Manager", "Update intelligent index with modification history");

// Intelligent memory storage for ServiceNow artifacts
Memory.store("servicenow_artifacts", {
  indexed_flows: [...],
  modification_history: [...],
  common_patterns: [...]
});
```

### Deployment Management
- **Validation**: Test before deployment
- **Rollback**: Safe deployment with rollback capability
- **Status Tracking**: Monitor deployment history
- **Update Sets**: Production-ready deployments

## 📁 Project Structure

```
snow-flow/
├── src/
│   ├── agents/           # AI agent implementations
│   ├── cli/             # Command-line interface
│   ├── mcp/             # MCP servers for ServiceNow
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── .claude/             # Claude Code configuration
├── .swarm/              # Swarm coordination data
├── memory/              # Persistent memory storage
├── servicenow/          # ServiceNow artifacts (if not deployed)
└── templates/           # Widget and workflow templates
```

## 🔐 Security & Authentication

### OAuth 2.0 with PKCE
Snow-Flow uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication:

- **Secure Token Storage**: Tokens encrypted and stored locally
- **Automatic Refresh**: Token refresh handled automatically
- **Instance Isolation**: Each ServiceNow instance has separate credentials
- **Secure Communication**: All API calls use HTTPS with proper authentication

### Environment Security
```bash
# Secure environment variables
chmod 600 .env            # Restrict access to .env file
git update-index --assume-unchanged .env  # Prevent accidental commits
```

## 🚨 Troubleshooting

### Common Issues

**1. Authentication Failures**
```bash
# Clear cached credentials
snow-flow auth logout
snow-flow auth login

# Check ServiceNow OAuth configuration
# Ensure redirect URL is: http://localhost:3005/callback
```

**2. Port Already in Use**
```bash
# Snow-Flow uses port 3005 by default
# If port is busy, close other applications or change port in OAuth settings
```

**3. Timeout Issues**
```bash
# Increase timeout for complex tasks
export SNOW_FLOW_TIMEOUT_MINUTES=120

# Or disable timeout completely
export SNOW_FLOW_TIMEOUT_MINUTES=0
```

**4. Widget Deployment Failures**
```bash
# Check ServiceNow permissions
# Ensure user has sp_admin role for widget deployment
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Test ServiceNow connection
snow-flow auth status
```

## 📊 Performance & Monitoring

### Real-time Monitoring
```bash
# Monitor swarm execution
snow-flow swarm "objective" --monitor

# Check system performance
snow-flow status --detailed

# View deployment history
snow-flow deploy status
```

### Batch Operations
Snow-Flow maximizes efficiency through:
- **Parallel Agent Execution**: Multiple agents work simultaneously
- **Batch API Calls**: Minimize ServiceNow API calls
- **Memory Coordination**: Efficient data sharing between agents
- **Optimized Deployment**: Direct deployment without intermediate files

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup
```bash
# Clone for development
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build in watch mode
npm run dev

# Run tests
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/groeimetai/snow-flow/wiki)
- **Issues**: [GitHub Issues](https://github.com/groeimetai/snow-flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/groeimetai/snow-flow/discussions)

## 🙏 Acknowledgments

- **Claude AI** by Anthropic for AI-powered development
- **ServiceNow** for the amazing platform
- **MCP (Model Context Protocol)** for tool integration
- **Open Source Community** for inspiration and contributions

## 📋 Changelog

### Version 1.1.0 (2025-01-17)
- 🌊 **Enhanced Flow Composer MCP** - Natural language flow creation with intelligent artifact orchestration
- 🎨 **Intelligent Template System** - Context-aware template selection with expanded widget and flow templates
- 🧠 **Natural Language Understanding** - Smart variable extraction and pattern recognition
- ⚡ **Update Set Management** - Automatic tracking and production-ready deployment
- 📊 **New Templates** - Dashboard widgets, data tables, approval flows, integration flows, and composite systems

### Version 1.0.0 (2025-01-15)
- 🚀 **Initial Release** - Multi-agent orchestration framework for ServiceNow
- 🔐 **OAuth Integration** - Secure ServiceNow authentication and API access
- 🎯 **SPARC Methodology** - 17 specialized development modes
- 📦 **Basic Templates** - Widget, flow, and application templates
- 🔗 **MCP Integration** - Claude Code compatibility

For detailed changes, see [CHANGELOG.md](CHANGELOG.md).

---

**Made with ❤️ by the Snow-Flow team**

*Revolutionizing ServiceNow development with AI-powered multi-agent orchestration*

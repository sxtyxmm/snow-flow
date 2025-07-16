# Snow-Flow 🌨️ - ServiceNow Multi-Agent Development Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![ServiceNow](https://img.shields.io/badge/ServiceNow-Compatible-blue.svg)](https://www.servicenow.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **AI-Powered ServiceNow Development with Multi-Agent Orchestration**

Snow-Flow is an advanced multi-agent development framework specifically designed for ServiceNow. It combines the power of Claude AI with specialized ServiceNow deployment tools to create widgets, workflows, and applications directly in your ServiceNow instance.

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

## 🔧 Advanced Features

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

---

**Made with ❤️ by the Snow-Flow team**

*Revolutionizing ServiceNow development with AI-powered multi-agent orchestration*

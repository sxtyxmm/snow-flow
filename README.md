# Snow-Flow: Multi-Agent ServiceNow Development Platform 🚀

Snow-Flow is a powerful multi-agent AI platform that revolutionizes ServiceNow development through intelligent automation, natural language processing, and autonomous deployment capabilities. Built with 11 specialized MCP (Model Context Protocol) servers, Snow-Flow enables developers to create, manage, and deploy ServiceNow artifacts using simple natural language commands.

## 🌟 Key Features

### 🤖 11 Specialized MCP Servers
Each server provides autonomous capabilities for different aspects of ServiceNow development:

1. **Deployment MCP** - Autonomous widget, flow, and application deployment
2. **Flow Composer MCP** - Natural language flow creation with intelligent analysis
3. **Update Set MCP** - Professional change tracking and deployment management
4. **Intelligent MCP** - AI-powered artifact discovery and editing
5. **Graph Memory MCP** - Relationship tracking and impact analysis
6. **Platform Development MCP** - Development workflow automation
7. **Integration MCP** - Third-party system integration
8. **Operations MCP** - Operations and monitoring management
9. **Automation MCP** - Workflow and process automation
10. **Security & Compliance MCP** - Security auditing and compliance
11. **Reporting & Analytics MCP** - Data analysis and reporting

### 🎯 Core Capabilities

- **Natural Language Processing**: Create complex ServiceNow artifacts using plain English/Dutch commands
- **Intelligent Decision Making**: Automatically determines optimal architecture (flow vs subflow)
- **Zero Configuration**: All values dynamically discovered from your ServiceNow instance
- **Autonomous Deployment**: Direct deployment to ServiceNow with automatic error handling
- **Update Set Management**: Professional change tracking like ServiceNow pros use
- **Global Scope Strategy**: Intelligent scope selection with fallback mechanisms
- **Multi-Agent Coordination**: Parallel execution for complex tasks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- ServiceNow instance with admin access
- OAuth application configured in ServiceNow

### Installation

```bash
# Install Snow-Flow globally
npm install -g snow-flow

# Initialize Snow-Flow in your project directory
snow-flow init --sparc
```

#### Alternative: Install from source
```bash
# Clone the repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### Configuration

1. Create a `.env` file in the project root:
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
SNOW_USERNAME=your-username
SNOW_PASSWORD=your-password
```

2. Set up OAuth in ServiceNow (see [SERVICENOW-OAUTH-SETUP.md](./SERVICENOW-OAUTH-SETUP.md))

3. Authenticate with ServiceNow:
```bash
snow-flow auth login
```

## 💡 Usage Examples

### Create a Complex Flow with Natural Language
```bash
snow-flow sparc "Create an approval workflow for iPhone 6 orders that notifies managers, creates tasks, and updates inventory"
```

### Deploy a Widget Directly to ServiceNow
```bash
snow-flow sparc "Create and deploy a widget that shows all critical incidents with real-time updates"
```

### Start a Multi-Agent Swarm for Complex Projects
```bash
snow-flow swarm "Build a complete incident management system with dashboard, workflows, and notifications" --strategy development --parallel
```

### Intelligent Artifact Discovery
```bash
snow-flow sparc "Find and modify the approval workflow to add an extra approval step for orders over $1000"
```

### Create Flows in Dutch
```bash
snow-flow sparc "Maak een flow voor het automatisch toewijzen van incidenten aan de juiste groep op basis van categorie"
```

## 🛠️ Advanced Features

### Flow vs Subflow Intelligence
Snow-Flow automatically analyzes your requirements and decides whether to create a main flow or break it into reusable subflows:
- Complexity analysis
- Reusability assessment
- Performance optimization
- Maintainability considerations

### Update Set Management
Professional change tracking just like ServiceNow developers use:
```bash
# Create a new update set for your feature
snow-flow sparc "Create update set for new approval features"

# All subsequent changes are automatically tracked
snow-flow sparc "Add approval widget to portal"
```

### Global Scope Strategy
Intelligent deployment scope selection:
- Automatic permission validation
- Fallback mechanisms for restricted environments
- Environment-aware deployment (dev/test/prod)

### Template Matching
Recognizes common patterns and applies best practices:
- Approval workflows
- Fulfillment processes
- Notification systems
- Integration patterns

## 📁 Project Structure

```
snow-flow/
├── src/
│   ├── mcp/                    # 11 MCP server implementations
│   ├── orchestrator/           # Flow composition and intelligence
│   ├── strategies/             # Deployment and scope strategies
│   ├── api/                    # ServiceNow API integration
│   ├── managers/               # Resource and scope management
│   └── utils/                  # Utilities and helpers
├── .snow-flow/                 # Snow-Flow configuration
├── .claude/                    # Claude configuration
├── memory/                     # Persistent agent memory
└── coordination/               # Multi-agent coordination
```

## 🔧 Development Commands

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run typecheck

# Development mode
npm run dev

# Build for production
npm run build
```

## 📚 Documentation

- [MCP Server Documentation](./MCP_SERVERS.md) - Detailed info on all 11 MCP servers
- [OAuth Setup Guide](./SERVICENOW-OAUTH-SETUP.md) - ServiceNow OAuth configuration
- [Flow Composer Guide](./ENHANCED_FLOW_COMPOSER_DOCUMENTATION.md) - Advanced flow creation
- [Update Set Guide](./UPDATE_SET_DEPLOYMENT_GUIDE.md) - Professional change management
- [API Integration Guide](./API_INTEGRATION_GUIDE.md) - ServiceNow API details

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines (coming soon).

## 🔒 Security

- All credentials stored securely in environment variables
- OAuth 2.0 authentication with ServiceNow
- No hardcoded values - everything discovered dynamically
- Secure token management with automatic refresh

## 🎯 Use Cases

### For ServiceNow Developers
- Rapidly prototype flows and workflows
- Automate repetitive development tasks
- Ensure consistency across implementations
- Reduce development time by 80%

### For ServiceNow Architects
- Validate architectural decisions
- Ensure best practices are followed
- Analyze impact of changes
- Optimize performance and maintainability

### For ServiceNow Administrators
- Quick deployments and updates
- Professional change tracking
- Automated testing and validation
- Simplified migration between instances

## 🚦 Roadmap

- [ ] Visual flow designer integration
- [ ] Enhanced Neo4j graph visualization
- [ ] Multi-instance synchronization
- [ ] AI-powered code review
- [ ] Automated testing framework
- [ ] Performance optimization recommendations

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

Built with the power of Claude AI and the ServiceNow platform. Special thanks to the ServiceNow developer community for inspiration and best practices.

---

**Ready to revolutionize your ServiceNow development?** Start with `snow-flow init --sparc` and experience the future of ServiceNow automation! 🚀
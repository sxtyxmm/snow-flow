# ServiceNow Multi-Agent Development Platform

A comprehensive multi-agent development platform for ServiceNow that combines intelligent automation, natural language processing, and graph-based memory systems to revolutionize ServiceNow development.

## 🚀 Features

### 🤖 6 Specialized MCP Servers
- **ServiceNow Deployment MCP** - Autonomous artifact deployment
- **ServiceNow Flow Composer MCP** - Natural language flow creation
- **ServiceNow Intelligent MCP** - AI-powered artifact discovery
- **ServiceNow Update Set MCP** - Professional change management
- **ServiceNow Graph Memory MCP** - Neo4j-based relationship mapping
- **ServiceNow Operations MCP** - Operational queries and management

### 🧠 Intelligent Automation
- **Natural Language Processing** - Create flows and widgets using plain English
- **Autonomous Deployment** - Complete deployment with zero manual intervention
- **Smart Artifact Discovery** - Automatically find and link required components
- **Impact Analysis** - Understand change impact before modifications
- **Pattern Recognition** - Learn from successful implementations

### 🔗 Advanced Integration
- **Multi-Agent Swarms** - Coordinate multiple AI agents for complex tasks
- **Graph Memory System** - Neo4j-based artifact relationship tracking
- **OAuth 2.0 Authentication** - Secure ServiceNow integration
- **Update Set Management** - Professional change tracking and deployment
- **Cross-Instance Support** - Work with multiple ServiceNow instances

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                Snow-Flow CLI & Orchestration                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Deployment     │  │  Flow Composer  │  │  Intelligent    │ │
│  │  MCP Server     │  │  MCP Server     │  │  MCP Server     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Update Set     │  │  Graph Memory   │  │  Operations     │ │
│  │  MCP Server     │  │  MCP Server     │  │  MCP Server     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│               ServiceNow Instance Integration                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- ServiceNow Developer Instance
- Neo4j (optional, for Graph Memory)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/servicenow_multiagent.git
   cd servicenow_multiagent
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your ServiceNow credentials
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Authenticate with ServiceNow**
   ```bash
   ./snow-flow auth login
   ```

5. **Start MCP Servers**
   ```bash
   ./snow-flow mcp start
   ```

### First Swarm Deployment

```bash
# Create a widget for incident management
./snow-flow swarm "Create a widget that shows incident statistics with charts"

# Create an approval flow
./snow-flow swarm "Create a flow that requires admin approval for iPhone requests"

# Analyze and optimize existing artifacts
./snow-flow swarm "Find all incident-related artifacts and suggest improvements"
```

## 🛠️ Core Commands

### Authentication
```bash
./snow-flow auth login          # Authenticate with ServiceNow
./snow-flow auth status         # Check authentication status
./snow-flow auth logout         # Clear authentication
```

### MCP Server Management
```bash
./snow-flow mcp start           # Start all MCP servers
./snow-flow mcp stop            # Stop all MCP servers
./snow-flow mcp status          # Check MCP server status
./snow-flow mcp restart         # Restart MCP servers
```

### Multi-Agent Swarms
```bash
./snow-flow swarm "objective"           # Start a swarm with objective
./snow-flow swarm --strategy research   # Research-focused swarm
./snow-flow swarm --strategy development # Development-focused swarm
./snow-flow swarm --max-agents 8        # Control swarm size
```

### Specialized Operations
```bash
./snow-flow create-flow "description"   # Create flows from natural language
./snow-flow deploy widget --file widget.json  # Deploy artifacts
./snow-flow analyze "artifact name"     # Analyze existing artifacts
```

## 🔧 Configuration

### Environment Variables
```bash
# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret

# Neo4j Configuration (Optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# Memory Configuration
MEMORY_PROVIDER=file  # file | neo4j | redis
MEMORY_PATH=.snow-flow/memory

# Performance Configuration
CONNECTION_POOL_SIZE=10
REQUEST_TIMEOUT=30000
CACHE_ENABLED=true
```

### Configuration File
Create `.snow-flow/config.json` for advanced settings:

```json
{
  "servicenow": {
    "instanceUrl": "https://your-instance.service-now.com",
    "maxRetries": 3,
    "timeout": 30000
  },
  "performance": {
    "connectionPoolSize": 10,
    "cacheEnabled": true,
    "cacheTtl": 300
  },
  "logging": {
    "level": "info",
    "enableFileLogging": false
  }
}
```

## 📖 MCP Server Details

### ServiceNow Deployment MCP
**Autonomous artifact deployment with full lifecycle management**

**Key Tools:**
- `snow_deploy_widget` - Deploy complete widgets
- `snow_deploy_flow` - Deploy flows with dependencies
- `snow_deploy_application` - Deploy scoped applications
- `snow_validate_deployment` - Pre-deployment validation
- `snow_rollback_deployment` - Safe rollback capabilities

### ServiceNow Flow Composer MCP
**Natural language flow creation with intelligent discovery**

**Key Tools:**
- `snow_create_flow` - Create flows from natural language
- `snow_analyze_flow_instruction` - Analyze requirements
- `snow_discover_flow_artifacts` - Find required components
- `snow_preview_flow_structure` - Preview before deployment

### ServiceNow Intelligent MCP
**AI-powered artifact discovery and modification**

**Key Tools:**
- `snow_find_artifact` - Natural language search
- `snow_edit_artifact` - Edit with natural language
- `snow_analyze_artifact` - Deep analysis with indexing
- `snow_comprehensive_search` - Multi-table search

### ServiceNow Update Set MCP
**Professional change management and tracking**

**Key Tools:**
- `snow_update_set_create` - Create update sets
- `snow_update_set_switch` - Switch between sets
- `snow_update_set_complete` - Complete and validate
- `snow_update_set_export` - Export as XML

### ServiceNow Graph Memory MCP
**Neo4j-based relationship mapping and analysis**

**Key Tools:**
- `snow_graph_index_artifact` - Index with relationships
- `snow_graph_find_related` - Find related artifacts
- `snow_graph_analyze_impact` - Impact analysis
- `snow_graph_pattern_analysis` - Pattern recognition

### ServiceNow Operations MCP
**Operational queries and ServiceNow management**

**Key Tools:**
- Basic CRUD operations
- Incident management
- Request processing
- CMDB operations
- User management

## 🎯 Use Cases

### 1. Rapid Widget Development
```bash
./snow-flow swarm "Create a dashboard widget showing top 10 incidents by priority with drill-down capability"
```

### 2. Complex Flow Creation
```bash
./snow-flow swarm "Create a flow that automatically assigns incidents based on category and sends notifications to the assigned team"
```

### 3. Artifact Discovery and Analysis
```bash
./snow-flow swarm "Find all widgets related to incident management and analyze their performance"
```

### 4. Cross-Instance Migration
```bash
./snow-flow swarm "Export all custom widgets from dev instance and prepare them for production deployment"
```

### 5. Impact Analysis
```bash
./snow-flow swarm "Analyze the impact of modifying the incident business rule on all related flows and widgets"
```

## 🔍 Advanced Features

### Multi-Agent Coordination
- **Swarm Intelligence**: Multiple agents work together on complex tasks
- **Specialized Agents**: Each agent has specific expertise (architect, coder, tester)
- **Dynamic Task Distribution**: Intelligent task allocation based on complexity
- **Real-time Coordination**: Agents communicate and coordinate in real-time

### Graph Memory System
- **Relationship Mapping**: Track dependencies between artifacts
- **Pattern Recognition**: Learn from successful implementations
- **Impact Analysis**: Understand change impact before modifications
- **Knowledge Graph**: Build comprehensive understanding of ServiceNow environment

### Natural Language Processing
- **Intelligent Parsing**: Understand complex development requirements
- **Artifact Discovery**: Find existing components automatically
- **Code Generation**: Generate ServiceNow artifacts from descriptions
- **Smart Suggestions**: Provide intelligent recommendations

## 🛡️ Security & Best Practices

### Authentication
- OAuth 2.0 with PKCE for secure authentication
- Token refresh mechanisms
- Secure credential storage
- Multi-instance support

### Change Management
- Automatic update set creation
- Change tracking and validation
- Safe rollback capabilities
- Audit logging

### Error Handling
- Comprehensive error recovery
- Automatic retry mechanisms
- Graceful degradation
- Detailed error reporting

## 📊 Monitoring & Observability

### Metrics
- Request/response times
- Success/failure rates
- Authentication status
- Memory usage
- Cache performance

### Logging
- Structured logging with timestamps
- Configurable log levels
- File-based logging option
- Error tracking and reporting

### Health Checks
- MCP server health status
- ServiceNow connectivity
- Neo4j connectivity (if used)
- Memory system status

## 🚀 Development

### Building from Source
```bash
git clone https://github.com/yourusername/servicenow_multiagent.git
cd servicenow_multiagent
npm install
npm run build
```

### Running Tests
```bash
npm test
npm run test:integration
```

### Development Mode
```bash
npm run dev
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📚 Documentation

- **[MCP Servers](./MCP_SERVERS.md)** - Detailed MCP server documentation
- **[Best Practices](./SERVICENOW_MCP_BEST_PRACTICES.md)** - Development best practices
- **[Configuration](./CLAUDE.md)** - Advanced configuration guide
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🤝 Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/servicenow_multiagent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/servicenow_multiagent/discussions)
- **Wiki**: [Project Wiki](https://github.com/yourusername/servicenow_multiagent/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ServiceNow community for inspiration and feedback
- Claude AI for advanced language processing capabilities
- Neo4j for graph database technology
- Open source contributors

---

**Ready to revolutionize your ServiceNow development?** Start with `./snow-flow swarm "your first objective"` and experience the future of automated ServiceNow development!
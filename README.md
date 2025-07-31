# Snow-Flow: ServiceNow Hive-Mind Intelligence 🧠

⚠️ **WARNING: FLOW CREATION REMOVED (v1.4.0+)** ⚠️

Flow Designer functionality has been removed due to critical issues.
Please use ServiceNow's native Flow Designer interface directly.

**Snow-Flow** provides intelligent AI agents that collaborate to build, test, and deploy ServiceNow solutions through **claude-flow inspired hive-mind architecture**.

## 🧠 The Hive-Mind Revolution

**Inspired by claude-flow philosophy: "One Queen, many simple agents, simple memory, learn and adapt"**

- 👑 **Queen Agent**: Master coordinator that analyzes objectives and spawns specialist agents
- 🤖 **Worker Agents**: ServiceNow specialists (Widget Creator, Script Writer, Security, Test)
- 💾 **Shared Memory**: SQLite-based persistent coordination system
- 🎯 **Claude Code Integration**: All coordination happens through Claude Code interface
- 🚀 **One Command**: `snow-flow swarm "objective"` - everything else is automatic

## ⚠️ BREAKING CHANGES v1.4.0

### Flow Creation Removed

**Why This Change:**
- 38 critical bugs found in flow creation functionality
- 0% success rate in beta testing
- Maintains stability of other features

**What Still Works:**
- ✅ Widget development and deployment
- ✅ Update Set management and tracking
- ✅ ServiceNow authentication and session management
- ✅ Table/field discovery and analysis
- ✅ Multi-agent coordination via memory
- ✅ General ServiceNow operations

**Alternative Approach:**
1. Use snow-flow for discovery and planning:
   ```bash
   snow-flow memory store flow_requirements "Need approval workflow with SLA tracking"
   ```
2. Create flows in ServiceNow Flow Designer interface directly
3. Use snow-flow for other ServiceNow automation tasks

## 🚀 What Snow-Flow Does Best

### Widget Development
```bash
# Create professional ServiceNow widgets
snow-flow swarm "create incident dashboard widget with real-time updates"
```

### Update Set Management  
```bash
# Track and manage update sets
snow-flow auth login
snow-flow update-set create "Widget Development" "Dashboard widgets and improvements"
```

### Table Discovery
```bash
# Analyze ServiceNow table structures
snow-flow swarm "analyze incident table fields and relationships"
```

### Multi-Agent Coordination
```bash
# Coordinate multiple development tasks
snow-flow swarm "analyze requirements and create widget prototypes"
```

## 🛠️ Installation

```bash
# Install globally
npm install -g snow-flow

# Verify installation
snow-flow --version

# Authenticate with ServiceNow
snow-flow auth login
```

## 📖 Core Commands

### Authentication
```bash
snow-flow auth login                    # Login to ServiceNow
snow-flow auth status                   # Check authentication status
```

### Widget Development
```bash
snow-flow swarm "create widget..."      # Create ServiceNow widgets
```

### Update Sets
```bash
snow-flow update-set create <name>      # Create new update set
snow-flow update-set list               # List update sets
snow-flow update-set switch <id>        # Switch to update set
```

### Discovery & Analysis
```bash
snow-flow swarm "analyze table..."      # Analyze ServiceNow tables
snow-flow swarm "discover fields..."    # Field discovery
```

### Memory Management
```bash
snow-flow memory store <key> <data>     # Store persistent data
snow-flow memory get <key>              # Retrieve data
snow-flow memory list                   # List all keys
```

## 🏗️ Architecture

### Agent Types
- **Queen Agent**: Master coordinator and decision maker
- **Widget Creator**: ServiceNow widget specialist
- **Script Writer**: Business rules and client scripts
- **Security Agent**: Access controls and security policies
- **Test Agent**: Automated testing and validation

### Memory System
- **SQLite Backend**: Persistent cross-session memory
- **Hierarchical Storage**: Organized by domain and context
- **Agent Coordination**: Shared knowledge between agents

### ServiceNow Integration
- **OAuth 2.0**: Secure authentication
- **REST APIs**: Direct ServiceNow integration
- **Update Sets**: Change tracking and deployment
- **Table API**: Schema discovery and analysis

## 🔧 Configuration

### Environment Setup
```bash
# Create configuration
snow-flow config init

# Set ServiceNow instance
snow-flow config set instance your-instance.service-now.com

# Configure OAuth
snow-flow config set oauth true
```

### MCP Integration
Snow-Flow includes Model Context Protocol (MCP) servers for extended functionality:

```bash
# Start MCP services
snow-flow mcp start

# Check MCP status
snow-flow mcp status
```

## 🧪 Development Workflows

### Widget Development Workflow
```bash
# 1. Plan widget requirements
snow-flow memory store widget_plan "Dashboard requirements and specs"

# 2. Create widget with swarm
snow-flow swarm "create incident dashboard widget with charts and filtering"

# 3. Test and refine
snow-flow swarm "test widget functionality and improve performance"
```

### Analysis Workflow
```bash
# 1. Discover table structure
snow-flow swarm "analyze incident table fields and relationships"

# 2. Plan improvements
snow-flow memory store analysis_results "Field analysis and recommendations"

# 3. Document findings
snow-flow swarm "create documentation for table analysis"
```

## 📚 Documentation

- **Authentication**: Setup OAuth and basic auth
- **Widget Development**: Create and deploy ServiceNow widgets
- **Update Sets**: Manage change tracking
- **Memory System**: Cross-agent coordination
- **MCP Integration**: Extended functionality

## 🤝 Contributing

Snow-Flow is open source. Contributions welcome!

```bash
# Clone repository
git clone https://github.com/groeimetai/snow-flow.git

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **GitHub Issues**: https://github.com/groeimetai/snow-flow/issues  
- **Documentation**: See /docs directory in repository
- **Examples**: See /examples directory

## 🔮 Roadmap

### Planned Enhancements
- Enhanced widget templates and patterns
- Advanced ServiceNow API integrations  
- Extended table analysis capabilities
- Improved multi-agent coordination
- Enterprise security features

### Flow Designer Notice
Flow creation functionality has been permanently removed. Users should use ServiceNow's native Flow Designer interface directly for flow development.

---

**Snow-Flow v1.4.0** - Focused, stable, reliable ServiceNow development automation.
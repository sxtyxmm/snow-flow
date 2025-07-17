# Snow-Flow v1.1.0 - ServiceNow Multi-Agent Development Framework

🚀 **Intelligent ServiceNow development with autonomous agents and natural language processing**

Snow-Flow is a powerful framework that combines AI agents, ServiceNow integration, and Claude Code compatibility for seamless development workflows.

## ✨ Key Features

- 🤖 **5 Specialized MCP Servers** for direct ServiceNow integration
- 🧠 **Neo4j Graph Memory** for intelligent artifact understanding
- 🔄 **Natural Language Flow Composer** for complex workflows
- 📦 **Autonomous Update Set Management** for safe deployments
- 🔍 **Intelligent Artifact Discovery** with memory indexing
- 💡 **Claude Code Integration** with real-time MCP tools

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/nielsvanderwerf/servicenow_multiagent.git
cd servicenow_multiagent
npm install
```

### 2. Configure ServiceNow Credentials
```bash
cp .env.example .env
# Edit .env with your ServiceNow OAuth credentials
```

### 3. Initialize Project
```bash
npm run build  # Builds project and generates MCP configuration
```

### 4. Start Development
Open the project in Claude Code - all MCP servers will be automatically available!

## 🔧 MCP Servers Available in Claude Code

After building, you'll have access to these tools in Claude Code:

### 🚀 ServiceNow Deployment MCP
- `snow_deploy_widget` - Deploy widgets directly to ServiceNow
- `snow_deploy_flow` - Create and deploy Flow Designer workflows
- `snow_deploy_application` - Deploy complete applications
- `snow_validate_deployment` - Validate before deployment

### 🧠 ServiceNow Flow Composer MCP  
- `snow_create_complex_flow` - Natural language flow creation
- `snow_analyze_flow_instruction` - Intelligent requirement analysis
- `snow_discover_flow_artifacts` - Automatic artifact discovery
- `snow_preview_flow_structure` - Preview before deployment

### 📦 ServiceNow Update Set MCP
- `snow_update_set_create` - Create Update Sets for user stories
- `snow_update_set_switch` - Switch between Update Sets
- `snow_update_set_complete` - Mark Update Sets as complete
- `snow_update_set_preview` - Preview all changes

### 🔍 ServiceNow Intelligent MCP
- `snow_find_artifact` - Natural language artifact search
- `snow_edit_artifact` - Modify artifacts with natural language
- `snow_analyze_artifact` - Deep artifact analysis and indexing
- `snow_memory_search` - Search intelligent artifact memory

### 🗂️ ServiceNow Graph Memory MCP
- `snow_graph_index_artifact` - Index artifacts in Neo4j graph
- `snow_graph_find_related` - Discover artifact relationships
- `snow_graph_analyze_impact` - Impact analysis for changes
- `snow_graph_suggest_artifacts` - AI-powered recommendations

## 🛠️ Development Workflow

### Standard Development
```bash
# In Claude Code, use MCP tools directly:
# 1. Create Update Set: snow_update_set_create
# 2. Find/create artifacts: snow_find_artifact or snow_create_complex_flow  
# 3. Deploy: snow_deploy_widget or snow_deploy_flow
# 4. Complete Update Set: snow_update_set_complete
```

### Command Line Usage
```bash
# Initialize project with SPARC environment
snow-flow init --sparc

# Authenticate with ServiceNow
snow-flow auth login

# Start multi-agent swarm
snow-flow swarm "create a dashboard widget for incident management"

# Run specific SPARC mode
snow-flow sparc tdd "user authentication system"

# Manage MCP servers
snow-flow mcp start
snow-flow mcp status
snow-flow mcp restart
```

## 📁 Project Structure

```
├── .mcp.json                    # Auto-generated MCP server configuration
├── dist/mcp/                    # Compiled MCP servers (auto-generated)
│   ├── servicenow-deployment-mcp.js
│   ├── servicenow-flow-composer-mcp.js
│   ├── servicenow-update-set-mcp.js
│   ├── servicenow-intelligent-mcp.js
│   └── servicenow-graph-memory-mcp.js
├── src/mcp/                     # MCP server source code
├── scripts/setup-mcp.js         # MCP configuration generator
├── .claude/                     # Claude configuration
├── memory/                      # Persistent agent memory
└── servicenow/                  # Generated artifacts
```

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# ServiceNow OAuth Configuration
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret

# Neo4j Configuration (optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Snow-Flow Configuration  
SNOW_FLOW_DEBUG=false
SNOW_FLOW_MAX_AGENTS=5
SNOW_FLOW_TIMEOUT_MINUTES=0
```

### ServiceNow OAuth Setup
1. Log into your ServiceNow instance as admin
2. Navigate to: **System OAuth > Application Registry**
3. Click **"New" > "Create an OAuth application"**
4. Configure:
   - **Name**: Snow-Flow Development
   - **Redirect URL**: `http://localhost:3000/callback`
   - **Grant Type**: Authorization Code
5. Copy Client ID and Client Secret to `.env`
6. Run: `snow-flow auth login`

## 🔄 How It Works

### Automatic MCP Configuration
Snow-Flow uses a dynamic MCP configuration system:

1. **Build Process**: `npm run build` compiles TypeScript and runs `npm run setup-mcp`
2. **Dynamic Generation**: `scripts/setup-mcp.js` reads environment variables and generates `.mcp.json` with absolute paths
3. **Claude Code Integration**: `.mcp.json` is automatically discovered by Claude Code
4. **Portable**: Works on any machine after `npm run build` (no hardcoded paths in git)

### Authentication Handling
- MCP servers defer authentication checks to individual tools
- Servers start successfully even without credentials
- Tools show friendly error messages with setup instructions
- Enables development mode with file generation when offline

## 🧪 Testing MCP Servers

Test individual servers:
```bash
# Test server initialization
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"},"capabilities":{}},"id":1}' | node dist/mcp/servicenow-deployment-mcp.js

# Test tool listing
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' | node dist/mcp/servicenow-deployment-mcp.js
```

## 🐛 Troubleshooting

### MCP Servers Show as "Failed" in Claude Code
```bash
# Rebuild and regenerate MCP configuration
npm run build

# Check environment variables are set
cat .env

# Test individual server
node dist/mcp/servicenow-deployment-mcp.js
```

### ServiceNow Authentication Issues
```bash
# Re-authenticate
snow-flow auth login

# Check credentials
snow-flow auth status

# Update environment variables
nano .env
npm run setup-mcp
```

### Build Issues
```bash
# Clean build
rm -rf dist/
npm run build

# Check TypeScript errors
npm run typecheck
```

## 📚 Advanced Usage

### Custom Flow Creation
```javascript
// Use natural language instructions with Flow Composer MCP
snow_create_complex_flow({
  instruction: "Create a flow that translates incident descriptions to English using LLM when priority is high",
  deploy_immediately: true
});
```

### Intelligent Artifact Discovery
```javascript
// Find widgets using natural language
snow_find_artifact({
  query: "the widget that shows incidents on homepage",
  type: "widget"
});
```

### Graph Memory Integration
```javascript
// Index artifacts for intelligent understanding
snow_graph_index_artifact({
  artifact: {
    id: "widget_123",
    name: "Incident Dashboard",
    type: "widget",
    content: "...",
    purpose: "Display incident metrics"
  },
  relationships: [
    {
      to: "script_include_456", 
      type: "USES",
      data_flow: "incident data"
    }
  ]
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Powered by [Claude Code](https://claude.ai/code) 
- ServiceNow integration via OAuth 2.0
- Graph memory with Neo4j

---

**🚀 Happy coding with Snow-Flow v1.1.0!**

*For support and updates, visit the [GitHub repository](https://github.com/nielsvanderwerf/servicenow_multiagent)*
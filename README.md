# ServiceNow Multi-Agent Orchestrator v1.1.0

An advanced AI-powered orchestration system for ServiceNow development with Natural Language Understanding, intelligent artifact discovery, and automated deployment capabilities.

## 🚀 Features

- **Natural Language Understanding**: Create ServiceNow artifacts using plain English instructions
- **Intelligent Artifact Discovery**: Find and analyze existing ServiceNow components
- **Direct ServiceNow Deployment**: Deploy widgets, flows, and applications directly via MCP tools
- **Multi-Agent Orchestration**: Coordinate multiple AI agents for complex tasks
- **Neo4j Graph Memory**: Intelligent relationship mapping and impact analysis
- **Update Set Management**: Automatic tracking of all ServiceNow changes
- **OAuth 2.0 with PKCE**: Secure authentication to ServiceNow instances

## 📋 Prerequisites

- Node.js 18+ 
- ServiceNow instance with OAuth 2.0 enabled
- Neo4j database (optional, for graph memory features)
- Claude Code (Anthropic's official CLI)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/servicenow-multiagent.git
cd servicenow-multiagent
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Configure your ServiceNow credentials in `.env`:
```
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
```

4. Initialize the project:
```bash
npm install
snow-flow init --sparc
```

The init command will:
- Build the TypeScript project
- Generate MCP configuration dynamically
- Start all MCP servers
- Register servers with Claude Code
- Set up the SPARC development environment

## 🤖 MCP Server Configuration

This project uses a dynamic MCP configuration system for portability:

- `.mcp.json.template` - Template file (committed to git)
- `.mcp.json` - Generated file with absolute paths (git-ignored)

The configuration is generated automatically during `npm run build` or manually with:
```bash
npm run setup-mcp
```

### Available MCP Servers

1. **ServiceNow Deployment MCP** - Direct deployment of widgets, flows, and applications
2. **ServiceNow Flow Composer MCP** - Natural language flow creation
3. **ServiceNow Update Set MCP** - Update set management and tracking
4. **ServiceNow Intelligent MCP** - Natural language artifact discovery and editing
5. **ServiceNow Graph Memory MCP** - Neo4j-based intelligent memory system

## 🎯 Quick Start

### Create a Widget
```bash
snow-flow sparc "create an incident management dashboard widget with real-time updates"
```

### Create a Complex Flow
```bash
snow-flow create-flow "when high priority incident is created, translate description to English and notify manager"
```

### Multi-Agent Development
```bash
snow-flow swarm "build complete incident management system" --strategy development --parallel
```

## 📚 Command Reference

### Core Commands
- `snow-flow init [--sparc]` - Initialize project with optional SPARC environment
- `snow-flow auth login` - Authenticate with ServiceNow
- `snow-flow status` - Show system status
- `snow-flow monitor` - Real-time monitoring dashboard

### MCP Server Management
- `snow-flow mcp start` - Start all MCP servers
- `snow-flow mcp stop` - Stop all MCP servers
- `snow-flow mcp status` - Check MCP server status
- `snow-flow mcp restart` - Restart MCP servers

### Development Commands
- `snow-flow sparc "<task>"` - Run SPARC orchestrator mode
- `snow-flow sparc run <mode> "<task>"` - Run specific SPARC mode
- `snow-flow swarm "<objective>" [options]` - Multi-agent coordination

### Natural Language Commands
- `snow-flow find "<query>"` - Find artifacts using natural language
- `snow-flow edit "<instruction>"` - Edit artifacts with natural language
- `snow-flow create-flow "<instruction>"` - Create flows from natural language

## 🧠 Natural Language Examples

### Widget Creation
```
"Create a widget that shows incidents by priority with color coding"
"Build a dashboard widget for tracking SLA breaches"
```

### Flow Creation
```
"Create approval flow for purchases over $1000 with manager notification"
"When incident priority changes to high, create a problem record and assign to CAB"
```

### Artifact Discovery
```
"Find all widgets related to incident management"
"Show me flows that send email notifications"
```

## 🔐 ServiceNow OAuth Setup

1. In ServiceNow, navigate to **System OAuth > Application Registry**
2. Create new OAuth API endpoint for external clients
3. Set redirect URL to `http://localhost:3000/callback`
4. Grant necessary scopes including `useraccount` and `admin`
5. Copy Client ID and Client Secret to `.env`

## 📊 Neo4j Graph Memory (Optional)

For intelligent artifact relationship mapping:

1. Install Neo4j Desktop or use Neo4j Aura
2. Configure connection in `.env`:
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
```

3. The system will automatically index artifacts and relationships

## 🛠️ Development

### Build the Project
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
servicenow-multiagent/
├── src/
│   ├── mcp/                 # MCP server implementations
│   ├── orchestrator/        # Core orchestration logic
│   ├── agents/              # AI agent implementations
│   ├── utils/               # Utility functions
│   └── cli.ts              # CLI entry point
├── dist/                    # Compiled JavaScript (git-ignored)
├── memory/                  # Persistent memory storage
├── .mcp.json.template      # MCP configuration template
├── .env.example            # Environment template
└── CLAUDE.md               # Instructions for Claude Code
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Claude Code (Anthropic)
- Uses Model Context Protocol (MCP) for AI integration
- Powered by ServiceNow's REST APIs
- Graph memory powered by Neo4j
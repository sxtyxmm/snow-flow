# Snow-Flow: ServiceNow Development Platform

[![npm version](https://img.shields.io/npm/v/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/groeimetai/snow-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/groeimetai/snow-flow/actions/workflows/ci.yml)
[![Downloads](https://img.shields.io/npm/dm/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![Node Version](https://img.shields.io/node/v/snow-flow.svg)](https://www.npmjs.com/package/snow-flow)
[![ServiceNow Compatible](https://img.shields.io/badge/ServiceNow-Compatible-00A1E0?logo=servicenow)](https://www.servicenow.com)
[![GitHub Stars](https://img.shields.io/github/stars/groeimetai/snow-flow?style=social)](https://github.com/groeimetai/snow-flow)

Snow-Flow is an AI-powered development platform for ServiceNow that provides 180+ MCP tools and multi-agent coordination. It enables developers and administrators to interact with ServiceNow through natural language commands and automated workflows.

## Core Functionality

Snow-Flow connects directly to ServiceNow instances through OAuth 2.0 authentication and provides:

- Direct API integration with ServiceNow REST endpoints
- Multi-agent system with specialized agents for different tasks
- Natural language interface for ServiceNow operations
- Machine learning capabilities using TensorFlow.js
- Process automation and workflow optimization

## ServiceNow API Integration

### Authentication
Snow-Flow uses OAuth 2.0 for secure authentication with ServiceNow:

```bash
snow-flow auth login
# Opens ServiceNow OAuth consent screen
# Authenticate with ServiceNow credentials
# Token stored locally in ~/.snow-flow/auth.json
```

### Security
- OAuth 2.0 authentication protocol
- Respects ServiceNow ACLs and user permissions
- Local token storage with encryption
- No external data transmission
- All operations logged in ServiceNow audit trails

### Network Architecture
```
┌─────────────┐    OAuth 2.0 + REST APIs    ┌─────────────────┐
│  Snow-Flow  │ ◄─────────────────────────► │ Your ServiceNow │
│   (Local)   │      HTTPS Only              │    Instance     │
└─────────────┘                              └─────────────────┘
```

## Available Tools

Snow-Flow provides 180+ tools across 17 specialized MCP servers:

### Table Operations
The universal `snow_query_table` tool works with all ServiceNow tables:

```javascript
// Query any table with optimized performance
snow_query_table({ 
  table: "incident",  // Works with any table
  query: "state!=7",
  fields: ["number", "short_description", "priority"],
  limit: 100
})

// Analytics mode - retrieve all records with minimal fields
snow_query_table({ 
  table: "incident",
  fields: ["sys_created_on", "priority"]  // Omit limit for all records
})

// Count-only mode for large datasets
snow_query_table({ 
  table: "sc_request",
  include_content: false  // Returns count only
})

// Server-side aggregation
snow_query_table({ 
  table: "change_request",
  group_by: "risk",
  order_by: "-count"
})
```

### Development Tools
- Widget creation and deployment
- Business rule development
- Script include management
- Flow Designer automation
- UI Page creation
- Portal configuration

### Service Management
- Incident management
- Change management with CAB scheduling
- Problem management
- Request fulfillment
- Knowledge management

### Enterprise APIs
- Performance Analytics (PA) with KPI management
- Virtual Agent configuration
- Agent Workspace customization
- Mobile platform deployment
- CMDB and Discovery
- Event Management
- HR Service Delivery
- Customer Service Management
- DevOps integration

### Machine Learning

Snow-Flow includes TensorFlow.js for neural network capabilities:

#### Incident Classification
Train LSTM networks on historical incident data:
```bash
snow-flow ml train-incident-classifier --sample-size 5000 --epochs 100
snow-flow ml classify-incident INC0123456
```

#### Change Risk Prediction
Analyze change requests to predict implementation risk:
```bash
snow-flow ml train-change-risk --include-failed-changes
snow-flow ml predict-change-risk CHG0123456
```

#### Time Series Forecasting
Predict future incident volumes:
```bash
snow-flow ml forecast-incidents --days 7 --category network
```

#### Anomaly Detection
Detect unusual patterns using autoencoder networks:
```bash
snow-flow ml detect-anomalies --metric incident_patterns --sensitivity 0.9
```

### ServiceNow Native ML Integration

Access ServiceNow's native ML capabilities when licensed:

#### Performance Analytics ML
```bash
snow-flow ml performance-analytics --indicator "Incident Resolution Time" --forecast-days 90
```

#### Predictive Intelligence
```bash
snow-flow ml predictive-intelligence --operation similar_incidents --incident INC0123456
```

#### Agent Intelligence
```bash
snow-flow ml agent-intelligence --task incident --id INC0123456 --auto-assign
```

Note: Native ML features require appropriate ServiceNow plugin licenses (PA, PI, Agent Intelligence).

## Multi-Agent System

Snow-Flow includes 38 specialized agents that work together:

### Agent Types
- **Architect**: System design and architecture planning
- **Developer**: Code generation and implementation
- **Tester**: Test creation and execution
- **Analyst**: Data analysis and reporting
- **Security**: Compliance and security validation
- **Optimizer**: Performance optimization
- **Documenter**: Documentation generation

### Coordination Modes
- **Hierarchical**: Top-down task delegation
- **Mesh**: Peer-to-peer collaboration
- **Swarm**: Distributed problem solving
- **Adaptive**: Dynamic reorganization based on task requirements

## Installation

### Prerequisites
- Node.js 18.0 or higher
- npm 8.0 or higher
- ServiceNow instance with admin access
- OAuth application configured in ServiceNow

### Install via npm
```bash
npm install -g snow-flow
```

### Initial Setup
```bash
# Initialize configuration
snow-flow init

# Configure authentication
snow-flow auth login

# Verify connection
snow-flow auth test
```

## Usage Examples

### Natural Language Commands
```bash
# Create an incident dashboard
snow-flow sparc "Create incident management dashboard with SLA tracking"

# Build a workflow
snow-flow sparc "Create employee onboarding workflow with approval steps"

# Analyze data
snow-flow sparc "Analyze incident resolution patterns from last quarter"
```

### Direct Tool Usage
```bash
# Query incidents
snow-flow query --table incident --limit 10

# Create a widget
snow-flow deploy widget --name "SLA Dashboard" --template dashboard

# Generate documentation
snow-flow generate docs --scope "incident_management"
```

### Swarm Coordination
```bash
# Multi-agent development
snow-flow swarm "Build complete HR service portal" \
  --strategy development \
  --mode hierarchical \
  --max-agents 8

# Analysis swarm
snow-flow swarm "Analyze system performance bottlenecks" \
  --strategy analysis \
  --mode mesh \
  --parallel
```

## Configuration

Configuration file location: `~/.snow-flow/.env`

### Required Settings
```env
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id
SNOW_CLIENT_SECRET=your-oauth-client-secret
```

### Optional Settings
```env
# Timeout configuration (milliseconds)
# SNOW_FLOW_INIT_TIMEOUT=30000
# SNOW_FLOW_OPERATION_TIMEOUT=60000
# SNOW_FLOW_MEMORY_TIMEOUT=5000

# Agent configuration
SNOW_FLOW_MAX_AGENTS=10
SNOW_FLOW_AGENT_MODE=hierarchical

# ML configuration
SNOW_FLOW_ML_ENABLED=true
SNOW_FLOW_ML_MODEL_PATH=./models
```

## Project Structure
```
snow-flow/
├── src/                 # Source code
│   ├── agents/         # Agent implementations
│   ├── mcp/           # MCP server implementations
│   ├── utils/         # Utility functions
│   └── services/      # Service layer
├── dist/               # Compiled JavaScript
├── memory/             # Persistent storage
├── models/             # ML models
└── tests/              # Test suite
```

## Documentation

- [API Reference](docs/api.md)
- [Agent Documentation](docs/agents.md)
- [MCP Tools Reference](docs/tools.md)
- [ML Capabilities](docs/ml.md)
- [Configuration Guide](docs/configuration.md)

## Contributing

Contributions are welcome. Please read the [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Support

- GitHub Issues: [github.com/groeimetai/snow-flow/issues](https://github.com/groeimetai/snow-flow/issues)
- Documentation: [github.com/groeimetai/snow-flow/wiki](https://github.com/groeimetai/snow-flow/wiki)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- ServiceNow for the comprehensive REST API
- TensorFlow.js for machine learning capabilities
- Model Context Protocol (MCP) for tool orchestration
# 🏄‍♂️ Snow-Flow + Windsurf Integration

**Conversational ServiceNow development in Windsurf AI IDE**

This document explains how to set up and use Snow-Flow with Windsurf IDE for ServiceNow development.

## What is Windsurf?

[Windsurf](https://codeium.com/windsurf) is Codeium's AI-powered IDE that offers advanced coding assistance, similar to Cursor but with its own unique AI capabilities. It provides:

- **Conversational AI Assistant**: Natural language coding assistance
- **Context-Aware Suggestions**: Understands your entire codebase
- **Multi-file Editing**: AI can edit across multiple files simultaneously  
- **Advanced Refactoring**: Intelligent code improvements
- **Extension Ecosystem**: VS Code compatible with additional AI features

## Snow-Flow + Windsurf = Perfect Match

Snow-Flow's conversational ServiceNow development approach works perfectly with Windsurf's AI-powered IDE:

- **Natural Language ServiceNow Development**: Describe what you want instead of coding it manually
- **20+ MCP Servers**: Direct ServiceNow integration through specialized tools
- **Local Artifact Editing**: Pull ServiceNow widgets/scripts locally, edit with Windsurf's AI, push back
- **Multi-Agent Coordination**: Complex ServiceNow tasks handled by coordinated AI agents
- **Machine Learning Integration**: TensorFlow.js neural networks for ServiceNow data analysis

## Setup Instructions

### 1. Install Prerequisites

```bash
# Install Node.js 18+ 
node --version  # Should be 18.0.0 or higher

# Install Snow-Flow globally
npm install -g snow-flow

# Verify installation
snow-flow --version
```

### 2. Open Project in Windsurf

1. **Download Windsurf IDE**: Get it from [codeium.com/windsurf](https://codeium.com/windsurf)
2. **Clone Snow-Flow project**: 
   ```bash
   git clone https://github.com/sxtyxmm/snow-flow.git
   cd snow-flow
   ```
3. **Open in Windsurf**: File → Open Folder → Select snow-flow directory
4. **Install dependencies**: 
   ```bash
   npm install
   ```

### 3. Configure ServiceNow Authentication

Create a `.env` file in the project root:

```bash
# ServiceNow instance details
SNOW_INSTANCE=your-instance.service-now.com
SNOW_CLIENT_ID=your-oauth-client-id  
SNOW_CLIENT_SECRET=your-oauth-client-secret

# Optional: Snow-Flow specific settings
SNOW_FLOW_ENV=development
SNOW_FLOW_DEBUG=false
```

### 4. Authenticate with ServiceNow

```bash
# Authenticate (opens browser for OAuth)
npx snow-flow auth login

# Verify connection
npx snow-flow auth status
```

### 5. Build the Project

```bash
# Build Snow-Flow MCP servers
npm run build

# Test the build
npm test
```

## Using Snow-Flow in Windsurf

### Conversational ServiceNow Development

Instead of manually coding ServiceNow artifacts, describe what you want to Windsurf's AI:

**Example 1: Create an Incident Dashboard Widget**
```
AI: Create a ServiceNow widget that displays:
- Real-time incident count by priority  
- Interactive charts showing trends over last 30 days
- Filter buttons for priority and category
- Mobile-responsive design
- Auto-refresh every 60 seconds

Use the snow_create_widget MCP tool and ensure ES5 JavaScript syntax.
```

**Example 2: Pull and Debug a Widget Locally**
```
AI: I need to debug the incident dashboard widget (sys_id: abc123). 
Use snow_pull_artifact to bring it locally so I can:
- Fix a JavaScript error in the client script
- Add new chart types to the template  
- Improve the CSS styling
- Test the data queries

After editing, push it back with snow_push_artifact.
```

### Key MCP Tools Available in Windsurf

When working with Windsurf's AI, you can reference these Snow-Flow MCP tools:

**Core Operations:**
- `snow_query_table` - Query any ServiceNow table  
- `snow_execute_script_with_output` - Run ServiceNow background scripts
- `snow_create_incident` - Create and manage incidents

**Local Development:**
- `snow_pull_artifact` - Pull ServiceNow artifacts to local files
- `snow_push_artifact` - Push local changes back to ServiceNow
- `snow_validate_artifact_coherence` - Check widget HTML/client/server alignment

**Deployment:**
- `snow_deploy` - Deploy widgets with validation
- `snow_create_update_set` - Manage update sets
- `snow_export_artifact` - Export for backup/migration

**Machine Learning:**
- `ml_train_incident_classifier` - Train neural networks on ServiceNow data
- `snow_predict_change_risk` - ML-powered change risk assessment
- `snow_detect_anomalies` - Anomaly detection in ServiceNow data

**Advanced Features:**
- `snow_create_complete_workspace` - Create full UX workspaces
- `snow_batch_api` - Optimize API calls (80% reduction)
- `snow_discover_process` - Process mining and optimization

### Windsurf-Specific Tips

1. **Use Natural Language**: Describe ServiceNow requirements conversationally rather than writing code
2. **Leverage Context**: Windsurf understands the entire Snow-Flow codebase for better suggestions  
3. **Multi-file Operations**: Ask Windsurf to modify multiple ServiceNow artifacts simultaneously
4. **ES5 Enforcement**: Windsurf can automatically convert modern JavaScript to ES5 for ServiceNow compatibility
5. **Real-time Validation**: Use Windsurf's error detection with Snow-Flow's coherence validation

### Example Workflows

**Widget Development Workflow:**
```
1. AI: "Create a new incident management widget with advanced filtering"
2. Windsurf generates widget structure using Snow-Flow MCP tools
3. AI: "Add real-time notifications and improve mobile responsiveness" 
4. Windsurf enhances the widget using snow_pull_artifact for local editing
5. AI: "Deploy to test instance and validate coherence"
6. Windsurf uses snow_deploy and snow_validate_artifact_coherence
```

**Process Optimization Workflow:**
```
1. AI: "Analyze our incident management process for bottlenecks"
2. Windsurf uses snow_discover_process for process mining
3. AI: "Create ML model to predict incident escalation risk"
4. Windsurf leverages ml_train_incident_classifier for predictions
5. AI: "Build dashboard showing optimization recommendations"
6. Windsurf creates complete workspace with snow_create_complete_workspace
```

## Configuration Files

Snow-Flow includes Windsurf-specific configuration in `.windsurf/`:

- **`.windsurf/settings.json`**: MCP server configurations and AI instructions
- **`.windsurf/workspace.json`**: Project layout and context for Windsurf AI

These files help Windsurf understand the Snow-Flow architecture and provide better ServiceNow development assistance.

## Troubleshooting

**Common Issues:**

1. **MCP Servers Not Loading**: 
   - Ensure `npm run build` completed successfully
   - Check that all environment variables are set correctly

2. **ServiceNow Authentication Errors**:
   - Run `npx snow-flow auth status` to check authentication
   - Verify OAuth client configuration in ServiceNow

3. **TypeScript Build Errors**:
   - Install required dependencies: `npm install`
   - Check Node.js version: `node --version` (requires 18+)

4. **Widget Debugging Issues**:
   - Always use `snow_pull_artifact` for local editing instead of `snow_query_table`
   - Ensure ES5 JavaScript syntax in ServiceNow scripts

## Advanced Features

### Multi-Agent Coordination in Windsurf

Snow-Flow can spawn multiple specialized agents for complex ServiceNow tasks:

```bash
# Example: Create complete ServiceNow solution with multiple agents
npx snow-flow swarm "create incident management solution with:
- Custom incident dashboard widget
- Automated assignment rules  
- ML-powered priority prediction
- Mobile-responsive design
- Performance analytics integration" --max-agents 5
```

### Machine Learning Integration

Train ServiceNow-specific ML models directly in Windsurf:

```javascript
// Windsurf AI can generate this automatically
const classifier = await ml_train_incident_classifier({
  table: 'incident',
  features: ['short_description', 'category', 'urgency'],
  target: 'priority',
  modelType: 'lstm'
});
```

## Best Practices

1. **Use Conversational Development**: Let Windsurf's AI generate ServiceNow code rather than writing manually
2. **Leverage Local Sync**: Pull artifacts locally for better editing experience with Windsurf's tools
3. **Validate Early**: Use Snow-Flow's coherence validation before deploying
4. **Think Multi-Agent**: Break complex ServiceNow tasks into agent-coordinated workflows
5. **ES5 Only**: Always ensure ServiceNow scripts use ES5 syntax (Windsurf can enforce this)

## Resources

- **Snow-Flow Documentation**: [README.md](../README.md)
- **Snow-Flow Best Practices**: [CLAUDE.md](../CLAUDE.md)
- **Windsurf IDE**: [codeium.com/windsurf](https://codeium.com/windsurf)
- **ServiceNow Documentation**: [docs.servicenow.com](https://docs.servicenow.com)

## Support

- **GitHub Issues**: [github.com/sxtyxmm/snow-flow/issues](https://github.com/sxtyxmm/snow-flow/issues)
- **Windsurf Support**: [codeium.com/chat](https://codeium.com/chat)

---

**Happy ServiceNow development with Snow-Flow + Windsurf! 🏄‍♂️⚡**
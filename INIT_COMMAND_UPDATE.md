# Init Command Update Plan for MCP-FIRST Workflow

## 🚨 Current Situation
The `snow-flow init` command creates essential files for new projects, but needs updates to reflect the MCP-FIRST workflow and swarm-centric approach.

## 📁 What Init Currently Creates

### Directory Structure ✅
```
.claude/
  commands/
    sparc/         # 17 SPARC mode files
  configs/
.swarm/
  sessions/
  agents/
memory/
  agents/
  sessions/
servicenow/
  widgets/
  workflows/
  scripts/
templates/
  widgets/
  workflows/
```

### Files Created
1. **CLAUDE.md** - Copied from source (needs to be MCP-FIRST version) ⚠️
2. **README.md** - Comprehensive project readme ✅
3. **.env** - ServiceNow OAuth credentials template ✅
4. **.mcp.json** - MCP server configuration ✅
5. **.claude/settings.json** - Claude Code settings ✅
6. **SPARC mode files** - 17 individual mode documentation files ✅

## 🔧 Required Updates

### 1. **Enhanced CLAUDE.md Generation**
The init command should ensure CLAUDE.md includes:
- ✅ MCP-FIRST workflow as mandatory
- ✅ Swarm command as primary interface 
- ✅ Queen Agent backend architecture
- ✅ Complete MCP tool reference
- ❌ **Missing**: Agent pattern examples
- ❌ **Missing**: Common swarm workflows
- ❌ **Missing**: Troubleshooting guides

### 2. **New Files to Generate**

#### `.claude/commands/swarm-patterns.md`
```markdown
# Swarm Command Patterns

## Basic Widget Creation
snow-flow swarm "create incident dashboard widget"

## Flow Development  
snow-flow swarm "create approval workflow for equipment requests"

## Complex Integration
snow-flow swarm "integrate ServiceNow with Slack notifications"

## Testing Patterns
snow-flow swarm "test existing flows and create comprehensive test report"
```

#### `.claude/commands/mcp-tools-quick-ref.md`
```markdown
# MCP Tools Quick Reference

## Most Used Tools
- snow_deploy - Universal deployment for all artifacts
- snow_find_artifact - Find existing ServiceNow items
- snow_create_flow - Natural language flow creation
- snow_test_flow_with_mock - Test flows with mock data

## Authentication Tools
- snow_validate_live_connection - Check ServiceNow connection
- snow_auth_diagnostics - Debug authentication issues
```

#### `.claude/commands/agent-types.md`
```markdown
# Agent Types and Specializations

## Primary Agents
- widget-creator: HTML, CSS, JS, ServiceNow widgets
- flow-builder: Process automation, approvals
- script-writer: Business rules, script includes
- app-architect: System design, tables, relationships

## Supporting Agents
- researcher: Discovery, best practices
- tester: Quality assurance, validation
- security: Access controls, compliance
```

#### `memory/patterns/successful-deployments.json`
```json
{
  "patterns": [
    {
      "objective": "create incident dashboard widget",
      "agents": ["widget-creator", "tester"],
      "mcpTools": ["snow_deploy", "snow_widget_test"],
      "successRate": 0.95
    }
  ]
}
```

### 3. **Enhanced .env Template**
```env
# ServiceNow OAuth Configuration
SNOW_INSTANCE=your-instance
SNOW_CLIENT_ID=your_oauth_client_id
SNOW_CLIENT_SECRET=your_oauth_client_secret

# Optional: Direct credentials (less secure)
SNOW_USERNAME=admin
SNOW_PASSWORD=admin_password

# Agent Configuration
MAX_AGENTS=5
AUTO_DEPLOY=true
SMART_DISCOVERY=true

# Memory Configuration  
MEMORY_TTL=86400
```

### 4. **Pre-configured Swarm Examples**

#### `examples/widget-dashboard.sh`
```bash
#!/bin/bash
# Example: Create an incident dashboard widget
snow-flow swarm "create incident dashboard widget with:
- Real-time incident counts by priority
- Chart.js visualizations
- Mobile responsive design
- Auto-refresh every 30 seconds"
```

#### `examples/approval-workflow.sh`
```bash
#!/bin/bash
# Example: Create equipment approval workflow
snow-flow swarm "create approval workflow for equipment requests with:
- Manager approval for items over $1000
- Auto-approval for items under $100
- Email notifications at each step
- Integration with catalog items"
```

## 🎯 Implementation Priority

1. **CRITICAL**: Ensure CLAUDE.md includes MCP-FIRST workflow ⚨
2. **HIGH**: Add swarm pattern examples and agent documentation
3. **MEDIUM**: Create pre-configured example scripts
4. **LOW**: Add troubleshooting guides

## 📋 Benefits for Users

- **Faster onboarding**: Clear examples of how to use swarm commands
- **Better understanding**: Agent types and capabilities documented
- **Quick reference**: MCP tools at their fingertips
- **Success patterns**: Learn from pre-configured examples
- **Self-service**: Troubleshooting guides reduce support needs

## 🚀 Next Steps

1. Update `createSparcFiles()` to generate additional documentation
2. Add `createSwarmExamples()` function for example scripts
3. Enhance `createEnvFile()` with more configuration options
4. Create `createAgentDocumentation()` for agent type reference
5. Test complete init flow with new user scenario
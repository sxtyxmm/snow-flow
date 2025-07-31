# Snow-Flow v1.4.2 Release Notes

## 🚨 CRITICAL HOTFIX - Init Command Restored

### Overview
Snow-Flow v1.4.2 is an emergency hotfix that restores the critical `init` command which was accidentally removed in v1.4.0/v1.4.1.

### 🔴 Critical Bug Fixed

#### Init Command Missing
- **Issue**: The `snow-flow init` command was completely missing in v1.4.0 and v1.4.1
- **Impact**: New users could not initialize Snow-Flow projects
- **Cause**: Accidentally removed during flow creation cleanup
- **Resolution**: Fully restored with all functionality

### ✅ What's Fixed
- **`snow-flow init`**: Fully restored with all features
- **`snow-flow init --sparc`**: Initialize with SPARC methodology and MCP servers
- **MCP Activation**: Interactive prompt to start Claude Code with MCP servers
- **Project Structure**: Creates all required directories and files
- **Documentation**: Generates README.md and CLAUDE.md files
- **Environment Setup**: Creates .env template with ServiceNow OAuth configuration

### 📋 Init Command Features Restored
```bash
# Initialize Snow-Flow project
snow-flow init --sparc

# What it creates:
✓ .claude/          - Claude Code configuration
✓ .swarm/           - Swarm session management  
✓ memory/           - Persistent memory storage
✓ .env              - ServiceNow OAuth configuration template
✓ .mcp.json         - MCP server configuration for Claude Code
✓ CLAUDE.md         - Development documentation
✓ README.md         - Project documentation

# Optional: Skip MCP activation prompt
snow-flow init --sparc --skip-mcp
```

### 🎯 Why This Matters
The `init` command is **essential** for:
- Setting up new Snow-Flow projects
- Configuring MCP servers for Claude Code
- Creating proper directory structure
- Generating configuration templates
- Enabling ServiceNow OAuth setup

### 📊 Impact
- **Severity**: CRITICAL
- **Users Affected**: All new installations
- **Functionality**: Core project initialization
- **Resolution**: 100% functionality restored

### 🔧 Technical Details
- Restored init command definition in cli.ts
- Restored activateMCPServers() function
- All helper functions remain intact:
  - createDirectoryStructure()
  - createEnvFile()
  - createMCPConfig()
  - createReadmeFiles()
  - copyCLAUDEmd()

### 🚀 Next Steps
```bash
# Update to latest version
npm update -g snow-flow@1.4.2

# Initialize your project
snow-flow init --sparc

# Configure ServiceNow credentials
# Edit .env file with your credentials

# Authenticate
snow-flow auth login

# Start developing!
snow-flow swarm "create incident dashboard widget"
```

---

**Snow-Flow v1.4.2** - Critical hotfix ensuring all users can properly initialize Snow-Flow projects.
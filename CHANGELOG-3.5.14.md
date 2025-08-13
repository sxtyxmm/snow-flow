# Snow-Flow v3.5.14 - Enhanced Claude Code Integration

## 🚀 What's New

### 🔧 Comprehensive `snow-flow init` Settings

Enhanced the `snow-flow init` command to create a production-ready `.claude/settings.json` with:

**18 MCP Servers Enabled:**
- ✅ **servicenow-local-development** (ADDED - was missing!)
- ✅ All core Snow-Flow servers pre-configured
- ✅ Auto-discovery and intelligent tools

**100+ Development Permissions:**
```json
// Snow-Flow specific commands
"Bash(npx snow-flow *)"
"Bash(snow-flow *)"
"Bash(./snow-flow *)"

// Full development workflow
"Bash(npm run *)", "Bash(npm install *)", "Bash(yarn *)", "Bash(pnpm *)"

// Git operations
"Bash(git status)", "Bash(git commit *)", "Bash(git push *)", "Bash(gh *)"

// System utilities
"Bash(curl *)", "Bash(jq *)", "Bash(find *)", "Bash(grep *)"

// Process monitoring
"Bash(ps *)", "Bash(top)", "Bash(lsof *)", "Bash(netstat *)"

// Environment management
"Bash(docker *)", "Bash(env)", "Bash(export *)"
```

**Intelligent Hooks System:**
- **PreCompact Hook** - Reminds about Snow-Flow capabilities before manual compacting
- **Auto-Compact Hook** - Guidance when context window fills automatically
- **CLAUDE.md Integration** - References project documentation for best practices

**Optimized Environment Variables:**
```json
"BASH_DEFAULT_TIMEOUT_MS": "0",    // No timeouts for long operations
"MAX_THINKING_TOKENS": "50000",    // Deep analysis capability  
"CLAUDE_CODE_MAX_OUTPUT_TOKENS": "32000",  // Large responses
"SNOW_FLOW_DEBUG": "false",        // Clean production logs
"NODE_ENV": "development"          // Development mode
```

## 🎯 What This Means For You

### Before v3.5.14
Running `snow-flow init` created basic project structure but you had to manually:
- Configure all MCP servers in Claude Code
- Set up permissions for development tools
- Add hooks for workflow guidance
- Configure environment variables

### After v3.5.14
Running `snow-flow init` creates a **complete development environment** with:
- ✅ **All 18 MCP servers** pre-enabled and ready to use
- ✅ **100+ permissions** for comprehensive development workflow
- ✅ **Intelligent hooks** that guide you through Snow-Flow capabilities
- ✅ **Production-optimized settings** for performance and reliability
- ✅ **ServiceNow-local-development** server included (enables `snow_pull_artifact`!)

## 🔧 Key Features Added

### 1. Missing MCP Server Fixed
- Added `servicenow-local-development` to enabled servers
- This enables `snow_pull_artifact`, `snow_push_artifact`, and widget debugging
- No more "tool not found" errors for local development tools

### 2. Comprehensive Command Permissions
**Development Tools:**
- npm, yarn, pnpm package managers
- Git operations and GitHub CLI
- Node.js development commands

**System Utilities:**
- File operations (find, grep, cat, head, tail)
- Process monitoring (ps, top, lsof)
- Network tools (curl, ping, netstat)
- JSON processing (jq)

**Security Safeguards:**
- Blocks dangerous commands (`rm -rf /`, `sudo rm *`)
- Allows safe system operations only

### 3. Workflow Hooks
**PreCompact Hook:**
- Reminds about 18+ MCP servers available
- Highlights `snow_pull_artifact` for widget debugging
- References CLAUDE.md for best practices
- Shows custom instructions if provided

**Auto-Compact Hook:**
- Triggers when context window fills
- Emphasizes concurrent execution patterns
- Reminds about batching operations for performance

### 4. Environment Optimization
- Disabled timeouts for long Snow-Flow operations
- Increased token limits for complex analysis
- Debug modes configurable per environment
- Development-focused defaults

## 📦 Migration

### New Projects
```bash
# Create optimized Snow-Flow project
snow-flow init my-servicenow-project
cd my-servicenow-project

# Everything pre-configured - ready to develop!
# All MCP servers enabled
# All permissions set
# Hooks configured
```

### Existing Projects
```bash
# Update your Snow-Flow installation
npm install -g snow-flow@3.5.14

# Re-run init to update settings (backup existing first!)
cp .claude/settings.json .claude/settings.json.backup
snow-flow init --force

# Or manually add the new settings to your existing config
```

## 🎯 Impact on Development Workflow

### Widget Debugging Now Works Out-of-Box
```bash
# This now works immediately after snow-flow init:
snow_pull_artifact({ sys_id: 'your_widget_sys_id' })
# Edit with Claude Code native tools
snow_push_artifact({ sys_id: 'your_widget_sys_id' })
```

### Complete Development Environment
- **Package Management**: npm, yarn, pnpm all permitted
- **Version Control**: Full git workflow enabled
- **API Testing**: curl, wget for ServiceNow API testing
- **Data Processing**: jq for JSON manipulation
- **System Monitoring**: Process and network monitoring tools

### Intelligent Guidance
- Hooks remind you about Snow-Flow capabilities
- References to documentation keep best practices visible
- Custom instruction support for project-specific needs

## 🏆 Production Ready

This release makes `snow-flow init` create a **production-ready development environment** with:
- All tools you need for ServiceNow development
- Security safeguards against dangerous operations
- Performance optimizations for large projects
- Intelligent guidance system for best practices

**Perfect for teams** - consistent development environment across all developers!

## 🔄 Update Now

```bash
npm install -g snow-flow@3.5.14
```

---

*This release completes the Snow-Flow + Claude Code integration story - from `snow-flow init` to production deployment, everything works seamlessly out of the box!*
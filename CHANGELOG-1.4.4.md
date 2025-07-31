# Snow-Flow v1.4.4 Release Notes

## 🚀 MCP Server Auto-Start - Essential Functionality Restored

### Overview
Snow-Flow v1.4.4 restores the critical MCP server auto-start functionality that ensures MCP servers are running when you execute swarm commands.

### 🎯 What Changed

#### MCP Server Auto-Start in Init
- **Before**: Init only created configuration files, MCP servers had to be started manually
- **After**: Init automatically starts all MCP servers in the background
- **Impact**: MCP servers are ready immediately when you run swarm commands

### ✅ Key Improvements

1. **Automatic MCP Server Startup**
   - MCP servers start automatically during `snow-flow init`
   - Servers run in background processes
   - All 11 ServiceNow MCP servers are activated

2. **Absolute Path Resolution**
   - Fixed path issues for global npm installations
   - MCP configuration uses absolute paths to snow-flow installation
   - Works correctly whether installed globally or locally

3. **Improved Error Handling**
   - Graceful fallback if MCP servers can't start
   - Clear instructions for manual startup if needed
   - Better logging of server startup status

### 📋 How It Works

```bash
# Initialize project - MCP servers start automatically
snow-flow init --sparc

# Output shows:
🚀 Starting MCP servers in the background...
📡 Starting all ServiceNow MCP servers...
✅ Started 11/11 MCP servers successfully!
📋 MCP servers are now running in the background
🎯 They will be available when you run swarm commands

# Now swarm commands work immediately
snow-flow swarm "create incident dashboard"
```

### 🔧 Technical Details
- MCPServerManager is invoked during init process
- Servers are started with `detached: true` for background operation
- OAuth tokens are automatically bridged to MCP processes
- Server configuration is saved for persistence

### 🎯 Workflow Benefits
1. **Zero Manual Steps**: No need to run `mcp start` separately
2. **Immediate Availability**: Swarm commands work right after init
3. **Better User Experience**: Seamless setup process
4. **Reliable Operation**: MCP servers are always ready

### 📝 Manual Control
If you need to manage MCP servers manually:
```bash
snow-flow mcp status    # Check server status
snow-flow mcp stop      # Stop all servers
snow-flow mcp start     # Start all servers
snow-flow mcp restart   # Restart all servers
```

---

**Snow-Flow v1.4.4** - Restoring essential MCP server auto-start for seamless development workflow.
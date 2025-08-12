# 🔍 Snow-Flow Debug Guide - Maximum Verbosity

## Quick Start - Debug Levels

### 🟢 Basic Debug
```bash
snow-flow swarm "your task" --debug
```

### 🟡 Verbose Mode
```bash
snow-flow swarm "your task" --verbose
```

### 🟠 Trace Mode (Very Detailed)
```bash
snow-flow swarm "your task" --trace
```

### 🔴 MAXIMUM DEBUG (Everything!)
```bash
snow-flow swarm "your task" --debug-all
```

## Debug Options

### Individual Debug Flags

| Flag | Description | Output Level |
|------|-------------|--------------|
| `--debug` | Basic debug mode | Medium |
| `--trace` | Trace mode (very detailed) | High |
| `--verbose` | Verbose output | Medium |
| `--debug-mcp` | MCP server debugging | High |
| `--debug-http` | HTTP request/response tracing | Very High |
| `--debug-memory` | Memory operation debugging | High |
| `--debug-servicenow` | ServiceNow API debugging | High |
| `--debug-all` | EVERYTHING (very verbose!) | MAXIMUM |

### Combinations

#### 🔍 Debug MCP Connections (for 3x connection issue)
```bash
snow-flow swarm "test" --debug-mcp --trace
```

#### 🌐 Debug ServiceNow API Calls
```bash
snow-flow swarm "create widget" --debug-servicenow --debug-http
```

#### 🧠 Debug Memory Operations
```bash
snow-flow swarm "complex task" --debug-memory --verbose
```

#### 🚀 Full Debug Suite
```bash
snow-flow swarm "debug everything" --debug-all
```

## Environment Variables

### Set in `.env` file for persistent debug:

```env
# Basic Debug
SNOW_FLOW_DEBUG=true
LOG_LEVEL=debug

# Trace Level (Maximum Detail)
LOG_LEVEL=trace
SNOW_FLOW_TRACE=true

# MCP Debug
MCP_DEBUG=true
MCP_LOG_LEVEL=trace

# HTTP Debug
HTTP_TRACE=true

# Everything
DEBUG=*
VERBOSE=true
NODE_ENV=development
```

## What Each Level Shows

### 🟢 `--debug`
- Basic operation flow
- Error messages with context
- Key decision points
- API call summaries

### 🟡 `--verbose`
- All of debug +
- Detailed operation parameters
- Configuration values
- Step-by-step progress

### 🟠 `--trace`
- All of verbose +
- Function entry/exit
- Variable values
- Complete stack traces
- Timing information

### 🔴 `--debug-all`
- EVERYTHING including:
  - Raw HTTP requests/responses
  - Memory allocation details
  - MCP protocol messages
  - ServiceNow API payloads
  - Internal state changes
  - Performance metrics
  - Token usage details

## Debug Output Examples

### MCP Connection Debug (`--debug-mcp`)
```
[DEBUG] MCP server "servicenow-deployment": Starting connection attempt
[DEBUG] MCP server "servicenow-deployment": Sending initialization request
[DEBUG] MCP server "servicenow-deployment": Protocol version: 1.0.0
[DEBUG] MCP server "servicenow-deployment": Available tools: 10
[DEBUG] MCP server "servicenow-deployment": Connection attempt completed in 42ms - status: connected
```

### HTTP Debug (`--debug-http`)
```
[HTTP] POST https://instance.service-now.com/api/now/table/sp_widget
[HTTP] Headers: { "Content-Type": "application/json", "Authorization": "Bearer ..." }
[HTTP] Body: { "name": "Test Widget", "template": "<div>...</div>" }
[HTTP] Response: 201 Created (324ms)
[HTTP] Response Body: { "result": { "sys_id": "abc123", ... } }
```

### Memory Debug (`--debug-memory`)
```
[MEMORY] Store operation: key=task_123, size=2.4KB
[MEMORY] Memory usage: 45.2MB / 100MB (45.2%)
[MEMORY] Cache hit: key=artifact_cache_widget_456
[MEMORY] Cleanup: Removed 3 expired entries, freed 1.2MB
```

## Troubleshooting Specific Issues

### 🔍 "3x Connection Attempts" Issue
```bash
snow-flow swarm "test" --debug-mcp --trace
```
This will show:
- Each connection attempt with timing
- Retry logic and reasons
- Final connection status
- Protocol negotiation details

### 🚨 Token Limit Errors
```bash
snow-flow swarm "large task" --debug-memory --verbose
```
Shows:
- Token counting per operation
- Memory usage statistics
- Optimization suggestions

### ⚡ Performance Issues
```bash
snow-flow swarm "slow task" --trace --debug-http
```
Reveals:
- Operation timing breakdowns
- Network latency details
- Processing bottlenecks

## Debug Output Files

Debug output is also saved to:
- `./logs/snow-flow.log` - Main log
- `./logs/snow-flow-error.log` - Errors only
- `./logs/cli.log` - CLI operations
- `./logs/MCP:*.log` - Individual MCP server logs

## Pro Tips

1. **Start Small**: Begin with `--debug`, then increase if needed
2. **Use Combinations**: Mix flags for targeted debugging
3. **Check Logs**: File logs often have more detail than console
4. **Filter Output**: Use `grep` to find specific patterns:
   ```bash
   snow-flow swarm "test" --debug-all 2>&1 | grep "ERROR"
   ```

5. **Performance Impact**: `--debug-all` can slow operations significantly

## Debug Shortcuts

```bash
# Quick debug alias (add to ~/.bashrc or ~/.zshrc)
alias sfd='snow-flow swarm --debug'
alias sft='snow-flow swarm --trace'
alias sfa='snow-flow swarm --debug-all'

# Usage
sfd "create widget"  # Debug mode
sft "complex flow"   # Trace mode
sfa "everything"     # All debug output
```

## Support

If debug output reveals an issue:
1. Save the output to a file: `snow-flow swarm "task" --debug-all > debug.log 2>&1`
2. Create an issue at: https://github.com/groeimetai/snow-flow/issues
3. Include the debug.log file (remove sensitive data first)

---

Remember: More debug output = slower performance. Use wisely! 🚀
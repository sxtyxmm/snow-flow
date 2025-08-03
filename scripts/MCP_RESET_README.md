# MCP Server Reset Scripts

## Quick Reset Commands

```bash
# Reset all MCP servers (kill processes, clear cache)
npm run reset-mcp

# Reset and restart all MCP servers
npm run reset-mcp:restart

# Using bash script directly
./scripts/reset-mcp.sh
./scripts/reset-mcp.sh --restart
```

## What These Scripts Do

1. **Find and Kill MCP Processes**
   - Kills all running ServiceNow MCP server processes
   - Works on Windows, macOS, and Linux

2. **Clear Cache and Locks**
   - Removes MCP cache files from `~/.snow-flow/mcp-cache`
   - Clears lock files that might prevent restart
   - Removes temporary files

3. **Verify Clean State**
   - Checks that all processes are stopped
   - Reports any processes that couldn't be killed

4. **Optional Restart**
   - Use `--restart` flag to start servers again
   - Servers run in background mode
   - Logs available in `~/.snow-flow/logs/`

## When to Use

- After updating MCP server code
- When MCP servers are unresponsive
- Before switching ServiceNow instances
- To clear stale connections
- When Claude shows "failed" status for MCP servers

## Troubleshooting

If processes won't stop:
```bash
# Force kill on Unix-like systems
ps aux | grep mcp | grep -v grep | awk '{print $2}' | xargs kill -9

# Force kill on Windows
taskkill /F /IM node.exe
```

Check logs after restart:
```bash
tail -f ~/.snow-flow/logs/mcp-server.log
```
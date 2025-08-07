# TodoWrite Timeout Issue - Claude Code Native Tool

## 🔴 The Problem

The TodoWrite tool is timing out at ~30 seconds, even though we've removed all timeouts from our MCP servers.

### Key Observations:
1. **TodoWrite is a NATIVE Claude Code tool**, not an MCP tool
2. The error says **"API Error (Request timed out.)"** - this is Claude Code's API call to Anthropic
3. **No tokens are consumed** during the timeout period
4. All MCP servers connect successfully

## 🔍 Root Cause

The timeout is happening at the **Claude Code -> Anthropic API** level, NOT in our MCP implementation.

TodoWrite is a native Claude Code tool that:
1. Sends the todo list to Anthropic's servers
2. Has its own internal timeout (appears to be 30 seconds)
3. Cannot be configured through MCP settings

## 🛠️ Potential Solutions

### Option 1: Increase Claude Code's Native Tool Timeout
Unfortunately, there doesn't appear to be a setting for this in `~/.claude/settings.json`

### Option 2: Use Alternative Todo Management
Instead of TodoWrite, we could:
1. Create our own MCP tool for todo management
2. Use file-based todo tracking
3. Use memory operations for task tracking

### Option 3: Report to Anthropic
This appears to be a Claude Code limitation that should be reported:
- TodoWrite has a hardcoded 30-second timeout
- This timeout cannot be configured
- It fails even when the operation would complete successfully

## 📊 Current Claude Settings

```json
{
  "MCP_TIMEOUT": "60000",        // 60 seconds for MCP tools
  "MCP_TOOL_TIMEOUT": "120000",   // 2 minutes for MCP tools
  "BASH_DEFAULT_TIMEOUT_MS": "300000",  // 5 minutes for bash
  "BASH_MAX_TIMEOUT_MS": "600000"       // 10 minutes max for bash
}
```

Note: These settings DO NOT affect TodoWrite since it's a native tool.

## 🚨 Workaround

For now, to avoid TodoWrite timeouts:

1. **Keep todo lists small** - fewer items process faster
2. **Use simpler todo content** - less text to process
3. **Break up large todo updates** into multiple smaller updates
4. **Consider using our memory tools** instead for task tracking

## 📝 Example Alternative Using Memory

Instead of TodoWrite, you could use:

```javascript
// Store todos in memory
await mcp__claude-flow__memory_usage({
  action: "store",
  key: "todos",
  value: JSON.stringify([
    { id: "1", task: "Create widget", status: "pending" },
    { id: "2", task: "Test widget", status: "pending" }
  ])
});

// Retrieve todos
const todos = await mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "todos"
});
```

This uses our MCP memory tools which have NO timeout by default!
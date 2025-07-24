# Snow-Flow v1.3.9 - Claude Code Auto-Launch Restored

## 🚀 Critical Fix: Automatic Claude Code Launching

Restored the automatic Claude Code launching functionality that was accidentally removed in v1.3.8.

## 🔧 What Was Fixed

The `executeClaudeCode` function was simplified too much in v1.3.8, making it only show the prompt without actually launching Claude Code. This version restores the full automatic launching functionality.

## ✅ What's New

### Automatic Claude Code Launching
- **CLI Detection**: Checks if `claude` command is available in PATH
- **Process Spawning**: Properly launches Claude Code as a subprocess
- **Prompt Injection**: Automatically sends the orchestration prompt via stdin
- **MCP Integration**: Auto-loads MCP servers when `.mcp.json` exists

### How It Works Now

```bash
# User runs:
snow-flow swarm "create approval flow for equipment requests"

# Snow-flow now:
1. Generates basic XML template (for flows)
2. Creates comprehensive Queen Agent orchestration prompt
3. **AUTOMATICALLY LAUNCHES CLAUDE CODE** ✅
4. Sends prompt directly to Claude Code
5. Claude Code opens with the prompt ready to execute

# No more manual copy/paste needed!
```

## 📋 Key Changes

- Restored full `executeClaudeCode` implementation with:
  - Claude CLI detection via `which claude`
  - Process spawning with `spawn('claude', args)`
  - Automatic prompt injection via stdin
  - Proper error handling and timeout support
  - MCP config auto-detection and loading

## 🎯 Result

The swarm command now works like it did before - automatically launching Claude Code with the orchestration prompt, so users don't have to manually copy and paste. This restores the seamless workflow where:

1. User runs `snow-flow swarm "objective"`
2. Claude Code automatically opens with the prompt
3. Agents immediately start working on the solution

## 💡 Configuration

- Set `SNOW_FLOW_TIMEOUT_MINUTES=0` for unlimited execution time (default)
- Claude Code will auto-load MCP servers if `.mcp.json` exists
- Falls back to manual prompt display if Claude CLI is not installed
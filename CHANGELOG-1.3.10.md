# Snow-Flow v1.3.10 - Raw Mode Fix with --dangerously-skip-permissions

## 🔥 Critical Fix: "Raw mode is not supported" Error Resolved

Fixed the infamous Ink raw mode error by restoring the exact method used in v1.0-1.2.

## 🔧 What Was Wrong

The v1.3.9 implementation tried to use stdin without the `--dangerously-skip-permissions` flag, which caused Claude Code (built with Ink) to fail with:
```
Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default.
```

## ✅ What's Fixed

Restored the **exact implementation** from older working versions:

1. **Added `--dangerously-skip-permissions` flag** - This bypasses Ink's raw mode requirements
2. **Restored proper stdin piping** - Using `stdio: ['pipe', 'inherit', 'inherit']`
3. **Direct prompt injection** - Via `stdin.write(prompt)` and `stdin.end()`
4. **Removed temp file workaround** - Not needed with proper flags

## 🚀 How It Works Now (Like It Always Did!)

```bash
# User runs:
snow-flow swarm "create approval flow"

# Snow-flow now:
1. Detects Claude CLI
2. Launches with --dangerously-skip-permissions
3. Pipes prompt via stdin
4. Claude Code opens automatically with prompt loaded
5. NO MANUAL INPUT REQUIRED! 🎉
```

## 📋 Technical Details

The key was the `--dangerously-skip-permissions` flag that older versions always used:

```javascript
const claudeArgs = hasMcpConfig 
  ? ['--mcp-config', '.mcp.json', '.', '--dangerously-skip-permissions']
  : ['--dangerously-skip-permissions'];
```

This flag tells Claude Code to skip interactive permission prompts, which avoids the raw mode requirement.

## 💡 Result

Snow-flow now works **exactly like v1.0-1.2** - fully automatic Claude Code launching with no manual intervention required. The seamless workflow is completely restored!
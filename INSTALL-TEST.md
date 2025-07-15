# 🧪 Installation Test Guide

## Test je Snow-flow installatie

### 1. **Na het builden, test lokaal:**
```bash
# Test het build
npm run test-install

# Test direct uit dist
node dist/cli/unified-cli.js --help
```

### 2. **Test global install:**
```bash
# Installeer globaal
npm install -g .

# Test global command
snow-flow --help
snow-flow status
```

### 3. **Test alternative methods:**
```bash
# Test npm run
npm run snow-flow -- --help

# Test npx
npx snow-flow --help
```

## ✅ Verwachte output:

```
🚀 Snow-flow: AI-Powered ServiceNow Application Builder
Usage: snow-flow [options] [command]

Options:
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  create <type>        Create ServiceNow applications, widgets, or components
  widget <name>        🎨 Create a ServiceNow Service Portal widget
  app <name>          📱 Create a complete ServiceNow application
  component <type> <name>  🔧 Create specific ServiceNow components
  status              📊 Show Snow-flow status and configuration
  init                🔧 Initialize Snow-flow in current directory
  templates           📋 List available templates
  claude-status       📊 Check Claude Code integration status
  claude-process      🔄 Process next Claude Code prompt
  help [command]      display help for command
```

## 🔧 Troubleshooting

### Global install issues:
```bash
# Try with sudo (macOS/Linux)
sudo npm install -g .

# Or use yarn
yarn global add .
```

### Permission issues:
```bash
# Fix npm permissions
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Node version issues:
```bash
# Check Node version
node --version

# Should be 18+ for best compatibility
```
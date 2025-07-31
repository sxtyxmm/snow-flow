# Snow-Flow v1.4.3 Release Notes

## 🔧 Behavior Correction - Init Command Fix

### Overview
Snow-Flow v1.4.3 corrects the behavior of the `init` command to align with the intended workflow design.

### 🎯 What Changed

#### Init Command Behavior
- **Before**: Init command prompted to launch Claude Code automatically
- **After**: Init command only creates project files and shows instructions
- **Reason**: Claude Code should only be launched via the `swarm` command with specific objectives

### ✅ Correct Workflow

1. **Initialize Project** (creates files only):
```bash
snow-flow init --sparc
```

2. **Configure ServiceNow**:
```bash
# Edit .env with credentials
snow-flow auth login
```

3. **Start Development** (launches Claude Code):
```bash
snow-flow swarm "create incident dashboard widget"
```

### 📋 Technical Details
- Removed automatic Claude Code activation from init command
- Removed unused `activateMCPServers()` function
- Init command now only shows instructions for manual MCP activation
- Claude Code launching remains exclusively with swarm command

### 🎯 Design Philosophy
The separation of concerns ensures:
- `init`: Project setup and file generation
- `auth`: ServiceNow authentication
- `swarm`: Actual development work with Claude Code

This maintains a clear workflow where Claude Code is only launched when you have a specific development objective.

---

**Snow-Flow v1.4.3** - Correcting init command behavior for better workflow clarity.
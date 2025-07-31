# Snow-Flow v1.4.5 Release Notes

## 🔧 Bugfix Release

### Fixed
- ✅ **Init Command Hanging**: Fixed issue where `snow-flow init` would hang indefinitely after starting MCP servers
  - Added `process.exit(0)` to properly terminate after successful initialization
  - MCP servers continue running in background as expected

- ✅ **--force Flag Restored**: Re-added missing `--force` flag to init command
  - Use `snow-flow init --sparc --force` to overwrite existing files
  - Affects .env, .mcp.json, and CLAUDE.md files
  - Provides clear feedback when overwriting files

### Technical Details
- Fixed duplicate `copyCLAUDEmd` function code that was causing build errors
- Properly implemented force flag handling for all file creation operations
- Ensured MCP server processes detach correctly without blocking parent process

### Migration Guide
No breaking changes. Simply update to v1.4.5:
```bash
npm install -g snow-flow@1.4.5
```

### What's Working
- ✅ `snow-flow init --sparc` creates all required files
- ✅ `snow-flow init --sparc --force` overwrites existing files
- ✅ MCP servers start automatically and run in background
- ✅ Init command completes cleanly without hanging
- ✅ All 11 ServiceNow MCP servers available immediately

### Example Usage
```bash
# Fresh installation
snow-flow init --sparc

# Force overwrite existing project
snow-flow init --sparc --force

# Skip MCP server auto-start
snow-flow init --sparc --skip-mcp
```

---
*Released: January 2025*
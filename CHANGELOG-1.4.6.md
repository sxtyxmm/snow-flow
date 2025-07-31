# Snow-Flow v1.4.6 Release Notes

## 🔧 Documentation Fix Release

### Fixed
- ✅ **CLAUDE.md Content**: Restored Snow-Flow specific documentation
  - Removed generic "claude-flow" references
  - Added MCP-first workflow instructions
  - Included Snow-Flow specific commands and examples
  - Emphasized REAL ServiceNow integration

- ✅ **Init Command**: Now generates correct CLAUDE.md file
  - Uses Snow-Flow specific content template
  - Fallback content also updated with Snow-Flow documentation
  - No more confusion with generic Claude Code instructions

- ✅ **Code Cleanup**: Fixed TypeScript compilation errors
  - Removed orphaned markdown content from cli.ts
  - Fixed duplicate init command code blocks
  - Cleaned up misplaced helper function definitions
  - Build now completes without errors

### Technical Details
- Updated `copyCLAUDEmd` function to use correct fallback content
- Removed ~1000 lines of orphaned markdown content from cli.ts
- Fixed function structure and proper code organization
- Updated project root CLAUDE.md as source for init command

### Migration Guide
No breaking changes. Simply update to v1.4.6:
```bash
npm install -g snow-flow@1.4.6
```

### What's Working
- ✅ `snow-flow init --sparc` generates correct Snow-Flow CLAUDE.md
- ✅ All MCP-first workflow documentation is accurate
- ✅ Widget development and deployment
- ✅ Update Set management
- ✅ ServiceNow authentication
- ✅ Multi-agent coordination

### Example CLAUDE.md Content
The generated CLAUDE.md now starts with:
```markdown
# Snow-Flow Development with Claude Code

## 🚨 CRITICAL: MCP-FIRST WORKFLOW (READ THIS FIRST!)

**Snow-flow's core value is REAL ServiceNow integration through MCP tools. NEVER work in offline mode!**
```

Instead of the generic:
```markdown
# Claude Code Configuration - SPARC Development Environment (Batchtools Optimized)
```

---
*Released: January 2025*
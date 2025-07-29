# Snow-Flow v1.3.19 - Critical Authentication Bug Fixes

## 🔴 CRITICAL BUG FIXES - Beta Test Feedback

This release addresses critical authentication issues discovered by beta testers that prevented MCP tools from functioning properly despite successful CLI authentication.

### 🐛 Fixed Issues

#### 1. MCP OAuth Token Isolation (CRITICAL)
**Problem:** MCP servers couldn't access OAuth tokens stored by the CLI, causing all MCP tools to fail
**Fix:** Implemented UnifiedAuthStore that shares tokens across CLI and MCP contexts
- Created `/src/utils/unified-auth-store.ts` for centralized token management
- Both CLI and MCP servers now use the same token storage mechanism
- Tokens are automatically bridged to MCP servers via environment variables

#### 2. Missing getStoredTokens() Method
**Problem:** `TypeError: oauth.getStoredTokens is not a function` crashed the deploy-xml command
**Fix:** Added the missing `getStoredTokens()` method to ServiceNowOAuth class
- Method now returns tokens from the unified auth store
- Ensures backward compatibility with existing code

#### 3. Deploy-XML Command Crash
**Problem:** Deploy-xml command crashed with TypeError when trying to get authentication tokens
**Fix:** Improved error handling and token retrieval in deployXMLToServiceNow function
- Added try-catch for token retrieval
- Better error messages when authentication fails

#### 4. Detailed 400 Error Handling
**Problem:** 400 errors provided no details about what went wrong
**Fix:** Enhanced error handling with detailed error information
- Shows specific error messages from ServiceNow
- Lists missing or invalid fields
- Provides permission-related error details
- Includes troubleshooting tips

#### 5. MCP Auth Bridge
**Problem:** MCP servers started without access to CLI authentication tokens
**Fix:** Created automatic token bridging mechanism
- MCP Server Manager now passes OAuth tokens to child processes
- Tokens are available via environment variables
- ServiceNowClient checks unified auth store first, then falls back to OAuth

### 📋 Technical Changes

#### UnifiedAuthStore Implementation
```typescript
// New unified token storage accessible from both CLI and MCP
export class UnifiedAuthStore {
  async getTokens(): Promise<AuthTokens | null>
  async saveTokens(tokens: AuthTokens): Promise<void>
  async bridgeToMCP(): Promise<void>
}
```

#### MCP Server Manager Update
- Automatically bridges tokens when starting MCP servers
- Passes all OAuth-related environment variables to child processes
- Ensures MCP servers have immediate access to authentication

#### ServiceNowClient Enhancement
- Now checks UnifiedAuthStore first for tokens
- Falls back to OAuth.loadCredentials() for compatibility
- Improved error messages for authentication failures

### 🚀 Impact

**Before:** 
- CLI: ✅ Authenticated
- MCP: ❌ "No credentials available"
- Result: All MCP tools failed despite successful login

**After:**
- CLI: ✅ Authenticated
- MCP: ✅ Authenticated (shares CLI tokens)
- Result: All MCP tools work seamlessly

### 🔧 Migration Guide

No migration needed! The fixes are backward compatible and automatic:

1. Update to v1.3.19: `npm install -g snow-flow@1.3.19`
2. Re-authenticate if needed: `snow-flow auth login`
3. All MCP tools will now work properly

### 🙏 Thanks

Special thanks to our beta testers who provided detailed bug reports and reproduction steps. This kind of feedback is invaluable for improving snow-flow.

### 📊 Test Results

After implementing these fixes:
- ✅ CLI authentication works
- ✅ MCP tools can access tokens
- ✅ deploy-xml command works without crashes
- ✅ 400 errors show detailed information
- ✅ Auto-deployment in swarm command functions properly

---

**Full Changelog**: https://github.com/groeimetai/snow-flow/compare/v1.3.18...v1.3.19
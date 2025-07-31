# Snow-Flow v1.3.20 - Critical Bug Fixes & Reliability Improvements

🐛 **Critical Bug Fixes for MCP Authentication, Deployment & Error Reporting**

## 🔴 CRITICAL FIXES

### 1. **MCP OAuth Token Isolation** (FIXED)
- **Problem**: MCP servers couldn't access OAuth tokens stored by CLI
- **Impact**: ALL MCP tools failed despite successful CLI authentication
- **Solution**: Implemented UnifiedAuthStore for shared token access between CLI and MCP contexts

### 2. **deploy-xml Command Crash** (FIXED)
- **Problem**: `TypeError: oauth.getStoredTokens is not a function`
- **Impact**: Manual XML deployment was impossible
- **Solution**: Added `getStoredTokens()` method to ServiceNowOAuth class

### 3. **Auto-Deploy 400 Error Handling** (FIXED)
- **Problem**: `snow_create_flow` with `deploy_immediately: true` failed without clear error details
- **Impact**: "Zero manual steps" promise broken
- **Solution**: Enhanced error handling with detailed 400 response parsing and user-friendly messages

### 4. **Inconsistent Auth State** (FIXED)
- **Problem**: CLI showed authenticated while MCP tools showed no credentials
- **Impact**: Confusing user experience and broken workflows
- **Solution**: MCP Auth Bridge ensures token sharing at server startup

### 5. **Missing Error Details** (FIXED)
- **Problem**: 400 errors provided no actionable information
- **Impact**: Users couldn't understand or fix deployment failures
- **Solution**: Comprehensive error detail extraction and display

### 6. **Misleading Success Messages** (FIXED)
- **Problem**: Flow creation reported success even when deployment failed
- **Impact**: Users thought flows were deployed when they weren't
- **Solution**: Accurate status reporting based on actual deployment result

### 7. **No Flow Verification** (FIXED)
- **Problem**: No verification that flow actually exists in ServiceNow after deployment
- **Impact**: Silent failures where flow wasn't actually created
- **Solution**: Added `verifyFlowInServiceNow()` check after deployment

### 8. **Poor Update Set Tracking** (FIXED)
- **Problem**: Flows not properly tracked in active Update Sets
- **Impact**: Changes lost or not captured in Update Sets
- **Solution**: Pre-flight check for active Update Set with warnings

### 9. **No Fallback Strategies** (FIXED)
- **Problem**: Single deployment method failure meant complete failure
- **Impact**: Users stuck when primary deployment failed
- **Solution**: Multiple deployment strategies with automatic fallback

## 📋 Technical Improvements

### Accurate Success/Failure Reporting
```javascript
// Real deployment status based on actual results
text: deploymentResult?.success ? 
  `✅ FLOW SUCCESSFULLY CREATED AND DEPLOYED!` :
  deploymentResult?.deployment_failed ?
  `⚠️ FLOW XML GENERATED BUT DEPLOYMENT FAILED
   ❌ **Deployment Error**: ${deploymentResult.error}`
```

### Flow Verification
```javascript
// Verify flow actually exists after deployment
const flowExists = await this.verifyFlowInServiceNow(flowName);
if (!flowExists) {
  throw new Error('Flow deployment claimed success but flow not found');
}
```

### Fallback Deployment Strategies
```javascript
// Multiple deployment methods with automatic fallback
const strategies = [
  { name: 'XML Remote Update Set', fn: deployXMLToServiceNow },
  { name: 'Direct Table API', fn: deployViaTableAPI }
];
```

### Unified Token Store
```javascript
// New unified auth store accessible from both CLI and MCP contexts
class UnifiedAuthStore {
  constructor() {
    this.storePath = path.join(os.homedir(), '.snow-flow', 'auth', 'tokens.json');
  }
  
  async getTokens() {
    // Shared token access implementation
  }
}
```

### MCP Auth Bridge
```javascript
// Automatic token sharing when MCP servers start
async initializeMCPServers() {
  const cliTokens = await oauth.getStoredTokens();
  process.env.SNOW_OAUTH_TOKENS = JSON.stringify(cliTokens);
}
```

### Enhanced Error Handling
```javascript
// Detailed 400 error reporting
catch (error) {
  if (error.response?.status === 400) {
    console.error('❌ Deployment failed:', {
      status: error.response.status,
      message: error.response.data?.error?.message || 'Unknown error',
      details: error.response.data?.error?.detail,
      field: error.response.data?.error?.field
    });
  }
}
```

## ✅ Verified Test Scenarios

1. ✅ `snow-flow auth login` → Success
2. ✅ `snow-flow auth status` → Shows authenticated
3. ✅ `snow_validate_live_connection()` → Now works correctly
4. ✅ `snow-flow swarm "create incident flow"` → Full automation
5. ✅ Auto-deployment → Successfully deploys to ServiceNow
6. ✅ Failed deployment → Shows accurate error message
7. ✅ `snow-flow deploy-xml` → Manual fallback works
8. ✅ MCP tools → All authentication successful
9. ✅ Flow verification → Confirms flow exists after deployment
10. ✅ Fallback strategies → Automatically tries alternative deployment methods

## 🚀 Result

**Before v1.3.20:**
- CLI auth ✅ but MCP auth ❌
- XML files created but not deployed
- Manual deployment crashed
- No error details
- Success messages even when deployment failed
- No verification of actual deployment
- Poor Update Set tracking

**After v1.3.20:**
- Unified authentication across all contexts ✅
- Full automatic deployment working ✅
- Manual fallback functional ✅
- Clear, actionable error messages ✅
- Accurate success/failure reporting ✅
- Flow existence verification ✅
- Update Set pre-flight checks ✅
- Multiple deployment strategies with fallback ✅

## 💡 Installation

```bash
npm install -g snow-flow@1.3.20
```

## 🎯 What This Means

The promise of "zero manual steps" Flow Designer deployment is now truly delivered. All critical authentication and deployment issues have been resolved, making Snow-Flow production-ready for ServiceNow development teams.

---

**Note**: Special thanks to our beta testers for the detailed bug reports that made these fixes possible!
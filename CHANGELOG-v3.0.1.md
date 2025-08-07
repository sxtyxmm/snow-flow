# Changelog - Snow-Flow v3.0.1

## 🎯 v3.0.1 - No Timeouts by Default (Latest)

### Major Change
**Operations now run without timeouts by default** for maximum reliability and flexibility.

### What Changed
- **Removed all default timeouts** - Operations run until natural completion
- **Made timeouts optional** - Only configure if you specifically need them
- **Updated .env.template** - All timeout settings now commented out with examples
- **Better developer experience** - No more artificial timeout limitations

### Why This Matters
The previous 5-second timeout (v3.0.0) was causing TodoWrite and other operations to fail prematurely. We initially increased it to 30 seconds, but realized the best solution is to have NO timeouts by default, letting operations complete naturally.

### Migration from v3.0.0
1. Update to v3.0.1
2. Remove any timeout settings from your .env file (unless you specifically need them)
3. Operations will now run to completion

### Optional Timeout Configuration
If you need timeouts for specific reasons (CI/CD, development, etc.), you can still set them:

```bash
# In .env file - uncomment only what you need:
# MCP_MEMORY_TIMEOUT=30000        # 30 seconds for memory operations
# SNOW_API_TIMEOUT=180000         # 3 minutes for API calls
# SNOW_DEPLOYMENT_TIMEOUT=600000  # 10 minutes for deployments
```

---

## Previous Version - v3.0.0

### Major Infrastructure Overhaul
- ✅ 100% Real Implementation (no mock/demo code)
- ✅ Fixed MCP Transport Layer
- ✅ Real TensorFlow.js ML
- ✅ Direct ServiceNow API
- ✅ Reliable Memory Manager
- ❌ Had 5-second hardcoded timeout (fixed in v3.0.1)
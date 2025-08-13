# Snow-Flow v3.5.12 - Balanced Timeouts & Clean Production Logs

## 🎯 What's Changed

### ⏱️ Smarter Timeout Configuration
Based on user feedback, we've adjusted timeouts to better support real-world operations:

**Previous (v3.5.11) - Too aggressive:**
- Query operations: 5 seconds ❌
- Pull operations: 10 seconds ❌
- Script execution: 20 seconds ❌

**New (v3.5.12) - Balanced for real work:**
- Query operations: **15 seconds** ✅
- Pull operations: **60 seconds** ✅ (large widgets need time!)
- Push operations: **45 seconds** ✅
- Script execution: **2 minutes** ✅ (complex scripts)
- Server initialization: **10 seconds** ✅

### 🧹 Debug Logs Cleaned Up
- Removed noisy debug logs from production
- No more "MAKEQUEST CALLED!" messages
- No more "This instance constructor" logs
- Clean, professional log output

## 💡 Why These Changes Matter

### The Timeout Balance
v3.5.11 was too aggressive with timeouts to prevent Claude API errors. But this caused legitimate long operations to fail! v3.5.12 finds the sweet spot:

- **Long enough** for real operations (60s for large widget pulls)
- **Short enough** to prevent hanging (still fails faster than Claude's timeout)
- **Configurable** via environment variables if needed

### Clean Logs
Debug logs that were helpful during development are now removed for cleaner production output.

## 📝 Configuration

### Default Timeouts (Seconds)
```bash
Server Init: 10s
Default Tool: 30s
Query Operations: 15s
Pull Operations: 60s    # Large widgets
Push Operations: 45s    # Large updates
Debug Operations: 30s
Script Execution: 120s  # Complex scripts
API Calls: 15s per call
API Retries: 3 attempts
```

### Custom Configuration
```bash
# Override if needed
export MCP_PULL_TIMEOUT=90000     # 90 seconds for extra large widgets
export MCP_SCRIPT_TIMEOUT=180000  # 3 minutes for very complex scripts
```

## 🐛 Issues Fixed
- ✅ Legitimate long operations no longer timeout prematurely
- ✅ Large widget pulls now have adequate time (60s)
- ✅ Complex script execution gets full 2 minutes
- ✅ Debug logs removed from production output
- ✅ Cleaner console output without noise

## 🔄 Migration Notes
No breaking changes. Update with:
```bash
npm install -g snow-flow@3.5.12
```

## 📊 Timeout Comparison

| Operation | v3.5.10 | v3.5.11 | v3.5.12 | Note |
|-----------|---------|---------|---------|------|
| Query | Unlimited | 5s | **15s** | Balanced |
| Pull | Unlimited | 10s | **60s** | Large widgets |
| Push | Unlimited | 10s | **45s** | Large updates |
| Script | Unlimited | 20s | **120s** | Complex scripts |

## 🙏 Acknowledgments
Thanks for the feedback about timeout durations being too short for real operations. This version finds the right balance between preventing hangs and allowing legitimate work to complete.

---

*For issues or questions, please report at: https://github.com/groeimetai/snow-flow/issues*
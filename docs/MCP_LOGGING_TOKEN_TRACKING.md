# MCP Server Logging & Token Tracking Enhancement

## Problem
MCP servers run in separate processes, making their logs and token usage invisible in the main console. This creates a "black box" experience where users don't see:
- What's happening during API calls
- How many tokens are being consumed
- Progress on long-running operations
- Errors and debugging information

## Solution
We've created an enhanced MCP server infrastructure with:
1. **MCPLogger** - Sends logs to stderr for visibility
2. **ServiceNowClientWithTracking** - Tracks API calls and token usage
3. **EnhancedBaseMCPServer** - Base class with built-in tracking

## Implementation

### 1. MCPLogger (`src/mcp/shared/mcp-logger.ts`)
```typescript
const logger = new MCPLogger('ServiceName');

// Automatic progress indicators
logger.operationStart('Create Widget');
// Shows: ⏳ Operation in progress... (2s elapsed, 150 tokens used)

// Token tracking
logger.addTokens(100, 250); // input, output
// Shows: 📊 Tokens used: 350 (in: 100, out: 250)

// Operation completion with summary
logger.operationComplete('Create Widget');
// Shows formatted summary with duration and tokens
```

### 2. ServiceNowClientWithTracking (`src/utils/servicenow-client-with-tracking.ts`)
Wraps the standard ServiceNowClient to add:
- Automatic API call logging
- Token estimation based on request/response size
- Progress indicators for long operations
- Error tracking with context

### 3. EnhancedBaseMCPServer (`src/mcp/shared/enhanced-base-mcp-server.ts`)
Base class that all MCP servers can extend:
```typescript
export class MyMCPServer extends EnhancedBaseMCPServer {
  constructor() {
    super('MyServer', '1.0.0');
  }
  
  async myTool(args: any) {
    return this.executeTool('myTool', async () => {
      // Automatic tracking and logging
      const result = await this.queryTable('incident', 'active=true', 10);
      return this.createResponse('Success!', result);
    });
  }
}
```

## Features

### Real-time Progress
```
⏳ [ServiceNow-API] Operation in progress... (2s elapsed, 150 tokens used)
⏳ [ServiceNow-API] Operation in progress... (4s elapsed, 300 tokens used)
```

### API Call Tracking
```
🔄 API Call: GET /api/now/table/incident on incident (10 records)
📊 [ServiceNow-API] Tokens used: 450 (in: 100, out: 350)
```

### Operation Summaries
```
═══════════════════════════════════════════════════════════
📊 ServiceNow-Operations - Operation Complete
─────────────────────────────────────────────────────────
⏱️  Duration: 3 seconds
🔢 Tokens Used: 450
   ├─ Input: 100
   └─ Output: 350
🎯 Operation: Create Widget
═══════════════════════════════════════════════════════════
```

## Migration Guide

### For Existing MCP Servers

1. **Option A: Full Migration** (Recommended)
   - Extend `EnhancedBaseMCPServer` instead of creating Server directly
   - Wrap tool handlers with `executeTool()` for automatic tracking
   - Use `this.logger` instead of console.log

2. **Option B: Minimal Changes**
   - Replace `ServiceNowClient` with `ServiceNowClientWithTracking`
   - Add `MCPLogger` to existing code
   - Keep existing structure

### Example Migration

**Before:**
```typescript
class MyMCPServer {
  private client = new ServiceNowClient();
  
  async createWidget(args) {
    const result = await this.client.createRecord('sp_widget', data);
    return { content: [{ type: 'text', text: 'Done' }] };
  }
}
```

**After:**
```typescript
class MyMCPServer extends EnhancedBaseMCPServer {
  constructor() {
    super('MyServer', '1.0.0');
  }
  
  async createWidget(args) {
    return this.executeTool('createWidget', async () => {
      const result = await this.createRecord('sp_widget', data);
      return this.createResponse('Widget created!', result);
    });
  }
}
```

## Benefits

1. **Visibility**: See what's happening in real-time
2. **Token Awareness**: Track token consumption per operation
3. **Debugging**: Detailed logs appear in console
4. **Progress**: Long operations show progress indicators
5. **Performance**: Understand which operations are expensive
6. **Error Context**: Better error messages with full context

## Environment Variables

```bash
# Enable debug logging
DEBUG=true

# Set log level
LOG_LEVEL=debug

# Enable token tracking
TRACK_TOKENS=true
```

## Future Enhancements

1. **Token Budgets**: Set limits per operation
2. **Cost Tracking**: Calculate API costs
3. **Performance Analytics**: Track operation patterns
4. **Log Aggregation**: Central log storage
5. **Real-time Dashboard**: Web UI for monitoring

## Implementation Status

- [x] MCPLogger implementation
- [x] ServiceNowClientWithTracking
- [x] EnhancedBaseMCPServer
- [x] Documentation
- [ ] Migrate all existing MCP servers
- [ ] Add to npm package
- [ ] Test with Claude Code
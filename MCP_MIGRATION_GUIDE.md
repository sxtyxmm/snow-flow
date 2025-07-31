# MCP Migration Guide: Agent Integration

This guide shows how to migrate existing MCP servers to the new agent-integrated architecture.

## 🎯 Overview

The migration adds:
1. **Agent Context Tracking** - Every operation tracks which agent is performing it
2. **Memory Integration** - All operations update shared SQLite memory
3. **Progress Reporting** - Real-time progress updates for Queen monitoring
4. **Error Recovery** - Intelligent fallbacks and Queen intervention
5. **No Mock Data** - All operations must use real ServiceNow

## 📋 Migration Checklist

### Step 1: Update Imports

Replace existing imports with agent-aware versions:

```typescript
// OLD
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';

// NEW
import { BaseMCPServer, MCPToolResult } from './shared/base-mcp-server.js';
import { AgentContext } from './shared/mcp-memory-manager.js';
```

### Step 2: Extend BaseMCPServer

Change class definition:

```typescript
// OLD
class ServiceNowDeploymentMCP {
  private server: Server;
  private client: ServiceNowClient;
  
  constructor() {
    this.server = new Server(...);
  }
}

// NEW
class ServiceNowDeploymentMCP extends BaseMCPServer {
  constructor() {
    super('servicenow-deployment', '2.0.0');
    // Additional initialization
  }
}
```

### Step 3: Add Agent Context to Tools

Update tool definitions to include agent parameters:

```typescript
// OLD
{
  name: 'snow_deploy_widget',
  inputSchema: {
    properties: {
      name: { type: 'string' },
      template: { type: 'string' }
    }
  }
}

// NEW
{
  name: 'snow_deploy_widget',
  inputSchema: {
    properties: {
      name: { type: 'string' },
      template: { type: 'string' },
      // Agent context parameters
      session_id: { type: 'string', description: 'Agent session ID' },
      agent_id: { type: 'string', description: 'Deploying agent ID' },
      agent_type: { type: 'string', description: 'Type of agent' }
    }
  }
}
```

### Step 4: Wrap Tool Execution

Use executeWithAgentContext for all tools:

```typescript
// OLD
private async deployWidget(args: any) {
  const isAuth = await this.oauth.isAuthenticated();
  if (!isAuth) {
    return { content: [{ type: 'text', text: 'Not authenticated' }] };
  }
  
  // Deploy logic
  const result = await this.client.createRecord('sp_widget', widgetData);
  return { content: [{ type: 'text', text: 'Success' }] };
}

// NEW
private async deployWidget(args: any): Promise<MCPToolResult> {
  return await this.executeWithAgentContext(
    'snow_deploy_widget',
    args,
    async (context) => {
      // Check authentication
      if (!await this.checkAuthentication()) {
        return this.createAuthenticationError();
      }
      
      // Assert no mock data
      this.assertNoMockData('widget deployment');
      
      // Report progress
      await this.reportProgress(context, 20, 'Creating widget');
      
      // Deploy logic
      const result = await this.client.createRecord('sp_widget', widgetData);
      
      // Store artifact in memory
      await this.storeArtifact(context, {
        sys_id: result.sys_id,
        type: 'widget',
        name: widgetData.name,
        config: widgetData
      });
      
      // Report completion
      await this.reportProgress(context, 100, 'Widget deployed');
      
      return this.createSuccessResponse(
        `Widget ${widgetData.name} deployed`,
        result
      );
    }
  );
}
```

### Step 5: Add Memory Operations

Every significant operation should update memory:

```typescript
// Store artifacts after creation
await this.storeArtifact(context, {
  sys_id: result.sys_id,
  type: 'widget',
  name: config.name,
  description: config.description,
  config: config,
  update_set_id: updateSetId
});

// Update shared context for coordination
await this.memory.updateSharedContext({
  session_id: context.session_id,
  context_key: 'widget_template_ready',
  context_value: JSON.stringify({
    widget_sys_id: result.sys_id,
    ready_for_styling: true
  }),
  created_by_agent: context.agent_id
});

// Send messages to other agents
await this.notifyHandoff(context, 'ui_specialist', {
  type: 'widget',
  sys_id: result.sys_id,
  next_steps: ['responsive_styling', 'accessibility_check']
});
```

### Step 6: Add Progress Reporting

Report progress during long operations:

```typescript
await this.reportProgress(context, 0, 'Starting deployment');
await this.reportProgress(context, 25, 'Validating configuration');
await this.reportProgress(context, 50, 'Creating in ServiceNow');
await this.reportProgress(context, 75, 'Verifying deployment');
await this.reportProgress(context, 100, 'Deployment complete');
```

### Step 7: Implement Error Recovery

Add Queen intervention for critical errors:

```typescript
try {
  const result = await this.client.createRecord('sp_widget', data);
} catch (error) {
  // Try fallback strategies
  if (error.message.includes('permission')) {
    // Request permission escalation
    await this.requestQueenIntervention(context, {
      type: 'permission_denied',
      priority: 'high',
      description: `Cannot create widget: ${error.message}`,
      attempted_solutions: ['direct_creation']
    });
  }
  
  // Try alternative approach
  const fallbackResult = await this.tryFallbackStrategy(data, context);
  if (fallbackResult) {
    return fallbackResult;
  }
  
  throw error;
}
```

### Step 8: Remove Mock Data

Remove all mock implementations:

```typescript
// OLD - Remove this pattern
if (process.env.MOCK_MODE) {
  return { success: true, result: { sys_id: 'mock_123' } };
}

// NEW - Always use real operations
this.assertNoMockData('widget deployment');
const result = await this.client.createRecord('sp_widget', data);
```

## 🔄 Complete Migration Example

Here's a complete before/after example:

### Before (Original MCP)

```typescript
private async deployWidget(args: any) {
  try {
    const isAuth = await this.oauth.isAuthenticated();
    if (!isAuth) {
      return {
        content: [{
          type: 'text',
          text: 'Not authenticated'
        }]
      };
    }

    const widgetData = {
      name: args.name,
      template: args.template,
      css: args.css || ''
    };

    const response = await this.client.createRecord('sp_widget', widgetData);
    
    return {
      content: [{
        type: 'text',
        text: `Created widget: ${response.result.sys_id}`
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }]
    };
  }
}
```

### After (Agent-Integrated)

```typescript
private async deployWidget(args: any): Promise<MCPToolResult> {
  return await this.executeWithAgentContext(
    'snow_deploy_widget',
    args,
    async (context) => {
      // Authentication check
      if (!await this.checkAuthentication()) {
        return this.createAuthenticationError();
      }

      // No mock data
      this.assertNoMockData('widget deployment');

      // Get session context
      const sessionContext = await this.getSessionContext(context.session_id);
      
      // Progress: Planning
      await this.reportProgress(context, 10, 'Planning widget deployment');

      // Ensure update set
      const updateSet = await this.ensureUpdateSet('widget', args.name, context);
      
      // Progress: Creating
      await this.reportProgress(context, 50, 'Creating widget in ServiceNow');

      try {
        const widgetData = {
          name: args.name,
          template: args.template,
          css: args.css || '',
          server_script: args.server_script || '',
          client_script: args.client_script || ''
        };

        const response = await this.client.createRecord('sp_widget', widgetData);
        
        if (!response.success) {
          throw new Error('Failed to create widget');
        }

        const widgetSysId = response.result.sys_id;

        // Store artifact
        await this.storeArtifact(context, {
          sys_id: widgetSysId,
          type: 'widget',
          name: args.name,
          config: widgetData,
          update_set_id: updateSet.sys_id
        });

        // Update shared context
        await this.memory.updateSharedContext({
          session_id: context.session_id,
          context_key: `widget_${args.name}_ready`,
          context_value: JSON.stringify({
            sys_id: widgetSysId,
            needs_styling: true,
            needs_testing: true
          }),
          created_by_agent: context.agent_id
        });

        // Determine next agent
        if (args.template?.includes('chart') || args.template?.includes('graph')) {
          await this.notifyHandoff(context, 'ui_specialist', {
            type: 'widget',
            sys_id: widgetSysId,
            next_steps: ['add_chart_library', 'responsive_design']
          });
        }

        // Progress: Complete
        await this.reportProgress(context, 100, 'Widget deployment complete');

        return this.createSuccessResponse(
          `Successfully deployed widget: ${args.name}`,
          {
            sys_id: widgetSysId,
            name: args.name,
            update_set_id: updateSet.sys_id,
            next_agent: 'ui_specialist'
          },
          {
            agent_id: context.agent_id,
            session_id: context.session_id,
            artifacts_created: [widgetSysId]
          }
        );

      } catch (error) {
        // Try fallback
        if (error.message.includes('permission')) {
          await this.requestQueenIntervention(context, {
            type: 'permission_error',
            priority: 'high',
            description: `Cannot create widget: ${error.message}`,
            attempted_solutions: ['direct_creation', 'update_set_creation']
          });
        }

        // Record failure
        await this.memory.recordDeployment(
          context.session_id,
          'failed_widget',
          'widget',
          false,
          context.agent_id,
          error.message
        );

        throw error;
      }
    }
  );
}
```

## 🎯 Key Migration Points by MCP Server

### servicenow-deployment-mcp.ts
- ✅ Add agent context to all deployment tools
- ✅ Track artifacts in memory after creation
- ✅ Report progress during deployments
- ✅ Notify next agents (UI specialist for widgets, test agent for scripts)
- ✅ Remove all mock deployment paths

### servicenow-intelligent-mcp.ts
- ✅ Store search results in memory for reuse
- ✅ Track which artifacts have been discovered
- ✅ Update agent coordination during long searches
- ✅ Cache results in shared context
- ✅ Remove mock search results

### servicenow-flow-composer-mcp.ts
- ✅ Track flow creation progress
- ✅ Store flow definitions in memory
- ✅ Coordinate with test agents for validation
- ✅ Notify deployment agents when ready
- ✅ Remove mock flow creation

### servicenow-operations-mcp.ts
- ✅ Track operational changes
- ✅ Store incident/request updates
- ✅ Coordinate with notification agents
- ✅ Update shared context with operation results
- ✅ Remove mock operations

## 🔍 Testing the Migration

1. **Unit Tests**: Update tests to provide agent context
2. **Integration Tests**: Test memory persistence between operations
3. **Coordination Tests**: Verify agent handoffs work correctly
4. **Progress Tests**: Ensure progress updates are recorded
5. **Error Tests**: Verify Queen intervention triggers properly

## 📚 Resources

- `src/mcp/shared/base-mcp-server.ts` - Base class implementation
- `src/mcp/shared/mcp-memory-manager.ts` - Memory integration
- `src/mcp/shared/agent-context-provider.ts` - Context handling
- `src/mcp/servicenow-deployment-mcp-refactored.ts` - Complete example

---

*Follow this guide to ensure all MCP servers properly integrate with the Snow-Flow agent ecosystem.*
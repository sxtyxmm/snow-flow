# Snow-Flow Architecture

## Overview

Snow-Flow is a multi-agent system designed for ServiceNow development automation. It implements a hive-mind architecture inspired by claude-flow principles, where a Queen Agent coordinates multiple specialized worker agents to accomplish complex development tasks.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code Interface                     │
├─────────────────────────────────────────────────────────────────┤
│                        Snow-Flow CLI                             │
├─────────────────────────────────────────────────────────────────┤
│                        Queen Agent                               │
│  ┌───────────────┐ ┌─────────────────┐ ┌─────────────────────┐  │
│  │ Task Analysis │ │ Agent Factory   │ │ Coordination Engine │  │
│  └───────────────┘ └─────────────────┘ └─────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     Worker Agents                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐ │
│ │Widget Creator│ │Script Writer │ │Security Agent│ │   ...   │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Memory System                          │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │   SQLite     │ │    Neo4j     │ │  Cache Layer │             │
│ │   Storage    │ │  Graph DB    │ │              │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                      MCP Layer                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │Deployment MCP│ │Operations MCP│ │Intelligent   │             │
│ │              │ │              │ │MCP           │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                   ServiceNow Integration                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │   OAuth 2.0  │ │  REST APIs   │ │ Update Sets  │             │
│ │ Authentication│ │              │ │              │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Queen Agent (`src/agents/queen-agent.ts`)

The master coordinator that orchestrates all activities.

**Responsibilities:**
- Objective analysis and task decomposition
- Agent spawning and specialization
- Progress monitoring and coordination
- Error handling and recovery
- TodoWrite integration for Claude Code

**Key Features:**
- **403 Permission Handler**: Automatic permission escalation
- **Parallel Execution Engine**: Intelligent workload distribution
- **Memory Integration**: Persistent state management
- **MCP Bridge**: Direct tool invocation

### 2. Worker Agents

Specialized agents for different aspects of ServiceNow development.

#### Widget Creator Agent (`src/agents/widget-creator-agent.ts`)
- ServiceNow widget development
- Template generation and customization
- Client/server script creation
- CSS styling and responsive design

#### Script Writer Agent (`src/agents/script-writer-agent.ts`)
- Business rules creation
- Client scripts development
- Script includes and utilities
- API integration scripts

#### Security Agent (`src/agents/security-agent.ts`)
- Access control lists (ACLs)
- Security policies
- Vulnerability assessment
- Compliance checking

#### Coordinator (`src/agents/coordinator.ts`)
- Inter-agent communication
- Task dependency management
- Resource allocation
- Conflict resolution

### 3. Memory System

Multi-layered persistent storage for agent coordination.

#### SQLite Layer (`src/memory/memory-system.ts`)
- Fast key-value storage
- Session management
- Agent communication logs
- Configuration persistence

#### Neo4j Graph Layer (`src/memory/servicenow-artifact-indexer.ts`)
- Artifact relationship mapping
- Dependency analysis
- Impact assessment
- Pattern recognition

#### Cache Layer
- In-memory caching for performance
- TTL-based expiration
- Hierarchical namespacing
- Memory optimization

### 4. MCP (Model Context Protocol) Servers

Specialized servers providing ServiceNow integration capabilities.

#### Deployment MCP (`src/mcp/servicenow-deployment-mcp.ts`)
- Widget deployment
- Update Set management
- Artifact validation
- Rollback capabilities

#### Operations MCP (`src/mcp/servicenow-operations-mcp.ts`)
- Incident management
- Service requests
- Problem analysis
- CMDB operations

#### Intelligent MCP (`src/mcp/servicenow-intelligent-mcp.ts`)
- Artifact discovery
- Smart recommendations
- Performance optimization
- Automated testing

## Data Flow

### 1. Command Execution Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User Input  │───▶│ CLI Parser  │───▶│ Queen Agent │
└─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│TodoWrite    │◀───│ Task        │◀───│ Objective   │
│Coordination │    │ Analysis    │    │ Analysis    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Agent        │◀───│Agent        │◀───│Memory       │
│Spawning     │    │Factory      │    │Storage      │
└─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Parallel     │───▶│MCP Tool     │───▶│ServiceNow   │
│Execution    │    │Invocation   │    │Integration  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Agent Communication Pattern

```
┌─────────────┐
│Queen Agent  │
└──────┬──────┘
       │ (spawn)
   ┌───▼───┐   ┌─────────┐   ┌─────────┐
   │Agent 1│◀─▶│ Memory  │◀─▶│Agent 2  │
   └───────┘   │ System  │   └─────────┘
       │       └─────────┘       │
       │                         │
       ▼                         ▼
┌─────────────┐           ┌─────────────┐
│MCP Tools    │           │MCP Tools    │
└─────────────┘           └─────────────┘
       │                         │
       ▼                         ▼
┌─────────────────────────────────────────┐
│         ServiceNow Instance             │
└─────────────────────────────────────────┘
```

## Key Design Principles

### 1. Hive-Mind Architecture

**Philosophy**: One intelligent Queen, many simple workers
- Queen Agent handles complex decision-making
- Worker agents focus on specific, simple tasks
- Shared memory enables coordination
- Emergent intelligence through collaboration

### 2. Event-Driven Communication

All agents communicate through events and shared memory:
```typescript
// Agent publishes event
this.emit('task:completed', { agentId, result });

// Other agents listen for events
coordinator.on('task:completed', (data) => {
  this.updateProgress(data);
});
```

### 3. Fault Tolerance

- **Graceful Degradation**: System continues with reduced functionality
- **Automatic Recovery**: Failed agents are respawned
- **Rollback Capabilities**: All changes can be undone
- **Permission Escalation**: Automatic handling of authorization issues

### 4. Plugin Architecture

MCP servers act as plugins, providing modularity:
- Easy to add new ServiceNow capabilities
- Isolated error handling
- Independent versioning
- Hot-swappable functionality

## Performance Optimizations

### 1. Parallel Agent Execution

```typescript
class ParallelAgentEngine {
  async detectParallelizationOpportunities(
    todos: TodoItem[],
    taskType: string,
    availableAgents: Agent[]
  ): Promise<ParallelizationOpportunity[]> {
    // Analyze task dependencies
    // Identify parallelizable work
    // Return optimization plan
  }
}
```

### 2. Memory Optimization

- **Hierarchical TTL**: Different expiration times for different data types
- **Lazy Loading**: Load data only when needed
- **Connection Pooling**: Reuse database connections
- **Compression**: Compress large objects in storage

### 3. ServiceNow API Optimization

- **Request Batching**: Combine multiple API calls
- **Caching**: Cache frequently accessed data
- **Rate Limiting**: Respect ServiceNow limits
- **Connection Reuse**: Maintain persistent connections

## Security Architecture

### 1. Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│OAuth Flow   │───▶│ServiceNow   │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Token Store  │◀───│Access Token │◀───│Refresh      │
│(Encrypted)  │    │             │    │Token        │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Permission Management

- **Principle of Least Privilege**: Agents request minimal permissions
- **Dynamic Escalation**: Automatic permission elevation when needed
- **Audit Trail**: All permission changes logged
- **Temporary Elevation**: Permissions expire after use

### 3. Data Protection

- **Credential Encryption**: All stored credentials encrypted
- **Memory Isolation**: Agent memory spaces isolated
- **Secure Transport**: All communications use HTTPS
- **Input Validation**: All inputs sanitized and validated

## Scalability Considerations

### 1. Horizontal Scaling

- **Agent Pool**: Multiple instances of each agent type
- **Load Balancing**: Distribute work across available agents
- **Resource Limits**: Prevent resource exhaustion
- **Auto-scaling**: Spawn/destroy agents based on load

### 2. Vertical Scaling

- **Memory Management**: Efficient memory usage patterns
- **Connection Pooling**: Reuse expensive resources
- **Caching Strategies**: Multiple cache layers
- **Lazy Initialization**: Load resources on demand

## Integration Points

### 1. Claude Code Integration

Snow-Flow is designed to work seamlessly with Claude Code:
- **TodoWrite Integration**: Automatic task tracking
- **Progress Reporting**: Real-time status updates
- **Error Handling**: Graceful error reporting
- **Batch Operations**: Efficient tool usage

### 2. ServiceNow Integration

Multiple integration methods:
- **REST APIs**: Standard ServiceNow REST endpoints
- **Import Sets**: Bulk data operations
- **Update Sets**: Change tracking and deployment
- **OAuth 2.0**: Secure authentication

### 3. External Tools

- **Git**: Version control integration
- **Neo4j**: Graph database for relationships
- **SQLite**: Local data persistence
- **MCP Protocol**: Tool communication

## Development Patterns

### 1. Agent Development

```typescript
import { BaseAgent } from './base-agent';

export class CustomAgent extends BaseAgent {
  async execute(task: Task): Promise<Result> {
    // 1. Validate input
    // 2. Check permissions
    // 3. Execute task
    // 4. Store results in memory
    // 5. Emit completion event
  }
}
```

### 2. MCP Server Development

```typescript
import { BaseMCPServer } from './base-mcp-server';

export class CustomMCP extends BaseMCPServer {
  async handleRequest(method: string, args: any): Promise<ToolResult> {
    // 1. Validate arguments
    // 2. Execute ServiceNow operation
    // 3. Handle errors gracefully
    // 4. Return structured result
  }
}
```

### 3. Memory Pattern

```typescript
// Store with namespace and TTL
await memory.store(`${namespace}/${key}`, data, ttl);

// Retrieve with fallback
const data = await memory.get(key) || defaultValue;

// Search with pattern
const results = await memory.search(`${namespace}/*`);
```

## Monitoring and Observability

### 1. Logging

- **Structured Logging**: JSON format for machine parsing
- **Log Levels**: Debug, Info, Warn, Error, Fatal
- **Context Propagation**: Request tracing across agents
- **Log Rotation**: Automatic cleanup of old logs

### 2. Metrics

- **Agent Performance**: Task completion times, success rates
- **Memory Usage**: Storage utilization, cache hit rates
- **ServiceNow API**: Request rates, error rates, latency
- **System Health**: CPU, memory, disk usage

### 3. Alerting

- **Error Thresholds**: Alert on high error rates
- **Performance Degradation**: Alert on slow responses
- **Resource Exhaustion**: Alert on resource limits
- **Security Events**: Alert on authentication failures

## Future Architecture Evolution

### 1. Machine Learning Integration

- **Pattern Recognition**: Learn from successful deployments
- **Predictive Analytics**: Anticipate problems before they occur
- **Optimization**: Automatically tune performance parameters
- **Anomaly Detection**: Identify unusual patterns

### 2. Multi-Instance Deployment

- **Cluster Management**: Coordinate multiple Snow-Flow instances
- **Load Distribution**: Balance work across cluster
- **High Availability**: Failover capabilities
- **Data Synchronization**: Keep instances synchronized

### 3. Plugin Ecosystem

- **Third-party Agents**: Allow custom agent development
- **Marketplace**: Share and discover agents
- **API Standards**: Standardize agent interfaces
- **Version Management**: Handle plugin updates

---

This architecture document is living documentation that evolves with the system. For the latest architectural decisions and patterns, refer to the codebase and recent commit messages.
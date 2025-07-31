# Snow-Flow Developer Guide

## Getting Started

This guide helps developers understand, extend, and contribute to Snow-Flow's multi-agent ServiceNow development system.

## Development Environment Setup

### Prerequisites

- **Node.js**: 18.0.0+ (recommended: 20.x)
- **npm**: 8.0.0+
- **TypeScript**: 5.x
- **Git**: Latest version
- **ServiceNow Instance**: For testing (optional)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/groeimetai/snow-flow.git
cd snow-flow

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Set up development environment
cp .env.example .env
# Edit .env with your ServiceNow credentials (optional)
```

### Development Scripts

```bash
# Development with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
npm run lint -- --fix

# Testing
npm test
npm run test:watch
npm run test:coverage

# Build for production
npm run build
```

## Project Structure Deep Dive

```
snow-flow/
├── src/
│   ├── agents/              # AI Agents
│   │   ├── base-agent.ts    # Base agent class
│   │   ├── queen-agent.ts   # Master coordinator
│   │   ├── widget-creator-agent.ts
│   │   ├── script-writer-agent.ts
│   │   └── security-agent.ts
│   ├── queen/               # Queen Agent System
│   │   ├── agent-factory.ts      # Agent creation
│   │   ├── parallel-agent-engine.ts # Parallel execution
│   │   ├── queen-memory.ts        # Memory management
│   │   └── types.ts              # Type definitions
│   ├── memory/              # Memory System
│   │   ├── memory-system.ts      # Core memory operations
│   │   ├── memory-client.ts      # Client interface
│   │   └── servicenow-artifact-indexer.ts # Graph indexing
│   ├── mcp/                 # MCP Servers
│   │   ├── servicenow-deployment-mcp.ts
│   │   ├── servicenow-operations-mcp.ts
│   │   └── servicenow-intelligent-mcp.ts
│   ├── utils/               # Utilities
│   │   ├── servicenow-client.ts   # ServiceNow API client
│   │   ├── logger.ts             # Logging utilities
│   │   └── template-engine.ts    # Template processing
│   └── types/               # Type Definitions
       ├── servicenow.types.ts
       ├── snow-flow.types.ts
       └── todo.types.ts
```

## Core Concepts

### 1. Agent Architecture

#### Base Agent Pattern

All agents extend the `BaseAgent` class:

```typescript
// src/agents/base-agent.ts
export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected memory: MemorySystem;
  protected logger: Logger;

  constructor(config: AgentConfig) {
    super();
    this.id = config.id || this.generateId();
    this.memory = new MemorySystem(config.memoryPath);
    this.logger = new Logger(`Agent:${this.constructor.name}`);
  }

  // Abstract methods that child classes must implement
  abstract async execute(task: Task): Promise<Result>;
  abstract async getCapabilities(): Promise<string[]>;
  abstract async getStatus(): Promise<AgentStatus>;

  // Common functionality
  protected async storeResult(key: string, data: any): Promise<void> {
    await this.memory.store(`${this.id}:${key}`, data);
  }

  protected async emitProgress(progress: ProgressUpdate): Promise<void> {
    this.emit('progress', { agentId: this.id, ...progress });
  }
}
```

#### Creating a New Agent

```typescript
// src/agents/my-custom-agent.ts
import { BaseAgent } from './base-agent';
import { Task, Result, AgentConfig } from '../types';

export class MyCustomAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  async execute(task: Task): Promise<Result> {
    this.logger.info(`Executing task: ${task.type}`);

    try {
      // 1. Validate input
      this.validateTask(task);

      // 2. Execute main logic
      const result = await this.performTask(task);

      // 3. Store results
      await this.storeResult('last_execution', result);

      // 4. Emit progress
      await this.emitProgress({
        status: 'completed',
        percentage: 100,
        message: 'Task completed successfully'
      });

      return {
        success: true,
        data: result,
        agentId: this.id
      };

    } catch (error) {
      this.logger.error('Task execution failed', error);
      
      await this.emitProgress({
        status: 'failed',
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        agentId: this.id
      };
    }
  }

  async getCapabilities(): Promise<string[]> {
    return ['custom-task', 'data-processing', 'api-integration'];
  }

  async getStatus(): Promise<AgentStatus> {
    return {
      id: this.id,
      status: 'idle',
      lastActivity: new Date(),
      capabilities: await this.getCapabilities()
    };
  }

  private validateTask(task: Task): void {
    if (!task.type || !task.data) {
      throw new Error('Invalid task: missing type or data');
    }
  }

  private async performTask(task: Task): Promise<any> {
    // Your custom logic here
    return { processed: task.data };
  }
}
```

#### Registering the Agent

```typescript
// src/queen/agent-factory.ts
import { MyCustomAgent } from '../agents/my-custom-agent';

export class AgentFactory {
  createAgent(type: AgentType, config: AgentConfig): BaseAgent {
    switch (type) {
      case 'widget-creator':
        return new WidgetCreatorAgent(config);
      case 'script-writer':
        return new ScriptWriterAgent(config);
      case 'my-custom':
        return new MyCustomAgent(config);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
```

### 2. Memory System

#### Using Memory in Agents

```typescript
export class ExampleAgent extends BaseAgent {
  async execute(task: Task): Promise<Result> {
    // Store data with TTL
    await this.memory.store('config', task.config, 3600000); // 1 hour

    // Retrieve data
    const config = await this.memory.get('config');

    // Search for related data
    const relatedTasks = await this.memory.search('task:*');

    // Store in namespace
    await this.memory.store(
      `agent:${this.id}:results`, 
      results, 
      86400000 // 24 hours
    );

    return result;
  }
}
```

#### Memory Patterns

```typescript
// Hierarchical storage
const namespaces = {
  agents: 'agent:${agentId}',
  sessions: 'session:${sessionId}',
  artifacts: 'artifact:${type}:${id}',
  coordination: 'coord:${objectiveId}'
};

// Store with proper namespace
await memory.store(`${namespaces.agents}:results`, data);

// Bulk operations
const batch = [
  { key: 'key1', value: 'value1', ttl: 3600000 },
  { key: 'key2', value: 'value2', ttl: 3600000 }
];
await memory.storeBatch(batch);
```

### 3. MCP Server Development

#### Creating a New MCP Server

```typescript
// src/mcp/my-custom-mcp.ts
import { BaseMCPServer } from './base-mcp-server';
import { ToolResult } from '../types';

export class MyCustomMCP extends BaseMCPServer {
  constructor() {
    super('my-custom-mcp', 'Custom MCP Server for specialized operations');
    
    // Register tools
    this.registerTool('my_custom_tool', this.handleCustomTool.bind(this));
    this.registerTool('my_other_tool', this.handleOtherTool.bind(this));
  }

  private async handleCustomTool(args: any): Promise<ToolResult> {
    try {
      // Validate arguments
      const { param1, param2 } = this.validateArgs(args, {
        param1: 'string',
        param2: 'number'
      });

      // Perform operation
      const result = await this.performCustomOperation(param1, param2);

      return {
        success: true,
        result: result
      };

    } catch (error) {
      this.logger.error('Custom tool failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async handleOtherTool(args: any): Promise<ToolResult> {
    // Implementation for another tool
    return { success: true, result: 'Operation completed' };
  }

  private async performCustomOperation(param1: string, param2: number): Promise<any> {
    // Your custom logic here
    return { processed: true, input: { param1, param2 } };
  }
}
```

#### Tool Registration Pattern

```typescript
export abstract class BaseMCPServer {
  protected tools: Map<string, Function> = new Map();

  protected registerTool(name: string, handler: Function): void {
    this.tools.set(name, handler);
  }

  async handleToolCall(name: string, args: any): Promise<ToolResult> {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }

    return await handler(args);
  }

  protected validateArgs(args: any, schema: Record<string, string>): any {
    const validated: any = {};
    
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in args)) {
        throw new Error(`Missing required parameter: ${key}`);
      }
      
      if (typeof args[key] !== type) {
        throw new Error(`Parameter ${key} must be of type ${type}`);
      }
      
      validated[key] = args[key];
    }
    
    return validated;
  }
}
```

### 4. ServiceNow Integration

#### Using the ServiceNow Client

```typescript
import { ServiceNowClient } from '../utils/servicenow-client';

export class ServiceNowIntegrationExample {
  private client: ServiceNowClient;

  constructor() {
    this.client = new ServiceNowClient({
      instance: process.env.SNOW_INSTANCE!,
      clientId: process.env.SNOW_CLIENT_ID!,
      clientSecret: process.env.SNOW_CLIENT_SECRET!
    });
  }

  async createWidget(widgetData: any): Promise<any> {
    // Authenticate if needed
    await this.client.ensureAuthenticated();

    // Create the widget
    const widget = await this.client.post('/api/now/sp/widget', {
      name: widgetData.name,
      id: widgetData.id,
      template: widgetData.template,
      client_script: widgetData.clientScript,
      server_script: widgetData.serverScript,
      css: widgetData.css
    });

    // Track in update set
    await this.client.addToUpdateSet(widget.sys_id, 'sp_widget');

    return widget;
  }

  async queryIncidents(query: string): Promise<any[]> {
    const response = await this.client.get('/api/now/table/incident', {
      sysparm_query: query,
      sysparm_limit: 100
    });

    return response.result;
  }
}
```

#### Error Handling Patterns

```typescript
export class ErrorHandlingExample {
  async handleServiceNowOperation(): Promise<any> {
    try {
      const result = await this.client.post('/api/endpoint', data);
      return result;
      
    } catch (error) {
      // Handle specific error types
      if (error.status === 401) {
        // Re-authenticate and retry
        await this.client.authenticate();
        return await this.client.post('/api/endpoint', data);
        
      } else if (error.status === 403) {
        // Permission escalation
        await this.escalatePermissions();
        return await this.client.post('/api/endpoint', data);
        
      } else if (error.status === 429) {
        // Rate limiting - wait and retry
        await this.wait(5000);
        return await this.client.post('/api/endpoint', data);
        
      } else {
        // Log and re-throw
        this.logger.error('ServiceNow operation failed', error);
        throw error;
      }
    }
  }

  private async escalatePermissions(): Promise<void> {
    // Implementation for permission escalation
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Testing Patterns

### 1. Unit Testing

```typescript
// tests/unit/my-custom-agent.test.ts
import { MyCustomAgent } from '../../src/agents/my-custom-agent';
import { MemorySystem } from '../../src/memory/memory-system';

describe('MyCustomAgent', () => {
  let agent: MyCustomAgent;
  let mockMemory: jest.Mocked<MemorySystem>;

  beforeEach(() => {
    mockMemory = {
      store: jest.fn(),
      get: jest.fn(),
      search: jest.fn()
    } as any;

    agent = new MyCustomAgent({
      id: 'test-agent',
      memoryPath: ':memory:'
    });

    // Inject mock
    (agent as any).memory = mockMemory;
  });

  it('should execute task successfully', async () => {
    const task = {
      type: 'custom-task',
      data: { input: 'test' }
    };

    const result = await agent.execute(task);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ processed: task.data });
    expect(mockMemory.store).toHaveBeenCalledWith(
      'test-agent:last_execution',
      expect.any(Object)
    );
  });

  it('should handle task validation errors', async () => {
    const invalidTask = { type: null, data: null };

    const result = await agent.execute(invalidTask);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid task');
  });
});
```

### 2. Integration Testing

```typescript
// tests/integration/servicenow-integration.test.ts
import { ServiceNowClient } from '../../src/utils/servicenow-client';

describe('ServiceNow Integration', () => {
  let client: ServiceNowClient;

  beforeAll(async () => {
    if (!process.env.SNOW_INSTANCE) {
      console.warn('Skipping integration tests - no ServiceNow instance configured');
      return;
    }

    client = new ServiceNowClient({
      instance: process.env.SNOW_INSTANCE,
      clientId: process.env.SNOW_CLIENT_ID!,
      clientSecret: process.env.SNOW_CLIENT_SECRET!
    });

    await client.authenticate();
  });

  it('should authenticate successfully', async () => {
    if (!client) return;

    const isAuthenticated = await client.isAuthenticated();
    expect(isAuthenticated).toBe(true);
  });

  it('should create and delete a test widget', async () => {
    if (!client) return;

    const widget = await client.createWidget({
      name: 'test-widget-' + Date.now(),
      template: '<div>Test Widget</div>'
    });

    expect(widget).toHaveProperty('sys_id');

    // Cleanup
    await client.delete(`/api/now/sp/widget/${widget.sys_id}`);
  });
});
```

### 3. Mock Patterns

```typescript
// tests/mocks/mock-servicenow-client.ts
export class MockServiceNowClient {
  private authenticated = false;
  private mockData: Map<string, any> = new Map();

  async authenticate(): Promise<void> {
    this.authenticated = true;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authenticated;
  }

  async get(endpoint: string): Promise<any> {
    return this.mockData.get(endpoint) || { result: [] };
  }

  async post(endpoint: string, data: any): Promise<any> {
    const id = 'mock-' + Date.now();
    const result = { ...data, sys_id: id };
    this.mockData.set(`${endpoint}/${id}`, result);
    return result;
  }

  setMockData(endpoint: string, data: any): void {
    this.mockData.set(endpoint, data);
  }
}
```

## Debugging and Troubleshooting

### 1. Logging Best Practices

```typescript
import { Logger } from '../utils/logger';

export class ExampleWithLogging {
  private logger = new Logger('ExampleClass');

  async complexOperation(data: any): Promise<any> {
    // Log entry with context
    this.logger.info('Starting complex operation', {
      dataType: typeof data,
      dataSize: JSON.stringify(data).length
    });

    try {
      // Log progress
      this.logger.debug('Processing step 1');
      const step1Result = await this.step1(data);

      this.logger.debug('Processing step 2', { step1Result });
      const step2Result = await this.step2(step1Result);

      // Log success
      this.logger.info('Complex operation completed successfully', {
        resultSize: JSON.stringify(step2Result).length
      });

      return step2Result;

    } catch (error) {
      // Log error with context
      this.logger.error('Complex operation failed', {
        error: error.message,
        stack: error.stack,
        data: JSON.stringify(data).substring(0, 1000) // Truncate large data
      });

      throw error;
    }
  }
}
```

### 2. Performance Monitoring

```typescript
export class PerformanceMonitoring {
  private metrics: Map<string, number[]> = new Map();

  async monitoredOperation(name: string, operation: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      const duration = Date.now() - startTime;
      this.recordMetric(name, duration);
      
      if (duration > 5000) { // Alert on slow operations
        this.logger.warn(`Slow operation detected: ${name}`, { duration });
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(`${name}_error`, duration);
      throw error;
    }
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): { avg: number, min: number, max: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((a, b) => a + b) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}
```

### 3. Debug Utilities

```typescript
// src/utils/debug.ts
export class DebugUtils {
  static dumpMemoryState(memory: MemorySystem): Promise<void> {
    return memory.search('*').then(results => {
      console.log('=== Memory State Dump ===');
      results.forEach(({ key, value, ttl }) => {
        console.log(`${key}: ${JSON.stringify(value).substring(0, 100)}... (TTL: ${ttl})`);
      });
      console.log('=== End Memory Dump ===');
    });
  }

  static dumpAgentStates(agents: BaseAgent[]): void {
    console.log('=== Agent States ===');
    agents.forEach(agent => {
      console.log(`${agent.id}: ${agent.getStatus()}`);
    });
    console.log('=== End Agent States ===');
  }

  static traceTaskExecution(task: Task, result: Result): void {
    console.log('=== Task Execution Trace ===');
    console.log('Task:', JSON.stringify(task, null, 2));
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Duration:', result.duration || 'unknown');
    console.log('=== End Trace ===');
  }
}
```

## Performance Optimization

### 1. Memory Management

```typescript
export class OptimizedMemoryUsage {
  private cache = new Map<string, { data: any, expires: number }>();

  async getCachedData(key: string, fetcher: () => Promise<any>, ttl = 300000): Promise<any> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });

    return data;
  }

  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 2. Batch Operations

```typescript
export class BatchOperations {
  private pendingOperations: Array<{ operation: () => Promise<any>, resolve: Function, reject: Function }> = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async batchedOperation<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pendingOperations.push({ operation, resolve, reject });

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.executeBatch(), 100);
      }
    });
  }

  private async executeBatch(): Promise<void> {
    const operations = this.pendingOperations.splice(0);
    this.batchTimer = null;

    // Execute all operations in parallel
    const results = await Promise.allSettled(
      operations.map(({ operation }) => operation())
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const { resolve, reject } = operations[index];
      
      if (result.status === 'fulfilled') {
        resolve(result.value);
      } else {
        reject(result.reason);
      }
    });
  }
}
```

## Best Practices

### 1. Error Handling

```typescript
// Good: Specific error types
export class ValidationError extends Error {
  constructor(field: string, value: any) {
    super(`Validation failed for field '${field}' with value '${value}'`);
    this.name = 'ValidationError';
  }
}

export class ServiceNowError extends Error {
  constructor(message: string, public statusCode: number, public response?: any) {
    super(message);
    this.name = 'ServiceNowError';
  }
}

// Good: Proper error handling
async function handleWithProperErrors(): Promise<any> {
  try {
    return await riskyOperation();
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors
      logger.warn('Validation failed', { error: error.message });
      throw error;
    } else if (error instanceof ServiceNowError) {
      // Handle ServiceNow errors
      logger.error('ServiceNow API error', { 
        statusCode: error.statusCode, 
        response: error.response 
      });
      throw error;
    } else {
      // Handle unknown errors
      logger.error('Unexpected error', { error });
      throw new Error('Internal server error');
    }
  }
}
```

### 2. Configuration Management

```typescript
// src/config/app-config.ts
export class AppConfig {
  private static instance: AppConfig;
  private config: any;

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  private loadConfig(): void {
    this.config = {
      servicenow: {
        instance: process.env.SNOW_INSTANCE || '',
        clientId: process.env.SNOW_CLIENT_ID || '',
        clientSecret: process.env.SNOW_CLIENT_SECRET || '',
        timeout: parseInt(process.env.SNOW_TIMEOUT || '60000')
      },
      agents: {
        maxWorkers: parseInt(process.env.MAX_WORKERS || '10'),
        spawnTimeout: parseInt(process.env.SPAWN_TIMEOUT || '30000')
      },
      memory: {
        path: process.env.MEMORY_PATH || './memory.db',
        ttl: parseInt(process.env.DEFAULT_TTL || '86400000')
      }
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    const required = [
      'servicenow.instance',
      'servicenow.clientId',
      'servicenow.clientSecret'
    ];

    for (const path of required) {
      const value = this.get(path);
      if (!value) {
        throw new Error(`Missing required configuration: ${path}`);
      }
    }
  }

  get(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);
    
    target[lastKey] = value;
  }
}
```

### 3. Type Safety

```typescript
// Define strict types
export interface StrictTask {
  readonly id: string;
  readonly type: 'widget' | 'script' | 'security' | 'analysis';
  readonly data: Record<string, unknown>;
  readonly priority: 1 | 2 | 3 | 4 | 5;
  readonly createdAt: Date;
  readonly metadata?: {
    source?: string;
    tags?: string[];
    dependencies?: string[];
  };
}

export interface StrictResult<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  readonly metadata: {
    agentId: string;
    duration: number;
    timestamp: Date;
  };
}

// Use type guards
export function isValidTask(obj: any): obj is StrictTask {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    ['widget', 'script', 'security', 'analysis'].includes(obj.type) &&
    typeof obj.data === 'object' &&
    [1, 2, 3, 4, 5].includes(obj.priority) &&
    obj.createdAt instanceof Date
  );
}
```

## Contributing Guidelines

### 1. Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Use async/await instead of Promise chains
- Prefer composition over inheritance

### 2. Testing Requirements

- Unit tests for all new functionality
- Integration tests for ServiceNow interactions
- Mock external dependencies
- Maintain >80% code coverage

### 3. Documentation

- Update API documentation for new features
- Add examples for complex functionality
- Update architecture diagrams when needed
- Keep README.md current

### 4. Performance Considerations

- Profile code for memory leaks
- Use appropriate data structures
- Implement caching where beneficial
- Consider batch operations for bulk data

---

This developer guide is continuously updated. For the latest patterns and best practices, refer to recent commits and the development team's discussions.
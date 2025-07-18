# ServiceNow Flow Designer API Integration Guide

## Overview

This guide provides comprehensive documentation for the ServiceNow Flow Designer API integration strategy, replacing XML generation with direct API calls. The integration provides intelligent flow creation, dynamic discovery, error handling, and performance optimization.

## Architecture Components

### 1. Flow Designer API Integration (`/src/api/flow-designer-api.ts`)

The core API integration layer that handles direct ServiceNow API calls for flow creation and management.

#### Key Features:
- **ACID Transaction Support**: Ensures data consistency across multi-step flow creation
- **Automatic Rollback**: Comprehensive rollback on failure with dependency tracking
- **Flow Validation**: Pre-creation validation with detailed error reporting
- **Dynamic Component Creation**: Automatic creation of triggers, actions, variables, and connections

#### Usage Example:

```typescript
import { FlowDesignerAPI, FlowDefinition } from './src/api/flow-designer-api.js';

const flowAPI = new FlowDesignerAPI(serviceNowClient);

const flowDefinition: FlowDefinition = {
  name: 'Incident Notification Flow',
  internal_name: 'incident_notification_flow',
  description: 'Automatically notify users when incidents are created',
  table: 'incident',
  active: true,
  category: 'automation',
  run_as: 'user_who_triggers',
  trigger: {
    type: 'record_created',
    table: 'incident',
    condition: 'priority=1',
    active: true,
    order: 0,
    inputs: {}
  },
  actions: [
    {
      name: 'Send Email Notification',
      type: 'email',
      action_type_id: '', // Auto-discovered
      order: 100,
      active: true,
      inputs: {
        to: '${trigger.record.assigned_to.email}',
        subject: 'High Priority Incident Created',
        message: 'Incident ${trigger.record.number} requires attention'
      },
      outputs: {},
      on_error: { type: 'retry' }
    }
  ],
  variables: [],
  connections: [
    {
      from_step: 'trigger',
      to_step: 'Send Email Notification',
      condition: 'priority=1'
    }
  ],
  error_handling: []
};

const result = await flowAPI.createFlow(flowDefinition);
```

### 2. Dynamic Discovery Service (`/src/utils/flow-api-discovery.ts`)

Intelligent discovery of ServiceNow action types and triggers using REST APIs.

#### Key Features:
- **Semantic Search**: Natural language to action type mapping
- **Input/Output Analysis**: Automatic discovery of action parameters
- **Compatibility Scoring**: Confidence-based matching with alternatives
- **Context-Aware Suggestions**: Recommendations based on flow context

#### Usage Example:

```typescript
import { FlowAPIDiscovery } from './src/utils/flow-api-discovery.js';

const discovery = new FlowAPIDiscovery(serviceNowClient);

// Discover action types
const searchResult = await discovery.discoverActionTypes('send email notification');
console.log(searchResult.exact_matches); // Exact matches
console.log(searchResult.confidence_score); // Overall confidence

// Get detailed action information
const actionType = await discovery.getActionTypeDetails(searchResult.exact_matches[0].sys_id);
console.log(actionType.inputs); // Available inputs
console.log(actionType.outputs); // Available outputs

// Validate action inputs
const validation = await discovery.validateActionInputs(actionType.sys_id, {
  to: 'user@example.com',
  subject: 'Test Email',
  message: 'Test message'
});
```

### 3. Natural Language Mapper (`/src/api/natural-language-mapper.ts`)

Advanced natural language processing for converting descriptions to ServiceNow action types.

#### Key Features:
- **Intent Parsing**: Extracts verbs, objects, context, and conditions
- **Semantic Mappings**: Comprehensive verb and object mappings
- **Suggested Inputs**: Automatic input value generation
- **Context Integration**: Uses flow context for better suggestions

#### Usage Example:

```typescript
import { NaturalLanguageMapper } from './src/api/natural-language-mapper.js';

const mapper = new NaturalLanguageMapper(discovery);

const mappingResult = await mapper.mapToActionType(
  'send email notification to manager when high priority incident is created',
  {
    target_table: 'incident',
    flow_purpose: 'incident management',
    previous_actions: [],
    available_data: { priority: 1 }
  }
);

console.log(mappingResult.action_type); // Matched action type
console.log(mappingResult.confidence); // Confidence score
console.log(mappingResult.suggested_inputs); // Auto-generated inputs
```

### 4. Error Handling & Rollback (`/src/api/error-handling.ts`)

Comprehensive error handling with automatic recovery and rollback capabilities.

#### Key Features:
- **Error Classification**: Automatic error type and severity detection
- **Recovery Strategies**: Retry, rollback, fallback, and notification options
- **Transaction Management**: ACID-like properties with rollback support
- **Compensation Patterns**: Saga pattern implementation for complex workflows

#### Usage Example:

```typescript
import { FlowErrorHandler, ErrorContext } from './src/api/error-handling.js';

const errorHandler = new FlowErrorHandler(serviceNowClient);

// Start a transaction
const transactionId = errorHandler.startTransaction('flow_creation');

try {
  // Add operations to transaction
  errorHandler.addOperation(transactionId, {
    type: 'create',
    table: 'sys_hub_flow',
    record_id: flowId,
    dependencies: []
  });

  // ... perform operations ...

  // Commit transaction
  await errorHandler.commitTransaction(transactionId);
} catch (error) {
  // Handle error with automatic recovery
  const context: ErrorContext = {
    operation: 'create_flow',
    flow_id: flowId,
    timestamp: new Date()
  };

  const result = await errorHandler.handleError(error, context);
  console.log(result.recovered); // Was error recovered?
  console.log(result.actions_taken); // What actions were taken?
}
```

### 5. Performance Optimizer (`/src/api/performance-optimizer.ts`)

Advanced caching and performance optimization for API calls.

#### Key Features:
- **Intelligent Caching**: TTL-based caching with LRU eviction
- **Batch Processing**: Automatic batching of similar requests
- **Rate Limiting**: Built-in rate limiting and backoff strategies
- **Performance Analytics**: Detailed metrics and optimization suggestions

#### Usage Example:

```typescript
import { PerformanceOptimizer, APIRequest } from './src/api/performance-optimizer.js';

const optimizer = new PerformanceOptimizer(serviceNowClient, {
  max_size: 1000,
  default_ttl: 300000,
  compression_enabled: true
});

// Optimized API call
const request: APIRequest = {
  id: 'get_action_types',
  method: 'GET',
  url: '/api/now/table/sys_hub_action_type_base',
  cacheable: true,
  priority: 1
};

const response = await optimizer.optimizedAPICall(request);
console.log(response.cached); // Was response cached?
console.log(response.response_time); // Response time

// Batch multiple requests
const batchRequests = [request1, request2, request3];
const batchResults = await optimizer.batchAPIRequests(batchRequests);

// Analyze performance
const analysis = optimizer.analyzePerformance();
console.log(analysis.metrics); // Performance metrics
console.log(analysis.optimization_hints); // Optimization suggestions
```

### 6. Transaction Manager (`/src/api/transaction-manager.ts`)

ACID-compliant transaction management for complex flow operations.

#### Key Features:
- **ACID Properties**: Atomicity, Consistency, Isolation, Durability
- **Saga Pattern**: Distributed transaction support with compensation
- **Lock Management**: Resource locking with timeout handling
- **Distributed Transactions**: Multi-instance transaction coordination

#### Usage Example:

```typescript
import { TransactionManager, TransactionDefinition } from './src/api/transaction-manager.js';

const transactionManager = new TransactionManager(serviceNowClient, errorHandler);

const transactionDef: TransactionDefinition = {
  id: 'create_complex_flow',
  name: 'Create Complex Flow',
  description: 'Create flow with multiple components',
  steps: [
    {
      id: 'create_flow',
      name: 'Create Flow Record',
      operation: 'create',
      table: 'sys_hub_flow',
      data: flowData,
      dependencies: [],
      timeout: 30000,
      retry_count: 3,
      critical: true
    },
    {
      id: 'create_trigger',
      name: 'Create Trigger',
      operation: 'create',
      table: 'sys_hub_trigger_instance',
      data: triggerData,
      dependencies: ['create_flow'],
      timeout: 30000,
      retry_count: 3,
      critical: true
    }
  ],
  timeout: 120000,
  isolation_level: 'read_committed',
  rollback_on_error: true,
  retry_policy: {
    max_attempts: 3,
    initial_delay: 1000,
    max_delay: 10000,
    backoff_multiplier: 2,
    retryable_errors: ['network', 'timeout']
  }
};

const result = await transactionManager.executeTransaction(transactionDef);
```

## ServiceNow API Reference

### Core Flow Designer Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sys_hub_flow` | Main flow records | name, internal_name, description, active, category |
| `sys_hub_action_type_base` | Action type definitions | name, label, category, inputs, outputs |
| `sys_hub_trigger_type` | Trigger type definitions | name, label, supported_tables |
| `sys_hub_action_instance` | Flow action instances | flow, action_type, inputs, outputs, order |
| `sys_hub_trigger_instance` | Flow trigger instances | flow, trigger_type, table_name, condition |
| `sys_hub_flow_logic` | Flow connections | flow, from_step, to_step, condition |
| `sys_hub_flow_variable` | Flow variables | flow, name, type, default_value |

### Action Type Discovery

```typescript
// Search for action types
const response = await client.getRecords('sys_hub_action_type_base', {
  sysparm_query: 'nameLIKEemail^ORlabelLIKEemail',
  sysparm_limit: 20
});

// Get action inputs
const inputs = await client.getRecords('sys_hub_action_input', {
  sysparm_query: `action_type=${actionTypeId}`,
  sysparm_fields: 'name,label,type,required,default_value'
});

// Get action outputs
const outputs = await client.getRecords('sys_hub_action_output', {
  sysparm_query: `action_type=${actionTypeId}`,
  sysparm_fields: 'name,label,type,description'
});
```

### Flow Creation Process

1. **Validate Definition**: Check flow structure and dependencies
2. **Create Flow Record**: Insert main flow record
3. **Create Trigger**: Set up flow trigger with conditions
4. **Create Actions**: Add action instances with proper inputs/outputs
5. **Create Variables**: Define flow variables for data passing
6. **Create Connections**: Link trigger and actions with conditions
7. **Set Error Handling**: Configure error recovery strategies

## Best Practices

### 1. Error Handling
- Always use transactions for multi-step operations
- Implement comprehensive rollback strategies
- Use retry policies for transient errors
- Log all errors with context for debugging

### 2. Performance Optimization
- Enable caching for frequently accessed data
- Use batch operations when possible
- Monitor cache hit rates and optimize TTL values
- Implement connection pooling for high-volume operations

### 3. API Integration
- Use semantic search for action type discovery
- Validate inputs before API calls
- Implement rate limiting to avoid API throttling
- Use proper authentication and error handling

### 4. Natural Language Processing
- Provide clear, descriptive flow instructions
- Use context to improve action mapping accuracy
- Validate suggested inputs before using them
- Implement fallback strategies for low-confidence matches

### 5. Transaction Management
- Use appropriate isolation levels for your use case
- Implement compensation patterns for complex workflows
- Monitor transaction performance and timeout settings
- Use distributed transactions only when necessary

## Common Use Cases

### 1. Simple Notification Flow
```typescript
const simpleFlow = {
  name: 'Simple Notification',
  trigger: { type: 'record_created', table: 'incident' },
  actions: [
    { type: 'email', inputs: { to: 'admin@company.com', subject: 'New Incident' } }
  ]
};
```

### 2. Approval Workflow
```typescript
const approvalFlow = {
  name: 'Approval Workflow',
  trigger: { type: 'record_created', table: 'sc_request' },
  actions: [
    { type: 'approval', inputs: { approvers: 'manager' } },
    { type: 'email', inputs: { to: 'requester', subject: 'Request Approved' } }
  ]
};
```

### 3. Multi-Step Process
```typescript
const complexFlow = {
  name: 'Complex Process',
  trigger: { type: 'record_updated', table: 'incident' },
  actions: [
    { type: 'validate', inputs: { condition: 'priority=1' } },
    { type: 'create_task', inputs: { table: 'task', assignee: 'admin' } },
    { type: 'wait', inputs: { duration: 3600 } },
    { type: 'email', inputs: { to: 'manager', subject: 'Task Completed' } }
  ]
};
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check OAuth credentials and token expiration
   - Verify instance URL and permissions

2. **Action Type Not Found**
   - Use semantic search with broader terms
   - Check action type availability in your instance

3. **Transaction Rollback**
   - Review error logs for root cause
   - Check for dependency issues in flow steps

4. **Performance Issues**
   - Enable caching for frequently accessed data
   - Monitor API rate limits and batch requests

5. **Flow Validation Errors**
   - Verify all required inputs are provided
   - Check table and field permissions

### Debug Mode

Enable debug logging to get detailed information:

```typescript
const flowAPI = new FlowDesignerAPI(client);
// Enable debug logging
process.env.LOG_LEVEL = 'debug';
```

## Integration Examples

### Complete Flow Creation Example

```typescript
import { 
  FlowDesignerAPI, 
  FlowAPIDiscovery, 
  NaturalLanguageMapper, 
  PerformanceOptimizer 
} from './src/api/index.js';

// Initialize components
const client = new ServiceNowClient();
const discovery = new FlowAPIDiscovery(client);
const mapper = new NaturalLanguageMapper(discovery);
const optimizer = new PerformanceOptimizer(client);
const flowAPI = new FlowDesignerAPI(client);

// Create flow from natural language
const instruction = 'Send email to manager when high priority incident is created';
const mappingResult = await mapper.mapToActionType(instruction);

// Build flow definition
const flowDef = {
  name: 'High Priority Incident Notification',
  internal_name: 'high_priority_incident_notification',
  description: instruction,
  table: 'incident',
  active: true,
  category: 'automation',
  run_as: 'user_who_triggers',
  trigger: {
    type: 'record_created',
    table: 'incident',
    condition: 'priority=1',
    active: true,
    order: 0,
    inputs: {}
  },
  actions: [
    {
      name: 'Send Manager Notification',
      type: 'email',
      action_type_id: mappingResult.action_type.sys_id,
      order: 100,
      active: true,
      inputs: mappingResult.suggested_inputs,
      outputs: {},
      on_error: { type: 'retry' }
    }
  ],
  variables: [],
  connections: [
    {
      from_step: 'trigger',
      to_step: 'Send Manager Notification'
    }
  ],
  error_handling: []
};

// Create flow
const result = await flowAPI.createFlow(flowDef);
console.log('Flow created successfully:', result.flow_url);
```

This comprehensive API integration strategy replaces XML generation with intelligent, direct API calls while providing robust error handling, performance optimization, and natural language processing capabilities.
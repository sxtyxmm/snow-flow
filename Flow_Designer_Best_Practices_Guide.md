# ServiceNow Flow Designer Best Practices Implementation Guide

## Overview

This guide provides specific implementation patterns and code examples for creating ServiceNow flows and subflows programmatically using the REST API, based on analysis of the current Flow Composer MCP implementation.

## Core ServiceNow Flow Designer Tables

### Primary Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sys_hub_flow` | Main flow definition | `name`, `description`, `internal_name`, `active`, `type`, `status` |
| `sys_hub_trigger_instance` | Flow triggers | `flow`, `trigger_type`, `table_name`, `condition`, `active` |
| `sys_hub_action_instance` | Flow actions | `flow`, `action_name`, `action_type`, `order`, `inputs`, `active` |
| `sys_hub_flow_logic` | Visual flow representation | `flow`, `name`, `type`, `order`, `instance`, `next` |
| `sys_hub_action_type_base` | Available action types | `name`, `label`, `category`, `active` |
| `sys_hub_trigger_type` | Available trigger types | `name`, `label`, `table_name` |

### Supporting Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `sys_hub_action_input` | Action input definitions | `action_type`, `name`, `label`, `type`, `mandatory` |
| `sys_hub_action_output` | Action output definitions | `action_type`, `name`, `label`, `type` |
| `sys_app` | Scoped applications | `name`, `scope`, `version`, `active` |
| `sys_update_set` | Change tracking | `name`, `description`, `state`, `application` |

## REST API Patterns

### Authentication

```typescript
// OAuth 2.0 (Recommended)
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Basic Authentication (Alternative)
const headers = {
  'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Schema Discovery

```typescript
async function getTableSchema(tableName: string): Promise<TableSchema> {
  const response = await axios.get(
    `https://${instance}.service-now.com/api/now/schema/table/${tableName}`,
    { headers }
  );
  
  return response.data.result;
}

// Example usage
const flowSchema = await getTableSchema('sys_hub_flow');
const triggerSchema = await getTableSchema('sys_hub_trigger_instance');
```

## Flow vs Subflow Decision Matrix

### Decision Logic Implementation

```typescript
interface FlowRequirements {
  hasExternalTrigger: boolean;  // Created, Updated, Scheduled
  needsReturnValues: boolean;   // Called from scripts
  isReusableComponent: boolean; // Used in multiple places
  complexityLevel: 'simple' | 'medium' | 'complex';
  executionContext: 'standalone' | 'programmatic';
}

class FlowTypeDecisionEngine {
  static determineFlowType(requirements: FlowRequirements): 'flow' | 'subflow' {
    // Primary decision factors
    if (requirements.executionContext === 'programmatic') {
      return 'subflow';
    }
    
    if (requirements.needsReturnValues) {
      return 'subflow';
    }
    
    if (requirements.hasExternalTrigger && !requirements.needsReturnValues) {
      return 'flow';
    }
    
    // Secondary decision factors
    if (requirements.isReusableComponent && requirements.complexityLevel !== 'simple') {
      return 'subflow';
    }
    
    // Default to flow for simple standalone processes
    return 'flow';
  }
}
```

### Usage Examples

```typescript
// Example 1: Incident escalation (standalone automation)
const incidentEscalation: FlowRequirements = {
  hasExternalTrigger: true,     // Triggered on incident update
  needsReturnValues: false,     // No return values needed
  isReusableComponent: false,   // Specific to incident process
  complexityLevel: 'medium',
  executionContext: 'standalone'
};
// Result: 'flow'

// Example 2: Approval process (reusable component)
const approvalProcess: FlowRequirements = {
  hasExternalTrigger: false,    // Called from scripts
  needsReturnValues: true,      // Returns approval result
  isReusableComponent: true,    // Used across multiple processes
  complexityLevel: 'complex',
  executionContext: 'programmatic'
};
// Result: 'subflow'
```

## Global vs Scoped Application Strategy

### Scope Selection Logic

```typescript
interface ScopeRequirements {
  deploymentScope: 'single_instance' | 'multiple_instances' | 'enterprise';
  customizationLevel: 'minimal' | 'moderate' | 'extensive';
  governanceRequirements: 'basic' | 'strict' | 'enterprise';
  maintenanceStrategy: 'quick_fixes' | 'structured_releases' | 'enterprise_cicd';
  reuseRequirements: 'none' | 'internal' | 'external';
}

class ApplicationScopeStrategy {
  static selectScope(requirements: ScopeRequirements): 'global' | 'scoped' {
    // Enterprise requirements always use scoped
    if (requirements.governanceRequirements === 'enterprise' ||
        requirements.deploymentScope === 'enterprise' ||
        requirements.maintenanceStrategy === 'enterprise_cicd') {
      return 'scoped';
    }
    
    // Complex customizations benefit from scoped
    if (requirements.customizationLevel === 'extensive' ||
        requirements.reuseRequirements === 'external') {
      return 'scoped';
    }
    
    // Multiple instance deployment needs scoped
    if (requirements.deploymentScope === 'multiple_instances') {
      return 'scoped';
    }
    
    // Simple, single-instance flows can use global
    return 'global';
  }
}
```

### Scoped Application Creation

```typescript
async function createScopedApplication(appConfig: ApplicationConfig): Promise<string> {
  const appData = {
    name: appConfig.name,
    scope: `x_${appConfig.vendor}_${appConfig.name.toLowerCase().replace(/\s+/g, '_')}`,
    version: appConfig.version || '1.0.0',
    short_description: appConfig.shortDescription,
    description: appConfig.description,
    vendor: appConfig.vendor,
    vendor_prefix: appConfig.vendorPrefix,
    active: true,
    source: 'manual',
    template: 'basic_scoped_app'
  };
  
  const response = await axios.post(
    `https://${instance}.service-now.com/api/now/table/sys_app`,
    appData,
    { headers }
  );
  
  return response.data.result.sys_id;
}
```

## Enhanced Flow Creation Patterns

### Complete Flow Creation Workflow

```typescript
interface FlowDefinition {
  name: string;
  description: string;
  application_scope?: string;
  trigger: TriggerDefinition;
  actions: ActionDefinition[];
  connections?: ConnectionDefinition[];
  variables?: VariableDefinition[];
  error_handling?: ErrorHandling[];
}

interface TriggerDefinition {
  type: 'record_created' | 'record_updated' | 'scheduled' | 'manual';
  table: string;
  condition?: string;
  schedule?: string;
}

interface ActionDefinition {
  name: string;
  type: string;
  order: number;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error_handling?: ErrorHandling[];
}

class EnhancedFlowCreator {
  async createFlow(definition: FlowDefinition): Promise<FlowCreationResult> {
    const transaction = new FlowTransaction();
    
    try {
      // 1. Create main flow record
      const flowId = await this.createFlowRecord(definition, transaction);
      
      // 2. Create trigger
      const triggerId = await this.createTrigger(flowId, definition.trigger, transaction);
      
      // 3. Create actions
      const actionIds = await this.createActions(flowId, definition.actions, transaction);
      
      // 4. Create flow logic (visual representation)
      await this.createFlowLogic(flowId, triggerId, actionIds, transaction);
      
      // 5. Create connections
      if (definition.connections) {
        await this.createConnections(flowId, definition.connections, transaction);
      }
      
      // 6. Validate flow structure
      await this.validateFlow(flowId);
      
      await transaction.commit();
      
      return {
        success: true,
        flowId,
        message: `Flow '${definition.name}' created successfully`
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  private async createFlowRecord(definition: FlowDefinition, transaction: FlowTransaction): Promise<string> {
    const flowData = {
      name: definition.name,
      description: definition.description,
      internal_name: this.sanitizeInternalName(definition.name),
      active: true,
      type: 'flow',
      status: 'published',
      sys_class_name: 'sys_hub_flow',
      access: 'public',
      source_ui: 'flow_designer',
      application: definition.application_scope || 'global',
      run_as: 'user_who_triggers'
    };
    
    const response = await axios.post(
      `https://${instance}.service-now.com/api/now/table/sys_hub_flow`,
      flowData,
      { headers }
    );
    
    const flowId = response.data.result.sys_id;
    transaction.addCreatedRecord('sys_hub_flow', flowId);
    
    return flowId;
  }
  
  private async createTrigger(flowId: string, trigger: TriggerDefinition, transaction: FlowTransaction): Promise<string> {
    // Get trigger type from cache
    const triggerType = await this.getTriggerType(trigger.type);
    
    const triggerData = {
      flow: flowId,
      trigger_type: triggerType.sys_id,
      table_name: trigger.table,
      condition: trigger.condition || '',
      active: true,
      order: 0
    };
    
    const response = await axios.post(
      `https://${instance}.service-now.com/api/now/table/sys_hub_trigger_instance`,
      triggerData,
      { headers }
    );
    
    const triggerId = response.data.result.sys_id;
    transaction.addCreatedRecord('sys_hub_trigger_instance', triggerId);
    
    return triggerId;
  }
  
  private async createActions(flowId: string, actions: ActionDefinition[], transaction: FlowTransaction): Promise<string[]> {
    const actionIds: string[] = [];
    
    for (const action of actions) {
      const actionType = await this.getActionType(action.type);
      
      const actionData = {
        flow: flowId,
        action_name: action.name,
        action_type: actionType.sys_id,
        order: action.order,
        active: true,
        inputs: JSON.stringify(action.inputs || {})
      };
      
      const response = await axios.post(
        `https://${instance}.service-now.com/api/now/table/sys_hub_action_instance`,
        actionData,
        { headers }
      );
      
      const actionId = response.data.result.sys_id;
      transaction.addCreatedRecord('sys_hub_action_instance', actionId);
      actionIds.push(actionId);
    }
    
    return actionIds;
  }
  
  private async createFlowLogic(flowId: string, triggerId: string, actionIds: string[], transaction: FlowTransaction): Promise<void> {
    // Create trigger logic
    const triggerLogicData = {
      flow: flowId,
      name: 'Trigger',
      type: 'trigger',
      order: 0,
      instance: triggerId,
      active: true
    };
    
    const triggerLogicResponse = await axios.post(
      `https://${instance}.service-now.com/api/now/table/sys_hub_flow_logic`,
      triggerLogicData,
      { headers }
    );
    
    const triggerLogicId = triggerLogicResponse.data.result.sys_id;
    transaction.addCreatedRecord('sys_hub_flow_logic', triggerLogicId);
    
    // Create action logic entries
    const actionLogicIds: string[] = [];
    
    for (let i = 0; i < actionIds.length; i++) {
      const actionLogicData = {
        flow: flowId,
        name: `Action ${i + 1}`,
        type: 'action',
        order: (i + 1) * 100,
        instance: actionIds[i],
        active: true
      };
      
      const actionLogicResponse = await axios.post(
        `https://${instance}.service-now.com/api/now/table/sys_hub_flow_logic`,
        actionLogicData,
        { headers }
      );
      
      const actionLogicId = actionLogicResponse.data.result.sys_id;
      transaction.addCreatedRecord('sys_hub_flow_logic', actionLogicId);
      actionLogicIds.push(actionLogicId);
    }
    
    // Create connections between logic elements
    let previousLogicId = triggerLogicId;
    
    for (const actionLogicId of actionLogicIds) {
      await axios.patch(
        `https://${instance}.service-now.com/api/now/table/sys_hub_flow_logic/${previousLogicId}`,
        { next: actionLogicId },
        { headers }
      );
      
      previousLogicId = actionLogicId;
    }
  }
}
```

### Transaction Management

```typescript
class FlowTransaction {
  private createdRecords: Array<{table: string, sys_id: string}> = [];
  private committed = false;
  
  addCreatedRecord(table: string, sys_id: string): void {
    this.createdRecords.push({ table, sys_id });
  }
  
  async commit(): Promise<void> {
    this.committed = true;
    console.log(`Transaction committed: ${this.createdRecords.length} records created`);
  }
  
  async rollback(): Promise<void> {
    if (this.committed) {
      console.warn('Cannot rollback committed transaction');
      return;
    }
    
    console.log(`Rolling back transaction: ${this.createdRecords.length} records to delete`);
    
    // Delete records in reverse order
    for (const record of this.createdRecords.reverse()) {
      try {
        await axios.delete(
          `https://${instance}.service-now.com/api/now/table/${record.table}/${record.sys_id}`,
          { headers }
        );
      } catch (error) {
        console.error(`Failed to delete ${record.table}:${record.sys_id}`, error);
      }
    }
    
    this.createdRecords = [];
  }
}
```

## Subflow Creation Patterns

### Subflow-Specific Implementation

```typescript
interface SubflowDefinition {
  name: string;
  description: string;
  application_scope?: string;
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  actions: ActionDefinition[];
  variables?: VariableDefinition[];
}

interface InputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  label: string;
  mandatory: boolean;
  default_value?: any;
}

interface OutputDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  label: string;
  description?: string;
}

class SubflowCreator {
  async createSubflow(definition: SubflowDefinition): Promise<SubflowCreationResult> {
    const transaction = new FlowTransaction();
    
    try {
      // 1. Create main subflow record
      const subflowId = await this.createSubflowRecord(definition, transaction);
      
      // 2. Create input/output definitions
      await this.createInputOutputs(subflowId, definition.inputs, definition.outputs, transaction);
      
      // 3. Create actions
      const actionIds = await this.createActions(subflowId, definition.actions, transaction);
      
      // 4. Create subflow logic
      await this.createSubflowLogic(subflowId, actionIds, transaction);
      
      // 5. Validate subflow structure
      await this.validateSubflow(subflowId);
      
      await transaction.commit();
      
      return {
        success: true,
        subflowId,
        message: `Subflow '${definition.name}' created successfully`
      };
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  private async createSubflowRecord(definition: SubflowDefinition, transaction: FlowTransaction): Promise<string> {
    const subflowData = {
      name: definition.name,
      description: definition.description,
      internal_name: this.sanitizeInternalName(definition.name),
      active: true,
      type: 'subflow',
      status: 'published',
      sys_class_name: 'sys_hub_flow',
      access: 'public',
      source_ui: 'flow_designer',
      application: definition.application_scope || 'global',
      run_as: 'user_who_initiates'
    };
    
    const response = await axios.post(
      `https://${instance}.service-now.com/api/now/table/sys_hub_flow`,
      subflowData,
      { headers }
    );
    
    const subflowId = response.data.result.sys_id;
    transaction.addCreatedRecord('sys_hub_flow', subflowId);
    
    return subflowId;
  }
  
  private async createInputOutputs(subflowId: string, inputs: InputDefinition[], outputs: OutputDefinition[], transaction: FlowTransaction): Promise<void> {
    // Create input definitions
    for (const input of inputs) {
      const inputData = {
        flow: subflowId,
        name: input.name,
        type: input.type,
        label: input.label,
        mandatory: input.mandatory,
        default_value: input.default_value || '',
        order: inputs.indexOf(input) * 100
      };
      
      const response = await axios.post(
        `https://${instance}.service-now.com/api/now/table/sys_hub_flow_input`,
        inputData,
        { headers }
      );
      
      transaction.addCreatedRecord('sys_hub_flow_input', response.data.result.sys_id);
    }
    
    // Create output definitions
    for (const output of outputs) {
      const outputData = {
        flow: subflowId,
        name: output.name,
        type: output.type,
        label: output.label,
        description: output.description || '',
        order: outputs.indexOf(output) * 100
      };
      
      const response = await axios.post(
        `https://${instance}.service-now.com/api/now/table/sys_hub_flow_output`,
        outputData,
        { headers }
      );
      
      transaction.addCreatedRecord('sys_hub_flow_output', response.data.result.sys_id);
    }
  }
}
```

## Advanced Flow Patterns

### Conditional Logic Implementation

```typescript
interface ConditionalAction {
  condition: string;
  true_actions: ActionDefinition[];
  false_actions?: ActionDefinition[];
}

async function createConditionalFlow(flowId: string, conditional: ConditionalAction): Promise<void> {
  // Create condition evaluation action
  const conditionAction = {
    flow: flowId,
    action_name: 'Evaluate Condition',
    action_type: await this.getActionType('Condition'),
    order: 100,
    inputs: JSON.stringify({
      condition: conditional.condition
    })
  };
  
  // Create true branch
  const trueBranchActions = await this.createActions(flowId, conditional.true_actions);
  
  // Create false branch (if specified)
  let falseBranchActions = [];
  if (conditional.false_actions) {
    falseBranchActions = await this.createActions(flowId, conditional.false_actions);
  }
  
  // Create flow logic with conditional branches
  await this.createConditionalLogic(flowId, conditionAction, trueBranchActions, falseBranchActions);
}
```

### Error Handling Patterns

```typescript
interface ErrorHandling {
  type: 'retry' | 'continue' | 'stop' | 'notify' | 'fallback';
  max_retries?: number;
  retry_delay?: number;
  notification_recipient?: string;
  fallback_action?: ActionDefinition;
}

async function addErrorHandling(actionId: string, errorHandling: ErrorHandling): Promise<void> {
  const errorHandlingData = {
    action: actionId,
    type: errorHandling.type,
    max_retries: errorHandling.max_retries || 3,
    retry_delay: errorHandling.retry_delay || 5000,
    notification_recipient: errorHandling.notification_recipient,
    active: true
  };
  
  await axios.post(
    `https://${instance}.service-now.com/api/now/table/sys_hub_error_handling`,
    errorHandlingData,
    { headers }
  );
}
```

### Loop Implementation

```typescript
interface LoopDefinition {
  type: 'for_each' | 'while' | 'do_while';
  collection?: string;
  condition?: string;
  max_iterations?: number;
  actions: ActionDefinition[];
}

async function createLoopFlow(flowId: string, loop: LoopDefinition): Promise<void> {
  const loopAction = {
    flow: flowId,
    action_name: `${loop.type.toUpperCase()} Loop`,
    action_type: await this.getActionType('Loop'),
    order: 100,
    inputs: JSON.stringify({
      type: loop.type,
      collection: loop.collection,
      condition: loop.condition,
      max_iterations: loop.max_iterations || 100
    })
  };
  
  // Create loop body actions
  const loopBodyActions = await this.createActions(flowId, loop.actions);
  
  // Create loop logic structure
  await this.createLoopLogic(flowId, loopAction, loopBodyActions);
}
```

## Validation and Testing

### Flow Validation

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface ValidationError {
  type: 'missing_field' | 'invalid_reference' | 'circular_dependency' | 'permission_error';
  message: string;
  field?: string;
  record_id?: string;
}

class FlowValidator {
  async validateFlow(flowId: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
    
    // 1. Validate flow record
    await this.validateFlowRecord(flowId, result);
    
    // 2. Validate triggers
    await this.validateTriggers(flowId, result);
    
    // 3. Validate actions
    await this.validateActions(flowId, result);
    
    // 4. Validate connections
    await this.validateConnections(flowId, result);
    
    // 5. Validate permissions
    await this.validatePermissions(flowId, result);
    
    result.isValid = result.errors.length === 0;
    
    return result;
  }
  
  private async validateFlowRecord(flowId: string, result: ValidationResult): Promise<void> {
    const flow = await this.getFlow(flowId);
    
    if (!flow.name) {
      result.errors.push({
        type: 'missing_field',
        message: 'Flow name is required',
        field: 'name',
        record_id: flowId
      });
    }
    
    if (!flow.internal_name) {
      result.errors.push({
        type: 'missing_field',
        message: 'Flow internal name is required',
        field: 'internal_name',
        record_id: flowId
      });
    }
    
    // Check for naming conflicts
    const existingFlow = await this.findFlowByInternalName(flow.internal_name);
    if (existingFlow && existingFlow.sys_id !== flowId) {
      result.errors.push({
        type: 'invalid_reference',
        message: `Flow with internal name '${flow.internal_name}' already exists`,
        field: 'internal_name',
        record_id: flowId
      });
    }
  }
  
  private async validateTriggers(flowId: string, result: ValidationResult): Promise<void> {
    const triggers = await this.getFlowTriggers(flowId);
    
    if (triggers.length === 0) {
      result.warnings.push({
        type: 'missing_component',
        message: 'Flow has no triggers - it may not execute automatically',
        record_id: flowId
      });
    }
    
    for (const trigger of triggers) {
      if (!trigger.trigger_type) {
        result.errors.push({
          type: 'missing_field',
          message: 'Trigger type is required',
          field: 'trigger_type',
          record_id: trigger.sys_id
        });
      }
      
      if (!trigger.table_name) {
        result.errors.push({
          type: 'missing_field',
          message: 'Trigger table name is required',
          field: 'table_name',
          record_id: trigger.sys_id
        });
      }
    }
  }
  
  private async validateActions(flowId: string, result: ValidationResult): Promise<void> {
    const actions = await this.getFlowActions(flowId);
    
    if (actions.length === 0) {
      result.warnings.push({
        type: 'missing_component',
        message: 'Flow has no actions - it will not perform any operations',
        record_id: flowId
      });
    }
    
    for (const action of actions) {
      if (!action.action_type) {
        result.errors.push({
          type: 'missing_field',
          message: 'Action type is required',
          field: 'action_type',
          record_id: action.sys_id
        });
      }
      
      // Validate action inputs
      await this.validateActionInputs(action, result);
    }
  }
  
  private async validateConnections(flowId: string, result: ValidationResult): Promise<void> {
    const logicElements = await this.getFlowLogic(flowId);
    
    // Check for orphaned elements
    const connectedElements = new Set<string>();
    
    for (const element of logicElements) {
      if (element.next) {
        connectedElements.add(element.next);
      }
    }
    
    for (const element of logicElements) {
      if (element.type !== 'trigger' && !connectedElements.has(element.sys_id)) {
        result.warnings.push({
          type: 'orphaned_element',
          message: `Logic element '${element.name}' is not connected to any other elements`,
          record_id: element.sys_id
        });
      }
    }
  }
  
  private async validatePermissions(flowId: string, result: ValidationResult): Promise<void> {
    const flow = await this.getFlow(flowId);
    
    // Check table permissions for triggers
    const triggers = await this.getFlowTriggers(flowId);
    
    for (const trigger of triggers) {
      const hasPermission = await this.checkTablePermission(trigger.table_name, 'read');
      if (!hasPermission) {
        result.errors.push({
          type: 'permission_error',
          message: `Insufficient permissions to access table '${trigger.table_name}'`,
          record_id: trigger.sys_id
        });
      }
    }
  }
}
```

### Flow Testing Framework

```typescript
interface FlowTestCase {
  name: string;
  description: string;
  input_data: Record<string, any>;
  expected_outputs: Record<string, any>;
  expected_side_effects: SideEffect[];
}

interface SideEffect {
  type: 'record_created' | 'record_updated' | 'notification_sent' | 'email_sent';
  table?: string;
  record_id?: string;
  field_changes?: Record<string, any>;
}

class FlowTestRunner {
  async runFlowTests(flowId: string, testCases: FlowTestCase[]): Promise<FlowTestResult[]> {
    const results: FlowTestResult[] = [];
    
    for (const testCase of testCases) {
      const result = await this.runSingleTest(flowId, testCase);
      results.push(result);
    }
    
    return results;
  }
  
  private async runSingleTest(flowId: string, testCase: FlowTestCase): Promise<FlowTestResult> {
    const testResult: FlowTestResult = {
      testCase: testCase.name,
      passed: false,
      errors: [],
      warnings: [],
      execution_time: 0,
      actual_outputs: {},
      actual_side_effects: []
    };
    
    const startTime = Date.now();
    
    try {
      // Execute the flow with test data
      const executionResult = await this.executeFlow(flowId, testCase.input_data);
      
      testResult.execution_time = Date.now() - startTime;
      testResult.actual_outputs = executionResult.outputs;
      
      // Validate outputs
      const outputsMatch = this.compareOutputs(testCase.expected_outputs, executionResult.outputs);
      if (!outputsMatch) {
        testResult.errors.push('Output values do not match expected results');
      }
      
      // Validate side effects
      const sideEffectsMatch = await this.validateSideEffects(testCase.expected_side_effects);
      if (!sideEffectsMatch) {
        testResult.errors.push('Side effects do not match expected results');
      }
      
      testResult.passed = testResult.errors.length === 0;
      
    } catch (error) {
      testResult.errors.push(`Flow execution failed: ${error.message}`);
      testResult.execution_time = Date.now() - startTime;
    }
    
    return testResult;
  }
}
```

## Performance Optimization

### Batch Operations

```typescript
class BatchFlowOperations {
  async createMultipleFlows(flows: FlowDefinition[]): Promise<BatchResult<string>> {
    const results: BatchResult<string> = {
      successful: [],
      failed: [],
      total: flows.length
    };
    
    // Process flows in batches to avoid API rate limits
    const batchSize = 5;
    const batches = this.chunkArray(flows, batchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(flow => this.createFlow(flow));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.successful.push({
            input: batch[index],
            output: result.value.flowId
          });
        } else {
          results.failed.push({
            input: batch[index],
            error: result.reason.message
          });
        }
      });
      
      // Rate limiting delay
      await this.delay(1000);
    }
    
    return results;
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Caching Strategy

```typescript
class FlowCreationCache {
  private actionTypeCache = new Map<string, string>();
  private triggerTypeCache = new Map<string, string>();
  private tableSchemaCache = new Map<string, any>();
  
  async getActionType(actionName: string): Promise<string> {
    if (this.actionTypeCache.has(actionName)) {
      return this.actionTypeCache.get(actionName)!;
    }
    
    const actionType = await this.fetchActionType(actionName);
    this.actionTypeCache.set(actionName, actionType.sys_id);
    
    return actionType.sys_id;
  }
  
  async getTriggerType(triggerName: string): Promise<string> {
    if (this.triggerTypeCache.has(triggerName)) {
      return this.triggerTypeCache.get(triggerName)!;
    }
    
    const triggerType = await this.fetchTriggerType(triggerName);
    this.triggerTypeCache.set(triggerName, triggerType.sys_id);
    
    return triggerType.sys_id;
  }
  
  async getTableSchema(tableName: string): Promise<any> {
    if (this.tableSchemaCache.has(tableName)) {
      return this.tableSchemaCache.get(tableName);
    }
    
    const schema = await this.fetchTableSchema(tableName);
    this.tableSchemaCache.set(tableName, schema);
    
    return schema;
  }
  
  clearCache(): void {
    this.actionTypeCache.clear();
    this.triggerTypeCache.clear();
    this.tableSchemaCache.clear();
  }
}
```

## Monitoring and Logging

### Flow Execution Monitoring

```typescript
interface FlowExecutionMetrics {
  flowId: string;
  flowName: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  actionResults: ActionResult[];
  errorDetails?: string;
}

class FlowMonitor {
  async trackFlowExecution(flowId: string): Promise<FlowExecutionMetrics> {
    const metrics: FlowExecutionMetrics = {
      flowId,
      flowName: await this.getFlowName(flowId),
      executionId: this.generateExecutionId(),
      startTime: new Date(),
      status: 'running',
      actionResults: []
    };
    
    // Store initial metrics
    await this.storeMetrics(metrics);
    
    return metrics;
  }
  
  async updateExecutionStatus(executionId: string, status: string, errorDetails?: string): Promise<void> {
    const metrics = await this.getMetrics(executionId);
    
    metrics.status = status as any;
    metrics.endTime = new Date();
    metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    
    if (errorDetails) {
      metrics.errorDetails = errorDetails;
    }
    
    await this.storeMetrics(metrics);
  }
  
  async getFlowPerformanceReport(flowId: string, dateRange: DateRange): Promise<PerformanceReport> {
    const executions = await this.getFlowExecutions(flowId, dateRange);
    
    const report: PerformanceReport = {
      flowId,
      flowName: await this.getFlowName(flowId),
      totalExecutions: executions.length,
      successfulExecutions: executions.filter(e => e.status === 'completed').length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageExecutionTime: this.calculateAverageExecutionTime(executions),
      slowestExecution: this.findSlowestExecution(executions),
      fastestExecution: this.findFastestExecution(executions),
      commonErrors: this.analyzeCommonErrors(executions)
    };
    
    return report;
  }
}
```

This comprehensive guide provides the foundation for implementing robust, API-based ServiceNow Flow Designer solutions with proper error handling, validation, and performance optimization.
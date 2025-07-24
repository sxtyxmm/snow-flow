# Flow Structure Builder - ServiceNow Flow Utilities

This document describes the new flow structure builder utilities that solve the critical findings about proper ServiceNow flow creation.

## Critical Findings Addressed

1. ✅ **Flows need actual ServiceNow records, not just JSON**
2. ✅ **Each activity needs sys_hub_action_instance record**  
3. ✅ **Connections need sys_hub_flow_logic records with proper 'next' chaining**
4. ✅ **Generate proper sys_ids for all components**
5. ✅ **Ensure action_type IDs are correct**

## Created Files

### 1. Flow Structure Builder (`src/utils/flow-structure-builder.ts`)

**Main utility functions:**

- `generateFlowComponents(flowDefinition, flowSysId?)` - Converts flow JSON to proper ServiceNow records
- `buildLogicChain(activities, triggerInstance, actionInstances)` - Creates trigger → action1 → action2 → end chain
- `createActionInstances(activities, flowSysId)` - Generates sys_hub_action_instance records
- `validateFlowComponents(components)` - Validates all components before deployment
- `generateFlowXML(components)` - Creates Update Set XML for deployment

**Helper utilities:**

- `convertToFlowDefinition(flow)` - Converts legacy flow formats to standardized format
- `createTestFlowComponents(name)` - Generates test flow structure for validation
- `extractSysIds(existingFlow)` - Extracts sys_ids from existing flows for updates
- `generateFlowUpdate(flowDefinition, existingSysIds)` - Creates update payload for existing flows

### 2. Enhanced ServiceNow Client (`src/utils/servicenow-client.ts`)

**New method added:**

- `createFlowWithStructureBuilder(flowDefinition)` - Uses the structure builder for proper flow creation

### 3. Updated Flow Composer MCP (`src/mcp/servicenow-flow-composer-mcp.ts`)

**Enhanced deployment:**

- Uses structure builder by default with fallback to original method
- Automatic conversion from legacy flow formats
- Proper error handling and validation

### 4. Test Suite (`test/flow-structure-builder.test.ts`)

**Comprehensive testing:**

- Basic flow component generation
- Action type ID mapping validation  
- Logic chain building verification
- Flow validation testing
- Legacy format conversion testing

## Key Features

### 1. Proper ServiceNow Record Structure

```typescript
const components = generateFlowComponents(flowDefinition);
// Generates:
// • sys_hub_flow (main flow record)
// • sys_hub_trigger_instance (trigger configuration)  
// • sys_hub_action_instance[] (each activity)
// • sys_hub_flow_logic[] (connections/logic chain)
// • sys_hub_flow_variable[] (flow variables)
```

### 2. Correct Action Type IDs

```typescript
export const ACTION_TYPE_IDS = {
  notification: '716281160b100300d97d8bf637673ac7',
  approval: 'e3a61c920b200300d97d8bf637673a30',
  script: '43c8cf0e0b200300d97d8bf637673ab4',
  // ... and more
};
```

### 3. Proper Logic Chain

```typescript
// Creates proper execution flow:
// Trigger → Action 1 → Action 2 → Action 3 → END
const logicChain = buildLogicChain(activities, triggerInstance, actionInstances);
```

### 4. XML Generation for Update Sets

```typescript
const flowXML = generateFlowXML(components);
// Creates proper Update Set XML with all records
```

## Usage Examples

### Basic Flow Creation

```typescript
import { generateFlowComponents, FlowDefinition } from './flow-structure-builder';

const flowDef: FlowDefinition = {
  name: 'Approval Workflow',
  description: 'Handles approval requests',
  table: 'sc_request',
  trigger: {
    type: 'record_created',
    table: 'sc_request', 
    condition: 'state=1'
  },
  activities: [
    {
      id: 'approval_step',
      name: 'Request Approval',
      type: 'approval',
      inputs: { approver: 'admin', message: 'Please approve' },
      outputs: { approval_result: 'string' }
    },
    {
      id: 'notification_step', 
      name: 'Send Notification',
      type: 'notification',
      inputs: { recipient: 'user@company.com', subject: 'Approved' },
      outputs: { notification_sent: 'boolean' }
    }
  ],
  variables: [],
  connections: [],
  error_handling: []
};

const components = generateFlowComponents(flowDef);
```

### Enhanced ServiceNow Client Usage

```typescript
import { ServiceNowClient } from './servicenow-client';

const client = new ServiceNowClient();
const result = await client.createFlowWithStructureBuilder(flowDefinition);

console.log('Flow created:', result.data.sys_id);
console.log('Components:', result.data.components);
console.log('XML:', result.data.flow_xml);
```

### Legacy Flow Conversion

```typescript
import { convertToFlowDefinition } from './flow-structure-builder';

// Convert old format to new format
const legacyFlow = {
  name: 'Old Flow',
  trigger_type: 'manual',
  actions: [{ name: 'Action', type: 'script' }]
};

const modernFlow = convertToFlowDefinition(legacyFlow);
const components = generateFlowComponents(modernFlow);
```

## Implementation Benefits

### 1. **Reliability**
- Proper ServiceNow record structure prevents "flow cannot be found" errors
- Correct sys_ids and relationships ensure flow execution works
- Comprehensive validation catches issues before deployment

### 2. **Reusability** 
- Utilities work for both direct creation and XML generation
- Convert between different flow formats automatically
- Support for flow updates and modifications

### 3. **Maintainability**
- Clear separation between structure building and API calls
- Comprehensive test suite ensures reliability
- Standardized interfaces for all flow operations

### 4. **Flexibility**
- Support for all ServiceNow flow types (flow, subflow, action)
- Handles various trigger types and action configurations
- Easy extension for new action types

## Testing

Run the comprehensive test suite:

```bash
npx ts-node test/flow-structure-builder.test.ts
```

The tests validate:
- ✅ Flow component generation
- ✅ Action type ID mapping
- ✅ Logic chain building  
- ✅ Flow validation
- ✅ Legacy format conversion

## Integration with Existing Systems

The utilities integrate seamlessly with:

1. **Flow Composer MCP** - Uses structure builder for deployment
2. **ServiceNow Client** - Enhanced createFlow method
3. **Queen Agent** - Automatic flow creation with proper structure
4. **Update Set Management** - XML generation for deployment tracking

## Next Steps

1. **Monitor deployment success** - Track flow creation success rates
2. **Extend action types** - Add more ServiceNow action type IDs as needed
3. **Performance optimization** - Batch record creation for large flows
4. **Advanced features** - Support for complex flow patterns and subflows

The Flow Structure Builder utilities ensure that all flows created through Snow-Flow have proper ServiceNow record structure, correct sys_ids, and functional logic chains - solving the critical issues identified in the original requirements.
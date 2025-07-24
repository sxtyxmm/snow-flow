#!/usr/bin/env node
/**
 * Test file for Flow Structure Builder utilities
 * Validates flow component generation and logic chain creation
 */

import { 
  generateFlowComponents, 
  createActionInstances, 
  buildLogicChain, 
  validateFlowComponents,
  convertToFlowDefinition,
  createTestFlowComponents,
  FlowDefinition,
  ACTION_TYPE_IDS
} from '../src/utils/flow-structure-builder';

/**
 * Test basic flow component generation
 */
function testBasicFlowGeneration() {
  console.log('🧪 Testing basic flow component generation...');
  
  const testFlow: FlowDefinition = {
    name: 'Test Approval Flow',
    description: 'A test flow for approval workflow',
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
        inputs: {
          approver: 'admin',
          message: 'Please approve this request'
        },
        outputs: {
          approval_result: 'string',
          approved_by: 'string'
        }
      },
      {
        id: 'notification_step',
        name: 'Send Notification',
        type: 'notification',
        inputs: {
          recipient: '${record.requested_for}',
          subject: 'Request Status Update',
          message: 'Your request has been processed'
        },
        outputs: {
          notification_sent: 'boolean'
        }
      }
    ],
    variables: [
      {
        id: 'request_id',
        name: 'Request ID',
        type: 'string',
        input: true,
        output: false,
        default_value: ''
      }
    ],
    connections: [],
    error_handling: []
  };
  
  const components = generateFlowComponents(testFlow);
  
  console.log('✅ Flow components generated:');
  console.log(`  • Flow record: ${components.flowRecord.sys_id}`);
  console.log(`  • Flow name: ${components.flowRecord.name}`);
  console.log(`  • Trigger: ${components.triggerInstance.sys_id}`);
  console.log(`  • Actions: ${components.actionInstances.length}`);
  console.log(`  • Logic chain: ${components.logicChain.length} entries`);
  console.log(`  • Variables: ${components.variables.length}`);
  
  return components;
}

/**
 * Test action type ID mapping
 */
function testActionTypeMapping() {
  console.log('\n🧪 Testing action type ID mapping...');
  
  const testTypes = [
    'notification',
    'approval', 
    'script',
    'condition',
    'create_record',
    'send_email',
    'unknown_type'
  ];
  
  console.log('Action type mappings:');
  testTypes.forEach(type => {
    const actionTypeId = ACTION_TYPE_IDS[type as keyof typeof ACTION_TYPE_IDS] || ACTION_TYPE_IDS.default;
    console.log(`  • ${type}: ${actionTypeId}`);
  });
}

/**
 * Test logic chain building
 */
function testLogicChainBuilding() {
  console.log('\n🧪 Testing logic chain building...');
  
  const activities = [
    { id: 'act1', name: 'Action 1', type: 'script' },
    { id: 'act2', name: 'Action 2', type: 'notification' },
    { id: 'act3', name: 'Action 3', type: 'approval' }
  ];
  
  const triggerInstance = {
    sys_id: 'trigger_123',
    flow: 'flow_456',
    name: 'test_trigger'
  };
  
  const actionInstances = createActionInstances(activities, 'flow_456');
  const logicChain = buildLogicChain(activities, triggerInstance, actionInstances);
  
  console.log('Logic chain structure:');
  logicChain.forEach((logic, index) => {
    const fromName = index === 0 ? 'Trigger' : `Action ${index}`;
    const toName = logic.to_element === '' ? 'END' : `Action ${index + 1}`;
    console.log(`  ${index + 1}. ${fromName} → ${toName}`);
  });
  
  return logicChain;
}

/**
 * Test flow validation
 */
function testFlowValidation() {
  console.log('\n🧪 Testing flow validation...');
  
  // Test valid flow
  const validComponents = createTestFlowComponents('Valid Test Flow');
  const validationResult = validateFlowComponents(validComponents);
  
  console.log('Validation result for valid flow:');
  console.log(`  • Valid: ${validationResult.isValid}`);
  console.log(`  • Errors: ${validationResult.errors.length}`);
  console.log(`  • Warnings: ${validationResult.warnings.length}`);
  
  if (validationResult.errors.length > 0) {
    console.log('  Errors:');
    validationResult.errors.forEach(error => console.log(`    - ${error}`));
  }
  
  if (validationResult.warnings.length > 0) {
    console.log('  Warnings:');
    validationResult.warnings.forEach(warning => console.log(`    - ${warning}`));
  }
  
  // Test invalid flow (missing required fields)
  const invalidComponents = {
    flowRecord: { name: '', sys_id: '' }, // Missing required fields
    triggerInstance: { sys_id: '', flow: '' },
    actionInstances: [],
    logicChain: [],
    variables: [],
    connections: []
  };
  
  const invalidValidationResult = validateFlowComponents(invalidComponents);
  console.log('\nValidation result for invalid flow:');
  console.log(`  • Valid: ${invalidValidationResult.isValid}`);
  console.log(`  • Errors: ${invalidValidationResult.errors.length}`);
  
  return validationResult;
}

/**
 * Test flow conversion utility
 */
function testFlowConversion() {
  console.log('\n🧪 Testing flow conversion utility...');
  
  // Test legacy flow format
  const legacyFlow = {
    name: 'Legacy Flow',
    description: 'A flow in legacy format',
    trigger_type: 'record_updated',
    table: 'incident',
    condition: 'priority=1',
    actions: [
      {
        name: 'Log Action',
        type: 'script',
        config: {
          script: 'gs.info("Legacy flow executed");'
        }
      }
    ],
    inputs: [
      {
        name: 'incident_id',
        type: 'string',
        description: 'Incident sys_id'
      }
    ]
  };
  
  const convertedFlow = convertToFlowDefinition(legacyFlow);
  
  console.log('Converted flow structure:');
  console.log(`  • Name: ${convertedFlow.name}`);
  console.log(`  • Trigger: ${convertedFlow.trigger.type} on ${convertedFlow.trigger.table}`);
  console.log(`  • Activities: ${convertedFlow.activities.length}`);
  console.log(`  • Variables: ${convertedFlow.variables.length}`);
  
  return convertedFlow;
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('🚀 Starting Flow Structure Builder Tests\n');
  
  try {
    // Test 1: Basic flow generation
    const components = testBasicFlowGeneration();
    
    // Test 2: Action type mapping
    testActionTypeMapping();
    
    // Test 3: Logic chain building
    const logicChain = testLogicChainBuilding();
    
    // Test 4: Flow validation
    const validation = testFlowValidation();
    
    // Test 5: Flow conversion
    const converted = testFlowConversion();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`  • Flow components generated: ${components.actionInstances.length} actions`);
    console.log(`  • Logic chain entries: ${logicChain.length}`);
    console.log(`  • Validation passed: ${validation.isValid}`);
    console.log(`  • Conversion successful: ${converted.activities.length} activities converted`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export {
  testBasicFlowGeneration,
  testActionTypeMapping,
  testLogicChainBuilding,
  testFlowValidation,
  testFlowConversion,
  runAllTests
};
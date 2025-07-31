/**
 * ServiceNow Flow Action v2 Implementation
 * 
 * This module demonstrates the correct way to encode action values
 * and generate proper flow XML for ServiceNow Flow Designer.
 */

const pako = require('pako');
const crypto = require('crypto');

/**
 * Encodes action parameters for sys_hub_action_instance_v2
 * 
 * @param {Array} parameters - Array of parameter objects
 * @param {string} parameters[].name - Parameter name
 * @param {string} parameters[].value - Parameter value
 * @param {string} parameters[].valueType - Type: 'static', 'fd_data', 'expression'
 * @returns {string} Base64-encoded gzipped parameter array
 */
function encodeActionValue(parameters) {
    // Ensure parameters is an array
    if (!Array.isArray(parameters)) {
        throw new Error('Parameters must be an array');
    }
    
    // Normalize parameter structure
    const normalizedParams = parameters.map(param => ({
        name: param.name,
        value: param.value,
        valueType: param.valueType || 'static'
    }));
    
    // Convert to JSON string
    const jsonString = JSON.stringify(normalizedParams);
    
    // Gzip compress
    const compressed = pako.gzip(jsonString);
    
    // Base64 encode
    const base64 = Buffer.from(compressed).toString('base64');
    
    return base64;
}

/**
 * Decodes action value for debugging/verification
 * 
 * @param {string} encodedValue - Base64-encoded gzipped value
 * @returns {Array} Decoded parameter array
 */
function decodeActionValue(encodedValue) {
    // Base64 decode
    const compressed = Buffer.from(encodedValue, 'base64');
    
    // Gunzip
    const jsonString = pako.ungzip(compressed, { to: 'string' });
    
    // Parse JSON
    return JSON.parse(jsonString);
}

/**
 * Generates a unique UI ID for flow components
 * 
 * @returns {number} Unique UI ID
 */
let uiIdCounter = 1;
function generateUniqueUiId() {
    return uiIdCounter++;
}

/**
 * Creates a sys_hub_action_instance_v2 record
 * 
 * @param {Object} config - Action configuration
 * @param {string} config.flowSysId - Parent flow sys_id
 * @param {string} config.actionType - Action type ID
 * @param {string} config.actionName - Display name
 * @param {Array} config.parameters - Action parameters
 * @param {number} config.x - X position in designer
 * @param {number} config.y - Y position in designer
 * @returns {Object} Action instance record
 */
function createActionInstance(config) {
    const actionSysId = crypto.randomUUID().replace(/-/g, '');
    const uiId = generateUniqueUiId();
    
    return {
        sys_id: actionSysId,
        table: 'sys_hub_action_instance_v2',
        parent: config.flowSysId,
        ui_id: uiId,
        group_ui_id: uiId,
        type: config.actionType,
        name: config.actionName,
        value: encodeActionValue(config.parameters),
        x: config.x || 100,
        y: config.y || 100,
        active: 'true',
        base_table: 'sys_hub_action_instance_v2'
    };
}

/**
 * Creates a sys_hub_flow_logic_instance_v2 record
 * 
 * @param {Object} config - Flow logic configuration
 * @param {string} config.flowSysId - Parent flow sys_id
 * @param {number} config.fromUiId - Source action UI ID
 * @param {number} config.toUiId - Target action UI ID
 * @param {string} config.condition - Optional condition
 * @returns {Object} Flow logic record
 */
function createFlowLogic(config) {
    const logicSysId = crypto.randomUUID().replace(/-/g, '');
    const uiId = generateUniqueUiId();
    
    return {
        sys_id: logicSysId,
        table: 'sys_hub_flow_logic_instance_v2',
        parent: config.flowSysId,
        parent_ui_id: config.fromUiId,
        ui_id: uiId,
        group_ui_id: config.toUiId,
        type: config.toUiId.toString(),
        condition: config.condition || '',
        active: 'true',
        ended: 'false',
        base_table: 'sys_hub_flow_logic_instance_v2'
    };
}

/**
 * Example: Create Record action with proper encoding
 */
function exampleCreateRecordAction(flowSysId) {
    return createActionInstance({
        flowSysId: flowSysId,
        actionType: '65', // Create Record action type
        actionName: 'Create Equipment Request',
        x: 200,
        y: 150,
        parameters: [
            {
                name: 'table',
                value: 'sc_request',
                valueType: 'static'
            },
            {
                name: 'field_values',
                value: JSON.stringify({
                    short_description: '{{fd_data.trigger.current.short_description}}',
                    requested_for: '{{fd_data.trigger.current.opened_by}}',
                    priority: '3'
                }),
                valueType: 'fd_data'
            }
        ]
    });
}

/**
 * Example: Complete flow with trigger, actions, and logic
 */
function generateCompleteFlow() {
    const flowSysId = crypto.randomUUID().replace(/-/g, '');
    
    // Reset UI ID counter for new flow
    uiIdCounter = 1;
    
    // Main flow record
    const flow = {
        sys_id: flowSysId,
        table: 'sys_hub_flow',
        name: 'Equipment Request Approval',
        description: 'Automated approval workflow for equipment requests',
        active: 'true',
        type: 'flow',
        category: 'Request Management'
    };
    
    // Trigger (Record Created)
    const triggerUiId = generateUniqueUiId();
    const trigger = {
        sys_id: crypto.randomUUID().replace(/-/g, ''),
        table: 'sys_hub_trigger_instance_v2',
        parent: flowSysId,
        ui_id: triggerUiId,
        type: '14', // Record Created/Updated
        name: 'Equipment Request Created',
        configuration: encodeActionValue([
            {
                name: 'table',
                value: 'sc_req_item',
                valueType: 'static'
            },
            {
                name: 'condition',
                value: 'category=hardware^active=true',
                valueType: 'static'
            }
        ])
    };
    
    // Action 1: Create Request
    const createAction = createActionInstance({
        flowSysId: flowSysId,
        actionType: '65',
        actionName: 'Create Approval Request',
        x: 300,
        y: 150,
        parameters: [
            {
                name: 'table',
                value: 'sc_request',
                valueType: 'static'
            },
            {
                name: 'requested_for',
                value: '{{fd_data.trigger.current.requested_for}}',
                valueType: 'fd_data'
            }
        ]
    });
    
    // Action 2: Send Notification
    const notifyAction = createActionInstance({
        flowSysId: flowSysId,
        actionType: '89', // Send Email
        actionName: 'Notify Approver',
        x: 500,
        y: 150,
        parameters: [
            {
                name: 'to',
                value: '{{fd_data.trigger.current.requested_for.manager}}',
                valueType: 'fd_data'
            },
            {
                name: 'subject',
                value: 'Equipment Request Approval Needed',
                valueType: 'static'
            },
            {
                name: 'body',
                value: 'Please review the equipment request from {{fd_data.trigger.current.requested_for.name}}',
                valueType: 'fd_data'
            }
        ]
    });
    
    // Flow Logic: Trigger → Create Action
    const logic1 = createFlowLogic({
        flowSysId: flowSysId,
        fromUiId: triggerUiId,
        toUiId: createAction.ui_id
    });
    
    // Flow Logic: Create Action → Notify Action
    const logic2 = createFlowLogic({
        flowSysId: flowSysId,
        fromUiId: createAction.ui_id,
        toUiId: notifyAction.ui_id
    });
    
    return {
        flow,
        trigger,
        actions: [createAction, notifyAction],
        logic: [logic1, logic2]
    };
}

/**
 * Generates complete XML for import
 */
function generateFlowXML() {
    const flowData = generateCompleteFlow();
    const xml2js = require('xml2js');
    const builder = new xml2js.Builder();
    
    const xmlData = {
        unload: {
            $: {
                unload_date: new Date().toISOString()
            },
            sys_hub_flow: flowData.flow,
            sys_hub_trigger_instance_v2: flowData.trigger,
            sys_hub_action_instance_v2: flowData.actions,
            sys_hub_flow_logic_instance_v2: flowData.logic
        }
    };
    
    return builder.buildObject(xmlData);
}

// Export functions for use in other modules
module.exports = {
    encodeActionValue,
    decodeActionValue,
    createActionInstance,
    createFlowLogic,
    generateCompleteFlow,
    generateFlowXML
};

// Example usage
if (require.main === module) {
    console.log('ServiceNow Flow Action v2 Implementation Example\n');
    
    // Example 1: Encode parameters
    const params = [
        { name: 'table', value: 'incident', valueType: 'static' },
        { name: 'priority', value: '{{fd_data.trigger.current.urgency}}', valueType: 'fd_data' }
    ];
    
    const encoded = encodeActionValue(params);
    console.log('Encoded parameters:', encoded);
    
    // Example 2: Decode to verify
    const decoded = decodeActionValue(encoded);
    console.log('\nDecoded parameters:', JSON.stringify(decoded, null, 2));
    
    // Example 3: Generate complete flow
    const flow = generateCompleteFlow();
    console.log('\nGenerated flow structure:');
    console.log('- Flow:', flow.flow.name);
    console.log('- Trigger:', flow.trigger.name);
    console.log('- Actions:', flow.actions.map(a => a.name).join(', '));
    console.log('- Logic connections:', flow.logic.length);
    
    // Example 4: Generate XML
    console.log('\nGenerating XML...');
    const xml = generateFlowXML();
    console.log('XML length:', xml.length, 'characters');
    console.log('\nFirst 500 characters:');
    console.log(xml.substring(0, 500) + '...');
}
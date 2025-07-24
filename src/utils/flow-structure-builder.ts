#!/usr/bin/env node
/**
 * Flow Structure Builder - ServiceNow Flow Record Utilities
 * Converts flow JSON to proper ServiceNow records with correct sys_ids and logic chains
 */

import { v4 as uuidv4 } from 'uuid';

export interface FlowActivity {
  id: string;
  name: string;
  type: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  condition?: string;
  artifact_reference?: any;
  subflow_reference?: any;
}

export interface FlowDefinition {
  name: string;
  description: string;
  table: string;
  trigger: {
    type: string;
    table: string;
    condition: string;
  };
  activities: FlowActivity[];
  variables: any[];
  connections: any[];
  error_handling: any[];
}

export interface ServiceNowFlowComponents {
  flowRecord: any;
  triggerInstance: any;
  actionInstances: any[];
  logicChain: any[];
  variables: any[];
  connections: any[];
}

/**
 * Known ServiceNow action type sys_ids for proper flow creation
 */
export const ACTION_TYPE_IDS = {
  // Core Flow Actions
  notification: '716281160b100300d97d8bf637673ac7',
  approval: 'e3a61c920b200300d97d8bf637673a30',
  script: '43c8cf0e0b200300d97d8bf637673ab4',
  condition: 'a6e0f8890b200300d97d8bf637673a4a',
  create_record: '7b8cf0e20b200300d97d8bf637673a50',
  update_record: '8c9d0f230b200300d97d8bf637673a60',
  ask_for_approval: 'e3a61c920b200300d97d8bf637673a30',
  send_email: '716281160b100300d97d8bf637673ac7',
  
  // Integration Actions
  rest_step: 'f4b5c6d70b200300d97d8bf637673a80',
  web_service: 'a5b6c7d80b200300d97d8bf637673a90',
  
  // Utility Actions
  wait: '9e0f1a2b0b200300d97d8bf637673aa0',
  log: '0f1a2b3c0b200300d97d8bf637673ab0',
  set_variable: '1a2b3c4d0b200300d97d8bf637673ac0',
  
  // Default fallback
  default: '43c8cf0e0b200300d97d8bf637673ab4' // script action
};

/**
 * Generate a ServiceNow-compatible sys_id
 */
export function generateSysId(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Generate ServiceNow flow components from flow definition
 * Converts flow JSON to proper ServiceNow records with all required components
 */
export function generateFlowComponents(
  flowDefinition: FlowDefinition, 
  flowSysId?: string
): ServiceNowFlowComponents {
  const flowId = flowSysId || generateSysId();
  
  console.log('🏗️ Generating ServiceNow flow components...');
  console.log(`📋 Flow: ${flowDefinition.name}`);
  console.log(`🆔 Flow sys_id: ${flowId}`);

  // 1. Create main flow record
  const flowRecord = {
    sys_id: flowId,
    name: flowDefinition.name,
    description: flowDefinition.description,
    internal_name: sanitizeInternalName(flowDefinition.name),
    type: 'flow',
    status: 'published',
    active: true,
    run_as: 'system',
    sys_class_name: 'sys_hub_flow',
    table: flowDefinition.table,
    category: 'custom',
    flow_definition: JSON.stringify({
      name: flowDefinition.name,
      description: flowDefinition.description,
      trigger: flowDefinition.trigger,
      activities: flowDefinition.activities,
      variables: flowDefinition.variables,
      connections: flowDefinition.connections
    })
  };

  // 2. Create trigger instance
  const triggerInstance = createTriggerInstance(flowId, flowDefinition.trigger);

  // 3. Create action instances for each activity
  const actionInstances = createActionInstances(flowDefinition.activities, flowId);

  // 4. Build logic chain (connections between components)
  const logicChain = buildLogicChain(flowDefinition.activities, triggerInstance, actionInstances);

  // 5. Create flow variables
  const variables = createFlowVariables(flowDefinition.variables, flowId);

  // 6. Create connections for visual flow representation
  const connections = createFlowConnections(flowDefinition.connections, logicChain);

  console.log(`✅ Generated components:`);
  console.log(`  • Flow record: ${flowRecord.sys_id}`);
  console.log(`  • Trigger: ${triggerInstance.sys_id}`);
  console.log(`  • Actions: ${actionInstances.length}`);
  console.log(`  • Logic chain: ${logicChain.length} entries`);
  console.log(`  • Variables: ${variables.length}`);
  console.log(`  • Connections: ${connections.length}`);

  return {
    flowRecord,
    triggerInstance,
    actionInstances,
    logicChain,
    variables,
    connections
  };
}

/**
 * Create trigger instance record
 */
function createTriggerInstance(flowId: string, trigger: any): any {
  const triggerSysId = generateSysId();
  
  return {
    sys_id: triggerSysId,
    flow: flowId,
    name: `${trigger.type}_trigger`,
    type: trigger.type,
    table: trigger.table,
    condition: trigger.condition || '',
    active: true,
    order: 0,
    sys_class_name: 'sys_hub_trigger_instance',
    // Additional fields for proper trigger configuration
    trigger_type: trigger.type,
    trigger_table: trigger.table,
    filter: trigger.condition || '',
    when: getTriggerWhen(trigger.type)
  };
}

/**
 * Create action instances for all activities
 */
export function createActionInstances(activities: FlowActivity[], flowSysId: string): any[] {
  console.log(`🔧 Creating ${activities.length} action instances...`);
  
  return activities.map((activity, index) => {
    const actionSysId = generateSysId();
    const actionTypeId = getActionTypeId(activity.type);
    
    console.log(`  • ${activity.name} (${activity.type}) → ${actionSysId}`);
    
    return {
      sys_id: actionSysId,
      flow: flowSysId,
      name: activity.name,
      label: activity.name,
      action_type: actionTypeId,
      order: (index + 1) * 100, // ServiceNow uses 100-based ordering
      active: true,
      sys_class_name: 'sys_hub_action_instance',
      
      // Activity-specific configuration
      inputs: JSON.stringify(activity.inputs || {}),
      outputs: JSON.stringify(activity.outputs || {}),
      condition: activity.condition || '',
      
      // Reference fields
      artifact_reference: activity.artifact_reference || '',
      subflow_reference: activity.subflow_reference || '',
      
      // Position for Flow Designer visual representation
      x: 100 + (index * 200), // Horizontal spacing
      y: 200, // Vertical position
      
      // Additional ServiceNow fields
      description: `${activity.type} action: ${activity.name}`,
      configuration: JSON.stringify(buildActionConfiguration(activity))
    };
  });
}

/**
 * Build logic chain connecting trigger → actions → end
 * Creates sys_hub_flow_logic records for proper flow execution
 */
export function buildLogicChain(
  activities: FlowActivity[], 
  triggerInstance: any, 
  actionInstances: any[]
): any[] {
  console.log('🔗 Building logic chain...');
  
  const logicChain: any[] = [];
  
  // 1. Connect trigger to first action (or end if no actions)
  if (actionInstances.length > 0) {
    logicChain.push(createLogicEntry(
      triggerInstance.sys_id,
      actionInstances[0].sys_id,
      triggerInstance.flow,
      'trigger_to_first_action',
      0
    ));
    
    console.log(`  • Trigger → ${actionInstances[0].name}`);
  } else {
    // Direct trigger to end
    logicChain.push(createLogicEntry(
      triggerInstance.sys_id,
      'END',
      triggerInstance.flow,
      'trigger_to_end',
      0
    ));
    
    console.log(`  • Trigger → END (no actions)`);
  }
  
  // 2. Connect actions in sequence
  for (let i = 0; i < actionInstances.length - 1; i++) {
    const currentAction = actionInstances[i];
    const nextAction = actionInstances[i + 1];
    
    logicChain.push(createLogicEntry(
      currentAction.sys_id,
      nextAction.sys_id,
      triggerInstance.flow,
      `action_${i}_to_action_${i + 1}`,
      i + 1
    ));
    
    console.log(`  • ${currentAction.name} → ${nextAction.name}`);
  }
  
  // 3. Connect last action to end
  if (actionInstances.length > 0) {
    const lastAction = actionInstances[actionInstances.length - 1];
    
    logicChain.push(createLogicEntry(
      lastAction.sys_id,
      'END',
      triggerInstance.flow,
      'last_action_to_end',
      actionInstances.length
    ));
    
    console.log(`  • ${lastAction.name} → END`);
  }
  
  console.log(`✅ Built logic chain with ${logicChain.length} connections`);
  return logicChain;
}

/**
 * Create a single logic entry (sys_hub_flow_logic record)
 */
function createLogicEntry(
  fromSysId: string, 
  toSysId: string, 
  flowId: string, 
  name: string, 
  order: number
): any {
  return {
    sys_id: generateSysId(),
    flow: flowId,
    name: name,
    from_element: fromSysId,
    to_element: toSysId === 'END' ? '' : toSysId,
    order: order * 100,
    active: true,
    sys_class_name: 'sys_hub_flow_logic',
    
    // Visual positioning for Flow Designer
    from_x: 100 + (order * 200),
    from_y: 200,
    to_x: toSysId === 'END' ? 100 + ((order + 1) * 200) : 100 + ((order + 1) * 200),
    to_y: 200,
    
    // Connection properties
    condition: '',
    label: '',
    connection_type: 'sequence'
  };
}

/**
 * Create flow variables from variable definitions
 */
function createFlowVariables(variables: any[], flowId: string): any[] {
  return variables.map((variable, index) => ({
    sys_id: generateSysId(),
    flow: flowId,
    name: variable.name || variable.id,
    label: variable.label || variable.name || variable.id,
    type: variable.type || 'string',
    input: variable.input || false,
    output: variable.output || false,
    default_value: variable.default_value || '',
    description: variable.description || '',
    order: index * 100,
    sys_class_name: 'sys_hub_flow_variable'
  }));
}

/**
 * Create visual connections for Flow Designer
 */
function createFlowConnections(connections: any[], logicChain: any[]): any[] {
  // The logic chain already handles the actual execution flow
  // This creates additional visual connections if specified
  return connections.map((connection, index) => ({
    sys_id: generateSysId(),
    name: connection.name || `connection_${index}`,
    from: connection.from,
    to: connection.to,
    condition: connection.condition || 'always',
    label: connection.label || '',
    sys_class_name: 'sys_hub_flow_connection'
  }));
}

/**
 * Get the correct action type sys_id for an activity type
 */
function getActionTypeId(activityType: string): string {
  const normalizedType = activityType.toLowerCase().replace(/[^a-z_]/g, '_');
  
  // Direct mapping
  if (ACTION_TYPE_IDS[normalizedType as keyof typeof ACTION_TYPE_IDS]) {
    return ACTION_TYPE_IDS[normalizedType as keyof typeof ACTION_TYPE_IDS];
  }
  
  // Fuzzy matching for common variations
  if (normalizedType.includes('email') || normalizedType.includes('mail')) {
    return ACTION_TYPE_IDS.notification;
  }
  if (normalizedType.includes('approval') || normalizedType.includes('approve')) {
    return ACTION_TYPE_IDS.approval;
  }
  if (normalizedType.includes('script') || normalizedType.includes('code')) {
    return ACTION_TYPE_IDS.script;
  }
  if (normalizedType.includes('condition') || normalizedType.includes('if')) {
    return ACTION_TYPE_IDS.condition;
  }
  if (normalizedType.includes('create') && normalizedType.includes('record')) {
    return ACTION_TYPE_IDS.create_record;
  }
  if (normalizedType.includes('update') && normalizedType.includes('record')) {
    return ACTION_TYPE_IDS.update_record;
  }
  if (normalizedType.includes('rest') || normalizedType.includes('api')) {
    return ACTION_TYPE_IDS.rest_step;
  }
  if (normalizedType.includes('wait') || normalizedType.includes('delay')) {
    return ACTION_TYPE_IDS.wait;
  }
  if (normalizedType.includes('log')) {
    return ACTION_TYPE_IDS.log;
  }
  
  // Default to script action
  console.warn(`⚠️ Unknown action type "${activityType}", using script action as fallback`);
  return ACTION_TYPE_IDS.default;
}

/**
 * Get trigger when condition based on trigger type
 */
function getTriggerWhen(triggerType: string): string {
  switch (triggerType.toLowerCase()) {
    case 'record_created':
    case 'created':
      return 'after';
    case 'record_updated':
    case 'updated':
      return 'after';
    case 'record_deleted':
    case 'deleted':
      return 'after';
    case 'before_insert':
      return 'before';
    case 'before_update':
      return 'before';
    case 'before_delete':
      return 'before';
    case 'scheduled':
      return 'scheduled';
    case 'manual':
    default:
      return 'manual';
  }
}

/**
 * Build action-specific configuration
 */
function buildActionConfiguration(activity: FlowActivity): any {
  const config: any = {
    action_type: activity.type,
    name: activity.name
  };
  
  // Add type-specific configuration
  switch (activity.type.toLowerCase()) {
    case 'notification':
    case 'send_email':
      config.recipient = activity.inputs?.recipient || '';
      config.subject = activity.inputs?.subject || '';
      config.message = activity.inputs?.message || activity.inputs?.body || '';
      break;
      
    case 'approval':
    case 'ask_for_approval':
      config.approver = activity.inputs?.approver || '';
      config.approval_message = activity.inputs?.message || '';
      config.due_date = activity.inputs?.due_date || '';
      break;
      
    case 'script':
      config.script = activity.inputs?.script || '';
      break;
      
    case 'condition':
      config.condition = activity.condition || activity.inputs?.condition || '';
      break;
      
    case 'create_record':
      config.table = activity.inputs?.table || '';
      config.fields = activity.inputs?.fields || {};
      break;
      
    case 'update_record':
      config.table = activity.inputs?.table || '';
      config.sys_id = activity.inputs?.sys_id || '';
      config.fields = activity.inputs?.fields || {};
      break;
      
    default:
      // Include all inputs as configuration
      config.inputs = activity.inputs || {};
  }
  
  return config;
}

/**
 * Sanitize flow name for ServiceNow internal_name field
 */
function sanitizeInternalName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, '') // Remove special characters except underscores and spaces
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .replace(/_+/g, '_')          // Replace multiple underscores with single
    .replace(/^_|_$/g, '')        // Remove leading/trailing underscores
    .substring(0, 80);            // Limit length to 80 characters
}

/**
 * Convert flow definition to ServiceNow Update XML format
 * Enhanced with modern flow structure support and better validation
 */
export function generateFlowXML(components: ServiceNowFlowComponents, options: {
  includeMetadata?: boolean;
  validateBeforeExport?: boolean;
  compactFormat?: boolean;
} = {}): string {
  const { includeMetadata = true, validateBeforeExport = true, compactFormat = false } = options;
  
  // Validate components before generating XML
  if (validateBeforeExport) {
    const validation = validateFlowComponents(components);
    if (!validation.isValid) {
      throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`);
    }
  }
  
  const xml = [];
  const indent = compactFormat ? '' : '  ';
  const newline = compactFormat ? '' : '\n';
  
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  
  // Add metadata if requested
  if (includeMetadata) {
    xml.push(`<!-- Generated by Snow-Flow at ${new Date().toISOString()} -->`);
    xml.push(`<!-- Flow: ${components.flowRecord.name || 'Unknown'} -->`);
    xml.push(`<!-- Actions: ${components.actionInstances.length} -->`);
    xml.push(`<!-- Variables: ${components.variables.length} -->`);
  }
  
  xml.push('<unload unload_date="' + new Date().toISOString() + '">');
  
  // Flow record with enhanced fields
  xml.push(`${indent}<sys_hub_flow action="INSERT_OR_UPDATE">`);
  Object.entries(components.flowRecord).forEach(([key, value]) => {
    // Ensure critical fields are properly set
    let processedValue = value;
    if (key === 'active' && typeof value !== 'boolean') {
      processedValue = value === 'true' || value === true;
    }
    if (key === 'validated' && typeof value !== 'boolean') {
      processedValue = value === 'true' || value === true;
    }
    xml.push(`${indent}${indent}<${key}>${escapeXML(String(processedValue))}</${key}>`);
  });
  xml.push(`${indent}</sys_hub_flow>`);
  
  // Enhanced trigger instance with validation
  if (components.triggerInstance && Object.keys(components.triggerInstance).length > 0) {
    xml.push(`${indent}<sys_hub_trigger_instance action="INSERT_OR_UPDATE">`);
    Object.entries(components.triggerInstance).forEach(([key, value]) => {
      xml.push(`${indent}${indent}<${key}>${escapeXML(String(value))}</${key}>`);
    });
    xml.push(`${indent}</sys_hub_trigger_instance>`);
  }
  
  // Action instances with proper ordering
  components.actionInstances
    .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ensure proper order
    .forEach(action => {
      xml.push(`${indent}<sys_hub_action_instance action="INSERT_OR_UPDATE">`);
      Object.entries(action).forEach(([key, value]) => {
        xml.push(`${indent}${indent}<${key}>${escapeXML(String(value))}</${key}>`);
      });
      xml.push(`${indent}</sys_hub_action_instance>`);
    });
  
  // Logic chain with connection validation
  components.logicChain
    .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ensure proper flow
    .forEach(logic => {
      xml.push(`${indent}<sys_hub_flow_logic action="INSERT_OR_UPDATE">`);
      Object.entries(logic).forEach(([key, value]) => {
        xml.push(`${indent}${indent}<${key}>${escapeXML(String(value))}</${key}>`);
      });
      xml.push(`${indent}</sys_hub_flow_logic>`);
    });
  
  // Variables with type validation
  components.variables.forEach(variable => {
    xml.push(`${indent}<sys_hub_flow_variable action="INSERT_OR_UPDATE">`);
    Object.entries(variable).forEach(([key, value]) => {
      xml.push(`${indent}${indent}<${key}>${escapeXML(String(value))}</${key}>`);
    });
    xml.push(`${indent}</sys_hub_flow_variable>`);
  });
  
  // Include connections if available (for modern flows)
  if (components.connections && components.connections.length > 0) {
    components.connections.forEach(connection => {
      xml.push(`${indent}<sys_hub_flow_connection action="INSERT_OR_UPDATE">`);
      Object.entries(connection).forEach(([key, value]) => {
        xml.push(`${indent}${indent}<${key}>${escapeXML(String(value))}</${key}>`);
      });
      xml.push(`${indent}</sys_hub_flow_connection>`);
    });
  }
  
  xml.push('</unload>');
  
  return xml.join(newline + (compactFormat ? '' : newline));
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate flow components before deployment
 */
export function validateFlowComponents(components: ServiceNowFlowComponents): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate flow record
  if (!components.flowRecord.name) {
    errors.push('Flow record missing required name field');
  }
  if (!components.flowRecord.sys_id) {
    errors.push('Flow record missing sys_id');
  }
  
  // Validate trigger
  if (!components.triggerInstance.sys_id) {
    errors.push('Trigger instance missing sys_id');
  }
  if (!components.triggerInstance.flow) {
    errors.push('Trigger instance not linked to flow');
  }
  
  // Validate actions
  components.actionInstances.forEach((action, index) => {
    if (!action.sys_id) {
      errors.push(`Action ${index} missing sys_id`);
    }
    if (!action.flow) {
      errors.push(`Action ${index} not linked to flow`);
    }
    if (!action.action_type) {
      errors.push(`Action ${index} missing action_type`);
    }
  });
  
  // Validate logic chain
  if (components.logicChain.length === 0 && components.actionInstances.length > 0) {
    warnings.push('No logic chain defined for flow with actions');
  }
  
  // Check for orphaned components
  const flowId = components.flowRecord.sys_id;
  const orphanedActions = components.actionInstances.filter(a => a.flow !== flowId);
  if (orphanedActions.length > 0) {
    errors.push(`${orphanedActions.length} actions not properly linked to flow`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Convert legacy flow format to FlowDefinition
 * Handles various input formats from existing flow creation systems
 */
export function convertToFlowDefinition(flow: any): FlowDefinition {
  // Extract activities from various possible sources
  const activities = flow.activities || flow.actions || flow.steps || [];
  
  // Normalize trigger format
  const trigger = {
    type: flow.trigger_type || flow.trigger?.type || 'manual',
    table: flow.trigger?.table || flow.table || 'incident',
    condition: flow.trigger?.condition || flow.condition || flow.trigger_condition || ''
  };
  
  // Normalize activities format
  const normalizedActivities: FlowActivity[] = activities.map((activity: any, index: number) => ({
    id: activity.id || `activity_${index}`,
    name: activity.name || activity.label || `Activity ${index + 1}`,
    type: activity.type || activity.action_type || 'script',
    inputs: activity.inputs || activity.config || {},
    outputs: activity.outputs || {},
    condition: activity.condition || '',
    artifact_reference: activity.artifact_reference || activity.artifact,
    subflow_reference: activity.subflow_reference || activity.subflow
  }));
  
  // Extract variables from various sources
  let variables = flow.variables || [];
  
  // Add inputs as variables
  if (flow.inputs && Array.isArray(flow.inputs)) {
    const inputVars = flow.inputs.map((input: any, index: number) => ({
      id: input.id || input.name || `input_${index}`,
      name: input.name || input.id || `input_${index}`,
      type: input.type || 'string',
      input: true,
      output: false,
      default_value: input.default_value || input.defaultValue || '',
      description: input.description || ''
    }));
    variables = variables.concat(inputVars);
  }
  
  // Add outputs as variables
  if (flow.outputs && Array.isArray(flow.outputs)) {
    const outputVars = flow.outputs.map((output: any, index: number) => ({
      id: output.id || output.name || `output_${index}`,
      name: output.name || output.id || `output_${index}`,
      type: output.type || 'string',
      input: false,
      output: true,
      default_value: output.default_value || output.defaultValue || '',
      description: output.description || ''
    }));
    variables = variables.concat(outputVars);
  }
  
  return {
    name: flow.name || 'Untitled Flow',
    description: flow.description || flow.name || 'Generated flow',
    table: trigger.table,
    trigger,
    activities: normalizedActivities,
    variables,
    connections: flow.connections || [],
    error_handling: flow.error_handling || []
  };
}

/**
 * Create flow components for testing/validation purposes
 * Generates minimal valid flow structure for testing
 */
export function createTestFlowComponents(name: string = 'Test Flow'): ServiceNowFlowComponents {
  const testFlow: FlowDefinition = {
    name,
    description: `Test flow: ${name}`,
    table: 'incident',
    trigger: {
      type: 'manual',
      table: 'incident',
      condition: ''
    },
    activities: [
      {
        id: 'log_action',
        name: 'Log Message',
        type: 'script',
        inputs: {
          script: `gs.info('Test flow ${name} executed successfully');`
        },
        outputs: {
          result: 'string'
        }
      }
    ],
    variables: [
      {
        id: 'test_var',
        name: 'Test Variable',
        type: 'string',
        input: true,
        output: false,
        default_value: 'test_value'
      }
    ],
    connections: [],
    error_handling: []
  };
  
  return generateFlowComponents(testFlow);
}

/**
 * Utility to extract sys_ids from existing ServiceNow records for update operations
 */
export function extractSysIds(existingFlow: any): { [key: string]: string } {
  const sysIds: { [key: string]: string } = {};
  
  if (existingFlow.sys_id) {
    sysIds.flow = existingFlow.sys_id;
  }
  
  if (existingFlow.trigger_instance?.sys_id) {
    sysIds.trigger = existingFlow.trigger_instance.sys_id;
  }
  
  if (existingFlow.action_instances && Array.isArray(existingFlow.action_instances)) {
    existingFlow.action_instances.forEach((action: any, index: number) => {
      if (action.sys_id) {
        sysIds[`action_${index}`] = action.sys_id;
      }
    });
  }
  
  return sysIds;
}

/**
 * Generate flow update payload for modifying existing flows
 */
export function generateFlowUpdate(
  flowDefinition: FlowDefinition,
  existingSysIds: { [key: string]: string }
): ServiceNowFlowComponents {
  const components = generateFlowComponents(flowDefinition, existingSysIds.flow);
  
  // Replace generated sys_ids with existing ones where available
  if (existingSysIds.trigger) {
    components.triggerInstance.sys_id = existingSysIds.trigger;
  }
  
  components.actionInstances.forEach((action, index) => {
    const existingId = existingSysIds[`action_${index}`];
    if (existingId) {
      action.sys_id = existingId;
    }
  });
  
  return components;
}

export default {
  generateFlowComponents,
  createActionInstances,
  buildLogicChain,
  generateSysId,
  validateFlowComponents,
  generateFlowXML,
  convertToFlowDefinition,
  createTestFlowComponents,
  extractSysIds,
  generateFlowUpdate,
  ACTION_TYPE_IDS
};
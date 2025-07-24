#!/usr/bin/env node
/**
 * Flow Examples - Demonstrates proper flow structure creation
 * Shows how to use the flow structure builder for various common flow patterns
 */

import { 
  generateFlowComponents, 
  convertToFlowDefinition, 
  FlowDefinition, 
  ACTION_TYPE_IDS 
} from './flow-structure-builder';

/**
 * Example 1: Incident Notification Flow
 * Triggers when high-priority incidents are created
 */
export function createIncidentNotificationFlow(): any {
  const flowDef: FlowDefinition = {
    name: 'High Priority Incident Notification',
    description: 'Automatically notify management when high-priority incidents are created',
    table: 'incident',
    trigger: {
      type: 'record_created',
      table: 'incident',
      condition: 'priority<=2' // High or Critical priority
    },
    activities: [
      {
        id: 'check_priority',
        name: 'Verify Priority Level',
        type: 'condition',
        inputs: {
          condition: '${record.priority} <= 2',
          field_to_check: 'priority',
          operator: 'less_than_or_equal',
          value: '2'
        },
        outputs: {
          condition_result: 'boolean'
        }
      },
      {
        id: 'send_management_alert',
        name: 'Send Management Alert',
        type: 'notification',
        condition: '${check_priority.condition_result} == true',
        inputs: {
          recipient: 'it-management@company.com',
          subject: 'URGENT: High Priority Incident Created',
          message: `High priority incident has been created:
          
Incident: \${record.number}
Priority: \${record.priority}
Description: \${record.short_description}
Assigned to: \${record.assigned_to}

Please review immediately.`
        },
        outputs: {
          notification_sent: 'boolean',
          notification_id: 'string'
        }
      },
      {
        id: 'log_notification',
        name: 'Log Notification Action',
        type: 'script',
        inputs: {
          script: `
gs.info('High priority incident notification sent for ' + current.number, 'IncidentFlow');
current.work_notes = 'Management notification sent at ' + new GlideDateTime();
current.u_management_notified = true;
current.update();
          `.trim()
        },
        outputs: {
          log_result: 'string'
        }
      }
    ],
    variables: [
      {
        id: 'incident_priority',
        name: 'Incident Priority',
        type: 'integer',
        input: true,
        output: false,
        default_value: '3'
      },
      {
        id: 'notification_status',
        name: 'Notification Status',
        type: 'string',
        input: false,
        output: true,
        default_value: 'pending'
      }
    ],
    connections: [],
    error_handling: []
  };

  return generateFlowComponents(flowDef);
}

/**
 * Example 2: Request Approval Flow
 * Handles service catalog request approvals with multiple approvers
 */
export function createRequestApprovalFlow(): any {
  const flowDef: FlowDefinition = {
    name: 'Service Request Approval Process',
    description: 'Multi-stage approval process for service catalog requests',
    table: 'sc_request',
    trigger: {
      type: 'record_created',
      table: 'sc_request',
      condition: 'approval=requested'
    },
    activities: [
      {
        id: 'validate_request',
        name: 'Validate Request Details',
        type: 'script',
        inputs: {
          script: `
var validation = {
  valid: true,
  errors: [],
  warnings: []
};

// Check required fields
if (!current.requested_for) {
  validation.errors.push('Requested for field is required');
  validation.valid = false;
}

if (!current.short_description) {
  validation.errors.push('Short description is required');
  validation.valid = false;
}

// Check business rules
if (current.u_cost && parseFloat(current.u_cost) > 10000) {
  validation.warnings.push('High cost request requires additional approval');
}

gs.info('Request validation completed: ' + JSON.stringify(validation), 'ApprovalFlow');
return validation;
          `.trim()
        },
        outputs: {
          validation_result: 'object',
          is_valid: 'boolean'
        }
      },
      {
        id: 'manager_approval',
        name: 'Manager Approval',
        type: 'approval',
        condition: '${validate_request.is_valid} == true',
        inputs: {
          approver: '${record.requested_for.manager}',
          message: 'Please review and approve this service request:\n\nRequest: ${record.number}\nDescription: ${record.short_description}\nRequested by: ${record.requested_for}\nEstimated cost: ${record.u_cost}',
          due_date: '+3 days',
          approval_type: 'manager'
        },
        outputs: {
          approval_result: 'string',
          approved_by: 'string',
          approval_comments: 'string'
        }
      },
      {
        id: 'finance_approval',
        name: 'Finance Approval (High Cost)',
        type: 'approval',
        condition: '${manager_approval.approval_result} == "approved" && ${record.u_cost} > 5000',
        inputs: {
          approver: 'finance.team',
          message: 'High-cost request requires finance approval:\n\nRequest: ${record.number}\nDescription: ${record.short_description}\nCost: ${record.u_cost}\nManager approved by: ${manager_approval.approved_by}',
          due_date: '+2 days',
          approval_type: 'finance'
        },
        outputs: {
          finance_approval_result: 'string',
          finance_approved_by: 'string',
          finance_comments: 'string'
        }
      },
      {
        id: 'create_fulfillment_task',
        name: 'Create Fulfillment Task',
        type: 'create_record',
        condition: '${manager_approval.approval_result} == "approved"',
        inputs: {
          table: 'sc_task',
          fields: {
            request: '${record.sys_id}',
            short_description: 'Fulfill: ${record.short_description}',
            description: '${record.description}',
            assigned_to: 'fulfillment.team',
            state: '1', // Open
            priority: '${record.priority}',
            due_date: '+5 days'
          }
        },
        outputs: {
          task_sys_id: 'string',
          task_number: 'string'
        }
      },
      {
        id: 'notify_requester',
        name: 'Notify Requester of Status',
        type: 'notification',
        inputs: {
          recipient: '${record.requested_for}',
          subject: 'Service Request Update - ${record.number}',
          message: `Your service request has been processed:

Request Number: \${record.number}
Status: \${manager_approval.approval_result == "approved" ? "Approved and assigned for fulfillment" : "Pending approval"}
${manager_approval.approval_result == "approved" ? "Fulfillment Task: " + create_fulfillment_task.task_number : ""}

You will receive another notification when work begins.`
        },
        outputs: {
          notification_sent: 'boolean'
        }
      }
    ],
    variables: [
      {
        id: 'request_cost',
        name: 'Request Cost',
        type: 'decimal',
        input: true,
        output: false,
        default_value: '0.00'
      },
      {
        id: 'approval_chain',
        name: 'Approval Chain Status',
        type: 'string',
        input: false,
        output: true,
        default_value: 'pending'
      },
      {
        id: 'fulfillment_task_id',
        name: 'Fulfillment Task ID',
        type: 'string',
        input: false,
        output: true,
        default_value: ''
      }
    ],
    connections: [],
    error_handling: [
      {
        id: 'approval_timeout_handler',
        name: 'Handle Approval Timeout',
        trigger: 'on_timeout',
        action: 'escalate',
        parameters: {
          escalation_target: 'department.manager',
          timeout_message: 'Approval request has timed out and requires attention'
        }
      }
    ]
  };

  return generateFlowComponents(flowDef);
}

/**
 * Example 3: Equipment Provisioning Flow  
 * Complex flow with multiple integrations and conditional logic
 */
export function createEquipmentProvisioningFlow(): any {
  const flowDef: FlowDefinition = {
    name: 'IT Equipment Provisioning',
    description: 'Automated provisioning of IT equipment including ordering, configuration, and delivery',
    table: 'sc_request',
    trigger: {
      type: 'record_updated',
      table: 'sc_request',
      condition: 'cat_item.name=iPhone 15 Pro^approval=approved'
    },
    activities: [
      {
        id: 'extract_requirements',
        name: 'Extract Equipment Requirements',
        type: 'script',
        inputs: {
          script: `
// Extract equipment details from catalog item variables
var requirements = {
  device_type: '',
  model: '',
  color: '',
  storage: '',
  carrier: '',
  accessories: [],
  delivery_location: '',
  user_profile: {}
};

// Get catalog item variables
var variables = current.variables;
if (variables) {
  var varsObj = JSON.parse(variables);
  requirements.device_type = varsObj.device_type || 'iPhone';
  requirements.model = varsObj.model || '15 Pro';
  requirements.color = varsObj.color || 'Natural Titanium';
  requirements.storage = varsObj.storage || '256GB';
  requirements.carrier = varsObj.carrier || 'Verizon';
  requirements.accessories = varsObj.accessories || [];
  requirements.delivery_location = varsObj.delivery_location || current.requested_for.location;
}

// Get user profile information
requirements.user_profile = {
  sys_id: current.requested_for.sys_id,
  name: current.requested_for.name,
  email: current.requested_for.email,
  department: current.requested_for.department,
  manager: current.requested_for.manager,
  location: current.requested_for.location
};

gs.info('Equipment requirements extracted: ' + JSON.stringify(requirements), 'ProvisioningFlow');
return requirements;
          `.trim()
        },
        outputs: {
          requirements: 'object',
          device_details: 'object',
          user_info: 'object'
        }
      },
      {
        id: 'check_inventory',
        name: 'Check Equipment Inventory',
        type: 'rest_step',
        inputs: {
          endpoint: 'https://inventory-api.company.com/check',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${sys_properties.inventory_api_token}'
          },
          body: {
            device_type: '${extract_requirements.device_details.device_type}',
            model: '${extract_requirements.device_details.model}',
            storage: '${extract_requirements.device_details.storage}',
            color: '${extract_requirements.device_details.color}'
          }
        },
        outputs: {
          in_stock: 'boolean',
          available_quantity: 'integer',
          estimated_delivery: 'string',
          supplier_info: 'object'
        }
      },
      {
        id: 'order_equipment',
        name: 'Order Equipment from Supplier',
        type: 'rest_step',
        condition: '${check_inventory.in_stock} == false',
        inputs: {
          endpoint: 'https://supplier-api.company.com/order',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${sys_properties.supplier_api_token}'
          },
          body: {
            item_details: '${extract_requirements.requirements}',
            delivery_address: '${extract_requirements.user_info.location}',
            priority: 'standard',
            purchase_order: '${record.number}',
            cost_center: '${extract_requirements.user_info.department.cost_center}'
          }
        },
        outputs: {
          order_id: 'string',
          order_status: 'string',
          tracking_number: 'string',
          estimated_delivery_date: 'string'
        }
      },
      {
        id: 'allocate_from_inventory',
        name: 'Allocate from Existing Inventory',
        type: 'rest_step',
        condition: '${check_inventory.in_stock} == true',
        inputs: {
          endpoint: 'https://inventory-api.company.com/allocate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${sys_properties.inventory_api_token}'
          },
          body: {
            item_details: '${extract_requirements.requirements}',
            allocated_to: '${extract_requirements.user_info.sys_id}',
            request_number: '${record.number}',
            allocation_type: 'permanent'
          }
        },
        outputs: {
          allocation_id: 'string',
          serial_number: 'string',
          asset_tag: 'string'
        }
      },
      {
        id: 'create_asset_record',
        name: 'Create Asset Record in CMDB',
        type: 'create_record',
        inputs: {
          table: 'alm_asset',
          fields: {
            display_name: '${extract_requirements.device_details.device_type} - ${extract_requirements.user_info.name}',
            model: '${extract_requirements.device_details.model}',
            serial_number: '${allocate_from_inventory.serial_number || "TBD"}',
            asset_tag: '${allocate_from_inventory.asset_tag || "TBD"}',
            assigned_to: '${extract_requirements.user_info.sys_id}',
            location: '${extract_requirements.user_info.location}',
            state: '2', // In use
            cost_center: '${extract_requirements.user_info.department.cost_center}',
            purchase_date: '${gs.nowDateTime()}',
            po_number: '${record.number}',
            ci_class: 'mobile_device'
          }
        },
        outputs: {
          asset_sys_id: 'string',
          asset_number: 'string'
        }
      },
      {
        id: 'setup_mobile_profile',
        name: 'Configure Mobile Device Profile',
        type: 'rest_step',
        inputs: {
          endpoint: 'https://mdm.company.com/api/profile/create',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${sys_properties.mdm_api_token}'
          },
          body: {
            user_id: '${extract_requirements.user_info.email}',
            device_type: '${extract_requirements.device_details.device_type}',
            department: '${extract_requirements.user_info.department}',
            security_profile: 'corporate_standard',
            apps: [
              'Microsoft Outlook',
              'Microsoft Teams',
              'Company Portal',
              'VPN Client'
            ],
            restrictions: {
              app_store: true,
              camera: false,
              location_services: true
            }
          }
        },
        outputs: {
          mdm_profile_id: 'string',
          enrollment_token: 'string',
          profile_status: 'string'
        }
      },
      {
        id: 'send_delivery_notification',
        name: 'Send Delivery Instructions',
        type: 'notification',
        inputs: {
          recipient: '${extract_requirements.user_info.email}',
          cc: '${extract_requirements.user_info.manager.email}',
          subject: 'iPhone Provisioning Update - ${record.number}',
          message: `Your iPhone request has been processed and is ready for delivery/pickup:

Device Details:
- Model: \${extract_requirements.device_details.model}
- Storage: \${extract_requirements.device_details.storage}  
- Color: \${extract_requirements.device_details.color}

${check_inventory.in_stock ? 
  "✅ Device allocated from inventory\\nSerial Number: " + allocate_from_inventory.serial_number + "\\nAsset Tag: " + allocate_from_inventory.asset_tag :
  "📦 Device ordered from supplier\\nOrder ID: " + order_equipment.order_id + "\\nEstimated Delivery: " + order_equipment.estimated_delivery_date}

Next Steps:
1. You will receive device setup instructions via email
2. Your manager has been notified of the allocation
3. Please report any issues to IT Support

Asset Record: \${create_asset_record.asset_number}
MDM Profile: \${setup_mobile_profile.mdm_profile_id}

IT Support Team`
        },
        outputs: {
          notification_sent: 'boolean',
          notification_id: 'string'
        }
      }
    ],
    variables: [
      {
        id: 'device_specifications',
        name: 'Device Specifications',
        type: 'object',
        input: true,
        output: false,
        default_value: '{}'
      },
      {
        id: 'provisioning_status',
        name: 'Provisioning Status',
        type: 'string',
        input: false,
        output: true,
        default_value: 'pending'
      },
      {
        id: 'asset_information',
        name: 'Asset Information',
        type: 'object',
        input: false,
        output: true,
        default_value: '{}'
      }
    ],
    connections: [],
    error_handling: [
      {
        id: 'inventory_api_error',
        name: 'Handle Inventory API Errors',
        trigger: 'on_api_error',
        action: 'retry_with_fallback',
        parameters: {
          max_retries: 3,
          fallback_action: 'manual_procurement',
          notification_recipient: 'it.procurement@company.com'
        }
      },
      {
        id: 'mdm_setup_failure',
        name: 'Handle MDM Setup Failures',
        trigger: 'on_error',
        action: 'create_manual_task',
        parameters: {
          task_assignment_group: 'mobile_device_management',
          task_description: 'Manual MDM profile setup required for ${extract_requirements.user_info.name}'
        }
      }
    ]
  };

  return generateFlowComponents(flowDef);
}

/**
 * Example 4: Converting Legacy Flow Format
 * Shows how to convert existing flow definitions to the new structure
 */
export function convertLegacyFlowExample(): any {
  // Example of legacy flow format that might exist in the system
  const legacyFlow = {
    name: 'Legacy Password Reset Flow',
    description: 'Old format password reset workflow',
    trigger_type: 'manual',
    table: 'sys_user',
    condition: '',
    actions: [
      {
        name: 'Verify User Identity',
        type: 'script',
        config: {
          script: 'var verified = verifyUserIdentity(current); return verified;'
        }
      },
      {
        name: 'Reset Password', 
        type: 'script',
        config: {
          script: 'if (verified) { resetUserPassword(current); }'
        }
      },
      {
        name: 'Send Confirmation Email',
        type: 'email',
        config: {
          to: '${current.email}',
          subject: 'Password Reset Confirmation',
          body: 'Your password has been reset successfully.'
        }
      }
    ],
    inputs: [
      {
        name: 'user_id',
        type: 'string',
        description: 'User sys_id for password reset'
      }
    ],
    outputs: [
      {
        name: 'reset_successful',
        type: 'boolean',
        description: 'Whether password reset was successful'
      }
    ]
  };

  // Convert to modern format
  const modernFlow = convertToFlowDefinition(legacyFlow);
  
  // Generate components
  return generateFlowComponents(modernFlow);
}

/**
 * Example 5: Testing Flow Structure
 * Demonstrates how to create test flows for validation
 */
export function createTestFlow(name: string = 'Integration Test Flow'): any {
  const testFlow: FlowDefinition = {
    name,
    description: `Test flow for validation: ${name}`,
    table: 'incident',
    trigger: {
      type: 'manual',
      table: 'incident',
      condition: ''
    },
    activities: [
      {
        id: 'test_log',
        name: 'Test Log Action',
        type: 'script',
        inputs: {
          script: `gs.info('Test flow "${name}" executed at ' + new GlideDateTime(), 'TestFlow');`
        },
        outputs: {
          execution_time: 'string'
        }
      }
    ],
    variables: [
      {
        id: 'test_parameter',
        name: 'Test Parameter',
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
 * Utility to demonstrate XML generation
 */
export function demonstrateXMLGeneration(): string {
  const components = createIncidentNotificationFlow();
  
  // This would generate the full Update Set XML
  // In a real scenario, you'd import this XML into ServiceNow
  return `
<!-- Example XML structure (truncated for brevity) -->
<?xml version="1.0" encoding="UTF-8"?>
<unload unload_date="${new Date().toISOString()}">
  <sys_hub_flow action="INSERT_OR_UPDATE">
    <sys_id>${components.flowRecord.sys_id}</sys_id>
    <name>${components.flowRecord.name}</name>
    <description>${components.flowRecord.description}</description>
    <active>true</active>
    <type>flow</type>
    <!-- ... more fields ... -->
  </sys_hub_flow>
  
  <sys_hub_trigger_instance action="INSERT_OR_UPDATE">
    <sys_id>${components.triggerInstance.sys_id}</sys_id>
    <flow>${components.flowRecord.sys_id}</flow>
    <type>${components.triggerInstance.type}</type>
    <!-- ... more fields ... -->
  </sys_hub_trigger_instance>
  
  ${components.actionInstances.map(action => `
  <sys_hub_action_instance action="INSERT_OR_UPDATE">
    <sys_id>${action.sys_id}</sys_id>
    <flow>${action.flow}</flow>
    <name>${action.name}</name>
    <action_type>${action.action_type}</action_type>
    <!-- ... more fields ... -->
  </sys_hub_action_instance>`).join('')}
  
  ${components.logicChain.map(logic => `
  <sys_hub_flow_logic action="INSERT_OR_UPDATE">
    <sys_id>${logic.sys_id}</sys_id>
    <flow>${logic.flow}</flow>
    <from_element>${logic.from_element}</from_element>
    <to_element>${logic.to_element}</to_element>
    <!-- ... more fields ... -->
  </sys_hub_flow_logic>`).join('')}
</unload>
  `.trim();
}

export default {
  createIncidentNotificationFlow,
  createRequestApprovalFlow,
  createEquipmentProvisioningFlow,
  convertLegacyFlowExample,
  createTestFlow,
  demonstrateXMLGeneration
};
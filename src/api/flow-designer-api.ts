/**
 * ServiceNow Flow Designer API Integration
 * Complete API integration architecture for flow creation and management
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { FlowAPIDiscovery, FlowActionType, FlowTriggerType } from '../utils/flow-api-discovery.js';
import { Logger } from '../utils/logger.js';

export interface FlowDefinition {
  name: string;
  internal_name: string;
  description: string;
  table: string;
  active: boolean;
  category: string;
  run_as: string;
  trigger: FlowTriggerDefinition;
  actions: FlowActionDefinition[];
  variables: FlowVariableDefinition[];
  connections: FlowConnectionDefinition[];
  error_handling: FlowErrorHandlingDefinition[];
}

export interface FlowTriggerDefinition {
  type: string;
  table: string;
  condition?: string;
  active: boolean;
  order: number;
  inputs: Record<string, any>;
}

export interface FlowActionDefinition {
  name: string;
  type: string;
  action_type_id: string;
  order: number;
  active: boolean;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  on_error: FlowErrorAction;
}

export interface FlowVariableDefinition {
  name: string;
  type: string;
  default_value?: any;
  description?: string;
  scope: 'flow' | 'action';
}

export interface FlowConnectionDefinition {
  from_step: string;
  to_step: string;
  condition?: string;
  label?: string;
}

export interface FlowErrorHandlingDefinition {
  step: string;
  error_type: string;
  action: FlowErrorAction;
  retry_count?: number;
  retry_delay?: number;
}

export interface FlowErrorAction {
  type: 'retry' | 'continue' | 'stop' | 'goto' | 'notify';
  target_step?: string;
  notification_recipients?: string[];
  custom_message?: string;
}

export interface FlowCreationResult {
  success: boolean;
  flow_id?: string;
  flow_url?: string;
  validation_errors?: string[];
  warnings?: string[];
  created_components: {
    flow: boolean;
    trigger: boolean;
    actions: number;
    variables: number;
    connections: number;
  };
}

export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class FlowDesignerAPI {
  private client: ServiceNowClient;
  private discovery: FlowAPIDiscovery;
  private logger: Logger;
  private rollbackStack: RollbackAction[] = [];

  constructor(client: ServiceNowClient) {
    this.client = client;
    this.discovery = new FlowAPIDiscovery(client);
    this.logger = new Logger('FlowDesignerAPI');
  }

  /**
   * Create a complete flow with all components
   */
  async createFlow(flowDefinition: FlowDefinition): Promise<FlowCreationResult> {
    this.logger.info('Creating flow with API integration', { name: flowDefinition.name });
    
    // Clear rollback stack
    this.rollbackStack = [];
    
    try {
      // 1. Validate flow definition
      const validation = await this.validateFlowDefinition(flowDefinition);
      if (!validation.valid) {
        return {
          success: false,
          validation_errors: validation.errors,
          warnings: validation.warnings,
          created_components: this.getEmptyComponents()
        };
      }

      // 2. Create main flow record
      const flowResult = await this.createMainFlow(flowDefinition);
      if (!flowResult.success) {
        return {
          success: false,
          validation_errors: [flowResult.error || 'Failed to create flow'],
          warnings: [],
          created_components: this.getEmptyComponents()
        };
      }

      const flowId = flowResult.data.sys_id;
      const createdComponents = this.getEmptyComponents();
      createdComponents.flow = true;

      // 3. Create trigger
      if (flowDefinition.trigger) {
        const triggerResult = await this.createFlowTrigger(flowId, flowDefinition.trigger);
        if (triggerResult.success) {
          createdComponents.trigger = true;
        } else {
          this.logger.warn('Failed to create trigger:', triggerResult.error);
        }
      }

      // 4. Create variables
      for (const variable of flowDefinition.variables) {
        const varResult = await this.createFlowVariable(flowId, variable);
        if (varResult.success) {
          createdComponents.variables++;
        }
      }

      // 5. Create actions
      for (const action of flowDefinition.actions) {
        const actionResult = await this.createFlowAction(flowId, action);
        if (actionResult.success) {
          createdComponents.actions++;
        }
      }

      // 6. Create connections
      for (const connection of flowDefinition.connections) {
        const connResult = await this.createFlowConnection(flowId, connection);
        if (connResult.success) {
          createdComponents.connections++;
        }
      }

      // 7. Create error handling
      for (const errorHandler of flowDefinition.error_handling) {
        await this.createFlowErrorHandling(flowId, errorHandler);
      }

      const credentials = this.client.credentialsInstance;
      const flowUrl = `https://${credentials?.instance}/flow-designer/flow/${flowId}`;

      return {
        success: true,
        flow_id: flowId,
        flow_url: flowUrl,
        warnings: validation.warnings,
        created_components: createdComponents
      };

    } catch (error) {
      this.logger.error('Flow creation failed:', error);
      
      // Attempt rollback
      await this.rollbackChanges();
      
      return {
        success: false,
        validation_errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        created_components: this.getEmptyComponents()
      };
    }
  }

  /**
   * Validate flow definition before creation
   */
  async validateFlowDefinition(flowDefinition: FlowDefinition): Promise<FlowValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!flowDefinition.name || !flowDefinition.name.trim()) {
      errors.push('Flow name is required');
    }

    if (!flowDefinition.table || !flowDefinition.table.trim()) {
      errors.push('Target table is required');
    }

    if (!flowDefinition.trigger) {
      errors.push('Flow trigger is required');
    }

    if (flowDefinition.actions.length === 0) {
      warnings.push('Flow has no actions defined');
    }

    // Validate trigger
    if (flowDefinition.trigger) {
      const triggerTypes = await this.discovery.discoverTriggerTypes(
        flowDefinition.table, 
        flowDefinition.trigger.type
      );
      
      if (triggerTypes.length === 0) {
        errors.push(`No trigger type found for '${flowDefinition.trigger.type}' on table '${flowDefinition.table}'`);
      } else if (triggerTypes.length > 1) {
        suggestions.push(`Multiple trigger types found for '${flowDefinition.trigger.type}'. Using: ${triggerTypes[0].name}`);
      }
    }

    // Validate actions
    for (const action of flowDefinition.actions) {
      if (!action.action_type_id) {
        const actionTypes = await this.discovery.discoverActionTypes(action.type);
        if (actionTypes.exact_matches.length === 0 && actionTypes.partial_matches.length === 0) {
          errors.push(`No action type found for '${action.type}'`);
        } else if (actionTypes.confidence_score < 0.5) {
          warnings.push(`Low confidence match for action '${action.type}'`);
        }
      } else {
        // Validate action inputs
        const validation = await this.discovery.validateActionInputs(action.action_type_id, action.inputs);
        if (!validation.valid) {
          errors.push(...validation.errors.map(e => `Action '${action.name}': ${e}`));
        }
        warnings.push(...validation.warnings.map(w => `Action '${action.name}': ${w}`));
      }
    }

    // Validate connections
    const actionIds = new Set(flowDefinition.actions.map(a => a.name));
    for (const connection of flowDefinition.connections) {
      if (!actionIds.has(connection.from_step) && connection.from_step !== 'trigger') {
        errors.push(`Connection from_step '${connection.from_step}' does not exist`);
      }
      if (!actionIds.has(connection.to_step) && connection.to_step !== 'end') {
        errors.push(`Connection to_step '${connection.to_step}' does not exist`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Create main flow record
   */
  private async createMainFlow(flowDefinition: FlowDefinition): Promise<any> {
    const flowData = {
      name: flowDefinition.name,
      internal_name: flowDefinition.internal_name,
      description: flowDefinition.description,
      active: flowDefinition.active,
      category: flowDefinition.category,
      run_as: flowDefinition.run_as,
      sys_class_name: 'sys_hub_flow',
      type: 'flow',
      status: 'published',
      access: 'public'
    };

    const result = await this.client.createRecord('sys_hub_flow', flowData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_flow',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Create flow trigger
   */
  private async createFlowTrigger(flowId: string, triggerDef: FlowTriggerDefinition): Promise<any> {
    // Discover trigger type
    const triggerTypes = await this.discovery.discoverTriggerTypes(triggerDef.table, triggerDef.type);
    if (triggerTypes.length === 0) {
      throw new Error(`No trigger type found for '${triggerDef.type}' on table '${triggerDef.table}'`);
    }

    const triggerType = triggerTypes[0];
    
    const triggerData = {
      flow: flowId,
      trigger_type: triggerType.sys_id,
      table_name: triggerDef.table,
      condition: triggerDef.condition || '',
      active: triggerDef.active,
      order: triggerDef.order,
      inputs: JSON.stringify(triggerDef.inputs)
    };

    const result = await this.client.createRecord('sys_hub_trigger_instance', triggerData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_trigger_instance',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Create flow action
   */
  private async createFlowAction(flowId: string, actionDef: FlowActionDefinition): Promise<any> {
    let actionTypeId = actionDef.action_type_id;
    
    // Discover action type if not provided
    if (!actionTypeId) {
      const actionTypes = await this.discovery.discoverActionTypes(actionDef.type);
      if (actionTypes.exact_matches.length > 0) {
        actionTypeId = actionTypes.exact_matches[0].sys_id;
      } else if (actionTypes.partial_matches.length > 0) {
        actionTypeId = actionTypes.partial_matches[0].sys_id;
      } else {
        throw new Error(`No action type found for '${actionDef.type}'`);
      }
    }

    const actionData = {
      flow: flowId,
      action_name: actionDef.name,
      action_type: actionTypeId,
      order: actionDef.order,
      active: actionDef.active,
      inputs: JSON.stringify(actionDef.inputs),
      outputs: JSON.stringify(actionDef.outputs),
      on_error: JSON.stringify(actionDef.on_error)
    };

    const result = await this.client.createRecord('sys_hub_action_instance', actionData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_action_instance',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Create flow variable
   */
  private async createFlowVariable(flowId: string, variableDef: FlowVariableDefinition): Promise<any> {
    const variableData = {
      flow: flowId,
      name: variableDef.name,
      type: variableDef.type,
      default_value: variableDef.default_value,
      description: variableDef.description,
      scope: variableDef.scope
    };

    const result = await this.client.createRecord('sys_hub_flow_variable', variableData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_flow_variable',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Create flow connection
   */
  private async createFlowConnection(flowId: string, connectionDef: FlowConnectionDefinition): Promise<any> {
    const connectionData = {
      flow: flowId,
      from_step: connectionDef.from_step,
      to_step: connectionDef.to_step,
      condition: connectionDef.condition,
      label: connectionDef.label
    };

    const result = await this.client.createRecord('sys_hub_flow_logic', connectionData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_flow_logic',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Create flow error handling
   */
  private async createFlowErrorHandling(flowId: string, errorDef: FlowErrorHandlingDefinition): Promise<any> {
    const errorData = {
      flow: flowId,
      step: errorDef.step,
      error_type: errorDef.error_type,
      action: JSON.stringify(errorDef.action),
      retry_count: errorDef.retry_count,
      retry_delay: errorDef.retry_delay
    };

    const result = await this.client.createRecord('sys_hub_flow_error_handling', errorData);
    
    if (result.success) {
      this.addToRollbackStack({
        type: 'delete_record',
        table: 'sys_hub_flow_error_handling',
        sys_id: result.data.sys_id
      });
    }
    
    return result;
  }

  /**
   * Test flow execution
   */
  async testFlow(flowId: string, testData: Record<string, any>): Promise<{
    success: boolean;
    execution_id?: string;
    results?: any;
    errors?: string[];
  }> {
    try {
      const testResult = await this.client.createRecord('sys_hub_flow_test', {
        flow: flowId,
        test_data: JSON.stringify(testData),
        execute: true
      });

      if (testResult.success) {
        return {
          success: true,
          execution_id: testResult.data.sys_id,
          results: testResult.data.results
        };
      } else {
        return {
          success: false,
          errors: [testResult.error || 'Test execution failed']
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Get flow execution history
   */
  async getFlowExecutionHistory(flowId: string, limit: number = 50): Promise<{
    success: boolean;
    executions?: any[];
    error?: string;
  }> {
    try {
      const result = await this.client.getRecords('sys_hub_flow_execution', {
        sysparm_query: `flow=${flowId}`,
        sysparm_orderby: 'sys_created_on^DESC',
        sysparm_limit: limit
      });

      return {
        success: result.success,
        executions: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update flow status
   */
  async updateFlowStatus(flowId: string, active: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await this.client.updateRecord('sys_hub_flow', flowId, {
        active: active
      });

      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Clone existing flow
   */
  async cloneFlow(sourceFlowId: string, newName: string): Promise<FlowCreationResult> {
    try {
      // Get source flow details
      const sourceFlow = await this.client.getRecord('sys_hub_flow', sourceFlowId);
      if (!sourceFlow) {
        throw new Error('Source flow not found');
      }

      // Create new flow definition based on source
      const flowDefinition: FlowDefinition = {
        name: newName,
        internal_name: this.sanitizeInternalName(newName),
        description: `Clone of ${sourceFlow.name}`,
        table: sourceFlow.table || 'task',
        active: false, // Start inactive
        category: sourceFlow.category || 'custom',
        run_as: sourceFlow.run_as || 'user_who_triggers',
        trigger: {
          type: 'record_created',
          table: sourceFlow.table || 'task',
          active: true,
          order: 0,
          inputs: {}
        },
        actions: [],
        variables: [],
        connections: [],
        error_handling: []
      };

      // Get source flow components
      const [triggers, actions, variables, connections] = await Promise.all([
        this.client.getRecords('sys_hub_trigger_instance', {
          sysparm_query: `flow=${sourceFlowId}`
        }),
        this.client.getRecords('sys_hub_action_instance', {
          sysparm_query: `flow=${sourceFlowId}`
        }),
        this.client.getRecords('sys_hub_flow_variable', {
          sysparm_query: `flow=${sourceFlowId}`
        }),
        this.client.getRecords('sys_hub_flow_logic', {
          sysparm_query: `flow=${sourceFlowId}`
        })
      ]);

      // Copy components to new flow definition
      if (triggers.success && triggers.data.length > 0) {
        const trigger = triggers.data[0];
        flowDefinition.trigger = {
          type: trigger.trigger_type,
          table: trigger.table_name,
          condition: trigger.condition,
          active: trigger.active,
          order: trigger.order,
          inputs: JSON.parse(trigger.inputs || '{}')
        };
      }

      if (actions.success && actions.data) {
        flowDefinition.actions = actions.data.map((action: any) => ({
          name: action.action_name,
          type: action.action_type,
          action_type_id: action.action_type,
          order: action.order,
          active: action.active,
          inputs: JSON.parse(action.inputs || '{}'),
          outputs: JSON.parse(action.outputs || '{}'),
          on_error: JSON.parse(action.on_error || '{"type": "stop"}')
        }));
      }

      if (variables.success && variables.data) {
        flowDefinition.variables = variables.data.map((variable: any) => ({
          name: variable.name,
          type: variable.type,
          default_value: variable.default_value,
          description: variable.description,
          scope: variable.scope
        }));
      }

      if (connections.success && connections.data) {
        flowDefinition.connections = connections.data.map((connection: any) => ({
          from_step: connection.from_step,
          to_step: connection.to_step,
          condition: connection.condition,
          label: connection.label
        }));
      }

      // Create the cloned flow
      return await this.createFlow(flowDefinition);

    } catch (error) {
      return {
        success: false,
        validation_errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        created_components: this.getEmptyComponents()
      };
    }
  }

  /**
   * Add action to rollback stack
   */
  private addToRollbackStack(action: RollbackAction): void {
    this.rollbackStack.push(action);
  }

  /**
   * Rollback all changes
   */
  private async rollbackChanges(): Promise<void> {
    this.logger.warn('Rolling back flow creation changes...');
    
    // Rollback in reverse order
    for (const action of this.rollbackStack.reverse()) {
      try {
        switch (action.type) {
          case 'delete_record':
            await this.client.deleteRecord(action.table, action.sys_id);
            break;
        }
      } catch (error) {
        this.logger.error('Rollback action failed:', error);
      }
    }
    
    this.rollbackStack = [];
  }

  /**
   * Get empty components structure
   */
  private getEmptyComponents() {
    return {
      flow: false,
      trigger: false,
      actions: 0,
      variables: 0,
      connections: 0
    };
  }

  /**
   * Sanitize internal name
   */
  private sanitizeInternalName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 80);
  }
}

interface RollbackAction {
  type: 'delete_record';
  table: string;
  sys_id: string;
}
/**
 * ServiceNow Flow Designer API Discovery Service
 * Provides dynamic discovery of action types, trigger types, and flow metadata
 */

import { ServiceNowClient } from './servicenow-client.js';
import { Logger } from './logger.js';
import { ActionType, TriggerType } from './action-type-cache.js';

export interface FlowActionType extends ActionType {
  description?: string;
  category: string;
  inputs: FlowActionInput[];
  outputs: FlowActionOutput[];
  script_template?: string;
  execution_mode?: string;
  supports_async?: boolean;
}

export interface FlowActionInput {
  sys_id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  default_value?: string;
  description?: string;
  validation?: string;
}

export interface FlowActionOutput {
  sys_id: string;
  name: string;
  label: string;
  type: string;
  description?: string;
  sample_value?: string;
}

export interface FlowTriggerType extends TriggerType {
  description?: string;
  supports_conditions: boolean;
  supported_tables: string[];
  inputs: FlowTriggerInput[];
  outputs: FlowTriggerOutput[];
}

export interface FlowTriggerInput {
  sys_id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface FlowTriggerOutput {
  sys_id: string;
  name: string;
  label: string;
  type: string;
  description?: string;
}

export interface ActionTypeSearchResult {
  exact_matches: FlowActionType[];
  partial_matches: FlowActionType[];
  semantic_matches: FlowActionType[];
  confidence_score: number;
}

export class FlowAPIDiscovery {
  private logger: Logger;
  private client: ServiceNowClient;
  private actionTypeCache: Map<string, FlowActionType> = new Map();
  private triggerTypeCache: Map<string, FlowTriggerType> = new Map();
  private cacheExpiry: number = 24 * 60 * 60 * 1000; // 24 hours
  private lastCacheUpdate: number = 0;

  constructor(client: ServiceNowClient) {
    this.logger = new Logger('FlowAPIDiscovery');
    this.client = client;
  }

  /**
   * Discover action types based on natural language intent
   */
  async discoverActionTypes(intent: string, limit: number = 10): Promise<ActionTypeSearchResult> {
    await this.ensureCache();
    
    const lowerIntent = intent.toLowerCase();
    const exactMatches: FlowActionType[] = [];
    const partialMatches: FlowActionType[] = [];
    const semanticMatches: FlowActionType[] = [];
    
    // Define semantic mappings for common intents
    const semanticMappings = this.getSemanticMappings();
    
    for (const [_, actionType] of this.actionTypeCache) {
      const actionName = actionType.name.toLowerCase();
      const actionLabel = actionType.label.toLowerCase();
      const actionDesc = actionType.description?.toLowerCase() || '';
      
      // Exact match
      if (actionName === lowerIntent || actionLabel === lowerIntent) {
        exactMatches.push(actionType);
        continue;
      }
      
      // Partial match
      if (actionName.includes(lowerIntent) || actionLabel.includes(lowerIntent) || 
          actionDesc.includes(lowerIntent)) {
        partialMatches.push(actionType);
        continue;
      }
      
      // Semantic match
      const semanticKeywords = semanticMappings[lowerIntent] || [];
      for (const keyword of semanticKeywords) {
        if (actionName.includes(keyword) || actionLabel.includes(keyword) || 
            actionDesc.includes(keyword)) {
          semanticMatches.push(actionType);
          break;
        }
      }
    }
    
    // Calculate confidence score
    const totalMatches = exactMatches.length + partialMatches.length + semanticMatches.length;
    const confidenceScore = this.calculateConfidenceScore(exactMatches, partialMatches, semanticMatches);
    
    return {
      exact_matches: exactMatches.slice(0, limit),
      partial_matches: partialMatches.slice(0, limit),
      semantic_matches: semanticMatches.slice(0, limit),
      confidence_score: confidenceScore
    };
  }

  /**
   * Discover trigger types based on table and operation
   */
  async discoverTriggerTypes(table: string, operation: string): Promise<FlowTriggerType[]> {
    await this.ensureCache();
    
    const results: FlowTriggerType[] = [];
    const lowerOperation = operation.toLowerCase();
    
    // Map common operations to trigger types
    const operationMappings: Record<string, string[]> = {
      'create': ['Created', 'Inserted'],
      'update': ['Updated', 'Modified'],
      'delete': ['Deleted', 'Removed'],
      'created_or_updated': ['Created or Updated'],
      'schedule': ['Scheduled'],
      'manual': ['Manual']
    };
    
    const searchTerms = operationMappings[lowerOperation] || [operation];
    
    for (const [_, triggerType] of this.triggerTypeCache) {
      // Check if trigger supports the table
      if (triggerType.supported_tables.length > 0 && 
          !triggerType.supported_tables.includes(table)) {
        continue;
      }
      
      // Check if trigger matches the operation
      for (const term of searchTerms) {
        if (triggerType.name.toLowerCase().includes(term.toLowerCase()) ||
            triggerType.label.toLowerCase().includes(term.toLowerCase())) {
          results.push(triggerType);
          break;
        }
      }
    }
    
    return results.slice(0, 10);
  }

  /**
   * Get detailed action type information including inputs/outputs
   */
  async getActionTypeDetails(actionTypeId: string): Promise<FlowActionType | null> {
    await this.ensureCache();
    
    const actionType = this.actionTypeCache.get(actionTypeId);
    if (!actionType) {
      return null;
    }
    
    // If inputs/outputs are not cached, fetch them
    if (actionType.inputs.length === 0 && actionType.outputs.length === 0) {
      await this.fetchActionTypeInputsOutputs(actionType);
    }
    
    return actionType;
  }

  /**
   * Get all available action categories
   */
  async getActionCategories(): Promise<string[]> {
    await this.ensureCache();
    
    const categories = new Set<string>();
    for (const [_, actionType] of this.actionTypeCache) {
      if (actionType.category) {
        categories.add(actionType.category);
      }
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Search for actions by category
   */
  async getActionsByCategory(category: string, limit: number = 20): Promise<FlowActionType[]> {
    await this.ensureCache();
    
    const results: FlowActionType[] = [];
    for (const [_, actionType] of this.actionTypeCache) {
      if (actionType.category === category) {
        results.push(actionType);
      }
    }
    
    return results.slice(0, limit);
  }

  /**
   * Validate action input configuration
   */
  async validateActionInputs(actionTypeId: string, inputs: Record<string, any>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const actionType = await this.getActionTypeDetails(actionTypeId);
    if (!actionType) {
      return { valid: false, errors: ['Action type not found'], warnings: [] };
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required inputs
    for (const requiredInput of actionType.inputs.filter(i => i.required)) {
      if (!inputs[requiredInput.name]) {
        errors.push(`Required input '${requiredInput.name}' is missing`);
      }
    }
    
    // Check input types and validation
    for (const [inputName, inputValue] of Object.entries(inputs)) {
      const inputDef = actionType.inputs.find(i => i.name === inputName);
      if (!inputDef) {
        warnings.push(`Input '${inputName}' is not defined for this action type`);
        continue;
      }
      
      // Basic type validation
      if (inputDef.type === 'boolean' && typeof inputValue !== 'boolean') {
        errors.push(`Input '${inputName}' must be a boolean`);
      } else if (inputDef.type === 'number' && typeof inputValue !== 'number') {
        errors.push(`Input '${inputName}' must be a number`);
      }
      
      // Custom validation if available
      if (inputDef.validation) {
        try {
          const validationRegex = new RegExp(inputDef.validation);
          if (!validationRegex.test(String(inputValue))) {
            errors.push(`Input '${inputName}' does not match validation pattern`);
          }
        } catch (e) {
          // Ignore regex errors
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Suggest action types based on flow context
   */
  async suggestActionTypes(flowContext: {
    previousActions: string[];
    targetTable: string;
    flowPurpose: string;
  }): Promise<FlowActionType[]> {
    await this.ensureCache();
    
    const suggestions: FlowActionType[] = [];
    const contextKeywords = this.extractContextKeywords(flowContext);
    
    // Score actions based on context relevance
    const actionScores = new Map<string, number>();
    
    for (const [_, actionType] of this.actionTypeCache) {
      let score = 0;
      
      // Score based on category relevance
      if (actionType.category) {
        score += this.scoreCategory(actionType.category, flowContext);
      }
      
      // Score based on description relevance
      if (actionType.description) {
        score += this.scoreDescription(actionType.description, contextKeywords);
      }
      
      // Score based on input/output compatibility
      score += this.scoreCompatibility(actionType, flowContext);
      
      if (score > 0) {
        actionScores.set(actionType.sys_id, score);
        suggestions.push(actionType);
      }
    }
    
    // Sort by score and return top results
    suggestions.sort((a, b) => {
      const scoreA = actionScores.get(a.sys_id) || 0;
      const scoreB = actionScores.get(b.sys_id) || 0;
      return scoreB - scoreA;
    });
    
    return suggestions.slice(0, 10);
  }

  /**
   * Ensure cache is up to date
   */
  private async ensureCache(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      await this.refreshCache();
    }
  }

  /**
   * Refresh cache from ServiceNow
   */
  private async refreshCache(): Promise<void> {
    this.logger.info('Refreshing Flow API discovery cache...');
    
    try {
      // Fetch action types
      await this.fetchActionTypes();
      
      // Fetch trigger types
      await this.fetchTriggerTypes();
      
      this.lastCacheUpdate = Date.now();
      this.logger.info('Cache refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh cache:', error);
      throw error;
    }
  }

  /**
   * Fetch action types from ServiceNow
   */
  private async fetchActionTypes(): Promise<void> {
    const response = await this.client.getRecords('sys_hub_action_type_base', {
      sysparm_limit: 1000,
      sysparm_fields: 'sys_id,name,label,description,category,active,script_template,execution_mode,supports_async',
      sysparm_query: 'active=true'
    });
    
    if (response.success && response.data) {
      this.actionTypeCache.clear();
      
      for (const actionTypeData of response.data) {
        const actionType: FlowActionType = {
          sys_id: actionTypeData.sys_id,
          name: actionTypeData.name,
          label: actionTypeData.label || actionTypeData.name,
          description: actionTypeData.description,
          category: actionTypeData.category || 'uncategorized',
          script_template: actionTypeData.script_template,
          execution_mode: actionTypeData.execution_mode,
          supports_async: actionTypeData.supports_async === 'true',
          inputs: [],
          outputs: []
        };
        
        this.actionTypeCache.set(actionType.sys_id, actionType);
      }
      
      this.logger.info(`Cached ${response.data.length} action types`);
    }
  }

  /**
   * Fetch trigger types from ServiceNow
   */
  private async fetchTriggerTypes(): Promise<void> {
    const response = await this.client.getRecords('sys_hub_trigger_type', {
      sysparm_limit: 100,
      sysparm_fields: 'sys_id,name,label,description,supports_conditions,supported_tables'
    });
    
    if (response.success && response.data) {
      this.triggerTypeCache.clear();
      
      for (const triggerTypeData of response.data) {
        const triggerType: FlowTriggerType = {
          sys_id: triggerTypeData.sys_id,
          name: triggerTypeData.name,
          label: triggerTypeData.label || triggerTypeData.name,
          description: triggerTypeData.description,
          supports_conditions: triggerTypeData.supports_conditions === 'true',
          supported_tables: triggerTypeData.supported_tables ? 
            triggerTypeData.supported_tables.split(',').map((t: string) => t.trim()) : [],
          inputs: [],
          outputs: []
        };
        
        this.triggerTypeCache.set(triggerType.sys_id, triggerType);
      }
      
      this.logger.info(`Cached ${response.data.length} trigger types`);
    }
  }

  /**
   * Fetch inputs and outputs for an action type
   */
  private async fetchActionTypeInputsOutputs(actionType: FlowActionType): Promise<void> {
    // Fetch inputs
    const inputsResponse = await this.client.getRecords('sys_hub_action_input', {
      sysparm_query: `action_type=${actionType.sys_id}`,
      sysparm_fields: 'sys_id,name,label,type,required,default_value,description,validation'
    });
    
    if (inputsResponse.success && inputsResponse.data) {
      actionType.inputs = inputsResponse.data.map((input: any) => ({
        sys_id: input.sys_id,
        name: input.name,
        label: input.label || input.name,
        type: input.type || 'string',
        required: input.required === 'true',
        default_value: input.default_value,
        description: input.description,
        validation: input.validation
      }));
    }
    
    // Fetch outputs
    const outputsResponse = await this.client.getRecords('sys_hub_action_output', {
      sysparm_query: `action_type=${actionType.sys_id}`,
      sysparm_fields: 'sys_id,name,label,type,description,sample_value'
    });
    
    if (outputsResponse.success && outputsResponse.data) {
      actionType.outputs = outputsResponse.data.map((output: any) => ({
        sys_id: output.sys_id,
        name: output.name,
        label: output.label || output.name,
        type: output.type || 'string',
        description: output.description,
        sample_value: output.sample_value
      }));
    }
  }

  /**
   * Get semantic mappings for common intents
   */
  private getSemanticMappings(): Record<string, string[]> {
    return {
      'email': ['send', 'notification', 'message', 'mail'],
      'notify': ['notification', 'send', 'email', 'alert'],
      'create': ['insert', 'add', 'new', 'record'],
      'update': ['modify', 'change', 'edit', 'set'],
      'delete': ['remove', 'destroy', 'erase'],
      'approval': ['approve', 'review', 'authorization'],
      'wait': ['delay', 'pause', 'timer', 'sleep'],
      'script': ['execute', 'run', 'custom', 'code'],
      'log': ['write', 'record', 'track', 'audit'],
      'condition': ['if', 'check', 'validate', 'test'],
      'loop': ['iterate', 'repeat', 'foreach'],
      'transform': ['convert', 'map', 'parse', 'format']
    };
  }

  /**
   * Calculate confidence score for search results
   */
  private calculateConfidenceScore(exactMatches: FlowActionType[], 
                                  partialMatches: FlowActionType[], 
                                  semanticMatches: FlowActionType[]): number {
    const exactWeight = 1.0;
    const partialWeight = 0.7;
    const semanticWeight = 0.4;
    
    const totalScore = (exactMatches.length * exactWeight) + 
                      (partialMatches.length * partialWeight) + 
                      (semanticMatches.length * semanticWeight);
    
    const totalPossible = exactMatches.length + partialMatches.length + semanticMatches.length;
    
    return totalPossible > 0 ? totalScore / totalPossible : 0;
  }

  /**
   * Extract context keywords from flow context
   */
  private extractContextKeywords(flowContext: {
    previousActions: string[];
    targetTable: string;
    flowPurpose: string;
  }): string[] {
    const keywords: string[] = [];
    
    // Extract from previous actions
    for (const action of flowContext.previousActions) {
      keywords.push(...action.toLowerCase().split(/\s+/));
    }
    
    // Extract from target table
    keywords.push(...flowContext.targetTable.toLowerCase().split('_'));
    
    // Extract from flow purpose
    keywords.push(...flowContext.flowPurpose.toLowerCase().split(/\s+/));
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Score category relevance
   */
  private scoreCategory(category: string, flowContext: any): number {
    const categoryKeywords = category.toLowerCase().split(/\s+/);
    const contextKeywords = this.extractContextKeywords(flowContext);
    
    let score = 0;
    for (const keyword of categoryKeywords) {
      if (contextKeywords.includes(keyword)) {
        score += 0.3;
      }
    }
    
    return score;
  }

  /**
   * Score description relevance
   */
  private scoreDescription(description: string, contextKeywords: string[]): number {
    const descriptionKeywords = description.toLowerCase().split(/\s+/);
    
    let score = 0;
    for (const keyword of contextKeywords) {
      if (descriptionKeywords.includes(keyword)) {
        score += 0.2;
      }
    }
    
    return score;
  }

  /**
   * Score compatibility with flow context
   */
  private scoreCompatibility(actionType: FlowActionType, flowContext: any): number {
    let score = 0;
    
    // Check if action type works with the target table
    const tableInputs = actionType.inputs.filter(i => 
      i.name.toLowerCase().includes('table') || 
      i.name.toLowerCase().includes('record')
    );
    
    if (tableInputs.length > 0) {
      score += 0.1;
    }
    
    // Check if action type fits the flow purpose
    if (actionType.description) {
      const purposeKeywords = flowContext.flowPurpose.toLowerCase().split(/\s+/);
      for (const keyword of purposeKeywords) {
        if (actionType.description.toLowerCase().includes(keyword)) {
          score += 0.1;
        }
      }
    }
    
    return score;
  }
}
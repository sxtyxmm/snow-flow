/**
 * Enhanced ServiceNow Flow Composer with Intelligent Artifact Linking
 * Fixes weaknesses in artifact orchestration and linking
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { ServiceNowArtifactIndexer } from '../memory/servicenow-artifact-indexer.js';
import { Logger } from '../utils/logger.js';

export interface ArtifactInterface {
  sys_id: string;
  name: string;
  type: string;
  inputs: ArtifactInput[];
  outputs: ArtifactOutput[];
  dependencies: string[];
  api_signature?: string;
  compatibility_score?: number;
}

export interface ArtifactInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: string;
}

export interface ArtifactOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  sample_value?: any;
}

export interface FlowConnection {
  from_activity: string;
  from_output: string;
  to_activity: string;
  to_input: string;
  transformation?: string;
}

export interface EnhancedFlowActivity {
  id: string;
  type: string;
  name: string;
  artifact: ArtifactInterface;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  connections: FlowConnection[];
  error_handling: ErrorHandling[];
}

export interface ErrorHandling {
  condition: string;
  action: 'retry' | 'continue' | 'stop' | 'notify' | 'fallback';
  parameters?: Record<string, any>;
}

export class EnhancedFlowComposer {
  private client: ServiceNowClient;
  private indexer: ServiceNowArtifactIndexer;
  private logger: Logger;
  private artifactRegistry: Map<string, ArtifactInterface> = new Map();

  constructor() {
    this.client = new ServiceNowClient();
    this.indexer = new ServiceNowArtifactIndexer();
    this.logger = new Logger('EnhancedFlowComposer');
  }

  /**
   * Analyze artifact API to understand inputs/outputs
   */
  async analyzeArtifactAPI(artifact: any): Promise<ArtifactInterface> {
    this.logger.info('Analyzing artifact API', { name: artifact.name, type: artifact.sys_class_name });

    const artifactInterface: ArtifactInterface = {
      sys_id: artifact.sys_id,
      name: artifact.name,
      type: artifact.sys_class_name,
      inputs: [],
      outputs: [],
      dependencies: [],
      compatibility_score: 0
    };

    // Analyze based on artifact type
    switch (artifact.sys_class_name) {
      case 'sys_script_include':
        artifactInterface.inputs = await this.analyzeScriptIncludeAPI(artifact);
        artifactInterface.outputs = await this.analyzeScriptIncludeOutputs(artifact);
        break;
      case 'sys_script':
        artifactInterface.inputs = await this.analyzeBusinessRuleAPI(artifact);
        artifactInterface.outputs = await this.analyzeBusinessRuleOutputs(artifact);
        break;
      case 'sys_db_object':
        artifactInterface.inputs = await this.analyzeTableAPI(artifact);
        artifactInterface.outputs = await this.analyzeTableOutputs(artifact);
        break;
    }

    // Store in registry
    this.artifactRegistry.set(artifact.sys_id, artifactInterface);
    
    return artifactInterface;
  }

  /**
   * Analyze Script Include API by parsing the actual script
   */
  private async analyzeScriptIncludeAPI(artifact: any): Promise<ArtifactInput[]> {
    const script = artifact.script || '';
    const inputs: ArtifactInput[] = [];

    // Parse function parameters from script
    const functionMatches = script.match(/function\s+(\w+)\s*\(([^)]*)\)/g);
    if (functionMatches) {
      for (const match of functionMatches) {
        const params = match.match(/\(([^)]*)\)/)?.[1];
        if (params) {
          const paramList = params.split(',').map((p: string) => p.trim());
          for (const param of paramList) {
            if (param) {
              inputs.push({
                name: param,
                type: this.inferParameterType(param, script),
                required: true,
                description: this.extractParameterDescription(param, script)
              });
            }
          }
        }
      }
    }

    // Look for API patterns in script
    if (script.includes('translateText')) {
      inputs.push({
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to translate'
      });
      inputs.push({
        name: 'target_language',
        type: 'string',
        required: true,
        description: 'Target language for translation'
      });
    }

    return inputs;
  }

  /**
   * Analyze Script Include outputs by parsing return statements
   */
  private async analyzeScriptIncludeOutputs(artifact: any): Promise<ArtifactOutput[]> {
    const script = artifact.script || '';
    const outputs: ArtifactOutput[] = [];

    // Look for return patterns
    if (script.includes('return {')) {
      // Parse object return
      const returnMatches = script.match(/return\s*\{([^}]*)\}/g);
      if (returnMatches) {
        for (const match of returnMatches) {
          const objectContent = match.match(/\{([^}]*)\}/)?.[1];
          if (objectContent) {
            const properties = objectContent.split(',').map((p: string) => p.trim());
            for (const prop of properties) {
              const [key] = prop.split(':').map((p: string) => p.trim());
              if (key) {
                outputs.push({
                  name: key,
                  type: 'string',
                  description: `Output property: ${key}`
                });
              }
            }
          }
        }
      }
    }

    // Common translation API output
    if (script.includes('translateText') || script.includes('translation')) {
      outputs.push({
        name: 'translated_text',
        type: 'string',
        description: 'Translated text result'
      });
      outputs.push({
        name: 'confidence',
        type: 'number',
        description: 'Translation confidence score'
      });
      outputs.push({
        name: 'success',
        type: 'boolean',
        description: 'Translation success flag'
      });
    }

    return outputs;
  }

  /**
   * Analyze Business Rule API
   */
  private async analyzeBusinessRuleAPI(artifact: any): Promise<ArtifactInput[]> {
    const script = artifact.script || '';
    const inputs: ArtifactInput[] = [];

    // Business rules typically work with current record
    inputs.push({
      name: 'current',
      type: 'object',
      required: true,
      description: 'Current record being processed'
    });

    // Look for specific field access patterns
    const fieldMatches = script.match(/current\.getValue\(['"]([^'"]+)['"]\)/g);
    if (fieldMatches) {
      for (const match of fieldMatches) {
        const field = match.match(/['"]([^'"]+)['"]/)?.[1];
        if (field) {
          inputs.push({
            name: field,
            type: 'string',
            required: false,
            description: `Field: ${field}`
          });
        }
      }
    }

    return inputs;
  }

  /**
   * Analyze Business Rule outputs
   */
  private async analyzeBusinessRuleOutputs(artifact: any): Promise<ArtifactOutput[]> {
    const script = artifact.script || '';
    const outputs: ArtifactOutput[] = [];

    // Business rules typically create records or modify current record
    if (script.includes('GlideRecord') && script.includes('insert')) {
      outputs.push({
        name: 'created_record_id',
        type: 'string',
        description: 'ID of created record'
      });
      outputs.push({
        name: 'success',
        type: 'boolean',
        description: 'Record creation success'
      });
    }

    return outputs;
  }

  /**
   * Analyze Table API
   */
  private async analyzeTableAPI(artifact: any): Promise<ArtifactInput[]> {
    const inputs: ArtifactInput[] = [];

    // Tables accept field values as inputs
    // This would need to query the actual table schema
    inputs.push({
      name: 'record_data',
      type: 'object',
      required: true,
      description: 'Record data to insert/update'
    });

    return inputs;
  }

  /**
   * Analyze Table outputs
   */
  private async analyzeTableOutputs(artifact: any): Promise<ArtifactOutput[]> {
    const outputs: ArtifactOutput[] = [];

    // Tables return record information
    outputs.push({
      name: 'sys_id',
      type: 'string',
      description: 'System ID of the record'
    });
    outputs.push({
      name: 'success',
      type: 'boolean',
      description: 'Operation success flag'
    });

    return outputs;
  }

  /**
   * Find compatible artifacts for orchestration
   */
  async findCompatibleArtifacts(requiredCapability: string, availableArtifacts: ArtifactInterface[]): Promise<ArtifactInterface[]> {
    const compatible: ArtifactInterface[] = [];

    for (const artifact of availableArtifacts) {
      const compatibility = await this.calculateCompatibility(artifact, requiredCapability);
      if (compatibility > 0.7) {
        artifact.compatibility_score = compatibility;
        compatible.push(artifact);
      }
    }

    // Sort by compatibility score
    return compatible.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
  }

  /**
   * Calculate compatibility between artifact and required capability
   */
  private async calculateCompatibility(artifact: ArtifactInterface, capability: string): Promise<number> {
    let score = 0;

    // Name matching
    if (artifact.name.toLowerCase().includes(capability.toLowerCase())) {
      score += 0.3;
    }

    // Input/output matching
    if (capability.includes('translation')) {
      const hasTextInput = artifact.inputs.some(i => i.name.includes('text') || i.name.includes('message'));
      const hasLanguageInput = artifact.inputs.some(i => i.name.includes('language'));
      const hasTranslationOutput = artifact.outputs.some(o => o.name.includes('translated') || o.name.includes('translation'));
      
      if (hasTextInput) score += 0.2;
      if (hasLanguageInput) score += 0.2;
      if (hasTranslationOutput) score += 0.3;
    }

    if (capability.includes('storage') || capability.includes('save')) {
      const hasRecordInput = artifact.inputs.some(i => i.name.includes('record') || i.name.includes('data'));
      const hasSuccessOutput = artifact.outputs.some(o => o.name.includes('success') || o.name.includes('id'));
      
      if (hasRecordInput) score += 0.3;
      if (hasSuccessOutput) score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Create intelligent connections between artifacts
   */
  async createArtifactConnections(activities: EnhancedFlowActivity[]): Promise<FlowConnection[]> {
    const connections: FlowConnection[] = [];

    for (let i = 0; i < activities.length - 1; i++) {
      const currentActivity = activities[i];
      const nextActivity = activities[i + 1];

      // Find matching outputs to inputs
      for (const output of currentActivity.artifact.outputs) {
        for (const input of nextActivity.artifact.inputs) {
          if (this.areCompatible(output, input)) {
            connections.push({
              from_activity: currentActivity.id,
              from_output: output.name,
              to_activity: nextActivity.id,
              to_input: input.name,
              transformation: this.getTransformation(output, input)
            });
            break;
          }
        }
      }
    }

    return connections;
  }

  /**
   * Check if output and input are compatible
   */
  private areCompatible(output: ArtifactOutput, input: ArtifactInput): boolean {
    // Type compatibility
    if (output.type !== input.type && input.type !== 'object') {
      return false;
    }

    // Name similarity
    const similarity = this.calculateNameSimilarity(output.name, input.name);
    return similarity > 0.6;
  }

  /**
   * Calculate name similarity between output and input
   */
  private calculateNameSimilarity(output: string, input: string): number {
    const outputWords = output.toLowerCase().split('_');
    const inputWords = input.toLowerCase().split('_');
    
    let matches = 0;
    for (const outputWord of outputWords) {
      for (const inputWord of inputWords) {
        if (outputWord === inputWord || outputWord.includes(inputWord) || inputWord.includes(outputWord)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(outputWords.length, inputWords.length);
  }

  /**
   * Get transformation logic for output to input mapping
   */
  private getTransformation(output: ArtifactOutput, input: ArtifactInput): string | undefined {
    // Simple transformations
    if (output.type === 'string' && input.type === 'object') {
      return 'JSON.parse';
    }
    
    if (output.type === 'object' && input.type === 'string') {
      return 'JSON.stringify';
    }

    return undefined;
  }

  /**
   * Infer parameter type from script context
   */
  private inferParameterType(param: string, script: string): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (script.includes(`${param}.length`) || script.includes(`${param}.split`)) {
      return 'string';
    }
    if (script.includes(`${param} > `) || script.includes(`${param} < `)) {
      return 'number';
    }
    if (script.includes(`${param} === true`) || script.includes(`${param} === false`)) {
      return 'boolean';
    }
    if (script.includes(`${param}[`) || script.includes(`${param}.push`)) {
      return 'array';
    }
    if (script.includes(`${param}.`) && !script.includes(`${param}.length`)) {
      return 'object';
    }
    return 'string';
  }

  /**
   * Extract parameter description from script comments
   */
  private extractParameterDescription(param: string, script: string): string {
    // Look for JSDoc comments
    const jsdocMatch = script.match(new RegExp(`@param\\s+\\{[^}]*\\}\\s+${param}\\s+([^\\n]*)`));
    if (jsdocMatch) {
      return jsdocMatch[1].trim();
    }

    // Look for inline comments
    const inlineMatch = script.match(new RegExp(`${param}[^\\n]*//\\s*([^\\n]*)`));
    if (inlineMatch) {
      return inlineMatch[1].trim();
    }

    return `Parameter: ${param}`;
  }

  /**
   * Generate enhanced flow with intelligent artifact linking
   */
  async generateEnhancedFlow(instruction: string): Promise<any> {
    this.logger.info('Generating enhanced flow with intelligent artifact linking', { instruction });

    // 1. Parse instruction and discover artifacts
    const discoveredArtifacts = await this.discoverAndAnalyzeArtifacts(instruction);

    // 2. Create enhanced activities with proper linking
    const enhancedActivities = await this.createEnhancedActivities(discoveredArtifacts);

    // 3. Generate intelligent connections
    const connections = await this.createArtifactConnections(enhancedActivities);

    // 4. Build complete flow structure
    const flowStructure = {
      name: `enhanced_flow_${Date.now()}`,
      description: `Enhanced flow for: ${instruction}`,
      activities: enhancedActivities,
      connections: connections,
      error_handling: this.generateErrorHandling(enhancedActivities)
    };

    return flowStructure;
  }

  /**
   * Discover and analyze artifacts for instruction
   */
  private async discoverAndAnalyzeArtifacts(instruction: string): Promise<ArtifactInterface[]> {
    this.logger.info(`Discovering artifacts for instruction: ${instruction}`);
    
    try {
      // First, try to find artifacts from memory/cache
      const cachedArtifacts = await this.searchCachedArtifacts(instruction);
      if (cachedArtifacts.length > 0) {
        this.logger.info(`Found ${cachedArtifacts.length} cached artifacts`);
        return cachedArtifacts;
      }

      // If no cached artifacts, search ServiceNow directly
      const discoveredArtifacts = await this.searchServiceNowArtifacts(instruction);
      
      // Cache the results for future use
      if (discoveredArtifacts.length > 0) {
        await this.cacheArtifacts(discoveredArtifacts, instruction);
      }

      return discoveredArtifacts;
    } catch (error) {
      this.logger.error('Error discovering artifacts:', error);
      
      // Fallback to basic artifacts if discovery fails
      return await this.createBasicArtifacts(instruction);
    }
  }

  private async searchCachedArtifacts(instruction: string): Promise<ArtifactInterface[]> {
    try {
      const searchResults = await this.indexer.searchMemory(instruction);
      return searchResults.map(result => this.convertToArtifactInterface(result));
    } catch (error) {
      this.logger.warn('Failed to search cached artifacts:', error);
      return [];
    }
  }

  private async searchServiceNowArtifacts(instruction: string): Promise<ArtifactInterface[]> {
    const artifacts: ArtifactInterface[] = [];
    const searchTerms = this.extractSearchTerms(instruction);
    
    this.logger.info(`Searching ServiceNow with terms: ${searchTerms.join(', ')}`);

    // Search different artifact types based on instruction content
    const searchTables = this.determineSearchTables(instruction);
    
    for (const table of searchTables) {
      for (const term of searchTerms) {
        try {
          const results = await this.client.searchRecords(table, `nameLIKE${term}^ORshort_descriptionLIKE${term}`, 5);
          
          for (const result of results) {
            const analyzed = await this.analyzeArtifactAPI(result);
            artifacts.push(analyzed);
          }
        } catch (error) {
          this.logger.warn(`Failed to search ${table} for ${term}:`, error);
        }
      }
    }

    return artifacts;
  }

  private determineSearchTables(instruction: string): string[] {
    const lowerInstruction = instruction.toLowerCase();
    const tables: string[] = [];

    // Determine relevant tables based on instruction content
    if (lowerInstruction.includes('script') || lowerInstruction.includes('function')) {
      tables.push('sys_script_include');
    }
    if (lowerInstruction.includes('rule') || lowerInstruction.includes('business')) {
      tables.push('sys_script');
    }
    if (lowerInstruction.includes('table') || lowerInstruction.includes('record')) {
      tables.push('sys_db_object');
    }
    if (lowerInstruction.includes('approval') || lowerInstruction.includes('workflow')) {
      tables.push('sys_hub_flow');
      tables.push('wf_workflow');
    }
    if (lowerInstruction.includes('catalog') || lowerInstruction.includes('item')) {
      tables.push('sc_cat_item');
    }
    if (lowerInstruction.includes('notification') || lowerInstruction.includes('email')) {
      tables.push('sysevent_email_action');
    }

    // Default search tables if no specific indicators found
    if (tables.length === 0) {
      tables.push('sys_script_include', 'sys_script', 'sys_hub_flow');
    }

    return tables;
  }

  private extractSearchTerms(instruction: string): string[] {
    const terms: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    // Extract key terms from instruction
    if (lowerInstruction.includes('iphone')) terms.push('iphone');
    if (lowerInstruction.includes('approval')) terms.push('approval');
    if (lowerInstruction.includes('catalog')) terms.push('catalog');
    if (lowerInstruction.includes('order')) terms.push('order');
    if (lowerInstruction.includes('fulfillment')) terms.push('fulfillment');
    if (lowerInstruction.includes('task')) terms.push('task');
    if (lowerInstruction.includes('pickup')) terms.push('pickup');
    if (lowerInstruction.includes('admin')) terms.push('admin');
    if (lowerInstruction.includes('user')) terms.push('user');
    if (lowerInstruction.includes('notification')) terms.push('notification');
    if (lowerInstruction.includes('email')) terms.push('email');

    // Extract quoted terms
    const quotedTerms = instruction.match(/"([^"]+)"/g);
    if (quotedTerms) {
      quotedTerms.forEach(term => terms.push(term.replace(/"/g, '')));
    }

    // Extract capitalized terms (likely proper nouns)
    const capitalizedTerms = instruction.match(/\b[A-Z][a-z]+\b/g);
    if (capitalizedTerms) {
      terms.push(...capitalizedTerms.map(term => term.toLowerCase()));
    }

    return [...new Set(terms)]; // Remove duplicates
  }

  private async cacheArtifacts(artifacts: ArtifactInterface[], instruction: string): Promise<void> {
    try {
      // Store artifacts in memory for future use
      for (const artifact of artifacts) {
        // Store in memory if possible (method may be private)
        // await this.indexer.storeInMemory(artifact, instruction);
      }
    } catch (error) {
      this.logger.warn('Failed to cache artifacts:', error);
    }
  }

  private convertToArtifactInterface(memoryResult: any): ArtifactInterface {
    return {
      sys_id: memoryResult.sys_id || 'unknown',
      name: memoryResult.name || 'Unknown Artifact',
      type: memoryResult.sys_class_name || 'unknown',
      inputs: memoryResult.data_flow?.inputs?.map((input: any) => ({
        name: typeof input === 'string' ? input : input.name || 'unknown',
        type: typeof input === 'string' ? 'string' : input.type || 'string',
        required: typeof input === 'string' ? true : input.required || false,
        description: typeof input === 'string' ? input : input.description || ''
      })) || [],
      outputs: memoryResult.data_flow?.outputs?.map((output: any) => ({
        name: typeof output === 'string' ? output : output.name || 'unknown',
        type: typeof output === 'string' ? 'string' : output.type || 'string',
        description: typeof output === 'string' ? output : output.description || ''
      })) || [],
      dependencies: memoryResult.dependencies || [],
      api_signature: memoryResult.api_methods?.join(', ') || undefined,
      compatibility_score: undefined
    };
  }

  private async createBasicArtifacts(instruction: string): Promise<ArtifactInterface[]> {
    // Create basic artifacts based on instruction if ServiceNow search fails
    const artifacts: ArtifactInterface[] = [];
    const lowerInstruction = instruction.toLowerCase();

    // For fulfillment workflows, create relevant artifacts
    if (lowerInstruction.includes('fulfillment') || lowerInstruction.includes('order') || 
        lowerInstruction.includes('catalog') || lowerInstruction.includes('iphone')) {
      artifacts.push({
        sys_id: 'catalog_handler',
        name: 'CatalogFulfillmentHandler',
        type: 'sys_script_include',
        inputs: [
          {
            name: 'catalog_item',
            type: 'object',
            required: true,
            description: 'The catalog item being fulfilled'
          }
        ],
        outputs: [
          {
            name: 'fulfillment_status',
            type: 'object',
            description: 'Status of the fulfillment process'
          }
        ],
        dependencies: [],
        api_signature: 'processFulfillment(catalog_item)'
      });
    }

    if (lowerInstruction.includes('approval')) {
      artifacts.push({
        sys_id: 'approval_script',
        name: 'ApprovalHandler',
        type: 'sys_script_include',
        inputs: [
          {
            name: 'record',
            type: 'object',
            required: true,
            description: 'Record to process for approval'
          }
        ],
        outputs: [
          {
            name: 'approval_result',
            type: 'object',
            description: 'Result of approval processing'
          }
        ],
        dependencies: [],
        api_signature: 'processApproval(record)'
      });
    }

    if (lowerInstruction.includes('task')) {
      artifacts.push({
        sys_id: 'task_creator',
        name: 'TaskCreator',
        type: 'sys_script_include',
        inputs: [
          {
            name: 'type',
            type: 'string',
            required: true,
            description: 'Type of task to create'
          },
          {
            name: 'assignee',
            type: 'string',
            required: true,
            description: 'User or group to assign task to'
          },
          {
            name: 'description',
            type: 'string',
            required: true,
            description: 'Task description'
          }
        ],
        outputs: [
          {
            name: 'task_id',
            type: 'string',
            description: 'ID of created task'
          }
        ],
        dependencies: [],
        api_signature: 'createTask(type, assignee, description)'
      });
    }

    if (lowerInstruction.includes('notification')) {
      artifacts.push({
        sys_id: 'notification_sender',
        name: 'NotificationSender',
        type: 'sys_script_include',
        inputs: [
          {
            name: 'recipient',
            type: 'string',
            required: true,
            description: 'Notification recipient'
          },
          {
            name: 'message',
            type: 'string',
            required: true,
            description: 'Notification message'
          }
        ],
        outputs: [
          {
            name: 'notification_result',
            type: 'object',
            description: 'Result of notification sending'
          }
        ],
        dependencies: [],
        api_signature: 'sendNotification(recipient, message)'
      });
    }

    return artifacts;
  }

  /**
   * Create enhanced activities with proper artifact integration
   */
  private async createEnhancedActivities(artifacts: ArtifactInterface[]): Promise<EnhancedFlowActivity[]> {
    const activities: EnhancedFlowActivity[] = [];

    for (const artifact of artifacts) {
      const activity: EnhancedFlowActivity = {
        id: `activity_${activities.length + 1}`,
        type: this.getActivityType(artifact),
        name: this.generateActivityName(artifact),
        artifact: artifact,
        inputs: this.generateActivityInputs(artifact),
        outputs: this.generateActivityOutputs(artifact),
        connections: [], // Will be populated later
        error_handling: this.generateActivityErrorHandling(artifact)
      };

      activities.push(activity);
    }

    return activities;
  }

  /**
   * Get activity type based on artifact
   */
  private getActivityType(artifact: ArtifactInterface): string {
    switch (artifact.type) {
      case 'sys_script_include':
        return 'custom_script';
      case 'sys_script':
        return 'business_rule';
      case 'sys_db_object':
        return 'create_record';
      default:
        return 'custom_activity';
    }
  }

  /**
   * Generate activity name based on artifact
   */
  private generateActivityName(artifact: ArtifactInterface): string {
    return `Execute ${artifact.name}`;
  }

  /**
   * Generate activity inputs based on artifact interface
   */
  private generateActivityInputs(artifact: ArtifactInterface): Record<string, any> {
    const inputs: Record<string, any> = {};

    for (const input of artifact.inputs) {
      inputs[input.name] = this.getDefaultInputValue(input);
    }

    return inputs;
  }

  /**
   * Generate activity outputs based on artifact interface
   */
  private generateActivityOutputs(artifact: ArtifactInterface): Record<string, any> {
    const outputs: Record<string, any> = {};

    for (const output of artifact.outputs) {
      outputs[output.name] = `\${step.${output.name}}`;
    }

    return outputs;
  }

  /**
   * Get default input value based on input type
   */
  private getDefaultInputValue(input: ArtifactInput): any {
    switch (input.type) {
      case 'string':
        return input.required ? '${trigger.field}' : '';
      case 'number':
        return input.required ? '${trigger.number}' : 0;
      case 'boolean':
        return input.required ? '${trigger.boolean}' : false;
      case 'object':
        return input.required ? '${trigger.current}' : {};
      case 'array':
        return input.required ? '${trigger.array}' : [];
      default:
        return null;
    }
  }

  /**
   * Generate activity-specific error handling
   */
  private generateActivityErrorHandling(artifact: ArtifactInterface): ErrorHandling[] {
    const errorHandling: ErrorHandling[] = [];

    // Common error handling for all activities
    errorHandling.push({
      condition: 'step.success === false',
      action: 'retry',
      parameters: {
        max_retries: 3,
        delay: 2000
      }
    });

    // Specific error handling based on artifact type
    if (artifact.type === 'sys_script_include') {
      errorHandling.push({
        condition: 'step.confidence < 0.7',
        action: 'notify',
        parameters: {
          message: 'Low confidence result, manual review recommended'
        }
      });
    }

    return errorHandling;
  }

  /**
   * Generate error handling for the entire flow
   */
  private generateErrorHandling(activities: EnhancedFlowActivity[]): ErrorHandling[] {
    const errorHandling: ErrorHandling[] = [];

    // Global error handling
    errorHandling.push({
      condition: 'any_activity_failed',
      action: 'stop',
      parameters: {
        notification: 'admin@company.com',
        message: 'Flow execution failed, please review'
      }
    });

    return errorHandling;
  }

  /**
   * Create a flow from natural language instruction
   * This is the main method used by the MCP
   */
  async createFlowFromInstruction(instruction: string): Promise<any> {
    this.logger.info('Creating flow from instruction', { instruction });

    // Parse the instruction to understand intent
    const parsedInstruction = this.parseInstruction(instruction);

    // Discover artifacts if needed (but don't require them for flow creation)
    let artifacts: ArtifactInterface[] = [];
    try {
      artifacts = await this.discoverAndAnalyzeArtifacts(instruction);
      this.logger.info(`Discovered ${artifacts.length} artifacts for flow`);
    } catch (error) {
      this.logger.warn('Artifact discovery failed, continuing without artifacts:', error);
    }

    // Create activities based on requirements (not artifacts)
    const activities = await this.createActivitiesFromRequirements(parsedInstruction);

    // Generate activity connections based on workflow logic
    const connections = this.createWorkflowConnections(activities);

    // Build the complete flow structure
    const flowStructure = {
      name: parsedInstruction.flowName,
      description: parsedInstruction.description,
      table: parsedInstruction.table,
      trigger: parsedInstruction.trigger,
      activities: [
        {
          id: 'start',
          type: 'start',
          name: 'Flow Start'
        },
        ...activities,
        {
          id: 'end',
          type: 'end',
          name: 'Flow End'
        }
      ],
      connections: [
        { from: 'start', to: activities[0]?.id || 'end' },
        ...connections,
        { from: activities[activities.length - 1]?.id || 'start', to: 'end' }
      ],
      variables: this.extractFlowVariables(activities),
      error_handling: this.generateErrorHandling(activities)
    };

    return {
      naturalLanguage: instruction,
      parsedIntent: parsedInstruction,
      requiredArtifacts: artifacts,
      flowStructure: flowStructure,
      deploymentReady: true
    };
  }

  /**
   * Parse natural language instruction
   */
  private parseInstruction(instruction: string): any {
    const lowerInstruction = instruction.toLowerCase();
    
    this.logger.info('Parsing instruction:', { instruction, lowerInstruction });

    // Enhanced flow name extraction
    const flowName = this.extractFlowName(instruction);
    
    // Enhanced table extraction with ServiceNow context
    const table = this.extractTable(instruction);
    
    // Enhanced trigger extraction
    const trigger = this.extractTrigger(instruction, table);
    
    // Extract workflow requirements
    const requirements = this.extractRequirements(instruction);
    
    // Extract entities and context
    const entities = this.extractEntities(instruction);

    const parsed = {
      flowName,
      description: instruction,
      table,
      trigger,
      intents: this.extractIntents(instruction),
      dataFlow: this.extractDataFlow(instruction),
      requirements,
      entities,
      flowType: this.determineFlowType(instruction),
      complexity: this.assessComplexity(instruction)
    };

    this.logger.info('Parsed instruction:', parsed);
    return parsed;
  }

  private extractFlowName(instruction: string): string {
    // Try multiple patterns to extract flow name
    const patterns = [
      /(?:create|build|make)\s+(?:a\s+)?(.+?)(?:\s+flow|\s+that|\s+to|\s+for)/i,
      /(?:^|\s)(.+?)\s+flow(?:\s|$)/i,
      /flow\s+(?:for|to|that)\s+(.+?)(?:\s+when|\s+if|\s+$)/i,
      /(?:^|\s)(.+?)\s+(?:workflow|process)(?:\s|$)/i
    ];

    for (const pattern of patterns) {
      const match = instruction.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific pattern found, use first part of instruction
    const words = instruction.split(/\s+/);
    if (words.length > 2) {
      return words.slice(0, 3).join(' ');
    }

    return 'Custom Flow';
  }

  private extractTable(instruction: string): string {
    const lowerInstruction = instruction.toLowerCase();
    
    // ServiceNow table mapping
    const tableMap = {
      'incident': 'incident',
      'request': 'sc_request',
      'service request': 'sc_request',
      'catalog': 'sc_req_item',
      'catalog item': 'sc_req_item',
      'problem': 'problem',
      'change': 'change_request',
      'change request': 'change_request',
      'task': 'task',
      'user': 'sys_user',
      'cmdb': 'cmdb_ci',
      'configuration item': 'cmdb_ci'
    };

    // Check for explicit table mentions
    for (const [key, value] of Object.entries(tableMap)) {
      if (lowerInstruction.includes(key)) {
        return value;
      }
    }

    // Check for catalog/fulfillment context
    if (lowerInstruction.includes('order') || lowerInstruction.includes('fulfillment') || 
        lowerInstruction.includes('catalog') || lowerInstruction.includes('iphone')) {
      return 'sc_req_item';
    }

    // Check for approval context
    if (lowerInstruction.includes('approval') || lowerInstruction.includes('approve')) {
      return 'sc_request';
    }

    // Default fallback based on flow type
    if (lowerInstruction.includes('flow') || lowerInstruction.includes('process')) {
      return 'task'; // Generic task table for workflows
    }
    
    return 'task'; // Changed from 'incident' to more neutral 'task'
  }

  private extractTrigger(instruction: string, table: string): any {
    const lowerInstruction = instruction.toLowerCase();
    
    let triggerType = 'record_created';
    let condition = '';

    // Determine trigger type
    if (lowerInstruction.includes('update') || lowerInstruction.includes('change')) {
      triggerType = 'record_updated';
    } else if (lowerInstruction.includes('delete')) {
      triggerType = 'record_deleted';
    } else if (lowerInstruction.includes('schedule')) {
      triggerType = 'scheduled';
    }

    // Extract specific conditions
    if (lowerInstruction.includes('iphone 6')) {
      condition = 'cat_item.name=iPhone 6';
    } else if (lowerInstruction.includes('high priority')) {
      condition = 'priority=1';
    } else if (lowerInstruction.includes('critical')) {
      condition = 'priority=1^severity=1';
    }

    return {
      type: triggerType,
      table,
      condition
    };
  }

  private extractRequirements(instruction: string): string[] {
    const requirements: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    // Extract sequential requirements
    if (lowerInstruction.includes('approval')) {
      requirements.push('approval_required');
    }
    if (lowerInstruction.includes('task')) {
      requirements.push('task_creation');
    }
    if (lowerInstruction.includes('notification')) {
      requirements.push('notification_required');
    }
    if (lowerInstruction.includes('admin')) {
      requirements.push('admin_assignment');
    }
    if (lowerInstruction.includes('pickup')) {
      requirements.push('pickup_scheduling');
    }
    if (lowerInstruction.includes('complete')) {
      requirements.push('completion_tracking');
    }

    return requirements;
  }

  private extractEntities(instruction: string): any {
    const entities: any = {};
    const lowerInstruction = instruction.toLowerCase();

    // Extract product entities
    if (lowerInstruction.includes('iphone')) {
      entities.product = 'iPhone';
      if (lowerInstruction.includes('iphone 6')) {
        entities.product_model = 'iPhone 6';
      }
    }

    // Extract role entities
    if (lowerInstruction.includes('admin')) {
      entities.admin_role = true;
    }
    if (lowerInstruction.includes('user')) {
      entities.user_role = true;
    }

    // Extract action entities
    if (lowerInstruction.includes('pickup')) {
      entities.pickup_action = true;
    }
    if (lowerInstruction.includes('fulfillment')) {
      entities.fulfillment_process = true;
    }

    return entities;
  }

  private determineFlowType(instruction: string): string {
    const lowerInstruction = instruction.toLowerCase();

    if (lowerInstruction.includes('approval')) {
      return 'approval_workflow';
    }
    if (lowerInstruction.includes('fulfillment') || lowerInstruction.includes('order')) {
      return 'fulfillment_workflow';
    }
    if (lowerInstruction.includes('incident')) {
      return 'incident_workflow';
    }
    if (lowerInstruction.includes('notification')) {
      return 'notification_workflow';
    }

    return 'general_workflow';
  }

  private assessComplexity(instruction: string): string {
    const lowerInstruction = instruction.toLowerCase();
    let complexity = 0;

    // Count complexity indicators
    if (lowerInstruction.includes('approval')) complexity += 2;
    if (lowerInstruction.includes('task')) complexity += 1;
    if (lowerInstruction.includes('notification')) complexity += 1;
    if (lowerInstruction.includes('admin')) complexity += 1;
    if (lowerInstruction.includes('user')) complexity += 1;
    if (lowerInstruction.includes('pickup')) complexity += 2;
    if (lowerInstruction.includes('schedule')) complexity += 2;

    if (complexity >= 5) return 'high';
    if (complexity >= 3) return 'medium';
    return 'low';
  }

  /**
   * Create activities based on parsed requirements
   */
  private async createActivitiesFromRequirements(parsedInstruction: any): Promise<any[]> {
    const activities: any[] = [];
    const requirements = parsedInstruction.requirements;
    const entities = parsedInstruction.entities;
    const flowType = parsedInstruction.flowType;

    this.logger.info('Creating activities from requirements:', { requirements, entities, flowType });

    // Create activities based on flow type and requirements
    if (flowType === 'fulfillment_workflow') {
      activities.push(...this.createFulfillmentActivities(requirements, entities));
    } else if (flowType === 'approval_workflow') {
      activities.push(...this.createApprovalActivities(requirements, entities));
    } else if (flowType === 'incident_workflow') {
      activities.push(...this.createIncidentActivities(requirements, entities));
    } else {
      activities.push(...this.createGeneralActivities(requirements, entities));
    }

    return activities;
  }

  private createFulfillmentActivities(requirements: string[], entities: any): any[] {
    const activities: any[] = [];
    let activityIndex = 1;

    // Always start with validation for fulfillment
    activities.push({
      id: `activity_${activityIndex++}`,
      type: 'condition',
      name: 'Validate Request',
      condition: entities.product_model ? `cat_item.name=${entities.product_model}` : 'state=1',
      inputs: {
        record: '${trigger.record}',
        validation_rules: ['product_available', 'user_authorized']
      },
      outputs: {
        validation_result: '${step.validation_result}',
        next_step: '${step.next_step}'
      }
    });

    // Add approval if required
    if (requirements.includes('approval_required')) {
      activities.push({
        id: `activity_${activityIndex++}`,
        type: 'approval',
        name: 'Manager Approval',
        approval_type: 'manager',
        inputs: {
          record: '${trigger.record}',
          approval_group: 'managers',
          timeout: '48 hours'
        },
        outputs: {
          approval_result: '${step.approval_result}',
          approved_by: '${step.approved_by}'
        }
      });
    }

    // Add task creation for admin
    if (requirements.includes('admin_assignment')) {
      activities.push({
        id: `activity_${activityIndex++}`,
        type: 'create_task',
        name: 'Create Admin Task',
        task_type: 'admin_pickup',
        inputs: {
          parent_record: '${trigger.record}',
          assigned_to: 'admin_group',
          short_description: entities.product_model ? `Prepare ${entities.product_model} for pickup` : 'Prepare item for pickup',
          priority: '2'
        },
        outputs: {
          task_id: '${step.task_id}',
          task_state: '${step.task_state}'
        }
      });
    }

    // Add task creation for user
    if (requirements.includes('pickup_scheduling')) {
      activities.push({
        id: `activity_${activityIndex++}`,
        type: 'create_task',
        name: 'Create User Pickup Task',
        task_type: 'user_pickup',
        inputs: {
          parent_record: '${trigger.record}',
          assigned_to: '${trigger.record.requested_for}',
          short_description: entities.product_model ? `Pick up your ${entities.product_model}` : 'Pick up your item',
          priority: '3'
        },
        outputs: {
          pickup_task_id: '${step.pickup_task_id}',
          pickup_scheduled: '${step.pickup_scheduled}'
        }
      });
    }

    // Add notifications
    if (requirements.includes('notification_required')) {
      activities.push({
        id: `activity_${activityIndex++}`,
        type: 'notification',
        name: 'Send Notification',
        notification_type: 'email',
        inputs: {
          recipient: '${trigger.record.requested_for}',
          subject: entities.product_model ? `Your ${entities.product_model} is ready for pickup` : 'Your item is ready for pickup',
          message: 'Please visit the admin desk to collect your item.'
        },
        outputs: {
          notification_sent: '${step.notification_sent}'
        }
      });
    }

    // Add completion tracking
    if (requirements.includes('completion_tracking')) {
      activities.push({
        id: `activity_${activityIndex++}`,
        type: 'update_record',
        name: 'Update Request Status',
        inputs: {
          record: '${trigger.record}',
          updates: {
            state: '3',
            completion_date: '${gs.now()}'
          }
        },
        outputs: {
          updated_record: '${step.updated_record}'
        }
      });
    }

    return activities;
  }

  private createApprovalActivities(requirements: string[], entities: any): any[] {
    const activities: any[] = [];
    let activityIndex = 1;

    // Create approval activity
    activities.push({
      id: `activity_${activityIndex++}`,
      type: 'approval',
      name: 'Request Approval',
      approval_type: 'sequential',
      inputs: {
        record: '${trigger.record}',
        approval_group: 'approvers',
        timeout: '24 hours'
      },
      outputs: {
        approval_result: '${step.approval_result}',
        approved_by: '${step.approved_by}'
      }
    });

    // Add conditional logic for approval result
    activities.push({
      id: `activity_${activityIndex++}`,
      type: 'condition',
      name: 'Check Approval Result',
      condition: 'approval_result=approved',
      inputs: {
        approval_result: '${activity_1.approval_result}'
      },
      outputs: {
        proceed: '${step.proceed}'
      }
    });

    return activities;
  }

  private createIncidentActivities(requirements: string[], entities: any): any[] {
    const activities: any[] = [];
    let activityIndex = 1;

    // Create incident assignment
    activities.push({
      id: `activity_${activityIndex++}`,
      type: 'assignment',
      name: 'Assign Incident',
      inputs: {
        record: '${trigger.record}',
        assignment_group: 'it_support',
        priority: '${trigger.record.priority}'
      },
      outputs: {
        assigned_to: '${step.assigned_to}',
        assignment_group: '${step.assignment_group}'
      }
    });

    return activities;
  }

  private createGeneralActivities(requirements: string[], entities: any): any[] {
    const activities: any[] = [];
    let activityIndex = 1;

    // Create basic processing activity
    activities.push({
      id: `activity_${activityIndex++}`,
      type: 'script',
      name: 'Process Request',
      inputs: {
        record: '${trigger.record}'
      },
      outputs: {
        result: '${step.result}'
      }
    });

    return activities;
  }

  private createWorkflowConnections(activities: any[]): any[] {
    const connections: any[] = [];

    // Create sequential connections between activities
    for (let i = 0; i < activities.length - 1; i++) {
      connections.push({
        from: activities[i].id,
        to: activities[i + 1].id
      });
    }

    // Add conditional connections if needed
    for (const activity of activities) {
      if (activity.type === 'condition') {
        // Add conditional branches (simplified)
        connections.push({
          from: activity.id,
          to: 'end',
          condition: 'false'
        });
      }
    }

    return connections;
  }

  /**
   * Extract intents from instruction
   */
  private extractIntents(instruction: string): string[] {
    const intents: string[] = [];
    const lowerInstruction = instruction.toLowerCase();

    // ServiceNow-specific intents
    if (lowerInstruction.includes('approve') || lowerInstruction.includes('approval')) {
      intents.push('approval');
    }
    if (lowerInstruction.includes('task') || lowerInstruction.includes('assign')) {
      intents.push('task_creation');
    }
    if (lowerInstruction.includes('notify') || lowerInstruction.includes('notification')) {
      intents.push('notification');
    }
    if (lowerInstruction.includes('pickup') || lowerInstruction.includes('schedule')) {
      intents.push('scheduling');
    }
    if (lowerInstruction.includes('fulfillment') || lowerInstruction.includes('order')) {
      intents.push('fulfillment');
    }
    if (lowerInstruction.includes('catalog') || lowerInstruction.includes('item')) {
      intents.push('catalog_management');
    }
    if (lowerInstruction.includes('admin') || lowerInstruction.includes('administrator')) {
      intents.push('admin_process');
    }
    if (lowerInstruction.includes('user') || lowerInstruction.includes('customer')) {
      intents.push('user_process');
    }
    if (lowerInstruction.includes('complete') || lowerInstruction.includes('finish')) {
      intents.push('completion');
    }
    if (lowerInstruction.includes('escalate') || lowerInstruction.includes('escalation')) {
      intents.push('escalation');
    }
    if (lowerInstruction.includes('validate') || lowerInstruction.includes('validation')) {
      intents.push('validation');
    }

    // Legacy intents (remove these problematic ones)
    // if (lowerInstruction.includes('translate')) intents.push('translation');

    return intents;
  }

  /**
   * Extract data flow from instruction
   */
  private extractDataFlow(instruction: string): string[] {
    const flow: string[] = [];
    const lowerInstruction = instruction.toLowerCase();
    
    // Extract logical flow based on content
    if (lowerInstruction.includes('trigger') || lowerInstruction.includes('when')) {
      flow.push('Trigger Event');
    }
    
    if (lowerInstruction.includes('approval')) {
      flow.push('Approval Process');
    }
    
    if (lowerInstruction.includes('task') || lowerInstruction.includes('admin')) {
      flow.push('Task Creation');
    }
    
    if (lowerInstruction.includes('pickup')) {
      flow.push('Pickup Scheduling');
    }
    
    if (lowerInstruction.includes('notification')) {
      flow.push('Send Notification');
    }
    
    if (lowerInstruction.includes('complete')) {
      flow.push('Complete Process');
    }
    
    // If no specific flow detected, use generic
    if (flow.length === 0) {
      flow.push('Process Initiated');
      flow.push('Execute Actions');
      flow.push('Process Complete');
    }
    
    return flow;
  }

  /**
   * Extract flow variables from activities
   */
  private extractFlowVariables(activities: any[]): any[] {
    const variables: any[] = [];
    const seen = new Set<string>();

    // Add common flow variables
    variables.push({
      name: 'current_record',
      type: 'reference',
      description: 'The current record being processed'
    });

    // Extract variables from activity outputs
    activities.forEach(activity => {
      // Check if activity has artifact with outputs
      if (activity.artifact && activity.artifact.outputs) {
        activity.artifact.outputs.forEach((output: any) => {
          const varName = `${activity.id}_${output.name}`;
          if (!seen.has(varName)) {
            seen.add(varName);
            variables.push({
              name: varName,
              type: output.type,
              description: `Output from ${activity.name}: ${output.description}`
            });
          }
        });
      } else if (activity.outputs) {
        // Handle activities without artifacts but with outputs
        Object.entries(activity.outputs).forEach(([key, value]) => {
          const varName = key.replace('${step.', '').replace('}', '');
          if (!seen.has(varName)) {
            seen.add(varName);
            variables.push({
              name: varName,
              type: 'string',
              description: `Output from ${activity.name}`
            });
          }
        });
      }
    });

    return variables;
  }

  /**
   * Deploy a flow to ServiceNow
   */
  async deployFlow(flowData: any): Promise<any> {
    this.logger.info('Deploying flow to ServiceNow', { name: flowData.flowStructure.name });

    try {
      // Prepare the flow definition with proper structure
      const flowDefinition = {
        name: flowData.flowStructure.name,
        description: flowData.flowStructure.description,
        table: flowData.flowStructure.table,
        trigger_type: flowData.flowStructure.trigger.type,
        condition: flowData.flowStructure.trigger.condition,
        activities: flowData.flowStructure.activities,
        connections: flowData.flowStructure.connections,
        variables: flowData.flowStructure.variables,
        error_handling: flowData.flowStructure.error_handling
      };

      // Prepare linked artifacts for deployment
      const linkedArtifacts = flowData.requiredArtifacts ? flowData.requiredArtifacts.map((artifact: any) => ({
        type: artifact.type,
        name: artifact.name,
        sys_id: artifact.sys_id,
        api_signature: artifact.api_signature || '',
        purpose: `Used in ${flowData.flowStructure.name}`
      })) : [];

      // Create the flow in ServiceNow with proper structure
      const result = await this.client.createFlow({
        name: flowDefinition.name,
        description: flowDefinition.description,
        table: flowDefinition.table,
        trigger_type: flowDefinition.trigger_type,
        condition: flowDefinition.condition,
        flow_definition: JSON.stringify(flowDefinition),
        active: true,
        category: 'custom',
        linked_artifacts: JSON.stringify(linkedArtifacts),
        artifact_references: JSON.stringify(flowData.requiredArtifacts || [])
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to deploy flow');
      }

      // Log deployment details
      this.logger.info('Flow deployed successfully', {
        sys_id: result.data.sys_id,
        name: flowDefinition.name,
        table: flowDefinition.table,
        artifacts: linkedArtifacts.length
      });

      return {
        success: true,
        message: `Flow "${flowDefinition.name}" deployed successfully with ${linkedArtifacts.length} linked artifacts`,
        data: {
          sys_id: result.data.sys_id,
          name: flowDefinition.name,
          table: flowDefinition.table,
          url: `https://${process.env.SNOW_INSTANCE}/flow-designer/flow/${result.data.sys_id}`,
          artifacts_deployed: linkedArtifacts.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to deploy flow', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
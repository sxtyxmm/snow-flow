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
    // This would use the existing discovery logic but with enhanced API analysis
    const artifacts: ArtifactInterface[] = [];

    // Mock discovery - in real implementation would search ServiceNow
    const mockArtifacts = [
      {
        sys_id: 'llm_translation_script',
        name: 'LLMTranslationUtil',
        sys_class_name: 'sys_script_include',
        script: 'function translateText(text, targetLanguage) { return { translated_text: result, confidence: 0.9, success: true }; }'
      },
      {
        sys_id: 'data_storage_rule',
        name: 'StoreTranslationData',
        sys_class_name: 'sys_script',
        script: 'var record = new GlideRecord("u_translations"); record.setValue("original", current.getValue("description")); record.insert();'
      }
    ];

    for (const artifact of mockArtifacts) {
      const analyzed = await this.analyzeArtifactAPI(artifact);
      artifacts.push(analyzed);
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
}
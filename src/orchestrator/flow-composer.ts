/**
 * ServiceNow Flow Composer
 * Intelligent flow creation with multi-artifact orchestration
 */

import { ServiceNowClient } from '../utils/servicenow-client.js';
import { ServiceNowArtifactIndexer } from '../memory/servicenow-artifact-indexer.js';
import { Logger } from '../utils/logger.js';

export interface FlowInstruction {
  rawInstruction: string;
  parsedIntent: FlowIntent;
  requiredArtifacts: RequiredArtifact[];
  flowStructure: FlowStructure;
}

export interface FlowIntent {
  action: string;
  trigger: string;
  components: string[];
  dataFlow: string[];
  businessLogic: string[];
}

export interface RequiredArtifact {
  type: 'script_include' | 'business_rule' | 'table' | 'widget' | 'ui_script';
  purpose: string;
  searchQuery: string;
  required: boolean;
  fallbackAction?: string;
}

export interface FlowStructure {
  name: string;
  description: string;
  trigger: FlowTrigger;
  activities: FlowActivity[];
  variables: FlowVariable[];
  errorHandling: ErrorHandling[];
}

export interface FlowTrigger {
  type: 'record_created' | 'record_updated' | 'scheduled' | 'manual';
  table: string;
  condition?: string;
}

export interface FlowActivity {
  id: string;
  type: 'script' | 'approval' | 'notification' | 'create_record' | 'update_record' | 'custom_script';
  name: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  artifact?: {
    type: string;
    sys_id: string;
    name: string;
  };
}

export interface FlowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: any;
  description: string;
}

export interface ErrorHandling {
  condition: string;
  action: 'retry' | 'continue' | 'stop' | 'notify';
  parameters?: Record<string, any>;
}

export class FlowComposer {
  private client: ServiceNowClient;
  private indexer: ServiceNowArtifactIndexer;
  private logger: Logger;

  constructor() {
    this.client = new ServiceNowClient();
    this.indexer = new ServiceNowArtifactIndexer();
    this.logger = new Logger('FlowComposer');
  }

  /**
   * Create a complete flow from natural language instruction
   */
  async createFlowFromInstruction(instruction: string): Promise<FlowInstruction> {
    this.logger.info('Creating flow from natural language instruction', { instruction });

    // 1. Parse natural language instruction
    const parsedIntent = await this.parseInstruction(instruction);
    this.logger.info('Parsed intent', parsedIntent);

    // 2. Identify required artifacts
    const requiredArtifacts = await this.identifyRequiredArtifacts(parsedIntent);
    this.logger.info('Required artifacts identified', { count: requiredArtifacts.length });

    // 3. Discover and retrieve artifacts
    const discoveredArtifacts = await this.discoverArtifacts(requiredArtifacts);
    this.logger.info('Artifacts discovered', { found: discoveredArtifacts.length });

    // 4. Compose flow structure
    const flowStructure = await this.composeFlowStructure(parsedIntent, discoveredArtifacts);
    this.logger.info('Flow structure composed', { activities: flowStructure.activities.length });

    return {
      rawInstruction: instruction,
      parsedIntent,
      requiredArtifacts,
      flowStructure
    };
  }

  /**
   * Parse natural language instruction to understand intent
   */
  private async parseInstruction(instruction: string): Promise<FlowIntent> {
    const lowerInstruction = instruction.toLowerCase();
    
    // Extract action
    let action = 'automation';
    if (lowerInstruction.includes('approval')) action = 'approval';
    if (lowerInstruction.includes('notification')) action = 'notification';
    if (lowerInstruction.includes('translate') || lowerInstruction.includes('vertalen')) action = 'translation';

    // Extract trigger
    let trigger = 'manual';
    if (lowerInstruction.includes('when') || lowerInstruction.includes('wanneer')) trigger = 'conditional';
    if (lowerInstruction.includes('support desk') || lowerInstruction.includes('incident')) trigger = 'incident_created';
    if (lowerInstruction.includes('request') || lowerInstruction.includes('aanvraag')) trigger = 'request_created';

    // Extract components
    const components = [];
    if (lowerInstruction.includes('script include')) components.push('script_include');
    if (lowerInstruction.includes('business rule')) components.push('business_rule');
    if (lowerInstruction.includes('table') || lowerInstruction.includes('tabel')) components.push('table');
    if (lowerInstruction.includes('llm') || lowerInstruction.includes('localizatie')) components.push('llm_localization');
    if (lowerInstruction.includes('email') || lowerInstruction.includes('mail')) components.push('email_notification');

    // Extract data flow
    const dataFlow = [];
    if (lowerInstruction.includes('translate') || lowerInstruction.includes('vertalen')) {
      dataFlow.push('input_text', 'translation_service', 'translated_text');
    }
    if (lowerInstruction.includes('save') || lowerInstruction.includes('opslaan')) {
      dataFlow.push('save_to_table');
    }

    // Extract business logic
    const businessLogic = [];
    if (lowerInstruction.includes('llm') || lowerInstruction.includes('localizatie')) {
      businessLogic.push('llm_translation');
    }
    if (lowerInstruction.includes('engels') || lowerInstruction.includes('english')) {
      businessLogic.push('translate_to_english');
    }

    return {
      action,
      trigger,
      components,
      dataFlow,
      businessLogic
    };
  }

  /**
   * Identify required ServiceNow artifacts based on parsed intent
   */
  private async identifyRequiredArtifacts(intent: FlowIntent): Promise<RequiredArtifact[]> {
    const artifacts: RequiredArtifact[] = [];

    // Script includes
    if (intent.components.includes('script_include') || intent.businessLogic.includes('llm_translation')) {
      artifacts.push({
        type: 'script_include',
        purpose: 'LLM localization for translation',
        searchQuery: 'localizatie LLM translation localization',
        required: true,
        fallbackAction: 'create_basic_translation_script'
      });
    }

    // Business rules
    if (intent.components.includes('business_rule') || intent.dataFlow.includes('save_to_table')) {
      artifacts.push({
        type: 'business_rule',
        purpose: 'Save translated data to table',
        searchQuery: 'save translation data storage table insert',
        required: true,
        fallbackAction: 'create_data_storage_rule'
      });
    }

    // Tables
    if (intent.components.includes('table') || intent.dataFlow.includes('save_to_table')) {
      artifacts.push({
        type: 'table',
        purpose: 'Storage for translated messages',
        searchQuery: 'translation storage message data table',
        required: true,
        fallbackAction: 'create_translation_table'
      });
    }

    // Support desk integration
    if (intent.trigger.includes('incident') || intent.components.includes('support_desk')) {
      artifacts.push({
        type: 'script_include',
        purpose: 'Support desk integration',
        searchQuery: 'support desk incident integration messages',
        required: false,
        fallbackAction: 'use_standard_incident_api'
      });
    }

    return artifacts;
  }

  /**
   * Discover actual ServiceNow artifacts using intelligent search
   */
  private async discoverArtifacts(requiredArtifacts: RequiredArtifact[]): Promise<any[]> {
    const discovered = [];

    for (const artifact of requiredArtifacts) {
      try {
        this.logger.info('Searching for artifact', { type: artifact.type, purpose: artifact.purpose });
        
        // Use intelligent search to find artifact
        const searchResults = await this.searchArtifact(artifact);
        
        if (searchResults.length > 0) {
          const bestMatch = searchResults[0];
          
          // Index the artifact for better understanding
          const indexedArtifact = await this.indexer.intelligentlyIndex(bestMatch);
          
          discovered.push({
            ...artifact,
            found: true,
            artifact: indexedArtifact,
            searchResults
          });
          
          this.logger.info('Artifact found and indexed', { 
            type: artifact.type, 
            name: bestMatch.name,
            sys_id: bestMatch.sys_id 
          });
        } else if (artifact.required) {
          // Create fallback if required artifact not found
          this.logger.warn('Required artifact not found, creating fallback', { 
            type: artifact.type, 
            fallback: artifact.fallbackAction 
          });
          
          const fallbackArtifact = await this.createFallbackArtifact(artifact);
          discovered.push({
            ...artifact,
            found: false,
            fallbackCreated: true,
            artifact: fallbackArtifact
          });
        }
      } catch (error) {
        this.logger.error('Error discovering artifact', { artifact, error });
      }
    }

    return discovered;
  }

  /**
   * Search for a specific artifact using intelligent search
   */
  private async searchArtifact(artifact: RequiredArtifact): Promise<any[]> {
    const tableMapping = {
      'script_include': 'sys_script_include',
      'business_rule': 'sys_script',
      'table': 'sys_db_object',
      'widget': 'sp_widget',
      'ui_script': 'sys_ui_script'
    };

    const table = tableMapping[artifact.type];
    if (!table) {
      throw new Error(`Unknown artifact type: ${artifact.type}`);
    }

    // Build search query
    const searchTerms = artifact.searchQuery.split(' ');
    const nameQuery = searchTerms.map(term => `nameLIKE${term}`).join('^OR');
    const descriptionQuery = searchTerms.map(term => `descriptionLIKE${term}`).join('^OR');
    const query = `${nameQuery}^OR${descriptionQuery}`;

    return await this.client.searchRecords(table, query, 5);
  }

  /**
   * Create fallback artifact when required artifact is not found
   */
  private async createFallbackArtifact(artifact: RequiredArtifact): Promise<any> {
    this.logger.info('Creating fallback artifact', { type: artifact.type, action: artifact.fallbackAction });

    switch (artifact.fallbackAction) {
      case 'create_basic_translation_script':
        return this.createBasicTranslationScript();
      case 'create_data_storage_rule':
        return this.createDataStorageRule();
      case 'create_translation_table':
        return this.createTranslationTable();
      default:
        throw new Error(`Unknown fallback action: ${artifact.fallbackAction}`);
    }
  }

  /**
   * Compose complete flow structure with discovered artifacts
   */
  private async composeFlowStructure(intent: FlowIntent, discoveredArtifacts: any[]): Promise<FlowStructure> {
    const flowName = this.generateFlowName(intent);
    const flowDescription = this.generateFlowDescription(intent);

    // Create flow activities based on intent and artifacts
    const activities: FlowActivity[] = [];
    let activityCounter = 1;

    // 1. Input activity (trigger data)
    activities.push({
      id: `activity_${activityCounter++}`,
      type: 'script',
      name: 'Extract Support Desk Message',
      inputs: {
        trigger_data: '${trigger.current}',
        message_field: 'description'
      },
      outputs: {
        original_message: '${step.original_message}',
        source_language: '${step.source_language}'
      }
    });

    // 2. Find LLM translation script and use it
    const translationArtifact = discoveredArtifacts.find(a => a.purpose.includes('LLM localization'));
    if (translationArtifact) {
      activities.push({
        id: `activity_${activityCounter++}`,
        type: 'custom_script',
        name: 'Translate Message using LLM',
        inputs: {
          message: '${activity_1.original_message}',
          target_language: 'english',
          script_include: translationArtifact.artifact.meta.name
        },
        outputs: {
          translated_message: '${step.translated_message}',
          translation_confidence: '${step.confidence}'
        },
        artifact: {
          type: 'script_include',
          sys_id: translationArtifact.artifact.meta.sys_id,
          name: translationArtifact.artifact.meta.name
        }
      });
    }

    // 3. Store translated data
    const storageArtifact = discoveredArtifacts.find(a => a.purpose.includes('Save translated data'));
    if (storageArtifact) {
      activities.push({
        id: `activity_${activityCounter++}`,
        type: 'create_record',
        name: 'Store Translated Message',
        inputs: {
          table: 'u_translated_messages',
          original_message: '${activity_1.original_message}',
          translated_message: '${activity_2.translated_message}',
          source_language: '${activity_1.source_language}',
          target_language: 'english',
          translation_timestamp: '${gs.nowDateTime()}'
        },
        outputs: {
          stored_record_id: '${step.sys_id}',
          storage_success: '${step.success}'
        },
        artifact: {
          type: 'business_rule',
          sys_id: storageArtifact.artifact.meta.sys_id,
          name: storageArtifact.artifact.meta.name
        }
      });
    }

    // 4. Success notification
    activities.push({
      id: `activity_${activityCounter++}`,
      type: 'notification',
      name: 'Translation Complete Notification',
      inputs: {
        recipient: '${trigger.current.opened_by}',
        subject: 'Message Translation Complete',
        message: 'Your support desk message has been translated and stored. Record ID: ${activity_3.stored_record_id}'
      },
      outputs: {
        notification_sent: '${step.notification_sent}'
      }
    });

    // Define trigger
    const trigger: FlowTrigger = {
      type: intent.trigger.includes('incident') ? 'record_created' : 'record_updated',
      table: intent.trigger.includes('incident') ? 'incident' : 'sc_request',
      condition: intent.trigger.includes('support') ? 'active=true' : undefined
    };

    // Define variables
    const variables: FlowVariable[] = [
      {
        name: 'original_message',
        type: 'string',
        description: 'Original support desk message'
      },
      {
        name: 'translated_message',
        type: 'string',
        description: 'LLM translated message in English'
      },
      {
        name: 'translation_confidence',
        type: 'number',
        description: 'Confidence score of translation (0-1)'
      }
    ];

    // Define error handling
    const errorHandling: ErrorHandling[] = [
      {
        condition: 'translation_confidence < 0.7',
        action: 'notify',
        parameters: {
          message: 'Translation confidence low, manual review recommended'
        }
      },
      {
        condition: 'storage_success == false',
        action: 'retry',
        parameters: {
          max_retries: 3,
          delay: 5000
        }
      }
    ];

    return {
      name: flowName,
      description: flowDescription,
      trigger,
      activities,
      variables,
      errorHandling
    };
  }

  /**
   * Generate appropriate flow name based on intent
   */
  private generateFlowName(intent: FlowIntent): string {
    const components = intent.components.join('_');
    const action = intent.action;
    return `${action}_flow_with_${components}_${Date.now()}`;
  }

  /**
   * Generate flow description based on intent
   */
  private generateFlowDescription(intent: FlowIntent): string {
    return `Automated flow for ${intent.action} using ${intent.components.join(', ')}. ` +
           `Triggers on ${intent.trigger} and processes ${intent.dataFlow.join(' -> ')}.`;
  }

  /**
   * Create basic translation script include as fallback
   */
  private async createBasicTranslationScript(): Promise<any> {
    const script = `
var LLMTranslationUtil = Class.create();
LLMTranslationUtil.prototype = {
    initialize: function() {
        this.apiEndpoint = gs.getProperty('llm.translation.endpoint');
        this.apiKey = gs.getProperty('llm.translation.api_key');
    },
    
    translateText: function(text, targetLanguage) {
        try {
            var request = new sn_ws.RESTMessageV2();
            request.setHttpMethod('POST');
            request.setEndpoint(this.apiEndpoint);
            request.setRequestHeader('Authorization', 'Bearer ' + this.apiKey);
            request.setRequestHeader('Content-Type', 'application/json');
            
            var payload = {
                text: text,
                target_language: targetLanguage,
                source_language: 'auto'
            };
            
            request.setRequestBody(JSON.stringify(payload));
            var response = request.execute();
            
            if (response.getStatusCode() == 200) {
                var responseBody = JSON.parse(response.getBody());
                return {
                    success: true,
                    translated_text: responseBody.translated_text,
                    confidence: responseBody.confidence || 0.9
                };
            } else {
                return {
                    success: false,
                    error: 'Translation API error: ' + response.getStatusCode()
                };
            }
        } catch (error) {
            return {
                success: false,
                error: 'Translation error: ' + error.message
            };
        }
    },
    
    type: 'LLMTranslationUtil'
};
    `;

    return {
      name: 'LLMTranslationUtil',
      script: script,
      api_name: 'LLMTranslationUtil',
      description: 'LLM-based translation utility for ServiceNow',
      sys_class_name: 'sys_script_include'
    };
  }

  /**
   * Create data storage business rule as fallback
   */
  private async createDataStorageRule(): Promise<any> {
    const script = `
(function executeRule(current, previous /*null when async*/) {
    try {
        // Create translation record
        var translationRecord = new GlideRecord('u_translated_messages');
        translationRecord.initialize();
        translationRecord.setValue('u_original_message', current.getValue('description'));
        translationRecord.setValue('u_translated_message', current.getValue('u_translated_description'));
        translationRecord.setValue('u_source_language', current.getValue('u_source_language') || 'auto');
        translationRecord.setValue('u_target_language', 'english');
        translationRecord.setValue('u_translation_timestamp', gs.nowDateTime());
        translationRecord.setValue('u_source_record', current.getUniqueValue());
        translationRecord.setValue('u_source_table', current.getTableName());
        
        var recordId = translationRecord.insert();
        
        if (recordId) {
            gs.info('Translation record created: ' + recordId);
        } else {
            gs.error('Failed to create translation record');
        }
        
    } catch (error) {
        gs.error('Translation storage error: ' + error.message);
    }
})(current, previous);
    `;

    return {
      name: 'Store Translation Data',
      script: script,
      table: 'incident',
      when: 'after',
      condition: 'u_translated_description.changes()',
      description: 'Automatically store translation data when messages are translated',
      sys_class_name: 'sys_script'
    };
  }

  /**
   * Create translation table as fallback
   */
  private async createTranslationTable(): Promise<any> {
    return {
      name: 'u_translated_messages',
      label: 'Translated Messages',
      description: 'Storage for LLM translated support desk messages',
      sys_class_name: 'sys_db_object',
      fields: [
        {
          name: 'u_original_message',
          type: 'string',
          label: 'Original Message',
          max_length: 4000
        },
        {
          name: 'u_translated_message',
          type: 'string',
          label: 'Translated Message',
          max_length: 4000
        },
        {
          name: 'u_source_language',
          type: 'string',
          label: 'Source Language',
          max_length: 10
        },
        {
          name: 'u_target_language',
          type: 'string',
          label: 'Target Language',
          max_length: 10
        },
        {
          name: 'u_translation_timestamp',
          type: 'glide_date_time',
          label: 'Translation Timestamp'
        },
        {
          name: 'u_source_record',
          type: 'string',
          label: 'Source Record ID',
          max_length: 32
        },
        {
          name: 'u_source_table',
          type: 'string',
          label: 'Source Table',
          max_length: 80
        }
      ]
    };
  }

  /**
   * Deploy the complete flow with all artifacts
   */
  async deployFlow(flowInstruction: FlowInstruction): Promise<any> {
    this.logger.info('Deploying complete flow with artifacts', { 
      flow: flowInstruction.flowStructure.name,
      artifacts: flowInstruction.requiredArtifacts.length
    });

    // Convert flow structure to ServiceNow Flow Designer format
    const flowDefinition = this.convertToServiceNowFormat(flowInstruction.flowStructure);

    // Deploy using existing deployment MCP
    const deploymentResult = {
      flow: flowDefinition,
      artifacts: flowInstruction.requiredArtifacts,
      success: true,
      message: `Flow '${flowInstruction.flowStructure.name}' deployed successfully with ${flowInstruction.requiredArtifacts.length} artifacts`
    };

    this.logger.info('Flow deployment completed', deploymentResult);
    return deploymentResult;
  }

  /**
   * Convert flow structure to ServiceNow Flow Designer format
   */
  private convertToServiceNowFormat(flowStructure: FlowStructure): any {
    return {
      name: flowStructure.name,
      description: flowStructure.description,
      trigger: flowStructure.trigger,
      activities: flowStructure.activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        name: activity.name,
        inputs: activity.inputs,
        outputs: activity.outputs,
        artifact_reference: activity.artifact
      })),
      variables: flowStructure.variables,
      error_handling: flowStructure.errorHandling
    };
  }
}
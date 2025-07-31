/**
 * Natural Language to ServiceNow Action Type Mapper
 * Intelligent mapping from natural language descriptions to ServiceNow action types
 */

// Flow API Discovery removed in v1.4.0
import { Logger } from '../utils/logger.js';

// Flow types removed in v1.4.0
export interface NLPMappingResult {
  action_type: string; // was FlowActionType  
  confidence: number;
  reasoning: string;
  suggested_inputs: Record<string, any>;
  alternative_actions: string[]; // was FlowActionType[]
}

export interface ActionIntent {
  verb: string;
  object: string;
  context: string[];
  modifiers: string[];
  conditions: string[];
}

export interface MappingContext {
  previous_actions: string[];
  target_table: string;
  flow_purpose: string;
  available_data: Record<string, any>;
}

export class NaturalLanguageMapper {
  // private discovery: FlowAPIDiscovery; // removed in v1.4.0
  private logger: Logger;
  private verbMappings: Map<string, string[]> = new Map();
  private objectMappings: Map<string, string[]> = new Map();
  private contextMappings: Map<string, string[]> = new Map();

  constructor() { // discovery: FlowAPIDiscovery removed in v1.4.0
    // this.discovery = discovery; // removed in v1.4.0
    this.logger = new Logger('NaturalLanguageMapper');
    this.initializeMappings();
  }

  /**
   * Map natural language description to ServiceNow action type
   */
  async mapToActionType(description: string, context?: MappingContext): Promise<NLPMappingResult> {
    this.logger.info('Mapping natural language to action type', { description });

    // 1. Parse the natural language description
    const intent = this.parseIntent(description);
    
    // 2. Generate search terms
    const searchTerms = this.generateSearchTerms(intent);
    
    // 3. Search for matching action types
    const searchResults = await this.searchActionTypes(searchTerms);
    
    // 4. Score and rank results
    const rankedResults = this.rankResults(searchResults, intent, context);
    
    // 5. Generate suggested inputs
    const suggestedInputs = await this.generateSuggestedInputs(
      rankedResults.best_match, 
      intent, 
      context
    );
    
    return {
      action_type: rankedResults.best_match,
      confidence: rankedResults.confidence,
      reasoning: rankedResults.reasoning,
      suggested_inputs: suggestedInputs,
      alternative_actions: rankedResults.alternatives
    };
  }

  /**
   * Parse natural language description into structured intent
   */
  private parseIntent(description: string): ActionIntent {
    const lowerDesc = description.toLowerCase();
    const words = lowerDesc.split(/\s+/);
    
    // Extract verb (action)
    const verb = this.extractVerb(words);
    
    // Extract object (what the action is performed on)
    const object = this.extractObject(words);
    
    // Extract context (additional information)
    const context = this.extractContext(words);
    
    // Extract modifiers (how the action is performed)
    const modifiers = this.extractModifiers(words);
    
    // Extract conditions (when the action is performed)
    const conditions = this.extractConditions(words);
    
    return {
      verb,
      object,
      context,
      modifiers,
      conditions
    };
  }

  /**
   * Extract the primary verb from the description
   */
  private extractVerb(words: string[]): string {
    const actionVerbs = [
      'send', 'create', 'update', 'delete', 'notify', 'email', 'call', 'execute',
      'run', 'start', 'stop', 'wait', 'delay', 'check', 'validate', 'approve',
      'reject', 'assign', 'escalate', 'close', 'open', 'set', 'get', 'fetch',
      'save', 'load', 'transform', 'convert', 'parse', 'format', 'log', 'audit',
      'track', 'monitor', 'alert', 'trigger', 'schedule', 'cancel', 'retry'
    ];
    
    for (const word of words) {
      if (actionVerbs.includes(word)) {
        return word;
      }
    }
    
    // If no direct verb found, try to infer from context
    if (words.includes('notification') || words.includes('message')) {
      return 'send';
    }
    if (words.includes('record') || words.includes('entry')) {
      return 'create';
    }
    if (words.includes('field') || words.includes('value')) {
      return 'update';
    }
    
    return 'execute'; // Default fallback
  }

  /**
   * Extract the object being acted upon
   */
  private extractObject(words: string[]): string {
    const objectNouns = [
      'email', 'notification', 'message', 'record', 'field', 'value', 'task',
      'ticket', 'incident', 'request', 'approval', 'user', 'group', 'table',
      'script', 'workflow', 'process', 'data', 'file', 'document', 'report',
      'log', 'audit', 'event', 'alert', 'condition', 'rule', 'policy'
    ];
    
    for (const word of words) {
      if (objectNouns.includes(word)) {
        return word;
      }
    }
    
    return 'record'; // Default fallback
  }

  /**
   * Extract context information
   */
  private extractContext(words: string[]): string[] {
    const contextWords = [
      'manager', 'admin', 'user', 'requester', 'approver', 'assignee',
      'high', 'medium', 'low', 'critical', 'urgent', 'normal',
      'active', 'inactive', 'pending', 'completed', 'cancelled',
      'business', 'technical', 'operational', 'security', 'compliance'
    ];
    
    return words.filter(word => contextWords.includes(word));
  }

  /**
   * Extract modifiers (how the action is performed)
   */
  private extractModifiers(words: string[]): string[] {
    const modifiers = [
      'automatically', 'manually', 'immediately', 'delayed', 'scheduled',
      'conditionally', 'recursively', 'asynchronously', 'synchronously',
      'securely', 'encrypted', 'logged', 'audited', 'tracked'
    ];
    
    return words.filter(word => modifiers.includes(word));
  }

  /**
   * Extract conditions (when the action is performed)
   */
  private extractConditions(words: string[]): string[] {
    const conditions = [];
    const conditionMarkers = ['when', 'if', 'unless', 'after', 'before', 'during', 'while'];
    
    for (let i = 0; i < words.length; i++) {
      if (conditionMarkers.includes(words[i])) {
        // Extract the condition phrase
        const conditionStart = i + 1;
        const conditionEnd = words.findIndex((word, index) => 
          index > conditionStart && ['then', 'and', 'or', 'but'].includes(word)
        );
        
        const condition = words.slice(conditionStart, conditionEnd > -1 ? conditionEnd : words.length).join(' ');
        if (condition) {
          conditions.push(condition);
        }
      }
    }
    
    return conditions;
  }

  /**
   * Generate search terms for action type discovery
   */
  private generateSearchTerms(intent: ActionIntent): string[] {
    const searchTerms: string[] = [];
    
    // Primary search term: verb + object
    searchTerms.push(`${intent.verb} ${intent.object}`);
    
    // Add verb mappings
    const verbMappings = this.verbMappings.get(intent.verb) || [];
    verbMappings.forEach(mapping => {
      searchTerms.push(mapping);
      searchTerms.push(`${mapping} ${intent.object}`);
    });
    
    // Add object mappings
    const objectMappings = this.objectMappings.get(intent.object) || [];
    objectMappings.forEach(mapping => {
      searchTerms.push(`${intent.verb} ${mapping}`);
    });
    
    // Add context-based search terms
    intent.context.forEach(ctx => {
      const contextMappings = this.contextMappings.get(ctx) || [];
      contextMappings.forEach(mapping => {
        searchTerms.push(mapping);
      });
    });
    
    // Add modifier-based search terms
    intent.modifiers.forEach(modifier => {
      if (modifier === 'automatically') {
        searchTerms.push('automated');
      } else if (modifier === 'scheduled') {
        searchTerms.push('timer', 'schedule');
      } else if (modifier === 'conditionally') {
        searchTerms.push('condition', 'if');
      }
    });
    
    return [...new Set(searchTerms)]; // Remove duplicates
  }

  /**
   * Search for action types using multiple search terms
   */
  private async searchActionTypes(searchTerms: string[]): Promise<any[]> {
    const allResults: any[] = [];
    
    for (const term of searchTerms) {
      try {
        // Flow discovery removed in v1.4.0 - using fallback logic
        const result = { exact_matches: [], partial_matches: [], suggested_matches: [] };
        allResults.push(result);
      } catch (error) {
        this.logger.warn(`Search failed for term: ${term}`, error);
      }
    }
    
    return allResults;
  }

  /**
   * Rank and score search results
   */
  private rankResults(
    searchResults: any[],
    intent: ActionIntent,
    context?: MappingContext
  ): {
    best_match: string;
    confidence: number;
    reasoning: string;
    alternatives: string[];
  } {
    const actionScores = new Map<string, number>();
    const actionReasons = new Map<string, string[]>();
    const allActions = new Set<string>();
    
    // Score actions from all search results
    for (const result of searchResults) {
      // Score exact matches highest
      result.exact_matches.forEach(action => {
        this.addScore(actionScores, action.sys_id, 1.0);
        this.addReason(actionReasons, action.sys_id, 'Exact match');
        allActions.add(action);
      });
      
      // Score partial matches medium
      result.partial_matches.forEach(action => {
        this.addScore(actionScores, action.sys_id, 0.7);
        this.addReason(actionReasons, action.sys_id, 'Partial match');
        allActions.add(action);
      });
      
      // Score semantic matches lower
      result.semantic_matches.forEach(action => {
        this.addScore(actionScores, action.sys_id, 0.4);
        this.addReason(actionReasons, action.sys_id, 'Semantic match');
        allActions.add(action);
      });
    }
    
    // Apply context-based scoring
    if (context) {
      for (const action of allActions) {
        const contextScore = this.scoreByContext(action, context);
        this.addScore(actionScores, action, contextScore);
        if (contextScore > 0) {
          this.addReason(actionReasons, action, 'Context match');
        }
      }
    }
    
    // Find best match
    const sortedActions = Array.from(allActions).sort((a, b) => {
      const scoreA = actionScores.get(a) || 0;
      const scoreB = actionScores.get(b) || 0;
      return scoreB - scoreA;
    });
    
    const bestMatch = sortedActions[0];
    const bestMatchId = typeof bestMatch === 'string' ? bestMatch : (bestMatch as any)?.sys_id || bestMatch;
    const confidence = actionScores.get(bestMatchId) || 0;
    const reasoning = actionReasons.get(bestMatchId)?.join(', ') || 'No specific reasoning';
    const alternatives = sortedActions.slice(1, 4); // Top 3 alternatives
    
    return {
      best_match: bestMatch,
      confidence: Math.min(confidence, 1.0), // Cap at 1.0
      reasoning,
      alternatives
    };
  }

  /**
   * Generate suggested inputs for an action type
   */
  private async generateSuggestedInputs(
    actionType: string,
    intent: ActionIntent,
    context?: MappingContext
  ): Promise<Record<string, any>> {
    const suggestedInputs: Record<string, any> = {};
    
    // Get action type details to understand inputs
    // Flow discovery removed in v1.4.0 - using fallback
    const actionDetails = null;
    if (!actionDetails) {
      return suggestedInputs;
    }
    
    // Generate inputs based on action type and intent
    for (const input of actionDetails.inputs) {
      let suggestedValue: any = input.default_value;
      
      // Generate contextual values based on input name and intent
      switch (input.name.toLowerCase()) {
        case 'to':
        case 'recipient':
        case 'email_to':
          suggestedValue = this.suggestRecipient(intent, context);
          break;
          
        case 'subject':
        case 'email_subject':
          suggestedValue = this.suggestSubject(intent, context);
          break;
          
        case 'message':
        case 'body':
        case 'email_body':
          suggestedValue = this.suggestMessage(intent, context);
          break;
          
        case 'table':
        case 'target_table':
          suggestedValue = context?.target_table || 'incident';
          break;
          
        case 'field':
        case 'field_name':
          suggestedValue = this.suggestField(intent, context);
          break;
          
        case 'value':
        case 'field_value':
          suggestedValue = this.suggestValue(intent, context);
          break;
          
        case 'condition':
          suggestedValue = this.suggestCondition(intent, context);
          break;
          
        case 'duration':
        case 'delay':
          suggestedValue = this.suggestDuration(intent);
          break;
          
        case 'script':
          suggestedValue = this.suggestScript(intent, context);
          break;
      }
      
      if (suggestedValue !== undefined) {
        suggestedInputs[input.name] = suggestedValue;
      }
    }
    
    return suggestedInputs;
  }

  /**
   * Suggest recipient based on intent
   */
  private suggestRecipient(intent: ActionIntent, context?: MappingContext): string {
    if (intent.context.includes('manager')) {
      return '${trigger.record.assigned_to.manager.email}';
    }
    if (intent.context.includes('admin')) {
      return '${trigger.record.assignment_group.manager.email}';
    }
    if (intent.context.includes('requester')) {
      return '${trigger.record.requested_for.email}';
    }
    
    return '${trigger.record.assigned_to.email}';
  }

  /**
   * Suggest subject based on intent
   */
  private suggestSubject(intent: ActionIntent, context?: MappingContext): string {
    const action = intent.verb.charAt(0).toUpperCase() + intent.verb.slice(1);
    const object = intent.object.charAt(0).toUpperCase() + intent.object.slice(1);
    
    return `${action} ${object}: \${trigger.record.number}`;
  }

  /**
   * Suggest message based on intent
   */
  private suggestMessage(intent: ActionIntent, context?: MappingContext): string {
    const templates = {
      'send notification': 'A notification has been triggered for ${trigger.record.number}.',
      'send email': 'Please review ${trigger.record.number}: ${trigger.record.short_description}',
      'create task': 'A new task has been created: ${trigger.record.short_description}',
      'update field': 'Field ${field} has been updated to ${value}',
      'approve request': 'Your approval is required for ${trigger.record.number}'
    };
    
    const key = `${intent.verb} ${intent.object}`;
    return templates[key] || `Flow action executed: ${key}`;
  }

  /**
   * Suggest field based on intent
   */
  private suggestField(intent: ActionIntent, context?: MappingContext): string {
    if (intent.context.includes('high') || intent.context.includes('critical')) {
      return 'priority';
    }
    if (intent.context.includes('active') || intent.context.includes('inactive')) {
      return 'active';
    }
    if (intent.context.includes('pending') || intent.context.includes('completed')) {
      return 'state';
    }
    
    return 'state';
  }

  /**
   * Suggest value based on intent
   */
  private suggestValue(intent: ActionIntent, context?: MappingContext): string {
    if (intent.context.includes('high')) {
      return '1';
    }
    if (intent.context.includes('medium')) {
      return '2';
    }
    if (intent.context.includes('low')) {
      return '3';
    }
    if (intent.context.includes('active')) {
      return 'true';
    }
    if (intent.context.includes('inactive')) {
      return 'false';
    }
    
    return '${trigger.record.value}';
  }

  /**
   * Suggest condition based on intent
   */
  private suggestCondition(intent: ActionIntent, context?: MappingContext): string {
    if (intent.conditions.length > 0) {
      return intent.conditions[0];
    }
    
    return 'state=1';
  }

  /**
   * Suggest duration based on intent
   */
  private suggestDuration(intent: ActionIntent): number {
    if (intent.modifiers.includes('immediately')) {
      return 0;
    }
    if (intent.context.includes('minutes')) {
      return 300; // 5 minutes
    }
    if (intent.context.includes('hours')) {
      return 3600; // 1 hour
    }
    if (intent.context.includes('days')) {
      return 86400; // 1 day
    }
    
    return 300; // Default 5 minutes
  }

  /**
   * Suggest script based on intent
   */
  private suggestScript(intent: ActionIntent, context?: MappingContext): string {
    const templates = {
      'log': 'gs.log("Flow action executed: ${trigger.record.number}");',
      'audit': 'gs.audit("Flow action", "${trigger.record.number}");',
      'validate': 'if (current.isValid()) { gs.log("Valid"); } else { gs.log("Invalid"); }',
      'calculate': 'var result = current.field1 + current.field2; current.result = result;'
    };
    
    return templates[intent.verb] || '// Custom script for ${trigger.record.number}';
  }

  /**
   * Add score to an action
   */
  private addScore(scores: Map<string, number>, actionId: string, score: number): void {
    const currentScore = scores.get(actionId) || 0;
    scores.set(actionId, currentScore + score);
  }

  /**
   * Add reason to an action
   */
  private addReason(reasons: Map<string, string[]>, actionId: string, reason: string): void {
    const currentReasons = reasons.get(actionId) || [];
    currentReasons.push(reason);
    reasons.set(actionId, currentReasons);
  }

  /**
   * Score action by context
   */
  private scoreByContext(action: string, context: MappingContext): number {
    let score = 0;
    
    // Score based on action name matching context
    if (action && context.flow_purpose) {
      const actionLower = action.toLowerCase();
      const purposeLower = context.flow_purpose.toLowerCase();
      
      if (actionLower.includes(purposeLower) || purposeLower.includes(actionLower)) {
        score += 0.3;
      }
    }
    
    // Score based on action requirements (if available)
    if (action && (context as any).action_requirements) {
      const matches = (context as any).action_requirements.filter((req: string) => 
        action.toLowerCase().includes(req.toLowerCase())
      );
      score += matches.length * 0.1;
    }
    
    return score;
  }

  /**
   * Initialize mapping tables
   */
  private initializeMappings(): void {
    // Verb mappings
    this.verbMappings.set('send', ['notify', 'email', 'message', 'alert']);
    this.verbMappings.set('create', ['add', 'insert', 'new', 'generate']);
    this.verbMappings.set('update', ['modify', 'change', 'edit', 'set']);
    this.verbMappings.set('delete', ['remove', 'destroy', 'erase']);
    this.verbMappings.set('notify', ['send', 'alert', 'email']);
    this.verbMappings.set('approve', ['authorization', 'review']);
    this.verbMappings.set('wait', ['delay', 'pause', 'timer']);
    this.verbMappings.set('execute', ['run', 'script', 'custom']);
    this.verbMappings.set('log', ['audit', 'track', 'record']);
    this.verbMappings.set('check', ['validate', 'test', 'condition']);
    
    // Object mappings
    this.objectMappings.set('email', ['notification', 'message', 'mail']);
    this.objectMappings.set('record', ['entry', 'row', 'item']);
    this.objectMappings.set('task', ['job', 'work', 'activity']);
    this.objectMappings.set('field', ['column', 'attribute', 'property']);
    this.objectMappings.set('user', ['person', 'individual', 'account']);
    this.objectMappings.set('approval', ['authorization', 'permission']);
    
    // Context mappings
    this.contextMappings.set('manager', ['supervisor', 'lead', 'director']);
    this.contextMappings.set('admin', ['administrator', 'sysadmin', 'system']);
    this.contextMappings.set('high', ['critical', 'urgent', 'important']);
    this.contextMappings.set('low', ['minor', 'trivial', 'routine']);
  }
}
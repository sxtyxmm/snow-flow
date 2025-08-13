/**
 * Smart Field Fetcher for ServiceNow Artifacts
 * 
 * Intelligently fetches large artifacts by splitting fields into chunks
 * while maintaining context relationships between fields.
 */

import { ServiceNowClient } from './servicenow-client';

export interface FetchStrategy {
  table: string;
  sys_id: string;
  primaryFields: string[];  // Always fetch these first (name, title, etc.)
  contentFields: string[];  // Large fields to fetch individually
  contextHint?: string;     // Hint for Claude about field relationships
}

export interface FieldGroup {
  groupName: string;
  fields: string[];
  description: string;
  maxTokens?: number;
}

// Widget field groups with relationship context
const WIDGET_FIELD_GROUPS: FieldGroup[] = [
  {
    groupName: 'metadata',
    fields: ['sys_id', 'name', 'title', 'id', 'sys_created_on', 'sys_updated_on'],
    description: 'Basic widget identification and metadata',
    maxTokens: 1000
  },
  {
    groupName: 'template',
    fields: ['template'],
    description: 'HTML template - defines UI structure and Angular bindings (ng-click, {{data.x}})',
    maxTokens: 10000
  },
  {
    groupName: 'server_script',
    fields: ['script'],  // Note: 'script' is the actual field name, not 'server_script'
    description: 'Server-side script (ES5 only) - initializes data object and handles input.action requests',
    maxTokens: 10000
  },
  {
    groupName: 'client_script',
    fields: ['client_script'],
    description: 'Client-side AngularJS controller - implements methods called by template ng-click and calls c.server.get()',
    maxTokens: 10000
  },
  {
    groupName: 'styling',
    fields: ['css'],
    description: 'Widget-specific CSS styles - classes used in template',
    maxTokens: 5000
  },
  {
    groupName: 'configuration',
    fields: ['option_schema', 'data_table', 'demo_data', 'public'],
    description: 'Widget configuration options and settings',
    maxTokens: 3000
  }
];

// Flow field groups
const FLOW_FIELD_GROUPS: FieldGroup[] = [
  {
    groupName: 'metadata',
    fields: ['sys_id', 'name', 'label', 'description', 'active'],
    description: 'Flow identification and basic info',
    maxTokens: 1000
  },
  {
    groupName: 'definition',
    fields: ['definition'],
    description: 'Complete flow definition JSON - contains all steps, actions, and conditions',
    maxTokens: 20000
  },
  {
    groupName: 'configuration',
    fields: ['trigger_type', 'trigger_condition', 'run_as'],
    description: 'Flow trigger and execution configuration',
    maxTokens: 2000
  }
];

// Business Rule field groups
const BUSINESS_RULE_FIELD_GROUPS: FieldGroup[] = [
  {
    groupName: 'metadata',
    fields: ['sys_id', 'name', 'collection', 'active', 'order'],
    description: 'Business rule identification and table',
    maxTokens: 1000
  },
  {
    groupName: 'conditions',
    fields: ['when', 'condition', 'filter_condition'],
    description: 'When rule runs and filter conditions',
    maxTokens: 2000
  },
  {
    groupName: 'script',
    fields: ['script'],
    description: 'Business rule script (ES5) - current, previous, gs available',
    maxTokens: 10000
  },
  {
    groupName: 'advanced',
    fields: ['advanced', 'role_conditions', 'abort_action'],
    description: 'Advanced configuration and actions',
    maxTokens: 2000
  }
];

export class SmartFieldFetcher {
  private client: ServiceNowClient;
  
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Intelligently fetch widget fields with context preservation
   */
  async fetchWidget(sys_id: string): Promise<any> {
    console.log(`\n🔍 Smart fetching widget: ${sys_id}`);
    
    const results: any = {
      _fetch_strategy: 'smart_chunked',
      _context_hint: 'Widget fields fetched separately but are interconnected: template references {{data.x}} from server script, calls methods from client script, and uses CSS classes',
      _field_groups: {}
    };

    // Fetch each field group
    for (const group of WIDGET_FIELD_GROUPS) {
      console.log(`📦 Fetching ${group.groupName}: ${group.description}`);
      
      try {
        const response = await this.client.query('sp_widget', {
          query: `sys_id=${sys_id}`,
          fields: group.fields,
          limit: 1
        });
        
        if (response.result?.[0]) {
          results._field_groups[group.groupName] = {
            data: response.result[0],
            description: group.description,
            fields: group.fields
          };
          
          // Add to flat structure for easy access
          Object.assign(results, response.result[0]);
        }
      } catch (error: any) {
        console.log(`⚠️ Failed to fetch ${group.groupName}: ${error.message}`);
        
        // If group fails due to size, fetch fields individually
        if (error.message?.includes('exceeds maximum allowed tokens')) {
          results._field_groups[group.groupName] = await this.fetchFieldsIndividually(
            'sp_widget',
            sys_id,
            group.fields,
            group.description
          );
        }
      }
    }
    
    // Add coherence validation hints
    results._coherence_hints = this.generateCoherenceHints(results);
    
    return results;
  }

  /**
   * Fetch flow with intelligent chunking
   */
  async fetchFlow(sys_id: string): Promise<any> {
    console.log(`\n🔍 Smart fetching flow: ${sys_id}`);
    
    const results: any = {
      _fetch_strategy: 'smart_chunked',
      _context_hint: 'Flow definition contains JSON with all steps and actions - may be very large',
      _field_groups: {}
    };

    for (const group of FLOW_FIELD_GROUPS) {
      console.log(`📦 Fetching ${group.groupName}: ${group.description}`);
      
      try {
        const response = await this.client.query('sys_hub_flow', {
          query: `sys_id=${sys_id}`,
          fields: group.fields,
          limit: 1
        });
        
        if (response.result?.[0]) {
          results._field_groups[group.groupName] = {
            data: response.result[0],
            description: group.description
          };
          Object.assign(results, response.result[0]);
        }
      } catch (error: any) {
        if (error.message?.includes('exceeds maximum allowed tokens')) {
          results._field_groups[group.groupName] = await this.fetchFieldsIndividually(
            'sys_hub_flow',
            sys_id,
            group.fields,
            group.description
          );
        }
      }
    }
    
    return results;
  }

  /**
   * Fetch business rule with intelligent chunking
   */
  async fetchBusinessRule(sys_id: string): Promise<any> {
    console.log(`\n🔍 Smart fetching business rule: ${sys_id}`);
    
    const results: any = {
      _fetch_strategy: 'smart_chunked',
      _context_hint: 'Business rule script runs in context of current record with access to current, previous, gs',
      _field_groups: {}
    };

    for (const group of BUSINESS_RULE_FIELD_GROUPS) {
      console.log(`📦 Fetching ${group.groupName}: ${group.description}`);
      
      try {
        const response = await this.client.query('sys_script', {
          query: `sys_id=${sys_id}`,
          fields: group.fields,
          limit: 1
        });
        
        if (response.result?.[0]) {
          results._field_groups[group.groupName] = {
            data: response.result[0],
            description: group.description
          };
          Object.assign(results, response.result[0]);
        }
      } catch (error: any) {
        if (error.message?.includes('exceeds maximum allowed tokens')) {
          results._field_groups[group.groupName] = await this.fetchFieldsIndividually(
            'sys_script',
            sys_id,
            group.fields,
            group.description
          );
        }
      }
    }
    
    return results;
  }

  /**
   * Fetch fields one by one when group is too large
   */
  private async fetchFieldsIndividually(
    table: string,
    sys_id: string,
    fields: string[],
    groupDescription: string
  ): Promise<any> {
    console.log(`  ↪️ Group too large, fetching fields individually...`);
    
    const result: any = {
      data: {},
      description: groupDescription,
      _fetched_individually: true,
      _field_status: {}
    };
    
    for (const field of fields) {
      try {
        console.log(`    📄 Fetching field: ${field}`);
        const response = await this.client.query(table, {
          query: `sys_id=${sys_id}`,
          fields: [field],
          limit: 1
        });
        
        if (response.result?.[0]) {
          result.data[field] = response.result[0][field];
          result._field_status[field] = 'success';
        }
      } catch (fieldError: any) {
        console.log(`      ⚠️ Field ${field} failed: ${fieldError.message}`);
        result._field_status[field] = 'failed';
        result.data[field] = `[Error: Field too large or inaccessible]`;
      }
    }
    
    return result;
  }

  /**
   * Generate coherence hints for widget validation
   */
  private generateCoherenceHints(widget: any): string[] {
    const hints: string[] = [];
    
    // Check template references
    if (widget.template) {
      const dataRefs = widget.template.match(/\{\{data\.(\w+)\}\}/g) || [];
      const methodRefs = widget.template.match(/ng-click="(\w+)\(/g) || [];
      
      if (dataRefs.length > 0) {
        hints.push(`Template references data properties: ${dataRefs.join(', ')}`);
      }
      if (methodRefs.length > 0) {
        hints.push(`Template calls methods: ${methodRefs.join(', ')}`);
      }
    }
    
    // Check server script data initialization
    if (widget.script) {
      const dataInits = widget.script.match(/data\.(\w+)\s*=/g) || [];
      if (dataInits.length > 0) {
        hints.push(`Server script initializes: ${dataInits.join(', ')}`);
      }
    }
    
    // Check client script methods
    if (widget.client_script) {
      const scopeMethods = widget.client_script.match(/\$scope\.(\w+)\s*=/g) || [];
      const serverCalls = widget.client_script.match(/c\.server\.get\(\{action:\s*['"](\w+)['"]/g) || [];
      
      if (scopeMethods.length > 0) {
        hints.push(`Client script implements: ${scopeMethods.join(', ')}`);
      }
      if (serverCalls.length > 0) {
        hints.push(`Client calls server actions: ${serverCalls.join(', ')}`);
      }
    }
    
    return hints;
  }

  /**
   * Search within fields using GlideRecord queries
   */
  async searchInField(
    table: string,
    field: string,
    searchTerm: string,
    additionalQuery?: string
  ): Promise<any[]> {
    console.log(`\n🔎 Searching in ${table}.${field} for: ${searchTerm}`);
    
    // Use CONTAINS operator for field search
    const query = `${field}CONTAINS${searchTerm}${additionalQuery ? '^' + additionalQuery : ''}`;
    
    try {
      const response = await this.client.query(table, {
        query: query,
        fields: ['sys_id', 'name', field.substring(0, 50)], // Get preview of field
        limit: 10
      });
      
      console.log(`  ✅ Found ${response.result?.length || 0} matches`);
      return response.result || [];
    } catch (error) {
      console.log(`  ⚠️ Search failed: ${error}`);
      return [];
    }
  }

  /**
   * Get smart fetch strategy based on table
   */
  getFieldGroups(table: string): FieldGroup[] {
    switch (table) {
      case 'sp_widget':
        return WIDGET_FIELD_GROUPS;
      case 'sys_hub_flow':
        return FLOW_FIELD_GROUPS;
      case 'sys_script':
        return BUSINESS_RULE_FIELD_GROUPS;
      default:
        // Generic strategy for unknown tables
        return [
          {
            groupName: 'metadata',
            fields: ['sys_id', 'name', 'sys_created_on', 'sys_updated_on'],
            description: 'Basic record information',
            maxTokens: 1000
          },
          {
            groupName: 'content',
            fields: ['*'], // Fetch all other fields
            description: 'Record content',
            maxTokens: 20000
          }
        ];
    }
  }
}

/**
 * Helper function to create fetch strategy hint for Claude
 */
export function createFetchStrategyHint(table: string, sys_id: string): string {
  return `
🔍 SMART FETCH STRATEGY for ${table} (${sys_id}):

When the artifact is too large (>25000 tokens), I'll fetch fields in intelligent groups:
1. First fetch metadata (name, title, sys_id)
2. Then fetch each content field separately (template, script, client_script, css)
3. Maintain context: These fields work together!
   - Template HTML references {{data.x}} from server script
   - Template ng-click calls methods from client script  
   - CSS classes are used in template
   - Server script handles input.action from client script

This ensures you get ALL necessary fields while respecting token limits.
The fields are fetched separately but represent ONE cohesive widget.
`;
}
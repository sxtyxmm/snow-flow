/**
 * Smart Field Fetcher for ServiceNow Artifacts
 * 
 * Intelligently fetches large artifacts by splitting fields into chunks
 * while maintaining context relationships between fields.
 */

import { ServiceNowClient } from './servicenow-client.js';
import { 
  ARTIFACT_REGISTRY,
  ArtifactTypeConfig,
  getArtifactConfig
} from './artifact-sync/artifact-registry.js';

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

// Widget field groups with relationship context - 20K per field for better context
const WIDGET_FIELD_GROUPS: FieldGroup[] = [
  {
    groupName: 'metadata',
    fields: ['sys_id', 'name', 'title', 'id', 'sys_created_on', 'sys_updated_on', 'sys_scope'],
    description: 'Basic widget identification and metadata',
    maxTokens: 2000
  },
  {
    groupName: 'template',
    fields: ['template'],
    description: 'HTML template - defines UI structure and Angular bindings (ng-click, {{data.x}})',
    maxTokens: 20000  // Increased to 20K
  },
  {
    groupName: 'server_script',
    fields: ['script'],  // Note: 'script' is the actual field name, not 'server_script'
    description: 'Server-side script (ES5 only) - initializes data object and handles input.action requests',
    maxTokens: 20000  // Increased to 20K
  },
  {
    groupName: 'client_script',
    fields: ['client_script'],
    description: 'Client-side AngularJS controller - implements methods called by template ng-click and calls c.server.get()',
    maxTokens: 20000  // Increased to 20K
  },
  {
    groupName: 'styling',
    fields: ['css'],
    description: 'Widget-specific CSS styles - classes used in template',
    maxTokens: 20000  // Increased to 20K
  },
  {
    groupName: 'configuration',
    fields: ['option_schema', 'data_table', 'demo_data', 'public', 'roles'],
    description: 'Widget configuration options, data sources and access control',
    maxTokens: 10000  // Increased for better config context
  },
  {
    groupName: 'dependencies',
    fields: ['dependencies', 'link'],
    description: 'Widget dependencies and Angular providers required',
    maxTokens: 5000
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
   * DYNAMIC fetch any artifact using registry configuration
   */
  async fetchArtifact(table: string, sys_id: string): Promise<any> {
    console.log(`\n🔍 Smart fetching ${table}: ${sys_id}`);
    
    const fieldGroups = this.getFieldGroups(table);
    const config = getArtifactConfig(table);
    
    const results: any = {
      _fetch_strategy: 'smart_chunked',
      _context_hint: config ? `${config.displayName} - fields fetched in groups to respect token limits` : 'Fields fetched separately but are related',
      _field_groups: {}
    };

    // Fetch each field group
    for (const group of fieldGroups) {
      console.log(`📦 Fetching ${group.groupName}: ${group.description}`);
      
      try {
        const response = await this.client.getRecord(table, sys_id);
        
        if (response) {
          results._field_groups[group.groupName] = {
            data: response,
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
            table,
            sys_id,
            group.fields,
            group.description
          );
        }
      }
    }
    
    // Add coherence validation hints if it's a widget
    if (table === 'sp_widget') {
      results._coherence_hints = this.generateCoherenceHints(results);
    }
    
    return results;
  }

  /**
   * Intelligently fetch widget fields with context preservation
   * (Wrapper for backward compatibility)
   */
  async fetchWidget(sys_id: string): Promise<any> {
    console.log(`\n🔍 Smart fetching widget: ${sys_id}`);
    
    const results: any = {
      _fetch_strategy: 'smart_chunked',
      _context_hint: 'Widget fields fetched separately but are interconnected: template references {{data.x}} from server script, calls methods from client script, and uses CSS classes',
      _field_groups: {}
    };

    // Try to fetch all fields first, then fall back to individual fields if too large
    console.log(`📦 Attempting to fetch complete widget data...`);
    
    try {
      // Try to get all fields at once
      const response = await this.client.searchRecords('sp_widget', `sys_id=${sys_id}`, 1);
      
      if (response && response.result && response.result.length > 0) {
        const widgetData = response.result[0];
        console.log(`✅ Successfully fetched complete widget`);
        
        // Organize into field groups for better context
        for (const group of WIDGET_FIELD_GROUPS) {
          const groupData: any = {};
          for (const fieldName of group.fields) {
            if (widgetData[fieldName] !== undefined) {
              groupData[fieldName] = widgetData[fieldName];
            }
          }
          
          results._field_groups[group.groupName] = {
            data: groupData,
            description: group.description,
            fields: group.fields
          };
        }
        
        // Add complete widget data to flat structure
        Object.assign(results, widgetData);
      } else {
        throw new Error('Widget not found');
      }
    } catch (error: any) {
      console.log(`⚠️ Complete fetch failed: ${error.message}`);
      console.log(`🔄 Switching to field-by-field fetching...`);
      
      // Fall back to fetching fields per group or individually
      for (const group of WIDGET_FIELD_GROUPS) {
        console.log(`📦 Fetching ${group.groupName}: ${group.description}`);
        
        try {
          // Try to fetch all fields in this group at once
          const groupResponse = await this.client.searchRecordsWithFields(
            'sp_widget',
            `sys_id=${sys_id}`,
            group.fields,
            1
          );
          
          if (groupResponse && groupResponse.success && groupResponse.data && groupResponse.data.result && groupResponse.data.result.length > 0) {
            const groupData = groupResponse.data.result[0];
            console.log(`  ✅ Successfully fetched ${group.groupName}`);
            
            results._field_groups[group.groupName] = {
              data: groupData,
              description: group.description,
              fields: group.fields
            };
            
            // Add to flat structure
            Object.assign(results, groupData);
          } else {
            throw new Error('No data returned for group');
          }
        } catch (groupError: any) {
          console.log(`  ⚠️ Group ${group.groupName} failed, fetching fields individually...`);
          
          // If group fails, fetch fields one by one
          const groupData: any = {};
          for (const fieldName of group.fields) {
            console.log(`    📄 Fetching field: ${fieldName}`);
            
            try {
              // Fetch just this single field
              const fieldResponse = await this.client.searchRecordsWithFields(
                'sp_widget',
                `sys_id=${sys_id}`,
                [fieldName],
                1
              );
              
              if (fieldResponse && fieldResponse.success && fieldResponse.data && fieldResponse.data.result && fieldResponse.data.result.length > 0) {
                const fieldValue = fieldResponse.data.result[0][fieldName];
                if (fieldValue !== undefined && fieldValue !== null) {
                  groupData[fieldName] = fieldValue;
                  results[fieldName] = fieldValue; // Also add to flat structure
                  console.log(`      ✅ Got ${fieldName} (${typeof fieldValue === 'string' ? fieldValue.length : 0} chars)`);
                } else {
                  groupData[fieldName] = '';
                  console.log(`      ⚠️ ${fieldName} is empty`);
                }
              }
            } catch (fieldError: any) {
              console.log(`      ❌ Failed to fetch ${fieldName}: ${fieldError.message}`);
              groupData[fieldName] = ''; // Empty string for failed fields
            }
          }
          
          results._field_groups[group.groupName] = {
            data: groupData,
            description: group.description,
            fields: group.fields,
            _fetched_individually: true
          };
        }
      }
      
      // Make sure we have at least the sys_id
      if (!results.sys_id) {
        results.sys_id = sys_id;
      }
    }
    
    // Add coherence validation hints
    results._coherence_hints = this.generateCoherenceHints(results);
    
    return results;
  }

  /**
   * Fetch flow with intelligent chunking
   * (Wrapper for backward compatibility)
   */
  async fetchFlow(sys_id: string): Promise<any> {
    return this.fetchArtifact('sys_hub_flow', sys_id);
  }

  /**
   * Fetch business rule with intelligent chunking
   * (Wrapper for backward compatibility)
   */
  async fetchBusinessRule(sys_id: string): Promise<any> {
    return this.fetchArtifact('sys_script', sys_id);
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
        const response = await this.client.getRecord(table, sys_id);
        
        if (response) {
          result.data[field] = response[field];
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
      const response = await this.client.searchRecords(table, query, 10);
      
      console.log(`  ✅ Found ${response.result?.length || 0} matches`);
      return response.result || [];
    } catch (error) {
      console.log(`  ⚠️ Search failed: ${error}`);
      return [];
    }
  }

  /**
   * Get smart fetch strategy based on table - NOW USES ARTIFACT REGISTRY!
   */
  getFieldGroups(table: string): FieldGroup[] {
    // First check if we have specific groups defined
    switch (table) {
      case 'sp_widget':
        return WIDGET_FIELD_GROUPS;
      case 'sys_hub_flow':
        return FLOW_FIELD_GROUPS;
      case 'sys_script':
        return BUSINESS_RULE_FIELD_GROUPS;
    }
    
    // Try to get from artifact registry
    const config = getArtifactConfig(table);
    if (config) {
      return this.createFieldGroupsFromRegistry(config);
    }
    
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

  /**
   * Create field groups from artifact registry configuration
   */
  private createFieldGroupsFromRegistry(config: ArtifactTypeConfig): FieldGroup[] {
    const groups: FieldGroup[] = [];
    
    // Group 1: Metadata fields
    const metadataFields = ['sys_id', 'sys_created_on', 'sys_updated_on', config.identifierField];
    groups.push({
      groupName: 'metadata',
      fields: [...new Set(metadataFields)], // Remove duplicates
      description: `${config.displayName} metadata`,
      maxTokens: 2000
    });
    
    // Group 2-N: Each field mapping as its own group if large
    for (const mapping of config.fieldMappings) {
      if (mapping.maxTokens > 5000) {
        // Large field gets its own group
        groups.push({
          groupName: mapping.serviceNowField,
          fields: [mapping.serviceNowField],
          description: mapping.description,
          maxTokens: mapping.maxTokens
        });
      }
    }
    
    // Group N+1: Small fields together
    const smallFields = config.fieldMappings
      .filter(m => m.maxTokens <= 5000)
      .map(m => m.serviceNowField);
    
    if (smallFields.length > 0) {
      groups.push({
        groupName: 'configuration',
        fields: smallFields,
        description: `${config.displayName} configuration`,
        maxTokens: 10000
      });
    }
    
    return groups;
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
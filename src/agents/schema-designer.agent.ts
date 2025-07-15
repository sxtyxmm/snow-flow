import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowTable, ServiceNowField } from '../types/servicenow-studio.types';
import logger from '../utils/logger';

export class SchemaDesignerAgent extends BaseAppAgent {
  constructor(client: any) {
    super('schema-designer', client, [
      'database-design',
      'table-creation',
      'field-management',
      'relationships',
      'indexing',
      'performance-optimization'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      tables: [] as ServiceNowTable[],
      fields: [] as ServiceNowField[],
      relationships: [] as any[],
      indexes: [] as any[],
      choices: [] as any[]
    };

    try {
      // Generate tables
      if (request.requirements.tables) {
        for (const tableReq of request.requirements.tables) {
          const table = await this.generateTable(tableReq, request);
          results.tables.push(table);

          // Generate fields for this table
          const fields = await this.generateFields(tableReq, request);
          results.fields.push(...fields);

          // Generate choice lists if needed
          const choices = await this.generateChoiceLists(tableReq, request);
          results.choices.push(...choices);
        }

        // Generate relationships between tables
        const relationships = await this.generateRelationships(request.requirements.tables, request);
        results.relationships.push(...relationships);

        // Generate indexes for performance
        const indexes = await this.generateIndexes(request.requirements.tables, request);
        results.indexes.push(...indexes);
      }

      logger.info(`Schema design completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('Schema design failed', error);
      throw error;
    }
  }

  private async generateTable(tableReq: any, request: AppGenerationRequest): Promise<ServiceNowTable> {
    const prompt = `Design a ServiceNow table for:

Application: ${request.appName}
Table Name: ${tableReq.name}
Table Label: ${tableReq.label}
Description: ${tableReq.description || ''}
Extends: ${tableReq.extendsTable || 'task'}
Fields: ${JSON.stringify(tableReq.fields, null, 2)}
Access Controls: ${tableReq.accessControls?.join(', ') || 'standard'}

Analyze the requirements and design a table that:
1. Follows ServiceNow best practices
2. Implements proper inheritance
3. Includes necessary system fields
4. Optimizes for performance
5. Supports scalability
6. Follows naming conventions
7. Includes proper access controls
8. Supports reporting needs

Return JSON with complete table configuration including technical specifications.`;

    const response = await this.callClaude(prompt);
    const tableData = JSON.parse(response);

    const tableName = this.validateServiceNowName(tableReq.name);
    
    return {
      sys_id: this.generateUniqueId('table_'),
      name: tableName,
      label: tableReq.label,
      extends_table: tableReq.extendsTable || 'task',
      is_extendable: tableData.isExtendable || false,
      number_ref: tableData.numberRef || '',
      sys_class_name: 'sys_db_object',
      access: tableData.access || 'public',
      read_access: tableData.readAccess !== false,
      create_access: tableData.createAccess !== false,
      update_access: tableData.updateAccess !== false,
      delete_access: tableData.deleteAccess !== false,
      ws_access: tableData.wsAccess !== false,
      caller_access: tableData.callerAccess || '',
      super_class: tableData.superClass || '',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateFields(tableReq: any, request: AppGenerationRequest): Promise<ServiceNowField[]> {
    const fields: ServiceNowField[] = [];

    for (const fieldReq of tableReq.fields) {
      const prompt = `Design a ServiceNow field for:

Table: ${tableReq.name}
Field Name: ${fieldReq.name}
Field Label: ${fieldReq.label}
Type: ${fieldReq.type}
Description: ${fieldReq.description || ''}
Max Length: ${fieldReq.maxLength || 'default'}
Mandatory: ${fieldReq.mandatory || false}
Read Only: ${fieldReq.readonly || false}
Default Value: ${fieldReq.defaultValue || ''}
Reference Table: ${fieldReq.reference || ''}
Choices: ${fieldReq.choices?.join(', ') || 'none'}

Design a field that:
1. Uses appropriate ServiceNow field types
2. Implements proper validation
3. Optimizes for performance
4. Supports reporting
5. Follows naming conventions
6. Includes proper indexing
7. Supports localization
8. Maintains data integrity

Return JSON with complete field configuration.`;

      const response = await this.callClaude(prompt);
      const fieldData = JSON.parse(response);

      const fieldName = this.validateServiceNowName(fieldReq.name);
      
      const field: ServiceNowField = {
        sys_id: this.generateUniqueId('field_'),
        element: fieldName,
        column_label: fieldReq.label,
        internal_type: this.mapFieldType(fieldReq.type),
        max_length: fieldReq.maxLength || this.getDefaultMaxLength(fieldReq.type),
        reference: fieldReq.reference || '',
        reference_qual: fieldData.referenceQual || '',
        reference_cascade_rule: fieldData.referenceCascadeRule || '',
        choice: fieldReq.choices ? '1' : '0',
        default_value: fieldReq.defaultValue || '',
        mandatory: fieldReq.mandatory || false,
        read_only: fieldReq.readonly || false,
        display: fieldData.display !== false,
        active: true,
        array: fieldData.array || false,
        audit: fieldData.audit || false,
        calculated: fieldData.calculated || false,
        spell_check: fieldData.spellCheck || false,
        unique: fieldData.unique || false,
        virtual: fieldData.virtual || false,
        sys_package: request.appScope,
        sys_scope: request.appScope,
        table: tableReq.name
      };

      fields.push(field);
    }

    return fields;
  }

  private async generateChoiceLists(tableReq: any, request: AppGenerationRequest): Promise<any[]> {
    const choices: any[] = [];

    for (const fieldReq of tableReq.fields) {
      if (fieldReq.choices && fieldReq.choices.length > 0) {
        const prompt = `Generate choice list for ServiceNow field:

Table: ${tableReq.name}
Field: ${fieldReq.name}
Choices: ${fieldReq.choices.join(', ')}

Generate choice list that:
1. Follows ServiceNow choice conventions
2. Includes proper values and labels
3. Supports internationalization
4. Maintains data integrity
5. Provides user-friendly labels
6. Includes logical ordering
7. Supports future expansion

Return JSON with complete choice list configuration.`;

        const response = await this.callClaude(prompt);
        const choiceData = JSON.parse(response);

        for (let i = 0; i < fieldReq.choices.length; i++) {
          const choice = {
            sys_id: this.generateUniqueId('choice_'),
            table: tableReq.name,
            element: fieldReq.name,
            value: choiceData.values[i] || fieldReq.choices[i],
            label: choiceData.labels[i] || fieldReq.choices[i],
            sequence: (i + 1) * 10,
            inactive: false,
            sys_package: request.appScope,
            sys_scope: request.appScope
          };
          choices.push(choice);
        }
      }
    }

    return choices;
  }

  private async generateRelationships(tables: any[], request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Analyze and generate relationships between ServiceNow tables:

Tables: ${JSON.stringify(tables.map(t => ({ name: t.name, fields: t.fields })), null, 2)}

Generate relationships that:
1. Implement proper foreign key relationships
2. Support data integrity
3. Optimize query performance
4. Enable proper reporting
5. Support cascading rules
6. Maintain referential integrity
7. Follow ServiceNow relationship patterns

Return JSON with relationship configurations including reference fields and cascade rules.`;

    const response = await this.callClaude(prompt);
    const relationshipData = JSON.parse(response);

    return relationshipData.relationships || [];
  }

  private async generateIndexes(tables: any[], request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate database indexes for ServiceNow tables:

Tables: ${JSON.stringify(tables.map(t => ({ name: t.name, fields: t.fields })), null, 2)}

Generate indexes that:
1. Optimize query performance
2. Support common search patterns
3. Improve reporting speed
4. Balance performance vs. storage
5. Follow ServiceNow indexing best practices
6. Support composite indexes where needed
7. Consider maintenance overhead

Return JSON with index configurations.`;

    const response = await this.callClaude(prompt);
    const indexData = JSON.parse(response);

    return indexData.indexes || [];
  }

  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'string',
      'number': 'integer',
      'integer': 'integer',
      'decimal': 'decimal',
      'float': 'float',
      'boolean': 'boolean',
      'date': 'glide_date',
      'datetime': 'glide_date_time',
      'time': 'glide_time',
      'duration': 'glide_duration',
      'email': 'email',
      'url': 'url',
      'phone': 'phone_number',
      'currency': 'currency',
      'percent': 'percent_complete',
      'reference': 'reference',
      'choice': 'choice',
      'journal': 'journal',
      'html': 'html',
      'xml': 'xml',
      'json': 'json',
      'encrypted': 'encrypted_text',
      'password': 'password2'
    };

    return typeMap[type.toLowerCase()] || 'string';
  }

  private getDefaultMaxLength(type: string): number {
    const lengthMap: Record<string, number> = {
      'string': 255,
      'text': 4000,
      'email': 100,
      'url': 255,
      'phone': 40,
      'number': 15,
      'integer': 15,
      'decimal': 15,
      'float': 15
    };

    return lengthMap[type.toLowerCase()] || 255;
  }

  async analyzeDataModel(request: AppGenerationRequest): Promise<any> {
    const prompt = `Analyze the data model for ServiceNow application:

Application: ${request.appName}
Requirements: ${JSON.stringify(request.requirements, null, 2)}

Provide comprehensive analysis including:
1. Data model optimization recommendations
2. Performance considerations
3. Scalability analysis
4. Security recommendations
5. Integration points
6. Reporting requirements
7. Maintenance considerations

Return JSON with detailed analysis and recommendations.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async validateSchema(schema: any): Promise<any> {
    const prompt = `Validate this ServiceNow schema design:

Schema: ${JSON.stringify(schema, null, 2)}

Validate for:
1. ServiceNow best practices
2. Naming conventions
3. Field type appropriateness
4. Relationship integrity
5. Performance implications
6. Security considerations
7. Scalability issues

Return JSON with validation results including errors, warnings, and suggestions.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async optimizeSchema(schema: any): Promise<any> {
    const prompt = `Optimize this ServiceNow schema for performance:

Schema: ${JSON.stringify(schema, null, 2)}

Optimize for:
1. Query performance
2. Storage efficiency
3. Index optimization
4. Relationship efficiency
5. Memory usage
6. Network traffic
7. Reporting speed

Return JSON with optimized schema configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }
}
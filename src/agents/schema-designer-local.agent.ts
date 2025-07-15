import { BaseAppAgentLocal } from './base-app-agent-local';
import { AppGenerationRequest, ServiceNowTable, ServiceNowField } from '../types/servicenow-studio.types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

/**
 * Schema Designer Agent - Template-based generation
 * Generates ServiceNow tables and fields without AI API costs
 */
export class SchemaDesignerLocalAgent extends BaseAppAgentLocal {
  constructor(client: any) {
    super('schema-designer', client, [
      'table-creation',
      'field-definition',
      'relationship-mapping',
      'index-optimization',
      'data-dictionary'
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
      // Generate tables using templates instead of AI
      if (request.requirements.tables) {
        for (const tableReq of request.requirements.tables) {
          const table = this.generateTableFromTemplate(tableReq, request);
          results.tables.push(table);

          // Generate fields for this table
          const fields = this.generateFieldsFromTemplate(tableReq, request);
          results.fields.push(...fields);

          // Generate choice lists if needed
          const choices = this.generateChoiceListsFromTemplate(tableReq, request);
          results.choices.push(...choices);
        }

        // Generate relationships between tables
        const relationships = this.generateRelationshipsFromTemplate(request.requirements.tables);
        results.relationships.push(...relationships);

        // Generate indexes for performance
        const indexes = this.generateIndexesFromTemplate(request.requirements.tables);
        results.indexes.push(...indexes);
      }

      logger.info(`Schema Designer generated ${results.tables.length} tables and ${results.fields.length} fields`);
      return results;

    } catch (error) {
      logger.error('Schema Designer error:', error);
      throw error;
    }
  }

  private generateTableFromTemplate(tableReq: any, request: AppGenerationRequest): ServiceNowTable {
    const tableId = uuidv4();
    
    return {
      sys_id: tableId,
      name: tableReq.name,
      label: tableReq.label,
      extends_table: tableReq.extendsTable || 'task',
      is_extendable: true,
      sys_class_name: 'sys_db_object',
      access: 'public',
      read_access: true,
      create_access: true,
      update_access: true,
      delete_access: true,
      ws_access: true,
      caller_access: '',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private generateFieldsFromTemplate(tableReq: any, request: AppGenerationRequest): ServiceNowField[] {
    const fields: ServiceNowField[] = [];

    for (const fieldReq of tableReq.fields) {
      const field: ServiceNowField = {
        sys_id: uuidv4(),
        element: fieldReq.name,
        column_label: fieldReq.label,
        internal_type: this.mapFieldType(fieldReq.type),
        max_length: fieldReq.maxLength || this.getDefaultMaxLength(fieldReq.type),
        reference: fieldReq.reference || '',
        reference_qual: fieldReq.referenceQual || '',
        default_value: fieldReq.defaultValue || '',
        mandatory: fieldReq.mandatory || false,
        read_only: fieldReq.readonly || false,
        display: true,
        active: true,
        array: false,
        audit: false,
        calculated: false,
        spell_check: false,
        unique: false,
        virtual: false,
        sys_package: request.appScope,
        sys_scope: request.appScope,
        table: tableReq.name
      };

      fields.push(field);
    }

    return fields;
  }

  private generateChoiceListsFromTemplate(tableReq: any, request: AppGenerationRequest): any[] {
    const choices: any[] = [];

    for (const fieldReq of tableReq.fields) {
      if (fieldReq.type === 'choice' && fieldReq.choices) {
        for (const [index, choice] of fieldReq.choices.entries()) {
          choices.push({
            sys_id: uuidv4(),
            table: tableReq.name,
            element: fieldReq.name,
            label: choice,
            value: choice.toLowerCase().replace(/\s+/g, '_'),
            sequence: index * 10,
            inactive: false,
            sys_package: request.appScope,
            sys_scope: request.appScope
          });
        }
      }
    }

    return choices;
  }

  private generateRelationshipsFromTemplate(tables: any[]): any[] {
    const relationships: any[] = [];

    // Generate relationships based on reference fields
    for (const table of tables) {
      for (const field of table.fields) {
        if (field.type === 'reference' && field.reference) {
          relationships.push({
            sys_id: uuidv4(),
            parent_table: field.reference,
            child_table: table.name,
            field_name: field.name,
            type: 'many_to_one',
            cascade_rule: 'none'
          });
        }
      }
    }

    return relationships;
  }

  private generateIndexesFromTemplate(tables: any[]): any[] {
    const indexes: any[] = [];

    // Generate indexes for common patterns
    for (const table of tables) {
      // Index on commonly searched fields
      const indexFields = table.fields.filter((f: any) => 
        f.type === 'string' && f.name.includes('number') ||
        f.type === 'reference' ||
        f.name === 'state' ||
        f.name === 'status'
      );

      for (const field of indexFields) {
        indexes.push({
          sys_id: uuidv4(),
          table: table.name,
          name: `idx_${table.name}_${field.name}`,
          fields: [field.name],
          unique: false,
          type: 'btree'
        });
      }
    }

    return indexes;
  }

  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'text': 'string',
      'number': 'integer',
      'date': 'glide_date',
      'datetime': 'glide_date_time',
      'boolean': 'boolean',
      'choice': 'choice',
      'reference': 'reference',
      'email': 'email',
      'url': 'url',
      'phone': 'phone_number',
      'percent': 'percent_complete',
      'currency': 'currency',
      'json': 'json'
    };

    return typeMap[type] || 'string';
  }

  private getDefaultMaxLength(type: string): number {
    const lengthMap: Record<string, number> = {
      'string': 255,
      'text': 4000,
      'email': 255,
      'url': 1024,
      'phone': 50,
      'choice': 40
    };

    return lengthMap[type] || 255;
  }
}
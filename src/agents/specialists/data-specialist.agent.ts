/**
 * Data Specialist Agent - Handles data modeling, analysis, and transformation tasks
 */

import { BaseSnowAgent, AgentCapabilities } from '../base/base-snow-agent.js';
import { Task } from '../../types/snow-flow.types.js';

export interface DataRequirements {
  tables: string[];
  relationships: TableRelationship[];
  fields: FieldDefinition[];
  constraints: DataConstraint[];
  transformations: DataTransformation[];
  validationRules: ValidationRule[];
}

export interface DataModel {
  name: string;
  tables: TableDefinition[];
  relationships: TableRelationship[];
  views: ViewDefinition[];
  indices: IndexDefinition[];
  policies: DataPolicy[];
}

export interface TableDefinition {
  name: string;
  label: string;
  fields: FieldDefinition[];
  extends?: string;
  accessControls?: string[];
}

export interface FieldDefinition {
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'date' | 'datetime' | 'reference' | 'choice' | 'decimal';
  label: string;
  maxLength?: number;
  mandatory?: boolean;
  defaultValue?: any;
  choiceOptions?: string[];
  referenceTable?: string;
}

export interface TableRelationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  referenceField?: string;
}

export interface DataConstraint {
  type: 'unique' | 'not_null' | 'check' | 'foreign_key';
  table: string;
  fields: string[];
  condition?: string;
}

export interface DataTransformation {
  name: string;
  sourceFields: string[];
  targetField: string;
  operation: 'concat' | 'calculate' | 'lookup' | 'format' | 'validate';
  formula?: string;
}

export interface ValidationRule {
  field: string;
  type: 'regex' | 'range' | 'enum' | 'custom';
  rule: string;
  errorMessage: string;
}

export interface ViewDefinition {
  name: string;
  baseTable: string;
  fields: string[];
  conditions: string[];
  orderBy?: string[];
}

export interface IndexDefinition {
  name: string;
  table: string;
  fields: string[];
  unique: boolean;
}

export interface DataPolicy {
  name: string;
  table: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  retention: number; // days
  encryption: boolean;
  masking: boolean;
}

export class DataSpecialistAgent extends BaseSnowAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'data_modeling',
        'database_design',
        'data_analysis',
        'etl_processing',
        'data_validation',
        'schema_design'
      ],
      secondarySkills: [
        'performance_optimization',
        'data_migration',
        'reporting',
        'data_quality',
        'integration_patterns'
      ],
      complexity: 'high',
      autonomy: 'semi-autonomous'
    };

    super('servicenow-specialist', 'DataSpecialist', capabilities);
  }

  /**
   * Execute data-related tasks
   */
  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const taskType = task.metadata?.type || 'data_analysis';
      let result;
      
      switch (taskType) {
        case 'data_requirements_analysis':
          result = await this.analyzeDataRequirements(task.description, input);
          break;
          
        case 'data_model_creation':
          result = await this.createDataModel(input?.requirements || {});
          break;
          
        case 'table_design':
          result = await this.designTables(input?.specification || {});
          break;
          
        case 'data_migration':
          result = await this.planDataMigration(input?.source, input?.target);
          break;
          
        case 'data_validation':
          result = await this.validateDataStructure(input?.data || {});
          break;
          
        case 'performance_optimization':
          result = await this.optimizeDataPerformance(input?.tables || []);
          break;
          
        default:
          result = await this.analyzeDataRequirements(task.description, input);
      }
      
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Analyze data requirements from task description
   */
  async analyzeDataRequirements(description: string, context?: any): Promise<DataRequirements> {
    this.logger.info('Analyzing data requirements', { description });
    
    try {
      const normalizedDesc = description.toLowerCase();
      
      // Extract table requirements
      const tables = this.extractTableNames(normalizedDesc);
      
      // Identify relationships
      const relationships = await this.identifyRelationships(normalizedDesc, tables);
      
      // Define fields
      const fields = await this.defineFields(normalizedDesc, tables);
      
      // Set constraints
      const constraints = this.defineConstraints(normalizedDesc, tables);
      
      // Plan transformations
      const transformations = this.planTransformations(normalizedDesc);
      
      // Create validation rules
      const validationRules = this.createValidationRules(fields);
      
      const requirements: DataRequirements = {
        tables,
        relationships,
        fields,
        constraints,
        transformations,
        validationRules
      };
      
      this.logger.info('Data requirements analysis completed', {
        tableCount: tables.length,
        relationshipCount: relationships.length,
        fieldCount: fields.length
      });
      
      return requirements;
      
    } catch (error) {
      this.logger.error('Data requirements analysis failed', error);
      throw error;
    }
  }

  /**
   * Create comprehensive data model
   */
  async createDataModel(requirements: DataRequirements): Promise<DataModel> {
    this.logger.info('Creating data model', { requirements });
    
    try {
      // Create table definitions
      const tables = await this.createTableDefinitions(requirements);
      
      // Create views for complex queries
      const views = await this.createViews(requirements);
      
      // Define indices for performance
      const indices = await this.createIndices(requirements);
      
      // Set data policies
      const policies = await this.createDataPolicies(requirements);
      
      const dataModel: DataModel = {
        name: `data_model_${Date.now()}`,
        tables,
        relationships: requirements.relationships,
        views,
        indices,
        policies
      };
      
      // Validate the model
      await this.validateDataModel(dataModel);
      
      this.logger.info('Data model created successfully', {
        tableCount: tables.length,
        viewCount: views.length,
        indexCount: indices.length
      });
      
      return dataModel;
      
    } catch (error) {
      this.logger.error('Data model creation failed', error);
      throw error;
    }
  }

  /**
   * Design tables based on specifications
   */
  async designTables(specification: any): Promise<TableDefinition[]> {
    this.logger.info('Designing tables', { specification });
    
    const tables: TableDefinition[] = [];
    
    // Common ServiceNow table patterns
    if (specification.type === 'custom_application') {
      tables.push({
        name: `${specification.prefix}_main`,
        label: `${specification.name} Main Table`,
        fields: [
          { name: 'number', type: 'string', label: 'Number', maxLength: 40 },
          { name: 'short_description', type: 'string', label: 'Short Description', maxLength: 160 },
          { name: 'description', type: 'string', label: 'Description', maxLength: 4000 },
          { name: 'state', type: 'choice', label: 'State', choiceOptions: ['New', 'In Progress', 'Completed', 'Cancelled'] },
          { name: 'priority', type: 'choice', label: 'Priority', choiceOptions: ['1 - Critical', '2 - High', '3 - Medium', '4 - Low'] },
          { name: 'assigned_to', type: 'reference', label: 'Assigned To', referenceTable: 'sys_user' },
          { name: 'assignment_group', type: 'reference', label: 'Assignment Group', referenceTable: 'sys_user_group' }
        ]
      });
    }
    
    // Add audit fields to all tables
    tables.forEach(table => {
      table.fields.push(
        { name: 'sys_created_by', type: 'string', label: 'Created By', maxLength: 40 },
        { name: 'sys_created_on', type: 'datetime', label: 'Created On' },
        { name: 'sys_updated_by', type: 'string', label: 'Updated By', maxLength: 40 },
        { name: 'sys_updated_on', type: 'datetime', label: 'Updated On' }
      );
    });
    
    return tables;
  }

  /**
   * Plan data migration strategy
   */
  async planDataMigration(source: any, target: any): Promise<any> {
    this.logger.info('Planning data migration', { source, target });
    
    return {
      strategy: 'incremental',
      phases: [
        { name: 'assessment', duration: '1 week', tasks: ['analyze source data', 'map target schema'] },
        { name: 'preparation', duration: '2 weeks', tasks: ['create migration scripts', 'setup environments'] },
        { name: 'execution', duration: '1 week', tasks: ['migrate data', 'validate results'] },
        { name: 'verification', duration: '1 week', tasks: ['data validation', 'performance testing'] }
      ],
      risks: [
        { risk: 'data loss', mitigation: 'backup before migration', severity: 'high' },
        { risk: 'downtime', mitigation: 'schedule during maintenance window', severity: 'medium' }
      ],
      tools: ['ServiceNow Import Sets', 'Transform Maps', 'Data Sources'],
      estimatedDuration: '5 weeks'
    };
  }

  /**
   * Validate data structure
   */
  async validateDataStructure(data: any): Promise<any> {
    this.logger.info('Validating data structure', { data });
    
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      suggestions: [] as string[]
    };
    
    // Validate required fields
    if (!data.tables || !Array.isArray(data.tables)) {
      validationResults.errors.push('Tables array is required');
      validationResults.isValid = false;
    }
    
    // Validate table structures
    if (data.tables) {
      data.tables.forEach((table: any, index: number) => {
        if (!table.name) {
          validationResults.errors.push(`Table ${index} missing name`);
          validationResults.isValid = false;
        }
        
        if (!table.fields || !Array.isArray(table.fields)) {
          validationResults.warnings.push(`Table ${table.name || index} has no fields`);
        }
      });
    }
    
    return validationResults;
  }

  /**
   * Optimize data performance
   */
  async optimizeDataPerformance(tables: string[]): Promise<any> {
    this.logger.info('Optimizing data performance', { tables });
    
    return {
      optimizations: [
        { type: 'index', table: 'custom_table', fields: ['number', 'state'], impact: 'high' },
        { type: 'cleanup', table: 'custom_table', action: 'archive old records', impact: 'medium' },
        { type: 'denormalization', table: 'custom_table', description: 'add calculated fields', impact: 'medium' }
      ],
      estimatedImprovement: '40% query performance increase',
      risks: ['storage increase', 'complexity increase'],
      implementation: {
        effort: 'medium',
        duration: '2 weeks',
        rollback: 'possible with backup'
      }
    };
  }

  /**
   * Extract table names from description
   */
  private extractTableNames(description: string): string[] {
    const tables: string[] = [];
    
    // Common ServiceNow tables
    const commonTables = [
      'incident', 'problem', 'change_request', 'sc_request', 'sc_req_item',
      'task', 'sys_user', 'sys_user_group', 'cmdb_ci', 'kb_knowledge'
    ];
    
    commonTables.forEach(table => {
      if (description.includes(table.replace('_', ' ')) || description.includes(table)) {
        tables.push(table);
      }
    });
    
    // Extract custom table patterns
    const customTableMatches = description.match(/\b(x_\w+_\w+|u_\w+)\b/g);
    if (customTableMatches) {
      tables.push(...customTableMatches);
    }
    
    return [...new Set(tables)];
  }

  /**
   * Identify relationships between tables
   */
  private async identifyRelationships(description: string, tables: string[]): Promise<TableRelationship[]> {
    const relationships: TableRelationship[] = [];
    
    // Common ServiceNow relationships
    if (tables.includes('incident') && tables.includes('sys_user')) {
      relationships.push({
        fromTable: 'incident',
        toTable: 'sys_user',
        type: 'many-to-one',
        foreignKey: 'assigned_to'
      });
    }
    
    if (tables.includes('sc_request') && tables.includes('sc_req_item')) {
      relationships.push({
        fromTable: 'sc_req_item',
        toTable: 'sc_request',
        type: 'many-to-one',
        foreignKey: 'request'
      });
    }
    
    return relationships;
  }

  /**
   * Define fields based on description
   */
  private async defineFields(description: string, tables: string[]): Promise<FieldDefinition[]> {
    const fields: FieldDefinition[] = [];
    
    // Standard ServiceNow fields
    const standardFields = [
      { name: 'number', type: 'string' as const, label: 'Number' },
      { name: 'short_description', type: 'string' as const, label: 'Short Description' },
      { name: 'description', type: 'string' as const, label: 'Description' },
      { name: 'state', type: 'choice' as const, label: 'State' },
      { name: 'priority', type: 'choice' as const, label: 'Priority' },
      { name: 'assigned_to', type: 'reference' as const, label: 'Assigned To', referenceTable: 'sys_user' }
    ];
    
    fields.push(...standardFields);
    
    // Extract custom fields from description
    const fieldMatches = description.match(/field[s]?[\s:]+([\w\s,]+)/gi);
    if (fieldMatches) {
      fieldMatches.forEach(match => {
        const fieldNames = match.replace(/fields?[\s:]*/i, '').split(',');
        fieldNames.forEach(name => {
          const cleanName = name.trim().replace(/\s+/g, '_').toLowerCase();
          if (cleanName && !fields.find(f => f.name === cleanName)) {
            fields.push({
              name: cleanName,
              type: 'string',
              label: name.trim()
            });
          }
        });
      });
    }
    
    return fields;
  }

  /**
   * Define data constraints
   */
  private defineConstraints(description: string, tables: string[]): DataConstraint[] {
    const constraints: DataConstraint[] = [];
    
    // Standard constraints
    tables.forEach(table => {
      constraints.push(
        {
          type: 'unique',
          table,
          fields: ['number']
        },
        {
          type: 'not_null',
          table,
          fields: ['short_description']
        }
      );
    });
    
    return constraints;
  }

  /**
   * Plan data transformations
   */
  private planTransformations(description: string): DataTransformation[] {
    const transformations: DataTransformation[] = [];
    
    // Common transformations
    if (description.includes('number') || description.includes('auto')) {
      transformations.push({
        name: 'auto_number_generation',
        sourceFields: [],
        targetField: 'number',
        operation: 'calculate',
        formula: 'auto-generated sequence'
      });
    }
    
    return transformations;
  }

  /**
   * Create validation rules
   */
  private createValidationRules(fields: FieldDefinition[]): ValidationRule[] {
    const rules: ValidationRule[] = [];
    
    fields.forEach(field => {
      if (field.name === 'number') {
        rules.push({
          field: field.name,
          type: 'regex',
          rule: '^[A-Z]{3}[0-9]{7}$',
          errorMessage: 'Number must follow format XXX0000000'
        });
      }
      
      if (field.type === 'string' && field.maxLength) {
        rules.push({
          field: field.name,
          type: 'range',
          rule: `1,${field.maxLength}`,
          errorMessage: `Field must be between 1 and ${field.maxLength} characters`
        });
      }
    });
    
    return rules;
  }

  /**
   * Create table definitions from requirements
   */
  private async createTableDefinitions(requirements: DataRequirements): Promise<TableDefinition[]> {
    const tables: TableDefinition[] = [];
    
    requirements.tables.forEach(tableName => {
      const tableFields = requirements.fields.filter(field => 
        field.name.startsWith(tableName) || 
        requirements.relationships.some(rel => rel.fromTable === tableName)
      );
      
      tables.push({
        name: tableName,
        label: this.formatLabel(tableName),
        fields: tableFields.length > 0 ? tableFields : requirements.fields
      });
    });
    
    return tables;
  }

  /**
   * Create views for complex queries
   */
  private async createViews(requirements: DataRequirements): Promise<ViewDefinition[]> {
    const views: ViewDefinition[] = [];
    
    if (requirements.tables.length > 1) {
      views.push({
        name: 'summary_view',
        baseTable: requirements.tables[0],
        fields: ['number', 'short_description', 'state', 'assigned_to'],
        conditions: ['active=true'],
        orderBy: ['sys_created_on DESC']
      });
    }
    
    return views;
  }

  /**
   * Create performance indices
   */
  private async createIndices(requirements: DataRequirements): Promise<IndexDefinition[]> {
    const indices: IndexDefinition[] = [];
    
    requirements.tables.forEach(table => {
      indices.push(
        {
          name: `${table}_number_idx`,
          table,
          fields: ['number'],
          unique: true
        },
        {
          name: `${table}_state_idx`,
          table,
          fields: ['state'],
          unique: false
        }
      );
    });
    
    return indices;
  }

  /**
   * Create data governance policies
   */
  private async createDataPolicies(requirements: DataRequirements): Promise<DataPolicy[]> {
    const policies: DataPolicy[] = [];
    
    requirements.tables.forEach(table => {
      policies.push({
        name: `${table}_policy`,
        table,
        classification: 'internal',
        retention: 2555, // 7 years
        encryption: false,
        masking: false
      });
    });
    
    return policies;
  }

  /**
   * Validate complete data model
   */
  private async validateDataModel(model: DataModel): Promise<void> {
    // Validate table references
    model.relationships.forEach(rel => {
      const fromTable = model.tables.find(t => t.name === rel.fromTable);
      const toTable = model.tables.find(t => t.name === rel.toTable);
      
      if (!fromTable) {
        throw new Error(`Referenced table ${rel.fromTable} not found`);
      }
      if (!toTable) {
        throw new Error(`Referenced table ${rel.toTable} not found`);
      }
    });
    
    // Validate view dependencies
    model.views.forEach(view => {
      const baseTable = model.tables.find(t => t.name === view.baseTable);
      if (!baseTable) {
        throw new Error(`View ${view.name} references non-existent table ${view.baseTable}`);
      }
    });
  }

  /**
   * Format table name to human-readable label
   */
  private formatLabel(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
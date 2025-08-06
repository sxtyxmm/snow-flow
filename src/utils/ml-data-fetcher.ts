/**
 * Smart ML Data Fetcher
 * Handles intelligent data fetching for ML training with batching and field discovery
 * Prevents token limit errors and optimizes data retrieval
 */

import { Logger } from './logger.js';

const logger = new Logger('MLDataFetcher');

export interface MLDataFetchOptions {
  table: string;
  query?: string;
  totalSamples?: number;
  batchSize?: number;
  fields?: string[];
  discoverFields?: boolean;
  includeContent?: boolean;
}

export interface FieldDiscoveryResult {
  allFields: string[];
  recommendedFields: string[];
  sampleData: any[];
}

export interface BatchFetchResult {
  data: any[];
  totalFetched: number;
  batchesProcessed: number;
  fields: string[];
}

export class MLDataFetcher {
  private operationsMCP: any;
  
  constructor(operationsMCP: any) {
    this.operationsMCP = operationsMCP;
  }

  /**
   * Smart fetch with automatic field discovery and batching
   */
  async smartFetch(options: MLDataFetchOptions): Promise<BatchFetchResult> {
    const {
      table,
      query = '',
      totalSamples = 1000,
      batchSize = 100,
      fields,
      discoverFields = true,
      includeContent = true
    } = options;

    logger.info(`🧠 Smart ML data fetch for ${table} - Target: ${totalSamples} samples`);

    // Step 1: Get total count
    const countResult = await this.getRecordCount(table, query);
    logger.info(`📊 Total available records: ${countResult}`);

    // Step 2: Discover fields if needed
    let fieldsToFetch = fields;
    if (!fieldsToFetch && discoverFields) {
      const discovery = await this.discoverFields(table, query);
      fieldsToFetch = discovery.recommendedFields;
      logger.info(`🔍 Discovered ${discovery.allFields.length} fields, using ${fieldsToFetch.length} for ML`);
    }

    // Step 3: Calculate optimal batching strategy
    const actualTotal = Math.min(totalSamples, countResult);
    const optimalBatchSize = this.calculateOptimalBatchSize(actualTotal, batchSize, fieldsToFetch?.length || 10);
    const numBatches = Math.ceil(actualTotal / optimalBatchSize);
    
    logger.info(`📦 Fetching ${actualTotal} records in ${numBatches} batches of ${optimalBatchSize}`);

    // Step 4: Fetch data in batches
    const allData: any[] = [];
    for (let batch = 0; batch < numBatches; batch++) {
      const offset = batch * optimalBatchSize;
      const limit = Math.min(optimalBatchSize, actualTotal - offset);
      
      logger.info(`  Batch ${batch + 1}/${numBatches}: Fetching ${limit} records (offset: ${offset})`);
      
      try {
        const batchData = await this.fetchBatch(table, query, limit, offset, fieldsToFetch, includeContent);
        allData.push(...batchData);
        
        // Small delay between batches to avoid overwhelming the API
        if (batch < numBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        if (error.message?.includes('exceeds maximum allowed tokens')) {
          // Reduce batch size and retry
          logger.warn(`⚠️ Token limit hit, reducing batch size and retrying...`);
          const smallerBatchSize = Math.floor(optimalBatchSize / 2);
          return this.smartFetch({
            ...options,
            batchSize: smallerBatchSize
          });
        }
        throw error;
      }
    }

    return {
      data: allData,
      totalFetched: allData.length,
      batchesProcessed: numBatches,
      fields: fieldsToFetch || []
    };
  }

  /**
   * Get total count of records matching query
   */
  private async getRecordCount(table: string, query: string): Promise<number> {
    try {
      const result = await this.operationsMCP.handleTool('snow_query_table', {
        table,
        query,
        limit: 1,
        include_content: false // Count only, no data
      });

      // Extract count from result
      if (result?.content?.[0]?.text) {
        const text = result.content[0].text;
        const match = text.match(/Found (\d+) .* records/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      
      return 0;
    } catch (error) {
      logger.error('Failed to get record count:', error);
      return 0;
    }
  }

  /**
   * Discover available fields by sampling a few records
   */
  private async discoverFields(table: string, query: string): Promise<FieldDiscoveryResult> {
    logger.info('🔍 Discovering fields from sample records...');
    
    try {
      // Fetch just 3 records with all fields to discover schema
      const result = await this.operationsMCP.handleTool('snow_query_table', {
        table,
        query,
        limit: 3,
        include_content: true
        // No fields specified = get all fields
      });

      const sampleData = this.extractDataFromResult(result);
      
      if (sampleData.length === 0) {
        logger.warn('No sample data available for field discovery');
        return {
          allFields: [],
          recommendedFields: this.getDefaultFields(table),
          sampleData: []
        };
      }

      // Extract all field names from sample
      const allFields = Object.keys(sampleData[0] || {});
      
      // Recommend fields for ML (exclude system fields and large text fields)
      const recommendedFields = this.selectMLFields(allFields, sampleData, table);

      return {
        allFields,
        recommendedFields,
        sampleData
      };
    } catch (error) {
      logger.error('Field discovery failed:', error);
      return {
        allFields: [],
        recommendedFields: this.getDefaultFields(table),
        sampleData: []
      };
    }
  }

  /**
   * Fetch a single batch of data
   */
  private async fetchBatch(
    table: string,
    query: string,
    limit: number,
    offset: number,
    fields?: string[],
    includeContent: boolean = true
  ): Promise<any[]> {
    try {
      // Build query with offset
      const offsetQuery = query ? `${query}^ORDERBY${offset}` : `ORDERBY${offset}`;
      
      const result = await this.operationsMCP.handleTool('snow_query_table', {
        table,
        query: offsetQuery,
        limit,
        fields,
        include_content: includeContent
      });

      return this.extractDataFromResult(result);
    } catch (error) {
      logger.error(`Failed to fetch batch (offset: ${offset}, limit: ${limit}):`, error);
      return [];
    }
  }

  /**
   * Extract data from MCP tool result
   */
  private extractDataFromResult(result: any): any[] {
    if (!result?.content?.[0]?.text) {
      return [];
    }

    try {
      const text = result.content[0].text;
      
      // Try to parse as JSON first
      if (text.includes('[') && text.includes(']')) {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Try to extract from formatted output
      const lines = text.split('\n');
      const data: any[] = [];
      let currentRecord: any = null;

      for (const line of lines) {
        if (line.includes('number:') || line.includes('sys_id:')) {
          if (currentRecord) {
            data.push(currentRecord);
          }
          currentRecord = {};
        }
        
        if (currentRecord && line.includes(':')) {
          const [key, ...valueParts] = line.split(':');
          const cleanKey = key.trim().replace(/^[-\s]+/, '');
          const value = valueParts.join(':').trim();
          if (cleanKey && value) {
            currentRecord[cleanKey] = value;
          }
        }
      }

      if (currentRecord && Object.keys(currentRecord).length > 0) {
        data.push(currentRecord);
      }

      return data;
    } catch (error) {
      logger.error('Failed to extract data from result:', error);
      return [];
    }
  }

  /**
   * Calculate optimal batch size based on data characteristics
   */
  private calculateOptimalBatchSize(totalRecords: number, requestedBatchSize: number, numFields: number): number {
    // Estimate tokens per record (rough approximation)
    const avgTokensPerField = 10; // Conservative estimate
    const tokensPerRecord = numFields * avgTokensPerField;
    const maxTokensPerBatch = 20000; // Leave buffer below 25000 limit
    
    // Calculate max records per batch based on token limit
    const maxRecordsPerBatch = Math.floor(maxTokensPerBatch / tokensPerRecord);
    
    // Use the smaller of requested batch size and calculated max
    const optimalSize = Math.min(requestedBatchSize, maxRecordsPerBatch);
    
    // Ensure at least 10 records per batch but not more than total
    return Math.max(10, Math.min(optimalSize, totalRecords));
  }

  /**
   * Select appropriate fields for ML training
   */
  private selectMLFields(allFields: string[], sampleData: any[], table: string): string[] {
    const excluded = new Set([
      'sys_id', 'sys_created_on', 'sys_created_by', 'sys_updated_on', 'sys_updated_by',
      'sys_mod_count', 'sys_tags', 'sys_package', 'sys_policy', 'sys_scope',
      'sys_domain', 'sys_domain_path', 'sys_class_name'
    ]);

    const mlFields = allFields.filter(field => {
      // Exclude system fields
      if (excluded.has(field)) return false;
      
      // Check if field has useful data in samples
      const hasData = sampleData.some(record => {
        const value = record[field];
        return value && value !== 'null' && value !== '';
      });
      
      return hasData;
    });

    // Always include key fields for the table type
    const keyFields = this.getKeyFields(table);
    const combinedFields = [...new Set([...keyFields, ...mlFields])];
    
    // Limit to 20 most relevant fields to avoid token issues
    return combinedFields.slice(0, 20);
  }

  /**
   * Get default fields for a table type
   */
  private getDefaultFields(table: string): string[] {
    const fieldMap: Record<string, string[]> = {
      incident: [
        'number', 'short_description', 'description', 'category', 'subcategory',
        'priority', 'urgency', 'impact', 'state', 'assignment_group', 
        'assigned_to', 'caller_id', 'opened_at', 'resolved_at'
      ],
      change_request: [
        'number', 'short_description', 'description', 'type', 'category',
        'priority', 'risk', 'impact', 'state', 'assignment_group',
        'assigned_to', 'requested_by', 'start_date', 'end_date'
      ],
      problem: [
        'number', 'short_description', 'description', 'category', 'subcategory',
        'priority', 'urgency', 'impact', 'state', 'assignment_group',
        'assigned_to', 'opened_at', 'known_error'
      ],
      sc_request: [
        'number', 'short_description', 'description', 'request_state', 'approval',
        'requested_for', 'requested_by', 'assignment_group', 'assigned_to',
        'opened_at', 'closed_at'
      ]
    };

    return fieldMap[table] || ['number', 'short_description', 'state', 'priority'];
  }

  /**
   * Get key fields that should always be included
   */
  private getKeyFields(table: string): string[] {
    const keyFieldMap: Record<string, string[]> = {
      incident: ['number', 'short_description', 'category', 'priority', 'state'],
      change_request: ['number', 'short_description', 'type', 'risk', 'state'],
      problem: ['number', 'short_description', 'category', 'priority', 'state'],
      sc_request: ['number', 'short_description', 'request_state', 'approval']
    };

    return keyFieldMap[table] || ['number', 'short_description', 'state'];
  }
}
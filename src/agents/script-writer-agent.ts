/**
 * Script Writer Agent
 * Specializes in creating ServiceNow scripts (Business Rules, Script Includes, Client Scripts)
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';

export class ScriptWriterAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      type: 'script-writer',
      capabilities: [
        'Business rule creation',
        'Script include development',
        'Client script implementation',
        'Data transformation scripts',
        'Performance optimization',
        'GlideRecord operations',
        'GlideSystem methods',
        'REST API scripting',
        'Scheduled job scripts'
      ],
      mcpTools: [
        'snow_create_script_include',
        'snow_create_business_rule',
        'snow_create_client_script',
        'snow_create_ui_action',
        'snow_create_scheduled_job',
        'snow_discover_table_fields',
        'snow_table_schema_discovery'
      ],
      ...config
    });
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('Starting script creation', 0);

      // Analyze script requirements
      const requirements = await this.analyzeScriptRequirements(instruction);
      await this.reportProgress('Analyzed script requirements', 20);

      // Discover table schema if needed
      if (requirements.targetTable) {
        const schema = await this.discoverTableSchema(requirements.targetTable);
        requirements.tableFields = schema.fields;
        await this.reportProgress('Discovered table schema', 30);
      }

      // Generate script based on type
      let script: string;
      let scriptConfig: any;

      switch (requirements.scriptType) {
        case 'business_rule':
          script = await this.createBusinessRuleScript(requirements);
          scriptConfig = this.createBusinessRuleConfig(requirements, script);
          break;

        case 'script_include':
          script = await this.createScriptIncludeScript(requirements);
          scriptConfig = this.createScriptIncludeConfig(requirements, script);
          break;

        case 'client_script':
          script = await this.createClientScript(requirements);
          scriptConfig = this.createClientScriptConfig(requirements, script);
          break;

        case 'scheduled_job':
          script = await this.createScheduledJobScript(requirements);
          scriptConfig = this.createScheduledJobConfig(requirements, script);
          break;

        default:
          throw new Error(`Unknown script type: ${requirements.scriptType}`);
      }

      await this.reportProgress(`Created ${requirements.scriptType} script`, 60);

      // Add performance optimizations
      if (requirements.needsOptimization) {
        script = await this.optimizeScript(script, requirements);
        scriptConfig.script = script;
        await this.reportProgress('Optimized script performance', 70);
      }

      // Create script artifact
      const artifact: ServiceNowArtifact = {
        type: 'script',
        name: requirements.name,
        config: scriptConfig,
        dependencies: requirements.dependencies
      };

      // Store artifact for other agents
      await this.storeArtifact(artifact);
      await this.reportProgress('Script artifact created and stored', 85);

      // Generate documentation
      const documentation = this.generateDocumentation(requirements, script);
      await this.reportProgress('Generated script documentation', 95);

      await this.reportProgress('Script creation completed', 100);
      this.setStatus('completed');

      await this.logActivity('script_creation', true, {
        scriptName: requirements.name,
        scriptType: requirements.scriptType,
        targetTable: requirements.targetTable
      });

      return {
        success: true,
        artifacts: [artifact],
        message: `${requirements.scriptType} "${requirements.name}" created successfully`,
        metadata: {
          scriptType: requirements.scriptType,
          targetTable: requirements.targetTable,
          when: requirements.when,
          documentation,
          performanceOptimized: requirements.needsOptimization
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('script_creation', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `Failed to create script: ${error.message}`
      };
    }
  }

  private async analyzeScriptRequirements(instruction: string): Promise<any> {
    const requirements = {
      name: '',
      scriptType: '',
      targetTable: '',
      when: '',
      async: false,
      needsOptimization: false,
      operations: [] as string[],
      dependencies: [] as string[],
      tableFields: [] as any[],
      conditions: [] as string[],
      features: [] as string[]
    };

    // Determine script type
    if (/business\s*rule/i.test(instruction)) {
      requirements.scriptType = 'business_rule';
    } else if (/script\s*include/i.test(instruction)) {
      requirements.scriptType = 'script_include';
    } else if (/client\s*script/i.test(instruction)) {
      requirements.scriptType = 'client_script';
    } else if (/scheduled\s*job|scheduled\s*script/i.test(instruction)) {
      requirements.scriptType = 'scheduled_job';
    } else {
      // Default to business rule if table is mentioned
      requirements.scriptType = /table|record/i.test(instruction) ? 'business_rule' : 'script_include';
    }

    // Extract script name
    const nameMatch = instruction.match(/(?:create|write|build)\s+(?:a\s+)?([a-zA-Z0-9_\s]+?)(?:\s+(?:business\s*rule|script\s*include|client\s*script|for))/i);
    if (nameMatch) {
      requirements.name = nameMatch[1].trim().toLowerCase().replace(/\s+/g, '_');
    } else {
      requirements.name = `custom_${requirements.scriptType}_${Date.now()}`;
    }

    // Detect target table
    const tableMatch = instruction.match(/(?:for|on|table)\s+([a-zA-Z0-9_]+)/i);
    if (tableMatch) {
      requirements.targetTable = tableMatch[1];
    } else if (/incident/i.test(instruction)) {
      requirements.targetTable = 'incident';
    } else if (/request/i.test(instruction)) {
      requirements.targetTable = 'sc_request';
    } else if (/task/i.test(instruction)) {
      requirements.targetTable = 'task';
    }

    // Determine when to execute (for business rules)
    if (/before/i.test(instruction)) {
      requirements.when = 'before';
    } else if (/after/i.test(instruction)) {
      requirements.when = 'after';
    } else if (/async/i.test(instruction)) {
      requirements.when = 'async';
      requirements.async = true;
    } else if (/display/i.test(instruction)) {
      requirements.when = 'display';
    }

    // Detect operations
    if (/create|insert/i.test(instruction)) {
      requirements.operations.push('insert');
    }
    if (/update|modify/i.test(instruction)) {
      requirements.operations.push('update');
    }
    if (/delete|remove/i.test(instruction)) {
      requirements.operations.push('delete');
    }
    if (!requirements.operations.length && requirements.scriptType === 'business_rule') {
      requirements.operations = ['insert', 'update']; // Default
    }

    // Feature detection
    if (/validat/i.test(instruction)) {
      requirements.features.push('validation');
    }
    if (/calculat|compute/i.test(instruction)) {
      requirements.features.push('calculation');
    }
    if (/notification|email/i.test(instruction)) {
      requirements.features.push('notification');
      requirements.dependencies.push('sys_email');
    }
    if (/api|rest|integration/i.test(instruction)) {
      requirements.features.push('api_call');
      requirements.dependencies.push('sys_rest_message');
    }
    if (/transform|convert/i.test(instruction)) {
      requirements.features.push('data_transformation');
    }
    if (/performance|optimi/i.test(instruction)) {
      requirements.needsOptimization = true;
    }

    return requirements;
  }

  private async discoverTableSchema(tableName: string): Promise<any> {
    // This would use snow_table_schema_discovery MCP tool
    // For now, return common fields
    return {
      fields: [
        { name: 'sys_id', type: 'GUID', mandatory: true },
        { name: 'number', type: 'string', mandatory: true },
        { name: 'short_description', type: 'string', mandatory: false },
        { name: 'description', type: 'text', mandatory: false },
        { name: 'state', type: 'integer', mandatory: false },
        { name: 'priority', type: 'integer', mandatory: false },
        { name: 'assigned_to', type: 'reference', reference: 'sys_user' },
        { name: 'assignment_group', type: 'reference', reference: 'sys_user_group' },
        { name: 'sys_created_on', type: 'glide_date_time', mandatory: true },
        { name: 'sys_updated_on', type: 'glide_date_time', mandatory: true }
      ]
    };
  }

  private async createBusinessRuleScript(requirements: any): Promise<string> {
    let script = '(function executeRule(current, previous /*null when async*/) {\n\n';
    
    // Add header comment
    script += `  // Business Rule: ${requirements.name}\n`;
    script += `  // Table: ${requirements.targetTable}\n`;
    script += `  // When: ${requirements.when}\n`;
    script += `  // Operations: ${requirements.operations.join(', ')}\n\n`;

    // Add validation if needed
    if (requirements.features.includes('validation')) {
      script += '  // Validation logic\n';
      script += '  if (!current.short_description || current.short_description.toString().trim() === "") {\n';
      script += '    gs.addErrorMessage("Short description is required");\n';
      script += '    current.setAbortAction(true);\n';
      script += '    return;\n';
      script += '  }\n\n';
    }

    // Add calculation if needed
    if (requirements.features.includes('calculation')) {
      script += '  // Calculation logic\n';
      script += '  if (current.priority == 1 && current.impact == 1) {\n';
      script += '    current.urgency = 1; // High urgency for P1 high impact\n';
      script += '  }\n\n';
    }

    // Add main business logic based on when
    switch (requirements.when) {
      case 'before':
        script += '  // Before business logic\n';
        script += '  // Set field values before the record is saved\n';
        script += '  if (current.isNewRecord()) {\n';
        script += '    current.active = true;\n';
        script += `    current.created_by_rule = "${requirements.name}";\n`;
        script += '  }\n\n';
        
        script += '  // Track changes\n';
        script += '  if (!current.isNewRecord() && current.state.changes()) {\n';
        script += '    current.work_notes = "State changed from " + previous.getDisplayValue("state") + " to " + current.getDisplayValue("state");\n';
        script += '  }\n';
        break;

      case 'after':
        script += '  // After business logic\n';
        script += '  // Perform actions after the record is saved\n';
        
        if (requirements.features.includes('notification')) {
          script += '  \n  // Send notification\n';
          script += '  if (current.isNewRecord() || current.state.changes()) {\n';
          script += '    gs.eventQueue("record.updated", current, current.assigned_to, current.assignment_group);\n';
          script += '  }\n';
        }
        
        script += '  \n  // Create related records if needed\n';
        script += '  if (current.isNewRecord() && current.priority == 1) {\n';
        script += '    // Example: Create a task for high priority items\n';
        script += '    var task = new GlideRecord("task");\n';
        script += '    task.initialize();\n';
        script += '    task.parent = current.sys_id;\n';
        script += '    task.short_description = "Review high priority " + current.getDisplayValue();\n';
        script += '    task.insert();\n';
        script += '  }\n';
        break;

      case 'async':
        script += '  // Async business logic\n';
        script += '  // This runs in the background after the record is saved\n';
        
        if (requirements.features.includes('api_call')) {
          script += '  \n  // Make API call\n';
          script += '  try {\n';
          script += '    var r = new sn_ws.RESTMessageV2();\n';
          script += '    r.setEndpoint("https://api.example.com/webhook");\n';
          script += '    r.setHttpMethod("POST");\n';
          script += '    r.setRequestBody(JSON.stringify({\n';
          script += '      record_number: current.number.toString(),\n';
          script += '      record_type: current.getTableName(),\n';
          script += '      action: "created"\n';
          script += '    }));\n';
          script += '    var response = r.execute();\n';
          script += '    gs.info("API Response: " + response.getStatusCode());\n';
          script += '  } catch (ex) {\n';
          script += '    gs.error("API call failed: " + ex.getMessage());\n';
          script += '  }\n';
        }
        break;
    }

    // Add error handling
    script += '\n  // Error handling\n';
    script += '  try {\n';
    script += '    // Additional processing can go here\n';
    script += '  } catch (e) {\n';
    script += `    gs.error("Error in business rule ${requirements.name}: " + e.getMessage());\n`;
    script += '  }\n';

    script += '\n})(current, previous);';

    return script;
  }

  private async createScriptIncludeScript(requirements: any): Promise<string> {
    let script = `var ${requirements.name} = Class.create();\n`;
    script += `${requirements.name}.prototype = {\n`;
    script += '  initialize: function() {\n';
    script += '    // Initialize the script include\n';
    script += '    this.log_source = "' + requirements.name + '";\n';
    script += '  },\n\n';

    // Add main methods based on features
    if (requirements.features.includes('data_transformation')) {
      script += '  /**\n';
      script += '   * Transform data from one format to another\n';
      script += '   * @param {Object} sourceData - The data to transform\n';
      script += '   * @return {Object} Transformed data\n';
      script += '   */\n';
      script += '  transformData: function(sourceData) {\n';
      script += '    var transformedData = {};\n';
      script += '    \n';
      script += '    try {\n';
      script += '      // Transformation logic\n';
      script += '      for (var key in sourceData) {\n';
      script += '        if (sourceData.hasOwnProperty(key)) {\n';
      script += '          transformedData[this._normalizeKey(key)] = sourceData[key];\n';
      script += '        }\n';
      script += '      }\n';
      script += '    } catch (e) {\n';
      script += '      gs.error(this.log_source + ": Error transforming data - " + e.getMessage());\n';
      script += '    }\n';
      script += '    \n';
      script += '    return transformedData;\n';
      script += '  },\n\n';

      script += '  _normalizeKey: function(key) {\n';
      script += '    return key.toLowerCase().replace(/[^a-z0-9]/g, "_");\n';
      script += '  },\n\n';
    }

    if (requirements.features.includes('api_call')) {
      script += '  /**\n';
      script += '   * Make an API call to external service\n';
      script += '   * @param {String} endpoint - API endpoint\n';
      script += '   * @param {Object} payload - Request payload\n';
      script += '   * @return {Object} API response\n';
      script += '   */\n';
      script += '  callAPI: function(endpoint, payload) {\n';
      script += '    var response = {\n';
      script += '      success: false,\n';
      script += '      data: null,\n';
      script += '      error: null\n';
      script += '    };\n';
      script += '    \n';
      script += '    try {\n';
      script += '      var r = new sn_ws.RESTMessageV2();\n';
      script += '      r.setEndpoint(endpoint);\n';
      script += '      r.setHttpMethod("POST");\n';
      script += '      r.setRequestHeader("Content-Type", "application/json");\n';
      script += '      r.setRequestBody(JSON.stringify(payload));\n';
      script += '      \n';
      script += '      var httpResponse = r.execute();\n';
      script += '      response.success = httpResponse.getStatusCode() == 200;\n';
      script += '      response.data = JSON.parse(httpResponse.getBody());\n';
      script += '    } catch (e) {\n';
      script += '      response.error = e.getMessage();\n';
      script += '      gs.error(this.log_source + ": API call failed - " + e.getMessage());\n';
      script += '    }\n';
      script += '    \n';
      script += '    return response;\n';
      script += '  },\n\n';
    }

    // Add utility methods
    script += '  /**\n';
    script += '   * Process records from a table\n';
    script += '   * @param {String} tableName - Table to process\n';
    script += '   * @param {String} query - Encoded query\n';
    script += '   * @param {Function} callback - Function to call for each record\n';
    script += '   */\n';
    script += '  processRecords: function(tableName, query, callback) {\n';
    script += '    var count = 0;\n';
    script += '    var gr = new GlideRecord(tableName);\n';
    script += '    \n';
    script += '    if (query) {\n';
    script += '      gr.addEncodedQuery(query);\n';
    script += '    }\n';
    script += '    \n';
    script += '    gr.query();\n';
    script += '    \n';
    script += '    while (gr.next()) {\n';
    script += '      try {\n';
    script += '        callback(gr);\n';
    script += '        count++;\n';
    script += '      } catch (e) {\n';
    script += '        gs.error(this.log_source + ": Error processing record " + gr.getUniqueValue() + " - " + e.getMessage());\n';
    script += '      }\n';
    script += '    }\n';
    script += '    \n';
    script += '    gs.info(this.log_source + ": Processed " + count + " records from " + tableName);\n';
    script += '    return count;\n';
    script += '  },\n\n';

    // Add type checking
    script += '  type: "' + requirements.name + '"\n';
    script += '};';

    return script;
  }

  private async createClientScript(requirements: any): Promise<string> {
    let script = 'function ';
    
    // Determine function name based on type
    let functionName = 'onLoad';
    if (requirements.when === 'onChange') {
      functionName = 'onChange';
    } else if (requirements.when === 'onSubmit') {
      functionName = 'onSubmit';
    }

    // Add appropriate function signature
    switch (functionName) {
      case 'onLoad':
        script += 'onLoad() {\n';
        break;
      case 'onChange':
        script += 'onChange(control, oldValue, newValue, isLoading, isTemplate) {\n';
        script += '  if (isLoading || newValue === "") {\n';
        script += '    return;\n';
        script += '  }\n\n';
        break;
      case 'onSubmit':
        script += 'onSubmit() {\n';
        break;
    }

    // Add script logic based on features
    if (requirements.features.includes('validation')) {
      script += '  // Client-side validation\n';
      script += '  var shortDesc = g_form.getValue("short_description");\n';
      script += '  if (!shortDesc || shortDesc.trim() === "") {\n';
      script += '    g_form.showFieldMsg("short_description", "Short description is required", "error");\n';
      script += '    g_form.setMandatory("short_description", true);\n';
      if (functionName === 'onSubmit') {
        script += '    return false; // Prevent form submission\n';
      }
      script += '  }\n\n';
    }

    if (requirements.features.includes('calculation')) {
      script += '  // Field calculations\n';
      script += '  var priority = g_form.getValue("priority");\n';
      script += '  var impact = g_form.getValue("impact");\n';
      script += '  \n';
      script += '  if (priority == "1" && impact == "1") {\n';
      script += '    g_form.setValue("urgency", "1");\n';
      script += '    g_form.showFieldMsg("urgency", "Urgency set to High due to P1/High Impact", "info");\n';
      script += '  }\n\n';
    }

    // Add UI behavior logic
    script += '  // UI behavior\n';
    script += '  var state = g_form.getValue("state");\n';
    script += '  \n';
    script += '  // Show/hide fields based on state\n';
    script += '  if (state == "1") { // New\n';
    script += '    g_form.setDisplay("resolution_notes", false);\n';
    script += '    g_form.setDisplay("resolved_at", false);\n';
    script += '  } else if (state == "6") { // Resolved\n';
    script += '    g_form.setDisplay("resolution_notes", true);\n';
    script += '    g_form.setMandatory("resolution_notes", true);\n';
    script += '  }\n\n';

    // Add AJAX example if needed
    if (requirements.features.includes('api_call')) {
      script += '  // AJAX call example\n';
      script += '  var ga = new GlideAjax("' + requirements.name + '_Ajax");\n';
      script += '  ga.addParam("sysparm_name", "getData");\n';
      script += '  ga.addParam("sysparm_value", g_form.getValue("number"));\n';
      script += '  ga.getXMLAnswer(function(response) {\n';
      script += '    if (response) {\n';
      script += '      g_form.addInfoMessage("Data retrieved: " + response);\n';
      script += '    }\n';
      script += '  });\n\n';
    }

    // Close function
    if (functionName === 'onSubmit') {
      script += '  return true; // Allow form submission\n';
    }
    script += '}';

    return script;
  }

  private async createScheduledJobScript(requirements: any): Promise<string> {
    let script = '// Scheduled Job: ' + requirements.name + '\n';
    script += '// Schedule: Daily at midnight (adjust as needed)\n\n';
    script += '(function executeScheduledJob() {\n';
    script += '  var startTime = new GlideDateTime();\n';
    script += '  gs.info("' + requirements.name + ' - Started at " + startTime.getDisplayValue());\n\n';

    script += '  try {\n';
    script += '    var recordCount = 0;\n';
    script += '    var errorCount = 0;\n\n';

    if (requirements.targetTable) {
      script += '    // Process records from ' + requirements.targetTable + '\n';
      script += '    var gr = new GlideRecord("' + requirements.targetTable + '");\n';
      script += '    gr.addQuery("active", true);\n';
      
      // Add date filter for scheduled cleanup jobs
      if (requirements.features.includes('cleanup')) {
        script += '    // Process records older than 30 days\n';
        script += '    gr.addQuery("sys_updated_on", "<", gs.daysAgoStart(30));\n';
      }
      
      script += '    gr.query();\n\n';
      script += '    while (gr.next()) {\n';
      script += '      try {\n';
      script += '        // Process each record\n';
      script += '        recordCount++;\n';
      
      if (requirements.features.includes('data_transformation')) {
        script += '        \n        // Transform data\n';
        script += '        var transformedData = transformRecord(gr);\n';
        script += '        if (transformedData) {\n';
        script += '          gr.work_notes = "Processed by scheduled job: " + transformedData.summary;\n';
        script += '          gr.update();\n';
        script += '        }\n';
      }
      
      script += '      } catch (e) {\n';
      script += '        errorCount++;\n';
      script += '        gs.error("' + requirements.name + ' - Error processing record " + gr.getDisplayValue() + ": " + e.getMessage());\n';
      script += '      }\n';
      script += '    }\n';
    }

    // Add summary reporting
    script += '\n    // Summary report\n';
    script += '    var endTime = new GlideDateTime();\n';
    script += '    var duration = GlideDateTime.subtract(startTime, endTime);\n';
    script += '    \n';
    script += '    var summary = {\n';
    script += '      job_name: "' + requirements.name + '",\n';
    script += '      start_time: startTime.getDisplayValue(),\n';
    script += '      end_time: endTime.getDisplayValue(),\n';
    script += '      duration: duration.getDisplayValue(),\n';
    script += '      records_processed: recordCount,\n';
    script += '      errors: errorCount,\n';
    script += '      status: errorCount === 0 ? "Success" : "Completed with errors"\n';
    script += '    };\n';
    script += '    \n';
    script += '    gs.info("' + requirements.name + ' - Summary: " + JSON.stringify(summary));\n';

    // Send notification if configured
    if (requirements.features.includes('notification')) {
      script += '    \n    // Send completion notification\n';
      script += '    if (errorCount > 0) {\n';
      script += '      gs.eventQueue("scheduled_job.error", null, JSON.stringify(summary));\n';
      script += '    }\n';
    }

    script += '  } catch (e) {\n';
    script += '    gs.error("' + requirements.name + ' - Fatal error: " + e.getMessage());\n';
    script += '  }\n';

    // Add helper function if needed
    if (requirements.features.includes('data_transformation')) {
      script += '\n  function transformRecord(record) {\n';
      script += '    // Transform record data\n';
      script += '    return {\n';
      script += '      summary: record.short_description + " - Processed",\n';
      script += '      processed_date: new GlideDateTime().getDisplayValue()\n';
      script += '    };\n';
      script += '  }\n';
    }

    script += '})();';

    return script;
  }

  private async optimizeScript(script: string, requirements: any): Promise<string> {
    let optimizedScript = script;

    // Add caching for repeated queries
    if (script.includes('new GlideRecord') && script.includes('while')) {
      optimizedScript = '// Performance optimization: Use setLimit for large queries\n' + optimizedScript;
      optimizedScript = optimizedScript.replace(
        /gr\.query\(\);/g, 
        'gr.setLimit(1000); // Prevent memory issues\n    gr.query();'
      );
    }

    // Use GlideAggregate for counting
    if (script.includes('count') || script.includes('COUNT')) {
      const aggregateExample = '\n// Performance tip: Use GlideAggregate for counting:\n' +
        '// var ga = new GlideAggregate("table_name");\n' +
        '// ga.addAggregate("COUNT");\n' +
        '// ga.query();\n' +
        '// var count = ga.next() ? ga.getAggregate("COUNT") : 0;\n\n';
      optimizedScript = aggregateExample + optimizedScript;
    }

    // Add bulk operations tip
    if (script.includes('.update()') && script.includes('while')) {
      const bulkTip = '\n// Performance tip: Consider using updateMultiple() for bulk updates\n' +
        '// gr.setValue("field", "value");\n' +
        '// gr.updateMultiple();\n\n';
      optimizedScript = bulkTip + optimizedScript;
    }

    return optimizedScript;
  }

  private createBusinessRuleConfig(requirements: any, script: string): any {
    return {
      name: requirements.name,
      table: requirements.targetTable,
      active: true,
      when: requirements.when,
      order: 100,
      script: script,
      condition: requirements.conditions.join(' AND ') || '',
      description: `Auto-generated business rule: ${requirements.name}`,
      advanced: true,
      actions: {
        insert: requirements.operations.includes('insert'),
        update: requirements.operations.includes('update'),
        delete: requirements.operations.includes('delete'),
        query: requirements.operations.includes('query')
      }
    };
  }

  private createScriptIncludeConfig(requirements: any, script: string): any {
    return {
      name: requirements.name,
      api_name: requirements.name,
      client_callable: false,
      active: true,
      script: script,
      description: `Auto-generated script include: ${requirements.name}`,
      access: 'package_private'
    };
  }

  private createClientScriptConfig(requirements: any, script: string): any {
    return {
      name: requirements.name,
      table: requirements.targetTable,
      type: requirements.when || 'onLoad',
      field: '', // Set if onChange script
      script: script,
      active: true,
      description: `Auto-generated client script: ${requirements.name}`,
      messages: [],
      global: false,
      isolate_script: true,
      ui_type: 10 // Desktop
    };
  }

  private createScheduledJobConfig(requirements: any, script: string): any {
    return {
      name: requirements.name,
      script: script,
      active: true,
      run_type: 'periodically',
      run_period: '1 day',
      run_time: '00:00:00',
      run_dayofweek: 'all',
      conditional: false,
      condition: ''
    };
  }

  private generateDocumentation(requirements: any, script: string): string {
    let doc = `# ${requirements.name}\n\n`;
    doc += `## Type\n${requirements.scriptType}\n\n`;
    
    if (requirements.targetTable) {
      doc += `## Target Table\n${requirements.targetTable}\n\n`;
    }
    
    if (requirements.when) {
      doc += `## When\n${requirements.when}\n\n`;
    }
    
    doc += `## Features\n`;
    requirements.features.forEach(feature => {
      doc += `- ${feature}\n`;
    });
    
    doc += `\n## Dependencies\n`;
    if (requirements.dependencies.length > 0) {
      requirements.dependencies.forEach(dep => {
        doc += `- ${dep}\n`;
      });
    } else {
      doc += 'None\n';
    }
    
    doc += `\n## Performance Optimized\n${requirements.needsOptimization ? 'Yes' : 'No'}\n`;
    
    return doc;
  }
}
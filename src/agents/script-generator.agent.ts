import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowScript, ServiceNowBusinessRule, ServiceNowClientScript } from '../types/servicenow-studio.types';
import logger from '../utils/logger';
import * as beautify from 'js-beautify';

export class ScriptGeneratorAgent extends BaseAppAgent {
  constructor(client: any) {
    super('script-generator', client, [
      'glidescript-generation',
      'business-rules',
      'client-scripts',
      'ui-actions',
      'script-includes',
      'validation-scripts'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      businessRules: [] as ServiceNowBusinessRule[],
      clientScripts: [] as ServiceNowClientScript[],
      scriptIncludes: [] as ServiceNowScript[],
      uiActions: [] as any[],
      validationScripts: [] as ServiceNowScript[]
    };

    try {
      // Generate business rules
      if (request.requirements.businessRules) {
        for (const rule of request.requirements.businessRules) {
          const businessRule = await this.generateBusinessRule(rule, request);
          results.businessRules.push(businessRule);
        }
      }

      // Generate client scripts for UI requirements
      if (request.requirements.ui) {
        for (const ui of request.requirements.ui) {
          const clientScript = await this.generateClientScript(ui, request);
          results.clientScripts.push(clientScript);
        }
      }

      // Generate script includes for common utilities
      const scriptInclude = await this.generateUtilityScriptInclude(request);
      results.scriptIncludes.push(scriptInclude);

      // Generate validation scripts for tables
      if (request.requirements.tables) {
        for (const table of request.requirements.tables) {
          const validationScript = await this.generateValidationScript(table, request);
          results.validationScripts.push(validationScript);
        }
      }

      logger.info(`Script generation completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('Script generation failed', error);
      throw error;
    }
  }

  private async generateBusinessRule(rule: any, request: AppGenerationRequest): Promise<ServiceNowBusinessRule> {
    const prompt = `Generate a ServiceNow Business Rule for the following requirement:

Application: ${request.appName}
Table: ${rule.table}
Rule Name: ${rule.name}
Description: ${rule.description || ''}
When: ${rule.when} (before, after, async, display)
Actions: ${rule.actions.join(', ')}
Condition: ${rule.condition || 'none'}

Generate production-ready GlideScript code that:
1. Follows ServiceNow best practices
2. Includes proper error handling
3. Uses appropriate GlideRecord methods
4. Implements logging where appropriate
5. Includes performance optimizations
6. Follows security guidelines

Return JSON with the complete business rule configuration including the script.`;

    const response = await this.callClaude(prompt);
    const ruleData = JSON.parse(response);

    // Format and beautify the script
    const formattedScript = beautify.js(ruleData.script, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });

    return {
      sys_id: this.generateUniqueId('br_'),
      name: rule.name,
      script: formattedScript,
      description: rule.description || `Auto-generated business rule for ${request.appName}`,
      active: rule.active !== false,
      table: rule.table,
      when: rule.when,
      insert: rule.actions.includes('insert'),
      update: rule.actions.includes('update'),
      delete: rule.actions.includes('delete'),
      query: rule.actions.includes('query'),
      order: ruleData.order || 100,
      condition: rule.condition || '',
      sys_class_name: 'sys_script',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateClientScript(ui: any, request: AppGenerationRequest): Promise<ServiceNowClientScript> {
    const prompt = `Generate a ServiceNow Client Script for the following UI requirement:

Application: ${request.appName}
UI Type: ${ui.type}
UI Name: ${ui.name}
Table: ${ui.table || 'task'}
Description: ${ui.description || ''}
Fields: ${ui.fields?.join(', ') || 'all fields'}

Generate client-side JavaScript that:
1. Implements form validation
2. Handles field interactions
3. Provides user feedback
4. Follows ServiceNow client-side best practices
5. Includes proper error handling
6. Optimizes for performance

Focus on onLoad, onChange, and onSubmit events as appropriate.
Return JSON with the complete client script configuration.`;

    const response = await this.callClaude(prompt);
    const scriptData = JSON.parse(response);

    const formattedScript = beautify.js(scriptData.script, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });

    return {
      sys_id: this.generateUniqueId('cs_'),
      name: `${ui.name} Client Script`,
      script: formattedScript,
      description: ui.description || `Client script for ${ui.name}`,
      active: true,
      table: ui.table || 'task',
      type: scriptData.type || 'onLoad',
      ui_type: 'desktop',
      isolate_script: false,
      global: false,
      sys_class_name: 'sys_script_client',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateUtilityScriptInclude(request: AppGenerationRequest): Promise<ServiceNowScript> {
    const prompt = `Generate a ServiceNow Script Include utility class for the application:

Application: ${request.appName}
Scope: ${request.appScope}
Description: ${request.appDescription}

Create a comprehensive utility class that includes:
1. Common data validation functions
2. Date/time utilities
3. String manipulation helpers
4. GlideRecord helper methods
5. Error handling utilities
6. Logging functions specific to this application
7. Constants and configuration values

Follow ServiceNow Script Include best practices:
- Use proper class structure
- Include proper JSDoc comments
- Implement error handling
- Use appropriate access levels
- Include initialization methods

Return JSON with the complete script include configuration.`;

    const response = await this.callClaude(prompt);
    const scriptData = JSON.parse(response);

    const formattedScript = beautify.js(scriptData.script, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });

    return {
      sys_id: this.generateUniqueId('si_'),
      name: `${request.appName}Utils`,
      script: formattedScript,
      description: `Utility script include for ${request.appName}`,
      active: true,
      api_name: `${request.appName}Utils`,
      access: 'package_private',
      sys_class_name: 'sys_script_include',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  private async generateValidationScript(table: any, request: AppGenerationRequest): Promise<ServiceNowScript> {
    const prompt = `Generate validation scripts for the ServiceNow table:

Table: ${table.name}
Label: ${table.label}
Description: ${table.description || ''}
Fields: ${JSON.stringify(table.fields, null, 2)}

Create comprehensive validation logic that:
1. Validates required fields
2. Checks data formats and patterns
3. Validates business rules
4. Checks for duplicate records
5. Validates field relationships
6. Implements custom validation rules
7. Provides meaningful error messages

Generate both server-side (Business Rule) and client-side (Client Script) validation.
Return JSON with validation scripts for both client and server.`;

    const response = await this.callClaude(prompt);
    const validationData = JSON.parse(response);

    const formattedServerScript = beautify.js(validationData.serverScript, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });

    return {
      sys_id: this.generateUniqueId('vs_'),
      name: `${table.name} Validation`,
      script: formattedServerScript,
      description: `Validation script for ${table.label}`,
      active: true,
      sys_class_name: 'sys_script',
      sys_package: request.appScope,
      sys_scope: request.appScope
    };
  }

  async generateCustomScript(scriptType: string, requirements: any, context: string): Promise<ServiceNowScript> {
    const prompt = `Generate a custom ServiceNow script:

Script Type: ${scriptType}
Requirements: ${JSON.stringify(requirements, null, 2)}
Context: ${context}

Generate production-ready GlideScript code that:
1. Follows ServiceNow best practices
2. Includes proper error handling
3. Uses appropriate ServiceNow APIs
4. Implements logging
5. Includes performance optimizations
6. Follows security guidelines

Return JSON with the complete script configuration.`;

    const response = await this.callClaude(prompt);
    const scriptData = JSON.parse(response);

    const formattedScript = beautify.js(scriptData.script, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });

    return {
      sys_id: this.generateUniqueId('custom_'),
      name: scriptData.name,
      script: formattedScript,
      description: scriptData.description,
      active: true,
      sys_class_name: scriptData.sys_class_name || 'sys_script',
      sys_package: context,
      sys_scope: context
    };
  }

  async optimizeScript(script: string, context: string): Promise<string> {
    const prompt = `Optimize this ServiceNow GlideScript for performance and best practices:

Script:
${script}

Context: ${context}

Optimize for:
1. Performance (GlideRecord queries, loops, etc.)
2. Security (input validation, access controls)
3. Best practices (error handling, logging)
4. Maintainability (code structure, comments)
5. ServiceNow conventions

Return the optimized script with comments explaining the optimizations.`;

    const optimizedScript = await this.callClaude(prompt);
    
    return beautify.js(optimizedScript, {
      indent_size: 2,
      space_in_empty_paren: true,
      jslint_happy: true
    });
  }

  async validateScript(script: string, scriptType: string): Promise<any> {
    const prompt = `Validate this ServiceNow ${scriptType} script for:

Script:
${script}

Check for:
1. Syntax errors
2. ServiceNow API usage
3. Best practices compliance
4. Security vulnerabilities
5. Performance issues
6. Logic errors

Return JSON with validation results including errors, warnings, and suggestions.`;

    const validation = await this.callClaude(prompt);
    
    try {
      return JSON.parse(validation);
    } catch (error) {
      return {
        valid: false,
        errors: ['Failed to parse validation results'],
        warnings: [],
        suggestions: []
      };
    }
  }
}
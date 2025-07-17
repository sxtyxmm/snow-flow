/**
 * Template Engine for Dynamic Artifact Generation
 * Replaces hardcoded artifact implementations with flexible templates
 */

import { promises as fs } from 'fs';
import { join } from 'path';

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface Template {
  type: string;
  name: string;
  description: string;
  config: any;
  variables?: TemplateVariables;
}

export class TemplateEngine {
  private templatesPath: string;

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || join(process.cwd(), 'src', 'templates');
  }

  /**
   * Load a template from file
   */
  async loadTemplate(templatePath: string): Promise<Template> {
    const fullPath = join(this.templatesPath, templatePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Process template with variables
   */
  processTemplate(template: Template, variables: TemplateVariables = {}): any {
    // Merge provided variables with defaults
    const allVariables = {
      ...template.variables,
      ...variables
    };

    // Convert template to string for processing
    let templateStr = JSON.stringify(template.config);

    // Replace all variable placeholders
    for (const [key, value] of Object.entries(allVariables)) {
      // Replace {{KEY}} with value
      const regex = new RegExp(`{{${key}}}`, 'g');
      templateStr = templateStr.replace(regex, String(value));

      // Replace {{KEY|default}} with value or default
      const defaultRegex = new RegExp(`{{${key}\\|([^}]+)}}`, 'g');
      templateStr = templateStr.replace(defaultRegex, String(value));
    }

    // Replace any remaining {{KEY|default}} patterns with defaults
    templateStr = templateStr.replace(/{{[^|]+\|([^}]+)}}/g, '$1');

    // Remove any unmatched placeholders
    templateStr = templateStr.replace(/{{[^}]+}}/g, '');

    // Parse back to object
    const processed = JSON.parse(templateStr);

    // Add metadata
    return {
      ...processed,
      _template: {
        source: template.name,
        type: template.type,
        processed_at: new Date().toISOString()
      }
    };
  }

  /**
   * Create artifact from template
   */
  async createFromTemplate(
    templateName: string,
    variables: TemplateVariables = {}
  ): Promise<any> {
    // Load base template
    const templatePath = `base/${templateName}.template.json`;
    const template = await this.loadTemplate(templatePath);

    // Process with variables
    return this.processTemplate(template, variables);
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    const baseDir = join(this.templatesPath, 'base');
    const files = await fs.readdir(baseDir);
    return files
      .filter(file => file.endsWith('.template.json'))
      .map(file => file.replace('.template.json', ''));
  }

  /**
   * Create example from template
   */
  async createExample(
    templateName: string,
    exampleName: string,
    variables: TemplateVariables
  ): Promise<void> {
    const artifact = await this.createFromTemplate(templateName, variables);
    
    // Save to examples directory
    const exampleDir = join(this.templatesPath, 'examples', exampleName);
    await fs.mkdir(exampleDir, { recursive: true });
    
    const outputPath = join(exampleDir, `${exampleName}.json`);
    await fs.writeFile(outputPath, JSON.stringify(artifact, null, 2));
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: Template): string[] {
    const errors: string[] = [];

    if (!template.type) {
      errors.push('Template must have a type');
    }

    if (!template.name) {
      errors.push('Template must have a name');
    }

    if (!template.config) {
      errors.push('Template must have a config section');
    }

    // Type-specific validation
    switch (template.type) {
      case 'widget':
        if (!template.config.template) {
          errors.push('Widget template must have HTML template');
        }
        break;
      case 'flow':
        if (!template.config.flow_definition) {
          errors.push('Flow template must have flow_definition');
        }
        break;
      case 'script_include':
        if (!template.config.script) {
          errors.push('Script include template must have script');
        }
        break;
    }

    return errors;
  }

  /**
   * Generate artifact from natural language
   */
  async generateFromDescription(
    description: string,
    type: string
  ): Promise<any> {
    // Extract key information from description
    const variables: TemplateVariables = {};

    // Extract name
    const nameMatch = description.match(/(?:create|build|make)\s+(?:a|an)?\s*(\w+[\w\s]*?)(?:widget|flow|script|for|with|that)/i);
    if (nameMatch) {
      variables.NAME = nameMatch[1].trim();
      variables.WIDGET_NAME = variables.NAME;
      variables.FLOW_NAME = variables.NAME;
      variables.CLASS_NAME = variables.NAME.replace(/\s+/g, '');
    }

    // Extract table/target
    const tableMatch = description.match(/(?:for|on|from)\s+(\w+)\s+(?:table|records?)/i);
    if (tableMatch) {
      variables.TABLE = tableMatch[1].toLowerCase();
    }

    // Extract trigger type
    if (description.toLowerCase().includes('when created')) {
      variables.TRIGGER_TYPE = 'record_created';
    } else if (description.toLowerCase().includes('when updated')) {
      variables.TRIGGER_TYPE = 'record_updated';
    }

    // Create from appropriate template
    return await this.createFromTemplate(type, variables);
  }
}
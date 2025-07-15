import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { AppGenerationRequest } from '../types/servicenow-studio.types';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Base agent class that uses Claude Code for AI generation
 * This avoids direct API costs by leveraging your Claude Code subscription
 */
export abstract class BaseAppAgentLocal {
  protected id: string;
  protected type: string;
  protected capabilities: string[];
  protected client: any;
  protected promptsDir: string;
  protected outputsDir: string;

  constructor(type: string, client: any, capabilities: string[] = []) {
    this.id = uuidv4();
    this.type = type;
    this.client = client;
    this.capabilities = capabilities;
    
    // Setup directories for prompts and outputs
    this.promptsDir = path.join(process.cwd(), '.claude-prompts');
    this.outputsDir = path.join(process.cwd(), '.claude-outputs');
    
    // Ensure directories exist
    if (!fs.existsSync(this.promptsDir)) {
      fs.mkdirSync(this.promptsDir, { recursive: true });
    }
    if (!fs.existsSync(this.outputsDir)) {
      fs.mkdirSync(this.outputsDir, { recursive: true });
    }
  }

  /**
   * Generate component using Claude Code instead of API
   * This method writes a prompt file and instructions for manual processing
   */
  abstract generateComponent(request: AppGenerationRequest): Promise<any>;

  /**
   * Generate AI response using Claude Code workflow
   * This creates a prompt file that can be processed manually or via automation
   */
  protected async generateWithClaudeCode(prompt: string, componentType: string): Promise<string> {
    const promptId = `${this.type}-${componentType}-${Date.now()}`;
    const promptFile = path.join(this.promptsDir, `${promptId}.md`);
    const outputFile = path.join(this.outputsDir, `${promptId}-output.json`);

    // Write prompt to file with instructions
    const fullPrompt = `# Claude Code Generation Request
    
Agent Type: ${this.type}
Component: ${componentType}
Timestamp: ${new Date().toISOString()}

## Instructions for Claude Code:
Please generate the following ServiceNow component based on the requirements below.
Output should be valid JSON that can be parsed.

## Prompt:
${prompt}

## Expected Output Format:
Please provide the output as a JSON object that matches the ServiceNow API structure.

---
Note: This prompt is designed to be processed by Claude Code to avoid API costs.
You can process this manually by:
1. Opening this file in Claude Code
2. Generating the response
3. Saving the output to: ${outputFile}
`;

    fs.writeFileSync(promptFile, fullPrompt);
    logger.info(`Created prompt file: ${promptFile}`);

    // Check if output already exists (manual processing)
    if (fs.existsSync(outputFile)) {
      const output = fs.readFileSync(outputFile, 'utf8');
      return output;
    }

    // Return instruction for manual processing
    return JSON.stringify({
      instruction: 'MANUAL_PROCESSING_REQUIRED',
      promptFile: promptFile,
      outputFile: outputFile,
      message: `Please process the prompt file with Claude Code and save output to: ${outputFile}`,
      alternativeApproach: 'Use the --interactive mode to process prompts interactively'
    });
  }

  /**
   * Alternative: Use a local code generation approach with templates
   * This completely avoids AI costs by using smart templates
   */
  protected async generateFromTemplate(templateName: string, variables: Record<string, any>): Promise<any> {
    const templatePath = path.join(__dirname, '..', 'generation-templates', this.type, `${templateName}.template.js`);
    
    if (!fs.existsSync(templatePath)) {
      // Fallback to basic generation
      return this.generateBasicComponent(variables);
    }

    // Load and execute template
    const template = require(templatePath);
    return template.generate(variables);
  }

  /**
   * Basic component generation without AI
   * Uses deterministic logic and best practices
   */
  protected generateBasicComponent(variables: Record<string, any>): any {
    // This will be overridden by each agent
    return {};
  }

  getId(): string {
    return this.id;
  }

  getType(): string {
    return this.type;
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }
}
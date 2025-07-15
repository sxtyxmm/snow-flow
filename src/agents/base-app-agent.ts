import { Anthropic } from '@anthropic-ai/sdk';
import { ServiceNowStudioClient } from '../studio/studio-client';
import { AppGenerationRequest, AppGenerationResult } from '../types/servicenow-studio.types';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAppAgent {
  protected id: string;
  protected type: string;
  protected client: ServiceNowStudioClient;
  protected claude: Anthropic;
  protected isActive: boolean = false;
  protected capabilities: string[] = [];

  constructor(type: string, client: ServiceNowStudioClient, capabilities: string[] = []) {
    this.id = uuidv4();
    this.type = type;
    this.client = client;
    this.capabilities = capabilities;
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  abstract generateComponent(request: AppGenerationRequest): Promise<any>;

  async start(): Promise<void> {
    this.isActive = true;
    logger.info(`${this.type} agent ${this.id} started`);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    logger.info(`${this.type} agent ${this.id} stopped`);
  }

  protected async callClaude(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt || `You are a ServiceNow ${this.type} development agent. Generate production-ready ServiceNow code and configurations.`,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0] && response.content[0].type === 'text' ? (response.content[0] as any).text : '';
    } catch (error) {
      logger.error(`Claude API error in ${this.type} agent ${this.id}`, error);
      throw error;
    }
  }

  protected async analyzeRequirements(requirements: any, context: string): Promise<any> {
    const prompt = `Analyze these ServiceNow application requirements for ${context}:

${JSON.stringify(requirements, null, 2)}

Provide detailed analysis including:
1. Technical approach and architecture
2. ServiceNow best practices to follow
3. Potential challenges and solutions
4. Implementation recommendations
5. Dependencies and prerequisites

Return your analysis in JSON format with structured recommendations.`;

    const analysis = await this.callClaude(prompt);
    
    try {
      return JSON.parse(analysis);
    } catch (error) {
      logger.warn(`Failed to parse analysis as JSON for ${this.type} agent`);
      return { analysis, raw: true };
    }
  }

  protected generateUniqueId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}_${random}`;
  }

  protected validateServiceNowName(name: string): string {
    // ServiceNow naming conventions
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  protected formatServiceNowLabel(label: string): string {
    return label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getId(): string {
    return this.id;
  }

  getType(): string {
    return this.type;
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  isRunning(): boolean {
    return this.isActive;
  }
}
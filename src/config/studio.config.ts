import dotenv from 'dotenv';

dotenv.config();

export const studioConfig = {
  instanceUrl: process.env.SERVICENOW_INSTANCE_URL || '',
  username: process.env.SERVICENOW_USERNAME || '',
  password: process.env.SERVICENOW_PASSWORD || '',
  clientId: process.env.SERVICENOW_CLIENT_ID,
  clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
  timeout: parseInt(process.env.TIMEOUT_MS || '60000')
};

export const claudeConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7')
};

export const appConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '6'),
  generationTimeout: parseInt(process.env.GENERATION_TIMEOUT || '300000'), // 5 minutes
  validateComponents: process.env.VALIDATE_COMPONENTS === 'true',
  deployComponents: process.env.DEPLOY_COMPONENTS === 'true',
  createUpdateSets: process.env.CREATE_UPDATE_SETS === 'true'
};

export function validateConfig(): void {
  const requiredEnvVars = [
    'SERVICENOW_INSTANCE_URL',
    'SERVICENOW_USERNAME',
    'SERVICENOW_PASSWORD',
    'ANTHROPIC_API_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!studioConfig.instanceUrl.startsWith('https://')) {
    throw new Error('SERVICENOW_INSTANCE_URL must start with https://');
  }

  if (!claudeConfig.apiKey.startsWith('sk-')) {
    throw new Error('ANTHROPIC_API_KEY must be a valid API key');
  }
}
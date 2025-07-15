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

export function validateConfig(mode: 'local' | 'api' | 'interactive' = 'local'): void {
  // ServiceNow instance URL is always required
  if (!process.env.SERVICENOW_INSTANCE_URL) {
    throw new Error('Missing required ServiceNow environment variable: SERVICENOW_INSTANCE_URL');
  }

  if (!studioConfig.instanceUrl.startsWith('https://')) {
    throw new Error('SERVICENOW_INSTANCE_URL must start with https://');
  }

  // Check authentication method: OAuth2 or Basic Auth
  const hasOAuth = !!(process.env.SERVICENOW_CLIENT_ID && process.env.SERVICENOW_CLIENT_SECRET);
  const hasBasicAuth = !!(process.env.SERVICENOW_USERNAME && process.env.SERVICENOW_PASSWORD);

  if (!hasOAuth && !hasBasicAuth) {
    throw new Error('ServiceNow authentication required. Provide either:\n' +
      '1. OAuth2: SERVICENOW_CLIENT_ID and SERVICENOW_CLIENT_SECRET\n' +
      '2. Basic Auth: SERVICENOW_USERNAME and SERVICENOW_PASSWORD');
  }

  if (hasOAuth) {
    console.log('🔐 Using OAuth2 authentication');
  } else if (hasBasicAuth) {
    console.log('🔐 Using Basic authentication');
  }

  // Claude API key is only required for API mode
  if (mode === 'api') {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required for API mode. Use --mode local for free template-based generation.');
    }
    if (!claudeConfig.apiKey.startsWith('sk-')) {
      throw new Error('ANTHROPIC_API_KEY must be a valid API key starting with sk-');
    }
  }

  // Interactive mode works with or without API key
  // Local mode doesn't require API key - uses templates and Claude Code Max
  if (mode === 'local') {
    console.log('💡 Local Mode: Using template-based generation with Claude Code Max (no API costs)');
  } else if (mode === 'interactive') {
    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
    console.log(`💡 Interactive Mode: ${hasApiKey ? 'Using Claude API' : 'Using Claude Code Max'}`);
  }
}
import type { SnowFlowConfig } from './types'; // of inline interface in je loader

const config: SnowFlowConfig = {
  profile: 'default',
  mcp: { cmd: 'node', args: ['dist/mcp/index.js'] },

  llm: {
    provider: 'openai',              // 'google' | 'openrouter' | 'openai-compatible' | 'ollama'
    model: 'gpt-4o-mini',
    // baseURL: undefined,
    apiKeyEnv: 'OPENAI_API_KEY'
  },

  agent: { system: 'You are Snow-Flow, a precise ServiceNow engineering agent.', maxSteps: 40 },
  logging: { level: 'info' },

  profiles: {
    dev: {
      logging: { level: 'debug' }
    },
    prod: {
      agent: { maxSteps: 60 }
    }
  }
};

export default config;

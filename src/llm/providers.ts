// Compile-safe placeholder registry. Real providers will be wired via AI SDK in a follow-up step.

import type { SnowFlowConfig } from '../config/llm-config-loader';
import { getApiKey as getStoredKey } from './keys.js';

export type ProviderId = SnowFlowConfig['llm']['provider'];

export interface ProviderOptions {
  provider: ProviderId;
  model: string;
  baseURL?: string;
  apiKeyEnv?: string;
  extraBody?: Record<string, unknown>;
}

export function getModel(opts: ProviderOptions): unknown {
  const { provider, model, baseURL, apiKeyEnv, extraBody } = opts;

  const requireOrThrow = (name: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(name);
    } catch (err) {
      const hint = `Missing dependency ${name}. Run: npm i ai @ai-sdk/openai @ai-sdk/google @openrouter/ai-sdk-provider`;
      throw new Error(hint);
    }
  };

  switch (provider) {
    case 'anthropic': {
      // Prefer AI SDK anthropic provider if installed; otherwise instruct
      try {
        // Dynamic require to avoid hard dep
        const anthropic = require('@ai-sdk/anthropic');
        const key = process.env[apiKeyEnv || 'ANTHROPIC_API_KEY'] || getStoredKey('anthropic');
        if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
        return anthropic.anthropic({ apiKey: key, baseURL }).languageModel(model);
      } catch (e) {
        throw new Error('Anthropic provider not available. Install @ai-sdk/anthropic or use OpenRouter with an Anthropic model.');
      }
    }
    case 'openai': {
      const { openai } = requireOrThrow('@ai-sdk/openai');
      const apiKey = process.env[apiKeyEnv || 'OPENAI_API_KEY'] || getStoredKey('openai');
      if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
      return openai({ apiKey, baseURL }).languageModel(model);
    }
    case 'google': {
      const { google } = requireOrThrow('@ai-sdk/google');
      const apiKey = process.env[apiKeyEnv || 'GOOGLE_API_KEY']
        || process.env['GOOGLE_GENERATIVE_AI_API_KEY']
        || getStoredKey('google');
      if (!apiKey) throw new Error('Missing GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
      return google({ apiKey, baseURL }).languageModel(model);
    }
    case 'openrouter': {
      const { createOpenRouter } = requireOrThrow('@openrouter/ai-sdk-provider');
      const apiKey = process.env[apiKeyEnv || 'OPENROUTER_API_KEY'] || getStoredKey('openrouter');
      if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
      const or = createOpenRouter({ apiKey, baseURL, extraBody });
      return or(model);
    }
    case 'openai-compatible': {
      const { openai } = requireOrThrow('@ai-sdk/openai');
      const keyName = apiKeyEnv || 'OPENAI_COMPAT_API_KEY';
      const apiKey = process.env[keyName] || getStoredKey('openai-compatible');
      if (!baseURL) throw new Error('openai-compatible requires baseURL');
      if (!apiKey) throw new Error(`Missing ${keyName}`);
      return openai({ apiKey, baseURL }).languageModel(model);
    }
    case 'ollama': {
      const { openai } = requireOrThrow('@ai-sdk/openai');
      const keyName = apiKeyEnv || 'OLLAMA_API_KEY';
      const apiKey = process.env[keyName] || getStoredKey('ollama');
      if (!baseURL) throw new Error('ollama requires baseURL (e.g., http://localhost:11434/v1)');
      return openai({ apiKey, baseURL }).languageModel(model);
    }
  }
}

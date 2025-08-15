import Conf from 'conf';

// Avoid generic type for broader compatibility with shimmed types
const store: any = new (Conf as any)({ projectName: 'snow-flow' });

export function setApiKey(provider: string, value: string) {
  store.set(`keys.${provider}`, value);
}

export function getApiKey(provider: string): string | undefined {
  return store.get(`keys.${provider}`);
}

export function clearApiKey(provider: string) {
  store.delete(`keys.${provider}`);
}

export function listKeys(): Record<string, string | undefined> {
  const providers = ['openai', 'google', 'openrouter', 'openai-compatible', 'ollama'];
  const out: Record<string, string | undefined> = {};
  for (const p of providers) out[p] = getApiKey(p);
  return out;
}

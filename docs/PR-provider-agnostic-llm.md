# PR: Make Snow-Flow provider‑agnostic (OpenAI/Gemini/Grok/DeepSeek/Qwen/Llama)

> **Update – Single CLI**
> We hergebruiken je **bestaande `src/cli.ts`** en voegen een nieuwe engine toe: `--engine agent`. Daarmee start je de provider‑agnostische host direct via het bestaande `snow-flow swarm` commando. Alle voorbeelden hieronder zijn daarop aangepast. (De aparte `snow-flow-agent` bin is niet meer nodig.)

This patch adds a thin, vendor‑neutral LLM layer and an MCP bridge so Snow‑Flow runs **without Claude Code** while still using your MCP servers. It introduces:

- `src/llm/providers.ts` – unified provider registry (OpenAI, Google Gemini, OpenRouter, OpenAI‑compatible for xAI Grok & DeepSeek, Ollama optional)
- `src/mcp/bridge.ts` – lightweight MCP client → AI SDK tools
- `src/agent/session.ts` – agent loop with streaming + tool calling
- `src/cli.ts` – CLI entry
- `bin/snow-flow-agent` – executable CLI shim
- `README snippet` – usage + env vars
- `package.json` diff – deps, bin, scripts (non‑breaking)

> Notes
> - Claude Code can still be used separately; this PR does **not** spoof/replace the `claude` CLI.
> - Qwen3 + Llama supported via **OpenRouter** or any **OpenAI‑compatible** endpoint (e.g., DashScope/LM Studio/vLLM). Local Llama works via OpenAI‑compatible endpoints or Ollama (community AI SDK provider).

---

## File tree additions

```
src/
  agent/
    session.ts
  llm/
    providers.ts
  mcp/
    bridge.ts
# CLI blijft: src/cli.ts (bestaande) – uitgebreid met extra flags (--engine, --provider, --model, --base-url, ...)
```


---

## src/llm/providers.ts
```ts
// src/llm/providers.ts
// Unified provider registry for Snow-Flow
import type { LanguageModelV1 } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createOpenRouter, openrouter as openrouterDefault } from '@openrouter/ai-sdk-provider';

export type ProviderId =
  | 'openai'              // OpenAI platform
  | 'google'              // Google Gemini (AI Studio / Vertex-compatible)
  | 'openrouter'          // OpenRouter (Qwen, Llama, etc.)
  | 'openai-compatible'   // Any OpenAI-compatible endpoint (xAI Grok, DeepSeek, vLLM, LM Studio, Ollama* when compatible)
  | 'ollama';             // Optional community provider (see notes)

export interface ProviderOptions {
  provider: ProviderId;
  model: string;               // model ID; e.g. 'gpt-4.1-mini', 'gemini-2.5-flash', 'xai/grok-2', 'qwen/qwen2.5-72b-instruct'
  baseURL?: string;            // for OpenAI-compatible endpoints (e.g., https://api.x.ai/v1, https://api.deepseek.com/v1, https://openrouter.ai/api/v1)
  apiKeyEnv?: string;          // override env var name; defaults depend on provider
  extraBody?: Record<string, unknown>; // provider-specific options (e.g., reasoning, topK)
}

export function getModel(opts: ProviderOptions): LanguageModelV1 {
  const { provider, model, baseURL, apiKeyEnv, extraBody } = opts;

  switch (provider) {
    case 'openai': {
      const apiKey = process.env[apiKeyEnv || 'OPENAI_API_KEY'];
      if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
      return openai({ apiKey, baseURL }).languageModel(model);
    }

    case 'google': {
      const apiKey = process.env[apiKeyEnv || 'GOOGLE_API_KEY'] || process.env['GOOGLE_GENERATIVE_AI_API_KEY'];
      if (!apiKey) throw new Error('Missing GOOGLE_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
      return google({ apiKey, baseURL }).languageModel(model);
    }

    case 'openrouter': {
      const apiKey = process.env[apiKeyEnv || 'OPENROUTER_API_KEY'];
      if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
      const or = createOpenRouter({ apiKey, baseURL, extraBody });
      return or(model);
    }

    case 'openai-compatible': {
      // Generic OpenAI-compatible (xAI Grok, DeepSeek, Together, vLLM, LM Studio, OpenRouter, etc.)
      const keyName = apiKeyEnv || 'OPENAI_COMPAT_API_KEY';
      const apiKey = process.env[keyName];
      if (!baseURL) throw new Error('openai-compatible requires baseURL');
      if (!apiKey) throw new Error(`Missing ${keyName}`);
      return openai({ apiKey, baseURL }).languageModel(model);
    }

    case 'ollama': {
      // Prefer OpenAI-compatible route for Ollama when available in your setup.
      // If you installed a community provider, expose it here (optional).
      // We default to OpenAI-compatible usage: baseURL like http://localhost:11434/v1
      const keyName = apiKeyEnv || 'OLLAMA_API_KEY'; // usually not needed locally
      const apiKey = process.env[keyName];
      if (!baseURL) throw new Error('ollama requires baseURL (e.g., http://localhost:11434/v1)');
      return openai({ apiKey, baseURL }).languageModel(model);
    }
  }
}
```

---

## src/mcp/bridge.ts
```ts
// src/mcp/bridge.ts
import { experimental_createMCPClient } from 'ai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import type { Tool } from 'ai';

export async function loadMCPTools(cmd: string, args: string[] = [], env: Record<string, string> = {}) {
  const client = await experimental_createMCPClient({
    name: 'snow-flow',
    transport: new StdioClientTransport({ command: cmd, args, env }),
  });

  const tools: Tool[] = await client.tools();
  return { tools, close: client.close };
}
```

---

## src/agent/session.ts
```ts
// src/agent/session.ts
import { streamText } from 'ai';
import type { Tool } from 'ai';
import { getModel, type ProviderOptions } from '../llm/providers';
import { loadMCPTools } from '../mcp/bridge';

export interface AgentRunOptions extends ProviderOptions {
  system?: string;
  user: string;
  mcp: { cmd: string; args?: string[]; env?: Record<string, string> };
  maxSteps?: number;
}

export async function runAgent(opts: AgentRunOptions) {
  const { mcp, system, user, maxSteps = 40, ...provider } = opts;
  const model = getModel(provider);

  const { tools, close } = await loadMCPTools(mcp.cmd, mcp.args, mcp.env);

  const result = await streamText({
    model,
    system: system ?? 'You are Snow-Flow, a ServiceNow engineering agent. Be precise. Use tools.',
    messages: [{ role: 'user', content: user }],
    tools: tools as Tool[],
    maxSteps,
  });

  for await (const chunk of result.textStream) process.stdout.write(chunk);
  await close();
}
```

---

## src/cli.ts
```ts
// src/cli.ts
#!/usr/bin/env node
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { runAgent } from './agent/session';
import type { ProviderId } from './llm/providers';

const { values } = parseArgs({
  options: {
    provider: { type: 'string', default: process.env.SNOWFLOW_PROVIDER ?? 'openai' },
    model:    { type: 'string', default: process.env.SNOWFLOW_MODEL ?? 'gpt-4o-mini' },
    baseURL:  { type: 'string' },
    apiKeyEnv:{ type: 'string' },
    prompt:   { type: 'string' },

    mcpCmd:   { type: 'string' },
    mcpArgs:  { type: 'string' }, // comma-separated
  }
});

if (!values.mcpCmd) {
  console.error('\n❌ Missing --mcpCmd. Example: --mcpCmd node --mcpArgs dist/mcp/index.js');
  process.exit(1);
}

const mcpArgs = values.mcpArgs ? String(values.mcpArgs).split(',').map(s => s.trim()).filter(Boolean) : [];

await runAgent({
  provider: values.provider as ProviderId,
  model: String(values.model),
  baseURL: values.baseURL ? String(values.baseURL) : undefined,
  apiKeyEnv: values.apiKeyEnv ? String(values.apiKeyEnv) : undefined,
  user: values.prompt ? String(values.prompt) : 'Configure and run the requested Snow-Flow task.',
  mcp: { cmd: String(values.mcpCmd), args: mcpArgs },
});
```

---

## CLI (bestaand) – geen aparte bin meer nodig
De bestaande `snow-flow` CLI krijgt een extra engine (`--engine agent`). Gebruik de usage‑voorbeelden hieronder.
bash
#!/usr/bin/env node
require('../dist/cli.js');
```

Make executable:
```bash
chmod +x bin/snow-flow-agent
```

---

## package.json (diff)
```diff
--- a/package.json
+++ b/package.json
@@
   "dependencies": {
+    "ai": "^5.0.0",
+    "@ai-sdk/openai": "^1.0.0",
+    "@ai-sdk/google": "^1.0.0",
+    "@openrouter/ai-sdk-provider": "^1.1.2",
+    "@modelcontextprotocol/sdk": "^1.2.0",
+    "dotenv": "^16.4.5"
   },
   "devDependencies": {
   },
   "scripts": {
-    "build": "tsc -p tsconfig.json"
+    "build": "tsc -p tsconfig.json"
   }
```
> Geen extra `bin` entry nodig; we gebruiken de bestaande CLI.
diff
--- a/package.json
+++ b/package.json
@@
   "dependencies": {
+    "ai": "^5.0.0",
+    "@ai-sdk/openai": "^1.0.0",
+    "@ai-sdk/google": "^1.0.0",
+    "@openrouter/ai-sdk-provider": "^1.1.2",
+    "@modelcontextprotocol/sdk": "^1.2.0",
+    "dotenv": "^16.4.5"
   },
   "devDependencies": {
   },
+  "bin": {
+    "snow-flow-agent": "bin/snow-flow-agent"
+  },
   "scripts": {
-    "build": "tsc -p tsconfig.json",
+    "build": "tsc -p tsconfig.json",
+    "start:agent": "node dist/cli.js"
   }
```

> If you already have a `build` script, keep it. Only merge in the new deps, `bin`, and `start:agent`.

---

## README – usage snippet (single CLI)
```md
### Provider‑agnostic agent usage (via bestaande CLI)

#### 1) OpenAI (closed source)
```
OPENAI_API_KEY=sk-... \
snow-flow swarm "Maak een UR-tickettype incl. goedkeuringen" \
  --engine agent \
  --provider openai \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model gpt-4o-mini
```

#### 2) Google Gemini
```
GOOGLE_API_KEY=... \
snow-flow swarm "Genereer changerequest workflow" \
  --engine agent \
  --provider google \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model gemini-2.5-flash
```

#### 3) xAI Grok (OpenAI‑compatible)
```
OPENAI_COMPAT_API_KEY=... \
snow-flow swarm "Analyseer incident backlog" \
  --engine agent \
  --provider openai-compatible \
  --base-url https://api.x.ai/v1 \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model grok-2
```

#### 4) DeepSeek (OpenAI‑compatible)
```
OPENAI_COMPAT_API_KEY=... \
snow-flow swarm "Genereer rapportage KPI's" \
  --engine agent \
  --provider openai-compatible \
  --base-url https://api.deepseek.com/v1 \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model deepseek-chat
```

#### 5) Qwen3 & Llama via OpenRouter
```
OPENROUTER_API_KEY=... \
snow-flow swarm "Maak service catalog item" \
  --engine agent \
  --provider openrouter \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model qwen/qwen2.5-72b-instruct
```

##### Alt: Local (OpenAI‑compatible base URL)
```
SNOWFLOW_PROVIDER=openai-compatible \
OPENAI_COMPAT_API_KEY=unused \
snow-flow swarm "Refactor flow designer" \
  --engine agent \
  --provider openai-compatible \
  --base-url http://localhost:8000/v1 \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model llama-3.1-70b-instruct
```

SNOWFLOW_PROVIDER=openai-compatible \
OPENAI_COMPAT_API_KEY=unused \
snow-flow swarm "Refactor flow designer" \
  --engine agent \
  --provider openai-compatible \
  --base-url http://localhost:8000/v1 \
  --mcp-cmd node --mcp-args dist/mcp/index.js \
  --model llama-3.1-70b-instruct
```
```md
### Provider‑agnostic agent usage

#### 1) OpenAI (closed source)
```
SNOWFLOW_PROVIDER=openai \
OPENAI_API_KEY=sk-... \
snow-flow-agent \
  --mcpCmd node \
  --mcpArgs dist/mcp/index.js \
  --model gpt-4o-mini \
  --prompt "Maak een UR-tickettype incl. goedkeuringen"
```

#### 2) Google Gemini
```
SNOWFLOW_PROVIDER=google \
GOOGLE_API_KEY=... \
snow-flow-agent --mcpCmd node --mcpArgs dist/mcp/index.js \
  --model gemini-2.5-flash --prompt "Genereer changerequest workflow"
```

#### 3) xAI Grok (OpenAI‑compatible)
```
SNOWFLOW_PROVIDER=openai-compatible \
OPENAI_COMPAT_API_KEY=... \
snow-flow-agent --mcpCmd node --mcpArgs dist/mcp/index.js \
  --baseURL https://api.x.ai/v1 \
  --model grok-2 --prompt "Analyseer incident backlog"
```

#### 4) DeepSeek (OpenAI‑compatible)
```
SNOWFLOW_PROVIDER=openai-compatible \
OPENAI_COMPAT_API_KEY=... \
snow-flow-agent --mcpCmd node --mcpArgs dist/mcp/index.js \
  --baseURL https://api.deepseek.com/v1 \
  --model deepseek-chat --prompt "Genereer rapportage KPI's"
```

#### 5) Qwen3 & Llama via OpenRouter
```
SNOWFLOW_PROVIDER=openrouter \
OPENROUTER_API_KEY=... \
snow-flow-agent --mcpCmd node --mcpArgs dist/mcp/index.js \
  --model qwen/qwen2.5-72b-instruct --prompt "Maak service catalog item"
```

##### Alt: Local (OpenAI‑compatible base URL)
```
SNOWFLOW_PROVIDER=openai-compatible \
OPENAI_COMPAT_API_KEY=unused \
snow-flow-agent --mcpCmd node --mcpArgs dist/mcp/index.js \
  --baseURL http://localhost:8000/v1 \
  --model llama-3.1-70b-instruct --prompt "Refactor flow designer"
```

> For local Ollama, if your version exposes an OpenAI‑compatible endpoint (e.g., `http://localhost:11434/v1`), use the same `openai-compatible` route; otherwise consider a community AI SDK Ollama provider.
```

---

## TypeScript config
No change required if you already compile to `dist/`. Ensure `tsconfig.json` includes `outDir": "dist"` and ESM/CJS consistent with your project.

---

## Tests (quick smoke)
- `npm run build`
- Try OpenAI and OpenRouter providers with a simple MCP tool (e.g., list tables). If tools resolve and the agent streams text, the integration works.

---

## Non-goals
- We don’t replicate the `claude` CLI. Keep using it independently if desired.
- We don’t modify your MCP servers; we only bridge them.

---

## Future
- Add preset configs (`snowflow.config.ts`) and profiles per environment.
- Add cost/latency telemetry per provider.
- Add retries/rate-limiters per provider.

---

## START-HERE CHECKLIST (single CLI update)

> **Update – Single CLI**
> Gebruik voortaan het bestaande `snow-flow` commando met `--engine agent`. Voorbeeld (OpenAI):
> 
> ```bash
> OPENAI_API_KEY=sk-... \
> snow-flow swarm "List de beschikbare MCP-tools en voer de simpelste uit" \
>   --engine agent \
>   --provider openai \
>   --mcp-cmd node --mcp-args dist/mcp/index.js \
>   --model gpt-4o-mini
> ```
> 
> De stappen hieronder blijven gelijk; vervang overal `snow-flow-agent` door `snow-flow swarm "<objective>" --engine agent` en voeg de juiste `--provider`/`--model`/`--base-url` toe waar nodig.

---

## MODEL-MATRIX (kies eerst deze varianten)

| Provider | Model | Tool calling | Notities |
|---|---|---|---|
| OpenAI | `gpt-4o-mini` / `gpt-4.1-mini` | ✅ | Snel & goedkoop voor tool-tests |
| Google | `gemini-2.5-flash` | ✅ | Prima voor tool-calls; `-pro` voor zwaarder |
| xAI Grok | `grok-2` | ✅ (OpenAI-compatible) | Gebruik `--provider openai-compatible --baseURL https://api.x.ai/v1` |
| DeepSeek | `deepseek-chat` | ✅ (OpenAI-compatible) | `--baseURL https://api.deepseek.com/v1` |
| OpenRouter | `qwen/qwen2.5-72b-instruct` | ✅ | Gateway naar Qwen/Llama; check rate limits |
| OpenRouter | `meta-llama/llama-3.1-70b-instruct` | ✅ | Goede generalist; soms trager |

> Als een variant geen tools ondersteunt: kies een andere model-ID of routeer via OpenRouter/compat.

---

## TROUBLESHOOTING
- **401/403**: key/env mist of fout domein (`baseURL`).
- **Geen tools zichtbaar**: MCP-pad klopt niet of server crasht; start MCP apart en check stdout.
- **Model negeert tool**: kies model met tool/function calling; verlaag prompt-complexiteit.
- **JSON-schema errors**: maak verplichte velden expliciet en kort; geef voorbeelden in de tool `description`.
- **Streaming stopt**: provider timeouts → probeer kortere antwoorden of ander model.

---

## PROMPT HYGIËNE (kort)
- System prompt in `session.ts` is **neutraal**; vermijd "Claude"-specifieke taal.
- Schrijf user-prompts expliciet: *"Gebruik MCP-tool X als je Y nodig hebt"*.

---

## ROADMAP (gefaseerd)
1) **A**: OpenAI stabiel → merge.  
2) **B**: OpenRouter profielen (Qwen/Llama).  
3) **C**: Grok & DeepSeek via compat.  
4) **D**: Lokaal (vLLM/LM Studio/Ollama) + perf/cost-metrics.


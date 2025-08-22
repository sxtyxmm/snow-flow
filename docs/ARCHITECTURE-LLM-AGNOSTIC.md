# Snow-Flow LLM-Agnostic Architecture

This document captures the current UX, the target UX for a single Snow-Flow CLI, and the core design for the config loader, provider layer, MCP bridge, and error/logging strategy.

## 1) Huidige flow/UX (met Claude)
- Primair entrypoint: `snow-flow swarm "<objective>"` met uitgebreide opties.
- De huidige implementatie kan de `claude` CLI starten en een orchestration prompt doorgeven.
- MCP-servers worden via scripts beheerd (`scripts/*`), met `.mcp.json` als configuratie.
- ServiceNow-auth, memory, monitoring en overige subsystems zijn aanwezig in `src/*`.

Probleem: afhankelijkheid van de `claude` binary en niet provider-agnostisch.

## 2) Doel UX
- Primair entrypoint blijft: `snow-flow swarm "<objective>"`.
- Zonder extra flags start de provider-agnostische agent o.b.v. config.
- Overrides via optionele flags (bijv. `--provider`, `--model`, `--base-url`).
- MCP-tools via config (stdio). Streaming output + tool-events; korte samenvatting aan het eind.

## 3) Config-loader ontwerp
- Bestandsnaam: `snowflow.config.(ts|js|cjs|mjs|json|yaml|yml)`.
- Zoekvolgorde: `--config` flag > `SNOWFLOW_CONFIG` env > repo-root default.
- Profielen: `default`, `dev`, `prod` via `SNOWFLOW_PROFILE` of `config.profile`.
- Schema (per MVP):
  ```ts
  interface SnowFlowConfig {
    profile?: string; // default/dev/prod
    mcp: { cmd: string; args?: string[]; env?: Record<string,string> };
    llm: {
      provider: 'openai' | 'google' | 'openrouter' | 'openai-compatible' | 'ollama';
      model: string;
      baseURL?: string;
      apiKeyEnv?: string;
      extraBody?: Record<string, unknown>;
    };
    agent?: { system?: string; maxSteps?: number };
    logging?: { level?: 'info'|'debug'|'trace' };
    profiles?: Record<string, Partial<SnowFlowConfig>>; // per-profiel overrides
  }
  ```
- MVP implementatie: JSON/JS/CJS support out-of-the-box. YAML/TS/MJS support volgt (documenteer duidelijke foutenmelding i.p.v. crashen).

## 4) Provider-laag en MCP-bridge
- `src/llm/providers.ts`: registry dat o.b.v. `llm.provider` een LanguageModel instantie levert. Providers: OpenAI, Google (Gemini), OpenRouter, OpenAI-compatible (xAI/DeepSeek/vLLM/LM Studio), Ollama. Keys via env (`apiKeyEnv`).
- `src/mcp/bridge.ts`: MCP client via stdio (`@modelcontextprotocol/sdk`). Exposeert tools richting de agent-loop. MVP: veilige placeholder; echte AI-SDK koppeling volgt.
- `src/agent/session.ts`: `streamText` loop met tools, `maxSteps`, neutrale system prompt. MVP: compile-safe stub die aangeeft wat er zou gebeuren.

## 5) Foutafhandeling & logging
- Config-fouten: duidelijke melding welke key/endpoint ontbreekt + tip (welke env-var is nodig).
- Provider-fouten: heldere mapping (bijv. ontbrekende `baseURL` voor openai-compatible).
- MCP-fouten: duidelijke melding als `mcp.cmd` niet gevonden/start.
- Logging levels: `info` (default) / `debug` / `trace` via config of env.

## Implementatiestappen (MVP → uitbreiden)
1. Compile-safe stubs + config loader + CLI-engine detectie (fallback naar bestaande code wanneer geen config).
2. Echte provider-implementatie met `ai` SDK en streaming.
3. MCP-tools via AI SDK tools-bridge, inclusief tool-events.
4. YAML/TS-config support en betere DX (profielen, overrides via flags).
5. Documentatie en rooktests per provider (OpenAI, Google, OpenRouter, OpenAI-compatible varianten, Ollama).


# START HERE – Provider-agnostische Snow-Flow CLI (MVP)

Doel: Eén CLI (`snow-flow`) die zonder extra flags werkt o.b.v. `snowflow.config.*`.

## 1) Configuratie
- Maak `snowflow.config.json` of `snowflow.config.js` (MVP). Voorbeeld zie `snowflow.config.example.ts`.
- Kies `profile` via env `SNOWFLOW_PROFILE` of laat default.
- Vul minimaal:
  - `mcp: { cmd: 'node', args: ['dist/mcp/index.js'] }`
  - `llm: { provider, model, baseURL?, apiKeyEnv? }`

## 2) .env (keys)
- OPENAI_API_KEY / GOOGLE_API_KEY / OPENROUTER_API_KEY / OPENAI_COMPAT_API_KEY afhankelijk van provider.
- Zie `.env.example` voor minimale variabelen.

## 3) Rooktest (niet uitvoeren – referentie)
- OpenAI: `snow-flow swarm "List de MCP-tools"`
- Google: idem met `SNOWFLOW_PROFILE=dev` en aangepaste `llm` settings.
- OpenRouter / OpenAI-compatible: stel `baseURL` en `apiKeyEnv` in.

MVP: Output is een placeholder (compile-safe). Volgende stap activeert streaming + tools.

// Agent session placeholder to keep build green.
// Will be replaced with streaming + tool-calling using the AI SDK.

import type { SnowFlowConfig } from '../config/llm-config-loader';
import type { ProviderOptions } from '../llm/providers';
import { loadMCPTools } from '../mcp/bridge';
import boxen from 'boxen';
import chalk from 'chalk';
import { appendMessage, appendToolEvent, createSessionId, endSession, startSession } from '../session/store.js';

export interface AgentRunOptions extends ProviderOptions {
  system?: string;
  user: string;
  mcp: SnowFlowConfig['mcp'];
  maxSteps?: number;
  showReasoning?: boolean;
  saveOutputPath?: string;
}

export async function runAgent(opts: AgentRunOptions): Promise<void> {
  const { mcp, system, user, maxSteps = 40, provider, model, baseURL, apiKeyEnv, showReasoning = true, saveOutputPath } = opts as any;

  // Resolve model via provider registry
  let llm: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const prov = require('../llm/providers.js');
    llm = prov.getModel({ provider, model, baseURL, apiKeyEnv });
  } catch (e) {
    console.error('❌ LLM provider init error:', e instanceof Error ? e.message : String(e));
    throw e;
  }

  // Load MCP tools (if AI SDK MCP client is available)
  const { tools, close } = await loadMCPTools(mcp);

  // Stream using AI SDK
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { streamText } = require('ai');
    const sessionId = createSessionId();
    startSession({
      id: sessionId,
      startedAt: new Date().toISOString(),
      objective: user,
      provider: { id: String(provider), model: String(model), baseURL },
      mcp: { cmd: mcp.cmd, args: mcp.args },
    });
    appendMessage(sessionId, { role: 'user', content: user, timestamp: new Date().toISOString() });

    const result = await streamText({
      model: llm,
      system: system ?? 'You are Snow-Flow, a ServiceNow engineering agent. Be precise. Use tools when helpful.',
      messages: [{ role: 'user', content: user }],
      tools,
      maxSteps,
    });

    let buffer = '';
    let inReasoning = false;
    const writeChunk = (s: string) => {
      buffer += s;
      const colored = inReasoning && showReasoning ? chalk.yellow.dim(s) : s;
      process.stdout.write(colored);
    };

    // Optional: stream tool call events if provided by SDK
    if (result.toolCallStream && typeof result.toolCallStream[Symbol.asyncIterator] === 'function') {
      (async () => {
        for await (const ev of result.toolCallStream) {
          const name = ev?.toolName || ev?.name || 'tool';
          const args = ev?.args ? JSON.stringify(ev.args).slice(0, 200) : '';
          process.stdout.write('\n' + chalk.cyan(`🔧 Tool → ${name} ${args}`) + '\n');
          appendToolEvent(sessionId, { name, argsPreview: args });
        }
      })().catch(() => {});
    }
    if (result.toolResultStream && typeof result.toolResultStream[Symbol.asyncIterator] === 'function') {
      (async () => {
        for await (const ev of result.toolResultStream) {
          const name = ev?.toolName || ev?.name || 'tool';
          const out = ev?.result ? JSON.stringify(ev.result).slice(0, 200) : '';
          process.stdout.write(chalk.magenta(`📦 Result ← ${name} ${out}`) + '\n');
          appendToolEvent(sessionId, { name, resultPreview: out });
        }
      })().catch(() => {});
    }

    for await (const chunk of result.textStream) {
      const str = String(chunk);
      // Heuristic: detect reasoning blocks (```reasoning, <thinking>, [reasoning])
      if (showReasoning) {
        if (str.includes('```reasoning') || str.toLowerCase().includes('<thinking>') || /\[\s*reasoning\s*\]/i.test(str)) inReasoning = true;
        if (str.includes('```') || str.toLowerCase().includes('</thinking>')) inReasoning = false;
      }
      writeChunk(str);
    }

    // Render a boxed summary if output is long
    if (buffer.length > 4000) {
      const preview = buffer.slice(0, 1200) + '…';
      const box = boxen(preview, { padding: 1, borderColor: 'green', title: 'Preview (truncated)', titleAlignment: 'center' });
      process.stdout.write('\n' + box + '\n');
      process.stdout.write(chalk.gray(`Full length: ${buffer.length} chars`) + '\n');
    }

    if (saveOutputPath) {
      const fs = require('fs');
      fs.writeFileSync(saveOutputPath, buffer, 'utf8');
      process.stdout.write(chalk.gray(`Saved full output to ${saveOutputPath}`) + '\n');
    }
    appendMessage(sessionId, { role: 'assistant', content: buffer, timestamp: new Date().toISOString() });
    endSession(sessionId);
  } finally {
    await close();
  }
}

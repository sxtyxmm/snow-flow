/**
 * ServiceNow Specialist Agents
 * Export all agent implementations
 */

export { BaseAgent, AgentConfig, AgentResult } from './base-agent';
export { WidgetCreatorAgent } from './widget-creator-agent';
export { FlowBuilderAgent } from './flow-builder-agent';
export { ScriptWriterAgent } from './script-writer-agent';
export { TestAgent } from './test-agent';
export { SecurityAgent } from './security-agent';

// Agent type mapping for factory
export const AGENT_CLASS_MAP = {
  'widget-creator': () => import('./widget-creator-agent').then(m => m.WidgetCreatorAgent),
  'flow-builder': () => import('./flow-builder-agent').then(m => m.FlowBuilderAgent),
  'script-writer': () => import('./script-writer-agent').then(m => m.ScriptWriterAgent),
  'tester': () => import('./test-agent').then(m => m.TestAgent),
  'security': () => import('./security-agent').then(m => m.SecurityAgent)
};
/**
 * ServiceNow Specialist Agents
 * Export all agent implementations
 */

export { BaseAgent, AgentConfig, AgentResult } from './base-agent';
export { WidgetCreatorAgent } from './widget-creator-agent';
// FlowBuilderAgent removed in v1.4.0
export { ScriptWriterAgent } from './script-writer-agent';
export { SecurityAgent } from './security-agent';

// Agent type mapping for factory
export const AGENT_CLASS_MAP = {
  'widget-creator': () => import('./widget-creator-agent').then(m => m.WidgetCreatorAgent),
  // 'flow-builder': removed in v1.4.0
  'script-writer': () => import('./script-writer-agent').then(m => m.ScriptWriterAgent),
  'security': () => import('./security-agent').then(m => m.SecurityAgent)
};
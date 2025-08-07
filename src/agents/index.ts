/**
 * ServiceNow Agent System - Dynamic Agent Architecture v3.0
 * All agents are now dynamically created based on task requirements
 */

export { BaseAgent, AgentConfig, AgentResult } from './base-agent';
export { QueenAgent, QueenObjective, QueenAgentConfig } from './queen-agent';

// Dynamic agent system - no more hardcoded agent classes
// Agents are created on-demand by the Queen/AgentFactory based on:
// - Task analysis
// - Required capabilities  
// - ServiceNow artifacts needed
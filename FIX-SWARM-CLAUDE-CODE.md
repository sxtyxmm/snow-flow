# Fix: Snow-Flow Swarm Should Use Claude Code Agents

## Problem

The current implementation has several critical issues:

1. **Early Exit for Flows**: When a Flow Designer task is detected, it generates XML and then `return`s immediately, skipping all Claude Code agent orchestration
2. **Wrong Claude Code Execution**: The `executeClaudeCode` function tries to spawn Claude Code as a CLI tool, which doesn't exist
3. **No Multi-Agent Coordination**: Because of the above, no agents are spawned and Claude Code is never used

## Solution

Snow-flow should be the **orchestrator** that instructs the user to spawn Claude Code agents as **workhorses**.

### Changes Needed:

1. **Remove Early Return** (Already fixed in cli.ts line 263)
   ```javascript
   // OLD: return; // Exit early for Flow Designer flows
   // NEW: // DO NOT RETURN HERE - Continue to Queen Agent orchestration!
   ```

2. **Fix executeClaudeCode Function**
   Instead of trying to spawn Claude Code, it should:
   - Return instructions for the user to copy/paste into Claude Code
   - Make it clear that Claude Code agents will do the actual work
   - Snow-flow remains the orchestrator

3. **Update Queen Agent Prompt**
   - Emphasize that XML is just a template
   - Claude Code agents must analyze requirements and build the complete flow
   - Include the XML file path so agents can enhance it

## Expected Workflow

1. User runs: `snow-flow swarm "create approval flow..."`
2. Snow-flow:
   - Generates basic XML template (for flows)
   - Creates Queen Agent orchestration prompt
   - Shows prompt for user to paste into Claude Code
3. User pastes prompt into Claude Code
4. Claude Code spawns multiple agents that:
   - Analyze the detailed requirements
   - Enhance the XML with approval steps, notifications, etc.
   - Test and deploy the complete flow

## Key Point

Snow-flow = **Orchestrator** (coordinates the work)
Claude Code = **Workhorses** (do the actual implementation)
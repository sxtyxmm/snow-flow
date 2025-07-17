# Snow-Flow Project

This is a Snow-Flow project for ServiceNow multi-agent development.

## Quick Start

1. Configure your ServiceNow credentials in .env
2. Run: `snow-flow auth login`
3. Start your first swarm: `snow-flow swarm "create a widget for incident management"`

## Project Structure

- `.claude/` - Claude configuration and commands
- `.swarm/` - Swarm coordination and memory
- `memory/` - Persistent memory for agents
- `coordination/` - Agent coordination data
- `servicenow/` - Generated ServiceNow artifacts

## Documentation

- Configuration: `.claude/config.json`
- Memory system: `.swarm/memory.db`
- Project structure: `.claude/commands/`

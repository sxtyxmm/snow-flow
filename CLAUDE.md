# Claude Code Configuration

## Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the full test suite
- `npm run lint`: Run ESLint and format checks
- `npm run typecheck`: Run TypeScript type checking

## Snow-Flow Commands
- `snow-flow init --sparc`: Initialize project with SPARC environment
- `snow-flow auth login`: Authenticate with ServiceNow OAuth
- `snow-flow swarm "<objective>"`: Start multi-agent swarm
- `snow-flow sparc <mode> "<task>"`: Run specific SPARC mode

## Quick Start
1. `snow-flow init --sparc` - Initialize project
2. Configure ServiceNow credentials in .env
3. `snow-flow auth login` - Authenticate with ServiceNow
4. `snow-flow swarm "create a widget for incident management"`

## Project Structure
This project uses Snow-Flow for ServiceNow multi-agent development with:
- Multi-agent coordination
- Persistent memory system
- ServiceNow OAuth integration
- SPARC methodology support

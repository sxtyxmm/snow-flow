# agent-metrics

View agent performance metrics.

## Usage
```bash
npx snow-flow agent metrics [options]
```

## Options
- `--agent-id <id>` - Specific agent
- `--period <time>` - Time period
- `--format <type>` - Output format

## Examples
```bash
# All agents metrics
npx snow-flow agent metrics

# Specific agent
npx snow-flow agent metrics --agent-id agent-001

# Last hour
npx snow-flow agent metrics --period 1h
```

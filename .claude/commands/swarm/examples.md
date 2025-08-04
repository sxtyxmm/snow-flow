# Examples Swarm Strategy

## Common Swarm Patterns

### Research Swarm
```bash
./snow-flow swarm "research AI trends" \
  --strategy research \
  --mode distributed \
  --max-agents 6 \
  --parallel
```

### Development Swarm
```bash
./snow-flow swarm "build REST API" \
  --strategy development \
  --mode hierarchical \
  --monitor \
  --output sqlite
```

### Analysis Swarm
```bash
./snow-flow swarm "analyze codebase" \
  --strategy analysis \
  --mode mesh \
  --parallel \
  --timeout 300
```

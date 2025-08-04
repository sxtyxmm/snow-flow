# swarm-monitor

Real-time swarm monitoring.

## Usage
```bash
npx snow-flow swarm monitor [options]
```

## Options
- `--interval <ms>` - Update interval
- `--metrics` - Show detailed metrics
- `--export` - Export monitoring data

## Examples
```bash
# Start monitoring
npx snow-flow swarm monitor

# Custom interval
npx snow-flow swarm monitor --interval 5000

# With metrics
npx snow-flow swarm monitor --metrics
```

# workflow-create

Create reusable workflow templates.

## Usage
```bash
npx snow-flow workflow create [options]
```

## Options
- `--name <name>` - Workflow name
- `--from-history` - Create from history
- `--interactive` - Interactive creation

## Examples
```bash
# Create workflow
npx snow-flow workflow create --name "deploy-api"

# From history
npx snow-flow workflow create --name "test-suite" --from-history

# Interactive mode
npx snow-flow workflow create --interactive
```

# model-update

Update neural models with new data.

## Usage
```bash
npx snow-flow training model-update [options]
```

## Options
- `--model <name>` - Model to update
- `--incremental` - Incremental update
- `--validate` - Validate after update

## Examples
```bash
# Update all models
npx snow-flow training model-update

# Specific model
npx snow-flow training model-update --model agent-selector

# Incremental with validation
npx snow-flow training model-update --incremental --validate
```

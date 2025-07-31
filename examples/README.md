# Snow-Flow Examples

This directory contains practical examples demonstrating Snow-Flow's capabilities for ServiceNow development automation.

## Quick Start Examples

### 1. Simple Widget Creation
```bash
# Create a basic incident dashboard widget
snow-flow swarm "create incident dashboard widget with charts and filters"
```

### 2. Complex Service Portal Development
```bash
# Build a complete employee onboarding portal
snow-flow swarm "build employee onboarding portal with approval workflows and form validation" --strategy development --max-agents 6
```

### 3. Security Analysis
```bash
# Analyze and improve security settings
snow-flow swarm "audit access controls and suggest security improvements" --strategy analysis
```

## Example Projects

Each subdirectory contains a complete example project with:
- Project configuration
- Step-by-step instructions
- Expected outcomes
- Troubleshooting tips

### Available Examples

1. **basic-widget/** - Simple widget creation and deployment
2. **service-catalog/** - Service catalog item with approval workflow
3. **dashboard-portal/** - Executive dashboard with multiple widgets
4. **security-audit/** - Security assessment and compliance checking
5. **integration-api/** - REST API integration with external systems
6. **batch-operations/** - Bulk data processing and updates

## Running Examples

1. **Setup Environment**
   ```bash
   # Initialize Snow-Flow in the example directory
   cd examples/basic-widget
   snow-flow config init
   
   # Configure ServiceNow credentials
   cp .env.example .env
   # Edit .env with your ServiceNow instance details
   ```

2. **Authenticate**
   ```bash
   snow-flow auth login
   ```

3. **Run Example**
   ```bash
   # Follow the instructions in each example's README.md
   snow-flow swarm "$(cat objective.txt)"
   ```

## Best Practices Demonstrated

- **MCP-First Workflow**: All examples use ServiceNow MCP tools
- **Update Set Management**: Proper change tracking
- **Error Recovery**: Handling common deployment issues
- **Testing Patterns**: Validation and rollback strategies
- **Memory Usage**: Efficient agent coordination

## Integration Examples

### With Claude Code
```bash
# Use Claude Code's task management
snow-flow swarm "create incident management system" --monitor
```

### With CI/CD
```bash
# Automated deployment pipeline
snow-flow swarm "deploy to production" --auto-rollback
```

### With External APIs
```bash
# REST API integration
snow-flow swarm "integrate with Slack for notifications"
```

## Contributing Examples

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing new examples.

## Support

- 📖 Full Documentation: [../docs/](../docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/groeimetai/snow-flow/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/groeimetai/snow-flow/discussions)
EOF < /dev/null
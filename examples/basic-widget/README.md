# Basic Widget Example

This example demonstrates creating a simple ServiceNow widget using Snow-Flow's multi-agent system.

## Objective

Create an incident dashboard widget that displays:
- Total incident count
- Incidents by priority
- Recent incidents table
- Real-time updates

## Prerequisites

- ServiceNow developer instance
- Snow-Flow configured and authenticated
- Basic understanding of ServiceNow widgets

## Files

- `objective.txt` - Natural language objective for Snow-Flow
- `.env.example` - Environment configuration template
- `expected-result.md` - What the final widget should look like

## Running the Example

1. **Setup**
   ```bash
   cd examples/basic-widget
   cp .env.example .env
   # Edit .env with your ServiceNow credentials
   ```

2. **Authentication**
   ```bash
   snow-flow auth login
   ```

3. **Execute**
   ```bash
   snow-flow swarm "$(cat objective.txt)" --monitor
   ```

## Expected Timeline

- Analysis: 30 seconds
- Agent spawning: 1 minute  
- Widget creation: 2-3 minutes
- Testing and deployment: 1-2 minutes

**Total: ~5 minutes**

## What Snow-Flow Will Do

1. **Analysis Phase**
   - Parse the natural language objective
   - Identify required components (HTML, CSS, JavaScript, server script)
   - Plan the widget structure

2. **Agent Coordination**
   - Spawn Widget Creator agent
   - Spawn Security agent for access controls
   - Coordinate through Queen agent

3. **Implementation**
   - Generate HTML template with responsive design
   - Create CSS for styling and charts
   - Write client-side JavaScript for interactivity
   - Develop server-side script for data fetching
   - Add proper error handling

4. **Deployment**
   - Create Update Set automatically
   - Deploy widget to ServiceNow
   - Validate deployment
   - Provide access URLs

## Troubleshooting

### Authentication Issues
```bash
snow-flow auth status
snow-flow auth login --verbose
```

### Permission Problems
- Ensure you have `sp_admin` role
- Check widget creation permissions
- Snow-Flow will attempt automatic permission escalation

### Deployment Failures
- Check Update Set for manual steps
- Verify ServiceNow instance connectivity
- Review logs with `--monitor` flag

## Customization

After the basic widget is created, you can:

1. **Modify the objective** in `objective.txt`
2. **Add specific requirements** like:
   - Custom colors and themes
   - Additional data sources
   - Interactive filters
   - Export functionality

3. **Re-run with modifications**:
   ```bash
   snow-flow swarm "enhance the incident widget with export functionality and custom filters"
   ```

## Next Steps

- Try the **service-catalog** example for more complexity
- Explore **dashboard-portal** for multi-widget projects
- Check **security-audit** for compliance features

## Support

If you encounter issues:
1. Check the main [documentation](../../docs/)
2. Review [troubleshooting guide](../../docs/TROUBLESHOOTING.md)
3. Open an [issue](https://github.com/groeimetai/snow-flow/issues)
EOF < /dev/null
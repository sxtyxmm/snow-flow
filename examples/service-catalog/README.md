# Service Catalog Example

This example demonstrates creating a complete service catalog item with approval workflow using Snow-Flow's multi-agent system.

## Objective

Create a laptop request service catalog item with:
- Dynamic form with conditional fields
- Multi-step approval workflow
- Automated fulfillment process
- Email notifications
- Status tracking

## What You'll Get

- Service catalog item with intelligent form
- Approval workflow with manager and IT approval
- Automated provisioning workflow
- Email templates for notifications
- Knowledge base articles for self-service

## Prerequisites

- ServiceNow instance with Service Catalog
- Flow Designer capabilities
- Email configuration (for notifications)
- User roles: `catalog_admin`, `workflow_admin`

## Running the Example

1. **Setup**
   ```bash
   cd examples/service-catalog
   cp .env.example .env
   # Configure your ServiceNow credentials
   ```

2. **Execute**
   ```bash
   snow-flow swarm "$(cat objective.txt)" --strategy development --monitor
   ```

## Expected Timeline

- **Analysis & Planning**: 1-2 minutes
- **Catalog Item Creation**: 2-3 minutes  
- **Workflow Development**: 3-5 minutes
- **Testing & Validation**: 2-3 minutes

**Total: ~10-15 minutes**

## Multi-Agent Coordination

Snow-Flow will automatically spawn and coordinate:

1. **Catalog Designer Agent** - Creates the service item and form
2. **Workflow Architect Agent** - Designs approval and fulfillment flows
3. **Security Agent** - Sets up proper access controls
4. **Integration Agent** - Configures email notifications
5. **Testing Agent** - Validates the complete process

## Learning Outcomes

- Complex multi-agent coordination
- ServiceNow catalog best practices
- Workflow integration patterns
- Approval process automation
- Email notification setup

## Next Steps

After completion, try modifying the objective to add:
- Additional approval steps
- Integration with external systems
- Custom business rules
- Advanced notifications
EOF < /dev/null
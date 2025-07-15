import { ServiceNowAppOrchestrator } from './orchestrator/app-orchestrator';
import { AppGenerationRequest, ServiceNowStudioConfig } from './types/servicenow-studio.types';
import { validateConfig } from './config/studio.config';
import logger from './utils/logger';

// Main entry point for ServiceNow App Builder
async function main() {
  try {
    // Validate configuration
    validateConfig();
    
    // Create orchestrator
    const config: ServiceNowStudioConfig = {
      instanceUrl: process.env.SERVICENOW_INSTANCE_URL!,
      username: process.env.SERVICENOW_USERNAME!,
      password: process.env.SERVICENOW_PASSWORD!,
      clientId: process.env.SERVICENOW_CLIENT_ID,
      clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
      timeout: parseInt(process.env.TIMEOUT_MS || '60000')
    };

    const orchestrator = new ServiceNowAppOrchestrator(config);
    await orchestrator.initialize();

    // Example application generation
    const exampleRequest: AppGenerationRequest = {
      appName: 'Task Management System',
      appScope: 'x_task_mgmt',
      appDescription: 'A comprehensive task management system with workflows and approvals',
      appVersion: '1.0.0',
      requirements: {
        tables: [
          {
            name: 'x_task_mgmt_task',
            label: 'Task',
            description: 'Main task table',
            fields: [
              {
                name: 'title',
                label: 'Title',
                type: 'string',
                maxLength: 255,
                mandatory: true
              },
              {
                name: 'description',
                label: 'Description',
                type: 'text',
                maxLength: 4000
              },
              {
                name: 'priority',
                label: 'Priority',
                type: 'choice',
                choices: ['Low', 'Medium', 'High', 'Critical'],
                defaultValue: 'Medium'
              },
              {
                name: 'assigned_to',
                label: 'Assigned To',
                type: 'reference',
                reference: 'sys_user'
              },
              {
                name: 'due_date',
                label: 'Due Date',
                type: 'date'
              },
              {
                name: 'completion_percentage',
                label: 'Completion %',
                type: 'percent',
                defaultValue: '0'
              }
            ]
          }
        ],
        workflows: [
          {
            name: 'Task Approval Workflow',
            description: 'Approval workflow for high-priority tasks',
            table: 'x_task_mgmt_task',
            triggerCondition: 'priority=Critical',
            activities: [
              {
                name: 'Manager Approval',
                type: 'approval',
                assignmentGroup: 'managers',
                priority: 'high'
              },
              {
                name: 'Notify Assignee',
                type: 'notification',
                assignedTo: 'assigned_to'
              }
            ],
            approvals: [
              {
                name: 'Manager Approval',
                approver: 'manager',
                condition: 'priority=Critical',
                dueDate: '2 days'
              }
            ]
          }
        ],
        ui: [
          {
            type: 'form',
            name: 'Task Form',
            table: 'x_task_mgmt_task',
            fields: ['title', 'description', 'priority', 'assigned_to', 'due_date'],
            layout: 'standard'
          },
          {
            type: 'list',
            name: 'Task List',
            table: 'x_task_mgmt_task',
            fields: ['title', 'priority', 'assigned_to', 'due_date', 'completion_percentage']
          },
          {
            type: 'portal',
            name: 'Task Dashboard',
            description: 'Dashboard widget for task overview',
            widgets: ['task_metrics', 'recent_tasks', 'my_tasks']
          }
        ],
        businessRules: [
          {
            name: 'Task Auto-Assignment',
            table: 'x_task_mgmt_task',
            when: 'before',
            actions: ['insert', 'update'],
            description: 'Automatically assign tasks based on workload'
          },
          {
            name: 'Due Date Validation',
            table: 'x_task_mgmt_task',
            when: 'before',
            actions: ['insert', 'update'],
            description: 'Validate due date is not in the past'
          }
        ],
        security: [
          {
            type: 'acl',
            name: 'Task Read Access',
            table: 'x_task_mgmt_task',
            operation: 'read',
            roles: ['task_user', 'task_manager']
          },
          {
            type: 'acl',
            name: 'Task Write Access',
            table: 'x_task_mgmt_task',
            operation: 'write',
            roles: ['task_manager']
          }
        ]
      },
      preferences: {
        useModernUI: true,
        includeMobileSupport: true,
        generateTests: true,
        includeDocumentation: true,
        followBestPractices: true
      }
    };

    // Generate application
    const result = await orchestrator.generateApplication(exampleRequest);
    
    if (result.success) {
      logger.info('Application generated successfully!');
      logger.info(`Application ID: ${result.appId}`);
      logger.info(`Update Set ID: ${result.updateSetId}`);
      logger.info(`Components created: ${Object.keys(result.components).length}`);
    } else {
      logger.error('Application generation failed');
      logger.error(`Errors: ${result.errors?.join(', ')}`);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await orchestrator.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await orchestrator.shutdown();
      process.exit(0);
    });

    logger.info('ServiceNow App Builder is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    logger.error('Failed to start ServiceNow App Builder', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { ServiceNowAppOrchestrator };
export * from './types/servicenow-studio.types';
export * from './studio/studio-client';
export * from './agents/base-app-agent';
export * from './agents/script-generator.agent';
export * from './agents/ui-builder.agent';
export * from './agents/schema-designer.agent';
export * from './agents/workflow-designer.agent';
export * from './agents/security-agent';
export * from './agents/update-set-manager.agent';

// Run if this is the main module
if (require.main === module) {
  main();
}
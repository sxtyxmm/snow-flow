import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowWorkflow } from '../types/servicenow-studio.types';
import logger from '../utils/logger';

export class WorkflowDesignerAgent extends BaseAppAgent {
  constructor(client: any) {
    super('workflow-designer', client, [
      'workflow-design',
      'flow-designer',
      'approval-processes',
      'business-rules',
      'automation',
      'integration-flows'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      workflows: [] as ServiceNowWorkflow[],
      flows: [] as any[],
      approvals: [] as any[],
      businessRules: [] as any[],
      scheduledJobs: [] as any[]
    };

    try {
      // Generate workflows
      if (request.requirements.workflows) {
        for (const workflowReq of request.requirements.workflows) {
          const workflow = await this.generateWorkflow(workflowReq, request);
          results.workflows.push(workflow);

          // Generate approval processes if needed
          if (workflowReq.approvals) {
            const approvals = await this.generateApprovalProcess(workflowReq, request);
            results.approvals.push(...approvals);
          }
        }
      }

      // Generate integration flows
      if (request.requirements.integrations) {
        for (const integration of request.requirements.integrations) {
          const flow = await this.generateIntegrationFlow(integration, request);
          results.flows.push(flow);
        }
      }

      // Generate automated business processes
      const businessProcesses = await this.generateBusinessProcesses(request);
      results.businessRules.push(...businessProcesses);

      logger.info(`Workflow design completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('Workflow design failed', error);
      throw error;
    }
  }

  private async generateWorkflow(workflowReq: any, request: AppGenerationRequest): Promise<ServiceNowWorkflow> {
    const prompt = `Design a ServiceNow Workflow for:

Application: ${request.appName}
Workflow Name: ${workflowReq.name}
Description: ${workflowReq.description || ''}
Table: ${workflowReq.table}
Trigger Condition: ${workflowReq.triggerCondition || ''}
Activities: ${JSON.stringify(workflowReq.activities, null, 2)}

Design a workflow that:
1. Follows ServiceNow workflow best practices
2. Implements proper activity sequencing
3. Includes error handling and rollback
4. Supports parallel processing where appropriate
5. Implements proper notifications
6. Includes approval processes if needed
7. Optimizes for performance
8. Supports monitoring and reporting

Return JSON with complete workflow configuration including activities and transitions.`;

    const response = await this.callClaude(prompt);
    const workflowData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('wf_'),
      name: workflowReq.name,
      table: workflowReq.table,
      description: workflowReq.description || `Workflow for ${request.appName}`,
      active: true,
      condition: workflowReq.triggerCondition || '',
      sys_package: request.appScope,
      sys_scope: request.appScope,
      begin: workflowData.begin || '',
      end: workflowData.end || '',
      expected_time: workflowData.expectedTime || 0,
      publish: workflowData.publish || false,
      stage: workflowData.stage || 'development',
      due_date: workflowData.dueDate || '',
      run_type: workflowData.runType || 'on_demand'
    };
  }

  private async generateApprovalProcess(workflowReq: any, request: AppGenerationRequest): Promise<any[]> {
    const approvals: any[] = [];

    for (const approvalReq of workflowReq.approvals) {
      const prompt = `Design a ServiceNow Approval Process for:

Workflow: ${workflowReq.name}
Approval Name: ${approvalReq.name}
Approver: ${approvalReq.approver}
Condition: ${approvalReq.condition || ''}
Due Date: ${approvalReq.dueDate || ''}
Escalation: ${approvalReq.escalation || ''}

Design an approval process that:
1. Implements proper approval routing
2. Supports multiple approvers
3. Includes escalation handling
4. Provides proper notifications
5. Tracks approval history
6. Supports delegation
7. Implements timeout handling
8. Supports conditional approvals

Return JSON with complete approval configuration.`;

      const response = await this.callClaude(prompt);
      const approvalData = JSON.parse(response);

      const approval = {
        sys_id: this.generateUniqueId('approval_'),
        name: approvalReq.name,
        approver: approvalReq.approver,
        condition: approvalReq.condition || '',
        due_date: approvalReq.dueDate || '',
        escalation: approvalReq.escalation || '',
        workflow: workflowReq.name,
        table: workflowReq.table,
        sys_package: request.appScope,
        sys_scope: request.appScope,
        ...approvalData
      };

      approvals.push(approval);
    }

    return approvals;
  }

  private async generateIntegrationFlow(integration: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Design a ServiceNow Integration Flow for:

Application: ${request.appName}
Integration Name: ${integration.name}
Type: ${integration.type}
Description: ${integration.description || ''}
Endpoint: ${integration.endpoint || ''}
Method: ${integration.method || 'GET'}
Authentication: ${integration.authentication || 'none'}
Mapping: ${JSON.stringify(integration.mapping || {}, null, 2)}
Schedule: ${integration.schedule || 'on_demand'}

Design an integration flow that:
1. Implements proper error handling
2. Supports retry mechanisms
3. Includes data transformation
4. Implements proper authentication
5. Supports monitoring and logging
6. Handles rate limiting
7. Implements data validation
8. Supports scheduling

Return JSON with complete integration flow configuration.`;

    const response = await this.callClaude(prompt);
    const flowData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('flow_'),
      name: integration.name,
      type: integration.type,
      description: integration.description || `Integration flow for ${request.appName}`,
      endpoint: integration.endpoint || '',
      method: integration.method || 'GET',
      authentication: integration.authentication || 'none',
      mapping: integration.mapping || {},
      schedule: integration.schedule || 'on_demand',
      active: true,
      sys_package: request.appScope,
      sys_scope: request.appScope,
      ...flowData
    };
  }

  private async generateBusinessProcesses(request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate automated business processes for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Tables: ${request.requirements.tables?.map(t => t.name).join(', ') || 'none'}
Requirements: ${JSON.stringify(request.requirements, null, 2)}

Generate business processes that:
1. Automate common tasks
2. Enforce business rules
3. Implement data validation
4. Handle state transitions
5. Support notifications
6. Implement escalations
7. Support reporting
8. Optimize performance

Return JSON with business process configurations.`;

    const response = await this.callClaude(prompt);
    const processData = JSON.parse(response);

    return processData.processes || [];
  }

  async generateFlowDesignerFlow(flowReq: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Design a ServiceNow Flow Designer flow for:

Application: ${request.appName}
Flow Name: ${flowReq.name}
Description: ${flowReq.description || ''}
Trigger: ${flowReq.trigger || 'record'}
Table: ${flowReq.table || ''}
Actions: ${JSON.stringify(flowReq.actions || [], null, 2)}

Design a Flow Designer flow that:
1. Uses modern Flow Designer capabilities
2. Implements proper error handling
3. Supports subflows and reusability
4. Includes proper data handling
5. Implements conditions and loops
6. Supports integrations
7. Includes monitoring and logging
8. Optimizes for performance

Return JSON with complete Flow Designer configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateScheduledJob(jobReq: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Design a ServiceNow Scheduled Job for:

Application: ${request.appName}
Job Name: ${jobReq.name}
Description: ${jobReq.description || ''}
Schedule: ${jobReq.schedule}
Script: ${jobReq.script || ''}
Table: ${jobReq.table || ''}

Design a scheduled job that:
1. Implements proper scheduling
2. Includes error handling
3. Supports monitoring
4. Optimizes for performance
5. Includes logging
6. Supports parallel execution
7. Implements timeout handling
8. Supports conditional execution

Return JSON with complete scheduled job configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateNotificationTemplate(notificationReq: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Design a ServiceNow Notification template for:

Application: ${request.appName}
Notification Name: ${notificationReq.name}
Description: ${notificationReq.description || ''}
Table: ${notificationReq.table}
When: ${notificationReq.when || 'insert'}
Recipients: ${notificationReq.recipients || 'assigned_to'}

Design a notification template that:
1. Implements proper HTML/text formatting
2. Supports dynamic content
3. Includes proper styling
4. Supports localization
5. Implements conditional content
6. Supports attachments
7. Includes proper headers
8. Optimizes for deliverability

Return JSON with complete notification configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async optimizeWorkflow(workflow: any): Promise<any> {
    const prompt = `Optimize this ServiceNow workflow for performance:

Workflow: ${JSON.stringify(workflow, null, 2)}

Optimize for:
1. Execution speed
2. Resource usage
3. Scalability
4. Error handling
5. Monitoring
6. Maintainability
7. Parallel processing
8. Database performance

Return JSON with optimized workflow configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async validateWorkflow(workflow: any): Promise<any> {
    const prompt = `Validate this ServiceNow workflow configuration:

Workflow: ${JSON.stringify(workflow, null, 2)}

Validate for:
1. Configuration correctness
2. Best practices compliance
3. Performance issues
4. Security considerations
5. Error handling
6. Scalability concerns
7. Integration points
8. Maintenance requirements

Return JSON with validation results including errors, warnings, and suggestions.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }
}
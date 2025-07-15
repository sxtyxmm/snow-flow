import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowACL } from '../types/servicenow-studio.types';
import logger from '../utils/logger';

export class SecurityAgent extends BaseAppAgent {
  constructor(client: any) {
    super('security', client, [
      'acl-management',
      'role-creation',
      'security-rules',
      'access-control',
      'data-protection',
      'audit-compliance'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      acls: [] as ServiceNowACL[],
      roles: [] as any[],
      groups: [] as any[],
      securityRules: [] as any[],
      dataProtection: [] as any[],
      auditConfigs: [] as any[]
    };

    try {
      // Generate ACLs for tables and fields
      if (request.requirements.tables) {
        for (const table of request.requirements.tables) {
          const tableACLs = await this.generateTableACLs(table, request);
          results.acls.push(...tableACLs);

          // Generate field-level ACLs
          const fieldACLs = await this.generateFieldACLs(table, request);
          results.acls.push(...fieldACLs);
        }
      }

      // Generate security requirements
      if (request.requirements.security) {
        for (const security of request.requirements.security) {
          const securityConfig = await this.generateSecurityConfiguration(security, request);
          
          if (security.type === 'acl') {
            results.acls.push(securityConfig);
          } else if (security.type === 'role') {
            results.roles.push(securityConfig);
          } else if (security.type === 'group') {
            results.groups.push(securityConfig);
          }
        }
      }

      // Generate application-level security
      const appSecurity = await this.generateApplicationSecurity(request);
      results.securityRules.push(...appSecurity);

      // Generate data protection policies
      const dataProtection = await this.generateDataProtectionPolicies(request);
      results.dataProtection.push(...dataProtection);

      // Generate audit configurations
      const auditConfigs = await this.generateAuditConfigurations(request);
      results.auditConfigs.push(...auditConfigs);

      logger.info(`Security configuration completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('Security configuration failed', error);
      throw error;
    }
  }

  private async generateTableACLs(table: any, request: AppGenerationRequest): Promise<ServiceNowACL[]> {
    const prompt = `Generate ServiceNow ACL configurations for table:

Application: ${request.appName}
Table: ${table.name}
Label: ${table.label}
Description: ${table.description || ''}
Access Controls: ${table.accessControls?.join(', ') || 'standard'}

Generate ACL configurations that:
1. Implement proper CRUD permissions
2. Support role-based access control
3. Include field-level security
4. Implement conditional access
5. Support data segregation
6. Include audit requirements
7. Follow security best practices
8. Support delegation and escalation

Generate ACLs for: create, read, update, delete, and execute operations.
Return JSON with complete ACL configurations.`;

    const response = await this.callClaude(prompt);
    const aclData = JSON.parse(response);

    const acls: ServiceNowACL[] = [];
    const operations = ['create', 'read', 'update', 'delete', 'execute'];

    for (const operation of operations) {
      const aclConfig = aclData.acls?.[operation];
      if (aclConfig) {
        const acl: ServiceNowACL = {
          sys_id: this.generateUniqueId('acl_'),
          name: `${table.name}.${operation}`,
          type: 'record',
          operation: operation,
          table: table.name,
          condition: aclConfig.condition || '',
          script: aclConfig.script || '',
          roles: aclConfig.roles || '',
          active: true,
          sys_package: request.appScope,
          sys_scope: request.appScope,
          admin_overrides: aclConfig.adminOverrides || false,
          advanced: aclConfig.advanced || false,
          description: aclConfig.description || `${operation} access for ${table.label}`
        };
        acls.push(acl);
      }
    }

    return acls;
  }

  private async generateFieldACLs(table: any, request: AppGenerationRequest): Promise<ServiceNowACL[]> {
    const acls: ServiceNowACL[] = [];

    for (const field of table.fields) {
      if (field.security || field.readonly || field.mandatory) {
        const prompt = `Generate ServiceNow field-level ACL for:

Table: ${table.name}
Field: ${field.name}
Label: ${field.label}
Type: ${field.type}
Mandatory: ${field.mandatory || false}
Read Only: ${field.readonly || false}
Security Requirements: ${field.security || 'standard'}

Generate field ACL that:
1. Implements proper field-level security
2. Supports conditional access
3. Includes role-based restrictions
4. Implements data masking if needed
5. Supports audit requirements
6. Follows security best practices

Return JSON with field ACL configuration.`;

        const response = await this.callClaude(prompt);
        const fieldAclData = JSON.parse(response);

        const fieldACL: ServiceNowACL = {
          sys_id: this.generateUniqueId('field_acl_'),
          name: `${table.name}.${field.name}`,
          type: 'field',
          operation: 'read',
          table: table.name,
          field: field.name,
          condition: fieldAclData.condition || '',
          script: fieldAclData.script || '',
          roles: fieldAclData.roles || '',
          active: true,
          sys_package: request.appScope,
          sys_scope: request.appScope,
          admin_overrides: fieldAclData.adminOverrides || false,
          advanced: fieldAclData.advanced || false,
          description: fieldAclData.description || `Field access for ${field.label}`
        };

        acls.push(fieldACL);
      }
    }

    return acls;
  }

  private async generateSecurityConfiguration(security: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate ServiceNow security configuration for:

Application: ${request.appName}
Security Type: ${security.type}
Name: ${security.name}
Description: ${security.description || ''}
Table: ${security.table || ''}
Field: ${security.field || ''}
Operation: ${security.operation || ''}
Condition: ${security.condition || ''}
Roles: ${security.roles?.join(', ') || ''}
Users: ${security.users?.join(', ') || ''}
Groups: ${security.groups?.join(', ') || ''}

Generate security configuration that:
1. Implements proper access control
2. Supports role-based security
3. Includes conditional access
4. Implements data protection
5. Supports audit requirements
6. Follows security best practices
7. Includes proper documentation

Return JSON with complete security configuration.`;

    const response = await this.callClaude(prompt);
    const securityData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('security_'),
      name: security.name,
      type: security.type,
      description: security.description || `Security configuration for ${request.appName}`,
      table: security.table || '',
      field: security.field || '',
      operation: security.operation || '',
      condition: security.condition || '',
      roles: security.roles || [],
      users: security.users || [],
      groups: security.groups || [],
      active: true,
      sys_package: request.appScope,
      sys_scope: request.appScope,
      ...securityData
    };
  }

  private async generateApplicationSecurity(request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate comprehensive security configuration for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Scope: ${request.appScope}
Tables: ${request.requirements.tables?.map(t => t.name).join(', ') || 'none'}
Requirements: ${JSON.stringify(request.requirements, null, 2)}

Generate security configurations that:
1. Implement application-level security
2. Support role-based access control
3. Include data segregation
4. Implement audit trails
5. Support compliance requirements
6. Include security monitoring
7. Implement threat protection
8. Support security reporting

Return JSON with comprehensive security configurations.`;

    const response = await this.callClaude(prompt);
    const securityData = JSON.parse(response);

    return securityData.securityRules || [];
  }

  private async generateDataProtectionPolicies(request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate data protection policies for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Tables: ${request.requirements.tables?.map(t => ({ name: t.name, fields: t.fields })) || []}

Generate data protection policies that:
1. Implement data classification
2. Support data encryption
3. Include data masking
4. Implement data retention
5. Support data anonymization
6. Include data access logging
7. Implement data backup policies
8. Support GDPR compliance

Return JSON with data protection policy configurations.`;

    const response = await this.callClaude(prompt);
    const protectionData = JSON.parse(response);

    return protectionData.policies || [];
  }

  private async generateAuditConfigurations(request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate audit configurations for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Tables: ${request.requirements.tables?.map(t => t.name).join(', ') || 'none'}

Generate audit configurations that:
1. Implement comprehensive audit trails
2. Support compliance requirements
3. Include security event monitoring
4. Implement change tracking
5. Support forensic analysis
6. Include performance monitoring
7. Implement alerting mechanisms
8. Support audit reporting

Return JSON with audit configuration settings.`;

    const response = await this.callClaude(prompt);
    const auditData = JSON.parse(response);

    return auditData.auditConfigs || [];
  }

  async generateRoleConfiguration(roleReq: any, request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate ServiceNow role configuration for:

Application: ${request.appName}
Role Name: ${roleReq.name}
Description: ${roleReq.description || ''}
Permissions: ${roleReq.permissions?.join(', ') || ''}
Tables: ${roleReq.tables?.join(', ') || ''}
Elevated Privileges: ${roleReq.elevatedPrivileges || false}

Generate role configuration that:
1. Implements least privilege principle
2. Supports role hierarchy
3. Includes proper permissions
4. Implements role delegation
5. Supports conditional access
6. Includes audit requirements
7. Follows security best practices

Return JSON with complete role configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateSecurityReport(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate security analysis report for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Requirements: ${JSON.stringify(request.requirements, null, 2)}

Generate security report that includes:
1. Security risk assessment
2. Vulnerability analysis
3. Compliance evaluation
4. Access control review
5. Data protection assessment
6. Audit readiness check
7. Security recommendations
8. Implementation roadmap

Return JSON with comprehensive security report.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async validateSecurityConfiguration(securityConfig: any): Promise<any> {
    const prompt = `Validate ServiceNow security configuration:

Configuration: ${JSON.stringify(securityConfig, null, 2)}

Validate for:
1. Security best practices
2. Access control effectiveness
3. Compliance requirements
4. Configuration correctness
5. Performance impact
6. Maintainability
7. Security gaps
8. Implementation issues

Return JSON with validation results including errors, warnings, and recommendations.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }
}
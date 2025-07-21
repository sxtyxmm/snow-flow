/**
 * Security Specialist Agent - Handles security, compliance, and access control
 */

import { BaseSnowAgent, AgentCapabilities } from '../base/base-snow-agent.js';
import { Task } from '../../types/snow-flow.types.js';

export interface SecurityRequirements {
  accessControls: AccessControlRule[];
  dataClassification: DataClassification;
  complianceFrameworks: string[];
  auditRequirements: AuditConfig;
  encryptionNeeds: EncryptionConfig;
  riskAssessment: RiskAssessment;
}

export interface AccessControlRule {
  table: string;
  operation: 'read' | 'write' | 'create' | 'delete';
  roles: string[];
  conditions?: string;
  fieldLevel?: FieldAccessControl[];
}

export interface FieldAccessControl {
  field: string;
  access: 'read' | 'write' | 'none';
  roles: string[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // days
  dataResidency?: string;
}

export interface AuditConfig {
  enabled: boolean;
  events: string[];
  retention: number; // days
  realTimeMonitoring: boolean;
  alerting: AlertConfig[];
}

export interface AlertConfig {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  channels: ('email' | 'sms' | 'slack')[];
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  keyManagement: 'internal' | 'external' | 'cloud';
  algorithm?: string;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  mitigations: Mitigation[];
  residualRisk: 'low' | 'medium' | 'high';
}

export interface RiskFactor {
  type: 'data_exposure' | 'unauthorized_access' | 'system_compromise' | 'compliance_violation';
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface Mitigation {
  control: string;
  effectiveness: 'low' | 'medium' | 'high';
  implementation: 'immediate' | 'short_term' | 'long_term';
  cost: 'low' | 'medium' | 'high';
}

export class SecuritySpecialistAgent extends BaseSnowAgent {
  constructor() {
    const capabilities: AgentCapabilities = {
      primarySkills: [
        'access_control',
        'security_policies',
        'compliance_management',
        'risk_assessment',
        'audit_configuration',
        'encryption_setup'
      ],
      secondarySkills: [
        'security_monitoring',
        'incident_response',
        'vulnerability_assessment',
        'data_protection'
      ],
      complexity: 'high',
      autonomy: 'guided'
    };

    super('security-specialist', 'SecuritySpecialist', capabilities);
  }

  async execute(task: Task, input?: any): Promise<any> {
    await this.startTask(task);
    
    try {
      const taskType = task.metadata?.type || 'security_analysis';
      let result;
      
      switch (taskType) {
        case 'access_control_setup':
          result = await this.setupAccessControls(input?.requirements || {});
          break;
        case 'compliance_check':
          result = await this.performComplianceCheck(input?.framework || {});
          break;
        case 'risk_assessment':
          result = await this.conductRiskAssessment(input?.scope || {});
          break;
        case 'audit_setup':
          result = await this.setupAuditing(input?.config || {});
          break;
        default:
          result = await this.analyzeSecurityRequirements(task.description, input);
      }
      
      await this.completeTask(result);
      return result;
      
    } catch (error) {
      await this.handleError(error as Error);
      throw error;
    }
  }

  async analyzeSecurityRequirements(description: string, context?: any): Promise<SecurityRequirements> {
    const normalizedDesc = description.toLowerCase();
    
    return {
      accessControls: this.defineAccessControls(normalizedDesc),
      dataClassification: this.classifyData(normalizedDesc),
      complianceFrameworks: this.identifyComplianceFrameworks(normalizedDesc),
      auditRequirements: this.defineAuditRequirements(normalizedDesc),
      encryptionNeeds: this.assessEncryptionNeeds(normalizedDesc),
      riskAssessment: this.assessRisk(normalizedDesc)
    };
  }

  async setupAccessControls(requirements: SecurityRequirements): Promise<any> {
    return {
      type: 'access_control_setup',
      rules: requirements.accessControls.map(rule => ({
        name: `acl_${rule.table}_${rule.operation}`,
        table: rule.table,
        operation: rule.operation,
        roles: rule.roles,
        condition: rule.conditions || '',
        active: true,
        order: 100
      })),
      fieldLevelSecurity: this.createFieldLevelSecurity(requirements.accessControls),
      implementation: {
        phases: ['development', 'testing', 'production'],
        rollback: 'Disable rules and revert to previous state',
        validation: 'User access testing required'
      }
    };
  }

  async performComplianceCheck(framework: any): Promise<any> {
    const complianceResults = {
      framework: framework.name || 'Generic',
      overallStatus: 'compliant' as 'compliant' | 'partial' | 'non_compliant',
      score: 85, // percentage
      requirements: [
        {
          id: 'access_control',
          name: 'Access Control Management',
          status: 'compliant',
          evidence: 'ACL rules configured',
          gaps: []
        },
        {
          id: 'data_protection',
          name: 'Data Protection',
          status: 'partial',
          evidence: 'Encryption enabled',
          gaps: ['Data masking not configured']
        },
        {
          id: 'audit_logging',
          name: 'Audit Logging',
          status: 'compliant',
          evidence: 'Audit rules active',
          gaps: []
        }
      ],
      recommendations: [
        'Implement data masking for sensitive fields',
        'Enable real-time monitoring alerts',
        'Schedule regular compliance reviews'
      ],
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };
    
    return complianceResults;
  }

  async conductRiskAssessment(scope: any): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [
      {
        type: 'data_exposure',
        likelihood: 'medium',
        impact: 'high',
        description: 'Sensitive data accessible without proper controls'
      },
      {
        type: 'unauthorized_access',
        likelihood: 'low',
        impact: 'medium',
        description: 'Weak authentication mechanisms'
      }
    ];
    
    const mitigations: Mitigation[] = [
      {
        control: 'Role-based access control implementation',
        effectiveness: 'high',
        implementation: 'immediate',
        cost: 'medium'
      },
      {
        control: 'Multi-factor authentication',
        effectiveness: 'high',
        implementation: 'short_term',
        cost: 'low'
      }
    ];
    
    return {
      level: 'medium',
      factors: riskFactors,
      mitigations,
      residualRisk: 'low'
    };
  }

  async setupAuditing(config: any): Promise<any> {
    return {
      type: 'audit_configuration',
      policies: [
        {
          name: 'Data Access Audit',
          table: config.table || 'sys_user',
          events: ['read', 'write', 'delete'],
          retention: 2555, // 7 years
          realTime: true
        },
        {
          name: 'Security Configuration Audit',
          table: 'sys_security',
          events: ['create', 'update', 'delete'],
          retention: 2555,
          realTime: true
        }
      ],
      monitoring: {
        dashboards: ['security_overview', 'compliance_status'],
        alerts: [
          {
            event: 'unauthorized_access_attempt',
            severity: 'high',
            recipients: ['security-team@company.com'],
            channels: ['email', 'slack']
          }
        ]
      }
    };
  }

  private defineAccessControls(description: string): AccessControlRule[] {
    const rules: AccessControlRule[] = [];
    
    // Default security rules
    rules.push({
      table: '*',
      operation: 'read',
      roles: ['user'],
      conditions: 'sys_domain=javascript:gs.getUser().getDomainID()'
    });
    
    if (description.includes('confidential') || description.includes('sensitive')) {
      rules.push({
        table: '*',
        operation: 'write',
        roles: ['admin', 'security_admin'],
        conditions: 'u_data_classification=confidential'
      });
    }
    
    return rules;
  }

  private classifyData(description: string): DataClassification {
    let level: 'public' | 'internal' | 'confidential' | 'restricted' = 'internal';
    
    if (description.includes('public')) level = 'public';
    else if (description.includes('confidential') || description.includes('sensitive')) level = 'confidential';
    else if (description.includes('restricted') || description.includes('secret')) level = 'restricted';
    
    return {
      level,
      categories: ['business_data'],
      retentionPeriod: level === 'restricted' ? 2555 : 1095, // 7 years or 3 years
      dataResidency: 'local'
    };
  }

  private identifyComplianceFrameworks(description: string): string[] {
    const frameworks: string[] = [];
    
    if (description.includes('gdpr')) frameworks.push('GDPR');
    if (description.includes('sox') || description.includes('sarbanes')) frameworks.push('SOX');
    if (description.includes('hipaa')) frameworks.push('HIPAA');
    if (description.includes('iso')) frameworks.push('ISO 27001');
    if (description.includes('pci')) frameworks.push('PCI DSS');
    
    // Default framework if none specified
    if (frameworks.length === 0) frameworks.push('Internal Security Policy');
    
    return frameworks;
  }

  private defineAuditRequirements(description: string): AuditConfig {
    return {
      enabled: true,
      events: ['create', 'update', 'delete', 'read'],
      retention: 2555, // 7 years
      realTimeMonitoring: description.includes('real-time') || description.includes('immediate'),
      alerting: [
        {
          event: 'security_violation',
          severity: 'high',
          recipients: ['security-team@company.com'],
          channels: ['email']
        }
      ]
    };
  }

  private assessEncryptionNeeds(description: string): EncryptionConfig {
    return {
      atRest: description.includes('encrypt') || description.includes('confidential'),
      inTransit: true, // Always encrypt in transit
      keyManagement: 'internal',
      algorithm: 'AES-256'
    };
  }

  private assessRisk(description: string): RiskAssessment {
    let level: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (description.includes('critical') || description.includes('high risk')) level = 'high';
    else if (description.includes('low risk') || description.includes('minimal')) level = 'low';
    
    return {
      level,
      factors: [
        {
          type: 'data_exposure',
          likelihood: 'low',
          impact: 'medium',
          description: 'Standard business data exposure risk'
        }
      ],
      mitigations: [
        {
          control: 'Access controls and monitoring',
          effectiveness: 'high',
          implementation: 'immediate',
          cost: 'low'
        }
      ],
      residualRisk: 'low'
    };
  }

  private createFieldLevelSecurity(accessControls: AccessControlRule[]): any[] {
    return accessControls
      .filter(rule => rule.fieldLevel)
      .flatMap(rule => 
        rule.fieldLevel!.map(field => ({
          table: rule.table,
          field: field.field,
          access: field.access,
          roles: field.roles
        }))
      );
  }
}
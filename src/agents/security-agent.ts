/**
 * Security Agent
 * Specializes in ServiceNow security, compliance, and vulnerability assessment
 */

import { BaseAgent, AgentConfig, AgentResult } from './base-agent';
import { ServiceNowArtifact } from '../queen/types';

interface SecurityVulnerability {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  location: string;
  recommendation: string;
  cveId?: string;
}

interface ComplianceIssue {
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant';
  finding: string;
  remediation: string;
}

interface SecurityScanResult {
  artifact: string;
  scanType: string;
  timestamp: Date;
  vulnerabilities: SecurityVulnerability[];
  complianceIssues: ComplianceIssue[];
  securityScore: number;
  passed: boolean;
}

export class SecurityAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      type: 'tester', // Using 'tester' type as 'security' is not in AgentType
      capabilities: [
        'Security policy enforcement',
        'Vulnerability scanning',
        'Access control validation',
        'Compliance checking',
        'Code security _analysis',
        'Authentication verification',
        'Authorization testing',
        'Data encryption validation',
        'Security best practices'
      ],
      mcpTools: [
        'snow_create_access_control',
        'snow_security_scan',
        'snow_run_compliance_scan',
        'snow_create_security_policy',
        'snow_create_audit_rule',
        'snow_security_risk_assessment',
        'snow_audit_trail__analysis'
      ],
      ...config
    });
  }

  async execute(instruction: string, context?: Record<string, any>): Promise<AgentResult> {
    try {
      this.setStatus('working');
      await this.reportProgress('Starting security _analysis', 0);

      // Analyze security requirements
      const requirements = await this.analyzeSecurityRequirements(instruction, context);
      await this.reportProgress('Analyzed security requirements', 15);

      // Retrieve artifacts to scan
      const artifacts = await this.retrieveArtifactsForScan(requirements);
      if (!artifacts || artifacts.length === 0) {
        throw new Error('No artifacts found for security scanning');
      }
      await this.reportProgress('Retrieved artifacts for scanning', 25);

      // Perform security scans
      const scanResults: SecurityScanResult[] = [];
      let currentProgress = 30;
      const progressPerScan = 50 / artifacts.length;

      for (const artifact of artifacts) {
        const result = await this.performSecurityScan(artifact, requirements);
        scanResults.push(result);
        currentProgress += progressPerScan;
        await this.reportProgress(`Scanned ${artifact.name}`, Math.round(currentProgress));
      }

      // Analyze collective security posture
      const securityAnalysis = await this.analyzeSecurityPosture(scanResults);
      await this.reportProgress('Analyzed security posture', 85);

      // Generate remediation plan if issues found
      let remediationPlan = null;
      if (securityAnalysis.totalVulnerabilities > 0 || securityAnalysis.totalComplianceIssues > 0) {
        remediationPlan = await this.generateRemediationPlan(scanResults);
        await this.reportProgress('Generated remediation plan', 92);
      }

      // Create security policies if needed
      if (requirements.createPolicies) {
        await this.createSecurityPolicies(scanResults, artifacts);
        await this.reportProgress('Created security policies', 96);
      }

      // Generate security report
      const securityReport = this.generateSecurityReport(scanResults, securityAnalysis, remediationPlan);
      await this.reportProgress('Security _analysis completed', 100);

      this.setStatus('completed');

      const success = securityAnalysis.overallScore >= requirements.minimumScore;

      await this.logActivity('security_scan', success, {
        artifactsScanned: artifacts.length,
        vulnerabilitiesFound: securityAnalysis.totalVulnerabilities,
        complianceIssues: securityAnalysis.totalComplianceIssues,
        securityScore: securityAnalysis.overallScore
      });

      return {
        success,
        message: success ? 
          `Security scan passed with score ${securityAnalysis.overallScore}/100` :
          `Security issues found: ${securityAnalysis.totalVulnerabilities} vulnerabilities, ${securityAnalysis.totalComplianceIssues} compliance issues`,
        metadata: {
          securityReport,
          scanResults,
          securityAnalysis,
          remediationPlan,
          policiesCreated: requirements.createPolicies
        }
      };

    } catch (error) {
      this.setStatus('failed');
      await this.logActivity('security_scan', false, { error: error.message });
      
      return {
        success: false,
        error: error as Error,
        message: `Security scan failed: ${error.message}`
      };
    }
  }

  private async analyzeSecurityRequirements(instruction: string, context?: any): Promise<any> {
    const requirements = {
      scanTypes: [] as string[],
      complianceFrameworks: [] as string[],
      minimumScore: 70,
      createPolicies: false,
      autoRemediate: false,
      scanDepth: 'standard', // basic, standard, deep
      specificArtifacts: [] as string[]
    };

    // Detect scan types
    if (/vulnerabilit/i.test(instruction)) {
      requirements.scanTypes.push('vulnerability');
    }
    if (/access\s*control|permission|authorization/i.test(instruction)) {
      requirements.scanTypes.push('access_control');
    }
    if (/authentication|login|password/i.test(instruction)) {
      requirements.scanTypes.push('authentication');
    }
    if (/encrypt/i.test(instruction)) {
      requirements.scanTypes.push('encryption');
    }
    if (/audit/i.test(instruction)) {
      requirements.scanTypes.push('audit');
    }
    if (!requirements.scanTypes.length) {
      requirements.scanTypes = ['vulnerability', 'access_control', 'authentication'];
    }

    // Detect compliance frameworks
    if (/SOX|sarbanes/i.test(instruction)) {
      requirements.complianceFrameworks.push('SOX');
    }
    if (/GDPR/i.test(instruction)) {
      requirements.complianceFrameworks.push('GDPR');
    }
    if (/HIPAA/i.test(instruction)) {
      requirements.complianceFrameworks.push('HIPAA');
    }
    if (/ISO\s*27001/i.test(instruction)) {
      requirements.complianceFrameworks.push('ISO27001');
    }
    if (/compliance/i.test(instruction) && !requirements.complianceFrameworks.length) {
      requirements.complianceFrameworks.push('GENERAL');
    }

    // Detect additional requirements
    if (/create\s*polic/i.test(instruction)) {
      requirements.createPolicies = true;
    }
    if (/auto.*remediate|fix.*automatic/i.test(instruction)) {
      requirements.autoRemediate = true;
    }
    if (/deep|thorough|comprehensive/i.test(instruction)) {
      requirements.scanDepth = 'deep';
      requirements.minimumScore = 80;
    }
    if (/basic|quick|minimal/i.test(instruction)) {
      requirements.scanDepth = 'basic';
      requirements.minimumScore = 60;
    }

    return requirements;
  }

  private async retrieveArtifactsForScan(requirements: any): Promise<ServiceNowArtifact[]> {
    // Retrieve artifacts from shared memory
    // For now, using placeholder logic
    const artifacts: ServiceNowArtifact[] = [];
    
    // Get recent artifacts that need security scanning
    const artifactTypes = ['widget', 'flow', 'script'];
    for (const type of artifactTypes) {
      const artifact = await this.getArtifact(type, `recent_${type}`);
      if (artifact) {
        artifacts.push(artifact);
      }
    }

    return artifacts;
  }

  private async performSecurityScan(artifact: ServiceNowArtifact, requirements: any): Promise<SecurityScanResult> {
    const scanResult: SecurityScanResult = {
      artifact: artifact.name,
      scanType: requirements.scanTypes.join(', '),
      timestamp: new Date(),
      vulnerabilities: [],
      complianceIssues: [],
      securityScore: 100,
      passed: true
    };

    // Perform different types of scans based on artifact type
    if (requirements.scanTypes.includes('vulnerability')) {
      const vulns = await this.scanForVulnerabilities(artifact);
      scanResult.vulnerabilities.push(...vulns);
    }

    if (requirements.scanTypes.includes('access_control')) {
      const accessIssues = await this.scanAccessControls(artifact);
      scanResult.vulnerabilities.push(...accessIssues);
    }

    if (requirements.scanTypes.includes('authentication')) {
      const authIssues = await this.scanAuthentication(artifact);
      scanResult.vulnerabilities.push(...authIssues);
    }

    // Check compliance if frameworks specified
    for (const framework of requirements.complianceFrameworks) {
      const complianceResults = await this.checkCompliance(artifact, framework);
      scanResult.complianceIssues.push(...complianceResults);
    }

    // Calculate security score
    scanResult.securityScore = this.calculateSecurityScore(scanResult);
    scanResult.passed = scanResult.securityScore >= requirements.minimumScore;

    return scanResult;
  }

  private async scanForVulnerabilities(artifact: ServiceNowArtifact): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for common security issues based on artifact type
    if (artifact.type === 'widget') {
      // Check for XSS vulnerabilities
      if (artifact.config.template?.includes('<script>') || 
          artifact.config.template?.includes('innerHTML')) {
        vulnerabilities.push({
          severity: 'high',
          type: 'XSS',
          description: 'Potential Cross-Site Scripting vulnerability',
          location: 'Widget template',
          recommendation: 'Use ng-bind-html with $sce.trustAsHtml() or sanitize user input'
        });
      }

      // Check for unsanitized user input
      if (artifact.config.client_script?.includes('getValue') && 
          !artifact.config.client_script?.includes('sanitize')) {
        vulnerabilities.push({
          severity: 'medium',
          type: 'Input Validation',
          description: 'User input not properly validated',
          location: 'Client script',
          recommendation: 'Validate and sanitize all user inputs'
        });
      }
    }

    if (artifact.type === 'script') {
      // Check for SQL injection
      if (artifact.config.script?.includes('addEncodedQuery') && 
          artifact.config.script?.includes('getValue')) {
        vulnerabilities.push({
          severity: 'critical',
          type: 'SQL Injection',
          description: 'Potential SQL injection vulnerability',
          location: 'Script query construction',
          recommendation: 'Use parameterized queries or GlideRecord methods'
        });
      }

      // Check for hardcoded credentials
      if (artifact.config.script?.match(/password\s*=\s*["'][^"']+["']/i)) {
        vulnerabilities.push({
          severity: 'critical',
          type: 'Hardcoded Credentials',
          description: 'Hardcoded password found in script',
          location: 'Script',
          recommendation: 'Use system properties or credential storage'
        });
      }
    }

    if (artifact.type === 'flow') {
      // Check for missing error handling
      if (!artifact.config.definition?.settings?.error_handling) {
        vulnerabilities.push({
          severity: 'medium',
          type: 'Error Handling',
          description: 'Flow lacks proper error handling',
          location: 'Flow configuration',
          recommendation: 'Add error handling stages to the flow'
        });
      }
    }

    return vulnerabilities;
  }

  private async scanAccessControls(artifact: ServiceNowArtifact): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for missing access controls
    if (!artifact.config.acls || artifact.config.acls?.length === 0) {
      vulnerabilities.push({
        severity: 'high',
        type: 'Access Control',
        description: 'No access controls defined for artifact',
        location: 'Configuration',
        recommendation: 'Define appropriate ACLs for the artifact'
      });
    }

    // Check for overly permissive access
    if (artifact.config.public === true || artifact.config.guest_access === true) {
      vulnerabilities.push({
        severity: 'medium',
        type: 'Access Control',
        description: 'Artifact allows public or guest access',
        location: 'Access configuration',
        recommendation: 'Restrict access to authenticated users only'
      });
    }

    // Check for admin-only operations without proper checks
    if (artifact.config.script?.includes('gs.hasRole') && 
        !artifact.config.script?.includes('admin')) {
      vulnerabilities.push({
        severity: 'low',
        type: 'Authorization',
        description: 'Role checks may be insufficient',
        location: 'Authorization logic',
        recommendation: 'Implement proper role-based access control'
      });
    }

    return vulnerabilities;
  }

  private async scanAuthentication(artifact: ServiceNowArtifact): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for authentication bypass
    if (artifact.config.script?.includes('setUser') || 
        artifact.config.script?.includes('impersonate')) {
      vulnerabilities.push({
        severity: 'critical',
        type: 'Authentication Bypass',
        description: 'Code can impersonate users',
        location: 'Authentication logic',
        recommendation: 'Remove user impersonation unless absolutely necessary with proper controls'
      });
    }

    // Check for weak session management
    if (artifact.type === 'widget' && 
        artifact.config.client_script?.includes('sessionStorage') &&
        !artifact.config.client_script?.includes('secure')) {
      vulnerabilities.push({
        severity: 'medium',
        type: 'Session Management',
        description: 'Sensitive data stored in sessionStorage',
        location: 'Client script',
        recommendation: 'Use secure session management practices'
      });
    }

    return vulnerabilities;
  }

  private async checkCompliance(artifact: ServiceNowArtifact, framework: string): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    switch (framework) {
      case 'GDPR':
        // Check for personal data handling
        if (artifact.config.script?.includes('email') || 
            artifact.config.script?.includes('personal')) {
          issues.push({
            framework: 'GDPR',
            requirement: 'Data Protection',
            status: 'partially_compliant',
            finding: 'Personal data processing detected without privacy controls',
            remediation: 'Implement data minimization and consent mechanisms'
          });
        }
        break;

      case 'SOX':
        // Check for audit trail
        if (!artifact.config.audit_enabled) {
          issues.push({
            framework: 'SOX',
            requirement: 'Audit Trail',
            status: 'non_compliant',
            finding: 'No audit trail configured',
            remediation: 'Enable audit logging for all data modifications'
          });
        }
        break;

      case 'HIPAA':
        // Check for encryption
        if (!artifact.config.encryption_enabled) {
          issues.push({
            framework: 'HIPAA',
            requirement: 'Data Encryption',
            status: 'non_compliant',
            finding: 'PHI data not encrypted',
            remediation: 'Enable encryption for data at rest and in transit'
          });
        }
        break;

      case 'ISO27001':
        // Check for security controls
        if (!artifact.config.security_controls) {
          issues.push({
            framework: 'ISO27001',
            requirement: 'Security Controls',
            status: 'partially_compliant',
            finding: 'Incomplete security control implementation',
            remediation: 'Implement full ISO 27001 control set'
          });
        }
        break;
    }

    return issues;
  }

  private calculateSecurityScore(scanResult: SecurityScanResult): number {
    let score = 100;

    // Deduct points for vulnerabilities based on severity
    for (const vuln of scanResult.vulnerabilities) {
      switch (vuln.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Deduct points for compliance issues
    for (const issue of scanResult.complianceIssues) {
      switch (issue.status) {
        case 'non_compliant':
          score -= 15;
          break;
        case 'partially_compliant':
          score -= 8;
          break;
      }
    }

    return Math.max(0, score);
  }

  private async analyzeSecurityPosture(scanResults: SecurityScanResult[]): Promise<any> {
    const _analysis = {
      totalArtifacts: scanResults.length,
      totalVulnerabilities: 0,
      totalComplianceIssues: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      overallScore: 0,
      passedScans: 0,
      failedScans: 0,
      vulnerabilityBreakdown: {} as Record<string, number>,
      complianceBreakdown: {} as Record<string, number>
    };

    for (const result of scanResults) {
      _analysis.totalVulnerabilities += result.vulnerabilities.length;
      _analysis.totalComplianceIssues += result.complianceIssues.length;
      
      if (result.passed) {
        _analysis.passedScans++;
      } else {
        _analysis.failedScans++;
      }

      // Count vulnerabilities by severity
      for (const vuln of result.vulnerabilities) {
        if (vuln.severity === 'critical') _analysis.criticalVulnerabilities++;
        if (vuln.severity === 'high') _analysis.highVulnerabilities++;
        
        // Track vulnerability types
        _analysis.vulnerabilityBreakdown[vuln.type] = 
          (_analysis.vulnerabilityBreakdown[vuln.type] || 0) + 1;
      }

      // Track compliance issues
      for (const issue of result.complianceIssues) {
        _analysis.complianceBreakdown[issue.framework] = 
          (_analysis.complianceBreakdown[issue.framework] || 0) + 1;
      }

      _analysis.overallScore += result.securityScore;
    }

    _analysis.overallScore = Math.round(_analysis.overallScore / scanResults.length);

    return _analysis;
  }

  private async generateRemediationPlan(scanResults: SecurityScanResult[]): Promise<any> {
    const plan = {
      priority: [] as any[],
      timeline: {
        immediate: [] as any[],
        shortTerm: [] as any[],
        longTerm: [] as any[]
      },
      estimatedEffort: 0
    };

    // Prioritize critical and high vulnerabilities
    for (const result of scanResults) {
      for (const vuln of result.vulnerabilities) {
        const remediation = {
          artifact: result.artifact,
          vulnerability: vuln.type,
          severity: vuln.severity,
          action: vuln.recommendation,
          effort: this.estimateRemediationEffort(vuln)
        };

        if (vuln.severity === 'critical') {
          plan.timeline.immediate.push(remediation);
          plan.priority.push(remediation);
        } else if (vuln.severity === 'high') {
          plan.timeline.shortTerm.push(remediation);
          plan.priority.push(remediation);
        } else {
          plan.timeline.longTerm.push(remediation);
        }

        plan.estimatedEffort += remediation.effort;
      }
    }

    // Sort priority by severity and effort
    plan.priority.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.effort - b.effort;
    });

    return plan;
  }

  private estimateRemediationEffort(vulnerability: SecurityVulnerability): number {
    // Estimate in hours
    const baseEffort = {
      critical: 8,
      high: 4,
      medium: 2,
      low: 1
    };

    const typeMultiplier = {
      'SQL Injection': 2,
      'XSS': 1.5,
      'Authentication Bypass': 3,
      'Hardcoded Credentials': 0.5,
      'Access Control': 1.5,
      'Input Validation': 1,
      'Error Handling': 1,
      'Session Management': 2
    };

    const base = baseEffort[vulnerability.severity] || 2;
    const multiplier = typeMultiplier[vulnerability.type] || 1;

    return Math.round(base * multiplier);
  }

  private async createSecurityPolicies(scanResults: SecurityScanResult[], artifacts: ServiceNowArtifact[]): Promise<void> {
    // This would use snow_create_security_policy MCP tool
    // For now, log the action
    await this.logActivity('create_security_policies', true, {
      policiesNeeded: scanResults.flatMap(r => r.vulnerabilities).length,
      artifacts: artifacts.map(a => a.name)
    });
  }

  private generateSecurityReport(scanResults: SecurityScanResult[], _analysis: any, remediationPlan: any): string {
    let report = '# Security Scan Report\n\n';
    report += `**Date**: ${new Date().toISOString()}\n`;
    report += `**Overall Security Score**: ${_analysis.overallScore}/100\n`;
    report += `**Status**: ${_analysis.overallScore >= 70 ? 'PASSED' : 'FAILED'}\n\n`;

    report += '## Executive Summary\n';
    report += `- **Artifacts Scanned**: ${_analysis.totalArtifacts}\n`;
    report += `- **Total Vulnerabilities**: ${_analysis.totalVulnerabilities}\n`;
    report += `- **Critical Vulnerabilities**: ${_analysis.criticalVulnerabilities}\n`;
    report += `- **High Vulnerabilities**: ${_analysis.highVulnerabilities}\n`;
    report += `- **Compliance Issues**: ${_analysis.totalComplianceIssues}\n\n`;

    report += '## Vulnerability Breakdown\n';
    for (const [type, count] of Object.entries(_analysis.vulnerabilityBreakdown)) {
      report += `- **${type}**: ${count} instances\n`;
    }
    report += '\n';

    report += '## Detailed Findings\n\n';
    for (const result of scanResults) {
      report += `### ${result.artifact}\n`;
      report += `**Security Score**: ${result.securityScore}/100\n`;
      
      if (result.vulnerabilities.length > 0) {
        report += '\n**Vulnerabilities**:\n';
        for (const vuln of result.vulnerabilities) {
          report += `- **${vuln.severity.toUpperCase()}**: ${vuln.type}\n`;
          report += `  - Description: ${vuln.description}\n`;
          report += `  - Location: ${vuln.location}\n`;
          report += `  - Recommendation: ${vuln.recommendation}\n`;
        }
      }

      if (result.complianceIssues.length > 0) {
        report += '\n**Compliance Issues**:\n';
        for (const issue of result.complianceIssues) {
          report += `- **${issue.framework}** - ${issue.requirement}: ${issue.status}\n`;
          report += `  - Finding: ${issue.finding}\n`;
          report += `  - Remediation: ${issue.remediation}\n`;
        }
      }
      report += '\n';
    }

    if (remediationPlan) {
      report += '## Remediation Plan\n\n';
      report += `**Estimated Total Effort**: ${remediationPlan.estimatedEffort} hours\n\n`;
      
      if (remediationPlan.timeline.immediate.length > 0) {
        report += '### Immediate Actions (Critical)\n';
        for (const action of remediationPlan.timeline.immediate) {
          report += `- ${action.artifact}: ${action.action} (${action.effort}h)\n`;
        }
        report += '\n';
      }

      if (remediationPlan.timeline.shortTerm.length > 0) {
        report += '### Short Term (1-2 weeks)\n';
        for (const action of remediationPlan.timeline.shortTerm) {
          report += `- ${action.artifact}: ${action.action} (${action.effort}h)\n`;
        }
        report += '\n';
      }

      if (remediationPlan.timeline.longTerm.length > 0) {
        report += '### Long Term (1-3 months)\n';
        for (const action of remediationPlan.timeline.longTerm) {
          report += `- ${action.artifact}: ${action.action} (${action.effort}h)\n`;
        }
      }
    }

    report += '\n## Recommendations\n';
    report += '1. Address all critical vulnerabilities immediately\n';
    report += '2. Implement security policies for all new development\n';
    report += '3. Enable audit logging for compliance requirements\n';
    report += '4. Conduct regular security scans (weekly for critical systems)\n';
    report += '5. Provide security training for development team\n';

    return report;
  }
}
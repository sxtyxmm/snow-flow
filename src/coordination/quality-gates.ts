import { EventEmitter } from 'eventemitter3';
import { QualityGate, ValidationResult, QualityGateResult } from './types';
import { logger } from '../utils/logger';

export class QualityGateManager extends EventEmitter {
  private gates: Map<string, QualityGate[]> = new Map();
  private gateResults: Map<string, QualityGateResult[]> = new Map();
  private config: QualityGateConfig;

  constructor(config: Partial<QualityGateConfig> = {}) {
    super();
    
    this.config = {
      enableBlocking: true,
      enableScoring: true,
      minPassingScore: 0.7,
      enableMetrics: true,
      timeoutMs: 30000,
      ...config
    };

    logger.info('🛡️ Quality Gate Manager initialized', { config: this.config });
  }

  addGate(taskId: string, gate: QualityGate): void {
    if (!this.gates.has(taskId)) {
      this.gates.set(taskId, []);
    }
    
    this.gates.get(taskId)!.push(gate);
    
    logger.debug('🚪 Added quality gate', { 
      taskId, 
      gateName: gate.name, 
      blocking: gate.blocking 
    });
  }

  async validateTask(taskId: string, result: any): Promise<QualityGateResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🔍 Starting quality gate validation', { taskId });

      const gates = this.gates.get(taskId) || [];
      
      if (gates.length === 0) {
        logger.debug('⚠️ No quality gates configured for task', { taskId });
        return this.createPassingResult(taskId, startTime);
      }

      const validationResults: ValidationResult[] = [];
      let overallPassed = true;
      let blockingFailure = false;

      // Execute all quality gates
      for (const gate of gates) {
        try {
          logger.debug('🔍 Executing quality gate', { 
            taskId, 
            gateName: gate.name 
          });

          const validation = await this.executeGateWithTimeout(gate, result);
          validationResults.push(validation);

          if (!validation.passed) {
            if (gate.blocking) {
              blockingFailure = true;
              overallPassed = false;
              
              logger.warn('🚫 Blocking quality gate failed', { 
                taskId, 
                gateName: gate.name,
                error: validation.error 
              });
            } else {
              logger.warn('⚠️ Non-blocking quality gate failed', { 
                taskId, 
                gateName: gate.name,
                error: validation.error 
              });
            }
          }

        } catch (error) {
          logger.error('❌ Quality gate execution failed', { 
            taskId, 
            gateName: gate.name, 
            error: error.message 
          });

          const failedValidation: ValidationResult = {
            passed: false,
            error: `Gate execution failed: ${error.message}`,
            suggestions: ['Check gate configuration', 'Verify input data format']
          };

          validationResults.push(failedValidation);

          if (gate.blocking) {
            blockingFailure = true;
            overallPassed = false;
          }
        }
      }

      const result_obj: QualityGateResult = {
        gateName: `quality_gates_${taskId}`,
        passed: overallPassed,
        blocking: blockingFailure,
        validations: validationResults,
        overallScore: this.calculateOverallScore(validationResults),
        executionTime: Date.now() - startTime
      };

      // Store results for analytics
      if (!this.gateResults.has(taskId)) {
        this.gateResults.set(taskId, []);
      }
      this.gateResults.get(taskId)!.push(result_obj);

      // Emit events
      if (overallPassed) {
        this.emit('gate:passed', { taskId, result: result_obj });
        logger.info('✅ Quality gates passed', { 
          taskId, 
          gatesCount: gates.length,
          score: result_obj.overallScore 
        });
      } else {
        this.emit('gate:failed', { taskId, result: result_obj });
        logger.error('❌ Quality gates failed', { 
          taskId, 
          blocking: blockingFailure,
          failedGates: validationResults.filter(v => !v.passed).length
        });
      }

      return result_obj;

    } catch (error) {
      logger.error('💥 Quality gate validation crashed', { taskId, error: error.message });
      
      return {
        gateName: `quality_gates_${taskId}`,
        passed: false,
        blocking: true,
        validations: [{
          passed: false,
          error: `Validation system error: ${error.message}`
        }],
        executionTime: Date.now() - startTime
      };
    }
  }

  private async executeGateWithTimeout(gate: QualityGate, result: any): Promise<ValidationResult> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Quality gate '${gate.name}' timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      try {
        const validation = await gate.validate(result);
        clearTimeout(timeout);
        resolve(validation);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private calculateOverallScore(validations: ValidationResult[]): number {
    if (!this.config.enableScoring || validations.length === 0) {
      return 1.0;
    }

    const scores = validations
      .filter(v => typeof v.score === 'number')
      .map(v => v.score!);

    if (scores.length === 0) {
      // Fall back to pass/fail scoring
      const passed = validations.filter(v => v.passed).length;
      return passed / validations.length;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private createPassingResult(taskId: string, startTime: number): QualityGateResult {
    return {
      gateName: `quality_gates_${taskId}`,
      passed: true,
      blocking: false,
      validations: [],
      overallScore: 1.0,
      executionTime: Date.now() - startTime
    };
  }

  // Analytics and reporting
  async getGateStatistics(taskId?: string): Promise<GateStatistics> {
    const allResults = taskId 
      ? this.gateResults.get(taskId) || []
      : Array.from(this.gateResults.values()).flat();

    if (allResults.length === 0) {
      return {
        totalExecutions: 0,
        passRate: 0,
        averageScore: 0,
        averageExecutionTime: 0,
        mostCommonFailures: []
      };
    }

    const passed = allResults.filter(r => r.passed).length;
    const scores = allResults
      .filter(r => typeof r.overallScore === 'number')
      .map(r => r.overallScore!);
    
    const failures = allResults
      .filter(r => !r.passed)
      .flatMap(r => r.validations)
      .filter(v => !v.passed && v.error)
      .map(v => v.error!)
      .reduce((counts, error) => {
        counts[error] = (counts[error] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    const mostCommonFailures = Object.entries(failures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    return {
      totalExecutions: allResults.length,
      passRate: passed / allResults.length,
      averageScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0,
      averageExecutionTime: allResults.reduce((sum, r) => sum + r.executionTime, 0) / allResults.length,
      mostCommonFailures
    };
  }

  // Predefined Quality Gates
  createCodeQualityGate(options: CodeQualityOptions = {}): QualityGate {
    return new CodeQualityGate(options);
  }

  createSecurityGate(options: SecurityGateOptions = {}): QualityGate {
    return new SecurityGate(options);
  }

  createPerformanceGate(options: PerformanceGateOptions = {}): QualityGate {
    return new PerformanceGate(options);
  }

  createServiceNowGate(options: ServiceNowGateOptions = {}): QualityGate {
    return new ServiceNowGate(options);
  }

  createBusinessLogicGate(options: BusinessLogicGateOptions = {}): QualityGate {
    return new BusinessLogicGate(options);
  }
}

// Predefined Quality Gate Implementations

export class CodeQualityGate implements QualityGate {
  name = 'Code Quality';
  blocking: boolean;
  private options: Required<CodeQualityOptions>;

  constructor(options: CodeQualityOptions = {}) {
    this.blocking = options.blocking ?? true;
    this.options = {
      maxComplexity: 10,
      minCoverage: 80,
      maxLines: 1000,
      requireDocumentation: true,
      checkNaming: true,
      blocking: true,
      ...options
    };
  }

  async validate(result: any): Promise<ValidationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    // Check code complexity
    if (result.code && result.complexity > this.options.maxComplexity) {
      issues.push(`Code complexity ${result.complexity} exceeds maximum ${this.options.maxComplexity}`);
      score -= 0.3;
    }

    // Check test coverage
    if (result.coverage && result.coverage < this.options.minCoverage) {
      issues.push(`Test coverage ${result.coverage}% below minimum ${this.options.minCoverage}%`);
      score -= 0.2;
    }

    // Check code length
    if (result.code && result.code.split('\n').length > this.options.maxLines) {
      warnings.push(`Code is very long (${result.code.split('\n').length} lines)`);
      score -= 0.1;
    }

    // Check documentation
    if (this.options.requireDocumentation && result.code && !this.hasDocumentation(result.code)) {
      warnings.push('Missing documentation');
      score -= 0.1;
    }

    return {
      passed: issues.length === 0,
      score: Math.max(score, 0),
      error: issues.length > 0 ? issues.join('; ') : undefined,
      warnings,
      suggestions: this.generateCodeSuggestions(issues, warnings)
    };
  }

  private hasDocumentation(code: string): boolean {
    return /\/\*\*|\*\/|\/\//.test(code);
  }

  private generateCodeSuggestions(issues: string[], warnings: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.some(i => i.includes('complexity'))) {
      suggestions.push('Consider breaking down complex functions into smaller ones');
      suggestions.push('Use early returns to reduce nesting');
    }
    
    if (issues.some(i => i.includes('coverage'))) {
      suggestions.push('Add more unit tests');
      suggestions.push('Test edge cases and error conditions');
    }
    
    if (warnings.some(w => w.includes('documentation'))) {
      suggestions.push('Add JSDoc comments to public functions');
      suggestions.push('Document complex business logic');
    }

    return suggestions;
  }
}

export class SecurityGate implements QualityGate {
  name = 'Security Review';
  blocking = true;
  private options: Required<SecurityGateOptions>;

  constructor(options: SecurityGateOptions = {}) {
    this.options = {
      checkInjection: true,
      checkXSS: true,
      checkAuth: true,
      checkSecrets: true,
      checkPermissions: true,
      ...options
    };
  }

  async validate(result: any): Promise<ValidationResult> {
    const vulnerabilities: string[] = [];
    let score = 1.0;

    if (result.code) {
      // Check for SQL injection vulnerabilities
      if (this.options.checkInjection && this.hasSQLInjectionRisk(result.code)) {
        vulnerabilities.push('Potential SQL injection vulnerability detected');
        score -= 0.4;
      }

      // Check for XSS vulnerabilities
      if (this.options.checkXSS && this.hasXSSRisk(result.code)) {
        vulnerabilities.push('Potential XSS vulnerability detected');
        score -= 0.3;
      }

      // Check for hardcoded secrets
      if (this.options.checkSecrets && this.hasHardcodedSecrets(result.code)) {
        vulnerabilities.push('Hardcoded secrets or credentials detected');
        score -= 0.5;
      }
    }

    // Check ServiceNow specific security
    if (result.servicenow) {
      if (this.options.checkAuth && !this.hasProperAuthentication(result.servicenow)) {
        vulnerabilities.push('Missing or weak authentication controls');
        score -= 0.3;
      }

      if (this.options.checkPermissions && !this.hasProperPermissions(result.servicenow)) {
        vulnerabilities.push('Insufficient access controls');
        score -= 0.2;
      }
    }

    return {
      passed: vulnerabilities.length === 0,
      score: Math.max(score, 0),
      error: vulnerabilities.length > 0 ? vulnerabilities.join('; ') : undefined,
      suggestions: this.generateSecuritySuggestions(vulnerabilities)
    };
  }

  private hasSQLInjectionRisk(code: string): boolean {
    const patterns = [
      /query\s*\+\s*['"`]/i,
      /\$\{.*\}/,
      /\.addQuery\(/i
    ];
    return patterns.some(pattern => pattern.test(code));
  }

  private hasXSSRisk(code: string): boolean {
    const patterns = [
      /innerHTML\s*=/i,
      /document\.write\(/i,
      /eval\(/i
    ];
    return patterns.some(pattern => pattern.test(code));
  }

  private hasHardcodedSecrets(code: string): boolean {
    const patterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i
    ];
    return patterns.some(pattern => pattern.test(code));
  }

  private hasProperAuthentication(servicenow: any): boolean {
    return servicenow.authMethod && servicenow.authMethod !== 'none';
  }

  private hasProperPermissions(servicenow: any): boolean {
    return servicenow.accessControls && servicenow.accessControls.length > 0;
  }

  private generateSecuritySuggestions(vulnerabilities: string[]): string[] {
    const suggestions: string[] = [];
    
    if (vulnerabilities.some(v => v.includes('injection'))) {
      suggestions.push('Use parameterized queries or prepared statements');
      suggestions.push('Validate and sanitize all user inputs');
    }
    
    if (vulnerabilities.some(v => v.includes('XSS'))) {
      suggestions.push('Use proper output encoding');
      suggestions.push('Implement Content Security Policy (CSP)');
    }
    
    if (vulnerabilities.some(v => v.includes('secrets'))) {
      suggestions.push('Use environment variables for secrets');
      suggestions.push('Implement secure credential management');
    }

    return suggestions;
  }
}

export class PerformanceGate implements QualityGate {
  name = 'Performance Validation';
  blocking = false;
  private options: Required<PerformanceGateOptions>;

  constructor(options: PerformanceGateOptions = {}) {
    this.options = {
      maxResponseTime: 5000,
      maxMemoryUsage: 100,
      minThroughput: 100,
      blocking: false,
      ...options
    };
  }

  async validate(result: any): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 1.0;

    if (result.performance) {
      const perf = result.performance;
      
      if (perf.responseTime > this.options.maxResponseTime) {
        issues.push(`Response time ${perf.responseTime}ms exceeds maximum ${this.options.maxResponseTime}ms`);
        score -= 0.3;
      }

      if (perf.memoryUsage > this.options.maxMemoryUsage) {
        issues.push(`Memory usage ${perf.memoryUsage}MB exceeds maximum ${this.options.maxMemoryUsage}MB`);
        score -= 0.2;
      }

      if (perf.throughput < this.options.minThroughput) {
        issues.push(`Throughput ${perf.throughput} below minimum ${this.options.minThroughput}`);
        score -= 0.2;
      }
    }

    return {
      passed: issues.length === 0,
      score: Math.max(score, 0),
      error: issues.length > 0 ? issues.join('; ') : undefined,
      suggestions: this.generatePerformanceSuggestions(issues)
    };
  }

  private generatePerformanceSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.some(i => i.includes('response time'))) {
      suggestions.push('Optimize database queries');
      suggestions.push('Implement caching strategies');
      suggestions.push('Consider pagination for large datasets');
    }
    
    if (issues.some(i => i.includes('memory'))) {
      suggestions.push('Review object lifecycle management');
      suggestions.push('Implement lazy loading');
    }

    return suggestions;
  }
}

export class ServiceNowGate implements QualityGate {
  name = 'ServiceNow Compliance';
  blocking = true;
  private options: Required<ServiceNowGateOptions>;

  constructor(options: ServiceNowGateOptions = {}) {
    this.options = {
      checkScope: true,
      checkUpdateSet: true,
      checkNaming: true,
      checkDependencies: true,
      blocking: true,
      ...options
    };
  }

  async validate(result: any): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 1.0;

    // Check ServiceNow specific requirements
    if (this.options.checkScope && !this.hasValidScope(result)) {
      issues.push('Invalid or missing ServiceNow scope configuration');
      score -= 0.3;
    }

    if (this.options.checkUpdateSet && !this.hasValidUpdateSet(result)) {
      issues.push('Missing or invalid update set tracking');
      score -= 0.4;
    }

    if (this.options.checkNaming && !this.hasValidNaming(result)) {
      issues.push('ServiceNow naming conventions not followed');
      score -= 0.2;
    }

    if (this.options.checkDependencies && !this.hasValidDependencies(result)) {
      issues.push('Missing or invalid ServiceNow dependencies');
      score -= 0.2;
    }

    return {
      passed: issues.length === 0,
      score: Math.max(score, 0),
      error: issues.length > 0 ? issues.join('; ') : undefined,
      suggestions: this.generateServiceNowSuggestions(issues)
    };
  }

  private hasValidScope(result: any): boolean {
    return result.servicenow?.scope && result.servicenow.scope.length > 0;
  }

  private hasValidUpdateSet(result: any): boolean {
    return result.servicenow?.updateSet || result.updateSetId;
  }

  private hasValidNaming(result: any): boolean {
    // Check if names follow ServiceNow conventions
    if (result.name) {
      return /^[a-z][a-z0-9_]*$/.test(result.name);
    }
    return true;
  }

  private hasValidDependencies(result: any): boolean {
    // Check for required ServiceNow dependencies
    return true; // Simplified - would check actual dependencies
  }

  private generateServiceNowSuggestions(issues: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.some(i => i.includes('scope'))) {
      suggestions.push('Configure proper ServiceNow application scope');
    }
    
    if (issues.some(i => i.includes('update set'))) {
      suggestions.push('Ensure all changes are tracked in update sets');
    }
    
    if (issues.some(i => i.includes('naming'))) {
      suggestions.push('Follow ServiceNow naming conventions (lowercase, underscores)');
    }

    return suggestions;
  }
}

export class BusinessLogicGate implements QualityGate {
  name = 'Business Logic Validation';
  blocking = true;
  private options: Required<BusinessLogicGateOptions>;

  constructor(options: BusinessLogicGateOptions = {}) {
    this.options = {
      checkRequirements: true,
      checkOutputs: true,
      checkErrorHandling: true,
      blocking: true,
      ...options
    };
  }

  async validate(result: any): Promise<ValidationResult> {
    const issues: string[] = [];
    let score = 1.0;

    // Check business requirements compliance
    if (this.options.checkRequirements && !this.meetsBusinessRequirements(result)) {
      issues.push('Does not meet specified business requirements');
      score -= 0.4;
    }

    // Check expected outputs
    if (this.options.checkOutputs && !this.hasExpectedOutputs(result)) {
      issues.push('Missing expected outputs or data structures');
      score -= 0.3;
    }

    // Check error handling
    if (this.options.checkErrorHandling && !this.hasProperErrorHandling(result)) {
      issues.push('Insufficient error handling implementation');
      score -= 0.2;
    }

    return {
      passed: issues.length === 0,
      score: Math.max(score, 0),
      error: issues.length > 0 ? issues.join('; ') : undefined,
      suggestions: ['Review business requirements', 'Implement comprehensive error handling']
    };
  }

  private meetsBusinessRequirements(result: any): boolean {
    // Simplified - would check against actual business requirements
    return result.businessLogic && Object.keys(result.businessLogic).length > 0;
  }

  private hasExpectedOutputs(result: any): boolean {
    return result.outputs && Array.isArray(result.outputs) && result.outputs.length > 0;
  }

  private hasProperErrorHandling(result: any): boolean {
    if (result.code) {
      return /try\s*\{|catch\s*\(|throw\s+|error/i.test(result.code);
    }
    return true;
  }
}

// Configuration interfaces
interface QualityGateConfig {
  enableBlocking: boolean;
  enableScoring: boolean;
  minPassingScore: number;
  enableMetrics: boolean;
  timeoutMs: number;
}

interface CodeQualityOptions {
  maxComplexity?: number;
  minCoverage?: number;
  maxLines?: number;
  requireDocumentation?: boolean;
  checkNaming?: boolean;
  blocking?: boolean;
}

interface SecurityGateOptions {
  checkInjection?: boolean;
  checkXSS?: boolean;
  checkAuth?: boolean;
  checkSecrets?: boolean;
  checkPermissions?: boolean;
}

interface PerformanceGateOptions {
  maxResponseTime?: number;
  maxMemoryUsage?: number;
  minThroughput?: number;
  blocking?: boolean;
}

interface ServiceNowGateOptions {
  checkScope?: boolean;
  checkUpdateSet?: boolean;
  checkNaming?: boolean;
  checkDependencies?: boolean;
  blocking?: boolean;
}

interface BusinessLogicGateOptions {
  checkRequirements?: boolean;
  checkOutputs?: boolean;
  checkErrorHandling?: boolean;
  blocking?: boolean;
}

interface GateStatistics {
  totalExecutions: number;
  passRate: number;
  averageScore: number;
  averageExecutionTime: number;
  mostCommonFailures: { error: string; count: number }[];
}
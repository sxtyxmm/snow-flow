/**
 * ServiceNow Flow Validation Engine
 * 
 * This module implements comprehensive validation logic for flow vs subflow decisions,
 * ensuring that the recommendations are sound and the created flows/subflows are valid.
 */

import { Logger } from '../utils/logger.js';
import { 
  FlowType, 
  ComplexityLevel, 
  ReusabilityLevel, 
  FlowContext,
  DecisionCriteria,
  FlowAnalysisResult,
  SubflowCandidate
} from './flow-subflow-decision-engine.js';
import { SubflowDefinition } from './subflow-creation-handler.js';
import { FlowTemplate } from './flow-pattern-templates.js';

/**
 * Validation severity levels
 */
export enum ValidationSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Validation rule types
 */
export enum ValidationRuleType {
  DECISION_LOGIC = 'decision_logic',
  COMPLEXITY_ANALYSIS = 'complexity_analysis',
  REUSABILITY_ANALYSIS = 'reusability_analysis',
  TECHNICAL_FEASIBILITY = 'technical_feasibility',
  BEST_PRACTICES = 'best_practices',
  PERFORMANCE = 'performance',
  MAINTAINABILITY = 'maintainability',
  SECURITY = 'security'
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  severity: ValidationSeverity;
  issues: ValidationIssue[];
  recommendations: ValidationRecommendation[];
  score: number;
  maxScore: number;
}

/**
 * Validation issue
 */
export interface ValidationIssue {
  id: string;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  message: string;
  description: string;
  location?: string;
  suggestedFix?: string;
  impact: string;
  ruleId: string;
}

/**
 * Validation recommendation
 */
export interface ValidationRecommendation {
  id: string;
  type: ValidationRuleType;
  priority: 'low' | 'medium' | 'high';
  message: string;
  description: string;
  benefits: string[];
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Validation rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: ValidationRuleType;
  severity: ValidationSeverity;
  weight: number;
  applicableContexts: FlowContext[];
  applicableTypes: FlowType[];
  validator: (context: ValidationContext) => ValidationRuleResult;
}

/**
 * Validation context
 */
export interface ValidationContext {
  instruction: string;
  analysisResult?: FlowAnalysisResult;
  subflowDefinition?: SubflowDefinition;
  flowTemplate?: FlowTemplate;
  criteria?: DecisionCriteria;
  targetType?: FlowType;
  metadata?: Record<string, any>;
}

/**
 * Validation rule result
 */
export interface ValidationRuleResult {
  passed: boolean;
  score: number;
  issues: Omit<ValidationIssue, 'ruleId' | 'id'>[];
  recommendations: Omit<ValidationRecommendation, 'id'>[];
}

/**
 * Flow Validation Engine
 */
export class FlowValidationEngine {
  private logger: Logger;
  private rules: Map<string, ValidationRule> = new Map();

  constructor() {
    this.logger = new Logger('FlowValidationEngine');
    this.initializeValidationRules();
  }

  /**
   * Validate flow vs subflow decision
   */
  validateDecision(analysisResult: FlowAnalysisResult, instruction: string): ValidationResult {
    this.logger.info('Validating flow vs subflow decision', {
      recommendedType: analysisResult.recommendedType,
      confidence: analysisResult.confidence
    });

    const context: ValidationContext = {
      instruction,
      analysisResult,
      criteria: analysisResult.criteria,
      targetType: analysisResult.recommendedType
    };

    return this.executeValidation(context);
  }

  /**
   * Validate subflow definition
   */
  validateSubflowDefinition(definition: SubflowDefinition, instruction: string): ValidationResult {
    this.logger.info('Validating subflow definition', {
      name: definition.name,
      activityCount: definition.activities.length
    });

    const context: ValidationContext = {
      instruction,
      subflowDefinition: definition,
      targetType: FlowType.SUBFLOW
    };

    return this.executeValidation(context);
  }

  /**
   * Validate flow template application
   */
  validateTemplateApplication(template: FlowTemplate, instruction: string): ValidationResult {
    this.logger.info('Validating template application', {
      templateId: template.id,
      templateName: template.name
    });

    const context: ValidationContext = {
      instruction,
      flowTemplate: template,
      targetType: template.recommendedType
    };

    return this.executeValidation(context);
  }

  /**
   * Validate subflow candidate
   */
  validateSubflowCandidate(candidate: SubflowCandidate, instruction: string): ValidationResult {
    this.logger.info('Validating subflow candidate', {
      name: candidate.name,
      complexity: candidate.complexity
    });

    const context: ValidationContext = {
      instruction,
      targetType: FlowType.SUBFLOW,
      metadata: {
        candidate
      }
    };

    return this.executeValidation(context);
  }

  /**
   * Execute validation with applicable rules
   */
  private executeValidation(context: ValidationContext): ValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: ValidationRecommendation[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Get applicable rules
    const applicableRules = this.getApplicableRules(context);

    // Execute each rule
    for (const rule of applicableRules) {
      try {
        const result = rule.validator(context);
        
        // Calculate score
        totalScore += result.score;
        maxScore += rule.weight;

        // Add issues with rule ID
        for (const issue of result.issues) {
          issues.push({
            ...issue,
            id: `${rule.id}_${issues.length + 1}`,
            ruleId: rule.id
          });
        }

        // Add recommendations with ID
        for (const recommendation of result.recommendations) {
          recommendations.push({
            ...recommendation,
            id: `${rule.id}_rec_${recommendations.length + 1}`
          });
        }

      } catch (error) {
        this.logger.error(`Validation rule ${rule.id} failed`, error);
        issues.push({
          id: `${rule.id}_error`,
          type: rule.type,
          severity: ValidationSeverity.ERROR,
          message: `Validation rule failed: ${rule.name}`,
          description: `Internal error in validation rule: ${error}`,
          impact: 'Validation incomplete',
          ruleId: rule.id
        });
      }
    }

    // Determine overall validation result
    const criticalIssues = issues.filter(i => i.severity === ValidationSeverity.CRITICAL);
    const errorIssues = issues.filter(i => i.severity === ValidationSeverity.ERROR);
    
    const isValid = criticalIssues.length === 0 && errorIssues.length === 0;
    const overallSeverity = this.determineOverallSeverity(issues);

    return {
      isValid,
      severity: overallSeverity,
      issues,
      recommendations,
      score: totalScore,
      maxScore
    };
  }

  /**
   * Get applicable validation rules for context
   */
  private getApplicableRules(context: ValidationContext): ValidationRule[] {
    const applicableRules: ValidationRule[] = [];

    for (const rule of this.rules.values()) {
      // Check if rule applies to target type
      if (context.targetType && !rule.applicableTypes.includes(context.targetType)) {
        continue;
      }

      // Check if rule applies to context
      if (context.analysisResult?.criteria.context) {
        if (rule.applicableContexts.length > 0 && 
            !rule.applicableContexts.includes(context.analysisResult.criteria.context)) {
          continue;
        }
      }

      applicableRules.push(rule);
    }

    return applicableRules;
  }

  /**
   * Determine overall validation severity
   */
  private determineOverallSeverity(issues: ValidationIssue[]): ValidationSeverity {
    if (issues.some(i => i.severity === ValidationSeverity.CRITICAL)) {
      return ValidationSeverity.CRITICAL;
    }
    if (issues.some(i => i.severity === ValidationSeverity.ERROR)) {
      return ValidationSeverity.ERROR;
    }
    if (issues.some(i => i.severity === ValidationSeverity.WARNING)) {
      return ValidationSeverity.WARNING;
    }
    return ValidationSeverity.INFO;
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Decision Logic Validation Rules
    this.rules.set('decision_confidence', {
      id: 'decision_confidence',
      name: 'Decision Confidence',
      description: 'Validate that the decision confidence is reasonable',
      type: ValidationRuleType.DECISION_LOGIC,
      severity: ValidationSeverity.WARNING,
      weight: 10,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const confidence = context.analysisResult?.confidence || 0;
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        
        let score = 10;
        
        if (confidence < 0.5) {
          score = 3;
          issues.push({
            type: ValidationRuleType.DECISION_LOGIC,
            severity: ValidationSeverity.WARNING,
            message: 'Low decision confidence',
            description: `Decision confidence is ${confidence.toFixed(2)}, which is below the recommended threshold of 0.5`,
            impact: 'Decision may not be optimal',
            suggestedFix: 'Review the requirements and consider providing more specific details'
          });
          
          recommendations.push({
            type: ValidationRuleType.DECISION_LOGIC,
            priority: 'high',
            message: 'Provide more specific requirements',
            description: 'Add more specific details about the workflow to improve decision confidence',
            benefits: ['More accurate recommendations', 'Better fit for requirements'],
            implementation: 'Include specific actions, data flows, and business rules in the instruction',
            effort: 'low'
          });
        } else if (confidence < 0.7) {
          score = 7;
          issues.push({
            type: ValidationRuleType.DECISION_LOGIC,
            severity: ValidationSeverity.INFO,
            message: 'Moderate decision confidence',
            description: `Decision confidence is ${confidence.toFixed(2)}, which is acceptable but could be improved`,
            impact: 'Decision is likely correct but may benefit from refinement',
            suggestedFix: 'Consider adding more context or specific requirements'
          });
        }

        return {
          passed: confidence >= 0.5,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('complexity_appropriateness', {
      id: 'complexity_appropriateness',
      name: 'Complexity Appropriateness',
      description: 'Validate that the complexity level matches the recommended flow type',
      type: ValidationRuleType.COMPLEXITY_ANALYSIS,
      severity: ValidationSeverity.WARNING,
      weight: 15,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const complexity = context.analysisResult?.criteria.complexity || context.metadata?.candidate?.complexity;
        const recommendedType = context.analysisResult?.recommendedType || context.targetType;
        
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 15;

        // High complexity should generally favor subflows if reusable
        if (complexity === ComplexityLevel.HIGH || complexity === ComplexityLevel.VERY_HIGH) {
          const reusability = context.analysisResult?.criteria.reusability || context.metadata?.candidate?.reusability;
          
          if (recommendedType === FlowType.MAIN_FLOW && reusability === ReusabilityLevel.HIGH) {
            score = 5;
            issues.push({
              type: ValidationRuleType.COMPLEXITY_ANALYSIS,
              severity: ValidationSeverity.WARNING,
              message: 'High complexity with high reusability in main flow',
              description: 'Complex workflows with high reusability potential should consider subflow implementation',
              impact: 'Missed opportunity for reusability and maintainability',
              suggestedFix: 'Consider breaking complex logic into reusable subflows'
            });
            
            recommendations.push({
              type: ValidationRuleType.COMPLEXITY_ANALYSIS,
              priority: 'medium',
              message: 'Consider subflow implementation',
              description: 'Break complex logic into reusable subflows for better maintainability',
              benefits: ['Improved reusability', 'Better maintainability', 'Easier testing'],
              implementation: 'Identify reusable components and extract them into subflows',
              effort: 'medium'
            });
          }
        }

        // Low complexity should generally favor main flows unless highly reusable
        if (complexity === ComplexityLevel.LOW) {
          if (recommendedType === FlowType.SUBFLOW) {
            const reusability = context.analysisResult?.criteria.reusability || context.metadata?.candidate?.reusability;
            
            if (reusability === ReusabilityLevel.LOW || reusability === ReusabilityLevel.NONE) {
              score = 8;
              issues.push({
                type: ValidationRuleType.COMPLEXITY_ANALYSIS,
                severity: ValidationSeverity.INFO,
                message: 'Low complexity with low reusability as subflow',
                description: 'Simple workflows with low reusability might be better as main flows',
                impact: 'Over-engineering for current needs',
                suggestedFix: 'Consider implementing as main flow unless reusability is important'
              });
            }
          }
        }

        return {
          passed: score >= 10,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('reusability_validation', {
      id: 'reusability_validation',
      name: 'Reusability Validation',
      description: 'Validate that reusability assessment is appropriate for the recommended flow type',
      type: ValidationRuleType.REUSABILITY_ANALYSIS,
      severity: ValidationSeverity.WARNING,
      weight: 15,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const reusability = context.analysisResult?.criteria.reusability || context.metadata?.candidate?.reusability;
        const recommendedType = context.analysisResult?.recommendedType || context.targetType;
        
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 15;

        // High reusability should favor subflows
        if (reusability === ReusabilityLevel.HIGH && recommendedType === FlowType.MAIN_FLOW) {
          score = 5;
          issues.push({
            type: ValidationRuleType.REUSABILITY_ANALYSIS,
            severity: ValidationSeverity.WARNING,
            message: 'High reusability potential in main flow',
            description: 'Workflows with high reusability should be implemented as subflows',
            impact: 'Lost opportunity for reuse across multiple flows',
            suggestedFix: 'Implement as subflow to maximize reusability'
          });
          
          recommendations.push({
            type: ValidationRuleType.REUSABILITY_ANALYSIS,
            priority: 'high',
            message: 'Implement as subflow',
            description: 'Create subflow to enable reuse across multiple workflows',
            benefits: ['Code reuse', 'Consistency', 'Easier maintenance'],
            implementation: 'Design subflow with clear inputs and outputs',
            effort: 'medium'
          });
        }

        // Low reusability in subflow might be over-engineering
        if (reusability === ReusabilityLevel.NONE && recommendedType === FlowType.SUBFLOW) {
          score = 8;
          issues.push({
            type: ValidationRuleType.REUSABILITY_ANALYSIS,
            severity: ValidationSeverity.INFO,
            message: 'No reusability in subflow',
            description: 'Creating subflow with no reusability potential might be over-engineering',
            impact: 'Unnecessary complexity',
            suggestedFix: 'Consider main flow implementation unless other factors apply'
          });
        }

        return {
          passed: score >= 10,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('technical_feasibility', {
      id: 'technical_feasibility',
      name: 'Technical Feasibility',
      description: 'Validate technical feasibility of the recommended approach',
      type: ValidationRuleType.TECHNICAL_FEASIBILITY,
      severity: ValidationSeverity.ERROR,
      weight: 20,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 20;

        // Check for subflow input/output requirements
        if (context.targetType === FlowType.SUBFLOW) {
          const candidate = context.metadata?.candidate;
          const definition = context.subflowDefinition;
          
          if (candidate && candidate.inputs.length === 0) {
            score = 0;
            issues.push({
              type: ValidationRuleType.TECHNICAL_FEASIBILITY,
              severity: ValidationSeverity.ERROR,
              message: 'Subflow has no input parameters',
              description: 'Subflows must have at least one input parameter to be reusable',
              impact: 'Subflow cannot be properly invoked',
              suggestedFix: 'Add appropriate input parameters'
            });
          }
          
          if (candidate && candidate.outputs.length === 0) {
            score = Math.min(score, 5);
            issues.push({
              type: ValidationRuleType.TECHNICAL_FEASIBILITY,
              severity: ValidationSeverity.ERROR,
              message: 'Subflow has no output parameters',
              description: 'Subflows should have at least one output parameter',
              impact: 'Subflow results cannot be used by calling flows',
              suggestedFix: 'Add appropriate output parameters'
            });
          }
          
          if (definition && definition.activities.length < 3) {
            score = Math.min(score, 10);
            issues.push({
              type: ValidationRuleType.TECHNICAL_FEASIBILITY,
              severity: ValidationSeverity.WARNING,
              message: 'Subflow has very few activities',
              description: 'Subflow should have meaningful processing activities',
              impact: 'Subflow may not provide sufficient value',
              suggestedFix: 'Ensure subflow has adequate processing logic'
            });
          }
        }

        return {
          passed: score >= 15,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('best_practices', {
      id: 'best_practices',
      name: 'Best Practices',
      description: 'Validate adherence to ServiceNow flow best practices',
      type: ValidationRuleType.BEST_PRACTICES,
      severity: ValidationSeverity.INFO,
      weight: 10,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 10;

        // Check for error handling
        const definition = context.subflowDefinition;
        if (definition && definition.errorHandling.length === 0) {
          score = 7;
          issues.push({
            type: ValidationRuleType.BEST_PRACTICES,
            severity: ValidationSeverity.INFO,
            message: 'No error handling defined',
            description: 'Flow should include error handling for robustness',
            impact: 'Flow may fail ungracefully',
            suggestedFix: 'Add error handling activities'
          });
          
          recommendations.push({
            type: ValidationRuleType.BEST_PRACTICES,
            priority: 'medium',
            message: 'Add error handling',
            description: 'Include error handling to improve flow robustness',
            benefits: ['Better error recovery', 'Improved user experience'],
            implementation: 'Add try-catch patterns and error notifications',
            effort: 'low'
          });
        }

        // Check for documentation
        if (definition && (!definition.metadata.documentation || definition.metadata.documentation.length < 50)) {
          score = Math.min(score, 8);
          recommendations.push({
            type: ValidationRuleType.BEST_PRACTICES,
            priority: 'low',
            message: 'Add comprehensive documentation',
            description: 'Document the flow purpose, inputs, outputs, and usage',
            benefits: ['Better maintainability', 'Easier onboarding'],
            implementation: 'Add detailed description and usage examples',
            effort: 'low'
          });
        }

        return {
          passed: score >= 7,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('performance_considerations', {
      id: 'performance_considerations',
      name: 'Performance Considerations',
      description: 'Validate performance implications of the recommended approach',
      type: ValidationRuleType.PERFORMANCE,
      severity: ValidationSeverity.WARNING,
      weight: 10,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 10;

        // Check for excessive complexity
        const complexity = context.analysisResult?.criteria.complexity;
        if (complexity === ComplexityLevel.VERY_HIGH) {
          score = 6;
          issues.push({
            type: ValidationRuleType.PERFORMANCE,
            severity: ValidationSeverity.WARNING,
            message: 'Very high complexity may impact performance',
            description: 'Extremely complex flows can have performance implications',
            impact: 'Slow execution, resource consumption',
            suggestedFix: 'Consider breaking into smaller, more focused flows'
          });
          
          recommendations.push({
            type: ValidationRuleType.PERFORMANCE,
            priority: 'medium',
            message: 'Optimize for performance',
            description: 'Break complex flows into smaller, more efficient components',
            benefits: ['Better performance', 'Improved scalability'],
            implementation: 'Use subflows to modularize complex logic',
            effort: 'medium'
          });
        }

        // Check for deep nesting in subflows
        if (context.targetType === FlowType.SUBFLOW) {
          const definition = context.subflowDefinition;
          if (definition && definition.activities.length > 20) {
            score = Math.min(score, 7);
            issues.push({
              type: ValidationRuleType.PERFORMANCE,
              severity: ValidationSeverity.INFO,
              message: 'Large subflow may impact performance',
              description: 'Subflows with many activities can impact performance',
              impact: 'Slower execution',
              suggestedFix: 'Consider breaking into smaller subflows'
            });
          }
        }

        return {
          passed: score >= 7,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('maintainability_assessment', {
      id: 'maintainability_assessment',
      name: 'Maintainability Assessment',
      description: 'Validate maintainability aspects of the recommended approach',
      type: ValidationRuleType.MAINTAINABILITY,
      severity: ValidationSeverity.INFO,
      weight: 10,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 10;

        // Check for maintainability score
        const maintainabilityScore = context.analysisResult?.criteria.maintainabilityScore || 5;
        if (maintainabilityScore < 5) {
          score = 6;
          issues.push({
            type: ValidationRuleType.MAINTAINABILITY,
            severity: ValidationSeverity.INFO,
            message: 'Low maintainability score',
            description: 'Flow may be difficult to maintain over time',
            impact: 'Higher maintenance cost',
            suggestedFix: 'Consider simplifying or modularizing the flow'
          });
        }

        // Check for appropriate naming
        const definition = context.subflowDefinition;
        if (definition && (definition.name.length < 3 || definition.name.includes('_'))) {
          score = Math.min(score, 8);
          recommendations.push({
            type: ValidationRuleType.MAINTAINABILITY,
            priority: 'low',
            message: 'Improve naming convention',
            description: 'Use clear, descriptive names for better maintainability',
            benefits: ['Better readability', 'Easier understanding'],
            implementation: 'Use descriptive names without underscores',
            effort: 'low'
          });
        }

        return {
          passed: score >= 6,
          score,
          issues,
          recommendations
        };
      }
    });

    this.rules.set('security_considerations', {
      id: 'security_considerations',
      name: 'Security Considerations',
      description: 'Validate security aspects of the recommended approach',
      type: ValidationRuleType.SECURITY,
      severity: ValidationSeverity.ERROR,
      weight: 15,
      applicableContexts: [],
      applicableTypes: [FlowType.MAIN_FLOW, FlowType.SUBFLOW],
      validator: (context) => {
        const issues: Omit<ValidationIssue, 'ruleId'>[] = [];
        const recommendations: Omit<ValidationRecommendation, 'id'>[] = [];
        let score = 15;

        // Check for sensitive data handling
        const instruction = context.instruction.toLowerCase();
        if (instruction.includes('password') || instruction.includes('secret') || instruction.includes('token')) {
          score = 10;
          issues.push({
            type: ValidationRuleType.SECURITY,
            severity: ValidationSeverity.WARNING,
            message: 'Potential sensitive data handling',
            description: 'Flow may handle sensitive data that requires special security considerations',
            impact: 'Security risk if not properly handled',
            suggestedFix: 'Ensure proper encryption and access controls'
          });
          
          recommendations.push({
            type: ValidationRuleType.SECURITY,
            priority: 'high',
            message: 'Implement security controls',
            description: 'Add appropriate security measures for sensitive data',
            benefits: ['Data protection', 'Compliance'],
            implementation: 'Use encryption, access controls, and audit logging',
            effort: 'medium'
          });
        }

        // Check for external integrations
        if (instruction.includes('api') || instruction.includes('external') || instruction.includes('integration')) {
          score = Math.min(score, 12);
          recommendations.push({
            type: ValidationRuleType.SECURITY,
            priority: 'medium',
            message: 'Secure external integrations',
            description: 'Ensure external integrations follow security best practices',
            benefits: ['Secure data exchange', 'Reduced attack surface'],
            implementation: 'Use secure protocols, authentication, and input validation',
            effort: 'medium'
          });
        }

        return {
          passed: score >= 10,
          score,
          issues,
          recommendations
        };
      }
    });

    this.logger.info('Initialized validation rules', { ruleCount: this.rules.size });
  }
}
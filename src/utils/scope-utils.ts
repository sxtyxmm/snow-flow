/**
 * Utility functions for scope management and analysis
 */

import { ScopeType } from '../strategies/global-scope-strategy.js';

export interface ScopeAnalysisResult {
  recommendedScope: ScopeType;
  confidence: number;
  indicators: {
    global: string[];
    application: string[];
    system: string[];
  };
  complexity: 'low' | 'medium' | 'high';
  crossAppIntegration: boolean;
}

export class ScopeUtils {
  /**
   * Analyze artifact content to determine optimal scope
   */
  static analyzeArtifactScope(artifactType: string, artifactData: any): ScopeAnalysisResult {
    const _analysis: ScopeAnalysisResult = {
      recommendedScope: ScopeType.GLOBAL,
      confidence: 0,
      indicators: {
        global: [],
        application: [],
        system: []
      },
      complexity: 'low',
      crossAppIntegration: false
    };

    const content = this.extractArtifactContent(artifactData);
    const contentLower = content.toLowerCase();

    // Global scope indicators
    const globalIndicators = [
      { pattern: /\b(global|system|util|common|shared|library)\b/gi, weight: 0.3 },
      { pattern: /\b(cross[_-]?application|multi[_-]?app|enterprise)\b/gi, weight: 0.4 },
      { pattern: /\b(infrastructure|platform|framework)\b/gi, weight: 0.35 },
      { pattern: /\b(gs\.|GlideSystem|GlideRecord)\b/gi, weight: 0.2 },
      { pattern: /\b(api|rest|soap|integration)\b/gi, weight: 0.25 }
    ];

    // Application scope indicators
    const applicationIndicators = [
      { pattern: /\b(business|custom|specific|department)\b/gi, weight: 0.3 },
      { pattern: /\b(workflow|process|procedure)\b/gi, weight: 0.2 },
      { pattern: /\b(application[_-]?specific|app[_-]?only)\b/gi, weight: 0.4 },
      { pattern: /\b(isolated|contained|scoped)\b/gi, weight: 0.25 }
    ];

    // System indicators
    const systemIndicators = [
      { pattern: /\b(admin|administrator|system[_-]?admin)\b/gi, weight: 0.3 },
      { pattern: /\b(configuration|setting|property)\b/gi, weight: 0.2 },
      { pattern: /\b(maintenance|monitoring|logging)\b/gi, weight: 0.25 }
    ];

    // Analyze global indicators
    let globalScore = 0;
    globalIndicators.forEach(indicator => {
      const matches = content.match(indicator.pattern);
      if (matches) {
        globalScore += indicator.weight * matches.length;
        _analysis.indicators.global.push(`${indicator.pattern.source} (${matches.length} matches)`);
      }
    });

    // Analyze application indicators
    let applicationScore = 0;
    applicationIndicators.forEach(indicator => {
      const matches = content.match(indicator.pattern);
      if (matches) {
        applicationScore += indicator.weight * matches.length;
        _analysis.indicators.application.push(`${indicator.pattern.source} (${matches.length} matches)`);
      }
    });

    // Analyze system indicators
    let systemScore = 0;
    systemIndicators.forEach(indicator => {
      const matches = content.match(indicator.pattern);
      if (matches) {
        systemScore += indicator.weight * matches.length;
        _analysis.indicators.system.push(`${indicator.pattern.source} (${matches.length} matches)`);
      }
    });

    // Determine recommended scope
    const totalScore = globalScore + applicationScore + systemScore;
    if (totalScore > 0) {
      if (globalScore > applicationScore && globalScore > systemScore) {
        _analysis.recommendedScope = ScopeType.GLOBAL;
        _analysis.confidence = Math.min(globalScore / totalScore, 1.0);
      } else if (applicationScore > globalScore && applicationScore > systemScore) {
        _analysis.recommendedScope = ScopeType.APPLICATION;
        _analysis.confidence = Math.min(applicationScore / totalScore, 1.0);
      } else {
        _analysis.recommendedScope = ScopeType.AUTO;
        _analysis.confidence = 0.5;
      }
    } else {
      _analysis.confidence = 0.3;
    }

    // Analyze complexity
    _analysis.complexity = this.analyzeComplexity(artifactType, artifactData);

    // Check for cross-application integration
    _analysis.crossAppIntegration = this.hasCrossAppIntegration(content);

    return _analysis;
  }

  /**
   * Extract content from artifact for analysis
   */
  static extractArtifactContent(artifactData: any): string {
    const contentFields = [
      'name', 'description', 'short_description', 'script', 'template', 
      'client_script', 'server_script', 'condition', 'instructions'
    ];

    let content = '';
    contentFields.forEach(field => {
      if (artifactData[field]) {
        content += ` ${artifactData[field]}`;
      }
    });

    // Include activity and variable information for flows
    if (artifactData.activities) {
      artifactData.activities.forEach((activity: any) => {
        content += ` ${activity.name} ${activity.type}`;
        if (activity.description) content += ` ${activity.description}`;
      });
    }

    return content;
  }

  /**
   * Analyze artifact complexity
   */
  static analyzeComplexity(artifactType: string, artifactData: any): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Type-specific complexity scoring
    switch (artifactType) {
      case 'flow':
        const activityCount = artifactData.activities?.length || 0;
        complexityScore += activityCount * 0.1;
        
        // Check for complex activity types
        if (artifactData.activities) {
          const complexTypes = ['script', 'condition', 'loop', 'rest', 'soap'];
          const complexActivities = artifactData.activities.filter((a: any) => 
            complexTypes.includes(a.type)
          );
          complexityScore += complexActivities.length * 0.3;
        }
        break;

      case 'script_include':
        const scriptLength = artifactData.script?.length || 0;
        complexityScore += scriptLength / 1000 * 0.2; // 0.2 per 1000 chars
        
        // Check for complex script patterns
        if (artifactData.script) {
          const complexPatterns = [
            /function\s+\w+\s*\(/g,  // Function definitions
            /for\s*\(|while\s*\(/g,  // Loops
            /if\s*\(|switch\s*\(/g,  // Conditionals
            /try\s*\{|catch\s*\(/g   // Error handling
          ];
          
          complexPatterns.forEach(pattern => {
            const matches = artifactData.script.match(pattern);
            if (matches) complexityScore += matches.length * 0.1;
          });
        }
        break;

      case 'widget':
        const templateLength = artifactData.template?.length || 0;
        const scriptLength2 = (artifactData.client_script?.length || 0) + (artifactData.server_script?.length || 0);
        complexityScore += (templateLength + scriptLength2) / 1000 * 0.15;
        break;

      default:
        complexityScore += 0.3; // Default complexity
    }

    // Return complexity level
    if (complexityScore > 2.0) return 'high';
    if (complexityScore > 1.0) return 'medium';
    return 'low';
  }

  /**
   * Check if artifact has cross-application integration
   */
  static hasCrossAppIntegration(content: string): boolean {
    const integrationPatterns = [
      /\b(rest|soap|api)\b/gi,
      /\b(integration|connector|bridge)\b/gi,
      /\b(cross[_-]?application|multi[_-]?app)\b/gi,
      /\b(external|third[_-]?party)\b/gi,
      /\b(http|https|url|endpoint)\b/gi
    ];

    return integrationPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validate scope configuration
   */
  static validateScopeConfiguration(config: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Validate scope type
    if (!config.type || !Object.values(ScopeType).includes(config.type)) {
      issues.push('Invalid or missing scope type');
    }

    // Validate global scope configuration
    if (config.type === ScopeType.GLOBAL) {
      if (config.globalDomain && config.globalDomain !== 'global') {
        issues.push('Global scope should use "global" domain');
      }
    }

    // Validate application scope configuration
    if (config.type === ScopeType.APPLICATION) {
      if (!config.applicationId && !config.applicationName) {
        issues.push('Application scope requires applicationId or applicationName');
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate scope recommendation report
   */
  static generateScopeReport(_analysis: ScopeAnalysisResult): string {
    const report = `
Scope Analysis Report
====================

Recommended Scope: ${_analysis.recommendedScope}
Confidence: ${(_analysis.confidence * 100).toFixed(1)}%
Complexity: ${_analysis.complexity}
Cross-App Integration: ${_analysis.crossAppIntegration ? 'Yes' : 'No'}

Indicators:
-----------
Global Scope Indicators:
${_analysis.indicators.global.map(i => `  • ${i}`).join('\n')}

Application Scope Indicators:
${_analysis.indicators.application.map(i => `  • ${i}`).join('\n')}

System Indicators:
${_analysis.indicators.system.map(i => `  • ${i}`).join('\n')}

Recommendations:
---------------
${this.generateRecommendations(_analysis).map(r => `  • ${r}`).join('\n')}
`;

    return report;
  }

  /**
   * Generate recommendations based on analysis
   */
  static generateRecommendations(_analysis: ScopeAnalysisResult): string[] {
    const recommendations: string[] = [];

    if (_analysis.confidence < 0.5) {
      recommendations.push('Consider manual scope selection due to low confidence');
    }

    if (_analysis.complexity === 'high') {
      recommendations.push('High complexity artifact - ensure proper testing');
    }

    if (_analysis.crossAppIntegration) {
      recommendations.push('Cross-application integration detected - global scope recommended');
    }

    if (_analysis.recommendedScope === ScopeType.GLOBAL) {
      recommendations.push('Ensure global scope permissions are available');
      recommendations.push('Consider impact on system performance');
    }

    if (_analysis.recommendedScope === ScopeType.APPLICATION) {
      recommendations.push('Ensure application scope is properly configured');
      recommendations.push('Consider application lifecycle management');
    }

    return recommendations;
  }

  /**
   * Compare two scope configurations
   */
  static compareScopeConfigurations(config1: any, config2: any): {
    isDifferent: boolean;
    differences: string[];
  } {
    const differences: string[] = [];

    if (config1.type !== config2.type) {
      differences.push(`Scope type: ${config1.type} vs ${config2.type}`);
    }

    if (config1.globalDomain !== config2.globalDomain) {
      differences.push(`Global domain: ${config1.globalDomain} vs ${config2.globalDomain}`);
    }

    if (config1.applicationId !== config2.applicationId) {
      differences.push(`Application ID: ${config1.applicationId} vs ${config2.applicationId}`);
    }

    if (config1.fallbackToGlobal !== config2.fallbackToGlobal) {
      differences.push(`Fallback to global: ${config1.fallbackToGlobal} vs ${config2.fallbackToGlobal}`);
    }

    return {
      isDifferent: differences.length > 0,
      differences
    };
  }

  /**
   * Get scope display name
   */
  static getScopeDisplayName(scope: ScopeType): string {
    switch (scope) {
      case ScopeType.GLOBAL:
        return 'Global Scope';
      case ScopeType.APPLICATION:
        return 'Application Scope';
      case ScopeType.AUTO:
        return 'Auto Selection';
      default:
        return 'Unknown Scope';
    }
  }

  /**
   * Get scope description
   */
  static getScopeDescription(scope: ScopeType): string {
    switch (scope) {
      case ScopeType.GLOBAL:
        return 'System-wide scope with no application boundaries';
      case ScopeType.APPLICATION:
        return 'Application-specific scope with isolation';
      case ScopeType.AUTO:
        return 'Automatic scope selection based on _analysis';
      default:
        return 'Unknown scope type';
    }
  }

  /**
   * Get scope benefits
   */
  static getScopeBenefits(scope: ScopeType): string[] {
    switch (scope) {
      case ScopeType.GLOBAL:
        return [
          'System-wide availability',
          'Cross-application integration',
          'Simplified maintenance',
          'Better performance for utilities',
          'No boundary restrictions'
        ];
      case ScopeType.APPLICATION:
        return [
          'Application isolation',
          'Dedicated namespace',
          'Simplified lifecycle management',
          'Better security boundaries',
          'Easier deployment control'
        ];
      case ScopeType.AUTO:
        return [
          'Optimal scope selection',
          'Reduced configuration complexity',
          'Intelligent decision making',
          'Automatic fallback support',
          'Context-aware deployment'
        ];
      default:
        return [];
    }
  }

  /**
   * Get scope risks
   */
  static getScopeRisks(scope: ScopeType): string[] {
    switch (scope) {
      case ScopeType.GLOBAL:
        return [
          'System-wide impact of changes',
          'Potential security implications',
          'Higher permission requirements',
          'More complex troubleshooting',
          'Broader testing requirements'
        ];
      case ScopeType.APPLICATION:
        return [
          'Limited cross-application functionality',
          'Potential integration challenges',
          'Increased complexity for shared utilities',
          'Multiple application management',
          'Duplication of common functionality'
        ];
      case ScopeType.AUTO:
        return [
          'Potential incorrect scope selection',
          'Reduced user control',
          'Dependency on _analysis accuracy',
          'Complexity in troubleshooting decisions',
          'Need for fallback mechanisms'
        ];
      default:
        return [];
    }
  }
}
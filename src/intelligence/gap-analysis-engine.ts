/**
 * Intelligent Gap Analysis Engine - The core orchestrator
 * 
 * This is the main engine that orchestrates all components to analyze objectives,
 * detect missing ServiceNow configurations beyond MCP tools, and attempt automated
 * resolution with fallback to detailed manual instructions.
 * 
 * This fulfills the user's vision: "alle mogelijke soorten handelingen die nodig 
 * zouden zijn om een objective te bereiken die vallen buiten de standaard mcps"
 * 
 * Usage:
 *   const engine = new GapAnalysisEngine(mcpTools, logger, autoPermissions);
 *   const result = await engine.analyzeAndResolve("create incident widget with charts");
 */

import { RequirementsAnalyzer, ServiceNowRequirement, AnalysisResult } from './requirements-analyzer';
import { McpCoverageAnalyzer, CoverageAnalysis } from './mcp-coverage-analyzer';
import { AutoResolutionEngine, BulkResolutionResult } from './auto-resolution-engine';
import { ManualInstructionsGenerator, BulkManualGuide } from './manual-instructions-generator';

export interface GapAnalysisResult {
  objective: string;
  analysisId: string;
  timestamp: number;
  
  // Analysis Results
  requirements: ServiceNowRequirement[];
  totalRequirements: number;
  mcpCoverage: CoverageAnalysis;
  
  // Resolution Results
  automationResults: BulkResolutionResult;
  manualGuides: BulkManualGuide | null;
  
  // Summary
  summary: {
    totalTime: number;
    automationRate: number;
    successfulAutomation: number;
    requiresManualWork: number;
    completionPercentage: number;
  };
  
  // Next Steps
  nextSteps: {
    automated: string[];
    manual: string[];
    recommendations: string[];
    risks: string[];
  };
  
  // Execution Report
  executionPlan: {
    phase: string;
    description: string;
    estimatedTime: string;
    status: 'completed' | 'pending' | 'manual_required';
    actions: string[];
  }[];
}

export interface GapAnalysisOptions {
  autoPermissions?: boolean;
  environment?: 'development' | 'testing' | 'production';
  enableAutomation?: boolean;
  includeManualGuides?: boolean;
  riskTolerance?: 'low' | 'medium' | 'high';
  dryRun?: boolean;
}

export class GapAnalysisEngine {
  private mcpTools: any;
  private logger: any;
  private autoResolutionEngine: AutoResolutionEngine;
  
  constructor(mcpTools: any, logger: any, autoPermissions = false) {
    this.mcpTools = mcpTools;
    this.logger = logger;
    this.autoResolutionEngine = new AutoResolutionEngine(mcpTools, logger, autoPermissions);
  }
  
  /**
   * Main entry point - analyze objective and resolve all gaps
   */
  async analyzeAndResolve(
    objective: string, 
    options: GapAnalysisOptions = {}
  ): Promise<GapAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info(`🧠 Starting Intelligent Gap Analysis for: "${objective}"`);
    this.logger.info(`📊 Analysis ID: ${analysisId}`);
    
    try {
      // Step 1: Analyze requirements from natural language objective
      this.logger.info('🔍 Step 1: Analyzing requirements...');
      const requirementsAnalysis = RequirementsAnalyzer.analyzeObjective(objective);
      
      if (requirementsAnalysis.requirements.length === 0) {
        this.logger.warn('⚠️ No specific ServiceNow requirements detected');
        return this.createEmptyResult(objective, analysisId, startTime);
      }
      
      this.logger.info(`📋 Detected ${requirementsAnalysis.requirements.length} requirements`);
      
      // Step 2: Analyze MCP coverage vs gaps
      this.logger.info('🎯 Step 2: Analyzing MCP coverage...');
      const mcpCoverage = McpCoverageAnalyzer.analyzeCoverage(requirementsAnalysis.requirements);
      
      this.logger.info(`✅ MCP Coverage: ${mcpCoverage.coveragePercentage}% (${mcpCoverage.covered.length}/${requirementsAnalysis.requirements.length})`);
      this.logger.info(`❌ Gaps requiring attention: ${mcpCoverage.gaps.length}`);
      this.logger.info(`⚠️ Partial coverage items: ${mcpCoverage.partialCoverage.length}`);
      
      // Step 3: Attempt automated resolution for gaps
      let automationResults: BulkResolutionResult;
      if (options.enableAutomation !== false && !options.dryRun) {
        this.logger.info('🤖 Step 3: Attempting automated resolution...');
        automationResults = await this.autoResolutionEngine.resolveBulk(mcpCoverage.gaps);
        
        this.logger.info(`🚀 Automation complete: ${automationResults.successRate}% success rate`);
        this.logger.info(`✅ Automated: ${automationResults.successful.length}`);
        this.logger.info(`❌ Failed: ${automationResults.failed.length}`);
        this.logger.info(`📋 Manual: ${automationResults.manual.length}`);
      } else {
        // Dry run or automation disabled
        automationResults = {
          successful: [],
          failed: [],
          manual: mcpCoverage.gaps.map(req => ({
            requirement: req,
            status: 'manual_required' as const,
            manualSteps: ['Automation disabled - manual configuration required']
          })),
          totalTime: 0,
          successRate: 0,
          recommendations: ['Enable automation to attempt automatic resolution']
        };
      }
      
      // Step 4: Generate manual guides for remaining gaps
      let manualGuides: BulkManualGuide | null = null;
      const manualRequirements = [
        ...automationResults.failed.map(r => r.requirement),
        ...automationResults.manual.map(r => r.requirement)
      ];
      
      if (manualRequirements.length > 0 && options.includeManualGuides !== false) {
        this.logger.info(`📚 Step 4: Generating manual guides for ${manualRequirements.length} items...`);
        manualGuides = ManualInstructionsGenerator.generateBulkInstructions(manualRequirements);
      }
      
      // Step 5: Build comprehensive result
      const totalTime = Date.now() - startTime;
      const result = this.buildGapAnalysisResult(
        objective,
        analysisId,
        startTime,
        requirementsAnalysis,
        mcpCoverage,
        automationResults,
        manualGuides,
        totalTime
      );
      
      this.logger.info(`🎉 Gap Analysis complete in ${totalTime}ms`);
      this.logger.info(`📊 Final Summary:`);
      this.logger.info(`  • Total Requirements: ${result.totalRequirements}`);
      this.logger.info(`  • MCP Coverage: ${result.mcpCoverage.coveragePercentage}%`);
      this.logger.info(`  • Automation Rate: ${result.summary.automationRate}%`);
      this.logger.info(`  • Manual Work Required: ${result.summary.requiresManualWork} items`);
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ Gap Analysis failed:', error);
      throw new Error(`Gap Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Quick analysis without resolution - useful for planning
   */
  async analyzeOnly(objective: string): Promise<{
    requirements: ServiceNowRequirement[];
    coverage: CoverageAnalysis;
    canAutomate: number;
    requiresManual: number;
    estimatedTime: string;
  }> {
    this.logger.info(`🔍 Quick analysis for: "${objective}"`);
    
    const analysis = RequirementsAnalyzer.analyzeObjective(objective);
    const coverage = McpCoverageAnalyzer.analyzeCoverage(analysis.requirements);
    
    let canAutomate = coverage.covered.length;
    let requiresManual = coverage.gaps.length;
    
    // Check automation capabilities for gaps
    for (const gap of coverage.gaps) {
      if (this.autoResolutionEngine.canAutoResolve(gap)) {
        canAutomate++;
        requiresManual--;
      }
    }
    
    const estimatedTime = this.estimateTotalTime(analysis.requirements, canAutomate, requiresManual);
    
    return {
      requirements: analysis.requirements,
      coverage,
      canAutomate,
      requiresManual,
      estimatedTime
    };
  }
  
  /**
   * Get detailed analysis for a specific requirement type
   */
  analyzeRequirementType(requirementType: string): {
    mcpTools: string[];
    automationStrategies: string[];
    manualSteps: string[];
    riskLevel: string;
  } {
    const mcpTools = McpCoverageAnalyzer.getAvailableTools(requirementType as any);
    const automationStrategies = this.autoResolutionEngine.getResolutionStrategies(requirementType as any);
    
    return {
      mcpTools: mcpTools.map(tool => tool.tool),
      automationStrategies: automationStrategies.map(strategy => strategy.automationMethod),
      manualSteps: automationStrategies.flatMap(strategy => strategy.fallbackInstructions),
      riskLevel: automationStrategies[0]?.riskLevel || 'medium'
    };
  }
  
  // Private helper methods
  
  private createEmptyResult(objective: string, analysisId: string, startTime: number): GapAnalysisResult {
    return {
      objective,
      analysisId,
      timestamp: startTime,
      requirements: [],
      totalRequirements: 0,
      mcpCoverage: {
        covered: [],
        gaps: [],
        partialCoverage: [],
        coveragePercentage: 100,
        recommendations: ['No specific ServiceNow requirements detected in objective']
      },
      automationResults: {
        successful: [],
        failed: [],
        manual: [],
        totalTime: 0,
        successRate: 100,
        recommendations: ['Consider more specific ServiceNow requirements']
      },
      manualGuides: null,
      summary: {
        totalTime: Date.now() - startTime,
        automationRate: 100,
        successfulAutomation: 0,
        requiresManualWork: 0,
        completionPercentage: 100
      },
      nextSteps: {
        automated: [],
        manual: ['Refine objective with specific ServiceNow requirements'],
        recommendations: ['Use more specific ServiceNow terminology in objective'],
        risks: []
      },
      executionPlan: []
    };
  }
  
  private buildGapAnalysisResult(
    objective: string,
    analysisId: string,
    startTime: number,
    requirementsAnalysis: AnalysisResult,
    mcpCoverage: CoverageAnalysis,
    automationResults: BulkResolutionResult,
    manualGuides: BulkManualGuide | null,
    totalTime: number
  ): GapAnalysisResult {
    
    const totalRequirements = requirementsAnalysis.requirements.length;
    const automationRate = totalRequirements > 0 
      ? Math.round(((automationResults.successful.length) / totalRequirements) * 100)
      : 100;
    
    const completionPercentage = totalRequirements > 0
      ? Math.round(((mcpCoverage.covered.length + automationResults.successful.length) / totalRequirements) * 100)
      : 100;
    
    return {
      objective,
      analysisId,
      timestamp: startTime,
      requirements: requirementsAnalysis.requirements,
      totalRequirements,
      mcpCoverage,
      automationResults,
      manualGuides,
      summary: {
        totalTime,
        automationRate,
        successfulAutomation: automationResults.successful.length,
        requiresManualWork: automationResults.failed.length + automationResults.manual.length,
        completionPercentage
      },
      nextSteps: this.generateNextSteps(mcpCoverage, automationResults, manualGuides),
      executionPlan: this.generateExecutionPlan(mcpCoverage, automationResults, manualGuides)
    };
  }
  
  private generateNextSteps(
    mcpCoverage: CoverageAnalysis,
    automationResults: BulkResolutionResult,
    manualGuides: BulkManualGuide | null
  ): GapAnalysisResult['nextSteps'] {
    const automated: string[] = [];
    const manual: string[] = [];
    const recommendations: string[] = [];
    const risks: string[] = [];
    
    // MCP-covered items
    if (mcpCoverage.covered.length > 0) {
      automated.push(`✅ ${mcpCoverage.covered.length} items fully covered by MCP tools`);
    }
    
    // Successfully automated items
    if (automationResults.successful.length > 0) {
      automated.push(`🤖 ${automationResults.successful.length} gaps automatically resolved`);
    }
    
    // Failed automation items
    if (automationResults.failed.length > 0) {
      manual.push(`❌ ${automationResults.failed.length} automation attempts failed - manual setup required`);
      recommendations.push('Review failed automation attempts and adjust permissions or configurations');
    }
    
    // Manual-only items
    if (automationResults.manual.length > 0) {
      manual.push(`📋 ${automationResults.manual.length} items require manual configuration`);
    }
    
    // Manual guides available
    if (manualGuides) {
      manual.push(`📚 Detailed manual guides available for ${manualGuides.guides.length} configurations`);
    }
    
    // Recommendations from sub-systems
    recommendations.push(...mcpCoverage.recommendations);
    recommendations.push(...automationResults.recommendations);
    
    // Risk identification
    if (manualGuides?.overallRisks) {
      risks.push(...manualGuides.overallRisks);
    }
    
    // Add strategic recommendations
    const automationRate = automationResults.successful.length / 
      (automationResults.successful.length + automationResults.failed.length + automationResults.manual.length);
    
    if (automationRate < 0.5) {
      recommendations.push('💡 Consider enabling auto-permissions to increase automation success rate');
    }
    
    if (manual.length > automated.length) {
      recommendations.push('🔧 Significant manual work required - consider phased implementation approach');
    }
    
    return { automated, manual, recommendations, risks };
  }
  
  private generateExecutionPlan(
    mcpCoverage: CoverageAnalysis,
    automationResults: BulkResolutionResult,
    manualGuides: BulkManualGuide | null
  ): GapAnalysisResult['executionPlan'] {
    const plan: GapAnalysisResult['executionPlan'] = [];
    
    // Phase 1: MCP Tool Deployment
    if (mcpCoverage.covered.length > 0) {
      plan.push({
        phase: 'Phase 1: MCP Tool Deployment',
        description: 'Deploy artifacts using standard MCP tools',
        estimatedTime: `${mcpCoverage.covered.length * 3} minutes`,
        status: 'pending',
        actions: mcpCoverage.covered.map(req => `Deploy ${req.type}: ${req.name}`)
      });
    }
    
    // Phase 2: Automated Gap Resolution
    if (automationResults.successful.length > 0) {
      plan.push({
        phase: 'Phase 2: Automated Gap Resolution',
        description: 'Automatically resolve configuration gaps',
        estimatedTime: `${automationResults.totalTime}ms`,
        status: 'completed',
        actions: automationResults.successful.map(res => 
          `✅ Automated: ${res.requirement.type} - ${res.requirement.name}`
        )
      });
    }
    
    // Phase 3: Manual Configuration
    const manualItems = automationResults.failed.length + automationResults.manual.length;
    if (manualItems > 0) {
      plan.push({
        phase: 'Phase 3: Manual Configuration',
        description: 'Complete remaining configurations manually',
        estimatedTime: manualGuides?.executionOrder.reduce((total, phase) => 
          total + parseInt(phase.estimatedTime.match(/\d+/)?.[0] || '10'), 0
        ) + ' minutes' || `${manualItems * 15} minutes`,
        status: 'manual_required',
        actions: [
          ...automationResults.failed.map(res => `❌ Manual fix needed: ${res.requirement.name}`),
          ...automationResults.manual.map(res => `📋 Manual setup: ${res.requirement.name}`)
        ]
      });
    }
    
    return plan;
  }
  
  private estimateTotalTime(
    requirements: ServiceNowRequirement[],
    canAutomate: number,
    requiresManual: number
  ): string {
    const automationTime = canAutomate * 2; // 2 minutes per automated item
    const manualTime = requiresManual * 15; // 15 minutes per manual item
    const totalMinutes = automationTime + manualTime;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }
}

/**
 * Convenience function for quick gap analysis
 */
export async function analyzeGaps(
  objective: string,
  mcpTools: any,
  logger: any,
  options: GapAnalysisOptions = {}
): Promise<GapAnalysisResult> {
  const engine = new GapAnalysisEngine(mcpTools, logger, options.autoPermissions);
  return engine.analyzeAndResolve(objective, options);
}

/**
 * Quick analysis without resolution
 */
export function quickAnalyze(objective: string): {
  requirements: ServiceNowRequirement[];
  coverage: CoverageAnalysis;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
} {
  const analysis = RequirementsAnalyzer.analyzeObjective(objective);
  const coverage = McpCoverageAnalyzer.analyzeCoverage(analysis.requirements);
  
  let estimatedComplexity: 'simple' | 'moderate' | 'complex' = 'simple';
  
  if (analysis.requirements.length > 10 || coverage.coveragePercentage < 50) {
    estimatedComplexity = 'complex';
  } else if (analysis.requirements.length > 5 || coverage.coveragePercentage < 80) {
    estimatedComplexity = 'moderate';
  }
  
  return {
    requirements: analysis.requirements,
    coverage,
    estimatedComplexity
  };
}
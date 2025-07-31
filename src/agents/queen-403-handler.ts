/**
 * Queen Agent 403 Error Handler
 * Automatically analyzes and resolves ServiceNow permission issues using Gap Analysis Engine
 */

import { Logger } from '../utils/logger';
import { analyzeGaps } from '../intelligence/gap-analysis-engine';
// Remove unused import

export interface Permission403Context {
  error: any;
  operation: string;
  tableName?: string;
  artifactType?: string;
  objective: string;
}

export class Queen403Handler {
  private logger: Logger;
  private mcpTools: any;

  constructor(logger: Logger, mcpTools: any) {
    this.logger = logger;
    this.mcpTools = mcpTools;
  }

  /**
   * Handle 403 permission errors with intelligent analysis and resolution
   */
  async handle403Error(context: Permission403Context): Promise<{
    resolved: boolean;
    analysis: any;
    nextSteps: string[];
    manualActions?: string[];
  }> {
    this.logger.info('🚨 Queen Agent: 403 Permission Error detected - activating Gap Analysis');

    // 1. Create specific objective for ACL analysis
    const aclObjective = this.createACLObjective(context);
    
    // 2. Run Gap Analysis specifically for permission issues
    const gapAnalysis = await analyzeGaps(aclObjective, this.mcpTools, this.logger, {
      autoPermissions: true,
      environment: 'development',
      enableAutomation: true,
      includeManualGuides: true
    });

    // 3. Extract ACL-specific findings
    const aclRequirements = gapAnalysis.requirements.filter(req => 
      req.type === 'acl_rule' || 
      req.type === 'user_role' || 
      req.type === 'oauth_provider' ||
      req.type === 'security_policy' ||
      req.type === 'sys_property'
    );

    // 4. Check if any automatic fixes were applied
    const autoFixed = gapAnalysis.automationResults.successful.filter(result =>
      result.requirement.type === 'sys_property' && 
      result.requirement.name?.includes('service_portal')
    );

    // 5. Prepare next steps based on analysis
    const nextSteps = this.generateNextSteps(context, gapAnalysis, aclRequirements);

    // 6. Log findings for Queen Agent decision making
    this.logFindings(aclRequirements, gapAnalysis);

    return {
      resolved: autoFixed.length > 0,
      analysis: {
        totalPermissionIssues: aclRequirements.length,
        automaticallyFixed: autoFixed.length,
        requiresManualWork: aclRequirements.filter(r => !r.automatable).length,
        gapAnalysis: gapAnalysis
      },
      nextSteps,
      manualActions: this.extractManualActions(gapAnalysis)
    };
  }

  /**
   * Create specific objective for ACL analysis
   */
  private createACLObjective(context: Permission403Context): string {
    const { tableName, artifactType, operation, objective } = context;
    
    let aclObjective = `Fix 403 permission error for ${operation} on `;
    
    if (tableName) {
      aclObjective += `${tableName} table `;
    } else if (artifactType) {
      aclObjective += `${artifactType} `;
    }
    
    aclObjective += `to complete: ${objective}`;
    
    // Add specific context for sp_widget
    if (tableName === 'sp_widget' || artifactType === 'widget') {
      aclObjective += ' including Service Portal API access, OAuth scopes, and cross-scope permissions';
    }
    
    return aclObjective;
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    context: Permission403Context, 
    gapAnalysis: any,
    aclRequirements: any[]
  ): string[] {
    const steps: string[] = [];

    // 1. If automatic fixes were applied, suggest retry
    if (gapAnalysis.automationResults.successful.length > 0) {
      steps.push('🔄 Retry the deployment - automatic fixes have been applied');
    }

    // 2. For sp_widget specific issues
    if (context.tableName === 'sp_widget') {
      steps.push('🌐 Try deployment with global scope: scope_preference: "global"');
      steps.push('📋 Ensure active Update Set: snow_ensure_active_update_set()');
    }

    // 3. For OAuth issues
    const oauthIssues = aclRequirements.filter(r => r.type === 'oauth_provider');
    if (oauthIssues.length > 0) {
      steps.push('🔐 Check OAuth application settings in ServiceNow');
      steps.push('🔧 Re-authenticate: snow-flow auth login');
    }

    // 4. For role issues
    const roleIssues = aclRequirements.filter(r => r.type === 'user_role');
    if (roleIssues.length > 0) {
      const missingRoles = roleIssues.map(r => r.name).join(', ');
      steps.push(`👤 Add missing roles: ${missingRoles}`);
    }

    // 5. For ACL rule issues
    const aclRuleIssues = aclRequirements.filter(r => r.type === 'acl_rule');
    if (aclRuleIssues.length > 0) {
      steps.push('🛡️ Review ACL rules on the target table');
      steps.push('🔍 Check for custom ACLs blocking API access');
    }

    return steps;
  }

  /**
   * Extract manual actions from gap analysis
   */
  private extractManualActions(gapAnalysis: any): string[] {
    const actions: string[] = [];

    if (gapAnalysis.manualGuides && gapAnalysis.manualGuides.guides) {
      gapAnalysis.manualGuides.guides.forEach((guide: any) => {
        if (guide.category === 'security_permissions' || 
            guide.title.includes('ACL') || 
            guide.title.includes('Permission')) {
          actions.push(`📖 ${guide.title} (${guide.totalEstimatedTime})`);
          
          // Add first few steps as preview
          if (guide.instructions && guide.instructions.length > 0) {
            guide.instructions.slice(0, 2).forEach((instruction: any) => {
              actions.push(`   • ${instruction.title}`);
            });
          }
        }
      });
    }

    return actions;
  }

  /**
   * Log findings for Queen Agent awareness
   */
  private logFindings(aclRequirements: any[], gapAnalysis: any): void {
    console.log('\n🧠 Queen Agent Permission Analysis Results:');
    console.log('━'.repeat(50));
    
    console.log(`\n📊 Permission Requirements Found: ${aclRequirements.length}`);
    aclRequirements.forEach(req => {
      const icon = req.automatable ? '🤖' : '👤';
      console.log(`  ${icon} ${req.type}: ${req.name || req.description}`);
    });

    console.log(`\n✅ Automatic Fixes Applied: ${gapAnalysis.automationResults.successful.length}`);
    gapAnalysis.automationResults.successful.forEach((result: any) => {
      console.log(`  • ${result.requirement.name}: ${result.message}`);
    });

    console.log(`\n📋 Manual Actions Required: ${gapAnalysis.summary.requiresManualWork}`);
    
    console.log('\n💡 Recommendations:');
    gapAnalysis.nextSteps.recommendations.forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });
  }

  /**
   * Generate fallback deployment configuration
   */
  generateFallbackConfig(context: Permission403Context): any {
    const fallbackConfig: any = {
      retry_with_global_scope: true,
      force_update_set: true,
      permission_escalation: 'request'
    };

    // For widget deployments
    if (context.tableName === 'sp_widget' || context.artifactType === 'widget') {
      fallbackConfig.alternative_deployment = {
        method: 'manual_steps',
        generate_script: true,
        instructions: [
          '1. Switch to Global application scope',
          '2. Navigate to Service Portal > Widgets',
          '3. Click New and paste the generated code',
          '4. Ensure you have an active Update Set'
        ]
      };
    }

    return fallbackConfig;
  }
}
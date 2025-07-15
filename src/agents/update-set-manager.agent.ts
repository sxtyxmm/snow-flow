import { BaseAppAgent } from './base-app-agent';
import { AppGenerationRequest, ServiceNowUpdateSet } from '../types/servicenow-studio.types';
import logger from '../utils/logger';

export class UpdateSetManagerAgent extends BaseAppAgent {
  constructor(client: any) {
    super('update-set-manager', client, [
      'update-sets',
      'deployment',
      'version-control',
      'migration',
      'rollback',
      'release-management'
    ]);
  }

  async generateComponent(request: AppGenerationRequest): Promise<any> {
    const results = {
      updateSets: [] as ServiceNowUpdateSet[],
      deploymentPlan: {} as any,
      migrationScripts: [] as any[],
      rollbackPlan: {} as any,
      releaseNotes: '',
      testPlan: {} as any
    };

    try {
      // Create main update set
      const mainUpdateSet = await this.createMainUpdateSet(request);
      results.updateSets.push(mainUpdateSet);

      // Generate deployment plan
      const deploymentPlan = await this.generateDeploymentPlan(request);
      results.deploymentPlan = deploymentPlan;

      // Generate migration scripts
      const migrationScripts = await this.generateMigrationScripts(request);
      results.migrationScripts = migrationScripts;

      // Generate rollback plan
      const rollbackPlan = await this.generateRollbackPlan(request);
      results.rollbackPlan = rollbackPlan;

      // Generate release notes
      const releaseNotes = await this.generateReleaseNotes(request);
      results.releaseNotes = releaseNotes;

      // Generate test plan
      const testPlan = await this.generateTestPlan(request);
      results.testPlan = testPlan;

      logger.info(`Update set management completed for ${request.appName}`);
      return results;
    } catch (error) {
      logger.error('Update set management failed', error);
      throw error;
    }
  }

  private async createMainUpdateSet(request: AppGenerationRequest): Promise<ServiceNowUpdateSet> {
    const prompt = `Create ServiceNow Update Set configuration for:

Application: ${request.appName}
Version: ${request.appVersion || '1.0.0'}
Description: ${request.appDescription}
Scope: ${request.appScope}

Create update set that:
1. Includes all application components
2. Implements proper versioning
3. Supports dependency management
4. Includes rollback capabilities
5. Supports incremental updates
6. Implements proper documentation
7. Includes testing instructions
8. Supports multi-environment deployment

Return JSON with complete update set configuration.`;

    const response = await this.callClaude(prompt);
    const updateSetData = JSON.parse(response);

    return {
      sys_id: this.generateUniqueId('us_'),
      name: `${request.appName}_v${request.appVersion || '1.0.0'}`,
      description: updateSetData.description || `Update set for ${request.appName} application`,
      state: 'build',
      application: request.appScope,
      release_date: updateSetData.releaseDate || new Date().toISOString(),
      is_default: false,
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      sys_created_by: 'system',
      sys_updated_by: 'system'
    };
  }

  private async generateDeploymentPlan(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate deployment plan for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Components: ${JSON.stringify({
      tables: request.requirements.tables?.length || 0,
      workflows: request.requirements.workflows?.length || 0,
      ui: request.requirements.ui?.length || 0,
      businessRules: request.requirements.businessRules?.length || 0,
      security: request.requirements.security?.length || 0,
      integrations: request.requirements.integrations?.length || 0
    })}

Generate deployment plan that includes:
1. Pre-deployment requirements
2. Deployment sequence
3. Configuration steps
4. Data migration steps
5. Post-deployment validation
6. Rollback procedures
7. Environment-specific considerations
8. Performance impact assessment

Return JSON with detailed deployment plan.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  private async generateMigrationScripts(request: AppGenerationRequest): Promise<any[]> {
    const prompt = `Generate migration scripts for ServiceNow application:

Application: ${request.appName}
Tables: ${request.requirements.tables?.map(t => t.name).join(', ') || 'none'}
Data Requirements: ${JSON.stringify(request.requirements, null, 2)}

Generate migration scripts that:
1. Handle data transformation
2. Implement data validation
3. Support incremental migration
4. Include error handling
5. Support rollback operations
6. Implement progress tracking
7. Include performance optimization
8. Support multi-environment migration

Return JSON with migration script configurations.`;

    const response = await this.callClaude(prompt);
    const migrationData = JSON.parse(response);

    return migrationData.scripts || [];
  }

  private async generateRollbackPlan(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate rollback plan for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Components: ${JSON.stringify(request.requirements, null, 2)}

Generate rollback plan that includes:
1. Rollback procedures
2. Data recovery steps
3. Configuration restoration
4. Dependency management
5. Validation procedures
6. Communication plan
7. Timeline estimation
8. Risk assessment

Return JSON with comprehensive rollback plan.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  private async generateReleaseNotes(request: AppGenerationRequest): Promise<string> {
    const prompt = `Generate release notes for ServiceNow application:

Application: ${request.appName}
Version: ${request.appVersion || '1.0.0'}
Description: ${request.appDescription}
Features: ${JSON.stringify(request.requirements, null, 2)}

Generate professional release notes that include:
1. Overview of new features
2. Enhancements and improvements
3. Bug fixes (if applicable)
4. Known issues and limitations
5. Installation instructions
6. Configuration requirements
7. Breaking changes (if any)
8. Migration notes

Format as markdown document.`;

    const response = await this.callClaude(prompt);
    return response;
  }

  private async generateTestPlan(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate test plan for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Components: ${JSON.stringify(request.requirements, null, 2)}

Generate test plan that includes:
1. Unit test scenarios
2. Integration test cases
3. System test procedures
4. Performance test scenarios
5. Security test cases
6. User acceptance test criteria
7. Regression test procedures
8. Automated test configurations

Return JSON with comprehensive test plan.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateVersionStrategy(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate version strategy for ServiceNow application:

Application: ${request.appName}
Current Version: ${request.appVersion || '1.0.0'}
Description: ${request.appDescription}

Generate version strategy that includes:
1. Semantic versioning approach
2. Release cycle planning
3. Branching strategy
4. Hotfix procedures
5. Dependency management
6. Backwards compatibility
7. Deprecation policies
8. Version documentation

Return JSON with version strategy configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateReleaseManagement(request: AppGenerationRequest): Promise<any> {
    const prompt = `Generate release management configuration for ServiceNow application:

Application: ${request.appName}
Description: ${request.appDescription}
Environment: production

Generate release management that includes:
1. Release planning process
2. Environment promotion strategy
3. Approval workflows
4. Quality gates
5. Deployment automation
6. Monitoring and alerting
7. Incident response procedures
8. Post-release validation

Return JSON with release management configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async validateUpdateSet(updateSet: any): Promise<any> {
    const prompt = `Validate ServiceNow Update Set configuration:

Update Set: ${JSON.stringify(updateSet, null, 2)}

Validate for:
1. Component completeness
2. Dependency resolution
3. Configuration consistency
4. Security compliance
5. Performance impact
6. Deployment readiness
7. Documentation completeness
8. Testing coverage

Return JSON with validation results including errors, warnings, and recommendations.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }

  async generateDeploymentScript(deploymentPlan: any): Promise<string> {
    const prompt = `Generate deployment script for ServiceNow application:

Deployment Plan: ${JSON.stringify(deploymentPlan, null, 2)}

Generate deployment script that:
1. Implements automated deployment
2. Includes validation checks
3. Supports rollback operations
4. Implements progress tracking
5. Includes error handling
6. Supports parallel deployment
7. Includes monitoring hooks
8. Supports configuration management

Return deployment script in shell/PowerShell format.`;

    const response = await this.callClaude(prompt);
    return response;
  }

  async optimizeUpdateSet(updateSet: any): Promise<any> {
    const prompt = `Optimize ServiceNow Update Set for deployment:

Update Set: ${JSON.stringify(updateSet, null, 2)}

Optimize for:
1. Deployment speed
2. Resource usage
3. Dependency resolution
4. Error handling
5. Rollback efficiency
6. Monitoring capabilities
7. Documentation quality
8. Maintenance overhead

Return JSON with optimized update set configuration.`;

    const response = await this.callClaude(prompt);
    return JSON.parse(response);
  }
}
#!/usr/bin/env node

import { program } from 'commander';
import { ServiceNowAppOrchestrator } from '../orchestrator/app-orchestrator';
import { AppGenerationRequest, ServiceNowStudioConfig } from '../types/servicenow-studio.types';
import { validateConfig } from '../config/studio.config';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

program
  .name('servicenow-app-builder')
  .description('ServiceNow Application Builder CLI')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate a ServiceNow application')
  .option('--app-name <name>', 'Application name')
  .option('--app-scope <scope>', 'Application scope (e.g., x_my_app)')
  .option('--app-description <description>', 'Application description')
  .option('--config-file <file>', 'Configuration file path')
  .option('--template <template>', 'Application template to use')
  .option('--output-dir <dir>', 'Output directory for generated files')
  .option('--deploy', 'Deploy application to ServiceNow instance')
  .option('--dry-run', 'Generate without deploying')
  .action(async (options) => {
    try {
      validateConfig('api');
      
      const config: ServiceNowStudioConfig = {
        instanceUrl: process.env.SERVICENOW_INSTANCE_URL!,
        username: process.env.SERVICENOW_USERNAME!,
        password: process.env.SERVICENOW_PASSWORD!,
        clientId: process.env.SERVICENOW_CLIENT_ID,
        clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
        timeout: parseInt(process.env.TIMEOUT_MS || '60000')
      };

      const orchestrator = new ServiceNowAppOrchestrator(config);
      await orchestrator.initialize();

      let request: AppGenerationRequest;

      if (options.configFile) {
        const configPath = path.resolve(options.configFile);
        if (!fs.existsSync(configPath)) {
          throw new Error(`Configuration file not found: ${configPath}`);
        }
        request = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } else {
        request = {
          appName: options.appName || 'Generated App',
          appScope: options.appScope || 'x_generated_app',
          appDescription: options.appDescription || 'Generated ServiceNow application',
          appVersion: '1.0.0',
          requirements: {
            tables: [],
            workflows: [],
            ui: [],
            businessRules: [],
            security: []
          },
          preferences: {
            useModernUI: true,
            includeMobileSupport: true,
            generateTests: true,
            includeDocumentation: true,
            followBestPractices: true
          }
        };
      }

      if (options.template) {
        request = await loadTemplate(options.template, request);
      }

      if (options.dryRun) {
        logger.info('Dry run mode - generating without deployment');
        // TODO: Implement dry run mode
      }

      const result = await orchestrator.generateApplication(request);

      if (result.success) {
        logger.info('Application generated successfully!');
        logger.info(`Application ID: ${result.appId}`);
        logger.info(`Update Set ID: ${result.updateSetId}`);
        logger.info(`Components created: ${Object.keys(result.components).length}`);
        
        if (options.outputDir) {
          await exportResults(result, options.outputDir);
        }
      } else {
        logger.error('Application generation failed');
        logger.error(`Errors: ${result.errors?.join(', ')}`);
        process.exit(1);
      }

    } catch (error) {
      logger.error('CLI error:', error);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('Deploy an update set to ServiceNow')
  .option('--update-set-id <id>', 'Update set ID to deploy')
  .option('--environment <env>', 'Target environment (dev, test, prod)')
  .option('--force', 'Force deployment')
  .action(async (options) => {
    try {
      validateConfig('api');
      
      const config: ServiceNowStudioConfig = {
        instanceUrl: process.env.SERVICENOW_INSTANCE_URL!,
        username: process.env.SERVICENOW_USERNAME!,
        password: process.env.SERVICENOW_PASSWORD!,
        clientId: process.env.SERVICENOW_CLIENT_ID,
        clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
        timeout: parseInt(process.env.TIMEOUT_MS || '60000')
      };

      const orchestrator = new ServiceNowAppOrchestrator(config);
      await orchestrator.initialize();

      // TODO: Implement deployment functionality
      logger.info(`Deploying update set ${options.updateSetId} to ${options.environment}`);
      
    } catch (error) {
      logger.error('Deployment error:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate a ServiceNow application')
  .option('--app-id <id>', 'Application ID to validate')
  .option('--config-file <file>', 'Configuration file to validate')
  .action(async (options) => {
    try {
      validateConfig('api');
      
      const config: ServiceNowStudioConfig = {
        instanceUrl: process.env.SERVICENOW_INSTANCE_URL!,
        username: process.env.SERVICENOW_USERNAME!,
        password: process.env.SERVICENOW_PASSWORD!,
        clientId: process.env.SERVICENOW_CLIENT_ID,
        clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
        timeout: parseInt(process.env.TIMEOUT_MS || '60000')
      };

      const orchestrator = new ServiceNowAppOrchestrator(config);
      await orchestrator.initialize();

      // TODO: Implement validation functionality
      logger.info(`Validating application ${options.appId}`);
      
    } catch (error) {
      logger.error('Validation error:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new ServiceNow application project')
  .option('--name <name>', 'Project name')
  .option('--scope <scope>', 'Application scope')
  .option('--template <template>', 'Template to use')
  .action(async (options) => {
    try {
      const projectName = options.name || 'my-servicenow-app';
      const appScope = options.scope || `x_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const projectDir = path.join(process.cwd(), projectName);
      
      if (fs.existsSync(projectDir)) {
        logger.error(`Directory ${projectName} already exists`);
        process.exit(1);
      }

      fs.mkdirSync(projectDir, { recursive: true });

      const configTemplate = {
        appName: projectName,
        appScope: appScope,
        appDescription: `ServiceNow application: ${projectName}`,
        appVersion: '1.0.0',
        requirements: {
          tables: [],
          workflows: [],
          ui: [],
          businessRules: [],
          security: []
        },
        preferences: {
          useModernUI: true,
          includeMobileSupport: true,
          generateTests: true,
          includeDocumentation: true,
          followBestPractices: true
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'app-config.json'),
        JSON.stringify(configTemplate, null, 2)
      );

      // Copy .env.example
      const envExample = path.join(__dirname, '../../.env.example');
      if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, path.join(projectDir, '.env.example'));
      }

      // Create README
      const readmeContent = `# ${projectName}

ServiceNow Application: ${projectName}

## Setup

1. Copy \`.env.example\` to \`.env\` and configure your ServiceNow instance
2. Modify \`app-config.json\` to define your application requirements
3. Run \`npx servicenow-app-builder generate --config-file app-config.json\`

## Configuration

Edit \`app-config.json\` to customize your application:

- \`appName\`: Display name for your application
- \`appScope\`: ServiceNow scope (must start with x_)
- \`requirements.tables\`: Database tables to create
- \`requirements.workflows\`: Workflows and processes
- \`requirements.ui\`: User interface components
- \`requirements.businessRules\`: Business rules and scripts
- \`requirements.security\`: Access controls and permissions

## Commands

- \`generate\`: Build the ServiceNow application
- \`validate\`: Validate application configuration
- \`deploy\`: Deploy to ServiceNow instance
`;

      fs.writeFileSync(path.join(projectDir, 'README.md'), readmeContent);

      logger.info(`Project ${projectName} initialized successfully`);
      logger.info(`Next steps:`);
      logger.info(`  cd ${projectName}`);
      logger.info(`  cp .env.example .env`);
      logger.info(`  # Configure your ServiceNow instance in .env`);
      logger.info(`  # Modify app-config.json to define your application`);
      logger.info(`  npx servicenow-app-builder generate --config-file app-config.json`);
      
    } catch (error) {
      logger.error('Project initialization error:', error);
      process.exit(1);
    }
  });

program
  .command('templates')
  .description('List available application templates')
  .action(async () => {
    const templates = [
      'basic-crud - Basic CRUD application with table and forms',
      'task-management - Task management system with workflows',
      'asset-management - Asset tracking and management',
      'incident-management - Incident tracking and resolution',
      'approval-workflow - Approval workflow system',
      'catalog-item - Service catalog item and fulfillment',
      'dashboard - Analytics dashboard with widgets',
      'mobile-app - Mobile-ready application'
    ];

    logger.info('Available templates:');
    templates.forEach(template => {
      logger.info(`  ${template}`);
    });
  });

// Helper functions
async function loadTemplate(templateName: string, baseRequest: AppGenerationRequest): Promise<AppGenerationRequest> {
  const templatesDir = path.join(__dirname, '../templates');
  const templatePath = path.join(templatesDir, `${templateName}.json`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
  // Merge template with base request
  return {
    ...baseRequest,
    requirements: {
      ...baseRequest.requirements,
      ...template.requirements
    },
    preferences: {
      ...baseRequest.preferences,
      ...template.preferences
    }
  };
}

async function exportResults(result: any, outputDir: string): Promise<void> {
  const exportDir = path.resolve(outputDir);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export components
  fs.writeFileSync(
    path.join(exportDir, 'components.json'),
    JSON.stringify(result.components, null, 2)
  );

  // Export artifacts
  fs.writeFileSync(
    path.join(exportDir, 'artifacts.json'),
    JSON.stringify(result.artifacts, null, 2)
  );

  // Export deployment instructions
  if (result.deploymentInstructions) {
    fs.writeFileSync(
      path.join(exportDir, 'deployment-instructions.md'),
      result.deploymentInstructions.join('\n\n')
    );
  }

  logger.info(`Results exported to ${exportDir}`);
}

// Parse command line arguments
program.parse();
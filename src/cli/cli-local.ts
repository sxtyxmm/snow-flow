#!/usr/bin/env node

import { program } from 'commander';
import { ServiceNowAppOrchestratorLocal } from '../orchestrator/app-orchestrator-local';
import { AppGenerationRequest, ServiceNowStudioConfig } from '../types/servicenow-studio.types';
import { validateConfig } from '../config/studio.config';
import { claudeCodeIntegration } from './claude-code-integration';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

program
  .name('servicenow-app-builder-local')
  .description('ServiceNow Application Builder CLI (Local Mode - No API Costs)')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate a ServiceNow application (template-based, no API costs)')
  .option('--app-name <name>', 'Application name')
  .option('--app-scope <scope>', 'Application scope (e.g., x_my_app)')
  .option('--app-description <description>', 'Application description')
  .option('--config-file <file>', 'Configuration file path')
  .option('--template <template>', 'Application template to use')
  .option('--output-dir <dir>', 'Output directory for generated files')
  .option('--mode <mode>', 'Generation mode: template, interactive, or hybrid', 'template')
  .action(async (options) => {
    try {
      console.log('🚀 Starting ServiceNow App Generation (Local Mode)');
      console.log('💡 This mode uses smart templates and avoids Claude API costs');
      
      validateConfig('local');
      
      const config: ServiceNowStudioConfig = {
        instanceUrl: process.env.SERVICENOW_INSTANCE_URL!,
        username: process.env.SERVICENOW_USERNAME!,
        password: process.env.SERVICENOW_PASSWORD!,
        clientId: process.env.SERVICENOW_CLIENT_ID,
        clientSecret: process.env.SERVICENOW_CLIENT_SECRET,
        timeout: parseInt(process.env.TIMEOUT_MS || '60000')
      };

      const orchestrator = new ServiceNowAppOrchestratorLocal(config);
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

      if (options.mode === 'interactive') {
        console.log('🎯 Starting interactive mode with Claude Code integration');
        await startInteractiveGeneration(request, orchestrator);
      } else {
        console.log('⚡ Using template-based generation (fastest, no API costs)');
        const result = await orchestrator.generateApplication(request);
        await handleGenerationResult(result, options);
      }

    } catch (error) {
      logger.error('CLI error:', error);
      process.exit(1);
    }
  });

program
  .command('claude-status')
  .description('Check Claude Code integration status')
  .action(async () => {
    const status = claudeCodeIntegration.getStatus();
    
    console.log('📊 Claude Code Integration Status:');
    console.log(`✅ Completed prompts: ${status.completedPrompts}`);
    console.log(`⏳ Pending prompts: ${status.pendingPrompts}`);
    console.log(`📁 Prompts directory: ${status.promptsDir}`);
    console.log(`📁 Outputs directory: ${status.outputsDir}`);
    
    if (status.pendingList.length > 0) {
      console.log('\n🔄 Pending prompts:');
      status.pendingList.forEach((prompt: string) => {
        console.log(`  - ${prompt}`);
      });
    }
  });

program
  .command('claude-process')
  .description('Process next pending Claude Code prompt')
  .action(async () => {
    const promptFile = await claudeCodeIntegration.processNextPrompt();
    
    if (promptFile) {
      console.log(`📝 Next prompt ready for processing: ${promptFile}`);
      console.log('\n📋 Instructions:');
      console.log('1. Open the prompt file in Claude Code');
      console.log('2. Generate the response based on the requirements');
      console.log('3. Save the output as JSON to the outputs directory');
      console.log('\n💡 Tip: Use Claude Code\'s file operations to save directly to the output path');
    } else {
      console.log('✅ No pending prompts to process');
    }
  });

program
  .command('claude-interactive')
  .description('Start interactive Claude Code session')
  .action(async () => {
    const sessionId = `session-${Date.now()}`;
    await claudeCodeIntegration.startInteractiveSession(sessionId);
    
    console.log('🎯 Interactive Claude Code session started!');
    console.log('\n📋 How to use:');
    console.log('1. Check status: npm run claude-status');
    console.log('2. Process prompts: npm run claude-process');
    console.log('3. Monitor outputs directory for completed responses');
    console.log('\n💡 This approach avoids API costs while still using Claude AI');
  });

program
  .command('claude-cleanup')
  .description('Clean up old processed prompts and outputs')
  .option('--days <days>', 'Clean files older than N days', '7')
  .action(async (options) => {
    await claudeCodeIntegration.cleanup(parseInt(options.days));
    console.log(`🧹 Cleaned up processed files older than ${options.days} days`);
  });

program
  .command('cost-comparison')
  .description('Show cost comparison between API and local modes')
  .action(async () => {
    console.log('💰 Cost Comparison: API vs Local Mode\n');
    
    console.log('🔴 API Mode (Original):');
    console.log('  - Uses Claude API directly');
    console.log('  - Cost: ~$0.10-0.50 per component generated');
    console.log('  - For full app: ~$5-25 per generation');
    console.log('  - Monthly cost: $100-500+ for regular use');
    
    console.log('\n🟢 Local Mode (New):');
    console.log('  - Uses your Claude Code Max subscription');
    console.log('  - Cost: $0 additional (included in subscription)');
    console.log('  - Template-based generation: Instant, no API calls');
    console.log('  - Interactive mode: Manual processing via Claude Code');
    
    console.log('\n📊 Recommendation:');
    console.log('  - Use Local Mode for cost-effective development');
    console.log('  - Template mode for basic/standard applications');
    console.log('  - Interactive mode for complex custom requirements');
  });

// Helper functions
async function loadTemplate(templateName: string, baseRequest: AppGenerationRequest): Promise<AppGenerationRequest> {
  const templatesDir = path.join(__dirname, '../templates');
  const templatePath = path.join(templatesDir, `${templateName}.json`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
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

async function startInteractiveGeneration(request: AppGenerationRequest, orchestrator: ServiceNowAppOrchestratorLocal): Promise<void> {
  console.log('🎯 Interactive Generation Mode');
  console.log('This mode creates prompts for Claude Code processing');
  
  // Start interactive session
  const sessionId = `gen-${Date.now()}`;
  await claudeCodeIntegration.startInteractiveSession(sessionId);
  
  // Generate base structure with templates
  console.log('⚡ Generating base structure with templates...');
  const result = await orchestrator.generateApplication(request);
  
  // Create prompts for complex components
  console.log('📝 Creating Claude Code prompts for complex components...');
  
  if (request.requirements.workflows && request.requirements.workflows.length > 0) {
    await claudeCodeIntegration.createPrompt(
      `workflows-${sessionId}`,
      `Generate ServiceNow workflows for: ${JSON.stringify(request.requirements.workflows, null, 2)}`,
      { appScope: request.appScope, type: 'workflow' }
    );
  }
  
  if (request.requirements.businessRules && request.requirements.businessRules.length > 0) {
    await claudeCodeIntegration.createPrompt(
      `business-rules-${sessionId}`,
      `Generate ServiceNow business rules for: ${JSON.stringify(request.requirements.businessRules, null, 2)}`,
      { appScope: request.appScope, type: 'business-rule' }
    );
  }
  
  console.log('✅ Interactive session ready!');
  console.log('Next steps:');
  console.log('1. Run: npm run claude-process');
  console.log('2. Process prompts in Claude Code');
  console.log('3. Check status: npm run claude-status');
}

async function handleGenerationResult(result: any, options: any): Promise<void> {
  if (result.success) {
    console.log('✅ Application generated successfully!');
    console.log(`📱 Application ID: ${result.appId}`);
    console.log(`📦 Update Set ID: ${result.updateSetId}`);
    console.log(`🔧 Components created: ${Object.keys(result.components).length}`);
    
    if (options.outputDir) {
      await exportResults(result, options.outputDir);
    }
  } else {
    console.error('❌ Application generation failed');
    console.error(`Errors: ${result.errors?.join(', ')}`);
    process.exit(1);
  }
}

async function exportResults(result: any, outputDir: string): Promise<void> {
  const exportDir = path.resolve(outputDir);
  
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(exportDir, 'generation-result.json'),
    JSON.stringify(result, null, 2)
  );

  console.log(`📁 Results exported to ${exportDir}`);
}

// Parse command line arguments
program.parse();
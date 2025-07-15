#!/usr/bin/env node

import { program } from 'commander';
import { ServiceNowAppOrchestratorLocal } from '../orchestrator/app-orchestrator-local';
import { ServiceNowAppOrchestrator } from '../orchestrator/app-orchestrator';
import { AppGenerationRequest, ServiceNowStudioConfig } from '../types/servicenow-studio.types';
import { validateConfig } from '../config/studio.config';
import { claudeCodeIntegration } from './claude-code-integration';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

program
  .name('snow-flow')
  .description('🚀 Snow-flow: AI-Powered ServiceNow Application Builder')
  .version('1.0.0');

// Main unified command - like claude-flow swarm
program
  .command('create <type>')
  .description('Create ServiceNow applications, widgets, or components')
  .option('--name <name>', 'Application/component name')
  .option('--scope <scope>', 'ServiceNow scope (e.g., x_my_app)')
  .option('--description <description>', 'Description')
  .option('--mode <mode>', 'Generation mode: local, api, or interactive', 'local')
  .option('--template <template>', 'Use template: basic-crud, task-management, service-portal-widget')
  .option('--config <file>', 'Configuration file path')
  .option('--output <dir>', 'Output directory')
  .option('--deploy', 'Deploy to ServiceNow after generation')
  .option('--dry-run', 'Show what would be generated without creating')
  .action(createHandler);

async function createHandler(type: string, options: any): Promise<void> {
    try {
      console.log('🚀 Snow-flow: Creating ServiceNow components...');
      
      // Demo mode bypasses ServiceNow validation
      if (options.demo) {
        console.log('🎯 Demo Mode: Generating template without ServiceNow connection');
        const result = await executeDemoMode(type, options);
        await showResults(result, options);
        return;
      }
      
      // Auto-detect best mode based on environment
      const mode = autoDetectMode(options.mode);
      console.log(`💡 Using ${mode} mode`);
      
      // Validate environment based on mode
      validateConfig(mode as 'local' | 'api' | 'interactive');
      
      // Create request based on type
      const request = await createRequestFromType(type, options);
      
      // Execute based on mode
      let result;
      switch (mode) {
        case 'local':
          result = await executeLocalMode(request, options);
          break;
        case 'api':
          result = await executeApiMode(request, options);
          break;
        case 'interactive':
          result = await executeInteractiveMode(request, options);
          break;
        default:
          throw new Error(`Unknown mode: ${mode}`);
      }
      
      // Show results
      await showResults(result, options);
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
}

// Quick shortcuts for common operations
program
  .command('widget <name>')
  .description('🎨 Create a ServiceNow Service Portal widget')
  .option('--type <type>', 'Widget type: counter, dashboard, form, chart, list', 'counter')
  .option('--table <table>', 'Data source table')
  .option('--scope <scope>', 'ServiceNow scope')
  .option('--mode <mode>', 'Generation mode', 'local')
  .option('--demo', 'Demo mode: Generate without ServiceNow connection')
  .action(async (name, options) => {
    const type = 'widget';
    const mergedOptions = {
      ...options,
      name,
      template: 'service-portal-widget',
      widgetType: options.type
    };
    
    // Call the create action directly
    await createHandler(type, mergedOptions);
  });

program
  .command('app <name>')
  .description('📱 Create a complete ServiceNow application')
  .option('--template <template>', 'App template: basic-crud, task-management', 'basic-crud')
  .option('--scope <scope>', 'ServiceNow scope')
  .option('--mode <mode>', 'Generation mode', 'local')
  .action(async (name, options) => {
    const type = 'application';
    const mergedOptions = {
      ...options,
      name,
      template: options.template
    };
    
    // Call the create action directly
    await createHandler(type, mergedOptions);
  });

program
  .command('component <type> <name>')
  .description('🔧 Create specific ServiceNow components')
  .option('--table <table>', 'Target table')
  .option('--scope <scope>', 'ServiceNow scope')
  .option('--mode <mode>', 'Generation mode', 'local')
  .action(async (componentType, name, options) => {
    const type = 'component';
    const mergedOptions = {
      ...options,
      name,
      componentType: componentType // business-rule, client-script, ui-page, etc.
    };
    
    // Call the create action directly
    await createHandler(type, mergedOptions);
  });

// Status and utility commands
program
  .command('status')
  .description('📊 Show Snow-flow status and configuration')
  .action(async () => {
    console.log('📊 Snow-flow Status:');
    console.log('================');
    
    // Check environment
    const hasServiceNowInstance = !!process.env.SERVICENOW_INSTANCE_URL;
    const hasOAuth = !!(process.env.SERVICENOW_CLIENT_ID && process.env.SERVICENOW_CLIENT_SECRET);
    const hasBasicAuth = !!(process.env.SERVICENOW_USERNAME && process.env.SERVICENOW_PASSWORD);
    const hasServiceNow = hasServiceNowInstance && (hasOAuth || hasBasicAuth);
    const hasClaudeAPI = !!process.env.ANTHROPIC_API_KEY;
    
    console.log(`🔗 ServiceNow Connection: ${hasServiceNow ? '✅ Configured' : '❌ Not configured'}`);
    if (hasServiceNow) {
      console.log(`   Authentication: ${hasOAuth ? '🔐 OAuth2' : '🔐 Basic Auth'}`);
    }
    console.log(`🤖 Claude API: ${hasClaudeAPI ? '✅ Available' : '💡 Using Local Mode'}`);
    console.log(`💰 Recommended Mode: ${hasClaudeAPI ? 'API (costs money)' : 'Local (free)'}`);
    
    // Show Claude Code integration status
    const claudeStatus = claudeCodeIntegration.getStatus();
    console.log(`\n🎯 Claude Code Integration:`);
    console.log(`   Completed: ${claudeStatus.completedPrompts}`);
    console.log(`   Pending: ${claudeStatus.pendingPrompts}`);
    
    // Show available templates
    const templates = getAvailableTemplates();
    console.log(`\n📋 Available Templates:`);
    templates.forEach(template => console.log(`   - ${template}`));
  });

program
  .command('init')
  .description('🔧 Initialize Snow-flow in current directory')
  .option('--name <name>', 'Project name')
  .option('--scope <scope>', 'ServiceNow scope')
  .action(async (options) => {
    const projectName = options.name || path.basename(process.cwd());
    const scope = options.scope || `x_${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    console.log(`🔧 Initializing Snow-flow project: ${projectName}`);
    
    // Create basic project structure
    const dirs = ['src', 'config', 'docs', 'templates'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
    
    // Create basic config
    const configTemplate = {
      appName: projectName,
      appScope: scope,
      appDescription: `ServiceNow application: ${projectName}`,
      preferences: {
        useModernUI: true,
        includeMobileSupport: true,
        generateTests: true,
        includeDocumentation: true
      }
    };
    
    fs.writeFileSync('snow-flow.config.json', JSON.stringify(configTemplate, null, 2));
    console.log('📄 Created snow-flow.config.json');
    
    // Copy .env.example if it doesn't exist
    if (!fs.existsSync('.env')) {
      const envExample = `# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password

# Optional: OAuth2
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret

# Optional: Claude API (costs money)
# ANTHROPIC_API_KEY=sk-ant-api03-your-key

# Settings
LOG_LEVEL=info
TIMEOUT_MS=60000
`;
      fs.writeFileSync('.env', envExample);
      console.log('📄 Created .env file');
    }
    
    console.log('\n✅ Snow-flow initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Edit .env with your ServiceNow credentials');
    console.log('2. Run: snow-flow status');
    console.log('3. Create your first app: snow-flow app "My App"');
  });

program
  .command('templates')
  .description('📋 List available templates')
  .action(() => {
    const templates = getAvailableTemplates();
    console.log('📋 Available Templates:');
    console.log('===================');
    templates.forEach((template: any) => {
      console.log(`\n🎨 ${template.name}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Usage: snow-flow create app --template ${template.id}`);
    });
  });

// Helper functions
function autoDetectMode(requestedMode: string): string {
  if (requestedMode !== 'local') return requestedMode;
  
  const hasClaudeAPI = !!process.env.ANTHROPIC_API_KEY;
  
  // ServiceNow validation is handled by validateConfig
  // Just return the requested mode
  return 'local';
}

async function createRequestFromType(type: string, options: any): Promise<AppGenerationRequest> {
  const baseRequest: AppGenerationRequest = {
    appName: options.name || `Generated ${type}`,
    appScope: options.scope || `x_generated_${type.toLowerCase()}`,
    appDescription: options.description || `Generated ${type} by Snow-flow`,
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

  // Load from config file if provided
  if (options.config) {
    const configPath = path.resolve(options.config);
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      Object.assign(baseRequest, configData);
    }
  }

  // Load from template if provided
  if (options.template) {
    const templateData = await loadTemplate(options.template);
    baseRequest.requirements = { ...baseRequest.requirements, ...templateData.requirements };
    baseRequest.preferences = { ...baseRequest.preferences, ...templateData.preferences };
  }

  // Customize based on type
  switch (type) {
    case 'widget':
      baseRequest.requirements.ui = [{
        type: 'widget',
        name: options.name,
        description: options.description || `${options.widgetType} widget`
      }];
      break;
      
    case 'application':
      // Full application - use template
      break;
      
    case 'component':
      // Specific component based on componentType
      switch (options.componentType) {
        case 'business-rule':
          baseRequest.requirements.businessRules = [{
            name: options.name,
            table: options.table || 'task',
            when: 'before',
            actions: ['insert', 'update'],
            description: options.description || `Business rule: ${options.name}`
          }];
          break;
        // Add more component types as needed
      }
      break;
  }

  return baseRequest;
}

async function executeLocalMode(request: AppGenerationRequest, options: any): Promise<any> {
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
  
  if (options.dryRun) {
    console.log('🔍 Dry run - showing what would be generated:');
    console.log(JSON.stringify(request, null, 2));
    return { success: true, dryRun: true };
  }

  return await orchestrator.generateApplication(request);
}

async function executeApiMode(request: AppGenerationRequest, options: any): Promise<any> {
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
  
  if (options.dryRun) {
    console.log('🔍 Dry run - showing what would be generated:');
    console.log(JSON.stringify(request, null, 2));
    return { success: true, dryRun: true };
  }

  return await orchestrator.generateApplication(request);
}

async function executeInteractiveMode(request: AppGenerationRequest, options: any): Promise<any> {
  console.log('🎯 Interactive mode - using Claude Code integration');
  
  // Start interactive session
  const sessionId = `create-${Date.now()}`;
  await claudeCodeIntegration.startInteractiveSession(sessionId);
  
  // Create prompts for components
  if (request.requirements.ui && request.requirements.ui.length > 0) {
    await claudeCodeIntegration.createPrompt(
      `ui-${sessionId}`,
      `Generate ServiceNow UI components: ${JSON.stringify(request.requirements.ui, null, 2)}`,
      { appScope: request.appScope, type: 'ui' }
    );
  }
  
  console.log('✅ Interactive session ready!');
  console.log('Next steps:');
  console.log('1. Run: snow-flow claude-process');
  console.log('2. Process prompts in Claude Code');
  console.log('3. Check status: snow-flow claude-status');
  
  return { success: true, interactive: true, sessionId };
}

async function showResults(result: any, options: any): Promise<void> {
  if (result.dryRun) {
    console.log('✅ Dry run completed - no actual generation performed');
    return;
  }
  
  if (result.interactive) {
    console.log('🎯 Interactive session started');
    return;
  }
  
  if (result.success) {
    console.log('✅ Generation completed successfully!');
    if (result.appId) console.log(`📱 Application ID: ${result.appId}`);
    if (result.updateSetId) console.log(`📦 Update Set ID: ${result.updateSetId}`);
    
    const componentCount = Object.keys(result.components || {}).length;
    console.log(`🔧 Components created: ${componentCount}`);
    
    if (options.output) {
      await exportResults(result, options.output);
    }
  } else {
    console.error('❌ Generation failed');
    if (result.errors?.length > 0) {
      console.error('Errors:', result.errors.join(', '));
    }
  }
}

async function loadTemplate(templateName: string): Promise<any> {
  // Try both src/ and dist/ directories to handle both ts-node and compiled versions
  const possibleDirs = [
    path.join(__dirname, '../templates'), // dist/cli/../templates = dist/templates
    path.join(__dirname, '../../src/templates'), // dist/cli/../../src/templates = src/templates
    path.join(process.cwd(), 'src/templates'), // current dir + src/templates
    path.join(process.cwd(), 'dist/templates') // current dir + dist/templates
  ];
  
  let templatePath: string | null = null;
  
  for (const dir of possibleDirs) {
    const candidate = path.join(dir, `${templateName}.json`);
    if (fs.existsSync(candidate)) {
      templatePath = candidate;
      break;
    }
  }
  
  if (!templatePath) {
    throw new Error(`Template not found: ${templateName}. Searched in: ${possibleDirs.join(', ')}`);
  }
  
  return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
}

async function executeDemoMode(type: string, options: any): Promise<any> {
  console.log('🎯 Demo mode: Generating template code for demonstration');
  
  // Generate demo widget code based on type
  const demoWidget = {
    name: options.name,
    type: options.type || 'counter',
    table: options.table || 'task',
    scope: options.scope || 'x_demo_widget',
    
    // Generate demo ServiceNow widget files
    files: {
      'widget.html': generateDemoWidgetHTML(options),
      'widget.js': generateDemoWidgetJS(options),
      'widget.css': generateDemoWidgetCSS(options),
      'widget.server.js': generateDemoWidgetServer(options),
      'widget.option_schema.json': generateDemoWidgetOptions(options)
    }
  };
  
  // Save demo files to local directory
  const demoDir = path.join(process.cwd(), 'demo-widget-output');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }
  
  Object.entries(demoWidget.files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join(demoDir, filename), content);
  });
  
  return {
    success: true,
    demo: true,
    widgetName: options.name,
    widgetType: options.type || 'counter',
    filesGenerated: Object.keys(demoWidget.files).length,
    outputDir: demoDir
  };
}

function generateDemoWidgetHTML(options: any): string {
  const widgetType = options.type || 'counter';
  const tableName = options.table || 'task';
  
  return `<div class="widget-${widgetType}">
  <h3>{{data.title || '${options.name}'}}</h3>
  <div class="widget-content">
    ${widgetType === 'counter' ? `
    <div class="counter-display">
      <span class="counter-value">{{data.count}}</span>
      <span class="counter-label">${tableName} Records</span>
    </div>
    ` : ''}
    ${widgetType === 'dashboard' ? `
    <div class="dashboard-grid">
      <div class="dashboard-item" ng-repeat="item in data.items">
        <h4>{{item.title}}</h4>
        <p>{{item.value}}</p>
      </div>
    </div>
    ` : ''}
    ${widgetType === 'form' ? `
    <form ng-submit="c.submitForm()">
      <div class="form-field">
        <label>Title:</label>
        <input type="text" ng-model="c.formData.title" />
      </div>
      <div class="form-field">
        <label>Description:</label>
        <textarea ng-model="c.formData.description"></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
    ` : ''}
  </div>
</div>`;
}

function generateDemoWidgetJS(options: any): string {
  const widgetType = options.type || 'counter';
  const tableName = options.table || 'task';
  
  return `function(spUtil) {
  var c = this;
  
  // Initialize widget
  c.init = function() {
    c.data = c.data || {};
    c.data.title = c.options.title || '${options.name}';
    ${widgetType === 'counter' ? `c.loadCount();` : ''}
    ${widgetType === 'dashboard' ? `c.loadDashboardData();` : ''}
    ${widgetType === 'form' ? `c.initForm();` : ''}
  };
  
  ${widgetType === 'counter' ? `
  // Load record count
  c.loadCount = function() {
    c.server.get({
      table: '${tableName}',
      action: 'count'
    }).then(function(response) {
      c.data.count = response.data.count || 0;
    });
  };
  ` : ''}
  
  ${widgetType === 'dashboard' ? `
  // Load dashboard data
  c.loadDashboardData = function() {
    c.server.get({
      table: '${tableName}',
      action: 'dashboard'
    }).then(function(response) {
      c.data.items = response.data.items || [];
    });
  };
  ` : ''}
  
  ${widgetType === 'form' ? `
  // Initialize form
  c.initForm = function() {
    c.formData = {
      title: '',
      description: ''
    };
  };
  
  // Submit form
  c.submitForm = function() {
    c.server.post({
      table: '${tableName}',
      action: 'create',
      data: c.formData
    }).then(function(response) {
      if (response.data.success) {
        spUtil.addInfoMessage('Record created successfully');
        c.initForm(); // Reset form
      }
    });
  };
  ` : ''}
  
  // Initialize widget on load
  c.init();
}`;
}

function generateDemoWidgetCSS(options: any): string {
  const widgetType = options.type || 'counter';
  
  return `.widget-${widgetType} {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  margin: 10px 0;
}

.widget-${widgetType} h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2em;
}

.widget-content {
  margin-top: 15px;
}

${widgetType === 'counter' ? `
.counter-display {
  text-align: center;
  padding: 20px;
}

.counter-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #0066cc;
  display: block;
}

.counter-label {
  font-size: 0.9em;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}
` : ''}

${widgetType === 'dashboard' ? `
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.dashboard-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #0066cc;
}

.dashboard-item h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.dashboard-item p {
  margin: 0;
  font-size: 1.1em;
  font-weight: bold;
  color: #0066cc;
}
` : ''}

${widgetType === 'form' ? `
.form-field {
  margin-bottom: 15px;
}

.form-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-field input,
.form-field textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-field textarea {
  height: 80px;
  resize: vertical;
}

button[type="submit"] {
  background: #0066cc;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button[type="submit"]:hover {
  background: #0052a3;
}
` : ''}`;
}

function generateDemoWidgetServer(options: any): string {
  const widgetType = options.type || 'counter';
  const tableName = options.table || 'task';
  
  return `(function() {
  var action = input.action || 'load';
  var table = input.table || '${tableName}';
  
  // Initialize data object
  data.title = options.title || '${options.name}';
  data.widget_type = '${widgetType}';
  
  switch(action) {
    ${widgetType === 'counter' ? `
    case 'count':
      var gr = new GlideRecord(table);
      gr.addActiveQuery();
      gr.query();
      data.count = gr.getRowCount();
      break;
    ` : ''}
    
    ${widgetType === 'dashboard' ? `
    case 'dashboard':
      var items = [];
      var gr = new GlideRecord(table);
      gr.addActiveQuery();
      gr.orderByDesc('sys_created_on');
      gr.setLimit(10);
      gr.query();
      
      while (gr.next()) {
        items.push({
          title: gr.getDisplayValue('number') || gr.getDisplayValue('sys_id'),
          value: gr.getDisplayValue('state') || gr.getDisplayValue('active'),
          sys_id: gr.getUniqueValue()
        });
      }
      
      data.items = items;
      break;
    ` : ''}
    
    ${widgetType === 'form' ? `
    case 'create':
      var gr = new GlideRecord(table);
      gr.initialize();
      gr.setValue('short_description', input.data.title);
      gr.setValue('description', input.data.description);
      var sys_id = gr.insert();
      
      data.success = !!sys_id;
      data.sys_id = sys_id;
      break;
    ` : ''}
    
    default:
      // Default load action
      data.initialized = true;
      break;
  }
  
  // Add metadata
  data.table = table;
  data.generated_by = 'Snow-flow Demo Mode';
  data.generated_at = new GlideDateTime().getDisplayValue();
})();`;
}

function generateDemoWidgetOptions(options: any): string {
  const widgetType = options.type || 'counter';
  
  return JSON.stringify({
    "title": {
      "name": "Title",
      "section": "Presentation",
      "default_value": options.name,
      "label": "Widget Title",
      "type": "string"
    },
    "table": {
      "name": "Table",
      "section": "Data",
      "default_value": options.table || "task",
      "label": "Source Table",
      "type": "string"
    },
    ...(widgetType === 'counter' && {
      "show_chart": {
        "name": "Show Chart",
        "section": "Display",
        "default_value": "true",
        "label": "Show Chart Visualization",
        "type": "boolean"
      },
      "auto_refresh": {
        "name": "Auto Refresh",
        "section": "Behavior",
        "default_value": "true",
        "label": "Auto Refresh Data",
        "type": "boolean"
      },
      "refresh_interval": {
        "name": "Refresh Interval",
        "section": "Behavior",
        "default_value": "30",
        "label": "Refresh Interval (seconds)",
        "type": "integer"
      }
    }),
    ...(widgetType === 'dashboard' && {
      "max_items": {
        "name": "Max Items",
        "section": "Display",
        "default_value": "10",
        "label": "Maximum Items to Show",
        "type": "integer"
      },
      "show_filters": {
        "name": "Show Filters",
        "section": "Display",
        "default_value": "true",
        "label": "Show Filter Controls",
        "type": "boolean"
      }
    }),
    ...(widgetType === 'form' && {
      "redirect_after_submit": {
        "name": "Redirect After Submit",
        "section": "Behavior",
        "default_value": "",
        "label": "Redirect URL After Submit",
        "type": "string"
      },
      "show_success_message": {
        "name": "Show Success Message",
        "section": "Behavior",
        "default_value": "true",
        "label": "Show Success Message",
        "type": "boolean"
      }
    })
  }, null, 2);
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

function getAvailableTemplates(): any[] {
  return [
    {
      id: 'basic-crud',
      name: 'Basic CRUD Application',
      description: 'Simple CRUD application with table, forms, and basic workflow'
    },
    {
      id: 'task-management',
      name: 'Task Management System',
      description: 'Complete task management with assignments, priorities, and workflows'
    },
    {
      id: 'service-portal-widget',
      name: 'Service Portal Widget',
      description: 'Custom Service Portal widgets with various types and configurations'
    }
  ];
}

// Add Claude Code integration commands
program
  .command('claude-status')
  .description('📊 Check Claude Code integration status')
  .action(async () => {
    const status = claudeCodeIntegration.getStatus();
    console.log('📊 Claude Code Integration Status:');
    console.log(`✅ Completed: ${status.completedPrompts}`);
    console.log(`⏳ Pending: ${status.pendingPrompts}`);
    if (status.pendingList.length > 0) {
      console.log('\n🔄 Pending prompts:');
      status.pendingList.forEach((prompt: any) => console.log(`  - ${prompt}`));
    }
  });

program
  .command('claude-process')
  .description('🔄 Process next Claude Code prompt')
  .action(async () => {
    const promptFile = await claudeCodeIntegration.processNextPrompt();
    if (promptFile) {
      console.log(`📝 Process this prompt in Claude Code: ${promptFile}`);
    } else {
      console.log('✅ No pending prompts');
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
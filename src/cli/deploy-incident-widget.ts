#!/usr/bin/env node
/**
 * Deploy Incident Management Widget to ServiceNow
 * This script deploys the widget directly via the ServiceNow API
 */

import { ServiceNowClient } from '../utils/servicenow-client';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

async function deployIncidentWidget() {
  console.log(chalk.cyan('\n🚀 ServiceNow Incident Management Widget Deployment\n'));
  
  const client = new ServiceNowClient();
  
  try {
    // Test connection first
    console.log(chalk.yellow('📡 Testing ServiceNow connection...'));
    const connectionTest = await client.testConnection();
    
    if (!connectionTest.success) {
      console.error(chalk.red('❌ Failed to connect to ServiceNow:'), connectionTest.error);
      process.exit(1);
    }
    
    console.log(chalk.green('✅ Connected to ServiceNow successfully!'));
    
    // Load widget files
    console.log(chalk.yellow('\n📂 Loading widget files...'));
    const widgetPath = join(process.cwd(), 'servicenow', 'widgets');
    
    const htmlTemplate = readFileSync(join(widgetPath, 'incident-management-widget.html'), 'utf8');
    const cssStyles = readFileSync(join(widgetPath, 'incident-management-widget.css'), 'utf8');
    const clientScript = readFileSync(join(widgetPath, 'incident-management-widget.js'), 'utf8');
    const serverScript = readFileSync(join(widgetPath, 'incident-management-widget-server.js'), 'utf8');
    const optionsSchema = readFileSync(join(widgetPath, 'incident-management-widget-options.json'), 'utf8');
    
    console.log(chalk.green('✅ Widget files loaded successfully'));
    
    // Parse options schema to get widget options
    const optionsData = JSON.parse(optionsSchema);
    const widgetOptions = optionsData.widget_options || [];
    
    // Check if widget already exists
    console.log(chalk.yellow('\n🔍 Checking if widget already exists...'));
    const existingWidget = await client.getWidget('incident-management-widget');
    
    let result;
    
    if (existingWidget.success && existingWidget.data) {
      // Update existing widget
      console.log(chalk.yellow('🔄 Widget exists, updating...'));
      
      result = await client.updateWidget(existingWidget.data.sys_id!, {
        name: 'Enhanced Incident Management Widget',
        title: 'Incident Management Dashboard',
        description: 'Advanced incident management with visual features and real-time updates',
        template: htmlTemplate,
        css: cssStyles,
        client_script: clientScript,
        server_script: serverScript,
        option_schema: JSON.stringify(widgetOptions),
        demo_data: JSON.stringify({
          title: 'Incident Management',
          max_records: 100,
          show_charts: true,
          auto_refresh: true
        }),
        has_preview: true,
        category: 'custom'
      });
    } else {
      // Create new widget
      console.log(chalk.yellow('➕ Creating new widget...'));
      
      result = await client.createWidget({
        name: 'Enhanced Incident Management Widget',
        id: 'incident-management-widget',
        title: 'Incident Management Dashboard',
        description: 'Advanced incident management with visual features and real-time updates',
        template: htmlTemplate,
        css: cssStyles,
        client_script: clientScript,
        server_script: serverScript,
        option_schema: JSON.stringify(widgetOptions),
        demo_data: JSON.stringify({
          title: 'Incident Management',
          max_records: 100,
          show_charts: true,
          auto_refresh: true
        }),
        has_preview: true,
        category: 'custom'
      });
    }
    
    if (result.success) {
      console.log(chalk.green('\n✅ Widget deployed successfully!'));
      console.log(chalk.cyan('\n📋 Widget Details:'));
      console.log(chalk.white(`   • Widget ID: incident-management-widget`));
      console.log(chalk.white(`   • System ID: ${result.data?.sys_id}`));
      console.log(chalk.white(`   • Name: Enhanced Incident Management Widget`));
      
      console.log(chalk.cyan('\n🎯 Next Steps:'));
      console.log(chalk.white('1. Navigate to Service Portal > Widgets in your ServiceNow instance'));
      console.log(chalk.white('2. Search for "Enhanced Incident Management Widget"'));
      console.log(chalk.white('3. Add the widget to any Service Portal page'));
      console.log(chalk.white('4. Configure widget options as needed'));
      
      console.log(chalk.cyan('\n🔧 Widget Configuration:'));
      console.log(chalk.white('   • Enable charts: show_charts = true'));
      console.log(chalk.white('   • Auto-refresh: refresh_interval = 30 seconds'));
      console.log(chalk.white('   • Max records: max_records = 100'));
      console.log(chalk.white('   • Priority filter: default_priority_filter'));
      
      console.log(chalk.cyan('\n📊 Available Chart Types:'));
      console.log(chalk.white('   • Status Distribution (Doughnut Chart)'));
      console.log(chalk.white('   • Priority Breakdown (Bar Chart)'));
      console.log(chalk.white('   • Trend Analysis (Line Chart)'));
      
      console.log(chalk.green('\n🎉 Deployment completed successfully!\n'));
    } else {
      console.error(chalk.red('\n❌ Failed to deploy widget:'), result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Deployment error:'), error);
    process.exit(1);
  }
}

// Run deployment
deployIncidentWidget().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
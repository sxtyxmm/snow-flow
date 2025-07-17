#!/usr/bin/env node

/**
 * Deploy OpenAI Incident Classification Widget to ServiceNow
 */

const fs = require('fs');
const path = require('path');
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function deployWidget() {
  console.log('🚀 Starting widget deployment to ServiceNow...');
  
  try {
    // Initialize ServiceNow client
    const client = new ServiceNowClient();
    
    // Test connection first
    console.log('🔗 Testing ServiceNow connection...');
    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      console.error('❌ ServiceNow connection failed:', connectionTest.error);
      return;
    }
    console.log('✅ ServiceNow connection successful!');
    
    // Read widget files
    const widgetDir = path.join(__dirname, 'servicenow/widgets/openai_incident_classifier');
    
    console.log('📂 Reading widget files...');
    const widgetJson = JSON.parse(fs.readFileSync(path.join(widgetDir, 'widget.json'), 'utf8'));
    const template = fs.readFileSync(path.join(widgetDir, 'template.html'), 'utf8');
    const css = fs.readFileSync(path.join(widgetDir, 'style.css'), 'utf8');
    const clientScript = fs.readFileSync(path.join(widgetDir, 'client_controller.js'), 'utf8');
    const serverScript = fs.readFileSync(path.join(widgetDir, 'server_script.js'), 'utf8');
    
    // Check if widget already exists
    console.log('🔍 Checking if widget already exists...');
    const existingWidget = await client.getWidget(widgetJson.name);
    
    // Prepare widget data
    const widgetData = {
      name: widgetJson.name,
      id: widgetJson.name,
      title: widgetJson.title,
      description: widgetJson.description,
      template: template,
      css: css,
      client_script: clientScript,
      server_script: serverScript,
      option_schema: JSON.stringify([]),
      demo_data: JSON.stringify({}),
      has_preview: false,
      category: widgetJson.category || 'custom'
    };
    
    let result;
    if (existingWidget.success) {
      // Update existing widget
      console.log('🔄 Updating existing widget...');
      result = await client.updateWidget(existingWidget.data.sys_id, widgetData);
    } else {
      // Create new widget
      console.log('✨ Creating new widget...');
      result = await client.createWidget(widgetData);
    }
    
    if (result.success) {
      console.log('🎉 Widget deployed successfully!');
      console.log(`📋 Widget Name: ${result.data.name}`);
      console.log(`🆔 Widget ID: ${result.data.sys_id}`);
      console.log(`🔗 Widget URL: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=${result.data.sys_id}`);
      
      // Create custom fields on incident table
      console.log('📊 Creating custom fields on incident table...');
      
      const fields = [
        {
          table: 'incident',
          element: 'u_ai_classification',
          column_label: 'AI Classification',
          internal_type: 'string',
          max_length: 50
        },
        {
          table: 'incident',
          element: 'u_ai_confidence',
          column_label: 'AI Confidence',
          internal_type: 'decimal'
        },
        {
          table: 'incident',
          element: 'u_ai_classification_date',
          column_label: 'AI Classification Date',
          internal_type: 'glide_date_time'
        }
      ];
      
      for (const field of fields) {
        try {
          const fieldResult = await client.createTableField(field);
          if (fieldResult.success) {
            console.log(`✅ Created field: ${field.element}`);
          } else {
            console.log(`⚠️  Field ${field.element} may already exist`);
          }
        } catch (error) {
          console.log(`⚠️  Field ${field.element} creation failed (may already exist)`);
        }
      }
      
      console.log('\n🎯 Deployment Complete!');
      console.log('\n📋 Next Steps:');
      console.log('1. Configure OpenAI API key in System Properties (x_openai.api_key)');
      console.log('2. Add widget to a Service Portal page using the Designer');
      console.log('3. Test the widget functionality');
      console.log(`\n🔗 Direct links:`);
      console.log(`   Widget Editor: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=${result.data.sys_id}`);
      console.log(`   Service Portal Designer: https://dev198027.service-now.com/sp_config?id=designer`);
      console.log(`   System Properties: https://dev198027.service-now.com/nav_to.do?uri=%2Fsys_properties_list.do`);
      
    } else {
      console.error('❌ Widget deployment failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
  }
}

// Run deployment
deployWidget().catch(console.error);
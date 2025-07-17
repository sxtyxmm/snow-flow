#!/usr/bin/env node

/**
 * Update Server Script for OpenAI Incident Classification Widget
 */

const fs = require('fs');
const path = require('path');
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function updateServerScript() {
  console.log('🔄 Updating server script for OpenAI Incident Classification Widget...');
  
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
    
    // Read server script file
    const serverScriptPath = path.join(__dirname, 'servicenow/widgets/openai_incident_classifier/server_script.js');
    
    console.log('📂 Reading server script file...');
    const serverScript = fs.readFileSync(serverScriptPath, 'utf8');
    
    console.log(`📝 Server script length: ${serverScript.length} characters`);
    console.log(`📝 First 200 characters: ${serverScript.substring(0, 200)}...`);
    
    // Find the existing widget
    const widgetId = 'openai_incident_classifier';
    console.log(`🔍 Finding existing widget: ${widgetId}`);
    
    const existingWidget = await client.getWidget(widgetId);
    if (!existingWidget.success) {
      console.error('❌ Widget not found:', existingWidget.error);
      return;
    }
    
    console.log(`✅ Found widget: ${existingWidget.data.name} (${existingWidget.data.sys_id})`);
    
    // Update only the server script
    console.log('🔄 Updating server script...');
    const result = await client.updateWidget(existingWidget.data.sys_id, {
      server_script: serverScript
    });
    
    if (result.success) {
      console.log('🎉 Server script updated successfully!');
      console.log(`🔗 Widget URL: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=${existingWidget.data.sys_id}`);
      
      // Verify the update
      console.log('🔍 Verifying server script update...');
      const updatedWidget = await client.getWidget(widgetId);
      if (updatedWidget.success) {
        const updatedScript = updatedWidget.data.server_script;
        console.log(`📝 Updated server script length: ${updatedScript ? updatedScript.length : 0} characters`);
        if (updatedScript && updatedScript.length > 0) {
          console.log('✅ Server script successfully updated and verified!');
        } else {
          console.log('❌ Server script appears to be empty after update');
        }
      }
    } else {
      console.error('❌ Failed to update server script:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Update error:', error.message);
  }
}

// Run update
updateServerScript().catch(console.error);
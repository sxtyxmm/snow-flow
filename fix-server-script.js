#!/usr/bin/env node

/**
 * Fix Server Script for OpenAI Incident Classification Widget
 * Using direct API call approach
 */

const fs = require('fs');
const path = require('path');
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function fixServerScript() {
  console.log('🔧 Fixing server script for OpenAI Incident Classification Widget...');
  
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
    let serverScript = fs.readFileSync(serverScriptPath, 'utf8');
    
    // Clean up the script - remove any problematic characters
    serverScript = serverScript.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    console.log(`📝 Server script length: ${serverScript.length} characters`);
    
    // Find the existing widget using direct API call
    const widgetSysId = '6f5fa02583be6a102a7ea130ceaad386';
    console.log(`🔍 Updating widget: ${widgetSysId}`);
    
    // Use direct API call to update the server script
    const baseUrl = 'https://dev198027.service-now.com';
    
    // Get the client's internal axios instance
    await client.ensureAuthenticated();
    
    // Update using direct PATCH request
    const response = await client.client.patch(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`, {
      server_script: serverScript
    });
    
    if (response.status === 200) {
      console.log('🎉 Server script updated successfully!');
      console.log(`🔗 Widget URL: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=${widgetSysId}`);
      
      // Verify the update
      console.log('🔍 Verifying server script update...');
      const verifyResponse = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
      
      if (verifyResponse.status === 200) {
        const widget = verifyResponse.data.result;
        console.log(`📝 Verified server script length: ${widget.server_script ? widget.server_script.length : 0} characters`);
        
        if (widget.server_script && widget.server_script.length > 0) {
          console.log('✅ Server script successfully updated and verified!');
          console.log(`📝 Server script starts with: ${widget.server_script.substring(0, 100)}...`);
        } else {
          console.log('❌ Server script is still empty after update');
        }
      }
    } else {
      console.error('❌ Failed to update server script:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

// Run fix
fixServerScript().catch(console.error);
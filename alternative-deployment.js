#!/usr/bin/env node

/**
 * Alternative deployment approach for server script
 */

const fs = require('fs');
const path = require('path');
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function alternativeDeployment() {
  console.log('🔄 Alternative deployment approach for server script...');
  
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
    
    // First, let's try to get the widget and see what's in it
    const widgetSysId = '6f5fa02583be6a102a7ea130ceaad386';
    console.log('🔍 Getting current widget state...');
    
    await client.ensureAuthenticated();
    const baseUrl = 'https://dev198027.service-now.com';
    
    const getResponse = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
    
    if (getResponse.status === 200) {
      const widget = getResponse.data.result;
      console.log('📋 Widget Info:');
      console.log(`   Name: ${widget.name}`);
      console.log(`   Title: ${widget.title}`);
      console.log(`   Template length: ${widget.template ? widget.template.length : 0}`);
      console.log(`   CSS length: ${widget.css ? widget.css.length : 0}`);
      console.log(`   Client Script length: ${widget.client_script ? widget.client_script.length : 0}`);
      console.log(`   Server Script length: ${widget.server_script ? widget.server_script.length : 0}`);
      
      // Manual instructions
      console.log('\n🔧 MANUAL SOLUTION:');
      console.log('The server script field appears to be getting cleared by the API.');
      console.log('Please manually add the server script by:');
      console.log('\n1. Go to: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=6f5fa02583be6a102a7ea130ceaad386');
      console.log('2. Copy the content from: manual-server-script.js');
      console.log('3. Paste it into the "Server Script" field');
      console.log('4. Save the widget');
      
      // Try one more approach with a simplified script
      console.log('\n🧪 Trying with minimal script...');
      
      const minimalScript = `(function() {
  if (input && input.action) {
    data.result = { success: false, error: 'Not implemented: ' + input.action };
  } else {
    data.result = { success: true, message: 'Widget loaded' };
  }
})();`;
      
      const minimalResponse = await client.client.patch(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`, {
        server_script: minimalScript
      });
      
      if (minimalResponse.status === 200) {
        console.log('✅ Minimal script update successful');
        
        // Verify
        const verifyResponse = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
        if (verifyResponse.status === 200) {
          const updatedWidget = verifyResponse.data.result;
          console.log(`📝 Updated server script length: ${updatedWidget.server_script ? updatedWidget.server_script.length : 0}`);
          
          if (updatedWidget.server_script && updatedWidget.server_script.length > 0) {
            console.log('✅ Minimal script persisted! Now you can expand it manually.');
          } else {
            console.log('❌ Even minimal script gets cleared - this is likely an API permission issue');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

alternativeDeployment().catch(console.error);
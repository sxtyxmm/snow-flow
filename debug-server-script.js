#!/usr/bin/env node

/**
 * Debug Server Script for OpenAI Incident Classification Widget
 */

const fs = require('fs');
const path = require('path');
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function debugServerScript() {
  console.log('🔍 Debugging server script for OpenAI Incident Classification Widget...');
  
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
    
    // Test with a simple server script first
    const simpleScript = `(function() {
  data.result = {
    success: true,
    message: 'Simple test script working',
    timestamp: new Date().toISOString()
  };
})();`;
    
    console.log('🧪 Testing with simple server script...');
    
    const widgetSysId = '6f5fa02583be6a102a7ea130ceaad386';
    const baseUrl = 'https://dev198027.service-now.com';
    
    // Get the client's internal axios instance
    await client.ensureAuthenticated();
    
    // Update using direct PATCH request
    const response = await client.client.patch(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`, {
      server_script: simpleScript
    });
    
    if (response.status === 200) {
      console.log('✅ Simple server script updated successfully!');
      
      // Verify the update
      console.log('🔍 Verifying simple server script update...');
      const verifyResponse = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
      
      if (verifyResponse.status === 200) {
        const widget = verifyResponse.data.result;
        console.log(`📝 Verified server script length: ${widget.server_script ? widget.server_script.length : 0} characters`);
        
        if (widget.server_script && widget.server_script.length > 0) {
          console.log('✅ Simple server script working! Now trying with full script...');
          
          // Now try with the full script
          const serverScriptPath = path.join(__dirname, 'servicenow/widgets/openai_incident_classifier/server_script.js');
          let fullScript = fs.readFileSync(serverScriptPath, 'utf8');
          
          // Try encoding the script as base64 first
          const encodedScript = Buffer.from(fullScript).toString('base64');
          console.log(`📝 Encoded script length: ${encodedScript.length} characters`);
          
          // Try updating with full script
          const fullResponse = await client.client.patch(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`, {
            server_script: fullScript
          });
          
          if (fullResponse.status === 200) {
            console.log('✅ Full server script updated successfully!');
            
            // Verify the full update
            const fullVerifyResponse = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
            
            if (fullVerifyResponse.status === 200) {
              const fullWidget = fullVerifyResponse.data.result;
              console.log(`📝 Full verified server script length: ${fullWidget.server_script ? fullWidget.server_script.length : 0} characters`);
              
              if (fullWidget.server_script && fullWidget.server_script.length > 0) {
                console.log('🎉 Full server script successfully updated and verified!');
              } else {
                console.log('❌ Full server script is empty - there may be an issue with the script content');
                
                // Try to identify the issue by testing parts of the script
                console.log('🔍 Testing script parts...');
                const scriptLines = fullScript.split('\n');
                console.log(`📝 Script has ${scriptLines.length} lines`);
                
                // Test first half
                const firstHalf = scriptLines.slice(0, Math.floor(scriptLines.length / 2)).join('\n');
                console.log(`📝 Testing first half (${firstHalf.length} characters)...`);
                
                const firstHalfResponse = await client.client.patch(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`, {
                  server_script: firstHalf
                });
                
                if (firstHalfResponse.status === 200) {
                  const firstHalfVerify = await client.client.get(`${baseUrl}/api/now/table/sp_widget/${widgetSysId}`);
                  console.log(`📝 First half result: ${firstHalfVerify.data.result.server_script ? firstHalfVerify.data.result.server_script.length : 0} characters`);
                }
              }
            }
          } else {
            console.error('❌ Failed to update full server script:', fullResponse.status, fullResponse.statusText);
          }
        } else {
          console.log('❌ Simple server script is also empty - there may be a deeper issue');
        }
      }
    } else {
      console.error('❌ Failed to update simple server script:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

// Run debug
debugServerScript().catch(console.error);
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function deployWidget() {
  const client = new ServiceNowClient();
  
  // Test with a simple API call first to trigger authentication
  try {
    const widgets = await client.getWidgets();
    console.log('✅ Authentication successful');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }
  
  const widget = {
    name: 'openai_incident_classifier',
    id: 'openai_incident_classifier',
    title: 'OpenAI Incident Classifier',
    description: 'AI-powered incident classification widget with OpenAI integration and improved server script',
    template: '<div class="incident-classifier-widget"><h3>Test Widget</h3><p>{{c.data.result.message}}</p></div>',
    css: '.incident-classifier-widget { padding: 20px; background: #f8f9fa; }',
    client_script: 'function() { var c = this; }',
    server_script: '(function() { data.result = { success: true, message: "Server script working with new OAuth permissions!" }; })();',
    category: 'incident',
    has_preview: true
  };
  
  try {
    console.log('🚀 Deploying test widget to verify server script...');
    const result = await client.createWidget(widget);
    
    if (result.success) {
      console.log('✅ Widget deployed successfully!');
      console.log('Widget ID:', result.data.sys_id);
      console.log('Widget URL: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=' + result.data.sys_id);
      
      // Check if server script was preserved
      if (result.data.server_script && result.data.server_script.length > 0) {
        console.log('✅ Server script preserved:', result.data.server_script.length, 'characters');
        console.log('Server script content:', result.data.server_script.substring(0, 100) + '...');
      } else {
        console.log('❌ Server script is empty!');
      }
    } else {
      console.error('❌ Widget deployment failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error deploying widget:', error.message);
  }
}

deployWidget();
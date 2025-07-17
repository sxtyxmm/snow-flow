const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');
const { ServiceNowOAuth } = require('./dist/utils/snow-oauth.js');

async function findWidget() {
  const oauth = new ServiceNowOAuth();
  const client = new ServiceNowClient();
  
  try {
    const isAuth = await oauth.isAuthenticated();
    if (!isAuth) {
      console.log('❌ Not authenticated. Please run: snow-flow auth login');
      return;
    }
    
    // Get all widgets to search for incident classification widget
    const result = await client.getWidgets();
    console.log('Widget search result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      const incidentWidgets = result.data.filter(widget => 
        widget.name.toLowerCase().includes('incident') || 
        widget.name.toLowerCase().includes('openai') ||
        widget.name.toLowerCase().includes('classif')
      );
      console.log('Found incident widgets:', JSON.stringify(incidentWidgets, null, 2));
    }
    
  } catch (error) {
    console.error('Error finding widget:', error.message);
  }
}

findWidget();
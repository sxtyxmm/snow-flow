const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');

async function updateExistingWidget() {
  const client = new ServiceNowClient();
  
  try {
    // First, get existing widgets to find one we can update
    const result = await client.getWidgets();
    
    if (result.success && result.data && result.data.length > 0) {
      console.log('Found existing widgets:', result.data.length);
      
      // Find the first widget we can update
      const widget = result.data[0];
      console.log('Updating widget:', widget.name, 'ID:', widget.sys_id);
      
      // Update the widget with our server script
      const updateResult = await client.updateWidget(widget.sys_id, {
        server_script: `(function() {
          // 🚀 Updated server script to test OAuth permissions
          
          if (input && input.action === 'test') {
            data.result = {
              success: true,
              message: 'Server script updated and working with OAuth scope!',
              oauth_scope: 'useraccount',
              user: gs.getUser().getFullName(),
              timestamp: new Date().toISOString(),
              widget_id: '${widget.sys_id}',
              test_passed: true
            };
          } else {
            data.result = {
              success: true,
              message: 'Widget server script updated successfully!',
              user: gs.getUser().getFullName(),
              timestamp: new Date().toISOString(),
              widget_id: '${widget.sys_id}'
            };
          }
        })();`
      });
      
      if (updateResult.success) {
        console.log('✅ Widget updated successfully!');
        console.log('Widget URL: https://dev198027.service-now.com/sp_config?id=widget_editor&sys_id=' + widget.sys_id);
        
        // Check if server script was preserved
        if (updateResult.data.server_script && updateResult.data.server_script.length > 0) {
          console.log('✅ Server script preserved:', updateResult.data.server_script.length, 'characters');
        } else {
          console.log('❌ Server script is empty!');
        }
      } else {
        console.error('❌ Widget update failed:', updateResult.error);
      }
    } else {
      console.log('❌ No existing widgets found to update');
    }
  } catch (error) {
    console.error('❌ Error updating widget:', error.message);
  }
}

updateExistingWidget();
// Get detailed information about the "Prevent invalid language code" business rule
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');
const { ServiceNowOAuth } = require('./dist/utils/snow-oauth.js');

async function getBusinessRuleDetails() {
  console.log('📋 Getting details for "Prevent invalid language code" business rule...\n');
  
  const client = new ServiceNowClient();
  const oauth = new ServiceNowOAuth();
  
  const isAuth = await oauth.isAuthenticated();
  if (!isAuth) {
    console.log('❌ Not authenticated');
    return;
  }
  
  try {
    // Get the specific business rule by sys_id
    const query = `sys_id=7637c1f2b7112210a5e5911cde11a972`;
    const results = await client.searchRecords('sys_script', query);
    
    if (results && results.length > 0) {
      const rule = results[0];
      
      // Try to get the full record with script content
      const oauth = new ServiceNowOAuth();
      const tokens = await oauth.getTokens();
      const config = await oauth.getConfig();
      
      const response = await fetch(
        `https://${config.instance}/api/now/table/sys_script/7637c1f2b7112210a5e5911cde11a972`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      if (data.result) {
        const fullRule = data.result;
        console.log('✅ Business Rule Details:\n');
        console.log(`Name: ${fullRule.name}`);
        console.log(`Table: ${fullRule.collection || 'N/A'}`);
        console.log(`Active: ${fullRule.active}`);
        console.log(`Order: ${fullRule.order || 'N/A'}`);
        console.log(`When: ${fullRule.when}`);
        console.log(`Condition: ${fullRule.condition || 'No condition'}`);
        console.log(`Description: ${fullRule.short_description || 'No description'}`);
        console.log(`\nScript:\n${'='.repeat(50)}\n${fullRule.script}\n${'='.repeat(50)}`);
        
        if (fullRule.filter_condition) {
          console.log(`\nFilter Condition: ${fullRule.filter_condition}`);
        }
        
        console.log(`\nCreated: ${fullRule.sys_created_on}`);
        console.log(`Updated: ${fullRule.sys_updated_on}`);
        console.log(`Created by: ${fullRule.sys_created_by}`);
      }
    }
  } catch (error) {
    console.error('❌ Error getting business rule:', error.message);
  }
}

getBusinessRuleDetails();
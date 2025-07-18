// Comprehensive search for "Prevent invalid language code" business rule
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');
const { ServiceNowOAuth } = require('./dist/utils/snow-oauth.js');

async function searchLanguageRule() {
  console.log('🔍 Searching for "Prevent invalid language code" business rule...\n');
  
  const client = new ServiceNowClient();
  const oauth = new ServiceNowOAuth();
  
  // Check authentication
  const isAuth = await oauth.isAuthenticated();
  if (!isAuth) {
    console.log('❌ Not authenticated. Run: snow-flow auth login');
    return;
  }
  
  // Tables to search
  const tables = [
    { name: 'sys_script', desc: 'Business Rules' },
    { name: 'sys_script_include', desc: 'Script Includes' },
    { name: 'sys_ui_script', desc: 'UI Scripts' },
    { name: 'sys_script_client', desc: 'Client Scripts' },
    { name: 'sysevent_script_action', desc: 'Event Script Actions' }
  ];
  
  // Search terms
  const searchTerms = [
    'Prevent invalid language code',
    'prevent*invalid*language',
    'invalid*language*code',
    'language*validation',
    'language*code*validation'
  ];
  
  let foundResults = false;
  
  for (const table of tables) {
    console.log(`\n📋 Searching ${table.desc} (${table.name})...`);
    
    for (const term of searchTerms) {
      try {
        const query = `nameLIKE${term}^ORshort_descriptionLIKE${term}`;
        const results = await client.searchRecords(table.name, query);
        
        if (results && results.length > 0) {
          console.log(`\n  ✅ Found ${results.length} result(s) for "${term}":`);
          results.forEach((record, index) => {
            console.log(`\n  ${index + 1}. ${record.name || record.sys_id}`);
            console.log(`     - Table: ${table.name}`);
            console.log(`     - Sys ID: ${record.sys_id}`);
            if (record.collection) console.log(`     - Collection: ${record.collection}`);
            if (record.when) console.log(`     - When: ${record.when}`);
            if (record.active !== undefined) console.log(`     - Active: ${record.active}`);
            if (record.short_description) console.log(`     - Description: ${record.short_description}`);
          });
          foundResults = true;
        }
      } catch (error) {
        // Skip errors for non-existent tables
      }
    }
  }
  
  if (!foundResults) {
    console.log('\n❌ No results found. The business rule might:');
    console.log('   - Have a different name');
    console.log('   - Be in a scoped application');
    console.log('   - Be inactive or deleted');
    console.log('   - Be in a different table');
    
    // Try a broader search
    console.log('\n🔍 Trying broader search for any language-related business rules...');
    try {
      const broadQuery = 'nameLIKE*language*^ORscriptLIKE*language*^LIMIT10';
      const results = await client.searchRecords('sys_script', broadQuery);
      
      if (results && results.length > 0) {
        console.log(`\n✅ Found ${results.length} language-related business rule(s):`);
        results.forEach((record, index) => {
          console.log(`\n${index + 1}. ${record.name}`);
          console.log(`   - Table: ${record.collection}`);
          console.log(`   - Sys ID: ${record.sys_id}`);
          console.log(`   - Active: ${record.active}`);
        });
      }
    } catch (error) {
      console.log('❌ Broad search failed:', error.message);
    }
  }
}

searchLanguageRule();
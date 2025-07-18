// Debug MCP search issues
const { ServiceNowClient } = require('./dist/utils/servicenow-client.js');
const { ServiceNowOAuth } = require('./dist/utils/snow-oauth.js');

async function debugMCPSearch() {
  console.log('🔍 Debugging MCP server search process...');
  
  // Step 1: Create instances like MCP server does
  const client = new ServiceNowClient();
  const oauth = new ServiceNowOAuth();
  
  try {
    // Step 2: Check authentication like MCP does
    console.log('\nStep 1: Checking authentication...');
    const isAuth = await oauth.isAuthenticated();
    console.log('✅ Is authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('❌ Not authenticated, stopping here');
      return;
    }
    
    // Step 3: Test different search approaches
    console.log('\nStep 2: Testing search queries...');
    
    // Test A: Simple query
    console.log('\n🧪 Test A: Simple active query');
    try {
      const queryA = 'active=true^LIMIT3';
      console.log('Query:', queryA);
      const resultA = await client.searchRecords('sys_script', queryA);
      console.log('Results:', resultA?.length || 0);
      if (resultA?.length > 0) {
        console.log('Sample:', resultA[0].name || resultA[0].sys_id);
      }
    } catch (errorA) {
      console.log('❌ Test A failed:', errorA.message);
    }
    
    // Test B: Search for "Prevent invalid language code" business rule
    console.log('\n🧪 Test B: Search for "Prevent invalid language code" business rule');
    
    // Try multiple search strategies
    const searchQueries = [
      { query: 'nameLIKEPrevent*invalid*language*code', desc: 'Exact name match' },
      { query: 'nameLIKE*language*code*', desc: 'Language code in name' },
      { query: 'nameLIKE*prevent*language*', desc: 'Prevent language in name' },
      { query: 'nameLIKE*invalid*language*', desc: 'Invalid language in name' },
      { query: '(nameLIKE*language*^ORnameLIKE*code*)', desc: 'Language OR code in name' }
    ];
    
    for (const search of searchQueries) {
      try {
        console.log(`\n  🔍 ${search.desc}`);
        console.log(`  Query: ${search.query}`);
        const results = await client.searchRecords('sys_script', search.query);
        console.log(`  Found: ${results?.length || 0} results`);
        
        if (results?.length > 0) {
          // Filter for relevant results
          const relevant = results.filter(r => 
            r.name?.toLowerCase().includes('language') || 
            r.name?.toLowerCase().includes('prevent') ||
            r.short_description?.toLowerCase().includes('language')
          );
          
          if (relevant.length > 0) {
            console.log(`  Relevant results:`);
            relevant.forEach((rule, index) => {
              console.log(`    ${index + 1}. ${rule.name} (${rule.collection}) - ${rule.sys_id}`);
            });
          } else if (results.length > 0) {
            console.log(`  All results (first 5):`);
            results.slice(0, 5).forEach((rule, index) => {
              console.log(`    ${index + 1}. ${rule.name} (${rule.collection})`);
            });
          }
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
    
    // Test C: Widget search
    console.log('\n🧪 Test C: Widget search');
    try {
      const queryC = 'active=true^LIMIT3';
      console.log('Query:', queryC);
      const resultC = await client.searchRecords('sp_widget', queryC);
      console.log('Results:', resultC?.length || 0);
      if (resultC?.length > 0) {
        console.log('Sample:', resultC[0].name || resultC[0].title || resultC[0].sys_id);
      }
    } catch (errorC) {
      console.log('❌ Test C failed:', errorC.message);
    }
    
    // Test D: Test connection method
    console.log('\n🧪 Test D: Test connection (for comparison)');
    try {
      const connectionTest = await client.testConnection();
      console.log('Connection test:', connectionTest.success ? '✅ Success' : '❌ Failed');
    } catch (errorD) {
      console.log('❌ Test D failed:', errorD.message);
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugMCPSearch();
#!/usr/bin/env node

/**
 * Create .env file for Snow-Flow
 * This helps users set up their ServiceNow credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createEnvFile() {
  console.log('🔧 Snow-Flow Environment Setup\n');
  console.log('This will create a .env file with your ServiceNow credentials.\n');
  
  // Get ServiceNow instance
  const instance = await question('ServiceNow instance (e.g., dev12345.service-now.com): ');
  
  // Get OAuth credentials
  const clientId = await question('OAuth Client ID: ');
  const clientSecret = await question('OAuth Client Secret: ');
  
  // Optional Neo4j settings
  console.log('\n📊 Neo4j Configuration (optional - press Enter to skip)');
  const neo4jUri = await question('Neo4j URI (default: bolt://localhost:7687): ') || 'bolt://localhost:7687';
  const neo4jUser = await question('Neo4j username (default: neo4j): ') || 'neo4j';
  const neo4jPassword = await question('Neo4j password (default: password): ') || 'password';
  
  // Create .env content
  const envContent = `# ServiceNow OAuth Configuration
SNOW_INSTANCE=${instance}
SNOW_CLIENT_ID=${clientId}
SNOW_CLIENT_SECRET=${clientSecret}

# OAuth URLs (these are automatically generated)
OAUTH_TOKEN_URL=https://${instance}/oauth_token.do
OAUTH_REDIRECT_URI=http://localhost:3000/callback

# Neo4j Configuration (optional - for Graph Memory MCP)
NEO4J_URI=${neo4jUri}
NEO4J_USER=${neo4jUser}
NEO4J_PASSWORD=${neo4jPassword}

# Environment
NODE_ENV=production
`;

  // Determine where to save .env
  const isGlobalInstall = __dirname.includes('node_modules/snow-flow') || 
                         __dirname.includes('.nvm/versions/node');
  
  const envPath = isGlobalInstall 
    ? path.join(__dirname, '..', '.env')
    : path.join(process.cwd(), '.env');
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log(`\n✅ Created .env file at: ${envPath}`);
  console.log('🎉 Your ServiceNow credentials are now configured!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: snow-flow init');
  console.log('   2. Run: snow-flow auth login');
  console.log('   3. Use /mcp in Claude Code to access ServiceNow tools');
  
  rl.close();
}

// Run if called directly
if (require.main === module) {
  createEnvFile().catch(error => {
    console.error('❌ Error creating .env file:', error.message);
    process.exit(1);
  });
}

module.exports = { createEnvFile };
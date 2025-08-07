#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ .env file not found!');
  process.exit(1);
}

// Read template
const templatePath = path.join(__dirname, '..', '.mcp.json.template');
const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

// Process template - replace variables
const config = JSON.parse(JSON.stringify(template)
  .replace(/{{PROJECT_ROOT}}/g, path.resolve(__dirname, '..'))
  .replace(/{{SNOW_INSTANCE}}/g, process.env.SNOW_INSTANCE || '')
  .replace(/{{SNOW_CLIENT_ID}}/g, process.env.SNOW_CLIENT_ID || '')
  .replace(/{{SNOW_CLIENT_SECRET}}/g, process.env.SNOW_CLIENT_SECRET || '')
  .replace(/{{SNOW_DEPLOYMENT_TIMEOUT}}/g, process.env.SNOW_DEPLOYMENT_TIMEOUT || '300000')
  .replace(/{{MCP_DEPLOYMENT_TIMEOUT}}/g, process.env.MCP_DEPLOYMENT_TIMEOUT || '360000')
  .replace(/{{SNOW_FLOW_ENV}}/g, process.env.SNOW_FLOW_ENV || 'production')
);

// Write config
const outputPath = path.join(__dirname, '..', '.mcp.json');
fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));

console.log('✅ Generated .mcp.json with all ServiceNow MCP servers');
console.log(`📁 Location: ${outputPath}`);
console.log(`🔧 Servers configured: ${Object.keys(config.servers).length}`);
console.log('\nServers:');
Object.keys(config.servers).forEach(server => {
  console.log(`  ✓ ${server}`);
});

console.log('\n💡 Next steps:');
console.log('1. Restart Claude Code to load the new configuration');
console.log('2. Run /doctor again to verify everything is working');
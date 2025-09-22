#!/usr/bin/env node

/**
 * Snow-Flow Windsurf Integration Validator
 * Validates that all Windsurf configuration files are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🏄‍♂️ Snow-Flow Windsurf Integration Validator\n');

const configDir = path.join(__dirname, '.windsurf');
const requiredFiles = [
    'settings.json',
    'workspace.json', 
    'mcp-config.json',
    'README.md'
];

const mainFiles = [
    'WINDSURF.md',
    'README.md'
];

let allValid = true;

// Check .windsurf directory exists
if (!fs.existsSync(configDir)) {
    console.log('❌ .windsurf directory not found');
    allValid = false;
} else {
    console.log('✅ .windsurf directory exists');
}

// Check required Windsurf config files
requiredFiles.forEach(file => {
    const filePath = path.join(configDir, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} exists (${stats.size} bytes)`);
        
        // Validate JSON files
        if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                JSON.parse(content);
                console.log(`   └── Valid JSON format`);
            } catch (error) {
                console.log(`   └── ❌ Invalid JSON: ${error.message}`);
                allValid = false;
            }
        }
    } else {
        console.log(`❌ ${file} not found`);
        allValid = false;
    }
});

console.log('\n📄 Main documentation files:');

// Check main documentation files
mainFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} exists (${stats.size} bytes)`);
    } else {
        console.log(`❌ ${file} not found`);
        allValid = false;
    }
});

console.log('\n🔧 Configuration Summary:');

try {
    const settings = JSON.parse(fs.readFileSync(path.join(configDir, 'settings.json'), 'utf8'));
    console.log(`✅ MCP Servers configured: ${Object.keys(settings.mcpServers || {}).length}`);
    console.log(`✅ Environment variables: ${settings.environment?.required?.length || 0} required`);
    
    const workspace = JSON.parse(fs.readFileSync(path.join(configDir, 'workspace.json'), 'utf8'));
    console.log(`✅ Workspace folders: ${workspace.workspaceLayout?.folders?.length || 0}`);
    
    const mcpConfig = JSON.parse(fs.readFileSync(path.join(configDir, 'mcp-config.json'), 'utf8'));
    console.log(`✅ MCP config servers: ${Object.keys(mcpConfig.servers || {}).length}`);
} catch (error) {
    console.log(`❌ Error reading configuration: ${error.message}`);
    allValid = false;
}

console.log('\n🏄‍♂️ Integration Status:');
if (allValid) {
    console.log('✅ Snow-Flow Windsurf integration is COMPLETE!');
    console.log('\n🚀 Ready to use:');
    console.log('1. Open this project in Windsurf IDE');
    console.log('2. Configure environment variables (.env file)');
    console.log('3. Run: npx snow-flow auth login');
    console.log('4. Run: npm run build');
    console.log('5. Start conversational ServiceNow development!');
    console.log('\n📖 See WINDSURF.md for complete setup guide');
} else {
    console.log('❌ Windsurf integration has issues - please check the errors above');
    process.exit(1);
}
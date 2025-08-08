#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, '..', 'src', 'mcp', 'servicenow-deployment-mcp.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove flow/workflow/subflow from enum arrays
content = content.replace(/['"]widget['"],\s*['"]workflow['"],\s*['"]application['"]/g, '"widget", "application"');

// Remove flow/workflow table mappings
content = content.replace(/\s*['"]flow['"]\s*:\s*['"]sys_hub_flow['"]\s*,?/g, '');
content = content.replace(/\s*['"]workflow['"]\s*:\s*['"]wf_workflow['"]\s*,?/g, '');

// Remove flow-related case statements in switches
content = content.replace(/\s*case\s+['"]workflow['"]\s*:\s*[^}]*?break\s*;/gs, '');
content = content.replace(/\s*case\s+['"]flow['"]\s*:\s*[^}]*?break\s*;/gs, '');
content = content.replace(/\s*case\s+['"]subflow['"]\s*:\s*[^}]*?break\s*;/gs, '');

// Remove references to flow deployment
content = content.replace(/await\s+this\.deployFlow\([^)]*\)\s*;?/g, '// Flow deployment removed');
content = content.replace(/result\s*=\s*await\s+this\.deployFlow\([^)]*\)\s*;?/g, '// Flow deployment removed');

// Remove references to flow validation
content = content.replace(/await\s+this\.validateFlowDefinition\([^)]*\)\s*;?/g, '// Flow validation removed');
content = content.replace(/const\s+\w+\s*=\s*await\s+this\.validateFlowDefinition\([^)]*\)\s*;?/g, '// Flow validation removed');

// Clean up workflow references in descriptions
content = content.replace(/widgets,\s*workflows,\s*applications/g, 'widgets, applications');
content = content.replace(/widget,\s*workflow,\s*application/g, 'widget, application');

// Remove flow-specific error messages and documentation
content = content.replace(/Unknown flow type:[^'"`]*['"`]/g, 'Unknown artifact type"');
content = content.replace(/Supported types:\s*flow,\s*subflow,\s*action/g, 'Supported types: widget, application');

console.log('Flow-related code cleanup complete!');
console.log('Note: Manual review and method removal still required for:');
console.log('- deployFlow method (lines ~1810-2227)');
console.log('- validateFlowDefinition method (lines ~5687+)');
console.log('- createBusinessRuleFallback method (lines ~6496+)');

// Write the cleaned content back
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nFile updated successfully!');
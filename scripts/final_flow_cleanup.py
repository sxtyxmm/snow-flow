#!/usr/bin/env python3

import re

# Read the file
with open('/Users/nielsvanderwerf/Projects/snow-flow-dev/snow-flow/src/mcp/servicenow-deployment-mcp.ts', 'r') as f:
    content = f.read()

# Remove generateFlowLogicXML method
pattern = r'private generateFlowLogicXML\([^{]*\{[^}]*\}[^}]*\}[^}]*\}'
content = re.sub(pattern, '// generateFlowLogicXML method removed - flows deprecated', content, flags=re.DOTALL)

# Remove any sys_hub_flow related XML generation
# Find and remove the section that generates flow XML
pattern = r'// Flow XML[^}]*sys_hub_flow[^}]*?</update_set_member>'
content = re.sub(pattern, '// Flow XML generation removed - flows deprecated', content, flags=re.DOTALL)

# Remove calls to generateFlowLogicXML
content = re.sub(r'const logicXml = this\.generateFlowLogicXML\([^)]*\);', '// Flow logic XML removed', content)
content = re.sub(r'xmlParts\.push\(logicXml\);', '// Flow logic push removed', content)

# Remove flow cases in switch statements
content = re.sub(r"case 'flow':[^}]*?break;", "// Flow case removed", content, flags=re.DOTALL)
content = re.sub(r"case 'subflow':[^}]*?break;", "// Subflow case removed", content, flags=re.DOTALL)

# Clean up any empty workflow case blocks
content = re.sub(r"} else if \(args\.type === 'workflow'\) \{[^}]*\}", "// Workflow validation removed", content, flags=re.DOTALL)

# Write back
with open('/Users/nielsvanderwerf/Projects/snow-flow-dev/snow-flow/src/mcp/servicenow-deployment-mcp.ts', 'w') as f:
    f.write(content)

print("Final flow cleanup complete!")
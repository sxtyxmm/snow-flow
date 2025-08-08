#!/usr/bin/env python3

import re

# Read the file
with open('/Users/nielsvanderwerf/Projects/snow-flow-dev/snow-flow/src/mcp/servicenow-deployment-mcp.ts', 'r') as f:
    content = f.read()

# List of methods to remove completely
methods_to_remove = [
    'deployFlow',
    'validateFlowDefinition', 
    'createBusinessRuleFallback',
    'deployLinkedArtifact',
    'getTriggerWhen'
]

# Function to find and remove entire methods
def remove_method(content, method_name):
    # Pattern to match the entire method from declaration to closing brace
    # This handles methods with async/private modifiers
    pattern = rf'^\s*(?:private\s+)?(?:async\s+)?{method_name}\s*\([^{{]*\{{'
    
    # Find the start of the method
    match = re.search(pattern, content, re.MULTILINE)
    if not match:
        print(f"Method {method_name} not found")
        return content
    
    start_pos = match.start()
    
    # Count braces to find the end of the method
    brace_count = 0
    in_string = False
    escape_next = False
    i = match.end() - 1  # Start from the opening brace
    
    while i < len(content):
        char = content[i]
        
        if escape_next:
            escape_next = False
        elif char == '\\':
            escape_next = True
        elif char in ['"', "'", '`'] and not in_string:
            in_string = char
        elif char == in_string:
            in_string = False
        elif not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    # Found the closing brace
                    end_pos = i + 1
                    
                    # Skip any trailing whitespace/newlines
                    while end_pos < len(content) and content[end_pos] in [' ', '\n', '\r', '\t']:
                        end_pos += 1
                    
                    # Remove the method
                    replacement = f"  // REMOVED: {method_name} method - flows/workflows are deprecated\n"
                    new_content = content[:start_pos] + replacement + content[end_pos:]
                    print(f"Removed method {method_name} (lines {content[:start_pos].count(chr(10))+1}-{content[:end_pos].count(chr(10))+1})")
                    return new_content
        
        i += 1
    
    print(f"Could not find end of method {method_name}")
    return content

# Remove each method
for method in methods_to_remove:
    content = remove_method(content, method)

# Remove flow/workflow from enums
content = re.sub(r"'widget',\s*'workflow',\s*'application'", "'widget', 'application'", content)
content = re.sub(r'"widget",\s*"workflow",\s*"application"', '"widget", "application"', content)

# Remove flow table mappings
content = re.sub(r"\s*'flow':\s*'sys_hub_flow',?\n?", "", content)
content = re.sub(r"\s*'workflow':\s*'wf_workflow',?\n?", "", content)

# Remove subflow references
content = re.sub(r"case\s+'subflow':[^}]*?break;", "", content, flags=re.DOTALL)
content = re.sub(r'flowType === .subflow.', 'false', content)

# Remove flow deployment calls
content = re.sub(r"result = await this\.deployFlow\([^)]*\);?", "// Flow deployment removed", content)
content = re.sub(r"await this\.deployFlow\([^)]*\);?", "// Flow deployment removed", content)

# Clean up descriptions
content = content.replace('widgets, workflows, applications', 'widgets, applications')
content = content.replace('(widgets, workflows, applications)', '(widgets, applications)')

# Write the cleaned content back
with open('/Users/nielsvanderwerf/Projects/snow-flow-dev/snow-flow/src/mcp/servicenow-deployment-mcp.ts', 'w') as f:
    f.write(content)

print("\nFlow-related code removal complete!")
print("File updated successfully!")
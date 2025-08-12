#!/bin/bash

# Fix console.log statements in MCP servers to use console.error instead
# This prevents stdout pollution which breaks JSON-RPC protocol

echo "🔧 Fixing console.log statements in MCP servers..."

# List of files to fix
files=(
  "src/mcp/service-discovery-client.ts"
  "src/mcp/servicenow-deployment-mcp.ts"
  "src/mcp/servicenow-mcp-server.ts"
  "src/mcp/servicenow-update-set-mcp.ts"
  "src/mcp/start-all-mcp-servers.ts"
  "src/mcp/start-servicenow-mcp.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  Fixing $file..."
    # Replace console.log with console.error
    sed -i.bak 's/console\.log(/console.error(/g' "$file"
    # Remove backup file
    rm -f "${file}.bak"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ Console.log statements fixed!"
echo ""
echo "Note: console.error is used for logging in MCP servers to keep stdout clean for JSON-RPC protocol."
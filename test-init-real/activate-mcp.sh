#!/bin/bash
# Snow-Flow MCP Activation Script
echo "🚀 Starting Claude Code with MCP servers..."
echo "📍 Working directory: /Users/nielsvanderwerf/Projects/servicenow_multiagent/test-init-real"
echo ""

# Change to project directory
cd "/Users/nielsvanderwerf/Projects/servicenow_multiagent/test-init-real"

# Start Claude Code with MCP config
claude --mcp-config .mcp.json .

echo ""
echo "✅ Claude Code started with MCP servers!"
echo "💡 Check MCP servers with: /mcp in Claude Code"

#!/bin/bash
# Setup MCP server for Snow-Flow

echo "🚀 Setting up Snow-Flow MCP server..."

# Check if claude command exists
if ! command -v claude &> /dev/null; then
    echo "❌ Error: Claude Code CLI not found"
    echo "Please install Claude Code first"
    exit 1
fi

# Add MCP server
echo "📦 Adding Snow-Flow MCP server..."
claude mcp add snow-flow npx snow-flow mcp start

echo "✅ MCP server setup complete!"
echo "🎯 You can now use mcp__snow-flow__ tools in Claude Code"

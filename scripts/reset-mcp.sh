#!/bin/bash

# Snow-Flow MCP Reset Script
# Quick reset of all MCP servers

echo "🔄 Resetting Snow-Flow MCP Servers..."

# Kill all MCP processes
echo "Stopping MCP processes..."
pkill -f "servicenow-.*-mcp" 2>/dev/null || true
pkill -f "snow-flow-mcp" 2>/dev/null || true

# Give processes time to stop
sleep 1

# Clear any lock files
echo "Clearing lock files..."
find ~/.snow-flow -name "*.lock" -delete 2>/dev/null || true
find ./dist -name "*.lock" -delete 2>/dev/null || true

# Clear MCP cache
echo "Clearing MCP cache..."
rm -rf ~/.snow-flow/mcp-cache 2>/dev/null || true

# Verify all stopped
if pgrep -f "servicenow-.*-mcp" > /dev/null; then
    echo "⚠️  Warning: Some MCP processes may still be running"
else
    echo "✅ All MCP processes stopped"
fi

# Optional restart
if [ "$1" == "--restart" ] || [ "$1" == "-r" ]; then
    echo "Restarting MCP servers..."
    node dist/mcp/start-all-mcp-servers.js &
    echo "✅ MCP servers restarting in background"
else
    echo ""
    echo "To restart servers, run: $0 --restart"
fi

echo "✅ Reset complete!"
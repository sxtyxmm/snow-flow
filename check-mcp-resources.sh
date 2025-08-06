#!/bin/bash

echo "🔍 Checking MCP Server Resources"
echo "================================="
echo ""

# Count MCP processes
echo "📊 MCP Process Count:"
MCP_COUNT=$(ps aux | grep -E "mcp|servicenow.*mcp" | grep -v grep | wc -l)
echo "   Active MCP processes: $MCP_COUNT"
echo ""

# Show MCP processes with memory usage
echo "💾 MCP Process Memory Usage:"
ps aux | grep -E "mcp|servicenow.*mcp" | grep -v grep | awk '{printf "   PID: %5s | Memory: %6s MB | CPU: %5s%% | Process: %s\n", $2, int($6/1024), $3, substr($0, index($0,$11))}'
echo ""

# Total memory used by MCP
echo "📈 Total Memory Statistics:"
TOTAL_MEM=$(ps aux | grep -E "mcp|servicenow.*mcp" | grep -v grep | awk '{sum += $6} END {print int(sum/1024)}')
echo "   Total MCP memory usage: ${TOTAL_MEM:-0} MB"

# System memory
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TOTAL_SYSTEM_MEM=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024)}')
    echo "   Total system memory: $TOTAL_SYSTEM_MEM MB"
else
    # Linux
    TOTAL_SYSTEM_MEM=$(free -m | awk '/^Mem:/{print $2}')
    echo "   Total system memory: $TOTAL_SYSTEM_MEM MB"
fi

echo ""
echo "⚠️  Warning Thresholds:"
if [ "$MCP_COUNT" -gt 10 ]; then
    echo "   ❌ Too many MCP processes ($MCP_COUNT > 10) - This will cause timeouts!"
    echo "   💡 Run: pkill -f mcp"
else
    echo "   ✅ MCP process count OK ($MCP_COUNT <= 10)"
fi

if [ "${TOTAL_MEM:-0}" -gt 1500 ]; then
    echo "   ❌ High memory usage (${TOTAL_MEM}MB > 1500MB) - This will cause timeouts!"
    echo "   💡 Run: npm run cleanup-mcp"
else
    echo "   ✅ Memory usage OK (${TOTAL_MEM:-0}MB <= 1500MB)"
fi

echo ""
echo "🔧 Node.js Processes:"
NODE_COUNT=$(ps aux | grep -E "node.*snow|node.*servicenow" | grep -v grep | wc -l)
echo "   Active Node processes: $NODE_COUNT"

# Check for zombie processes
echo ""
echo "👻 Zombie/Defunct Processes:"
ZOMBIE_COUNT=$(ps aux | grep defunct | grep -v grep | wc -l)
if [ "$ZOMBIE_COUNT" -gt 0 ]; then
    echo "   ⚠️ Found $ZOMBIE_COUNT zombie processes"
    ps aux | grep defunct | grep -v grep
else
    echo "   ✅ No zombie processes found"
fi

echo ""
echo "📋 Recommendations:"
echo ""

if [ "$MCP_COUNT" -gt 10 ] || [ "${TOTAL_MEM:-0}" -gt 1500 ]; then
    echo "   🚨 RESOURCE ISSUES DETECTED!"
    echo ""
    echo "   Quick fix:"
    echo "   1. pkill -f mcp"
    echo "   2. npm run cleanup-mcp"
    echo "   3. npm run mcp:start"
    echo ""
    echo "   Permanent fix:"
    echo "   1. Add to .env:"
    echo "      SNOW_MAX_MCP_SERVERS=5"
    echo "      SNOW_MCP_MEMORY_LIMIT=200"
    echo "   2. Restart snow-flow"
else
    echo "   ✅ Resources look healthy"
fi
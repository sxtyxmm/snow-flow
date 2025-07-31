#!/bin/bash
# MCP Server Wrapper for Claude Code compatibility
# This wrapper ensures proper execution of Node.js MCP servers

# Get the script to run from first argument
SCRIPT="$1"

# Shift arguments to pass remaining to the script
shift

# Execute with Node.js
exec node "$SCRIPT" "$@"
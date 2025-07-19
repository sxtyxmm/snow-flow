#!/bin/bash

# Create .env file for global Snow-Flow installation

SNOW_FLOW_PATH="/Users/nielsvanderwerf/.nvm/versions/node/v20.15.0/lib/node_modules/snow-flow"
ENV_FILE="$SNOW_FLOW_PATH/.env"

echo "Creating .env file for Snow-Flow..."

cat > "$ENV_FILE" << 'EOF'
# ServiceNow OAuth Configuration
SNOW_INSTANCE=dev198027.service-now.com
SNOW_CLIENT_ID=0664245521cf423ba1989e4c875b18de
SNOW_CLIENT_SECRET=Welkom123

# OAuth URLs (these are automatically generated)
OAUTH_TOKEN_URL=https://dev198027.service-now.com/oauth_token.do
OAUTH_REDIRECT_URI=http://localhost:3000/callback

# Neo4j Configuration (optional - for Graph Memory MCP)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Environment
NODE_ENV=production
EOF

echo "✅ Created .env file at: $ENV_FILE"
echo ""
echo "🔄 Now restart Claude Desktop to activate the MCP servers"
echo "💡 Use /mcp in Claude to see all 11 Snow-Flow servers"
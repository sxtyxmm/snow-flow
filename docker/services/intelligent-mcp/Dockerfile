# ServiceNow Intelligent MCP Server
FROM ../base/Dockerfile.base AS intelligent-mcp

LABEL service="intelligent-mcp" \
      version="1.0.0" \
      description="ServiceNow Intelligent MCP Server" \
      port="3003"

# Set service-specific environment
ENV SERVICE_NAME=intelligent-mcp \
    SERVER_PORT=3003 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/intelligent-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-intelligent-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/intelligent-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3003

# Start the service
CMD ["node", "entrypoint.js"]
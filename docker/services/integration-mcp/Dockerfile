# ServiceNow Integration MCP Server
FROM ../base/Dockerfile.base AS integration-mcp

LABEL service="integration-mcp" \
      version="1.0.0" \
      description="ServiceNow Integration MCP Server" \
      port="3008"

# Set service-specific environment
ENV SERVICE_NAME=integration-mcp \
    SERVER_PORT=3008 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/integration-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-integration-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/integration-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3008

# Start the service
CMD ["node", "entrypoint.js"]
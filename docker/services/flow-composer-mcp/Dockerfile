# ServiceNow Flow Composer MCP Server
FROM ../base/Dockerfile.base AS flow-composer-mcp

LABEL service="flow-composer-mcp" \
      version="1.0.0" \
      description="ServiceNow Flow Composer MCP Server" \
      port="3002"

# Set service-specific environment
ENV SERVICE_NAME=flow-composer-mcp \
    SERVER_PORT=3002 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/flow-composer-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-flow-composer-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/flow-composer-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3002

# Start the service
CMD ["node", "entrypoint.js"]
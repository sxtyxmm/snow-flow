# ServiceNow Platform Development MCP Server
FROM ../base/Dockerfile.base AS platform-development-mcp

LABEL service="platform-development-mcp" \
      version="1.0.0" \
      description="ServiceNow Platform Development MCP Server" \
      port="3007"

# Set service-specific environment
ENV SERVICE_NAME=platform-development-mcp \
    SERVER_PORT=3007 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/platform-development-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-platform-development-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/platform-development-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3007

# Start the service
CMD ["node", "entrypoint.js"]
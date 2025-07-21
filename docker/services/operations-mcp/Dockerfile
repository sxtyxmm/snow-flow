# ServiceNow Operations MCP Server
FROM ../base/Dockerfile.base AS operations-mcp

LABEL service="operations-mcp" \
      version="1.0.0" \
      description="ServiceNow Operations MCP Server" \
      port="3006"

# Set service-specific environment
ENV SERVICE_NAME=operations-mcp \
    SERVER_PORT=3006 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/operations-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-operations-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/operations-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3006

# Start the service
CMD ["node", "entrypoint.js"]
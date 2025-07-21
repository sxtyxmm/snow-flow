# ServiceNow Graph Memory MCP Server
FROM ../base/Dockerfile.base AS graph-memory-mcp

LABEL service="graph-memory-mcp" \
      version="1.0.0" \
      description="ServiceNow Graph Memory MCP Server" \
      port="3005"

# Set service-specific environment
ENV SERVICE_NAME=graph-memory-mcp \
    SERVER_PORT=3005 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/graph-memory-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-graph-memory-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/graph-memory-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3005

# Start the service
CMD ["node", "entrypoint.js"]
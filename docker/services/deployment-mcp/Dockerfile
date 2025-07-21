# ServiceNow Deployment MCP Server
FROM ../base/Dockerfile.base AS deployment-mcp

LABEL service="servicenow-deployment-mcp" \
      version="1.0.0" \
      description="ServiceNow Deployment MCP Server" \
      port="3001"

# Set service-specific environment
ENV SERVICE_NAME=deployment-mcp \
    SERVER_PORT=3001 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/deployment-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-deployment-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/deployment-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3001

# Start the service
CMD ["node", "entrypoint.js"]
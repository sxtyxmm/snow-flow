# ServiceNow Update Set MCP Server
FROM ../base/Dockerfile.base AS update-set-mcp

LABEL service="update-set-mcp" \
      version="1.0.0" \
      description="ServiceNow Update Set MCP Server" \
      port="3004"

# Set service-specific environment
ENV SERVICE_NAME=update-set-mcp \
    SERVER_PORT=3004 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/update-set-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-update-set-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/update-set-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3004

# Start the service
CMD ["node", "entrypoint.js"]
# ServiceNow Reporting & Analytics MCP Server
FROM ../base/Dockerfile.base AS reporting-analytics-mcp

LABEL service="reporting-analytics-mcp" \
      version="1.0.0" \
      description="ServiceNow Reporting & Analytics MCP Server" \
      port="3011"

# Set service-specific environment
ENV SERVICE_NAME=reporting-analytics-mcp \
    SERVER_PORT=3011 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/reporting-analytics-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-reporting-analytics-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/reporting-analytics-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3011

# Start the service
CMD ["node", "entrypoint.js"]
# ServiceNow Security & Compliance MCP Server
FROM ../base/Dockerfile.base AS security-compliance-mcp

LABEL service="security-compliance-mcp" \
      version="1.0.0" \
      description="ServiceNow Security & Compliance MCP Server" \
      port="3010"

# Set service-specific environment
ENV SERVICE_NAME=security-compliance-mcp \
    SERVER_PORT=3010 \
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/security-compliance-mcp/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/servicenow-security-compliance-mcp.ts ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/security-compliance-mcp/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE 3010

# Start the service
CMD ["node", "entrypoint.js"]
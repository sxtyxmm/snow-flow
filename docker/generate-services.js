#!/usr/bin/env node
/**
 * Generate Docker configurations for all MCP servers
 */

const fs = require('fs').promises;
const path = require('path');

const SERVICES = [
  {
    name: 'flow-composer-mcp',
    displayName: 'ServiceNow Flow Composer MCP Server',
    port: 3002,
    sourceFile: 'servicenow-flow-composer-mcp.ts',
    className: 'ServiceNowFlowComposerMCP'
  },
  {
    name: 'intelligent-mcp',
    displayName: 'ServiceNow Intelligent MCP Server',
    port: 3003,
    sourceFile: 'servicenow-intelligent-mcp.ts',
    className: 'ServiceNowIntelligentMCP'
  },
  {
    name: 'update-set-mcp',
    displayName: 'ServiceNow Update Set MCP Server',
    port: 3004,
    sourceFile: 'servicenow-update-set-mcp.ts',
    className: 'ServiceNowUpdateSetMCP'
  },
  {
    name: 'graph-memory-mcp',
    displayName: 'ServiceNow Graph Memory MCP Server',
    port: 3005,
    sourceFile: 'servicenow-graph-memory-mcp.ts',
    className: 'ServiceNowGraphMemoryMCP'
  },
  {
    name: 'operations-mcp',
    displayName: 'ServiceNow Operations MCP Server',
    port: 3006,
    sourceFile: 'servicenow-operations-mcp.ts',
    className: 'ServiceNowOperationsMCP'
  },
  {
    name: 'platform-development-mcp',
    displayName: 'ServiceNow Platform Development MCP Server',
    port: 3007,
    sourceFile: 'servicenow-platform-development-mcp.ts',
    className: 'ServiceNowPlatformDevelopmentMCP'
  },
  {
    name: 'integration-mcp',
    displayName: 'ServiceNow Integration MCP Server',
    port: 3008,
    sourceFile: 'servicenow-integration-mcp.ts',
    className: 'ServiceNowIntegrationMCP'
  },
  {
    name: 'automation-mcp',
    displayName: 'ServiceNow Automation MCP Server',
    port: 3009,
    sourceFile: 'servicenow-automation-mcp.ts',
    className: 'ServiceNowAutomationMCP'
  },
  {
    name: 'security-compliance-mcp',
    displayName: 'ServiceNow Security & Compliance MCP Server',
    port: 3010,
    sourceFile: 'servicenow-security-compliance-mcp.ts',
    className: 'ServiceNowSecurityComplianceMCP'
  },
  {
    name: 'reporting-analytics-mcp',
    displayName: 'ServiceNow Reporting & Analytics MCP Server',
    port: 3011,
    sourceFile: 'servicenow-reporting-analytics-mcp.ts',
    className: 'ServiceNowReportingAnalyticsMCP'
  }
];

function generateDockerfile(service) {
  return `# ${service.displayName}
FROM ../base/Dockerfile.base AS ${service.name}

LABEL service="${service.name}" \\
      version="1.0.0" \\
      description="${service.displayName}" \\
      port="${service.port}"

# Set service-specific environment
ENV SERVICE_NAME=${service.name} \\
    SERVER_PORT=${service.port} \\
    NODE_ENV=production

# Copy service-specific configuration
COPY docker/services/${service.name}/config/ ./config/

# Copy only the necessary service files
COPY src/mcp/${service.sourceFile} ./src/mcp/
COPY src/mcp/http-transport-wrapper.ts ./src/mcp/
COPY src/mcp/service-discovery-client.ts ./src/mcp/

# Copy service entry point
COPY docker/services/${service.name}/entrypoint.js ./

# Rebuild for this specific service
RUN npm run build

# Expose port
EXPOSE ${service.port}

# Start the service
CMD ["node", "entrypoint.js"]`;
}

function generateEntrypoint(service) {
  return `#!/usr/bin/env node
/**
 * ${service.displayName} Entry Point
 * Initializes the server with HTTP transport for containerization
 */

import { ${service.className} } from '../dist/mcp/${service.sourceFile.replace('.ts', '.js')}';
import { HttpTransportWrapper } from '../dist/mcp/http-transport-wrapper.js';
import { Logger } from '../dist/utils/logger.js';

const logger = new Logger('${service.className}Container');

async function start() {
  try {
    logger.info('Starting ${service.displayName}...');

    // Initialize the MCP server
    const serverInstance = new ${service.className}();

    // Wrap with HTTP transport
    const httpWrapper = new HttpTransportWrapper(serverInstance, {
      name: '${service.name}',
      version: '1.0.0',
      port: parseInt(process.env.SERVER_PORT || '${service.port}'),
      healthCheckPath: '/health',
      metricsPath: '/metrics'
    });

    // Start the HTTP server
    await httpWrapper.start();

    logger.info('${service.displayName} started successfully');
    
  } catch (error) {
    logger.error('Failed to start ${service.displayName}:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

start();`;
}

function generateServiceConfig(service) {
  return {
    service: {
      name: service.name,
      displayName: service.displayName,
      port: service.port,
      healthCheck: {
        path: '/health',
        interval: '30s',
        timeout: '10s',
        retries: 3
      },
      resources: {
        limits: {
          memory: '512Mi',
          cpu: '500m'
        },
        requests: {
          memory: '256Mi',
          cpu: '250m'
        }
      },
      scaling: {
        minReplicas: 1,
        maxReplicas: 3,
        targetCPU: 70
      }
    }
  };
}

async function generateAllServices() {
  console.log('Generating Docker configurations for all MCP services...');

  for (const service of SERVICES) {
    const servicePath = path.join(__dirname, 'services', service.name);
    
    try {
      // Create service directory
      await fs.mkdir(servicePath, { recursive: true });
      
      // Create config directory
      await fs.mkdir(path.join(servicePath, 'config'), { recursive: true });

      // Generate Dockerfile
      const dockerfileContent = generateDockerfile(service);
      await fs.writeFile(path.join(servicePath, 'Dockerfile'), dockerfileContent);

      // Generate entrypoint
      const entrypointContent = generateEntrypoint(service);
      await fs.writeFile(path.join(servicePath, 'entrypoint.js'), entrypointContent);

      // Generate service configuration
      const configContent = generateServiceConfig(service);
      await fs.writeFile(
        path.join(servicePath, 'config', 'service.json'),
        JSON.stringify(configContent, null, 2)
      );

      console.log(`✅ Generated configuration for ${service.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate ${service.name}:`, error);
    }
  }

  console.log('\\n🎉 All service configurations generated successfully!');
  console.log('\\nServices created:');
  SERVICES.forEach(service => {
    console.log(`  - ${service.name} (${service.displayName}) - Port: ${service.port}`);
  });
}

// Run the generator
generateAllServices().catch(console.error);
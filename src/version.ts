/**
 * Snow-Flow Version Management
 */

export const VERSION = '1.1.12';

export const VERSION_INFO = {
  version: VERSION,
  name: 'Snow-Flow',
  description: 'ServiceNow Multi-Agent Development Framework',
  features: {
    '1.1.12': [
      'Automatic MCP registration with Claude Code using claude mcp add command',
      'Fixed registration for Claude Code instead of Claude Desktop',
      'Added create-env.js script to help users set up credentials',
      'Improved error handling when claude command is not in PATH'
    ],
    '1.1.11': [
      'Fixed MCP server paths for global npm installations',
      'Updated setup-mcp.js to detect global vs local installs',
      'Enhanced register-mcp-servers.js to add .env variables',
      'MCP servers now properly work from global installations'
    ],
    '1.1.10': [
      'Added register-mcp-servers.js script to npm package',
      'Improved MCP registration fallback logic'
    ],
    '1.1.9': [
      'Fixed MCP server registration with Claude Desktop',
      'Added proper MCP server registration script',
      'Updated init command to correctly register all 11 MCP servers'
    ],
    '1.1.8': [
      'Fixed duplicate isGlobalInstall declaration in init command',
      'Improved global installation detection',
      'Enhanced MCP setup error handling'
    ],
    '1.1.3': [
      'Automatic MCP server registration with Claude Code',
      'Fixed MCP config format to use "servers" instead of "mcpServers"',
      'Dynamic configuration merging for existing MCP servers',
      'All 11 ServiceNow MCP servers included in init'
    ],
    '1.1.0': [
      'Enhanced Flow Composer MCP with natural language flow creation',
      'Intelligent template system with context-aware selection',
      'Expanded widget templates (dashboard, data table)',
      'Advanced flow templates (approval, integration)',
      'Composite templates for complete systems',
      'Natural language understanding for artifact generation',
      'Update Set management for all deployments',
      'Neo4j graph memory for intelligent artifact understanding'
    ]
  },
  changelog: {
    '1.1.12': {
      date: '2025-01-19',
      changes: [
        'Init command now uses claude mcp add-config for automatic registration',
        'Fixed config paths for Claude Code (~/.claude/mcp_config.json)',
        'Updated register-mcp-servers.js to use servers format for Claude Code',
        'Added create-env.js to help users configure ServiceNow credentials',
        'Better error messages when claude command is not available'
      ]
    },
    '1.1.11': {
      date: '2025-01-19',
      changes: [
        'Fixed MCP server paths for global npm installations',
        'setup-mcp.js now correctly detects global vs local installation',
        'register-mcp-servers.js adds environment variables from .env',
        'MCP servers now use direct node execution with full paths',
        'All 11 MCP servers work correctly from npm global install'
      ]
    },
    '1.1.10': {
      date: '2025-01-19',
      changes: [
        'Included register-mcp-servers.js script in npm package',
        'Improved fallback logic for MCP registration'
      ]
    },
    '1.1.9': {
      date: '2025-01-19',
      changes: [
        'Fixed MCP server registration with Claude Desktop',
        'Added register-mcp-servers.js script for proper registration',
        'Updated init command to use Claude Desktop config format',
        'All 11 MCP servers now properly registered and available'
      ]
    },
    '1.1.8': {
      date: '2025-01-19',
      changes: [
        'Fixed duplicate isGlobalInstall declaration causing SyntaxError',
        'Improved global vs local installation detection',
        'Enhanced error handling during MCP setup'
      ]
    },
    '1.1.3': {
      date: '2025-01-19',
      changes: [
        'Automatic MCP registration during init command',
        'Fixed MCP template to use correct "servers" format',
        'Improved MCP config merging with existing Claude configuration',
        'All 11 ServiceNow MCP servers properly registered'
      ]
    },
    '1.1.0': {
      date: '2025-01-17',
      changes: [
        'Added Flow Composer MCP for natural language flow creation',
        'Expanded template system with intelligent variations',
        'Enhanced template engine with NLP capabilities',
        'Added composite templates for complex systems',
        'Improved ServiceNow artifact discovery and orchestration'
      ]
    },
    '1.0.0': {
      date: '2025-01-15',
      changes: [
        'Initial release with multi-agent orchestration',
        'ServiceNow OAuth integration',
        'MCP server support',
        'Basic template system',
        'SPARC methodology implementation'
      ]
    }
  }
};

/**
 * Get version string with optional format
 */
export function getVersionString(format: 'short' | 'full' = 'short'): string {
  if (format === 'short') {
    return `v${VERSION}`;
  }
  return `${VERSION_INFO.name} v${VERSION} - ${VERSION_INFO.description}`;
}

/**
 * Get latest features for current version
 */
export function getLatestFeatures(): string[] {
  return VERSION_INFO.features[VERSION] || [];
}

/**
 * Check if running latest version (for future use)
 */
export function isLatestVersion(): boolean {
  // This could check against a remote version in the future
  return true;
}
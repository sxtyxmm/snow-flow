/**
 * Snow-Flow Version Management
 */

export const VERSION = '1.1.0';

export const VERSION_INFO = {
  version: VERSION,
  name: 'Snow-Flow',
  description: 'ServiceNow Multi-Agent Development Framework',
  features: {
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
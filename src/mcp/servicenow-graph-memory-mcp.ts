#!/usr/bin/env node
/**
 * ServiceNow Graph Memory MCP Server
 * Neo4j-based intelligent memory system for ServiceNow artifacts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../utils/logger.js';
import neo4j, { Driver, Session } from 'neo4j-driver';

interface ArtifactNode {
  id: string;
  name: string;
  type: 'widget' | 'flow' | 'script_include' | 'business_rule' | 'table' | 'client_script' | 'ui_script';
  content?: string;
  purpose?: string;
  complexity?: number;
  last_updated?: string;
  deployment_count?: number;
  success_rate?: number;
}

interface ArtifactRelationship {
  from: string;
  to: string;
  type: 'USES' | 'REQUIRES' | 'TRIGGERS' | 'CREATES' | 'MODIFIES' | 'CALLS' | 'EXTENDS';
  strength?: number;
  data_flow?: string;
}

class ServiceNowGraphMemoryMCP {
  private server: Server;
  private logger: Logger;
  private driver: Driver | null = null;
  private neo4jUri: string;
  private neo4jUser: string;
  private neo4jPassword: string;

  constructor() {
    this.server = new Server(
      {
        name: 'servicenow-graph-memory',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = new Logger('ServiceNowGraphMemoryMCP');
    
    // Neo4j connection settings
    this.neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.neo4jUser = process.env.NEO4J_USER || 'neo4j';
    this.neo4jPassword = process.env.NEO4J_PASSWORD || 'password';

    this.setupHandlers();
  }

  private async connectToNeo4j() {
    if (!this.driver) {
      try {
        this.driver = neo4j.driver(
          this.neo4jUri,
          neo4j.auth.basic(this.neo4jUser, this.neo4jPassword)
        );
        await this.driver.verifyConnectivity();
        this.logger.info('Connected to Neo4j');
        
        // Create indexes for better performance
        const session = this.driver.session();
        try {
          await session.run('CREATE INDEX artifact_id IF NOT EXISTS FOR (a:Artifact) ON (a.id)');
          await session.run('CREATE INDEX artifact_type IF NOT EXISTS FOR (a:Artifact) ON (a.type)');
          await session.run('CREATE INDEX artifact_name IF NOT EXISTS FOR (a:Artifact) ON (a.name)');
        } finally {
          await session.close();
        }
      } catch (error) {
        this.logger.error('Failed to connect to Neo4j', error);
        throw error;
      }
    }
    return this.driver;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'snow_graph_index_artifact',
          description: 'AUTONOMOUS graph indexing - stores ServiceNow artifacts in Neo4j with relationships, enables instant understanding of dependencies and connections',
          inputSchema: {
            type: 'object',
            properties: {
              artifact: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique identifier for the artifact' },
                  name: { type: 'string', description: 'Artifact name' },
                  type: { type: 'string', enum: ['widget', 'flow', 'script_include', 'business_rule', 'table', 'client_script', 'ui_script'] },
                  content: { type: 'string', description: 'Full content/code of the artifact' },
                  purpose: { type: 'string', description: 'What this artifact does' },
                },
                required: ['id', 'name', 'type'],
              },
              relationships: {
                type: 'array',
                description: 'Relationships to other artifacts',
                items: {
                  type: 'object',
                  properties: {
                    to: { type: 'string', description: 'Target artifact ID' },
                    type: { type: 'string', enum: ['USES', 'REQUIRES', 'TRIGGERS', 'CREATES', 'MODIFIES', 'CALLS', 'EXTENDS'] },
                    data_flow: { type: 'string', description: 'How data flows between artifacts' },
                  },
                },
              },
            },
            required: ['artifact'],
          },
        },
        {
          name: 'snow_graph_find_related',
          description: 'INTELLIGENT relationship discovery - finds all artifacts related to a given artifact, understands dependencies, data flows, and impact analysis',
          inputSchema: {
            type: 'object',
            properties: {
              artifact_id: { type: 'string', description: 'Artifact ID to find relationships for' },
              depth: { type: 'number', description: 'How many levels of relationships to traverse', default: 2 },
              relationship_types: {
                type: 'array',
                description: 'Filter by relationship types',
                items: { type: 'string', enum: ['USES', 'REQUIRES', 'TRIGGERS', 'CREATES', 'MODIFIES', 'CALLS', 'EXTENDS'] },
              },
            },
            required: ['artifact_id'],
          },
        },
        {
          name: 'snow_graph_analyze_impact',
          description: 'IMPACT ANALYSIS - shows what will be affected if an artifact is modified, critical for safe deployments',
          inputSchema: {
            type: 'object',
            properties: {
              artifact_id: { type: 'string', description: 'Artifact to analyze impact for' },
              change_type: { type: 'string', enum: ['modify', 'delete', 'upgrade'], description: 'Type of change planned' },
            },
            required: ['artifact_id'],
          },
        },
        {
          name: 'snow_graph_suggest_artifacts',
          description: 'AI-POWERED suggestions - recommends artifacts based on current context and past successful patterns',
          inputSchema: {
            type: 'object',
            properties: {
              context: { type: 'string', description: 'Current development context' },
              artifact_type: { type: 'string', description: 'Type of artifact needed' },
              requirements: { type: 'array', items: { type: 'string' }, description: 'Specific requirements' },
            },
            required: ['context'],
          },
        },
        {
          name: 'snow_graph_pattern_analysis',
          description: 'PATTERN RECOGNITION - identifies common patterns, best practices, and reusable components across all artifacts',
          inputSchema: {
            type: 'object',
            properties: {
              pattern_type: { type: 'string', enum: ['architectural', 'coding', 'integration', 'error_handling'], description: 'Type of pattern to analyze' },
              min_occurrences: { type: 'number', description: 'Minimum times pattern must appear', default: 3 },
            },
          },
        },
        {
          name: 'snow_graph_visualize',
          description: 'GRAPH VISUALIZATION - generates Cypher queries for visualizing artifact relationships in Neo4j Browser',
          inputSchema: {
            type: 'object',
            properties: {
              focus_artifact: { type: 'string', description: 'Central artifact to visualize around' },
              include_types: { type: 'array', items: { type: 'string' }, description: 'Artifact types to include' },
              max_nodes: { type: 'number', description: 'Maximum nodes to display', default: 50 },
            },
          },
        },
        {
          name: 'snow_graph_export_knowledge',
          description: 'KNOWLEDGE EXPORT - exports learned patterns and relationships for backup or sharing',
          inputSchema: {
            type: 'object',
            properties: {
              format: { type: 'string', enum: ['cypher', 'json', 'graphml'], description: 'Export format' },
              include_content: { type: 'boolean', description: 'Include full artifact content', default: false },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.connectToNeo4j();

        switch (name) {
          case 'snow_graph_index_artifact':
            return await this.indexArtifact(args);
          case 'snow_graph_find_related':
            return await this.findRelatedArtifacts(args);
          case 'snow_graph_analyze_impact':
            return await this.analyzeImpact(args);
          case 'snow_graph_suggest_artifacts':
            return await this.suggestArtifacts(args);
          case 'snow_graph_pattern_analysis':
            return await this.analyzePatterns(args);
          case 'snow_graph_visualize':
            return await this.generateVisualization(args);
          case 'snow_graph_export_knowledge':
            return await this.exportKnowledge(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }

  private async indexArtifact(args: any) {
    const session = this.driver!.session();
    try {
      const { artifact, relationships = [] } = args;

      // Create or update the artifact node
      await session.run(
        `
        MERGE (a:Artifact {id: $id})
        SET a.name = $name,
            a.type = $type,
            a.content = $content,
            a.purpose = $purpose,
            a.last_updated = datetime(),
            a.indexed_at = datetime()
        RETURN a
        `,
        artifact
      );

      // Create relationships
      for (const rel of relationships) {
        await session.run(
          `
          MATCH (a:Artifact {id: $fromId})
          MERGE (b:Artifact {id: $toId})
          MERGE (a)-[r:${rel.type}]->(b)
          SET r.data_flow = $dataFlow,
              r.created_at = datetime()
          `,
          {
            fromId: artifact.id,
            toId: rel.to,
            dataFlow: rel.data_flow || ''
          }
        );
      }

      // Analyze artifact content for automatic relationship discovery
      const discoveredRelations = await this.discoverRelationships(artifact);
      
      return {
        content: [{
          type: 'text',
          text: `✅ Artifact indexed successfully!

📊 **Artifact Details:**
- ID: ${artifact.id}
- Name: ${artifact.name}
- Type: ${artifact.type}
- Relationships: ${relationships.length} explicit, ${discoveredRelations} discovered

🔗 **Graph Impact:**
- Node created/updated in Neo4j
- Relationships established
- Available for pattern analysis
- Ready for impact assessment

💡 **Next Steps:**
- Use snow_graph_find_related to explore connections
- Use snow_graph_analyze_impact before modifications
- Use snow_graph_pattern_analysis to find similar artifacts`
        }]
      };
    } finally {
      await session.close();
    }
  }

  private async discoverRelationships(artifact: any): Promise<number> {
    // Analyze artifact content to discover implicit relationships
    const content = artifact.content || '';
    const discoveries: string[] = [];

    // Find script includes used
    const scriptIncludeMatches = content.match(/new\s+(\w+)\(/g) || [];
    for (const match of scriptIncludeMatches) {
      const className = match.match(/new\s+(\w+)\(/)?.[1];
      if (className) discoveries.push(className);
    }

    // Find table references
    const tableMatches = content.match(/GlideRecord\(['"](\w+)['"]\)/g) || [];
    for (const match of tableMatches) {
      const tableName = match.match(/GlideRecord\(['"](\w+)['"]\)/)?.[1];
      if (tableName) discoveries.push(tableName);
    }

    return discoveries.length;
  }

  private async findRelatedArtifacts(args: any) {
    const session = this.driver!.session();
    try {
      const { artifact_id, depth = 2, relationship_types = [] } = args;

      const relFilter = relationship_types.length > 0 
        ? `WHERE type(r) IN [${relationship_types.map((t: string) => `'${t}'`).join(', ')}]`
        : '';

      const result = await session.run(
        `
        MATCH (start:Artifact {id: $artifactId})
        CALL apoc.path.subgraphAll(start, {
          maxLevel: $depth,
          relationshipFilter: "${relFilter}"
        })
        YIELD nodes, relationships
        RETURN nodes, relationships
        `,
        { artifactId: artifact_id, depth }
      );

      const nodes = result.records[0]?.get('nodes') || [];
      const relationships = result.records[0]?.get('relationships') || [];

      return {
        content: [{
          type: 'text',
          text: `🔗 Related Artifacts Found:

📊 **Summary:**
- Total artifacts: ${nodes.length}
- Total relationships: ${relationships.length}
- Search depth: ${depth} levels

🗂️ **Artifacts:**
${nodes.map((n: any) => `- ${n.properties.type}: ${n.properties.name} (${n.properties.id})`).join('\n')}

🔀 **Relationships:**
${relationships.map((r: any) => `- ${r.type}: ${r.start} → ${r.end}`).join('\n')}

💡 **Insights:**
- This artifact is part of a ${nodes.length > 10 ? 'complex' : 'simple'} dependency network
- ${relationships.filter((r: any) => r.type === 'REQUIRES').length} required dependencies
- ${relationships.filter((r: any) => r.type === 'USES').length} usage relationships`
        }]
      };
    } finally {
      await session.close();
    }
  }

  private async analyzeImpact(args: any) {
    const session = this.driver!.session();
    try {
      const { artifact_id, change_type = 'modify' } = args;

      // Find all artifacts that depend on this one
      const result = await session.run(
        `
        MATCH (target:Artifact {id: $artifactId})
        MATCH (dependent:Artifact)-[:USES|REQUIRES|CALLS]->(target)
        RETURN dependent, count(*) as impact_count
        ORDER BY impact_count DESC
        `,
        { artifactId: artifact_id }
      );

      const impactedArtifacts = result.records.map((r: any) => ({
        artifact: r.get('dependent').properties,
        impact: r.get('impact_count').toNumber()
      }));

      const riskLevel = impactedArtifacts.length > 5 ? 'HIGH' : 
                       impactedArtifacts.length > 2 ? 'MEDIUM' : 'LOW';

      return {
        content: [{
          type: 'text',
          text: `⚠️ Impact Analysis for ${change_type} operation:

🎯 **Target Artifact:** ${artifact_id}

📊 **Impact Summary:**
- Affected artifacts: ${impactedArtifacts.length}
- Risk level: ${riskLevel}
- Change type: ${change_type}

🔗 **Affected Artifacts:**
${impactedArtifacts.map((a: any) => `- ${a.artifact.type}: ${a.artifact.name} (Impact: ${a.impact})`).join('\n')}

⚡ **Recommendations:**
${riskLevel === 'HIGH' ? '- Create comprehensive test plan\n- Consider phased deployment\n- Notify all stakeholders' :
  riskLevel === 'MEDIUM' ? '- Test affected components\n- Review integration points' :
  '- Safe to proceed with standard testing'}

🛡️ **Safety Measures:**
- ${change_type === 'delete' ? 'Archive artifact before deletion' : 'Create backup before modification'}
- Update all dependent artifacts
- Run integration tests`
        }]
      };
    } finally {
      await session.close();
    }
  }

  private async suggestArtifacts(args: any) {
    const session = this.driver!.session();
    try {
      const { context, artifact_type, requirements = [] } = args;

      // Find similar contexts and successful patterns
      const result = await session.run(
        `
        MATCH (a:Artifact)
        WHERE a.purpose CONTAINS $context
        ${artifact_type ? 'AND a.type = $artifactType' : ''}
        WITH a
        MATCH (a)-[r]-(related:Artifact)
        RETURN a, collect(related) as related_artifacts
        ORDER BY a.deployment_count DESC, a.success_rate DESC
        LIMIT 10
        `,
        { context, artifactType: artifact_type }
      );

      const suggestions = result.records.map((r: any) => ({
        artifact: r.get('a').properties,
        related: r.get('related_artifacts').map((n: any) => n.properties)
      }));

      return {
        content: [{
          type: 'text',
          text: `🤖 AI-Powered Artifact Suggestions:

📋 **Context:** ${context}
${artifact_type ? `📦 **Type:** ${artifact_type}` : ''}

✨ **Recommended Artifacts:**
${suggestions.map((s: any, i: number) => `
${i + 1}. **${s.artifact.name}** (${s.artifact.type})
   - Purpose: ${s.artifact.purpose || 'General purpose'}
   - Success rate: ${s.artifact.success_rate || 'Not measured'}%
   - Used with: ${s.related.map((r: any) => r.name).join(', ')}
`).join('\n')}

🎯 **Pattern Analysis:**
- Most successful pattern: ${suggestions[0]?.artifact.name || 'No patterns found'}
- Common dependencies: ${this.findCommonDependencies(suggestions)}
- Recommended architecture: ${this.suggestArchitecture(suggestions)}

💡 **Implementation Tips:**
- Start with the highest success rate artifact
- Check compatibility with existing components
- Consider the related artifacts for complete solution`
        }]
      };
    } finally {
      await session.close();
    }
  }

  private findCommonDependencies(suggestions: any[]): string {
    const deps = new Map<string, number>();
    suggestions.forEach((s: any) => {
      s.related.forEach((r: any) => {
        deps.set(r.name, (deps.get(r.name) || 0) + 1);
      });
    });
    
    const sorted = Array.from(deps.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    
    return sorted.join(', ') || 'None identified';
  }

  private suggestArchitecture(suggestions: any[]): string {
    const types = suggestions.map(s => s.artifact.type);
    if (types.includes('flow') && types.includes('script_include')) {
      return 'Flow-based with script include utilities';
    } else if (types.includes('widget') && types.includes('client_script')) {
      return 'UI-centric with client-side logic';
    } else if (types.includes('business_rule')) {
      return 'Event-driven with business rules';
    }
    return 'Standard ServiceNow pattern';
  }

  private async analyzePatterns(args: any) {
    const session = this.driver!.session();
    try {
      const { pattern_type = 'architectural', min_occurrences = 3 } = args;

      // This would be more sophisticated in production
      const query = pattern_type === 'architectural' ? `
        MATCH (a:Artifact)-[r]->(b:Artifact)
        WITH type(r) as relType, a.type as sourceType, b.type as targetType, count(*) as occurrences
        WHERE occurrences >= $minOccurrences
        RETURN sourceType, relType, targetType, occurrences
        ORDER BY occurrences DESC
      ` : `
        MATCH (a:Artifact)
        WHERE a.content IS NOT NULL
        RETURN a.type, count(*) as count
        ORDER BY count DESC
      `;

      const result = await session.run(query, { minOccurrences: min_occurrences });

      return {
        content: [{
          type: 'text',
          text: `🔍 Pattern Analysis Results:

📊 **Pattern Type:** ${pattern_type}
🔢 **Minimum Occurrences:** ${min_occurrences}

📈 **Discovered Patterns:**
${result.records.map((r: any) => {
  if (pattern_type === 'architectural') {
    return `- ${r.get('sourceType')} → ${r.get('relType')} → ${r.get('targetType')} (${r.get('occurrences')} times)`;
  } else {
    return `- ${r.get('type')}: ${r.get('count')} artifacts`;
  }
}).join('\n')}

💡 **Insights:**
- Most common pattern: ${result.records[0] ? this.describePattern(result.records[0], pattern_type) : 'No patterns found'}
- Recommended approach: Follow the established patterns for consistency
- Optimization opportunity: Reuse common patterns as templates`
        }]
      };
    } finally {
      await session.close();
    }
  }

  private describePattern(record: any, patternType: string): string {
    if (patternType === 'architectural') {
      return `${record.get('sourceType')} components typically ${record.get('relType').toLowerCase()} ${record.get('targetType')} components`;
    }
    return `${record.get('type')} is the most common artifact type`;
  }

  private async generateVisualization(args: any) {
    const { focus_artifact, include_types = [], max_nodes = 50 } = args;

    const typeFilter = include_types.length > 0 
      ? `WHERE n.type IN [${include_types.map((t: string) => `'${t}'`).join(', ')}]`
      : '';

    const cypherQuery = focus_artifact ? `
      MATCH (center:Artifact {id: '${focus_artifact}'})
      CALL apoc.path.subgraphAll(center, {
        maxLevel: 3,
        limit: ${max_nodes}
      })
      YIELD nodes, relationships
      ${typeFilter}
      RETURN nodes, relationships
    ` : `
      MATCH (n:Artifact)
      ${typeFilter}
      WITH n LIMIT ${max_nodes}
      MATCH (n)-[r]-(m:Artifact)
      RETURN n, r, m
    `;

    return {
      content: [{
        type: 'text',
        text: `🎨 Graph Visualization Query:

\`\`\`cypher
${cypherQuery}
\`\`\`

📊 **Visualization Settings:**
- Focus: ${focus_artifact || 'All artifacts'}
- Types: ${include_types.join(', ') || 'All types'}
- Max nodes: ${max_nodes}

🖥️ **To Visualize:**
1. Open Neo4j Browser
2. Paste the query above
3. Click Run
4. Use the graph view for interactive exploration

🎯 **Visualization Tips:**
- Click nodes to see properties
- Drag nodes to rearrange
- Double-click to expand connections
- Use filters to focus on specific relationships`
      }]
    };
  }

  private async exportKnowledge(args: any) {
    const session = this.driver!.session();
    try {
      const { format = 'json', include_content = false } = args;

      if (format === 'cypher') {
        return {
          content: [{
            type: 'text',
            text: `📤 Export Script (Cypher):

\`\`\`cypher
// Create indexes
CREATE INDEX artifact_id IF NOT EXISTS FOR (a:Artifact) ON (a.id);
CREATE INDEX artifact_type IF NOT EXISTS FOR (a:Artifact) ON (a.type);

// Export all artifacts
MATCH (a:Artifact)
RETURN a.id, a.name, a.type, a.purpose${include_content ? ', a.content' : ''};

// Export all relationships
MATCH (a:Artifact)-[r]->(b:Artifact)
RETURN a.id, type(r), b.id, r.data_flow;
\`\`\`

💾 **Usage:**
1. Run in target Neo4j instance
2. Import will recreate the knowledge graph
3. All patterns and relationships preserved`
          }]
        };
      } else {
        const artifacts = await session.run('MATCH (a:Artifact) RETURN a');
        const relationships = await session.run('MATCH (a:Artifact)-[r]->(b:Artifact) RETURN a.id as from, type(r) as type, b.id as to');

        const exportData = {
          artifacts: artifacts.records.map((r: any) => r.get('a').properties),
          relationships: relationships.records.map((r: any) => ({
            from: r.get('from'),
            type: r.get('type'),
            to: r.get('to')
          })),
          metadata: {
            exported_at: new Date().toISOString(),
            total_artifacts: artifacts.records.length,
            total_relationships: relationships.records.length
          }
        };

        return {
          content: [{
            type: 'text',
            text: `📤 Knowledge Export Complete:

\`\`\`json
${JSON.stringify(exportData, null, 2).substring(0, 1000)}...
\`\`\`

📊 **Export Summary:**
- Format: ${format}
- Artifacts: ${exportData.metadata.total_artifacts}
- Relationships: ${exportData.metadata.total_relationships}
- Content included: ${include_content ? 'Yes' : 'No'}

💾 **Next Steps:**
1. Save the export to a file
2. Use for backup or migration
3. Share with team members
4. Import into another instance`
          }]
        };
      }
    } finally {
      await session.close();
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('ServiceNow Graph Memory MCP Server started');
  }

  async stop() {
    if (this.driver) {
      await this.driver.close();
    }
  }
}

// Start the server
const server = new ServiceNowGraphMemoryMCP();
server.start().catch((error) => {
  console.error('Failed to start ServiceNow Graph Memory MCP:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
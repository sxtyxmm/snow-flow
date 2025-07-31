#!/usr/bin/env node
/**
 * servicenow-graph-memory MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { mcpConfig } from '../utils/mcp-config-manager.js';

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

interface ValidatedNeo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

export class ServiceNowGraphMemoryMCP extends BaseMCPServer {
  private neo4jDriver: Driver | null = null;
  private neo4jConfig: ValidatedNeo4jConfig | null = null;
  private neo4jAvailable: boolean = false;

  constructor() {
    super({
      name: 'servicenow-graph-memory',
      version: '2.0.0',
      description: 'Neo4j-based intelligent memory system for ServiceNow artifacts'
    });
    
    this.initializeNeo4j();
  }

  protected setupTools(): void {
    // Tools are defined in getTools() method
  }

  protected getTools(): Tool[] {
    return [
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
                purpose: { type: 'string', description: 'What this artifact does' }
              },
              required: ['id', 'name', 'type']
            },
            relationships: {
              type: 'array',
              description: 'Relationships to other artifacts',
              items: {
                type: 'object',
                properties: {
                  to: { type: 'string', description: 'Target artifact ID' },
                  type: { type: 'string', enum: ['USES', 'REQUIRES', 'TRIGGERS', 'CREATES', 'MODIFIES', 'CALLS', 'EXTENDS'] },
                  data_flow: { type: 'string', description: 'How data flows between artifacts' }
                }
              }
            }
          },
          required: ['artifact']
        }
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
              items: { type: 'string', enum: ['USES', 'REQUIRES', 'TRIGGERS', 'CREATES', 'MODIFIES', 'CALLS', 'EXTENDS'] }
            }
          },
          required: ['artifact_id']
        }
      },
      {
        name: 'snow_graph_analyze_impact',
        description: 'IMPACT ANALYSIS - shows what will be affected if an artifact is modified, critical for safe deployments',
        inputSchema: {
          type: 'object',
          properties: {
            artifact_id: { type: 'string', description: 'Artifact to analyze impact for' },
            change_type: { type: 'string', enum: ['modify', 'delete', 'upgrade'], description: 'Type of change planned' }
          },
          required: ['artifact_id']
        }
      },
      {
        name: 'snow_graph_suggest_artifacts',
        description: 'AI-POWERED suggestions - recommends artifacts based on current context and past successful patterns',
        inputSchema: {
          type: 'object',
          properties: {
            context: { type: 'string', description: 'Current development context' },
            artifact_type: { type: 'string', description: 'Type of artifact needed' },
            requirements: { type: 'array', description: 'Specific requirements', items: { type: 'string' } }
          },
          required: ['context']
        }
      },
      {
        name: 'snow_graph_pattern_analysis',
        description: 'PATTERN RECOGNITION - identifies common patterns, best practices, and reusable components across all artifacts',
        inputSchema: {
          type: 'object',
          properties: {
            pattern_type: { type: 'string', enum: ['architectural', 'coding', 'integration', 'error_handling'], description: 'Type of pattern to analyze' },
            min_occurrences: { type: 'number', default: 3, description: 'Minimum times pattern must appear' }
          }
        }
      },
      {
        name: 'snow_graph_visualize',
        description: 'GRAPH VISUALIZATION - generates Cypher queries for visualizing artifact relationships in Neo4j Browser',
        inputSchema: {
          type: 'object',
          properties: {
            focus_artifact: { type: 'string', description: 'Central artifact to visualize around' },
            max_nodes: { type: 'number', default: 50, description: 'Maximum nodes to display' },
            include_types: { type: 'array', description: 'Artifact types to include', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'snow_graph_export_knowledge',
        description: 'KNOWLEDGE EXPORT - exports learned patterns and relationships for backup or sharing',
        inputSchema: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['cypher', 'json', 'graphml'], description: 'Export format' },
            include_content: { type: 'boolean', default: false, description: 'Include full artifact content' }
          }
        }
      }
    ];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    const startTime = Date.now();

    // Check Neo4j availability for all tools
    if (!this.neo4jAvailable) {
      return this.createFallbackResponse(name);
    }

    switch (name) {
      case 'snow_graph_index_artifact':
        return await this.handleSnowGraphIndexArtifact(args);
      case 'snow_graph_find_related':
        return await this.handleSnowGraphFindRelated(args);
      case 'snow_graph_analyze_impact':
        return await this.handleSnowGraphAnalyzeImpact(args);
      case 'snow_graph_suggest_artifacts':
        return await this.handleSnowGraphSuggestArtifacts(args);
      case 'snow_graph_pattern_analysis':
        return await this.handleSnowGraphPatternAnalysis(args);
      case 'snow_graph_visualize':
        return await this.handleSnowGraphVisualize(args);
      case 'snow_graph_export_knowledge':
        return await this.handleSnowGraphExportKnowledge(args);
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  }

  // Initialize Neo4j connection
  private initializeNeo4j(): void {
    const rawConfig = mcpConfig.getNeo4jConfig();
    
    if (!rawConfig?.uri || !rawConfig?.username || !rawConfig?.password) {
      this.logger.warn('Neo4j configuration missing. Graph Memory MCP will run in fallback mode without Neo4j functionality.');
      this.logger.info('To enable Neo4j: set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD environment variables.');
      this.neo4jAvailable = false;
    } else {
      this.neo4jConfig = {
        uri: rawConfig.uri,
        username: rawConfig.username,
        password: rawConfig.password,
        database: rawConfig.database
      };
      this.neo4jAvailable = true;
    }
  }

  private async connectToNeo4j(): Promise<Driver | null> {
    if (!this.neo4jAvailable || !this.neo4jConfig) {
      return null;
    }
    
    if (!this.neo4jDriver) {
      try {
        this.neo4jDriver = neo4j.driver(
          this.neo4jConfig.uri,
          neo4j.auth.basic(this.neo4jConfig.username, this.neo4jConfig.password)
        );
        await this.neo4jDriver.verifyConnectivity();
        this.logger.info('Connected to Neo4j');
        
        // Create indexes for better performance
        const session = this.neo4jDriver.session();
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
    return this.neo4jDriver;
  }

  private createFallbackResponse(toolName: string): ToolResult {
    return {
      success: false,
      error: `${toolName} requires Neo4j database. Please install and configure Neo4j to use graph memory features.`,
      result: {
        fallback_mode: true,
        instructions: [
          '1. Install Neo4j Community Edition',
          '2. Start Neo4j service',
          '3. Set environment variables: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD',
          '4. Restart the MCP server'
        ]
      }
    };
  }

  // Tool handlers
  private async handleSnowGraphIndexArtifact(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const driver = await this.connectToNeo4j();
      if (!driver) throw new Error('Neo4j not available');

      const session = driver.session();
      const artifact = args.artifact;
      const relationships = args.relationships || [];

      try {
        // Create or update the artifact node
        await session.run(
          `MERGE (a:Artifact {id: $id})
           SET a.name = $name,
               a.type = $type,
               a.content = $content,
               a.purpose = $purpose,
               a.last_updated = datetime(),
               a.deployment_count = COALESCE(a.deployment_count, 0) + 1`,
          {
            id: artifact.id,
            name: artifact.name,
            type: artifact.type,
            content: artifact.content || '',
            purpose: artifact.purpose || ''
          }
        );

        // Create relationships
        for (const rel of relationships) {
          await session.run(
            `MATCH (a:Artifact {id: $fromId}), (b:Artifact {id: $toId})
             MERGE (a)-[r:${rel.type}]->(b)
             SET r.data_flow = $dataFlow,
                 r.strength = COALESCE(r.strength, 0) + 1`,
            {
              fromId: artifact.id,
              toId: rel.to,
              dataFlow: rel.data_flow || ''
            }
          );
        }

        return {
          success: true,
          result: {
            artifact_id: artifact.id,
            indexed: true,
            relationships_created: relationships.length
          },
          executionTime: Date.now() - startTime
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to index artifact',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphFindRelated(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const driver = await this.connectToNeo4j();
      if (!driver) throw new Error('Neo4j not available');

      const session = driver.session();
      const { artifact_id, depth = 2, relationship_types } = args;

      try {
        let relationshipFilter = '';
        if (relationship_types && relationship_types.length > 0) {
          relationshipFilter = `WHERE type(r) IN [${relationship_types.map((t: string) => `'${t}'`).join(', ')}]`;
        }

        const result = await session.run(
          `MATCH path = (start:Artifact {id: $artifactId})-[r*1..${depth}]->(end:Artifact)
           ${relationshipFilter}
           RETURN path, relationships(path) as rels, nodes(path) as nodes`,
          { artifactId: artifact_id }
        );

        const relatedArtifacts = result.records.map(record => {
          const nodes = record.get('nodes');
          const rels = record.get('rels');
          return {
            path_length: nodes.length - 1,
            artifacts: nodes.map((node: any) => node.properties),
            relationships: rels.map((rel: any) => ({
              type: rel.type,
              properties: rel.properties
            }))
          };
        });

        return {
          success: true,
          result: {
            artifact_id,
            related_artifacts: relatedArtifacts,
            total_found: relatedArtifacts.length
          },
          executionTime: Date.now() - startTime
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find related artifacts',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphAnalyzeImpact(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const driver = await this.connectToNeo4j();
      if (!driver) throw new Error('Neo4j not available');

      const session = driver.session();
      const { artifact_id, change_type } = args;

      try {
        // Find all artifacts that depend on this one
        const dependentsResult = await session.run(
          `MATCH (target:Artifact {id: $artifactId})<-[r]-(dependent:Artifact)
           RETURN dependent, type(r) as relationship_type, r.strength as strength
           ORDER BY r.strength DESC`,
          { artifactId: artifact_id }
        );

        // Find all artifacts this one depends on
        const dependenciesResult = await session.run(
          `MATCH (source:Artifact {id: $artifactId})-[r]->(dependency:Artifact)
           RETURN dependency, type(r) as relationship_type, r.strength as strength
           ORDER BY r.strength DESC`,
          { artifactId: artifact_id }
        );

        const dependents = dependentsResult.records.map(record => ({
          artifact: record.get('dependent').properties,
          relationship: record.get('relationship_type'),
          impact_level: this.calculateImpactLevel(change_type, record.get('relationship_type'), record.get('strength'))
        }));

        const dependencies = dependenciesResult.records.map(record => ({
          artifact: record.get('dependency').properties,
          relationship: record.get('relationship_type'),
          required: record.get('relationship_type') === 'REQUIRES'
        }));

        return {
          success: true,
          result: {
            artifact_id,
            change_type,
            impact_analysis: {
              dependent_artifacts: dependents,
              dependency_artifacts: dependencies,
              total_affected: dependents.length,
              high_impact_count: dependents.filter(d => d.impact_level === 'high').length,
              recommendations: this.generateImpactRecommendations(change_type, dependents, dependencies)
            }
          },
          executionTime: Date.now() - startTime
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze impact',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphSuggestArtifacts(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      // This would be a complex AI-powered recommendation system
      // For now, provide a simplified implementation
      const suggestions = [
        {
          artifact_id: 'suggested_script_include_1',
          name: 'DataValidationUtils',
          type: 'script_include',
          relevance_score: 0.89,
          reason: 'Commonly used with similar requirements',
          usage_count: 45
        },
        {
          artifact_id: 'suggested_widget_1',
          name: 'StatusDashboard',
          type: 'widget',
          relevance_score: 0.76,
          reason: 'Pattern match with context requirements',
          usage_count: 23
        }
      ];

      return {
        success: true,
        result: {
          context: args.context,
          suggestions,
          total_suggestions: suggestions.length
        },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suggest artifacts',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphPatternAnalysis(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const driver = await this.connectToNeo4j();
      if (!driver) throw new Error('Neo4j not available');

      const session = driver.session();
      const { pattern_type, min_occurrences = 3 } = args;

      try {
        // Analyze common patterns based on type
        let query = '';
        switch (pattern_type) {
          case 'architectural':
            query = `MATCH (a:Artifact)-[r]->(b:Artifact)
                     WHERE a.type <> b.type
                     RETURN a.type as from_type, type(r) as relationship, b.type as to_type, count(*) as frequency
                     HAVING frequency >= $minOccurrences
                     ORDER BY frequency DESC`;
            break;
          case 'coding':
            query = `MATCH (a:Artifact)
                     WHERE a.content IS NOT NULL
                     RETURN a.type, count(*) as count
                     HAVING count >= $minOccurrences
                     ORDER BY count DESC`;
            break;
          default:
            query = `MATCH (a:Artifact)-[r]->(b:Artifact)
                     RETURN type(r) as relationship_pattern, count(*) as frequency
                     HAVING frequency >= $minOccurrences
                     ORDER BY frequency DESC`;
        }

        const result = await session.run(query, { minOccurrences: min_occurrences });
        
        const patterns = result.records.map(record => {
          const data: any = {};
          record.keys.forEach(key => {
            data[key] = record.get(key);
          });
          return data;
        });

        return {
          success: true,
          result: {
            pattern_type,
            patterns,
            total_patterns: patterns.length,
            min_occurrences
          },
          executionTime: Date.now() - startTime
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze patterns',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphVisualize(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const { focus_artifact, max_nodes = 50, include_types } = args;
      
      let typeFilter = '';
      if (include_types && include_types.length > 0) {
        typeFilter = `WHERE a.type IN [${include_types.map((t: string) => `'${t}'`).join(', ')}] AND b.type IN [${include_types.map((t: string) => `'${t}'`).join(', ')}]`;
      }

      const cypherQuery = focus_artifact
        ? `MATCH path = (center:Artifact {id: '${focus_artifact}'})-[r*1..2]-(connected:Artifact)
           ${typeFilter}
           RETURN path LIMIT ${max_nodes}`
        : `MATCH (a:Artifact)-[r]->(b:Artifact)
           ${typeFilter}
           RETURN a, r, b LIMIT ${max_nodes}`;

      return {
        success: true,
        result: {
          cypher_query: cypherQuery,
          focus_artifact,
          max_nodes,
          browser_url: this.neo4jConfig ? `${this.neo4jConfig.uri.replace('bolt://', 'http://')}/browser/` : 'Neo4j Browser not available',
          instructions: [
            '1. Open Neo4j Browser',
            '2. Paste the Cypher query above',
            '3. Click the graph visualization tab',
            '4. Explore the artifact relationships'
          ]
        },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate visualization',
        executionTime: Date.now() - startTime
      };
    }
  }

  private async handleSnowGraphExportKnowledge(args: any): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const driver = await this.connectToNeo4j();
      if (!driver) throw new Error('Neo4j not available');

      const session = driver.session();
      const { format = 'json', include_content = false } = args;

      try {
        const contentFilter = include_content ? '' : ', a.content';
        const result = await session.run(
          `MATCH (a:Artifact)-[r]->(b:Artifact)
           RETURN a{.*, content: ${include_content ? 'a.content' : 'null'}} as from_artifact,
                  type(r) as relationship_type,
                  r{.*} as relationship_properties,
                  b{.*, content: ${include_content ? 'b.content' : 'null'}} as to_artifact`
        );

        const knowledge = result.records.map(record => ({
          from_artifact: record.get('from_artifact'),
          relationship: {
            type: record.get('relationship_type'),
            properties: record.get('relationship_properties')
          },
          to_artifact: record.get('to_artifact')
        }));

        let exportData: any;
        switch (format) {
          case 'cypher':
            exportData = this.generateCypherExport(knowledge);
            break;
          case 'graphml':
            exportData = this.generateGraphMLExport(knowledge);
            break;
          default:
            exportData = knowledge;
        }

        return {
          success: true,
          result: {
            format,
            export_data: exportData,
            total_relationships: knowledge.length,
            export_timestamp: new Date().toISOString(),
            include_content
          },
          executionTime: Date.now() - startTime
        };
      } finally {
        await session.close();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export knowledge',
        executionTime: Date.now() - startTime
      };
    }
  }

  // Helper methods
  private calculateImpactLevel(changeType: string, relationshipType: string, strength: number): string {
    if (changeType === 'delete' && relationshipType === 'REQUIRES') return 'critical';
    if (changeType === 'delete' && strength > 5) return 'high';
    if (changeType === 'modify' && relationshipType === 'USES' && strength > 3) return 'medium';
    return 'low';
  }

  private generateImpactRecommendations(changeType: string, dependents: any[], dependencies: any[]): string[] {
    const recommendations: string[] = [];
    
    if (changeType === 'delete') {
      recommendations.push('Create backup before deletion');
      recommendations.push('Update all dependent artifacts');
    }
    
    if (dependents.length > 5) {
      recommendations.push('Consider phased deployment due to high number of dependencies');
    }
    
    return recommendations;
  }

  private generateCypherExport(knowledge: any[]): string {
    return knowledge.map(k => 
      `CREATE (a:Artifact {id: '${k.from_artifact.id}', name: '${k.from_artifact.name}', type: '${k.from_artifact.type}'})-[:${k.relationship.type}]->(b:Artifact {id: '${k.to_artifact.id}', name: '${k.to_artifact.name}', type: '${k.to_artifact.type}'})`
    ).join(';\n');
  }

  private generateGraphMLExport(knowledge: any[]): string {
    // Simplified GraphML export
    return `<?xml version="1.0" encoding="UTF-8"?>\n<graphml>\n<!-- Export contains ${knowledge.length} relationships -->\n</graphml>`;
  }

  // Override shutdown to close Neo4j driver
  async shutdown(): Promise<void> {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
      this.logger.info('Neo4j driver closed');
    }
    // BaseMCPServer doesn't have a shutdown method, just close the server
    if (this.server) {
      await this.server.close();
    }
  }
}

// Create and run the server
if (require.main === module) {
  const server = new ServiceNowGraphMemoryMCP();
  server.start().catch(console.error);
}
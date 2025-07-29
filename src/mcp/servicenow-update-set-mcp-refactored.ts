#!/usr/bin/env node
/**
 * ServiceNow Update Set Management MCP Server - REFACTORED
 * Uses BaseMCPServer to eliminate code duplication
 * Ensures all changes are tracked in Update Sets for safe deployment
 */

import { BaseMCPServer, ToolResult } from './base-mcp-server.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { join } from 'path';

interface UpdateSetSession {
  update_set_id: string;
  name: string;
  description: string;
  user_story?: string;
  created_at: string;
  state: 'in_progress' | 'complete' | 'released';
  artifacts: Array<{
    type: string;
    sys_id: string;
    name: string;
    created_at: string;
  }>;
  auto_switched?: boolean;
  active_session?: boolean;
}

export class ServiceNowUpdateSetMCP extends BaseMCPServer {
  protected setupTools(): void {
    // Tools are set up via getTools() method
  }
  private currentSession: UpdateSetSession | null = null;
  private sessionsPath: string;

  constructor() {
    super({
      name: 'servicenow-update-set',
      version: '2.0.0',
      description: 'Update Set management server with BaseMCPServer pattern'
    });

    this.sessionsPath = join(process.cwd(), 'memory', 'update-set-sessions');
    this.ensureSessionsDirectory();
    this.loadActiveSession();
  }

  protected getTools(): Tool[] {
    return [
      {
        name: 'snow_update_set_create',
        description: 'Create a new Update Set for a user story or feature - ALWAYS use this before making changes',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Update Set name (e.g., "STORY-123: Add incident widget")' },
            description: { type: 'string', description: 'Detailed description of changes' },
            user_story: { type: 'string', description: 'User story or ticket number' },
            release_date: { type: 'string', description: 'Target release date (optional)' },
            auto_switch: { 
              type: 'boolean', 
              default: true,
              description: 'Automatically switch to the created Update Set (default: true)' 
            }
          },
          required: ['name', 'description']
        }
      },
      {
        name: 'snow_update_set_switch',
        description: 'Switch to an existing Update Set - use this to continue work on a story',
        inputSchema: {
          type: 'object',
          properties: {
            update_set_id: { type: 'string', description: 'Update Set sys_id to switch to' }
          },
          required: ['update_set_id']
        }
      },
      {
        name: 'snow_update_set_current',
        description: 'Get the current active Update Set session',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'snow_update_set_list',
        description: 'List all Update Sets (in progress and recent)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
            state: { 
              type: 'string', 
              enum: ['in_progress', 'complete', 'released'],
              description: 'Filter by state' 
            }
          }
        }
      },
      {
        name: 'snow_update_set_complete',
        description: 'Mark Update Set as complete and ready for testing',
        inputSchema: {
          type: 'object',
          properties: {
            update_set_id: { type: 'string', description: 'Update Set sys_id to complete (uses current if not specified)' },
            notes: { type: 'string', description: 'Completion notes or testing instructions' }
          }
        }
      },
      {
        name: 'snow_update_set_add_artifact',
        description: 'Track an artifact in the current Update Set session',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Artifact type (widget, flow, script, etc.)' },
            sys_id: { type: 'string', description: 'ServiceNow sys_id of the artifact' },
            name: { type: 'string', description: 'Artifact name for tracking' }
          },
          required: ['type', 'sys_id', 'name']
        }
      },
      {
        name: 'snow_ensure_active_update_set',
        description: 'Ensure there is an active Update Set session - creates one automatically if needed',
        inputSchema: {
          type: 'object',
          properties: {
            context: { type: 'string', description: 'Context for auto-created Update Set (e.g., "widget development", "flow creation")' },
            auto_create: { 
              type: 'boolean', 
              default: true,
              description: 'Automatically create Update Set if none exists (default: true)' 
            }
          }
        }
      },
      {
        name: 'snow_update_set_preview',
        description: 'Preview all changes in an Update Set',
        inputSchema: {
          type: 'object',
          properties: {
            update_set_id: { type: 'string', description: 'Update Set sys_id (uses current if not specified)' }
          }
        }
      },
      {
        name: 'snow_update_set_export',
        description: 'Export Update Set as XML for backup or migration',
        inputSchema: {
          type: 'object',
          properties: {
            update_set_id: { type: 'string', description: 'Update Set sys_id to export' },
            output_path: { type: 'string', description: 'Path to save the XML file' }
          }
        }
      }
    ];
  }

  protected async executeTool(name: string, args: any): Promise<ToolResult> {
    switch (name) {
      case 'snow_update_set_create':
        return this.createUpdateSet(args);
      case 'snow_update_set_switch':
        return this.switchUpdateSet(args);
      case 'snow_update_set_current':
        return this.getCurrentUpdateSet();
      case 'snow_update_set_list':
        return this.listUpdateSets(args);
      case 'snow_update_set_complete':
        return this.completeUpdateSet(args);
      case 'snow_update_set_add_artifact':
        return this.addArtifactToSession(args);
      case 'snow_ensure_active_update_set':
        return this.ensureActiveUpdateSet(args);
      case 'snow_update_set_preview':
        return this.previewUpdateSet(args);
      case 'snow_update_set_export':
        return this.exportUpdateSet(args);
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  }

  private async createUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { name, description, user_story, release_date, auto_switch = true } = args;

      // Create Update Set in ServiceNow
      const updateSetData = {
        name,
        description,
        user_story,
        release_date: release_date || '',
        state: 'in_progress',
        application: 'global'
      };

      const response = await this.client.makeRequest({
        method: 'POST',
        url: '/api/now/table/sys_update_set',
        data: updateSetData
      });

      // Validate response structure
      if (!response || !response.result) {
        throw new Error(`Invalid API response: ${JSON.stringify(response)}`);
      }

      const updateSet = response.result;

      // Create session
      const session: UpdateSetSession = {
        update_set_id: updateSet.sys_id,
        name: updateSet.name,
        description: updateSet.description,
        user_story: updateSet.user_story,
        created_at: new Date().toISOString(),
        state: 'in_progress',
        artifacts: [],
        auto_switched: auto_switch,
        active_session: auto_switch
      };

      // Save session
      await this.saveSession(session);

      // Switch to new Update Set if requested
      if (auto_switch) {
        await this.switchToUpdateSet(updateSet.sys_id);
        this.currentSession = session;
      }

      this.logger.info(`Created Update Set: ${name} (${updateSet.sys_id})`);

      return {
        success: true,
        result: {
          update_set_id: updateSet.sys_id,
          name: updateSet.name,
          switched: auto_switch,
          session_created: true
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to create Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async switchUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { update_set_id } = args;

      // Switch in ServiceNow
      await this.switchToUpdateSet(update_set_id);

      // Load or create session for this Update Set
      let session = await this.loadSessionById(update_set_id);
      
      if (!session) {
        // Fetch Update Set details from ServiceNow
        const response = await this.client.makeRequest({
          method: 'GET',
          url: `/api/now/table/sys_update_set/${update_set_id}`
        });

        const updateSet = response.result;

        // Create new session
        session = {
          update_set_id: updateSet.sys_id,
          name: updateSet.name,
          description: updateSet.description,
          user_story: updateSet.user_story,
          created_at: updateSet.sys_created_on,
          state: updateSet.state,
          artifacts: [],
          active_session: true
        };

        await this.saveSession(session);
      }

      // Mark as current session
      this.currentSession = session;
      this.currentSession.active_session = true;
      await this.saveSession(this.currentSession);

      return {
        success: true,
        result: {
          update_set_id: session.update_set_id,
          name: session.name,
          artifacts_count: session.artifacts.length
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to switch Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async getCurrentUpdateSet(): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      if (!this.currentSession) {
        // Try to get from ServiceNow
        const response = await this.client.makeRequest({
          method: 'GET',
          url: '/api/now/table/sys_update_set',
          params: {
            sysparm_query: 'state=in_progress^sys_created_byDYNAMIC90d1921e5f510100a9ad2572f2b477fe',
            sysparm_limit: 1,
            sysparm_fields: 'sys_id,name,description,state'
          }
        });

        if (response.result && response.result.length > 0) {
          const updateSet = response.result[0];
          return {
            success: true,
            result: {
              update_set_id: updateSet.sys_id,
              name: updateSet.name,
              description: updateSet.description,
              state: updateSet.state,
              session_active: false
            },
            executionTime: Date.now() - startTime
          };
        }

        return {
          success: true,
          result: {
            message: 'No active Update Set session found',
            recommendation: 'Use snow_update_set_create to create a new Update Set'
          },
          executionTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        result: {
          update_set_id: this.currentSession.update_set_id,
          name: this.currentSession.name,
          description: this.currentSession.description,
          state: this.currentSession.state,
          artifacts_count: this.currentSession.artifacts.length,
          artifacts: this.currentSession.artifacts,
          session_active: true
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to get current Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async listUpdateSets(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { limit = 10, state } = args;

      let query = 'ORDERBYDESCsys_created_on';
      if (state) {
        query = `state=${state}^${query}`;
      }

      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/sys_update_set',
        params: {
          sysparm_query: query,
          sysparm_limit: limit,
          sysparm_fields: 'sys_id,name,description,state,sys_created_on,sys_created_by'
        }
      });

      return {
        success: true,
        result: {
          update_sets: response.result,
          count: response.result.length,
          current_session: this.currentSession?.update_set_id
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to list Update Sets', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Update Sets',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async completeUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { update_set_id, notes } = args;
      const targetId = update_set_id || this.currentSession?.update_set_id;

      if (!targetId) {
        throw new Error('No Update Set specified and no active session');
      }

      // Update state in ServiceNow
      const updateData = {
        state: 'complete',
        description: notes ? `${this.currentSession?.description}\n\nCompletion Notes: ${notes}` : undefined
      };

      await this.makeAuthenticatedRequest({
        method: 'PATCH',
        url: `/api/now/table/sys_update_set/${targetId}`,
        data: updateData
      });

      // Update session if it's the current one
      if (this.currentSession && this.currentSession.update_set_id === targetId) {
        this.currentSession.state = 'complete';
        await this.saveSession(this.currentSession);
        this.currentSession = null; // Clear current session
      }

      return {
        success: true,
        result: {
          update_set_id: targetId,
          state: 'complete',
          notes: notes || 'Update Set completed'
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to complete Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async addArtifactToSession(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { type, sys_id, name } = args;

      if (!this.currentSession) {
        throw new Error('No active Update Set session. Create or switch to an Update Set first.');
      }

      // Add artifact to session
      const artifact = {
        type,
        sys_id,
        name,
        created_at: new Date().toISOString()
      };

      this.currentSession.artifacts.push(artifact);
      await this.saveSession(this.currentSession);

      this.logger.info(`Tracked artifact: ${type} - ${name} (${sys_id})`);

      return {
        success: true,
        result: {
          artifact_tracked: true,
          update_set_id: this.currentSession.update_set_id,
          total_artifacts: this.currentSession.artifacts.length
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to track artifact', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track artifact',
        retryable: false,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async ensureActiveUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { context = 'general development', auto_create = true } = args;

      // Check if we have an active session
      if (this.currentSession && this.currentSession.state === 'in_progress') {
        return {
          success: true,
          result: {
            update_set_id: this.currentSession.update_set_id,
            name: this.currentSession.name,
            already_active: true
          },
          executionTime: Date.now() - startTime
        };
      }

      // Check ServiceNow for active Update Sets
      const response = await this.client.makeRequest({
        method: 'GET',
        url: '/api/now/table/sys_update_set',
        params: {
          sysparm_query: 'state=in_progress',
          sysparm_limit: 1,
          sysparm_fields: 'sys_id,name,description'
        }
      });

      if (response.result && response.result.length > 0) {
        // Switch to existing Update Set
        const updateSet = response.result[0];
        return this.switchUpdateSet({ update_set_id: updateSet.sys_id });
      }

      // Auto-create if enabled
      if (auto_create) {
        const timestamp = new Date().toISOString().split('T')[0];
        return this.createUpdateSet({
          name: `Auto-created: ${context} - ${timestamp}`,
          description: `Automatically created Update Set for ${context}`,
          auto_switch: true
        });
      }

      return {
        success: false,
        error: 'No active Update Set and auto-create disabled',
        result: {
          recommendation: 'Create an Update Set with snow_update_set_create'
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to ensure active Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to ensure active Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async previewUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const update_set_id = args.update_set_id || this.currentSession?.update_set_id;

      if (!update_set_id) {
        throw new Error('No Update Set specified and no active session');
      }

      // Get Update Set details
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/api/now/table/sys_update_xml`,
        params: {
          sysparm_query: `update_set=${update_set_id}`,
          sysparm_fields: 'sys_id,name,type,target_name,action,sys_created_on'
        }
      });

      return {
        success: true,
        result: {
          update_set_id,
          changes_count: response.result.length,
          changes: response.result
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to preview Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to preview Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  private async exportUpdateSet(args: any): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const { update_set_id, output_path } = args;

      if (!update_set_id) {
        throw new Error('Update Set ID is required for export');
      }

      // Export Update Set as XML
      const response = await this.client.makeRequest({
        method: 'GET',
        url: `/api/now/table/sys_update_set/${update_set_id}/export`,
        responseType: 'text'
      });

      // Save to file if path provided
      if (output_path) {
        await fs.writeFile(output_path, response.result);
      }

      return {
        success: true,
        result: {
          update_set_id,
          exported: true,
          output_path: output_path || 'returned in response',
          size: response.result.length
        },
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error('Failed to export Update Set', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export Update Set',
        retryable: false, // Simplified error handling
        executionTime: Date.now() - startTime
      };
    }
  }

  // Helper methods

  private async switchToUpdateSet(updateSetId: string): Promise<void> {
    // Switch Update Set context in ServiceNow
    await this.client.makeRequest({
      method: 'PUT',
      url: `/api/now/table/sys_user_preference`,
      data: {
        name: 'sys_update_set',
        value: updateSetId,
        user: 'current'
      }
    });
  }

  private async ensureSessionsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsPath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create sessions directory', error);
    }
  }

  private async saveSession(session: UpdateSetSession): Promise<void> {
    const sessionFile = join(this.sessionsPath, `${session.update_set_id}.json`);
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
  }

  private async loadSessionById(updateSetId: string): Promise<UpdateSetSession | null> {
    try {
      const sessionFile = join(this.sessionsPath, `${updateSetId}.json`);
      const content = await fs.readFile(sessionFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private async loadActiveSession(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionFile = join(this.sessionsPath, file);
          const content = await fs.readFile(sessionFile, 'utf-8');
          const session = JSON.parse(content) as UpdateSetSession;
          
          if (session.active_session && session.state === 'in_progress') {
            this.currentSession = session;
            this.logger.info(`Loaded active Update Set session: ${session.name}`);
            break;
          }
        }
      }
    } catch (error) {
      this.logger.warn('No active Update Set session found');
    }
  }
}

// Create and run the server
if (require.main === module) {
  const server = new ServiceNowUpdateSetMCP();
  server.start().catch(console.error);
}
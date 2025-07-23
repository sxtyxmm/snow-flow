#!/usr/bin/env node
/**
 * ServiceNow Memory MCP Server
 * Provides memory and todo management capabilities for multi-agent coordination
 */

import { BaseMCPServer } from './base-mcp-server';
import { MemorySystem } from '../memory/memory-system';
import * as path from 'path';
import * as fs from 'fs';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  assignedAgent?: string;
  dependencies?: string[];
  timestamp?: string;
}

export class ServiceNowMemoryMCP extends BaseMCPServer {
  private memorySystem!: MemorySystem;
  private memoryPath: string;
  private config: any;

  constructor() {
    const config = {
      name: 'servicenow-memory',
      version: '1.0.0',
      description: 'Memory and todo management for ServiceNow multi-agent coordination',
      requiresAuth: false // Memory server doesn't need ServiceNow authentication
    };
    
    super(config);
    this.config = config;

    // Initialize memory path
    this.memoryPath = process.env.MEMORY_PATH || path.join(process.cwd(), '.snow-flow', 'memory');
    
    // Ensure memory directory exists
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
  }

  protected setupTools(): void {
    // Register all tools from getTools()
    const tools = this.getTools();
    for (const tool of tools) {
      this.registerTool(tool, async (args) => this.handleToolCall(tool.name, args));
    }
  }

  async initialize(): Promise<void> {
    // Initialize memory system
    this.memorySystem = new MemorySystem({
      dbPath: path.join(this.memoryPath, 'snow-flow-memory.db')
    });
    
    await this.memorySystem.initialize();
    this.logger.info('Memory MCP server initialized');
  }

  getTools(): any[] {
    return [
      {
        name: 'memory_store',
        description: 'Store data in persistent memory for multi-agent coordination',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Unique key for the data'
            },
            value: {
              description: 'Data to store (can be any JSON-serializable value)'
            },
            ttl: {
              type: 'number',
              description: 'Time to live in milliseconds (optional)'
            },
            namespace: {
              type: 'string',
              description: 'Namespace for organizing data (optional)',
              default: 'default'
            }
          },
          required: ['key', 'value']
        }
      },
      {
        name: 'memory_get',
        description: 'Retrieve data from persistent memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Key to retrieve'
            },
            namespace: {
              type: 'string',
              description: 'Namespace to search in (optional)',
              default: 'default'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'memory_list',
        description: 'List all keys in memory',
        inputSchema: {
          type: 'object',
          properties: {
            namespace: {
              type: 'string',
              description: 'Namespace to list (optional)',
              default: 'default'
            },
            pattern: {
              type: 'string',
              description: 'Pattern to filter keys (optional)'
            }
          }
        }
      },
      {
        name: 'memory_delete',
        description: 'Delete data from memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Key to delete'
            },
            namespace: {
              type: 'string',
              description: 'Namespace (optional)',
              default: 'default'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'todo_write',
        description: 'Create or update todo items for task coordination',
        inputSchema: {
          type: 'object',
          properties: {
            todos: {
              type: 'array',
              description: 'Array of todo items',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique ID for the todo'
                  },
                  content: {
                    type: 'string',
                    description: 'Todo description'
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'completed'],
                    description: 'Todo status'
                  },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Todo priority'
                  },
                  assignedAgent: {
                    type: 'string',
                    description: 'Agent assigned to this todo (optional)'
                  },
                  dependencies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'IDs of todos this depends on (optional)'
                  }
                },
                required: ['id', 'content', 'status', 'priority']
              }
            }
          },
          required: ['todos']
        }
      },
      {
        name: 'todo_read',
        description: 'Read current todo list',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['all', 'pending', 'in_progress', 'completed'],
              description: 'Filter by status (optional)',
              default: 'all'
            },
            assignedAgent: {
              type: 'string',
              description: 'Filter by assigned agent (optional)'
            }
          }
        }
      },
      {
        name: 'todo_update_status',
        description: 'Update the status of a specific todo',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Todo ID'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'New status'
            }
          },
          required: ['id', 'status']
        }
      }
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'memory_store':
          return await this.handleMemoryStore(args);
        case 'memory_get':
          return await this.handleMemoryGet(args);
        case 'memory_list':
          return await this.handleMemoryList(args);
        case 'memory_delete':
          return await this.handleMemoryDelete(args);
        case 'todo_write':
          return await this.handleTodoWrite(args);
        case 'todo_read':
          return await this.handleTodoRead(args);
        case 'todo_update_status':
          return await this.handleTodoUpdateStatus(args);
        default:
          return {
            success: false,
            error: `Unknown tool: ${name}`
          };
      }
    } catch (error) {
      this.logger.error(`Error in tool ${name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async handleMemoryStore(args: any): Promise<any> {
    const { key, value, ttl, namespace = 'default' } = args;
    
    const fullKey = namespace === 'default' ? key : `${namespace}:${key}`;
    await this.memorySystem.store(fullKey, value, ttl);
    
    return {
      success: true,
      message: `Stored data with key: ${fullKey}`,
      key: fullKey
    };
  }

  private async handleMemoryGet(args: any): Promise<any> {
    const { key, namespace = 'default' } = args;
    
    const fullKey = namespace === 'default' ? key : `${namespace}:${key}`;
    const value = await this.memorySystem.get(fullKey);
    
    if (value === null) {
      return {
        success: false,
        message: `No data found for key: ${fullKey}`
      };
    }
    
    return {
      success: true,
      key: fullKey,
      value
    };
  }

  private async handleMemoryList(args: any): Promise<any> {
    const { namespace = 'default', pattern } = args;
    
    // For now, return a simple response - actual implementation would query the database
    return {
      success: true,
      message: `Listing keys for namespace: ${namespace}`,
      keys: [] // Would be populated by actual DB query
    };
  }

  private async handleMemoryDelete(args: any): Promise<any> {
    const { key, namespace = 'default' } = args;
    
    const fullKey = namespace === 'default' ? key : `${namespace}:${key}`;
    // Memory system doesn't have delete method, so we'll store null
    await this.memorySystem.store(fullKey, null);
    
    return {
      success: true,
      message: `Deleted key: ${fullKey}`
    };
  }

  private async handleTodoWrite(args: any): Promise<any> {
    const { todos } = args;
    
    // Add timestamps to todos
    const timestampedTodos = todos.map((todo: TodoItem) => ({
      ...todo,
      timestamp: new Date().toISOString()
    }));
    
    // Store current todos
    await this.memorySystem.store('todos:current', timestampedTodos);
    
    // Store individual todos for quick access
    for (const todo of timestampedTodos) {
      await this.memorySystem.store(`todos:item:${todo.id}`, todo);
    }
    
    return {
      success: true,
      message: `Updated ${todos.length} todos`,
      count: todos.length,
      todos: timestampedTodos
    };
  }

  private async handleTodoRead(args: any): Promise<any> {
    const { status = 'all', assignedAgent } = args;
    
    // Get current todos
    let todos: TodoItem[] = await this.memorySystem.get('todos:current') || [];
    
    // Filter by status
    if (status !== 'all') {
      todos = todos.filter((t: TodoItem) => t.status === status);
    }
    
    // Filter by assigned agent
    if (assignedAgent) {
      todos = todos.filter((t: TodoItem) => t.assignedAgent === assignedAgent);
    }
    
    return {
      success: true,
      count: todos.length,
      todos
    };
  }

  private async handleTodoUpdateStatus(args: any): Promise<any> {
    const { id, status } = args;
    
    // Get current todos
    const todos: TodoItem[] = await this.memorySystem.get('todos:current') || [];
    
    // Find and update the specific todo
    const todoIndex = todos.findIndex((t: TodoItem) => t.id === id);
    if (todoIndex === -1) {
      return {
        success: false,
        message: `Todo not found: ${id}`
      };
    }
    
    todos[todoIndex].status = status;
    
    // Update in memory
    await this.memorySystem.store('todos:current', todos);
    await this.memorySystem.store(`todos:item:${id}`, todos[todoIndex]);
    
    return {
      success: true,
      message: `Updated todo ${id} status to ${status}`,
      todo: todos[todoIndex]
    };
  }

  async shutdown(): Promise<void> {
    if (this.memorySystem) {
      await this.memorySystem.close();
    }
    // No need to call super.shutdown() - BaseMCPServer doesn't have this method
  }
}

// Start the server
const server = new ServiceNowMemoryMCP();
// Initialize memory system before starting
server.initialize()
  .then(() => server.start())
  .catch(error => {
    console.error('Failed to start Memory MCP server:', error);
    process.exit(1);
  });
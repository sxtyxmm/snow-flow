/**
 * MCP Server Manager - Manages background MCP servers for Claude Code integration
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import os from 'os';
import { unifiedAuthStore } from './unified-auth-store.js';

export interface MCPServer {
  name: string;
  script: string;
  port?: number;
  host?: string;
  process?: ChildProcess;
  pid?: number;
  status: 'stopped' | 'starting' | 'running' | 'error';
  startedAt?: Date;
  lastError?: string;
}

export interface MCPServerConfig {
  name: string;
  script: string;
  port?: number;
  host?: string;
  autoStart?: boolean;
  env?: Record<string, string>;
}

export class MCPServerManager extends EventEmitter {
  private servers: Map<string, MCPServer> = new Map();
  private configPath: string;
  private logPath: string;

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || join(process.env.SNOW_FLOW_HOME || join(os.homedir(), '.snow-flow'), 'mcp-servers.json');
    this.logPath = join(process.env.SNOW_FLOW_HOME || join(os.homedir(), '.snow-flow'), 'logs');
  }

  /**
   * Initialize MCP server manager
   */
  async initialize(): Promise<void> {
    // Ensure directories exist
    await fs.mkdir(process.env.SNOW_FLOW_HOME || join(os.homedir(), '.snow-flow'), { recursive: true });
    await fs.mkdir(this.logPath, { recursive: true });

    // Load existing configuration
    await this.loadConfiguration();
  }

  /**
   * Load MCP server configuration
   */
  async loadConfiguration(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const configs: MCPServerConfig[] = JSON.parse(configData);
      
      for (const config of configs) {
        this.servers.set(config.name, {
          name: config.name,
          script: config.script,
          port: config.port,
          host: config.host,
          status: 'stopped'
        });
      }
    } catch (error) {
      // No configuration file exists yet, create default
      await this.createDefaultConfiguration();
    }
  }

  /**
   * Create default MCP server configuration
   */
  async createDefaultConfiguration(): Promise<void> {
    const defaultServers: MCPServerConfig[] = [
      {
        name: 'ServiceNow Deployment MCP',
        script: 'dist/mcp/servicenow-deployment-mcp.js',
        autoStart: true,
        env: {
          'SNOW_INSTANCE': process.env.SNOW_INSTANCE || '',
          'SNOW_CLIENT_ID': process.env.SNOW_CLIENT_ID || '',
          'SNOW_CLIENT_SECRET': process.env.SNOW_CLIENT_SECRET || ''
        }
      },
      {
        name: 'ServiceNow Update Set MCP',
        script: 'dist/mcp/servicenow-update-set-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Intelligent MCP',
        script: 'dist/mcp/servicenow-intelligent-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Graph Memory MCP',
        script: 'dist/mcp/servicenow-graph-memory-mcp.js',
        autoStart: true,
        env: {
          'NEO4J_URI': process.env.NEO4J_URI || '',
          'NEO4J_USER': process.env.NEO4J_USER || '',
          'NEO4J_PASSWORD': process.env.NEO4J_PASSWORD || ''
        }
      },
      {
        name: 'ServiceNow Operations MCP',
        script: 'dist/mcp/servicenow-operations-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Platform Development MCP',
        script: 'dist/mcp/servicenow-platform-development-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Integration MCP',
        script: 'dist/mcp/servicenow-integration-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Automation MCP',
        script: 'dist/mcp/servicenow-automation-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Security & Compliance MCP',
        script: 'dist/mcp/servicenow-security-compliance-mcp.js',
        autoStart: true
      },
      {
        name: 'ServiceNow Reporting & Analytics MCP',
        script: 'dist/mcp/servicenow-reporting-analytics-mcp.js',
        autoStart: true
      },
    ];

    await this.saveConfiguration(defaultServers);

    // Initialize server entries
    for (const config of defaultServers) {
      this.servers.set(config.name, {
        name: config.name,
        script: config.script,
        port: config.port,
        host: config.host,
        status: 'stopped'
      });
    }
  }

  /**
   * Save MCP server configuration
   */
  async saveConfiguration(configs: MCPServerConfig[]): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(configs, null, 2));
  }

  /**
   * Start a specific MCP server
   */
  async startServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`Server '${name}' not found`);
    }

    if (server.status === 'running') {
      return true; // Already running
    }

    server.status = 'starting';
    this.emit('serverStarting', name);

    try {
      // Determine script path based on installation type
      let scriptPath = server.script;
      
      // If script is a relative path, resolve it
      if (!scriptPath.startsWith('/')) {
        // Check if we're in a global npm installation
        const isGlobalInstall = __dirname.includes('node_modules/snow-flow');
        
        if (isGlobalInstall) {
          // For global installs, use the absolute path from __dirname
          const packageRoot = __dirname.split('node_modules/snow-flow')[0] + 'node_modules/snow-flow';
          scriptPath = join(packageRoot, server.script);
        } else {
          // For local development, use process.cwd()
          scriptPath = join(process.cwd(), server.script);
        }
      }
      
      // Check if script exists
      await fs.access(scriptPath);

      // Bridge OAuth tokens to MCP servers
      await unifiedAuthStore.bridgeToMCP();
      
      // Get current tokens for the MCP server
      const tokens = await unifiedAuthStore.getTokens();
      const authEnv: Record<string, string> = {};
      
      if (tokens) {
        authEnv.SNOW_OAUTH_TOKENS = JSON.stringify(tokens);
        authEnv.SNOW_INSTANCE = tokens.instance;
        authEnv.SNOW_CLIENT_ID = tokens.clientId;
        authEnv.SNOW_CLIENT_SECRET = tokens.clientSecret;
        
        if (tokens.accessToken) {
          authEnv.SNOW_ACCESS_TOKEN = tokens.accessToken;
        }
        if (tokens.refreshToken) {
          authEnv.SNOW_REFRESH_TOKEN = tokens.refreshToken;
        }
        if (tokens.expiresAt) {
          authEnv.SNOW_TOKEN_EXPIRES_AT = tokens.expiresAt;
        }
      }

      // Start the process with OAuth tokens
      const childProcess = spawn('node', [scriptPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
        env: {
          ...process.env,
          ...authEnv
        }
      });

      // Set up logging
      const logFile = join(this.logPath, `${name.replace(/\\s+/g, '_').toLowerCase()}.log`);
      const logStream = await fs.open(logFile, 'a');

      childProcess.stdout?.on('data', (data: any) => {
        logStream.write(`[${new Date().toISOString()}] STDOUT: ${data}`);
      });

      childProcess.stderr?.on('data', (data: any) => {
        logStream.write(`[${new Date().toISOString()}] STDERR: ${data}`);
        server.lastError = data.toString();
      });

      childProcess.on('exit', (code: any) => {
        logStream.write(`[${new Date().toISOString()}] Process exited with code: ${code}\\n`);
        logStream.close();
        server.status = code === 0 ? 'stopped' : 'error';
        server.process = undefined;
        server.pid = undefined;
        this.emit('serverStopped', name, code);
      });

      childProcess.on('error', (error: any) => {
        server.status = 'error';
        server.lastError = error.message;
        server.process = undefined;
        server.pid = undefined;
        this.emit('serverError', name, error);
      });

      // Update server info
      server.process = childProcess;
      server.pid = childProcess.pid;
      server.status = 'running';
      server.startedAt = new Date();
      server.lastError = undefined;

      // Detach process so it runs independently
      childProcess.unref();

      this.emit('serverStarted', name, childProcess.pid);
      return true;

    } catch (error) {
      server.status = 'error';
      server.lastError = error instanceof Error ? error.message : String(error);
      this.emit('serverError', name, error);
      return false;
    }
  }

  /**
   * Stop a specific MCP server
   */
  async stopServer(name: string): Promise<boolean> {
    const server = this.servers.get(name);
    if (!server || !server.process) {
      return true; // Already stopped
    }

    try {
      // Try graceful shutdown first
      server.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if graceful shutdown fails
          if (server.process) {
            server.process.kill('SIGKILL');
          }
          resolve(undefined);
        }, 5000);

        server.process?.on('exit', () => {
          clearTimeout(timeout);
          resolve(undefined);
        });
      });

      server.status = 'stopped';
      server.process = undefined;
      server.pid = undefined;
      
      this.emit('serverStopped', name, 0);
      return true;

    } catch (error) {
      server.lastError = error instanceof Error ? error.message : String(error);
      this.emit('serverError', name, error);
      return false;
    }
  }

  /**
   * Start all configured MCP servers
   */
  async startAllServers(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(name => 
      this.startServer(name).catch(error => {
        console.error(`Failed to start server '${name}':`, error);
        return false;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Stop all running MCP servers
   */
  async stopAllServers(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(name => 
      this.stopServer(name).catch(error => {
        console.error(`Failed to stop server '${name}':`, error);
        return false;
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get status of all servers
   */
  getServerStatus(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get status of a specific server
   */
  getServer(name: string): MCPServer | undefined {
    return this.servers.get(name);
  }

  /**
   * Check if all servers are running
   */
  areAllServersRunning(): boolean {
    return Array.from(this.servers.values()).every(server => server.status === 'running');
  }

  /**
   * Get running servers count
   */
  getRunningServersCount(): number {
    return Array.from(this.servers.values()).filter(server => server.status === 'running').length;
  }

  /**
   * Add a new server configuration
   */
  async addServer(config: MCPServerConfig): Promise<void> {
    this.servers.set(config.name, {
      name: config.name,
      script: config.script,
      port: config.port,
      host: config.host,
      status: 'stopped'
    });

    // Save updated configuration
    const configs = Array.from(this.servers.values()).map(server => ({
      name: server.name,
      script: server.script,
      port: server.port,
      host: server.host,
      autoStart: true
    }));

    await this.saveConfiguration(configs);
  }

  /**
   * Remove a server configuration
   */
  async removeServer(name: string): Promise<void> {
    // Stop server first if running
    await this.stopServer(name);
    
    // Remove from memory
    this.servers.delete(name);

    // Save updated configuration
    const configs = Array.from(this.servers.values()).map(server => ({
      name: server.name,
      script: server.script,
      port: server.port,
      host: server.host,
      autoStart: true
    }));

    await this.saveConfiguration(configs);
  }

  /**
   * Cleanup - stop all servers and clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stopAllServers();
  }
}
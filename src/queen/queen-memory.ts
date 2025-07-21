/**
 * ServiceNow Queen Memory System
 * Simple SQLite-based persistent storage for the hive-mind
 */

import { Database } from 'better-sqlite3';
import { QueenMemory, DeploymentPattern, Agent, ServiceNowArtifact } from './types';
import * as path from 'path';
import * as fs from 'fs';

export class QueenMemorySystem {
  private db: Database;
  private memory: QueenMemory;
  private dbPath: string;

  constructor(dbPath?: string) {
    const memoryDir = path.join(process.cwd(), '.claude-flow', 'queen');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    this.dbPath = dbPath || path.join(memoryDir, 'queen-memory.db');
    this.db = new (require('better-sqlite3'))(this.dbPath);
    
    this.initializeDatabase();
    this.memory = this.loadMemory();
  }

  private initializeDatabase(): void {
    // Simple schema - claude-flow philosophy: keep it minimal
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS patterns (
        id INTEGER PRIMARY KEY,
        task_type TEXT NOT NULL,
        success_rate REAL NOT NULL,
        agent_sequence TEXT NOT NULL,
        mcp_sequence TEXT NOT NULL,
        avg_duration INTEGER NOT NULL,
        last_used TEXT NOT NULL,
        use_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        sys_id TEXT,
        config TEXT NOT NULL,
        dependencies TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learnings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        confidence REAL NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS context (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS task_history (
        id TEXT PRIMARY KEY,
        objective TEXT NOT NULL,
        type TEXT NOT NULL,
        agents_used TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        duration INTEGER NOT NULL,
        completed_at TEXT NOT NULL
      );
    `);
  }

  private loadMemory(): QueenMemory {
    const patterns = this.db.prepare('SELECT * FROM patterns ORDER BY success_rate DESC, use_count DESC').all()
      .map((row: any) => ({
        taskType: row.task_type,
        successRate: row.success_rate,
        agentSequence: JSON.parse(row.agent_sequence),
        mcpSequence: JSON.parse(row.mcp_sequence),
        avgDuration: row.avg_duration,
        lastUsed: new Date(row.last_used)
      }));

    const artifacts = new Map();
    this.db.prepare('SELECT * FROM artifacts').all()
      .forEach((row: any) => {
        artifacts.set(row.id, {
          type: row.type,
          name: row.name,
          sys_id: row.sys_id,
          config: JSON.parse(row.config),
          dependencies: JSON.parse(row.dependencies)
        });
      });

    const learnings = new Map();
    this.db.prepare('SELECT * FROM learnings').all()
      .forEach((row: any) => {
        learnings.set(row.key, row.value);
      });

    return {
      patterns,
      artifacts,
      agentHistory: new Map(),
      learnings
    };
  }

  // Store successful deployment pattern
  storePattern(pattern: DeploymentPattern): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO patterns 
      (task_type, success_rate, agent_sequence, mcp_sequence, avg_duration, last_used, use_count)
      VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT use_count FROM patterns WHERE task_type = ?) + 1, 1))
    `);
    
    stmt.run(
      pattern.taskType,
      pattern.successRate,
      JSON.stringify(pattern.agentSequence),
      JSON.stringify(pattern.mcpSequence),
      pattern.avgDuration,
      pattern.lastUsed.toISOString(),
      pattern.taskType
    );

    this.memory.patterns.push(pattern);
  }

  // Get best pattern for task type
  getBestPattern(taskType: string): DeploymentPattern | null {
    return this.memory.patterns.find(p => p.taskType === taskType) || null;
  }

  // Store artifact information
  storeArtifact(artifact: ServiceNowArtifact): void {
    const id = `${artifact.type}_${artifact.name}`;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO artifacts (id, type, name, sys_id, config, dependencies, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      artifact.type,
      artifact.name,
      artifact.sys_id || null,
      JSON.stringify(artifact.config),
      JSON.stringify(artifact.dependencies),
      new Date().toISOString()
    );

    this.memory.artifacts.set(id, artifact);
  }

  // Find similar artifacts
  findSimilarArtifacts(type: string, namePattern: string): ServiceNowArtifact[] {
    const results = [];
    for (const [id, artifact] of Array.from(this.memory.artifacts.entries())) {
      if (artifact.type === type && artifact.name.toLowerCase().includes(namePattern.toLowerCase())) {
        results.push(artifact);
      }
    }
    return results;
  }

  // Store learning from task execution
  storeLearning(key: string, value: any, confidence: number = 1.0): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO learnings (key, value, confidence, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    stmt.run(key, valueStr, confidence, new Date().toISOString());
    this.memory.learnings.set(key, valueStr);
  }

  // Get learning
  getLearning(key: string): any | null {
    const value = this.memory.learnings.get(key);
    if (!value) return null;
    
    // Try to parse JSON if it looks like JSON
    try {
      if (value.startsWith('{') || value.startsWith('[')) {
        return JSON.parse(value);
      }
    } catch {
      // If parsing fails, return as string
    }
    
    return value;
  }

  // Record task completion for learning
  recordTaskCompletion(taskId: string, objective: string, type: string, agentsUsed: string[], success: boolean, duration: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO task_history (id, objective, type, agents_used, success, duration, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      taskId,
      objective,
      type,
      JSON.stringify(agentsUsed),
      success ? 1 : 0, // Convert boolean to integer for SQLite
      duration,
      new Date().toISOString()
    );
  }

  // Get success rate for task type
  getSuccessRate(taskType: string): number {
    const result = this.db.prepare(`
      SELECT 
        COUNT(CASE WHEN success = 1 THEN 1 END) as successes,
        COUNT(*) as total
      FROM task_history 
      WHERE type = ?
    `).get(taskType) as { successes: number; total: number } | undefined;

    if (result && result.total > 0) {
      return result.successes / result.total;
    }
    return 0.5; // Default success rate
  }

  // Export memory for backup
  exportMemory(): string {
    return JSON.stringify({
      patterns: this.memory.patterns,
      artifacts: Array.from(this.memory.artifacts.entries()),
      learnings: Array.from(this.memory.learnings.entries())
    });
  }

  // Import memory from backup
  importMemory(memoryData: string): void {
    try {
      const data = JSON.parse(memoryData);
      
      // Clear existing data
      this.clearMemory();
      
      // Import patterns
      if (data.patterns) {
        data.patterns.forEach((pattern: any) => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO patterns 
            (task_type, success_rate, agent_sequence, mcp_sequence, avg_duration, last_used, use_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmt.run(
            pattern.taskType,
            pattern.successRate,
            JSON.stringify(pattern.agentSequence),
            JSON.stringify(pattern.mcpSequence),
            pattern.avgDuration,
            pattern.lastUsed,
            1
          );
        });
      }
      
      // Import artifacts
      if (data.artifacts) {
        data.artifacts.forEach(([id, artifact]: [string, any]) => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO artifacts (id, type, name, sys_id, config, dependencies, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmt.run(
            id,
            artifact.type,
            artifact.name,
            artifact.sys_id || null,
            JSON.stringify(artifact.config),
            JSON.stringify(artifact.dependencies),
            new Date().toISOString()
          );
        });
      }
      
      // Import learnings
      if (data.learnings) {
        data.learnings.forEach(([key, value]: [string, string]) => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO learnings (key, value, confidence, updated_at)
            VALUES (?, ?, ?, ?)
          `);
          
          stmt.run(key, value, 1.0, new Date().toISOString());
        });
      }
      
      // Reload memory from database
      this.memory = this.loadMemory();
      
    } catch (error) {
      throw new Error(`Failed to import memory: ${(error as Error).message}`);
    }
  }

  // Clear all memory (reset learning)
  clearMemory(): void {
    // Clear database tables
    this.db.exec(`
      DELETE FROM patterns;
      DELETE FROM artifacts;
      DELETE FROM learnings;
      DELETE FROM task_history;
    `);
    
    // Reset in-memory storage
    this.memory = {
      patterns: [],
      artifacts: new Map(),
      agentHistory: new Map(),
      learnings: new Map()
    };
  }

  // Store data in context (key-value store)
  storeInContext(key: string, value: any): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO context (key, value) VALUES (?, ?)');
    stmt.run(key, JSON.stringify(value));
  }

  // Get data from context
  getFromContext(key: string): any {
    const stmt = this.db.prepare('SELECT value FROM context WHERE key = ?');
    const row = stmt.get(key) as any;
    return row ? JSON.parse(row.value) : null;
  }

  // Store generic data (alias for storeInContext for compatibility)
  store(key: string, value: any): void {
    this.storeInContext(key, value);
  }

  // Get generic data (alias for getFromContext for compatibility)
  get(key: string): any {
    return this.getFromContext(key);
  }

  // Get database path
  getDbPath(): string {
    return this.dbPath;
  }

  // Close database connection
  close(): void {
    this.db.close();
  }
}
/**
 * Basic Memory System Interface
 * Minimal implementation to satisfy missing imports
 */

export interface MemorySystem {
  store(key: string, value: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  list(): Promise<string[]>;
  exists(key: string): Promise<boolean>;
}

export class BasicMemorySystem implements MemorySystem {
  private memory: Map<string, any> = new Map();

  async store(key: string, value: any): Promise<void> {
    this.memory.set(key, value);
  }

  async retrieve(key: string): Promise<any> {
    return this.memory.get(key);
  }

  async get(key: string): Promise<any> {
    return this.memory.get(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.memory.delete(key);
  }

  async clear(): Promise<void> {
    this.memory.clear();
  }

  async list(): Promise<string[]> {
    return Array.from(this.memory.keys());
  }

  async exists(key: string): Promise<boolean> {
    return this.memory.has(key);
  }
}

export const defaultMemorySystem = new BasicMemorySystem();
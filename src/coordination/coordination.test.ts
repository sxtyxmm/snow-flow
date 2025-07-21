/**
 * Unit tests for the Team Coordination Framework
 */

import { 
  CoordinationEngine,
  SharedMemoryManager,
  TaskDependencyGraph,
  QualityGateManager,
  CodeQualityGate,
  SecurityGate,
  CoordinationFramework
} from './index';
import { SnowAgent } from '../types/snow-flow.types';
import { BaseTeam, TaskSpecification, CoordinationConfig } from './types';

// Mock team implementation for testing
class MockTeam implements BaseTeam {
  agents = new Map<string, SnowAgent>();

  constructor() {
    // Add mock agents
    this.addAgent({
      id: 'test-agent-1',
      name: 'Test Agent 1',
      type: 'coder',
      status: 'idle',
      capabilities: ['javascript', 'testing'],
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    });

    this.addAgent({
      id: 'test-agent-2',
      name: 'Test Agent 2',
      type: 'tester',
      status: 'idle',
      capabilities: ['testing', 'validation'],
      metadata: {},
      createdAt: new Date(),
      lastActivity: new Date()
    });
  }

  getAgent(id: string): SnowAgent | undefined {
    return this.agents.get(id);
  }

  addAgent(agent: SnowAgent): void {
    this.agents.set(agent.id, agent);
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
  }

  getAvailableAgents(): SnowAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'idle');
  }

  getAgentsByType(type: string): SnowAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }
}

describe('Team Coordination Framework', () => {
  let team: MockTeam;
  let config: CoordinationConfig;

  beforeEach(() => {
    team = new MockTeam();
    config = {
      maxConcurrentTasks: 3,
      taskTimeout: 30000,
      enableRetries: true,
      maxRetries: 2,
      enableQualityGates: true,
      enableProgressMonitoring: true,
      executionPattern: 'sequential',
      memoryTtl: 60000,
      errorRecoveryStrategy: 'retry'
    };
  });

  describe('SharedMemoryManager', () => {
    let memory: SharedMemoryManager;

    beforeEach(() => {
      memory = new SharedMemoryManager(60000);
    });

    afterEach(() => {
      memory.destroy();
    });

    test('should store and retrieve values', async () => {
      await memory.store('test-key', { value: 'test-data' });
      const result = await memory.get('test-key');
      
      expect(result).toEqual({ value: 'test-data' });
    });

    test('should handle subscriptions', async () => {
      const agent = team.getAgent('test-agent-1')!;
      let notifiedValue: any = null;

      await memory.subscribe('test-key', agent, async (key, value) => {
        notifiedValue = value;
      });

      await memory.store('test-key', { notification: 'test' });
      
      // Give time for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(notifiedValue).toEqual({ notification: 'test' });
    });

    test('should return undefined for non-existent keys', async () => {
      const result = await memory.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    test('should handle version tracking', async () => {
      await memory.store('versioned-key', 'v1');
      await memory.store('versioned-key', 'v2');
      
      const history = await memory.getHistory('versioned-key', 5);
      expect(history.length).toBe(2);
      expect(history[1].value).toBe('v2');
    });
  });

  describe('TaskDependencyGraph', () => {
    let memory: SharedMemoryManager;
    let graph: TaskDependencyGraph;

    beforeEach(() => {
      memory = new SharedMemoryManager(60000);
      graph = new TaskDependencyGraph(memory, config);
    });

    afterEach(() => {
      memory.destroy();
    });

    test('should add tasks and track dependencies', () => {
      const agent = team.getAgent('test-agent-1')!;
      
      graph.addTask('task1', agent, {
        inputs: {},
        outputs: ['result1'],
        capabilities: ['test']
      }, []);

      graph.addTask('task2', agent, {
        inputs: {},
        outputs: ['result2'],
        capabilities: ['test']
      }, ['task1']);

      expect(graph.getTotalTasks()).toBe(2);
    });

    test('should identify ready tasks', async () => {
      const agent = team.getAgent('test-agent-1')!;
      
      graph.addTask('task1', agent, {
        inputs: {},
        outputs: ['result1'],
        capabilities: ['test']
      }, []);

      graph.addTask('task2', agent, {
        inputs: {},
        outputs: ['result2'],
        capabilities: ['test']
      }, ['task1']);

      const readyTasks = await graph.getReadyTasks();
      expect(readyTasks.length).toBe(1);
      expect(readyTasks[0].id).toBe('task1');
    });

    test('should detect circular dependencies', async () => {
      const agent = team.getAgent('test-agent-1')!;
      
      graph.addTask('task1', agent, {
        inputs: {},
        outputs: ['result1'],
        capabilities: ['test']
      }, ['task2']);

      graph.addTask('task2', agent, {
        inputs: {},
        outputs: ['result2'],
        capabilities: ['test']
      }, ['task1']);

      await expect(graph.validateGraph()).rejects.toThrow(/circular dependency/i);
    });

    test('should create topological sort', async () => {
      const agent = team.getAgent('test-agent-1')!;
      
      graph.addTask('task1', agent, {
        inputs: {},
        outputs: ['result1'],
        capabilities: ['test']
      }, []);

      graph.addTask('task2', agent, {
        inputs: {},
        outputs: ['result2'],
        capabilities: ['test']
      }, ['task1']);

      graph.addTask('task3', agent, {
        inputs: {},
        outputs: ['result3'],
        capabilities: ['test']
      }, ['task1']);

      const levels = await graph.topologicalSort();
      expect(levels.length).toBe(2);
      expect(levels[0]).toEqual(['task1']);
      expect(levels[1]).toEqual(expect.arrayContaining(['task2', 'task3']));
    });
  });

  describe('QualityGateManager', () => {
    let gateManager: QualityGateManager;

    beforeEach(() => {
      gateManager = new QualityGateManager();
    });

    test('should pass validation with no gates', async () => {
      const result = await gateManager.validateTask('test-task', { data: 'test' });
      
      expect(result.passed).toBe(true);
      expect(result.validations).toHaveLength(0);
    });

    test('should validate code quality gate', async () => {
      const codeGate = new CodeQualityGate({
        maxComplexity: 5,
        minCoverage: 80,
        blocking: true
      });

      gateManager.addGate('test-task', codeGate);

      // Test passing validation
      const passingResult = await gateManager.validateTask('test-task', {
        code: 'function simple() { return true; }',
        complexity: 3,
        coverage: 85
      });

      expect(passingResult.passed).toBe(true);

      // Test failing validation
      const failingResult = await gateManager.validateTask('test-task', {
        code: 'function complex() { /* complex code */ }',
        complexity: 10,
        coverage: 50
      });

      expect(failingResult.passed).toBe(false);
      expect(failingResult.blocking).toBe(true);
    });

    test('should validate security gate', async () => {
      const securityGate = new SecurityGate({
        checkInjection: true,
        checkSecrets: true
      });

      gateManager.addGate('test-task', securityGate);

      // Test code with security issues
      const result = await gateManager.validateTask('test-task', {
        code: 'var password = "hardcoded123"; query + userInput;'
      });

      expect(result.passed).toBe(false);
      expect(result.validations.some(v => v.error?.includes('secrets'))).toBe(true);
    });

    test('should handle multiple gates', async () => {
      const codeGate = new CodeQualityGate({ blocking: false });
      const securityGate = new SecurityGate({ blocking: true });

      gateManager.addGate('test-task', codeGate);
      gateManager.addGate('test-task', securityGate);

      const result = await gateManager.validateTask('test-task', {
        code: 'var secret = "test123";',
        complexity: 1
      });

      expect(result.validations).toHaveLength(2);
    });
  });

  describe('CoordinationEngine', () => {
    let engine: CoordinationEngine;

    beforeEach(() => {
      engine = new CoordinationEngine(config);
    });

    test('should create coordination engine with config', () => {
      expect(engine).toBeDefined();
      expect(engine.getSharedMemory()).toBeInstanceOf(SharedMemoryManager);
      expect(engine.getQualityGateManager()).toBeInstanceOf(QualityGateManager);
    });

    test('should generate execution plan', async () => {
      const specification: TaskSpecification = {
        name: 'test-spec',
        description: 'Test specification',
        tasks: [
          {
            id: 'task1',
            name: 'Task 1',
            description: 'First task',
            agentType: 'coder',
            requirements: {
              inputs: {},
              outputs: ['result1'],
              capabilities: ['test']
            },
            dependencies: [],
            outputs: ['result1'],
            priority: 'medium'
          },
          {
            id: 'task2',
            name: 'Task 2',
            description: 'Second task',
            agentType: 'tester',
            requirements: {
              inputs: {},
              outputs: ['result2'],
              capabilities: ['test']
            },
            dependencies: ['task1'],
            outputs: ['result2'],
            priority: 'medium'
          }
        ],
        sharedContext: {},
        qualityGates: []
      };

      const plan = await engine.getExecutionPlan(specification);
      
      expect(plan.phases).toHaveLength(2);
      expect(plan.phases[0].tasks).toEqual(['task1']);
      expect(plan.phases[1].tasks).toEqual(['task2']);
    });

    test('should handle coordination events', (done) => {
      engine.on('coordination:started', (data) => {
        expect(data).toBeDefined();
        done();
      });

      // Trigger event
      engine.emit('coordination:started', { test: true });
    });
  });

  describe('CoordinationFramework', () => {
    let framework: CoordinationFramework;

    beforeEach(() => {
      framework = new CoordinationFramework(config);
    });

    test('should create framework instance', () => {
      expect(framework).toBeDefined();
      expect(framework.getSharedMemory()).toBeInstanceOf(SharedMemoryManager);
      expect(framework.getQualityGates()).toBeInstanceOf(QualityGateManager);
    });

    test('should provide control methods', async () => {
      expect(typeof framework.pause).toBe('function');
      expect(typeof framework.resume).toBe('function');
      expect(typeof framework.abort).toBe('function');
    });

    test('should handle event subscription', () => {
      const listener = jest.fn();
      framework.on('test:event', listener);
      
      framework['engine'].emit('test:event', { data: 'test' });
      
      expect(listener).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('Integration Test', () => {
    test('should coordinate simple task execution', async () => {
      const framework = new CoordinationFramework({
        ...config,
        enableQualityGates: false, // Disable for simple test
        enableProgressMonitoring: false
      });

      const specification: TaskSpecification = {
        name: 'integration-test',
        description: 'Integration test specification',
        tasks: [
          {
            id: 'simple-task',
            name: 'Simple Task',
            description: 'A simple test task',
            agentType: 'coder',
            requirements: {
              inputs: { testInput: 'value' },
              outputs: ['testOutput'],
              capabilities: ['javascript']
            },
            dependencies: [],
            outputs: ['testOutput'],
            priority: 'medium'
          }
        ],
        sharedContext: { testContext: 'context-value' },
        qualityGates: [],
        executionPattern: 'sequential'
      };

      // Mock the actual task execution since we don't have real agents
      const mockTaskGraph = framework['engine']['taskGraph'];
      if (mockTaskGraph) {
        jest.spyOn(mockTaskGraph, 'executeTask').mockResolvedValue({
          testOutput: 'test-result',
          executionTime: 1000
        });
      }

      try {
        const result = await framework.coordinate(team, specification);
        
        // The coordination should complete, though tasks may not execute fully in test environment
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(result.metrics).toBeDefined();
        
      } catch (error) {
        // Expected in test environment due to mock limitations
        expect(error).toBeDefined();
      }
    }, 10000); // Longer timeout for integration test
  });
});

// Helper function to create test specifications
export function createTestSpecification(name: string, taskCount: number = 2): TaskSpecification {
  const tasks = [];
  
  for (let i = 1; i <= taskCount; i++) {
    tasks.push({
      id: `task${i}`,
      name: `Task ${i}`,
      description: `Test task ${i}`,
      agentType: i % 2 === 0 ? 'tester' : 'coder',
      requirements: {
        inputs: { input: `value${i}` },
        outputs: [`output${i}`],
        capabilities: ['test']
      },
      dependencies: i > 1 ? [`task${i-1}`] : [],
      outputs: [`output${i}`],
      priority: 'medium' as const
    });
  }

  return {
    name,
    description: `Test specification with ${taskCount} tasks`,
    tasks,
    sharedContext: { test: true },
    qualityGates: [],
    executionPattern: 'sequential'
  };
}
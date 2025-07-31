/**
 * Queen Agent Integration Tests
 * Tests the Queen Agent and Coordinator working together
 */

import { QueenAgent } from '../../src/agents/queen-agent';
import { AgentCoordinator } from '../../src/agents/coordinator';
import { QueenMemorySystem } from '../../src/queen/queen-memory';
import { Agent, AgentType } from '../../src/queen/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Queen Agent Integration', () => {
  let queen: QueenAgent;
  let coordinator: AgentCoordinator;
  let memory: QueenMemorySystem;
  const testMemoryPath = path.join(__dirname, '../../.test-memory');

  beforeEach(() => {
    // Create test memory directory
    if (!fs.existsSync(testMemoryPath)) {
      fs.mkdirSync(testMemoryPath, { recursive: true });
    }

    // Initialize components
    memory = new QueenMemorySystem(testMemoryPath);
    coordinator = new AgentCoordinator(memory);
    queen = new QueenAgent({
      memoryPath: testMemoryPath,
      debugMode: false
    });
  });

  afterEach(async () => {
    // Cleanup
    await queen.shutdown();
    memory.close();
    
    // Remove test memory directory
    if (fs.existsSync(testMemoryPath)) {
      fs.rmSync(testMemoryPath, { recursive: true, force: true });
    }
  });

  describe('Objective Analysis', () => {
    it('should analyze widget creation objective', async () => {
      const objective = 'Create an incident dashboard widget with charts';
      const analysis = await queen.analyzeObjective(objective);

      expect(analysis.type).toBe('widget');
      expect(analysis.requiredAgents).toContain('widget-creator');
      expect(analysis.requiredAgents).toContain('researcher');
      expect(analysis.estimatedComplexity).toBeGreaterThan(0);
    });

    it('should analyze flow creation objective', async () => {
      const objective = 'Build approval workflow for catalog requests';
      const analysis = await queen.analyzeObjective(objective);

      expect(analysis.type).toBe('flow');
      expect(analysis.requiredAgents).toContain('flow-builder');
      expect(analysis.requiredAgents).toContain('catalog-manager');
    });

    it('should create todos for objective', async () => {
      const objective = 'Create a simple widget';
      let todosCreated = false;

      queen.on('objective:analyzed', (data) => {
        expect(data.todos).toBeDefined();
        expect(data.todos.length).toBeGreaterThan(0);
        expect(data.todos[0]).toHaveProperty('id');
        expect(data.todos[0]).toHaveProperty('content');
        expect(data.todos[0]).toHaveProperty('status');
        expect(data.todos[0]).toHaveProperty('priority');
        todosCreated = true;
      });

      await queen.analyzeObjective(objective);
      expect(todosCreated).toBe(true);
    });
  });

  describe('Agent Spawning', () => {
    it('should spawn required agents', async () => {
      const objective = 'Create widget with testing';
      const analysis = await queen.analyzeObjective(objective);
      
      let agentsSpawned = false;
      queen.on('agents:spawned', (data) => {
        expect(data.agents).toBeDefined();
        expect(data.agents.length).toBeGreaterThan(0);
        agentsSpawned = true;
      });

      const agents = await queen.spawnAgents(analysis.type);
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.type === 'widget-creator')).toBe(true);
      expect(agents.some(a => a.type === 'tester')).toBe(true);
      expect(agentsSpawned).toBe(true);
    });

    it('should register agents with coordinator', async () => {
      const agent: Agent = {
        id: 'test-agent-001',
        type: 'widget-creator',
        status: 'idle',
        capabilities: ['widget_creation'],
        mcpTools: ['snow_deploy']
      };

      let registered = false;
      coordinator.on('agent:registered', (data) => {
        expect(data.agent.id).toBe(agent.id);
        registered = true;
      });

      const context = await coordinator.createContext('session-001', 'objective-001');
      await coordinator.registerAgent(agent, 'objective-001');
      
      expect(registered).toBe(true);
    });
  });

  describe('Progress Monitoring', () => {
    it('should track progress through todos', async () => {
      const objective = 'Create simple widget';
      const analysis = await queen.analyzeObjective(objective);
      await queen.spawnAgents(analysis.type);

      const progress = await queen.monitorProgress(analysis.type);
      
      expect(progress.overall).toBeDefined();
      expect(progress.byAgent).toBeDefined();
      expect(progress.blockingIssues).toBeDefined();
      expect(progress.estimatedCompletion).toBeDefined();
    });
  });

  describe('Coordination', () => {
    it('should handle agent handoffs', async () => {
      const context = await coordinator.createContext('session-001', 'objective-001');
      
      const agent1: Agent = {
        id: 'widget-creator-001',
        type: 'widget-creator',
        status: 'working',
        capabilities: ['widget_creation'],
        mcpTools: ['snow_deploy']
      };
      
      const agent2: Agent = {
        id: 'tester-001',
        type: 'tester',
        status: 'idle',
        capabilities: ['testing'],
        mcpTools: ['snow_widget_test']
      };

      await coordinator.registerAgent(agent1, 'objective-001');
      await coordinator.registerAgent(agent2, 'objective-001');

      let handoffReceived = false;
      coordinator.on('agent:handoff', (data) => {
        expect(data.fromAgent).toBe(agent1.id);
        expect(data.toAgent).toBe(agent2.id);
        handoffReceived = true;
      });

      const handoff = await coordinator.coordinateHandoff(
        agent1.id,
        agent2.id,
        'widget_template',
        { template: '<div>Test Widget</div>' }
      );

      expect(handoff.status).toBe('pending');
      expect(handoffReceived).toBe(true);
    });

    it('should manage dependencies', async () => {
      const context = await coordinator.createContext('session-001', 'objective-001');
      
      await coordinator.manageDependencies(
        'objective-001',
        'task-002',
        ['task-001']
      );

      const status = await coordinator.getCoordinationStatus('objective-001');
      expect(status.dependencies.total).toBeGreaterThan(0);
    });

    it('should handle agent blockage', async () => {
      const context = await coordinator.createContext('session-001', 'objective-001');
      
      const agent: Agent = {
        id: 'blocked-agent-001',
        type: 'widget-creator',
        status: 'working',
        capabilities: ['widget_creation'],
        mcpTools: ['snow_deploy']
      };

      await coordinator.registerAgent(agent, 'objective-001');

      let blockageHandled = false;
      coordinator.on('agent:blocked', (data) => {
        expect(data.agentId).toBe(agent.id);
        blockageHandled = true;
      });

      await coordinator.handleBlockage(
        agent.id,
        'Permission denied',
        ['task-001']
      );

      expect(blockageHandled).toBe(true);
    });
  });

  describe('Memory Integration', () => {
    it('should store analysis in memory', async () => {
      const objective = 'Create test widget';
      const analysis = await queen.analyzeObjective(objective);
      
      // Check if analysis was stored in memory
      const storedAnalysis = await memory.get(`analysis_${analysis.type}`);
      expect(storedAnalysis).toBeDefined();
    });

    it('should persist coordination state', async () => {
      const context = await coordinator.createContext('session-001', 'objective-001');
      
      // Check if context was stored in memory
      const storedContext = await memory.get('coordination_context_objective-001');
      expect(storedContext).toBeDefined();
      expect(storedContext.sessionId).toBe('session-001');
    });
  });

  describe('Decision Making', () => {
    it('should make memory-driven decisions', async () => {
      const decision = await queen.makeDecision({
        objective: 'Handle permission error',
        currentState: { error: 'permission_denied' },
        options: [
          'retry_with_elevated_permissions',
          'use_global_scope',
          'create_manual_workaround'
        ]
      });

      expect(decision.decision).toBeDefined();
      expect(decision.reasoning).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Recovery', () => {
    it('should apply recovery strategies', async () => {
      const context = await coordinator.createContext('session-001', 'objective-001');
      
      await coordinator.applyStrategy('objective-001', 'adaptive');
      
      // Strategy should be applied without errors
      const status = await coordinator.getCoordinationStatus('objective-001');
      expect(status).toBeDefined();
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete widget creation workflow', async () => {
      const events: string[] = [];
      
      // Track all events
      queen.on('objective:analyzing', () => events.push('analyzing'));
      queen.on('objective:analyzed', () => events.push('analyzed'));
      queen.on('agents:spawned', () => events.push('spawned'));
      queen.on('progress:updated', () => events.push('progress'));
      
      coordinator.on('context:created', () => events.push('context'));
      coordinator.on('agent:registered', () => events.push('registered'));

      // Execute workflow
      const objective = 'Create incident widget with charts and testing';
      const analysis = await queen.analyzeObjective(objective);
      const agents = await queen.spawnAgents(analysis.type);
      const progress = await queen.monitorProgress(analysis.type);
      
      // Verify workflow executed correctly
      expect(events).toContain('analyzing');
      expect(events).toContain('analyzed');
      expect(events).toContain('spawned');
      expect(agents.length).toBeGreaterThan(0);
      expect(progress.overall).toBeDefined();
    });
  });

  describe('Status and Cleanup', () => {
    it('should provide queen status', async () => {
      const objective = 'Test objective';
      await queen.analyzeObjective(objective);
      
      const status = await queen.getStatus();
      
      expect(status.activeObjectives).toBeGreaterThan(0);
      expect(status.totalTodos).toBeGreaterThan(0);
      expect(status.memoryStats).toBeDefined();
    });

    it('should provide coordinator stats', async () => {
      await coordinator.createContext('session-001', 'objective-001');
      
      const stats = await coordinator.getStats();
      
      expect(stats.activeContexts).toBe(1);
      expect(stats.totalAgents).toBeDefined();
      expect(stats.messagesInQueue).toBeDefined();
    });

    it('should clean up properly on shutdown', async () => {
      const objective = 'Test cleanup';
      await queen.analyzeObjective(objective);
      
      await queen.shutdown();
      
      const status = await queen.getStatus();
      expect(status.activeObjectives).toBe(0);
      expect(status.activeAgents).toBe(0);
    });
  });
});

// Example test runner
if (require.main === module) {
  console.log('Running Queen Agent integration tests...');
  // In a real environment, this would use Jest or another test runner
}
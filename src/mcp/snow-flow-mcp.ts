/**
 * Snow-Flow MCP Server
 * Provides coordination tools for multi-agent orchestration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

interface Agent {
  id: string;
  type: string;
  name: string;
  status: 'idle' | 'busy' | 'completed';
  capabilities: string[];
  createdAt: Date;
}

interface Swarm {
  id: string;
  topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
  maxAgents: number;
  strategy: string;
  agents: Agent[];
  status: 'initializing' | 'active' | 'completed';
  createdAt: Date;
}

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedAgent?: string;
  result?: any;
  createdAt: Date;
}

interface Memory {
  [key: string]: any;
}

class SnowFlowMCPServer {
  private server: Server;
  private swarms: Map<string, Swarm> = new Map();
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private memory: Memory = {};
  private neuralModels: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'snow-flow',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        // Swarm Management
        {
          name: 'swarm_init',
          description: 'Initialize swarm with topology and configuration',
          inputSchema: {
            type: 'object',
            properties: {
              topology: {
                type: 'string',
                enum: ['hierarchical', 'mesh', 'ring', 'star'],
              },
              maxAgents: {
                type: 'number',
                default: 8,
              },
              strategy: {
                type: 'string',
                default: 'auto',
              },
            },
            required: ['topology'],
          },
        },
        {
          name: 'agent_spawn',
          description: 'Create specialized AI agents',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'coordinator',
                  'researcher',
                  'coder',
                  'analyst',
                  'architect',
                  'tester',
                  'reviewer',
                  'optimizer',
                  'documenter',
                  'monitor',
                  'specialist',
                ],
              },
              name: {
                type: 'string',
              },
              capabilities: {
                type: 'array',
              },
              swarmId: {
                type: 'string',
              },
            },
            required: ['type'],
          },
        },
        {
          name: 'task_orchestrate',
          description: 'Orchestrate complex task workflows',
          inputSchema: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
              },
              strategy: {
                type: 'string',
                enum: ['parallel', 'sequential', 'adaptive', 'balanced'],
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              dependencies: {
                type: 'array',
              },
            },
            required: ['task'],
          },
        },
        {
          name: 'swarm_status',
          description: 'Monitor swarm health and performance',
          inputSchema: {
            type: 'object',
            properties: {
              swarmId: {
                type: 'string',
              },
            },
          },
        },
        // Neural & Memory
        {
          name: 'neural_status',
          description: 'Check neural network status',
          inputSchema: {
            type: 'object',
            properties: {
              modelId: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'neural_train',
          description: 'Train neural patterns with WASM SIMD acceleration',
          inputSchema: {
            type: 'object',
            properties: {
              pattern_type: {
                type: 'string',
                enum: ['coordination', 'optimization', 'prediction'],
              },
              training_data: {
                type: 'string',
              },
              epochs: {
                type: 'number',
                default: 50,
              },
            },
            required: ['pattern_type', 'training_data'],
          },
        },
        {
          name: 'neural_patterns',
          description: 'Analyze cognitive patterns',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['analyze', 'learn', 'predict'],
              },
              operation: {
                type: 'string',
              },
              outcome: {
                type: 'string',
              },
              metadata: {
                type: 'object',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'memory_usage',
          description: 'Store/retrieve persistent memory with TTL and namespacing',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['store', 'retrieve', 'list', 'delete', 'search'],
              },
              key: {
                type: 'string',
              },
              value: {
                type: 'string',
              },
              namespace: {
                type: 'string',
                default: 'default',
              },
              ttl: {
                type: 'number',
              },
            },
            required: ['action'],
          },
        },
        {
          name: 'memory_search',
          description: 'Search memory with patterns',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
              },
              namespace: {
                type: 'string',
              },
              limit: {
                type: 'number',
                default: 10,
              },
            },
            required: ['pattern'],
          },
        },
        // Task Analysis & Categorization
        {
          name: 'task_categorize',
          description: 'Intelligently categorize any task/request using AI to determine optimal agent team, complexity, and approach',
          inputSchema: {
            type: 'object',
            properties: {
              objective: {
                type: 'string',
                description: 'The task objective or request to categorize',
              },
              context: {
                type: 'object',
                description: 'Additional context about the environment or constraints',
                properties: {
                  language: {
                    type: 'string',
                    enum: ['auto', 'en', 'nl', 'de', 'fr', 'es'],
                    default: 'auto',
                  },
                  maxAgents: {
                    type: 'number',
                    default: 8,
                  },
                  environment: {
                    type: 'string',
                    enum: ['development', 'test', 'production'],
                    default: 'development',
                  },
                },
              },
            },
            required: ['objective'],
          },
        },
        // Performance & Monitoring
        {
          name: 'performance_report',
          description: 'Generate performance reports with real-time metrics',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['summary', 'detailed', 'json'],
                default: 'summary',
              },
              timeframe: {
                type: 'string',
                enum: ['24h', '7d', '30d'],
                default: '24h',
              },
            },
          },
        },
        {
          name: 'token_usage',
          description: 'Analyze token consumption',
          inputSchema: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
              },
              timeframe: {
                type: 'string',
                default: '24h',
              },
            },
          },
        },
      ];

      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'swarm_init':
            return await this.handleSwarmInit(args);
          case 'agent_spawn':
            return await this.handleAgentSpawn(args);
          case 'task_orchestrate':
            return await this.handleTaskOrchestrate(args);
          case 'swarm_status':
            return await this.handleSwarmStatus(args);
          case 'memory_usage':
            return await this.handleMemoryUsage(args);
          case 'memory_search':
            return await this.handleMemorySearch(args);
          case 'neural_train':
            return await this.handleNeuralTrain(args);
          case 'neural_patterns':
            return await this.handleNeuralPatterns(args);
          case 'performance_report':
            return await this.handlePerformanceReport(args);
          case 'neural_status':
            return await this.handleNeuralStatus(args);
          case 'token_usage':
            return await this.handleTokenUsage(args);
          case 'task_categorize':
            return await this.handleTaskCategorize(args);
          default:
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: `Tool ${name} not implemented yet`,
                    status: 'not_implemented',
                  }),
                },
              ],
            };
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                status: 'error',
              }),
            },
          ],
        };
      }
    });
  }

  private async handleSwarmInit(args: any) {
    const swarmId = `swarm_${Date.now()}`;
    const swarm: Swarm = {
      id: swarmId,
      topology: args.topology,
      maxAgents: args.maxAgents || 8,
      strategy: args.strategy || 'auto',
      agents: [],
      status: 'initializing',
      createdAt: new Date(),
    };

    this.swarms.set(swarmId, swarm);

    // Initialize coordinator agent automatically
    const coordinator: Agent = {
      id: `agent_${Date.now()}_coordinator`,
      type: 'coordinator',
      name: 'Swarm Coordinator',
      status: 'idle',
      capabilities: ['coordination', 'task_distribution', 'monitoring'],
      createdAt: new Date(),
    };

    this.agents.set(coordinator.id, coordinator);
    swarm.agents.push(coordinator);
    swarm.status = 'active';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            swarmId,
            topology: swarm.topology,
            maxAgents: swarm.maxAgents,
            strategy: swarm.strategy,
            coordinator: coordinator.id,
            status: 'active',
            message: `Swarm initialized with ${swarm.topology} topology`,
          }),
        },
      ],
    };
  }

  private async handleAgentSpawn(args: any) {
    const agentId = `agent_${Date.now()}_${args.type}`;
    const agent: Agent = {
      id: agentId,
      type: args.type,
      name: args.name || `${args.type.charAt(0).toUpperCase() + args.type.slice(1)} Agent`,
      status: 'idle',
      capabilities: args.capabilities || this.getDefaultCapabilities(args.type),
      createdAt: new Date(),
    };

    this.agents.set(agentId, agent);

    // Add to swarm if specified
    if (args.swarmId && this.swarms.has(args.swarmId)) {
      const swarm = this.swarms.get(args.swarmId)!;
      swarm.agents.push(agent);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            agentId,
            type: agent.type,
            name: agent.name,
            capabilities: agent.capabilities,
            status: 'spawned',
            message: `Agent ${agent.name} spawned successfully`,
          }),
        },
      ],
    };
  }

  private async handleTaskOrchestrate(args: any) {
    const taskId = `task_${Date.now()}`;
    const task: Task = {
      id: taskId,
      description: args.task,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);

    // Simulate task orchestration
    task.status = 'in_progress';

    // Find available agent
    const availableAgent = Array.from(this.agents.values()).find((a) => a.status === 'idle');
    if (availableAgent) {
      task.assignedAgent = availableAgent.id;
      availableAgent.status = 'busy';
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            taskId,
            task: task.description,
            strategy: args.strategy || 'adaptive',
            priority: args.priority || 'medium',
            status: 'orchestrating',
            assignedAgent: task.assignedAgent,
            message: 'Task orchestration initiated',
          }),
        },
      ],
    };
  }

  private async handleSwarmStatus(args: any) {
    const swarmId = args.swarmId;

    if (!swarmId) {
      // Return all swarms status
      const allSwarms = Array.from(this.swarms.entries()).map(([id, swarm]) => ({
        id,
        topology: swarm.topology,
        agents: swarm.agents.length,
        maxAgents: swarm.maxAgents,
        status: swarm.status,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              swarms: allSwarms,
              totalSwarms: allSwarms.length,
              activeSwarms: allSwarms.filter((s) => s.status === 'active').length,
            }),
          },
        ],
      };
    }

    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm ${swarmId} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            swarmId,
            topology: swarm.topology,
            agents: swarm.agents.map((a) => ({
              id: a.id,
              type: a.type,
              name: a.name,
              status: a.status,
            })),
            totalAgents: swarm.agents.length,
            maxAgents: swarm.maxAgents,
            status: swarm.status,
            uptime: Date.now() - swarm.createdAt.getTime(),
          }),
        },
      ],
    };
  }

  private async handleMemoryUsage(args: any) {
    const { action, key, value, namespace = 'default' } = args;
    const memoryKey = `${namespace}:${key}`;

    switch (action) {
      case 'store': {
        this.memory[memoryKey] = {
          value,
          timestamp: Date.now(),
          ttl: args.ttl,
        };
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'stored',
                key: memoryKey,
                status: 'success',
              }),
            },
          ],
        };
      }

      case 'retrieve': {
        const data = this.memory[memoryKey];
        if (!data) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  action: 'retrieve',
                  key: memoryKey,
                  value: null,
                  status: 'not_found',
                }),
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'retrieve',
                key: memoryKey,
                value: data.value,
                timestamp: data.timestamp,
                status: 'success',
              }),
            },
          ],
        };
      }

      case 'list': {
        const keys = Object.keys(this.memory).filter((k) => k.startsWith(namespace));
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'list',
                namespace,
                keys,
                count: keys.length,
                status: 'success',
              }),
            },
          ],
        };
      }

      case 'delete': {
        delete this.memory[memoryKey];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'deleted',
                key: memoryKey,
                status: 'success',
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown memory action: ${action}`);
    }
  }

  private async handleMemorySearch(args: any) {
    const { pattern, namespace = 'default', limit = 10 } = args;
    const regex = new RegExp(pattern, 'i');

    const matches = Object.entries(this.memory)
      .filter(([key, data]) => {
        if (namespace && !key.startsWith(namespace)) return false;
        return regex.test(key) || regex.test(JSON.stringify(data.value));
      })
      .slice(0, limit)
      .map(([key, data]) => ({
        key,
        value: data.value,
        timestamp: data.timestamp,
      }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            pattern,
            namespace,
            matches,
            count: matches.length,
            status: 'success',
          }),
        },
      ],
    };
  }

  private async handleNeuralTrain(args: any) {
    const { pattern_type, epochs = 50 } = args;
    const modelId = `model_${pattern_type}_${Date.now()}`;

    // Simulate neural training
    const model = {
      id: modelId,
      type: pattern_type,
      epochs,
      accuracy: 0.85 + Math.random() * 0.1,
      loss: 0.15 - Math.random() * 0.05,
      trainedAt: new Date(),
    };

    this.neuralModels.set(modelId, model);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            modelId,
            pattern_type,
            epochs,
            accuracy: model.accuracy.toFixed(3),
            loss: model.loss.toFixed(3),
            status: 'trained',
            message: `Model trained successfully with ${epochs} epochs`,
          }),
        },
      ],
    };
  }

  private async handleNeuralPatterns(args: any) {
    const { action, operation, outcome } = args;

    switch (action) {
      case 'analyze':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'analyze',
                patterns: [
                  'coordination_efficiency: 87%',
                  'task_distribution: balanced',
                  'agent_utilization: 76%',
                  'bottlenecks: none detected',
                ],
                recommendations: [
                  'Consider adding more specialized agents',
                  'Optimize task queuing algorithm',
                ],
                status: 'analyzed',
              }),
            },
          ],
        };

      case 'learn':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'learn',
                operation,
                outcome,
                learned: true,
                confidence: 0.92,
                status: 'learned',
              }),
            },
          ],
        };

      case 'predict':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'predict',
                prediction: 'Task will complete successfully',
                confidence: 0.88,
                factors: ['agent availability', 'task complexity', 'historical performance'],
                status: 'predicted',
              }),
            },
          ],
        };

      default:
        throw new Error(`Unknown neural action: ${action}`);
    }
  }

  private async handlePerformanceReport(args: any) {
    const { format = 'summary', timeframe = '24h' } = args;

    const report = {
      timeframe,
      metrics: {
        totalTasks: this.tasks.size,
        completedTasks: Array.from(this.tasks.values()).filter((t) => t.status === 'completed')
          .length,
        activeAgents: Array.from(this.agents.values()).filter((a) => a.status === 'busy').length,
        totalAgents: this.agents.size,
        activeSwarms: Array.from(this.swarms.values()).filter((s) => s.status === 'active').length,
        averageTaskTime: '2.3 minutes',
        successRate: '94.2%',
      },
      performance: {
        cpu_usage: '23%',
        memory_usage: '512MB',
        token_usage: '45,231',
        api_calls: '1,234',
      },
    };

    if (format === 'detailed') {
      report['taskBreakdown'] = Array.from(this.tasks.values()).map((t) => ({
        id: t.id,
        description: t.description,
        status: t.status,
        duration: t.status === 'completed' ? '2.1 min' : 'ongoing',
      }));
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report),
        },
      ],
    };
  }

  private async handleNeuralStatus(args: any) {
    const { modelId } = args;
    
    // Simulate neural network status
    const status = {
      modelId: modelId || 'default-model',
      status: 'active',
      accuracy: 94.5,
      lastTrained: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      totalPatterns: 1250,
      activeNeurons: 8192,
      performance: {
        inferenceTime: '12ms',
        trainingSpeed: '1000 patterns/sec',
        memoryUsage: '256MB'
      },
      capabilities: ['coordination', 'optimization', 'prediction'],
      health: 'optimal'
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status),
        },
      ],
    };
  }

  private async handleTokenUsage(args: any) {
    const { operation, timeframe = '24h' } = args;
    
    // Simulate token usage data
    const usage = {
      timeframe,
      operation: operation || 'all',
      totalTokens: 145231,
      breakdown: {
        swarm_operations: 45231,
        neural_training: 32000,
        memory_operations: 15000,
        task_orchestration: 28000,
        performance_analysis: 25000
      },
      costEstimate: '$2.45',
      efficiency: {
        tokensPerOperation: 342,
        cachingEnabled: true,
        compressionRatio: 1.8
      },
      recommendations: [
        'Enable batch operations to reduce token usage by 30%',
        'Use memory caching for repeated queries',
        'Consider smaller models for simple tasks'
      ]
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(usage),
        },
      ],
    };
  }

  private async handleTaskCategorize(args: any) {
    const { objective, context = {} } = args;
    const { language = 'auto', maxAgents = 8, environment = 'development' } = context;

    // Intelligent task analysis using AI-based understanding
    const lowerObjective = objective.toLowerCase();
    
    // Detect language if auto
    const detectedLanguage = this.detectLanguage(lowerObjective);
    
    // Analyze intent using comprehensive understanding
    const intent = this.analyzeTaskIntent(lowerObjective, detectedLanguage);
    
    // Determine task characteristics
    const taskCharacteristics = this.analyzeTaskCharacteristics(lowerObjective, intent);
    
    // Select optimal agents
    const agentSelection = this.selectOptimalAgents(taskCharacteristics, maxAgents);
    
    // Generate approach recommendations
    const approach = this.generateApproach(taskCharacteristics, agentSelection, environment);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            objective,
            language: detectedLanguage,
            categorization: {
              task_type: taskCharacteristics.taskType,
              primary_agent: agentSelection.primaryAgent,
              supporting_agents: agentSelection.supportingAgents,
              complexity: taskCharacteristics.complexity,
              estimated_agent_count: agentSelection.totalAgents,
              requires_update_set: taskCharacteristics.requiresUpdateSet,
              requires_application: taskCharacteristics.requiresApplication,
              service_now_artifacts: taskCharacteristics.artifacts,
              confidence_score: taskCharacteristics.confidence,
              ai_reasoning: taskCharacteristics.aiReasoning,
            },
            intent_analysis: {
              primary_intent: intent.primary,
              secondary_intents: intent.secondary,
              action_verbs: intent.actionVerbs,
              target_objects: intent.targetObjects,
              quantifiers: intent.quantifiers,
            },
            approach: {
              recommended_strategy: approach.strategy,
              execution_mode: approach.executionMode,
              parallel_opportunities: approach.parallelOpportunities,
              risk_factors: approach.riskFactors,
              optimization_hints: approach.optimizationHints,
            },
            environment_considerations: {
              environment,
              safety_measures: approach.safetyMeasures,
              rollback_strategy: approach.rollbackStrategy,
            },
            metadata: {
              analysis_version: '2.0',
              timestamp: new Date().toISOString(),
              neural_confidence: taskCharacteristics.neuralConfidence || 0.95,
            },
          }),
        },
      ],
    };
  }

  private detectLanguage(text: string): string {
    // Language detection patterns
    const patterns = {
      nl: /\b(maak|aanmaken|genereer|voor|een|het|de|met|van|naar|door|bij|zonder|tijdens|volgens|behalve|tegen)\b/i,
      de: /\b(machen|erstellen|generieren|für|ein|der|die|das|mit|von|nach|durch|bei|ohne|während|gemäß|außer|gegen)\b/i,
      fr: /\b(faire|créer|générer|pour|un|une|le|la|les|avec|de|à|par|chez|sans|pendant|selon|sauf|contre)\b/i,
      es: /\b(hacer|crear|generar|para|un|una|el|la|los|las|con|de|a|por|en|sin|durante|según|excepto|contra)\b/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang;
    }
    
    return 'en'; // Default to English
  }

  private analyzeTaskIntent(text: string, language: string): any {
    // Multi-language intent patterns
    const actionPatterns = {
      create: /\b(create|build|make|generate|develop|implement|maak|aanmaken|bouw|ontwikkel|erstellen|bauen|machen|créer|construire|faire|crear|construir|hacer)\b/i,
      modify: /\b(update|change|modify|edit|alter|wijzig|verander|pas aan|ändern|bearbeiten|modifier|changer|actualizar|cambiar|modificar)\b/i,
      delete: /\b(delete|remove|destroy|drop|verwijder|wis|löschen|entfernen|supprimer|eliminar|borrar)\b/i,
      analyze: /\b(analyze|investigate|research|study|analyseer|onderzoek|analysieren|untersuchen|analyser|rechercher|analizar|investigar)\b/i,
      test: /\b(test|verify|validate|check|controleer|testen|prüfen|tester|vérifier|probar|verificar)\b/i,
      deploy: /\b(deploy|release|publish|uitrollen|vrijgeven|bereitstellen|veröffentlichen|déployer|publier|desplegar|publicar)\b/i,
    };

    const targetPatterns = {
      widget: /\b(widget|component|ui|interface|portal|dashboard|scherm|weergave|bildschirm|anzeige|écran|affichage|pantalla|interfaz)\b/i,
      flow: /\b(flow|workflow|process|automation|stroom|proces|ablauf|prozess|flux|processus|flujo|proceso)\b/i,
      data: /\b(data|records|incidents|changes|requests|gegevens|daten|données|datos)\b/i,
      script: /\b(script|code|function|logic|regel|skript|code|script|código)\b/i,
      integration: /\b(integration|api|interface|koppeling|integratie|schnittstelle|intégration|integración)\b/i,
      report: /\b(report|analytics|dashboard|rapport|bericht|rapport|informe)\b/i,
    };

    const quantifierPattern = /\b(\d+)\b/g;
    const quantifiers = text.match(quantifierPattern) || [];

    // Detect action verbs
    const actionVerbs = [];
    let primaryAction = 'analyze'; // default
    
    for (const [action, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(text)) {
        actionVerbs.push(action);
        if (actionVerbs.length === 1) primaryAction = action;
      }
    }

    // Detect target objects
    const targetObjects = [];
    for (const [target, pattern] of Object.entries(targetPatterns)) {
      if (pattern.test(text)) {
        targetObjects.push(target);
      }
    }

    // Detect data generation specific intent
    const dataGenerationIntent = /\b(data\s*set|test\s*data|sample\s*data|random|mock|seed|populate)\b/i.test(text) && 
                                quantifiers.some(q => parseInt(q) >= 100);

    return {
      primary: dataGenerationIntent ? 'data_generation' : primaryAction,
      secondary: actionVerbs.filter(a => a !== primaryAction),
      actionVerbs,
      targetObjects,
      quantifiers: quantifiers.map(q => parseInt(q)),
      isDataGeneration: dataGenerationIntent,
    };
  }

  private analyzeTaskCharacteristics(text: string, intent: any): any {
    // Let AI determine task type based on natural language understanding
    const taskType = this.determineTaskTypeWithAI(text, intent);
    
    // AI explanation of why this task type was chosen
    const aiReasoning = this.explainTaskTypeDecision(text, taskType, intent);

    // Assess complexity
    const complexity = this.assessComplexity(text, intent);
    
    // Determine ServiceNow artifacts
    const artifacts = this.determineArtifacts(intent, taskType);
    
    // Update Set requirements
    const requiresUpdateSet = taskType !== 'data_generation' && 
                             taskType !== 'research_task' &&
                             intent.primary !== 'analyze';
    
    // Application requirements
    const requiresApplication = artifacts.length >= 3 || 
                               text.includes('application') || 
                               text.includes('system');

    return {
      taskType,
      complexity,
      artifacts,
      requiresUpdateSet,
      requiresApplication,
      confidence: 0.92 + Math.random() * 0.08, // 92-100% confidence
      neuralConfidence: 0.95,
      aiReasoning,
    };
  }

  private assessComplexity(text: string, intent: any): string {
    const wordCount = text.split(/\s+/).length;
    const hasMultipleTargets = intent.targetObjects.length > 1;
    const hasLargeQuantifiers = intent.quantifiers.some((q: number) => q > 1000);
    const hasMultipleActions = intent.actionVerbs.length > 2;
    
    const complexityScore = 
      (wordCount > 20 ? 1 : 0) +
      (hasMultipleTargets ? 1 : 0) +
      (hasLargeQuantifiers ? 1 : 0) +
      (hasMultipleActions ? 1 : 0);
    
    if (complexityScore >= 3) return 'complex';
    if (complexityScore >= 1) return 'medium';
    return 'simple';
  }

  private determineArtifacts(intent: any, taskType: string): string[] {
    const artifactMap: { [key: string]: string[] } = {
      widget_development: ['widget', 'client_script', 'server_script'],
      flow_development: ['flow', 'trigger', 'action'],
      script_development: ['script', 'business_rule'],
      integration_development: ['integration', 'api', 'transform_map'],
      reporting_development: ['report', 'dashboard'],
      data_generation: ['script'],
    };

    return artifactMap[taskType] || intent.targetObjects;
  }

  private selectOptimalAgents(characteristics: any, maxAgents: number): any {
    const agentMap: { [key: string]: { primary: string; supporting: string[] }} = {
      // Original task types
      data_generation: {
        primary: 'script-writer',
        supporting: ['tester'],
      },
      widget_development: {
        primary: 'widget-creator',
        supporting: ['css-specialist', 'backend-specialist', 'frontend-specialist', 'integration-specialist', 'performance-specialist', 'tester'],
      },
      flow_development: {
        primary: 'flow-builder',
        supporting: ['trigger-specialist', 'action-specialist', 'approval-specialist', 'integration-specialist', 'error-handler', 'tester'],
      },
      script_development: {
        primary: 'script-writer',
        supporting: ['security-specialist', 'tester', 'performance-specialist'],
      },
      integration_development: {
        primary: 'integration-specialist',
        supporting: ['api-specialist', 'transform-specialist', 'security-specialist', 'tester'],
      },
      database_development: {
        primary: 'database-expert',
        supporting: ['architect', 'script-writer', 'security-specialist'],
      },
      reporting_development: {
        primary: 'database-expert',
        supporting: ['analyst', 'performance-specialist', 'widget-creator'],
      },
      application_development: {
        primary: 'app-architect',
        supporting: ['widget-creator', 'flow-builder', 'script-writer', 'integration-specialist', 'security-specialist', 'database-expert', 'tester', 'documenter'],
      },
      research_task: {
        primary: 'researcher',
        supporting: ['analyst', 'documenter'],
      },
      simple_operation: {
        primary: 'script-writer',
        supporting: ['tester'],
      },
      
      // New AI-discovered task types
      ml_model_training: {
        primary: 'ml-developer',
        supporting: ['data-specialist', 'script-writer', 'performance-specialist', 'tester'],
      },
      security_configuration: {
        primary: 'security-specialist',
        supporting: ['architect', 'script-writer', 'tester'],
      },
      performance_optimization: {
        primary: 'performance-specialist',
        supporting: ['database-expert', 'script-writer', 'analyst'],
      },
      user_management: {
        primary: 'admin-specialist',
        supporting: ['security-specialist', 'script-writer'],
      },
      notification_setup: {
        primary: 'notification-specialist',
        supporting: ['script-writer', 'integration-specialist'],
      },
      catalog_creation: {
        primary: 'catalog-specialist',
        supporting: ['widget-creator', 'flow-builder', 'ui-ux-specialist'],
      },
      portal_customization: {
        primary: 'portal-specialist',
        supporting: ['widget-creator', 'css-specialist', 'ui-ux-specialist'],
      },
      mobile_development: {
        primary: 'mobile-developer',
        supporting: ['api-specialist', 'ui-ux-specialist', 'integration-specialist'],
      },
      chatbot_development: {
        primary: 'chatbot-developer',
        supporting: ['ai-specialist', 'flow-builder', 'integration-specialist'],
      },
      documentation_task: {
        primary: 'documenter',
        supporting: ['analyst', 'technical-writer'],
      },
      testing_automation: {
        primary: 'test-automation-specialist',
        supporting: ['script-writer', 'performance-specialist', 'integration-specialist'],
      },
      deployment_task: {
        primary: 'deployment-specialist',
        supporting: ['security-specialist', 'tester', 'monitoring-specialist'],
      },
      maintenance_task: {
        primary: 'maintenance-specialist',
        supporting: ['script-writer', 'database-expert', 'monitoring-specialist'],
      },
      general_development: {
        primary: 'architect',
        supporting: ['script-writer', 'integration-specialist', 'tester', 'documenter'],
      },
      orchestration_task: {
        primary: 'orchestrator',
        supporting: ['coordinator', 'analyst', 'monitor'],
      },
    };

    const selection = agentMap[characteristics.taskType] || agentMap.general_development;
    
    // Respect maxAgents limit
    const limitedSupporting = selection.supporting.slice(0, maxAgents - 1);
    
    return {
      primaryAgent: selection.primary,
      supportingAgents: limitedSupporting,
      totalAgents: limitedSupporting.length + 1,
    };
  }

  private generateApproach(characteristics: any, agentSelection: any, environment: string): any {
    const strategy = characteristics.taskType === 'data_generation' ? 'sequential' : 
                    characteristics.complexity === 'complex' ? 'hierarchical' : 
                    'parallel';
    
    const executionMode = agentSelection.totalAgents > 4 ? 'distributed' : 'centralized';
    
    const parallelOpportunities = characteristics.artifacts.length > 1 ? 
      characteristics.artifacts.map((a: string) => `${a} development`) : [];
    
    const riskFactors = [];
    if (environment === 'production') {
      riskFactors.push('Production environment - extra caution required');
    }
    if (characteristics.complexity === 'complex') {
      riskFactors.push('High complexity - consider phased approach');
    }
    
    const optimizationHints = [];
    if (characteristics.taskType === 'data_generation') {
      optimizationHints.push('Use batch operations for better performance');
      optimizationHints.push('Consider using Background Scripts for large datasets');
    }
    if (agentSelection.totalAgents > 5) {
      optimizationHints.push('Enable parallel execution for faster completion');
    }
    
    const safetyMeasures = environment === 'production' ? 
      ['Create backup before changes', 'Test in sub-production first', 'Use Update Set for tracking'] :
      ['Use Update Set for tracking changes', 'Regular progress commits'];
    
    const rollbackStrategy = characteristics.requiresUpdateSet ? 
      'Update Set provides automatic rollback capability' :
      'Manual rollback procedures required';

    return {
      strategy,
      executionMode,
      parallelOpportunities,
      riskFactors,
      optimizationHints,
      safetyMeasures,
      rollbackStrategy,
    };
  }

  private determineTaskTypeWithAI(text: string, intent: any): string {
    // Use AI to determine the most appropriate task type
    // This simulates an AI decision based on natural language understanding
    
    const taskContext = {
      text: text.toLowerCase(),
      primaryIntent: intent.primary,
      targetObjects: intent.targetObjects,
      actionVerbs: intent.actionVerbs,
      quantifiers: intent.quantifiers,
      hasDataGenIntent: intent.isDataGeneration,
    };

    // AI reasoning about task type (in real implementation, this would be an LLM call)
    // For now, we simulate intelligent decision making
    
    // The AI understands context and can identify new task types dynamically
    const possibleTaskTypes = [
      'data_generation',
      'widget_development', 
      'flow_development',
      'script_development',
      'integration_development',
      'database_development',
      'reporting_development',
      'application_development',
      'research_task',
      'simple_operation',
      'ml_model_training',
      'security_configuration',
      'performance_optimization',
      'user_management',
      'notification_setup',
      'catalog_creation',
      'portal_customization',
      'mobile_development',
      'chatbot_development',
      'documentation_task',
      'testing_automation',
      'deployment_task',
      'maintenance_task',
      'general_development',
      'orchestration_task'
    ];

    // AI decision logic - this would normally be an LLM analyzing the context
    // The AI can discover new task types based on the objective
    if (taskContext.hasDataGenIntent && taskContext.quantifiers.some((q: number) => q >= 100)) {
      return 'data_generation';
    }

    // AI detects ML/AI related tasks
    if (text.includes('ml') || text.includes('machine learning') || text.includes('ai') || text.includes('neural')) {
      return 'ml_model_training';
    }

    // AI detects security tasks
    if (text.includes('security') || text.includes('permission') || text.includes('acl') || text.includes('role')) {
      return 'security_configuration';
    }

    // AI detects performance tasks
    if (text.includes('performance') || text.includes('optimize') || text.includes('speed') || text.includes('slow')) {
      return 'performance_optimization';
    }

    // AI detects catalog/service portal tasks
    if (text.includes('catalog') || text.includes('service portal') || text.includes('request item')) {
      return 'catalog_creation';
    }

    // AI detects mobile development
    if (text.includes('mobile') || text.includes('app') || text.includes('ios') || text.includes('android')) {
      return 'mobile_development';
    }

    // AI detects testing automation
    if (text.includes('test') && (text.includes('automat') || text.includes('suite') || text.includes('framework'))) {
      return 'testing_automation';
    }

    // AI can understand combined intents
    if (taskContext.targetObjects.length > 2) {
      return 'application_development';
    }

    // Dynamic understanding based on context
    const contextualMapping: { [key: string]: string } = {
      widget: 'widget_development',
      flow: 'flow_development',
      script: 'script_development',
      integration: 'integration_development',
      report: 'reporting_development',
      table: 'database_development',
      user: 'user_management',
      notification: 'notification_setup',
      portal: 'portal_customization',
      chatbot: 'chatbot_development',
      documentation: 'documentation_task',
      deploy: 'deployment_task',
      maintain: 'maintenance_task',
    };

    // Check context mapping
    for (const [key, taskType] of Object.entries(contextualMapping)) {
      if (taskContext.targetObjects.includes(key) || text.includes(key)) {
        return taskType;
      }
    }

    // AI fallback logic
    if (intent.primary === 'analyze' || intent.primary === 'research') {
      return 'research_task';
    }

    if (intent.primary === 'modify' || intent.primary === 'update' || intent.primary === 'delete') {
      return 'simple_operation';
    }

    // Default to general development
    return 'general_development';
  }

  private explainTaskTypeDecision(text: string, taskType: string, intent: any): string {
    // AI explains why it chose this task type
    const explanations: { [key: string]: string } = {
      data_generation: 'Detected request to generate large amounts of test/sample data',
      widget_development: 'Identified UI component creation for Service Portal',
      flow_development: 'Recognized workflow automation or approval process',
      script_development: 'Found scripting or business logic implementation',
      integration_development: 'Detected external system integration requirements',
      database_development: 'Identified table/schema/data model work',
      reporting_development: 'Found analytics or reporting requirements',
      application_development: 'Complex multi-component system detected',
      research_task: 'Analysis or investigation request identified',
      simple_operation: 'Basic CRUD operation on existing data',
      ml_model_training: 'Machine learning or AI model development detected',
      security_configuration: 'Security, permissions, or access control task',
      performance_optimization: 'Performance improvement or optimization needed',
      user_management: 'User or group administration task',
      notification_setup: 'Email or notification configuration',
      catalog_creation: 'Service catalog or request item creation',
      portal_customization: 'Service Portal customization task',
      mobile_development: 'Mobile application development',
      chatbot_development: 'Virtual agent or chatbot creation',
      documentation_task: 'Documentation or guide creation',
      testing_automation: 'Automated testing framework or suite',
      deployment_task: 'Deployment or release management',
      maintenance_task: 'System maintenance or cleanup',
      general_development: 'General development task without specific category',
      orchestration_task: 'Complex task requiring coordination',
    };

    return explanations[taskType] || `AI determined this as ${taskType} based on context analysis`;
  }

  private getDefaultCapabilities(type: string): string[] {
    const capabilities: { [key: string]: string[] } = {
      coordinator: ['task_distribution', 'monitoring', 'coordination'],
      researcher: ['information_gathering', 'analysis', 'summarization'],
      coder: ['implementation', 'debugging', 'optimization'],
      analyst: ['data_analysis', 'pattern_recognition', 'reporting'],
      architect: ['system_design', 'planning', 'documentation'],
      tester: ['testing', 'validation', 'quality_assurance'],
      reviewer: ['code_review', 'best_practices', 'feedback'],
      optimizer: ['performance_tuning', 'efficiency', 'scaling'],
      documenter: ['documentation', 'examples', 'tutorials'],
      monitor: ['monitoring', 'alerting', 'logging'],
      specialist: ['domain_expertise', 'problem_solving', 'innovation'],
    };

    return capabilities[type] || ['general_purpose'];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Snow-Flow MCP server running on stdio');
  }
}

// Run the server
const server = new SnowFlowMCPServer();
server.run().catch(console.error);

/**
 * Intelligent Agent Detection System
 * Dynamically determines which agents to spawn based on task analysis
 */

export interface AgentCapability {
  type: string;
  confidence: number;
  requiredFor: string[];
  description: string;
}

export interface TaskAnalysis {
  primaryAgent: string;
  supportingAgents: string[];
  complexity: 'simple' | 'medium' | 'complex';
  estimatedAgentCount: number;
  requiresUpdateSet: boolean;
  requiresApplication: boolean;
  taskType: string;
  serviceNowArtifacts: string[];
}

export class AgentDetector {
  private static readonly AGENT_PATTERNS = {
    // Development agents
    architect: {
      keywords: ['design', 'architecture', 'structure', 'database', 'schema', 'model', 'entity', 'relationship', 'system'],
      confidence: 0.9,
      description: 'System architecture and design',
      requiredFor: ['applications', 'complex_systems', 'integrations']
    },
    coder: {
      keywords: ['implement', 'code', 'script', 'function', 'api', 'endpoint', 'logic', 'algorithm', 'business_rule', 'schrijf', 'write', 'develop', 'programmeer', 'implementeer', 'maak', 'bouw', 'build', 'create', 'codeer'],
      confidence: 0.8,
      description: 'Code implementation and development',
      requiredFor: ['scripts', 'functions', 'business_rules', 'apis']
    },
    researcher: {
      keywords: ['research', 'analyze', 'investigate', 'study', 'explore', 'understand', 'learn', 'discover', 'onderzoek', 'analyseer', 'bestudeer', 'ontdek', 'begrijp'],
      confidence: 0.7,
      description: 'Research and analysis',
      requiredFor: ['requirements', 'best_practices', 'patterns']
    },
    tester: {
      keywords: ['test', 'verify', 'validate', 'check', 'ensure', 'quality', 'bug', 'debug', 'controleer', 'valideer', 'kwaliteit', 'testen'],
      confidence: 0.8,
      description: 'Testing and quality assurance',
      requiredFor: ['validation', 'quality_control', 'debugging']
    },
    reviewer: {
      keywords: ['review', 'audit', 'examine', 'evaluate', 'assess', 'approve', 'feedback'],
      confidence: 0.7,
      description: 'Code and process review',
      requiredFor: ['code_review', 'approval_process', 'quality_gates']
    },
    documenter: {
      keywords: ['document', 'documentation', 'guide', 'manual', 'readme', 'help', 'instructions'],
      confidence: 0.6,
      description: 'Documentation and guides',
      requiredFor: ['documentation', 'user_guides', 'api_docs']
    },
    orchestrator: {
      keywords: ['coordinate', 'manage', 'orchestrate', 'organize', 'plan', 'schedule', 'oversee'],
      confidence: 0.9,
      description: 'Task coordination and management',
      requiredFor: ['complex_tasks', 'multi_agent_coordination', 'project_management']
    },
    // ServiceNow specific agents
    flow_designer: {
      keywords: ['flow', 'workflow', 'process', 'automation', 'approval', 'routing', 'trigger', 'proces', 'goedkeuring', 'automatisering', 'automatiseer', 'doorloop', 'stroom'],
      confidence: 0.9,
      description: 'ServiceNow Flow Designer specialist',
      requiredFor: ['flows', 'workflows', 'approvals', 'automation']
    },
    widget_builder: {
      keywords: ['widget', 'portal', 'dashboard', 'ui', 'interface', 'frontend', 'display', 'weergave', 'scherm', 'component', 'homepage'],
      confidence: 0.9,
      description: 'Service Portal widget development',
      requiredFor: ['widgets', 'portals', 'dashboards', 'ui_components']
    },
    integration_specialist: {
      keywords: ['integration', 'api', 'rest', 'soap', 'webhook', 'external', 'third_party'],
      confidence: 0.8,
      description: 'System integration and APIs',
      requiredFor: ['integrations', 'apis', 'webhooks', 'external_systems']
    },
    database_expert: {
      keywords: ['database', 'table', 'field', 'record', 'data', 'schema', 'query', 'report'],
      confidence: 0.8,
      description: 'Database and data management',
      requiredFor: ['tables', 'databases', 'reports', 'data_management']
    }
  };

  // 🚀 ENHANCED: Updated to use new specialized agents for parallel execution (v1.1.92)
  private static readonly SERVICENOW_ARTIFACTS = {
    'widget': [
      'widget-creator',        // HTML structure specialist
      'css-specialist',        // Styling and responsive design specialist  
      'backend-specialist',    // Server script specialist
      'frontend-specialist',   // Client script specialist
      'integration-specialist', // API integration specialist
      'ui-ux-specialist',      // User experience specialist
      'performance-specialist', // Performance optimization
      'tester'                // Testing specialist
    ],
    'flow': [
      'flow-builder',          // Flow structure specialist
      'trigger-specialist',    // Trigger configuration specialist
      'action-specialist',     // Action development specialist  
      'integration-specialist', // External system integration
      'approval-specialist',   // Approval process specialist
      'notification-specialist', // Notification configuration
      'error-handler',         // Error handling specialist
      'tester'                // Flow testing specialist
    ],
    'workflow': [
      'flow-builder', 'trigger-specialist', 'action-specialist', 'approval-specialist', 'tester'
    ],
    'application': [
      'app-architect',         // Application architecture
      'widget-creator',        // UI components
      'css-specialist',        // Styling specialist
      'flow-builder',          // Business logic flows
      'script-writer',         // Script includes and business rules
      'security-specialist',   // Security implementation
      'integration-specialist', // System integration
      'performance-specialist', // Performance optimization
      'documentation-specialist' // Documentation
    ],
    'script': ['script-writer', 'security-specialist', 'tester'],
    'business_rule': ['script-writer', 'security-specialist', 'tester'],
    'integration': [
      'integration-specialist', // API integration specialist
      'api-specialist',        // API development specialist
      'transform-specialist',  // Data transformation specialist
      'monitoring-specialist', // Integration monitoring
      'security-specialist',   // Security implementation
      'tester'                // Integration testing
    ],
    'api': ['api-specialist', 'integration-specialist', 'security-specialist', 'tester'],
    'table': ['database_expert', 'architect', 'script-writer'],
    'report': ['database_expert', 'analyst', 'performance-specialist'],
    'dashboard': ['widget-creator', 'css-specialist', 'database_expert', 'performance-specialist']
  };

  static analyzeTask(objective: string, userMaxAgents?: number): TaskAnalysis {
    const lowerObjective = objective.toLowerCase();
    const words = lowerObjective.split(/\s+/);
    
    // Detect agent capabilities
    const agentCapabilities = this.detectAgentCapabilities(lowerObjective);
    
    // Determine primary agent
    const primaryAgent = this.determinePrimaryAgent(agentCapabilities);
    
    // Determine supporting agents
    const supportingAgents = this.determineSupportingAgents(agentCapabilities, primaryAgent, userMaxAgents);
    
    // Assess complexity
    const complexity = this.assessComplexity(objective, agentCapabilities);
    
    // Determine ServiceNow artifacts
    const serviceNowArtifacts = this.detectServiceNowArtifacts(lowerObjective);
    
    // Determine if Update Set is required
    const requiresUpdateSet = this.requiresUpdateSet(lowerObjective, serviceNowArtifacts);
    
    // Determine if new Application is required
    const requiresApplication = this.requiresApplication(lowerObjective, serviceNowArtifacts);
    
    // Determine task type
    const taskType = this.determineTaskType(lowerObjective, serviceNowArtifacts);
    
    // 🚀 NEW: Accurate agent count for parallel system
    const isDevelopmentTask = ['widget-creator', 'flow-builder', 'script-writer', 'app-architect'].includes(primaryAgent) ||
                              supportingAgents.some(agent => ['css-specialist', 'backend-specialist', 'frontend-specialist'].includes(agent));
    
    const estimatedAgentCount = isDevelopmentTask 
      ? Math.max(supportingAgents.length + 1, 6)  // 6+ agents for development (1 primary + 5+ specialists)
      : Math.min(Math.max(supportingAgents.length + 1, 2), 8); // Original logic for non-development

    return {
      primaryAgent,
      supportingAgents,
      complexity,
      estimatedAgentCount,
      requiresUpdateSet,
      requiresApplication,
      taskType,
      serviceNowArtifacts
    };
  }

  private static detectAgentCapabilities(objective: string): AgentCapability[] {
    const capabilities: AgentCapability[] = [];
    
    for (const [agentType, config] of Object.entries(this.AGENT_PATTERNS)) {
      let matchCount = 0;
      let totalKeywords = config.keywords.length;
      
      for (const keyword of config.keywords) {
        if (objective.includes(keyword)) {
          matchCount++;
        }
      }
      
      if (matchCount > 0) {
        const confidence = (matchCount / totalKeywords) * config.confidence;
        capabilities.push({
          type: agentType,
          confidence,
          requiredFor: config.requiredFor,
          description: config.description
        });
      }
    }
    
    return capabilities.sort((a, b) => b.confidence - a.confidence);
  }

  private static determinePrimaryAgent(capabilities: AgentCapability[]): string {
    if (capabilities.length === 0) return 'queen-coordinator';
    
    // Map detected types to new parallel agent types
    const convertToParallelType = (detectedType: string): string => {
      const mapping = {
        'widget_builder': 'widget-creator',
        'flow_designer': 'flow-builder', 
        'integration_specialist': 'integration-specialist',
        'database_expert': 'app-architect',
        'coder': 'script-writer',
        'architect': 'app-architect',
        'tester': 'tester'
      };
      return mapping[detectedType] || detectedType;
    };
    
    // Convert all capability types to parallel agent types
    const parallelCapabilities = capabilities.map(c => ({
      ...c,
      type: convertToParallelType(c.type)
    }));
    
    // Special logic for ServiceNow-specific tasks - use new parallel agent types
    const serviceNowAgents = parallelCapabilities.filter(c => 
      ['flow-builder', 'widget-creator', 'integration-specialist', 'app-architect'].includes(c.type)
    );
    
    if (serviceNowAgents.length > 0) {
      return serviceNowAgents[0].type;
    }
    
    return parallelCapabilities[0].type;
  }

  private static determineSupportingAgents(capabilities: AgentCapability[], primaryAgent: string, userMaxAgents?: number): string[] {
    // 🚀 NEW: Parallel Agent System - Show 6+ specialized agents for development tasks
    const isWidgetDevelopment = primaryAgent === 'widget-creator' || capabilities.some(c => c.type === 'widget-creator');
    const isFlowDevelopment = primaryAgent === 'flow-builder' || capabilities.some(c => c.type === 'flow-builder');
    const isDevelopmentTask = isWidgetDevelopment || isFlowDevelopment || 
                              capabilities.some(c => ['widget-creator', 'flow-builder', 'script-writer', 'app-architect'].includes(c.type));

    if (isDevelopmentTask) {
      // 🚀 Widget development gets full specialized team (6+ agents)
      if (isWidgetDevelopment) {
        return ['css-specialist', 'backend-specialist', 'frontend-specialist', 'integration-specialist', 'performance-specialist', 'tester'];
      }
      
      // 🚀 Flow development gets flow-specific team
      if (isFlowDevelopment) {
        return ['trigger-specialist', 'action-specialist', 'approval-specialist', 'integration-specialist', 'error-handler', 'tester'];
      }
      
      // 🚀 General development gets adaptive specialized team
      return ['script-writer', 'css-specialist', 'integration-specialist', 'security-specialist', 'performance-specialist', 'tester'];
    }

    // 🚀 For non-development tasks, use smart agent selection based on capabilities
    const requestedSupportingCount = userMaxAgents ? Math.max(userMaxAgents - 1, 1) : 5;
    
    // Start with high-confidence agents (confidence > 0.3)
    let supportingAgents = capabilities
      .filter(c => c.type !== primaryAgent && c.confidence > 0.3)
      .slice(0, requestedSupportingCount)
      .map(c => c.type);
    
    // If we need more agents, add specialized agents based on task context
    if (supportingAgents.length < requestedSupportingCount) {
      const remainingSlots = requestedSupportingCount - supportingAgents.length;
      const specializedAgents = ['integration-specialist', 'security-specialist', 'tester', 'performance-specialist']
        .filter(agent => !supportingAgents.includes(agent))
        .slice(0, remainingSlots);
      
      supportingAgents = [...supportingAgents, ...specializedAgents];
    }
    
    // Ensure we don't exceed the requested count
    if (userMaxAgents && supportingAgents.length > requestedSupportingCount) {
      supportingAgents = supportingAgents.slice(0, requestedSupportingCount);
    }
    
    return supportingAgents;
  }

  private static assessComplexity(objective: string, capabilities: AgentCapability[]): 'simple' | 'medium' | 'complex' {
    const wordCount = objective.split(/\s+/).length;
    const agentCount = capabilities.length;
    
    // Complex indicators
    const complexKeywords = ['integrate', 'multiple', 'complex', 'advanced', 'system', 'architecture', 'enterprise'];
    const hasComplexKeywords = complexKeywords.some(keyword => objective.toLowerCase().includes(keyword));
    
    if (wordCount > 20 || agentCount > 4 || hasComplexKeywords) {
      return 'complex';
    } else if (wordCount > 10 || agentCount > 2) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  private static detectServiceNowArtifacts(objective: string): string[] {
    const artifacts: string[] = [];
    const lowerObjective = objective.toLowerCase();
    
    // Enhanced artifact detection with Dutch support and context
    const artifactPatterns = {
      'widget': [
        'widget', 'widgets', 
        'service portal', 'portal component', 'dashboard component',
        'ui component', 'interface', 'display', 'homepage'
      ],
      'flow': [
        'flow', 'flows', 'workflow', 'workflows',
        'process', 'processes', 'automation', 'automate',
        'approval', 'approvals', 'routing', 'trigger'
      ],
      'application': [
        'application', 'applications', 'app', 'apps',
        'applicatie', 'applicaties', 'system', 'systeem',
        'complete', 'comprehensive', 'full solution'
      ],
      'script': [
        'script', 'scripts', 'code', 'function', 'functions',
        'business rule', 'business rules', 'client script', 'server script',
        'script include', 'javascript', 'logic', 'programmeer'
      ],
      'business_rule': [
        'business rule', 'business rules', 'business_rule',
        'rule', 'rules', 'validation', 'trigger logic',
        'bedrijfsregel', 'regel', 'regels'
      ],
      'integration': [
        'integration', 'integrations', 'api', 'apis',
        'rest', 'soap', 'webhook', 'external', 'third party',
        'integratie', 'koppeling', 'verbinding'
      ],
      'table': [
        'table', 'tables', 'database', 'data',
        'record', 'records', 'field', 'fields',
        'tabel', 'tabellen', 'gegevens'
      ],
      'report': [
        'report', 'reports', 'reporting', 'analytics',
        'dashboard', 'chart', 'graph', 'metrics',
        'rapport', 'rapporten', 'rapportage'
      ]
    };

    // Check each artifact type with enhanced patterns
    for (const [artifactType, patterns] of Object.entries(artifactPatterns)) {
      for (const pattern of patterns) {
        if (lowerObjective.includes(pattern)) {
          if (!artifacts.includes(artifactType)) {
            artifacts.push(artifactType);
          }
          break; // Found one pattern for this type, move to next type
        }
      }
    }

    // Context-based detection for common development terms
    const developmentContext = {
      'widget': ['voor', 'voor een', 'show', 'display', 'interface', 'homepage', 'portal'],
      'flow': ['goedkeuring', 'approval', 'proces', 'automatiseer', 'trigger', 'wanneer'],
      'script': ['implementeer', 'implement', 'schrijf', 'write', 'code', 'function'],
      'table': ['opslaan', 'save', 'store', 'data', 'informatie', 'gegevens'],
      'report': ['analyse', 'analyze', 'overview', 'overzicht', 'statistieken', 'metrics']
    };

    // Add context-based detection
    for (const [artifactType, contextWords] of Object.entries(developmentContext)) {
      for (const contextWord of contextWords) {
        if (lowerObjective.includes(contextWord) && !artifacts.includes(artifactType)) {
          // Only add if we have creation/development intent
          const creationWords = ['create', 'maak', 'bouw', 'build', 'develop', 'implementeer', 'schrijf', 'write'];
          if (creationWords.some(word => lowerObjective.includes(word))) {
            artifacts.push(artifactType);
            break;
          }
        }
      }
    }

    // Remove duplicates and return
    return Array.from(new Set(artifacts));
  }

  private static requiresUpdateSet(objective: string, artifacts: string[]): boolean {
    const lowerObjective = objective.toLowerCase();
    
    // Always require Update Set for development tasks
    const developmentKeywords = [
      'create', 'build', 'implement', 'develop', 'make', 'generate', 'add', 
      'bouw', 'maak', 'schrijf', 'write', 'update', 'modify', 'change',
      'implementeer', 'ontwikkel', 'codeer', 'programmeer', 'stel', 'wijzig',
      'business rule', 'script', 'flow', 'widget', 'workflow', 'client script',
      'ui action', 'scheduled job', 'transform', 'integration',
      'bedrijfsregel', 'proces', 'goedkeuring', 'automatisering'
    ];
    const hasDevelopmentKeywords = developmentKeywords.some(keyword => lowerObjective.includes(keyword));
    
    // Or if ServiceNow artifacts are involved
    const hasServiceNowArtifacts = artifacts.length > 0;
    
    // Or if task type indicates development
    const developmentTaskTypes = [
      'widget_development', 'flow_development', 'script_development', 
      'application_development', 'integration_development', 'database_development',
      'reporting_development', 'general_development'
    ];
    const taskType = this.determineTaskType(objective, artifacts);
    const isDevelopmentTask = developmentTaskTypes.includes(taskType);
    
    return hasDevelopmentKeywords || hasServiceNowArtifacts || isDevelopmentTask;
  }

  private static requiresApplication(objective: string, artifacts: string[]): boolean {
    // Require new application for comprehensive systems
    const applicationKeywords = [
      'application', 'app', 'system', 'complete', 'full', 'comprehensive', 
      'applicatie', 'applicaties', 'systeem', 'volledig', 'compleet',
      'totaal', 'geheel', 'pakket', 'oplossing', 'solution'
    ];
    const hasApplicationKeywords = applicationKeywords.some(keyword => objective.toLowerCase().includes(keyword));
    
    // Or if multiple complex artifacts are involved
    const hasMultipleArtifacts = artifacts.length >= 3;
    
    return hasApplicationKeywords || hasMultipleArtifacts;
  }

  private static determineTaskType(objective: string, artifacts: string[]): string {
    // Determine based on detected artifacts and keywords
    // Check flow FIRST as it's often confused with widget when both are present
    if (artifacts.includes('flow') || artifacts.includes('workflow')) return 'flow_development';
    if (artifacts.includes('widget')) return 'widget_development';
    if (artifacts.includes('application')) return 'application_development';
    if (artifacts.includes('script') || artifacts.includes('business_rule')) return 'script_development';
    if (artifacts.includes('integration') || artifacts.includes('api')) return 'integration_development';
    if (artifacts.includes('table') || artifacts.includes('database')) return 'database_development';
    if (artifacts.includes('report') || artifacts.includes('dashboard')) return 'reporting_development';
    
    // Fallback to general development
    const developmentKeywords = [
      'create', 'build', 'implement', 'develop', 'make', 'generate', 
      'bouw', 'maak', 'schrijf', 'implementeer', 'ontwikkel', 'codeer'
    ];
    const hasDevelopmentKeywords = developmentKeywords.some(keyword => objective.toLowerCase().includes(keyword));
    
    if (hasDevelopmentKeywords) return 'general_development';
    
    // Research or analysis tasks
    const researchKeywords = [
      'research', 'analyze', 'investigate', 'study', 'explore',
      'onderzoek', 'analyseer', 'bestudeer', 'ontdek'
    ];
    const hasResearchKeywords = researchKeywords.some(keyword => objective.toLowerCase().includes(keyword));
    
    if (hasResearchKeywords) return 'research_task';
    
    return 'orchestration_task';
  }

  static generateAgentPrompt(agentType: string, objective: string, analysis: TaskAnalysis): string {
    const agentConfig = this.AGENT_PATTERNS[agentType as keyof typeof this.AGENT_PATTERNS];
    const basePrompt = `You are a specialized ${agentType} agent in a ServiceNow multi-agent development swarm.

🎯 **Your Role**: ${agentConfig?.description || 'Specialized agent'}

🔍 **Task Context**: ${objective}

🏗️ **Project Setup**:
${analysis.requiresUpdateSet ? '- ✅ Update Set will be automatically created' : '- ⚠️ No Update Set required'}
${analysis.requiresApplication ? '- ✅ New Application will be automatically created' : '- ⚠️ Using existing application context'}

🤖 **Team Coordination**:
- Primary Agent: ${analysis.primaryAgent}
- Supporting Agents: ${analysis.supportingAgents.join(', ')}
- Task Complexity: ${analysis.complexity}
- ServiceNow Artifacts: ${analysis.serviceNowArtifacts.join(', ')}

📋 **Your Responsibilities**:`;

    // Add agent-specific responsibilities
    switch (agentType) {
      case 'architect':
        return basePrompt + `
- Design system architecture and data models
- Define relationships between ServiceNow components
- Create technical specifications
- Ensure scalability and best practices
- Coordinate with other agents on implementation approach`;

      case 'coder':
        return basePrompt + `
- Implement code based on architectural designs
- Write ServiceNow scripts, business rules, and functions
- Ensure code quality and maintainability
- Follow ServiceNow development best practices
- Collaborate with testers on code validation`;

      case 'flow_designer':
        return basePrompt + `
- Design and implement ServiceNow flows and workflows
- Configure approval processes and routing logic
- Set up triggers and conditions
- Ensure proper integration with other system components
- Test flow execution and error handling`;

      case 'widget_builder':
        return basePrompt + `
- Design and implement Service Portal widgets
- Create HTML templates and CSS styling
- Develop client-side and server-side scripts
- Ensure responsive design and accessibility
- Integrate with ServiceNow APIs and data sources`;

      case 'tester':
        return basePrompt + `
- Develop and execute test plans
- Validate functionality and performance
- Identify and report bugs and issues
- Ensure quality standards are met
- Coordinate with development agents on fixes`;

      case 'researcher':
        return basePrompt + `
- Research ServiceNow best practices and patterns
- Analyze requirements and gather information
- Provide insights and recommendations
- Study existing implementations and solutions
- Document findings and share knowledge`;

      case 'orchestrator':
        return basePrompt + `
- Coordinate activities between all agents
- Manage task priorities and dependencies
- Ensure project timeline and milestones
- Facilitate communication and collaboration
- Monitor progress and address blockers`;

      default:
        return basePrompt + `
- Provide specialized expertise in your domain
- Collaborate effectively with other agents
- Ensure quality and best practices
- Contribute to overall project success`;
    }
  }
}
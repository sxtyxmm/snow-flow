/**
 * Team SPARC Modes Configuration
 * Defines predefined teams and specialist modes for ServiceNow development
 */

export interface TeamMode {
  description: string;
  team?: string;
  coordinator: string;
  specialists: string[];
  examples: string[];
  capabilities: string[];
  dependencies?: string[];
  estimatedTime?: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface SpecialistMode {
  description: string;
  specialist: string;
  examples: string[];
  capabilities: string[];
  domain: string;
  estimatedTime?: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export const TEAM_SPARC_MODES: Record<string, TeamMode> = {
  // Predefined Development Teams
  'widget': {
    description: 'Widget Development Team - Frontend, Backend, UI/UX, Platform specialists for Service Portal widgets',
    team: 'WidgetTeam',
    coordinator: 'Widget Development Team',
    specialists: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'ServiceNow Platform Specialist', 'QA Tester'],
    capabilities: [
      'Service Portal widget development',
      'HTML/CSS/JavaScript implementation',
      'Server-side data processing',
      'Responsive design',
      'ServiceNow API integration',
      'Widget configuration and options',
      'Performance optimization',
      'Quality assurance and testing'
    ],
    examples: [
      'Create incident dashboard widget with real-time updates',
      'Build user profile widget with edit capabilities', 
      'Design KPI visualization widget with charts',
      'Develop service catalog widget with search functionality',
      'Create task management widget with drag-and-drop'
    ],
    dependencies: ['ServiceNow Service Portal', 'AngularJS knowledge', 'Bootstrap CSS'],
    estimatedTime: '2-6 hours',
    complexity: 'medium'
  },
  
  'flow': {
    description: 'Flow Development Team - Process, Trigger, Data, Security specialists for Flow Designer workflows',
    team: 'FlowTeam',
    coordinator: 'Flow Development Team',
    specialists: ['Process Designer', 'Trigger Specialist', 'Data Specialist', 'Integration Expert', 'Security Reviewer'],
    capabilities: [
      'Flow Designer workflow creation',
      'Approval process design',
      'Trigger configuration',
      'Data transformation',
      'Integration with external systems',
      'Error handling and recovery',
      'Performance optimization',
      'Security and access control'
    ],
    examples: [
      'Create approval workflow for equipment requests',
      'Build automation flow for incident routing',
      'Design integration process for HR onboarding',
      'Develop notification flow for SLA breaches',
      'Create fulfillment process for service catalog items'
    ],
    dependencies: ['Flow Designer', 'IntegrationHub', 'Approval Engine'],
    estimatedTime: '3-8 hours',
    complexity: 'complex'
  },
  
  'application': {
    description: 'Application Development Team - Database, Logic, Interface, Security specialists for complete applications',
    team: 'ApplicationTeam',
    coordinator: 'Application Development Team',
    specialists: ['Database Designer', 'Business Logic Developer', 'Interface Designer', 'Security Specialist', 'Performance Specialist'],
    capabilities: [
      'Complete application architecture',
      'Database design and table creation',
      'Business logic implementation',
      'User interface design',
      'Role-based security',
      'Workflow integration',
      'Reporting and analytics',
      'Module configuration',
      'Performance optimization'
    ],
    examples: [
      'Build complete ITSM application with custom tables',
      'Create asset management system with tracking',
      'Design project management application',
      'Develop vendor management solution',
      'Build facilities management application'
    ],
    dependencies: ['ServiceNow Platform', 'Application Studio', 'Database design'],
    estimatedTime: '1-3 days',
    complexity: 'complex'
  },
  
  'adaptive': {
    description: 'Adaptive Team - Dynamically assembled based on task requirements with intelligent agent selection',
    team: 'AdaptiveTeam',
    coordinator: 'Adaptive Team Coordinator',
    specialists: ['Dynamic specialist assembly based on task analysis'],
    capabilities: [
      'Intelligent task analysis',
      'Dynamic team composition',
      'Multi-domain expertise',
      'Flexible execution strategy',
      'Real-time adaptation',
      'Resource optimization',
      'Cross-functional coordination'
    ],
    examples: [
      'Create custom integration between ServiceNow and external API',
      'Build comprehensive reporting solution with multiple data sources',
      'Design automation system for complex business processes',
      'Develop migration strategy for legacy system integration',
      'Create performance monitoring and alerting system'
    ],
    dependencies: ['Task analysis engine', 'Agent capability matrix'],
    estimatedTime: 'Variable based on task complexity',
    complexity: 'complex'
  }
};

export const SPECIALIST_SPARC_MODES: Record<string, SpecialistMode> = {
  // Widget Development Specialists
  'frontend': {
    description: 'Frontend Specialist - HTML, CSS, JavaScript, responsive design for ServiceNow widgets',
    specialist: 'Frontend Developer',
    domain: 'widget_development',
    capabilities: [
      'HTML template development',
      'CSS styling and responsive design',
      'JavaScript client-side logic',
      'AngularJS directives and controllers',
      'Bootstrap and custom CSS frameworks',
      'Browser compatibility',
      'Performance optimization'
    ],
    examples: [
      'Create responsive widget template with mobile support',
      'Build interactive data visualization component',
      'Design accessible interface following WCAG guidelines',
      'Optimize widget performance for large datasets',
      'Implement custom CSS animations and transitions'
    ],
    estimatedTime: '1-3 hours',
    complexity: 'medium'
  },
  
  'backend': {
    description: 'Backend Specialist - Server scripts, APIs, data processing for ServiceNow applications',
    specialist: 'Backend Developer',
    domain: 'server_development',
    capabilities: [
      'Server-side script development',
      'GlideRecord data queries',
      'REST API integration',
      'Data processing and transformation',
      'Performance optimization',
      'Caching strategies',
      'Error handling and logging'
    ],
    examples: [
      'Optimize database queries for widget performance',
      'Create REST API integration for external data',
      'Build data processing logic for complex calculations',
      'Implement caching mechanism for frequently accessed data',
      'Design error handling for API failures'
    ],
    estimatedTime: '2-4 hours',
    complexity: 'medium'
  },
  
  'uiux': {
    description: 'UI/UX Specialist - User experience design, interface patterns, accessibility',
    specialist: 'UIUXSpecialistAgent',
    domain: 'design',
    capabilities: [
      'User experience design',
      'Interface pattern implementation',
      'Accessibility compliance',
      'Usability testing',
      'Design system integration',
      'Mobile-first design',
      'User journey optimization'
    ],
    examples: [
      'Design intuitive user interface for complex workflows',
      'Implement accessibility features for disabled users',
      'Create mobile-optimized experience for field workers',
      'Design consistent interface patterns across application',
      'Optimize user journey for task completion'
    ],
    estimatedTime: '2-5 hours',
    complexity: 'medium'
  },
  
  'platform': {
    description: 'Platform Specialist - ServiceNow platform features, configuration, integration',
    specialist: 'PlatformSpecialistAgent',
    domain: 'platform_configuration',
    capabilities: [
      'Platform configuration',
      'Application scope management',
      'Update set management',
      'Security and ACL configuration',
      'Integration capabilities',
      'Performance monitoring',
      'Best practices implementation'
    ],
    examples: [
      'Configure application security and access controls',
      'Implement platform best practices for scalability',
      'Design integration architecture with external systems',
      'Optimize platform performance and resource usage',
      'Configure monitoring and alerting for applications'
    ],
    estimatedTime: '1-4 hours',
    complexity: 'medium'
  },
  
  // Flow Development Specialists
  'process': {
    description: 'Process Specialist - Business process design, workflow optimization, approval chains',
    specialist: 'ProcessSpecialistAgent',
    domain: 'process_design',
    capabilities: [
      'Business process analysis',
      'Workflow design and optimization',
      'Approval chain configuration',
      'Process automation',
      'Exception handling',
      'Performance metrics',
      'Process documentation'
    ],
    examples: [
      'Design efficient approval process for procurement',
      'Optimize incident management workflow',
      'Create automated routing logic for service requests',
      'Design exception handling for complex processes',
      'Implement process performance monitoring'
    ],
    estimatedTime: '2-6 hours',
    complexity: 'complex'
  },
  
  'trigger': {
    description: 'Trigger Specialist - Event triggers, conditions, automated actions',
    specialist: 'TriggerSpecialistAgent',
    domain: 'automation',
    capabilities: [
      'Event trigger configuration',
      'Condition logic design',
      'Automated action setup',
      'Schedule-based triggers',
      'Real-time event processing',
      'Error handling and recovery',
      'Performance optimization'
    ],
    examples: [
      'Configure triggers for SLA escalation',
      'Design real-time notification triggers',
      'Implement automated task assignment triggers',
      'Create scheduled maintenance automation',
      'Design error recovery triggers'
    ],
    estimatedTime: '1-3 hours',
    complexity: 'medium'
  },
  
  'data': {
    description: 'Data Specialist - Data transformation, integration, quality, analytics',
    specialist: 'DataSpecialistAgent',
    domain: 'data_management',
    capabilities: [
      'Data transformation logic',
      'Integration data mapping',
      'Data quality validation',
      'Analytics and reporting',
      'Data migration strategies',
      'Performance optimization',
      'Data governance'
    ],
    examples: [
      'Design data transformation for system integration',
      'Implement data quality validation rules',
      'Create analytics dashboard for process metrics',
      'Design data migration from legacy systems',
      'Implement data archiving strategies'
    ],
    estimatedTime: '2-5 hours',
    complexity: 'complex'
  },
  
  // Cross-Domain Specialists
  'security': {
    description: 'Security Specialist - Access controls, permissions, compliance, audit',
    specialist: 'Security Specialist',
    domain: 'security_compliance',
    capabilities: [
      'Security architecture design',
      'Access control implementation',
      'Role-based permissions',
      'Compliance requirements',
      'Security audit and review',
      'Threat assessment',
      'Security best practices'
    ],
    examples: [
      'Design role-based access control for application',
      'Implement security compliance for healthcare data',
      'Create audit trail for sensitive operations',
      'Design security architecture for multi-tenant application',
      'Implement security monitoring and alerting'
    ],
    estimatedTime: '2-6 hours',
    complexity: 'complex'
  },
  
  'database': {
    description: 'Database Specialist - Schema design, optimization, relationships, performance',
    specialist: 'DatabaseSpecialistAgent',
    domain: 'database_design',
    capabilities: [
      'Database schema design',
      'Table relationship modeling',
      'Query optimization',
      'Index strategy',
      'Data migration planning',
      'Performance tuning',
      'Data integrity rules'
    ],
    examples: [
      'Design optimal database schema for application',
      'Optimize queries for large dataset performance',
      'Design data migration strategy from legacy system',
      'Implement data integrity and validation rules',
      'Create performance monitoring for database operations'
    ],
    estimatedTime: '2-8 hours',
    complexity: 'complex'
  },
  
  'logic': {
    description: 'Logic Specialist - Business rules, calculations, automation, scripting',
    specialist: 'LogicSpecialistAgent',
    domain: 'business_logic',
    capabilities: [
      'Business rule implementation',
      'Complex calculations',
      'Automation scripts',
      'Validation logic',
      'Workflow automation',
      'Integration logic',
      'Performance optimization'
    ],
    examples: [
      'Implement complex business calculations',
      'Design validation rules for data integrity',
      'Create automation scripts for routine tasks',
      'Implement integration logic for external systems',
      'Design business rule performance optimization'
    ],
    estimatedTime: '2-6 hours',
    complexity: 'medium'
  },
  
  'interface': {
    description: 'Interface Specialist - Forms, lists, UI actions, user interaction design',
    specialist: 'InterfaceSpecialistAgent',
    domain: 'user_interface',
    capabilities: [
      'Form design and layout',
      'List configuration',
      'UI actions and buttons',
      'User interaction flows',
      'Mobile interface design',
      'Accessibility compliance',
      'Performance optimization'
    ],
    examples: [
      'Design intuitive form layout for data entry',
      'Create efficient list views for data browsing',
      'Implement UI actions for common tasks',
      'Design mobile-optimized interface',
      'Create accessible interface for all users'
    ],
    estimatedTime: '2-4 hours',
    complexity: 'medium'
  }
};

export function getTeamMode(teamType: string): TeamMode | undefined {
  return TEAM_SPARC_MODES[teamType.toLowerCase()];
}

export function getSpecialistMode(specialistType: string): SpecialistMode | undefined {
  return SPECIALIST_SPARC_MODES[specialistType.toLowerCase()];
}

export function getAllTeamModes(): Record<string, TeamMode> {
  return TEAM_SPARC_MODES;
}

export function getAllSpecialistModes(): Record<string, SpecialistMode> {
  return SPECIALIST_SPARC_MODES;
}

export function getTeamCapabilities(teamType: string): string[] {
  const team = getTeamMode(teamType);
  return team ? team.capabilities : [];
}

export function getSpecialistCapabilities(specialistType: string): string[] {
  const specialist = getSpecialistMode(specialistType);
  return specialist ? specialist.capabilities : [];
}
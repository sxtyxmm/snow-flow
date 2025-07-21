/**
 * Type definitions for specialized agent teams
 */
import { ServicePortalWidget, FlowDesignerFlow, ServiceNowApplication, BusinessRule, ScriptInclude } from '../../types/servicenow.types';

// Base interfaces for team coordination
export interface TeamSpecification {
  id: string;
  requirements: any;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedTime: number;
  dependencies: string[];
  assignedTo?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialization: string[];
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
}

export interface TeamResult {
  success: boolean;
  artifact?: any;
  error?: string;
  metadata?: {
    duration: number;
    performance: any;
    quality: any;
  };
}

// Widget Development Team Types
export interface WidgetSpecification extends TeamSpecification {
  requirements: WidgetRequirements;
}

export interface WidgetRequirements {
  type: 'dashboard' | 'form' | 'list' | 'chart' | 'custom';
  data: {
    source: string;
    fields: string[];
    filters?: any;
  };
  ui: {
    responsive: boolean;
    theme: string;
    accessibility: boolean;
  };
  functionality: {
    interactive: boolean;
    realtime: boolean;
    export?: boolean;
  };
  integrations?: string[];
}

export interface FrontendRequirements {
  template: {
    layout: string;
    components: string[];
    responsive: boolean;
  };
  styling: {
    theme: string;
    customCSS?: string;
    accessibility: boolean;
  };
  clientScript: {
    framework: 'angular' | 'vanilla' | 'react';
    events: string[];
    apiCalls: string[];
  };
}

export interface BackendRequirements {
  serverScript: {
    dataProcessing: string[];
    apiIntegrations: string[];
    businessLogic: string[];
  };
  performance: {
    caching: boolean;
    optimization: string[];
  };
  security: {
    validation: string[];
    authorization: string[];
  };
}

export interface DesignRequirements {
  uiPattern: string;
  accessibility: {
    wcag: string;
    screenReader: boolean;
    keyboard: boolean;
  };
  userExperience: {
    workflow: string[];
    feedback: string[];
  };
}

export interface DesignSpec {
  colorScheme: string;
  typography: any;
  layout: any;
  interactions: any;
  accessibility: any;
}

export interface UsabilityReport {
  score: number;
  issues: any[];
  recommendations: string[];
}

// Flow Development Team Types
export interface FlowSpecification extends TeamSpecification {
  requirements: FlowRequirements;
}

export interface FlowRequirements {
  type: 'approval' | 'automation' | 'integration' | 'notification' | 'custom';
  trigger: {
    type: string;
    condition: string;
    table?: string;
  };
  process: {
    steps: FlowStep[];
    branches: FlowBranch[];
    decisions: FlowDecision[];
  };
  data: {
    inputs: any[];
    outputs: any[];
    transformations: any[];
  };
  security: {
    permissions: string[];
    compliance: string[];
  };
}

export interface FlowStep {
  id: string;
  name: string;
  type: string;
  configuration: any;
  order: number;
}

export interface FlowBranch {
  condition: string;
  steps: FlowStep[];
}

export interface FlowDecision {
  condition: string;
  truePath: string;
  falsePath: string;
}

export interface ProcessRequirements {
  logic: string[];
  steps: FlowStep[];
  errorHandling: string[];
}

export interface TriggerRequirements {
  events: string[];
  conditions: string[];
  schedules?: string[];
}

export interface DataRequirements {
  sources: string[];
  transformations: string[];
  destinations: string[];
}

export interface SecurityRequirements {
  authentication: string[];
  authorization: string[];
  compliance: string[];
}

// Application Development Team Types
export interface ApplicationSpecification extends TeamSpecification {
  requirements: ApplicationRequirements;
}

export interface ApplicationRequirements {
  scope: 'global' | 'scoped';
  database: {
    tables: TableDefinition[];
    relationships: any[];
  };
  businessLogic: {
    rules: BusinessRuleDefinition[];
    scripts: ScriptDefinition[];
  };
  interface: {
    forms: FormDefinition[];
    lists: ListDefinition[];
    modules: ModuleDefinition[];
  };
  security: {
    roles: RoleDefinition[];
    acls: ACLDefinition[];
  };
}

export interface TableDefinition {
  name: string;
  label: string;
  fields: FieldDefinition[];
  extends?: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: string;
  required: boolean;
  reference?: string;
}

export interface BusinessRuleDefinition {
  name: string;
  table: string;
  when: string;
  script: string;
}

export interface ScriptDefinition {
  name: string;
  type: 'script_include' | 'client_script' | 'ui_script';
  script: string;
}

export interface FormDefinition {
  name: string;
  table: string;
  sections: any[];
}

export interface ListDefinition {
  name: string;
  table: string;
  fields: string[];
}

export interface ModuleDefinition {
  name: string;
  table: string;
  role?: string;
}

export interface RoleDefinition {
  name: string;
  description: string;
  contains?: string[];
}

export interface ACLDefinition {
  table: string;
  operation: string;
  roles: string[];
}

// Team coordination types
export interface TeamCoordinationStrategy {
  type: 'sequential' | 'parallel' | 'hybrid';
  dependencies: TeamDependency[];
  communication: CommunicationProtocol;
}

export interface TeamDependency {
  from: string;
  to: string;
  type: 'blocking' | 'data' | 'approval';
}

export interface CommunicationProtocol {
  channels: string[];
  updates: 'realtime' | 'periodic';
  notifications: boolean;
}

// Agent capability definitions
export interface AgentCapability {
  name: string;
  description: string;
  proficiency: number; // 0-1
  tools: string[];
}

export interface SpecializationProfile {
  primary: string[];
  secondary: string[];
  tools: string[];
  experience: number;
}
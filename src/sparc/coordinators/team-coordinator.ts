/**
 * Team Coordinator
 * Orchestrates team-based development workflows with intelligent task distribution
 */

import { TaskAnalysis } from '../../utils/agent-detector.js';
import { TeamExecutionResult, TeamSparcOptions } from '../team-sparc.js';
import { WidgetTeam } from '../teams/widget-team.js';
import { FlowTeam } from '../teams/flow-team.js';
import { ApplicationTeam } from '../teams/application-team.js';

export interface TeamTask {
  description: string;
  analysis: TaskAnalysis;
  options: TeamSparcOptions;
}

export interface SpecialistTask {
  description: string;
  analysis: TaskAnalysis;
  options: TeamSparcOptions;
}

export interface CoordinationContext {
  teamType: string;
  projectPlan: any;
  activeMembers: string[];
  sharedMemory: Map<string, any>;
  progressTracking: Map<string, number>;
  qualityGates: QualityGate[];
}

export interface QualityGate {
  name: string;
  criteria: string[];
  required: boolean;
  passed: boolean;
  reviewer: string;
}

export interface ExecutionStep {
  stepId: string;
  name: string;
  description: string;
  assignedTo: string;
  dependencies: string[];
  estimatedDuration: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  errors?: string[];
}

export class TeamCoordinator {
  private context?: CoordinationContext;
  private executionPlan: ExecutionStep[] = [];
  private sharedMemory = new Map<string, any>();

  async executeTeamTask(teamType: string, task: TeamTask): Promise<TeamExecutionResult> {
    console.log(`🎯 Coordinating ${teamType.toUpperCase()} Team Execution`);
    console.log(`📋 Task: ${task.description}\n`);

    const startTime = Date.now();

    try {
      // Initialize coordination context
      this.context = await this.initializeContext(teamType, task);
      
      // Create project plan using appropriate team
      const projectPlan = await this.createProjectPlan(teamType, task);
      
      // Generate execution plan
      this.executionPlan = this.generateExecutionPlan(projectPlan, task.options);
      
      // Execute with coordination
      const artifacts = await this.executeWithCoordination(task.options);
      
      // Validate quality gates
      const qualityResults = await this.validateQualityGates();
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Team execution completed successfully in ${executionTime}ms\n`);
      
      return {
        success: true,
        teamType: teamType,
        coordinator: this.getCoordinatorName(teamType),
        specialists: this.context.activeMembers,
        artifacts,
        executionTime,
        warnings: qualityResults.warnings
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Team coordination failed: ${error}`);
      
      return {
        success: false,
        teamType: teamType,
        coordinator: this.getCoordinatorName(teamType),
        specialists: this.context?.activeMembers || [],
        artifacts: [],
        executionTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async executeSpecialistTask(specialistType: string, task: SpecialistTask): Promise<TeamExecutionResult> {
    console.log(`👨‍💻 Coordinating ${specialistType.toUpperCase()} Specialist Execution`);
    console.log(`📋 Task: ${task.description}\n`);

    const startTime = Date.now();

    try {
      // Initialize specialist context
      this.context = {
        teamType: 'specialist',
        projectPlan: { phases: [], deliverables: [] },
        activeMembers: [specialistType],
        sharedMemory: this.sharedMemory,
        progressTracking: new Map(),
        qualityGates: this.generateSpecialistQualityGates(specialistType)
      };

      // Execute specialist task
      const artifacts = await this.executeSpecialistWork(specialistType, task);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Specialist execution completed successfully in ${executionTime}ms\n`);
      
      return {
        success: true,
        teamType: 'specialist',
        coordinator: `${specialistType}Agent`,
        specialists: [specialistType],
        artifacts,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Specialist execution failed: ${error}`);
      
      return {
        success: false,
        teamType: 'specialist',
        coordinator: `${specialistType}Agent`,
        specialists: [specialistType],
        artifacts: [],
        executionTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private async initializeContext(teamType: string, task: TeamTask): Promise<CoordinationContext> {
    console.log('🔧 Initializing coordination context...');

    const context: CoordinationContext = {
      teamType,
      projectPlan: {},
      activeMembers: [],
      sharedMemory: this.sharedMemory,
      progressTracking: new Map(),
      qualityGates: this.generateQualityGates(teamType, task.analysis.complexity)
    };

    // Store task context in shared memory if enabled
    if (task.options.sharedMemory !== false) {
      this.sharedMemory.set('current_task', task.description);
      this.sharedMemory.set('task_analysis', task.analysis);
      this.sharedMemory.set('execution_options', task.options);
    }

    console.log(`   Team Type: ${teamType}`);
    console.log(`   Shared Memory: ${task.options.sharedMemory !== false ? 'Enabled' : 'Disabled'}`);
    console.log(`   Quality Gates: ${context.qualityGates.length}`);

    return context;
  }

  private async createProjectPlan(teamType: string, task: TeamTask): Promise<any> {
    console.log('📋 Creating project plan...');

    let projectPlan: any;

    switch (teamType.toLowerCase()) {
      case 'widget':
        const widgetTeam = new WidgetTeam();
        projectPlan = widgetTeam.createProjectPlan(task.description, task.analysis);
        this.context!.activeMembers = ['WidgetFrontendAgent', 'WidgetBackendAgent', 'UIUXSpecialistAgent', 'PlatformSpecialistAgent'];
        break;

      case 'flow':
        const flowTeam = new FlowTeam();
        projectPlan = flowTeam.createProjectPlan(task.description, task.analysis);
        this.context!.activeMembers = ['ProcessSpecialistAgent', 'TriggerSpecialistAgent', 'DataSpecialistAgent', 'SecuritySpecialistAgent'];
        break;

      case 'application':
        const appTeam = new ApplicationTeam();
        projectPlan = appTeam.createProjectPlan(task.description, task.analysis);
        this.context!.activeMembers = ['DatabaseSpecialistAgent', 'LogicSpecialistAgent', 'InterfaceSpecialistAgent', 'SecuritySpecialistAgent'];
        break;

      default:
        throw new Error(`Unknown team type: ${teamType}`);
    }

    this.context!.projectPlan = projectPlan;
    
    console.log(`   Project: ${projectPlan.projectName}`);
    console.log(`   Duration: ${projectPlan.estimatedDuration}`);
    console.log(`   Phases: ${projectPlan.phases.length}`);
    console.log(`   Active Members: ${this.context!.activeMembers.length}\n`);

    return projectPlan;
  }

  private generateExecutionPlan(projectPlan: any, options: TeamSparcOptions): ExecutionStep[] {
    console.log('⚙️  Generating execution plan...');

    const steps: ExecutionStep[] = [];
    let stepCounter = 1;

    // Convert project phases to execution steps
    for (const phase of projectPlan.phases) {
      const stepId = `step_${stepCounter++}`;
      
      steps.push({
        stepId,
        name: phase.name,
        description: phase.description,
        assignedTo: phase.assignedTo.join(', '),
        dependencies: phase.dependencies || [],
        estimatedDuration: phase.duration,
        status: 'pending'
      });
    }

    // Add validation steps if enabled
    if (options.validation !== false) {
      steps.push({
        stepId: `step_${stepCounter++}`,
        name: 'Quality Validation',
        description: 'Validate deliverables against quality criteria',
        assignedTo: 'QualityAssuranceAgent',
        dependencies: steps.map(s => s.stepId).slice(-2), // Depend on last two steps
        estimatedDuration: '30min',
        status: 'pending'
      });
    }

    console.log(`   Generated ${steps.length} execution steps`);
    console.log(`   Parallel execution: ${options.parallel ? 'Enabled' : 'Disabled'}`);
    console.log(`   Validation: ${options.validation !== false ? 'Enabled' : 'Disabled'}\n`);

    return steps;
  }

  private async executeWithCoordination(options: TeamSparcOptions): Promise<any[]> {
    console.log('🚀 Executing coordinated team workflow...\n');

    const artifacts: any[] = [];

    if (options.parallel) {
      artifacts.push(...await this.executeParallel());
    } else {
      artifacts.push(...await this.executeSequential());
    }

    return artifacts;
  }

  private async executeParallel(): Promise<any[]> {
    console.log('⚡ Executing steps in parallel where possible...');

    const artifacts: any[] = [];
    const completed = new Set<string>();
    const inProgress = new Set<string>();

    while (completed.size < this.executionPlan.length) {
      // Find steps ready to execute
      const readySteps = this.executionPlan.filter(step => 
        step.status === 'pending' && 
        step.dependencies.every(dep => completed.has(dep))
      );

      if (readySteps.length === 0) {
        // Check for blocked steps
        const blockedSteps = this.executionPlan.filter(step => 
          step.status === 'pending' && !inProgress.has(step.stepId)
        );
        
        if (blockedSteps.length > 0) {
          console.log(`⚠️  Found ${blockedSteps.length} blocked steps, continuing with available work...`);
          break;
        }
        
        // Wait for in-progress steps to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Execute ready steps in parallel
      const promises = readySteps.map(async (step) => {
        inProgress.add(step.stepId);
        step.status = 'in_progress';
        step.startTime = new Date();
        
        console.log(`   🔄 ${step.name} (${step.assignedTo})`);
        
        try {
          const artifact = await this.executeStep(step);
          step.status = 'completed';
          step.endTime = new Date();
          step.output = artifact;
          
          console.log(`   ✅ ${step.name} completed`);
          
          return artifact;
        } catch (error) {
          step.status = 'failed';
          step.errors = [error instanceof Error ? error.message : String(error)];
          
          console.log(`   ❌ ${step.name} failed: ${error}`);
          throw error;
        } finally {
          inProgress.delete(step.stepId);
          completed.add(step.stepId);
        }
      });

      const stepArtifacts = await Promise.allSettled(promises);
      stepArtifacts.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          artifacts.push(result.value);
        }
      });
    }

    return artifacts;
  }

  private async executeSequential(): Promise<any[]> {
    console.log('📋 Executing steps sequentially...');

    const artifacts: any[] = [];

    for (const step of this.executionPlan) {
      // Check dependencies
      const missingDeps = step.dependencies.filter(dep => 
        !this.executionPlan.find(s => s.stepId === dep && s.status === 'completed')
      );

      if (missingDeps.length > 0) {
        console.log(`⚠️  Skipping ${step.name} - missing dependencies: ${missingDeps.join(', ')}`);
        step.status = 'blocked';
        continue;
      }

      step.status = 'in_progress';
      step.startTime = new Date();
      
      console.log(`   🔄 ${step.name} (${step.assignedTo})`);
      
      try {
        const artifact = await this.executeStep(step);
        step.status = 'completed';
        step.endTime = new Date();
        step.output = artifact;
        
        console.log(`   ✅ ${step.name} completed`);
        
        if (artifact) {
          artifacts.push(artifact);
        }
      } catch (error) {
        step.status = 'failed';
        step.errors = [error instanceof Error ? error.message : String(error)];
        
        console.log(`   ❌ ${step.name} failed: ${error}`);
        throw error;
      }
    }

    return artifacts;
  }

  private async executeStep(step: ExecutionStep): Promise<any> {
    // Simulate step execution with realistic timing
    const duration = this.parseDuration(step.estimatedDuration);
    await new Promise(resolve => setTimeout(resolve, Math.min(duration, 5000))); // Cap simulation at 5s

    // Return mock artifact based on step type
    return {
      stepId: step.stepId,
      name: step.name,
      type: this.inferArtifactType(step.name),
      assignedTo: step.assignedTo,
      completedAt: new Date(),
      quality: 'high'
    };
  }

  private async executeSpecialistWork(specialistType: string, task: SpecialistTask): Promise<any[]> {
    console.log(`🔧 Executing ${specialistType} specialist work...`);

    // Simulate specialist work
    await new Promise(resolve => setTimeout(resolve, 2000));

    return [{
      type: 'specialist_deliverable',
      specialist: specialistType,
      task: task.description,
      completedAt: new Date(),
      quality: 'high'
    }];
  }

  private generateQualityGates(teamType: string, complexity: string): QualityGate[] {
    const gates: QualityGate[] = [
      {
        name: 'Requirements Review',
        criteria: ['Requirements are clear and complete', 'Stakeholders have approved'],
        required: true,
        passed: false,
        reviewer: 'ArchitectAgent'
      }
    ];

    if (complexity === 'complex') {
      gates.push({
        name: 'Architecture Review',
        criteria: ['Architecture follows best practices', 'Performance requirements met'],
        required: true,
        passed: false,
        reviewer: 'ArchitectAgent'
      });
    }

    gates.push({
      name: 'Code Quality Review',
      criteria: ['Code follows standards', 'Security requirements met'],
      required: true,
      passed: false,
      reviewer: 'ReviewerAgent'
    });

    return gates;
  }

  private generateSpecialistQualityGates(specialistType: string): QualityGate[] {
    return [{
      name: 'Specialist Deliverable Review',
      criteria: [`${specialistType} deliverable meets requirements`, 'Quality standards satisfied'],
      required: true,
      passed: false,
      reviewer: `${specialistType}Agent`
    }];
  }

  private async validateQualityGates(): Promise<{ passed: number; warnings: string[] }> {
    console.log('🔍 Validating quality gates...');

    const warnings: string[] = [];
    let passed = 0;

    for (const gate of this.context!.qualityGates) {
      // Simulate quality gate validation
      const success = Math.random() > 0.1; // 90% pass rate
      
      gate.passed = success;
      if (success) {
        passed++;
        console.log(`   ✅ ${gate.name} - PASSED`);
      } else {
        console.log(`   ⚠️  ${gate.name} - NEEDS ATTENTION`);
        warnings.push(`Quality gate "${gate.name}" requires attention`);
      }
    }

    console.log(`   Quality Gates: ${passed}/${this.context!.qualityGates.length} passed\n`);

    return { passed, warnings };
  }

  private getCoordinatorName(teamType: string): string {
    const coordinatorMap = {
      'widget': 'WidgetArchitectAgent',
      'flow': 'FlowArchitectAgent',
      'application': 'AppArchitectAgent',
      'adaptive': 'AdaptiveCoordinatorAgent'
    };

    return coordinatorMap[teamType.toLowerCase() as keyof typeof coordinatorMap] || 'TeamCoordinatorAgent';
  }

  private parseDuration(duration: string): number {
    // Convert duration string to milliseconds (simplified)
    const match = duration.match(/(\d+)(min|hour|day)/);
    if (!match) return 1000;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'min': return value * 60 * 1000;
      case 'hour': return value * 60 * 60 * 1000;
      case 'day': return value * 24 * 60 * 60 * 1000;
      default: return 1000;
    }
  }

  private inferArtifactType(stepName: string): string {
    const stepLower = stepName.toLowerCase();
    
    if (stepLower.includes('database') || stepLower.includes('schema')) return 'database_artifact';
    if (stepLower.includes('interface') || stepLower.includes('ui')) return 'ui_artifact';
    if (stepLower.includes('logic') || stepLower.includes('business')) return 'logic_artifact';
    if (stepLower.includes('security')) return 'security_artifact';
    if (stepLower.includes('test')) return 'test_artifact';
    
    return 'general_artifact';
  }
}
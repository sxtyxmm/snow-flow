/**
 * Team SPARC Executor v2.0 - Enhanced with New Team Architecture
 * Orchestrates specialized development teams for complex ServiceNow tasks
 */

import { WidgetTeam } from '../teams/widget-team.js';
import { FlowTeam } from '../teams/flow-team.js';
import { ApplicationTeam } from '../teams/application-team.js';
import { AdaptiveTeam } from '../teams/adaptive-team.js';
import { TeamCoordinator, CoordinationOptions } from '../coordination/team-coordinator.js';
import { IndividualSpecialists } from '../specialists/individual-specialists.js';

export interface TeamSparcOptions {
  parallel?: boolean;
  monitor?: boolean;
  sharedMemory?: boolean;
  validation?: boolean;
  dryRun?: boolean;
  maxAgents?: number;
  strategy?: string;
  mode?: string;
}

export interface TeamExecutionResult {
  success: boolean;
  teamType: string;
  coordinator: string;
  specialists: string[];
  artifacts: any[];
  executionTime: number;
  warnings?: string[];
  errors?: string[];
}

export class TeamSparcExecutor {
  
  static async execute(teamType: string, task: string, options: TeamSparcOptions = {}): Promise<TeamExecutionResult> {
    console.log(`\n🚀 SPARC Team Mode: ${teamType.toUpperCase()}`);
    console.log(`📋 Task: ${task}`);
    console.log(`⚙️  Options: ${JSON.stringify(options, null, 2)}\n`);

    const startTime = Date.now();

    try {
      let result: TeamExecutionResult;

      switch (teamType.toLowerCase()) {
        case 'widget':
          result = await this.executeWidgetTeam(task, options);
          break;
        case 'flow':
          result = await this.executeFlowTeam(task, options);
          break;
        case 'app':
        case 'application':
          result = await this.executeAppTeam(task, options);
          break;
        case 'adaptive':
          result = await this.executeAdaptiveTeam(task, options);
          break;
        default:
          throw new Error(`Unknown team type: ${teamType}`);
      }

      result.executionTime = Date.now() - startTime;
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Team execution failed: ${error}`);
      
      return {
        success: false,
        teamType: teamType,
        coordinator: 'unknown',
        specialists: [],
        artifacts: [],
        executionTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  static async executeWidgetTeam(task: string, options: TeamSparcOptions): Promise<TeamExecutionResult> {
    console.log('🎨 Assembling Widget Development Team...');

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Team assembly preview:\n');
      return {
        success: true,
        teamType: 'widget',
        coordinator: 'Widget Development Team',
        specialists: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'ServiceNow Platform Specialist', 'QA Tester'],
        artifacts: [],
        executionTime: 0,
        warnings: ['Dry run mode - no actual execution performed']
      };
    }

    const team = new WidgetTeam({
      sharedMemory: options.sharedMemory !== false,
      validation: options.validation !== false,
      parallel: options.parallel || false,
      monitor: options.monitor || false
    });
    
    const result = await team.execute(task);
    
    return {
      success: result.qualityMetrics?.overallScore > 70,
      teamType: 'widget',
      coordinator: result.teamType,
      specialists: Object.keys(result.specialists || {}),
      artifacts: result.finalDeliverable ? [result.finalDeliverable] : [],
      executionTime: 0,
      warnings: result.qualityMetrics?.overallScore < 80 ? ['Quality metrics below optimal threshold'] : []
    };
  }
  
  static async executeFlowTeam(task: string, options: TeamSparcOptions): Promise<TeamExecutionResult> {
    console.log('🔄 Assembling Flow Development Team...');

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Team assembly preview:\n');
      return {
        success: true,
        teamType: 'flow',
        coordinator: 'Flow Development Team',
        specialists: ['Process Designer', 'Trigger Specialist', 'Data Specialist', 'Integration Expert', 'Security Reviewer'],
        artifacts: [],
        executionTime: 0,
        warnings: ['Dry run mode - no actual execution performed']
      };
    }

    const team = new FlowTeam({
      sharedMemory: options.sharedMemory !== false,
      validation: options.validation !== false,
      parallel: options.parallel || false,
      monitor: options.monitor || false
    });
    
    const result = await team.execute(task);
    
    return {
      success: result.qualityMetrics?.overallScore > 70,
      teamType: 'flow',
      coordinator: result.teamType,
      specialists: Object.keys(result.specialists || {}),
      artifacts: result.finalDeliverable ? [result.finalDeliverable] : [],
      executionTime: 0,
      warnings: result.qualityMetrics?.overallScore < 80 ? ['Quality metrics below optimal threshold'] : []
    };
  }
  
  static async executeAppTeam(task: string, options: TeamSparcOptions): Promise<TeamExecutionResult> {
    console.log('🏗️ Assembling Application Development Team...');

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Team assembly preview:\n');
      return {
        success: true,
        teamType: 'application',
        coordinator: 'Application Development Team',
        specialists: ['Database Designer', 'Business Logic Developer', 'Interface Designer', 'Security Specialist', 'Performance Specialist'],
        artifacts: [],
        executionTime: 0,
        warnings: ['Dry run mode - no actual execution performed']
      };
    }

    const team = new ApplicationTeam({
      sharedMemory: options.sharedMemory !== false,
      validation: options.validation !== false,
      parallel: options.parallel || false,
      monitor: options.monitor || false
    });
    
    const result = await team.execute(task);
    
    return {
      success: result.qualityMetrics?.overallScore > 70,
      teamType: 'application',
      coordinator: result.teamType,
      specialists: Object.keys(result.specialists || {}),
      artifacts: result.finalDeliverable ? [result.finalDeliverable] : [],
      executionTime: 0,
      warnings: result.qualityMetrics?.overallScore < 80 ? ['Quality metrics below optimal threshold'] : []
    };
  }
  
  static async executeAdaptiveTeam(task: string, options: TeamSparcOptions): Promise<TeamExecutionResult> {
    console.log('🤖 Assembling Adaptive Team...');

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Team assembly preview:\n');
      return {
        success: true,
        teamType: 'adaptive',
        coordinator: 'Adaptive Team Coordinator',
        specialists: ['Dynamic specialist assembly based on task analysis'],
        artifacts: [],
        executionTime: 0,
        warnings: ['Dry run mode - no actual execution performed']
      };
    }

    const team = new AdaptiveTeam({
      sharedMemory: options.sharedMemory !== false,
      validation: options.validation !== false,
      parallel: options.parallel || false,
      monitor: options.monitor || false
    });
    
    const result = await team.execute(task);
    
    return {
      success: result.qualityMetrics?.overallScore > 70,
      teamType: 'adaptive',
      coordinator: result.teamType,
      specialists: Object.keys(result.specialists || {}),
      artifacts: result.finalDeliverable ? [result.finalDeliverable] : [],
      executionTime: 0,
      warnings: result.qualityMetrics?.overallScore < 80 ? ['Quality metrics below optimal threshold'] : []
    };
  }

  static async executeSpecialist(specialistType: string, task: string, options: TeamSparcOptions): Promise<TeamExecutionResult> {
    console.log(`👨‍💻 Executing ${specialistType.toUpperCase()} Specialist...`);

    if (options.dryRun) {
      console.log('🔍 DRY RUN - Specialist execution preview:\n');
      return {
        success: true,
        teamType: 'specialist',
        coordinator: `${specialistType} Specialist`,
        specialists: [specialistType],
        artifacts: [],
        executionTime: 0,
        warnings: ['Dry run mode - no actual execution performed']
      };
    }

    // Execute individual specialist through TeamCoordinator
    const coordinator = new TeamCoordinator({
      sharedMemory: options.sharedMemory !== false,
      validation: options.validation !== false,
      parallel: options.parallel || false,
      monitor: options.monitor || false,
      preferTeams: false, // Force individual specialist execution
      qualityLevel: 'quick'
    });
    
    // Construct a task that will be routed to the specific specialist
    const specialistTask = `${specialistType}: ${task}`;
    const result = await coordinator.coordinate(specialistTask);
    
    return {
      success: result.qualityMetrics?.overallScore > 70,
      teamType: 'specialist',
      coordinator: result.executor,
      specialists: [specialistType],
      artifacts: result.result ? [result.result] : [],
      executionTime: result.executionTime,
      warnings: result.qualityMetrics?.overallScore < 80 ? ['Quality metrics below optimal threshold'] : []
    };
  }
}